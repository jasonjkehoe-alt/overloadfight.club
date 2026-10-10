import { Worker } from 'worker_threads';
import { hotDb, dbPath, coldDbPath } from '../connection.js';
import { ensurePilotStatsCache } from '../migrations.js';
import { DERIVED_TABLES, derivedColumns, derivedKey } from '../../lib/statsPasses.js';
import { clearDerivedCaches, clearDerivedTablesBuilt, markDerivedTablesBuilt } from './meta.js';
import { fightNightDay } from '../../lib/gameParse.js';

// Rebuild pilot_stats_cache, the archive stats and map_stats_cache from one
// pass over every stored game in server/statsWorker.js. Concurrent calls share
// the run in progress. Never rejects: a failure is logged and the old caches stay,
// except the derived tables (statsPasses.js DERIVED_TABLES), whose chunks
// already written stay until the next refresh.
let refreshing = null;
// derived-table rows written per transaction (see writeChanges)
const WRITE_CHUNK = 2000;

// The stats worker while a refresh runs, so close() can stop it first.
let statsWorker = null;
export const refreshPilotStats = () => {
  refreshing ??= refreshCaches().finally(() => {
    refreshing = null;
  });
  return refreshing;
};
// The refresh under way, settled once it has finished writing; settled at
// once while none runs.
export const refreshInProgress = () => refreshing ?? Promise.resolve();

const runStatsWorker = () => new Promise((resolve, reject) => {
  const worker = new Worker(new URL('../../statsWorker.js', import.meta.url), {
    workerData: {
      hotPath: dbPath,
      coldPath: coldDbPath,
      thirtyDaysAgo: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      // the anniversary counts whole years up to today (S21)
      today: fightNightDay(Date.now())
    }
  });
  statsWorker = worker;
  worker.once('message', resolve);
  worker.once('error', reject);
  worker.once('exit', code => {
    if (statsWorker === worker) statsWorker = null;
    reject(new Error(`stats worker exited with code ${code}`));
  });
});

// Applies the worker's changes to a derived table keyed by its key columns
// (derivedKey): only the rows that differ (a match added in the past moves every
// day or month after it). In chunks, letting requests run between them: the
// first refresh, or one after an older match arrives, moves most rows, which
// is too long to hold the event loop on the NAS. A read between chunks sees
// some rows new and some old.
async function writeChanges(table, { upserts, deletes }) {
  const columns = derivedColumns(table);
  const upsertStmt = hotDb.prepare(`
    INSERT OR REPLACE INTO ${table} (${columns.join(', ')})
    VALUES (${columns.map(c => `@${c}`).join(', ')})
  `);
  const deleteStmt = hotDb.prepare(`DELETE FROM ${table} WHERE ${derivedKey(table).map(c => `${c} = ?`).join(' AND ')}`);
  // a delete is the key's values, an upsert a row
  const apply = hotDb.transaction(ops => {
    for (const op of ops) Array.isArray(op) ? deleteStmt.run(...op) : upsertStmt.run(op);
  });
  const ops = [...deletes, ...upserts];
  for (let i = 0; i < ops.length; i += WRITE_CHUNK) {
    if (i > 0) await new Promise(resolve => setImmediate(resolve));
    apply(ops.slice(i, i + WRITE_CHUNK));
  }
}

async function refreshCaches() {
  try {
    ensurePilotStatsCache();

    const started = performance.now();
    const { errors, pilots, archive, maps, derived } = await runStatsWorker();
    for (const [pass, message] of Object.entries(errors)) console.error(`[StatsWorker] ${pass} pass failed: ${message}`);

    if (!errors.pilots) {
      const insertStmt = hotDb.prepare(`
        INSERT OR REPLACE INTO pilot_stats_cache (
          name, kills, deaths, assists, suicides, games, time_played_seconds,
          kd, kda, akdr, kpm, tce, aci,
          wins, losses, ties, win_rate,
          total_damage, dpm, flight_hours,
          finisher_rating, arsenal_entropy,
          threat_centrality, dominance_index, last_updated
        ) VALUES (
          @name, @kills, @deaths, @assists, @suicides, @games, @time_played_seconds,
          @kd, @kda, @akdr, @kpm, @tce, @aci,
          @wins, @losses, @ties, @win_rate,
          @total_damage, @dpm, @flight_hours,
          @finisher_rating, @arsenal_entropy,
          @threat_centrality, @dominance_index, @last_updated
        )
      `);
      // Rebuild from scratch so rows for spellings merged under one pilotKey go away.
      hotDb.transaction((rows) => {
        hotDb.prepare('DELETE FROM pilot_stats_cache').run();
        for (const row of rows) insertStmt.run(row);
      })(pilots);
      console.log(`[PPI] Successfully refreshed ${pilots.length} pilots with full telemetry & graph metrics.`);
    }

    if (archive) {
      hotDb.prepare('INSERT OR REPLACE INTO cold_storage_stats_cache (id, data, last_updated) VALUES (1, ?, CURRENT_TIMESTAMP)').run(JSON.stringify(archive));
      console.log('[ColdStorage] Successfully built archival deep stats cache.');
    }

    if (maps) {
      const insertStmt = hotDb.prepare(`
        INSERT OR REPLACE INTO map_stats_cache (
          map_name, total_matches, total_kills, total_deaths, total_damage,
          avg_players, first_played, last_played, recent_30d_matches,
          modes, top_pilot, top_pilots, record_match, last_updated
        ) VALUES (
          @map_name, @total_matches, @total_kills, @total_deaths, @total_damage,
          @avg_players, @first_played, @last_played, @recent_30d_matches,
          @modes, @top_pilot, @top_pilots, @record_match, CURRENT_TIMESTAMP
        )
      `);
      hotDb.transaction(() => {
        for (const row of maps) insertStmt.run(row);
      })();
      console.log(`[MapStats] Built map_stats_cache for ${maps.length} maps.`);
    }
    // each table on its own, so one that fails to write does not stop the
    // rest; what the readers keep in memory is cleared once, after the last
    // write (also after a failed chunk, so the ranks agree with the days written).
    // The built marker is cleared first and set back once every table wrote,
    // so a refresh that failed to write a table or died part-way costs the
    // next start one refresh.
    let built = true;
    clearDerivedTablesBuilt();
    try {
      for (const [table, { log: [tag, rows] }] of Object.entries(DERIVED_TABLES)) {
        const changes = derived[table];
        if (!changes) {
          built = false;
          continue;
        }
        try {
          await writeChanges(table, changes);
          console.log(`[${tag}] ${changes.total} ${rows}: ${changes.upserts.length} written, ${changes.deletes.length} removed.`);
        } catch (err) {
          built = false;
          console.error(`[${tag}] Failed to write ${table}:`, err);
        }
      }
    } finally {
      clearDerivedCaches();
    }
    // the startup check reads this: a refresh has filled every derived table
    if (built) markDerivedTablesBuilt();
    console.log(`[StatsWorker] Full pass finished in ${((performance.now() - started) / 1000).toFixed(2)}s.`);
  } catch (err) {
    console.error("Failed to refresh PPI stats", err);
  }
}

// close() stops a running worker first, so no thread keeps the files open.
export const stopStatsWorker = () => statsWorker?.terminate();

// Built by refreshPilotStats; the first call before any refresh waits for one.
export const getColdStorageStats = async () => {
  const read = () => {
    const row = hotDb.prepare('SELECT data FROM cold_storage_stats_cache WHERE id = 1').get();
    return row?.data ? JSON.parse(row.data) : null;
  };
  const cached = read();
  if (cached) return cached;
  await refreshPilotStats();
  return read();
};
