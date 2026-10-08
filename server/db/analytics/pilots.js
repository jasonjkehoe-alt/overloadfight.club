import { hotDb } from '../connection.js';
import '../migrations.js';
import { pilotGamesHot, pilotGamesHotSince, pilotGamesCold } from './pilotTelemetry.js';
import { OUTCOME_FIELD, combatRatio, outcomeOf, pilotKey, rankedMatch, winnerOf } from '../../lib/gameParse.js';

// Pilots from game_players and pilot_stats_cache: the leaderboard, the share
// summary, match history, first sightings and the cache reads and writes.

// Per-pilot totals over hot and cold game_players rows, optionally from a start
// date (idx_game_players_date). Spellings group by pilot_key; the name shown is
// the one from the pilot's latest game.
const pilotTotalsSql = (where = '') => `
    WITH gp AS (
        SELECT name, date, kills, deaths, assists, suicides FROM game_players ${where}
        UNION ALL
        SELECT name, date, kills, deaths, assists, suicides FROM cold.game_players ${where}
    )
    SELECT *, lastSeen as last_updated FROM (
        SELECT
            name,
            COUNT(*) as games,
            COALESCE(SUM(net_kills(kills)), 0) as kills,
            COALESCE(SUM(deaths), 0) as deaths,
            COALESCE(SUM(assists), 0) as assists,
            COALESCE(SUM(suicides), 0) as suicides,
            MAX(date) as lastSeen
        FROM gp
        GROUP BY pilot_key(name)
    )
    ORDER BY games DESC
`;

const getPilotStatsStmt = hotDb.prepare(pilotTotalsSql());

const getPilotStatsFiltered = hotDb.prepare(pilotTotalsSql('WHERE date >= @startDate'));

const getGamesDetailsSince = hotDb.prepare(`
    SELECT details FROM games WHERE date >= @startDate
    UNION ALL
    SELECT details FROM cold.games WHERE date >= @startDate
`);

function computeWindowedOutcomes(startDate) {
  const winLossMap = new Map();
  const gameRows = getGamesDetailsSince.all({ startDate });

  for (const row of gameRows) {
    let g;
    try {
      g = typeof row.details === 'string' ? JSON.parse(row.details) : row.details;
    } catch {
      continue;
    }
    if (!rankedMatch(g)) continue;
    const players = g.players;

    const result = winnerOf(g);
    if (!result || !Array.isArray(result.winners) || result.winners.length === 0) continue;

    const seenPilotsInGame = new Set();
    for (const p of players) {
      const key = pilotKey(p?.name);
      if (!key || seenPilotsInGame.has(key)) continue;
      seenPilotsInGame.add(key);
      const outcome = outcomeOf(g, p, result);
      if (outcome && OUTCOME_FIELD[outcome]) {
        const field = OUTCOME_FIELD[outcome];
        let rec = winLossMap.get(key);
        if (!rec) {
          rec = { wins: 0, losses: 0, ties: 0 };
          winLossMap.set(key, rec);
        }
        rec[field]++;
      }
    }
  }

  return winLossMap;
}

// A pilot's match history, newest first, from game_players in both files: the
// page of ids is picked from the index, then only those games' details are read.
// `cold` says which file a game id belongs to.
const pilotGameIdsSql = `
    SELECT DISTINCT game_id, date, 0 AS cold FROM game_players
    WHERE name = TRIM(@name) AND (@startDate IS NULL OR date >= @startDate)
    UNION ALL
    SELECT DISTINCT game_id, date, 1 AS cold FROM cold.game_players
    WHERE name = TRIM(@name) AND (@startDate IS NULL OR date >= @startDate)
`;

export const getGamesByPilot = hotDb.prepare(`
    SELECT CASE WHEN p.cold THEN c.details ELSE h.details END AS details
    FROM (${pilotGameIdsSql} ORDER BY date DESC LIMIT @limit OFFSET @offset) p
    LEFT JOIN games h ON NOT p.cold AND h.id = p.game_id
    LEFT JOIN cold.games c ON p.cold AND c.id = p.game_id
    ORDER BY p.date DESC
`);

export const countGamesByPilot = hotDb.prepare(`SELECT COUNT(*) as count FROM (${pilotGameIdsSql})`);

let getAllTimePilotStatsStmt;

const getPilotStatsAllTime = () => {
  if (!getAllTimePilotStatsStmt) {
    try {
      const hasCache = hotDb.prepare("SELECT 1 FROM pilot_stats_cache LIMIT 1").get();
      if (hasCache) {
        getAllTimePilotStatsStmt = hotDb.prepare(`
            SELECT
                c.name,
                c.games,
                MAX(0, c.kills) as kills,
                c.deaths,
                c.assists,
                MAX(0, c.kd) as kd,
                MAX(0, c.kda) as kda,
                c.wins,
                c.losses,
                c.ties,
                c.win_rate,
                c.total_damage,
                c.dpm,
                c.kpm,
                c.aci,
                COALESCE(c.suicides, 0) as suicides,
                c.last_updated as lastSeen,
                c.last_updated as last_updated
            FROM pilot_stats_cache c
            ORDER BY c.games DESC
        `);
        return getAllTimePilotStatsStmt;
      }
    } catch (e) {
      // fallback to dynamic
    }

    // Not memoized: once refreshPilotStats fills the cache, the next call uses it.
    return getPilotStatsStmt;
  }
  return getAllTimePilotStatsStmt;
};

