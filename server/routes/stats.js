import express from 'express';
import db from '../db.js';
import cacheService from '../services/cacheService.js';

// /stats/*: site totals, the archive's deep stats, the leaderboard, the power rankings, the active-pilot count, map stats, the activity timeline and heatmap, the region share.
const router = express.Router();

// GET /api/stats/global - Global Database Statistics
router.get('/stats/global', async (req, res) => {
    try {
        const startDate = req.query.startDate || null;
        const source = req.query.source || 'hot'; // 'hot' or 'all'
        const cacheKey = `global_stats_${startDate || 'all'}_${source}`;

        // Check Cache
        const cachedData = await cacheService.get(cacheKey);
        if (cachedData) {
            return res.json(cachedData);
        }

        let stats, topMaps, modes, activity, serverActivity;

        if (source === 'all') {
            // Fetch All-Time Stats (Hot + Cold)
            stats = db.getAllTimeGlobalStats.get();
            const kills = db.getAllTimeGlobalKills.get();
            stats.total_kills = kills ? kills.total_kills : 0;

            // For All-Time, we might want to limit expensive aggregations or use specific All-Time queries
            // Currently, we only have specific All-Time queries for Pilots and Maps (top 10)
            // For modes/activity, we might still fallback to Hot DB or implement All-Time versions if needed
            // For now, let's use Hot DB for charts to keep it fast, but All-Time for the big numbers

            // Actually, let's just return the big numbers for the Cold Storage view
            // The Cold Storage view mainly needs: total_games, total_kills, unique_pilots (from pilots endpoint), oldest_record

            topMaps = db.getAllTimeMapStats.all().map(row => ({
                name: row.map || 'Unknown',
                value: row.count
            }));

            // We don't have All-Time modes/activity yet, so return empty or Hot DB
            modes = [];
            activity = [];
            serverActivity = [];

        } else {
            // Standard Hot DB Stats
            stats = db.getDatabaseStats.get(startDate);

            // Calculate total kills for Hot DB (we need a query for this if it's not in getDatabaseStats)
            // getDatabaseStats doesn't have total_kills. We might need to add it or just ignore for now.
            // Existing code didn't return total_kills for global stats? 
            // Wait, the screenshot showed "Total Kills" card. 
            // Let's check getDatabaseStats in db.js again. It DOES NOT have total_kills.
            // So the current dashboard probably doesn't show total kills in the global stats section?
            // Or it calculates it differently.
            // The Cold Storage view specifically asks for it.

            topMaps = db.getGlobalMapStats.all(startDate).map(row => ({
                name: row.map || 'Unknown',
                value: row.count
            }));

            modes = db.getGlobalModeStats.all(startDate).map(row => ({
                name: row.mode || 'Unknown',
                value: row.count
            }));

            activity = db.getGlobalActivityStats.all(startDate);
            serverActivity = db.getServerActivityStats.all();
        }

        const responseData = {
            ...stats,
            topMaps,
            modes,
            activity,
            serverActivity
        };

        // Update Cache (5 minutes)
        await cacheService.set(cacheKey, responseData, 300);

        res.json(responseData);
    } catch (e) {
        console.error("Error fetching global stats:", e);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// GET /api/stats/cold/deep - Aggregated Cold Storage Stats
router.get('/stats/cold/deep', async (req, res) => {
    try {
        const cacheKey = 'cold_storage_deep_stats';
        const cached = await cacheService.get(cacheKey);
        if (cached) {
            return res.json(cached);
        }
        const stats = await db.getColdStorageStats();
        await cacheService.set(cacheKey, stats, 600);
        res.json(stats);
    } catch (err) {
        console.error("Deep stats API error:", err);
        res.status(500).json({ error: "Failed to fetch deep stats" });
    }
});

// Get aggregated pilot stats (Server-Side)
router.get('/stats/pilots', async (req, res) => {
    try {
        const startDate = req.query.startDate || null;
        const source = req.query.source || 'hot';
        const limitParam = req.query.limit !== undefined ? parseInt(req.query.limit, 10) : null;
        const offsetParam = req.query.offset ? parseInt(req.query.offset, 10) : 0;
        const cacheKey = `pilot_stats_${startDate || 'all'}_${source}`;

        let stats = await cacheService.get(cacheKey);
        if (!stats) {
            if (source === 'all' && !startDate) {
                stats = db.getAllTimePilotStats.all();
            } else {
                stats = db.getPilotStats.all(startDate);
            }
            await cacheService.set(cacheKey, stats, 300); // 5 minutes
        }

        // Honor limit parameter if provided (e.g. ?limit=50 or ?limit=50&offset=0)
        if (limitParam !== null && !isNaN(limitParam) && limitParam >= 0) {
            return res.json(stats.slice(offsetParam, offsetParam + limitParam));
        }

        res.json(stats);

    } catch (error) {
        console.error('Error fetching pilot stats:', error);
        res.status(500).json({ error: 'Failed to fetch pilot stats' });
    }
});

// GET /api/stats/rankings - Power rankings with weekly movement (S13)
router.get('/stats/rankings', (req, res) => {
    try {
        res.json(db.getPowerRankings());
    } catch (e) {
        console.error("Power Rankings Error:", e);
        res.status(500).json({ error: "Failed to fetch power rankings" });
    }
});

// GET /api/stats/heatmap - Matches per weekday and hour, fight-night days (S14)
router.get('/stats/heatmap', async (req, res) => {
    try {
        const cached = await cacheService.get('activity_heatmap');
        if (cached) return res.json(cached);
        const heatmap = db.getActivityHeatmap();
        await cacheService.set('activity_heatmap', heatmap, 300);
        res.json(heatmap);
    } catch (e) {
        console.error("Heatmap Error:", e);
        res.status(500).json({ error: "Failed to fetch activity heatmap" });
    }
});

// GET /api/stats/regions - Stored matches per server region per month (S15),
// from region_months, which each stats refresh brings in line; no route cache,
// so the answer is never older than the table.
router.get('/stats/regions', (req, res) => {
    try {
        res.json(db.getRegionShare());
    } catch (e) {
        console.error("Region share Error:", e);
        res.status(500).json({ error: "Failed to fetch region share" });
    }
});

// GET /api/stats/active-count - Active Pilots (90d)
router.get('/stats/active-count', async (req, res) => {
    try {
        const cached = await cacheService.get('active_pilot_count');
        if (cached) return res.json(cached);

        const result = db.getActivePilotCount.get();
        const count = result ? result.count : 0;

        const data = { count };
        await cacheService.set('active_pilot_count', data, 600); // 10 minutes cache
        res.json(data);
    } catch (e) {
        console.error("Active Count Error:", e);
        res.status(500).json({ error: "Failed to fetch active count" });
    }
});

// Get robust map stats
// S16: the weapon meta, the specialist grid, the duel ladder and the objective
// boards, each from a derived table the stats refresh keeps; no route cache,
// so an answer is never older than its table.
const derivedRoute = (path, read, label) => router.get(path, (req, res) => {
    try {
        res.json(read());
    } catch (e) {
        console.error(`${label} Error:`, e);
        res.status(500).json({ error: `Failed to fetch ${label.toLowerCase()}` });
    }
});
// GET /api/stats/weapons - kills on opponents per weapon family, overall and per map
derivedRoute('/stats/weapons', () => db.getWeaponMeta(), 'Weapon meta');
// GET /api/stats/specialists - the top pilots' records on the top maps
derivedRoute('/stats/specialists', () => db.getSpecialists(), 'Specialists');
// GET /api/stats/duels - the 1v1 duel ladder for today
derivedRoute('/stats/duels', () => db.getDuelLadder(), 'Duel ladder');
// GET /api/stats/objectives - the CTF and Monsterball boards
derivedRoute('/stats/objectives', () => db.getObjectiveBoards(), 'Objective boards');

router.get('/stats/maps', async (req, res) => {
    try {
        const source = req.query.source || 'hot';
        const cacheKey = `map_stats_${source}`;
        const cachedMaps = await cacheService.get(cacheKey);
        if (cachedMaps) {
            return res.json(cachedMaps);
        }

        let data;
        if (source === 'all') {
            const topPlayed = db.getTopPlayedMapsFromCache(20);
            data = { topPlayed };
        } else {
            const topPlayed = db.getTopPlayedMapsFromCache(10);
            const recentTop = db.getRecentTopMapsFromCache(10);
            const deadliest = db.getDeadliestMapsFromCache(10);
            const mostActive = db.getMostActiveMaps.all().map(row => ({
                ...row,
                avg_players: row.avg_players || 0
            }));
            const marathon = db.getMarathonMaps.all();

            data = {
                topPlayed,
                recentTop,
                mostActive,
                deadliest,
                marathon
            };
        }

        await cacheService.set(cacheKey, data, 300);
        res.json(data);
    } catch (error) {
        console.error('Error fetching map stats:', error);
        res.status(500).json({ error: 'Failed to fetch map stats' });
    }
});

// GET /api/stats/activity-timeline - Get All-Time Activity
router.get('/stats/activity-timeline', async (req, res) => {
    try {
        // a year of dates counted per fight-night day in JS, so cached like the other aggregates
        const cached = await cacheService.get('activity_timeline');
        if (cached) return res.json(cached);
        const timeline = db.getGameCountsByDate.all();
        await cacheService.set('activity_timeline', timeline, 300);
        res.json(timeline);
    } catch (error) {
        console.error('Error fetching activity timeline:', error);
        res.status(500).json({ error: 'Failed to fetch activity timeline' });
    }
});

export default router;
