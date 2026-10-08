import { hotDb } from '../connection.js';
import '../migrations.js';
import { DAY_MS, HOUR_MS, SERVER_STATE, SNAPSHOT, snapshotRow } from '../../lib/gameParse.js';

// The stored server browser (S15): servers, server_snapshots, server_hours
// (hot file; see migrations.js ensureServerTables).

const upsertServer = hotDb.prepare(`
  INSERT INTO servers (ip, name, notes, version, first_seen, last_seen, last_online)
  VALUES (@ip, @name, @notes, @version, @seen, @seen, @last_online)
  ON CONFLICT(ip) DO UPDATE SET
    name = excluded.name, notes = excluded.notes, version = excluded.version,
    last_seen = excluded.last_seen, last_online = COALESCE(excluded.last_online, last_online)
`);
const insertTick = hotDb.prepare(`
  INSERT OR IGNORE INTO server_snapshots (at, ip, online, players, max_players, state)
  VALUES (@at, @ip, @online, @players, @max_players, @state)
`);
const addToHour = hotDb.prepare(`
  INSERT INTO server_hours (ip, hour, samples, online, lobby, match, pilots, match_pilots, peak)
  VALUES (@ip, @hour, 1, @online, @lobby, @match, @players, @match_pilots, @players)
  ON CONFLICT(ip, hour) DO UPDATE SET
    samples = samples + 1, online = online + excluded.online, lobby = lobby + excluded.lobby,
    match = match + excluded.match, pilots = pilots + excluded.pilots,
    match_pilots = match_pilots + excluded.match_pilots, peak = MAX(peak, excluded.peak)
`);

/**
 * Stores one tick of the server browser taken at `at` (ms): each server's
 * listing, its raw row, and the tick added to its hour, in one transaction. An
 * entry repeated in one answer, or a tick already stored at the same `at`,
 * counts once. Returns the number of servers stored.
 */
export const saveServerSnapshot = hotDb.transaction((at, entries) => {
  const seen = new Date(at).toISOString();
  const hour = Math.floor(at / HOUR_MS);
  const done = new Set();
  for (const entry of entries || []) {
    const row = snapshotRow(entry);
    if (!row || done.has(row.ip)) continue;
    done.add(row.ip);
    const { server } = entry;
    upsertServer.run({
      ip: row.ip, name: server.name ?? null, notes: server.serverNotes ?? null, version: server.version ?? null,
      seen, last_online: server.lastSeen ?? null
    });
    if (insertTick.run({ at, ...row }).changes === 0) continue;
    addToHour.run({
      ip: row.ip, hour, online: row.online, players: row.players,
      lobby: row.state === SERVER_STATE.lobby ? 1 : 0,
      match: row.state === SERVER_STATE.match ? 1 : 0,
      match_pilots: row.state === SERVER_STATE.match ? row.players : 0
    });
  }
  return done.size;
});

const deleteTicksBefore = hotDb.prepare('DELETE FROM server_snapshots WHERE at < ?');
// Drops raw ticks older than SNAPSHOT.keepDays days; the hours stay.
export const pruneServerSnapshots = (now = Date.now()) => deleteTicksBefore.run(now - SNAPSHOT.keepDays * DAY_MS).changes;

const getServerStmt = hotDb.prepare('SELECT ip, name, notes, version, first_seen, last_seen, last_online FROM servers WHERE ip = ?');
// A server's latest listing, or undefined for one never stored.
export const getServerListing = ip => getServerStmt.get(ip);
