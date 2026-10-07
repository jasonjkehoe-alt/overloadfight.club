import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('axios', () => ({ default: { get: vi.fn() } }));

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const readFixture = file => JSON.parse(fs.readFileSync(path.join(repoRoot, file), 'utf8'));
const sample = readFixture('gamelist_sample.json').games;
const detailSample = readFixture('game_detail_sample.json');

// Same move as db.test.js: put the 2025-11-24 samples on a recent day so they
// land in hot storage.
const day = new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10);
const nextDay = new Date(Date.parse(`${day}T00:00:00Z`) + 86400000).toISOString().slice(0, 10);
const shift = Date.parse(`${day}T00:00:00Z`) - Date.parse('2025-11-24T00:00:00Z');
const moved = iso => new Date(Date.parse(iso) + shift).toISOString();
const onDay = game => ({ ...game, date: moved(game.date), settings: { ...game.settings, start: moved(game.settings.start) } });

// The gamelist sends every game with an empty kill log. A hydrated game is the
// same game as /api/game/:id returns it, with kills (shaped like the detail sample's).
const summaries = sample.map(onDay);
const summary = id => structuredClone(summaries.find(g => g.id === id));
const hydrated = id => {
    const game = summary(id);
    const [a, b] = game.players;
    game.kills = [{ ...detailSample.kills[0], attacker: a.name, attackerTeam: a.team, defender: b.name, defenderTeam: b.team, time: 30 }];
    return game;
};
// 72087 cut to a 30 s game, too short to be worth a hydration request.
const short = { ...summary(72087), id: 90020 };
short.settings = { ...short.settings, start: new Date(Date.parse(short.date) - 30000).toISOString() };
// Games either side of the day's end, for the UTC day bounds.
const lastSecond = { ...summary(72090), id: 90021, date: `${day}T23:59:59.999Z` };
const nextMidnight = { ...summary(72090), id: 90022, date: `${nextDay}T00:00:00.000Z` };

let dataDir;
let db;
let backfill;
let axios;

const storedKills = id => {
    const row = db.getGamesForDate(day).find(r => r.id === id) ?? db.getGamesForDate(nextDay).find(r => r.id === id);
    return JSON.parse(row.details).kills;
};

beforeAll(async () => {
    dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ofc-backfill-'));
    process.env.DATA_DIR = dataDir;
    db = (await import('./db.js')).default;
    backfill = (await import('./backfill.js')).default;
    axios = (await import('axios')).default;
    // Yield a macrotask so a hydration loop that never ends hits the test timeout.
    backfill.sleep = () => new Promise(resolve => setImmediate(resolve));
    db.saveGames([...summaries, short, lastSecond, nextMidnight]);
});

afterAll(() => {
    fs.rmSync(dataDir, { recursive: true, force: true });
});

beforeEach(() => {
    axios.get.mockReset();
});

describe('saveGames upsert', () => {
    it('keeps a hydrated kill log when the page-1 summary comes in again', () => {
        db.saveGames([hydrated(72108)]);
        db.saveGames([summary(72108)]);
        expect(storedKills(72108)).toHaveLength(1);
    });

    it('still replaces a summary with a hydrated game', () => {
        db.saveGames([summary(72107)]);
        db.saveGames([hydrated(72107)]);
        expect(storedKills(72107)).toHaveLength(1);
    });

    it('keeps a hydrated kill log in cold storage too', () => {
        const old = { ...detailSample, id: 90030 };
        db.saveGames([old]);
        db.saveGames([{ ...old, kills: [] }]);
        const stored = db.getColdGames(10, 0).map(r => JSON.parse(r.details)).find(g => g.id === 90030);
        expect(stored.kills).toHaveLength(1);
    });
});

describe('getSummaryGames', () => {
    it('selects games without a kill log that ran over a minute, in id order', () => {
        db.saveGames([hydrated(72106)]);
        const ids = db.getSummaryGames.all(0, 1000).map(r => r.id);
        expect(ids).toContain(72105);
        expect(ids).not.toContain(72106);
        expect(ids).not.toContain(90020);
        expect(ids).toEqual([...ids].sort((x, y) => x - y));
    });

    it('starts after the id it is given', () => {
        expect(db.getSummaryGames.all(72100, 2).map(r => r.id)).toEqual([72101, 72102]);
    });
});

describe('backfill', () => {
    it('stores a fetched game and marks it fetched', async () => {
        axios.get.mockResolvedValueOnce({ data: hydrated(72104) });
        const result = await backfill.fetchGame(72104);
        expect(result).toMatchObject({ success: true, gameId: 72104 });
        expect(db.getGameMetadata.get(72104).fetch_status).toBe('fetched');
        expect(storedKills(72104)).toHaveLength(1);
    });

    it('finishes a hydration job when the tracker has no kill log for a game', async () => {
        const remaining = db.getSummaryGames.all(0, 1000).length;
        const asListed = id => [...summaries, lastSecond, nextMidnight].find(g => g.id === id);
        axios.get.mockImplementation(url => Promise.resolve({ data: asListed(Number(url.split('/').pop())) }));
        await backfill.processHydrationJob({ id: 1, rate_limit_ms: 0 });
        expect(axios.get).toHaveBeenCalledTimes(remaining);
    });

    it('resumes a paused hydration job at the game it had not fetched', async () => {
        axios.get.mockRejectedValue(new Error('timeout'));
        await backfill.processHydrationJob({ id: 1, rate_limit_ms: 0, current_id: 72100 });
        expect(axios.get.mock.calls[0][0]).toMatch(/\/game\/72100$/);
    });

    it('finishes a hydration job when every fetch fails', async () => {
        const remaining = db.getSummaryGames.all(0, 1000).length;
        axios.get.mockRejectedValue(new Error('timeout'));
        await backfill.processHydrationJob({ id: 1, rate_limit_ms: 0 });
        expect(axios.get).toHaveBeenCalledTimes(remaining);
    });
});

describe('fight-night day queries', () => {
    it('returns a UTC day from midnight up to, not including, the next midnight', () => {
        const ids = db.getGamesForDate(day).map(r => r.id);
        expect(ids).toContain(90021);
        expect(ids).not.toContain(90022);
        expect(db.getGamesForDate(nextDay).map(r => r.id)).toEqual([90022]);
    });

    it('returns no games for a string that is not a day', () => {
        expect(db.getGamesForDate('foo')).toEqual([]);
        expect(db.getGamesForDate(day.slice(0, 7))).toEqual([]);
    });

    it('counts a qualifying fight night from the same day bounds', () => {
        expect(db.getQualifyingFightNightDates({ minMatches: 16, minPilots: 1, minFrags: 1 })).toEqual([day]);
    });
});
