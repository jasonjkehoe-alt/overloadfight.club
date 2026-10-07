import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Worker } from 'worker_threads';
import { OUTCOME_FIELD, durationOf, netKills, outcomeOf, pairOutcome, pilotKey, playerRows, winnerOf } from './lib/gameParse.js';

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

// [start, end) of a UTC month ('YYYY-MM') for `date >= ? AND date < ?`,
// which can use idx_games_date. null when monthStr is not 'YYYY-MM'.
function utcMonthBounds(monthStr) {
  if (!/^\d{4}-\d{2}$/.test(monthStr)) return null;
  const [yearStr, monthStrNum] = monthStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStrNum, 10);
  if (month < 1 || month > 12) return null;
  const start = `${monthStr}-01`;
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const end = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
  return [start, end];
}

// Use a dedicated data directory to avoid Docker volume mounting over source code
const dataDir = process.env.DATA_DIR || path.join(__dirname, '../data');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const backupsDir = path.join(dataDir, 'backups');
export const mapsDir = path.join(dataDir, 'maps');
export const mapImagesDir = path.join(dataDir, 'map_images');
if (!fs.existsSync(mapsDir)) fs.mkdirSync(mapsDir, { recursive: true });
if (!fs.existsSync(mapImagesDir)) fs.mkdirSync(mapImagesDir, { recursive: true });

const dbPath = path.join(dataDir, 'tracker.db');
const coldDbPath = path.join(dataDir, 'cold_storage.db');

// The Docker image runs as uid 1000. Files left by an older image that ran as
// root are read-only to it, and SQLite would fail later with a less clear error.
for (const file of [dataDir, dbPath, coldDbPath]) {
  try {
    fs.accessSync(file, fs.constants.W_OK);
  } catch (err) {
    if (err.code === 'ENOENT') continue;
    console.error(`Refusing to start: ${file} is not writable by uid ${process.getuid?.()}. On the host, chown the data folder to 1000:1000 (see DEPLOYMENT.md).`);
    process.exit(1);
  }
}

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

// game_players: one row per pilot per game, kept beside games in the same file
// (hot and cold), so pilot pages and the leaderboard search an index instead of
// every JSON blob. games.details stays the source of truth: every writer below
// rebuilds a game's rows from it, in the transaction that writes the game.
const GAME_PLAYERS_COLUMNS = 'game_id, date, name, team, kills, deaths, assists, suicides, damage, mode, map';
const GAME_PLAYERS_SCHEMA = `
  CREATE TABLE IF NOT EXISTS game_players (
    game_id INTEGER NOT NULL,
    date TEXT,
    name TEXT NOT NULL COLLATE NOCASE,
    team TEXT,
    kills INTEGER,
    deaths INTEGER,
    assists INTEGER,
    suicides INTEGER,
    damage REAL,
    mode TEXT,
    map TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_game_players_name_date ON game_players(name, date, game_id);
  CREATE INDEX IF NOT EXISTS idx_game_players_date ON game_players(date);
  CREATE INDEX IF NOT EXISTS idx_game_players_game ON game_players(game_id);
`;
// PRAGMA user_version once a file's game_players has been backfilled.
const GAME_PLAYERS_VERSION = 1;

// Create game_players if it is missing. A missing table needs a backfill
// whatever user_version says: dropping the table is how S5 is rolled back.
function ensureGamePlayersTable(conn) {
  const exists = conn.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'game_players'").get();
  if (!exists) conn.pragma('user_version = 0');
  conn.exec(GAME_PLAYERS_SCHEMA);
}

function gamePlayersWriter(conn) {
  ensureGamePlayersTable(conn);
  const remove = conn.prepare('DELETE FROM game_players WHERE game_id = ?');
  const insert = conn.prepare(`
    INSERT INTO game_players (${GAME_PLAYERS_COLUMNS})
    VALUES (@game_id, @date, @name, @team, @kills, @deaths, @assists, @suicides, @damage, @mode, @map)
  `);
  // Replace one game's rows and return how many it has. Call inside the
  // transaction that writes the game.
  return (gameId, date, game) => {
    remove.run(gameId);
    const rows = playerRows(game);
    for (const row of rows) insert.run({ game_id: gameId, date, ...row });
    return rows.length;
  };
}
const writeHotPlayers = gamePlayersWriter(hotDb);
const writeColdPlayers = gamePlayersWriter(coldDb);

