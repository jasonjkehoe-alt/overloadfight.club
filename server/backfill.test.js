import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { day, detailSample, onDay, sample } from './testFixtures.js';

vi.mock('axios', () => ({ default: { get: vi.fn() } }));

const nextDay = new Date(Date.parse(`${day}T00:00:00Z`) + 86400000).toISOString().slice(0, 10);

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
// The gamelist games, saved once in beforeAll.
const listed = [...summaries, lastSecond, nextMidnight];

let dataDir;
let db;
let backfill;
let axios;

const storedKills = id => JSON.parse(db.getGameById.get(id).details).kills;

beforeAll(async () => {
    dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ofc-backfill-'));
    process.env.DATA_DIR = dataDir;
    db = (await import('./db.js')).default;
    backfill = (await import('./backfill.js')).default;
    axios = (await import('axios')).default;
    // Yield a macrotask so a hydration loop that never ends hits the test timeout.
    backfill.sleep = () => new Promise(resolve => setImmediate(resolve));
    db.saveGames([...listed, short]);
});

afterAll(async () => {
    await new Promise(resolve => setTimeout(resolve, 60));
    await db.close?.();
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
        expect(storedKills(90030)).toHaveLength(1);
    });
});

describe('saveColdGamesBatch upsert', () => {
    it('keeps a stored kill log when re-inserted with an empty kill log', () => {
        const old = { ...detailSample, id: 90040 };
        db.saveColdGamesBatch([old]);
        db.saveColdGamesBatch([{ ...old, kills: [] }]);
        expect(storedKills(90040)).toHaveLength(1);
    });

    it('overwrites a stored kill log when re-inserted with a non-empty kill log', () => {
        const old = { ...detailSample, id: 90041 };
        db.saveColdGamesBatch([old]);
        const updated = {
            ...old,
            kills: [
                ...old.kills,
                { ...old.kills[0], time: 99 }
            ]
        };
        db.saveColdGamesBatch([updated]);
        expect(storedKills(90041)).toHaveLength(2);
    });
});

describe('updateGameDetails', () => {
    it('keeps a stored kill log when updated with an empty kill log', () => {
        const game = { ...hydrated(72108), id: 90050 };
        db.saveGames([game]);
        db.updateGameDetails({ ...game, kills: [] });
        expect(storedKills(90050)).toHaveLength(1);
    });

    it('overwrites a stored kill log when updated with a non-empty kill log', () => {
        const game = { ...hydrated(72108), id: 90051 };
        db.saveGames([game]);
        const updated = {
            ...game,
            kills: [
                ...game.kills,
                { ...game.kills[0], time: 99 }
            ]
        };
        db.updateGameDetails(updated);
        expect(storedKills(90051)).toHaveLength(2);
    });

    it('preserves kill log for cold storage games as well', () => {
        const coldGame = { ...detailSample, id: 90052 };
        db.saveGames([coldGame]);
        db.updateGameDetails({ ...coldGame, kills: [] });
        expect(storedKills(90052)).toHaveLength(1);
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
        axios.get.mockImplementation(url => Promise.resolve({ data: listed.find(g => g.id === Number(url.split('/').pop())) }));
        await backfill.processHydrationJob({ id: 1, rate_limit_ms: 0 });
        expect(axios.get).toHaveBeenCalledTimes(remaining);
    });

    it('resumes a paused hydration job after the last game it processed', async () => {
        axios.get.mockRejectedValue(new Error('timeout'));
        await backfill.processHydrationJob({ id: 1, rate_limit_ms: 0, current_id: 72099 });
        expect(axios.get.mock.calls[0][0]).toMatch(/\/game\/72100$/);
    });

    it('finishes a hydration job when every fetch fails', async () => {
        const remaining = db.getSummaryGames.all(0, 1000).length;
        axios.get.mockRejectedValue(new Error('timeout'));
        await backfill.processHydrationJob({ id: 1, rate_limit_ms: 0 });
        expect(axios.get).toHaveBeenCalledTimes(remaining);
    });

    it('hydrating a game with suicides refreshes stats cache without waiting for interval', async () => {
        const testId = 88888;
        const summaryGame = {
            id: testId,
            date: '2024-01-01T12:00:00.000Z',
            settings: { matchMode: 'ANARCHY', level: 'TITAN', timeLimit: 300 },
            players: [
                { name: 'SUICIDE_PILOT', kills: 0, deaths: 1 },
                { name: 'OTHER_PILOT', kills: 1, deaths: 0 }
            ],
            kills: []
        };
        db.saveGames([summaryGame]);
        await db.refreshPilotStats();

        // Initially 0 suicides in cache
        const ppiBefore = db.getPilotPPI('SUICIDE_PILOT');
        expect(ppiBefore?.suicides || 0).toBe(0);

        // Spy on triggerStatsRefresh
        const refreshSpy = vi.spyOn(backfill, 'triggerStatsRefresh');

        // Hydrate the game with 1 suicide
        const hydratedGame = {
            ...summaryGame,
            kills: [
                { attacker: 'SUICIDE_PILOT', defender: 'SUICIDE_PILOT', weapon: 'Suicide', time: 70 }
            ]
        };
        axios.get.mockResolvedValueOnce({ data: hydratedGame });

        await backfill.processHydrationJob({ id: 99, rate_limit_ms: 0, current_id: testId - 1 });

        expect(refreshSpy).toHaveBeenCalled();
        refreshSpy.mockRestore();

        // Run the refresh directly to simulate setImmediate completion in sync test
        await db.refreshPilotStats();

        const ppiAfter = db.getPilotPPI('SUICIDE_PILOT');
        expect(ppiAfter).toBeDefined();
        expect(ppiAfter.suicides).toBe(1);
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
