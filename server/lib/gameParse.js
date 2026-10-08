// Rules for reading a tracker game (the GameData shape in types.ts).
// Every stat in server/db.js and server/services/fightNightService.js goes
// through these; do not re-implement them inline.

const MAX_DURATION_SEC = 86400;

// Counter field for each outcomeOf()/pairOutcome() result.
export const OUTCOME_FIELD = { win: 'wins', loss: 'losses', tie: 'ties' };

// Case-insensitive identity for a pilot name. Use it for map keys and
// comparisons, never for display.
export function pilotKey(name) {
    return String(name ?? '').trim().toLowerCase();
}

// Team of a player in upper case ('BLUE', 'ORANGE', ...), or null in FFA.
export function teamOf(player) {
    const team = String(player?.team ?? '').trim().toUpperCase();
    return team || null;
}

// A player's frag count for one game, floored at zero. The tracker's `kills`
// already subtracts suicides, so a game can come in negative; that game counts
// as zero rather than taking frags away from other games.
export function netKills(player) {
    return Math.max(0, Number(player?.kills) || 0);
}

const round2 = n => Math.round(n * 100) / 100;

// "Combat Ratio": (kills + 0.5 × assists) ÷ deaths, the kills alone with no
// deaths, to two decimals. Kills are netKills() totals.
export function combatRatio(kills, assists, deaths) {
    return deaths > 0 ? round2((kills + assists * 0.5) / deaths) : kills;
}

// "Lethality": kills per minute of match time (durationOf() summed over the
// pilot's matches, not the pilot's own time in them), to two decimals.
export function lethality(kills, seconds) {
    return seconds > 0 ? round2(kills / (seconds / 60)) : 0;
}

// Win rate: wins over matches played, ties and no-result matches counting as
// non-wins, as a percentage to one decimal.
export function winRate(wins, matches) {
    return matches > 0 ? Math.round((wins / matches) * 1000) / 10 : 0;
}

export const WIN_RATE_HINT = 'Wins ÷ matches played. Ties count as non-wins.';

// The pages' tooltips for the two, so the words match the formulas above.
export const COMBAT_RATIO_HINT = 'Combat Ratio: (Kills + 0.5 × Assists) ÷ Deaths, or Kills with no deaths. Assists count half.';
export const LETHALITY_HINT = 'Lethality: Kills per minute of match time, counting the whole length of each match, not only the time the pilot was in it.';

function secondsBetween(from, to) {
    if (!from || !to) return 0;
    const diff = (new Date(to).getTime() - new Date(from).getTime()) / 1000;
    return diff > 0 && diff < MAX_DURATION_SEC ? diff : 0;
}

function plausibleSeconds(value) {
    const n = Number(value);
    return n > 0 && n < MAX_DURATION_SEC ? n : 0;
}

// How long the match actually ran, in seconds, or 0 when the game does not
// record it. Archive games carry start/end. Live-era games carry only
// settings.start (the StartGame event) and date (when the tracker closed it).
export function measuredDurationOf(game) {
    if (!game) return 0;
    const fromTimestamps = secondsBetween(game.start || game.settings?.start, game.end || game.date);
    if (fromTimestamps) return fromTimestamps;
    for (const field of [game.timeElapsed, game.elapsed, game.duration]) {
        const n = plausibleSeconds(field);
        if (n) return n;
    }
    return 0;
}

// Match length in seconds for stats, 0 when nothing in the game says how long
// it ran. settings.timeLimit is the cap, not the length, so it is used only
// when measuredDurationOf() finds nothing.
export function durationOf(game) {
    return measuredDurationOf(game) || plausibleSeconds(game?.settings?.timeLimit);
}

// The ranked filter: the career stats, the telemetry, the 90-day results and
// the rating count a match with RANKED.pilots+ players that ran RANKED.seconds
// or more by durationOf(). Pass the duration when the caller has it already.
export const RANKED = { pilots: 2, seconds: 60 };
export function rankedMatch(game, duration = durationOf(game)) {
    return Array.isArray(game?.players) && game.players.length >= RANKED.pilots && duration >= RANKED.seconds;
}

// Who won. Team games rank teams by teamScore (any number of teams; teams
// with players but no score entry count as 0). FFA ranks pilots by their
// in-game score (`kills`). `ranking` lists { side, name, score } best first;
// `side` is the team or the pilotKey(), `name` is what to display.
// `winners` holds every side sharing the top score: one entry is an outright
// win, more than one is a tie, none means the game has no result to read.
/** @returns {{ team: boolean, ranking: { side: string, name: string, score: number }[], winners: string[] }} */
export function winnerOf(game) {
    const players = Array.isArray(game?.players) ? game.players : [];
    const teamScore = game?.teamScore && typeof game.teamScore === 'object' ? game.teamScore : {};
    const team = Object.keys(teamScore).length > 0 || players.some(p => teamOf(p));

    const scores = new Map();
    if (team) {
        for (const [name, score] of Object.entries(teamScore)) {
            const side = teamOf({ team: name });
            if (side) scores.set(side, { side, name: side, score: Number(score) || 0 });
        }
        if (scores.size > 0) {
            for (const p of players) {
                const side = teamOf(p);
                if (side && !scores.has(side)) scores.set(side, { side, name: side, score: 0 });
            }
        }
    } else {
        for (const p of players) {
            const side = pilotKey(p?.name);
            if (side && !scores.has(side)) scores.set(side, { side, name: String(p.name).trim(), score: Number(p.kills) || 0 });
        }
    }

    const ranking = [...scores.values()].sort((a, b) => b.score - a.score);
    const top = ranking[0]?.score;
    const winners = ranking.length > 1 ? ranking.filter(r => r.score === top).map(r => r.side) : [];
    return { team, ranking, winners };
}

