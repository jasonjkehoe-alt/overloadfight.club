import { RANKED } from '../../server/lib/gameParse.js';

// What every rivalry number counts (S17): the owner's rules at its start.
export const LOGGED_ONLY = `Ranked matches (${RANKED.pilots}+ pilots, ${RANKED.seconds} s or more) whose kill or damage log the tracker kept; kills and damage on opponents only (no suicides, team kills, self-damage or damage to a teammate). A match without a log adds nothing.`;

// A count for a narrow cell: 12,345 and up as "12k".
export const shortCount = (n: number) => (n >= 10000 ? `${Math.round(n / 1000)}k` : n.toLocaleString());

// A pair from the side with more kills (ties keep the stored order).
export const leaderFirst = <T extends { name: string; opponent_name: string; kills: number; deaths: number; damage_dealt: number; damage_taken: number }>(p: T) =>
    p.deaths > p.kills
        ? { ...p, name: p.opponent_name, opponent_name: p.name, kills: p.deaths, deaths: p.kills, damage_dealt: p.damage_taken, damage_taken: p.damage_dealt }
        : p;
