import fs from 'fs';
import os from 'os';
import path from 'path';
import express from 'express';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { onDay, sample } from './testFixtures.js';

const syncPage = vi.fn();
vi.mock('./ingest.js', () => ({ default: { syncPage } }));
// Keep the tests off Redis; neither route under test reads the cache.
vi.mock('./services/cacheService.js', () => ({ default: { get: async () => null, set: async () => {} } }));

const hotGames = sample.map(onDay);
// A second page of games, older than the first, that only the tracker has.
const olderGames = hotGames.map(g => ({ ...g, id: g.id - 1000, date: new Date(Date.parse(g.date) - 86400000).toISOString() }));

let dataDir;
let db;
let server;
let baseUrl;

beforeAll(async () => {
    dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ofc-routes-'));
    process.env.DATA_DIR = dataDir;
    db = (await import('./db.js')).default;
    const routes = (await import('./routes.js')).default;
    db.saveGames(hotGames);
    await db.refreshPilotStats();

    const app = express();
    app.use('/api', routes);
    server = app.listen(0);
    baseUrl = `http://127.0.0.1:${server.address().port}`;
});

afterAll(async () => {
    server?.close();
    await db?.close?.();
    fs.rmSync(dataDir, { recursive: true, force: true });
});

beforeEach(() => {
    syncPage.mockReset();
});

const getJson = async url => {
    const res = await fetch(baseUrl + url);
    return { status: res.status, body: await res.json() };
};

describe('GET /api/games', () => {
    it('answers page 1 from the DB while the upstream sync is still pending', async () => {
        syncPage.mockReturnValue(new Promise(() => {})); // the tracker never answers
        const { status, body } = await getJson('/api/games?page=1');
        expect(status).toBe(200);
        expect(body.games).toHaveLength(25);
        expect(body.count).toBe(25);
        expect(syncPage).toHaveBeenCalledWith(1);
    });

    it('still answers when the background sync fails', async () => {
        syncPage.mockRejectedValue(new Error('tracker down'));
        const { status, body } = await getJson('/api/games?page=1');
        expect(status).toBe(200);
        expect(body.games).toHaveLength(25);
    });

    it('waits for the sync on a page with nothing stored yet', async () => {
        syncPage.mockImplementation(async () => {
            db.saveGames(olderGames);
            return { count: olderGames.length };
        });
        const { body } = await getJson('/api/games?page=2');
        expect(syncPage).toHaveBeenCalledWith(2);
        expect(body.count).toBe(50);
        expect(body.games.map(g => g.id).sort()).toEqual(olderGames.map(g => g.id).sort());
    });
});

describe('GET /api/pilot/:name/ppi', () => {
    it('returns the cached row for a known pilot', async () => {
        const { body } = await getJson('/api/pilot/STITCH/ppi');
        expect(body.name).toBe('STITCH');
        expect(body.games).toBeGreaterThan(0);
    });

    it('answers a cache miss with {} and does not rebuild the cache', async () => {
        const refresh = vi.spyOn(db, 'refreshPilotStats');
        const { status, body } = await getJson('/api/pilot/NOBODY/ppi');
        expect(status).toBe(200);
        expect(body).toEqual({});
        expect(refresh).not.toHaveBeenCalled();
        refresh.mockRestore();
    });
});
