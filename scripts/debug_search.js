
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = 'd:\\OverloadTracker\\Overload-Tracker\\data\\tracker.db';
const db = new Database(dbPath, { verbose: console.log });

const searchTerm = 'SUB ROSA'; // Example search term
const searchPattern = `%${searchTerm}%`;

console.log(`Searching for pattern: "${searchPattern}"`);

const query = `
    SELECT count(*) as count FROM games
    WHERE
        CAST(id AS TEXT) LIKE ?
        OR json_extract(details, '$.settings.level') LIKE ?
        OR json_extract(details, '$.server.name') LIKE ?
        OR EXISTS (
            SELECT 1 FROM json_each(details, '$.players')
            WHERE json_extract(value, '$.name') LIKE ?
        )
`;

try {
    const start = Date.now();
    const result = db.prepare(query).get(searchPattern, searchPattern, searchPattern, searchPattern);
    console.log('Result:', result);
    console.log('Time taken:', Date.now() - start, 'ms');
} catch (err) {
    console.error('Query failed:', err);
}
