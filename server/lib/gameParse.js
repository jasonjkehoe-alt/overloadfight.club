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

function secondsBetween(from, to) {
    if (!from || !to) return 0;
    const diff = (new Date(to).getTime() - new Date(from).getTime()) / 1000;
    return diff > 0 && diff < MAX_DURATION_SEC ? diff : 0;
}

// Match length in seconds, 0 when nothing in the game says how long it ran.
// Archive games carry start/end. Live-era games carry only settings.start
// (the StartGame event) and date (when the tracker closed the game).
// settings.timeLimit is the cap, not the length, so it comes last.
export function durationOf(game) {
    if (!game) return 0;
    const fromTimestamps = secondsBetween(game.start || game.settings?.start, game.end || game.date);
    if (fromTimestamps) return fromTimestamps;
    for (const field of [game.timeElapsed, game.elapsed, game.duration, game.settings?.timeLimit]) {
        const n = Number(field);
        if (n > 0 && n < MAX_DURATION_SEC) return n;
    }
    return 0;
}

// Who won. Team games rank teams by teamScore (any number of teams; teams
// with players but no score entry count as 0). FFA ranks pilots by their
// in-game score (`kills`). `ranking` lists { side, name, score } best first;
// `side` is the team or the pilotKey(), `name` is what to display.
// `winners` holds every side sharing the top score: one entry is an outright
// win, more than one is a tie, none means the game has no result to read.
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
