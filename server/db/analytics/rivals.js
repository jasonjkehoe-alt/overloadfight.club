import { hotDb } from '../connection.js';
import '../migrations.js';
import { pilotKey } from '../../lib/gameParse.js';
import { until } from './meta.js';

// Rivalries and clutch (S17), read from the derived tables the stats worker
// keeps (pilot_rivals, pilot_clutch). Every number comes from ranked matches
// whose kill or damage log the tracker kept. Nothing here reads a stored match.

// The network's size, and how many opponents a pilot page lists.
const NETWORK = { pilots: 12, pairs: 25 };
const PILOT_OPPONENTS = 10;

// The pilots with the most logged kills on opponents, with their totals over
// every opponent (each row of a pilot carries their latest spelling).
const topKillers = hotDb.prepare(`
  SELECT pilot, MAX(name) AS name, SUM(kills) AS kills, SUM(damage_dealt) AS damage FROM pilot_rivals
  GROUP BY pilot HAVING SUM(kills) > 0 ORDER BY kills DESC, damage DESC, pilot LIMIT ?
`);
const networkCells = hotDb.prepare(`
  SELECT pilot, opponent, kills, damage_dealt FROM pilot_rivals
  WHERE pilot IN (SELECT value FROM json_each(?)) AND opponent IN (SELECT value FROM json_each(?))
`);
// each pair once (pilot before opponent), most kills exchanged first
const topPairs = hotDb.prepare(`
  SELECT * FROM pilot_rivals WHERE pilot < opponent AND kills + deaths > 0
  ORDER BY kills + deaths DESC, matches DESC, pilot, opponent LIMIT ?
`);
const networkTotals = hotDb.prepare('SELECT COALESCE(SUM(kills), 0) AS kills, COALESCE(SUM(damage_dealt), 0) AS damage FROM pilot_rivals');

// { pilots, kills, damage, pairs, totals }: the NETWORK.pilots pilots with the
// most logged kills on opponents ({ pilot, name, kills, damage }, their totals
// over every opponent), `kills[i][j]` and `damage[i][j]` what pilot i did to
// pilot j (null on the diagonal), the NETWORK.pairs pairs with the most kills
// exchanged (a pilot_rivals row from the side whose key sorts first), and the
// kills and damage over every pair.
export const getRivalNetwork = () => until('rivals', () => {
  const pilots = topKillers.all(NETWORK.pilots);
  const at = new Map(pilots.map((p, i) => [p.pilot, i]));
  const grid = () => pilots.map((_, i) => pilots.map((_, j) => (i === j ? null : 0)));
  const kills = grid();
  const damage = grid();
  const keys = JSON.stringify([...at.keys()]);
  for (const c of networkCells.all(keys, keys)) {
    // a pilot never faces themselves (no suicide, self-damage or self-pair is a row)
    const [i, j] = [at.get(c.pilot), at.get(c.opponent)];
    kills[i][j] = c.kills;
    damage[i][j] = c.damage_dealt;
  }
  return { pilots, kills, damage, pairs: topPairs.all(NETWORK.pairs), totals: networkTotals.get() };
});

const pilotOpponents = hotDb.prepare(`
  SELECT * FROM pilot_rivals WHERE pilot = ?
  ORDER BY kills + deaths DESC, damage_dealt + damage_taken DESC, opponent LIMIT ?
`);
const pilotTotals = hotDb.prepare(`
  SELECT COUNT(*) AS opponents, COALESCE(SUM(kills), 0) AS kills, COALESCE(SUM(deaths), 0) AS deaths,
    COALESCE(SUM(damage_dealt), 0) AS damage_dealt, COALESCE(SUM(damage_taken), 0) AS damage_taken
  FROM pilot_rivals WHERE pilot = ?
`);
const CLUTCH_COUNTS = 'SUM(matches) AS matches, SUM(first_bloods) AS first_bloods, SUM(kills) AS kills, SUM(late_kills) AS late_kills, SUM(trailing_kills) AS trailing_kills';
const pilotClutch = hotDb.prepare('SELECT kind, matches, first_bloods, kills, late_kills, trailing_kills FROM pilot_clutch WHERE pilot = ? ORDER BY kind');
const communityClutch = hotDb.prepare(`SELECT kind, ${CLUTCH_COUNTS} FROM pilot_clutch GROUP BY kind ORDER BY kind`);

// { opponents, totals, clutch, community } for one pilot: the
// PILOT_OPPONENTS opponents with the most kills exchanged (pilot_rivals rows
// from the pilot's side), their totals over every opponent, and their clutch
// counts and everyone's, one row per kind of match (ffa, team). A pilot with
// no logged ranked match gets empty lists and zeros, not a 404.
export function getPilotRivalry(name) {
  const key = pilotKey(name);
  return {
    opponents: pilotOpponents.all(key, PILOT_OPPONENTS),
    totals: pilotTotals.get(key),
    clutch: pilotClutch.all(key),
    community: until('clutch', () => communityClutch.all())
  };
}
