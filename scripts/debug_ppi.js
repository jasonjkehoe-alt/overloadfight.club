
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../data/tracker.db');
const coldDbPath = path.join(__dirname, '../data/cold_storage.db');

const db = new Database(dbPath);

console.log("--- Debugging Game Data Structure ---");

try {
    // Attach cold storage just in case
    db.prepare(`ATTACH DATABASE '${coldDbPath}' AS cold`).run();
} catch (e) {
    console.log("Could not attach cold DB (might not exist or already attached):", e.message);
}

// Query for a game with kills
const sql = `
    SELECT details FROM games WHERE details LIKE '%kills%' LIMIT 1
    UNION ALL
    SELECT details FROM cold.games WHERE details LIKE '%kills%' LIMIT 1
`;

try {
    const row = db.prepare(sql).get();

    if (row) {
        const game = JSON.parse(row.details);
        console.log("Found a game record.");
        if (!game.kills) {
            console.log("ERROR: 'kills' property missing from game details!");
        } else if (!Array.isArray(game.kills)) {
            console.log("ERROR: 'kills' is not an array:", typeof game.kills);
        } else if (game.kills.length === 0) {
            console.log("WARNING: 'kills' array is empty.");
        } else {
            console.log(`'kills' array has ${game.kills.length} entries.`);
            const sampleKill = game.kills[0];
            console.log("Sample Kill Object:", JSON.stringify(sampleKill, null, 2));

            // Check keys
            if (!sampleKill.hasOwnProperty('attacker')) console.log("ERROR: 'attacker' key missing!");
            if (!sampleKill.hasOwnProperty('defender')) console.log("ERROR: 'defender' key missing!");

            console.log(`Attacker: '${sampleKill.attacker}'`);
            console.log(`Defender: '${sampleKill.defender}'`);
        }
    } else {
        console.log("No games found with 'kills' substring in details.");
    }
} catch (e) {
    console.error("Query Error:", e.message);
}
console.log("-------------------------------------");
