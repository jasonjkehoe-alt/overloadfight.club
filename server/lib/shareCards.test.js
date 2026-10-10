import { describe, expect, it, vi } from 'vitest';
import { byId } from '../testFixtures.js';
import { ACHIEVEMENTS, RATING, TIERS, fightNightDay, measuredDurationOf, verdictOf, winnerOf } from './gameParse.js';
import { dayLabel } from './matchResult.js';
import { beltsCard, cardKey, cardUrl, fightNightCard, mapCard, matchCard, pilotCard, tapeCard } from './shareCards.js';

const stat = (card, label) => card.stats.find(s => s.label === label);
const recap = { date: '2026-10-06', formattedDate: 'Tuesday, October 6, 2026', totalMatches: 18, totalPilots: 11, totalFrags: 1102, topFragger: { name: 'WD-40', kills: 237 } };

describe('matchCard', () => {
    it('reads the map, result, mode, measured length, verdict and day of a team match', () => {
        const game = byId(72102);
        const card = matchCard(72102, game);
        expect(card).toMatchObject({ path: '/game/72102', kind: 'Match 72102', title: 'ASCENT', line: 'BLUE wins 42–35.' });
        expect(card.stats).toEqual([
            { label: 'Mode', value: 'TEAM ANARCHY' },
            { label: 'Length', value: '15:10' },
            { label: 'Verdict', value: 'Decision' },
            { label: 'Played', value: expect.stringMatching(/^\w{3}, \w{3} \d{1,2}, \d{4}$/) }
        ]);
        expect(verdictOf(winnerOf(game))).toBe('decision');
        expect(Math.floor(measuredDurationOf(game))).toBe(910);
        // the share description, word for word as before S19
        expect(card.description).toBe('BLUE wins 42–35. TEAM ANARCHY on ASCENT, 15:10.');
    });

    it('calls an FFA win by its margin, a draw a draw, and leaves out what a match lacks', () => {
        expect(matchCard(72108, byId(72108))).toMatchObject({ title: 'SUB ROSA V4', line: 'ZERGLING wins on 48, 17 ahead of RAPTOR.' });
        expect(stat(matchCard(72108, byId(72108)), 'Verdict').value).toBe('KO');
        expect(stat(matchCard(72098, byId(72098)), 'Verdict').value).toBe('Draw');
        // no level, no length, no result, no date
        const bare = { ...byId(72102), date: undefined, teamScore: {}, settings: { matchMode: 'ANARCHY' }, players: [] };
        const card = matchCard(1, bare);
        expect(card.title).toBe('Unknown map');
        expect(card.stats).toEqual([{ label: 'Mode', value: 'ANARCHY' }]);
        expect(card.line).toBe('No result: this match has no scores to compare.');
    });

    it('leaves the length out when only the time limit is known, as the share description does', () => {
        const game = byId(72102);
        const limitOnly = { ...game, date: undefined, settings: { ...game.settings, start: undefined, end: undefined, timeLimit: 900 } };
        expect(measuredDurationOf(limitOnly)).toBe(0);
        const card = matchCard(72102, limitOnly);
        expect(card.stats.map(s => s.label)).toEqual(['Mode', 'Verdict']);
        expect(card.description).toBe('BLUE wins 42–35. TEAM ANARCHY on ASCENT.');
    });

    it('leaves the day out for a date that does not parse', () => {
        // the measured length reads the date too, so it goes as well
        const card = matchCard(72102, { ...byId(72102), date: 'not a date' });
        expect(card.stats.map(s => s.label)).toEqual(['Mode', 'Verdict']);
    });

    it('dates a match after midnight UTC to the Chicago evening it was played', () => {
        // 03:00 UTC on the 8th is 22:00 on the 7th in Chicago
        expect(stat(matchCard(1, { ...byId(72102), date: '2026-10-08T03:00:00.000Z' }), 'Played').value).toBe('Wed, Oct 7, 2026');
    });

    it('names the fight-night day the match was played on', () => {
        const game = byId(72102);
        const day = fightNightDay(game.date);
        expect(stat(matchCard(72102, game), 'Played').value).toBe(dayLabel(day));
    });
});

