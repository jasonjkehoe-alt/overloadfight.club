import fs from 'fs';
import os from 'os';
import path from 'path';
import Database from 'better-sqlite3';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { onDay, sample, veteranSoup } from './testFixtures.js';

let dataDir;
let db;
let backupsDir;
let backupDatabases;
let KEEP_DAYS;

// Games, game_players rows and user_version of a backup file.
const contents = file => {
    const conn = new Database(file, { readonly: true, fileMustExist: true });
    try {
        return {
            games: conn.prepare('SELECT COUNT(*) AS n FROM games').get().n,
            players: conn.prepare('SELECT COUNT(*) AS n FROM game_players').get().n,
            userVersion: conn.pragma('user_version', { simple: true })
        };
    } finally {
        conn.close();
    }
};

beforeAll(async () => {
    dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ofc-ops-'));
    process.env.DATA_DIR = dataDir;
    ({ default: db, backupsDir } = await import('./db.js'));
    ({ backupDatabases, KEEP_DAYS } = await import('./backup.js'));
    db.saveGames([...sample.map(onDay), veteranSoup]);
});

afterAll(() => {
    fs.rmSync(dataDir, { recursive: true, force: true });
});

describe('backupDatabases', () => {
    it('copies both files with their game_players rows and user_version into a dated directory', async () => {
        const dir = await backupDatabases(new Date(2026, 9, 7, 3));
        expect(dir).toBe(path.join(backupsDir, '2026-10-07'));
        expect(contents(path.join(dir, 'tracker.db'))).toEqual(contents(path.join(dataDir, 'tracker.db')));
        expect(contents(path.join(dir, 'cold_storage.db'))).toEqual(contents(path.join(dataDir, 'cold_storage.db')));
        expect(contents(path.join(dir, 'tracker.db'))).toMatchObject({ games: sample.length, userVersion: 1 });
        expect(contents(path.join(dir, 'cold_storage.db'))).toMatchObject({ games: 1, players: veteranSoup.players.length, userVersion: 1 });
    });

    it('replaces the same day and keeps only the newest days', async () => {
        fs.mkdirSync(path.join(backupsDir, '2026-10-01.partial'));
        for (let d = 1; d <= 10; d++) await backupDatabases(new Date(2026, 9, d, 3));
        await backupDatabases(new Date(2026, 9, 10, 4));
        const days = fs.readdirSync(backupsDir).sort();
        expect(KEEP_DAYS).toBe(7);
        expect(days).toEqual(['2026-10-04', '2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10']);
        expect(fs.readdirSync(path.join(backupsDir, '2026-10-10')).sort()).toEqual(['cold_storage.db', 'tracker.db']);
    });
});

describe('shutdown', () => {
    it('passes the health check while the databases are open', () => {
        expect(() => db.checkHealth()).not.toThrow();
    });

    it('stops a running stats worker before closing the databases', async () => {
        const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
        const refresh = db.refreshPilotStats();
        await db.close();
        await refresh;
        expect(errors).toHaveBeenCalledWith('Failed to refresh PPI stats', expect.objectContaining({ message: expect.stringMatching(/^stats worker exited/) }));
        expect(() => db.checkHealth()).toThrow();
        errors.mockRestore();
    });
});