// 'win', 'loss' or 'tie' for one player, or null when the game has no result.
// Pass the winnerOf() result when looping over many players of one game.
export function outcomeOf(game, player, result = winnerOf(game)) {
    if (result.winners.length === 0) return null;
    const side = result.team ? teamOf(player) : pilotKey(player?.name);
    if (!result.winners.includes(side)) return 'loss';
    return result.winners.length > 1 ? 'tie' : 'win';
}

// 'win', 'loss' or 'tie' for player a against player b in one game, by their
// sides' scores; null when they share a side or the game has no result.
export function pairOutcome(game, a, b, result = winnerOf(game)) {
    if (result.winners.length === 0) return null;
    const sideOf = p => (result.team ? teamOf(p) : pilotKey(p?.name));
    const scoreA = result.ranking.find(r => r.side === sideOf(a));
    const scoreB = result.ranking.find(r => r.side === sideOf(b));
    if (!scoreA || !scoreB || scoreA === scoreB) return null;
    if (scoreA.score === scoreB.score) return 'tie';
    return scoreA.score > scoreB.score ? 'win' : 'loss';
}

// One row per named player for the game_players table in server/db.js. `kills`
// is the raw in-game score (pass it through netKills for totals). Suicides come
// from the kill log and `damage` is damage dealt to other pilots from the damage
// log, so both are 0 for a game stored without its logs. A pilot listed twice
// in one game gets those log counts once, on the first row.
export function playerRows(game) {
    const suicides = new Map();
    for (const k of Array.isArray(game?.kills) ? game.kills : []) {
        const key = pilotKey(k?.defender);
        if (key && pilotKey(k.attacker) === key) suicides.set(key, (suicides.get(key) || 0) + 1);
    }
    const dealt = new Map();
    for (const d of Array.isArray(game?.damage) ? game.damage : []) {
        const key = pilotKey(d?.attacker);
        if (key && pilotKey(d.defender) !== key) dealt.set(key, (dealt.get(key) || 0) + (Number(d.damage) || 0));
    }

    const take = (counts, key) => {
        const n = counts.get(key) || 0;
        counts.delete(key);
        return n;
    };

    const mode = game?.settings?.matchMode ?? null;
    const map = game?.settings?.level ?? null;
    const rows = [];
    for (const p of Array.isArray(game?.players) ? game.players : []) {
        const name = String(p?.name ?? '').trim();
        if (!name) continue;
        const key = pilotKey(name);
        rows.push({
            name,
            team: teamOf(p),
            kills: Number(p.kills) || 0,
            deaths: Number(p.deaths) || 0,
            assists: Number(p.assists) || 0,
            suicides: take(suicides, key),
            damage: take(dealt, key),
            mode,
            map
        });
    }
    return rows;
}

// The kill log (S12). Replaying it with killPoints() reproduces the tracker's
// own `kills`, `deaths`, `assists` and `teamScore`, checked on four Anarchy
// and Team Anarchy matches with logs (none of them had a team kill).

const KILL_SCORED_MODES = new Set(['ANARCHY', 'TEAM ANARCHY']);

export function hasKillLog(game) {
    return Array.isArray(game?.kills) && game.kills.length > 0;
}

// True when the match's score is its kills, so the kill log replays the
// score. CTF and Monsterball score captures and goals, and Race laps.
export function killScored(game) {
    const mode = String(game?.settings?.matchMode ?? '').trim().toUpperCase();
    return !mode || KILL_SCORED_MODES.has(mode);
}

// What one kill-log entry does to the score. `scorer` (the attacker's name)
// gains `points`: +1 for a kill, -1 for a suicide or, in a team game, a team
// kill. `side` is the attacker's team in a team game (read from
// `attackerTeam`), its pilotKey() in FFA, as in winnerOf(). A death with no
// attacker scores nothing for anyone.
export function killPoints(kill, team = false) {
    const scorer = String(kill?.attacker ?? '').trim();
    if (!scorer) return { scorer: null, side: null, points: 0, suicide: false };
    const suicide = pilotKey(scorer) === pilotKey(kill.defender);
    const side = team ? teamOf({ team: kill.attackerTeam }) : pilotKey(scorer);
    const teamKill = team && !suicide && side !== null && side === teamOf({ team: kill.defenderTeam });
    return { scorer, side, points: suicide || teamKill ? -1 : 1, suicide };
}

