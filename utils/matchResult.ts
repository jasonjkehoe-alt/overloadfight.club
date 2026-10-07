// The match page's wording for a winnerOf() result (server/lib/gameParse.js).

export interface MatchResult {
    team: boolean;
    ranking: { side: string; name: string; score: number }[];
    winners: string[];
}

// "A", "A and B", "A, B and C"
const listNames = (names: string[]) =>
    names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : names.join('');

// One sentence on how the match ended.
export const resultLine = ({ team, ranking, winners }: MatchResult): string => {
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
};
