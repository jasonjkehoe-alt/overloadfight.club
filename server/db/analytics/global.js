import { hotDb, coldDb } from '../connection.js';
import '../migrations.js';
import { getGamesForDate } from '../repos/games.js';
import { calendarDays, dayStart, fightNightDay, heatmapCells, heatmapDays, netKills, pilotKey, shiftDay } from '../../lib/gameParse.js';

// Aggregates over many games: site totals, mode, map and activity charts, server
// activity, all-time totals across both files, the map_stats_cache readers and
// the fight-night day check. Days are fight-night days (gameParse.js).

const getGlobalModeStatsStmt = hotDb.prepare(`
    SELECT json_extract(details, '$.settings.matchMode') as mode, COUNT(*) as count
    FROM games
    GROUP BY mode
    ORDER BY count DESC
`);

const getGlobalModeStatsFiltered = hotDb.prepare(`
    SELECT json_extract(details, '$.settings.matchMode') as mode, COUNT(*) as count
    FROM games
    WHERE date >= ?
    GROUP BY mode
    ORDER BY count DESC
`);

const getGlobalMapStatsStmt = hotDb.prepare(`
    SELECT json_extract(details, '$.settings.level') as map, COUNT(*) as count
    FROM games
    GROUP BY map
    ORDER BY count DESC
    LIMIT 10
`);

const getGlobalMapStatsFiltered = hotDb.prepare(`
    SELECT json_extract(details, '$.settings.level') as map, COUNT(*) as count
    FROM games
    WHERE date >= ?
    GROUP BY map
    ORDER BY count DESC
    LIMIT 10
`);

export const getTopPlayedMaps = hotDb.prepare(`
    SELECT json_extract(details, '$.settings.level') as map, COUNT(*) as count
    FROM games
    GROUP BY map
    ORDER BY count DESC
    LIMIT 10
`);

export const getRecentTopMaps = hotDb.prepare(`
    SELECT json_extract(details, '$.settings.level') as map, COUNT(*) as count
    FROM games
    WHERE date > date('now', '-30 days')
    GROUP BY map
    ORDER BY count DESC
    LIMIT 10
`);

export const getMostActiveMaps = hotDb.prepare(`
    SELECT json_extract(details, '$.settings.level') as map, AVG(json_array_length(json_extract(details, '$.players'))) as avg_players
    FROM games
    GROUP BY map
    HAVING COUNT(*) >= 5
    ORDER BY avg_players DESC
    LIMIT 10
`);

// Hot match dates (idx_games_date, no details read) from the start of the
// fight-night day 365 days before today's, for the counts per fight-night
// day below. SQL's date() would count UTC days.
const gameDatesSince = hotDb.prepare('SELECT date FROM games WHERE date >= ?').pluck();
const lastYearDates = () => gameDatesSince.all(dayStart(shiftDay(fightNightDay(Date.now()), -365)));

// [{ day, count }] per fight-night day over the last 365 days, oldest first:
// the activity timeline and the admin calendar.
export const getGameCountsByDate = {
  all: () => calendarDays(lastYearDates()).map(({ day, matches }) => ({ day, count: matches }))
};

const gameDatesBetween = hotDb.prepare('SELECT date FROM games WHERE date >= ? AND date < ?').pluck();

// The dashboard heatmap (gameParse.js heatmapCells) over the HEATMAP.weeks
// weeks before today's fight-night day: { since, until, total, cells },
// `until` not counted. Reads dates only, from
// idx_games_date; the window is always in hot storage.
export const getActivityHeatmap = (now = Date.now()) => {
  const { since, until } = heatmapDays(fightNightDay(now));
  const dates = gameDatesBetween.all(dayStart(since), dayStart(until));
  return { since, until, total: dates.length, cells: heatmapCells(dates) };
};

export const getMonthlyGameCounts = hotDb.prepare(`
    SELECT strftime('%Y-%m', date) as month, COUNT(*) as count
    FROM games
    GROUP BY month
    ORDER BY month ASC
`);

const getGlobalActivityStatsStmt = hotDb.prepare(`
    SELECT strftime('%w', date) as day, strftime('%H', date) as hour, COUNT(*) as count
    FROM games
    GROUP BY day, hour
    ORDER BY day ASC, hour ASC
`);