// Walks the kill log in time order (log order for equal times) through whole
// second `until` (a kill at 52.5 counts at second 52), keeping a scoreboard
// row per pilot and a score per side, and calls visit(t, kill, points, sides)
// after each entry, `sides` being the live map. Entries missing a team in a
// team game take the pilot's team from game.players.
function replayLog(game, until, visit) {
    const { team, ranking } = winnerOf(game);
    const rows = new Map();
    const sides = new Map(ranking.map(r => [r.side, { side: r.side, name: r.name, score: 0 }]));
    const rowFor = (name, teamName) => {
        const key = pilotKey(name);
        if (!key) return null;
        if (!rows.has(key)) rows.set(key, { name: String(name).trim(), team: teamOf({ team: teamName }), kills: 0, deaths: 0, assists: 0 });
        return rows.get(key);
    };
    for (const p of Array.isArray(game?.players) ? game.players : []) rowFor(p?.name, p?.team);
    const teamOfPilot = name => rows.get(pilotKey(name))?.team ?? null;

    const log = (Array.isArray(game?.kills) ? game.kills : [])
        .map(kill => ({ kill, t: Number(kill?.time) || 0 }))
        .sort((a, b) => a.t - b.t);
    for (const { kill, t } of log) {
        if (Math.floor(t) > until) break;
        const entry = team
            ? { ...kill, attackerTeam: kill.attackerTeam || teamOfPilot(kill.attacker), defenderTeam: kill.defenderTeam || teamOfPilot(kill.defender) }
            : kill;
        const points = killPoints(entry, team);
        const scorer = points.scorer && rowFor(points.scorer, entry.attackerTeam);
        if (scorer) scorer.kills += points.points;
        if (points.side) {
            if (!sides.has(points.side)) sides.set(points.side, { side: points.side, name: team ? points.side : scorer.name, score: 0 });
            sides.get(points.side).score += points.points;
        }
        const victim = rowFor(kill.defender, entry.defenderTeam);
        if (victim) victim.deaths += 1;
        const assister = kill.assisted && rowFor(kill.assisted, kill.assistedTeam);
        if (assister) assister.assists += 1;
        visit?.(t, kill, points, sides);
    }
    return { team, players: [...rows.values()], sides: [...sides.values()] };
}

// The scoreboard after every kill up to and including whole second `t` (all
// of them by default): `players` has one row per pilot, in game.players order,
// with { name, team, kills, deaths, assists }; `sides` has each side's
// { side, name, score }, sides as in winnerOf().
export function scoreboardAt(game, t = Infinity) {
    return replayLog(game, t);
}

// The side holding the outright lead, or null when the top is shared.
function soleLeader(sides) {
    let best = null;
    let shared = false;
    for (const s of sides.values()) {
        if (!best || s.score > best.score) {
            best = s;
            shared = false;
        } else if (s.score === best.score) {
            shared = true;
        }
    }
    return shared ? null : best;
}

// Every time the outright lead passes from one side to another, as
// [{ t, from, to, score }] with display names and the new leader's score. A
// level score leaves the lead where it was, so A, level, A again is no
// change, and A, level, B is one, at B's go-ahead kill. Taking the first lead
// is not a change. Null when the match has no kill log or is not
// killScored(), so "none apply" differs from "there were none".
export function leadChanges(game) {
    if (!hasKillLog(game) || !killScored(game)) return null;
    const changes = [];
    let leader = null;
    replayLog(game, Infinity, (t, kill, points, sides) => {
        const now = soleLeader(sides);
        if (!now) return;
        if (leader && now.side !== leader.side) changes.push({ t, from: leader.name, to: now.name, score: now.score });
        leader = { side: now.side, name: now.name };
    });
    return changes;
}

// The eventual winner's margin over the best other side, from 0:00 and after
// every kill: { side, name, runnerUp, team, points: [{ t, margin, kill, scores }] },
// where `runnerUp` is winnerOf()'s second-ranked side (or null), and
// `scores` lists every side's { name, score } at that moment, best first. The
// winner is winnerOf()'s first-ranked side, so in a draw it is the side ranked
// first. Null for a match that is not killScored(), has no kill log or has
// fewer than two sides.
export function momentumOf(game) {
    if (!hasKillLog(game) || !killScored(game)) return null;
    const { team, ranking } = winnerOf(game);
    const winner = ranking[0];
    if (!winner) return null;
    const snapshot = sides => [...sides.values()].map(s => ({ name: s.name, score: s.score })).sort((a, b) => b.score - a.score);
    const marginOf = sides => {
        let rest = -Infinity;
        for (const s of sides.values()) if (s.side !== winner.side) rest = Math.max(rest, s.score);
        // a side joins `sides` at its first score, so before any other has, the best of them is on 0
        return (sides.get(winner.side)?.score ?? 0) - (rest === -Infinity ? 0 : rest);
    };
    const points = [];
    const { sides } = replayLog(game, Infinity, (t, kill, _, live) => {
        points.push({ t, margin: marginOf(live), kill, scores: snapshot(live) });
    });
    if (sides.length < 2) return null;
    const start = sides.map(s => ({ name: s.name, score: 0 }));
    return { side: winner.side, name: winner.name, runnerUp: ranking[1] ?? null, team, points: [{ t: 0, margin: 0, kill: null, scores: start }, ...points] };
}

// The first kill on an opponent (not a suicide, not a team kill), or null.
export function firstBloodOf(game) {
    let first = null;
    replayLog(game, Infinity, (t, kill, points) => {
        if (!first && points.points > 0) first = kill;
    });
    return first;
}

