import { describe, expect, it } from 'vitest';
import { ACHIEVEMENTS, beltMatch, beltReigns, beltStep, fightNightDay, killStreaksOf, rankedMatch, tierOf } from './gameParse.js';
import { achievementPass } from './achievementPass.js';
import { pilotPass, rivalPass } from './statsPasses.js';
import { byId, ffaWithLog, sample, teamWithLog } from '../testFixtures.js';

// Belts and achievements (S21) on fixture games. In the sample, Anarchy's
// first decisive match is 72084 (BEHEMOTH 20, B2AF 15) and BEHEMOTH defends it
// in 72085, then never plays again; Team Anarchy's is 72095 (INSANER alone on
// BLUE, 11-5), and INSANER's BLUE wins 72096, 72097, 72099 and 72102.

// a copy of a fixture match at another time (its start moved with it, so it
// keeps its length), with some pilots' scores set
const at = (id, date, kills = {}, extra = {}) => {
    const g = byId(id);
    const start = date && new Date(Date.parse(g.settings.start) + Date.parse(date) - Date.parse(g.date)).toISOString();
    return {
        ...g, id: extra.id ?? g.id + 1000, date, settings: { ...g.settings, start }, ...extra,
        players: (extra.players ?? g.players).map(p => (p.name in kills ? { ...p, kills: kills[p.name] } : p))
    };
};
const beltRow = g => ({ id: g.id, date: g.date, ...beltMatch(g) });
const beltMatches = games => games.map(g => (beltMatch(g) ? beltRow(g) : null)).filter(Boolean);
const run = (games, today = '2026-10-10') => {
    const pass = achievementPass(today);
    for (const g of games) pass.add({ id: g.id, date: g.date }, g);
    return pass;
};
const counts = (pass, pilot) => Object.fromEntries(pass.achievements().filter(r => r.pilot === pilot).map(r => [r.achievement, r]));

// later than every sample match
const LATER = '2025-11-25T03:00:00.000Z';

describe('beltMatch', () => {
    it('crowns the outright winner of a rated match in a mode with a belt', () => {
        expect(beltMatch(byId(72084))).toMatchObject({ mode: 'ANARCHY', champion: { key: 'behemoth', name: 'BEHEMOTH' } });
        // a 1-1 draw has no champion, but is still the belt's match
        expect(beltMatch(byId(72087))).toMatchObject({ mode: 'ANARCHY', champion: null });
        expect(beltMatch(byId(72087)).sides).toHaveLength(2);
    });

    it('takes a team\'s top scorer, the listing order breaking a tie', () => {
        // 72097: BLUE 64-49, INSANER 38 and PHOENIX 26
        expect(beltMatch(byId(72097)).champion.name).toBe('INSANER');
        // 72102: BLUE 42-35, PHOENIX 23 ahead of INSANER 19
        expect(beltMatch(byId(72102)).champion.name).toBe('PHOENIX');
        // level at 19, PHOENIX is listed first
        const level = at(72102, LATER, { INSANER: 23 });
        expect(level.players.findIndex(p => p.name === 'PHOENIX')).toBeLessThan(level.players.findIndex(p => p.name === 'INSANER'));
        expect(beltMatch(level).champion.name).toBe('PHOENIX');
    });

    it('is null for a match the rating does not count or a mode without a belt', () => {
        const short = { ...byId(72084), players: byId(72084).players.slice(0, 1) };
        expect(beltMatch(short)).toBeNull();
        expect(beltMatch({ ...byId(72084), settings: { ...byId(72084).settings, matchMode: 'RACE' } })).toBeNull();
        // the mode in any case
        expect(beltMatch({ ...byId(72084), settings: { ...byId(72084).settings, matchMode: ' anarchy ' } }).mode).toBe('ANARCHY');
    });
});

