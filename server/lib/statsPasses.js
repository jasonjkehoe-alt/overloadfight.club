// The full passes over every stored game: the pilot stats cache (PPI), the
// archive stats and the map stats. server/statsWorker.js feeds them each row
// once, parsed, and server/db.js writes what they return. Each pass is
// add(row, game) per stored game (game is null when details do not parse),
// then a finishing call.
import { OUTCOME_FIELD, addToLine, addToObjectives, careerMonth, clutchOf, damageFlows, duelMatch, emptyLine, emptyObjectives, combatRatio, durationOf, hasDate, lethality, mapKey, netKills, objectiveMode, opponentsOf, outcomeOf, pairOutcome, pilotKey, rankedMatch, ratingSides, ratingSnapshots, weaponKills, winRate, winnerOf } from './gameParse.js';
import { regionOf, UNKNOWN_REGION } from './serverRegions.js';

// pilot_stats_cache rows, one per pilotKey(), and (months()) the same totals
// per pilot per career month for pilot_months.
export function pilotPass() {
    const pilotMap = {};
    const killGraph = {};
    const h2h = {};

    function add(row, g) {
        if (!g) return;
        const durationSec = durationOf(g);
        if (!rankedMatch(g, durationSec)) return;
        const players = g.players;

        const result = winnerOf(g);
        const month = careerMonth(row.date || g.date);
        const map = mapKey(g);
        const objective = objectiveMode(g);

        for (let j = 0; j < players.length; j++) {
            const p = players[j];
            const key = pilotKey(p?.name);
            if (!key) continue;

            let pilot = pilotMap[key];
            if (!pilot) {
                pilot = pilotMap[key] = {
                    name: p.name.trim(),
                    games: 0,
                    kills: 0,
                    deaths: 0,
                    assists: 0,
                    suicides: 0,
                    wins: 0,
                    losses: 0,
                    ties: 0,
                    totalDamage: 0,
                    playtimeSec: 0,
                    lastSeen: row.date || g.end || g.date || null,
                    months: new Map(),
                    maps: new Map(),
                    objectives: new Map()
                };
            }

            pilot.games++;
            pilot.kills += netKills(p);
            pilot.deaths += (p.deaths || 0);
            pilot.assists += (p.assists || 0);
            pilot.playtimeSec += durationSec;
            if (row.date && (!pilot.lastSeen || row.date > pilot.lastSeen)) {
                pilot.lastSeen = row.date;
                pilot.name = p.name.trim();
            }

            const outcome = outcomeOf(g, p, result);
            if (outcome) pilot[OUTCOME_FIELD[outcome]]++;

            if (month) {
                if (!pilot.months.has(month)) pilot.months.set(month, emptyLine());
                addToLine(pilot.months.get(month), p, outcome, durationSec);
            }
            if (map) {
                if (!pilot.maps.has(map)) pilot.maps.set(map, emptyLine());
                addToLine(pilot.maps.get(map), p, outcome);
            }
            if (objective) {
                if (!pilot.objectives.has(objective)) pilot.objectives.set(objective, emptyObjectives());
                addToObjectives(pilot.objectives.get(objective), p, outcome);
            }
        }

        // Suicides from g.kills
        if (Array.isArray(g.kills)) {
            for (let j = 0; j < g.kills.length; j++) {
                const k = g.kills[j];
                const victim = pilotKey(k?.defender);
                if (victim && pilotKey(k.attacker) === victim && pilotMap[victim]) {
                    pilotMap[victim].suicides++;
                }
            }
        }

        // Threat & Dominance Graph
        if (players.length === 2) {
            const [p1, p2] = players;
            const n1 = pilotKey(p1?.name);
            const n2 = pilotKey(p2?.name);
            if (n1 && n2) {
                // Victim transfers prestige to Killer (p2 was killed by p1; p1 was killed by p2)
                killGraph[n2] = killGraph[n2] || {};
                killGraph[n2][n1] = (killGraph[n2][n1] || 0) + netKills(p1);

                killGraph[n1] = killGraph[n1] || {};
                killGraph[n1][n2] = (killGraph[n1][n2] || 0) + netKills(p2);

                h2h[n1] = h2h[n1] || {};
                h2h[n1][n2] = h2h[n1][n2] || { wins: 0, losses: 0, ties: 0 };
                h2h[n2] = h2h[n2] || {};
                h2h[n2][n1] = h2h[n2][n1] || { wins: 0, losses: 0, ties: 0 };

                const outcome = pairOutcome(g, p1, p2, result);
                if (outcome) {
                    h2h[n1][n2][OUTCOME_FIELD[outcome]]++;
                    h2h[n2][n1][OUTCOME_FIELD[pairOutcome(g, p2, p1, result)]]++;
                }
            }
        } else if (players.length > 2) {
            const keys = players.map(p => pilotKey(p?.name));
            const totalDeathsOthers = {};
            keys.forEach(n => {
                if (!n) return;
                totalDeathsOthers[n] = players.reduce((sum, o, i) => (keys[i] && keys[i] !== n ? sum + (o.deaths || 0) : sum), 0);
            });
            for (let a = 0; a < players.length; a++) {
                const killer = players[a];
                const kName = keys[a];
                if (!kName) continue;
                for (let b = 0; b < players.length; b++) {
                    const victim = players[b];
                    const vName = keys[b];
                    if (!vName) continue;
                    if (kName === vName) continue;

                    const killsWeight = totalDeathsOthers[kName] > 0
                        ? netKills(killer) * ((victim.deaths || 0) / totalDeathsOthers[kName])
                        : netKills(killer) / (players.length - 1);

                    // Victim transfers prestige to Killer
                    killGraph[vName] = killGraph[vName] || {};
                    killGraph[vName][kName] = (killGraph[vName][kName] || 0) + killsWeight;

                    h2h[kName] = h2h[kName] || {};
                    h2h[kName][vName] = h2h[kName][vName] || { wins: 0, losses: 0, ties: 0 };
                    if ((killer.kills || 0) > (victim.kills || 0)) h2h[kName][vName].wins++;
                    else if ((victim.kills || 0) > (killer.kills || 0)) h2h[kName][vName].losses++;
                    else h2h[kName][vName].ties = (h2h[kName][vName].ties || 0) + 1;
                }
            }
        }

        // Damage
        if (Array.isArray(g.damage)) {
            for (let j = 0; j < g.damage.length; j++) {
                const d = g.damage[j];
                if (!d || !d.damage || !d.attacker) continue;
                const aName = pilotKey(d.attacker);
                if (pilotMap[aName]) {
                    pilotMap[aName].totalDamage += d.damage;
                }
            }
        }
    }

    function rows() {
        // Dominance Index (opponents with >= 3 shared matches)
        const dominance = {};
        const pilotList = Object.keys(pilotMap);
        for (const p of pilotList) {
            const allOpponents = h2h[p] ? Object.keys(h2h[p]) : [];
            const qualifiedOpponents = allOpponents.filter(opp => {
                const rec = h2h[p][opp];
                const shared = (rec.wins || 0) + (rec.losses || 0) + (rec.ties || 0);
                return shared >= 3;
            });

            if (qualifiedOpponents.length === 0) {
                dominance[p] = 50.0;
            } else {
                let wonMatchups = 0;
                for (const opp of qualifiedOpponents) {
                    const rec = h2h[p][opp];
                    if (rec.wins > rec.losses) wonMatchups++;
                    else if (rec.wins === rec.losses) wonMatchups += 0.5;
                }
                dominance[p] = Math.round((wonMatchups / qualifiedOpponents.length) * 1000) / 10;
            }
        }

        // Threat Centrality (Power Iteration PageRank: Slaying High-Threat Targets Transfers Prestige)
        const N = pilotList.length || 1;
        let scores = {};
        pilotList.forEach(p => scores[p] = 1 / N);
        const d = 0.85;

        for (let iter = 0; iter < 25; iter++) {
            let danglingWeight = 0;
            const nextScores = {};
            for (let i = 0; i < N; i++) {
                nextScores[pilotList[i]] = 0;
            }

            for (const victim of pilotList) {
                const killers = killGraph[victim];
                const totalDeaths = killers ? Object.values(killers).reduce((a, b) => a + b, 0) : 0;
                if (totalDeaths > 0) {
                    const factor = (d * scores[victim]) / totalDeaths;
                    for (const [killer, weight] of Object.entries(killers)) {
                        nextScores[killer] += weight * factor;
                    }
                } else {
                    danglingWeight += scores[victim];
                }
            }

            const baseScore = ((1 - d) + d * danglingWeight) / N;
            for (let i = 0; i < N; i++) {
                nextScores[pilotList[i]] += baseScore;
            }
            scores = nextScores;
        }

        const maxScore = Math.max(...Object.values(scores), 0.0001);

        return pilotList.map(key => {
            const p = pilotMap[key];
            const kills = p.kills;
            const deaths = p.deaths || 0;
            const assists = p.assists || 0;
            const suicides = p.suicides || 0;
            const games = p.games || 1;
            const timeSec = p.playtimeSec || 0;
            const flightMinutes = timeSec > 0 ? timeSec / 60 : 0;

            const kd = deaths > 0 ? Math.round((kills / deaths) * 100) / 100 : kills;
            const kda = combatRatio(kills, assists, deaths);
            const akdr = deaths > 0 ? Math.round(((kills + assists * 0.33) / deaths) * 100) / 100 : kills;
            const kpm = lethality(kills, timeSec);
            const tce = Math.round(((kills * 1.0) + (assists * 0.4) - (deaths * 1.0)) * 10) / 10;
            const aci = Math.round(((kills + assists * 0.5 - deaths) / games) * 100) / 100;

            const wins = p.wins || 0;
            const losses = p.losses || 0;
            const ties = p.ties || 0;
            const pilotWinRate = winRate(wins, games);

            const totalDamage = Math.round(p.totalDamage || 0);
            const dpm = flightMinutes > 0 ? Math.round(totalDamage / flightMinutes) : 0;
            const flightHours = Math.round((timeSec / 3600) * 10) / 10;

            const finisherRating = (kills + assists) > 0 ? Math.round((kills / (kills + assists)) * 100) / 100 : 0;
            const centrality = Math.round((scores[key] / maxScore) * 1000) / 10;
            const dom = dominance[key] !== undefined ? dominance[key] : 50.0;

            return {
                name: p.name,
                kills,
                deaths,
                assists,
                suicides,
                games,
                time_played_seconds: Math.round(timeSec),
                kd,
                kda,
                akdr,
                kpm,
                tce,
                aci,
                wins,
                losses,
                ties,
                win_rate: pilotWinRate,
                total_damage: totalDamage,
                dpm,
                flight_hours: flightHours,
                finisher_rating: finisherRating,
                arsenal_entropy: 0,
                threat_centrality: centrality,
                dominance_index: dom,
                last_updated: p.lastSeen || new Date().toISOString()
            };
        });
    }

    // pilot_months rows: { pilot (the pilotKey), month, matches, wins, losses,
    // ties, kills, deaths, assists, seconds }
    function months() {
        return Object.entries(pilotMap).flatMap(([pilot, p]) =>
            [...p.months].map(([month, m]) => ({ pilot, month, ...m, seconds: Math.round(m.seconds * 1000) / 1000 })));
    }

    // pilot_maps rows (S16): a pilot's ranked matches per map, with the
    // latest spelling of their name
    function maps() {
        return Object.entries(pilotMap).flatMap(([pilot, p]) =>
            [...p.maps].map(([map, m]) => ({ pilot, map, name: p.name, matches: m.matches, wins: m.wins, losses: m.losses, ties: m.ties, kills: m.kills, deaths: m.deaths })));
    }

    // pilot_objectives rows (S16): a pilot's ranked matches per objective mode
    function objectives() {
        return Object.entries(pilotMap).flatMap(([pilot, p]) =>
            [...p.objectives].map(([mode, { seconds: _, ...o }]) => ({ pilot, mode, name: p.name, ...o })));
    }

    return { add, rows, months, maps, objectives };
}

