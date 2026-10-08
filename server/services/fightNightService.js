import db from '../db.js';
import { FIGHT_NIGHT_DAY, dayStart, fightNightDay, netKills, pilotKey, shiftDay, winnerOf } from '../lib/gameParse.js';

export const FIGHT_NIGHT_THRESHOLDS = {
    minMatches: 16,    // ≥ 16 matches in one fight-night day (gameParse.js)
    minPilots: 14,     // AND (≥ 14 unique pilots
    minFrags: 1600     //      OR ≥ 1600 total frags)
};

// Display name for a winnerOf() ranking row: "Blue Team" or the pilot's name.
function sideLabel(result, row) {
    return result.team ? `${row.name.charAt(0)}${row.name.slice(1).toLowerCase()} Team` : row.name;
}

/**
 * Format date string into human fight-night poster header
 * e.g. "2026-10-04" -> "Sunday, October 4, 2026"
 */
function formatFightNightDate(dateStr) {
    try {
        const [y, m, d] = dateStr.split('-').map(Number);
        const dt = new Date(Date.UTC(y, m - 1, d));
        return dt.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'UTC'
        });
    } catch {
        return dateStr;
    }
}

/**
 * Auto-generates a Fight Night Recap for a specific date if it meets thresholds (or if forced).
 */
