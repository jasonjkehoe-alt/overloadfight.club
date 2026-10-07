import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { durationOf, netKills, outcomeOf, pairOutcome, pilotKey, pilotLikePattern, winnerOf } from './lib/gameParse.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// [start, end) of a UTC day ('YYYY-MM-DD') for `date >= ? AND date < ?`,
// which can use idx_games_date where `date LIKE 'YYYY-MM-DD%'` cannot.
// null when dateStr is not a calendar day.
function utcDayBounds(dateStr) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const start = Date.parse(`${dateStr}T00:00:00Z`);
  if (Number.isNaN(start)) return null;
  return [dateStr, new Date(start + 86400000).toISOString().slice(0, 10)];
}

// Counter field for each outcomeOf()/pairOutcome() result.
const OUTCOME_FIELD = { win: 'wins', loss: 'losses', tie: 'ties' };

// Use a dedicated data directory to avoid Docker volume mounting over source code
const dataDir = process.env.DATA_DIR || path.join(__dirname, '../data');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const mapsDir = path.join(dataDir, 'maps');
export const mapImagesDir = path.join(dataDir, 'map_images');
if (!fs.existsSync(mapsDir)) fs.mkdirSync(mapsDir, { recursive: true });
if (!fs.existsSync(mapImagesDir)) fs.mkdirSync(mapImagesDir, { recursive: true });

const dbPath = path.join(dataDir, 'tracker.db');
const coldDbPath = path.join(dataDir, 'cold_storage.db');

const hotDb = new Database(dbPath);
const coldDb = new Database(coldDbPath);

// WAL lets reads run while a write commits, NORMAL is crash-safe under WAL,
// and a locked database waits up to 5 s instead of throwing SQLITE_BUSY.
for (const conn of [hotDb, coldDb]) {
  conn.pragma('journal_mode = WAL');
  conn.pragma('synchronous = NORMAL');
  conn.pragma('busy_timeout = 5000');
}

// SQL access to the gameParse rules, so queries and JS loops count the same way.
hotDb.function('net_kills', { deterministic: true }, kills => netKills({ kills }));
hotDb.function('pilot_key', { deterministic: true }, name => pilotKey(name));
// NULL when the length is unknown, so AVG() skips the game.
hotDb.function('duration_of', { deterministic: true }, details => {
  try {
    return durationOf(JSON.parse(details)) || null;
  } catch {
    return null;
  }
});

// Attach Cold DB to Hot DB connection for cross-database queries
try {
  hotDb.exec(`ATTACH DATABASE '${coldDbPath}' AS cold`);
} catch (e) {
  // Ignore if already attached (though this runs once on startup)
  console.log("Cold DB attachment status:", e.message);
}

// Initialize Cold DB Schema (if not exists)
coldDb.exec(`
  CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY,
    date TEXT,
    ip TEXT,
    details TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_games_date ON games(date);
  CREATE INDEX IF NOT EXISTS idx_games_ip ON games(ip);
`);

// Initialize Database - Main Games Table (HOT)
hotDb.exec(`
  CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY,
    date TEXT,
    ip TEXT,
    details TEXT
  );
  CREATE TABLE IF NOT EXISTS cold_storage_stats_cache (
    id INTEGER PRIMARY KEY,
    data TEXT,
    last_updated TEXT
  );
  CREATE TABLE IF NOT EXISTS fight_night_recaps (
    date TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS pilot_first_seen (
    name TEXT PRIMARY KEY COLLATE NOCASE,
    first_seen TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_fight_night_date ON fight_night_recaps(date);
`);

// Backfill Jobs Table (HOT)
hotDb.exec(`
  CREATE TABLE IF NOT EXISTS backfill_jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    start_game_id INTEGER NOT NULL,
    end_game_id INTEGER NOT NULL,
    rate_limit_ms INTEGER NOT NULL,
    job_type TEXT DEFAULT 'id_range',
    status TEXT DEFAULT 'pending',
    current_id INTEGER,
    total_fetched INTEGER DEFAULT 0,
    total_failed INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    started_at TEXT,
    completed_at TEXT
  );
`);

// Game Metadata Table (HOT)
hotDb.exec(`
  CREATE TABLE IF NOT EXISTS game_metadata (
    game_id INTEGER PRIMARY KEY,
    fetch_status TEXT DEFAULT 'pending',
    fetch_attempts INTEGER DEFAULT 0,
    last_fetch_at TEXT,
    error_message TEXT
  );
`);

// Create indexes for performance
hotDb.exec(`
  CREATE INDEX IF NOT EXISTS idx_games_date ON games(date);
  CREATE INDEX IF NOT EXISTS idx_games_ip ON games(ip);
  CREATE INDEX IF NOT EXISTS idx_metadata_status ON game_metadata(fetch_status);
`);

