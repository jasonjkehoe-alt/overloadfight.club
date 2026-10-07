import axios from 'axios';
import db from './db.js';

const API_BASE = 'https://tracker.otl.gg/api';

class BackfillManager {
    constructor() {
        this.isRunning = false;
        this.currentJobId = null;
        this.pauseRequested = false;
        this.cancelRequested = false;
        this.startTime = null;
    }

    // Detect gaps in the database between start and end IDs
    detectGaps(startId, endId, limit = 1000) {
        try {
            const gaps = db.getGameGaps.all(startId, endId, limit);
            return gaps.map(row => row.missing_id);
        } catch (error) {
            console.error('Error detecting gaps:', error);
            return [];
        }
    }

    // Fetch a single game from the API
    async fetchGame(gameId) {
        try {
            const response = await axios.get(`${API_BASE}/game/${gameId}`, {
                timeout: 10000
            });

            if (response.data) {
                // Insert into database
                const game = response.data;
                const result = db.insertGame.run({
                    id: game.id || gameId,
                    date: game.start || game.date || new Date().toISOString(),
                    ip: game.server?.ip || game.ip || null,
                    details: JSON.stringify(game)
                });

                // Update metadata
                db.insertGameMetadata.run(
                    gameId,
                    'fetched',
                    1,
                    new Date().toISOString(),
                    null
                );

                return { success: true, gameId, changes: result.changes };
            }
        } catch (error) {
            // Update metadata with failure
            const existing = db.getGameMetadata.get(gameId);
            const attempts = existing ? existing.fetch_attempts + 1 : 1;

            db.insertGameMetadata.run(
                gameId,
                'failed',
                attempts,
                new Date().toISOString(),
                error.message
            );

            return { success: false, gameId, error: error.message };
        }
    }

    // Start or resume a backfill job
    async startBackfill(jobId) {
        if (this.isRunning) {
            throw new Error('A backfill job is already running');
        }

        const job = db.getBackfillJob.get(jobId);
        if (!job) {
            throw new Error('Job not found');
        }

        this.isRunning = true;
        this.currentJobId = jobId;
        this.pauseRequested = false;
        this.cancelRequested = false;
        this.startTime = Date.now();

        console.log(`Starting backfill job ${jobId}: ${job.start_game_id} to ${job.end_game_id} (${job.job_type || 'id_range'})`);

        // Update job status
        db.updateBackfillJob.run(
            'running',
            job.current_id || job.start_game_id,
            job.total_fetched || 0,
            job.total_failed || 0,
            new Date().toISOString(),
            null,
            jobId
        );

        try {
            if (job.job_type === 'page_sync') {
                await this.processPageSyncJob(job);
            } else if (job.job_type === 'hydrate') {
                await this.processHydrationJob(job);
            } else {
                await this.processBackfillJob(job);
            }
        } catch (error) {
            console.error('Backfill job error:', error);
            db.updateBackfillJob.run(
                'failed',
                job.current_id,
                job.total_fetched,
                job.total_failed,
                job.started_at,
                new Date().toISOString(),
                jobId
            );
        } finally {
            this.isRunning = false;
            this.currentJobId = null;
            this.startTime = null;
        }
    }