// Weapon families for the charts: one colour each (designTokens.js `chart.weapon`),
// in this order. A weapon not listed is 'other', the last entry.
export const WEAPON_FAMILIES = [
    { id: 'laser', label: 'Impulse, Cyclone, Reflex', weapons: ['IMPULSE', 'CYCLONE', 'REFLEX'] },
    { id: 'thunderbolt', label: 'Thunderbolt', weapons: ['THUNDERBOLT'] },
    { id: 'flak', label: 'Flak, Crusher', weapons: ['FLAK', 'CRUSHER'] },
    { id: 'driller', label: 'Driller, Lancer', weapons: ['DRILLER', 'LANCER'] },
    { id: 'missile', label: 'Falcon, Missile Pod, Hunter', weapons: ['FALCON', 'MISSILE POD', 'HUNTER'] },
    { id: 'mine', label: 'Creeper, Time Bomb', weapons: ['CREEPER', 'TIME BOMB'] },
    { id: 'heavy', label: 'Nova, Devastator, Vortex', weapons: ['NOVA', 'DEVASTATOR', 'VORTEX'] },
    { id: 'other', label: 'Other', weapons: [] },
];

const FAMILY_OF_WEAPON = new Map(WEAPON_FAMILIES.flatMap(f => f.weapons.map(w => [w, f.id])));

export function weaponFamily(weapon) {
    return FAMILY_OF_WEAPON.get(String(weapon ?? '').trim().toUpperCase()) ?? 'other';
}

// How long a replay of the kill log runs: the match length, or the last kill's
// time when that is later or the length is unknown.
export function replayLengthOf(game) {
    let last = 0;
    for (const kill of Array.isArray(game?.kills) ? game.kills : []) last = Math.max(last, Number(kill?.time) || 0);
    return Math.max(durationOf(game), last);
}

// The fight card's verdict from a winnerOf() result, or null when the match
// has no result: 'draw' for a shared top score; 'split' when the winner's
// margin is at most a tenth of their score (or 1 point); 'ko' when the
// runner-up scored less than two thirds of the winner; 'decision' otherwise.
export function verdictOf(result) {
    if (!result?.winners?.length) return null;
    if (result.winners.length > 1) return 'draw';
    const [top, next] = result.ranking;
    if (top.score - next.score <= Math.max(1, top.score / 10)) return 'split';
    if (next.score < (top.score * 2) / 3) return 'ko';
    return 'decision';
}

export const VERDICT_LABEL = { ko: 'KO', decision: 'Decision', split: 'Split decision', draw: 'Draw' };
export const VERDICT_HINT = 'KO: the runner-up scored less than two thirds of the winner. Split decision: won by a tenth of the winner\'s score or less, or by 1. Decision: any other win. Draw: a tie for first.';

// Fight-night days (S14). The owner's rule: a day runs from 06:00 to 06:00 in
// America/Chicago (the container's TZ, S6), so a night that goes past
// midnight stays on the evening it started. Fight nights, the rating's
// snapshot day, the heatmap, the activity calendars and the career months
// all count days this way.
export const FIGHT_NIGHT_DAY = { timeZone: 'America/Chicago', label: 'Central time', startHour: 6 };
export const DAY_MS = 86400000;
export const HOUR_MS = 3600000;
export const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// "06:00" for an hour of the day
export const clockHour = hour => `${String(hour).padStart(2, '0')}:00`;
// The clock hours in the order a fight-night day runs through them: 06:00 to 05:00.
export const DAY_HOURS = Array.from({ length: 24 }, (_, i) => (FIGHT_NIGHT_DAY.startHour + i) % 24);
// The pages' words for the rule.
export const FIGHT_NIGHT_DAY_TEXT = `${FIGHT_NIGHT_DAY.label}, a day running from ${clockHour(FIGHT_NIGHT_DAY.startHour)} to ${clockHour(FIGHT_NIGHT_DAY.startHour)}`;

const dayNumber = day => Date.parse(`${day}T00:00:00Z`) / DAY_MS;
// YYYY-MM-DD `days` after (or, negative, before) `day`.
export const shiftDay = (day, days) => new Date((dayNumber(day) + days) * DAY_MS).toISOString().slice(0, 10);
// Whole days from `from` to `to` (both YYYY-MM-DD).
export const daysBetween = (from, to) => dayNumber(to) - dayNumber(from);
// 0 for Monday to 6 for Sunday (1970-01-01 was a Thursday).
export const weekdayOf = day => (((dayNumber(day) + 3) % 7) + 7) % 7;

