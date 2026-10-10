import { hotDb } from '../connection.js';
import '../migrations.js';

// The scheduled fight nights (hot file; see migrations.js ensureFightNightEvents).
// Rows are what validateEvent (lib/fightNightSchedule.js) gives back.

const COLUMNS = 'id, kind, weekday, date, time, minutes, title, notes, updated_at';
// weekly rules first, by weekday and time; then the one-offs by date
const listStmt = hotDb.prepare(`SELECT ${COLUMNS} FROM fight_night_events ORDER BY kind DESC, weekday, date, time, id`);
const getStmt = hotDb.prepare(`SELECT ${COLUMNS} FROM fight_night_events WHERE id = ?`);
const insertStmt = hotDb.prepare(`
  INSERT INTO fight_night_events (kind, weekday, date, time, minutes, title, notes, updated_at)
  VALUES (@kind, @weekday, @date, @time, @minutes, @title, @notes, @updated_at)
`);
const updateStmt = hotDb.prepare(`
  UPDATE fight_night_events
  SET kind = @kind, weekday = @weekday, date = @date, time = @time, minutes = @minutes, title = @title, notes = @notes, updated_at = @updated_at
  WHERE id = @id
`);
const deleteStmt = hotDb.prepare('DELETE FROM fight_night_events WHERE id = ?');

export const listFightNightEvents = () => listStmt.all();
export const getFightNightEvent = id => getStmt.get(id) ?? null;

// Writes a new event, or the event with `id`; gives back the row as stored.
export const saveFightNightEvent = event => {
  const row = { ...event, updated_at: new Date().toISOString() };
  if (event.id) {
    updateStmt.run(row);
    return getFightNightEvent(event.id);
  }
  return getFightNightEvent(insertStmt.run(row).lastInsertRowid);
};

// How many rows went (0 or 1).
export const deleteFightNightEvent = id => deleteStmt.run(id).changes;
