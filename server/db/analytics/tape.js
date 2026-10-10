import { hotDb } from '../connection.js';
import '../migrations.js';
import { killScoredMode, pilotKey } from '../../lib/gameParse.js';
import { getPilotPPI, getPilotSummary } from './pilots.js';
import { getPilotRating } from './ratings.js';

// The Tale of the Tape (S20): two pilots' head-to-head from pilot_bouts (the
// stats worker's rated matches between each pair of opponents, per mode and
// map) and pilot_duels, beside their career numbers as the pilot page shows
// them. Nothing here reads a stored match.

// How many opponents a pilot page lists.
const PILOT_OPPONENTS = 9;

// `mode` null for every mode; damage summed unrounded and rounded once, as
// pilot_rivals rounds a pair's total
const BOUT_SUMS = `COALESCE(SUM(matches), 0) AS matches, COALESCE(SUM(wins), 0) AS wins, COALESCE(SUM(losses), 0) AS losses,
  COALESCE(SUM(ties), 0) AS ties, COALESCE(SUM(logged), 0) AS logged, COALESCE(SUM(kills), 0) AS kills,
  COALESCE(SUM(deaths), 0) AS deaths, CAST(ROUND(COALESCE(SUM(damage_dealt), 0)) AS INTEGER) AS damage_dealt,
  CAST(ROUND(COALESCE(SUM(damage_taken), 0)) AS INTEGER) AS damage_taken`;
const IN_MODE = 'pilot = @a AND opponent = @b AND (@mode IS NULL OR mode = @mode)';
const pairTotals = hotDb.prepare(`SELECT ${BOUT_SUMS} FROM pilot_bouts WHERE ${IN_MODE}`);
// the maps a bout named, most played first
const pairMaps = hotDb.prepare(`
  SELECT map, SUM(matches) AS matches, SUM(wins) AS wins, SUM(losses) AS losses, SUM(ties) AS ties FROM pilot_bouts
  WHERE ${IN_MODE} AND map <> '' GROUP BY map HAVING SUM(matches) > 0 ORDER BY matches DESC, map
`);
const pairModes = hotDb.prepare(`
  SELECT mode, SUM(matches) AS matches FROM pilot_bouts WHERE pilot = ? AND opponent = ?
  GROUP BY mode HAVING SUM(matches) > 0 ORDER BY matches DESC, mode
`);
const pairDuels = hotDb.prepare('SELECT wins, losses, ties, last FROM pilot_duels WHERE pilot = ? AND opponent = ?');

// A corner of the tape: the pilot's stored name (as the pilot card names
// them) and career numbers, or null for a pilot with no stored match. The
// career is the pilot page's: ranked matches, record, win rate, Combat Ratio
// (shown as 0 when negative, as the profile does) and Lethality from
// pilot_stats_cache, null before the pilot's first ranked match; the rating,
// its RD and standing from getPilotRating.
function corner(name) {
  const summary = getPilotSummary(name);
  if (!summary) return null;
  const cached = getPilotPPI(summary.name);
  const { rating, rd, matches, status, rank } = getPilotRating(summary.name);
  return {
    key: pilotKey(summary.name),
    name: summary.name,
    career: cached ? {
      matches: cached.games, wins: cached.wins, losses: cached.losses, ties: cached.ties,
      win_rate: cached.win_rate, combat_ratio: Math.max(0, cached.kda), lethality: cached.kpm
    } : null,
    rating: { rating, rd, matches, status, rank }
  };
}

// The tape for pilots `a` and `b`, read from a's side, in `mode` (a
// gameParse.js TAPE_MODES id) or every mode (null): { pilots: [a, b], mode,
// modes, record, logged, maps, duels }. `record` is the bouts (matches, wins,
// losses, ties), `logged` the bouts' matches with a log and the kills and
// damage each way in them, `maps` the record per map named, `modes` the
// matches in each mode (for the switch, whatever `mode` is), `duels` their
// pilot_duels record or null (none, or a mode a duel cannot be in). Gives
// { missing: [names] } when a pilot has no stored match and { same: name }
// for one pilot twice.
export function getTape(a, b, mode = null) {
  const pilots = [corner(a), corner(b)];
  const missing = [a, b].filter((_, i) => !pilots[i]);
  if (missing.length > 0) return { missing };
  const [red, blue] = pilots;
  if (red.key === blue.key) return { same: red.name };
  const keys = { a: red.key, b: blue.key, mode };
  const { matches, wins, losses, ties, ...logged } = pairTotals.get(keys);
  return {
    pilots,
    mode,
    modes: pairModes.all(red.key, blue.key),
    record: { matches, wins, losses, ties },
    logged: { matches: logged.logged, kills: logged.kills, deaths: logged.deaths, damage_dealt: logged.damage_dealt, damage_taken: logged.damage_taken },
    maps: pairMaps.all(keys),
    duels: killScoredMode(mode) ? pairDuels.get(red.key, blue.key) ?? null : null
  };
}

// The opponents a pilot met in the most rated matches, for the pilot page:
// each opponent's key and name (pilot_stats_cache's, the latest spelling,
// read through getPilotPPI because the cache is built by the first refresh),
// the record from the pilot's side and the logged kills each way.
const pilotOpponents = hotDb.prepare(`
  SELECT opponent, SUM(matches) AS matches, SUM(wins) AS wins, SUM(losses) AS losses, SUM(ties) AS ties,
    SUM(logged) AS logged, SUM(kills) AS kills, SUM(deaths) AS deaths
  FROM pilot_bouts WHERE pilot = ? GROUP BY opponent HAVING SUM(matches) > 0
  ORDER BY matches DESC, kills + deaths DESC, opponent LIMIT ?
`);
export const getPilotOpponents = name => pilotOpponents.all(pilotKey(name), PILOT_OPPONENTS)
  .map(o => ({ ...o, name: getPilotPPI(o.opponent)?.name ?? o.opponent }));
