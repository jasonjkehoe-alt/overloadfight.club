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
export const putDiscordPost = ({ kind, key, status, tries }) =>
  putPostStmt.run({ kind, key, status, tries, updated_at: new Date().toISOString() });

const recentPostsStmt = hotDb.prepare('SELECT kind, key, status, tries, updated_at FROM discord_posts ORDER BY updated_at DESC LIMIT ?');
export const getRecentDiscordPosts = (limit = 5) => recentPostsStmt.all(limit);
