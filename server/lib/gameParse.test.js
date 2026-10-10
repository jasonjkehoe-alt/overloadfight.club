import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';
import { pilotPass } from './statsPasses.js';
import { combatRatio, durationOf, lethality, measuredDurationOf, netKills, outcomeOf, pairOutcome, pilotKey, playerRows, teamOf, winnerOf } from './gameParse.js';
import { firstBloodOf, killPoints, replayLengthOf, killScored, leadChanges, momentumOf, scoreboardAt, verdictOf, weaponFamily, WEAPON_FAMILIES } from './gameParse.js';
import { RATING, glicko2, powerRankings, rankStatus, rankedMatch, rankingMovement, ratingSides, ratingSnapshots, rdOn, shiftDay } from './gameParse.js';
import { DAY_HOURS, FIGHT_NIGHT_DAY_TEXT, calendarDays, calendarSince, careerMonth, careerSeries, dayBounds, dayStart, daysBetween, nightRatingChange, fightNightDay, heatmapCells, heatmapDays, lastOuting, localClock, weekdayOf, winRate } from './gameParse.js';
import { HOUR_MS, SERVER_STATE, SERVER_WINDOWS, SERVER_WINDOW_DEFAULT, regionShare, serverSummary, serverWindow, snapshotRow } from './gameParse.js';
import { FIGHT_NIGHT_PING, browserPilots } from './gameParse.js';
import { DUEL, OBJECTIVE_FIELDS, OBJECTIVE_MODES, addToObjectives, duelLadder, duelMatch, emptyObjectives, objectiveMode, weaponKills } from './gameParse.js';
import { CLUTCH, clutchOf, damageFlows, damageGrid, opponentsOf } from './gameParse.js';
import { duelPass, rivalPass, weaponPass } from './statsPasses.js';
import { OPPOSITE_OUTCOME, TAPE_MODES, boutsOf, tapeMode } from './gameParse.js';
import { byId, detailSample, ffaWithDamage, ffaWithLog, sample, teamWithDamage, teamWithLog } from '../testFixtures.js';

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
        expect(next.sigma).toBeCloseTo(0.059996, 6); // e^(A/2) for the paper's A = -5.62694
    });

    it('only grows the RD with no games, up to the starting RD', () => {
        expect(S * glicko2({ mu: 0, phi: 200 / S, sigma: 0.06 }, []).phi).toBeCloseTo(Math.hypot(200, 0.06 * S), 6);
        expect(S * glicko2({ mu: 0, phi: 350 / S, sigma: 0.06 }, []).phi).toBeCloseTo(350, 6);
    });
});

describe('ratingSnapshots', () => {
    const rated = (game, id = game.id) => ({ id, date: game.date, sides: ratingSides(game) });
    const row = (rows, pilot) => rows.find(r => r.pilot === pilot);
    const side = (score, ...names) => ({ score, pilots: names.map(name => ({ key: name.toLowerCase(), name })) });

    it('moves two new pilots by the textbook amount for one win', () => {
        const rows = ratingSnapshots([rated(byId(72090))]); // OKSTER 5, WD-40 3
        // 01:58 Chicago time, so the fight-night day before
        expect(row(rows, 'okster')).toMatchObject({ name: 'OKSTER', day: '2025-11-23', rating: 1662.3, rd: 290.3, matches: 1 });
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
        // WD-40 played 9 rated matches from 01:30 to 02:49 Chicago time, on the
        // fight-night day before, and the 10th that afternoon
        expect(forward.filter(r => r.pilot === 'wd-40').map(r => [r.day, r.matches])).toEqual([['2025-11-23', 9], ['2025-11-24', 10]]);
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
        // a year off already reaches 350 before the match, so two years off give the same
        expect(rdAfter('2027-11-24T07:58:31.969Z')).toBe(yearLater);
    });

    it('replays matches on the same date in id order', () => {
        const duel = (id, winner, loser) => ({ id, date: '2025-11-24T07:58:31.969Z', sides: [side(1, winner), side(0, loser)] });
        const matches = [duel(1, 'P', 'Q'), duel(2, 'Q', 'P'), duel(3, 'P', 'R')];
        expect(ratingSnapshots([...matches].reverse())).toEqual(ratingSnapshots(matches));
    });

    it("takes a side's RD as the root mean square of its pilots' RDs", () => {
        // A beats 30 new pilots, then A and a new pilot lose a 2v2 to two new
        // pilots, all at one time so no RD grows in between
        const at = '2025-11-24T07:58:31.969Z';
        const grind = Array.from({ length: 30 }, (_, i) => ({ id: i + 1, date: at, sides: [side(1, 'A'), side(0, `X${i}`)] }));
        const a = row(ratingSnapshots(grind), 'a');
        const rows = ratingSnapshots([...grind, { id: 31, date: at, sides: [side(0, 'A', 'N'), side(1, 'B', 'C')] }]);
        const S = RATING.scale;
        const phiA = a.rd / S;
        const phiNew = RATING.rd / S;
        const losers = { mu: (a.rating - RATING.start) / S / 2, phi: Math.sqrt((phiA * phiA + phiNew * phiNew) / 2) };
        const b = glicko2({ mu: 0, phi: phiNew, sigma: RATING.volatility }, [{ mu: 0, opponent: losers, score: 1 }]);
        expect(row(rows, 'b').rating).toBeCloseTo(RATING.start + S * b.mu, 0);
    });

    it('takes the latest spelling and skips a match without a date', () => {
        const lower = { ...byId(72087), id: 2, date: '2025-11-25T18:00:00Z', players: byId(72087).players.map(p => ({ ...p, name: p.name.toLowerCase() })) };
        const rows = ratingSnapshots([rated(byId(72090)), rated(lower), { ...rated(byId(72088)), date: null }]);
        expect(rows.filter(r => r.pilot === 'wd-40').map(r => [r.name, r.matches])).toEqual([['WD-40', 1], ['wd-40', 2]]);
    });
});