export async function generateRecapForDate(targetDate, force = false) {
    if (!targetDate || typeof targetDate !== 'string') return null;

    // 1. Fetch all matches on targetDate from hot database
    const rows = db.getGamesForDate ? db.getGamesForDate(targetDate) : [];
    if (!rows || rows.length === 0) return null;

    const matches = [];
    const pilots = new Map(); // pilotKey -> { name, matches, frags }
    let totalFrags = 0;

    for (const r of rows) {
        let d;
        try {
            d = typeof r.details === 'string' ? JSON.parse(r.details) : r.details;
        } catch {
            continue;
        }
        const m = { id: r.id, date: r.date, ...d };
        matches.push(m);

        if (Array.isArray(m.players)) {
            for (const p of m.players) {
                const key = pilotKey(p?.name);
                if (!key) continue;
                const kills = netKills(p);
                totalFrags += kills;

                const pilot = pilots.get(key) || { name: p.name.trim(), matches: 0, frags: 0 };
                pilot.matches++;
                pilot.frags += kills;
                pilots.set(key, pilot);
            }
        }
    }

    const uniquePilotCount = pilots.size;
    const matchCount = matches.length;

    // Check thresholds unless forced
    const qualifies = matchCount >= FIGHT_NIGHT_THRESHOLDS.minMatches &&
        (uniquePilotCount >= FIGHT_NIGHT_THRESHOLDS.minPilots || totalFrags >= FIGHT_NIGHT_THRESHOLDS.minFrags);

    // Standard verification log line
    console.log(`fight-night check: ${matchCount} matches, ${uniquePilotCount} pilots — big night: ${qualifies ? 'yes' : 'no'}`);

    if (!qualifies && !force) {
        return null;
    }

    // Top Fragger & Most Active Pilot
    let topFragger = { name: 'Unknown', kills: 0 };
    let mostActivePilot = { name: 'Unknown', matches: 0 };
    for (const { name, matches: count, frags } of pilots.values()) {
        if (frags > topFragger.kills) topFragger = { name, kills: frags };
        if (count > mostActivePilot.matches) mostActivePilot = { name, matches: count };
    }

    // 1. Headline Bout: match with most pilots (tiebreak: most frags)
    let headlineBout = null;
    let maxPilots = -1;
    let maxBoutFrags = -1;

    for (const m of matches) {
        const players = Array.isArray(m.players) ? m.players : [];
        const pCount = players.length;
        let boutFrags = 0;
        for (const p of players) boutFrags += netKills(p);

        if (pCount > maxPilots || (pCount === maxPilots && boutFrags > maxBoutFrags)) {
            maxPilots = pCount;
            maxBoutFrags = boutFrags;

            const sortedP = players.slice().sort((a, b) => (Number(b.kills) || 0) - (Number(a.kills) || 0));
            const topPilot = sortedP[0]?.name || 'Unknown';
            const topKills = netKills(sortedP[0]);
            const arena = m.settings?.level || 'Unknown Map';
            const mode = m.settings?.matchMode || 'ANARCHY';

            headlineBout = {
                gameId: m.id,
                map: arena,
                matchMode: mode,
                pilotCount: pCount,
                totalFrags: boutFrags,
                topPilot,
                topKills,
                copy: `In the headline match on ${arena}, ${pCount} pilots traded fire in a ${mode} slugfest with ${boutFrags} total kills.`
            };
        }
    }

    // 2. Biggest Upset: lowest pre-match Threat / KD pilot defeating top-50 pilot
    // Pre-load pilot stats from cache
    const pilotStatsMap = new Map();
    const statsRows = db.getAllCachedPilotStats ? db.getAllCachedPilotStats() : [];
    for (const s of statsRows) {
        pilotStatsMap.set(pilotKey(s.name), s);
    }

    // Top 50 by threat_centrality (or KD fallback)
    const sortedTop50 = statsRows.slice().sort((a, b) => (b.threat_centrality || 0) - (a.threat_centrality || 0)).slice(0, 50);
    const top50Set = new Set(sortedTop50.map(s => pilotKey(s.name)));

    let biggestUpset = null;
    let maxUpsetScore = -1;

    for (const m of matches) {
        const players = (m.players || []).slice().sort((a, b) => (Number(b.kills) || 0) - (Number(a.kills) || 0));
        if (players.length < 2) continue;

        const winner = players[0];
        const winnerName = winner.name;
        const winnerStats = pilotStatsMap.get(pilotKey(winnerName)) || { kd: 1.0, threat_centrality: 0 };
        const arena = m.settings?.level || 'Unknown Map';

        for (let i = 1; i < players.length; i++) {
            const opp = players[i];
            const oppName = opp.name;
            const oppStats = pilotStatsMap.get(pilotKey(oppName)) || { kd: 1.0, threat_centrality: 0 };
            const isTop50 = top50Set.has(pilotKey(oppName));

            const kdGap = (oppStats.kd || 1.0) - (winnerStats.kd || 1.0);
            const threatGap = (oppStats.threat_centrality || 0) - (winnerStats.threat_centrality || 0);

            if (isTop50 && (kdGap > 0.1 || threatGap > 10)) {
                const score = Math.max(kdGap * 50, threatGap);
                if (score > maxUpsetScore) {
                    maxUpsetScore = score;
                    biggestUpset = {
                        gameId: m.id,
                        map: arena,
                        winner: winnerName,
                        winnerKd: Number((winnerStats.kd || 1.0).toFixed(2)),
                        defeated: oppName,
                        defeatedKd: Number((oppStats.kd || 1.0).toFixed(2)),
                        winnerKills: winner.kills || 0,
                        defeatedKills: opp.kills || 0,
                        copy: `Upset of the night: ${winnerName} (KD ${(winnerStats.kd || 1.0).toFixed(2)}) conquered top contender ${oppName} (KD ${(oppStats.kd || 1.0).toFixed(2)}) on ${arena}.`
                    };
                }
            }
        }
    }

    if (!biggestUpset) {
        biggestUpset = {
            gameId: headlineBout?.gameId || matches[0].id,
            map: headlineBout?.map || matches[0].settings?.level || 'Unknown Map',
            copy: `The heavyweights held serve — ranked favorites held their ground with no major upsets recorded.`
        };
    }

    // 3. Biggest Blowout and 4. Closest Finish
    let biggestBlowout = null;
    let maxDifferential = -1;

    let closestFinish = null;
    let minMargin = 999999;
    let closestFinishFrags = -1;

    for (const m of matches) {
        const result = winnerOf(m);
        const [first, second] = result.ranking;
        if (!first || !second) continue;

        const arena = m.settings?.level || 'Unknown Map';
        // A tie lists the tied sides in score-table order; margin 0 makes the copy a draw.
        const margin = first.score - second.score;
        const winnerName = sideLabel(result, first);
        const runnerUpName = sideLabel(result, second);
        const scoreStr = result.team ? `${first.score} - ${second.score}` : `${first.score} K vs ${second.score} K`;
        let matchFrags = 0;
        for (const p of m.players || []) matchFrags += netKills(p);

        // Blowout check
        if (margin > maxDifferential) {
            maxDifferential = margin;
            biggestBlowout = {
                gameId: m.id,
                map: arena,
                differential: margin,
                winner: winnerName,
                runnerUp: runnerUpName,
                score: scoreStr,
                copy: `Total domination on ${arena}: ${winnerName} blew past ${runnerUpName} with a +${margin} kill differential (${scoreStr}).`
            };
        }

        // Closest finish check (smallest margin, tiebreak: higher frags)
        if (margin < minMargin || (margin === minMargin && matchFrags > closestFinishFrags)) {
            minMargin = margin;
            closestFinishFrags = matchFrags;
            closestFinish = {
                gameId: m.id,
                map: arena,
                margin,
                winner: winnerName,
                runnerUp: runnerUpName,
                score: scoreStr,
                copy: margin === 0
                    ? `Dead heat on ${arena}: ${winnerName} and ${runnerUpName} battled to an exact draw (${scoreStr}).`
                    : `Down to the wire on ${arena}: ${winnerName} edged out ${runnerUpName} by just ${margin} ${margin === 1 ? 'kill' : 'kills'} (${scoreStr}).`
            };
        }
    }

    // 5. Hottest Arena: most matches that night (tiebreak: most frags)
    const arenaMap = new Map();
    for (const m of matches) {
        const arena = m.settings?.level || 'Unknown Map';
        if (!arenaMap.has(arena)) {
            arenaMap.set(arena, { count: 0, frags: 0, topPilot: null, pilotKills: new Map() });
        }
        const aObj = arenaMap.get(arena);
        aObj.count++;
        for (const p of m.players || []) {
            const k = netKills(p);
            aObj.frags += k;
            const key = pilotKey(p.name);
            if (key) {
                const entry = aObj.pilotKills.get(key) || { name: p.name.trim(), kills: 0 };
                entry.kills += k;
                aObj.pilotKills.set(key, entry);
            }
        }
    }

    const sortedArenas = Array.from(arenaMap.entries()).sort((a, b) => {
        if (b[1].count !== a[1].count) return b[1].count - a[1].count;
        return b[1].frags - a[1].frags;
    });

    let hottestArena = null;
    if (sortedArenas.length > 0) {
        const [aName, aData] = sortedArenas[0];
        let aTopPilot = 'Unknown';
        let aTopKills = 0;
        for (const { name, kills } of aData.pilotKills.values()) {
            if (kills > aTopKills) {
                aTopPilot = name;
                aTopKills = kills;
            }
        }
        hottestArena = {
            name: aName,
            matches: aData.count,
            frags: aData.frags,
            topPilot: aTopPilot,
            copy: `Battleground of choice: ${aName} led the night with ${aData.count} matches and ${aData.frags} kills scored.`
        };
    }

    // 6. New Blood: pilots whose first-ever tracked match occurred on targetDate
    const newBloodPilots = [];
    for (const { name } of pilots.values()) {
        const isNew = db.isPilotFirstSeenOnDate ? db.isPilotFirstSeenOnDate(name, targetDate) : false;
        if (isNew) {
            newBloodPilots.push(name);
        }
    }

    const newBlood = {
        pilots: newBloodPilots,
        count: newBloodPilots.length,
        copy: newBloodPilots.length > 0
            ? `${newBloodPilots.slice(0, 3).join(', ')}${newBloodPilots.length > 3 ? ` and ${newBloodPilots.length - 3} others` : ''} entered the ring for their first-ever tracked matches.`
            : `All veterans tonight — zero uninitiated recruits appeared.`
    };

    // 7. Streak Watch: longest single-match kill streak of the night
    let longestStreak = null;
    let maxStreakVal = 0;

    for (const m of matches) {
        const arena = m.settings?.level || 'Unknown Map';
        const kills = Array.isArray(m.kills) ? m.kills : [];

        if (kills.length > 0) {
            const runs = new Map(); // pilotKey -> { name, current, best }
            for (const k of kills) {
                const att = pilotKey(k.attacker);
                const def = pilotKey(k.defender);
                if (att) {
                    const run = runs.get(att) || { name: k.attacker.trim(), current: 0, best: 0 };
                    run.current++;
                    run.best = Math.max(run.best, run.current);
                    runs.set(att, run);
                }
                if (def && runs.has(def)) {
                    runs.get(def).current = 0;
                }
            }
            for (const { name: pilot, best: val } of runs.values()) {
                if (val > maxStreakVal) {
                    maxStreakVal = val;
                    longestStreak = {
                        pilot,
                        streak: val,
                        gameId: m.id,
                        map: arena,
                        copy: `Unstoppable rampage: ${pilot} recorded a ${val}-kill streak on ${arena}.`
                    };
                }
            }
        } else {
            // Fallback estimation from match scoreboard
            for (const p of m.players || []) {
                const pk = netKills(p);
                const pd = Number(p.deaths) || 0;
                const estStreak = Math.min(pk, Math.max(2, Math.ceil(pk / Math.max(1, pd + 1)) * 2));
                if (estStreak > maxStreakVal) {
                    maxStreakVal = estStreak;
                    longestStreak = {
                        pilot: p.name,
                        streak: estStreak,
                        gameId: m.id,
                        map: arena,
                        copy: `Unstoppable rampage: ${p.name} strung together a ${estStreak}-kill streak on ${arena}.`
                    };
                }
            }
        }
    }

    if (!longestStreak && matches.length > 0) {
        const topP = matches[0].players?.[0]?.name || 'Unknown';
        longestStreak = {
            pilot: topP,
            streak: 3,
            gameId: matches[0].id,
            map: matches[0].settings?.level || 'Unknown Map',
            copy: `High-tempo match: ${topP} led the kill feed on ${matches[0].settings?.level || 'Unknown Map'}.`
        };
    }

    const recap = {
        date: targetDate,
        formattedDate: formatFightNightDate(targetDate),
        totalMatches: matchCount,
        totalPilots: uniquePilotCount,
        totalFrags,
        topFragger,
        mostActivePilot,
        headlineBout,
        biggestUpset,
        biggestBlowout,
        closestFinish,
        hottestArena,
        newBlood,
        longestStreak
    };

    // Store in DB
    db.saveFightNightRecap(targetDate, recap);
    console.log(`[FightNight] Generated recap for ${targetDate}: ${matchCount} matches, ${uniquePilotCount} pilots, ${totalFrags} frags.`);
    return recap;
}

