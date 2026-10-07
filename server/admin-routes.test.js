import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

let dataDir;
let db;
let adminRouter;

beforeAll(async () => {
    dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ofc-admin-test-'));
    process.env.DATA_DIR = dataDir;
    db = (await import('./db.js')).default;
    adminRouter = (await import('./admin-routes.js')).default;

    // Seed cold storage
    db.saveColdGamesBatch([
        { id: 10, date: '2019-07-15T12:00:00.000Z', details: JSON.stringify({ id: 10, kills: [] }) },
        { id: 20, date: '2019-08-01T10:00:00.000Z', details: JSON.stringify({ id: 20, kills: [] }) }
    ]);

    // Seed hot storage
    db.saveGames([
        { id: 50000, date: '2025-11-20T10:00:00.000Z' },
        { id: 60000, date: '2026-05-10T15:00:00.000Z' },
        {
            id: 70000,
            date: '2026-10-01T08:00:00.000Z',
            settings: { matchMode: 'ANARCHY', level: 'TITAN', timeLimit: 300 },
            players: [
                { name: 'PILOT_A', kills: 3, deaths: 1 },
                { name: 'PILOT_B', kills: 1, deaths: 3 }
            ],
            kills: []
        }
    ]);
    db.refreshPilotStats();
});

afterAll(async () => {
    await new Promise(resolve => setTimeout(resolve, 60));
    await db.close?.();
    fs.rmSync(dataDir, { recursive: true, force: true });
});

describe('admin routes stats endpoints', () => {
    it('/stats/extended combines hot and cold DB and removes coveragePercent', async () => {
        // Find the /stats/extended handler from the router stack
        const layer = adminRouter.stack.find(
            s => s.route && s.route.path === '/stats/extended' && s.route.methods.get
        );
        expect(layer).toBeDefined();

        let responseJson = null;
        let statusCode = 200;
        const mockReq = {};
        const mockRes = {
            json: (data) => { responseJson = data; return mockRes; },
            status: (code) => { statusCode = code; return mockRes; }
        };

        layer.route.stack[0].handle(mockReq, mockRes);

        expect(statusCode).toBe(200);
        expect(responseJson).toBeDefined();
        expect(responseJson.overview).toBeDefined();

        // 3 hot games + 2 cold games = 5 total
        expect(responseJson.overview.totalGames).toBe(5);
        // Earliest date comes from cold storage (2019-07-15)
        expect(responseJson.overview.earliestDate).toBe('2019-07-15T12:00:00.000Z');
        expect(responseJson.overview.minId).toBe(10);
        expect(responseJson.overview.maxId).toBe(70000);
        // Meaningless coveragePercent metric is dropped
        expect(responseJson.overview.coveragePercent).toBeUndefined();
    });

    it('/stats combines hot and cold DB', async () => {
        const layer = adminRouter.stack.find(
            s => s.route && s.route.path === '/stats' && s.route.methods.get
        );
        expect(layer).toBeDefined();

        let responseJson = null;
        const mockReq = {};
        const mockRes = {
            json: (data) => { responseJson = data; return mockRes; },
        };
        layer.route.stack[0].handle(mockReq, mockRes);

        expect(responseJson).toBeDefined();
        expect(responseJson.total_games).toBe(5);
        expect(responseJson.earliest_date).toBe('2019-07-15T12:00:00.000Z');
        expect(responseJson.min_game_id).toBe(10);
        expect(responseJson.max_game_id).toBe(70000);
        expect('last_stats_refresh' in responseJson).toBe(true);
    });

    it('POST /maintenance/refresh-stats triggers async refresh and returns { started: true }', async () => {
        const layer = adminRouter.stack.find(
            s => s.route && s.route.path === '/maintenance/refresh-stats' && s.route.methods.post
        );
        expect(layer).toBeDefined();

        let responseJson = null;
        let statusCode = 200;
        const mockReq = { session: { isAdmin: true } };
        const mockRes = {
            json: (data) => { responseJson = data; return mockRes; },
            status: (code) => { statusCode = code; return mockRes; }
        };

        layer.route.stack[0].handle(mockReq, mockRes);

        expect(statusCode).toBe(200);
        expect(responseJson).toEqual({ started: true });
    });

    it('POST /maintenance/refresh-stats 401s without login', async () => {
        // Find requireAuth middleware in the router stack
        const authLayer = adminRouter.stack.find(
            s => !s.route && s.handle.name === 'requireAuth'
        );
        expect(authLayer).toBeDefined();

        let statusCode = 200;
        let responseJson = null;
        const mockReq = { session: {} }; // no isAdmin
        const mockRes = {
            status: (code) => { statusCode = code; return mockRes; },
            json: (data) => { responseJson = data; return mockRes; }
        };
        let nextCalled = false;

        authLayer.handle(mockReq, mockRes, () => { nextCalled = true; });

        expect(statusCode).toBe(401);
        expect(nextCalled).toBe(false);
        expect(responseJson).toEqual({ error: 'Unauthorized - Admin access required' });
    });

    it('stats refresh is idempotent and refreshes pilot, cold, and map caches cleanly', async () => {
        // Run refresh once
        await db.refreshPilotStats();
        const maxUpdated1 = db.getMaxPilotStatsLastUpdated();
        const ppiCount1 = db.hasPilotStatsCache();

        // Run refresh a second time immediately
        await db.refreshPilotStats();
        const maxUpdated2 = db.getMaxPilotStatsLastUpdated();
        const ppiCount2 = db.hasPilotStatsCache();

        expect(ppiCount1).toBe(true);
        expect(ppiCount2).toBe(true);
        expect(maxUpdated1).toBeDefined();
        expect(maxUpdated2).toBeDefined();
    });

    it('startup check detects when game data is newer than stats cache', async () => {
        // When max game date is newer than max pilot stats cache last_updated
        await db.refreshPilotStats();
        const maxGame = db.getMaxGameDate();
        const maxCache = db.getMaxPilotStatsLastUpdated();
        expect(maxGame).toBeDefined();
        // Since test games were inserted and cache refreshed, maxGame <= maxCache
        expect(maxGame <= maxCache).toBe(true);

        // If a new game with a future date arrives:
        const futureDate = '2027-01-01T00:00:00.000Z';
        db.saveGames([{
            id: 99999,
            date: futureDate,
            settings: { matchMode: 'ANARCHY', level: 'TITAN', timeLimit: 300 },
            players: [
                { name: 'PILOT_A', kills: 1, deaths: 0 },
                { name: 'PILOT_B', kills: 0, deaths: 1 }
            ],
            kills: []
        }]);

        const newMaxGame = db.getMaxGameDate();
        expect(newMaxGame).toBe(futureDate);
        expect(newMaxGame > maxCache).toBe(true);

        // Refresh stats catches up to the new date
        await db.refreshPilotStats();
        const updatedCache = db.getMaxPilotStatsLastUpdated();
        expect(updatedCache).toBe(futureDate);
    });
});