describe('fight-night days', () => {
    it('rolls the day over at 06:00 Chicago time, in CST and CDT', () => {
        expect(fightNightDay('2025-11-24T11:59:59.999Z')).toBe('2025-11-23'); // 05:59 CST
        expect(fightNightDay('2025-11-24T12:00:00.000Z')).toBe('2025-11-24'); // 06:00 CST
        expect(fightNightDay('2026-07-04T10:59:59.999Z')).toBe('2026-07-03'); // 05:59 CDT
        expect(fightNightDay('2026-07-04T11:00:00.000Z')).toBe('2026-07-04'); // 06:00 CDT
        expect(fightNightDay('2026-07-04T04:59:00Z')).toBe('2026-07-03'); // 23:59 CDT
        expect(fightNightDay('not a date')).toBeNull();
    });

    it('keeps the fixtures\' evening, 21:24 to 02:49 Chicago time, on one day', () => {
        const days = new Map(sample.map(g => [g.id, fightNightDay(g.date)]));
        expect([72084, 72085, 72090, 72094].map(id => days.get(id))).toEqual(['2025-11-23', '2025-11-23', '2025-11-23', '2025-11-23']);
        expect(days.get(72095)).toBe('2025-11-24');
    });

    it('reads the weekday of the fight-night day and the clock hour', () => {
        expect(localClock('2025-11-24T03:24:58.479Z')).toEqual({ day: '2025-11-23', weekday: 6, hour: 21 }); // Sunday 21:24
        expect(localClock('2025-11-24T08:49:30.761Z')).toEqual({ day: '2025-11-23', weekday: 6, hour: 2 }); // Monday 02:49, Sunday's night
        expect(localClock(Date.parse('2025-11-24T20:41:44.143Z'))).toEqual({ day: '2025-11-24', weekday: 0, hour: 14 });
        expect([weekdayOf('2025-11-24'), weekdayOf('2025-11-23'), weekdayOf('1970-01-01')]).toEqual([0, 6, 3]);
    });

    it('gives each day its UTC bounds, 23 and 25 hours on the DST days', () => {
        expect(dayBounds('2025-11-24')).toEqual(['2025-11-24T12:00:00.000Z', '2025-11-25T12:00:00.000Z']);
        expect(dayBounds('2026-07-04')).toEqual(['2026-07-04T11:00:00.000Z', '2026-07-05T11:00:00.000Z']);
        // clocks go forward at 02:00 on 2026-03-08 and back on 2026-11-01
        expect(dayBounds('2026-03-07')).toEqual(['2026-03-07T12:00:00.000Z', '2026-03-08T11:00:00.000Z']);
        expect(dayBounds('2026-10-31')).toEqual(['2026-10-31T11:00:00.000Z', '2026-11-01T12:00:00.000Z']);
        // a date inside a day's bounds is on that day, the end is not
        const [start, end] = dayBounds('2026-03-07');
        expect([fightNightDay(start), fightNightDay(Date.parse(end) - 1), fightNightDay(end)]).toEqual(['2026-03-07', '2026-03-07', '2026-03-08']);
        expect(dayStart('2026-03-08')).toBe(dayBounds('2026-03-07')[1]);
        expect([DAY_HOURS[0], DAY_HOURS[17], DAY_HOURS[18], DAY_HOURS[23]]).toEqual([6, 23, 0, 5]);
        expect(FIGHT_NIGHT_DAY_TEXT).toBe('Central time, a day running from 06:00 to 06:00');
        expect([dayBounds('2026-02-30'), dayBounds('2026-13-01'), dayBounds('foo'), dayBounds('2026-10')]).toEqual([null, null, null, null]);
    });

    it('counts whole days across months', () => {
        expect(shiftDay('2026-03-03', -7)).toBe('2026-02-24');
        expect(shiftDay('2026-12-29', 7)).toBe('2027-01-05');
        expect(daysBetween('2026-02-24', '2026-03-03')).toBe(7);
    });
});

describe('heatmap and activity calendar', () => {
    it('counts matches by fight-night weekday and clock hour', () => {
        const cells = heatmapCells(sample.map(g => g.date));
        expect(cells).toHaveLength(7);
        expect(cells.flat().reduce((a, b) => a + b, 0)).toBe(25);
        // Sunday's night: 21:24 and 21:45, then 01:30 to 02:49 on Monday morning
        expect([cells[6][21], cells[6][1], cells[6][2]]).toEqual([2, 5, 4]);
        // Monday afternoon
        expect(cells[0].slice(13, 17)).toEqual([2, 8, 3, 1]);
        expect(cells[0][1]).toBe(0);
    });

    it('takes the twelve whole weeks before today', () => {
        expect(heatmapDays('2026-10-08')).toEqual({ since: '2026-07-16', until: '2026-10-08' });
    });

    it('counts a pilot\'s matches per fight-night day, from a Monday 52 weeks back', () => {
        expect(calendarDays(sample.map(g => g.date))).toEqual([{ day: '2025-11-23', matches: 11 }, { day: '2025-11-24', matches: 14 }]);
        expect(calendarSince('2025-11-24')).toBe('2024-11-25'); // today a Monday
        expect(calendarSince('2025-11-23')).toBe('2024-11-18'); // today a Sunday
        expect(weekdayOf(calendarSince('2026-10-08'))).toBe(0);
    });
});

describe('career series', () => {
    it('puts a match in the month of its fight-night day', () => {
        expect(careerMonth('2025-12-01T05:30:00Z')).toBe('2025-11'); // 23:30 on 30 November
        expect(careerMonth('2025-12-01T12:00:00Z')).toBe('2025-12');
    });

    it('adds up to the career totals, month by month', () => {
        const pass = pilotPass();
        const moved = sample.map(g => (g.id >= 72100 ? { ...g, date: g.date.replace('2025-11', '2025-12') } : g));
        for (const g of moved) pass.add({ id: g.id, date: g.date }, g);
        const months = pass.months();
        for (const row of pass.rows()) {
            const mine = months.filter(m => m.pilot === pilotKey(row.name));
            const sum = field => mine.reduce((a, m) => a + m[field], 0);
            expect([sum('matches'), sum('kills'), sum('deaths'), sum('assists'), sum('wins'), sum('losses'), sum('ties')])
                .toEqual([row.games, row.kills, row.deaths, row.assists, row.wins, row.losses, row.ties]);
            expect(Math.round(sum('seconds'))).toBe(row.time_played_seconds);
        }
        // JFTP's ranked matches: 72098 in November, seven from 72100 on in December
        expect(months.filter(m => m.pilot === 'jftp').map(m => [m.month, m.matches]).sort()).toEqual([['2025-11', 1], ['2025-12', 7]]);
    });

    it('fills the months between and up to this month, rates null where nothing was played', () => {
        const month = (m, matches, wins, kills, deaths, assists, seconds) => ({ month: m, matches, wins, losses: matches - wins, ties: 0, kills, deaths, assists, seconds });
        const series = careerSeries([month('2025-11', 4, 1, 30, 20, 4, 2400), month('2026-01', 2, 2, 9, 0, 1, 600)], '2026-03');
        expect(series.map(m => m.month)).toEqual(['2025-11', '2025-12', '2026-01', '2026-02', '2026-03']);
        expect(series[0]).toMatchObject({ matches: 4, winRate: 25, combatRatio: 1.6, lethality: 0.75 });
        expect(series[1]).toMatchObject({ matches: 0, winRate: null, combatRatio: null, lethality: null });
        expect(series[2]).toMatchObject({ winRate: 100, combatRatio: 9, lethality: 0.9 });
        expect(careerSeries([], '2026-03')).toEqual([]);
        expect(careerSeries([month('2026-05', 1, 1, 1, 1, 0, 60)], '2026-03').map(m => m.month)).toEqual(['2026-05']);
        expect([winRate(1, 3), winRate(0, 0)]).toEqual([33.3, 0]);
    });
});

