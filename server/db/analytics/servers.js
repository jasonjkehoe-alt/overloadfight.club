import { hotDb } from '../connection.js';
import '../migrations.js';
import { DAY_MS, HOUR_MS, careerMonth, dayStart, fightNightDay, regionShare, serverSummary, serverWindow } from '../../lib/gameParse.js';
import { regionOf } from '../../lib/serverRegions.js';
import { getServerListing } from '../repos/servers.js';

// The server page (S15) and the dashboard's region share. A server page reads
// one server's hours (at most 24 a day, by primary key) and its last day of
// ticks; the region share reads region_months, which the stats worker keeps.

const serverHours = hotDb.prepare(`
  SELECT hour, samples, online, match, pilots, match_pilots, peak
  FROM server_hours WHERE ip = ? AND hour >= ? AND hour < ? ORDER BY hour
`);
const serverTicks = hotDb.prepare(`
  SELECT at, online, players, state FROM server_snapshots WHERE ip = ? AND at >= ? ORDER BY at
`);

// The window's hours all end before today's fight-night day starts, so a
// summary holds until the day turns: kept per server, window and day.
const summaries = new Map();
// After a restore the hours behind a kept summary may be gone.
export const clearServerSummaries = () => summaries.clear();

/**
 * A server's listing and region, the window (`days` whole fight-night days
 * before today) and the numbers serverSummary() gives for it. A server never
 * stored gets the same shape with a null `firstSeen` and no ticks, not a
 * failure, so the page can tell the two apart.
 */
export function getServerSummary(ip, days, now = Date.now()) {
  const server = getServerListing(ip) || { ip };
  const today = fightNightDay(now);
  const key = `${ip}\n${days}`;
  let window = summaries.get(key);
  if (window?.today !== today) {
    if (summaries.size > 2000) summaries.clear();
    const { since, until } = serverWindow(today, days);
    const hours = serverHours.all(ip, Date.parse(dayStart(since)) / HOUR_MS, Date.parse(dayStart(until)) / HOUR_MS);
    window = { today, since, until, ...serverSummary(hours) };
    summaries.set(key, window);
  }
  const { today: _, ...summary } = window;
  return {
    ip,
    name: server.name ?? null,
    notes: server.notes ?? null,
    version: server.version ?? null,
    region: regionOf(server.name, server.notes),
    firstSeen: server.first_seen ?? null,
    days,
    ...summary
  };
}

// The server page's answer: the summary, then the ticks and the hours of the
// 24 hours up to `asOf` (ms), when the answer was made, which the page draws
// them against.
export function getServerHistory(ip, days, now = Date.now()) {
  const firstHour = Math.floor((now - DAY_MS) / HOUR_MS);
  return {
    ...getServerSummary(ip, days, now),
    asOf: now,
    lastDay: serverTicks.all(ip, now - DAY_MS),
    lastDayHours: serverHours.all(ip, firstHour, firstHour + 25)
  };
}

const regionMonthRows = hotDb.prepare('SELECT region, month, matches FROM region_months');
const anyRegionMonth = hotDb.prepare('SELECT 1 FROM region_months LIMIT 1');
// False until a refresh has written a row.
export const hasRegionMonths = () => Boolean(anyRegionMonth.get());

// { months }: each month from the first stored match to this month with its
// count per region (serverRegions.js REGIONS ids).
export const getRegionShare = (now = Date.now()) => ({
  months: regionShare(regionMonthRows.all(), careerMonth(now))
});
