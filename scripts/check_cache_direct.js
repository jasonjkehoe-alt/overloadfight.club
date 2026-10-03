
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../data/tracker.db');

const db = new sqlite3.Database(dbPath);

console.log("Opening DB at:", dbPath);

db.serialize(() => {
    db.all("SELECT name FROM sqlite_master WHERE type='table' AND name='pilot_stats_cache'", (err, tables) => {
        if (err) {
            console.error("Error listing tables:", err);
            return;
        }
        if (tables.length === 0) {
            console.log("Table 'pilot_stats_cache' DOES NOT EXIST.");
            return;
        }
        console.log("Table exists.");

        db.all("SELECT * FROM pilot_stats_cache LIMIT 5", (err, rows) => {
            if (err) {
                console.error("Error querying cache:", err);
                return;
            }
            console.log("Rows found:", rows.length);
            if (rows.length > 0) {
                console.log("Sample:", rows[0]);
            } else {
                console.log("Table is empty despite existing.");
            }
        });
    });
});
