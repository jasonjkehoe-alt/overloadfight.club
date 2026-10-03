
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../data/tracker.db');

const db = new Database(dbPath);

console.log("Checking games table...");
const count = db.prepare("SELECT COUNT(*) as count FROM games").get();
console.log("Total Games:", count.count);

const sample = db.prepare("SELECT date, details FROM games LIMIT 1").get();
if (sample) {
    console.log("Sample Date:", sample.date);
    console.log("Date Type:", typeof sample.date);
    try {
        const details = JSON.parse(sample.details);
        console.log("Players Array Sample:", JSON.stringify(details.players?.[0]));
    } catch (e) {
        console.log("JSON Parse Error");
    }
} else {
    console.log("Games table is empty!");
}