describe('beltReigns', () => {
    it('gives each mode its first champion and their defenses', () => {
        const reigns = beltReigns(beltMatches(sample));
        expect(reigns).toEqual([
            { mode: 'ANARCHY', reign: 1, pilot: 'behemoth', name: 'BEHEMOTH', since: byId(72084).date, game: 72084, defenses: 1, until: '', lost_game: 0 },
            { mode: 'TEAM ANARCHY', reign: 1, pilot: 'insaner', name: 'INSANER', since: byId(72095).date, game: 72095, defenses: 4, until: '', lost_game: 0 }
        ]);
        // the same whatever order the matches come in
        expect(beltReigns(beltMatches([...sample].reverse()))).toEqual(reigns);
    });

    it('passes the belt only when another side wins outright a match the holder plays', () => {
        const lost = at(72085, LATER, { BEHEMOTH: 20, B2AF: 21 });
        const draw = at(72085, '2025-11-26T03:00:00.000Z', { BEHEMOTH: 9, B2AF: 9 }, { id: 99001 });
        const reigns = beltReigns(beltMatches([...sample, lost, draw]));
        const anarchy = reigns.filter(r => r.mode === 'ANARCHY');
        expect(anarchy).toEqual([
            { mode: 'ANARCHY', reign: 1, pilot: 'behemoth', name: 'BEHEMOTH', since: byId(72084).date, game: 72084, defenses: 1, until: LATER, lost_game: lost.id },
            // a draw at the top is a defense
            { mode: 'ANARCHY', reign: 2, pilot: 'b2af', name: 'B2AF', since: LATER, game: lost.id, defenses: 1, until: '', lost_game: 0 }
        ]);
        // Team Anarchy is untouched
        expect(reigns.find(r => r.mode === 'TEAM ANARCHY')).toMatchObject({ reign: 1, defenses: 4 });
    });

    it('keeps the belt when the holder loses with the top shared, and counts no defense', () => {
        // 72093: OKSTER 25, LORD JOHN WARFIN and WD-40 24; give BEHEMOTH a place below two level leaders
        const shared = at(72093, LATER, { OKSTER: 30, 'LORD JOHN WARFIN': 30, 'WD-40': 10 });
        shared.players = [...shared.players, { ...shared.players[2], name: 'BEHEMOTH', kills: 5 }];
        const holders = new Map();
        const reigns = [];
        for (const m of [beltRow(byId(72084)), beltRow(shared)]) beltStep(holders, reigns, m);
        expect(reigns).toHaveLength(1);
        expect(reigns[0]).toMatchObject({ pilot: 'behemoth', defenses: 0, until: '' });
        // everyone who finished ahead of the holder
        const step = beltStep(new Map([['ANARCHY', { ...reigns[0] }]]), [], beltRow(shared));
        expect(step).toMatchObject({ won: null, defended: null });
        expect(step.slayers.sort()).toEqual(['lord john warfin', 'okster', 'wd-40']);
    });

    it('names a whole winning team as slayers when the holder\'s team loses', () => {
        // 72102 with ORANGE ahead: STITCH and MAESTRO beat INSANER's BLUE, STITCH (18) takes the belt
        const upset = { ...at(72102, LATER), teamScore: { BLUE: 35, ORANGE: 42 } };
        const holders = new Map();
        const reigns = [];
        beltStep(holders, reigns, beltRow(byId(72095)));
        const step = beltStep(holders, reigns, beltRow(upset));
        expect(step.slayers.sort()).toEqual(['maestro', 'stitch']);
        expect(step.won).toMatchObject({ reign: 2, pilot: 'stitch', game: upset.id });
        expect(reigns[0]).toMatchObject({ until: LATER, lost_game: upset.id });
        // a match without the holder (STITCH sits out 72096's copy) changes nothing
        const without = at(72096, '2025-11-26T03:00:00.000Z', {}, { players: byId(72096).players.filter(p => p.name !== 'STITCH') });
        expect(beltMatch(without)).not.toBeNull();
        expect(beltStep(holders, reigns, beltRow(without))).toEqual({ won: null, defended: null, slayers: [] });
        expect(reigns).toHaveLength(2);
    });

    it('leaves out a match without a date', () => {
        expect(beltReigns(beltMatches([{ ...byId(72084), date: null }]))).toEqual([]);
    });
});