// Admin Settings Table
hotDb.exec(`
  CREATE TABLE IF NOT EXISTS admin_settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

// Maps Table (HOT DB)
hotDb.exec(`
  CREATE TABLE IF NOT EXISTS maps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    author TEXT DEFAULT 'Unknown',
    size TEXT DEFAULT 'medium',
    max_players INTEGER DEFAULT 8,
    best_team_size INTEGER DEFAULT 4,
    supports_ctf BOOLEAN DEFAULT 0,
    style TEXT DEFAULT 'mixed',
    release_date TEXT,
    remote_url TEXT,
    remote_image_url TEXT,
    local_file TEXT,
    local_image TEXT,
    file_size INTEGER DEFAULT 0,
    downloads INTEGER DEFAULT 0,
    is_custom BOOLEAN DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_maps_name ON maps(name);
  CREATE INDEX IF NOT EXISTS idx_maps_author ON maps(author);
  CREATE INDEX IF NOT EXISTS idx_maps_size ON maps(size);

  CREATE TABLE IF NOT EXISTS map_stats_cache (
    map_name TEXT PRIMARY KEY COLLATE NOCASE,
    total_matches INTEGER DEFAULT 0,
    total_kills INTEGER DEFAULT 0,
    total_deaths INTEGER DEFAULT 0,
    total_damage INTEGER DEFAULT 0,
    avg_players REAL DEFAULT 0,
    first_played TEXT,
    last_played TEXT,
    recent_30d_matches INTEGER DEFAULT 0,
    modes TEXT,
    top_pilot TEXT,
    top_pilots TEXT,
    record_match TEXT,
    last_updated TEXT DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_map_stats_matches ON map_stats_cache(total_matches DESC);
  CREATE INDEX IF NOT EXISTS idx_map_stats_kills ON map_stats_cache(total_kills DESC);
  CREATE INDEX IF NOT EXISTS idx_map_stats_last_played ON map_stats_cache(last_played DESC);
`);

// Auto-sanitize pilot stats cache on startup (ensures non-negative kills and ratios)
try {
  hotDb.exec(`
    UPDATE pilot_stats_cache 
    SET kills = MAX(0, kills),
        kd = CASE WHEN deaths > 0 THEN ROUND((MAX(0, kills)*1.0)/deaths, 2) ELSE MAX(0, kills) END,
        kda = CASE WHEN deaths > 0 THEN ROUND(((MAX(0, kills) + assists * 0.5)*1.0)/deaths, 2) ELSE MAX(0, kills) END
    WHERE kills < 0 OR kd < 0 OR kda < 0;
  `);
} catch (e) {
  // Table might not exist yet before first refresh
}

// Prepare statements for performance (HOT DB)
const insertGameHot = hotDb.prepare(`
    INSERT OR IGNORE INTO games (id, date, ip, details)
    VALUES (@id, @date, @ip, @details)
`);

const insertGameCold = coldDb.prepare(`
    INSERT OR IGNORE INTO games (id, date, ip, details)
    VALUES (@id, @date, @ip, @details)
`);

const getGamesStmt = hotDb.prepare(`
    SELECT details FROM games 
    ORDER BY date DESC 
    LIMIT ? OFFSET ?
`);

const countGamesStmt = hotDb.prepare('SELECT COUNT(*) as count FROM games');

const searchGamesStmt = hotDb.prepare(`
    SELECT details FROM games
    WHERE
        CAST(id AS TEXT) LIKE @search
        OR json_extract(details, '$.settings.level') LIKE @search
        OR json_extract(details, '$.server.name') LIKE @search
        OR EXISTS (
            SELECT 1 FROM json_each(details, '$.players')
            WHERE json_extract(value, '$.name') LIKE @search
        )
    ORDER BY date DESC
    LIMIT @limit OFFSET @offset
`);

const countSearchGamesStmt = hotDb.prepare(`
    SELECT COUNT(*) as count FROM games
    WHERE
        CAST(id AS TEXT) LIKE @search
        OR json_extract(details, '$.settings.level') LIKE @search
        OR json_extract(details, '$.server.name') LIKE @search
        OR EXISTS (
            SELECT 1 FROM json_each(details, '$.players')
            WHERE json_extract(value, '$.name') LIKE @search
        )
`);

const getGamesFilteredStmt = hotDb.prepare(`
    SELECT details FROM games 
    WHERE date >= ?
    ORDER BY date DESC 
    LIMIT ? OFFSET ?
`);

const countGamesFilteredStmt = hotDb.prepare('SELECT COUNT(*) as count FROM games WHERE date >= ?');

const searchGamesFilteredStmt = hotDb.prepare(`
    SELECT details FROM games
    WHERE
        (date >= @startDate) AND
        (
            CAST(id AS TEXT) LIKE @search
            OR json_extract(details, '$.settings.level') LIKE @search
            OR json_extract(details, '$.server.name') LIKE @search
            OR EXISTS (
                SELECT 1 FROM json_each(details, '$.players')
                WHERE json_extract(value, '$.name') LIKE @search
            )
        )
    ORDER BY date DESC
    LIMIT @limit OFFSET @offset
`);

const countSearchGamesFilteredStmt = hotDb.prepare(`
    SELECT COUNT(*) as count FROM games
    WHERE
        (date >= @startDate) AND
        (
            CAST(id AS TEXT) LIKE @search
            OR json_extract(details, '$.settings.level') LIKE @search
            OR json_extract(details, '$.server.name') LIKE @search
            OR EXISTS (
                SELECT 1 FROM json_each(details, '$.players')
                WHERE json_extract(value, '$.name') LIKE @search
            )
        )
`);

const getGameById = hotDb.prepare('SELECT details FROM games WHERE id = ?');
const getColdGameById = coldDb.prepare('SELECT details FROM games WHERE id = ?');

// Cold Storage Queries
const getColdGamesStmt = coldDb.prepare(`
    SELECT details FROM games 
    ORDER BY date DESC 
    LIMIT ? OFFSET ?
`);

const countColdGamesStmt = coldDb.prepare('SELECT COUNT(*) as count FROM games');

const searchColdGamesStmt = coldDb.prepare(`
    SELECT details FROM games
    WHERE
        CAST(id AS TEXT) LIKE @search
        OR date LIKE @search
        OR json_extract(details, '$.settings.level') LIKE @search
        OR json_extract(details, '$.settings.matchMode') LIKE @search
        OR json_extract(details, '$.server.name') LIKE @search
        OR EXISTS (
            SELECT 1 FROM json_each(details, '$.players')
            WHERE json_extract(value, '$.name') LIKE @search
        )
    ORDER BY date DESC
    LIMIT @limit OFFSET @offset
`);

const countSearchColdGamesStmt = coldDb.prepare(`
    SELECT COUNT(*) as count FROM games
    WHERE
        CAST(id AS TEXT) LIKE @search
        OR date LIKE @search
        OR json_extract(details, '$.settings.level') LIKE @search
        OR json_extract(details, '$.settings.matchMode') LIKE @search
        OR json_extract(details, '$.server.name') LIKE @search
        OR EXISTS (
            SELECT 1 FROM json_each(details, '$.players')
            WHERE json_extract(value, '$.name') LIKE @search
        )
`);

// Admin/Backfill queries
const getGameGaps = hotDb.prepare(`
    WITH RECURSIVE seq(n) AS (
        SELECT ? AS n
        UNION ALL
        SELECT n + 1 FROM seq WHERE n < ?
    )
    SELECT n as missing_id FROM seq
    WHERE n NOT IN (SELECT id FROM games)
      AND n NOT IN (SELECT id FROM cold.games)
    LIMIT ?
`);

const getLatestGameId = hotDb.prepare('SELECT MAX(id) as max_id FROM games');

const getBackfillJob = hotDb.prepare('SELECT * FROM backfill_jobs WHERE id = ?');

const getActiveBackfillJob = hotDb.prepare(`
    SELECT * FROM backfill_jobs 
    WHERE status IN ('pending', 'running', 'paused') 
    ORDER BY created_at DESC 
    LIMIT 1
`);

const createBackfillJob = hotDb.prepare(`
    INSERT INTO backfill_jobs (start_game_id, end_game_id, rate_limit_ms, current_id, job_type)
    VALUES (?, ?, ?, ?, ?)
`);

const updateBackfillJob = hotDb.prepare(`
    UPDATE backfill_jobs 
    SET status = ?, current_id = ?, total_fetched = ?, total_failed = ?, 
        started_at = COALESCE(started_at, ?), completed_at = ?
    WHERE id = ?
`);

const deleteBackfillJob = hotDb.prepare('DELETE FROM backfill_jobs WHERE id = ?');

const insertGameMetadata = hotDb.prepare(`
    INSERT OR REPLACE INTO game_metadata (game_id, fetch_status, fetch_attempts, last_fetch_at, error_message)
    VALUES (?, ?, ?, ?, ?)
`);

const getGameMetadata = hotDb.prepare('SELECT * FROM game_metadata WHERE game_id = ?');

const getGlobalModeStats = hotDb.prepare(`
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

const getGlobalMapStats = hotDb.prepare(`
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

const getTopPlayedMaps = hotDb.prepare(`
    SELECT json_extract(details, '$.settings.level') as map, COUNT(*) as count
    FROM games
    GROUP BY map
    ORDER BY count DESC
    LIMIT 10
`);

const getRecentTopMaps = hotDb.prepare(`
    SELECT json_extract(details, '$.settings.level') as map, COUNT(*) as count
    FROM games
    WHERE date > date('now', '-30 days')
    GROUP BY map
    ORDER BY count DESC
    LIMIT 10
`);

const getMostActiveMaps = hotDb.prepare(`
    SELECT json_extract(details, '$.settings.level') as map, AVG(json_array_length(json_extract(details, '$.players'))) as avg_players
    FROM games
    GROUP BY map
    HAVING COUNT(*) >= 5
    ORDER BY avg_players DESC
    LIMIT 10
`);

const getAdminSetting = hotDb.prepare('SELECT value FROM admin_settings WHERE key = ?');

const setAdminSetting = hotDb.prepare('INSERT OR REPLACE INTO admin_settings (key, value) VALUES (?, ?)');

const getGameCountsByDate = hotDb.prepare(`
    SELECT date(date) as day, COUNT(*) as count
    FROM games
    WHERE date > date('now', '-365 days')
    GROUP BY day
    ORDER BY day ASC
`);

const getMonthlyGameCounts = hotDb.prepare(`
    SELECT strftime('%Y-%m', date) as month, COUNT(*) as count
    FROM games
    GROUP BY month
    ORDER BY month ASC
`);

const getGlobalActivityStats = hotDb.prepare(`
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

// Per-pilot totals over hot and cold games, optionally from a start date.
// Suicides come from the kill logs in one grouped pass; games without a kill
// log contribute 0.
const pilotTotalsSql = (where = '') => `
    WITH all_g AS (
        SELECT details, date FROM games ${where}
        UNION ALL
        SELECT details, date FROM cold.games ${where}
    ),
    suicides AS (
        SELECT pilot_key(json_extract(k.value, '$.defender')) AS pk, COUNT(*) AS n
        FROM all_g, json_each(all_g.details, '$.kills') k
        WHERE pilot_key(json_extract(k.value, '$.attacker')) = pilot_key(json_extract(k.value, '$.defender'))
        GROUP BY pk
    ),
    totals AS (
        SELECT
            pilot_key(json_extract(value, '$.name')) AS pk,
            TRIM(json_extract(value, '$.name')) as name,
            COUNT(*) as games,
            COALESCE(SUM(net_kills(json_extract(value, '$.kills'))), 0) as kills,
            COALESCE(SUM(json_extract(value, '$.deaths')), 0) as deaths,
            COALESCE(SUM(json_extract(value, '$.assists')), 0) as assists,
            MAX(all_g.date) as lastSeen,
            MAX(all_g.date) as last_updated
        FROM all_g, json_each(all_g.details, '$.players')
        WHERE json_extract(value, '$.name') IS NOT NULL
          AND TRIM(json_extract(value, '$.name')) != ''
        GROUP BY pk
    )
    SELECT t.name, t.games, t.kills, t.deaths, t.assists, COALESCE(s.n, 0) as suicides, t.lastSeen, t.last_updated
    FROM totals t LEFT JOIN suicides s ON s.pk = t.pk
    ORDER BY t.games DESC
`;

const getPilotStats = hotDb.prepare(pilotTotalsSql());

const getPilotStatsFiltered = hotDb.prepare(pilotTotalsSql('WHERE date >= @startDate'));

const getDatabaseStats = hotDb.prepare(`
    SELECT
        COUNT(*) as total_games,
        MAX(id) as max_game_id,
        MIN(id) as min_game_id,
        MIN(date) as earliest_date,
        MAX(date) as latest_date
    FROM games
`);

const getColdDatabaseStats = coldDb.prepare(`
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

const getServerActivityStats = hotDb.prepare(`
    SELECT 
        COALESCE(json_extract(details, '$.server.ip'), ip) as server_ip,
        strftime('%H', date) as hour,
        COUNT(*) as count
    FROM games
    WHERE date > datetime('now', '-24 hours')
    GROUP BY server_ip, hour
`);



const getActivePilotCount = hotDb.prepare(`
    SELECT COUNT(DISTINCT json_extract(value, '$.name')) as count
    FROM games, json_each(details, '$.players')
    WHERE date > datetime('now', '-90 days')
  `);

const getDeadliestMaps = hotDb.prepare(`
    SELECT json_extract(details, '$.settings.level') as map, 
           SUM((SELECT SUM(net_kills(json_extract(value, '$.kills'))) FROM json_each(json_extract(details, '$.players')))) as total_kills 
    FROM games
    WHERE date > date('now', '-365 days')
    GROUP BY map 
    ORDER BY total_kills DESC 
    LIMIT 5
`);

const getMarathonMaps = hotDb.prepare(`
    SELECT json_extract(details, '$.settings.level') as map, 
           AVG(duration_of(details)) as avg_duration 
    FROM games
    WHERE date > date('now', '-365 days')
    GROUP BY map 
    HAVING COUNT(*) > 5 
    ORDER BY avg_duration DESC 
    LIMIT 5
`);

// Games stored without a kill log (gamelist summaries) that ran over a minute,
// in id order after `afterId`, so a hydration pass never revisits a game.
const getSummaryGames = hotDb.prepare(`
    SELECT id FROM games
    WHERE id > ?
    AND COALESCE(json_array_length(details, '$.kills'), 0) = 0
    AND duration_of(details) > 60
    ORDER BY id
    LIMIT ?
`);

// Weapon Normalization & Telemetry Engine
const WEAPON_MAP = {
    driller: 'Driller',
    flak: 'Flak',
    shotgun: 'Flak',
    thunderbolt: 'Thunderbolt',
    beam: 'Thunderbolt',
    impulse: 'Impulse',
    cyclone: 'Cyclone',
    crusher: 'Crusher',
    reflex: 'Reflex',
    lancer: 'Lancer',
    falcon: 'Falcon',
    missile_pod: 'Missile Pod',
    pod: 'Missile Pod',
    hunter: 'Hunter',
    smart: 'Hunter',
    creeper: 'Creeper',
    devastator: 'Devastator',
    timebomb: 'Time Bomb',
    vortex: 'Vortex',
    nova: 'Nova',
    flare: 'Flare'
};

const PRIMARY_WEAPONS = new Set([
    'Driller', 'Flak', 'Thunderbolt', 'Impulse', 'Cyclone', 'Crusher', 'Reflex', 'Lancer'
]);

const SECONDARY_WEAPONS = new Set([
    'Falcon', 'Missile Pod', 'Hunter', 'Creeper', 'Devastator', 'Time Bomb', 'Vortex', 'Nova', 'Flare'
]);

function normalizeWeaponName(raw) {
    if (!raw) return 'Unknown';
    const lower = raw.toLowerCase().trim();
    for (const [key, val] of Object.entries(WEAPON_MAP)) {
        if (lower.includes(key)) return val;
    }
    if (lower.includes('misc') || lower.includes('collision') || lower === 'none') return 'Miscellaneous';
    return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function getPilotTelemetry(name, startDate, matchMode) {
    try {
        const cached = hotDb.prepare('SELECT * FROM pilot_stats_cache WHERE name = ? COLLATE NOCASE').get(name);

        const pattern = pilotLikePattern(name);
        const key = pilotKey(name);
        let gameRows;
        if (startDate) {
            gameRows = hotDb.prepare(`
                SELECT details, date FROM games
                WHERE date >= @startDate AND details LIKE @pattern ESCAPE '\\'
                ORDER BY date DESC
            `).all({ startDate, pattern });
        } else {
            const hotAll = hotDb.prepare(`
                SELECT details, date FROM games
                WHERE details LIKE @pattern ESCAPE '\\'
                ORDER BY date DESC
            `).all({ pattern });
            if (hotAll && hotAll.length >= 5) {
                gameRows = hotAll;
            } else {
                const coldAll = hotDb.prepare(`
                    SELECT details, date FROM cold.games
                    WHERE details LIKE @pattern ESCAPE '\\'
                    ORDER BY date DESC
                `).all({ pattern });
                gameRows = (hotAll || []).concat(coldAll);
            }
        }

        if (!gameRows || gameRows.length === 0) {
            return startDate ? null : (cached || null);
        }

        const record = { wins: 0, losses: 0, ties: 0 };
        let totalDamageDealt = 0;
        let totalDamageTaken = 0;
        let totalPlaytimeSec = 0;
        let totalKills = 0;
        let totalDeaths = 0;
        let totalAssists = 0;
        let suicides = 0;
        let validGames = 0;
        let lastSeen = null;
        const mapCounts = {};
        const weaponAgg = {};
        const weaponTakenAgg = {};

        for (const row of gameRows) {
            if (!row.details) continue;
            let g;
            try {
                g = typeof row.details === 'string' ? JSON.parse(row.details) : row.details;
            } catch {
                continue;
            }

            const players = g.players || [];
            const me = players.find(p => pilotKey(p?.name) === key);
            if (!me) continue;

            const durationSec = durationOf(g);

            // Ranked filter: exclude <2 players and games under 60s or of unknown length
            if (players.length < 2 || durationSec < 60) continue;

            // Mode filter if requested
            if (matchMode && matchMode.toUpperCase() !== 'ALL') {
                const gMode = (g.settings?.matchMode || '').toUpperCase().replace(/[\s_]+/g, '');
                const reqMode = matchMode.toUpperCase().replace(/[\s_]+/g, '');
                if (gMode !== reqMode) continue;
            }

            validGames++;
            totalKills += netKills(me);
            totalDeaths += (me.deaths || 0);
            totalAssists += (me.assists || 0);
            totalPlaytimeSec += durationSec;

            if (row.date && (!lastSeen || row.date > lastSeen)) {
                lastSeen = row.date;
            }

            const mapName = g.settings?.level;
            if (mapName) {
                mapCounts[mapName] = (mapCounts[mapName] || 0) + 1;
            }

            const outcome = outcomeOf(g, me);
            if (outcome) record[OUTCOME_FIELD[outcome]]++;

            if (Array.isArray(g.damage)) {
                for (const d of g.damage) {
                    if (!d || !d.damage) continue;
                    const isAttacker = pilotKey(d.attacker) === key;
                    const isDefender = pilotKey(d.defender) === key;

                    if (isAttacker && !isDefender) {
                        totalDamageDealt += d.damage;
                        const wName = normalizeWeaponName(d.weapon);
                        if (!weaponAgg[wName]) {
                            weaponAgg[wName] = { name: wName, damage: 0, hits: 0, kills: 0 };
                        }
                        weaponAgg[wName].damage += d.damage;
                        weaponAgg[wName].hits += 1;
                    }
                    if (isDefender && !isAttacker) {
                        totalDamageTaken += d.damage;
                        const wName = normalizeWeaponName(d.weapon);
                        if (!weaponTakenAgg[wName]) {
                            weaponTakenAgg[wName] = { name: wName, damage: 0, hits: 0, deaths: 0 };
                        }
                        weaponTakenAgg[wName].damage += d.damage;
                        weaponTakenAgg[wName].hits += 1;
                    }
                }
            }

            if (Array.isArray(g.kills)) {
                for (const k of g.kills) {
                    if (!k) continue;
                    const isAttacker = pilotKey(k.attacker) === key;
                    const isDefender = pilotKey(k.defender) === key;
                    if (isAttacker && isDefender) {
                        suicides++;
                    }
                    if (isAttacker && !isDefender) {
                        const wName = normalizeWeaponName(k.weapon);
                        if (!weaponAgg[wName]) {
                            weaponAgg[wName] = { name: wName, damage: 0, hits: 0, kills: 0 };
                        }
                        weaponAgg[wName].kills += 1;
                    }
                    if (isDefender && !isAttacker) {
                        const wName = normalizeWeaponName(k.weapon);
                        if (!weaponTakenAgg[wName]) {
                            weaponTakenAgg[wName] = { name: wName, damage: 0, hits: 0, deaths: 0 };
                        }
                        weaponTakenAgg[wName].deaths += 1;
                    }
                }
            }
        }

        const totalGames = validGames;
        const flightMinutes = totalPlaytimeSec > 0 ? totalPlaytimeSec / 60 : 0;
        const { wins, losses, ties } = record;
        const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 1000) / 10 : 0;
        const pureKd = totalDeaths > 0 ? Math.round((totalKills / totalDeaths) * 100) / 100 : totalKills;
        const kda = totalDeaths > 0 ? Math.round(((totalKills + totalAssists * 0.5) / totalDeaths) * 100) / 100 : totalKills;
        const kpm = flightMinutes > 0 ? Math.round((totalKills / flightMinutes) * 100) / 100 : 0;
        const aci = totalGames > 0 ? Math.round(((totalKills + totalAssists * 0.5 - totalDeaths) / totalGames) * 100) / 100 : 0;
        const dpm = flightMinutes > 0 ? Math.round((totalDamageDealt / flightMinutes)) : 0;
        const flightHours = Math.round((totalPlaytimeSec / 3600) * 10) / 10;

        // Defensive Damage Stats
        const damageTakenPerDeath = totalDeaths > 0 ? Math.round((totalDamageTaken / totalDeaths) * 10) / 10 : Math.round(totalDamageTaken * 10) / 10;
        const netDamage = Math.round(totalDamageDealt - totalDamageTaken);
        const netDpm = flightMinutes > 0 ? Math.round((totalDamageDealt - totalDamageTaken) / flightMinutes) : 0;

        let favoriteMap = 'Unknown';
        let maxMapGames = 0;
        for (const [m, count] of Object.entries(mapCounts)) {
            if (count > maxMapGames) {
                maxMapGames = count;
                favoriteMap = m;
            }
        }

        const weaponList = Object.values(weaponAgg)
            .filter(w => w.name !== 'Miscellaneous')
            .map(w => ({
                ...w,
                damage: Math.round(w.damage),
                isPrimary: PRIMARY_WEAPONS.has(w.name)
            }))
            .sort((a, b) => b.damage - a.damage);

        let primaryDamage = 0;
        let secondaryDamage = 0;
        for (const w of weaponList) {
            if (w.isPrimary) primaryDamage += w.damage;
            else secondaryDamage += w.damage;
        }
        const combinedDmg = (primaryDamage + secondaryDamage) || 1;
        for (const w of weaponList) {
            w.pctOfTotalDamage = Math.round((w.damage / combinedDmg) * 1000) / 10;
        }

        // Damage Taken Weapon Breakdown
        const weaponTakenList = Object.values(weaponTakenAgg)
            .filter(w => w.name !== 'Miscellaneous')
            .map(w => ({
                ...w,
                damage: Math.round(w.damage),
                isPrimary: PRIMARY_WEAPONS.has(w.name)
            }))
            .sort((a, b) => b.damage - a.damage);

        let primaryDamageTaken = 0;
        let secondaryDamageTaken = 0;
        for (const w of weaponTakenList) {
            if (w.isPrimary) primaryDamageTaken += w.damage;
            else secondaryDamageTaken += w.damage;
        }
        const combinedDmgTaken = (primaryDamageTaken + secondaryDamageTaken) || 1;
        for (const w of weaponTakenList) {
            w.pctOfTotalDamage = Math.round((w.damage / combinedDmgTaken) * 1000) / 10;
        }

        const favoriteWeapon = weaponList[0]?.name || 'Unknown';

        return {
            name,
            games: totalGames,
            kills: Math.max(0, totalKills),
            deaths: totalDeaths,
            assists: totalAssists,
            suicides,
            last_seen: lastSeen || cached?.last_updated || 'Unknown',
            favorite_map: favoriteMap,
            favorite_weapon: favoriteWeapon,
            pure_kd: pureKd,
            kda,
            wins,
            losses,
            ties,
            win_rate: winRate,
            flight_time_seconds: Math.round(totalPlaytimeSec),
            flight_hours: flightHours,
            kpm,
            aci,
            total_damage_dealt: Math.round(totalDamageDealt),
            total_damage_taken: Math.round(totalDamageTaken),
            dpm,
            damage_taken_per_death: damageTakenPerDeath,
            net_damage: netDamage,
            net_dpm: netDpm,
            threat_centrality: cached?.threat_centrality ?? 0,
            dominance_index: cached?.dominance_index ?? 50.0,
            // Career all-time numbers from registry cache
            career_games: cached ? cached.games : totalGames,
            career_kills: cached ? Math.max(0, cached.kills) : Math.max(0, totalKills),
            career_deaths: cached ? cached.deaths : totalDeaths,
            career_assists: cached ? cached.assists : totalAssists,
            career_suicides: cached ? (cached.suicides || 0) : suicides,
            career_wins: cached ? cached.wins : wins,
            career_losses: cached ? cached.losses : losses,
            career_ties: cached ? cached.ties : ties,
            career_win_rate: cached ? cached.win_rate : winRate,
            career_kd: cached ? Math.max(0, cached.kd) : pureKd,
            career_kda: cached ? Math.max(0, cached.kda) : kda,
            career_flight_hours: cached ? (cached.flight_hours || Math.round(((cached.time_played_seconds || 0) / 3600) * 10) / 10) : flightHours,
            recent_games: totalGames,
            timeframe_days: startDate ? 365 : null,
            mode_filter: matchMode || null,
            weapons: weaponList,
            weapon_summary: {
                primaryDamage: Math.round(primaryDamage),
                secondaryDamage: Math.round(secondaryDamage),
                primaryPct: Math.round((primaryDamage / combinedDmg) * 1000) / 10,
                secondaryPct: Math.round((secondaryDamage / combinedDmg) * 1000) / 10,
                totalDamage: Math.round(totalDamageDealt)
            },
            damage_taken_weapons: weaponTakenList,
            damage_taken_summary: {
                primaryDamage: Math.round(primaryDamageTaken),
                secondaryDamage: Math.round(secondaryDamageTaken),
                primaryPct: Math.round((primaryDamageTaken / combinedDmgTaken) * 1000) / 10,
                secondaryPct: Math.round((secondaryDamageTaken / combinedDmgTaken) * 1000) / 10,
                totalDamage: Math.round(totalDamageTaken)
            }
        };
    } catch (err) {
        console.error("Failed in getPilotTelemetry:", err);
        return null;
    }
}

const getPilotDetailedStats = {
    get: ({ name, startDate, mode }) => getPilotTelemetry(name, startDate, mode)
};

const getGamesByPilot = hotDb.prepare(`
    SELECT details 
    FROM (
        SELECT details, date FROM games WHERE (@startDate IS NULL OR date >= @startDate) AND details LIKE ('%' || @name || '%')
        UNION ALL
        SELECT details, date FROM cold.games WHERE (@startDate IS NULL OR date >= @startDate) AND details LIKE ('%' || @name || '%')
    )
    WHERE EXISTS (
        SELECT 1 FROM json_each(details, '$.players') 
        WHERE json_extract(value, '$.name') = @name COLLATE NOCASE
    )
    ORDER BY date DESC
    LIMIT @limit OFFSET @offset
`);

const countGamesByPilot = hotDb.prepare(`
    SELECT COUNT(*) as count
    FROM (
        SELECT details, date FROM games WHERE (@startDate IS NULL OR date >= @startDate) AND details LIKE ('%' || @name || '%')
        UNION ALL
        SELECT details, date FROM cold.games WHERE (@startDate IS NULL OR date >= @startDate) AND details LIKE ('%' || @name || '%')
    )
    WHERE EXISTS (
        SELECT 1 FROM json_each(details, '$.players') 
        WHERE json_extract(value, '$.name') = @name COLLATE NOCASE
    )
`);

// Server Health Queries

const getDistinctServerIps = hotDb.prepare(`
    SELECT DISTINCT COALESCE(json_extract(details, '$.server.ip'), ip) as ip
    FROM games
    WHERE date > datetime('now', '-7 days')
    AND ip IS NOT NULL
`);

// Attach cold DB to hot DB connection for cross-db queries
try {
  hotDb.prepare(`ATTACH DATABASE '${coldDbPath.replace(/\\/g, ' / ')}' AS cold`).run();
} catch (e) {
  if (!e.message.includes('already in use')) {
    console.error("Failed to attach cold DB:", e);
  }
}

// Lazy load prepared statements to avoid startup crash if ATTACH fails
let getAllTimePilotStatsStmt;
let getAllTimeMapStatsStmt;
let getAllTimeGlobalStatsStmt;
let getAllTimeGlobalKillsStmt;

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
    return getPilotStats;
  }
  return getAllTimePilotStatsStmt;
};

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
            SELECT SUM(net_kills(json_extract(value, '$.kills'))) as total_kills
FROM(
  SELECT details FROM games
                UNION ALL
                SELECT details FROM cold.games
), json_each(details, '$.players')
    `);
  }
  return getAllTimeGlobalKillsStmt;
};

const buildColdStorageStatsCache = () => {
  try {
    const hotDbSize = fs.existsSync(dbPath) ? fs.statSync(dbPath).size : 0;
    const coldDbSize = fs.existsSync(coldDbPath) ? fs.statSync(coldDbPath).size : 0;
    const totalStorageBytes = hotDbSize + coldDbSize;

    // Ensure Cold DB is attached
    try {
      hotDb.prepare('SELECT 1 FROM cold.games LIMIT 1').get();
    } catch (e) {
      hotDb.exec(`ATTACH DATABASE '${coldDbPath}' AS cold`);
    }

    const pilotSummary = hotDb.prepare(`
      SELECT 
        COUNT(*) as total_pilots,
        COALESCE(SUM(kills), 0) as total_kills,
        COALESCE(SUM(deaths), 0) as total_deaths,
        COALESCE(SUM(assists), 0) as total_assists,
        COALESCE(SUM(total_damage), 0) as total_damage,
        COALESCE(SUM(flight_hours), 0) as total_flight_hours
      FROM pilot_stats_cache
    `).get() || {};

    const yearlyMap = {};
    const modesMap = {};
    const mapsMap = {};
    const serverSet = new Set();
    let totalGames = 0;
    let firstGameDate = null;
    let lastGameDate = null;
    let graveyardShiftCount = 0;
    let totalMatchPlaytimeSec = 0;

    let bloodiestMatch = { id: null, kills: 0, map: '', date: '', players: 0, mode: '' };
    let longestMatch = { id: null, duration: 0, map: '', date: '', players: 0, mode: '' };
    let maxSinglePilotFrags = { id: null, pilot: '', kills: 0, map: '', date: '', mode: '' };
    let mostAttendedMatch = { id: null, count: 0, map: '', date: '', mode: '' };

    const stmt = hotDb.prepare('SELECT id, date, ip, details FROM games UNION ALL SELECT id, date, ip, details FROM cold.games');
    for (const row of stmt.iterate()) {
      totalGames++;
      if (row.ip) serverSet.add(row.ip.trim());
      if (row.date) {
        if (!firstGameDate || row.date < firstGameDate) firstGameDate = row.date;
        if (!lastGameDate || row.date > lastGameDate) lastGameDate = row.date;
        const yr = row.date.substring(0, 4);
        if (yr >= '2019' && yr <= '2030') yearlyMap[yr] = (yearlyMap[yr] || 0) + 1;
        const hr = new Date(row.date).getUTCHours();
        if (hr >= 2 && hr <= 5) graveyardShiftCount++;
      }

      try {
        const g = JSON.parse(row.details);
        const modeRaw = (g.settings?.matchMode || g.MatchMode || g.game?.mode || 'ANARCHY').toUpperCase().trim();
        modesMap[modeRaw] = (modesMap[modeRaw] || 0) + 1;

        const mapRaw = (g.settings?.level || g.Level || g.game?.mapName || 'UNKNOWN').trim();
        if (mapRaw && mapRaw !== 'UNKNOWN') mapsMap[mapRaw] = (mapsMap[mapRaw] || 0) + 1;

        const dur = Math.round(durationOf(g));

        totalMatchPlaytimeSec += dur;
        if (dur > longestMatch.duration) {
          longestMatch = { id: row.id, duration: dur, map: mapRaw, date: row.date, players: (g.players || []).length, mode: modeRaw };
        }

        const players = g.players || [];
        if (players.length > mostAttendedMatch.count) {
          mostAttendedMatch = { id: row.id, count: players.length, map: mapRaw, date: row.date, mode: modeRaw };
        }

        let matchFrags = 0;
        for (let i = 0; i < players.length; i++) {
          const p = players[i];
          const k = netKills(p);
          matchFrags += k;
          if (k > maxSinglePilotFrags.kills && p?.name) {
            maxSinglePilotFrags = { id: row.id, pilot: p.name.trim(), kills: k, map: mapRaw, date: row.date, mode: modeRaw };
          }
        }

        if (matchFrags > bloodiestMatch.kills) {
          bloodiestMatch = { id: row.id, kills: matchFrags, map: mapRaw, date: row.date, players: players.length, mode: modeRaw };
        }
      } catch (e) {}
    }

    const sortedMaps = Object.entries(mapsMap)
      .map(([map, count]) => ({ map, count, lastPlayed: null }))
      .sort((a, b) => b.count - a.count);

    const sortedModes = Object.entries(modesMap)
      .map(([mode, count]) => ({ mode, count }))
      .sort((a, b) => b.count - a.count);

    const yearlyList = Object.entries(yearlyMap)
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => a.year.localeCompare(b.year));

    const payload = {
      total_games: totalGames,
      first_game: firstGameDate,
      last_game: lastGameDate,
      total_playtime_seconds: Math.round((pilotSummary.total_flight_hours || (totalMatchPlaytimeSec / 3600)) * 3600),
      total_flight_hours: Math.round(pilotSummary.total_flight_hours || (totalMatchPlaytimeSec / 3600)),
      total_kills: pilotSummary.total_kills || 0,
      total_deaths: pilotSummary.total_deaths || 0,
      total_assists: pilotSummary.total_assists || 0,
      total_damage: Math.round(pilotSummary.total_damage || 0),
      unique_pilots: pilotSummary.total_pilots || 0,
      unique_servers: serverSet.size,
      unique_maps: sortedMaps.length,
      most_popular_mode: sortedModes[0] || { mode: 'ANARCHY', count: 0 },
      most_popular_map: sortedMaps[0] || { map: 'VAULT', count: 0 },
      modes: sortedModes,
      top_maps: sortedMaps.slice(0, 20),
      yearly: yearlyList,
      records: {
        bloodiest_match: bloodiestMatch,
        longest_match: longestMatch,
        max_single_pilot_frags: maxSinglePilotFrags,
        most_attended_match: mostAttendedMatch
      },
      graveyard_shift_count: graveyardShiftCount,
      storage: {
        hot_db_bytes: hotDbSize,
        cold_db_bytes: coldDbSize,
        total_bytes: totalStorageBytes,
        hot_db_mb: Math.round((hotDbSize / (1024 * 1024)) * 10) / 10,
        cold_db_mb: Math.round((coldDbSize / (1024 * 1024)) * 10) / 10,
        total_mb: Math.round((totalStorageBytes / (1024 * 1024)) * 10) / 10,
        total_gb: Math.round((totalStorageBytes / (1024 * 1024 * 1024)) * 100) / 100
      },
      last_calculated: new Date().toISOString()
    };

    hotDb.prepare('INSERT OR REPLACE INTO cold_storage_stats_cache (id, data, last_updated) VALUES (1, ?, CURRENT_TIMESTAMP)').run(JSON.stringify(payload));
    console.log('[ColdStorage] Successfully built archival deep stats cache.');
    return payload;
  } catch (err) {
    console.error('Failed to build cold storage stats cache:', err);
    return null;
  }
};