    // Process Page Sync Job (Reliable)
    async processPageSyncJob(job) {
        let currentPage = job.current_id || job.start_game_id; // For page sync, start_game_id acts as start_page
        const endPage = job.end_game_id; // end_game_id acts as end_page
        let totalFetched = job.total_fetched || 0;
        let totalFailed = job.total_failed || 0;

        console.log(`Starting Page Sync from page ${currentPage} to ${endPage}`);

        while (currentPage <= endPage) {
            // Check cancel
            if (this.cancelRequested) {
                console.log('Backfill job cancelled');
                db.deleteBackfillJob.run(job.id);
                return;
            }

            // Check pause
            if (this.pauseRequested) {
                console.log('Backfill job paused');
                db.updateBackfillJob.run(
                    'paused',
                    currentPage,
                    totalFetched,
                    totalFailed,
                    job.started_at,
                    null,
                    job.id
                );
                return;
            }

            // Fetch Page
            try {
                console.log(`Fetching page ${currentPage}...`);
                const response = await axios.get(`${API_BASE}/gamelist?page=${currentPage}`, {
                    timeout: 10000
                });

                if (!response.data || !response.data.games) {
                    console.log(`Page ${currentPage} returned invalid data structure. Stopping.`);
                    break;
                }

                const games = response.data.games;
                if (games.length === 0) {
                    console.log(`Page ${currentPage} is empty. Stopping.`);
                    break;
                }

                // Save games
                db.saveGames(games);
                totalFetched += games.length;
                console.log(`✓ Fetched page ${currentPage} (${games.length} games)`);

            } catch (error) {
                console.error(`Error fetching page ${currentPage}:`, error.message);
                totalFailed++;

                // If we get a 404 or 400, it likely means we ran out of pages
                if (error.response && (error.response.status === 404 || error.response.status === 400)) {
                    console.log(`Page ${currentPage} returned ${error.response.status}. Stopping.`);
                    break;
                }
            }

            currentPage++;

            // Update progress
            db.updateBackfillJob.run(
                'running',
                currentPage,
                totalFetched,
                totalFailed,
                job.started_at,
                null,
                job.id
            );

            // Rate limiting
            await this.sleep(job.rate_limit_ms);
        }

        // Job completed
        console.log(`Page Sync job completed. Total fetched: ${totalFetched}`);
        db.updateBackfillJob.run(
            'completed',
            currentPage,
            totalFetched,
            totalFailed,
            job.started_at,
            new Date().toISOString(),
            job.id
        );
    }

    // Process Hydration Job (Upgrade Summaries to Full)
    async processHydrationJob(job) {
        // Query for summary games (limit to 1000 per batch to prevent long running query issues, loop handles it)
        // Note: The job definition might have start/end IDs, but for hydration we mainly care about "incomplete" status.
        // We can respect start/end filter if we want, but simple "get next 1000 summaries" is easier.
        // Let's use getSummaryGames(limit) from db.js

        let totalFetched = job.total_fetched || 0;
        let totalFailed = job.total_failed || 0;

        console.log(`Starting Hydration Job ${job.id}...`);

        // Walk summaries in id order. A game the tracker returns without kills,
        // or that fails, stays a summary, so never ask for it again in this pass.
        // A paused job saved the game it had not fetched yet as current_id.
        let lastId = Math.max(0, (job.current_id || 0) - 1);

        while (true) {
            // Check cancel/pause
            if (this.cancelRequested || this.pauseRequested) break;

            const batchLimit = 50;
            const summaries = db.getSummaryGames.all(lastId, batchLimit);

            if (summaries.length === 0) {
                console.log("No more summary games found to hydrate.");
                break;
            }

            console.log(`Found batch of ${summaries.length} summaries to hydrate...`);

            for (const row of summaries) {
                const gameId = row.id;
                lastId = gameId;

                // Check cancel
                if (this.cancelRequested) {
                    console.log('Hydration job cancelled');
                    db.deleteBackfillJob.run(job.id);
                    return;
                }

                // Check pause
                if (this.pauseRequested) {
                    console.log('Hydration job paused');
                    db.updateBackfillJob.run(
                        'paused',
                        gameId,
                        totalFetched,
                        totalFailed,
                        job.started_at,
                        null,
                        job.id
                    );
                    return;
                }

                const result = await this.fetchGame(gameId);

                if (result.success) {
                    totalFetched++;
                    console.log(`✓ Hydrated game ${gameId}`);
                } else {
                    totalFailed++;
                    console.log(`✗ Failed to hydrate game ${gameId}: ${result.error}`);
                }

                // Update progress
                // For hydration, "current_id" is just the last one we touched
                db.updateBackfillJob.run(
                    'running',
                    gameId,
                    totalFetched,
                    totalFailed,
                    job.started_at,
                    null,
                    job.id
                );

                await this.sleep(job.rate_limit_ms);
            }
        }

        if (this.pauseRequested) return;

        console.log(`Hydration job completed. Total hydrated: ${totalFetched}`);
        db.updateBackfillJob.run(
            'completed',
            0, // No specific end ID
            totalFetched,
            totalFailed,
            job.started_at,
            new Date().toISOString(),
            job.id
        );
    }