const getGlobalActivityStatsFiltered = hotDb.prepare(`
    SELECT strftime('%w', date) as day, strftime('%H', date) as hour, COUNT(*) as count
    FROM games
    WHERE date >= ?
    GROUP BY day, hour
    ORDER BY day ASC, hour ASC
`);

const getDatabaseStatsStmt = hotDb.prepare(`
    SELECT
        COUNT(*) as total_games,
        MAX(id) as max_game_id,
        MIN(id) as min_game_id,
        MIN(date) as earliest_date,
        MAX(date) as latest_date
    FROM games
`);

const getColdDatabaseStatsStmt = coldDb.prepare(`
    SELECT
        COUNT(*) as total_games,
        MAX(id) as max_game_id,
        MIN(id) as min_game_id,
        MIN(date) as earliest_date,
        MAX(date) as latest_date
    FROM games
`);

const getDatabaseStatsFiltered = hotDb.prepare(`
    SELECT
        COUNT(*) as total_games,
        MAX(id) as max_game_id,
        MIN(id) as min_game_id,
        MIN(date) as earliest_date,
        MAX(date) as latest_date
    FROM games
    WHERE date >= ?
`);

export const getServerActivityStats = hotDb.prepare(`
    SELECT 
        COALESCE(json_extract(details, '$.server.ip'), ip) as server_ip,
        strftime('%H', date) as hour,
        COUNT(*) as count
    FROM games
    WHERE date > datetime('now', '-24 hours')
    GROUP BY server_ip, hour
`);



const getActivePilotCountStmt = hotDb.prepare(`
    SELECT COUNT(DISTINCT json_extract(value, '$.name')) as count
    FROM games, json_each(details, '$.players')
    WHERE date > datetime('now', '-90 days')
  `);

export const getDeadliestMaps = hotDb.prepare(`
    SELECT json_extract(details, '$.settings.level') as map, 
           SUM((SELECT SUM(net_kills(json_extract(value, '$.kills'))) FROM json_each(json_extract(details, '$.players')))) as total_kills 
    FROM games
    WHERE date > date('now', '-365 days')
    GROUP BY map 
    ORDER BY total_kills DESC 
    LIMIT 5
`);

export const getMarathonMaps = hotDb.prepare(`
    SELECT json_extract(details, '$.settings.level') as map, 
           AVG(duration_of(details)) as avg_duration 
    FROM games
    WHERE date > date('now', '-365 days')
    GROUP BY map 
    HAVING COUNT(*) > 5 
    ORDER BY avg_duration DESC 
    LIMIT 5
`);

// Lazy load prepared statements to avoid startup crash if ATTACH fails
let getAllTimeMapStatsStmt;
let getAllTimeGlobalStatsStmt;
let getAllTimeGlobalKillsStmt;

const getMapStatsAllTime = () => {
  try {
    const cachedRow = hotDb.prepare("SELECT data FROM cold_storage_stats_cache WHERE id = 1").get();
    if (cachedRow && cachedRow.data) {
      const parsed = JSON.parse(cachedRow.data);
      if (parsed.top_maps && parsed.top_maps.length > 0) {
        return {
          all: () => parsed.top_maps
        };
      }
    }
  } catch (e) {}

  if (!getAllTimeMapStatsStmt) {
    getAllTimeMapStatsStmt = hotDb.prepare(`
            SELECT json_extract(details, '$.settings.level') as map, COUNT(*) as count, MAX(date) as lastPlayed
            FROM (
                SELECT details, date FROM games
                UNION ALL
                SELECT details, date FROM cold.games
            )
            GROUP BY map
            ORDER BY count DESC
            LIMIT 10
    `);
  }
  return getAllTimeMapStatsStmt;
};

const getGlobalStatsAllTime = () => {
  if (!getAllTimeGlobalStatsStmt) {
    getAllTimeGlobalStatsStmt = hotDb.prepare(`
SELECT
COUNT(*) as total_games,
  MAX(id) as max_game_id,
  MIN(id) as min_game_id,
  MIN(date) as earliest_date,
  MAX(date) as latest_date
FROM(
  SELECT id, date FROM games
                UNION ALL
                SELECT id, date FROM cold.games
)
  `);
  }
  return getAllTimeGlobalStatsStmt;
};