const STOCK_MAPS = [
  {
    name: 'Vault',
    author: 'Revival Productions',
    size: 'medium',
    max_players: 6,
    best_team_size: 3,
    supports_ctf: 1,
    style: 'organic',
    release_date: '2018-05-31',
    remote_image_url: 'https://www.omdb.net/thumbs/Vault_01small.jpg',
    is_custom: 0
  },
  {
    name: 'Terminal',
    author: 'Revival Productions',
    size: 'small',
    max_players: 4,
    best_team_size: 2,
    supports_ctf: 1,
    style: 'mixed',
    release_date: '2018-05-31',
    remote_image_url: 'https://www.omdb.net/thumbs/Terminal_01small.jpg',
    is_custom: 0
  },
  {
    name: 'Wraith',
    author: 'Revival Productions',
    size: 'small',
    max_players: 4,
    best_team_size: 2,
    supports_ctf: 1,
    style: 'tech',
    release_date: '2018-05-31',
    remote_image_url: 'https://www.omdb.net/thumbs/Wraith_01small.jpg',
    is_custom: 0
  },
  {
    name: 'Blizzard',
    author: 'Revival Productions',
    size: 'small',
    max_players: 4,
    best_team_size: 2,
    supports_ctf: 1,
    style: 'mixed',
    release_date: '2018-05-31',
    remote_image_url: 'https://www.omdb.net/thumbs/Blizzard_01small.jpg',
    is_custom: 0
  },
  {
    name: 'Backfire',
    author: 'Revival Productions',
    size: 'large',
    max_players: 8,
    best_team_size: 4,
    supports_ctf: 1,
    style: 'mixed',
    release_date: '2018-05-31',
    remote_image_url: 'https://www.omdb.net/thumbs/Backfire_01small.jpg',
    is_custom: 0
  },
  {
    name: 'Syrinx',
    author: 'Revival Productions',
    size: 'medium',
    max_players: 8,
    best_team_size: 4,
    supports_ctf: 1,
    style: 'mixed',
    release_date: '2018-05-31',
    remote_image_url: 'https://www.omdb.net/thumbs/Syrinx_01small.jpg',
    is_custom: 0
  },
  {
    name: 'Centrifuge',
    author: 'Revival Productions',
    size: 'small',
    max_players: 6,
    best_team_size: 3,
    supports_ctf: 1,
    style: 'tech',
    release_date: '2018-05-31',
    remote_image_url: 'https://www.omdb.net/thumbs/Centrifuge_01small.jpg',
    is_custom: 0
  },
  {
    name: 'Hive',
    author: 'Revival Productions',
    size: 'small',
    max_players: 6,
    best_team_size: 3,
    supports_ctf: 1,
    style: 'mixed',
    release_date: '2018-05-31',
    remote_image_url: 'https://www.omdb.net/thumbs/Hive_01small.jpg',
    is_custom: 0
  },
  {
    name: 'Roundabout',
    author: 'Revival Productions',
    size: 'gigantic',
    max_players: 10,
    best_team_size: 5,
    supports_ctf: 1,
    style: 'mixed',
    release_date: '2018-05-31',
    remote_image_url: 'https://www.omdb.net/thumbs/Roundabout_01small.jpg',
    is_custom: 0
  },
  {
    name: 'Foundry',
    author: 'Revival Productions',
    size: 'small',
    max_players: 4,
    best_team_size: 2,
    supports_ctf: 1,
    style: 'tech',
    release_date: '2018-05-31',
    remote_image_url: 'https://www.omdb.net/thumbs/Foundry_01small.jpg',
    is_custom: 0
  },
  {
    name: 'Labyrinth',
    author: 'Revival Productions',
    size: 'large',
    max_players: 8,
    best_team_size: 4,
    supports_ctf: 1,
    style: 'organic',
    release_date: '2018-05-31',
    remote_image_url: 'https://www.omdb.net/thumbs/Labyrinth_01small.jpg',
    is_custom: 0
  },
  {
    name: 'Chimp',
    author: 'Revival Productions',
    size: 'small',
    max_players: 4,
    best_team_size: 2,
    supports_ctf: 1,
    style: 'tech',
    release_date: '2018-05-31',
    remote_image_url: 'https://www.omdb.net/thumbs/Chimp_01small.jpg',
    is_custom: 0
  }
];

