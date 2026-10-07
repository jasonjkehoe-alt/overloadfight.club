import fs from 'fs';
import os from 'os';
import path from 'path';
import Database from 'better-sqlite3';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { byId, onDay, sample, veteranSoup } from './testFixtures.js';
const namedPlayers = games => games.reduce((n, g) => n + g.players.filter(p => p.name.trim()).length, 0);

// A tracker.db and cold_storage.db as they were before S5: games tables only.
// 80001 and 80002 are B2AF games over a year old still sitting in hot storage;
// 80002 is also in cold storage already, as a crash mid-move would leave it.
const hotGames = sample.map(onDay);
const oldHot = { ...byId(72085), id: 80001, date: '2024-01-01T00:00:00.000Z' };
const oldDup = { ...byId(72084), id: 80002, date: '2024-01-02T00:00:00.000Z' };
const coldGames = [veteranSoup, oldDup];

function writeLegacyDb(file, games) {
    const conn = new Database(file);
    conn.exec('CREATE TABLE games (id INTEGER PRIMARY KEY, date TEXT, ip TEXT, details TEXT)');
    const insert = conn.prepare('INSERT INTO games (id, date, ip, details) VALUES (?, ?, ?, ?)');
    for (const g of games) insert.run(g.id, g.date, g.ip ?? null, JSON.stringify(g));
    conn.close();
}

let dataDir;
let db;
let pilotStatements;
let hotFile;
let coldFile;

const rowCount = (file, where = '') => {
    const conn = new Database(file, { readonly: true });
    try {
        return conn.prepare(`SELECT COUNT(*) AS n FROM game_players ${where}`).get().n;
    } finally {
        conn.close();
    }
};
const userVersion = file => {
    const conn = new Database(file, { readonly: true });
    try {
        return conn.pragma('user_version', { simple: true });
    } finally {
        conn.close();
    }
};

beforeAll(async () => {
    dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ofc-players-'));
    hotFile = path.join(dataDir, 'tracker.db');
    coldFile = path.join(dataDir, 'cold_storage.db');
    writeLegacyDb(hotFile, [...hotGames, oldHot, oldDup]);
    writeLegacyDb(coldFile, coldGames);
    process.env.DATA_DIR = dataDir;
    ({ default: db, pilotStatements } = await import('./db.js'));
});

afterAll(() => {
    fs.rmSync(dataDir, { recursive: true, force: true });
});

describe('game_players migration', () => {
    it('backfills hot and cold games when the server first starts', () => {
        expect(rowCount(hotFile)).toBe(namedPlayers([...hotGames, oldHot, oldDup]));
        expect(rowCount(coldFile)).toBe(namedPlayers(coldGames));
        expect(userVersion(hotFile)).toBe(1);
        expect(userVersion(coldFile)).toBe(1);
    });

    it('does nothing on a second run and rebuilds without duplicates once reset', () => {
        const before = rowCount(hotFile);
        db.migrateGamePlayers();
        expect(rowCount(hotFile)).toBe(before);

        const conn = new Database(hotFile);
        conn.pragma('user_version = 0');
        conn.close();
        db.migrateGamePlayers();
        expect(rowCount(hotFile)).toBe(before);
        expect(userVersion(hotFile)).toBe(1);
    });

    it('repairs rows a writer that bypassed game_players left behind', () => {
        // As a script or an older image would leave it: one game with no rows and
        // rows for a game that no longer exists.
        const conn = new Database(hotFile);
        const before = conn.prepare('SELECT COUNT(*) AS n FROM game_players').get().n;
        conn.prepare('DELETE FROM game_players WHERE game_id = 72108').run();
        conn.prepare("INSERT INTO game_players (game_id, date, name) VALUES (123456, '2026-01-01', 'GHOST')").run();
        conn.close();

        db.migrateGamePlayers();
        expect(rowCount(hotFile)).toBe(before);
        expect(rowCount(hotFile, "WHERE name = 'GHOST'")).toBe(0);
        expect(rowCount(hotFile, 'WHERE game_id = 72108')).toBe(4);
    });

    it('serves pilot numbers from the backfilled rows', () => {
        // SOUP's hot game (14 kills, 46 deaths) and the 2019 cold game as "Soup",
        // where he killed himself once and scored -1, which counts as 0.
        expect(db.getPilotStats.all().find(r => r.name.toLowerCase() === 'soup')).toMatchObject({ name: 'SOUP', games: 2, kills: 14, deaths: 47, suicides: 1 });
    });
});

