import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';
import { durationOf, netKills, outcomeOf, pilotKey, pilotLikePattern, teamOf, winnerOf } from './gameParse.js';

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const readFixture = file => JSON.parse(fs.readFileSync(path.join(repoRoot, file), 'utf8'));
const sample = readFixture('gamelist_sample.json').games;
const detailSample = readFixture('game_detail_sample.json');
const byId = id => structuredClone(sample.find(g => g.id === id));
const player = (game, name) => game.players.find(p => p.name === name);

describe('winnerOf and outcomeOf', () => {
    it('reads a BLUE win from teamScore', () => {
        const game = byId(72102); // BLUE 42, ORANGE 35
        expect(winnerOf(game)).toMatchObject({ team: true, winners: ['BLUE'] });
        expect(outcomeOf(game, player(game, 'PHOENIX'))).toBe('win');
        expect(outcomeOf(game, player(game, 'STITCH'))).toBe('loss');
    });

    it('reads an ORANGE win from teamScore', () => {
        const game = { ...byId(72102), teamScore: { BLUE: 35, ORANGE: 42 } };
        expect(winnerOf(game).winners).toEqual(['ORANGE']);
        expect(outcomeOf(game, player(game, 'STITCH'))).toBe('win');
        expect(outcomeOf(game, player(game, 'PHOENIX'))).toBe('loss');
    });

    it('calls a level team score a tie for both teams', () => {
        const game = { ...byId(72096), teamScore: { BLUE: 10, ORANGE: 10 } };
        expect(winnerOf(game).winners).toEqual(['BLUE', 'ORANGE']);
        expect(outcomeOf(game, player(game, 'INSANER'))).toBe('tie');
        expect(outcomeOf(game, player(game, 'MAESTRO'))).toBe('tie');
    });

    it('calls the 2019 Monsterball sample (1-1) a tie, not a kill count', () => {
        expect(winnerOf(detailSample)).toMatchObject({ team: true, winners: ['BLUE', 'ORANGE'] });
        expect(outcomeOf(detailSample, detailSample.players[0])).toBe('tie');
    });

    it('ranks every team when there are more than two', () => {
        const game = {
            settings: { matchMode: 'TEAM ANARCHY', teamCount: 3 },
            teamScore: { BLUE: 4, ORANGE: 9, GREEN: 7 },
            players: [{ name: 'A', team: 'BLUE' }, { name: 'B', team: 'ORANGE' }, { name: 'C', team: 'GREEN' }]
        };
        expect(winnerOf(game).ranking.map(r => r.side)).toEqual(['ORANGE', 'GREEN', 'BLUE']);
        expect(game.players.map(p => outcomeOf(game, p))).toEqual(['loss', 'win', 'loss']);
    });

    it('gives a team with players but no score entry a score of 0', () => {
        const game = { teamScore: { BLUE: 0 }, players: [{ name: 'A', team: 'BLUE' }, { name: 'B', team: 'orange' }] };
        expect(winnerOf(game).winners).toEqual(['BLUE', 'ORANGE']);
    });

    it('gives the FFA win to the top score, even though settings say teamCount 2', () => {
        const game = byId(72108); // ANARCHY, teamCount 2, ZERGLING 48 kills
        expect(winnerOf(game)).toMatchObject({ team: false, winners: ['zergling'] });
        expect(winnerOf(game).ranking[0]).toMatchObject({ name: 'ZERGLING', score: 48 });
        expect(outcomeOf(game, player(game, 'ZERGLING'))).toBe('win');
        expect(outcomeOf(game, player(game, 'SOUP'))).toBe('loss');
    });

    it('calls a shared FFA top score a tie', () => {
        const game = byId(72087); // WD-40 1, OKSTER 1
        expect(game.players.map(p => outcomeOf(game, p))).toEqual(['tie', 'tie']);
    });

    it('returns no result for a team game without scores or a one-pilot game', () => {
        const noScores = { players: [{ name: 'A', team: 'BLUE', kills: 3 }, { name: 'B', team: 'ORANGE', kills: 1 }] };
        expect(outcomeOf(noScores, noScores.players[0])).toBeNull();
        const solo = { players: [{ name: 'A', kills: 3 }] };
        expect(outcomeOf(solo, solo.players[0])).toBeNull();
    });
});

describe('durationOf', () => {
    it('uses date - settings.start for a live-era game, not timeLimit', () => {
        // settings.start 22:28:37.734, date 22:43:48.583, timeLimit 900
        expect(durationOf(byId(72108))).toBeCloseTo(910.849, 3);
        // An 84-second game under a 420-second limit
        expect(Math.round(durationOf(byId(72087)))).toBe(84);
    });

    it('prefers start/end when the game has them', () => {
        expect(durationOf(detailSample)).toBeCloseTo(64.729, 3);
    });

    it('falls back to timeLimit only when no timestamps are usable', () => {
        const game = byId(72108);
        delete game.settings.start;
        expect(durationOf(game)).toBe(900);
        delete game.settings.timeLimit;
        expect(durationOf(game)).toBe(0);
    });

    it('ignores spans that are negative or longer than a day', () => {
        expect(durationOf({ start: '2025-01-02T00:00:00Z', end: '2025-01-01T00:00:00Z', settings: { timeLimit: 600 } })).toBe(600);
        expect(durationOf({ start: '2025-01-01T00:00:00Z', end: '2025-01-03T00:00:00Z' })).toBe(0);
    });
});

describe('netKills', () => {
    it('floors a negative game at zero', () => {
        expect(netKills(detailSample.players[0])).toBe(0); // kills -1 after a suicide
        expect(netKills({ kills: 12 })).toBe(12);
        expect(netKills({})).toBe(0);
        expect(netKills(null)).toBe(0);
    });
});

describe('pilotKey and pilotLikePattern', () => {
    it('matches names case-insensitively and ignores surrounding space', () => {
        expect(pilotKey(' Soup ')).toBe(pilotKey('SOUP'));
        expect(pilotKey(undefined)).toBe('');
    });

    it('matches the whole JSON string and escapes LIKE wildcards', () => {
        expect(pilotLikePattern(' J_TP ')).toBe('%"J\\_TP"%');
        expect(pilotLikePattern('100%')).toBe('%"100\\%"%');
        // JSON writes a backslash as two; each is then escaped for LIKE.
        expect(pilotLikePattern('a\\b')).toBe('%"a\\\\\\\\b"%');
    });
});

describe('teamOf', () => {
    it('upper-cases the team and returns null in FFA', () => {
        expect(teamOf({ team: 'orange' })).toBe('ORANGE');
        expect(teamOf(player(byId(72108), 'ZERGLING'))).toBeNull();
    });
});
