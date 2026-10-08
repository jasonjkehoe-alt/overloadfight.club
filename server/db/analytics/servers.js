import { hotDb } from '../connection.js';
import '../migrations.js';
import { DAY_MS, HOUR_MS, careerMonth, dayStart, fightNightDay, regionShare, serverSummary, serverWindow } from '../../lib/gameParse.js';
import { regionOf, REGIONS } from '../../lib/serverRegions.js';
import { getServerListing } from '../repos/servers.js';

// The server page (S15) and the dashboard's region share. A server page reads
// one server's hours (at most 24 a day, by primary key) and its last day of
// ticks; the region share reads region_months, which the stats worker keeps.

const serverHours = hotDb.prepare(`
  SELECT hour, samples, online, lobby, match, pilots, match_pilots, peak
  FROM server_hours WHERE ip = ? AND hour >= ? AND hour < ? ORDER BY hour
`);
const serverTicks = hotDb.prepare(`
  SELECT at, online, players, state FROM server_snapshots WHERE ip = ? AND at >= ? ORDER BY at
`);

/**
 * A server's listing and region, the window (`days` whole fight-night days
 * before today) and the numbers serverSummary() gives for it. A server never
 * stored gets the same shape with a null `firstSeen` and no ticks, not a
 * failure, so the page can tell the two apart.
 */
export function getServerSummary(ip, days, now = Date.now()) {
  const server = getServerListing(ip) || { ip };
  const { since, until } = serverWindow(fightNightDay(now), days);
  const hours = serverHours.all(ip, Date.parse(dayStart(since)) / HOUR_MS, Date.parse(dayStart(until)) / HOUR_MS);
  return {
    ip: server.ip,
    name: server.name ?? null,
    notes: server.notes ?? null,
    version: server.version ?? null,
    region: regionOf(server.name, server.notes),
    firstSeen: server.first_seen ?? null,
    lastSeen: server.last_seen ?? null,
    lastOnline: server.last_online ?? null,
    days,
    since,
    until,
    ...serverSummary(hours)
  };
}

// The server page's answer: the summary, and the ticks of the 24 hours up to
// `asOf` (ms), when the answer was made, which the page draws them against.
export const getServerHistory = (ip, days, now = Date.now()) => ({
  ...getServerSummary(ip, days, now),
  asOf: now,
  lastDay: serverTicks.all(ip, now - DAY_MS)
});

const regionMonthRows = hotDb.prepare('SELECT region, month, matches FROM region_months');
const anyRegionMonth = hotDb.prepare('SELECT 1 FROM region_months LIMIT 1');
// False until a refresh has written a row.
export const hasRegionMonths = () => Boolean(anyRegionMonth.get());

// { regions, months }: the region ids in stacking order, and each month from
// the first stored match to this month with its count per region.
export const getRegionShare = (now = Date.now()) => ({
  regions: REGIONS.map(r => r.id),
  months: regionShare(regionMonthRows.all(), careerMonth(now))
});