describe('pilotCard', () => {
    const summary = { name: 'WD-40', games: 1234, kills: 5678, lastSeen: '2026-10-08T03:00:00.000Z' };
    const ranked = { matches: 40, rating: 1612.4, status: 'ranked', rank: 3 };

    it('shows matches, kills, the rating with its standing and the career Combat Ratio', () => {
        const card = pilotCard(summary, ranked, { kda: 1.234 });
        expect(card).toMatchObject({ path: '/pilot/WD-40', kind: 'Pilot', title: 'WD-40', line: 'Last match Wed, Oct 7, 2026' });
        expect(card.stats).toEqual([
            { label: 'Matches', value: '1,234' },
            { label: 'Kills', value: '5,678' },
            { label: 'Rating', value: '1612', note: '#3 in the power rankings' },
            { label: 'Combat Ratio', value: '1.23' }
        ]);
        // 03:00 UTC on the 8th is the evening of the 7th in Chicago
        expect(card.description).toBe('WD-40: 1,234 matches, 5,678 kills, last match 2026-10-07.');
    });

    it('says why a pilot is not ranked, and leaves out a rating or ratio the pilot lacks', () => {
        expect(stat(pilotCard(summary, { matches: 4, rating: 1700, status: 'provisional', rank: null }, null), 'Rating').note)
            .toBe(`Provisional: 4 of ${RATING.rankedAfter} rated matches`);
        expect(stat(pilotCard(summary, { matches: 40, rating: 1700, status: 'inactive', rank: null }, null), 'Rating').note)
            .toBe(`Not ranked: no rated match in the last ${RATING.activeDays} days`);
        const unrated = pilotCard({ ...summary, games: 1, kills: 1 }, { matches: 0, rating: null, status: null, rank: null }, null);
        expect(unrated.stats.map(s => s.label)).toEqual(['Matches', 'Kills']);
        expect(unrated.description).toBe('WD-40: 1 match, 1 kill, last match 2026-10-07.');
        // the profile shows a negative cached ratio as 0
        expect(stat(pilotCard(summary, ranked, { kda: -1 }), 'Combat Ratio').value).toBe('0.00');
        // a last match whose date does not parse: no day, no throw
        const undated = pilotCard({ ...summary, lastSeen: 'not a date' }, ranked, null);
        expect(undated.line).toBe('');
        expect(undated.description).toBe('WD-40: 1,234 matches, 5,678 kills.');
    });
});

describe('pilotCard with belts and achievements (S21)', () => {
    const summary = { name: 'WD-40', games: 1234, kills: 5678, lastSeen: '2026-10-08T03:00:00.000Z' };
    const ranked = { matches: 40, rating: 1612.4, status: 'ranked', rank: 3 };
    const reign = (mode, label, until = null) => ({ mode, label, reign: 2, since: '2026-10-06', defenses: 3, until, days: 4 });
    const honours = (belts, tiers) => ({ belts, achievements: ACHIEVEMENTS.map((a, i) => ({ id: a.id, value: 1, tier: tiers[i] ?? 0 })) });

    it('adds the belt a champion holds as a fifth tile and names it in the description', () => {
        const card = pilotCard(summary, ranked, { kda: 1.234 }, honours([reign('ANARCHY', 'Anarchy'), reign('CTF', 'CTF', '2026-10-01')], [1, 2]));
        expect(card.stats.map(s => s.label)).toEqual(['Matches', 'Kills', 'Rating', 'Combat Ratio', 'Belt']);
        expect(stat(card, 'Belt')).toEqual({ label: 'Belt', value: 'Anarchy', note: 'Since Tue, Oct 6, 2026' });
        expect(card.description).toBe('WD-40: 1,234 matches, 5,678 kills, last match 2026-10-07. Anarchy champion since Tue, Oct 6, 2026, 3 defenses.');
        const two = pilotCard(summary, ranked, null, honours([reign('ANARCHY', 'Anarchy'), reign('CTF', 'CTF')], []));
        expect(stat(two, 'Belts')).toEqual({ label: 'Belts', value: '2', note: 'Anarchy, CTF' });
        // all four: a count, so no mode is cut from the tile
        const four = pilotCard(summary, ranked, null, honours([reign('ANARCHY', 'Anarchy'), reign('TEAM ANARCHY', 'Team Anarchy'), reign('CTF', 'CTF'), reign('MONSTERBALL', 'Monsterball')], []));
        expect(stat(four, 'Belts')).toEqual({ label: 'Belts', value: '4', note: 'Anarchy, Team Anarchy, CTF, Monsterball' });
    });

    it('shows the tiers earned instead for a pilot who holds no belt, and nothing for none', () => {
        const card = pilotCard(summary, ranked, null, honours([reign('ANARCHY', 'Anarchy', '2026-10-07')], [1, 2, 3]));
        expect(stat(card, 'Achievements')).toEqual({ label: 'Achievements', value: '6', note: `of ${ACHIEVEMENTS.length * TIERS.length} tiers` });
        expect(card.description).toBe('WD-40: 1,234 matches, 5,678 kills, last match 2026-10-07.');
        expect(pilotCard(summary, ranked, null, honours([], [])).stats.map(s => s.label)).toEqual(['Matches', 'Kills', 'Rating']);
    });
});