// Bring one file's game_players in line with its games. Below GAME_PLAYERS_VERSION
// (user_version) it empties the table and backfills every game in id order, 1,000
// per transaction, so a run cut short is redone whole. At the version it repairs
// what a writer that bypassed game_players (a script, an older image after a
// rollback) left behind: rows of games that are gone, and games with no rows.
// A game with no named players has no rows, so the repair re-reads it each start.
function syncGamePlayers(conn, writePlayers, label) {
  const started = performance.now();
  const backfill = conn.pragma('user_version', { simple: true }) < GAME_PLAYERS_VERSION;
  const orphaned = backfill
    ? conn.prepare('DELETE FROM game_players').run().changes
    : conn.prepare('DELETE FROM game_players WHERE game_id NOT IN (SELECT id FROM games)').run().changes;
  const page = conn.prepare(`
    SELECT id, date, details FROM games
    WHERE id > ? ${backfill ? '' : 'AND id NOT IN (SELECT game_id FROM game_players)'}
    ORDER BY id LIMIT 1000
  `);
  // Returns how many of the games got rows.
  const writeRows = conn.transaction(rows => {
    let written = 0;
    for (const row of rows) {
      let game;
      try {
        game = JSON.parse(row.details);
      } catch {
        continue;
      }
      if (writePlayers(row.id, row.date, game) > 0) written++;
    }
    return written;
  });

  let games = 0;
  let afterId = Number.MIN_SAFE_INTEGER;
  for (let rows = page.all(afterId); rows.length > 0; rows = page.all(afterId)) {
    games += writeRows(rows);
    afterId = rows[rows.length - 1].id;
  }

  const seconds = ((performance.now() - started) / 1000).toFixed(1);
  if (backfill) {
    conn.pragma(`user_version = ${GAME_PLAYERS_VERSION}`);
    console.log(`[game_players] Backfilled ${label} storage: ${games} games with players in ${seconds}s.`);
  } else if (orphaned || games) {
    console.log(`[game_players] Repaired ${label} storage: removed ${orphaned} orphaned rows, added rows for ${games} games in ${seconds}s.`);
  }
}

function migrateGamePlayers() {
  syncGamePlayers(coldDb, writeColdPlayers, 'cold');
  syncGamePlayers(hotDb, writeHotPlayers, 'hot');
}
migrateGamePlayers();

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
const countColdGamesInMonthStmt = coldDb.prepare(`
    SELECT COUNT(*) as count FROM games
    WHERE date >= ? AND date < ?
`);

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

// A pilot's games in one file: the ids from game_players through
// idx_game_players_name_date, then the details by primary key. game_players
// stores names trimmed, and the NOCASE column ignores ASCII case.
const pilotGamesSql = (schema, since = '') => `
    SELECT details, date FROM ${schema}.games
    WHERE id IN (SELECT game_id FROM ${schema}.game_players WHERE name = TRIM(@name) ${since})
    ORDER BY date DESC
`;
const pilotGamesHot = hotDb.prepare(pilotGamesSql('main'));
const pilotGamesHotSince = hotDb.prepare(pilotGamesSql('main', 'AND date >= @startDate'));
const pilotGamesCold = hotDb.prepare(pilotGamesSql('cold'));

// Hot games for a pilot, plus cold ones when hot holds fewer than 5.
function pilotGamesHotFirst(name) {
    const hotAll = pilotGamesHot.all({ name });
    return hotAll.length >= 5 ? hotAll : hotAll.concat(pilotGamesCold.all({ name }));
}

