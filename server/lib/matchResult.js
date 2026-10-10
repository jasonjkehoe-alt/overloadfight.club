// The wording for a winnerOf() result (gameParse.js), shared by the match page
// (utils/matchResult.ts) and the match's share preview (server/pageMeta.js).
import { MATCH_MODES, RATING } from './gameParse.js';

// m:ss for a number of seconds, 0:00 for anything below zero
export const clock = seconds => {
    const s = Math.max(0, Math.floor(seconds));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

// "1,234" for a count, and "1 match" or "2 matches" with its noun
export const count = n => Number(n || 0).toLocaleString('en-US');
export const plural = (n, one, many) => `${count(n)} ${n === 1 ? one : many}`;

// "98.9%" for a share (0 to 1), to `places` decimals
export const percent = (share, places = 0) => `${(share * 100).toFixed(places)}%`;

// Labels for a day (YYYY-MM-DD, a fight-night day) or a month (YYYY-MM), the
// same in every viewer's time zone: read at noon UTC and formatted in UTC. The
// formatters are made once; the activity calendar labels 371 days.
const formatter = options => new Intl.DateTimeFormat('en-US', { ...options, timeZone: 'UTC' });
const dayFormat = formatter({ weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
const monthFormat = formatter({ month: 'short', year: 'numeric' });
const monthNameFormat = formatter({ month: 'short' });
// "Sun, Oct 4, 2026"
export const dayLabel = day => dayFormat.format(Date.parse(`${day}T12:00:00Z`));
// "Oct 2026"
export const monthLabel = month => monthFormat.format(Date.parse(`${month}-15T12:00:00Z`));
// "Oct" for the month a day is in
export const monthName = day => monthNameFormat.format(Date.parse(`${day}T12:00:00Z`));

// "A", "A and B", "A, B and C"
const listNames = names =>
    names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : names.join('');

/**
 * One sentence on how the match ended.
 * @param {ReturnType<typeof import('./gameParse.js').winnerOf>} result
 * @returns {string}
 */
export function resultLine({ team, ranking, winners }) {
    // winnerOf needs two sides with a score to call a result
    if (winners.length === 0) return 'No result: this match has no scores to compare.';
    const top = ranking.slice(0, winners.length);
    const names = listNames(top.map(r => r.name));
    if (winners.length > 1) {
        return team
            ? `${names} draw, ${top.map(r => r.score).join('–')}.`
            : `${names} tie for first on ${top[0].score}.`;
    }
    const [first, second] = ranking;
    return team
        ? `${first.name} wins ${first.score}–${second.score}.`
        : `${first.name} wins on ${first.score}, ${first.score - second.score} ahead of ${second.name}.`;
}

// A count for a narrow table cell: 10,000 and up in thousands, 12,345 as "12k" (S17).
export const shortCount = n => (n >= 10000 ? `${Math.round(n / 1000)}k` : n.toLocaleString());

/**
 * Where a pilot stands in the power rankings, or why they are not in them
 * (rankStatus in gameParse.js): the rating card's words and the share card's.
 * @param {{ status: string | null, rank: number | null, matches: number }} rating db.getPilotRating
 * @returns {string}
 */
export function ratingStanding({ status, rank, matches }) {
    if (status === 'provisional') return `Provisional: ${matches} of ${RATING.rankedAfter} rated matches`;
    if (status === 'inactive' || rank === null) return `Not ranked: no rated match in the last ${RATING.activeDays} days`;
    return `#${rank} in the power rankings`;
}

// "CTF" for a MATCH_MODES id, undefined for every mode (S20).
export const modeLabel = mode => MATCH_MODES.find(m => m.id === mode)?.label;
// "ranked CTF match(es)", or "ranked match(es)" for every mode, after `n`.
export const rankedMatches = (n, mode) => {
    const ranked = `ranked ${modeLabel(mode) ? `${modeLabel(mode)} ` : ''}`;
    return plural(n, `${ranked}match`, `${ranked}matches`);
};
// "No ranked CTF match between them yet", without the capital for a sentence's middle.
export const noBouts = (mode, start = 'No') => `${start} ${rankedMatches(1, mode).replace(/^1 /, '')} between them yet`;

// "5–3–1": a record of wins, losses and ties (S20).
export const recordText = ({ wins, losses, ties }) => `${wins}–${losses}–${ties}`;

/**
 * Who leads a head-to-head record read from the first pilot's side, the tape
 * page's words and its share card's (S20): "WD-40 leads 5–3, 1 tie", "Level
 * at 2–2", or null for no match.
 * @param {[string, string]} names the two pilots, the record's side first
 * @param {{ matches: number, wins: number, losses: number, ties: number }} record
 * @returns {string | null}
 */
export function boutLead([a, b], { matches, wins, losses, ties }) {
    if (!matches) return null;
    const tied = ties ? `, ${plural(ties, 'tie', 'ties')}` : '';
    if (wins === losses) return `Level at ${wins}–${losses}${tied}`;
    return wins > losses ? `${a} leads ${wins}–${losses}${tied}` : `${b} leads ${losses}–${wins}${tied}`;
}

// A champion's reign, the belt pages' words and the share cards' (S21):
// "Anarchy champion since Wed, Oct 7, 2026, 3 defenses".
export const championLine = ({ label, since, defenses }) => `${label} champion since ${dayLabel(since)}, ${plural(defenses, 'defense', 'defenses')}`;
// How a belt changed hands (the recap's "New champion"): "Anarchy: WD-40
// took the belt from OKSTER", or "Anarchy: WD-40, the first champion".
export const beltChange = ({ label, name, from }) => (from ? `${label}: ${name} took the belt from ${from.name}` : `${label}: ${name}, the first champion`);