let clockFormat = null;
// The wall clock in FIGHT_NIGHT_DAY.timeZone at `ms`: { date, hour, offset },
// offset being wall time minus UTC in ms.
function wallClock(ms) {
    clockFormat ??= new Intl.DateTimeFormat('en-CA', {
        timeZone: FIGHT_NIGHT_DAY.timeZone, hourCycle: 'h23',
        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
    const p = Object.fromEntries(clockFormat.formatToParts(ms).map(({ type, value }) => [type, value]));
    const wall = Date.UTC(+p.year, p.month - 1, +p.day, +p.hour, +p.minute, +p.second) + (ms % 1000 + 1000) % 1000;
    return { date: `${p.year}-${p.month}-${p.day}`, hour: +p.hour, offset: wall - ms };
}

// Chicago's offset changes only on the hour, so the clock is worked out once
// per UTC hour seen: formatting every match's date was a fifth of the
// rating replay (S13).
const clockOfHour = new Map();
// { day, weekday, hour } for a date: its fight-night day (YYYY-MM-DD), that
// day's weekday (0 Monday) and the clock hour (0 to 23) in the time zone.
// null for a date that does not parse.
export function localClock(date) {
    const ms = typeof date === 'number' ? date : Date.parse(date);
    if (!Number.isFinite(ms)) return null;
    const key = Math.floor(ms / HOUR_MS);
    let clock = clockOfHour.get(key);
    if (!clock) {
        if (clockOfHour.size > 200000) clockOfHour.clear();
        const { date: wallDate, hour } = wallClock(key * HOUR_MS);
        const day = hour < FIGHT_NIGHT_DAY.startHour ? shiftDay(wallDate, -1) : wallDate;
        clockOfHour.set(key, (clock = { day, weekday: weekdayOf(day), hour }));
    }
    return clock;
}

// The fight-night day (YYYY-MM-DD) a date falls on, or null.
export const fightNightDay = date => localClock(date)?.day ?? null;

// When a fight-night day ('YYYY-MM-DD') starts, as a UTC ISO string: the wall
// time FIGHT_NIGHT_DAY.startHour that day, read as UTC, less the offset there
// (DST changes at 02:00, never at the start hour).
export function dayStart(day) {
    const wall = Date.parse(`${day}T${clockHour(FIGHT_NIGHT_DAY.startHour)}:00Z`);
    return new Date(wall - wallClock(wall - wallClock(wall).offset).offset).toISOString();
}

// [start, end) of a fight-night day as UTC ISO strings, for
// `date >= ? AND date < ?` on the stored dates (which can use
// idx_games_date): 23 or 25 hours long on the DST days. null when `day` is
// not a calendar day.
export function dayBounds(day) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !Number.isFinite(dayNumber(day)) || shiftDay(day, 0) !== day) return null;
    return [dayStart(day), dayStart(shiftDay(day, 1))];
}

// The dashboard heatmap (S14): matches per weekday and clock hour over the
// HEATMAP.weeks whole weeks of fight-night days before today, so each weekday
// counts the same number of days.
export const HEATMAP = { weeks: 12 };

// The heatmap's days, [since, until), for today (a fight-night day).
export const heatmapDays = today => ({ since: shiftDay(today, -7 * HEATMAP.weeks), until: today });

// 7 rows (Monday first, by fight-night day) of 24 counts (by clock hour) for
// the given match dates. A match counts at its `date`, when the tracker
// closed it.
export function heatmapCells(dates) {
    const cells = Array.from({ length: 7 }, () => new Array(24).fill(0));
    for (const date of dates) {
        const clock = localClock(date);
        if (clock) cells[clock.weekday][clock.hour]++;
    }
    return cells;
}

// The pilot page's activity calendar (S14): matches per fight-night day over
// CALENDAR.weeks weeks, Monday first, the last week holding today.
export const CALENDAR = { weeks: 53 };
export const calendarSince = today => shiftDay(today, -weekdayOf(today) - 7 * (CALENDAR.weeks - 1));

// [{ day, matches }] for the days with a match, oldest first.
export function calendarDays(dates) {
    const counts = new Map();
    for (const date of dates) {
        const day = fightNightDay(date);
        if (day) counts.set(day, (counts.get(day) || 0) + 1);
    }
    return [...counts].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([day, matches]) => ({ day, matches }));
}

// Rating (S13): Glicko-2 (Glickman, "Example of the Glicko-2 system", 2012).
// Every rated match is one rating period for the pilots in it, replayed in
// date order over every stored match. Every pilot plays every other side
// once: a side is a team in a team game (scored by teamScore) and a pilot in
// FFA (scored by in-game score), as in winnerOf(). A higher score wins, an
// equal one is a draw worth half, and each result weighs 1 / (sides - 1), so
// a match counts as one game. A side's strength is its pilots' mean rating
// and its uncertainty the root mean square of their RDs, so in FFA a pilot
// meets each opponent as they are. Between matches a pilot's RD grows by
// their volatility for every day sat out, up to the starting RD.
export const RATING = {
    start: 1500,
    rd: 350,
    volatility: 0.06,
    tau: 0.5,
    // Glicko-2's internal scale: mu = (rating - 1500) / scale, phi = RD / scale
    scale: 173.7178,
    // the power rankings: rated matches before a pilot is ranked, the days
    // since their last one, how many are listed, and how far back movement looks
    rankedAfter: 10,
    activeDays: 28,
    listed: 25,
    movementDays: 7,
};

// The pages' words for these rules, built from the numbers above.
export const RATED_MATCH_TEXT = `${RANKED.pilots}+ pilots, ${RANKED.seconds} s or more and a result`;
export const RD_HINT = 'RD is the uncertainty: about 95% of the time the true rating is within 2 RD. It grows while a pilot sits out.';
export const RATING_HINT = `Rating: Glicko-2 over every stored match with ${RATED_MATCH_TEXT}. Each match counts as one game against the other sides: FFA by score, team games by team score, a tie counts half. ${RD_HINT}`;
export const RANKING_HINT = `Ranked: ${RATING.rankedAfter}+ rated matches and one in the last ${RATING.activeDays} days. Movement compares the rank with ${RATING.movementDays} days earlier; NEW was not ranked then.`;

const PHI_MAX = RATING.rd / RATING.scale;

// A pilot's phi after `days` without a rated match: it grows by the
// volatility for every day, up to the starting RD.
const idlePhi = (phi, sigma, days) => Math.min(Math.sqrt(phi * phi + sigma * sigma * Math.max(0, days)), PHI_MAX);
const gOf = phi => 1 / Math.sqrt(1 + (3 * phi * phi) / (Math.PI * Math.PI));