// map_weapons and pilot_weapons rows (S16): every weaponKills() entry of every
// ranked match with a kill log, by the map and by the attacker.
export function weaponPass() {
    const byMap = new Map();
    const byPilot = new Map();
    const count = (counts, key) => counts.set(key, (counts.get(key) || 0) + 1);
    function add(row, g) {
        if (!g) return;
        const kills = weaponKills(g);
        if (kills.length === 0) return;
        // a logged match without a map counts in neither table, so a pilot's
        // kills and the community's come from the same matches
        const map = mapKey(g);
        if (!map) return;
        for (const { attacker, family } of kills) {
            count(byMap, `${map}\n${family}`);
            count(byPilot, `${pilotKey(attacker)}\n${family}`);
        }
    }
    const rows = (counts, first) => [...counts].map(([key, kills]) => {
        const [a, family] = key.split('\n');
        return { [first]: a, family, kills };
    });
    return { add, maps: () => rows(byMap, 'map'), pilots: () => rows(byPilot, 'pilot') };
}

// duel_snapshots and pilot_duels rows (S16): every duelMatch() kept as its
// sides, replayed through ratingSnapshots() once every game has been read, and
// each pair's record (both directions) with the date of their last duel. A
// duel without a date is skipped by both, as ratingSnapshots() skips it, so
// the records add up to the snapshots' duel counts.
export function duelPass() {
    const duels = [];
    function add(row, g) {
        const sides = g && duelMatch(g);
        const date = row.date || g?.date;
        if (sides && hasDate(date)) duels.push({ id: row.id, date, sides });
    }
    function pairs() {
        const records = new Map();
        const record = (a, b) => {
            const key = `${a.key}\n${b.key}`;
            if (!records.has(key)) records.set(key, { pilot: a.key, opponent: b.key, wins: 0, losses: 0, ties: 0, last: null });
            return records.get(key);
        };
        for (const { date, sides } of duels) {
            const [a, b] = sides.map(s => s.pilots[0]);
            const outcome = sides[0].score > sides[1].score ? ['wins', 'losses'] : sides[0].score < sides[1].score ? ['losses', 'wins'] : ['ties', 'ties'];
            for (const [me, them, field] of [[a, b, outcome[0]], [b, a, outcome[1]]]) {
                const r = record(me, them);
                r[field]++;
                if (!r.last || date > r.last) r.last = date;
            }
        }
        return [...records.values()];
    }
    return { add, rows: () => ratingSnapshots(duels), pairs };
}