describe('nightRatingChange', () => {
    const snap = (day, rating) => ({ day, rating });
    it('takes the night\'s last snapshot less the one before, or the start for a first night', () => {
        expect(nightRatingChange([snap('2026-10-07', 1512.34), snap('2026-10-01', 1500.1)], '2026-10-07')).toBe(12.2);
        expect(nightRatingChange([snap('2026-10-07', 1480)], '2026-10-07')).toBe(-20);
    });

    it('is null for a night without a rated match', () => {
        expect(nightRatingChange([snap('2026-10-01', 1512)], '2026-10-07')).toBeNull();
        expect(nightRatingChange([], '2026-10-07')).toBeNull();
    });
});

describe('lastOuting', () => {
    const sundayNight = sample.filter(g => fightNightDay(g.date) === '2025-11-23');

    it('sums the pilot\'s fight-night day, newest match first', () => {
        const night = lastOuting(sundayNight, 'wd-40');
        expect(night).toMatchObject({ day: '2025-11-23', wins: 3, losses: 5, ties: 1, kills: 87, deaths: 92, assists: 12, combatRatio: 1.01 });
        expect(night.matches.map(m => m.id)).toEqual([72094, 72093, 72092, 72091, 72090, 72089, 72088, 72087, 72086]);
        expect(night.matches[0]).toEqual({ id: 72094, date: '2025-11-24T08:49:30.761Z', map: 'JAZZYBOX', mode: 'ANARCHY', outcome: 'win', kills: 16, deaths: 17, assists: 1 });
    });

    it('counts a team result for the team, and nothing for a match without a result', () => {
        const night = lastOuting([byId(72102), { ...byId(72099), teamScore: {} }], 'Stitch');
        expect(night).toMatchObject({ day: '2025-11-24', wins: 0, losses: 1, ties: 0 });
        expect(night.matches.map(m => m.outcome)).toEqual([ 'loss', null ]);
    });

    it('is null for a pilot who is not in the matches', () => {
        expect(lastOuting(sundayNight, 'JFTP')).toBeNull();
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

    it('breaks a tie on rating and rated matches by pilot', () => {
        expect(powerRankings([snap('b', 1600), snap('a', 1600)], '2026-10-08').map(r => r.pilot)).toEqual(['a', 'b']);
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

describe('server history (S15)', () => {
    const hourOf = iso => Date.parse(iso) / HOUR_MS;
    const hour = (iso, fields) => ({ hour: hourOf(iso), samples: 60, online: 60, lobby: 0, match: 0, pilots: 0, match_pilots: 0, peak: 0, ...fields });

    it('reads a server-browser entry as one tick', () => {
        // the shape the tracker's /api/browser answers, with a sample game's server
        const { ip, name, notes } = sample[0].server;
        const server = { ip, name, serverNotes: notes, online: true };
        expect(snapshotRow({ server, game: { currentPlayers: 6, maxPlayers: 16, inLobby: false } })).toEqual({ ip, online: 1, players: 6, max_players: 16, state: SERVER_STATE.match });
        expect(snapshotRow({ server, game: { currentPlayers: 1, maxPlayers: 8, inLobby: true } })).toMatchObject({ players: 1, state: SERVER_STATE.lobby });
        expect(snapshotRow({ server: { ...server, online: false } })).toEqual({ ip, online: 0, players: 0, max_players: null, state: SERVER_STATE.idle });
        expect(snapshotRow({ server: { name } })).toBeNull();
    });

    it('counts the pilots on online servers for the Discord ping (S18), lobbies included', () => {
        const at = (ip, online, game) => ({ server: { ip, name: ip, online }, ...(game && { game }) });
        const servers = [
            at('10.0.0.1', true, { currentPlayers: 4, maxPlayers: 8, inLobby: false }),
            at('10.0.0.2', true, { currentPlayers: 2, maxPlayers: 8, inLobby: true }),
            // offline with a game still listed, online with no game, no IP, listed twice
            at('10.0.0.3', false, { currentPlayers: 5, maxPlayers: 8, inLobby: false }),
            at('10.0.0.4', true),
            { server: { name: 'no ip', online: true }, game: { currentPlayers: 3 } },
            // a second listing of a server: the first one counts, as in the stored tick
            at('10.0.0.1', true, { currentPlayers: 7, maxPlayers: 8, inLobby: false })
        ];
        expect(browserPilots(servers)).toBe(FIGHT_NIGHT_PING.pilots);
        expect(browserPilots(servers.slice(1))).toBe(9);
        expect(browserPilots(servers.slice(2, 5))).toBe(0);
        expect(browserPilots([])).toBe(0);
    });

    it('counts uptime, use, average pilots and the peak over the hours', () => {
        const s = serverSummary([
            // Saturday 2026-10-03, 20:00 and 21:00 Chicago time (CDT, UTC-5)
            hour('2026-10-04T01:00:00Z', { online: 60, match: 30, pilots: 210, match_pilots: 180, peak: 8 }),
            hour('2026-10-04T02:00:00Z', { online: 30, lobby: 10, match: 0, pilots: 20, peak: 3 }),
            // Sunday 2026-10-04 at 01:00, the same Saturday-night row: 8 pilots again, later
            hour('2026-10-04T06:00:00Z', { online: 60, match: 60, pilots: 480, match_pilots: 480, peak: 8 })
        ]);
        expect(s).toMatchObject({ samples: 180, uptime: 0.8333, inUse: 0.6, avgPilots: 7.33, peak: { pilots: 8, at: '2026-10-04T06:00:00.000Z' } });
        // (180 + 480) pilots over 90 match ticks; 210 / 60, 20 / 60 and 480 / 60 pilots per tick, all on Saturday's fight-night day
        expect(s.cells[5][20]).toBe(3.5);
        expect(s.cells[5][21]).toBe(0.33);
        expect(s.cells[5][1]).toBe(8);
        expect(s.cells[6].every(c => c === null)).toBe(true);
        expect(s.busiest).toEqual({ weekday: 5, hour: 1, pilots: 8 });
    });

    it('puts both 01:00s of the day DST ends in one cell', () => {
        // 2026-11-01 01:00 CDT is 06:00Z and 01:00 CST 07:00Z, both on Saturday 2026-10-31's night
        const s = serverSummary([hour('2026-11-01T06:00:00Z', { pilots: 120 }), hour('2026-11-01T07:00:00Z', { pilots: 240 })]);
        expect(s.cells[5][1]).toBe(3);
        expect(s.cells.flat().filter(c => c !== null)).toHaveLength(1);
    });

    it('gives null rates with nothing to divide by', () => {
        expect(serverSummary([])).toMatchObject({ samples: 0, uptime: null, inUse: null, avgPilots: null, peak: null, busiest: null });
        expect(serverSummary([hour('2026-10-04T01:00:00Z', { online: 0 })])).toMatchObject({ uptime: 0, inUse: null, avgPilots: null, peak: null });
    });

    it('takes whole fight-night days before today as the window', () => {
        expect(serverWindow('2026-10-08', 7)).toEqual({ since: '2026-10-01', until: '2026-10-08' });
        expect(SERVER_WINDOWS).toContain(SERVER_WINDOW_DEFAULT);
    });

    it('fills the region share month by month to this month', () => {
        const months = regionShare([
            { region: 'europe', month: '2025-11', matches: 13 },
            { region: 'na-west', month: '2025-11', matches: 8 },
            { region: 'europe', month: '2026-01', matches: 2 }
        ], '2026-02');
        expect(months).toEqual([
            { month: '2025-11', total: 21, counts: { europe: 13, 'na-west': 8 } },
            { month: '2025-12', total: 0, counts: {} },
            { month: '2026-01', total: 2, counts: { europe: 2 } },
            { month: '2026-02', total: 0, counts: {} }
        ]);
        expect(regionShare([], '2026-02')).toEqual([]);
    });
});

describe('weapon meta and ladders (S16)', () => {
    const families = kills => kills.reduce((c, k) => ({ ...c, [k.family]: (c[k.family] || 0) + 1 }), {});

    describe('weaponKills', () => {
        it('lists every kill on an opponent under its weapon family, with the attacker', () => {
            const kills = weaponKills(teamWithLog);
            expect(kills).toHaveLength(10);
            expect(families(kills)).toEqual({ laser: 2, thunderbolt: 1, flak: 1, missile: 2, mine: 1, driller: 1, heavy: 1, other: 1 });
            expect(kills.filter(k => k.attacker === 'INSANER')).toHaveLength(5);
            expect(weaponKills(ffaWithLog).map(k => `${k.attacker}:${k.family}`)).toEqual(['JFTP:laser', '.:missile', '.:thunderbolt', 'JFTP:driller']);
        });

        it('leaves out suicides, team kills (teams read from the players) and deaths without an attacker', () => {
            const game = {
                ...teamWithLog,
                kills: [
                    ...teamWithLog.kills,
                    { time: 200, attacker: 'INSANER', defender: 'INSANER', weapon: 'Nova' },
                    { time: 210, attacker: 'INSANER', defender: 'PHOENIX', weapon: 'Flak' },
                    { time: 220, attacker: '', defender: 'STITCH', weapon: 'Miscellaneous' }
                ]
            };
            expect(weaponKills(game)).toHaveLength(10);
        });

        it('gives nothing for a match that is not ranked or has no log', () => {
            expect(weaponKills({ ...teamWithLog, date: new Date(Date.parse(teamWithLog.settings.start) + 30000).toISOString() })).toEqual([]);
            expect(weaponKills(byId(72099))).toEqual([]);
            expect(weaponKills(null)).toEqual([]);
        });
    });

    describe('duelMatch', () => {
        it('is a ranked 1v1 Anarchy match, with one pilot a side', () => {
            const sides = duelMatch(byId(72090));
            expect(sides.map(s => `${s.pilots[0].name}:${s.score}`)).toEqual(['OKSTER:5', 'WD-40:3']);
            expect(sides.every(s => s.pilots.length === 1)).toBe(true);
        });

        it('is also a one-a-side team match, scored by the team score', () => {
            // a team score that disagrees with the kills: the first pilot listed is BLUE
            const game = { ...byId(72090), teamScore: { BLUE: 1, ORANGE: 4 }, settings: { ...byId(72090).settings, matchMode: 'TEAM ANARCHY' } };
            game.players = game.players.map((p, i) => ({ ...p, team: i ? 'ORANGE' : 'BLUE' }));
            expect(duelMatch(game).map(s => `${s.pilots[0].name}:${s.score}`)).toEqual([`${game.players[1].name}:4`, `${game.players[0].name}:1`]);
        });

        it('is not a CTF or Monsterball 1v1, a match with a third pilot, or one too short to rank', () => {
            const game = byId(72090);
            expect(duelMatch({ ...game, settings: { ...game.settings, matchMode: 'CTF' }, teamScore: { BLUE: 1, ORANGE: 0 }, players: game.players.map((p, i) => ({ ...p, team: i ? 'ORANGE' : 'BLUE' })) })).toBeNull();
            expect(duelMatch({ ...game, settings: { ...game.settings, matchMode: 'MONSTERBALL' }, teamScore: { BLUE: 1, ORANGE: 0 }, players: game.players.map((p, i) => ({ ...p, team: i ? 'ORANGE' : 'BLUE' })) })).toBeNull();
            expect(duelMatch({ ...game, players: [...game.players, { name: 'THIRD', kills: 0, deaths: 0, assists: 0 }] })).toBeNull();
            // a one-a-side team match with a third pilot on no team: two sides of one, but not a 1v1
            const teamGame = { ...game, teamScore: { BLUE: 3, ORANGE: 5 }, settings: { ...game.settings, matchMode: 'TEAM ANARCHY' }, players: [...game.players.map((p, i) => ({ ...p, team: i ? 'ORANGE' : 'BLUE' })), { name: 'THIRD', kills: 0, deaths: 0, assists: 0 }] };
            expect(duelMatch(teamGame)).toBeNull();
            expect(duelMatch(byId(72102))).toBeNull();
            expect(duelMatch({ ...game, date: new Date(Date.parse(game.settings.start) + 30000).toISOString() })).toBeNull();
        });

        it('counts a pilot listed twice once', () => {
            const game = byId(72090);
            expect(duelMatch({ ...game, players: [...game.players, { ...game.players[0] }] })).toHaveLength(2);
        });

        it('finds 11 duels in the 25 sample matches, each pair\'s record mirrored', () => {
            const pass = duelPass();
            for (const g of sample) pass.add({ id: g.id, date: g.date }, g);
            const pairs = pass.pairs();
            const record = (a, b) => pairs.find(r => r.pilot === a && r.opponent === b);
            // each duel is in both pilots' records
            expect(pairs.reduce((n, r) => n + r.wins + r.losses + r.ties, 0)).toBe(22);
            expect(pairs.reduce((n, r) => n + r.wins, 0)).toBe(pairs.reduce((n, r) => n + r.losses, 0));
            expect(record('okster', 'wd-40')).toMatchObject({ wins: 3, losses: 1, ties: 1, last: '2025-11-24T07:58:31.969Z' });
            expect(record('wd-40', 'okster')).toMatchObject({ wins: 1, losses: 3, ties: 1 });
            expect(record('jftp', '.')).toMatchObject({ wins: 2, losses: 0, ties: 1 });
            expect(record('b2af', 'behemoth')).toMatchObject({ wins: 0, losses: 2, ties: 0 });
            const snapshots = pass.rows();
            expect(new Set(snapshots.map(s => s.pilot))).toEqual(new Set(['jftp', 'xb1', '.', 'wd-40', 'okster', 'b2af', 'behemoth']));
            // a duel without a date is in neither the snapshots nor the records
            const undated = duelPass();
            undated.add({ id: 1, date: null }, { ...byId(72090), date: undefined });
            undated.add({ id: 2, date: 'not a date' }, byId(72089));
            expect(undated.rows()).toEqual([]);
            expect(undated.pairs()).toEqual([]);
            // the duel subset's replay: WD-40's five duels, JFTP's four
            expect(Math.max(...snapshots.filter(s => s.pilot === 'wd-40').map(s => s.matches))).toBe(5);
            expect(Math.max(...snapshots.filter(s => s.pilot === 'jftp').map(s => s.matches))).toBe(4);
        });
    });

    describe('duelLadder', () => {
        const snapshot = (pilot, rating, matches, day = '2026-10-01') => ({ pilot, name: pilot.toUpperCase(), day, rating, rd: 80, volatility: 0.06, matches });
        it('lists pilots from DUEL.listedAfter duels by rating, then the provisional ones, with their RD on the day', () => {
            const ladder = duelLadder([snapshot('a', 1500, 5), snapshot('b', 1700, 2), snapshot('c', 1600, DUEL.listedAfter), snapshot('d', 1600, 7), snapshot('e', 1400, 1)], '2026-10-21');
            expect(ladder.map(p => `${p.rank}:${p.pilot}:${p.status}`)).toEqual(['1:d:listed', '2:c:listed', '3:a:listed', '4:b:provisional', '5:e:provisional']);
            expect(ladder[0].rd).toBe(92.6);
        });
        it('has no activity window: a pilot idle for a year stays listed', () => {
            expect(duelLadder([snapshot('a', 1500, 5, '2025-10-01')], '2026-10-21')[0].status).toBe('listed');
        });
    });

    describe('objectives', () => {
        it('names the objective modes whatever the case or spacing', () => {
            expect(objectiveMode({ settings: { matchMode: 'MONSTERBALL' } })).toBe('MONSTERBALL');
            expect(objectiveMode({ settings: { matchMode: ' ctf ' } })).toBe('CTF');
            expect(objectiveMode(byId(72102))).toBeNull();
            expect(objectiveMode({})).toBeNull();
        });

        it('adds the tracker\'s per-player counts to a career line, missing ones as 0', () => {
            const line = addToObjectives(emptyObjectives(), detailSample.players[0], 'tie');
            expect(line).toMatchObject({ matches: 1, ties: 1, kills: 0, deaths: 1, goals: 1, goal_assists: 0, blunders: 1, captures: 0, returns: 0, pickups: 0, carrier_kills: 0 });
            addToObjectives(line, { name: 'X', kills: 2, goalAssists: 4, captures: 3, returns: '1', pickups: 5, carrierKills: 2 }, 'win');
            expect(line).toMatchObject({ matches: 2, wins: 1, kills: 2, goals: 1, goal_assists: 4, captures: 3, returns: 1, pickups: 5, carrier_kills: 2 });
            for (const { field } of OBJECTIVE_FIELDS) expect(line).toHaveProperty(field);
            for (const mode of Object.values(OBJECTIVE_MODES)) expect(mode.fields).toContain(mode.sort);
        });
    });

    describe('weaponPass', () => {
        it('counts the logged kills by map and by attacker, both adding up to the kills', () => {
            const pass = weaponPass();
            for (const g of [teamWithLog, ffaWithLog, byId(72102), { ...teamWithLog, id: 1, settings: { ...teamWithLog.settings, level: 'ascent' } }]) pass.add({ id: g.id, date: g.date }, g);
            const maps = pass.maps();
            const pilots = pass.pilots();
            expect(maps.reduce((n, r) => n + r.kills, 0)).toBe(24);
            expect(pilots.reduce((n, r) => n + r.kills, 0)).toBe(24);
            expect(maps.filter(r => r.map === 'ASCENT').reduce((n, r) => n + r.kills, 0)).toBe(20);
            expect(maps.find(r => r.map === 'POSEIDON' && r.family === 'laser').kills).toBe(1);
            expect(pilots.find(r => r.pilot === 'insaner' && r.family === 'other').kills).toBe(2);
            // a logged match without a map counts in neither table
            const noMap = weaponPass();
            noMap.add({ id: 3 }, { ...teamWithLog, settings: { ...teamWithLog.settings, level: '' } });
            expect(noMap.maps()).toEqual([]);
            expect(noMap.pilots()).toEqual([]);
        });
    });
});

describe('rivalries, damage flow and clutch (S17)', () => {
    const short = game => ({ ...game, date: new Date(Date.parse(game.settings.start) + 30000).toISOString() });
    const ctf = game => ({ ...game, settings: { ...game.settings, matchMode: 'CTF' } });

    describe('kill edges (weaponKills)', () => {
        it('names the defender of every kill on an opponent', () => {
            expect(weaponKills(teamWithLog).map(k => `${k.attacker}>${k.defender}`)).toEqual([
                'STITCH>PHOENIX', 'INSANER>MAESTRO', 'INSANER>STITCH', 'STITCH>INSANER', 'MAESTRO>PHOENIX',
                'STITCH>PHOENIX', 'INSANER>MAESTRO', 'INSANER>MAESTRO', 'PHOENIX>STITCH', 'INSANER>MAESTRO'
            ]);
        });
    });

    describe('opponentsOf', () => {
        it('pairs every pilot with each opponent once: everyone in FFA, across teams in a team game', () => {
            expect(opponentsOf(teamWithLog)).toEqual([['stitch', 'phoenix'], ['stitch', 'insaner'], ['phoenix', 'maestro'], ['insaner', 'maestro']]);
            expect(opponentsOf(ffaWithLog)).toEqual([['jftp', '.']]);
        });

        it('lets a pilot without a team sit out of a team game and counts a pilot listed twice once', () => {
            const game = { ...teamWithLog, players: [...teamWithLog.players, { name: 'LONER', kills: 0, deaths: 0 }, { ...teamWithLog.players[1], name: 'stitch ' }] };
            expect(opponentsOf(game)).toEqual(opponentsOf(teamWithLog));
        });

        it('pairs a pilot who changed team with the teammates they ended on', () => {
            // MAESTRO, listed ORANGE beside STITCH, started on BLUE
            const game = { ...teamWithLog, teamChanges: [{ time: 60, playerName: 'MAESTRO', previousTeam: 'BLUE', currentTeam: 'ORANGE' }] };
            const key = ([a, b]) => [a, b].sort().join('-');
            expect(opponentsOf(game).map(key).sort()).toEqual([...opponentsOf(teamWithLog).map(key), 'maestro-stitch'].sort());
        });

        it('pairs the pilots of a match with a damage log and no kill log, so its damage has matches', () => {
            expect(opponentsOf({ ...teamWithDamage, kills: [] })).toEqual(opponentsOf(teamWithLog));
        });

        it('gives nothing for a match that is not ranked or has no log', () => {
            expect(opponentsOf(short(teamWithLog))).toEqual([]);
            expect(opponentsOf(byId(72099))).toEqual([]);
        });
    });

    describe('damageFlows', () => {
        it('keeps the damage on opponents and leaves out teammates, self-damage and entries without an attacker', () => {
            const flows = damageFlows(teamWithDamage);
            expect(flows.map(f => `${f.attacker}>${f.defender}`)).toEqual(['INSANER>MAESTRO', 'INSANER>STITCH', 'STITCH>PHOENIX', 'STITCH>INSANER', 'MAESTRO>PHOENIX', 'PHOENIX>STITCH']);
            expect(flows.reduce((sum, f) => sum + f.damage, 0)).toBe(900.75);
            expect(damageFlows(ffaWithDamage)).toEqual([{ attacker: 'JFTP', defender: '.', damage: 210 }, { attacker: '.', defender: 'JFTP', damage: 180.5 }]);
        });

        it('counts damage on a pilot no listing places on a team, as killPoints() counts such a kill', () => {
            const game = { ...teamWithDamage, damage: [{ attacker: 'INSANER', defender: 'GHOST', weapon: 'Flak', damage: 5 }] };
            expect(damageFlows(game)).toHaveLength(1);
        });

        it('keeps damage between listed teammates when one of them changed team', () => {
            const game = { ...teamWithDamage, damage: [{ attacker: 'STITCH', defender: 'MAESTRO', weapon: 'Flak', damage: 30 }] };
            expect(damageFlows(game)).toEqual([]);
            const changed = { ...game, teamChanges: [{ time: 60, playerName: 'maestro', previousTeam: 'BLUE', currentTeam: 'ORANGE' }] };
            expect(damageFlows(changed)).toEqual([{ attacker: 'STITCH', defender: 'MAESTRO', damage: 30 }]);
            const grid = damageGrid(changed);
            const at = name => grid.pilots.findIndex(p => p.name === name);
            expect(grid.mate[at('STITCH')][at('MAESTRO')]).toBe(false);
            expect(damageGrid(game).mate[at('STITCH')][at('MAESTRO')]).toBe(true);
        });

        it('leaves out entries of no damage', () => {
            const game = { ...teamWithDamage, damage: [{ attacker: 'INSANER', defender: 'MAESTRO', weapon: 'Flak', damage: 0 }, { attacker: 'INSANER', defender: 'MAESTRO', weapon: 'Flak', damage: -4 }] };
            expect(damageFlows(game)).toEqual([]);
        });

        it('gives nothing for a match that is not ranked or has no damage log', () => {
            expect(damageFlows(short(teamWithDamage))).toEqual([]);
            expect(damageFlows(teamWithLog)).toEqual([]);
            expect(damageFlows(null)).toEqual([]);
        });
    });

    describe('damageGrid', () => {
        it('lays out the whole damage log by dealer and target, teams first, totals without self-damage', () => {
            const grid = damageGrid(teamWithDamage);
            expect(grid.pilots.map(p => `${p.team}:${p.name}`)).toEqual(['BLUE:INSANER', 'BLUE:PHOENIX', 'ORANGE:MAESTRO', 'ORANGE:STITCH']);
            const at = name => grid.pilots.findIndex(p => p.name === name);
            expect(grid.dealt[at('INSANER')][at('MAESTRO')]).toBe(300.5);
            // the teammate's damage and the self-damage stay; the entry without an attacker does not
            expect(grid.dealt[at('PHOENIX')][at('INSANER')]).toBe(15);
            expect(grid.dealt[at('MAESTRO')][at('MAESTRO')]).toBe(20);
            expect(grid.out[at('PHOENIX')]).toBe(75);
            expect(grid.out[at('MAESTRO')]).toBe(90);
            expect(grid.total).toBe(915.75);
        });

        it('gives null without a damage log', () => {
            expect(damageGrid(teamWithLog)).toBeNull();
            expect(damageGrid({ ...teamWithDamage, players: [] })).toBeNull();
        });
    });

    describe('clutchOf', () => {
        it('counts first blood, kills in the last minute and kills while trailing in a team game', () => {
            const clutch = clutchOf(teamWithLog);
            expect(clutch.team).toBe(true);
            expect(clutch.firstBlood).toBe('STITCH');
            expect(clutch.kills).toHaveLength(10);
            // ORANGE 1-0 when INSANER scores at 0:25, BLUE 2-1 at STITCH's 0:55, ORANGE 4-2 and 4-3 at 1:50 and 2:10
            expect(clutch.kills.filter(k => k.trailing).map(k => k.attacker)).toEqual(['INSANER', 'STITCH', 'INSANER', 'INSANER']);
            // the match runs 3:34, so the last minute starts at 2:34: only the 3:00 kill
            expect(clutch.kills.filter(k => k.late).map(k => k.attacker)).toEqual(['INSANER']);
        });

        it('reads trailing in FFA as behind the leader at that moment, a level score not counting', () => {
            const clutch = clutchOf(ffaWithLog);
            expect(clutch).toMatchObject({ team: false, firstBlood: 'JFTP' });
            // "." trails 0-1 at 0:30 (and is level at 0:45); JFTP trails 1-2 at 1:20
            expect(clutch.kills.map(k => `${k.attacker}:${k.trailing}`)).toEqual(['JFTP:false', '.:true', '.:false', 'JFTP:true']);
        });

        it('starts the last minute exactly CLUTCH.lateSeconds before the end of the replay', () => {
            const end = replayLengthOf(teamWithLog);
            const at = t => clutchOf({ ...teamWithLog, kills: [{ time: t, attacker: 'INSANER', defender: 'MAESTRO', weapon: 'Flak' }] }).kills[0].late;
            expect(at(end - CLUTCH.lateSeconds)).toBe(true);
            expect(at(end - CLUTCH.lateSeconds - 0.01)).toBe(false);
        });

        it('skips a log entry that is not an object instead of throwing', () => {
            const clutch = clutchOf({ ...teamWithLog, kills: [null, ...teamWithLog.kills, 'x'] });
            expect(clutch.kills).toHaveLength(10);
            expect(scoreboardAt({ ...ffaWithLog, kills: [null, ...ffaWithLog.kills] }).sides.map(s => s.score)).toEqual([2, 2]);
        });

        it('gives nothing for a match that is not ranked, not kill-scored or has no kill log', () => {
            expect(clutchOf(short(teamWithLog))).toBeNull();
            expect(clutchOf(ctf(teamWithLog))).toBeNull();
            expect(clutchOf(byId(72099))).toBeNull();
        });

        it('ends the last minute at the time limit, not at the later end the tracker records', () => {
            // the fixture runs 3:34 by start and end; with a 3:20 limit the last minute starts at 2:20
            const game = { ...teamWithLog, settings: { ...teamWithLog.settings, timeLimit: 200 } };
            expect(clutchOf(game).kills.filter(k => k.late).map(k => k.attacker)).toEqual(['PHOENIX', 'INSANER']);
        });

        it('never counts a team-game kill by a pilot without a team as trailing', () => {
            const game = { ...teamWithLog, players: [...teamWithLog.players, { name: 'LONER', kills: 1, deaths: 0 }], kills: [...teamWithLog.kills, { time: 200, attacker: 'LONER', defender: 'MAESTRO', weapon: 'Flak' }] };
            expect(clutchOf(game).kills.at(-1)).toMatchObject({ attacker: 'LONER', trailing: false });
        });
    });

    describe('rivalPass', () => {
        const pass = rivalPass();
        // a later copy of 72098 spells JFTP "jftp", which becomes the name shown
        const later = { ...ffaWithDamage, players: ffaWithDamage.players.map(p => (p.name === 'JFTP' ? { ...p, name: 'jftp' } : p)) };
        const games = [teamWithDamage, ffaWithDamage, later];
        games.forEach((g, i) => pass.add({ id: i + 1, date: i === 2 ? '2026-01-01T00:00:00.000Z' : g.date }, g));
        pass.add({ id: 9, date: null }, null);
        const pairs = pass.pairs();
        const pair = (a, b) => pairs.find(p => p.pilot === a && p.opponent === b);

        it('makes no pair of a kill without a defender', () => {
            const blank = rivalPass();
            blank.add({ id: 1, date: teamWithDamage.date }, { ...teamWithDamage, kills: [...teamWithDamage.kills, { time: 200, attacker: 'INSANER', defender: '', weapon: 'Flak' }] });
            expect(blank.pairs().some(p => !p.pilot || !p.opponent)).toBe(false);
        });

        it('writes each pair both ways, the kills and damage of one side the deaths and damage taken of the other', () => {
            expect(pairs).toHaveLength(10);
            for (const p of pairs) {
                expect(pair(p.opponent, p.pilot)).toMatchObject({ matches: p.matches, kills: p.deaths, deaths: p.kills, damage_dealt: p.damage_taken, damage_taken: p.damage_dealt });
            }
            expect(pair('insaner', 'maestro')).toEqual({ pilot: 'insaner', opponent: 'maestro', name: 'INSANER', opponent_name: 'MAESTRO', matches: 1, kills: 4, deaths: 0, damage_dealt: 301, damage_taken: 0 });
            expect(pair('jftp', '.')).toMatchObject({ name: 'jftp', matches: 2, kills: 4, deaths: 4, damage_dealt: 420, damage_taken: 361 });
            // teammates never meet
            expect(pair('insaner', 'phoenix')).toBeUndefined();
        });

        it('adds up to weaponKills() and damageFlows() for every pilot', () => {
            const by = (rows, key) => rows.reduce((c, r) => ({ ...c, [pilotKey(r[key])]: (c[pilotKey(r[key])] || 0) + (r.damage ?? 1) }), {});
            const kills = by(games.flatMap(weaponKills), 'attacker');
            const damage = by(games.flatMap(damageFlows), 'attacker');
            const sums = field => pairs.reduce((c, p) => ({ ...c, [p.pilot]: (c[p.pilot] || 0) + p[field] }), {});
            expect(Object.fromEntries(Object.entries(sums('kills')).filter(([, n]) => n > 0))).toEqual(kills);
            expect(sums('damage_dealt')).toEqual(Object.fromEntries(Object.keys(sums('damage_dealt')).map(k => [k, Math.round(damage[k] || 0)])));
        });

        it('keeps each pilot\'s clutch counts by kind, adding up to the kill-scored matches\' kills on opponents', () => {
            const clutch = pass.clutch();
            const line = (pilot, kind) => clutch.find(c => c.pilot === pilot && c.kind === kind);
            expect(line('insaner', 'team')).toEqual({ pilot: 'insaner', kind: 'team', name: 'INSANER', matches: 1, first_bloods: 0, kills: 5, late_kills: 1, trailing_kills: 3 });
            expect(line('stitch', 'team')).toMatchObject({ matches: 1, first_bloods: 1, kills: 3, trailing_kills: 1 });
            expect(line('jftp', 'ffa')).toMatchObject({ name: 'jftp', matches: 2, first_bloods: 2, kills: 4, trailing_kills: 2 });
            expect(clutch.reduce((n, c) => n + c.kills, 0)).toBe(games.flatMap(g => clutchOf(g).kills).length);
            expect(clutch.reduce((n, c) => n + c.matches, 0)).toBe(4 + 2 + 2);
        });
    });
});

describe('the Tale of the Tape (S20)', () => {
    const bout = (game, a, b) => boutsOf(game).pairs.find(p => (p.a === a && p.b === b) || (p.a === b && p.b === a));
    const outcomeFor = (game, a, b) => {
        const p = bout(game, a, b);
        return p.a === a ? p.outcome : OPPOSITE_OUTCOME[p.outcome];
    };

    describe('boutsOf', () => {
        it('pairs every pilot of an FFA match, each a win or loss by in-game score', () => {
            // 72105: JFTP 24, XB1 20, STITCH 22, LORD JOHN WARFIN 2, WD-40 2
            const game = byId(72105);
            expect(boutsOf(game)).toMatchObject({ mode: 'ANARCHY', map: 'ANCIENT' });
            expect(boutsOf(game).pairs).toHaveLength(10);
            expect(outcomeFor(game, 'jftp', 'stitch')).toBe('win');
            expect(outcomeFor(game, 'xb1', 'stitch')).toBe('loss');
            expect(outcomeFor(game, 'lord john warfin', 'wd-40')).toBe('tie');
        });

        it('pairs a team match across the teams only, each pilot taking the team\'s result', () => {
            // 72099: BLUE (PHOENIX, INSANER) 6, ORANGE (STITCH, MAESTRO) 4
            const game = byId(72099);
            const pairs = boutsOf(game).pairs.map(p => [p.a, p.b].sort().join('-')).sort();
            expect(pairs).toEqual(['insaner-maestro', 'insaner-stitch', 'maestro-phoenix', 'phoenix-stitch']);
            expect(outcomeFor(game, 'stitch', 'phoenix')).toBe('loss');
            expect(outcomeFor(game, 'insaner', 'maestro')).toBe('win');
            expect(bout(game, 'insaner', 'phoenix')).toBeUndefined();
        });

        it('calls equal scores a tie, as the rating does', () => {
            expect(boutsOf(byId(72098)).pairs).toEqual([{ a: 'jftp', b: '.', outcome: 'tie' }]);
            const level = { ...byId(72099), teamScore: { BLUE: 5, ORANGE: 5 } };
            expect(boutsOf(level).pairs.every(p => p.outcome === 'tie')).toBe(true);
        });

        it('follows ratingSides: a pilot without a team sits out, a pilot listed twice counts once, no result or a short match gives null', () => {
            const game = { ...byId(72099), players: [...byId(72099).players, { name: 'LONER', kills: 0, deaths: 0 }, { ...byId(72099).players[0], name: 'stitch ' }] };
            expect(boutsOf(game).pairs).toEqual(boutsOf(byId(72099)).pairs);
            expect(boutsOf({ ...byId(72099), teamScore: {} })).toBeNull();
            expect(boutsOf(byId(72087))).not.toBeNull(); // 84 s still counts
            expect(boutsOf({ ...byId(72087), date: new Date(Date.parse(byId(72087).settings.start) + 30000).toISOString() })).toBeNull();
            expect(boutsOf(detailSample)).toBe(ratingSides(detailSample));
        });

        it('gives exactly the rating\'s games: a pair for every two sides\' pilots', () => {
            for (const game of sample) {
                const sides = ratingSides(game);
                const games = sides ? sides.reduce((n, s, i) => n + s.pilots.length * sides.slice(i + 1).reduce((m, t) => m + t.pilots.length, 0), 0) : 0;
                expect(boutsOf(game)?.pairs.length ?? 0).toBe(games);
            }
        });

        it('names no map as an empty string', () => {
            const game = byId(72105);
            game.settings = { ...game.settings, level: '  ' };
            expect(boutsOf(game).map).toBe('');
        });
    });

    it('reads a mode switch value as a TAPE_MODES id, anything else as every mode', () => {
        expect(TAPE_MODES.map(m => m.id)).toEqual(['ANARCHY', 'TEAM ANARCHY', 'CTF', 'MONSTERBALL']);
        expect(tapeMode('CTF')).toBe('CTF');
        expect(tapeMode('team anarchy')).toBe('TEAM ANARCHY');
        expect(tapeMode('RACE')).toBeNull();
        expect(tapeMode(undefined)).toBeNull();
    });

    describe('rivalPass bouts', () => {
        // the sample with 72099 and 72098 carrying their logs
        const games = sample.map(g => (g.id === 72099 ? teamWithDamage : g.id === 72098 ? ffaWithDamage : g));
        const pass = rivalPass();
        games.forEach(g => pass.add({ id: g.id, date: g.date }, g));
        pass.add({ id: 9, date: null }, null);
        const rows = pass.bouts();
        const sum = (pilot, opponent, field, where = () => true) => rows.filter(r => r.pilot === pilot && r.opponent === opponent && where(r)).reduce((n, r) => n + r[field], 0);

        it('writes each row both ways, one side\'s wins the other\'s losses', () => {
            for (const r of rows) {
                const back = rows.find(o => o.pilot === r.opponent && o.opponent === r.pilot && o.mode === r.mode && o.map === r.map);
                expect(back).toMatchObject({ matches: r.matches, wins: r.losses, losses: r.wins, ties: r.ties, logged: r.logged, kills: r.deaths, deaths: r.kills, damage_dealt: r.damage_taken, damage_taken: r.damage_dealt });
                expect(r.wins + r.losses + r.ties).toBe(r.matches);
            }
        });

        it('counts STITCH against PHOENIX by mode and map from the fixtures', () => {
            // FFA 72104 and 72103 STITCH ahead; team 72102, 72099, 72097, 72096 PHOENIX's BLUE ahead
            expect(['matches', 'wins', 'losses', 'ties'].map(f => sum('stitch', 'phoenix', f))).toEqual([6, 2, 4, 0]);
            expect(['matches', 'wins', 'losses'].map(f => sum('stitch', 'phoenix', f, r => r.mode === 'ANARCHY'))).toEqual([2, 2, 0]);
            expect(['matches', 'wins', 'losses'].map(f => sum('stitch', 'phoenix', f, r => r.mode === 'TEAM ANARCHY'))).toEqual([4, 0, 4]);
            expect(rows.find(r => r.pilot === 'stitch' && r.opponent === 'phoenix' && r.map === 'ASCENT')).toMatchObject({ matches: 2, losses: 2, logged: 1, kills: 2, deaths: 1, damage_dealt: 250, damage_taken: 60 });
        });

        it('adds up to the rating\'s games for every pilot', () => {
            const games2 = {};
            for (const game of games) {
                for (const { a, b } of boutsOf(game)?.pairs ?? []) for (const k of [a, b]) games2[k] = (games2[k] || 0) + 1;
            }
            const byPilot = rows.reduce((c, r) => ({ ...c, [r.pilot]: (c[r.pilot] || 0) + r.matches }), {});
            expect(byPilot).toEqual(games2);
        });

        it('adds up, over modes and maps, to each pair\'s pilot_rivals row', () => {
            const pairs = pass.pairs();
            expect(pairs.length).toBeGreaterThan(0);
            for (const p of pairs) {
                expect({
                    matches: sum(p.pilot, p.opponent, 'logged'), kills: sum(p.pilot, p.opponent, 'kills'), deaths: sum(p.pilot, p.opponent, 'deaths'),
                    damage_dealt: Math.round(sum(p.pilot, p.opponent, 'damage_dealt')), damage_taken: Math.round(sum(p.pilot, p.opponent, 'damage_taken'))
                }).toEqual({ matches: p.matches, kills: p.kills, deaths: p.deaths, damage_dealt: p.damage_dealt, damage_taken: p.damage_taken });
            }
            // "." took 180.5 from JFTP: kept unrounded until it is summed
            expect(sum('jftp', '.', 'damage_dealt')).toBe(210);
            expect(sum('.', 'jftp', 'damage_dealt')).toBe(180.5);
        });
    });
});
