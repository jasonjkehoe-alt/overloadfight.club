
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../data/tracker.db');

console.log("Opening DB at:", dbPath);
const db = new Database(dbPath);

try {
    const table = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='pilot_stats_cache'").get();

    if (!table) {
        console.log("Table 'pilot_stats_cache' DOES NOT EXIST.");
    } else {
        console.log("Table exists.");
        const rows = db.prepare("SELECT * FROM pilot_stats_cache LIMIT 5").all();
        console.log("Rows found:", rows.length);
        if (rows.length > 0) {
            console.log("Sample:", rows[0]);
        } else {
            console.log("Table is empty.");
        }
    }
} catch (err) {
    console.error("Error:", err);
}