// pilot_rivals and pilot_clutch rows (S17), from ranked matches with a log:
// for each pair of opponents, both directions, the logged matches they met in
// (opponentsOf), the kills each way (weaponKills: kills on opponents) and the
// damage each way (damageFlows: damage on opponents); and per pilot and kind
// of match (ffa or team), the clutch counts of clutchOf(). `name` and
// `opponent_name` are each pilot's latest spelling, as pilot_stats_cache
// keeps it, so the reads need no join.
export function rivalPass() {
    const pairs = new Map();
    const clutch = new Map();
    // pilotKey -> { name, date }: the spelling of the latest match
    const names = new Map();
    const spell = (name, date) => {
        const key = pilotKey(name);
        const seen = names.get(key);
        if (key && (!seen || date > seen.date)) names.set(key, { name: String(name).trim(), date });
        return key;
    };
    const pair = (pilot, opponent) => {
        const key = `${pilot}\n${opponent}`;
        if (!pairs.has(key)) pairs.set(key, { pilot, opponent, matches: 0, kills: 0, deaths: 0, damage_dealt: 0, damage_taken: 0 });
        return pairs.get(key);
    };
    const line = (pilot, kind) => {
        const key = `${pilot}\n${kind}`;
        if (!clutch.has(key)) clutch.set(key, { pilot, kind, matches: 0, first_bloods: 0, kills: 0, late_kills: 0, trailing_kills: 0 });
        return clutch.get(key);
    };

    function add(row, g) {
        if (!g) return;
        const met = opponentsOf(g);
        const kills = weaponKills(g);
        const flows = damageFlows(g);
        const match = clutchOf(g);
        if (met.length === 0 && kills.length === 0 && flows.length === 0 && !match) return;
        const date = row.date || g.date || '';
        const listed = new Set(g.players.map(p => spell(p?.name, date)).filter(Boolean));
        for (const [a, b] of met) {
            pair(a, b).matches++;
            pair(b, a).matches++;
        }
        // a pilot named only in a log keeps that spelling until a listing has one
        const key = name => spell(name, '');
        for (const k of kills) {
            const [a, b] = [key(k.attacker), key(k.defender)];
            if (!b) continue;
            pair(a, b).kills++;
            pair(b, a).deaths++;
        }
        for (const f of flows) {
            const [a, b] = [key(f.attacker), key(f.defender)];
            pair(a, b).damage_dealt += f.damage;
            pair(b, a).damage_taken += f.damage;
        }
        if (match) {
            const kind = match.team ? 'team' : 'ffa';
            for (const pilot of listed) line(pilot, kind).matches++;
            if (match.firstBlood) line(key(match.firstBlood), kind).first_bloods++;
            for (const k of match.kills) {
                const l = line(key(k.attacker), kind);
                l.kills++;
                if (k.late) l.late_kills++;
                if (k.trailing) l.trailing_kills++;
            }
        }
    }
    const nameOf = key => names.get(key)?.name ?? key;
    return {
        add,
        pairs: () => [...pairs.values()].map(({ pilot, opponent, damage_dealt, damage_taken, ...r }) => ({
            pilot, opponent, name: nameOf(pilot), opponent_name: nameOf(opponent), ...r, damage_dealt: Math.round(damage_dealt), damage_taken: Math.round(damage_taken)
        })),
        clutch: () => [...clutch.values()].map(({ pilot, kind, ...r }) => ({ pilot, kind, name: nameOf(pilot), ...r }))
    };
}

