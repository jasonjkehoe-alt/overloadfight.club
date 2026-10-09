import { hotDb } from '../connection.js';
import '../migrations.js';
import { DERIVED_TABLES_VERSION } from '../../lib/statsPasses.js';
import { BOARD_ROWS, OBJECTIVE_MODES, WEAPON_FAMILIES, duelLadder, fightNightDay, mapKey, pilotKey } from '../../lib/gameParse.js';
import { getAdminSetting, setAdminSetting } from '../repos/settings.js';
import { clearRankings } from './ratings.js';

// Weapon meta and ladders (S16), read from the derived tables the stats
// worker keeps (map_weapons, pilot_weapons, pilot_maps, duel_snapshots,
// pilot_duels, pilot_objectives). Nothing here reads a stored match.

// How many maps the weapon meta lists and the specialist grid's size (the
// objective boards list BOARD_ROWS pilots).
const META = { maps: 25, gridPilots: 20, gridMaps: 12 };

// { family: kills } with every family present (weaponFamily() always gives one)
const byFamily = rows => {
  const counts = Object.fromEntries(WEAPON_FAMILIES.map(f => [f.id, 0]));
  for (const { family, kills } of rows) counts[family] += kills;
  return counts;
};
const sum = counts => Object.values(counts).reduce((a, b) => a + b, 0);

// Each answer below changes only when a refresh writes its table, so it is
// kept until then (clearDerivedCaches, from the refresh and a restore).
const kept = new Map();
const until = (key, build) => {
  if (!kept.has(key)) kept.set(key, build());
  return kept.get(key);
};
export const clearDerivedCaches = () => {
  kept.clear();
  clearRankings();
};

// The built marker: admin_settings holds the list of derived tables a
// refresh last wrote in full (statsPasses.js DERIVED_TABLES_VERSION). The
// startup check refreshes while it differs, so a new table, a restored
// backup (restoreHot clears it) or a refresh that failed to write a table
// each cost one refresh, and a table that stays empty for good (no
// Monsterball match ever) costs none.
const DERIVED_MARK = 'derived_tables_built';
export const derivedTablesBuilt = () => getAdminSetting.get(DERIVED_MARK)?.value === DERIVED_TABLES_VERSION;
export const markDerivedTablesBuilt = () => setAdminSetting.run(DERIVED_MARK, DERIVED_TABLES_VERSION);
export const clearDerivedTablesBuilt = () => hotDb.prepare('DELETE FROM admin_settings WHERE key = ?').run(DERIVED_MARK);

// The community's kills per family, over every map.
const communityWeapons = hotDb.prepare('SELECT family, SUM(kills) AS kills FROM map_weapons GROUP BY family');
const communityTotals = () => until('community', () => byFamily(communityWeapons.all()));
const mapWeapons = hotDb.prepare(`
  SELECT map, family, kills FROM map_weapons
  WHERE map IN (SELECT map FROM map_weapons GROUP BY map ORDER BY SUM(kills) DESC, map LIMIT ?)
`);

// { community: { family: kills }, kills, maps: [{ map, kills, families }] }:
// the kills on opponents per weapon family over every ranked match with a
// kill log, and the same for the META.maps maps with the most logged kills,
// most first.
export const getWeaponMeta = () => until('weapons', () => {
  const community = communityTotals();
  const rows = Map.groupBy(mapWeapons.all(META.maps), r => r.map);
  const maps = [...rows].map(([map, r]) => {
    const families = byFamily(r);
    return { map, kills: sum(families), families };
  });
  return { community, kills: sum(community), maps: maps.sort((a, b) => b.kills - a.kills || a.map.localeCompare(b.map)) };
});

const pilotWeapons = hotDb.prepare('SELECT family, kills FROM pilot_weapons WHERE pilot = ?');

// { pilot: { family: kills }, kills, community, communityKills } for one
// pilot: their logged kills on opponents per family beside everyone's.
export function getPilotWeaponMix(name) {
  const pilot = byFamily(pilotWeapons.all(pilotKey(name)));
  const community = communityTotals();
  return { pilot, kills: sum(pilot), community, communityKills: sum(community) };
}

