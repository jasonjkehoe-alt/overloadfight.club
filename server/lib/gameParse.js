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

// When the match started, as the game records it: archive games carry
// start/end, live-era games only settings.start (the StartGame event) and
// date (when the tracker closed it). Null when neither is there.
export const matchStart = game => game?.start || game?.settings?.start || null;

// How long the match actually ran, in seconds, or 0 when the game does not
// record it.
export function measuredDurationOf(game) {
    if (!game) return 0;
    const fromTimestamps = secondsBetween(matchStart(game), game.end || game.date);
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

// A team game has a team score or a player on a team.
export function teamGame(game) {
    const teamScore = game?.teamScore && typeof game.teamScore === 'object' ? game.teamScore : {};
    return Object.keys(teamScore).length > 0 || (Array.isArray(game?.players) ? game.players : []).some(p => teamOf(p));
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
    const team = teamGame(game);

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

// The match mode in upper case ('ANARCHY', 'CTF', ...), '' when unset.
export const matchModeOf = game => String(game?.settings?.matchMode ?? '').trim().toUpperCase();

// The map a match names, in upper case, or null: the key of every map table
// (map_stats_cache shows the first spelling it saw).
export const mapKey = game => String(game?.settings?.level ?? '').trim().toUpperCase() || null;

// True when the match's score is its kills, so the kill log replays the
// score. CTF and Monsterball score captures and goals, and Race laps.
export function killScored(game) {
    const mode = matchModeOf(game);
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

    // an entry that is not an object is skipped (the stats worker replays every
    // stored log for the clutch counts, S17)
    const log = (Array.isArray(game?.kills) ? game.kills : [])
        .filter(kill => kill && typeof kill === 'object')
        .map(kill => ({ kill, t: Number(kill.time) || 0 }))
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

// The best score among the sides other than `side`, or -Infinity when there
// is none.
function bestOtherScore(sides, side) {
    let best = -Infinity;
    for (const s of sides.values()) if (s.side !== side) best = Math.max(best, s.score);
    return best;
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
        const rest = bestOtherScore(sides, winner.side);
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
// `short` names a family by its first weapon where a column is narrow.
export const WEAPON_FAMILIES = [
    { id: 'laser', label: 'Impulse, Cyclone, Reflex', short: 'Impulse', weapons: ['IMPULSE', 'CYCLONE', 'REFLEX'] },
    { id: 'thunderbolt', label: 'Thunderbolt', short: 'Thunderbolt', weapons: ['THUNDERBOLT'] },
    { id: 'flak', label: 'Flak, Crusher', short: 'Flak', weapons: ['FLAK', 'CRUSHER'] },
    { id: 'driller', label: 'Driller, Lancer', short: 'Driller', weapons: ['DRILLER', 'LANCER'] },
    { id: 'missile', label: 'Falcon, Missile Pod, Hunter', short: 'Falcon', weapons: ['FALCON', 'MISSILE POD', 'HUNTER'] },
    { id: 'mine', label: 'Creeper, Time Bomb', short: 'Creeper', weapons: ['CREEPER', 'TIME BOMB'] },
    { id: 'heavy', label: 'Nova, Devastator, Vortex', short: 'Nova', weapons: ['NOVA', 'DEVASTATOR', 'VORTEX'] },
    { id: 'other', label: 'Other', short: 'Other', weapons: [] },
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
// An hour of a named fight-night day; an hour before the day starts is that
// night's: "Monday 21:00", "Monday night, 02:00".
export const atClock = (dayName, hour) =>
    hour < FIGHT_NIGHT_DAY.startHour ? `${dayName} night, ${clockHour(hour)}` : `${dayName} ${clockHour(hour)}`;
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

// The UTC instant of the wall-clock `time` ('HH:MM') on the calendar date
// `day` ('YYYY-MM-DD') in FIGHT_NIGHT_DAY.timeZone, as an ISO string: the
// wall time read as UTC, less the offset there (read twice, so a time just
// past a DST change takes the new offset). The schedule's events (S22) and
// the day's start both come from it.
export function localInstant(day, time) {
    const wall = Date.parse(`${day}T${time}:00Z`);
    const first = wall - wallClock(wall).offset;
    const second = wall - wallClock(first).offset;
    // a time the spring change skips (02:30 on its Sunday) has no instant of
    // its own: the second pass lands an hour early, so the first (after the
    // change, as calendars read it) stands
    return new Date(second + wallClock(second).offset === wall ? second : first).toISOString();
}

// The wall clock of a UTC instant in FIGHT_NIGHT_DAY.timeZone, as
// { date: 'YYYY-MM-DD', time: 'HH:MM' } (the schedule's ends, S22).
export function localWall(iso) {
    const ms = typeof iso === 'number' ? iso : Date.parse(iso);
    const wall = new Date(ms + wallClock(ms).offset).toISOString();
    return { date: wall.slice(0, 10), time: wall.slice(11, 16) };
}

// When a fight-night day ('YYYY-MM-DD') starts, as a UTC ISO string: the wall
// time FIGHT_NIGHT_DAY.startHour that day (DST changes at 02:00, never at the
// start hour).
export const dayStart = day => localInstant(day, clockHour(FIGHT_NIGHT_DAY.startHour));

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

// A stored date the replays can order by.
export const hasDate = date => Number.isFinite(Date.parse(date));

// Matches ([{ id, date, ... }]) in the order the replays play them: by date,
// id order for equal dates, each with `at` (its time in ms); a match without
// a date is left out.
export const inDateOrder = matches => matches
    .map(m => ({ ...m, at: Date.parse(m.date) }))
    .filter(m => hasDate(m.date))
    .sort((a, b) => a.at - b.at || a.id - b.id);

// Replays rated matches ([{ id, date, sides }], sides from ratingSides()) in
// date order (inDateOrder) and returns each pilot's rating at the end of
// every fight-night day they played:
// [{ pilot, name, day, rating, rd, volatility, matches }],
// `pilot` being the pilotKey(), `name` the latest spelling and `matches` the
// rated matches so far.
export function ratingSnapshots(matches) {
    const timed = inDateOrder(matches);
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
// Every month (YYYY-MM) from `first` to `thisMonth`, or just `first` when it is later.
const monthsTo = (first, thisMonth) => {
    const months = [];
    const last = thisMonth > first ? thisMonth : first;
    for (let month = first; month <= last; month = nextMonth(month)) months.push(month);
    return months;
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
    if (!months[0]) return [];
    return monthsTo(months[0].month, thisMonth).map(month => {
        const m = { ...emptyLine(), ...byMonth.get(month), month };
        const played = m.matches > 0;
        return {
            ...m,
            winRate: played ? winRate(m.wins, m.matches) : null,
            combatRatio: played ? combatRatio(m.kills, m.assists, m.deaths) : null,
            lethality: played ? lethality(m.kills, m.seconds) : null
        };
    });
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
        // an offline server is idle whatever game the browser still lists on it, so
        // a match tick is always an online tick (inUse is match over online)
        state: !game || !entry.server.online ? SERVER_STATE.idle : game.inLobby ? SERVER_STATE.lobby : SERVER_STATE.match
    };
}

// The Discord "it's on" ping (S18): an evening is on once one server-browser
// answer shows this many pilots across the online servers, lobbies included.
export const FIGHT_NIGHT_PING = { pilots: 6 };

// One server-browser answer as ticks: each entry with an IP as { entry, row }
// (snapshotRow), a server listed twice once (its first listing).
export function browserRows(servers) {
    const rows = new Map();
    for (const entry of servers || []) {
        const row = snapshotRow(entry);
        if (row && !rows.has(row.ip)) rows.set(row.ip, { entry, row });
    }
    return [...rows.values()];
}

// The online servers in one server-browser answer (browserRows).
export const onlineServers = servers => browserRows(servers).filter(({ row }) => row.online);
// The online servers with pilots on them, most first (the ping's list and
// the dashboard's live link, S22).
export const busyServers = servers => onlineServers(servers).filter(({ row }) => row.players > 0).sort((a, b) => b.row.players - a.row.players);

// The pilots in one server-browser answer: the online servers' players.
export const browserPilots = servers => onlineServers(servers).reduce((sum, { row }) => sum + row.players, 0);

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
        m.counts[region] = matches; // one row per (region, month)
        m.total += matches;
        byMonth.set(month, m);
    }
    const first = [...byMonth.keys()].sort()[0];
    return first ? monthsTo(first, thisMonth).map(month => byMonth.get(month) || { month, total: 0, counts: {} }) : [];
}

// Weapon meta and ladders (S16).

// Each named pilot's team by pilotKey(), from their first listing, as the
// replay's rowFor() keeps it (null in FFA or for a pilot without a team).
function teamsByPilot(game) {
    const teams = new Map();
    for (const p of game.players) { const key = pilotKey(p?.name); if (key && !teams.has(key)) teams.set(key, teamOf(p)); }
    return teams;
}

// Whether two pilotKey()s were teammates for the whole match (S17): listed on
// the same team and neither in game.teamChanges, since the tracker lists a
// pilot who changed team under one team only. A pilot without a team is
// nobody's teammate.
function teammatesOf(game) {
    const teams = teamsByPilot(game);
    const changed = new Set((Array.isArray(game.teamChanges) ? game.teamChanges : [])
        .filter(c => { const [from, to] = [teamOf({ team: c?.previousTeam }), teamOf({ team: c?.currentTeam })]; return from && to && from !== to; })
        .map(c => pilotKey(c.playerName)));
    return (a, b) => { const team = teams.get(a); return Boolean(team) && team === teams.get(b) && !changed.has(a) && !changed.has(b); };
}

// The kills that count for the weapon meta and the kill edges (S17): a ranked
// match's kill-log entries worth a point by killPoints() (a kill on an
// opponent: not a suicide, not a team kill, not a death without an attacker),
// each as { attacker, defender, family }, `family` being weaponFamily() of the
// weapon. Teams missing from an entry come from game.players, as the
// scoreboard replay reads them; the order of the log does not matter here, so
// it is one pass with no replay. A match that is not rankedMatch() or has no
// log gives none.
export function weaponKills(game) {
    if (!rankedMatch(game) || !hasKillLog(game)) return [];
    const team = teamGame(game);
    const teams = team ? teamsByPilot(game) : null;
    const kills = [];
    for (const kill of game.kills) {
        const entry = team
            ? { ...kill, attackerTeam: kill?.attackerTeam || teams.get(pilotKey(kill?.attacker)), defenderTeam: kill?.defenderTeam || teams.get(pilotKey(kill?.defender)) }
            : kill;
        const points = killPoints(entry, team);
        if (points.points > 0) kills.push({ attacker: points.scorer, defender: String(kill.defender ?? '').trim(), family: weaponFamily(kill.weapon) });
    }
    return kills;
}

// A duel (the owner's rule at the start of S16): a ranked, killScored() match
// with exactly two named pilots on different sides, so a 1v1 Anarchy match or
// a one-a-side Team Anarchy match; a CTF or Monsterball 1v1 is not one. Gives
// ratingSides() of the match (two sides of one pilot each) or null.
export function duelMatch(game) {
    // exactly two named pilots in a kill-scored match (most matches are not
    // two pilots, so that is checked first); ratingSides() then gives their
    // two sides, or null when both are on one side or the match is too short
    const players = Array.isArray(game?.players) ? game.players : [];
    if (!killScored(game) || new Set(players.map(p => pilotKey(p?.name)).filter(Boolean)).size !== 2) return null;
    return ratingSides(game);
}

// The duel ladder: a pilot is listed from DUEL.listedAfter duels, whenever
// their last one was (duels are rarer than matches, so no activity window);
// below that they are provisional and shown under the listed ones.
export const DUEL = { listedAfter: 5 };
export const DUEL_HINT = `Duel rating: Glicko-2 over 1v1 matches alone (${RANKED.pilots} pilots on different sides, ${RANKED.seconds} s or more, a result, kills as the score). Listed from ${DUEL.listedAfter} duels; fewer is provisional. ${RD_HINT}`;

// The ladder on `day` from each pilot's latest duel snapshot (the
// rating_snapshots shape, from ratingSnapshots() over duelMatch() sides):
// listed pilots by rating (then duels, then name), then the provisional ones
// the same way, each with `rank` from 1, `status` and its RD on `day` (rdOn).
export function duelLadder(latest, day) {
    const listed = s => s.matches >= DUEL.listedAfter;
    return [...latest]
        .sort((a, b) => listed(b) - listed(a) || b.rating - a.rating || b.matches - a.matches || a.pilot.localeCompare(b.pilot))
        .map((s, i) => ({ ...s, rd: rdOn(s, day), rank: i + 1, status: listed(s) ? 'listed' : 'provisional' }));
}

// Objective counts (S16): the tracker's per-player fields (`player`) and the
// pilot_objectives column each adds up to (`field`), with the board's word.
export const OBJECTIVE_FIELDS = [
    { field: 'goals', player: 'goals', label: 'Goals' },
    { field: 'goal_assists', player: 'goalAssists', label: 'Goal assists' },
    { field: 'blunders', player: 'blunders', label: 'Blunders' },
    { field: 'captures', player: 'captures', label: 'Captures' },
    { field: 'returns', player: 'returns', label: 'Returns' },
    { field: 'pickups', player: 'pickups', label: 'Pickups' },
    { field: 'carrier_kills', player: 'carrierKills', label: 'Carrier kills' }
];
// The objective modes, in the order the ladders page lists their boards:
// the fields each board shows, in order, and the one it sorts by.
export const OBJECTIVE_MODES = {
    CTF: { label: 'CTF', fields: ['captures', 'returns', 'pickups', 'carrier_kills'], sort: 'captures' },
    MONSTERBALL: { label: 'Monsterball', fields: ['goals', 'goal_assists', 'blunders'], sort: 'goals' }
};
// How many pilots an objective board lists.
export const BOARD_ROWS = 50;

// The objective mode of a match (an OBJECTIVE_MODES key), or null.
export function objectiveMode(game) {
    const mode = matchModeOf(game);
    return OBJECTIVE_MODES[mode] ? mode : null;
}

// A pilot's objective totals for a board: a career line (matches, wins,
// losses, ties, kills, deaths, assists) plus every objective field, each 0 to
// start. addToObjectives() adds one player's ranked match in that mode: the
// fields are the tracker's per-player counts, missing ones counting 0.
export const emptyObjectives = () => ({ ...emptyLine(), ...Object.fromEntries(OBJECTIVE_FIELDS.map(f => [f.field, 0])) });
export function addToObjectives(line, player, outcome) {
    addToLine(line, player, outcome);
    for (const { field, player: from } of OBJECTIVE_FIELDS) line[field] += Number(player?.[from]) || 0;
    return line;
}

// Rivalries, damage flow and clutch (S17). Like the weapon meta, each counts
// only ranked matches whose log the tracker kept, and only what happens
// between opponents.

// Who met whom: every pair [a, b] of listed pilotKey()s on different sides of
// a ranked match with a kill or damage log (everyone against everyone in FFA;
// in a team game every pair but teammatesOf()'s, where a pilot without a team
// sits out, as in ratingSides()), each pilot once. A pilot named only in a log
// meets nobody, so their kills and damage come without matches.
export function opponentsOf(game) {
    if (!rankedMatch(game) || (!hasKillLog(game) && !hasDamageLog(game))) return [];
    const team = teamGame(game);
    const keys = [...teamsByPilot(game)].filter(([, t]) => !team || t).map(([key]) => key);
    const mates = team ? teammatesOf(game) : () => false;
    const pairs = [];
    for (let i = 0; i < keys.length; i++) {
        for (let j = i + 1; j < keys.length; j++) {
            if (!mates(keys[i], keys[j])) pairs.push([keys[i], keys[j]]);
        }
    }
    return pairs;
}

// The damage flows of a ranked match with a damage log: each entry on an
// opponent as { attacker, defender, damage }, so no self-damage (the
// playerRows() rule) and, in a team game, no damage to a teammate (the damage
// log names no teams; an entry is a teammate's only when teammatesOf() says
// so, both pilots listed on the same team and neither changing team).
export const hasDamageLog = game => Array.isArray(game?.damage) && game.damage.length > 0;
export function damageFlows(game) {
    if (!rankedMatch(game) || !hasDamageLog(game)) return [];
    const mates = teamGame(game) ? teammatesOf(game) : null;
    const flows = [];
    for (const d of game.damage) {
        const attacker = pilotKey(d?.attacker);
        const defender = pilotKey(d?.defender);
        const damage = Number(d?.damage) || 0;
        if (!attacker || !defender || attacker === defender || damage <= 0) continue;
        if (mates?.(attacker, defender)) continue;
        flows.push({ attacker: String(d.attacker).trim(), defender: String(d.defender).trim(), damage });
    }
    return flows;
}

// What every rivalry number counts, for the pages that show them.
export const RIVALS_HINT = `Ranked matches (${RANKED.pilots}+ pilots, ${RANKED.seconds} s or more) whose kill or damage log the tracker kept; kills and damage on opponents only (no suicides, team kills, self-damage or damage to a teammate). A match without a log adds nothing.`;

// One match's damage log as a dealer × target grid, for the match page: every
// entry between listed pilots, self-damage and teammates included (unlike
// damageFlows()). `pilots` lists each pilot once ({ key, name, team }, the
// first listing's team), by team and then name; `dealt[i][j]` is what pilot i
// did to pilot j; `mate[i][j]` whether they were teammatesOf() the whole
// match; `out[i]` is pilot i's damage to other pilots (no
// self-damage, the playerRows() rule) and `total` everyone's. Null without a
// damage log or a named pilot.
export function damageGrid(game) {
    if (!hasDamageLog(game) || !Array.isArray(game.players)) return null;
    const names = new Map();
    for (const p of game.players) { const key = pilotKey(p?.name); if (key && !names.has(key)) names.set(key, String(p.name).trim()); }
    const teams = teamsByPilot(game);
    const pilots = [...names].map(([key, name]) => ({ key, name, team: teams.get(key) }))
        .sort((a, b) => (a.team ?? '').localeCompare(b.team ?? '') || a.name.localeCompare(b.name));
    if (pilots.length === 0) return null;
    const at = new Map(pilots.map((p, i) => [p.key, i]));
    const dealt = pilots.map(() => pilots.map(() => 0));
    for (const d of game.damage) {
        const [i, j] = [at.get(pilotKey(d?.attacker)), at.get(pilotKey(d?.defender))];
        if (i !== undefined && j !== undefined) dealt[i][j] += Number(d.damage) || 0;
    }
    const out = dealt.map((row, i) => row.reduce((sum, v, j) => (i === j ? sum : sum + v), 0));
    const mates = teammatesOf(game);
    const mate = pilots.map(a => pilots.map(b => a.key !== b.key && mates(a.key, b.key)));
    return { pilots, dealt, mate, out, total: out.reduce((a, b) => a + b, 0) };
}

// The owner's rules at the start of S17: a late kill comes in the last
// `lateSeconds` of the match (the match length capped at the time limit, or
// the last kill's time when later); a kill while trailing comes when another
// side held more points than the killer's just before it, a level score not
// counting (in FFA the side is the pilot, in team games the team).
export const CLUTCH = { lateSeconds: 60 };
export const CLUTCH_HINT = `Anarchy and Team Anarchy matches only, where the score is kills. First blood: the match's first kill on an opponent. Last ${CLUTCH.lateSeconds} s: a kill in the final ${CLUTCH.lateSeconds} s of the match. Trailing: a kill made while another side was ahead (a level score is not trailing).`;

// The clutch counts of one match: { team, firstBlood, kills: [{ attacker,
// late, trailing }] }, `firstBlood` being firstBloodOf()'s attacker (the
// first of `kills`) and
// `kills` every kill on an opponent (killPoints() worth a point). Null unless
// the match is ranked, killScored() (trailing reads the score, which is kills
// only there) and has a kill log.
export function clutchOf(game) {
    if (!rankedMatch(game) || !killScored(game) || !hasKillLog(game)) return null;
    // the match clock's end: start to end runs some seconds past the time
    // limit, which no kill time does
    const lastKill = Math.max(0, ...game.kills.map(k => Number(k?.time) || 0));
    const length = Math.max(Math.min(durationOf(game), plausibleSeconds(game.settings?.timeLimit) || Infinity), lastKill);
    const lateFrom = length - CLUTCH.lateSeconds;
    const kills = [];
    const { team } = replayLog(game, Infinity, (t, kill, points, sides) => {
        if (points.points <= 0) return;
        // the killer's side before this kill against the best other side (a
        // team-game kill whose attacker has no team has no side to trail)
        const side = points.side && sides.get(points.side);
        kills.push({ attacker: points.scorer, late: t >= lateFrom, trailing: Boolean(side) && side.score - points.points < bestOtherScore(sides, points.side) });
    });
    // the first kill worth a point is firstBloodOf()'s
    return { team, firstBlood: kills[0]?.attacker ?? null, kills };
}

// The head-to-head bouts of a rated match (S20, the Tale of the Tape): every
// pair of named pilots on different sides by ratingSides() (ranked, a result,
// a team-game pilot without a team sitting out, a pilot listed twice once), so
// a bout is a game of the rating's, each as { a, b, outcome }, a and b
// pilotKey()s and `outcome` a's by the two sides' scores (equal scores a tie),
// with the match's mode (matchModeOf) and map (mapKey, '' for none). Null when
// the match is not rated.
export function boutsOf(game) {
    const sides = ratingSides(game);
    if (!sides) return null;
    const pairs = [];
    for (let i = 0; i < sides.length; i++) {
        for (let j = i + 1; j < sides.length; j++) {
            const [x, y] = [sides[i], sides[j]];
            const outcome = sideOutcome(x, y);
            for (const a of x.pilots) for (const b of y.pilots) pairs.push({ a: a.key, b: b.key, outcome });
        }
    }
    return { mode: matchModeOf(game), map: mapKey(game) ?? '', pairs };
}
// Side x's outcome against side y of ratingSides(), by their scores.
export const sideOutcome = (x, y) => (x.score > y.score ? 'win' : x.score < y.score ? 'loss' : 'tie');
// The other pilot's outcome of a bout.
export const OPPOSITE_OUTCOME = { win: 'loss', loss: 'win', tie: 'tie' };

// The modes a page filters by: the pilot page's filter and the tape's switch
// (each with an all-modes default of its own).
export const MATCH_MODES = [
    { id: 'ANARCHY', label: 'Anarchy' },
    { id: 'TEAM ANARCHY', label: 'Team Anarchy' },
    { id: 'CTF', label: 'CTF' },
    { id: 'MONSTERBALL', label: 'Monsterball' }
];
// A tape's ?mode= value as a MATCH_MODES id, or null (every mode) for anything else.
export const tapeMode = value => MATCH_MODES.find(m => m.id === String(value ?? '').toUpperCase())?.id ?? null;
export const TAPE_HINT = `Head-to-head: ranked matches (${RATED_MATCH_TEXT}) the two played on different sides, each a win, loss or tie by their sides' scores. Kills and damage come only from ranked matches with a kill or damage log, a result or not, as on the kill-log rivals card.`;

// Belts (S21, the owner's rules at its start): one lineal belt per
// MATCH_MODES mode, decided match by match over every rated match. The first
// rated match in a mode with an outright winner crowns the winning side's top
// scorer. After that the holder keeps the belt through every match they do
// not play; a match their side wins or draws at the top is a defense; a match
// another side wins outright passes the belt to that side's top scorer; a
// match they lose while the top is shared by others changes nothing.
export const BELT_HINT = `One belt per mode, held until the champion loses. The first rated match in a mode (${RATED_MATCH_TEXT}) with an outright winner crowns the winning side's top scorer. After that the belt changes hands only when the champion plays a rated match in that mode and another side wins it outright, and goes to that side's top scorer. A win or a draw at the top is a defense.`;

// The belt's view of one match: { mode, sides, champion }, `sides` from
// ratingSides() and `champion` the { key, name } of the top scorer on the
// side that won outright (the pilot in FFA; in a team game the most of the
// mode's headline count, OBJECTIVE_MODES' `sort` field (captures, goals),
// then the highest in-game score, then listing order), or null when the top
// is shared. Null for a match that is not rated or not in a MATCH_MODES mode.
export function beltMatch(game) {
    const mode = matchModeOf(game);
    if (!MATCH_MODES.some(m => m.id === mode)) return null;
    const sides = ratingSides(game);
    if (!sides) return null;
    const top = Math.max(...sides.map(s => s.score));
    const won = sides.filter(s => s.score === top);
    if (won.length > 1) return { mode, sides, champion: null };
    // a CTF or Monsterball side scores by captures or goals, not kills
    const headline = OBJECTIVE_FIELDS.find(f => f.field === OBJECTIVE_MODES[mode]?.sort)?.player;
    const score = new Map();
    for (const p of game.players) {
        const key = pilotKey(p?.name);
        if (key && !score.has(key)) score.set(key, [headline ? Number(p[headline]) || 0 : 0, Number(p.kills) || 0]);
    }
    const ahead = (a, b) => a[0] > b[0] || (a[0] === b[0] && a[1] > b[1]);
    return { mode, sides, champion: won[0].pilots.reduce((best, p) => (ahead(score.get(p.key), score.get(best.key)) ? p : best)) };
}

// One match of the belt replay: `holders` maps a mode to its reign, `reigns`
// collects every reign ({ mode, reign, pilot, name, since, game, defenses,
// until, lost_game }, `until` '' and `lost_game` 0 while it lasts), and `m` is
// { id, date, ...beltMatch() }. Returns what the match did: `won` (a reign
// that started), `defended` (the reign the holder kept by winning or drawing
// at the top) and `slayers`, the pilotKey()s on the sides that outscored the
// holder's.
export function beltStep(holders, reigns, { id, date, mode, sides, champion }) {
    const held = holders.get(mode);
    const crown = () => {
        const next = { mode, reign: (held?.reign ?? 0) + 1, pilot: champion.key, name: champion.name, since: date, game: id, defenses: 0, until: '', lost_game: 0 };
        holders.set(mode, next);
        reigns.push(next);
        return next;
    };
    if (!held) return { won: champion ? crown() : null, defended: null, slayers: [] };
    const side = sides.find(s => s.pilots.some(p => p.key === held.pilot));
    if (!side) return { won: null, defended: null, slayers: [] };
    const slayers = sides.filter(s => s.score > side.score).flatMap(s => s.pilots.map(p => p.key));
    if (slayers.length === 0) {
        held.defenses++;
        return { won: null, defended: held, slayers };
    }
    if (!champion) return { won: null, defended: null, slayers };
    held.until = date;
    held.lost_game = id;
    return { won: crown(), defended: null, slayers };
}

// The best kill streak of each pilot in one ranked match with a kill log:
// kills on opponents (killPoints() worth a point) without dying in between,
// any death (a suicide, a team kill, a death with no attacker) ending the
// victim's streak. A Map of pilotKey() to the longest.
export function killStreaksOf(game) {
    const best = new Map();
    if (!rankedMatch(game) || !hasKillLog(game)) return best;
    const current = new Map();
    replayLog(game, Infinity, (t, kill, points) => {
        if (points.points > 0) {
            const key = pilotKey(points.scorer);
            const run = (current.get(key) || 0) + 1;
            current.set(key, run);
            if (run > (best.get(key) || 0)) best.set(key, run);
        }
        const victim = pilotKey(kill.defender);
        if (victim) current.set(victim, 0);
    });
    return best;
}

// Achievements (S21): each counts one thing over every stored match, in
// three tiers (TIERS) at the thresholds in `tiers`. `best` marks a count that
// is the longest run or streak rather than a total. The milestones count what
// the career cards count (ranked matches, netKills(), wins by outcomeOf());
// the kill-log feats are clutchOf()'s and killStreaksOf()'s; the belt ones
// come from beltStep(); the streaks from outcomeOf() over ranked matches and
// duelMatch() duels; the anniversary from the pilot's first stored match.
export const TIERS = ['Bronze', 'Silver', 'Gold'];
export const ACHIEVEMENT_GROUPS = ['Milestones', 'Kill log', 'Belts', 'Streaks'];
export const ACHIEVEMENTS = [
    { id: 'matches', group: 'Milestones', name: 'Century', counts: 'ranked matches', tiers: [100, 500, 1000] },
    { id: 'kills', group: 'Milestones', name: 'Body Count', counts: 'kills in ranked matches', tiers: [1000, 5000, 15000] },
    { id: 'wins', group: 'Milestones', name: 'Winner', counts: 'ranked wins', tiers: [25, 100, 500] },
    { id: 'nights', group: 'Milestones', name: 'Regular', counts: 'fight-night days with a ranked match', tiers: [10, 50, 150] },
    { id: 'first_bloods', group: 'Kill log', name: 'First Blood', counts: 'first bloods', tiers: [10, 50, 200] },
    { id: 'late_kills', group: 'Kill log', name: 'Closer', counts: `kills in a match's last ${CLUTCH.lateSeconds} s`, tiers: [25, 100, 500] },
    { id: 'trailing_kills', group: 'Kill log', name: 'Comeback', counts: 'kills while trailing', tiers: [100, 500, 2000] },
    { id: 'kill_streak', group: 'Kill log', name: 'Rampage', counts: 'kills in a row in one match without dying', best: true, tiers: [5, 10, 15] },
    { id: 'belts', group: 'Belts', name: 'Champion', counts: 'belts won', tiers: [1, 3, 10] },
    { id: 'defenses', group: 'Belts', name: 'Defender', counts: 'title defenses', tiers: [3, 10, 25] },
    { id: 'boss_slayer', group: 'Belts', name: 'Boss Slayer', counts: 'rated matches finished ahead of the reigning champion', tiers: [1, 5, 25] },
    { id: 'win_streak', group: 'Streaks', name: 'Hot Streak', counts: 'ranked wins in a row', best: true, tiers: [3, 5, 10] },
    { id: 'duel_streak', group: 'Streaks', name: 'Duelist', counts: '1v1 duel wins in a row', best: true, tiers: [3, 5, 10] },
    { id: 'years', group: 'Streaks', name: 'Anniversary', counts: 'years since the first stored match', tiers: [1, 3, 5] }
];
export const ACHIEVEMENT_HINT = `Counted over every stored match. Kill-log feats need a match whose kill log the tracker kept, and First Blood, Closer and Comeback count Anarchy and Team Anarchy only; a tie or a loss ends a streak, a match with no result does not. ${TIERS.join(', ')} at the thresholds shown.`;
export const ACHIEVEMENT_BY_ID = new Map(ACHIEVEMENTS.map(a => [a.id, a]));
// The tier a count reaches: 0 (none) to TIERS.length.
export const tierOf = (achievement, value) => achievement.tiers.filter(t => value >= t).length;
// Every tier of every achievement, and how many of them a pilot's
// achievements ([{ tier }]) have reached.
export const TIER_TOTAL = ACHIEVEMENTS.length * TIERS.length;
export const tiersEarned = achievements => achievements.reduce((sum, a) => sum + a.tier, 0);