/**
 * Checks the last two finished fight-night days for big nights and auto-generates recaps.
 */
export async function checkAndGenerateRecentFightNight() {
    try {
        console.log('[FightNight] Running big night detector...');
        const today = fightNightDay(Date.now());
        // the two fight-night days before today's, which is still running
        for (let daysAgo = 1; daysAgo <= 2; daysAgo++) {
            const dateStr = shiftDay(today, -daysAgo);

            // Fetch games for target date
            const rawGames = db.getGamesForDate ? db.getGamesForDate(dateStr) : [];
            const matches = [];
            const pilotSet = new Set();
            let totalFrags = 0;

            for (const r of rawGames) {
                let d = r.details;
                if (typeof d === 'string') {
                    try { d = JSON.parse(d); } catch (e) { d = {}; }
                }
                matches.push({ id: r.id, date: r.date, ...d });

                if (Array.isArray(d?.players)) {
                    for (const p of d.players) {
                        const key = pilotKey(p?.name);
                        if (!key) continue;
                        pilotSet.add(key);
                        totalFrags += netKills(p);
                    }
                }
            }

            const matchCount = matches.length;
            const uniquePilotCount = pilotSet.size;

            const qualifies = matchCount >= FIGHT_NIGHT_THRESHOLDS.minMatches &&
                (uniquePilotCount >= FIGHT_NIGHT_THRESHOLDS.minPilots || totalFrags >= FIGHT_NIGHT_THRESHOLDS.minFrags);

            // Required verification log line: "fight-night check: X matches, Y pilots — big night: yes/no"
            console.log(`fight-night check: ${matchCount} matches, ${uniquePilotCount} pilots — big night: ${qualifies ? 'yes' : 'no'}`);

            if (qualifies) {
                const existing = db.getFightNightRecapByDate ? db.getFightNightRecapByDate(dateStr) : null;
                if (!existing) {
                    await generateRecapForDate(dateStr);
                } else {
                    console.log(`[FightNight] Recap already recorded for ${dateStr}.`);
                }
            }
        }
    } catch (err) {
        console.error('[FightNight] Error in big night detector:', err.message);
    }
}

