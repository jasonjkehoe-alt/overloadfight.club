// belt_reigns and pilot_achievements rows (S21): one pass over every stored
// match in the stats worker's scan (server/statsWorker.js), kept per match and
// replayed in date order once every game has been read, so each tier is
// earned on the match whose count first passes it and Boss Slayer knows who
// held the belt at the time. The rules are gameParse.js's; tier dating, the
// streak runs and the anniversary's years are worked out here.
import {
    ACHIEVEMENTS, ACHIEVEMENT_BY_ID, beltMatch, beltStep, clutchOf, duelMatch, durationOf, fightNightDay, hasDate, inDateOrder,
    killStreaksOf, netKills, outcomeOf, pilotKey, rankedMatch, sideOutcome, tierOf, winnerOf
} from './gameParse.js';

const zeros = () => Object.fromEntries(ACHIEVEMENTS.map(a => [a.id, 0]));

// Whole years from fight-night day `from` to `to` (YYYY-MM-DD), and the day a
// number of years after `from` (29 February rolls to 1 March).
const yearsBetween = (from, to) => {
    const years = Number(to.slice(0, 4)) - Number(from.slice(0, 4));
    return to.slice(5) >= from.slice(5) ? years : years - 1;
};
const yearsAfter = (from, years) => {
    const d = new Date(`${from}T00:00:00Z`);
    d.setUTCFullYear(d.getUTCFullYear() + years);
    return d.toISOString().slice(0, 10);
};

