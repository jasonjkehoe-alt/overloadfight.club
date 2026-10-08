import { hotDb, coldDb } from './connection.js';
import { playerRows } from '../lib/gameParse.js';

// Schema for both files, in the order the server has always created it. Runs once,
// when db.js is first imported; every repo and analytics module imports this file
// first, so its tables exist before their statements are prepared.

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
export const GAME_PLAYERS_COLUMNS = 'game_id, date, name, team, kills, deaths, assists, suicides, damage, mode, map';
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
export function ensureGamePlayersTable(conn) {
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
export const writeHotPlayers = gamePlayersWriter(hotDb);
export const writeColdPlayers = gamePlayersWriter(coldDb);

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

export function migrateGamePlayers() {
  syncGamePlayers(coldDb, writeColdPlayers, 'cold');
  syncGamePlayers(hotDb, writeHotPlayers, 'hot');
}
migrateGamePlayers();

// rating_snapshots (S13): each pilot's Glicko-2 rating at the end of every day
// they played a rated match (gameParse.js ratingSnapshots). Derived from both
// files, so it lives in tracker.db only, like pilot_stats_cache. Every stats
// refresh rewrites it whole (analytics/refresh.js), so it starts empty and
// needs no repair at startup; dropping it loses nothing the next refresh
// does not rebuild. `pilot` is the pilotKey(), `day` YYYY-MM-DD in America/Chicago.
export function ensureRatingSnapshots() {
  hotDb.exec(`
    CREATE TABLE IF NOT EXISTS rating_snapshots (
      pilot TEXT NOT NULL,
      day TEXT NOT NULL,
      name TEXT NOT NULL,
      rating REAL NOT NULL,
      rd REAL NOT NULL,
      volatility REAL NOT NULL,
      matches INTEGER NOT NULL,
      last_played TEXT,
      PRIMARY KEY (pilot, day)
    ) WITHOUT ROWID;
  `);
}
ensureRatingSnapshots();

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

// pilot_stats_cache is created by the first stats refresh (analytics/refresh.js),
// not here at startup; older tables get the columns added since.
export function ensurePilotStatsCache() {
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
}