// The pilots with the most ranked matches, and the maps among their rows
// with the most matches by map_stats_cache (every stored match on the map;
// pilot_maps rows are pilot appearances, not matches). The maps are keyed in
// JS by mapKey(), as pilot_maps is: SQLite's NOCASE and UPPER() fold ASCII only.
const topGridPilots = hotDb.prepare(`
  SELECT pilot, name, SUM(matches) AS matches FROM pilot_maps GROUP BY pilot ORDER BY matches DESC, pilot LIMIT ?
`);
const mapMatches = hotDb.prepare('SELECT map_name AS name, total_matches AS matches FROM map_stats_cache');
const playedMaps = hotDb.prepare('SELECT DISTINCT map FROM pilot_maps');
const topGridMaps = limit => {
  const played = new Set(playedMaps.all().map(r => r.map));
  const matches = new Map();
  for (const m of mapMatches.all()) {
    const map = mapKey({ settings: { level: m.name } });
    if (played.has(map)) matches.set(map, (matches.get(map) || 0) + m.matches);
  }
  return [...matches].map(([map, n]) => ({ map, matches: n })).sort((a, b) => b.matches - a.matches || a.map.localeCompare(b.map)).slice(0, limit);
};
// the grid's cells, by the pilots and maps the two reads above chose
const gridCells = hotDb.prepare(`
  SELECT pilot, map, matches, wins, losses, ties FROM pilot_maps
  WHERE pilot IN (SELECT value FROM json_each(?)) AND map IN (SELECT value FROM json_each(?))
`);

// The specialist grid: the META.gridPilots pilots with the most ranked matches
// against the META.gridMaps maps played most, `cells[i][j]` the pilot's
// record on the map ({ matches, wins, losses, ties }) or null.
export const getSpecialists = () => until('specialists', () => {
  const pilots = topGridPilots.all(META.gridPilots);
  const maps = topGridMaps(META.gridMaps);
  const row = new Map(pilots.map((p, i) => [p.pilot, i]));
  const column = new Map(maps.map((m, j) => [m.map, j]));
  const cells = pilots.map(() => maps.map(() => null));
  for (const { pilot, map, ...record } of gridCells.all(JSON.stringify([...row.keys()]), JSON.stringify([...column.keys()]))) cells[row.get(pilot)][column.get(map)] = record;
  return { pilots, maps, cells };
});

// Each pilot's latest duel snapshot on or before a day.
const latestDuelOnOrBefore = hotDb.prepare(`
  SELECT s.* FROM duel_snapshots s
  JOIN (SELECT pilot, MAX(day) AS day FROM duel_snapshots WHERE day <= ? GROUP BY pilot) m
    ON m.pilot = s.pilot AND m.day = s.day
`);
const duelRecords = hotDb.prepare(`
  SELECT pilot, SUM(wins) AS wins, SUM(losses) AS losses, SUM(ties) AS ties, MAX(last) AS last FROM pilot_duels GROUP BY pilot
`);

// { day, listed, pilots }: the duel ladder on `day` (today's fight-night day
// by default), each pilot a duel snapshot plus `rank`, `status` ('listed' or
// 'provisional'), their record and the day of their last duel; `listed` is
// how many are past the listing bar. A pilot's record can lag their snapshot
// while the first fill writes the two tables in chunks, hence the fallbacks.
export const getDuelLadder = (day = fightNightDay(Date.now())) => until(`ladder\n${day}`, () => {
  const records = new Map(duelRecords.all().map(r => [r.pilot, r]));
  const pilots = duelLadder(latestDuelOnOrBefore.all(day), day).map(s => {
    const r = records.get(s.pilot);
    return { ...s, wins: r?.wins ?? 0, losses: r?.losses ?? 0, ties: r?.ties ?? 0, last: r?.last ? fightNightDay(r.last) : s.day };
  });
  return { day, listed: pilots.filter(p => p.status === 'listed').length, pilots };
});

const objectiveRows = Object.fromEntries(Object.entries(OBJECTIVE_MODES).map(([mode, { sort }]) => [mode, hotDb.prepare(`
  SELECT * FROM pilot_objectives WHERE mode = ? ORDER BY ${sort} DESC, matches DESC, pilot LIMIT ?
`)]));

// { CTF: [...], MONSTERBALL: [...] }: each board's pilots by its sort field
// (OBJECTIVE_MODES), each a pilot_objectives row with `rank`.
export const getObjectiveBoards = () => until('objectives', () =>
  Object.fromEntries(Object.entries(objectiveRows).map(([mode, stmt]) => [mode, stmt.all(mode, BOARD_ROWS).map((row, i) => ({ ...row, rank: i + 1 }))])));
