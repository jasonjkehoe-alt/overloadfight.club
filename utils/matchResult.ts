// The match page's wording for a winnerOf() result (server/lib/gameParse.js).

export interface MatchResult {
    team: boolean;
    ranking: { side: string; name: string; score: number }[];
    winners: string[];
}

// One sentence on how the match ended.
export const resultLine = ({ team, ranking, winners }: MatchResult): string => {
    if (winners.length === 0) return 'No result: the tracker recorded no score for this match.';
    const top = ranking.slice(0, winners.length);
    if (winners.length > 1) {
        return team
            ? `${top.map(r => r.name).join(' and ')} draw, ${top.map(r => r.score).join('–')}.`
            : `${top.map(r => r.name).join(' and ')} tie for first on ${top[0].score}.`;
    }
    const [first, second] = ranking;
    return team
        ? `${first.name} wins ${first.score}–${second.score}.`
        : `${first.name} wins on ${first.score}, ${first.score - second.score} ahead of ${second.name}.`;
};