// The derived tables (rating_snapshots, pilot_months, region_months and the
// S16 and S17 tables) in tracker.db: built by the worker on every refresh and brought
// in line by server/statsWorker.js tableChanges and analytics/refresh.js
// writeChanges. One list, so the schema (migrations.js), the restore, the
// startup check, the worker and the write step agree: `columns` with their
// types (the first two are the key), the `pass` that builds the table (a key
// of the worker's passes), `rows` from those passes, and the log line's tag
// and noun.
const RATING_COLUMNS = ['pilot TEXT', 'day TEXT', 'name TEXT', 'rating REAL', 'rd REAL', 'volatility REAL', 'matches INTEGER'];
export const DERIVED_TABLES = {
    rating_snapshots: { columns: RATING_COLUMNS, pass: 'ratings', rows: p => p.ratings.rows(), log: ['Ratings', 'daily rating snapshots'] },
    pilot_months: { columns: ['pilot TEXT', 'month TEXT', 'matches INTEGER', 'wins INTEGER', 'losses INTEGER', 'ties INTEGER', 'kills INTEGER', 'deaths INTEGER', 'assists INTEGER', 'seconds REAL'], pass: 'pilots', rows: p => p.pilots.months(), log: ['Career', 'pilot months'] },
    region_months: { columns: ['region TEXT', 'month TEXT', 'matches INTEGER'], pass: 'regions', rows: p => p.regions.rows(), log: ['Regions', 'region months'] },
    map_weapons: { columns: ['map TEXT', 'family TEXT', 'kills INTEGER'], pass: 'weapons', rows: p => p.weapons.maps(), log: ['Weapons', 'map weapon rows'] },
    pilot_weapons: { columns: ['pilot TEXT', 'family TEXT', 'kills INTEGER'], pass: 'weapons', rows: p => p.weapons.pilots(), log: ['Weapons', 'pilot weapon rows'] },
    pilot_maps: { columns: ['pilot TEXT', 'map TEXT', 'name TEXT', 'matches INTEGER', 'wins INTEGER', 'losses INTEGER', 'ties INTEGER', 'kills INTEGER', 'deaths INTEGER'], pass: 'pilots', rows: p => p.pilots.maps(), log: ['Maps', 'pilot map rows'] },
    duel_snapshots: { columns: RATING_COLUMNS, pass: 'duels', rows: p => p.duels.rows(), log: ['Duels', 'daily duel snapshots'] },
    pilot_duels: { columns: ['pilot TEXT', 'opponent TEXT', 'wins INTEGER', 'losses INTEGER', 'ties INTEGER', 'last TEXT'], pass: 'duels', rows: p => p.duels.pairs(), log: ['Duels', 'duel records'] },
    pilot_objectives: { columns: ['pilot TEXT', 'mode TEXT', 'name TEXT', 'matches INTEGER', 'wins INTEGER', 'losses INTEGER', 'ties INTEGER', 'kills INTEGER', 'deaths INTEGER', 'assists INTEGER', 'goals INTEGER', 'goal_assists INTEGER', 'blunders INTEGER', 'captures INTEGER', 'returns INTEGER', 'pickups INTEGER', 'carrier_kills INTEGER'], pass: 'pilots', rows: p => p.pilots.objectives(), log: ['Objectives', 'objective rows'] },
    pilot_rivals: { columns: ['pilot TEXT', 'opponent TEXT', 'name TEXT', 'opponent_name TEXT', 'matches INTEGER', 'kills INTEGER', 'deaths INTEGER', 'damage_dealt INTEGER', 'damage_taken INTEGER'], pass: 'rivals', rows: p => p.rivals.pairs(), log: ['Rivals', 'rival pairs'] },
    pilot_clutch: { columns: ['pilot TEXT', 'kind TEXT', 'name TEXT', 'matches INTEGER', 'first_bloods INTEGER', 'kills INTEGER', 'late_kills INTEGER', 'trailing_kills INTEGER'], pass: 'rivals', rows: p => p.rivals.clutch(), log: ['Clutch', 'clutch rows'] }
};
// A derived table's column names, in table order.
export const derivedColumns = table => DERIVED_TABLES[table].columns.map(c => c.split(' ')[0]);
// The value of the built marker (analytics/meta.js) once a refresh has
// written every table in the list: a new table or column changes it.
export const DERIVED_TABLES_VERSION = Object.entries(DERIVED_TABLES).map(([table, { columns }]) => `${table}(${columns.join(',')})`).join(';');

