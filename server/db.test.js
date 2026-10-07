import fs from 'fs';
import os from 'os';
import path from 'path';
import Database from 'better-sqlite3';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { day, detailSample, onDay, sample } from './testFixtures.js';

const byId = id => structuredClone(sample.find(g => g.id === id));

// Fixture games built from the samples:
// 90001: game 72102 with the score flipped, an ORANGE win (STITCH, MAESTRO).
// 90002: game 72096 with a 10-10 team score, a tie.
// 90003: game 72107 with JFTP spelled "jftp".
// 90004: game 72106 with a kill log in which XB1 kills himself once.
// 90010-90012: game 72099 cut to a 1v1 Monsterball that BLUE wins 2-1 on goals
//   while scoring fewer kills.
// 2: the 2019 Monsterball detail sample with its pilot renamed "Soup" (cold storage).
const orangeWin = { ...byId(72102), id: 90001, teamScore: { BLUE: 35, ORANGE: 42 } };
const teamTie = { ...byId(72096), id: 90002, teamScore: { BLUE: 10, ORANGE: 10 } };
const lowerCaseJftp = byId(72107);
lowerCaseJftp.id = 90003;
lowerCaseJftp.players = lowerCaseJftp.players.map(p => (p.name === 'JFTP' ? { ...p, name: 'jftp' } : p));
const withSuicide = {
    ...byId(72106),
    id: 90004,
    kills: [
        { time: 10, attacker: 'STITCH', attackerTeam: null, defender: 'XB1', defenderTeam: null, weapon: 'IMPULSE' },
        { time: 20, attacker: 'XB1', attackerTeam: null, defender: 'XB1', defenderTeam: null, weapon: 'Miscellaneous' }
    ]
};
const monsterball = [90010, 90011, 90012].map(id => ({
    ...byId(72099),
    id,
    settings: { ...byId(72099).settings, matchMode: 'MONSTERBALL' },
    teamScore: { BLUE: 2, ORANGE: 1 },
    players: [
        { name: 'BALLER', team: 'BLUE', kills: 1, deaths: 5, assists: 0 },
        { name: 'FRAGGER', team: 'ORANGE', kills: 5, deaths: 1, assists: 0 }
    ]
}));
const veteranSoup = { ...detailSample, id: 2, players: detailSample.players.map(p => ({ ...p, name: 'Soup' })) };

const hotGames = [...sample.map(g => structuredClone(g)), orangeWin, teamTie, lowerCaseJftp, withSuicide, ...monsterball].map(onDay);

let dataDir;
let db;
let generateRecapForDate;
let connections;

beforeAll(async () => {
    dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ofc-db-'));
    process.env.DATA_DIR = dataDir;
    // db.js keeps its connections private; collect them as it sets its pragmas.
    const pragma = vi.spyOn(Database.prototype, 'pragma');
    db = (await import('./db.js')).default;
    connections = [...new Set(pragma.mock.contexts)];
    pragma.mockRestore();
    ({ generateRecapForDate } = await import('./services/fightNightService.js'));
    db.saveGames([...hotGames, veteranSoup]);
    db.refreshPilotStats();
});

afterAll(() => {
    fs.rmSync(dataDir, { recursive: true, force: true });
});

const cached = name => db.getPilotPPI(name);

describe('connection setup', () => {
    it('opens the hot and cold databases in WAL mode with NORMAL sync and a 5 s busy timeout', () => {
        expect(connections).toHaveLength(2);
        for (const conn of connections) {
            expect(conn.pragma('journal_mode', { simple: true })).toBe('wal');
            expect(conn.pragma('synchronous', { simple: true })).toBe(1); // NORMAL
            expect(conn.pragma('busy_timeout', { simple: true })).toBe(5000);
        }
    });
});

