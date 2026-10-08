// The wording for a winnerOf() result (gameParse.js), shared by the match page
// (utils/matchResult.ts) and the match's share preview (server/pageMeta.js).

// m:ss for a number of seconds, 0:00 for anything below zero
export const clock = seconds => {
    const s = Math.max(0, Math.floor(seconds));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

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
