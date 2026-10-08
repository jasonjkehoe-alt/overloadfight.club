import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { durationOf, netKills, pilotKey } from '../lib/gameParse.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Use a dedicated data directory to avoid Docker volume mounting over source code
const dataDir = process.env.DATA_DIR || path.join(__dirname, '../../data');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// The Docker image runs as uid 1000. Files an older image left while running as
// root (the databases, their -wal and -shm, maps/, map_images/) are read-only to
// it, and SQLite or a map download would fail later with a less clear error.
for (const file of [dataDir, ...fs.readdirSync(dataDir).map(name => path.join(dataDir, name))]) {
  try {
    fs.accessSync(file, fs.constants.W_OK);
  } catch {
    console.error(`Refusing to start: ${file} is not writable by uid ${process.getuid?.()}. On the host, chown the data folder to 1000:1000 (see DEPLOYMENT.md).`);
    process.exit(1);
  }
}

export const backupsDir = path.join(dataDir, 'backups');
export const mapsDir = path.join(dataDir, 'maps');
export const mapImagesDir = path.join(dataDir, 'map_images');
if (!fs.existsSync(mapsDir)) fs.mkdirSync(mapsDir, { recursive: true });
if (!fs.existsSync(mapImagesDir)) fs.mkdirSync(mapImagesDir, { recursive: true });

export const dbPath = path.join(dataDir, 'tracker.db');
export const coldDbPath = path.join(dataDir, 'cold_storage.db');

export const hotDb = new Database(dbPath);
export const coldDb = new Database(coldDbPath);

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

// Copy tracker.db or cold_storage.db through SQLite's backup API. Under WAL a raw file copy
// can miss commits still in the -wal file, or be replayed against that stale WAL.
export const backupHot = destination => hotDb.backup(destination);
export const backupCold = destination => coldDb.backup(destination);
