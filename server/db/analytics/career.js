import { hotDb } from '../connection.js';
import '../migrations.js';
import { calendarDays, calendarSince, careerSeries, dayBounds, dayStart, fightNightDay, lastOuting, nightRatingChange, pilotKey } from '../../lib/gameParse.js';
import { pilotGameIdsSql } from './pilots.js';
import { pilotGamesSql } from './pilotTelemetry.js';
import { hasFightNightRecap } from '../repos/fightNights.js';

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

// The pilot's match dates from a start date, one per match (the match list's query).
const pilotDatesSince = hotDb.prepare(`SELECT DISTINCT game_id, date FROM (${pilotGameIdsSql})`);

const pilotLastDate = hotDb.prepare(`
  SELECT MAX(date) FROM (
    SELECT MAX(date) AS date FROM game_players WHERE name = TRIM(@name)
    UNION ALL
    SELECT MAX(date) AS date FROM cold.game_players WHERE name = TRIM(@name)
  )
`).pluck();

// The pilot's matches on one night, with their details, in each file.
const nightGames = ['main', 'cold'].map(schema => hotDb.prepare(pilotGamesSql(schema, 'AND date >= @start AND date < @end')));

// The pilot's latest two snapshots on or before a day.
const ratingThrough = hotDb.prepare(`
  SELECT day, rating FROM rating_snapshots WHERE pilot = ? AND day <= ? ORDER BY day DESC LIMIT 2
`);

function lastTimeOut(name) {
  const last = pilotLastDate.get({ name });
  if (!last) return null;
  const [start, end] = dayBounds(fightNightDay(last));
  const seen = new Set();
  const games = [];
  for (const row of nightGames.flatMap(stmt => stmt.all({ name, start, end }))) {
    if (seen.has(row.id)) continue; // a game left in both files by a crash (S5)
    seen.add(row.id);
    try {
      games.push({ ...JSON.parse(row.details), id: row.id, date: row.date });
    } catch {}
  }
  const outing = lastOuting(games, name);
  if (!outing) return null;
  return {
    ...outing,
    ratingChange: nightRatingChange(ratingThrough.all(pilotKey(name), outing.day), outing.day),
    recap: hasFightNightRecap(outing.day)
  };
}

// { months, calendar: { since, until, days }, lastOut } for a pilot.
// `months` is careerSeries() up to this month (empty before the first
// refresh or for a pilot with no ranked match), `calendar.days` the
// fight-night days from `since` to `until` (today) with a match, `lastOut`
// lastOuting() plus `ratingChange` and `recap`, or null for an unknown pilot.
export const getPilotCareer = (name, now = Date.now()) => {
  const today = fightNightDay(now);
  const since = calendarSince(today);
  const dates = pilotDatesSince.all({ name, startDate: dayStart(since) }).map(r => r.date);
  return {
    months: careerSeries(pilotMonths.all(pilotKey(name)), today.slice(0, 7)),
    calendar: { since, until: today, days: calendarDays(dates) },
    lastOut: lastTimeOut(name)
  };
};
