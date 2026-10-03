
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const coldDbPath = path.join(__dirname, '../data/cold_storage.db');

console.log("Checking Cold Storage at:", coldDbPath);

try {
    const db = new Database(coldDbPath, { fileMustExist: false }); // Open if exists, else create empty

    // Check if table exists
    const table = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='games'").get();

    if (!table) {
        console.log("No 'games' table in cold storage.");
    } else {
        const count = db.prepare("SELECT COUNT(*) as count FROM games").get();
        console.log("Total Cold Games:", count.count);

        if (count.count > 0) {
            const sample = db.prepare("SELECT date, details FROM games LIMIT 1").get();
            console.log("Sample Cold Date:", sample.date);
        }
    }
} catch (e) {
    console.log("Error opening cold db:", e.message);
}
