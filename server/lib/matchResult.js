// The wording for a winnerOf() result (gameParse.js), shared by the match page
// (utils/matchResult.ts) and the match's share preview (server/pageMeta.js).

// m:ss for a number of seconds, 0:00 for anything below zero
export const clock = seconds => {
    const s = Math.max(0, Math.floor(seconds));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

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