    // Process the backfill job (Legacy ID Range)
    async processBackfillJob(job) {
        const gaps = this.detectGaps(job.current_id || job.start_game_id, job.end_game_id);

        console.log(`Found ${gaps.length} missing games to fetch`);

        let totalFetched = job.total_fetched || 0;
        let totalFailed = job.total_failed || 0;
        let currentId = job.current_id || job.start_game_id;

        for (const gameId of gaps) {
            // Check if cancel requested
            if (this.cancelRequested) {
                console.log('Backfill job cancelled');
                // We delete the job if cancelled
                db.deleteBackfillJob.run(job.id);
                return;
            }

            // Check if pause requested
            if (this.pauseRequested) {
                console.log('Backfill job paused');
                db.updateBackfillJob.run(
                    'paused',
                    currentId,
                    totalFetched,
                    totalFailed,
                    job.started_at,
                    null,
                    job.id
                );
                return;
            }

            // Fetch the game
            const result = await this.fetchGame(gameId);

            if (result.success) {
                totalFetched++;
                console.log(`✓ Fetched game ${gameId} (${totalFetched}/${gaps.length})`);
            } else {
                totalFailed++;
                console.log(`✗ Failed to fetch game ${gameId}: ${result.error}`);
            }

            currentId = gameId;

            // Update job progress
            db.updateBackfillJob.run(
                'running',
                currentId,
                totalFetched,
                totalFailed,
                job.started_at,
                null,
                job.id
            );

            // Rate limiting delay
            await this.sleep(job.rate_limit_ms);
        }

        // Job completed
        console.log(`Backfill job ${job.id} completed: ${totalFetched} fetched, ${totalFailed} failed`);
        db.updateBackfillJob.run(
            'completed',
            job.end_game_id,
            totalFetched,
            totalFailed,
            job.started_at,
            new Date().toISOString(),
            job.id
        );
    }

    // Pause the currently running job
    pauseJob() {
        if (this.isRunning) {
            this.pauseRequested = true;
            return true;
        }
        return false;
    }

    // Cancel the currently running job
    cancelJob() {
        if (this.isRunning) {
            this.cancelRequested = true;
            return true;
        }
        return false;
    }

    // Create a new backfill job
    createJob(startGameId, endGameId, rateLimitMs, jobType = 'id_range') {
        const result = db.createBackfillJob.run(startGameId, endGameId, rateLimitMs, startGameId, jobType);
        return result.lastInsertRowid;
    }

    // Get job status
    getJobStatus(jobId) {
        const job = db.getBackfillJob.get(jobId);
        if (!job) return null;

        // Calculate progress
        const totalGames = job.end_game_id - job.start_game_id + 1;
        const currentGames = (job.current_id || job.start_game_id) - job.start_game_id;
        const progress = Math.floor((currentGames / totalGames) * 100);

        // Calculate ETA
        let etaSeconds = 0;
        let gamesPerMinute = 0;
        let gamesRemaining = totalGames - currentGames;

        if (this.isRunning && this.currentJobId === jobId && this.startTime) {
            const elapsedSeconds = (Date.now() - this.startTime) / 1000;
            // Games fetched in this session (approximation, ideally we'd track session fetched count)
            // For now, we can use the rate limit as a baseline speed
            const msPerGame = job.rate_limit_ms + 200; // +200ms for network overhead
            gamesPerMinute = 60000 / msPerGame;
            etaSeconds = (gamesRemaining * msPerGame) / 1000;
        }

        return {
            ...job,
            progress,
            totalGames,
            gamesRemaining,
            gamesPerMinute: Math.round(gamesPerMinute * 10) / 10,
            etaSeconds: Math.round(etaSeconds),
            isRunning: this.isRunning && this.currentJobId === jobId
        };
    }

    // Get the active job
    getActiveJob() {
        return db.getActiveBackfillJob.get();
    }

    // Helper: sleep function
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Singleton instance
const backfillManager = new BackfillManager();

export default backfillManager;