// rating_snapshots rows (S13): every rated match, hot and cold, kept as its
// sides and replayed in date order once every game has been read.
export function ratingPass() {
    const matches = [];
    function add(row, g) {
        const sides = g && ratingSides(g);
        if (sides) matches.push({ id: row.id, date: row.date || g.date, sides });
    }
    return { add, rows: () => ratingSnapshots(matches) };
}

// region_months rows (S15): every stored match, hot and cold, counted by the
// region of its server and the month of its fight-night day. The region comes
// from the server name and notes stored with the match; for a match without
// them (or with no place in them), from the latest stored match on the same IP
// that has one, else from the server's latest listing (`regionByIp`, from the
// servers table), else Unknown.
export function regionPass(regionByIp = new Map()) {
    const counts = new Map();
    // matches whose region waits on their IP: `${ip}\n${month}` -> count
    const pending = new Map();
    // ip -> { region, date } of its latest match with a region
    const learned = new Map();
    // a few hundred server names and notes across every stored match
    const regionCache = new Map();
    const regionOfServer = ({ name, notes }) => {
        const key = `${name}\n${notes}`;
        if (!regionCache.has(key)) regionCache.set(key, regionOf(name, notes));
        return regionCache.get(key);
    };
    const count = (key, n = 1) => counts.set(key, (counts.get(key) || 0) + n);
    function add(row, g) {
        const month = careerMonth(row.date || g?.date);
        if (!month) return;
        const ip = row.ip || g?.server?.ip || '';
        const date = row.date || g?.date || '';
        const region = g?.server ? regionOfServer(g.server) : UNKNOWN_REGION;
        if (region !== UNKNOWN_REGION) {
            if (ip && !(learned.get(ip)?.date > date)) learned.set(ip, { region, date });
            count(`${region}\n${month}`);
        } else {
            const key = `${ip}\n${month}`;
            pending.set(key, (pending.get(key) || 0) + 1);
        }
    }
    function rows() {
        for (const [key, n] of pending) {
            const [ip, month] = key.split('\n');
            count(`${learned.get(ip)?.region || regionByIp.get(ip) || UNKNOWN_REGION}\n${month}`, n);
        }
        pending.clear();
        return [...counts].map(([key, matches]) => {
            const [region, month] = key.split('\n');
            return { region, month, matches };
        });
    }
    return { add, rows };
}