describe('beltsCard', () => {
    const holder = (name, defenses) => ({ name, since: '2026-10-06', days: 4, defenses });
    const belts = { modes: [
        { mode: 'ANARCHY', label: 'Anarchy', holder: holder('B2AF', 0) },
        { mode: 'TEAM ANARCHY', label: 'Team Anarchy', holder: holder('INSANER', 1) },
        { mode: 'CTF', label: 'CTF', holder: null },
        { mode: 'MONSTERBALL', label: 'Monsterball', holder: null }
    ] };

    it('shows a tile per mode with a champion, and describes them', () => {
        const card = beltsCard(belts);
        expect(card).toMatchObject({ path: '/belts', kind: 'Belts', title: 'Champions' });
        expect(card.stats).toEqual([
            { label: 'Anarchy', value: 'B2AF', note: '4 days, 0 defenses' },
            { label: 'Team Anarchy', value: 'INSANER', note: '4 days, 1 defense' }
        ]);
        expect(card.description).toBe('Champions: Anarchy B2AF (since 2026-10-06, 0 defenses), Team Anarchy INSANER (since 2026-10-06, 1 defense).');
    });

    it('is null while no mode has a champion', () => {
        expect(beltsCard({ modes: belts.modes.map(m => ({ ...m, holder: null })) })).toBeNull();
    });
});

describe('fightNightCard', () => {

    it('shows the saved recap\'s matches, pilots, kills and most kills', () => {
        const card = fightNightCard(recap);
        expect(card).toMatchObject({ path: '/fight-night/2026-10-06', kind: 'Fight Night', title: 'Tuesday, October 6, 2026', line: '18 matches, 11 pilots, 1,102 kills.' });
        expect(card.stats).toEqual([
            { label: 'Matches', value: '18' },
            { label: 'Pilots', value: '11' },
            { label: 'Kills', value: '1,102' },
            { label: 'Most kills', value: 'WD-40', note: '237 kills' }
        ]);
        expect(card.description).toBe('Tuesday, October 6, 2026: 18 matches, 11 pilots, most kills WD-40 (237).');
    });

    it('leaves out most kills when nobody scored', () => {
        const card = fightNightCard({ ...recap, totalMatches: 1, totalFrags: 0, topFragger: { name: 'Unknown', kills: 0 } });
        expect(card.stats.map(s => s.label)).toEqual(['Matches', 'Pilots', 'Kills']);
        expect(card.line).toBe('1 match, 11 pilots, 0 kills.');
        expect(card.description).toBe('Tuesday, October 6, 2026: 1 match, 11 pilots.');
        expect(fightNightCard(null)).toBeNull();
    });
});

describe('mapCard', () => {
    const intel = { name: 'BLIZZARD', author: 'Revival Productions', sorties: 40, totalKills: 1200, recent30d: 1, topPilot: { name: 'WD-40', kills: 300 } };

    it('shows the matches, kills, last 30 days and top pilot', () => {
        const image = { file: '/data/map_images/BLIZZARD_1.jpg', mtime: 1760000000000 };
        const card = mapCard(intel, image);
        expect(card).toMatchObject({ path: '/maps/BLIZZARD', kind: 'Map', title: 'BLIZZARD', line: 'Made by Revival Productions', image });
        // a re-downloaded image is a new card
        expect(cardKey(mapCard(intel, { ...image, mtime: image.mtime + 1 }))).not.toBe(cardKey(card));
        expect(card.stats).toEqual([
            { label: 'Matches', value: '40' },
            { label: 'Kills', value: '1,200' },
            { label: 'Last 30 days', value: '1', note: 'match' },
            { label: 'Top pilot', value: 'WD-40', note: '300 kills' }
        ]);
        expect(card.description).toBe('BLIZZARD by Revival Productions: 40 matches, 1,200 kills, top pilot WD-40.');
    });

    it('leaves out an unknown author, a missing top pilot and an image not on disk', () => {
        const card = mapCard({ ...intel, author: 'Unknown', topPilot: null, sorties: 1, totalKills: 1 }, null);
        expect(card.line).toBe('Overload map');
        expect(card).not.toHaveProperty('image');
        expect(card.stats).toHaveLength(3);
        expect(card.description).toBe('BLIZZARD: 1 match, 1 kill.');
    });

    it('names an all-digit map by its id, which the server reads digits as', () => {
        expect(mapCard({ ...intel, name: '1999', id: 42 }, null).path).toBe('/maps/42');
        expect(mapCard({ ...intel, name: 'BLIZZARD', id: 42 }, null).path).toBe('/maps/BLIZZARD');
        // a map known only from its matches has no id to give
        expect(mapCard({ ...intel, name: '1999', id: 0 }, null).path).toBe('/maps/1999');
    });
});