const seedStockMaps = () => {
  try {
    const stmt = hotDb.prepare(`
      INSERT INTO maps (
        name, author, size, max_players, best_team_size, supports_ctf, style,
        release_date, remote_image_url, is_custom, updated_at
      ) VALUES (
        @name, @author, @size, @max_players, @best_team_size, @supports_ctf, @style,
        @release_date, @remote_image_url, @is_custom, CURRENT_TIMESTAMP
      )
      ON CONFLICT(name) DO UPDATE SET
        author = excluded.author,
        is_custom = 0,
        remote_image_url = COALESCE(maps.remote_image_url, excluded.remote_image_url),
        style = COALESCE(maps.style, excluded.style),
        updated_at = CURRENT_TIMESTAMP
    `);

    hotDb.transaction(() => {
      for (const m of STOCK_MAPS) {
        stmt.run(m);
      }
    })();
    console.log(`[Maps] Seeded ${STOCK_MAPS.length} official Revival Productions stock maps into maps table.`);

    // Guarantee custom vs stock separation
    hotDb.exec(`
      UPDATE maps 
      SET is_custom = 1 
      WHERE LOWER(author) NOT LIKE '%revival%' 
        AND name NOT IN ('Vault', 'Terminal', 'Wraith', 'Blizzard', 'Backfire', 'Syrinx', 'Centrifuge', 'Hive', 'Roundabout', 'Foundry', 'Labyrinth', 'Chimp');
      UPDATE maps 
      SET is_custom = 0 
      WHERE LOWER(author) LIKE '%revival%' 
         OR name IN ('Vault', 'Terminal', 'Wraith', 'Blizzard', 'Backfire', 'Syrinx', 'Centrifuge', 'Hive', 'Roundabout', 'Foundry', 'Labyrinth', 'Chimp');
    `);
  } catch (err) {
    console.error('Failed to seed stock maps:', err);
  }
};

