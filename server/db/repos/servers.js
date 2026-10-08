import { hotDb } from '../connection.js';
import '../migrations.js';
import { DAY_MS, HOUR_MS, SERVER_STATE, SNAPSHOT, snapshotRow } from '../../lib/gameParse.js';

// The stored server browser (S15): servers, server_snapshots, server_hours
// (hot file; see migrations.js ensureServerTables).

const upsertServer = hotDb.prepare(`
  INSERT INTO servers (ip, name, notes, version, first_seen, last_seen, last_online)
  VALUES (@ip, @name, @notes, @version, @seen, @seen, @last_online)
  ON CONFLICT(ip) DO UPDATE SET
    name = COALESCE(excluded.name, name), notes = COALESCE(excluded.notes, notes),
    version = COALESCE(excluded.version, version),
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

// Servers listed within the raw window, for the ticks of those an answer leaves out.
const recentServers = hotDb.prepare('SELECT ip FROM servers WHERE last_seen >= ?').pluck();

/**
 * Stores one tick of the server browser taken at `at` (ms): each server's
 * listing, its raw row, and the tick added to its hour, in one transaction. A
 * server the tracker listed in the last SNAPSHOT.keepDays days that this
 * answer leaves out gets an offline tick, so dropping off the list counts
 * against its uptime. A server listed twice in one answer, or a tick already
 * stored at the same `at`, counts once (the raw row's key is (ip, at)).
 * Returns the number of ticks stored.
 */
export const saveServerSnapshot = hotDb.transaction((at, entries) => {
  const seen = new Date(at).toISOString();
  const hour = Math.floor(at / HOUR_MS);
  const rows = new Map();
  for (const entry of entries || []) {
    const row = snapshotRow(entry);
    if (!row || rows.has(row.ip)) continue;
    rows.set(row.ip, row);
    const { server } = entry;
    upsertServer.run({
      ip: row.ip, name: server.name ?? null, notes: server.serverNotes ?? null, version: server.version ?? null,
      seen, last_online: server.lastSeen ?? null
    });
  }
  for (const ip of recentServers.all(new Date(at - SNAPSHOT.keepDays * DAY_MS).toISOString())) {
    if (!rows.has(ip)) rows.set(ip, snapshotRow({ server: { ip, online: false } }));
  }
  let stored = 0;
  for (const row of rows.values()) {
    if (insertTick.run({ at, ...row }).changes === 0) continue;
    stored++;
    addToHour.run({
      ip: row.ip, hour, online: row.online, players: row.players,
      lobby: row.state === SERVER_STATE.lobby ? 1 : 0,
      match: row.state === SERVER_STATE.match ? 1 : 0,
      match_pilots: row.state === SERVER_STATE.match ? row.players : 0
    });
  }
  return stored;
});

const allServers = hotDb.prepare('SELECT ip FROM servers').pluck();
const deleteTicksBefore = hotDb.prepare('DELETE FROM server_snapshots WHERE ip = ? AND at < ?');
// Drops raw ticks older than SNAPSHOT.keepDays days, server by server so each
// delete is a range of the (ip, at) key; the hours stay.
export const pruneServerSnapshots = hotDb.transaction((now = Date.now()) => {
  let deleted = 0;
  for (const ip of allServers.all()) deleted += deleteTicksBefore.run(ip, now - SNAPSHOT.keepDays * DAY_MS).changes;
  return deleted;
});

const getServerStmt = hotDb.prepare('SELECT ip, name, notes, version, first_seen, last_seen, last_online FROM servers WHERE ip = ?');
// A server's latest listing, or undefined for one never stored.
export const getServerListing = ip => getServerStmt.get(ip);
