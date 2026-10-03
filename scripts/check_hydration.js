
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../data/tracker.db');
const coldDbPath = path.join(__dirname, '../data/cold_storage.db');

const db = new Database(dbPath);

console.log("--- Data Hydration Check ---");

try {
    db.prepare(`ATTACH DATABASE '${coldDbPath}' AS cold`).run();
} catch (e) {
    // Ignore if already attached or missing
}

const getCounts = (tableName) => {
    try {
        const total = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get().count;

        const full = db.prepare(`
            SELECT COUNT(*) as count FROM ${tableName}
            WHERE json_extract(details, '$.kills') IS NOT NULL 
            AND json_array_length(json_extract(details, '$.kills')) > 0
        `).get().count;

        return { total, full, summary: total - full };
    } catch (e) {
        return { error: e.message };
    }
};

const hotStats = getCounts('games');
if (hotStats.error) {
    console.log(`Hot DB Error: ${hotStats.error}`);
} else {
    console.log(`[Hot Storage]`);
    console.log(`  Total Games: ${hotStats.total}`);
    console.log(`  Full Details: ${hotStats.full}`);
    console.log(`  Summaries:    ${hotStats.summary}  <-- Candidates for Hydration`);
    console.log(`  Hydration %:  ${((hotStats.full / hotStats.total) * 100).toFixed(1)}%`);
}

const coldStats = getCounts('cold.games');
if (coldStats.error) {
    console.log(`\n[Cold Storage] (Not found or empty)`);
} else {
    console.log(`\n[Cold Storage]`);
    console.log(`  Total Games: ${coldStats.total}`);
    console.log(`  Full Details: ${coldStats.full}`);
    console.log(`  Summaries:    ${coldStats.summary}  <-- Candidates for Hydration`);
}

console.log("----------------------------");