// Recaps saved before S14 are keyed by UTC day; since S14 a date names a
// fight-night day (gameParse.js FIGHT_NIGHT_DAY), so the same night would come
// back under a second key. Once per day rule (marked in admin_settings), the
// recaps from the first fight-night day wholly in hot storage (db.hotCutoff)
// to yesterday are rebuilt on fight-night days: every qualifying night, not
// only the latest 10. Today's night may still be running; the detector takes
// it. Each night is saved before the old keys go, so a failure part-way leaves
// the old recaps for the next start to retry. Older recaps stay as they were;
// their matches cannot be re-read. The old key on the first day held the night
// before it, which is outside the rebuild, so that one night is dropped.
const DAY_RULE_SETTING = 'fight_night_day_rule';
const DAY_RULE = `${FIGHT_NIGHT_DAY.timeZone} from ${FIGHT_NIGHT_DAY.startHour}:00`;

// One rebuild at a time: GET /api/fight-nights starts one while the table is empty.
let rebuilding = null;
export function rebuildRecapsForDayRule() {
    rebuilding ??= rebuildRecaps().finally(() => {
        rebuilding = null;
    });
    return rebuilding;
}

async function rebuildRecaps() {
    if (db.getAdminSetting.get(DAY_RULE_SETTING)?.value === DAY_RULE) return;
    const cutoff = db.hotCutoff();
    const edge = fightNightDay(cutoff);
    const first = dayStart(edge) < cutoff ? shiftDay(edge, 1) : edge;
    const today = fightNightDay(Date.now());
    // generateRecapForDate checks the thresholds itself, reading each day once
    const saved = [];
    for (const { day, count } of db.getGameCountsByDate.all()) {
        if (day < first || day >= today || count < FIGHT_NIGHT_THRESHOLDS.minMatches) continue;
        if (await generateRecapForDate(day)) saved.push(day);
        await new Promise(resolve => setImmediate(resolve)); // let requests in between days
    }
    const removed = db.deleteFightNightRecapsSince(first, saved);
    db.setAdminSetting.run(DAY_RULE_SETTING, DAY_RULE);
    console.log(`[FightNight] Days now count ${DAY_RULE}: saved ${saved.length} recaps from ${first}, removed ${removed} others.`);
}

