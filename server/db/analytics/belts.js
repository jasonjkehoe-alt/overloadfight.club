import { hotDb } from '../connection.js';
import '../migrations.js';
import { ACHIEVEMENTS, MATCH_MODES, TIERS, dayBounds, daysBetween, fightNightDay, pilotKey } from '../../lib/gameParse.js';
import { modeLabel } from '../../lib/matchResult.js';
import { until } from './meta.js';

// Belts and achievements (S21), read from belt_reigns and pilot_achievements,
// which the stats worker's achievementPass keeps. Nothing here reads a stored
// match.

// How many reigns a mode's line of holders lists.
const LINEAGE = 10;

// every reign with the pilot it was taken from (the reign before it)
const REIGN = `
  SELECT r.*, p.pilot AS from_pilot, p.name AS from_name FROM belt_reigns r
  LEFT JOIN belt_reigns p ON p.mode = r.mode AND p.reign = r.reign - 1
`;
const lineage = hotDb.prepare(`${REIGN} WHERE r.mode = ? ORDER BY r.reign DESC LIMIT ?`);
const pilotReigns = hotDb.prepare(`${REIGN} WHERE r.pilot = ? ORDER BY r.since DESC`);
const reignsOn = hotDb.prepare(`${REIGN} WHERE r.since >= ? AND r.since < ? ORDER BY r.since, r.mode`);
// how many pilots reached each tier of each achievement (or a higher one)
const tierCounts = hotDb.prepare('SELECT achievement, tier, COUNT(*) AS pilots FROM pilot_achievements WHERE tier > 0 GROUP BY achievement, tier');
const pilotRows = hotDb.prepare('SELECT achievement, value, tier, earned, game FROM pilot_achievements WHERE pilot = ?');

// A reign as the pages show it: the days it started and ended (fight-night
// days; `until` null while it lasts), the days held up to `today`, and who it
// was taken from (null for a mode's first champion).
const reignOf = (r, today) => {
  const since = fightNightDay(r.since);
  const end = r.until ? fightNightDay(r.until) : null;
  return {
    mode: r.mode,
    label: modeLabel(r.mode),
    reign: r.reign,
    pilot: r.pilot,
    name: r.name,
    since,
    game: r.game,
    defenses: r.defenses,
    until: end,
    lost_game: r.lost_game || null,
    days: since ? Math.max(0, daysBetween(since, end ?? today)) : 0,
    from: r.from_pilot ? { pilot: r.from_pilot, name: r.from_name } : null
  };
};

// { day, modes, achievements }: for each MATCH_MODES mode its champion (the
// reign that lasts, null before the mode's first decisive match), how many
// reigns it has had and its last LINEAGE reigns, newest first; and for each
// achievement how many pilots reached each tier, a higher tier counting
// toward the lower ones. Kept per day until the next refresh writes.
export const getBelts = (today = fightNightDay(Date.now())) => until(`belts\n${today}`, () => {
  const reached = new Map(ACHIEVEMENTS.map(a => [a.id, TIERS.map(() => 0)]));
  for (const { achievement, tier, pilots } of tierCounts.all()) {
    const counts = reached.get(achievement);
    if (counts) for (let t = 0; t < tier && t < counts.length; t++) counts[t] += pilots;
  }
  return {
    day: today,
    modes: MATCH_MODES.map(({ id, label }) => {
      const reigns = lineage.all(id, LINEAGE).map(r => reignOf(r, today));
      return { mode: id, label, reigns: reigns[0]?.reign ?? 0, holder: reigns[0] && !reigns[0].until ? reigns[0] : null, lineage: reigns };
    }),
    achievements: ACHIEVEMENTS.map(a => ({ id: a.id, pilots: reached.get(a.id) }))
  };
});

// { belts, achievements } for one pilot: every reign they held, newest
// first (`until` null for a belt they hold), and every achievement in
// ACHIEVEMENTS order with their count, tier, the day and match the tier was
// earned (null before any) and the next tier's threshold (null at the top).
// A pilot with none, or no stored match, gets no reigns and zeros.
export function getPilotAchievements(name, today = fightNightDay(Date.now())) {
  const key = pilotKey(name);
  const rows = new Map(pilotRows.all(key).map(r => [r.achievement, r]));
  return {
    belts: pilotReigns.all(key).map(r => reignOf(r, today)),
    achievements: ACHIEVEMENTS.map(a => {
      const r = rows.get(a.id);
      const tier = r?.tier ?? 0;
      return { id: a.id, value: r?.value ?? 0, tier, earned: r?.earned || null, game: r?.game || null, next: a.tiers[tier] ?? null };
    })
  };
}

// The reigns that started on fight-night day `day` (the S18 recap's "New
// champion"), each with who lost the belt; none for a day that does not parse.
export function getBeltChanges(day) {
  const bounds = dayBounds(day);
  return bounds ? reignsOn.all(...bounds).map(r => reignOf(r, day)) : [];
}
