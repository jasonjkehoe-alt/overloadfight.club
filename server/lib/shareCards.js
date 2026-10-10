// The share cards (S19): what the PNG behind a page's og:image says, and the
// page's og:description, built from one object so the two cannot disagree.
// Each builder takes rows the page already reads (server/pageMeta.js) and
// returns null when there is nothing to show; the rules are gameParse.js's and
// the words matchResult.js's. cardLayout.js draws the object.
import { createHash } from 'node:crypto';
import { TIER_TOTAL, VERDICT_LABEL, tiersEarned, fightNightDay, measuredDurationOf, verdictOf, winnerOf } from './gameParse.js';
import { boutLead, championLine, clock, count, dayLabel, modeLabel, noBouts, plural, rankedMatches, ratingStanding, recordText, resultLine } from './matchResult.js';
import { urlFor } from './siteRoutes.js';
import { CARD_LAYOUT } from './cardLayout.js';

/**
 * @typedef {{ label: string, value: string, note?: string }} CardStat
 * @typedef {{ file: string, mtime: number }} CardImage a cached image and when it was written
 * @typedef {{ path: string, kind: string, title: string, line: string,
 *   stats: CardStat[], description: string, image?: CardImage }} Card
 */

/**
 * A pilot: matches and kills (counted from every match), the rating and where
 * it stands, the career Combat Ratio, the last match's day and (S21) the
 * belts they hold, or else the achievement tiers they have earned.
 * @param {object} summary db.getPilotSummary
 * @param {object} rating db.getPilotRating
 * @param {object | null} cached db.getPilotPPI, the pilot_stats_cache row
 * @param {object} [honours] db.getPilotAchievements
 * @returns {Card}
 */
export function pilotCard(summary, rating, cached, honours) {
    // null for a date that does not parse
    const last = fightNightDay(summary.lastSeen);
    const stats = [
        { label: 'Matches', value: count(summary.games) },
        { label: 'Kills', value: count(summary.kills) }
    ];
    if (rating?.matches > 0) stats.push({ label: 'Rating', value: String(Math.round(rating.rating)), note: ratingStanding(rating) });
    // the profile's Combat Ratio card: the career number from the stats cache
    if (cached?.kda != null) stats.push({ label: 'Combat Ratio', value: Math.max(0, cached.kda).toFixed(2) });
    const held = honours?.belts.filter(b => !b.until) ?? [];
    const tiers = honours ? tiersEarned(honours.achievements) : 0;
    // two or more belts as a count, the modes in the note, so four fit a tile
    if (held.length === 1) stats.push({ label: 'Belt', value: held[0].label, note: `Since ${dayLabel(held[0].since)}` });
    else if (held.length > 1) stats.push({ label: 'Belts', value: count(held.length), note: held.map(b => b.label).join(', ') });
    else if (tiers > 0) stats.push({ label: 'Achievements', value: count(tiers), note: `of ${TIER_TOTAL} tiers` });
    const belts = held.map(b => ` ${championLine(b)}.`).join('');
    return {
        // the stored name, so every spelling the lookup accepts shares one card
        path: urlFor('pilot', summary.name),
        kind: 'Pilot',
        title: summary.name,
        line: last ? `Last match ${dayLabel(last)}` : '',
        stats,
        description: `${summary.name}: ${plural(summary.games, 'match', 'matches')}, ${plural(summary.kills, 'kill', 'kills')}${last ? `, last match ${last}` : ''}.${belts}`
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
 * last 30 days and its top pilot, with its image when one is cached on disk.
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

/**
 * The Tale of the Tape (S20): the two pilots, the record from the first's side
 * with who leads, the logged kills each way, the duel record and the ratings,
 * each tile "a–b"; for two pilots who never met (in the mode), their ratings
 * and careers side by side.
 * @param {object} tape db.getTape, with both pilots found
 * @returns {Card}
 */
export function tapeCard({ pilots: [a, b], mode, record, logged, duels }) {
    const label = modeLabel(mode);
    const pair = (pick, format = String) => [a, b].map(p => (pick(p) == null ? '—' : format(pick(p)))).join('–');
    const rating = { label: 'Rating', value: pair(p => p.rating.rating, Math.round) };
    const lead = boutLead([a.name, b.name], record);
    const scope = rankedMatches(record.matches, mode);
    const kills = logged.matches > 0 ? `kills ${logged.kills}–${logged.deaths} in ${plural(logged.matches, 'logged match', 'logged matches')}` : '';
    const stats = lead ? [
        { label: 'Record', value: recordText(record), note: 'Wins, losses, ties' },
        kills && { label: 'Kills', value: `${count(logged.kills)}–${count(logged.deaths)}`, note: `In ${plural(logged.matches, 'logged match', 'logged matches')}` },
        duels && { label: '1v1 duels', value: recordText(duels), note: 'Wins, losses, ties' },
        rating
    ] : [
        rating,
        { label: 'Ranked matches', value: pair(p => p.career?.matches, count) },
        { label: 'Combat Ratio', value: pair(p => p.career?.combat_ratio, n => n.toFixed(2)) },
        { label: 'Win rate', value: pair(p => p.career?.win_rate, n => `${n}%`) }
    ];
    return {
        // the stored names, so every spelling of the pair shares one card
        path: `${urlFor('tape', a.name, b.name)}${mode ? `?mode=${encodeURIComponent(mode)}` : ''}`,
        kind: label ? `Tale of the Tape, ${label}` : 'Tale of the Tape',
        title: `${a.name} vs ${b.name}`,
        line: lead ? `${lead} in ${scope}.` : `${noBouts(mode)}.`,
        stats: stats.filter(Boolean),
        description: `${a.name} vs ${b.name}: ${lead ? `${lead} in ${scope}${kills ? `, ${kills}` : ''}` : noBouts(mode, 'no')}.`
    };
}

/**
 * The belts (S21): each mode's champion, held since when and how many
 * defenses; null while no mode has one.
 * @param {object} belts db.getBelts
 * @returns {Card | null}
 */
export function beltsCard({ modes }) {
    const held = modes.filter(m => m.holder);
    if (held.length === 0) return null;
    return {
        path: urlFor('belts'),
        kind: 'Belts',
        title: 'Champions',
        line: 'One belt per mode, held until the champion loses.',
        stats: held.map(({ label, holder }) => ({ label, value: holder.name, note: `${plural(holder.days, 'day', 'days')}, ${plural(holder.defenses, 'defense', 'defenses')}` })),
        description: `Champions: ${held.map(({ label, holder }) => `${label} ${holder.name} (since ${holder.since}, ${plural(holder.defenses, 'defense', 'defenses')})`).join(', ')}.`
    };
}

// A short hash of everything the card shows and the layout's version, so its
// URL and its place in the cache change when, and only when, its words, its
// numbers or its look do.
export const cardKey = card => createHash('sha1').update(JSON.stringify([CARD_LAYOUT, card])).digest('hex').slice(0, 12);

// "/api/card/pilot/WD-40?v=3f2a9c1b04de": the card's PNG for the page at
// card.path (whose query, a tape's ?mode=, the card route reads too).
export const cardUrl = (card, key = cardKey(card)) => `/api/card${card.path}${card.path.includes('?') ? '&' : '?'}v=${key}`;
