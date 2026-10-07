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
        { id: 50000, date: '2025-11-20T10:00:00.000Z', details: JSON.stringify({ id: 50000, kills: [] }) },
        { id: 60000, date: '2026-05-10T15:00:00.000Z', details: JSON.stringify({ id: 60000, kills: [] }) },
        { id: 70000, date: '2026-10-01T08:00:00.000Z', details: JSON.stringify({ id: 70000, kills: [] }) }
    ]);
});

afterAll(() => {
    db.close?.();
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
            status: () => mockRes
        };

        layer.route.stack[0].handle(mockReq, mockRes);

        expect(responseJson).toBeDefined();
        expect(responseJson.total_games).toBe(5);
        expect(responseJson.earliest_date).toBe('2019-07-15T12:00:00.000Z');
        expect(responseJson.min_game_id).toBe(10);
        expect(responseJson.max_game_id).toBe(70000);
    });
});