// The cold_storage_stats_cache payload. The pilot totals come from the rows
// pilotPass() returned; `storage` holds the two file sizes in bytes.
export function archivePass() {
    const yearlyMap = {};
    const modesMap = {};
    const mapsMap = {};
    const serverSet = new Set();
    let totalGames = 0;
    let firstGameDate = null;
    let lastGameDate = null;
    let graveyardShiftCount = 0;
    let totalMatchPlaytimeSec = 0;

    let bloodiestMatch = { id: null, kills: 0, map: '', date: '', players: 0, mode: '' };
    let longestMatch = { id: null, duration: 0, map: '', date: '', players: 0, mode: '' };
    let maxSinglePilotFrags = { id: null, pilot: '', kills: 0, map: '', date: '', mode: '' };
    let mostAttendedMatch = { id: null, count: 0, map: '', date: '', mode: '' };

    function add(row, g) {
        totalGames++;
        if (row.ip) serverSet.add(row.ip.trim());
        if (row.date) {
            if (!firstGameDate || row.date < firstGameDate) firstGameDate = row.date;
            if (!lastGameDate || row.date > lastGameDate) lastGameDate = row.date;
            const yr = row.date.substring(0, 4);
            if (yr >= '2019' && yr <= '2030') yearlyMap[yr] = (yearlyMap[yr] || 0) + 1;
            const hr = new Date(row.date).getUTCHours();
            if (hr >= 2 && hr <= 5) graveyardShiftCount++;
        }
        if (!g) return;

        try {
            const modeRaw = (g.settings?.matchMode || g.MatchMode || g.game?.mode || 'ANARCHY').toUpperCase().trim();
            modesMap[modeRaw] = (modesMap[modeRaw] || 0) + 1;

            const mapRaw = (g.settings?.level || g.Level || g.game?.mapName || 'UNKNOWN').trim();
            if (mapRaw && mapRaw !== 'UNKNOWN') mapsMap[mapRaw] = (mapsMap[mapRaw] || 0) + 1;

            const dur = Math.round(durationOf(g));

            totalMatchPlaytimeSec += dur;
            if (dur > longestMatch.duration) {
                longestMatch = { id: row.id, duration: dur, map: mapRaw, date: row.date, players: (g.players || []).length, mode: modeRaw };
            }

            const players = g.players || [];
            if (players.length > mostAttendedMatch.count) {
                mostAttendedMatch = { id: row.id, count: players.length, map: mapRaw, date: row.date, mode: modeRaw };
            }

            let matchFrags = 0;
            for (let i = 0; i < players.length; i++) {
                const p = players[i];
                const k = netKills(p);
                matchFrags += k;
                if (k > maxSinglePilotFrags.kills && p?.name) {
                    maxSinglePilotFrags = { id: row.id, pilot: p.name.trim(), kills: k, map: mapRaw, date: row.date, mode: modeRaw };
                }
            }

            if (matchFrags > bloodiestMatch.kills) {
                bloodiestMatch = { id: row.id, kills: matchFrags, map: mapRaw, date: row.date, players: players.length, mode: modeRaw };
            }
        } catch (e) {}
    }

    function payload(pilotRows, { hotDbSize, coldDbSize }) {
        const totalStorageBytes = hotDbSize + coldDbSize;
        const pilotSummary = { total_pilots: pilotRows.length, total_kills: 0, total_deaths: 0, total_assists: 0, total_damage: 0, total_flight_hours: 0 };
        for (const p of pilotRows) {
            pilotSummary.total_kills += p.kills;
            pilotSummary.total_deaths += p.deaths;
            pilotSummary.total_assists += p.assists;
            pilotSummary.total_damage += p.total_damage;
            pilotSummary.total_flight_hours += p.flight_hours;
        }

        const sortedMaps = Object.entries(mapsMap)
            .map(([map, count]) => ({ map, count, lastPlayed: null }))
            .sort((a, b) => b.count - a.count);

        const sortedModes = Object.entries(modesMap)
            .map(([mode, count]) => ({ mode, count }))
            .sort((a, b) => b.count - a.count);

        const yearlyList = Object.entries(yearlyMap)
            .map(([year, count]) => ({ year, count }))
            .sort((a, b) => a.year.localeCompare(b.year));

        return {
            total_games: totalGames,
            first_game: firstGameDate,
            last_game: lastGameDate,
            total_playtime_seconds: Math.round((pilotSummary.total_flight_hours || (totalMatchPlaytimeSec / 3600)) * 3600),
            total_flight_hours: Math.round(pilotSummary.total_flight_hours || (totalMatchPlaytimeSec / 3600)),
            total_kills: pilotSummary.total_kills || 0,
            total_deaths: pilotSummary.total_deaths || 0,
            total_assists: pilotSummary.total_assists || 0,
            total_damage: Math.round(pilotSummary.total_damage || 0),
            unique_pilots: pilotSummary.total_pilots || 0,
            unique_servers: serverSet.size,
            unique_maps: sortedMaps.length,
            most_popular_mode: sortedModes[0] || { mode: 'ANARCHY', count: 0 },
            most_popular_map: sortedMaps[0] || { map: 'VAULT', count: 0 },
            modes: sortedModes,
            top_maps: sortedMaps.slice(0, 20),
            yearly: yearlyList,
            records: {
                bloodiest_match: bloodiestMatch,
                longest_match: longestMatch,
                max_single_pilot_frags: maxSinglePilotFrags,
                most_attended_match: mostAttendedMatch
            },
            graveyard_shift_count: graveyardShiftCount,
            storage: {
                hot_db_bytes: hotDbSize,
                cold_db_bytes: coldDbSize,
                total_bytes: totalStorageBytes,
                hot_db_mb: Math.round((hotDbSize / (1024 * 1024)) * 10) / 10,
                cold_db_mb: Math.round((coldDbSize / (1024 * 1024)) * 10) / 10,
                total_mb: Math.round((totalStorageBytes / (1024 * 1024)) * 10) / 10,
                total_gb: Math.round((totalStorageBytes / (1024 * 1024 * 1024)) * 100) / 100
            },
            last_calculated: new Date().toISOString()
        };
    }

    return { add, payload };
}