function getPilotTelemetry(name, startDate, matchMode) {
    try {
        const cached = hotDb.prepare('SELECT * FROM pilot_stats_cache WHERE name = ? COLLATE NOCASE').get(name);

        const key = pilotKey(name);
        const gameRows = startDate
            ? pilotGamesHotSince.all({ name, startDate })
            : pilotGamesHotFirst(name);

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

const getGamesByPilot = hotDb.prepare(`
    SELECT CASE WHEN p.cold THEN c.details ELSE h.details END AS details
    FROM (${pilotGameIdsSql} ORDER BY date DESC LIMIT @limit OFFSET @offset) p
    LEFT JOIN games h ON NOT p.cold AND h.id = p.game_id
    LEFT JOIN cold.games c ON p.cold AND c.id = p.game_id
    ORDER BY p.date DESC
`);

const countGamesByPilot = hotDb.prepare(`SELECT COUNT(*) as count FROM (${pilotGameIdsSql})`);

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

// saveGames upsert. A gamelist summary carries an empty kill log, so it does not
// replace stored details that have one (a hydrated or archive game). Returns the
// details now stored, which game_players is built from.
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
  RETURNING details
`;
const upsertGameHot = hotDb.prepare(upsertGameSql);
const upsertGameCold = coldDb.prepare(upsertGameSql);

// A pilot's first game in either file, read from idx_game_players_name_date.
const getPilotFirstSeen = hotDb.prepare(`
  SELECT MIN(first_seen) as first_seen FROM (
    SELECT MIN(date) as first_seen FROM game_players WHERE name = TRIM(@name)
    UNION ALL
    SELECT MIN(date) as first_seen FROM cold.game_players WHERE name = TRIM(@name)
  )
`);

// Hot games in one UTC day; bind utcDayBounds().
const getGamesInDay = hotDb.prepare(`
  SELECT id, date, details FROM games
  WHERE date >= ? AND date < ?
  ORDER BY date ASC
`);

// Rebuild pilot_stats_cache, the archive stats and map_stats_cache from one
// pass over every stored game in server/statsWorker.js. Concurrent calls share
// the run in progress. Never rejects: a failure is logged and the old caches stay.
let refreshing = null;
// The stats worker while a refresh runs, so close() can stop it first.
let statsWorker = null;
const refreshPilotStats = () => {
  refreshing ??= refreshCaches().finally(() => {
    refreshing = null;
  });
  return refreshing;
};

const runStatsWorker = () => new Promise((resolve, reject) => {
  const worker = new Worker(new URL('./statsWorker.js', import.meta.url), {
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
    statsWorker = null;
    reject(new Error(`stats worker exited with code ${code}`));
  });
});

async function refreshCaches() {
  try {
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

    const started = performance.now();
    const { errors, pilots, archive, maps } = await runStatsWorker();
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
    console.log(`[StatsWorker] Full pass finished in ${((performance.now() - started) / 1000).toFixed(2)}s.`);
  } catch (err) {
    console.error("Failed to refresh PPI stats", err);
  }
}

const db = {
  // Copy and replace tracker.db through SQLite's backup API. Under WAL a raw file copy
  // can miss commits still in tracker.db-wal, or be replayed against that stale WAL.
  backupHot: destination => hotDb.backup(destination),
  backupCold: destination => coldDb.backup(destination),
  restoreHot: async source => {
    const uploaded = new Database(source, { readonly: true, fileMustExist: true });
    try {
      await uploaded.backup(dbPath);
    } finally {
      uploaded.close();
    }
    // A backup from before S5 has no game_players; build it for the restored games.
    ensureGamePlayersTable(hotDb);
    migrateGamePlayers();
  },
  migrateGamePlayers,

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
  countColdGamesInMonth: (monthStr) => {
    const bounds = utcMonthBounds(monthStr);
    if (!bounds) return 0;
    const row = countColdGamesInMonthStmt.get(bounds[0], bounds[1]);
    return row ? row.count : 0;
  },
  // Built by refreshPilotStats; the first call before any refresh waits for one.
  getColdStorageStats: async () => {
    const read = () => {
      const row = hotDb.prepare('SELECT data FROM cold_storage_stats_cache WHERE id = 1').get();
      return row?.data ? JSON.parse(row.data) : null;
    };
    const cached = read();
    if (cached) return cached;
    await refreshPilotStats();
    return read();
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

    // Upsert one game and rebuild its game_players rows from the details kept.
    const saveOne = (upsert, writePlayers, game) => {
      const row = {
        id: game.id,
        date: game.date || game.start || new Date().toISOString(),
        ip: game.server?.ip || game.ip || null,
        details: JSON.stringify(game)
      };
      const stored = upsert.get(row).details;
      writePlayers(row.id, row.date, stored === row.details ? game : JSON.parse(stored));
    };

    const transactionHot = hotDb.transaction((gamesList) => {
      let changes = 0;
      for (const game of gamesList) {
        saveOne(upsertGameHot, writeHotPlayers, game);
        changes++;

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
        saveOne(upsertGameCold, writeColdPlayers, game);
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
    const transaction = coldDb.transaction((list) => {
      let changes = 0;
      for (const game of list) {
        const date = game.date || game.start || new Date().toISOString();
        const details = typeof game.details === 'string' ? game.details : JSON.stringify(game);
        // The upsert keeps a stored kill log over an empty one; build rows from what it kept.
        const stored = upsertGameCold.get({ id: game.id, date, ip: game.ip || game.server?.ip || null, details }).details;
        writeColdPlayers(game.id, date, JSON.parse(stored));
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
    const isHot = gameDate >= ONE_YEAR_AGO;
    const targetDb = isHot ? hotDb : coldDb;
    const writePlayers = isHot ? writeHotPlayers : writeColdPlayers;

    const update = targetDb.prepare(`
      UPDATE games 
      SET details = CASE
        WHEN COALESCE(json_array_length(@details, '$.kills'), 0) = 0
          AND COALESCE(json_array_length(games.details, '$.kills'), 0) > 0
        THEN games.details
        ELSE @details
      END,
      date = @date,
      ip = @ip
      WHERE id = @id
      RETURNING details
  `);

    // Metadata only in Hot DB for now? Or both?
    // Let's keep metadata in Hot DB as it tracks fetch status
    const insertMeta = hotDb.prepare(`
      INSERT OR REPLACE INTO game_metadata(game_id, fetch_status, fetch_attempts, last_fetch_at, error_message)
VALUES(?, ?, ?, ?, ?)
  `);

    const transaction = targetDb.transaction(() => {
      const kept = update.get({
        id: game.id,
        date: gameDate,
        ip: game.server?.ip || game.ip || null,
        details: JSON.stringify(game)
      });
      if (kept) writePlayers(game.id, gameDate, JSON.parse(kept.details));

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
      return { changes: kept ? 1 : 0 };
    });
    return transaction();
  },

  // Maintenance: Move old games to cold storage
  // Two transactions, in this order, run back to back with nothing in between on
  // this connection: copy the games and their game_players rows into cold storage,
  // then delete from hot only the games cold storage now holds. Under WAL a commit
  // that spans both files is atomic per file only, so a crash could keep one
  // half; this order leaves a duplicate at worst, which the next run removes, and
  // never a game in neither file.
  moveGamesToColdStorage: () => {
    const ONE_YEAR_AGO = new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString();

    hotDb.transaction(() => {
      // A game cold storage already has keeps its cold copy and rows.
      hotDb.prepare(`
        INSERT INTO cold.game_players (${GAME_PLAYERS_COLUMNS})
        SELECT ${GAME_PLAYERS_COLUMNS} FROM main.game_players
        WHERE game_id IN (SELECT id FROM main.games WHERE date < ? AND id NOT IN (SELECT id FROM cold.games))
      `).run(ONE_YEAR_AGO);
      hotDb.prepare(`
        INSERT OR IGNORE INTO cold.games (id, date, ip, details)
        SELECT id, date, ip, details FROM main.games WHERE date < ?
      `).run(ONE_YEAR_AGO);
    })();

    return hotDb.transaction(() => {
      const moved = 'SELECT id FROM main.games WHERE date < ? AND id IN (SELECT id FROM cold.games)';
      hotDb.prepare(`DELETE FROM main.game_players WHERE game_id IN (${moved})`).run(ONE_YEAR_AGO);
      return hotDb.prepare(`DELETE FROM main.games WHERE id IN (${moved})`).run(ONE_YEAR_AGO).changes;
    })();
  },

  // PPI Framework
  refreshPilotStats,

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
      const key = pilotKey(name);
      // Cold games only if hot games have very few matches (e.g. historical pilot)
      const allRows = pilotGamesHotFirst(name);

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

  // For the healthcheck: throws unless both files answer a query.
  checkHealth: () => {
    hotDb.prepare('SELECT 1 FROM games LIMIT 1').get();
    coldDb.prepare('SELECT 1 FROM games LIMIT 1').get();
  },

  // Stop a running stats worker, so no thread keeps the files open, then close both.
  close: async () => {
    await statsWorker?.terminate();
    try { hotDb.close(); } catch {}
    try { coldDb.close(); } catch {}
  },

  getPilotTelemetry,
  normalizeWeaponName,
  PRIMARY_WEAPONS,
  SECONDARY_WEAPONS
};

// The pilot and leaderboard statements, for the EXPLAIN QUERY PLAN tests.
export const pilotStatements = {
  pilotGamesHot,
  pilotGamesHotSince,
  pilotGamesCold,
  gamesByPilot: getGamesByPilot,
  countGamesByPilot,
  firstSeen: getPilotFirstSeen,
  leaderboard: getPilotStats,
  leaderboardSince: getPilotStatsFiltered
};

export default db;