const buildMapStatsCache = () => {
  try {
    console.log('[MapStats] Starting streaming map telemetry aggregation...');
    const start = performance.now();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const mapStatsMap = new Map();

    function getOrInit(name) {
      const key = name.toLowerCase().trim();
      let entry = mapStatsMap.get(key);
      if (!entry) {
        entry = {
          name: name.trim(),
          total_matches: 0,
          total_kills: 0,
          total_deaths: 0,
          total_damage: 0,
          total_pilot_slots: 0,
          recent_30d_matches: 0,
          first_played: null,
          last_played: null,
          modes: {},
          pilots: new Map(),
          record_match: { id: null, kills: 0, date: null, players: 0 }
        };
        mapStatsMap.set(key, entry);
      }
      return entry;
    }

    const query = hotDb.prepare(`
      SELECT id, details, date
      FROM (
        SELECT id, details, date FROM games
        UNION ALL
        SELECT id, details, date FROM cold.games
      )
      WHERE details IS NOT NULL
    `);

    for (const row of query.iterate()) {
      let details;
      try {
        details = typeof row.details === 'string' ? JSON.parse(row.details) : row.details;
      } catch {
        continue;
      }

      const levelRaw = details?.settings?.level;
      if (!levelRaw || typeof levelRaw !== 'string') continue;

      const entry = getOrInit(levelRaw);
      entry.total_matches++;

      const date = row.date;
      if (date) {
        if (!entry.first_played || date < entry.first_played) entry.first_played = date;
        if (!entry.last_played || date > entry.last_played) entry.last_played = date;
        if (date >= thirtyDaysAgo) entry.recent_30d_matches++;
      }

      const mode = details?.settings?.matchMode || 'ANARCHY';
      entry.modes[mode] = (entry.modes[mode] || 0) + 1;

      const players = Array.isArray(details?.players) ? details.players : [];
      entry.total_pilot_slots += players.length;

      let matchKills = 0;
      for (const p of players) {
        const pName = p.name ? p.name.trim() : null;
        const kills = netKills(p);
        const deaths = Number(p.deaths) || 0;

        matchKills += kills;
        entry.total_kills += kills;
        entry.total_deaths += deaths;

        if (pName) {
          const pKey = pilotKey(pName);
          let pEntry = entry.pilots.get(pKey);
          if (!pEntry) {
            pEntry = { name: pName, sorties: 0, kills: 0, deaths: 0 };
            entry.pilots.set(pKey, pEntry);
          }
          pEntry.sorties++;
          pEntry.kills += kills;
          pEntry.deaths += deaths;
        }
      }

      // Aggregate combat damage from match telemetry (prefer pre-aggregated player damage, fallback to raw damage array)
      let matchDamage = 0;
      if (Array.isArray(details?.players) && details.players.length > 0) {
        for (let j = 0; j < details.players.length; j++) {
          const p = details.players[j];
          matchDamage += Number(p?.damage_dealt || p?.damage || p?.total_damage || 0);
        }
      } else if (Array.isArray(details?.damage)) {
        for (let j = 0; j < details.damage.length; j++) {
          const d = details.damage[j];
          if (d && typeof d.damage === 'number') {
            matchDamage += d.damage;
          }
        }
      }
      entry.total_damage += Math.round(matchDamage);

      if (matchKills > entry.record_match.kills) {
        entry.record_match = {
          id: row.id,
          kills: matchKills,
          date: row.date,
          players: players.length
        };
      }
    }

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
      for (const [, entry] of mapStatsMap) {
        const topPilots = Array.from(entry.pilots.values())
          .sort((a, b) => b.kills - a.kills)
          .slice(0, 5)
          .map(p => ({
            ...p,
            kd: Number((p.kills / Math.max(1, p.deaths)).toFixed(2))
          }));

        const topAce = topPilots[0] || null;

        insertStmt.run({
          map_name: entry.name,
          total_matches: entry.total_matches,
          total_kills: entry.total_kills,
          total_deaths: entry.total_deaths,
          total_damage: entry.total_damage,
          avg_players: Number((entry.total_pilot_slots / Math.max(1, entry.total_matches)).toFixed(1)),
          first_played: entry.first_played,
          last_played: entry.last_played,
          recent_30d_matches: entry.recent_30d_matches,
          modes: JSON.stringify(entry.modes),
          top_pilot: topAce ? JSON.stringify(topAce) : null,
          top_pilots: JSON.stringify(topPilots),
          record_match: JSON.stringify(entry.record_match)
        });
      }
    })();

    const duration = ((performance.now() - start) / 1000).toFixed(2);
    console.log(`[MapStats] Built map_stats_cache for ${mapStatsMap.size} maps in ${duration}s.`);
    return true;
  } catch (err) {
    console.error('Failed to build map stats cache:', err);
    return false;
  }
};

// saveGames upsert. A gamelist summary carries an empty kill log, so it does not
// replace stored details that have one (a hydrated or archive game).
const upsertGameSql = `
  INSERT INTO games(id, date, ip, details)
  VALUES(@id, @date, @ip, @details)
  ON CONFLICT(id) DO UPDATE SET
    details = CASE
      WHEN COALESCE(json_array_length(excluded.details, '$.kills'), 0) = 0
        AND COALESCE(json_array_length(games.details, '$.kills'), 0) > 0
      THEN games.details
      ELSE excluded.details
    END,
    date = excluded.date,
    ip = excluded.ip
`;
const upsertGameHot = hotDb.prepare(upsertGameSql);
const upsertGameCold = coldDb.prepare(upsertGameSql);

// Hot games in one UTC day; bind utcDayBounds().
const getGamesInDay = hotDb.prepare(`
  SELECT id, date, details FROM games
  WHERE date >= ? AND date < ?
  ORDER BY date ASC
`);

