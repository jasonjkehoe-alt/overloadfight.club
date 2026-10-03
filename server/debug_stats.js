import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../data/tracker.db');
const db = new Database(dbPath);

try {
    console.log('Checking database at:', dbPath);

    // Check one row raw
    const raw = db.prepare('SELECT details FROM games LIMIT 1').get();
    if (!raw) {
        console.log('No games found in DB');
    } else {
        console.log('Raw details length:', raw.details.length);
        try {
            const parsed = JSON.parse(raw.details);
            console.log('Parsed JS Object - settings.level:', parsed.settings?.level);
            console.log('Parsed JS Object - settings.matchMode:', parsed.settings?.matchMode);
        } catch (e) {
            console.log('Failed to parse details JSON:', e.message);
        }
    }

    // Check SQL extraction
    const sqlMap = db.prepare("SELECT json_extract(details, '$.settings.level') as map FROM games LIMIT 1").get();
    console.log('SQL Extracted Map:', sqlMap);

    const sqlMode = db.prepare("SELECT json_extract(details, '$.settings.matchMode') as mode FROM games LIMIT 1").get();
    console.log('SQL Extracted Mode:', sqlMode);

    // Check stats query
    const stats = db.prepare(`
        SELECT json_extract(details, '$.settings.level') as map, COUNT(*) as count
        FROM games
        GROUP BY map
        ORDER BY count DESC
        LIMIT 5
    `).all();
    console.log('Top 5 Maps:', stats);

} catch (e) {
    console.error('Error:', e);
}
