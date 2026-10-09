import { hotDb } from '../connection.js';
import '../migrations.js';
import { DERIVED_TABLES } from '../../lib/statsPasses.js';
import { OBJECTIVE_MODES, WEAPON_FAMILIES, duelLadder, fightNightDay, pilotKey } from '../../lib/gameParse.js';

// Weapon meta and ladders (S16), read from the derived tables the stats
// worker keeps (map_weapons, pilot_weapons, pilot_maps, duel_snapshots,
// pilot_duels, pilot_objectives). Nothing here reads a stored match.

// How many maps the weapon meta lists, and the specialist grid's size.
export const META = { maps: 25, gridPilots: 20, gridMaps: 12 };

const families = WEAPON_FAMILIES.map(f => f.id);
// { family: kills } with every family present
const byFamily = rows => {
  const counts = Object.fromEntries(families.map(f => [f, 0]));
  for (const { family, kills } of rows) if (family in counts) counts[family] += kills;
  return counts;
};
const sum = counts => Object.values(counts).reduce((a, b) => a + b, 0);

// True once every derived table has a row: the startup check refreshes
// until then. A table that stays empty for good (no duel, no Monsterball
// match ever) keeps the check refreshing on every start, as an all-unranked
// database did before S16.
const anyRow = Object.fromEntries(Object.keys(DERIVED_TABLES).map(t => [t, hotDb.prepare(`SELECT 1 FROM ${t} LIMIT 1`)]));
export const derivedTablesFilled = () => Object.values(anyRow).every(stmt => stmt.get());

const communityWeapons = hotDb.prepare('SELECT family, SUM(kills) AS kills FROM map_weapons GROUP BY family');
const mapWeapons = hotDb.prepare(`
  SELECT map, family, kills FROM map_weapons
  WHERE map IN (SELECT map FROM map_weapons GROUP BY map ORDER BY SUM(kills) DESC, map LIMIT ?)
`);

// { community: { family: kills }, kills, maps: [{ map, kills, families }] }:
// the kills on opponents per weapon family over every ranked match with a
// kill log, and the same for the META.maps maps with the most logged kills,
// most first.
export function getWeaponMeta() {
  const community = byFamily(communityWeapons.all());
  const maps = new Map();
  for (const { map, family, kills } of mapWeapons.all(META.maps)) {
    if (!maps.has(map)) maps.set(map, { map, kills: 0, families: byFamily([]) });
    const m = maps.get(map);
    if (family in m.families) m.families[family] += kills;
    m.kills += kills;
  }
  return { community, kills: sum(community), maps: [...maps.values()].sort((a, b) => b.kills - a.kills || a.map.localeCompare(b.map)) };
}

const pilotWeapons = hotDb.prepare('SELECT family, kills FROM pilot_weapons WHERE pilot = ?');

// { pilot: { family: kills }, kills, community, communityKills } for one
// pilot: their logged kills on opponents per family beside everyone's.
export function getPilotWeaponMix(name) {
  const pilot = byFamily(pilotWeapons.all(pilotKey(name)));
  const community = byFamily(communityWeapons.all());
  return { pilot, kills: sum(pilot), community, communityKills: sum(community) };
}

const topGridPilots = hotDb.prepare(`
  SELECT pilot, name, SUM(matches) AS matches FROM pilot_maps GROUP BY pilot ORDER BY matches DESC, pilot LIMIT ?
`);
const topGridMaps = hotDb.prepare('SELECT map, SUM(matches) AS matches FROM pilot_maps GROUP BY map ORDER BY matches DESC, map LIMIT ?');
const gridCells = hotDb.prepare('SELECT pilot, map, matches, wins, losses, ties FROM pilot_maps WHERE pilot = ?');

// The specialist grid: the META.gridPilots pilots with the most ranked matches
// against the META.gridMaps maps with the most, `cells[i][j]` the pilot's
// record on the map ({ matches, wins, losses, ties }) or null.
export function getSpecialists() {
  const pilots = topGridPilots.all(META.gridPilots);
  const maps = topGridMaps.all(META.gridMaps);
  const column = new Map(maps.map((m, j) => [m.map, j]));
  const cells = pilots.map(p => {
    const row = maps.map(() => null);
    for (const { pilot: _, map, ...record } of gridCells.all(p.pilot)) {
      const j = column.get(map);
      if (j !== undefined) row[j] = record;
    }
    return row;
  });
  return { pilots, maps, cells };
}

// Each pilot's latest duel snapshot on or before a day.
const latestDuelOnOrBefore = hotDb.prepare(`
  SELECT s.* FROM duel_snapshots s
  JOIN (SELECT pilot, MAX(day) AS day FROM duel_snapshots WHERE day <= ? GROUP BY pilot) m
    ON m.pilot = s.pilot AND m.day = s.day
`);
const duelRecords = hotDb.prepare(`
  SELECT pilot, SUM(wins) AS wins, SUM(losses) AS losses, SUM(ties) AS ties, MAX(last) AS last FROM pilot_duels GROUP BY pilot
`);

// The ladder per day until the next refresh writes duel snapshots (clearDuelLadder).
const ladderByDay = new Map();
export const clearDuelLadder = () => ladderByDay.clear();

// { day, listed, pilots }: the duel ladder on `day` (today's fight-night day
// by default), each pilot a duel snapshot plus `rank`, `status` ('listed' or
// 'provisional'), their record and the day of their last duel; `listed` is
// how many are past the listing bar.
export function getDuelLadder(day = fightNightDay(Date.now())) {
  if (!ladderByDay.has(day)) {
    const records = new Map(duelRecords.all().map(r => [r.pilot, r]));
    const pilots = duelLadder(latestDuelOnOrBefore.all(day), day).map(s => {
      const r = records.get(s.pilot);
      return { ...s, wins: r?.wins ?? 0, losses: r?.losses ?? 0, ties: r?.ties ?? 0, last: r?.last ? fightNightDay(r.last) : s.day };
    });
    ladderByDay.set(day, { day, listed: pilots.filter(p => p.status === 'listed').length, pilots });
  }
  return ladderByDay.get(day);
}

const objectiveRows = Object.fromEntries(Object.entries(OBJECTIVE_MODES).map(([mode, { sort }]) => [mode, hotDb.prepare(`
  SELECT * FROM pilot_objectives WHERE mode = ? ORDER BY ${sort} DESC, matches DESC, pilot LIMIT ?
`)]));

// How many pilots each objective board lists.
export const OBJECTIVE_BOARD_SIZE = 50;

// { CTF: [...], MONSTERBALL: [...] }: each board's pilots by its sort field
// (OBJECTIVE_MODES), each a pilot_objectives row with `rank`.
export function getObjectiveBoards() {
  return Object.fromEntries(Object.entries(objectiveRows).map(([mode, stmt]) => [mode, stmt.all(mode, OBJECTIVE_BOARD_SIZE).map((row, i) => ({ ...row, rank: i + 1 }))]));
}
