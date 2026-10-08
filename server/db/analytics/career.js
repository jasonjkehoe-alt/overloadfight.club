import { hotDb } from '../connection.js';
import '../migrations.js';
import { RATING, calendarDays, calendarSince, careerSeries, dayBounds, fightNightDay, lastOuting, pilotKey } from '../../lib/gameParse.js';
import { getFightNightRecapByDate } from '../repos/fightNights.js';

// The pilot page's career block (S14): the career arc from pilot_months, which
// every stats refresh keeps in line, and the activity calendar and last time
// out from the pilot's own rows (idx_game_players_name_date) and that night's
// game blobs. Nothing here reads every stored match.

const pilotMonths = hotDb.prepare(`
  SELECT month, matches, wins, losses, ties, kills, deaths, assists, seconds
  FROM pilot_months WHERE pilot = ? ORDER BY month
`);

// False until a refresh has written a row.
const anyPilotMonth = hotDb.prepare('SELECT 1 FROM pilot_months LIMIT 1');
export const hasPilotMonths = () => Boolean(anyPilotMonth.get());

// The pilot's match dates from a start date, one per match, both files.
const pilotDatesSince = hotDb.prepare(`
  SELECT DISTINCT game_id, date FROM game_players WHERE name = TRIM(@name) AND date >= @start
  UNION
  SELECT DISTINCT game_id, date FROM cold.game_players WHERE name = TRIM(@name) AND date >= @start
`);

const pilotLastDate = hotDb.prepare(`
  SELECT MAX(date) FROM (
    SELECT MAX(date) AS date FROM game_players WHERE name = TRIM(@name)
    UNION ALL
    SELECT MAX(date) AS date FROM cold.game_players WHERE name = TRIM(@name)
  )
`).pluck();

// The pilot's matches between two dates, with their details, both files.
const pilotGamesBetween = hotDb.prepare(`
  SELECT g.id, g.date, g.details FROM games g
  WHERE g.id IN (SELECT game_id FROM game_players WHERE name = TRIM(@name) AND date >= @start AND date < @end)
  UNION ALL
  SELECT g.id, g.date, g.details FROM cold.games g
  WHERE g.id IN (SELECT game_id FROM cold.game_players WHERE name = TRIM(@name) AND date >= @start AND date < @end)
`);

// The pilot's rating at the end of a day and at the snapshot before it.
const ratingThrough = hotDb.prepare(`
  SELECT day, rating FROM rating_snapshots WHERE pilot = ? AND day <= ? ORDER BY day DESC LIMIT 2
`);

function lastTimeOut(name) {
  const last = pilotLastDate.get({ name });
  if (!last) return null;
  const [start, end] = dayBounds(fightNightDay(last));
  const seen = new Set();
  const games = [];
  for (const row of pilotGamesBetween.all({ name, start, end })) {
    if (seen.has(row.id)) continue; // a game left in both files by a crash (S5)
    seen.add(row.id);
    try {
      games.push({ ...JSON.parse(row.details), id: row.id, date: row.date });
    } catch {}
  }
  const outing = lastOuting(games, name);
  if (!outing) return null;
  // the change in rating over the night, when it had a rated match
  const [that, before] = ratingThrough.all(pilotKey(name), outing.day);
  const ratingChange = that?.day === outing.day ? Math.round((that.rating - (before?.rating ?? RATING.start)) * 10) / 10 : null;
  return { ...outing, ratingChange, recap: Boolean(getFightNightRecapByDate(outing.day)) };
}

// { today, months, calendar: { since, until, days }, lastOut } for a pilot.
// `months` is careerSeries() up to this month (empty before the first
// refresh or for a pilot with no ranked match), `calendar.days` the
// fight-night days from `since` to `until` (today) with a match, `lastOut`
// lastOuting() plus `ratingChange` and `recap`, or null for an unknown pilot.
export const getPilotCareer = (name, now = Date.now()) => {
  const today = fightNightDay(now);
  const since = calendarSince(today);
  const dates = pilotDatesSince.all({ name, start: dayBounds(since)[0] }).map(r => r.date);
  return {
    today,
    months: careerSeries(pilotMonths.all(pilotKey(name)), today.slice(0, 7)),
    calendar: { since, until: today, days: calendarDays(dates) },
    lastOut: lastTimeOut(name)
  };
};