const db = {
  // Copy committed WAL pages into tracker.db, so a raw copy of the file (admin backup) is complete.
  checkpointHot: () => hotDb.pragma('wal_checkpoint(TRUNCATE)'),

  getGames: (limit, offset, search, startDate) => {
    if (search) {
      if (startDate) {
        return searchGamesFilteredStmt.all({ limit, offset, search: `%${search}%`, startDate });
      }
      return searchGamesStmt.all({ limit, offset, search: `%${search}%` });
    }
    if (startDate) {
      return getGamesFilteredStmt.all(startDate, limit, offset);
    }
    return getGamesStmt.all(limit, offset);
  },
  countGames: (search, startDate) => {
    if (search) {
      if (startDate) {
        return countSearchGamesFilteredStmt.get({ search: `%${search}%`, startDate });
      }
      return countSearchGamesStmt.get({ search: `%${search}%` });
    }
    if (startDate) {
      return countGamesFilteredStmt.get(startDate);
    }
    return countGamesStmt.get();
  },
  getColdGames: (limit, offset, search) => {
    if (search) {
      return searchColdGamesStmt.all({ limit, offset, search: `%${search}%` });
    }
    return getColdGamesStmt.all(limit, offset);
  },
  countColdGames: (search) => {
    if (search) {
      return countSearchColdGamesStmt.get({ search: `%${search}%` });
    }
    return countColdGamesStmt.get();
  },
  buildColdStorageStatsCache,
  getColdStorageStats: () => {
    try {
      const row = hotDb.prepare('SELECT data FROM cold_storage_stats_cache WHERE id = 1').get();
      if (row && row.data) {
        return JSON.parse(row.data);
      }
      return buildColdStorageStatsCache();
    } catch (err) {
      console.error("Deep stats error:", err);
      return buildColdStorageStatsCache();
    }
  },
  getGameById: {
    get: (id) => {
      const hotGame = getGameById.get(id);
      if (hotGame) return hotGame;
      return getColdGameById.get(id);
    }
  },
  getGameGaps,
  getLatestGameId,
  getBackfillJob,
  getActiveBackfillJob,
  createBackfillJob,
  updateBackfillJob,
  deleteBackfillJob,
  insertGameMetadata,
  getGameMetadata,
  getDatabaseStats: {
    get: (startDate) => {
      if (startDate) return getDatabaseStatsFiltered.get(startDate);
      return getDatabaseStats.get();
    }
  },
  getColdDatabaseStats: {
    get: () => {
      return getColdDatabaseStats.get();
    }
  },
  getGlobalMapStats: {
    all: (startDate) => {
      if (startDate) return getGlobalMapStatsFiltered.all(startDate);
      return getGlobalMapStats.all();
    }
  },
  getGlobalModeStats: {
    all: (startDate) => {
      if (startDate) return getGlobalModeStatsFiltered.all(startDate);
      return getGlobalModeStats.all();
    }
  },
  getGlobalActivityStats: {
    all: (startDate) => {
      if (startDate) return getGlobalActivityStatsFiltered.all(startDate);
      return getGlobalActivityStats.all();
    }
  },
  getAdminSetting,
  setAdminSetting,
  getGameCountsByDate,
  getMonthlyGameCounts,
  getPilotStats: {
    all: (startDate) => {
      if (startDate) return getPilotStatsFiltered.all({ startDate });
      return getPilotStats.all();
    }
  },
  getTopPlayedMaps,
  getRecentTopMaps,
  getMostActiveMaps,
  getMostActiveMaps,
  getMostActiveMaps,
  getDeadliestMaps,
  getMarathonMaps,
  getPilotDetailedStats,
  getGamesByPilot,
  countGamesByPilot,
  getServerActivityStats,
  getActiveServerIps: () => {
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
  },
  getActivePilotCount: {
    get: () => getActivePilotCount.get()
  },
  getAllTimePilotStats: {
    all: () => getPilotStatsAllTime().all()
  },
  getAllTimeMapStats: {
    all: () => getMapStatsAllTime().all()
  },
  getAllTimeGlobalStats: {
    get: () => getGlobalStatsAllTime().get()
  },
  getAllTimeGlobalKills: {
    get: () => getGlobalKillsAllTime().get()
  },

  insertGame: {
    run: (params) => {
      // Wrapper to route to saveGames logic
      const game = JSON.parse(params.details);
      return db.saveGames([game]);
    }
  },

  saveGames: (games) => {
    const ONE_YEAR_AGO = new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString();

    // Separate games into Hot and Cold
    const hotGames = [];
    const coldGames = [];

    for (const game of games) {
      const gameDate = game.date || game.start || new Date().toISOString();
      if (gameDate >= ONE_YEAR_AGO) {
        hotGames.push(game);
      } else {
        coldGames.push(game);
      }
    }

    // Transaction for Hot DB
    const insertMeta = hotDb.prepare(`
      INSERT OR REPLACE INTO game_metadata(game_id, fetch_status, fetch_attempts, last_fetch_at, error_message)
VALUES(?, ?, ?, ?, ?)
  `);

    const transactionHot = hotDb.transaction((gamesList) => {
      let changes = 0;
      for (const game of gamesList) {
        const result = upsertGameHot.run({
          id: game.id,
          date: game.date || game.start || new Date().toISOString(),
          ip: game.server?.ip || game.ip || null,
          details: JSON.stringify(game)
        });
        changes += result.changes;

        insertMeta.run(
          game.id,
          'fetched',
          1,
          new Date().toISOString(),
          null
        );
      }
      return changes;
    });

    // Transaction for Cold DB
    const transactionCold = coldDb.transaction((gamesList) => {
      let changes = 0;
      for (const game of gamesList) {
        upsertGameCold.run({
          id: game.id,
          date: game.date || game.start || new Date().toISOString(),
          ip: game.server?.ip || game.ip || null,
          details: JSON.stringify(game)
        });
        changes++;
      }
      return changes;
    });

    let totalChanges = 0;
    if (hotGames.length > 0) totalChanges += transactionHot(hotGames);
    if (coldGames.length > 0) totalChanges += transactionCold(coldGames);

    return totalChanges;
  },

  saveColdGamesBatch: (gamesList) => {
    const insertCold = coldDb.prepare(`
      INSERT INTO games (id, date, ip, details)
      VALUES (@id, @date, @ip, @details)
      ON CONFLICT(id) DO UPDATE SET
        details = excluded.details,
        date = excluded.date,
        ip = excluded.ip
    `);

    const transaction = coldDb.transaction((list) => {
      let changes = 0;
      for (const game of list) {
        insertCold.run({
          id: game.id,
          date: game.date || game.start || new Date().toISOString(),
          ip: game.ip || game.server?.ip || null,
          details: typeof game.details === 'string' ? game.details : JSON.stringify(game)
        });
        changes++;
      }
      return changes;
    });

    return transaction(gamesList);
  },

  updateGameDetails: (game) => {
    const ONE_YEAR_AGO = new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString();
    const gameDate = game.date || game.start || new Date().toISOString();

    // Determine target DB
    const targetDb = gameDate >= ONE_YEAR_AGO ? hotDb : coldDb;

    const update = targetDb.prepare(`
      UPDATE games 
      SET details = @details, date = @date, ip = @ip
      WHERE id = @id
  `);

    // Metadata only in Hot DB for now? Or both?
    // Let's keep metadata in Hot DB as it tracks fetch status
    const insertMeta = hotDb.prepare(`
      INSERT OR REPLACE INTO game_metadata(game_id, fetch_status, fetch_attempts, last_fetch_at, error_message)
VALUES(?, ?, ?, ?, ?)
  `);

    const transaction = targetDb.transaction(() => {
      const result = update.run({
        id: game.id,
        date: gameDate,
        ip: game.server?.ip || game.ip || null,
        details: JSON.stringify(game)
      });

      // Only update metadata if it's in Hot DB or we want to track it globally
      // For simplicity, we update metadata in Hot DB
      try {
        insertMeta.run(
          game.id,
          'fetched_detail',
          1,
          new Date().toISOString(),
          null
        );
      } catch (e) {
        // Ignore if metadata table doesn't exist in Cold DB (it doesn't)
      }
      return result;
    });
    return transaction();
  },

  // Maintenance: Move old games to cold storage
  moveGamesToColdStorage: () => {
    const ONE_YEAR_AGO = new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString();

    // 1. Find old games in Hot DB
    const oldGames = hotDb.prepare('SELECT * FROM games WHERE date < ?').all(ONE_YEAR_AGO);


    if (oldGames.length === 0) return 0;

    // 2. Insert into Cold DB
    const insertCold = coldDb.prepare(`
        INSERT OR IGNORE INTO games(id, date, ip, details)
VALUES(@id, @date, @ip, @details)
  `);

    const transactionCold = coldDb.transaction((games) => {
      for (const game of games) insertCold.run(game);
    });
    transactionCold(oldGames);

    // 3. Delete from Hot DB
    const deleteHot = hotDb.prepare('DELETE FROM games WHERE date < ?');
    const result = deleteHot.run(ONE_YEAR_AGO);

    return result.changes;
  },

  // PPI Framework
  refreshPilotStats: () => {
    // 1. Create Cache Table if not exists
    hotDb.exec(`
      CREATE TABLE IF NOT EXISTS pilot_stats_cache (
        name TEXT PRIMARY KEY,
        kills INTEGER,
        deaths INTEGER,
        assists INTEGER,
        suicides INTEGER DEFAULT 0,
        games INTEGER,
        time_played_seconds INTEGER,
        kd REAL,
        kda REAL,
        akdr REAL,
        kpm REAL,
        tce REAL,
        aci REAL,
        wins INTEGER DEFAULT 0,
        losses INTEGER DEFAULT 0,
        ties INTEGER DEFAULT 0,
        win_rate REAL DEFAULT 0,
        total_damage REAL DEFAULT 0,
        dpm REAL DEFAULT 0,
        flight_hours REAL DEFAULT 0,
        finisher_rating REAL,
        arsenal_entropy REAL,
        threat_centrality REAL DEFAULT 0,
        dominance_index REAL DEFAULT 0,
        last_updated TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure columns exist on older tables
    const extraCols = [
      'kd REAL',
      'kda REAL',
      'aci REAL',
      'suicides INTEGER DEFAULT 0',
      'wins INTEGER DEFAULT 0',
      'losses INTEGER DEFAULT 0',
      'ties INTEGER DEFAULT 0',
      'win_rate REAL DEFAULT 0',
      'total_damage REAL DEFAULT 0',
      'dpm REAL DEFAULT 0',
      'flight_hours REAL DEFAULT 0'
    ];
    for (const col of extraCols) {
      try {
        hotDb.exec(`ALTER TABLE pilot_stats_cache ADD COLUMN ${col}`);
      } catch (e) {
        // already exists
      }
    }

    try {
      // One row at a time: .all() would hold every hot and cold game in memory at once.
      const rows = hotDb.prepare(`
        SELECT details, date FROM games
        UNION ALL
        SELECT details, date FROM cold.games
      `).iterate();

      const pilotMap = {};
      const killGraph = {};
      const h2h = {};

      for (const row of rows) {
        if (!row.details) continue;
        let g;
        try {
          g = typeof row.details === 'string' ? JSON.parse(row.details) : row.details;
        } catch {
          continue;
        }

        const players = g.players || [];
        if (!Array.isArray(players) || players.length === 0) continue;

        const durationSec = durationOf(g);

        // Ranked filter: exclude <2 players and games under 60s or of unknown length
        if (players.length < 2 || durationSec < 60) continue;

        const result = winnerOf(g);

        for (let j = 0; j < players.length; j++) {
          const p = players[j];
          const key = pilotKey(p?.name);
          if (!key) continue;

          let pilot = pilotMap[key];
          if (!pilot) {
            pilot = pilotMap[key] = {
              name: p.name.trim(),
              games: 0,
              kills: 0,
              deaths: 0,
              assists: 0,
              suicides: 0,
              wins: 0,
              losses: 0,
              ties: 0,
              totalDamage: 0,
              playtimeSec: 0,
              lastSeen: row.date || g.end || g.date || null
            };
          }

          pilot.games++;
          pilot.kills += netKills(p);
          pilot.deaths += (p.deaths || 0);
          pilot.assists += (p.assists || 0);
          pilot.playtimeSec += durationSec;
          if (row.date && (!pilot.lastSeen || row.date > pilot.lastSeen)) {
            pilot.lastSeen = row.date;
            pilot.name = p.name.trim();
          }

          const outcome = outcomeOf(g, p, result);
          if (outcome) pilot[OUTCOME_FIELD[outcome]]++;
        }

        // Suicides from g.kills
        if (Array.isArray(g.kills)) {
          for (let j = 0; j < g.kills.length; j++) {
            const k = g.kills[j];
            const victim = pilotKey(k?.defender);
            if (victim && pilotKey(k.attacker) === victim && pilotMap[victim]) {
              pilotMap[victim].suicides++;
            }
          }
        }

        // Threat & Dominance Graph
        if (players.length === 2) {
          const [p1, p2] = players;
          const n1 = pilotKey(p1?.name);
          const n2 = pilotKey(p2?.name);
          if (n1 && n2) {
            // Victim transfers prestige to Killer (p2 was killed by p1; p1 was killed by p2)
            killGraph[n2] = killGraph[n2] || {};
            killGraph[n2][n1] = (killGraph[n2][n1] || 0) + netKills(p1);

            killGraph[n1] = killGraph[n1] || {};
            killGraph[n1][n2] = (killGraph[n1][n2] || 0) + netKills(p2);

            h2h[n1] = h2h[n1] || {};
            h2h[n1][n2] = h2h[n1][n2] || { wins: 0, losses: 0, ties: 0 };
            h2h[n2] = h2h[n2] || {};
            h2h[n2][n1] = h2h[n2][n1] || { wins: 0, losses: 0, ties: 0 };

            const outcome = pairOutcome(g, p1, p2, result);
            if (outcome) {
              h2h[n1][n2][OUTCOME_FIELD[outcome]]++;
              h2h[n2][n1][OUTCOME_FIELD[pairOutcome(g, p2, p1, result)]]++;
            }
          }
        } else if (players.length > 2) {
          const keys = players.map(p => pilotKey(p?.name));
          const totalDeathsOthers = {};
          keys.forEach(n => {
            if (!n) return;
            totalDeathsOthers[n] = players.reduce((sum, o, i) => (keys[i] && keys[i] !== n ? sum + (o.deaths || 0) : sum), 0);
          });
          for (let a = 0; a < players.length; a++) {
            const killer = players[a];
            const kName = keys[a];
            if (!kName) continue;
            for (let b = 0; b < players.length; b++) {
              const victim = players[b];
              const vName = keys[b];
              if (!vName) continue;
              if (kName === vName) continue;

              const killsWeight = totalDeathsOthers[kName] > 0
                ? netKills(killer) * ((victim.deaths || 0) / totalDeathsOthers[kName])
                : netKills(killer) / (players.length - 1);

              // Victim transfers prestige to Killer
              killGraph[vName] = killGraph[vName] || {};
              killGraph[vName][kName] = (killGraph[vName][kName] || 0) + killsWeight;

              h2h[kName] = h2h[kName] || {};
              h2h[kName][vName] = h2h[kName][vName] || { wins: 0, losses: 0, ties: 0 };
              if ((killer.kills || 0) > (victim.kills || 0)) h2h[kName][vName].wins++;
              else if ((victim.kills || 0) > (killer.kills || 0)) h2h[kName][vName].losses++;
              else h2h[kName][vName].ties = (h2h[kName][vName].ties || 0) + 1;
            }
          }
        }

        // Damage
        if (Array.isArray(g.damage)) {
          for (let j = 0; j < g.damage.length; j++) {
            const d = g.damage[j];
            if (!d || !d.damage || !d.attacker) continue;
            const aName = pilotKey(d.attacker);
            if (pilotMap[aName]) {
              pilotMap[aName].totalDamage += d.damage;
            }
          }
        }
      }

      // Dominance Index (opponents with >= 3 shared matches)
      const dominance = {};
      const pilotList = Object.keys(pilotMap);
      for (const p of pilotList) {
        const allOpponents = h2h[p] ? Object.keys(h2h[p]) : [];
        const qualifiedOpponents = allOpponents.filter(opp => {
          const rec = h2h[p][opp];
          const shared = (rec.wins || 0) + (rec.losses || 0) + (rec.ties || 0);
          return shared >= 3;
        });

        if (qualifiedOpponents.length === 0) {
          dominance[p] = 50.0;
        } else {
          let wonMatchups = 0;
          for (const opp of qualifiedOpponents) {
            const rec = h2h[p][opp];
            if (rec.wins > rec.losses) wonMatchups++;
            else if (rec.wins === rec.losses) wonMatchups += 0.5;
          }
          dominance[p] = Math.round((wonMatchups / qualifiedOpponents.length) * 1000) / 10;
        }
      }

      // Threat Centrality (Power Iteration PageRank: Slaying High-Threat Targets Transfers Prestige)
      const N = pilotList.length || 1;
      let scores = {};
      pilotList.forEach(p => scores[p] = 1 / N);
      const d = 0.85;

      for (let iter = 0; iter < 25; iter++) {
        let danglingWeight = 0;
        const nextScores = {};
        for (let i = 0; i < N; i++) {
          nextScores[pilotList[i]] = 0;
        }

        for (const victim of pilotList) {
          const killers = killGraph[victim];
          const totalDeaths = killers ? Object.values(killers).reduce((a, b) => a + b, 0) : 0;
          if (totalDeaths > 0) {
            const factor = (d * scores[victim]) / totalDeaths;
            for (const [killer, weight] of Object.entries(killers)) {
              nextScores[killer] += weight * factor;
            }
          } else {
            danglingWeight += scores[victim];
          }
        }

        const baseScore = ((1 - d) + d * danglingWeight) / N;
        for (let i = 0; i < N; i++) {
          nextScores[pilotList[i]] += baseScore;
        }
        scores = nextScores;
      }

      const maxScore = Math.max(...Object.values(scores), 0.0001);

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

      const insertRows = pilotList.map(key => {
        const p = pilotMap[key];
        const kills = p.kills;
        const deaths = p.deaths || 0;
        const assists = p.assists || 0;
        const suicides = p.suicides || 0;
        const games = p.games || 1;
        const timeSec = p.playtimeSec || 0;
        const flightMinutes = timeSec > 0 ? timeSec / 60 : 0;

        const kd = deaths > 0 ? Math.round((kills / deaths) * 100) / 100 : kills;
        const kda = deaths > 0 ? Math.round(((kills + assists * 0.5) / deaths) * 100) / 100 : kills;
        const akdr = deaths > 0 ? Math.round(((kills + assists * 0.33) / deaths) * 100) / 100 : kills;
        const kpm = flightMinutes > 0 ? Math.round((kills / flightMinutes) * 100) / 100 : 0;
        const tce = Math.round(((kills * 1.0) + (assists * 0.4) - (deaths * 1.0)) * 10) / 10;
        const aci = Math.round(((kills + assists * 0.5 - deaths) / games) * 100) / 100;

        const wins = p.wins || 0;
        const losses = p.losses || 0;
        const ties = p.ties || 0;
        const winRate = Math.round((wins / games) * 1000) / 10;

        const totalDamage = Math.round(p.totalDamage || 0);
        const dpm = flightMinutes > 0 ? Math.round(totalDamage / flightMinutes) : 0;
        const flightHours = Math.round((timeSec / 3600) * 10) / 10;

        const finisherRating = (kills + assists) > 0 ? Math.round((kills / (kills + assists)) * 100) / 100 : 0;
        const centrality = Math.round((scores[key] / maxScore) * 1000) / 10;
        const dom = dominance[key] !== undefined ? dominance[key] : 50.0;

        return {
          name: p.name,
          kills,
          deaths,
          assists,
          suicides,
          games,
          time_played_seconds: Math.round(timeSec),
          kd,
          kda,
          akdr,
          kpm,
          tce,
          aci,
          wins,
          losses,
          ties,
          win_rate: winRate,
          total_damage: totalDamage,
          dpm,
          flight_hours: flightHours,
          finisher_rating: finisherRating,
          arsenal_entropy: 0,
          threat_centrality: centrality,
          dominance_index: dom,
          last_updated: p.lastSeen || new Date().toISOString()
        };
      });

      // Rebuild from scratch so rows for spellings merged under one pilotKey go away.
      hotDb.transaction((rows) => {
        hotDb.prepare('DELETE FROM pilot_stats_cache').run();
        for (const row of rows) insertStmt.run(row);
      })(insertRows);

      console.log(`[PPI] Successfully refreshed ${insertRows.length} pilots with full telemetry & graph metrics.`);
      buildColdStorageStatsCache();
      buildMapStatsCache();
    } catch (err) {
      console.error("Failed to refresh PPI stats", err);
    }
  },

  hasPilotStatsCache: () => {
    try {
      const row = hotDb.prepare('SELECT COUNT(*) as count FROM pilot_stats_cache').get();
      return Boolean(row && row.count > 0);
    } catch {
      return false;
    }
  },

  getPilotPPI: (name) => {
    try {
      const stmt = hotDb.prepare('SELECT * FROM pilot_stats_cache WHERE name = ? COLLATE NOCASE');
      let data = stmt.get(name);
      return data || null;
    } catch (err) {
      return null;
    }
  },

  getPilotBreakdown: (name) => {
    try {
      const pattern = pilotLikePattern(name);
      const key = pilotKey(name);
      // Query hot games (instant)
      let allRows = hotDb.prepare(`
        SELECT details FROM games WHERE details LIKE @pattern ESCAPE '\\'
      `).all({ pattern });

      // Fallback to cold games only if hot games have very few matches (e.g. historical pilot)
      if (!allRows || allRows.length < 5) {
        const coldRows = hotDb.prepare(`
          SELECT details FROM cold.games WHERE details LIKE @pattern ESCAPE '\\'
        `).all({ pattern });
        allRows = (allRows || []).concat(coldRows);
      }

      const mapMap = new Map();
      const rivalMap = new Map();

      for (let i = 0; i < allRows.length; i++) {
        let g;
        try {
          g = typeof allRows[i].details === 'string' ? JSON.parse(allRows[i].details) : allRows[i].details;
        } catch {
          continue;
        }
        const players = g.players || [];
        const me = players.find(p => pilotKey(p?.name) === key);
        if (!me) continue;

        const map = g.settings?.level;
        if (map) {
          let m = mapMap.get(map);
          if (!m) {
            m = { map, games: 0, kills: 0, deaths: 0, assists: 0 };
            mapMap.set(map, m);
          }
          m.games++;
          m.kills += netKills(me);
          m.deaths += (me.deaths || 0);
          m.assists += (me.assists || 0);
        }

        const result = winnerOf(g);

        for (let j = 0; j < players.length; j++) {
          const other = players[j];
          const otherKey = pilotKey(other?.name);
          if (!otherKey || otherKey === key) continue;
          let r = rivalMap.get(otherKey);
          if (!r) {
            r = {
              name: other.name,
              encounters: 0,
              your_kills: 0,
              their_kills: 0,
              your_wins: 0,
              their_wins: 0,
              ties: 0,
              their_deaths: 0
            };
            rivalMap.set(otherKey, r);
          }
          r.encounters++;
          r.their_deaths += (other.deaths || 0);

          const outcome = pairOutcome(g, me, other, result);
          if (outcome === 'win') r.your_wins++;
          else if (outcome === 'loss') r.their_wins++;
          else if (outcome === 'tie') r.ties++;
        }

        // Direct kills exchanged between me and rivals
        if (Array.isArray(g.kills)) {
          for (const k of g.kills) {
            if (!k || !k.attacker || !k.defender) continue;
            const att = pilotKey(k.attacker);
            const def = pilotKey(k.defender);
            if (att === key && def !== key) {
              const r = rivalMap.get(def);
              if (r) r.your_kills++;
            } else if (def === key && att !== key) {
              const r = rivalMap.get(att);
              if (r) r.their_kills++;
            }
          }
        }
      }

      const mapStats = Array.from(mapMap.values())
        .sort((a, b) => b.games - a.games)
        .slice(0, 6)
        .map(m => ({
          ...m,
          kd: m.kills / Math.max(1, m.deaths)
        }));

      const getRivalStatsStmt = hotDb.prepare(`
        SELECT kd, kda, win_rate, flight_hours, threat_centrality, dominance_index
        FROM pilot_stats_cache
        WHERE name = ? COLLATE NOCASE
      `);

      const rivals = Array.from(rivalMap.values())
        .sort((a, b) => b.encounters - a.encounters)
        .slice(0, 9)
        .map(r => {
          let s = null;
          try {
            s = getRivalStatsStmt.get(r.name);
          } catch {}
          return {
            ...r,
            h2h_kd: r.their_kills > 0 ? Math.round((r.your_kills / r.their_kills) * 100) / 100 : r.your_kills,
            their_kd: r.their_kills > 0 ? Math.round((r.their_kills / Math.max(1, r.your_kills)) * 100) / 100 : 0,
            kd: s?.kd ?? (r.their_deaths > 0 ? Math.round((r.their_kills / r.their_deaths) * 100) / 100 : 1.0),
            kda: s?.kda ?? (s?.kd ?? 1.0),
            win_rate: s?.win_rate ?? 0,
            flight_hours: s?.flight_hours ?? 0,
            threat_centrality: s?.threat_centrality ?? 0,
            dominance_index: s?.dominance_index ?? 0
          };
        });

      return { mapStats, rivals };
    } catch (err) {
      console.error("Failed to get pilot breakdown", err);
      return { mapStats: [], rivals: [] };
    }
  },

  updateDeepMetrics: (updates) => {
    const stmt = hotDb.prepare(`
          UPDATE pilot_stats_cache 
          SET threat_centrality = @centrality, dominance_index = @dominance 
          WHERE name = @name
      `);
    const updateMany = hotDb.transaction((rows) => {
      for (const row of rows) stmt.run(row);
    });
    updateMany(updates);
  },
  getSummaryGames: {
    all: (afterId, limit) => getSummaryGames.all(afterId, limit)
  },

  // Map Database Operations
  mapsDir,
  mapImagesDir,

  seedStockMaps: () => {
    seedStockMaps();
  },

  buildMapStatsCache: () => {
    return buildMapStatsCache();
  },

  countMapStatsCache: () => {
    try {
      return hotDb.prepare('SELECT COUNT(*) as count FROM map_stats_cache').get().count;
    } catch {
      return 0;
    }
  },

  getTopPlayedMapsFromCache: (limit = 10) => {
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
  },

  getDeadliestMapsFromCache: (limit = 10) => {
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
  },

  getRecentTopMapsFromCache: (limit = 10) => {
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
  },

  getMaps: ({ search, size, type, limit = 500, offset = 0, sortBy = 'popularity' } = {}) => {
    let sql = `
      SELECT 
        m.*,
        COALESCE(s.total_matches, 0) as total_matches,
        COALESCE(s.total_kills, 0) as total_kills,
        COALESCE(s.total_deaths, 0) as total_deaths,
        COALESCE(s.total_damage, 0) as total_damage,
        COALESCE(s.avg_players, 0) as avg_players,
        COALESCE(s.recent_30d_matches, 0) as recent_30d_matches,
        s.first_played,
        s.last_played,
        s.top_pilot,
        s.record_match
      FROM maps m
      LEFT JOIN map_stats_cache s ON LOWER(m.name) = LOWER(s.map_name)
      WHERE 1=1
    `;
    const params = {};
    if (search && search.trim()) {
      sql += ' AND (m.name LIKE @search OR m.author LIKE @search)';
      params.search = `%${search.trim()}%`;
    }
    if (size && size !== 'all') {
      sql += ' AND m.size = @size';
      params.size = size.toLowerCase();
    }
    if (type === 'stock') {
      sql += ' AND m.is_custom = 0';
    } else if (type === 'custom') {
      sql += ' AND m.is_custom = 1';
    }

    if (sortBy === 'popularity' || sortBy === 'sorties') {
      sql += ' ORDER BY COALESCE(s.total_matches, 0) DESC, m.name ASC';
    } else if (sortBy === 'deadliest' || sortBy === 'kills') {
      sql += ' ORDER BY COALESCE(s.total_kills, 0) DESC, m.name ASC';
    } else if (sortBy === 'recent') {
      sql += ' ORDER BY COALESCE(s.last_played, "") DESC, m.name ASC';
    } else if (sortBy === 'downloads') {
      sql += ' ORDER BY m.downloads DESC, m.name ASC';
    } else if (sortBy === 'date') {
      sql += ' ORDER BY m.release_date DESC, m.name ASC';
    } else {
      sql += ' ORDER BY m.name COLLATE NOCASE ASC';
    }
    sql += ' LIMIT @limit OFFSET @offset';
    params.limit = limit;
    params.offset = offset;
    return hotDb.prepare(sql).all(params);
  },

  countMaps: ({ search, size, type } = {}) => {
    let sql = 'SELECT COUNT(*) as count FROM maps m WHERE 1=1';
    const params = {};
    if (search && search.trim()) {
      sql += ' AND (m.name LIKE @search OR m.author LIKE @search)';
      params.search = `%${search.trim()}%`;
    }
    if (size && size !== 'all') {
      sql += ' AND m.size = @size';
      params.size = size.toLowerCase();
    }
    if (type === 'stock') {
      sql += ' AND m.is_custom = 0';
    } else if (type === 'custom') {
      sql += ' AND m.is_custom = 1';
    }
    return hotDb.prepare(sql).get(params).count;
  },

  getMapIntel: (idOrName) => {
    let sql;
    let param;
    if (typeof idOrName === 'number' || /^\d+$/.test(idOrName)) {
      sql = `
        SELECT 
          m.*,
          s.total_matches, s.total_kills, s.total_deaths, s.total_damage,
          s.avg_players, s.recent_30d_matches, s.first_played, s.last_played,
          s.modes, s.top_pilot, s.top_pilots, s.record_match
        FROM maps m
        LEFT JOIN map_stats_cache s ON LOWER(m.name) = LOWER(s.map_name)
        WHERE m.id = ?
      `;
      param = parseInt(idOrName, 10);
    } else {
      sql = `
        SELECT 
          m.*,
          s.total_matches, s.total_kills, s.total_deaths, s.total_damage,
          s.avg_players, s.recent_30d_matches, s.first_played, s.last_played,
          s.modes, s.top_pilot, s.top_pilots, s.record_match
        FROM maps m
        LEFT JOIN map_stats_cache s ON LOWER(m.name) = LOWER(s.map_name)
        WHERE LOWER(m.name) = LOWER(?)
      `;
      param = String(idOrName).trim();
    }

    let map = hotDb.prepare(sql).get(param);
    if (!map) {
      const statsOnly = hotDb.prepare('SELECT * FROM map_stats_cache WHERE LOWER(map_name) = LOWER(?)').get(param);
      if (statsOnly) {
        map = {
          id: 0,
          name: statsOnly.map_name,
          author: 'Unknown',
          size: 'medium',
          max_players: 8,
          best_team_size: 4,
          supports_ctf: 0,
          style: 'mixed',
          is_custom: 1,
          total_matches: statsOnly.total_matches,
          total_kills: statsOnly.total_kills,
          total_deaths: statsOnly.total_deaths,
          total_damage: statsOnly.total_damage,
          avg_players: statsOnly.avg_players,
          recent_30d_matches: statsOnly.recent_30d_matches,
          first_played: statsOnly.first_played,
          last_played: statsOnly.last_played,
          modes: statsOnly.modes,
          top_pilot: statsOnly.top_pilot,
          top_pilots: statsOnly.top_pilots,
          record_match: statsOnly.record_match
        };
      }
    }

    if (!map) return null;

    return {
      id: map.id,
      name: map.name,
      author: map.author,
      size: map.size,
      maxPlayers: map.max_players,
      bestTeamSize: map.best_team_size,
      supportsCTF: !!map.supports_ctf,
      style: map.style,
      date: map.release_date || '',
      image: map.id ? `/api/maps/${map.id}/image` : null,
      downloadLink: map.id ? `/api/maps/${map.id}/download` : null,
      downloads: map.downloads || 0,
      fileSize: map.file_size || 0,
      isCustom: !!map.is_custom,
      isStock: !map.is_custom && (map.author?.toLowerCase().includes('revival') || false),
      sorties: map.total_matches || 0,
      totalKills: map.total_kills || 0,
      totalDeaths: map.total_deaths || 0,
      totalDamage: map.total_damage || 0,
      avgPlayers: map.avg_players || 0,
      recent30d: map.recent_30d_matches || 0,
      firstPlayed: map.first_played || null,
      lastPlayed: map.last_played || null,
      modes: map.modes ? (typeof map.modes === 'string' ? JSON.parse(map.modes) : map.modes) : {},
      topPilot: map.top_pilot ? (typeof map.top_pilot === 'string' ? JSON.parse(map.top_pilot) : map.top_pilot) : null,
      topPilots: map.top_pilots ? (typeof map.top_pilots === 'string' ? JSON.parse(map.top_pilots) : map.top_pilots) : [],
      recordMatch: map.record_match ? (typeof map.record_match === 'string' ? JSON.parse(map.record_match) : map.record_match) : null
    };
  },

  getMapById: (id) => {
    return hotDb.prepare('SELECT * FROM maps WHERE id = ?').get(id);
  },

  getMapByName: (name) => {
    return hotDb.prepare('SELECT * FROM maps WHERE LOWER(name) = LOWER(?)').get(name);
  },

  upsertMap: (mapData) => {
    const stmt = hotDb.prepare(`
      INSERT INTO maps (
        name, author, size, max_players, best_team_size, supports_ctf, style,
        release_date, remote_url, remote_image_url, local_file, local_image,
        file_size, is_custom, updated_at
      ) VALUES (
        @name, @author, @size, @max_players, @best_team_size, @supports_ctf, @style,
        @release_date, @remote_url, @remote_image_url, @local_file, @local_image,
        @file_size, @is_custom, CURRENT_TIMESTAMP
      )
      ON CONFLICT(name) DO UPDATE SET
        author = CASE 
          WHEN excluded.author IS NOT NULL AND excluded.author != 'Unknown' THEN excluded.author 
          ELSE COALESCE(maps.author, excluded.author) 
        END,
        size = COALESCE(excluded.size, maps.size),
        max_players = CASE WHEN excluded.max_players > 0 THEN excluded.max_players ELSE maps.max_players END,
        best_team_size = CASE WHEN excluded.best_team_size > 0 THEN excluded.best_team_size ELSE maps.best_team_size END,
        supports_ctf = COALESCE(excluded.supports_ctf, maps.supports_ctf),
        style = COALESCE(excluded.style, maps.style),
        release_date = COALESCE(excluded.release_date, maps.release_date),
        remote_url = COALESCE(excluded.remote_url, maps.remote_url),
        remote_image_url = COALESCE(excluded.remote_image_url, maps.remote_image_url),
        file_size = CASE WHEN excluded.file_size > 0 THEN excluded.file_size ELSE maps.file_size END,
        is_custom = excluded.is_custom,
        updated_at = CURRENT_TIMESTAMP
    `);
    return stmt.run({
      name: mapData.name,
      author: mapData.author || 'Unknown',
      size: mapData.size || 'medium',
      max_players: mapData.max_players || 8,
      best_team_size: mapData.best_team_size || 4,
      supports_ctf: mapData.supports_ctf ? 1 : 0,
      style: mapData.style || 'mixed',
      release_date: mapData.release_date || null,
      remote_url: mapData.remote_url || null,
      remote_image_url: mapData.remote_image_url || null,
      local_file: mapData.local_file || null,
      local_image: mapData.local_image || null,
      file_size: mapData.file_size || 0,
      is_custom: mapData.is_custom ? 1 : 0
    });
  },

  incrementMapDownloads: (id) => {
    return hotDb.prepare('UPDATE maps SET downloads = downloads + 1 WHERE id = ?').run(id);
  },

  updateMapLocalPaths: (id, localFile, localImage) => {
    return hotDb.prepare(`
      UPDATE maps 
      SET local_file = COALESCE(?, local_file),
          local_image = COALESCE(?, local_image)
      WHERE id = ?
    `).run(localFile, localImage, id);
  },

  deleteMap: (id) => {
    return hotDb.prepare('DELETE FROM maps WHERE id = ?').run(id);
  },

  getGamesForDate: (dateStr) => {
    const bounds = utcDayBounds(dateStr);
    return bounds ? getGamesInDay.all(...bounds) : [];
  },

  getAllCachedPilotStats: () => {
    return hotDb.prepare(`
      SELECT name, kd, kda, win_rate, threat_centrality, dominance_index 
      FROM pilot_stats_cache
    `).all();
  },

  isPilotFirstSeenOnDate: (pilotName, dateStr) => {
    try {
      const checkRow = hotDb.prepare(`
        SELECT first_seen FROM pilot_first_seen WHERE name = ? COLLATE NOCASE
      `).get(pilotName);
      // A sighting before dateStr settles it. Anything else may be a value
      // cached before this check read cold storage, so look again.
      if (checkRow?.first_seen && checkRow.first_seen < dateStr) {
        return false;
      }

      const minRow = hotDb.prepare(`
        SELECT MIN(date) as first_seen FROM (
          SELECT date, details FROM games WHERE details LIKE @pattern ESCAPE '\\'
          UNION ALL
          SELECT date, details FROM cold.games WHERE details LIKE @pattern ESCAPE '\\'
        )
        WHERE EXISTS (
          SELECT 1 FROM json_each(details, '$.players')
          WHERE pilot_key(json_extract(value, '$.name')) = @key
        )
      `).get({ pattern: pilotLikePattern(pilotName), key: pilotKey(pilotName) });

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
  },

  getQualifyingFightNightDates: (thresholds = { minMatches: 16, minPilots: 14, minFrags: 1600 }) => {
    const minMatches = thresholds.minMatches || 16;
    const minPilots = thresholds.minPilots || 14;
    const minFrags = thresholds.minFrags || 1600;

    const dayRows = hotDb.prepare(`
      SELECT substr(date, 1, 10) as day, COUNT(*) as match_count
      FROM games
      WHERE date > date('now', '-365 days')
      GROUP BY substr(date, 1, 10)
      HAVING match_count >= ?
      ORDER BY day DESC
    `).all(minMatches);

    const qualifying = [];
    for (const row of dayRows) {
      const dayMatches = getGamesInDay.all(...utcDayBounds(row.day));

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
  },

  getFightNightRecaps: (limit = 20) => {
    try {
      const rows = hotDb.prepare(`
        SELECT date, data, created_at FROM fight_night_recaps ORDER BY date DESC LIMIT ?
      `).all(limit);
      return rows.map(r => ({
        date: r.date,
        created_at: r.created_at,
        ...JSON.parse(r.data)
      }));
    } catch (e) {
      console.error("Failed to get fight night recaps", e);
      return [];
    }
  },

  getFightNightRecapByDate: (date) => {
    try {
      const row = hotDb.prepare(`
        SELECT date, data, created_at FROM fight_night_recaps WHERE date = ?
      `).get(date);
      if (!row) return null;
      return {
        date: row.date,
        created_at: row.created_at,
        ...JSON.parse(row.data)
      };
    } catch (e) {
      console.error("Failed to get fight night recap by date", e);
      return null;
    }
  },

  saveFightNightRecap: (date, data) => {
    try {
      const stmt = hotDb.prepare(`
        INSERT INTO fight_night_recaps (date, data) 
        VALUES (@date, @data) 
        ON CONFLICT(date) DO UPDATE SET data = excluded.data, created_at = CURRENT_TIMESTAMP
      `);
      return stmt.run({
        date,
        data: typeof data === 'string' ? data : JSON.stringify(data)
      });
    } catch (e) {
      console.error("Failed to save fight night recap", e);
      return null;
    }
  },

  getPilotTelemetry,
  normalizeWeaponName,
  PRIMARY_WEAPONS,
  SECONDARY_WEAPONS
};

export default db;