describe('killStreaksOf', () => {
    it('counts kills on opponents in a row, ended by the pilot\'s death', () => {
        // INSANER 1:50, 2:10 and 3:00 after STITCH killed him at 0:55
        expect(Object.fromEntries(killStreaksOf(teamWithLog))).toEqual({ stitch: 2, insaner: 3, maestro: 1, phoenix: 1 });
        expect(Object.fromEntries(killStreaksOf(ffaWithLog))).toEqual({ jftp: 1, '.': 2 });
    });

    it('ends a streak on a suicide or a death with no attacker, and counts neither', () => {
        const withSuicide = { ...teamWithLog, kills: [...teamWithLog.kills, { time: 135, attacker: 'INSANER', defender: 'INSANER', weapon: 'Flak' }] };
        expect(killStreaksOf(withSuicide).get('insaner')).toBe(2);
        const fell = { ...teamWithLog, kills: [...teamWithLog.kills, { time: 135, attacker: '', defender: 'INSANER', weapon: '' }] };
        expect(killStreaksOf(fell).get('insaner')).toBe(2);
        // a team kill is worth nothing to the attacker and ends the victim's run
        const teamKill = { ...teamWithLog, kills: [...teamWithLog.kills, { time: 135, attacker: 'PHOENIX', defender: 'INSANER', weapon: 'Flak' }] };
        expect(killStreaksOf(teamKill).get('insaner')).toBe(2);
        expect(killStreaksOf(teamKill).get('phoenix')).toBe(1);
    });

    it('is empty for a match without a log or one the stats do not count', () => {
        expect(killStreaksOf(byId(72102)).size).toBe(0);
        expect(killStreaksOf({ ...teamWithLog, players: teamWithLog.players.slice(0, 1) }).size).toBe(0);
    });
});

describe('tierOf', () => {
    it('counts the thresholds a value has reached', () => {
        const century = ACHIEVEMENTS.find(a => a.id === 'matches');
        expect([0, 99, 100, 499, 500, 1000, 5000].map(n => tierOf(century, n))).toEqual([0, 0, 1, 1, 2, 3, 3]);
        expect(new Set(ACHIEVEMENTS.map(a => a.id)).size).toBe(ACHIEVEMENTS.length);
        for (const a of ACHIEVEMENTS) expect(a.tiers).toEqual([...a.tiers].sort((x, y) => x - y));
    });
});

