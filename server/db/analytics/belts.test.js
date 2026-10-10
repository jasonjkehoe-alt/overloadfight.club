import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import Database from 'better-sqlite3';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { byId, day, ffaWithLog, movedTo, onDay, sample, teamWithLog, veteranSoup } from '../../testFixtures.js';
import { ACHIEVEMENTS, fightNightDay, shiftDay } from '../../lib/gameParse.js';

// Belts and achievements (S21) through the real refresh, on the sample moved to
// `day` with 72099 and 72098 carrying their kill logs, the 2019 Monsterball
// match in cold storage (Soup's first match) and two more matches on `day`:
// 72085 again at 23:00 UTC with B2AF 21 against BEHEMOTH 20, which passes the
// Anarchy belt, and at 23:30 with BEHEMOTH 21, which wins it back. Anarchy:
// BEHEMOTH crowned by 72084 (the fight-night day before `day`), defended in
// 72085, lost in 90100 and won back in 90101. Team Anarchy: INSANER crowned by
// 72095 on `day`, defended in 72096, 72097, 72099 and 72102.
const games = sample.map(g => (g.id === 72099 ? teamWithLog : g.id === 72098 ? ffaWithLog : g)).map(g => onDay(structuredClone(g)));
const upset = { ...movedTo(byId(72085), `${day}T23:00:00.000Z`), id: 90100, players: byId(72085).players.map(p => ({ ...p, kills: p.name === 'B2AF' ? 21 : 20 })) };
const comeback = { ...movedTo(byId(72085), `${day}T23:30:00.000Z`), id: 90101, players: byId(72085).players.map(p => ({ ...p, kills: p.name === 'BEHEMOTH' ? 21 : 20 })) };
const template = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'index.html'), 'utf8');
const ORIGIN = 'https://overloadfight.club';
const today = fightNightDay(Date.now());

let dataDir;
let db;
let withPageMeta;
let server;
let base;

beforeAll(async () => {
    dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ofc-belts-'));
    process.env.DATA_DIR = dataDir;
    db = (await import('../../db.js')).default;
    ({ withPageMeta } = await import('../../pageMeta.js'));
    db.saveGames([...games, upset, comeback, veteranSoup]);
    await db.refreshPilotStats();
    const app = express();
    app.use('/api', (await import('../../routes/pilots.js')).default);
    app.use('/api', (await import('../../routes/stats.js')).default);
    app.use('/api', (await import('../../routes/cards.js')).default);
    server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    base = `http://127.0.0.1:${server.address().port}`;
});

afterAll(async () => {
    await new Promise(resolve => server.close(resolve));
    await db.close();
    fs.rmSync(dataDir, { recursive: true, force: true });
});

const unescape = text => text.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(code));
const tags = url => Object.fromEntries([...withPageMeta(template, ORIGIN, url).matchAll(/<meta (?:property|name)="([^"]+)" content="([^"]*)"/g)].map(m => [m[1], unescape(m[2])]));
const mode = (belts, id) => belts.modes.find(m => m.mode === id);
const achievement = (honours, id) => honours.achievements.find(a => a.id === id);

