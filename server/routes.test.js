import fs from 'fs';
import os from 'os';
import path from 'path';
import express from 'express';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { day, onDay, sample, veteranSoup } from './testFixtures.js';

const syncPage = vi.fn();
vi.mock('./ingest.js', () => ({ default: { syncPage } }));
// Keep the tests off Redis.
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
        console.log('DBG', JSON.stringify(body).slice(0,400));
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

describe('GET /api/pilot/:name/stats', () => {
    it('says recent for a pilot with matches in the last 365 days', async () => {
        const { body } = await getJson('/api/pilot/STITCH/stats');
        expect(body.scope).toBe('recent');
    });

    it('says all when a pilot with nothing in 365 days falls back to the all-time record', async () => {
        // The 2019 sample, with Soup (who also plays in the recent sample) renamed.
        const asVeteran = name => (name === 'Soup' ? 'VETERAN' : name);
        db.saveGames([{ ...veteranSoup, players: veteranSoup.players.map(p => ({ ...p, name: asVeteran(p.name) })) }]);
        const { body } = await getJson('/api/pilot/VETERAN/stats');
        expect(body.name).toBe('VETERAN');
        expect(body.scope).toBe('all');
    });
});

describe('GET /api/stats/pilots', () => {
    it('answers all-time stats when source=all', async () => {
        const { status, body } = await getJson('/api/stats/pilots?source=all');
        expect(status).toBe(200);
        expect(Array.isArray(body)).toBe(true);
        expect(body.length).toBeGreaterThan(0);
        const pilot = body.find(p => p.name === 'STITCH');
        expect(pilot).toBeDefined();
        expect(pilot.games).toBeGreaterThan(0);
    });

    it('answers windowed stats with win_rate, wins, losses, ties, kd, kda when startDate is provided', async () => {
        const { status, body } = await getJson('/api/stats/pilots?startDate=' + encodeURIComponent(day) + '&source=hot');
        expect(status).toBe(200);
        expect(Array.isArray(body)).toBe(true);
        expect(body.length).toBeGreaterThan(0);
        const pilot = body.find(p => p.name === 'STITCH');
        expect(pilot).toBeDefined();
        expect(pilot.games).toBeGreaterThan(0);
        expect(pilot.kd).toBeDefined();
        expect(pilot.kda).toBeDefined();
        expect(pilot.wins).toBeDefined();
        expect(pilot.losses).toBeDefined();
        expect(pilot.win_rate).toBeDefined();
    });

    it('answers empty array for future startDate', async () => {
        const { status, body } = await getJson('/api/stats/pilots?startDate=2099-01-01T00:00:00.000Z&source=hot');
        expect(status).toBe(200);
        expect(body).toEqual([]);
    });
});