describe('pilot stats cache (refreshPilotStats)', () => {
    it('credits an ORANGE win and a tie to the ORANGE pilots', () => {
        // MAESTRO: five BLUE wins from the sample, the flipped ORANGE win, the tie.
        expect(cached('MAESTRO')).toMatchObject({ games: 7, wins: 1, losses: 5, ties: 1 });
        expect(cached('INSANER')).toMatchObject({ games: 7, wins: 5, losses: 1, ties: 1 });
    });

    it('credits the FFA winner and times a live-era game from settings.start', () => {
        // 72108: settings.start 22:28:37.734, date 22:43:48.583, timeLimit 900.
        expect(cached('ZERGLING')).toMatchObject({ games: 1, wins: 1, losses: 0, ties: 0, time_played_seconds: 911 });
        expect(cached('SOUP')).toMatchObject({ games: 1, wins: 0, losses: 1 });
    });

    it('merges spellings of one pilot into one row', () => {
        const rows = db.getAllCachedPilotStats().filter(r => r.name.toLowerCase() === 'jftp');
        expect(rows).toHaveLength(1);
        expect(cached('JFTP').games).toBe(10);
    });

    it('scores 1v1 head-to-head by the game result, not kills', () => {
        expect(cached('BALLER')).toMatchObject({ wins: 3, losses: 0, dominance_index: 100 });
        expect(cached('FRAGGER')).toMatchObject({ wins: 0, losses: 3, dominance_index: 0 });
    });

    it('counts suicides from the kill log', () => {
        expect(cached('XB1').suicides).toBe(1);
    });
});

describe('getPilotStats', () => {
    it('counts suicides instead of reporting 0', () => {
        const xb1 = db.getPilotStats.all().find(r => r.name === 'XB1');
        expect(xb1.suicides).toBe(1);
    });

    it('applies the start date to suicides as well as games', () => {
        expect(db.getPilotStats.all(day).find(r => r.name === 'XB1').suicides).toBe(1);
        expect(db.getPilotStats.all('2099-01-01')).toEqual([]);
    });

    it('groups spellings of one pilot together', () => {
        const rows = db.getPilotStats.all().filter(r => r.name.toLowerCase() === 'jftp');
        expect(rows).toHaveLength(1);
        expect(rows[0].games).toBe(10);
    });
});

describe('getPilotTelemetry and getPilotBreakdown', () => {
    it('reads team results from BLUE and ORANGE', () => {
        expect(db.getPilotTelemetry('maestro')).toMatchObject({ games: 7, wins: 1, losses: 5, ties: 1 });
    });

    it('scores head-to-head team results with ORANGE wins and ties', () => {
        const insaner = db.getPilotBreakdown('MAESTRO').rivals.find(r => r.name === 'INSANER');
        expect(insaner).toMatchObject({ encounters: 7, your_wins: 1, their_wins: 5, ties: 1 });
    });
});

describe('cold storage stats', () => {
    it('picks the longest match by real duration, not timeLimit', () => {
        // 72086 ran 07:13:42 to 07:30:54 (1032 s) under a 1020 s limit; 72084 has
        // a 1200 s limit but ran 702 s.
        expect(db.getColdStorageStats().records.longest_match.id).toBe(72086);
    });
});

describe('isPilotFirstSeenOnDate', () => {
    it('finds a veteran whose earlier games are in cold storage', () => {
        expect(db.isPilotFirstSeenOnDate('SOUP', day)).toBe(false);
    });

    it('still reports a pilot with no earlier games as new', () => {
        expect(db.isPilotFirstSeenOnDate('ZERGLING', day)).toBe(true);
    });

    it('treats LIKE wildcards in a name literally', () => {
        expect(db.isPilotFirstSeenOnDate('J_TP', day)).toBe(false);
    });
});

describe('fight night recap', () => {
    it('counts pilots case-insensitively and checks cold storage for new blood', async () => {
        const recap = await generateRecapForDate(day, true);
        const keys = new Set(hotGames.flatMap(g => g.players.map(p => p.name.trim().toLowerCase())));
        expect(recap.totalPilots).toBe(keys.size);
        expect(recap.newBlood.pilots).toContain('ZERGLING');
        expect(recap.newBlood.pilots).not.toContain('SOUP');
    });

    it('reports the 10-10 game as a draw', async () => {
        const recap = await generateRecapForDate(day, true);
        expect(recap.closestFinish).toMatchObject({ gameId: 90002, margin: 0, score: '10 - 10' });
        expect(recap.closestFinish.copy).toMatch(/exact draw/);
    });
});
