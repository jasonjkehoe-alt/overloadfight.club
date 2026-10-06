import db from '../db.js';

export const FIGHT_NIGHT_THRESHOLDS = {
    minMatches: 16,    // ≥ 16 matches in the 24h window
    minPilots: 14,     // AND (≥ 14 unique pilots
    minFrags: 1600     //      OR ≥ 1600 total frags)
};

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
    const pilotMatches = new Map();
    const pilotFrags = new Map();
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
                if (!p?.name) continue;
                const pName = p.name.trim();
                const kills = Number(p.kills) || 0;
                totalFrags += kills;

                pilotMatches.set(pName, (pilotMatches.get(pName) || 0) + 1);
                pilotFrags.set(pName, (pilotFrags.get(pName) || 0) + kills);
            }
        }
    }

    const uniquePilotCount = pilotMatches.size;
    const matchCount = matches.length;

    // Check thresholds unless forced
    const qualifies = matchCount >= FIGHT_NIGHT_THRESHOLDS.minMatches &&
        (uniquePilotCount >= FIGHT_NIGHT_THRESHOLDS.minPilots || totalFrags >= FIGHT_NIGHT_THRESHOLDS.minFrags);

    if (!qualifies && !force) {
        return null;
    }

    // Top Fragger & Most Active Pilot
    let topFragger = { name: 'Unknown', kills: 0 };
    for (const [name, kills] of pilotFrags.entries()) {
        if (kills > topFragger.kills) topFragger = { name, kills };
    }

    let mostActivePilot = { name: 'Unknown', matches: 0 };
    for (const [name, count] of pilotMatches.entries()) {
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
        for (const p of players) boutFrags += (Number(p.kills) || 0);

        if (pCount > maxPilots || (pCount === maxPilots && boutFrags > maxBoutFrags)) {
            maxPilots = pCount;
            maxBoutFrags = boutFrags;

            const sortedP = players.slice().sort((a, b) => (Number(b.kills) || 0) - (Number(a.kills) || 0));
            const topPilot = sortedP[0]?.name || 'Unknown';
            const topKills = sortedP[0]?.kills || 0;
            const arena = m.settings?.level || 'Unknown Arena';
            const mode = m.settings?.matchMode || 'ANARCHY';

            headlineBout = {
                gameId: m.id,
                map: arena,
                matchMode: mode,
                pilotCount: pCount,
                totalFrags: boutFrags,
                topPilot,
                topKills,
                copy: `In the headline bout on ${arena}, ${pCount} pilots traded fire in a ${mode} slugfest with ${boutFrags} total frags.`
            };
        }
    }

    // 2. Biggest Upset: lowest pre-match Threat / KD pilot defeating top-50 pilot
    // Pre-load pilot stats from cache
    const pilotStatsMap = new Map();
    const statsRows = db.getAllCachedPilotStats ? db.getAllCachedPilotStats() : [];
    for (const s of statsRows) {
        pilotStatsMap.set(s.name.toLowerCase(), s);
    }

    // Top 50 by threat_centrality (or KD fallback)
    const sortedTop50 = statsRows.slice().sort((a, b) => (b.threat_centrality || 0) - (a.threat_centrality || 0)).slice(0, 50);
    const top50Set = new Set(sortedTop50.map(s => s.name.toLowerCase()));

    let biggestUpset = null;
    let maxUpsetScore = -1;

    for (const m of matches) {
        const players = (m.players || []).slice().sort((a, b) => (Number(b.kills) || 0) - (Number(a.kills) || 0));
        if (players.length < 2) continue;

        const winner = players[0];
        const winnerName = winner.name;
        const winnerStats = pilotStatsMap.get(winnerName.toLowerCase()) || { kd: 1.0, threat_centrality: 0 };
        const arena = m.settings?.level || 'Unknown Arena';

        for (let i = 1; i < players.length; i++) {
            const opp = players[i];
            const oppName = opp.name;
            const oppStats = pilotStatsMap.get(oppName.toLowerCase()) || { kd: 1.0, threat_centrality: 0 };
            const isTop50 = top50Set.has(oppName.toLowerCase());

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
            map: headlineBout?.map || matches[0].settings?.level || 'Unknown Arena',
            copy: `The heavyweights held serve — ranked favorites controlled the arena with no major upsets recorded.`
        };
    }

    // 3. Biggest Blowout and 4. Closest Finish
    let biggestBlowout = null;
    let maxDifferential = -1;

    let closestFinish = null;
    let minMargin = 999999;
    let closestFinishFrags = -1;

    for (const m of matches) {
        const players = (m.players || []).slice().sort((a, b) => (Number(b.kills) || 0) - (Number(a.kills) || 0));
        if (players.length < 2) continue;

        const mode = (m.settings?.matchMode || '').toUpperCase();
        const isTeam = mode.includes('TEAM') || mode === 'CTF';
        const arena = m.settings?.level || 'Unknown Arena';

        let margin = 0;
        let winnerName = '';
        let runnerUpName = '';
        let scoreStr = '';
        let matchFrags = 0;
        for (const p of players) matchFrags += (Number(p.kills) || 0);

        if (isTeam && m.teamScore) {
            const blue = Number(m.teamScore.BLUE) || 0;
            const red = Number(m.teamScore.RED ?? m.teamScore.ORANGE) || 0;
            margin = Math.abs(blue - red);
            if (blue >= red) {
                winnerName = 'Blue Team';
                runnerUpName = 'Orange Team';
                scoreStr = `${blue} - ${red}`;
            } else {
                winnerName = 'Orange Team';
                runnerUpName = 'Blue Team';
                scoreStr = `${red} - ${blue}`;
            }
        } else {
            const k1 = Number(players[0].kills) || 0;
            const k2 = Number(players[1].kills) || 0;
            margin = k1 - k2;
            winnerName = players[0].name;
            runnerUpName = players[1].name;
            scoreStr = `${k1} K vs ${k2} K`;
        }

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
                copy: `Total domination on ${arena}: ${winnerName} blew past ${runnerUpName} with a +${margin} frag differential (${scoreStr}).`
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
                    : `Down to the wire on ${arena}: ${winnerName} edged out ${runnerUpName} by just ${margin} frag (${scoreStr}).`
            };
        }
    }

    // 5. Hottest Arena: most matches that night (tiebreak: most frags)
    const arenaMap = new Map();
    for (const m of matches) {
        const arena = m.settings?.level || 'Unknown Arena';
        if (!arenaMap.has(arena)) {
            arenaMap.set(arena, { count: 0, frags: 0, topPilot: null, pilotKills: new Map() });
        }
        const aObj = arenaMap.get(arena);
        aObj.count++;
        for (const p of m.players || []) {
            const k = Number(p.kills) || 0;
            aObj.frags += k;
            if (p.name) {
                aObj.pilotKills.set(p.name, (aObj.pilotKills.get(p.name) || 0) + k);
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
        for (const [p, k] of aData.pilotKills.entries()) {
            if (k > aTopKills) {
                aTopPilot = p;
                aTopKills = k;
            }
        }
        hottestArena = {
            name: aName,
            matches: aData.count,
            frags: aData.frags,
            topPilot: aTopPilot,
            copy: `Battleground of choice: ${aName} led the night with ${aData.count} bouts and ${aData.frags} frags scored.`
        };
    }

    // 6. New Blood: pilots whose first-ever tracked match occurred on targetDate
    const newBloodPilots = [];
    for (const pName of pilotMatches.keys()) {
        const isNew = db.isPilotFirstSeenOnDate ? db.isPilotFirstSeenOnDate(pName, targetDate) : false;
        if (isNew) {
            newBloodPilots.push(pName);
        }
    }

    const newBlood = {
        pilots: newBloodPilots,
        count: newBloodPilots.length,
        copy: newBloodPilots.length > 0
            ? `${newBloodPilots.slice(0, 3).join(', ')}${newBloodPilots.length > 3 ? ` and ${newBloodPilots.length - 3} others` : ''} entered the ring for their first-ever tracked matches.`
            : `All veterans in the combat zone — zero uninitiated recruits appeared tonight.`
    };

    // 7. Streak Watch: longest single-match kill streak of the night
    let longestStreak = null;
    let maxStreakVal = 0;

    for (const m of matches) {
        const arena = m.settings?.level || 'Unknown Arena';
        const kills = Array.isArray(m.kills) ? m.kills : [];

        if (kills.length > 0) {
            const current = {};
            const streaks = {};
            for (const k of kills) {
                const att = k.attacker?.trim();
                const def = k.defender?.trim();
                if (att) {
                    current[att] = (current[att] || 0) + 1;
                    streaks[att] = Math.max(streaks[att] || 0, current[att]);
                }
                if (def) {
                    current[def] = 0;
                }
            }
            for (const [pilot, val] of Object.entries(streaks)) {
                if (val > maxStreakVal) {
                    maxStreakVal = val;
                    longestStreak = {
                        pilot,
                        streak: val,
                        gameId: m.id,
                        map: arena,
                        copy: `Unstoppable rampage: ${pilot} recorded a ${val}-frag kill streak on ${arena}.`
                    };
                }
            }
        } else {
            // Fallback estimation from match scoreboard
            for (const p of m.players || []) {
                const pk = Number(p.kills) || 0;
                const pd = Number(p.deaths) || 0;
                const estStreak = Math.min(pk, Math.max(2, Math.ceil(pk / Math.max(1, pd + 1)) * 2));
                if (estStreak > maxStreakVal) {
                    maxStreakVal = estStreak;
                    longestStreak = {
                        pilot: p.name,
                        streak: estStreak,
                        gameId: m.id,
                        map: arena,
                        copy: `Unstoppable rampage: ${p.name} strung together a ${estStreak}-frag kill streak on ${arena}.`
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
            map: matches[0].settings?.level || 'Unknown Arena',
            copy: `High-tempo engagement: ${topP} led the kill feed on ${matches[0].settings?.level || 'Unknown Arena'}.`
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
 * Checks the last 24h-48h for big nights and auto-generates recaps.
 */
export async function checkAndGenerateRecentFightNight() {
    try {
        console.log('[FightNight] Running big night detector...');
        const now = new Date();
        // Check yesterday and day before yesterday
        for (let daysAgo = 1; daysAgo <= 2; daysAgo++) {
            const dt = new Date(now.getTime() - daysAgo * 86400000);
            const dateStr = dt.toISOString().substring(0, 10);

            // Skip if recap already exists
            const existing = db.getFightNightRecapByDate ? db.getFightNightRecapByDate(dateStr) : null;
            if (existing) continue;

            await generateRecapForDate(dateStr);
        }
    } catch (err) {
        console.error('[FightNight] Error in big night detector:', err.message);
    }
}

/**
 * Initializes Fight Night recaps: ensures table exists, and backfills recent qualified nights if empty.
 */
export async function initializeFightNights() {
    try {
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
    initializeFightNights
};