// Glicko-2 step 5: the new volatility, by the Illinois algorithm.
function newVolatility(phi, sigma, v, delta) {
    const a = Math.log(sigma * sigma);
    const tau2 = RATING.tau * RATING.tau;
    const f = x => {
        const ex = Math.exp(x);
        const d = phi * phi + v + ex;
        return (ex * (delta * delta - phi * phi - v - ex)) / (2 * d * d) - (x - a) / tau2;
    };
    let A = a;
    let B;
    if (delta * delta > phi * phi + v) {
        B = Math.log(delta * delta - phi * phi - v);
    } else {
        let k = 1;
        while (f(a - k * RATING.tau) < 0) k++;
        B = a - k * RATING.tau;
    }
    let fA = f(A);
    let fB = f(B);
    while (Math.abs(B - A) > 1e-6) {
        const C = A + ((A - B) * fA) / (fB - fA);
        const fC = f(C);
        if (fC * fB <= 0) {
            A = B;
            fA = fB;
        } else {
            fA /= 2;
        }
        B = C;
        fB = fC;
    }
    return Math.exp(A / 2);
}

// One Glicko-2 rating period on the internal scale. `player` is { mu, phi,
// sigma }; each game is { mu, opponent: { mu, phi }, score, weight? }, where
// `mu` is the strength the player brings (their own, or their team's mean),
// `score` is 1, 0.5 or 0 and `weight` (1 by default) scales the game's say
// in v and the update. With no games only the RD grows. The RD never passes
// the starting RD.
export function glicko2(player, games) {
    let vInverse = 0;
    let sum = 0;
    for (const { mu, opponent, score, weight = 1 } of games) {
        const g = gOf(opponent.phi);
        const expected = 1 / (1 + Math.exp(-g * (mu - opponent.mu)));
        vInverse += weight * g * g * expected * (1 - expected);
        sum += weight * g * (score - expected);
    }
    if (!(vInverse > 0)) return { ...player, phi: idlePhi(player.phi, player.sigma, 1) };
    const v = 1 / vInverse;
    const sigma = newVolatility(player.phi, player.sigma, v, v * sum);
    const phi = Math.min(1 / Math.sqrt(1 / (player.phi * player.phi + sigma * sigma) + vInverse), PHI_MAX);
    return { mu: player.mu + phi * phi * sum, phi, sigma };
}

// The sides of a rated match, each { score, pilots: [{ key, name }] }, or null
// when the match does not count: not rankedMatch(), no result from winnerOf()
// (a team game without teamScore), or fewer than two sides with a named
// pilot. A pilot listed twice plays once, on the first listing's side; in a
// team game a pilot without a team sits out.
export function ratingSides(game) {
    if (!rankedMatch(game)) return null;
    const result = winnerOf(game);
    if (result.winners.length === 0) return null;
    const sides = new Map(result.ranking.map(r => [r.side, { score: r.score, pilots: [] }]));
    const seen = new Set();
    for (const p of game.players) {
        const key = pilotKey(p?.name);
        const side = sides.get(result.team ? teamOf(p) : key);
        if (!key || !side || seen.has(key)) continue;
        seen.add(key);
        side.pilots.push({ key, name: String(p.name).trim() });
    }
    const playing = [...sides.values()].filter(s => s.pilots.length > 0);
    return playing.length >= 2 ? playing : null;
}

const mean = values => values.reduce((a, b) => a + b, 0) / values.length;
const round = (n, places) => Math.round(n * 10 ** places) / 10 ** places;

// Replays rated matches ([{ id, date, sides }], sides from ratingSides()) in
// date order (id order for equal dates; a match without a date is skipped)
// and returns each pilot's rating at the end of every fight-night day they
// played:
// [{ pilot, name, day, rating, rd, volatility, matches }],
// `pilot` being the pilotKey(), `name` the latest spelling and `matches` the
// rated matches so far.
export function ratingSnapshots(matches) {
    const timed = matches
        .map(m => ({ ...m, at: Date.parse(m.date) }))
        .filter(m => Number.isFinite(m.at))
        .sort((a, b) => a.at - b.at || a.id - b.id);
    const pilots = new Map();
    const snapshots = new Map();
    for (const { at, sides } of timed) {
        // everyone's state before the match, RD grown over the days sat out
        const teams = sides.map(side => side.pilots.map(({ key, name }) => {
            let p = pilots.get(key);
            if (!p) pilots.set(key, (p = { key, mu: 0, phi: PHI_MAX, sigma: RATING.volatility, matches: 0, last: at }));
            p.name = name;
            return { p, phi: idlePhi(p.phi, p.sigma, (at - p.last) / DAY_MS) };
        }));
        const strength = teams.map(team => ({ mu: mean(team.map(t => t.p.mu)), phi: Math.sqrt(mean(team.map(t => t.phi * t.phi))) }));
        // a match counts as one game: an 8-pilot FFA is 7 results, but one
        // placement, and counted whole they push the volatility up without end
        const weight = 1 / (sides.length - 1);
        const updates = teams.flatMap((team, i) => team.map(({ p, phi }) => {
            const games = [];
            for (let j = 0; j < sides.length; j++) {
                if (j === i) continue;
                const score = sides[i].score > sides[j].score ? 1 : sides[i].score === sides[j].score ? 0.5 : 0;
                games.push({ mu: strength[i].mu, opponent: strength[j], score, weight });
            }
            return [p, glicko2({ mu: p.mu, phi, sigma: p.sigma }, games)];
        }));
        const day = fightNightDay(at);
        for (const [p, next] of updates) {
            Object.assign(p, next);
            p.matches++;
            p.last = at;
            snapshots.set(`${p.key}\n${day}`, {
                pilot: p.key,
                name: p.name,
                day,
                rating: round(RATING.start + RATING.scale * p.mu, 1),
                rd: round(RATING.scale * p.phi, 1),
                volatility: round(p.sigma, 6),
                matches: p.matches
            });
        }
    }
    return [...snapshots.values()];
}

