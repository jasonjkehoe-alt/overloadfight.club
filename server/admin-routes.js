import express from 'express';
// Force sync update
import db from './db.js';
import backfillManager from './backfill.js';
import localIngest from './local-ingest.js';
import mapSyncService from './services/mapSyncService.js';
import archiveIngestService from './services/archiveIngestService.js';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { requireAuth, login, logout, checkAuth, loginRateLimit } from './auth.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Authentication routes (not protected)
router.post('/login', loginRateLimit, login);
router.post('/logout', logout);
router.get('/auth-status', checkAuth);

// Protected admin routes
router.use(requireAuth);

// GET /api/admin/backup - Download a consistent copy of the database
router.get('/backup', async (req, res) => {
    const copyPath = path.join('uploads', `tracker_backup_${Date.now()}.db`);
    try {
        await db.backupHot(copyPath);
        res.download(copyPath, `tracker_backup_${new Date().toISOString().split('T')[0]}.db`, () => fs.rmSync(copyPath, { force: true }));
    } catch (e) {
        console.error('Backup failed:', e);
        fs.rmSync(copyPath, { force: true });
        res.status(500).json({ error: 'Failed to back up database' });
    }
});

// POST /api/admin/restore - Restore database from backup
router.post('/restore', upload.single('backup'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        // Write the upload into the live database through SQLite, not over the file
        await db.restoreHot(req.file.path);

        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

        res.json({ success: true, message: 'Database restored successfully. Please restart the server.' });
    } catch (e) {
        console.error('Restore failed:', e);
        res.status(500).json({ error: 'Failed to restore database' });
    }
});