describe('cardKey and cardUrl', () => {
    it('keep a card\'s key while its words and numbers stay, and change it when one moves', () => {
        const key = cardKey(fightNightCard(recap));
        expect(key).toMatch(/^[0-9a-f]{12}$/);
        expect(cardKey(fightNightCard(structuredClone(recap)))).toBe(key);
        expect(cardKey(fightNightCard({ ...recap, totalFrags: 1103 }))).not.toBe(key);
        expect(cardUrl(fightNightCard(recap))).toBe(`/api/card/fight-night/2026-10-06?v=${key}`);
        // a name with a slash or a question mark stays in its own path segment
        expect(cardUrl(pilotCard({ name: 'a/b?c', games: 1, kills: 1, lastSeen: '2026-10-08T03:00:00.000Z' }, null, null)))
            .toMatch(/^\/api\/card\/pilot\/a%2Fb%3Fc\?v=[0-9a-f]{12}$/);
    });

    it('change every card\'s key when the layout\'s version moves', async () => {
        vi.resetModules();
        vi.doMock('./cardLayout.js', async importOriginal => ({ ...(await importOriginal()), CARD_LAYOUT: -1 }));
        const next = await import('./shareCards.js');
        vi.doUnmock('./cardLayout.js');
        expect(next.cardKey(fightNightCard(recap))).not.toBe(cardKey(fightNightCard(recap)));
    });
});

describe('tapeCard (S20)', () => {
    const corner = (name, rating, career) => ({ key: name.toLowerCase(), name, career, rating: { rating, rd: 50, matches: rating ? 30 : 0, status: rating ? 'ranked' : null, rank: rating ? 3 : null } });
    const career = (matches, winRate, ratio) => ({ matches, wins: 0, losses: 0, ties: 0, win_rate: winRate, combat_ratio: ratio, lethality: 1 });
    const tape = {
        pilots: [corner('WD-40', 1612.4, career(120, 52.5, 1.234)), corner('OKSTER', 1580.6, career(80, 48, 0.9))],
        mode: null,
        record: { matches: 9, wins: 3, losses: 5, ties: 1 },
        logged: { matches: 2, kills: 14, deaths: 9, damage_dealt: 900, damage_taken: 700 },
        duels: { wins: 1, losses: 3, ties: 1, last: '2026-10-01T02:00:00.000Z' }
    };

    it('reads the record, the logged kills, the duels and the ratings as A–B tiles', () => {
        const card = tapeCard(tape);
        expect(card).toMatchObject({ path: '/tape/WD-40/OKSTER', kind: 'Tale of the Tape', title: 'WD-40 vs OKSTER', line: 'OKSTER leads 5–3, 1 tie in 9 ranked matches.' });
        expect(card.stats.map(s => `${s.label}=${s.value}`)).toEqual(['Record=3–5–1', 'Kills=14–9', '1v1 duels=1–3–1', 'Rating=1612–1581']);
        expect(card.description).toBe('WD-40 vs OKSTER: OKSTER leads 5–3, 1 tie in 9 ranked matches, kills 14–9 in 2 logged matches.');
    });

    it('leaves out the kills without a logged match and the duels without a duel, and names the mode', () => {
        const card = tapeCard({ ...tape, mode: 'TEAM ANARCHY', logged: { ...tape.logged, matches: 0, kills: 0, deaths: 0 }, duels: null });
        expect(card.stats.map(s => s.label)).toEqual(['Record', 'Rating']);
        expect(card).toMatchObject({ path: '/tape/WD-40/OKSTER?mode=TEAM%20ANARCHY', kind: 'Tale of the Tape, Team Anarchy', line: 'OKSTER leads 5–3, 1 tie in 9 ranked Team Anarchy matches.' });
        expect(cardUrl(card, 'abc')).toBe('/api/card/tape/WD-40/OKSTER?mode=TEAM%20ANARCHY&v=abc');
    });

    it('sets two careers side by side for pilots who never met, with a dash for what one lacks', () => {
        const card = tapeCard({ ...tape, pilots: [tape.pilots[0], corner('ZERGLING', null, null)], record: { matches: 0, wins: 0, losses: 0, ties: 0 }, logged: { matches: 0, kills: 0, deaths: 0 }, duels: null });
        expect(card.line).toBe('No ranked match between them yet.');
        expect(card.description).toBe('WD-40 vs ZERGLING: no ranked match between them yet.');
        expect(card.stats.map(s => `${s.label}=${s.value}`)).toEqual(['Rating=1612–—', 'Ranked matches=120–—', 'Combat Ratio=1.23–—', 'Win rate=52.5%–—']);
    });
});
