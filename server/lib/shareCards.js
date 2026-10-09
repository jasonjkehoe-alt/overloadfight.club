// The share cards (S19): what the PNG behind a page's og:image says, and the
// page's og:description, built from one object so the two cannot disagree.
// Each builder takes rows the page already reads (server/pageMeta.js) and
// returns null when there is nothing to show; the rules are gameParse.js's and
// the words matchResult.js's. cardLayout.js draws the object.
import { createHash } from 'node:crypto';
import { VERDICT_LABEL, fightNightDay, measuredDurationOf, verdictOf, winnerOf } from './gameParse.js';
import { clock, count, dayLabel, plural, ratingStanding, resultLine } from './matchResult.js';
import { urlFor } from './siteRoutes.js';

/**
 * @typedef {{ label: string, value: string, note?: string }} CardStat
 * @typedef {{ file: string, mtime: number }} CardImage a cached image and when it was written
 * @typedef {{ path: string, kind: string, title: string, line: string,
 *   stats: CardStat[], description: string, image?: CardImage }} Card
 */

/**
 * A pilot: matches and kills (the leaderboard's all-time row), the rating and
 * where it stands, the career Combat Ratio and the last match's day.
 * @param {string} param the name as the URL has it
 * @param {object} summary db.getPilotSummary
 * @param {object} rating db.getPilotRating
 * @param {object | null} cached db.getPilotPPI, the pilot_stats_cache row
 * @returns {Card}
 */
export function pilotCard(param, summary, rating, cached) {
    // null for a date that does not parse
    const last = fightNightDay(summary.lastSeen);
    const stats = [
        { label: 'Matches', value: count(summary.games) },
        { label: 'Kills', value: count(summary.kills) }
    ];
    if (rating?.matches > 0) stats.push({ label: 'Rating', value: String(Math.round(rating.rating)), note: ratingStanding(rating) });
    // the profile's Combat Ratio card: the career number from the stats cache
    if (cached?.kda != null) stats.push({ label: 'Combat Ratio', value: Math.max(0, cached.kda).toFixed(2) });
    return {
        path: urlFor('pilot', param),
        kind: 'Pilot',
        title: summary.name,
        line: last ? `Last match ${dayLabel(last)}` : '',
        stats,
        description: `${summary.name}: ${plural(summary.games, 'match', 'matches')}, ${plural(summary.kills, 'kill', 'kills')}${last ? `, last match ${last}` : ''}.`
    };
}

/**
 * A match: the map, the result line, the mode, the measured length, the
 * verdict and the fight-night day.
 * @param {number} id
 * @param {object} game the stored details
 * @returns {Card}
 */
export function matchCard(id, game) {
    const { matchMode, level } = game.settings || {};
    const seconds = measuredDurationOf(game);
    const result = winnerOf(game);
    const verdict = verdictOf(result);
    const day = fightNightDay(game.date);
    const where = [matchMode, level && `on ${level}`].filter(Boolean).join(' ');
    const detail = where ? `${where}${seconds ? `, ${clock(seconds)}` : ''}.` : '';
    const stats = [
        matchMode && { label: 'Mode', value: matchMode },
        seconds > 0 && { label: 'Length', value: clock(seconds) },
        verdict && { label: 'Verdict', value: VERDICT_LABEL[verdict] },
        day && { label: 'Played', value: dayLabel(day) }
    ].filter(Boolean);
    return {
        path: urlFor('game-detail', id),
        kind: `Match ${id}`,
        title: level || 'Unknown map',
        line: resultLine(result),
        stats,
        description: [resultLine(result), detail].filter(Boolean).join(' ')
    };
}

/**
 * A fight night: the saved recap's day, matches, pilots, kills and most kills.
 * @param {object} recap a saved recap
 * @returns {Card | null}
 */
export function fightNightCard(recap) {
    if (!recap) return null;
    const top = recap.topFragger?.name && recap.topFragger.kills > 0 ? recap.topFragger : null;
    const stats = [
        { label: 'Matches', value: count(recap.totalMatches) },
        { label: 'Pilots', value: count(recap.totalPilots) },
        { label: 'Kills', value: count(recap.totalFrags) }
    ];
    if (top) stats.push({ label: 'Most kills', value: top.name, note: plural(top.kills, 'kill', 'kills') });
    const totals = `${plural(recap.totalMatches, 'match', 'matches')}, ${plural(recap.totalPilots, 'pilot', 'pilots')}`;
    return {
        path: urlFor('fight-night', recap.date),
        kind: 'Fight Night',
        title: recap.formattedDate,
        line: `${totals}, ${plural(recap.totalFrags, 'kill', 'kills')}.`,
        stats,
        description: `${recap.formattedDate}: ${totals}${top ? `, most kills ${top.name} (${count(top.kills)})` : ''}.`
    };
}

/**
 * A map: its name and author, the matches and kills on it, the matches in the
 * last 30 days and its top pilot, as the map popup shows them, with its image
 * when one is cached on disk.
 * @param {object} intel db.getMapIntel
 * @param {CardImage | null} image the cached image
 * @returns {Card}
 */
export function mapCard(intel, image) {
    const author = intel.author && intel.author !== 'Unknown' ? intel.author : null;
    const top = intel.topPilot?.name ? intel.topPilot : null;
    const stats = [
        { label: 'Matches', value: count(intel.sorties) },
        { label: 'Kills', value: count(intel.totalKills) },
        { label: 'Last 30 days', value: count(intel.recent30d), note: intel.recent30d === 1 ? 'match' : 'matches' }
    ];
    if (top) stats.push({ label: 'Top pilot', value: top.name, note: plural(top.kills, 'kill', 'kills') });
    const by = author ? ` by ${author}` : '';
    return {
        // the server reads an all-digit name as a map id, so such a map is named by its id
        path: urlFor('maps', /^\d+$/.test(intel.name) && intel.id ? intel.id : intel.name),
        kind: 'Map',
        title: intel.name,
        line: author ? `Made by ${author}` : 'Overload map',
        stats,
        description: `${intel.name}${by}: ${plural(intel.sorties, 'match', 'matches')}, ${plural(intel.totalKills, 'kill', 'kills')}${top ? `, top pilot ${top.name}` : ''}.`,
        ...(image ? { image } : {})
    };
}

// A short hash of everything the card shows, so its URL and its place in the
// cache change when, and only when, its words or numbers do.
export const cardKey = card => createHash('sha1').update(JSON.stringify(card)).digest('hex').slice(0, 12);

// "/api/card/pilot/WD-40?v=3f2a9c1b04de": the card's PNG for the page at card.path.
export const cardUrl = (card, key = cardKey(card)) => `/api/card${card.path}?v=${key}`;