const getGlobalKillsAllTime = () => {
  if (!getAllTimeGlobalKillsStmt) {
    getAllTimeGlobalKillsStmt = hotDb.prepare(`
            SELECT SUM(net_kills(kills)) as total_kills
            FROM (
                SELECT kills FROM game_players
                UNION ALL
                SELECT kills FROM cold.game_players
            )
    `);
  }
  return getAllTimeGlobalKillsStmt;
};

export const getDatabaseStats = {
  get: (startDate) => {
    if (startDate) return getDatabaseStatsFiltered.get(startDate);
    return getDatabaseStatsStmt.get();
  }
};

export const getColdDatabaseStats = {
  get: () => {
    return getColdDatabaseStatsStmt.get();
  }
};

export const getGlobalMapStats = {
  all: (startDate) => {
    if (startDate) return getGlobalMapStatsFiltered.all(startDate);
    return getGlobalMapStatsStmt.all();
  }
};

export const getGlobalModeStats = {
  all: (startDate) => {
    if (startDate) return getGlobalModeStatsFiltered.all(startDate);
    return getGlobalModeStatsStmt.all();
  }
};

export const getGlobalActivityStats = {
  all: (startDate) => {
    if (startDate) return getGlobalActivityStatsFiltered.all(startDate);
    return getGlobalActivityStatsStmt.all();
  }
};

export const getActiveServerIps = () => {
  const raw = hotDb.prepare(`
SELECT
COALESCE(json_extract(details, '$.server.ip'), ip) as ip,
json_extract(details, '$.server.port') as port
      FROM games
      WHERE date > datetime('now', '-7 days')
      AND ip IS NOT NULL
      GROUP BY ip
`).all();
  return raw.map(r => ({ ip: r.ip, port: r.port || 7000 }));
};

export const getActivePilotCount = {
  get: () => getActivePilotCountStmt.get()
};

export const getAllTimeMapStats = {
  all: () => getMapStatsAllTime().all()
};

export const getAllTimeGlobalStats = {
  get: () => getGlobalStatsAllTime().get()
};

export const getAllTimeGlobalKills = {
  get: () => getGlobalKillsAllTime().get()
};

export const countMapStatsCache = () => {
  try {
    return hotDb.prepare('SELECT COUNT(*) as count FROM map_stats_cache').get().count;
  } catch {
    return 0;
  }
};

export const getTopPlayedMapsFromCache = (limit = 10) => {
  try {
    return hotDb.prepare(`
      SELECT map_name as map, total_matches as count, total_kills
      FROM map_stats_cache
      ORDER BY total_matches DESC
      LIMIT ?
    `).all(limit);
  } catch {
    return [];
  }
};

export const getDeadliestMapsFromCache = (limit = 10) => {
  try {
    return hotDb.prepare(`
      SELECT map_name as map, total_kills, total_matches
      FROM map_stats_cache
      ORDER BY total_kills DESC
      LIMIT ?
    `).all(limit);
  } catch {
    return [];
  }
};

export const getRecentTopMapsFromCache = (limit = 10) => {
  try {
    return hotDb.prepare(`
      SELECT map_name as map, recent_30d_matches as count, total_matches
      FROM map_stats_cache
      WHERE recent_30d_matches > 0
      ORDER BY recent_30d_matches DESC, total_matches DESC
      LIMIT ?
    `).all(limit);
  } catch {
    return [];
  }
};

export const getQualifyingFightNightDates = (thresholds = { minMatches: 16, minPilots: 14, minFrags: 1600 }) => {
  const minMatches = thresholds.minMatches || 16;
  const minPilots = thresholds.minPilots || 14;
  const minFrags = thresholds.minFrags || 1600;

  // fight-night days of the last 365 days with enough matches, newest first
  const dayRows = calendarDays(lastYearDates()).filter(d => d.matches >= minMatches).reverse();

  const qualifying = [];
  for (const row of dayRows) {
    const dayMatches = getGamesForDate(row.day);

    const pilots = new Set();
    let frags = 0;
    for (const m of dayMatches) {
      try {
        const d = JSON.parse(m.details);
        if (Array.isArray(d.players)) {
          for (const p of d.players) {
            const key = pilotKey(p?.name);
            if (key) pilots.add(key);
            frags += netKills(p);
          }
        }
      } catch {}
    }

    if (pilots.size >= minPilots || frags >= minFrags) {
      qualifying.push(row.day);
    }
  }
  return qualifying;
};