// Get database statistics
router.get('/stats', (req, res) => {
    try {
        const stats = db.getDatabaseStats.get();
        const coldStats = db.getColdDatabaseStats ? db.getColdDatabaseStats.get() : null;
        const activeJob = backfillManager.getActiveJob();
        const lastRefreshed = db.getMaxPilotStatsLastUpdated ? db.getMaxPilotStatsLastUpdated() : null;

        const totalGames = (stats?.total_games || 0) + (coldStats?.total_games || 0);
        const earliestDate = [stats?.earliest_date, coldStats?.earliest_date].filter(Boolean).sort()[0] || null;
        const latestDate = [stats?.latest_date, coldStats?.latest_date].filter(Boolean).sort().reverse()[0] || null;
        const minId = [stats?.min_game_id, coldStats?.min_game_id].filter(id => id != null).sort((a, b) => a - b)[0] ?? null;
        const maxId = [stats?.max_game_id, coldStats?.max_game_id].filter(id => id != null).sort((a, b) => b - a)[0] ?? null;

        res.json({
            ...stats,
            total_games: totalGames,
            earliest_date: earliestDate,
            latest_date: latestDate,
            min_game_id: minId,
            max_game_id: maxId,
            last_stats_refresh: lastRefreshed,
            activeJob: activeJob ? backfillManager.getJobStatus(activeJob.id) : null
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get extended statistics for Command Center
router.get('/stats/extended', (req, res) => {
    try {
        const stats = db.getDatabaseStats.get();
        const coldStats = db.getColdDatabaseStats ? db.getColdDatabaseStats.get() : null;
        const monthly = db.getMonthlyGameCounts.all();
        const activeJob = backfillManager.getActiveJob();
        const lastRefreshed = db.getMaxPilotStatsLastUpdated ? db.getMaxPilotStatsLastUpdated() : null;

        const totalGames = (stats?.total_games || 0) + (coldStats?.total_games || 0);
        const earliestDate = [stats?.earliest_date, coldStats?.earliest_date].filter(Boolean).sort()[0] || null;
        const latestDate = [stats?.latest_date, coldStats?.latest_date].filter(Boolean).sort().reverse()[0] || null;
        const minId = [stats?.min_game_id, coldStats?.min_game_id].filter(id => id != null).sort((a, b) => a - b)[0] ?? null;
        const maxId = [stats?.max_game_id, coldStats?.max_game_id].filter(id => id != null).sort((a, b) => b - a)[0] ?? null;

        res.json({
            overview: {
                totalGames,
                maxId,
                minId,
                earliestDate,
                latestDate,
                lastStatsRefresh: lastRefreshed
            },
            lastRefreshed,
            history: monthly,
            activeJob: activeJob ? backfillManager.getJobStatus(activeJob.id) : null
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/admin/maintenance/refresh-stats - Manually trigger stats cache refresh
router.post('/maintenance/refresh-stats', (req, res) => {
    try {
        console.log('[Admin] Manual stats cache refresh requested.');
        setImmediate(async () => {
            console.log('[Admin] Stats cache refresh started.');
            try {
                if (typeof db.refreshPilotStats === 'function') {
                    await db.refreshPilotStats();
                }
                console.log('[Admin] Stats cache refresh finished.');
            } catch (err) {
                console.error('[Admin] Error refreshing stats caches:', err);
            }
        });
        res.json({ started: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/admin/maintenance/refresh-stats - Get last stats refresh timestamp
router.get('/maintenance/refresh-stats', (req, res) => {
    try {
        const lastRefreshed = db.getMaxPilotStatsLastUpdated ? db.getMaxPilotStatsLastUpdated() : null;
        res.json({ last_refreshed: lastRefreshed });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get calendar stats (heatmap)
router.get('/stats/calendar', (req, res) => {
    try {
        const calendar = db.getGameCountsByDate.all();
        res.json(calendar);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start a new backfill job
router.post('/backfill/start', async (req, res) => {
    try {
        const { startGameId, endGameId, rateLimitMs, jobType } = req.body;

        if (!startGameId || !endGameId || !rateLimitMs) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        // Check if there's already an active job
        const activeJob = backfillManager.getActiveJob();
        if (activeJob && ['pending', 'running', 'paused'].includes(activeJob.status)) {
            return res.status(400).json({
                error: 'An active job already exists',
                jobId: activeJob.id
            });
        }

        // Create the job
        const jobId = backfillManager.createJob(
            parseInt(startGameId),
            parseInt(endGameId),
            parseInt(rateLimitMs),
            jobType || 'id_range'
        );

        // Start it asynchronously
        backfillManager.startBackfill(jobId).catch(err => {
            console.error('Backfill job failed:', err);
        });

        res.json({
            success: true,
            jobId,
            message: 'Backfill job started'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get backfill job status
router.get('/backfill/status/:jobId?', (req, res) => {
    try {
        let jobId = req.params.jobId;

        // If no jobId provided, get the active job
        if (!jobId) {
            const activeJob = backfillManager.getActiveJob();
            if (!activeJob) {
                return res.json({ job: null, message: 'No active job' });
            }
            jobId = activeJob.id;
        }

        const status = backfillManager.getJobStatus(parseInt(jobId));

        if (!status) {
            return res.status(404).json({ error: 'Job not found' });
        }

        res.json({ job: status });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Pause the current backfill job
router.post('/backfill/pause', (req, res) => {
    try {
        const paused = backfillManager.pauseJob();

        if (paused) {
            res.json({ success: true, message: 'Job will pause after current fetch' });
        } else {
            res.status(400).json({ error: 'No job is currently running' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Resume a paused job
router.post('/backfill/resume/:jobId', async (req, res) => {
    try {
        const jobId = parseInt(req.params.jobId);

        // Start it asynchronously
        backfillManager.startBackfill(jobId).catch(err => {
            console.error('Backfill job failed:', err);
        });

        res.json({ success: true, message: 'Job resumed' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Cancel/Delete a job
router.post('/backfill/cancel/:jobId', async (req, res) => {
    try {
        const jobId = parseInt(req.params.jobId);
        const activeJob = backfillManager.getActiveJob();

        // If it's the running job, signal cancellation
        if (activeJob && activeJob.id === jobId && backfillManager.isRunning) {
            backfillManager.cancelJob();
            return res.json({ success: true, message: 'Job cancellation requested' });
        }

        // Otherwise just delete it from DB
        db.deleteBackfillJob.run(jobId);
        res.json({ success: true, message: 'Job deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Manually fetch a single game
router.post('/fetch-game/:id', async (req, res) => {
    try {
        const gameId = parseInt(req.params.id);
        const result = await backfillManager.fetchGame(gameId);

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Detect gaps in game IDs
router.get('/detect-gaps', (req, res) => {
    try {
        const startId = parseInt(req.query.start || '1');
        const endId = parseInt(req.query.end || '10000');
        const limit = parseInt(req.query.limit || '100');

        const gaps = backfillManager.detectGaps(startId, endId, limit);

        res.json({
            startId,
            endId,
            totalGapsFound: gaps.length,
            gaps: gaps.slice(0, limit)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Scan local archive
router.post('/scan-local', async (req, res) => {
    try {
        const { path: dirPath } = req.body;
        // Default path if not provided
        const targetPath = dirPath || 'C:\\My Web Sites\\Overloadhtml\\tracker.otl.gg\\archive';

        console.log(`Starting local scan on: ${targetPath}`);

        // Run asynchronously
        localIngest.scanDirectory(targetPath).then(stats => {
            console.log('Local scan complete:', stats);
        }).catch(err => {
            console.error('Local scan failed:', err);
        });

        res.json({ success: true, message: 'Scan started in background' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin Settings
router.get('/settings', (req, res) => {
    try {
        const startupCheck = db.getAdminSetting.get('startup_backfill_enabled');
        const coldCheck = db.getAdminSetting.get('show_cold_storage');
        res.json({
            startup_backfill_enabled: startupCheck ? startupCheck.value === 'true' : false,
            show_cold_storage: coldCheck ? coldCheck.value === 'true' : false
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/settings/:key', (req, res) => {
    try {
        const setting = db.getAdminSetting.get(req.params.key);
        res.json({ value: setting ? setting.value : null });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/settings', (req, res) => {
    try {
        const { key, value } = req.body;
        if (!key) return res.status(400).json({ error: 'Key is required' });

        db.setAdminSetting.run(key, String(value));
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Map Management routes
// POST /api/admin/maps/sync - Sync maps from overloadmaps.com
router.post('/maps/sync', async (req, res) => {
    try {
        const result = await mapSyncService.syncFromUpstream();
        res.json(result);
    } catch (error) {
        console.error('Error syncing maps upstream:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/admin/maps - Add custom or manual map
router.post('/maps', (req, res) => {
    try {
        const { name, author, size, max_players, best_team_size, supports_ctf, style, remote_url, remote_image_url } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Map name is required' });
        }

        const result = db.upsertMap({
            name: name.trim(),
            author: author?.trim() || 'Unknown',
            size: size || 'medium',
            max_players: parseInt(max_players, 10) || 8,
            best_team_size: parseInt(best_team_size, 10) || 4,
            supports_ctf: !!supports_ctf,
            style: style || 'mixed',
            remote_url: remote_url || null,
            remote_image_url: remote_image_url || null,
            is_custom: true
        });

        res.json({ success: true, id: result.lastInsertRowid });
    } catch (error) {
        console.error('Error adding map:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/admin/maps/:id - Delete map
router.delete('/maps/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (!id) return res.status(400).json({ error: 'Invalid map ID' });

        db.deleteMap(id);
        res.json({ success: true, message: 'Map deleted successfully' });
    } catch (error) {
        console.error('Error deleting map:', error);
        res.status(500).json({ error: error.message });
    }
});

// Archive Ingest Routes (GitHub Tracker Log Archive)
router.get('/archive-sync/status', (req, res) => {
    res.json(archiveIngestService.getStatus());
});

router.post('/archive-sync/start', async (req, res) => {
    try {
        const { months } = req.body || {};
        const status = await archiveIngestService.startIngestion(months);
        res.json({ success: true, status });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});

router.post('/archive-sync/cancel', (req, res) => {
    archiveIngestService.cancel();
    res.json({ success: true, message: 'Cancellation signal sent.' });
});

export default router;
