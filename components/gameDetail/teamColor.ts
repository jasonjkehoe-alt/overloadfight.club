// Text colour for a team's name or score on the match page.
export const teamColor = (team?: string | null) =>
    team === 'BLUE' ? 'text-blue-400' : team === 'ORANGE' ? 'text-orange-400' : 'text-white';