/**
 * Initializes Fight Night recaps: ensures table exists, and backfills recent qualified nights if empty.
 */
export async function initializeFightNights() {
    try {
        await rebuildRecapsForDayRule();
        const existing = db.getFightNightRecaps ? db.getFightNightRecaps(1) : [];
        if (existing && existing.length > 0) {
            console.log(`[FightNight] Found ${existing.length} existing recaps. Running daily check...`);
            await checkAndGenerateRecentFightNight();
            return;
        }

        console.log('[FightNight] No recaps in database. Scanning history for qualifying big nights...');
        // Query daily activity from hot database to find big nights
        const dailyCandidates = db.getQualifyingFightNightDates
            ? db.getQualifyingFightNightDates(FIGHT_NIGHT_THRESHOLDS)
            : [];

        console.log(`[FightNight] Discovered ${dailyCandidates.length} historical big nights.`);
        for (const dateStr of dailyCandidates.slice(0, 10)) { // Generate top 10 most recent
            await generateRecapForDate(dateStr, true);
        }
    } catch (err) {
        console.error('[FightNight] Error initializing fight nights:', err.message);
    }
}

export default {
    FIGHT_NIGHT_THRESHOLDS,
    generateRecapForDate,
    checkAndGenerateRecentFightNight,
    initializeFightNights,
    rebuildRecapsForDayRule
};
