import { describe, it, expect } from 'vitest';
import { RATING, winnerOf } from './gameParse.js';
import { boutLead, clock, ratingStanding, recordText, resultLine, shortCount } from './matchResult.js';
import { byId, detailSample } from '../testFixtures.js';

// The match page's result line, built from winnerOf() on the fixture games.
describe('resultLine', () => {
    it('names the winning team and the score', () => {
        expect(resultLine(winnerOf(byId(72102)))).toBe('BLUE wins 42–35.');
    });

    it('calls a level team score a draw', () => {
        expect(resultLine(winnerOf(detailSample))).toBe('BLUE and ORANGE draw, 1–1.');
    });

    it('names the FFA winner and the margin over second', () => {
        expect(resultLine(winnerOf(byId(72108)))).toBe('ZERGLING wins on 48, 17 ahead of RAPTOR.');
    });

    it('names everyone sharing first place in FFA', () => {
        expect(resultLine(winnerOf(byId(72098)))).toBe('JFTP and . tie for first on 2.');
    });

    it('lists three pilots sharing first place', () => {
        const game = byId(72104);
        game.players.forEach(p => { p.kills = p.name === 'PHOENIX' ? 1 : 5; });
        expect(resultLine(winnerOf(game))).toBe('XB1, JFTP and STITCH tie for first on 5.');
    });

    it('says so when a team game has no score', () => {
        const game = { ...byId(72102), teamScore: {} };
        expect(resultLine(winnerOf(game))).toBe('No result: this match has no scores to compare.');
    });

    it('says so when only one pilot played', () => {
        const game = byId(72108);
        game.players = game.players.slice(0, 1);
        expect(resultLine(winnerOf(game))).toBe('No result: this match has no scores to compare.');
    });
});

describe('clock', () => {
    it('writes seconds as m:ss', () => {
        expect(clock(0)).toBe('0:00');
        expect(clock(910.849)).toBe('15:10'); // fixture 72108's length
        expect(clock(59.99)).toBe('0:59');
        expect(clock(-3)).toBe('0:00');
    });
});

describe('shortCount', () => {
    it('writes 10,000 and up in thousands', () => {
        expect(shortCount(9999)).toBe((9999).toLocaleString());
        expect(shortCount(10000)).toBe('10k');
        expect(shortCount(12345)).toBe('12k');
    });
});

// The rating card's standing, which the pilot's share card repeats.
describe('ratingStanding', () => {
    it('gives the rank, or why the pilot has none', () => {
        expect(ratingStanding({ status: 'ranked', rank: 3, matches: 40 })).toBe('#3 in the power rankings');
        expect(ratingStanding({ status: 'ranked', rank: 40, matches: 40 })).toBe('#40 in the power rankings');
        expect(ratingStanding({ status: 'provisional', rank: null, matches: 4 })).toBe(`Provisional: 4 of ${RATING.rankedAfter} rated matches`);
        expect(ratingStanding({ status: 'inactive', rank: null, matches: 40 })).toBe(`Not ranked: no rated match in the last ${RATING.activeDays} days`);
        expect(ratingStanding({ status: 'ranked', rank: null, matches: 40 })).toBe(`Not ranked: no rated match in the last ${RATING.activeDays} days`);
    });
});

describe('boutLead and recordText (S20)', () => {
    it('names who leads a record read from the first pilot\'s side, or calls it level', () => {
        expect(boutLead(['WD-40', 'OKSTER'], { matches: 9, wins: 3, losses: 5, ties: 1 })).toBe('OKSTER leads 5–3, 1 tie');
        expect(boutLead(['STITCH', 'PHOENIX'], { matches: 2, wins: 2, losses: 0, ties: 0 })).toBe('STITCH leads 2–0');
        expect(boutLead(['A', 'B'], { matches: 4, wins: 1, losses: 1, ties: 2 })).toBe('Level at 1–1, 2 ties');
        expect(boutLead(['A', 'B'], { matches: 0, wins: 0, losses: 0, ties: 0 })).toBeNull();
        expect(recordText({ wins: 3, losses: 5, ties: 1 })).toBe('3–5–1');
    });
});