// map_stats_cache rows, one per map name (case-insensitive).
export function mapPass(thirtyDaysAgo) {
    const mapStatsMap = new Map();

    function getOrInit(name, key) {
        let entry = mapStatsMap.get(key);
        if (!entry) {
            entry = {
                name: name.trim(),
                total_matches: 0,
                total_kills: 0,
                total_deaths: 0,
                total_damage: 0,
                total_pilot_slots: 0,
                recent_30d_matches: 0,
                first_played: null,
                last_played: null,
                modes: {},
                pilots: new Map(),
                record_match: { id: null, kills: 0, date: null, players: 0 }
            };
            mapStatsMap.set(key, entry);
        }
        return entry;
    }

    function add(row, details) {
        const levelRaw = details?.settings?.level;
        if (!levelRaw || typeof levelRaw !== 'string') return;

        const entry = getOrInit(levelRaw, mapKey(details));
        entry.total_matches++;

        const date = row.date;
        if (date) {
            if (!entry.first_played || date < entry.first_played) entry.first_played = date;
            if (!entry.last_played || date > entry.last_played) entry.last_played = date;
            if (date >= thirtyDaysAgo) entry.recent_30d_matches++;
        }

        const mode = details?.settings?.matchMode || 'ANARCHY';
        entry.modes[mode] = (entry.modes[mode] || 0) + 1;

        const players = Array.isArray(details?.players) ? details.players : [];
        entry.total_pilot_slots += players.length;

        let matchKills = 0;
        for (const p of players) {
            const pName = p.name ? p.name.trim() : null;
            const kills = netKills(p);
            const deaths = Number(p.deaths) || 0;

            matchKills += kills;
            entry.total_kills += kills;
            entry.total_deaths += deaths;

            if (pName) {
                const pKey = pilotKey(pName);
                let pEntry = entry.pilots.get(pKey);
                if (!pEntry) {
                    pEntry = { name: pName, sorties: 0, kills: 0, deaths: 0 };
                    entry.pilots.set(pKey, pEntry);
                }
                pEntry.sorties++;
                pEntry.kills += kills;
                pEntry.deaths += deaths;
            }
        }

        // Aggregate combat damage from match telemetry (prefer pre-aggregated player damage, fallback to raw damage array)
        let matchDamage = 0;
        if (Array.isArray(details?.players) && details.players.length > 0) {
            for (let j = 0; j < details.players.length; j++) {
                const p = details.players[j];
                matchDamage += Number(p?.damage_dealt || p?.damage || p?.total_damage || 0);
            }
        } else if (Array.isArray(details?.damage)) {
            for (let j = 0; j < details.damage.length; j++) {
                const d = details.damage[j];
                if (d && typeof d.damage === 'number') {
                    matchDamage += d.damage;
                }
            }
        }
        entry.total_damage += Math.round(matchDamage);

        if (matchKills > entry.record_match.kills) {
            entry.record_match = {
                id: row.id,
                kills: matchKills,
                date: row.date,
                players: players.length
            };
        }
    }

    function rows() {
        return Array.from(mapStatsMap.values(), entry => {
            const topPilots = Array.from(entry.pilots.values())
                .sort((a, b) => b.kills - a.kills)
                .slice(0, 5)
                .map(p => ({
                    ...p,
                    kd: Number((p.kills / Math.max(1, p.deaths)).toFixed(2))
                }));

            const topAce = topPilots[0] || null;

            return {
                map_name: entry.name,
                total_matches: entry.total_matches,
                total_kills: entry.total_kills,
                total_deaths: entry.total_deaths,
                total_damage: entry.total_damage,
                avg_players: Number((entry.total_pilot_slots / Math.max(1, entry.total_matches)).toFixed(1)),
                first_played: entry.first_played,
                last_played: entry.last_played,
                recent_30d_matches: entry.recent_30d_matches,
                modes: JSON.stringify(entry.modes),
                top_pilot: topAce ? JSON.stringify(topAce) : null,
                top_pilots: JSON.stringify(topPilots),
                record_match: JSON.stringify(entry.record_match)
            };
        });
    }

    return { add, rows };
}
