
import db from '../server/db.js';
import Database from 'better-sqlite3';

console.log('--- Direct DB Access Test ---');
const rawDb = new Database('d:\\OverloadTracker\\Overload-Tracker\\data\\tracker.db');

const count = rawDb.prepare('SELECT COUNT(*) as count FROM games').get();
console.log('Raw Count:', count.count);

try {
    const firstRow = rawDb.prepare('SELECT * FROM games LIMIT 1').get();
    if (firstRow) {
        console.log('Row found!');
        console.log('ID:', firstRow.id);
        console.log('Date:', firstRow.date);
        console.log('Details length:', firstRow.details.length);
        console.log('Details substring:', firstRow.details.substring(0, 50));
    } else {
        console.log('Raw query returned NO rows.');
    }
} catch (e) {
    console.error('Raw query failed:', e);
}

console.log('\n--- db.js Function Test ---');
console.log('Calling db.getGames(1, 0, null, null)...');
const games = db.getGames(1, 0);
console.log('Result length:', games.length);