describe('getBelts', () => {
    it('gives each mode its champion, the day and match they won it, from whom and their defenses', () => {
        const belts = db.getBelts();
        expect(belts.day).toBe(today);
        expect(belts.modes.map(m => m.mode)).toEqual(['ANARCHY', 'TEAM ANARCHY', 'CTF', 'MONSTERBALL']);
        const anarchy = mode(belts, 'ANARCHY');
        expect(anarchy.holder).toMatchObject({
            reign: 3, name: 'BEHEMOTH', since: fightNightDay(comeback.date), game: 90101, defenses: 0, until: null,
            from: { pilot: 'b2af', name: 'B2AF' }, days: Math.max(0, (Date.parse(today) - Date.parse(fightNightDay(comeback.date))) / 86400000)
        });
        // the line of holders, newest first
        expect(anarchy.lineage.map(r => [r.reign, r.name, r.defenses, r.until, r.lost_game])).toEqual([
            [3, 'BEHEMOTH', 0, null, null],
            [2, 'B2AF', 0, fightNightDay(comeback.date), 90101],
            [1, 'BEHEMOTH', 1, fightNightDay(upset.date), 90100]
        ]);
        expect(anarchy.lineage[2]).toMatchObject({ since: shiftDay(day, -1), game: 72084, from: null, days: 1 });
        expect(mode(belts, 'TEAM ANARCHY').holder).toMatchObject({ name: 'INSANER', since: day, game: 72095, defenses: 4, from: null });
        // no rated CTF match with a winner; the 2019 Monsterball is a one-pilot match
        expect(mode(belts, 'CTF')).toMatchObject({ holder: null, lineage: [] });
        expect(mode(belts, 'MONSTERBALL').holder).toBeNull();
    });

    it('counts the pilots who reached each tier of each achievement', () => {
        const { achievements } = db.getBelts();
        expect(Object.keys(achievements)).toEqual(ACHIEVEMENTS.map(a => a.id));
        const pilots = id => achievements[id];
        // BEHEMOTH, INSANER and B2AF each won a belt
        expect(pilots('belts')).toEqual([3, 0, 0]);
        // Soup's 2019 match: gold; the rest started on the fight-night days around `day`
        expect(pilots('years')).toEqual([1, 1, 1]);
        // INSANER's five in a row reached silver, PHOENIX's four bronze; a silver counts toward bronze
        expect(pilots('win_streak')[1]).toBe(1);
        expect(pilots('win_streak')[0]).toBeGreaterThanOrEqual(2);
        // B2AF over BEHEMOTH, then BEHEMOTH over B2AF
        expect(pilots('boss_slayer')).toEqual([2, 0, 0]);
    });
});

describe('getPilotAchievements', () => {
    it('lists every achievement with its count, tier, the day and match earned and the next threshold', () => {
        const insaner = db.getPilotAchievements('insaner');
        expect(insaner.achievements.map(a => a.id)).toEqual(ACHIEVEMENTS.map(a => a.id));
        expect(achievement(insaner, 'defenses')).toEqual({ id: 'defenses', value: 4, tier: 1, earned: day, game: 72099, next: 10 });
        expect(achievement(insaner, 'belts')).toEqual({ id: 'belts', value: 1, tier: 1, earned: day, game: 72095, next: 3 });
        expect(achievement(insaner, 'win_streak')).toMatchObject({ value: 5, tier: 2, game: 72102, next: 10 });
        // not earned: a count and the first threshold
        expect(achievement(insaner, 'matches')).toEqual({ id: 'matches', value: 5, tier: 0, earned: null, game: null, next: 100 });
        expect(achievement(insaner, 'boss_slayer')).toEqual({ id: 'boss_slayer', value: 0, tier: 0, earned: null, game: null, next: 1 });
        expect(insaner.belts).toEqual([expect.objectContaining({ mode: 'TEAM ANARCHY', label: 'Team Anarchy', reign: 1, until: null, defenses: 4 })]);
    });

    it('agrees with the career cards and the clutch rows', () => {
        for (const name of ['WD-40', 'INSANER', 'JFTP', 'STITCH', 'B2AF']) {
            const honours = db.getPilotAchievements(name);
            const cached = db.getPilotPPI(name);
            expect([achievement(honours, 'matches').value, achievement(honours, 'kills').value, achievement(honours, 'wins').value]).toEqual([cached.games, cached.kills, cached.wins]);
            const { clutch } = db.getPilotRivalry(name);
            const sum = field => clutch.reduce((n, c) => n + c[field], 0);
            expect([achievement(honours, 'first_bloods').value, achievement(honours, 'late_kills').value, achievement(honours, 'trailing_kills').value])
                .toEqual([sum('first_bloods'), sum('late_kills'), sum('trailing_kills')]);
        }
    });

    it('gives B2AF Boss Slayer and a reign that ended, BEHEMOTH both reigns newest first', () => {
        const b2af = db.getPilotAchievements('b2af');
        expect(achievement(b2af, 'boss_slayer')).toMatchObject({ value: 1, tier: 1, earned: fightNightDay(upset.date), game: 90100 });
        expect(b2af.belts).toEqual([expect.objectContaining({ mode: 'ANARCHY', reign: 2, until: fightNightDay(comeback.date), lost_game: 90101, from: { pilot: 'behemoth', name: 'BEHEMOTH' } })]);
        expect(db.getPilotAchievements('BEHEMOTH').belts).toEqual([
            expect.objectContaining({ mode: 'ANARCHY', reign: 3, until: null, from: { pilot: 'b2af', name: 'B2AF' } }),
            expect.objectContaining({ mode: 'ANARCHY', reign: 1, until: fightNightDay(upset.date), lost_game: 90100, defenses: 1 })
        ]);
    });

    it('dates the anniversary from the first match in cold storage', () => {
        const soup = db.getPilotAchievements('Soup');
        const first = fightNightDay(veteranSoup.date);
        const years = Number(today.slice(0, 4)) - Number(first.slice(0, 4)) - (today.slice(5) < first.slice(5) ? 1 : 0);
        expect(achievement(soup, 'years')).toEqual({ id: 'years', value: years, tier: 3, earned: `${Number(first.slice(0, 4)) + 5}${first.slice(4)}`, game: null, next: null });
    });

    it('answers zeros for a pilot with nothing and one never stored', () => {
        for (const name of ['NOBODY', '']) {
            const none = db.getPilotAchievements(name);
            expect(none.belts).toEqual([]);
            expect(none.achievements.every(a => a.value === 0 && a.tier === 0 && a.earned === null)).toBe(true);
        }
    });
});