// A pilot's first game in either file, read from idx_game_players_name_date.
const getPilotFirstSeen = hotDb.prepare(`
  SELECT MIN(first_seen) as first_seen FROM (
    SELECT MIN(date) as first_seen FROM game_players WHERE name = TRIM(@name)
    UNION ALL
    SELECT MIN(date) as first_seen FROM cold.game_players WHERE name = TRIM(@name)
  )
`);

// One pilot's all-time leaderboard row, for the pilot page's share preview.
const getPilotSummaryStmt = hotDb.prepare(pilotTotalsSql('WHERE name = TRIM(@name)'));

export const getPilotStats = {
  all: (startDate) => {
    const rows = startDate ? getPilotStatsFiltered.all({ startDate }) : getPilotStatsStmt.all();
    if (!rows || rows.length === 0) return [];

    let winLossMap = null;
    if (startDate) {
      winLossMap = computeWindowedOutcomes(startDate);
    }

    return rows.map(r => {
      const kills = r.kills || 0;
      const deaths = r.deaths || 0;
      const assists = r.assists || 0;
      const kd = deaths > 0 ? Math.round((kills / deaths) * 100) / 100 : kills;
      const kda = combatRatio(kills, assists, deaths);

      if (!startDate) {
        return {
          ...r,
          kd,
          kda
        };
      }

      const key = pilotKey(r.name);
      const wl = winLossMap?.get(key);
      const totalRanked = wl ? (wl.wins + wl.losses + wl.ties) : 0;

      return {
        ...r,
        kd,
        kda,
        wins: totalRanked > 0 ? wl.wins : undefined,
        losses: totalRanked > 0 ? wl.losses : undefined,
        ties: totalRanked > 0 ? wl.ties : undefined,
        win_rate: totalRanked > 0 ? Math.round((wl.wins / totalRanked) * 1000) / 10 : undefined
      };
    });
  }
};

export const getAllTimePilotStats = {
  all: () => getPilotStatsAllTime().all()
};

export const hasPilotStatsCache = () => {
  try {
    const row = hotDb.prepare('SELECT COUNT(*) as count FROM pilot_stats_cache').get();
    return Boolean(row && row.count > 0);
  } catch {
    return false;
  }
};

export const getMaxPilotStatsLastUpdated = () => {
  try {
    const row = hotDb.prepare('SELECT MAX(last_updated) as max_date FROM pilot_stats_cache').get();
    return row ? row.max_date : null;
  } catch {
    return null;
  }
};

export const getPilotPPI = (name) => {
  try {
    const stmt = hotDb.prepare('SELECT * FROM pilot_stats_cache WHERE name = ? COLLATE NOCASE');
    let data = stmt.get(name);
    return data || null;
  } catch (err) {
    return null;
  }
};

export const updateDeepMetrics = (updates) => {
  const stmt = hotDb.prepare(`
        UPDATE pilot_stats_cache 
        SET threat_centrality = @centrality, dominance_index = @dominance 
        WHERE name = @name
    `);
  const updateMany = hotDb.transaction((rows) => {
    for (const row of rows) stmt.run(row);
  });
  updateMany(updates);
};

export const getAllCachedPilotStats = () => {
  return hotDb.prepare(`
    SELECT name, kd, kda, win_rate, threat_centrality, dominance_index 
    FROM pilot_stats_cache
  `).all();
};

export const isPilotFirstSeenOnDate = (pilotName, dateStr) => {
  try {
    const checkRow = hotDb.prepare(`
      SELECT first_seen FROM pilot_first_seen WHERE name = ? COLLATE NOCASE
    `).get(pilotName);
    // A sighting before dateStr settles it. Anything else may be a value
    // cached before this check read cold storage, so look again.
    if (checkRow?.first_seen && checkRow.first_seen < dateStr) {
      return false;
    }

    const minRow = getPilotFirstSeen.get({ name: pilotName });

    if (minRow && minRow.first_seen) {
      hotDb.prepare(`
        INSERT INTO pilot_first_seen (name, first_seen) VALUES (?, ?)
        ON CONFLICT(name) DO UPDATE SET first_seen = excluded.first_seen
      `).run(pilotName, minRow.first_seen);
      return minRow.first_seen.startsWith(dateStr);
    }
    return false;
  } catch {
    return false;
  }
};

// undefined when the pilot has no games
export const getPilotSummary = (name) => getPilotSummaryStmt.get({ name });

// The pilot and leaderboard statements, for the EXPLAIN QUERY PLAN tests.
export const pilotStatements = {
  pilotGamesHot,
  pilotGamesHotSince,
  pilotGamesCold,
  gamesByPilot: getGamesByPilot,
  countGamesByPilot,
  firstSeen: getPilotFirstSeen,
  summary: getPilotSummaryStmt,
  leaderboard: getPilotStatsStmt,
  leaderboardSince: getPilotStatsFiltered
};
