import { describe, it, expect } from 'vitest';
import { winnerOf } from '../server/lib/gameParse.js';
import { resultLine } from './matchResult';
import { byId, detailSample } from '../server/testFixtures.js';

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
