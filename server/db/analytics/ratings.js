import { hotDb } from '../connection.js';
import '../migrations.js';
import { RATING, pilotKey, powerRankings, rankingMovement, ratingDay, shiftDay } from '../../lib/gameParse.js';

// Ratings from rating_snapshots, which every stats refresh rewrites: one
// pilot's history and the power rankings. Nothing here computes a rating.

// Each pilot's latest snapshot on or before a day (the primary key serves both steps).
const latestOnOrBefore = hotDb.prepare(`
  SELECT s.* FROM rating_snapshots s
  JOIN (SELECT pilot, MAX(day) AS day FROM rating_snapshots WHERE day <= ? GROUP BY pilot) m
    ON m.pilot = s.pilot AND m.day = s.day
`);

const pilotHistory = hotDb.prepare(`
  SELECT name, day, rating, rd, volatility, matches, last_played FROM rating_snapshots
  WHERE pilot = ? ORDER BY day
`);

// Every pilot ranked on `day`, by rank.
const rankedOn = day => powerRankings(latestOnOrBefore.all(day), day);

// { day, since, total, pilots }: the top RATING.listed on `day` (today in
// RATING.timeZone by default), each with its `change` since RATING.movementDays
// earlier (null = NEW), and how many pilots are ranked in all.
export const getPowerRankings = (day = ratingDay(Date.now())) => {
  const since = shiftDay(day, -RATING.movementDays);
  const ranked = rankedOn(day);
  return { day, since, total: ranked.length, pilots: rankingMovement(ranked, rankedOn(since)) };
};

// A pilot's rating now and at the end of every day they played; `history` is
// empty for a pilot with no rated match. `rank` is null when not ranked today.
export const getPilotRating = (name, day = ratingDay(Date.now())) => {
  const history = pilotHistory.all(pilotKey(name));
  const last = history[history.length - 1];
  if (!last) return { name: null, rating: null, rd: null, matches: 0, lastPlayed: null, rank: null, history: [] };
  const ranked = rankedOn(day).find(r => r.pilot === pilotKey(name));
  return {
    name: last.name,
    rating: last.rating,
    rd: last.rd,
    matches: last.matches,
    lastPlayed: last.last_played,
    rank: ranked ? ranked.rank : null,
    history: history.map(({ day: d, rating, rd, matches }) => ({ day: d, rating, rd, matches }))
  };
};
