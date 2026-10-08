import { Worker } from 'worker_threads';
import { hotDb, dbPath, coldDbPath } from '../connection.js';
import { ensurePilotStatsCache } from '../migrations.js';
import { RATING_SNAPSHOT_COLUMNS } from '../../lib/statsPasses.js';

// Rebuild pilot_stats_cache, the archive stats and map_stats_cache from one
// pass over every stored game in server/statsWorker.js. Concurrent calls share
// the run in progress. Never rejects: a failure is logged and the old caches stay.
let refreshing = null;
// The stats worker while a refresh runs, so close() can stop it first.
let statsWorker = null;
export const refreshPilotStats = () => {
  refreshing ??= refreshCaches().finally(() => {
    refreshing = null;
  });
  return refreshing;
};

const runStatsWorker = () => new Promise((resolve, reject) => {
  const worker = new Worker(new URL('../../statsWorker.js', import.meta.url), {
    workerData: {
      hotPath: dbPath,
      coldPath: coldDbPath,
      thirtyDaysAgo: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
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

async function refreshCaches() {
  try {
    ensurePilotStatsCache();

    const started = performance.now();
    const { errors, pilots, archive, maps, ratings } = await runStatsWorker();
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
    if (ratings) {
      // The worker replayed every rated match and sent only the days that differ
      // from the table (a match added in the past moves every day after it).
      const upsertStmt = hotDb.prepare(`
        INSERT OR REPLACE INTO rating_snapshots (${RATING_SNAPSHOT_COLUMNS.join(', ')})
        VALUES (${RATING_SNAPSHOT_COLUMNS.map(c => `@${c}`).join(', ')})
      `);
      const deleteStmt = hotDb.prepare('DELETE FROM rating_snapshots WHERE pilot = ? AND day = ?');
      hotDb.transaction(({ upserts, deletes }) => {
        for (const [pilot, day] of deletes) deleteStmt.run(pilot, day);
        for (const row of upserts) upsertStmt.run(row);
      })(ratings);
      console.log(`[Ratings] ${ratings.total} daily rating snapshots: ${ratings.upserts.length} written, ${ratings.deletes.length} removed.`);
    }
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
