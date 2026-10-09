import fs from 'fs';
import os from 'os';
import path from 'path';
import Database from 'better-sqlite3';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { byId, day, onDay, sample, veteranSoup } from './testFixtures.js';
import { HOUR_MS, RATING, dayBounds, dayStart, fightNightDay, heatmapCells, shiftDay } from './lib/gameParse.js';

// Fixture games built from the samples:
// 90001: game 72102 with the score flipped, an ORANGE win (STITCH, MAESTRO).
// 90002: game 72096 with a 10-10 team score, a tie.
// 90003: game 72107 with JFTP spelled "jftp".
// 90004: game 72106 with a kill log in which XB1 kills himself once.
// 90010-90012: game 72099 cut to a 1v1 Monsterball that BLUE wins 2-1 on goals
//   while scoring fewer kills.
// 2: veteranSoup from testFixtures.js (cold storage).
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
    await db.refreshPilotStats();
});

afterAll(async () => {
    await db.close?.();
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

describe('ratings (rating_snapshots)', () => {
    const today = fightNightDay(Date.now());
    const jftpDay = fightNightDay(onDay(byId(72107)).date);

    it('rates every match in the refresh, one row per pilot per day, spellings merged', () => {
        const jftp = db.getPilotRating('jftp');
        expect(jftp).toMatchObject({ matches: 10 });
        expect(jftp.history).toEqual([{ day: jftpDay, rating: jftp.rating, rd: expect.any(Number), matches: 10 }]);
        // the RD now has grown for the days since that one
        expect(jftp.rd).toBeGreaterThan(jftp.history[0].rd);
        expect(db.getPilotRating('JFTP ').history).toEqual(jftp.history);
        // BALLER won three 1v1 Monsterball matches on goals while scoring fewer kills
        expect(db.getPilotRating('BALLER').rating).toBeGreaterThan(1500);
        expect(db.getPilotRating('FRAGGER').rating).toBeLessThan(1500);
    });

    it('answers an empty history for a pilot with no rated match', () => {
        expect(db.getPilotRating('NOBODY')).toMatchObject({ matches: 0, status: null, rank: null, history: [] });
    });

    it('ranks pilots with 10+ rated matches, all NEW in their first week', () => {
        const { day: on, since, total, pilots } = db.getPowerRankings(today);
        expect([on, since]).toEqual([today, shiftDay(today, -RATING.movementDays)]);
        // JFTP 10, WD-40 10, STITCH 11; PHOENIX has 9
        expect(pilots.map(p => p.pilot).sort()).toEqual(['jftp', 'stitch', 'wd-40']);
        expect(total).toBe(3);
        expect(pilots.map(p => p.rank)).toEqual([1, 2, 3]);
        expect(pilots.map(p => p.change)).toEqual([null, null, null]);
        expect(pilots.map(p => p.rating)).toEqual(pilots.map(p => p.rating).sort((a, b) => b - a));
        expect(db.getPilotRating('STITCH')).toMatchObject({ status: 'ranked', rank: pilots.find(p => p.pilot === 'stitch').rank });
    });

    it('shows the RD grown for the days since, and no rank for a pilot who cannot be ranked', () => {
        const phoenix = db.getPilotRating('PHOENIX'); // 9 rated matches
        expect(phoenix).toMatchObject({ status: 'provisional', rank: null });
        expect(db.getPilotRating('JFTP', shiftDay(today, RATING.activeDays + 5))).toMatchObject({ status: 'inactive', rank: null });
        expect(db.getPilotRating('PHOENIX', shiftDay(today, 100)).rd).toBeGreaterThan(phoenix.rd);
    });

    it('writes only the days that differ on the next refresh', async () => {
        const hot = connections.find(c => c.prepare("SELECT 1 FROM sqlite_master WHERE name = 'rating_snapshots'").get());
        const table = () => hot.prepare('SELECT * FROM rating_snapshots ORDER BY pilot, day').all();
        const before = table();
        hot.prepare("INSERT INTO rating_snapshots (pilot, day, name, rating, rd, volatility, matches) VALUES ('ghost', '2001-01-01', 'GHOST', 1500, 350, 0.06, 1)").run();
        hot.prepare("UPDATE rating_snapshots SET rating = 1 WHERE pilot = 'jftp'").run();
        const log = vi.spyOn(console, 'log');
        await db.refreshPilotStats();
        expect(log.mock.calls.flat().filter(m => String(m).startsWith('[Ratings]'))).toEqual([`[Ratings] ${before.length} daily rating snapshots: 1 written, 1 removed.`]);
        log.mockRestore();
        expect(table()).toEqual(before);

        // 4,500 stray days take three chunks of the write, with reads let in between
        const ghost = hot.prepare("INSERT INTO rating_snapshots (pilot, day, name, rating, rd, volatility, matches) VALUES ('ghost', ?, 'GHOST', 1500, 350, 0.06, 1)");
        hot.transaction(() => { for (let i = 0; i < 4500; i++) ghost.run(shiftDay('2001-01-01', i)); })();
        const ghosts = hot.prepare("SELECT COUNT(*) AS n FROM rating_snapshots WHERE pilot = 'ghost'");
        const seen = new Set();
        let refreshing = true;
        const poll = () => { seen.add(ghosts.get().n); if (refreshing) setImmediate(poll); };
        poll();
        await db.refreshPilotStats();
        refreshing = false;
        expect([...seen]).toEqual(expect.arrayContaining([4500, 2500, 500]));
        expect(table()).toEqual(before);
    });

    it('keeps the ranks a week on, then drops pilots idle for more than 28 days', () => {
        expect(db.getPowerRankings(shiftDay(today, 7)).pilots.map(p => p.change)).toEqual([0, 0, 0]);
        expect(db.getPowerRankings(shiftDay(jftpDay, RATING.activeDays + 1)).total).toBe(0);
    });
});

describe('career (pilot_months, /api/pilot/:name/career) and the heatmap', () => {
    const today = fightNightDay(Date.now());
    const hot = () => connections.find(c => c.prepare("SELECT 1 FROM sqlite_master WHERE name = 'pilot_months'").get());

    it('adds up each pilot\'s months to the career totals, spellings merged', () => {
        for (const name of ['JFTP', 'WD-40', 'MAESTRO', 'BALLER']) {
            const { months } = db.getPilotCareer(name);
            const sum = field => months.reduce((a, m) => a + m[field], 0);
            const career = cached(name);
            expect([sum('matches'), sum('kills'), sum('deaths'), sum('assists'), sum('wins'), sum('losses'), sum('ties')])
                .toEqual([career.games, career.kills, career.deaths, career.assists, career.wins, career.losses, career.ties]);
            expect(months.at(-1).month).toBe(today.slice(0, 7));
        }
        expect(db.getPilotCareer('jftp ').months).toEqual(db.getPilotCareer('JFTP').months);
    });

    it('counts a pilot\'s matches per fight-night day for the calendar', () => {
        const { calendar } = db.getPilotCareer('WD-40');
        expect(calendar.until).toBe(today);
        // the fixtures' Sunday evening (9 matches) is the day before the afternoon's one
        expect(calendar.days).toEqual([{ day: shiftDay(day, -1), matches: 9 }, { day, matches: 1 }]);
        const jftp = db.getPilotCareer('JFTP').calendar.days;
        expect(jftp.reduce((a, d) => a + d.matches, 0)).toBe(db.countGamesByPilot.get({ name: 'JFTP', startDate: null }).count);
    });

    it('sums the last fight-night day, with the rating change and the recap', async () => {
        const wd40 = db.getPilotCareer('WD-40').lastOut;
        expect(wd40).toMatchObject({ day, wins: 0, losses: 1, kills: 2, deaths: 6, assists: 2, combatRatio: 0.5, recap: false }); // 72105: 2 kills, 2 assists, 6 deaths
        expect(wd40.matches.map(m => m.id)).toEqual([72105]);
        // its only snapshot that day minus the evening before's
        const history = db.getPilotRating('WD-40').history;
        expect(wd40.ratingChange).toBe(Math.round((history.at(-1).rating - history.at(-2).rating) * 10) / 10);
        await generateRecapForDate(day, true);
        expect(db.getPilotCareer('WD-40').lastOut.recap).toBe(true);
        // B2AF's only night is the Sunday evening, and his first rated day
        const b2af = db.getPilotCareer('B2AF').lastOut;
        expect(b2af).toMatchObject({ day: shiftDay(day, -1), wins: 0, losses: 2, recap: false });
        expect(b2af.ratingChange).toBe(Math.round((db.getPilotRating('B2AF').rating - RATING.start) * 10) / 10);
    });

    it('gives no rating change for a night without a rated match', async () => {
        // LONER beats PARTNER two days before `day`, then plays alone the evening before it
        const duel = { ...onDay(byId(72090)), id: 90040, players: [{ name: 'LONER', kills: 5, deaths: 1, assists: 0 }, { name: 'PARTNER', kills: 1, deaths: 5, assists: 0 }] };
        duel.date = new Date(Date.parse(duel.date) - 86400000).toISOString();
        duel.settings = { ...duel.settings, start: new Date(Date.parse(duel.settings.start) - 86400000).toISOString() };
        const alone = { ...onDay(byId(72090)), id: 90041, players: [{ name: 'LONER', kills: 0, deaths: 0, assists: 0 }] };
        db.saveGames([duel, alone]);
        await db.refreshPilotStats();
        expect(db.getPilotRating('LONER').history.map(h => h.day)).toEqual([shiftDay(day, -2)]);
        expect(db.getPilotCareer('LONER').lastOut).toMatchObject({ day: shiftDay(day, -1), ratingChange: null, wins: 0, losses: 0 });
    });

    it('starts the year of daily counts at a fight-night day, not at UTC midnight', () => {
        // a year after `day`: the window starts at 06:00 Chicago time on `day`, so the
        // fixtures' evening before it (dated `day` in UTC, 03:24 to 08:49) is out
        vi.useFakeTimers({ toFake: ['Date'] });
        try {
            vi.setSystemTime(Date.parse(dayBounds(shiftDay(day, 365))[0]) + 2 * 3600000);
            const days = db.getGameCountsByDate.all().map(d => d.day);
            expect(days[0]).toBe(day);
            expect(days).not.toContain(shiftDay(day, -1));
        } finally {
            vi.useRealTimers();
        }
    });

    it('answers an unknown pilot with nothing in each part', () => {
        expect(db.getPilotCareer('NOBODY')).toMatchObject({ months: [], calendar: { days: [] }, lastOut: null });
    });

    it('brings pilot_months back in line on the next refresh', async () => {
        const table = () => hot().prepare('SELECT * FROM pilot_months ORDER BY pilot, month').all();
        const before = table();
        hot().prepare("INSERT INTO pilot_months VALUES ('ghost', '2001-01', 1, 1, 0, 0, 1, 0, 0, 60)").run();
        hot().prepare("UPDATE pilot_months SET kills = 999 WHERE pilot = 'jftp'").run();
        const log = vi.spyOn(console, 'log');
        await db.refreshPilotStats();
        expect(log.mock.calls.flat().filter(m => String(m).startsWith('[Career]'))).toEqual([`[Career] ${before.length} pilot months: 1 written, 1 removed.`]);
        log.mockRestore();
        expect(table()).toEqual(before);
    });

    it('counts the last 12 weeks of matches by weekday and hour, today left out', () => {
        const tomorrow = shiftDay(today, 1);
        const heat = db.getActivityHeatmap(Date.parse(dayBounds(tomorrow)[0]) + 3600000);
        expect(heat).toMatchObject({ since: shiftDay(tomorrow, -84), until: tomorrow });
        const dates = [];
        for (let d = heat.since; d < heat.until; d = shiftDay(d, 1)) dates.push(...db.getGamesForDate(d).map(g => g.date));
        expect(dates.length).toBeGreaterThan(25);
        expect(heat.total).toBe(dates.length);
        expect(heat.cells).toEqual(heatmapCells(dates));
        // 84 days after `day` the window starts on `day`: the evening before it is out
        const later = db.getActivityHeatmap(Date.parse(dayBounds(shiftDay(day, 84))[0]));
        expect(later.since).toBe(day);
        let fromDay = 0;
        for (let d = day; d < later.until; d = shiftDay(d, 1)) fromDay += db.getGamesForDate(d).length;
        expect(later.total).toBe(fromDay);
        expect(later.total).toBeLessThan(heat.total);
        // during `day` the window ends before it: the matches already played that day are out
        const during = db.getActivityHeatmap(Date.parse(dayBounds(day)[1]) - 3600000);
        expect(during.until).toBe(day);
        expect(db.getGamesForDate(day).length).toBeGreaterThan(0);
        let beforeDay = 0;
        for (let d = during.since; d < day; d = shiftDay(d, 1)) beforeDay += db.getGamesForDate(d).length;
        expect(during.total).toBe(beforeDay);
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

    it('computes windowed wins, losses, ties, win_rate, kd, and kda when startDate is provided', () => {
        const maestro = db.getPilotStats.all(day).find(r => r.name.toLowerCase() === 'maestro');
        expect(maestro).toMatchObject({
            games: 7,
            wins: 1,
            losses: 5,
            ties: 1,
            win_rate: 14.3
        });
        expect(maestro.kd).toBeDefined();
        expect(maestro.kda).toBeDefined();
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

describe('pilot match history (getGamesByPilot, countGamesByPilot)', () => {
    it('finds every spelling of a pilot and ignores surrounding space', () => {
        expect(db.countGamesByPilot.get({ name: ' JFTP ', startDate: null }).count).toBe(10);
        const games = db.getGamesByPilot.all({ name: 'jftp', startDate: null, limit: 25, offset: 0 });
        expect(games).toHaveLength(10);
        expect(games.map(g => JSON.parse(g.details).id)).toContain(90003);
    });

    it('reads cold storage, pages newest first and applies the start date', () => {
        expect(db.countGamesByPilot.get({ name: 'soup', startDate: null }).count).toBe(2);
        const [newest, oldest] = db.getGamesByPilot.all({ name: 'soup', startDate: null, limit: 25, offset: 0 }).map(g => JSON.parse(g.details).id);
        expect([newest, oldest]).toEqual([72108, 2]);
        expect(db.getGamesByPilot.all({ name: 'soup', startDate: null, limit: 1, offset: 1 }).map(g => JSON.parse(g.details).id)).toEqual([2]);
        expect(db.countGamesByPilot.get({ name: 'soup', startDate: day }).count).toBe(1);
    });

    it('treats LIKE wildcards in a name literally', () => {
        expect(db.countGamesByPilot.get({ name: 'J_TP', startDate: null }).count).toBe(0);
    });
});

describe('game_players after a summary upsert', () => {
    it('keeps the suicide from the stored kill log', () => {
        // The gamelist summary of 90004 carries no kill log; saveGames keeps the
        // stored details, and game_players is rebuilt from those.
        db.saveGames([onDay({ ...byId(72106), id: 90004 })]);
        expect(db.getPilotStats.all().find(r => r.name === 'XB1').suicides).toBe(1);
    });
});

describe('cold storage stats', () => {
    it('picks the longest match by real duration, not timeLimit', async () => {
        // 72086 ran 07:13:42 to 07:30:54 (1032 s) under a 1020 s limit; 72084 has
        // a 1200 s limit but ran 702 s.
        expect((await db.getColdStorageStats()).records.longest_match.id).toBe(72086);
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
        // the fight-night day: the fixtures' Sunday evening (B2AF, WD-40, ...) is the day before
        const onFightNight = hotGames.filter(g => fightNightDay(g.date) === day);
        const keys = new Set(onFightNight.flatMap(g => g.players.map(p => p.name.trim().toLowerCase())));
        expect(keys.has('b2af')).toBe(false);
        expect(recap.totalPilots).toBe(keys.size);
        expect(recap.newBlood.pilots).toContain('ZERGLING');
        expect(recap.newBlood.pilots).not.toContain('SOUP');
    });

    it('reports the 10-10 game as a draw', async () => {
        const recap = await generateRecapForDate(day, true);
        expect(recap.closestFinish).toMatchObject({ gameId: 90002, margin: 0, score: '10 - 10' });
        expect(recap.closestFinish.copy).toMatch(/exact draw/);
    });

    it('rebuilds the last year\'s recaps on fight-night days once', async () => {
        const { rebuildRecapsForDayRule, FIGHT_NIGHT_THRESHOLDS } = await import('./services/fightNightService.js');
        const old = shiftDay(fightNightDay(Date.now()), -400);
        // a recap saved under the UTC day, and one too old to rebuild
        db.saveFightNightRecap(shiftDay(day, 1), { totalMatches: 99 });
        db.saveFightNightRecap(old, { totalMatches: 1 });
        await rebuildRecapsForDayRule();
        const dates = db.getFightNightRecaps(50).map(r => r.date);
        expect(dates).not.toContain(shiftDay(day, 1));
        expect(dates).toContain(old);
        expect(dates.filter(d => d !== old)).toEqual(db.getQualifyingFightNightDates(FIGHT_NIGHT_THRESHOLDS));
        expect(db.getAdminSetting.get('fight_night_day_rule').value).toBe('America/Chicago from 6:00');
        // done once: a second run leaves a recap alone
        db.saveFightNightRecap(shiftDay(day, 1), { totalMatches: 99 });
        await rebuildRecapsForDayRule();
        expect(db.getFightNightRecapByDate(shiftDay(day, 1)).totalMatches).toBe(99);
    });

    describe('rebuild edges, every fixture day qualifying', () => {
        let service;
        let thresholds;
        beforeAll(async () => {
            service = await import('./services/fightNightService.js');
            thresholds = { ...service.FIGHT_NIGHT_THRESHOLDS };
            Object.assign(service.FIGHT_NIGHT_THRESHOLDS, { minMatches: 1, minPilots: 1 });
        });
        afterAll(() => {
            Object.assign(service.FIGHT_NIGHT_THRESHOLDS, thresholds);
        });
        const rebuildAt = async now => {
            db.setAdminSetting.run('fight_night_day_rule', 'UTC');
            vi.useFakeTimers({ toFake: ['Date'] });
            try {
                vi.setSystemTime(now);
                await service.rebuildRecapsForDayRule();
            } finally {
                vi.useRealTimers();
            }
        };

        it('leaves the night still running to the detector', async () => {
            // an hour before `day` ends: its matches are in, its night is not over
            await rebuildAt(Date.parse(dayBounds(day)[1]) - 3600000);
            expect(db.getFightNightRecapByDate(shiftDay(day, -1))).not.toBeNull();
            expect(db.getFightNightRecapByDate(day)).toBeNull();
        });

        it('keeps the old recaps when a save fails part-way', async () => {
            db.saveFightNightRecap(shiftDay(day, 1), { totalMatches: 99 });
            db.setAdminSetting.run('fight_night_day_rule', 'UTC');
            const save = vi.spyOn(db, 'saveFightNightRecap').mockImplementation(() => { throw new Error('disk full'); });
            try {
                await expect(service.rebuildRecapsForDayRule()).rejects.toThrow('disk full');
            } finally {
                save.mockRestore();
            }
            expect(db.getFightNightRecapByDate(shiftDay(day, 1)).totalMatches).toBe(99);
            expect(db.getAdminSetting.get('fight_night_day_rule').value).toBe('UTC');
        });

        it('starts at the first fight-night day wholly in hot storage', async () => {
            // a year after 08:00 Chicago time on `day`: hot storage starts inside `day`
            const now = new Date(Date.parse(dayBounds(day)[0]) + 2 * 3600000);
            now.setFullYear(now.getFullYear() + 1);
            db.saveFightNightRecap(day, { totalMatches: 99 });
            await rebuildAt(now.getTime());
            expect(db.getFightNightRecapByDate(day).totalMatches).toBe(99);
        });

        it('runs one rebuild at a time', async () => {
            db.setAdminSetting.run('fight_night_day_rule', 'UTC');
            const running = service.rebuildRecapsForDayRule();
            expect(service.rebuildRecapsForDayRule()).toBe(running);
            await running;
        });
    });
});

// Last: it rewrites the hot database the tests above read.
describe('backup and restore (backupHot, restoreHot)', () => {
    it('copies the live database and writes the copy back into it', async () => {
        const copy = path.join(dataDir, 'copy.db');
        await db.backupHot(copy);
        // as a backup from before S13, S14 and S15
        const old = new Database(copy);
        old.exec('DROP TABLE rating_snapshots; DROP TABLE pilot_months; DROP TABLE region_months; DROP TABLE servers; DROP TABLE server_snapshots; DROP TABLE server_hours');
        old.close();
        const today = fightNightDay(Date.now());
        expect(db.hasRatingSnapshots()).toBe(true);
        expect(db.getPowerRankings(today).total).toBeGreaterThan(0);
        const before = db.countGames(null, null).count;
        db.saveGames([{ ...onDay(byId(72099)), id: 99999 }]);
        expect(db.countGames(null, null).count).toBe(before + 1);
        // a tick inside the window and a summary read, so the restore has a kept summary to drop
        db.saveServerSnapshot(Date.parse(dayStart(day)) + 14 * HOUR_MS, [{ server: { ip: '143.110.230.67', online: true } }]);
        expect(db.getServerHistory('143.110.230.67', 30).samples).toBe(1);

        await db.restoreHot(copy);
        expect(db.countGames(null, null).count).toBe(before);
        expect(db.getGameById.get(99999)).toBeFalsy();
        expect(db.getGameById.get(72099)).toBeTruthy();
        expect(db.countGamesByPilot.get({ name: 'JFTP', startDate: null }).count).toBe(10);
        // the table is back, empty until the next refresh, and the rankings held in memory are gone
        expect(db.hasRatingSnapshots()).toBe(false);
        expect(db.hasPilotMonths()).toBe(false);
        expect(db.hasRegionMonths()).toBe(false);
        expect(db.getRegionShare().months).toEqual([]);
        expect(db.getServerHistory('143.110.230.67', 30)).toMatchObject({ firstSeen: null, samples: 0 });
        expect(db.getPilotCareer('JFTP').months).toEqual([]);
        expect(db.getPilotRating('JFTP').history).toEqual([]);
        expect(db.getPowerRankings(today).total).toBe(0);
    });
});

describe('ratings after a refresh', () => {
    it('ranks a pilot whose new match is their tenth once the refresh lands', async () => {
        const today = fightNightDay(Date.now());
        const ranked = () => db.getPowerRankings(today).pilots.map(p => p.pilot);
        expect(ranked()).not.toContain('phoenix'); // 9 rated matches, and the rankings are now memoised
        db.saveGames([{ ...onDay(byId(72096)), id: 90020 }]);
        await db.refreshPilotStats();
        expect(ranked()).toContain('phoenix');
        expect(db.getPilotRating('PHOENIX').matches).toBe(10);
    });

    it('rates a match from cold storage with the hot ones', async () => {
        // BALLER's fourth win, from 2020, so saveGames files it in cold.db
        const date = '2020-06-01T20:00:00.000Z';
        db.saveGames([{ ...monsterball[0], id: 90030, date, settings: { ...monsterball[0].settings, start: date } }]);
        await db.refreshPilotStats();
        const baller = db.getPilotRating('BALLER');
        expect(baller.matches).toBe(4);
        expect(baller.history[0]).toMatchObject({ day: '2020-06-01', matches: 1 });
    });
});
