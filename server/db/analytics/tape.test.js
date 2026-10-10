import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import Database from 'better-sqlite3';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ffaWithDamage, onDay, sample, teamWithDamage } from '../../testFixtures.js';

// The Tale of the Tape (S20) on fixture data: the sample with 72099 and 72098
// carrying their kill and damage logs. The pairs:
// STITCH and PHOENIX: FFA 72104 and 72103 (STITCH ahead), team 72102, 72099,
//   72097 and 72096 (PHOENIX's BLUE ahead); 72099 logged: STITCH 2 kills and
//   250 damage on PHOENIX, PHOENIX 1 and 60 on STITCH.
// WD-40 and OKSTER: 1v1 duels 72090, 72089, 72086 (OKSTER ahead), 72088
//   (WD-40), 72087 (1-1); three-way 72094, 72091 (WD-40 ahead), 72093, 72092.
// JFTP and ".": duels 72101, 72100 (JFTP), 72098 logged (2-2, 210 damage
//   against 180.5).
// ZERGLING played only 72108, so never met WD-40.
const games = sample.map(g => (g.id === 72099 ? teamWithDamage : g.id === 72098 ? ffaWithDamage : g)).map(g => onDay(structuredClone(g)));
const template = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'index.html'), 'utf8');
const ORIGIN = 'https://overloadfight.club';

let dataDir;
let db;
let withPageMeta;
let server;
let base;

