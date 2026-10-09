import fs from 'fs';
import os from 'os';
import path from 'path';
import Database from 'better-sqlite3';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { byId, day, detailSample, onDay, sample } from './testFixtures.js';
import { DAY_MS, HOUR_MS, SNAPSHOT, dayStart, fightNightDay, localClock, shiftDay } from './lib/gameParse.js';

// Server history (S15) on the fixtures' servers: the server browser entries are
// built from the `server` objects stored with the sample games.
const serverOf = id => byId(id).server;
const entry = (id, game, online = true) => {
    const s = serverOf(id);
    return { server: { ip: s.ip, name: s.name, serverNotes: s.notes, version: s.version, lastSeen: s.lastSeen, online }, ...(game && { game }) };
};
const match = (players, max = 16) => ({ currentPlayers: players, maxPlayers: max, inLobby: false, mapName: 'Vault', mode: 'ANARCHY' });
const lobby = players => ({ ...match(players), inLobby: true });
const DALLAS = serverOf(72108).ip;
const AMSTERDAM = serverOf(72107).ip;
const SYDNEY = serverOf(72086).ip;

// 20:00 Chicago time on `day` (three days ago), well inside the 30-day window
const t0 = Date.parse(dayStart(day)) + 14 * HOUR_MS;

let dataDir;
let db;
let hot;

beforeAll(async () => {
    dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ofc-servers-'));
    process.env.DATA_DIR = dataDir;
    const pragma = vi.spyOn(Database.prototype, 'pragma');
    db = (await import('./db.js')).default;
    hot = pragma.mock.contexts.find(c => c.name.endsWith('tracker.db'));
    pragma.mockRestore();
});

afterAll(async () => {
    await db.close?.();
    fs.rmSync(dataDir, { recursive: true, force: true });
});

const hourRow = (ip, at) => hot.prepare('SELECT * FROM server_hours WHERE ip = ? AND hour = ?').get(ip, Math.floor(at / HOUR_MS));

describe('saveServerSnapshot', () => {
    it('stores each listed server once per tick and adds the tick to its hour', () => {
        const tick = [
            entry(72108, match(6)),
            entry(72107, lobby(2)),
            entry(72086, null, false),
            entry(72108, match(9)), // listed twice: the first counts
            { server: { name: 'no ip' } }
        ];
        expect(db.saveServerSnapshot(t0, tick)).toBe(3);
        // the same tick again (a timer that fired twice) adds nothing to the hours
        expect(db.saveServerSnapshot(t0, tick)).toBe(0);
        db.saveServerSnapshot(t0 + SNAPSHOT.everyMs, [entry(72108, match(8)), entry(72107), entry(72086, null, false)]);

        expect(hot.prepare('SELECT COUNT(*) FROM server_snapshots').pluck().get()).toBe(6);
        expect(hourRow(DALLAS, t0)).toMatchObject({ samples: 2, online: 2, lobby: 0, match: 2, pilots: 14, match_pilots: 14, peak: 8 });
        expect(hourRow(AMSTERDAM, t0)).toMatchObject({ samples: 2, online: 2, lobby: 1, match: 0, pilots: 2, match_pilots: 0, peak: 2 });
        expect(hourRow(SYDNEY, t0)).toMatchObject({ samples: 2, online: 0, match: 0, pilots: 0, peak: 0 });
        expect(db.getServerListing(DALLAS)).toMatchObject({ name: 'Overloader: Dallas, TX', notes: 'Big things happen in the big D', first_seen: new Date(t0).toISOString(), last_seen: new Date(t0 + SNAPSHOT.everyMs).toISOString() });
    });
});

describe('getServerHistory', () => {
    // 08:00 Chicago time the morning after the ticks: `day` is the last whole day
    const now = Date.parse(dayStart(shiftDay(day, 1))) + 2 * HOUR_MS;

    it('counts uptime, use, pilots, the peak and the peak hour over the window', () => {
        const dallas = db.getServerHistory(DALLAS, 30, now);
        const clock = localClock(t0);
        expect(dallas).toMatchObject({
            name: 'Overloader: Dallas, TX', region: 'na-central', days: 30,
            until: fightNightDay(now), since: shiftDay(fightNightDay(now), -30),
            samples: 2, uptime: 1, inUse: 1, avgPilots: 7,
            peak: { pilots: 8, at: new Date(Math.floor(t0 / HOUR_MS) * HOUR_MS).toISOString() },
            busiest: { weekday: clock.weekday, hour: clock.hour, pilots: 7 }
        });
        expect(clock.hour).toBe(20);
        expect(dallas.cells.flat().filter(c => c !== null)).toEqual([7]);
        expect(dallas.lastDay.map(t => [t.at, t.players, t.state])).toEqual([[t0, 6, 2], [t0 + SNAPSHOT.everyMs, 8, 2]]);
        // the same hour from server_hours, for the table under the chart
        expect(dallas.lastDayHours).toEqual([{ hour: Math.floor(t0 / HOUR_MS), samples: 2, online: 2, match: 2, pilots: 14, match_pilots: 14, peak: 8 }]);
        expect(dallas.asOf).toBe(now);

        // a lobby is online but not in use; pilots in it count toward the hour, not the match average
        expect(db.getServerHistory(AMSTERDAM, 30, now)).toMatchObject({ region: 'europe', uptime: 1, inUse: 0, avgPilots: null, peak: { pilots: 2 } });
        expect(db.getServerHistory(SYDNEY, 30, now)).toMatchObject({ region: 'oceania', uptime: 0, inUse: null, avgPilots: null, peak: null, busiest: null });
    });

    it('leaves out today, and hours before the window', () => {
        // on `day` itself the window ends where `day` starts
        const sameDay = db.getServerHistory(DALLAS, 7, t0 + 3 * HOUR_MS);
        expect(sameDay).toMatchObject({ until: day, samples: 0, uptime: null, peak: null });
        expect(sameDay.lastDay).toHaveLength(2);
        // 7 days after `day`, `day` is the first day in a 7-day window, and out of it a day later
        expect(db.getServerHistory(DALLAS, 7, Date.parse(dayStart(shiftDay(day, 7))) + HOUR_MS).samples).toBe(2);
        expect(db.getServerHistory(DALLAS, 7, Date.parse(dayStart(shiftDay(day, 8))) + HOUR_MS)).toMatchObject({ samples: 0, lastDay: [] });
    });

    it('answers a server never stored with the same shape and nothing in it', () => {
        expect(db.getServerHistory('10.0.0.1', 30, now)).toMatchObject({
            ip: '10.0.0.1', name: null, firstSeen: null, region: 'unknown', samples: 0, uptime: null, peak: null, lastDay: []
        });
    });
});

