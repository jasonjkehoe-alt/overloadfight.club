import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';
import { pilotPass } from './statsPasses.js';
import { combatRatio, durationOf, lethality, measuredDurationOf, netKills, outcomeOf, pairOutcome, pilotKey, playerRows, teamOf, winnerOf } from './gameParse.js';
import { firstBloodOf, killPoints, replayLengthOf, killScored, leadChanges, momentumOf, scoreboardAt, verdictOf, weaponFamily, WEAPON_FAMILIES } from './gameParse.js';
import { RATING, glicko2, powerRankings, rankStatus, rankedMatch, rankingMovement, ratingDay, ratingSides, ratingSnapshots, rdOn, shiftDay } from './gameParse.js';
import { ffaWithLog, teamWithLog } from '../testFixtures.js';

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

describe('pairOutcome', () => {
    it('compares two pilots by their sides and skips teammates', () => {
        const game = { ...byId(72102), teamScore: { BLUE: 35, ORANGE: 42 } };
        expect(pairOutcome(game, player(game, 'STITCH'), player(game, 'PHOENIX'))).toBe('win');
        expect(pairOutcome(game, player(game, 'PHOENIX'), player(game, 'MAESTRO'))).toBe('loss');
        expect(pairOutcome(game, player(game, 'STITCH'), player(game, 'MAESTRO'))).toBeNull();
    });

    it('compares FFA pilots by score, including a level pair below the top', () => {
        const game = byId(72093); // OKSTER 25, LORD JOHN WARFIN 24, WD-40 24
        expect(pairOutcome(game, player(game, 'OKSTER'), player(game, 'WD-40'))).toBe('win');
        expect(pairOutcome(game, player(game, 'WD-40'), player(game, 'LORD JOHN WARFIN'))).toBe('tie');
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
        expect(measuredDurationOf(detailSample)).toBeCloseTo(64.729, 3);
    });

    it('falls back to timeLimit only when no timestamps are usable', () => {
        const game = byId(72108);
        delete game.settings.start;
        expect(durationOf(game)).toBe(900);
        expect(measuredDurationOf(game)).toBe(0);
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

describe('pilotKey', () => {
    it('matches names case-insensitively and ignores surrounding space', () => {
        expect(pilotKey(' Soup ')).toBe(pilotKey('SOUP'));
        expect(pilotKey(undefined)).toBe('');
    });
});

describe('teamOf', () => {
    it('upper-cases the team and returns null in FFA', () => {
        expect(teamOf({ team: 'orange' })).toBe('ORANGE');
        expect(teamOf(player(byId(72108), 'ZERGLING'))).toBeNull();
    });
});

describe('playerRows', () => {
    it('keeps the raw score and reads suicides from the kill log', () => {
        // The 2019 sample: RONCLI killed himself once and scored -1.
        expect(playerRows(detailSample)).toEqual([
            { name: 'RONCLI', team: 'BLUE', kills: -1, deaths: 1, assists: 0, suicides: 1, damage: 0, mode: 'MONSTERBALL', map: null }
        ]);
    });

    it('counts damage dealt to others, trims names and skips blank ones', () => {
        const game = {
            settings: { matchMode: 'ANARCHY', level: 'Vault' },
            players: [{ name: ' Soup ', kills: 2, deaths: 1, assists: 3 }, { name: 'XB1', kills: 1 }, { name: '  ' }],
            damage: [
                { attacker: 'soup', defender: 'XB1', damage: 40.5, weapon: 'IMPULSE' },
                { attacker: 'SOUP', defender: 'SOUP', damage: 10, weapon: 'FALCON' },
                { attacker: 'XB1', defender: 'SOUP', damage: 7, weapon: 'DRILLER' }
            ]
        };
        expect(playerRows(game)).toEqual([
            { name: 'Soup', team: null, kills: 2, deaths: 1, assists: 3, suicides: 0, damage: 40.5, mode: 'ANARCHY', map: 'Vault' },
            { name: 'XB1', team: null, kills: 1, deaths: 0, assists: 0, suicides: 0, damage: 7, mode: 'ANARCHY', map: 'Vault' }
        ]);
    });

    it('gives a pilot listed twice the log counts once', () => {
        const game = { ...detailSample, players: [...detailSample.players, ...detailSample.players] };
        expect(playerRows(game).map(r => r.suicides)).toEqual([1, 0]);
    });
});

describe('combatRatio and lethality', () => {
    it('reads one pilot in game 72102', () => {
        const game = byId(72102); // 910 s, BLUE 42, ORANGE 35
        const me = player(game, 'INSANER'); // 19 kills, 11 assists, 12 deaths
        expect(combatRatio(netKills(me), me.assists, me.deaths)).toBe(2.04); // (19 + 5.5) / 12
        expect(lethality(netKills(me), durationOf(game))).toBe(1.25); // 19 / 15.17 min
    });

    it('gives the leaderboard row the same numbers', () => {
        const game = byId(72102);
        const pass = pilotPass();
        pass.add({ date: game.date }, game);
        const row = pass.rows().find(r => r.name === 'INSANER');
        expect(row.kda).toBe(2.04);
        expect(row.kpm).toBe(1.25);
    });

    it('gives the kills with no deaths and 0 per minute with no match time', () => {
        expect(combatRatio(7, 4, 0)).toBe(7);
        expect(lethality(7, 0)).toBe(0);
    });
});

describe('kill log replay', () => {
    const totals = rows => rows.map(r => [r.name, r.kills, r.deaths, r.assists]);
    const tracker = game => game.players.map(p => [p.name, p.kills, p.deaths, p.assists]);

    it('scores a kill +1 and a suicide or a team kill -1 for the attacker', () => {
        expect(killPoints({ attacker: 'A', defender: 'B' })).toMatchObject({ scorer: 'A', side: 'a', points: 1, suicide: false });
        expect(killPoints({ attacker: 'A', defender: ' a ' })).toMatchObject({ scorer: 'A', points: -1, suicide: true });
        expect(killPoints({ attacker: 'A', attackerTeam: 'blue', defender: 'B', defenderTeam: 'ORANGE' }, true)).toMatchObject({ side: 'BLUE', points: 1 });
        expect(killPoints({ attacker: 'A', attackerTeam: 'BLUE', defender: 'B', defenderTeam: 'BLUE' }, true)).toMatchObject({ side: 'BLUE', points: -1, suicide: false });
        // In FFA a shared team label means nothing.
        expect(killPoints({ attacker: 'A', attackerTeam: 'BLUE', defender: 'B', defenderTeam: 'BLUE' })).toMatchObject({ points: 1 });
        expect(killPoints({ attacker: '', defender: 'B' })).toMatchObject({ scorer: null, points: 0 });
    });

    it('replays a team kill log to the tracker\'s totals and team score', () => {
        const board = scoreboardAt(teamWithLog);
        expect(totals(board.players)).toEqual(tracker(teamWithLog));
        expect(Object.fromEntries(board.sides.map(s => [s.side, s.score]))).toEqual({ BLUE: 6, ORANGE: 4 });
        expect(board.players.map(p => p.team)).toEqual(['ORANGE', 'BLUE', 'BLUE', 'ORANGE']);
    });

    it('replays an FFA log, and keeps the order whatever order the log is in', () => {
        expect(totals(scoreboardAt(ffaWithLog).players)).toEqual(tracker(ffaWithLog));
        const shuffled = { ...teamWithLog, kills: [...teamWithLog.kills].reverse() };
        expect(scoreboardAt(shuffled, 60)).toEqual(scoreboardAt(teamWithLog, 60));
    });

    it('replays the scoreboard to a given second, that second included', () => {
        const board = scoreboardAt(teamWithLog, 55);
        expect(totals(board.players)).toEqual([['STITCH', 2, 1, 0], ['PHOENIX', 0, 1, 1], ['INSANER', 2, 1, 0], ['MAESTRO', 0, 1, 0]]);
        expect(board.sides.map(s => [s.side, s.score])).toEqual([['BLUE', 2], ['ORANGE', 2]]);
        expect(totals(scoreboardAt(teamWithLog, 0).players).every(([, k, d, a]) => k === 0 && d === 0 && a === 0)).toBe(true);
    });

    it('counts a kill at a fraction of a second in that whole second', () => {
        expect(scoreboardAt(detailSample, 51).players[0].deaths).toBe(0);
        expect(scoreboardAt(detailSample, 52).players[0].deaths).toBe(1); // the suicide at 52.5000839
    });

    it('takes a suicide off the pilot and the team (detail sample: RONCLI -1)', () => {
        const board = scoreboardAt(detailSample);
        expect(totals(board.players)).toEqual([['RONCLI', -1, 1, 0]]);
        expect(board.sides.find(s => s.side === 'BLUE').score).toBe(-1);
    });

    it('takes a team kill off the attacker and the team', () => {
        const game = { ...teamWithLog, kills: [...teamWithLog.kills, { time: 200, attacker: 'STITCH', defender: 'MAESTRO', weapon: 'Flak' }] };
        const board = scoreboardAt(game);
        expect(board.players.find(p => p.name === 'STITCH').kills).toBe(2);
        expect(board.players.find(p => p.name === 'MAESTRO').deaths).toBe(5);
        expect(board.sides.find(s => s.side === 'ORANGE').score).toBe(3);
    });

    it('marks every change of the outright lead, not ties', () => {
        expect(leadChanges(teamWithLog)).toEqual([
            { t: 40, from: 'ORANGE', to: 'BLUE', score: 2 },
            { t: 70, from: 'BLUE', to: 'ORANGE', score: 3 },
            { t: 150, from: 'ORANGE', to: 'BLUE', score: 5 }
        ]);
        expect(leadChanges(ffaWithLog)).toEqual([{ t: 45, from: 'JFTP', to: '.', score: 2 }]);
    });

    it('counts a lead passing between two FFA pilots while the winner trails', () => {
        const game = {
            settings: { matchMode: 'ANARCHY' },
            players: [{ name: 'A', kills: 3 }, { name: 'B', kills: 1 }, { name: 'C', kills: 1 }],
            kills: [
                { time: 1, attacker: 'B', defender: 'A' },
                { time: 2, attacker: 'C', defender: 'A' },
                { time: 3, attacker: 'C', defender: 'B' },
                { time: 4, attacker: 'A', defender: 'B' },
                { time: 5, attacker: 'C', defender: 'C' },
                { time: 6, attacker: 'A', defender: 'C' },
                { time: 7, attacker: 'A', defender: 'B' }
            ]
        };
        expect(leadChanges(game).map(c => [c.t, c.from, c.to])).toEqual([[3, 'B', 'C'], [6, 'C', 'A']]);
        expect(momentumOf(game).points.map(p => p.margin)).toEqual([0, -1, -1, -2, -1, 0, 1, 2]);
    });

    it('gives the winner\'s margin over the best other side after every kill', () => {
        const momentum = momentumOf(teamWithLog);
        expect(momentum).toMatchObject({ side: 'BLUE', name: 'BLUE', team: true, runnerUp: { side: 'ORANGE' } });
        expect(momentum.points.map(p => [p.t, p.margin])).toEqual([
            [0, 0], [10, -1], [25, 0], [40, 1], [55, 0], [70, -1], [90, -2], [110, -1], [130, 0], [150, 1], [180, 2]
        ]);
        expect(momentum.points[6].scores).toEqual([{ name: 'ORANGE', score: 4 }, { name: 'BLUE', score: 2 }]);
        expect(momentum.points[6].kill.weapon).toBe('Missile Pod');
        // A draw follows the side winnerOf ranks first.
        expect(momentumOf(ffaWithLog).points.map(p => p.margin)).toEqual([0, 1, 0, -1, 0]);
    });

    it('measures the margin against 0 before any other side has scored', () => {
        // players ranks one pilot; B comes from the log alone
        const game = {
            settings: { matchMode: 'ANARCHY' },
            players: [{ name: 'A', kills: 1 }],
            kills: [{ time: 5, attacker: 'A', defender: 'B' }, { time: 9, attacker: 'B', defender: 'A' }]
        };
        expect(momentumOf(game).points.map(p => p.margin)).toEqual([0, 1, 0]);
    });

    it('has no momentum or lead changes without a kill log or for a mode not scored by kills', () => {
        expect(momentumOf(byId(72102))).toBeNull();
        expect(leadChanges(byId(72102))).toBeNull();
        expect(killScored(detailSample)).toBe(false); // MONSTERBALL
        expect(momentumOf(detailSample)).toBeNull();
        expect(leadChanges(detailSample)).toBeNull();
        expect(leadChanges({ ...ffaWithLog, kills: ffaWithLog.kills.slice(0, 2) })).toEqual([]);
        expect(killScored(teamWithLog)).toBe(true);
        expect(killScored({ settings: { matchMode: 'CTF' } })).toBe(false);
    });

    it('finds first blood, skipping suicides and team kills', () => {
        expect(firstBloodOf(teamWithLog)).toMatchObject({ time: 10, attacker: 'STITCH', defender: 'PHOENIX', weapon: 'Impulse' });
        const game = { ...teamWithLog, kills: [{ time: 2, attacker: 'STITCH', defender: 'STITCH' }, { time: 5, attacker: 'STITCH', defender: 'MAESTRO' }, ...teamWithLog.kills] };
        expect(firstBloodOf(game).time).toBe(10);
        expect(firstBloodOf(detailSample)).toBeNull();
        expect(firstBloodOf(byId(72102))).toBeNull();
    });

    it('runs a replay for the match length, or to the last kill when that is later', () => {
        expect(replayLengthOf(teamWithLog)).toBeCloseTo(214.114, 3); // date - settings.start
        const noDates = { ...teamWithLog, date: undefined, settings: { matchMode: 'TEAM ANARCHY' } };
        expect(replayLengthOf(noDates)).toBe(180);
        expect(replayLengthOf(byId(72102))).toBeCloseTo(durationOf(byId(72102)), 6);
    });

    it('sorts weapons into families, with anything unknown as other', () => {
        expect(weaponFamily('Missile Pod')).toBe('missile');
        expect(weaponFamily(' thunderbolt ')).toBe('thunderbolt');
        expect(weaponFamily('Miscellaneous')).toBe('other');
        expect(weaponFamily(undefined)).toBe('other');
        const listed = WEAPON_FAMILIES.flatMap(f => f.weapons);
        expect(new Set(listed).size).toBe(listed.length);
        expect(listed).toHaveLength(16);
    });
});

describe('verdictOf', () => {
    const verdict = game => verdictOf(winnerOf(game));

    it('calls a win by more than a third a KO', () => {
        expect(verdict(byId(72096))).toBe('ko'); // BLUE 14-5
        expect(verdict(byId(72095))).toBe('ko'); // BLUE 11-5
        expect(verdict(byId(72108))).toBe('ko'); // ZERGLING 48, RAPTOR 31
    });

    it('calls a clear but closer win a decision', () => {
        expect(verdict(byId(72102))).toBe('decision'); // BLUE 42-35
        expect(verdict(byId(72097))).toBe('decision'); // BLUE 64-49
        expect(verdict(byId(72099))).toBe('decision'); // BLUE 6-4
        expect(verdict(byId(72106))).toBe('decision'); // STITCH 29, XB1 23
    });

    it('calls a win by a tenth of the score or by 1 a split decision', () => {
        expect(verdict({ ...byId(72102), teamScore: { BLUE: 43, ORANGE: 41 } })).toBe('split');
        expect(verdict({ ...byId(72102), teamScore: { BLUE: 3, ORANGE: 2 } })).toBe('split');
    });

    it('calls a shared top score a draw, and has nothing for no result', () => {
        expect(verdict(byId(72098))).toBe('draw');
        expect(verdict(detailSample)).toBe('draw'); // Monsterball 1-1
        expect(verdict({ ...byId(72102), teamScore: {} })).toBeNull();
    });
});

describe('rankedMatch', () => {
    it('counts 2+ players and 60 s or more', () => {
        expect(rankedMatch(byId(72087))).toBe(true); // WD-40 and OKSTER, 84 s
        expect(rankedMatch({ ...byId(72087), players: byId(72087).players.slice(0, 1) })).toBe(false);
        const short = byId(72087);
        short.date = new Date(Date.parse(short.settings.start) + 59000).toISOString();
        expect(rankedMatch(short)).toBe(false);
        expect(rankedMatch(detailSample)).toBe(false); // one pilot
        expect(rankedMatch(null)).toBe(false);
    });
});

describe('ratingSides', () => {
    it('makes each team a side scored by teamScore', () => {
        expect(ratingSides(byId(72102))).toEqual([
            { score: 42, pilots: [{ key: 'phoenix', name: 'PHOENIX' }, { key: 'insaner', name: 'INSANER' }] },
            { score: 35, pilots: [{ key: 'stitch', name: 'STITCH' }, { key: 'maestro', name: 'MAESTRO' }] }
        ]);
    });

    it('makes each FFA pilot a side scored by in-game score', () => {
        expect(ratingSides(byId(72108)).map(s => [s.pilots[0].name, s.score])).toEqual([
            ['ZERGLING', 48], ['RAPTOR', 31], ['SOUP', 14], ['LORD JOHN WARFIN', 2]
        ]);
    });

    it('does not count a team game without teamScore, or an unranked match', () => {
        expect(ratingSides({ ...byId(72102), teamScore: {} })).toBeNull();
        expect(ratingSides({ ...byId(72087), players: byId(72087).players.slice(0, 1) })).toBeNull();
    });

    it('plays a pilot listed twice once, and sits out a team pilot without a team', () => {
        const game = byId(72102);
        game.players = [...game.players, { ...game.players[0], team: 'ORANGE' }, { name: 'NOBODY', kills: 3 }];
        const sides = ratingSides(game);
        expect(sides[0].pilots.map(p => p.name)).toEqual(['PHOENIX', 'INSANER']);
        expect(sides[1].pilots.map(p => p.name)).toEqual(['STITCH', 'MAESTRO']);
    });

    it('needs two sides with pilots', () => {
        const game = byId(72102);
        game.players = game.players.filter(p => p.team === 'BLUE');
        expect(ratingSides(game)).toBeNull();
    });
});

describe('glicko2', () => {
    const S = RATING.scale;
    const toMu = r => (r - 1500) / S;

    it("matches Glickman's worked example", () => {
        // 1500/200 beats 1400/30, loses to 1550/100 and 1700/300; the paper gives 1464.06, 151.52, 0.05999
        const games = [[1400, 30, 1], [1550, 100, 0], [1700, 300, 0]]
            .map(([r, rd, score]) => ({ mu: 0, opponent: { mu: toMu(r), phi: rd / S }, score }));
        const next = glicko2({ mu: 0, phi: 200 / S, sigma: 0.06 }, games);
        expect(1500 + S * next.mu).toBeCloseTo(1464.06, 1);
        expect(S * next.phi).toBeCloseTo(151.52, 1);
        expect(next.sigma).toBeCloseTo(0.05999, 4);
    });

    it('only grows the RD with no games, up to the starting RD', () => {
        expect(S * glicko2({ mu: 0, phi: 200 / S, sigma: 0.06 }, []).phi).toBeCloseTo(Math.hypot(200, 0.06 * S), 6);
        expect(S * glicko2({ mu: 0, phi: 350 / S, sigma: 0.06 }, []).phi).toBeCloseTo(350, 6);
    });
});

describe('ratingSnapshots', () => {
    const rated = (game, id = game.id) => ({ id, date: game.date, sides: ratingSides(game) });
    const row = (rows, pilot) => rows.find(r => r.pilot === pilot);

    it('moves two new pilots by the textbook amount for one win', () => {
        const rows = ratingSnapshots([rated(byId(72090))]); // OKSTER 5, WD-40 3
        expect(row(rows, 'okster')).toMatchObject({ name: 'OKSTER', day: '2025-11-24', rating: 1662.3, rd: 290.3, matches: 1 });
        expect(row(rows, 'wd-40')).toMatchObject({ rating: 1337.7, rd: 290.3, matches: 1 });
    });

    it('moves a whole team by the team result, not the pilots\' kills', () => {
        const rows = ratingSnapshots([rated(byId(72102))]); // BLUE 42-35; STITCH outscored INSANER
        expect(['phoenix', 'insaner'].map(p => row(rows, p).rating)).toEqual([1662.3, 1662.3]);
        expect(['stitch', 'maestro'].map(p => row(rows, p).rating)).toEqual([1337.7, 1337.7]);
    });

    it('counts a level score as a draw', () => {
        const rows = ratingSnapshots([rated(byId(72098))]); // JFTP 2, . 2
        expect(rows.map(r => r.rating)).toEqual([1500, 1500]);
        expect(rows[0].rd).toBeLessThan(350);
    });

    it('counts a match as one game, so winning a 4-pilot FFA of new pilots is one win', () => {
        const rows = ratingSnapshots([rated({ ...byId(72108), players: ['A', 'B', 'C', 'D'].map((name, i) => ({ name, kills: 10 - i })) })]);
        expect(row(rows, 'a')).toMatchObject({ rating: 1662.3, rd: 290.3 });
        expect(row(rows, 'd')).toMatchObject({ rating: 1337.7, rd: 290.3 });
    });

    it('keeps the volatility steady and the RD under 350 for a pilot who sweeps and is swept by turns', () => {
        // the same pilot wins and then loses every 8-pilot FFA against new opponents, 300 times
        const matches = Array.from({ length: 300 }, (_, i) => ({
            id: i + 1,
            date: new Date(Date.UTC(2025, 0, 1) + i * 3600000).toISOString(),
            sides: ratingSides({
                ...byId(72108),
                players: [{ name: 'SWING', kills: i % 2 ? 20 : -1 }, ...Array.from({ length: 7 }, (_, j) => ({ name: `OPP${i}-${j}`, kills: j }))]
            })
        }));
        const swing = ratingSnapshots(matches).filter(r => r.pilot === 'swing').pop();
        expect(swing.volatility).toBeLessThan(0.07);
        expect(swing.rd).toBeLessThan(350);
        expect(Math.abs(swing.rating - 1500)).toBeLessThan(400);
    });

    it('rates an FFA pilot against every other pilot by placement', () => {
        const rows = ratingSnapshots([rated(byId(72108))]); // ZERGLING, RAPTOR, SOUP, LORD JOHN WARFIN
        const ratings = ['zergling', 'raptor', 'soup', 'lord john warfin'].map(p => row(rows, p).rating);
        expect(ratings).toEqual([...ratings].sort((a, b) => b - a));
        expect(ratings[0] - 1500).toBeCloseTo(1500 - ratings[3], 1);
        expect(ratings[1] - 1500).toBeCloseTo(1500 - ratings[2], 1);
    });

    it('rates a side by its pilots\' mean, so a win beside a stronger teammate pays less', () => {
        // ZERGLING beats RAPTOR 1v1 (1662 and 1338), then NEW1 wins a 2v2 beside one of them
        const oneVsOne = { id: 1, date: '2025-11-24T07:58:31.969Z', sides: ratingSides({ ...byId(72090), players: [{ name: 'ZERGLING', kills: 5 }, { name: 'RAPTOR', kills: 1 }] }) };
        const winBeside = mate => ratingSnapshots([oneVsOne, {
            id: 2,
            date: '2025-11-25T18:00:00Z',
            sides: ratingSides({
                ...byId(72102),
                teamScore: { BLUE: 5, ORANGE: 10 },
                players: [
                    { name: mate, team: 'ORANGE', kills: 1 }, { name: 'NEW1', team: 'ORANGE', kills: 1 },
                    { name: 'NEW2', team: 'BLUE', kills: 1 }, { name: 'NEW3', team: 'BLUE', kills: 1 }
                ]
            })
        }]);
        expect(row(winBeside('ZERGLING'), 'new1').rating).toBeLessThan(row(winBeside('RAPTOR'), 'new1').rating);
        // the losers' side is the same pair of new pilots either way, and they lose more to the weaker pair
        expect(row(winBeside('RAPTOR'), 'new2').rating).toBeLessThan(row(winBeside('ZERGLING'), 'new2').rating);
    });

    it('replays in date order whatever order the matches come in, one row per pilot per day', () => {
        const matches = sample.map(g => rated(g));
        const forward = ratingSnapshots(matches);
        expect(ratingSnapshots([...matches].reverse())).toEqual(forward);
        // B2AF lost both 1v1s to BEHEMOTH on the Chicago evening of 2025-11-23
        expect(row(forward, 'b2af')).toMatchObject({ day: '2025-11-23', matches: 2, rating: 1279.7, rd: 260.5 });
        expect(row(forward, 'behemoth')).toMatchObject({ day: '2025-11-23', matches: 2, rating: 1720.3 });
        // WD-40 played 10 rated matches, all on 2025-11-24 Chicago time
        expect(forward.filter(r => r.pilot === 'wd-40')).toHaveLength(1);
        expect(row(forward, 'wd-40').matches).toBe(10);
        expect(new Set(forward.map(r => `${r.pilot} ${r.day}`)).size).toBe(forward.length);
    });

    it('grows the RD for the days a pilot sat out, up to the start', () => {
        const first = { ...rated(byId(72090)), id: 1 };
        const again = date => ({ id: 2, date, sides: ratingSides({ ...byId(72090), date }) });
        const rdAfter = date => ratingSnapshots([first, again(date)]).filter(r => r.pilot === 'okster').pop().rd;
        const nextDay = rdAfter('2025-11-25T07:58:31.969Z');
        const yearLater = rdAfter('2026-11-24T07:58:31.969Z');
        expect(yearLater).toBeGreaterThan(nextDay);
        expect(yearLater).toBeLessThan(350);
    });

    it('takes the latest spelling and skips a match without a date', () => {
        const lower = { ...byId(72087), id: 2, date: '2025-11-25T18:00:00Z', players: byId(72087).players.map(p => ({ ...p, name: p.name.toLowerCase() })) };
        const rows = ratingSnapshots([rated(byId(72090)), rated(lower), { ...rated(byId(72088)), date: null }]);
        expect(rows.filter(r => r.pilot === 'wd-40').map(r => [r.name, r.matches])).toEqual([['WD-40', 1], ['wd-40', 2]]);
    });
});

describe('ratingDay and shiftDay', () => {
    it('reads the day in America/Chicago', () => {
        expect(ratingDay('2025-11-24T03:24:58.479Z')).toBe('2025-11-23'); // 21:24 CST
        expect(ratingDay('2025-11-24T20:41:44.143Z')).toBe('2025-11-24');
        expect(ratingDay('2026-07-04T04:59:00Z')).toBe('2026-07-03'); // 23:59 CDT
    });

    it('counts whole days across months', () => {
        expect(shiftDay('2026-03-03', -7)).toBe('2026-02-24');
        expect(shiftDay('2026-12-29', 7)).toBe('2027-01-05');
    });
});

describe('powerRankings and rankingMovement', () => {
    const snap = (pilot, rating, matches = 10, day = '2026-10-08') => ({ pilot, name: pilot.toUpperCase(), day, rating, rd: 80, matches });

    it('says why a pilot is or is not ranked', () => {
        expect(rankStatus(snap('a', 1600, 9), '2026-10-08')).toBe('provisional');
        expect(rankStatus(snap('a', 1600, 10, '2026-09-10'), '2026-10-08')).toBe('ranked'); // 28 days
        expect(rankStatus(snap('a', 1600, 10, '2026-09-09'), '2026-10-08')).toBe('inactive'); // 29 days
    });

    it('ranks pilots with enough rated matches and a recent one, by rating', () => {
        const ranked = powerRankings([
            snap('a', 1600), snap('b', 1700), snap('c', 1800, 9), snap('d', 1650, 10, '2026-09-10'),
            snap('e', 1550, 10, '2026-09-09'), snap('f', 1600, 12)
        ], '2026-10-08');
        // c has 9 rated matches; e last played 29 days before; f ties a on rating with more matches
        expect(ranked.map(r => [r.pilot, r.rank])).toEqual([['b', 1], ['d', 2], ['f', 3], ['a', 4]]);
    });

    it('grows the RD shown for the days since the last rated match, up to 350', () => {
        const s = { ...snap('a', 1600), volatility: 0.06 };
        expect(rdOn(s, '2026-10-08')).toBe(80);
        // sqrt(80^2 + (173.7178 * 0.06)^2 * 20) = 92.6
        expect(rdOn(s, '2026-10-28')).toBe(92.6);
        expect(rdOn(s, '2036-10-08')).toBe(350);
        expect(powerRankings([s], '2026-10-28')[0].rd).toBe(92.6);
    });

    it('gives each listed pilot the places gained since, or null for NEW, and lists 25', () => {
        const before = powerRankings([snap('a', 1700), snap('b', 1600), snap('c', 1500)], '2026-10-01');
        const now = powerRankings([snap('a', 1550), snap('b', 1650), snap('c', 1500), snap('d', 1800)], '2026-10-08');
        expect(rankingMovement(now, before).map(r => [r.pilot, r.rank, r.change])).toEqual([
            ['d', 1, null], ['b', 2, 0], ['a', 3, -2], ['c', 4, -1]
        ]);
        const many = powerRankings(Array.from({ length: 30 }, (_, i) => snap(`p${i}`, 1500 + i)), '2026-10-08');
        expect(rankingMovement(many, [])).toHaveLength(RATING.listed);
    });
});