describe('moveGamesToColdStorage', () => {
    it('moves old games and their rows, and drops a hot copy already in cold storage', async () => {
        // Before the move 80002 is counted twice, once from each file, except by
        // the stats worker, which counts a game id once.
        expect(db.getPilotStats.all().find(r => r.name === 'B2AF').games).toBe(5);
        await db.refreshPilotStats();
        expect((await db.getColdStorageStats()).total_games).toBe(hotGames.length + 3);

        expect(db.moveGamesToColdStorage()).toBe(2);

        expect(rowCount(hotFile, 'WHERE game_id IN (80001, 80002)')).toBe(0);
        expect(rowCount(coldFile, 'WHERE game_id = 80001')).toBe(2);
        expect(rowCount(coldFile, 'WHERE game_id = 80002')).toBe(2);
        expect(db.getPilotStats.all().find(r => r.name === 'B2AF').games).toBe(4);
        expect(db.countGamesByPilot.get({ name: 'b2af', startDate: null }).count).toBe(4);
        expect(db.moveGamesToColdStorage()).toBe(0);
    });
});

describe('other writers', () => {
    it('rebuilds a game\'s rows when updateGameDetails replaces it', () => {
        const game = { ...hotGames.find(g => g.id === 72107), players: [{ name: 'NEWCOMER', kills: 3, deaths: 1, assists: 0 }] };
        db.updateGameDetails(game);
        expect(rowCount(hotFile, 'WHERE game_id = 72107')).toBe(1);
        expect(db.countGamesByPilot.get({ name: 'newcomer', startDate: null }).count).toBe(1);
    });

    it('adds rows for archive games saved by saveColdGamesBatch', () => {
        const archived = { ...byId(72090), id: 70001, date: '2020-05-01T00:00:00.000Z' };
        db.saveColdGamesBatch([{ id: archived.id, date: archived.date, ip: null, details: JSON.stringify(archived) }]);
        expect(rowCount(coldFile, 'WHERE game_id = 70001')).toBe(2);
    });

    it('keeps rows from a stored kill log when the archive sends the game again without one', () => {
        const archived = { ...veteranSoup, id: 70002 };
        db.saveColdGamesBatch([archived]);
        db.saveColdGamesBatch([{ ...archived, kills: [] }]);
        expect(rowCount(coldFile, 'WHERE game_id = 70002 AND suicides = 1')).toBe(1);
    });

    it('keeps rows from a stored kill log when updateGameDetails sends the game again without one', () => {
        const archived = { ...veteranSoup, id: 70003 };
        db.saveColdGamesBatch([archived]);
        db.updateGameDetails({ ...archived, kills: [] });
        expect(rowCount(coldFile, 'WHERE game_id = 70003 AND suicides = 1')).toBe(1);
    });

    it('builds game_players for a restored backup from before S5', async () => {
        const legacy = path.join(dataDir, 'legacy.db');
        writeLegacyDb(legacy, hotGames);
        await db.restoreHot(legacy);
        expect(rowCount(hotFile)).toBe(namedPlayers(hotGames));
        expect(userVersion(hotFile)).toBe(1);
    });
});

describe('query plans', () => {
    const plan = (stmt, params) => stmt.database.prepare(`EXPLAIN QUERY PLAN ${stmt.source}`).all(params).map(r => r.detail).join('\n');

    it('finds a pilot\'s games through the (name, date) index in both files', () => {
        const byName = /SEARCH (main\.|cold\.)?game_players USING (COVERING )?INDEX idx_game_players_name_date \(name=\?/;
        expect(plan(pilotStatements.pilotGamesHot, { name: 'x' })).toMatch(byName);
        expect(plan(pilotStatements.pilotGamesHotSince, { name: 'x', startDate: '2026-01-01' })).toMatch(/idx_game_players_name_date \(name=\? AND date>\?\)/);
        expect(plan(pilotStatements.pilotGamesCold, { name: 'x' })).toMatch(byName);
        for (const stmt of [pilotStatements.gamesByPilot, pilotStatements.countGamesByPilot]) {
            const detail = plan(stmt, { name: 'x', startDate: null, limit: 25, offset: 0 });
            expect(detail).toMatch(/SEARCH game_players USING (COVERING )?INDEX idx_game_players_name_date/);
            expect(detail).toMatch(/SEARCH cold\.game_players USING (COVERING )?INDEX idx_game_players_name_date/);
            expect(detail).not.toMatch(/SCAN (main\.|cold\.)?games/);
        }
        expect(plan(pilotStatements.firstSeen, { name: 'x' })).toMatch(byName);
    });

    it('filters the leaderboard by date through the date index', () => {
        const detail = plan(pilotStatements.leaderboardSince, { startDate: '2026-01-01' });
        expect(detail).toMatch(/SEARCH game_players USING INDEX idx_game_players_date \(date>\?\)/);
        expect(detail).toMatch(/SEARCH cold\.game_players USING INDEX idx_game_players_date \(date>\?\)/);
    });
});
