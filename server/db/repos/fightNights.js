import { hotDb } from '../connection.js';
import '../migrations.js';

// Saved fight-night recaps (hot file).

const getFightNightRecapsStmt = hotDb.prepare('SELECT date, data, created_at FROM fight_night_recaps ORDER BY date DESC LIMIT ?');
const getFightNightRecapStmt = hotDb.prepare('SELECT date, data, created_at FROM fight_night_recaps WHERE date = ?');

export const getFightNightRecaps = (limit = 20) => {
  try {
    const rows = getFightNightRecapsStmt.all(limit);
    return rows.map(r => ({
      date: r.date,
      created_at: r.created_at,
      ...JSON.parse(r.data)
    }));
  } catch (e) {
    console.error("Failed to get fight night recaps", e);
    return [];
  }
};

export const getFightNightRecapByDate = (date) => {
  try {
    const row = getFightNightRecapStmt.get(date);
    if (!row) return null;
    return {
      date: row.date,
      created_at: row.created_at,
      ...JSON.parse(row.data)
    };
  } catch (e) {
    console.error("Failed to get fight night recap by date", e);
    return null;
  }
};

export const saveFightNightRecap = (date, data) => {
  try {
    const stmt = hotDb.prepare(`
      INSERT INTO fight_night_recaps (date, data) 
      VALUES (@date, @data) 
      ON CONFLICT(date) DO UPDATE SET data = excluded.data, created_at = CURRENT_TIMESTAMP
    `);
    return stmt.run({
      date,
      data: typeof data === 'string' ? data : JSON.stringify(data)
    });
  } catch (e) {
    console.error("Failed to save fight night recap", e);
    return null;
  }
};

// Removes the recaps from `day` (YYYY-MM-DD) on, except the days in `keep`;
// returns how many.
export const deleteFightNightRecapsSince = (day, keep = []) => hotDb
  .prepare('DELETE FROM fight_night_recaps WHERE date >= ? AND date NOT IN (SELECT value FROM json_each(?))')
  .run(day, JSON.stringify(keep)).changes;

const hasFightNightRecapStmt = hotDb.prepare('SELECT 1 FROM fight_night_recaps WHERE date = ?').pluck();
export const hasFightNightRecap = date => Boolean(hasFightNightRecapStmt.get(date));