describe('achievementPass', () => {
    const games = sample.map(g => (g.id === 72099 ? teamWithLog : g.id === 72098 ? ffaWithLog : g));

    it('counts the milestones as the career cards do', () => {
        const pass = run(games);
        const pilots = pilotPass();
        for (const g of games) pilots.add({ id: g.id, date: g.date }, g);
        const rows = pilots.rows();
        expect(rows.length).toBeGreaterThan(10);
        for (const row of rows) {
            const c = counts(pass, row.name.toLowerCase());
            expect([c.matches?.value, c.kills?.value ?? 0, c.wins?.value ?? 0]).toEqual([row.games, row.kills, row.wins]);
            // the fight-night days of the pilot's ranked matches
            const days = new Set(games.filter(g => rankedMatch(g) && g.players.some(p => p.name.trim().toLowerCase() === row.name.toLowerCase())).map(g => fightNightDay(g.date)));
            expect(c.nights.value).toBe(days.size);
        }
    });

    it('counts the kill-log feats as the clutch rows do, and the best streak', () => {
        const pass = run(games);
        const rivals = rivalPass();
        for (const g of games) rivals.add({ id: g.id, date: g.date }, g);
        const clutch = rivals.clutch();
        expect(clutch.length).toBeGreaterThan(0);
        for (const pilot of new Set(clutch.map(c => c.pilot))) {
            const rows = clutch.filter(c => c.pilot === pilot);
            const sum = field => rows.reduce((n, r) => n + r[field], 0);
            const c = counts(pass, pilot);
            expect([c.first_bloods?.value ?? 0, c.late_kills?.value ?? 0, c.trailing_kills?.value ?? 0]).toEqual([sum('first_bloods'), sum('late_kills'), sum('trailing_kills')]);
        }
        expect(counts(pass, 'insaner').kill_streak.value).toBe(3);
        expect(counts(pass, '.').kill_streak.value).toBe(2);
    });

    it('earns each tier on the match whose count first passes it', () => {
        const pass = run(games);
        const insaner = counts(pass, 'insaner');
        // defenses in 72096, 72097 and 72099: bronze (3) on 72099
        expect(insaner.defenses).toMatchObject({ value: 4, tier: 1, earned: '2025-11-24', game: 72099 });
        expect(insaner.belts).toMatchObject({ value: 1, tier: 1, game: 72095 });
        // BLUE won 72095 to 72102 in a row: silver (5) on 72102
        expect(insaner.win_streak).toMatchObject({ value: 5, tier: 2, game: 72102 });
        // PHOENIX lost 72095, then won 72096, 72097 and 72099 (bronze, 3) and 72102, then lost 72103
        expect(counts(pass, 'phoenix').win_streak).toMatchObject({ value: 4, tier: 1, game: 72099 });
        // below the first tier: a count, no day
        expect(counts(pass, 'wd-40').matches).toMatchObject({ tier: 0, earned: '', game: 0 });
        expect(counts(pass, 'behemoth').belts).toMatchObject({ value: 1, tier: 1, earned: '2025-11-23', game: 72084 });
    });

    it('runs the streaks over ranked wins and duel wins, a tie or a loss ending them', () => {
        const pass = run(games);
        // JFTP's duels with ".": 72098 a draw, 72100 and 72101 wins
        expect(counts(pass, 'jftp').duel_streak.value).toBe(2);
        expect(counts(pass, '.').duel_streak).toBeUndefined();
        // OKSTER: 72086 won, 72087 drawn, 72088 lost, 72089 and 72090 won
        expect(counts(pass, 'okster').duel_streak.value).toBe(2);
        // a match with no result leaves a streak where it was
        const noResult = { ...at(72100, '2025-11-24T20:28:00.000Z', {}, { id: 99002 }), teamScore: {}, players: byId(72100).players.map(p => ({ ...p, team: 'BLUE' })) };
        expect(counts(run([...games, noResult]), 'jftp').win_streak.value).toBe(counts(pass, 'jftp').win_streak.value);
    });

    it('counts belts won and Boss Slayer when the belt changes hands', () => {
        const lost = at(72085, LATER, { BEHEMOTH: 20, B2AF: 21 });
        const pass = run([...games, lost]);
        expect(counts(pass, 'b2af').belts).toMatchObject({ value: 1, tier: 1, game: lost.id });
        expect(counts(pass, 'b2af').boss_slayer).toMatchObject({ value: 1, tier: 1, game: lost.id });
        expect(counts(pass, 'behemoth').boss_slayer).toBeUndefined();
        expect(pass.reigns().filter(r => r.mode === 'ANARCHY').map(r => `${r.reign}:${r.name}`)).toEqual(['1:BEHEMOTH', '2:B2AF']);
    });

    it('dates the anniversary from the first stored match', () => {
        // WD-40's first match, 72086, is on the fight-night day 2025-11-23
        expect(counts(run(games, '2026-11-22'), 'wd-40').years).toBeUndefined();
        expect(counts(run(games, '2026-11-23'), 'wd-40').years).toMatchObject({ value: 1, tier: 1, earned: '2026-11-23', game: 0 });
        expect(counts(run(games, '2029-01-01'), 'wd-40').years).toMatchObject({ value: 3, tier: 2, earned: '2028-11-23' });
    });

    it('counts a ranked match without a date, with no day, and keeps it out of the belt', () => {
        const undated = { ...at(72084, null, {}, { id: 99003 }), date: null };
        const pass = run([undated]);
        expect(counts(pass, 'behemoth').matches).toMatchObject({ value: 1, earned: '' });
        expect(pass.reigns()).toEqual([]);
    });

    it('names each pilot by the spelling of their latest ranked match', () => {
        const renamed = { ...at(72085, LATER), players: byId(72085).players.map(p => (p.name === 'BEHEMOTH' ? { ...p, name: 'Behemoth' } : p)) };
        const pass = run([...games, renamed]);
        expect(counts(pass, 'behemoth').matches.name).toBe('Behemoth');
        expect(pass.reigns().find(r => r.pilot === 'behemoth').name).toBe('Behemoth');
    });
});