// A snapshot's RD on a later `day`: grown for the days since, as it will be
// at the pilot's next rated match.
export function rdOn(snapshot, day) {
    return round(RATING.scale * idlePhi(snapshot.rd / RATING.scale, snapshot.volatility, dayNumber(day) - dayNumber(snapshot.day)), 1);
}

// Whether a pilot's latest snapshot on or before `day` puts them in the power
// rankings that day: 'provisional' below RATING.rankedAfter rated matches,
// 'inactive' when the last one is more than RATING.activeDays before `day`,
// otherwise 'ranked'.
export function rankStatus(snapshot, day) {
    if (snapshot.matches < RATING.rankedAfter) return 'provisional';
    return dayNumber(day) - dayNumber(snapshot.day) > RATING.activeDays ? 'inactive' : 'ranked';
}

// The power rankings on `day` from each pilot's latest snapshot on or before
// it: the 'ranked' ones (rankStatus) by rating (then rated matches, then
// name), each with a `rank` from 1 and its RD on `day` (rdOn).
export function powerRankings(latest, day) {
    return latest
        .filter(s => rankStatus(s, day) === 'ranked')
        .sort((a, b) => b.rating - a.rating || b.matches - a.matches || a.pilot.localeCompare(b.pilot))
        .map((s, i) => ({ ...s, rd: rdOn(s, day), rank: i + 1 }));
}

// The top RATING.listed of `now` (powerRankings() today), each with `change`:
// the rank it held in `before` (RATING.movementDays earlier) minus its rank
// now, so +3 is three places up, or null when it was not ranked then (NEW).
export function rankingMovement(now, before) {
    const was = new Map(before.map(s => [s.pilot, s.rank]));
    return now.slice(0, RATING.listed).map(s => ({ ...s, change: was.has(s.pilot) ? was.get(s.pilot) - s.rank : null }));
}

// Career (S14). The career arc counts what the career cards count: ranked
// matches (rankedMatch), each in the month of its fight-night day.
export const careerMonth = date => fightNightDay(date)?.slice(0, 7) ?? null;

const nextMonth = month => {
    const [y, m] = month.split('-').map(Number);
    return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
};

// A career line: the totals of some matches, as pilot_months keeps them per
// month and lastOuting() for a night. addToLine() adds one player's match.
export const emptyLine = () => ({ matches: 0, wins: 0, losses: 0, ties: 0, kills: 0, deaths: 0, assists: 0, seconds: 0 });
export function addToLine(line, player, outcome, seconds = 0) {
    line.matches++;
    if (outcome) line[OUTCOME_FIELD[outcome]]++;
    line.kills += netKills(player);
    line.deaths += Number(player?.deaths) || 0;
    line.assists += Number(player?.assists) || 0;
    line.seconds += seconds;
    return line;
}

// One entry per month from the first month in `months` (sorted by month) to
// `thisMonth` (YYYY-MM), months without a match filled with emptyLine(). Each
// entry is the month's line plus `month`, its win rate, Combat Ratio and
// Lethality, which are null for a month with no match.
export function careerSeries(months, thisMonth) {
    const byMonth = new Map(months.map(m => [m.month, m]));
    const first = months[0]?.month;
    const series = [];
    if (!first) return series;
    const last = thisMonth > first ? thisMonth : first;
    for (let month = first; month <= last; month = nextMonth(month)) {
        const m = { ...emptyLine(), ...byMonth.get(month), month };
        const played = m.matches > 0;
        series.push({
            ...m,
            winRate: played ? winRate(m.wins, m.matches) : null,
            combatRatio: played ? combatRatio(m.kills, m.assists, m.deaths) : null,
            lethality: played ? lethality(m.kills, m.seconds) : null
        });
    }
    return series;
}

// "Last time out" (S14): every stored match the pilot played on their latest
// fight-night day, ranked or not, as the match list shows them. `games` are
// that day's matches with the pilot in them (details plus `id` and `date`),
// in any order. Gives the night's totals and each match newest first, the
// pilot's first listing in a match counting. null when no game has the pilot.
export function lastOuting(games, name) {
    const key = pilotKey(name);
    const matches = [];
    const night = emptyLine();
    for (const game of games) {
        const player = (Array.isArray(game?.players) ? game.players : []).find(p => pilotKey(p?.name) === key);
        if (!player) continue;
        const outcome = outcomeOf(game, player);
        const { kills, deaths, assists } = addToLine(emptyLine(), player, outcome);
        addToLine(night, player, outcome);
        matches.push({ id: game.id, date: game.date, map: game.settings?.level ?? null, mode: game.settings?.matchMode ?? null, outcome, kills, deaths, assists });
    }
    if (matches.length === 0) return null;
    matches.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.id - a.id));
    const { seconds, matches: count, ...totals } = night;
    return { day: fightNightDay(matches[0].date), matches, ...totals, combatRatio: combatRatio(night.kills, night.assists, night.deaths) };
}