describe('getBeltChanges', () => {
    it('names the belts that changed hands on a fight-night day', () => {
        expect(db.getBeltChanges(day).map(r => [r.mode, r.name, r.from?.name ?? null])).toEqual([
            ['TEAM ANARCHY', 'INSANER', null],
            ['ANARCHY', 'B2AF', 'BEHEMOTH'],
            ['ANARCHY', 'BEHEMOTH', 'B2AF']
        ]);
        expect(db.getBeltChanges(shiftDay(day, -1)).map(r => r.name)).toEqual(['BEHEMOTH']);
        expect(db.getBeltChanges(shiftDay(day, 1))).toEqual([]);
        expect(db.getBeltChanges('not a day')).toEqual([]);
    });
});

describe('the tables', () => {
    it('keeps a reign\'s end as the next one\'s start, and both tables in the built marker', () => {
        const conn = new Database(path.join(dataDir, 'tracker.db'), { readonly: true });
        try {
            const reigns = conn.prepare("SELECT * FROM belt_reigns WHERE mode = 'ANARCHY' ORDER BY reign").all();
            expect(reigns[0].until).toBe(reigns[1].since);
            expect(reigns[0].lost_game).toBe(reigns[1].game);
            expect(conn.prepare("SELECT COUNT(*) AS n FROM pilot_achievements WHERE value <= 0").get().n).toBe(0);
        } finally {
            conn.close();
        }
        expect(db.derivedTablesBuilt()).toBe(true);
    });
});

describe('the routes', () => {
    it('answers the belts and a pilot\'s achievements', async () => {
        const belts = await (await fetch(`${base}/api/stats/belts`)).json();
        expect(mode(belts, 'ANARCHY').holder.name).toBe('BEHEMOTH');
        const res = await fetch(`${base}/api/pilot/INSANER/achievements`);
        expect(res.status).toBe(200);
        expect(achievement(await res.json(), 'defenses').value).toBe(4);
        // an unknown pilot is a 200 with zeros, so the page logs no error
        const none = await fetch(`${base}/api/pilot/NOBODY/achievements`);
        expect(none.status).toBe(200);
        expect((await none.json()).belts).toEqual([]);
    });

    it('draws the belts card and the pilot card with the belt tile', async () => {
        const card = await fetch(`${base}/api/card/belts`);
        expect(card.status).toBe(200);
        expect(card.headers.get('content-type')).toBe('image/png');
        const pilot = await fetch(`${base}/api/card/pilot/BEHEMOTH`);
        expect(pilot.status).toBe(200);
    });
});

describe('the share tags', () => {
    it('describes /belts by its champions, with its card', () => {
        const t = tags('/belts');
        expect(t['og:title']).toBe('Belts | overloadfight.club');
        expect(t['og:description']).toBe(`Champions: Anarchy BEHEMOTH (since ${fightNightDay(comeback.date)}, 0 defenses), Team Anarchy INSANER (since ${day}, 4 defenses).`);
        expect(t['og:image']).toMatch(/^https:\/\/overloadfight\.club\/api\/card\/belts\?v=[0-9a-f]{12}$/);
    });

    it('names a champion\'s belt in their pilot description', () => {
        expect(tags('/pilot/insaner')['og:description']).toMatch(/\. Team Anarchy champion since .+, 4 defenses\.$/);
        expect(tags('/pilot/WD-40')['og:description']).not.toMatch(/champion/);
    });
});
