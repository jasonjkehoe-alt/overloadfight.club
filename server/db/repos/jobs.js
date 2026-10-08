import { hotDb } from '../connection.js';
import '../migrations.js';

// Backfill jobs and per-game fetch status (hot file).

export const getBackfillJob = hotDb.prepare('SELECT * FROM backfill_jobs WHERE id = ?');

export const getActiveBackfillJob = hotDb.prepare(`
    SELECT * FROM backfill_jobs 
    WHERE status IN ('pending', 'running', 'paused') 
    ORDER BY created_at DESC 
    LIMIT 1
`);

export const createBackfillJob = hotDb.prepare(`
    INSERT INTO backfill_jobs (start_game_id, end_game_id, rate_limit_ms, current_id, job_type)
    VALUES (?, ?, ?, ?, ?)
`);

export const updateBackfillJob = hotDb.prepare(`
    UPDATE backfill_jobs 
    SET status = ?, current_id = ?, total_fetched = ?, total_failed = ?, 
        started_at = COALESCE(started_at, ?), completed_at = ?
    WHERE id = ?
`);

export const deleteBackfillJob = hotDb.prepare('DELETE FROM backfill_jobs WHERE id = ?');

export const insertGameMetadata = hotDb.prepare(`
    INSERT OR REPLACE INTO game_metadata (game_id, fetch_status, fetch_attempts, last_fetch_at, error_message)
    VALUES (?, ?, ?, ?, ?)
`);

export const getGameMetadata = hotDb.prepare('SELECT * FROM game_metadata WHERE game_id = ?');