// The rating a pilot gained (negative: lost) over a fight-night day: their
// snapshot at its end less the one before (RATING.start for their first), to
// one decimal; null when the day had no rated match. `snapshots` are the
// pilot's latest two on or before `day`, newest first.
export function nightRatingChange([that, before], day) {
    return that?.day === day ? round((that.rating - (before?.rating ?? RATING.start)), 1) : null;
}

// Server history (S15). Every SNAPSHOT.everyMs the server stores the tracker's
// server browser: one tick per listed server. The raw ticks are kept
// SNAPSHOT.keepDays days; each tick is also added to its server's hour (the
// UTC hour, which is one clock hour and one fight-night day in Chicago, whose
// offset changes only on the hour), and the hours are kept for good.
export const SNAPSHOT = { everyMs: 60000, keepDays: 30 };
// What a server was doing at a tick, as the server browser shows it: no game,
// a game in its lobby, or a match being played.
export const SERVER_STATE = { idle: 0, lobby: 1, match: 2 };

// One tick of one server-browser entry ({ server, game? }); null for an entry
// without an IP.
export function snapshotRow(entry) {
    const ip = entry?.server?.ip;
    if (!ip) return null;
    const game = entry.game;
    return {
        ip,
        online: entry.server.online ? 1 : 0,
        players: Math.max(0, Number(game?.currentPlayers) || 0),
        max_players: Number(game?.maxPlayers) || null,
        state: !game ? SERVER_STATE.idle : game.inLobby ? SERVER_STATE.lobby : SERVER_STATE.match
    };
}

// The server page's windows, in whole fight-night days before today (the
// heatmap's rule, so each weekday counts the same number of days in 7 and its
// multiples), and the one shown without ?days=.
export const SERVER_WINDOWS = [7, 30, 90, 365];
export const SERVER_WINDOW_DEFAULT = 30;
export const serverWindow = (today, days) => ({ since: shiftDay(today, -days), until: today });

const ratio = (part, whole) => (whole > 0 ? round(part / whole, 4) : null);

// A server's numbers over some of its hours ({ hour, samples, online, lobby,
// match, pilots, match_pilots, peak }, `hour` the UTC hour number):
// - uptime: the share of ticks the tracker listed it online;
// - inUse: the share of online ticks with a match being played;
// - avgPilots: pilots per tick while a match was being played;
// - peak: the most pilots in one tick, and the latest hour it happened;
// - cells: average pilots per tick for each weekday (of the fight-night day,
//   0 Monday) and clock hour, all ticks counted, null where there was none;
//   busiest: the cell with the most.
// A rate is null when it has nothing to divide by.
export function serverSummary(hours) {
    const total = { samples: 0, online: 0, match: 0, match_pilots: 0 };
    const sums = Array.from({ length: 7 }, () => new Array(24).fill(0));
    const ticks = Array.from({ length: 7 }, () => new Array(24).fill(0));
    let peak = null;
    for (const h of hours) {
        for (const k of Object.keys(total)) total[k] += h[k];
        const clock = localClock(h.hour * HOUR_MS);
        sums[clock.weekday][clock.hour] += h.pilots;
        ticks[clock.weekday][clock.hour] += h.samples;
        if (h.peak > 0 && (!peak || h.peak > peak.pilots || (h.peak === peak.pilots && h.hour > peak.hour))) peak = { pilots: h.peak, hour: h.hour };
    }
    let busiest = null;
    const cells = sums.map((row, weekday) => row.map((sum, hour) => {
        const n = ticks[weekday][hour];
        if (n === 0) return null;
        const pilots = round(sum / n, 2);
        if (pilots > 0 && (!busiest || pilots > busiest.pilots)) busiest = { weekday, hour, pilots };
        return pilots;
    }));
    return {
        samples: total.samples,
        uptime: ratio(total.online, total.samples),
        inUse: ratio(total.match, total.online),
        avgPilots: total.match > 0 ? round(total.match_pilots / total.match, 2) : null,
        peak: peak && { pilots: peak.pilots, at: new Date(peak.hour * HOUR_MS).toISOString() },
        cells,
        busiest
    };
}

// Regional share (S15): stored matches per region per month of their
// fight-night day. `rows` are { region, month, matches }; gives one entry per
// month from the first to `thisMonth` (YYYY-MM): { month, total, counts },
// counts keyed by region, a month without a match total 0.
export function regionShare(rows, thisMonth) {
    const byMonth = new Map();
    for (const { region, month, matches } of rows) {
        const m = byMonth.get(month) || { month, total: 0, counts: {} };
        m.counts[region] = (m.counts[region] || 0) + matches;
        m.total += matches;
        byMonth.set(month, m);
    }
    const first = [...byMonth.keys()].sort()[0];
    const series = [];
    if (!first) return series;
    const last = thisMonth > first ? thisMonth : first;
    for (let month = first; month <= last; month = nextMonth(month)) series.push(byMonth.get(month) || { month, total: 0, counts: {} });
    return series;
}
