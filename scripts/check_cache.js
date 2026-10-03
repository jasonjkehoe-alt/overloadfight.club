
import db from '../server/db.js';

console.log("Checking pilot_stats_cache...");
const stmt = db.hotDb.prepare("SELECT * FROM pilot_stats_cache LIMIT 5");
const rows = stmt.all();
console.log("Rows found:", rows.length);
if (rows.length > 0) {
    console.log("Sample Data:", rows[0]);
} else {
    console.log("Cache is empty!");
}