describe('pruneServerSnapshots', () => {
    it('deletes raw ticks past the raw window and keeps the hours', () => {
        expect(db.pruneServerSnapshots(t0 + SNAPSHOT.keepDays * DAY_MS)).toBe(0);
        expect(db.pruneServerSnapshots(t0 + SNAPSHOT.keepDays * DAY_MS + 1)).toBe(3);
        expect(db.pruneServerSnapshots(t0 + SNAPSHOT.everyMs + SNAPSHOT.keepDays * DAY_MS + 1)).toBe(3);
        expect(hot.prepare('SELECT COUNT(*) FROM server_snapshots').pluck().get()).toBe(0);
        expect(hourRow(DALLAS, t0)).toMatchObject({ samples: 2, peak: 8 });
    });
});

describe('region share (region_months)', () => {
    // 72098 without its server, on Amsterdam 1's IP, which the servers table knows;
    // the 2019 detail sample has no server and an IP never listed.
    const noServer = { ...onDay(byId(72098)), id: 90100 };
    delete noServer.server;
    // a server only the servers table knows (listed long ago, no stored match names it), with one match on its IP
    const TOKYO = '10.15.15.15';
    const tokyoMatch = { ...onDay(byId(72099)), id: 90101, ip: TOKYO };
    delete tokyoMatch.server;

    beforeAll(async () => {
        hot.prepare('INSERT INTO servers (ip, name, first_seen, last_seen) VALUES (?, ?, ?, ?)').run(TOKYO, 'Tokyo 1', '2025-01-01T00:00:00.000Z', '2025-01-01T00:00:00.000Z');
        db.saveGames([...sample.map(onDay).filter(g => g.id !== 72098), noServer, tokyoMatch, detailSample]);
        await db.refreshPilotStats();
    });

    const totals = () => {
        const sums = {};
        for (const m of db.getRegionShare().months) for (const [region, n] of Object.entries(m.counts)) sums[region] = (sums[region] || 0) + n;
        return sums;
    };

    it('counts every stored match once, by the region of its server', () => {
        // Amsterdam 1 (8, 72098 by IP), Overloader: Amsterdam (1) and A-Garage (4);
        // San Francisco 1 (7) and San Jose (1); Dallas (3); Sydney (1); Tokyo by the servers table (1); the 2019 sample
        expect(totals()).toEqual({ europe: 13, 'na-west': 8, 'na-central': 3, oceania: 1, asia: 1, unknown: 1 });
        const { months } = db.getRegionShare();
        expect(months.reduce((a, m) => a + m.total, 0)).toBe(db.countGames(null, null).count + db.countColdGames(null, null).count);
        // every month from the 2019 sample's to this one
        expect(months[0].month).toBe(fightNightDay(detailSample.date).slice(0, 7));
        expect(months.at(-1).month).toBe(fightNightDay(Date.now()).slice(0, 7));
    });

    it('brings region_months back in line on the next refresh', async () => {
        const table = () => hot.prepare('SELECT * FROM region_months ORDER BY region, month').all();
        const before = table();
        hot.prepare("INSERT INTO region_months VALUES ('asia', '2001-01', 5)").run();
        hot.prepare("UPDATE region_months SET matches = 99 WHERE region = 'europe'").run();
        await db.refreshPilotStats();
        expect(table()).toEqual(before);
    });
});

describe('a server the answer leaves out', () => {
    it('gets an offline tick while it was listed in the raw window, and a partial listing keeps the stored name', () => {
        const at = t0 + 5 * SNAPSHOT.everyMs;
        const unnamed = { server: { ip: DALLAS, online: true } };
        expect(db.saveServerSnapshot(at, [unnamed])).toBe(3);
        const ticks = hot.prepare('SELECT ip, online, players, state FROM server_snapshots WHERE at = ? ORDER BY ip').all(at);
        expect(ticks).toEqual([
            { ip: DALLAS, online: 1, players: 0, state: 0 },
            { ip: SYDNEY, online: 0, players: 0, state: 0 },
            { ip: AMSTERDAM, online: 0, players: 0, state: 0 }
        ].sort((a, b) => (a.ip < b.ip ? -1 : 1)));
        expect(hourRow(AMSTERDAM, at)).toMatchObject({ samples: 3, online: 2 });
        expect(db.getServerListing(DALLAS)).toMatchObject({ name: 'Overloader: Dallas, TX', notes: 'Big things happen in the big D', last_seen: new Date(at).toISOString() });
        // past the raw window since Amsterdam was last listed, it gets no tick
        expect(db.saveServerSnapshot(t0 + SNAPSHOT.keepDays * DAY_MS + 2 * SNAPSHOT.everyMs, [unnamed])).toBe(1);
    });
});
