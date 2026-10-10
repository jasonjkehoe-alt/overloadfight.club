import { describe, it, expect } from 'vitest';
import { RATING, winnerOf } from './gameParse.js';
import { boutLead, clock, clockLabel, countdown, eventWhen, itsOnLine, ratingStanding, recordText, resultLine, shortCount } from './matchResult.js';
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

describe('the schedule\'s words (S22)', () => {
    it('counts down in days and hours, hours and minutes, or minutes', () => {
        expect(countdown(0)).toBe('in under a minute');
        expect(countdown(-5000)).toBe('in under a minute');
        expect(countdown(59 * 1000)).toBe('in under a minute');
        expect(countdown(60 * 1000)).toBe('in 1 minute');
        expect(countdown(12 * 60000)).toBe('in 12 minutes');
        expect(countdown(60 * 60000)).toBe('in 1 hour');
        expect(countdown(61 * 60000)).toBe('in 1 hour 1 minute');
        expect(countdown((3 * 60 + 12) * 60000)).toBe('in 3 hours 12 minutes');
        expect(countdown(2 * 86400000)).toBe('in 2 days');
        expect(countdown((2 * 24 + 4) * 3600000 + 59 * 60000)).toBe('in 2 days 4 hours');
        expect(countdown(86400000 + 59 * 60000)).toBe('in 1 day');
    });

    it('names a wall-clock time and when a night starts, and the ping\'s line', () => {
        expect([clockLabel('00:05'), clockLabel('12:00'), clockLabel('20:00'), clockLabel('11:59')]).toEqual(['12:05 am', '12:00 pm', '8:00 pm', '11:59 am']);
        expect(eventWhen({ date: '2026-10-17', time: '20:00' })).toBe('Sat, Oct 17, 2026, 8:00 pm Central time');
        expect(itsOnLine(1)).toBe('It\'s on: 1 pilot in the server browser.');
        expect(itsOnLine(7)).toBe('It\'s on: 7 pilots in the server browser.');
    });
});
