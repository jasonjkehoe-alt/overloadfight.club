import { hotDb } from '../connection.js';
import '../migrations.js';
import { RATING, pilotKey, powerRankings, rankStatus, rankingMovement, ratingDay, rdOn, shiftDay } from '../../lib/gameParse.js';

// Ratings from rating_snapshots, which every stats refresh rewrites: one
// pilot's history and the power rankings. Nothing here computes a rating.

// Each pilot's latest snapshot on or before a day (the primary key serves both steps).
const latestOnOrBefore = hotDb.prepare(`
  SELECT s.* FROM rating_snapshots s
  JOIN (SELECT pilot, MAX(day) AS day FROM rating_snapshots WHERE day <= ? GROUP BY pilot) m
    ON m.pilot = s.pilot AND m.day = s.day
`);

const pilotHistory = hotDb.prepare(`
  SELECT name, day, rating, rd, volatility, matches FROM rating_snapshots
  WHERE pilot = ? ORDER BY day
`);

// Every pilot ranked on `day`, by rank. Kept per day until the next refresh
// changes the snapshots (clearRankings), so a page view does not rescan them.
const rankedByDay = new Map();
const rankedOn = day => {
  if (!rankedByDay.has(day)) rankedByDay.set(day, powerRankings(latestOnOrBefore.all(day), day));
  return rankedByDay.get(day);
};
export const clearRankings = () => rankedByDay.clear();

// False until a refresh has written a snapshot.
const anySnapshot = hotDb.prepare('SELECT 1 FROM rating_snapshots LIMIT 1');
export const hasRatingSnapshots = () => Boolean(anySnapshot.get());

// { day, since, total, pilots }: the top RATING.listed on `day` (today in
// RATING.timeZone by default), each with its `change` since RATING.movementDays
// earlier (null = NEW), and how many pilots are ranked in all.
export const getPowerRankings = (day = ratingDay(Date.now())) => {
  const since = shiftDay(day, -RATING.movementDays);
  const ranked = rankedOn(day);
  return { day, since, total: ranked.length, pilots: rankingMovement(ranked, rankedOn(since)) };
};

// A pilot's rating on `day` (today by default) and at the end of every day
// they played; `history` is empty for a pilot with no rated match. `rd` has
// grown for the days since the last one; `status` is rankStatus() and `rank`
// is null unless 'ranked'.
export const getPilotRating = (name, day = ratingDay(Date.now())) => {
  const pilot = pilotKey(name);
  const history = pilotHistory.all(pilot);
  const last = history[history.length - 1];
  if (!last) return { name: null, rating: null, rd: null, matches: 0, status: null, rank: null, history: [] };
  return {
    name: last.name,
    rating: last.rating,
    rd: rdOn(last, day),
    matches: last.matches,
    status: rankStatus(last, day),
    rank: rankedOn(day).find(r => r.pilot === pilot)?.rank ?? null,
    history: history.map(({ day: d, rating, rd, matches }) => ({ day: d, rating, rd, matches }))
  };
};
