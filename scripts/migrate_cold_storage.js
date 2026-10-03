import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '../data');
const dbPath = path.join(dataDir, 'tracker.db');
const coldDbPath = path.join(dataDir, 'cold_storage.db');

// 365 Days Ago
const ONE_YEAR_AGO = new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString();

async function migrate() {
    console.log('Starting Cold Storage Migration...');
    console.log(`Data Directory: ${dataDir}`);
    console.log(`Cutoff Date: ${ONE_YEAR_AGO}`);

    if (!fs.existsSync(dbPath)) {
        console.error('❌ tracker.db not found!');
        process.exit(1);
    }

    // 1. Backup existing DB
    const backupPath = path.join(dataDir, `tracker_backup_${Date.now()}.db`);
    console.log(`Creating backup at ${backupPath}...`);
    fs.copyFileSync(dbPath, backupPath);

    // 2. Initialize Cold DB
    console.log('Initializing Cold Storage DB...');
    const coldDb = new Database(coldDbPath);

    // Create schema in Cold DB (same as main)
    coldDb.exec(`
        CREATE TABLE IF NOT EXISTS games (
            id INTEGER PRIMARY KEY,
            date TEXT,
            ip TEXT,
            details TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_games_date ON games(date);
        CREATE INDEX IF NOT EXISTS idx_games_ip ON games(ip);
    `);

    // 3. Open Main DB
    const mainDb = new Database(dbPath);

    // 4. Move Old Games to Cold DB
    console.log('Moving old games to Cold Storage...');

    const oldGames = mainDb.prepare('SELECT * FROM games WHERE date < ?').all(ONE_YEAR_AGO);
    console.log(`Found ${oldGames.length} games older than 365 days.`);

    if (oldGames.length > 0) {
        const insertCold = coldDb.prepare('INSERT OR IGNORE INTO games (id, date, ip, details) VALUES (@id, @date, @ip, @details)');

        const transaction = coldDb.transaction((games) => {
            for (const game of games) insertCold.run(game);
        });

        transaction(oldGames);
        console.log('✅ Old games inserted into cold_storage.db');

        // 5. Delete Old Games from Main DB
        console.log('Deleting old games from Main DB...');
        const deleteStmt = mainDb.prepare('DELETE FROM games WHERE date < ?');
        const result = deleteStmt.run(ONE_YEAR_AGO);
        console.log(`✅ Deleted ${result.changes} games from tracker.db`);
    } else {
        console.log('No old games found to migrate.');
    }

    // 6. Vacuum Main DB to reclaim space
    console.log('Vacuuming Main DB...');
    mainDb.exec('VACUUM');

    console.log('Migration Complete!');
    mainDb.close();
    coldDb.close();
}

migrate().catch(err => console.error(err));