beforeAll(async () => {
    dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ofc-tape-'));
    process.env.DATA_DIR = dataDir;
    db = (await import('../../db.js')).default;
    ({ withPageMeta } = await import('../../pageMeta.js'));
    db.saveGames(games);
    await db.refreshPilotStats();
    const app = express();
    app.use('/api', (await import('../../routes/pilots.js')).default);
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

// each tag's content, its escaped characters read back
const unescape = text => text.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(code));
const tags = url => Object.fromEntries([...withPageMeta(template, ORIGIN, url).matchAll(/<meta (?:property|name)="([^"]+)" content="([^"]*)"/g)].map(m => [m[1], unescape(m[2])]));

describe('getTape', () => {
    it('reads the record, the logged kills and damage and the map splits from the first pilot\'s side', () => {
        const tape = db.getTape('stitch', 'Phoenix');
        expect(tape.pilots.map(p => p.name)).toEqual(['STITCH', 'PHOENIX']);
        expect(tape.mode).toBeNull();
        expect(tape.record).toEqual({ matches: 6, wins: 2, losses: 4, ties: 0 });
        expect(tape.logged).toEqual({ matches: 1, kills: 2, deaths: 1, damage_dealt: 250, damage_taken: 60 });
        expect(tape.modes).toEqual([{ mode: 'TEAM ANARCHY', matches: 4 }, { mode: 'ANARCHY', matches: 2 }]);
        expect(tape.maps.map(m => `${m.map}:${m.wins}-${m.losses}-${m.ties}`)).toEqual(['ASCENT:0-2-0', 'BLIZZARD:1-0-0', 'SKYBOX V1.2:0-1-0', 'SWAT:0-1-0', 'TERMINAL:1-0-0']);
        // no 1v1 between them
        expect(tape.duels).toBeNull();
        // the other order is the same tape mirrored
        const back = db.getTape('PHOENIX', 'STITCH');
        expect(back.record).toEqual({ matches: 6, wins: 4, losses: 2, ties: 0 });
        expect(back.logged).toEqual({ matches: 1, kills: 1, deaths: 2, damage_dealt: 60, damage_taken: 250 });
    });

    it('agrees with the kill-log rivals card on the logged numbers', () => {
        const rival = db.getPilotRivalry('STITCH').opponents.find(o => o.opponent === 'phoenix');
        const { logged } = db.getTape('STITCH', 'PHOENIX');
        expect(logged).toEqual({ matches: rival.matches, kills: rival.kills, deaths: rival.deaths, damage_dealt: rival.damage_dealt, damage_taken: rival.damage_taken });
        // 180.5 rounds as pilot_rivals rounds it
        const dot = db.getTape('.', 'JFTP');
        expect(dot.logged).toMatchObject({ damage_dealt: 181, damage_taken: 210 });
        expect(db.getPilotRivalry('.').opponents[0]).toMatchObject({ damage_dealt: 181, damage_taken: 210 });
    });

    it('filters the head-to-head by mode and keeps the career all-mode', () => {
        const all = db.getTape('STITCH', 'PHOENIX');
        const team = db.getTape('STITCH', 'PHOENIX', 'TEAM ANARCHY');
        expect(team.record).toEqual({ matches: 4, wins: 0, losses: 4, ties: 0 });
        expect(team.logged.kills).toBe(2);
        expect(team.maps.map(m => m.map)).toEqual(['ASCENT', 'SKYBOX V1.2', 'SWAT']);
        expect(db.getTape('STITCH', 'PHOENIX', 'ANARCHY').record).toEqual({ matches: 2, wins: 2, losses: 0, ties: 0 });
        const ctf = db.getTape('STITCH', 'PHOENIX', 'CTF');
        expect(ctf.record).toEqual({ matches: 0, wins: 0, losses: 0, ties: 0 });
        expect(ctf.logged).toEqual({ matches: 0, kills: 0, deaths: 0, damage_dealt: 0, damage_taken: 0 });
        expect(ctf.maps).toEqual([]);
        // the switch still lists the modes they met in, and the career does not move
        expect(ctf.modes).toEqual(all.modes);
        expect(ctf.pilots).toEqual(all.pilots);
    });

    it('reads each corner\'s career as the pilot page does', () => {
        const [stitch] = db.getTape('STITCH', 'PHOENIX').pilots;
        const cached = db.getPilotPPI('STITCH');
        const rating = db.getPilotRating('STITCH');
        expect(stitch.career).toEqual({ matches: cached.games, wins: cached.wins, losses: cached.losses, ties: cached.ties, win_rate: cached.win_rate, combat_ratio: Math.max(0, cached.kda), lethality: cached.kpm });
        expect(stitch.rating).toEqual({ rating: rating.rating, rd: rating.rd, matches: rating.matches, status: rating.status, rank: rating.rank });
        // STITCH's ranked matches in the sample: 72106, 72105, 72104, 72103, 72102, 72099, 72097, 72096
        expect(stitch.career.matches).toBe(8);
    });

    it('gives the duel record under every mode only, since pilot_duels keeps no mode', () => {
        expect(db.getTape('WD-40', 'OKSTER').record).toEqual({ matches: 9, wins: 3, losses: 5, ties: 1 });
        expect(db.getTape('WD-40', 'OKSTER').duels).toMatchObject({ wins: 1, losses: 3, ties: 1 });
        expect(db.getTape('OKSTER', 'WD-40').duels).toMatchObject({ wins: 3, losses: 1, ties: 1 });
        expect(db.getTape('JFTP', '.').duels).toMatchObject({ wins: 2, losses: 0, ties: 1 });
        expect(db.getTape('WD-40', 'OKSTER', 'ANARCHY').duels).toBeNull();
        expect(db.getTape('WD-40', 'OKSTER', 'MONSTERBALL').duels).toBeNull();
    });

    it('gives two pilots who never met their careers and an empty head-to-head', () => {
        const tape = db.getTape('ZERGLING', 'WD-40');
        expect(tape.record.matches).toBe(0);
        expect(tape.modes).toEqual([]);
        expect(tape.pilots.map(p => p.career?.matches)).toEqual([1, 10]);
    });

    it('names a pilot with no stored match, and calls one pilot twice the same', () => {
        expect(db.getTape('NOBODY', 'WD-40')).toEqual({ missing: ['NOBODY'] });
        expect(db.getTape('NOBODY', 'NOONE')).toEqual({ missing: ['NOBODY', 'NOONE'] });
        expect(db.getTape('wd-40', 'WD-40 ')).toEqual({ same: 'WD-40' });
    });
});

describe('getPilotOpponents', () => {
    it('lists the opponents met most, with the record and logged kills from the pilot\'s side', () => {
        const rows = db.getPilotOpponents('stitch');
        // XB1 in 72106, 72105, 72104, 72103; JFTP the same four; PHOENIX six; MAESTRO and INSANER are team rivals or teammates
        expect(rows[0]).toEqual({ opponent: 'phoenix', name: 'PHOENIX', matches: 6, wins: 2, losses: 4, ties: 0, logged: 1, kills: 2, deaths: 1 });
        expect(rows.map(r => r.name)).toContain('INSANER');
        // MAESTRO is STITCH's teammate in every team match, and they never met in FFA
        expect(rows.map(r => r.name)).not.toContain('MAESTRO');
        for (const r of rows) expect(db.getTape('STITCH', r.name).record).toEqual({ matches: r.matches, wins: r.wins, losses: r.losses, ties: r.ties });
        expect(db.getPilotOpponents('NOBODY')).toEqual([]);
    });
});

describe('the tape\'s routes', () => {
    const get = async url => {
        const res = await fetch(`${base}${url}`);
        return { status: res.status, type: res.headers.get('content-type'), body: res.headers.get('content-type')?.includes('json') ? await res.json() : Buffer.from(await res.arrayBuffer()) };
    };

    it('answers the tape in a mode, and names an unknown pilot or one pilot twice in a 200', async () => {
        const ok = await get('/api/pilot/STITCH/tape/PHOENIX?mode=team%20anarchy');
        expect(ok.status).toBe(200);
        expect(ok.body).toMatchObject({ mode: 'TEAM ANARCHY', record: { matches: 4, losses: 4 } });
        // any other value reads as every mode
        expect((await get('/api/pilot/STITCH/tape/PHOENIX?mode=RACE')).body).toMatchObject({ mode: null, record: { matches: 6 } });
        expect(await get('/api/pilot/NOBODY/tape/PHOENIX')).toMatchObject({ status: 200, body: { missing: ['NOBODY'] } });
        expect(await get('/api/pilot/WD-40/tape/wd-40')).toMatchObject({ status: 200, body: { same: 'WD-40' } });
        expect((await get('/api/pilot/STITCH/opponents')).body[0]).toMatchObject({ name: 'PHOENIX', matches: 6 });
    });

    it('draws the tape\'s card, in a mode too, and none for an unknown pilot', async () => {
        const all = await get('/api/card/tape/STITCH/PHOENIX');
        expect(all).toMatchObject({ status: 200, type: 'image/png' });
        expect([all.body.readUInt32BE(16), all.body.readUInt32BE(20)]).toEqual([1200, 630]);
        expect((await get('/api/card/tape/STITCH/PHOENIX?mode=CTF')).status).toBe(200);
        expect((await get('/api/card/tape/NOBODY/PHOENIX')).status).toBe(404);
        expect((await get('/api/card/tape/WD-40/WD-40')).status).toBe(404);
    }, 30000);
});

describe('the tape\'s share tags', () => {
    it('describes the tape by who leads, with og:image on the tape\'s card under the stored names', () => {
        const t = tags('/tape/stitch/phoenix');
        expect(t['og:title']).toBe('stitch vs phoenix | overloadfight.club');
        expect(t['og:description']).toBe('STITCH vs PHOENIX: PHOENIX leads 4–2 in 6 ranked matches, kills 2–1 in 1 logged match.');
        expect(t['og:url']).toBe(`${ORIGIN}/tape/stitch/phoenix`);
        expect(t['og:image']).toMatch(new RegExp(`^${ORIGIN}/api/card/tape/STITCH/PHOENIX\\?v=[0-9a-f]{12}$`));
        expect(t['twitter:card']).toBe('summary_large_image');
        expect(tags('/tape/WD-40/OKSTER')['og:description']).toBe('WD-40 vs OKSTER: OKSTER leads 5–3, 1 tie in 9 ranked matches.');
    });

    it('carries the mode into the description and the card\'s URL', () => {
        const t = tags('/tape/STITCH/PHOENIX?mode=ANARCHY');
        expect(t['og:description']).toBe('STITCH vs PHOENIX: STITCH leads 2–0 in 2 ranked Anarchy matches.');
        expect(t['og:image']).toMatch(/\/api\/card\/tape\/STITCH\/PHOENIX\?mode=ANARCHY&v=[0-9a-f]{12}$/);
        expect(tags('/tape/STITCH/PHOENIX?mode=CTF')['og:description']).toBe('STITCH vs PHOENIX: no ranked CTF match between them yet.');
    });

    it('says two pilots never met, and falls back to the site description for an unknown pilot or one pilot twice', () => {
        expect(tags('/tape/ZERGLING/WD-40')['og:description']).toBe('ZERGLING vs WD-40: no ranked match between them yet.');
        for (const url of ['/tape/NOBODY/WD-40', '/tape/WD-40/wd-40']) {
            const t = tags(url);
            expect(t['og:description']).toBe('Live Overload servers, match results and pilot stats.');
            expect(t['og:image']).toBeUndefined();
        }
    });
});

describe('pilot_bouts', () => {
    it('is keyed by pilot, opponent, mode and map, and a refresh removes a row the matches no longer give', async () => {
        const file = new Database(path.join(dataDir, 'tracker.db'));
        try {
            expect(file.pragma('table_info(pilot_bouts)').filter(c => c.pk > 0).sort((x, y) => x.pk - y.pk).map(c => c.name)).toEqual(['pilot', 'opponent', 'mode', 'map']);
            file.prepare("INSERT INTO pilot_bouts VALUES ('stitch', 'phoenix', 'CTF', 'VAULT', 3, 3, 0, 0, 0, 0, 0, 0, 0)").run();
            expect(db.getTape('STITCH', 'PHOENIX').record.matches).toBe(9);
            await db.refreshPilotStats();
            expect(db.getTape('STITCH', 'PHOENIX').record.matches).toBe(6);
            expect(file.prepare("SELECT COUNT(*) AS n FROM pilot_bouts WHERE mode = 'CTF'").get().n).toBe(0);
            // opponents tied on matches order by their total kills exchanged, not one row's
            file.prepare("INSERT INTO pilot_bouts VALUES ('zz', 'a', 'ANARCHY', 'M1', 1, 1, 0, 0, 0, 0, 0, 0, 0), ('zz', 'a', 'ANARCHY', 'M2', 1, 1, 0, 0, 1, 10, 10, 0, 0), ('zz', 'b', 'ANARCHY', 'M1', 2, 2, 0, 0, 1, 1, 1, 0, 0)").run();
            expect(db.getPilotOpponents('zz').map(o => o.opponent)).toEqual(['a', 'b']);
            await db.refreshPilotStats();
        } finally {
            file.close();
        }
    });
});