// `today` is today's fight-night day, for the anniversary.
export function achievementPass(today) {
    const entries = [];
    // pilotKey -> { name, date }: the spelling of the latest ranked match, as
    // pilot_stats_cache keeps it, else of the first stored one
    const names = new Map();
    // pilotKey -> the date of the first stored match
    const firsts = new Map();

    function add(row, g) {
        if (!g || !Array.isArray(g.players)) return;
        const date = row.date || g.date || '';
        for (const p of g.players) {
            const key = pilotKey(p?.name);
            if (!key) continue;
            if (!names.has(key)) names.set(key, { name: String(p.name).trim(), date: '' });
            // the stored dates are UTC ISO strings, so they compare as text
            if (hasDate(date) && (!firsts.has(key) || date < firsts.get(key))) firsts.set(key, date);
        }
        if (!rankedMatch(g, durationOf(g))) return;
        const result = winnerOf(g);
        // every listing, as pilotPass() counts the career cards' rows
        const players = [];
        for (const p of g.players) {
            const key = pilotKey(p?.name);
            if (!key) continue;
            players.push({ key, kills: netKills(p), outcome: outcomeOf(g, p, result) });
            const seen = names.get(key);
            if (date && (!seen || date > seen.date)) names.set(key, { name: p.name.trim(), date });
        }
        // the clutch kills as counts per pilot: every kill of a match earns on that match
        const clutch = clutchOf(g);
        const feats = new Map();
        for (const k of clutch?.kills ?? []) {
            if (!k.late && !k.trailing) continue;
            const key = pilotKey(k.attacker);
            const f = feats.get(key) ?? feats.set(key, { late: 0, trailing: 0 }).get(key);
            f.late += k.late;
            f.trailing += k.trailing;
        }
        const duel = duelMatch(g);
        entries.push({
            id: row.id,
            date,
            day: fightNightDay(date) ?? '',
            players,
            firstBlood: clutch?.firstBlood ? pilotKey(clutch.firstBlood) : null,
            feats: [...feats],
            streaks: [...killStreaksOf(g)],
            belt: beltMatch(g),
            duel: duel && duel.map((s, i) => [s.pilots[0].key, sideOutcome(s, duel[1 - i])])
        });
    }

    let built = null;
    function replay() {
        if (built) return built;
        const state = new Map();
        const pilot = key => state.get(key) ?? state.set(key, { counts: zeros(), earned: new Map(), nights: new Set(), runs: { win: 0, duel: 0 } }).get(key);
        // a count's new value, and the tier it reaches earned on this match
        const set = (key, id, value, entry) => {
            const s = pilot(key);
            s.counts[id] = value;
            const tier = tierOf(ACHIEVEMENT_BY_ID.get(id), value);
            if (tier > (s.earned.get(id)?.tier ?? 0)) s.earned.set(id, { tier, earned: entry.day, game: entry.id });
        };
        const add = (key, id, n, entry) => set(key, id, pilot(key).counts[id] + n, entry);
        const best = (key, id, value, entry) => value > pilot(key).counts[id] && set(key, id, value, entry);
        const run = (key, kind, id, outcome, entry) => {
            const s = pilot(key);
            if (outcome === 'win') best(key, id, ++s.runs[kind], entry);
            else if (outcome) s.runs[kind] = 0;
        };

        const holders = new Map();
        const reigns = [];
        // dated matches in the rating's order (inDateOrder); an undated one
        // still counts, first, with no day
        const ordered = [...entries.filter(e => !hasDate(e.date)).sort((a, b) => a.id - b.id), ...inDateOrder(entries)];
        for (const entry of ordered) {
            const once = new Set();
            for (const { key, kills, outcome } of entry.players) {
                add(key, 'matches', 1, entry);
                add(key, 'kills', kills, entry);
                if (outcome === 'win') add(key, 'wins', 1, entry);
                const s = pilot(key);
                if (entry.day && !s.nights.has(entry.day)) {
                    s.nights.add(entry.day);
                    add(key, 'nights', 1, entry);
                }
                // a pilot listed twice runs their streak once
                if (!once.has(key)) run(key, 'win', 'win_streak', outcome, entry);
                once.add(key);
            }
            if (entry.firstBlood) add(entry.firstBlood, 'first_bloods', 1, entry);
            for (const [key, { late, trailing }] of entry.feats) {
                if (late) add(key, 'late_kills', late, entry);
                if (trailing) add(key, 'trailing_kills', trailing, entry);
            }
            for (const [key, streak] of entry.streaks) best(key, 'kill_streak', streak, entry);
            for (const [key, outcome] of entry.duel ?? []) run(key, 'duel', 'duel_streak', outcome, entry);
            if (entry.belt && hasDate(entry.date)) {
                const { won, defended, slayers } = beltStep(holders, reigns, { id: entry.id, date: entry.date, ...entry.belt });
                if (won) add(won.pilot, 'belts', 1, entry);
                if (defended) add(defended.pilot, 'defenses', 1, entry);
                for (const key of slayers) add(key, 'boss_slayer', 1, entry);
            }
        }
        // the anniversary: whole years since the first stored match, each
        // tier earned on its day
        const years = ACHIEVEMENT_BY_ID.get('years');
        for (const [key, date] of firsts) {
            const first = fightNightDay(date);
            const n = first && today >= first ? yearsBetween(first, today) : 0;
            if (n <= 0) continue;
            const s = pilot(key);
            s.counts.years = n;
            const tier = tierOf(years, n);
            if (tier > 0) s.earned.set('years', { tier, earned: yearsAfter(first, years.tiers[tier - 1]), game: 0 });
        }
        built = { state, reigns };
        return built;
    }

    const nameOf = key => names.get(key)?.name ?? key;
    return {
        add,
        reigns: () => replay().reigns.map(r => ({ ...r, name: nameOf(r.pilot) })),
        achievements: () => [...replay().state].flatMap(([key, s]) => ACHIEVEMENTS.filter(a => s.counts[a.id] > 0).map(a => {
            const earned = s.earned.get(a.id);
            return { pilot: key, achievement: a.id, name: nameOf(key), value: s.counts[a.id], tier: earned?.tier ?? 0, earned: earned?.earned ?? '', game: earned?.game ?? 0 };
        }))
    };
}
