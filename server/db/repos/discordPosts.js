import { hotDb } from '../connection.js';
import '../migrations.js';

// Discord posts (hot file; see migrations.js ensureDiscordPosts).

const getPostStmt = hotDb.prepare('SELECT kind, key, status, tries, updated_at FROM discord_posts WHERE kind = ? AND key = ?');
export const getDiscordPost = (kind, key) => getPostStmt.get(kind, key) ?? null;

const putPostStmt = hotDb.prepare(`
  INSERT INTO discord_posts (kind, key, status, tries, updated_at)
  VALUES (@kind, @key, @status, @tries, @updated_at)
  ON CONFLICT(kind, key) DO UPDATE SET status = excluded.status, tries = excluded.tries, updated_at = excluded.updated_at
`);
// A row's `updated_at` is now unless given (a restore writes rows back as they were).
export const putDiscordPost = ({ kind, key, status, tries, updated_at = new Date().toISOString() }) =>
  putPostStmt.run({ kind, key, status, tries, updated_at });

const recentPostsStmt = hotDb.prepare('SELECT kind, key, status, tries, updated_at FROM discord_posts ORDER BY updated_at DESC LIMIT ?');
export const getRecentDiscordPosts = limit => recentPostsStmt.all(limit);

// Every row, and the rows written back over a restored backup's (db.restoreHot).
const allPostsStmt = hotDb.prepare('SELECT kind, key, status, tries, updated_at FROM discord_posts');
export const getAllDiscordPosts = () => allPostsStmt.all();
export const restoreDiscordPosts = hotDb.transaction(rows => {
  for (const row of rows) putDiscordPost(row);
});

// Drops the pending posts of `kind` keyed before `key`, which nothing will try again.
const dropStaleStmt = hotDb.prepare("UPDATE discord_posts SET status = 'dropped', updated_at = ? WHERE kind = ? AND key < ? AND status = 'pending'");
export const dropStaleDiscordPosts = (kind, key) => dropStaleStmt.run(new Date().toISOString(), kind, key).changes;
