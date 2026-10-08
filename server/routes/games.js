import express from 'express';
import axios from 'axios';
import db from '../db.js';
import scraperService from '../services/scraperService.js';
import ingest from '../ingest.js';
import cacheService from '../services/cacheService.js';

// Matches: the history list, the archive list, one match (stored, upstream or live by IP) and its kill feed.
const router = express.Router();

// GET /api/games - Paginated history with Read-Through Caching
router.get('/games', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    console.log('[DEBUG] GET /games query:', JSON.stringify(req.query));
    const search = req.query.search ? req.query.search.trim() : null;
    if (search) console.log(`[API] Searching for: "${search}"`);
    const startDate = req.query.startDate || null;
    const limit = 25;
    const offset = (page - 1) * limit;

    try {
        // 1. Query Local DB First
        let games = db.getGames(limit, offset, search, startDate).map(row => JSON.parse(row.details));
        let countResult = db.countGames(search, startDate);

        // 2. Smart Sync (Read-Through)
        // Only sync if:
        // a) It's Page 1 (to get latest games), OR
        // b) We don't have enough games locally for this page (and it's not a search)
        if (!search && (page === 1 || games.length < limit)) {
            // For Page 1, we rely on the ingest module's TTL (30s) to prevent spam
            const sync = ingest.syncPage(page);

            // A full page goes out now and the sync lands new rows for the next request.
            // Only a page the DB cannot fill yet waits for the tracker.
            if (games.length === limit) {
                sync.catch(syncError => console.warn(`[Route] Background sync of page ${page} failed: ${syncError.message}`));
            } else {
                try {
                    await sync;
                    games = db.getGames(limit, offset, search, startDate).map(row => JSON.parse(row.details));
                    countResult = db.countGames(search, startDate);
                } catch (syncError) {
                    console.warn(`[Route] Failed to sync page ${page}, serving cached data. Error: ${syncError.message}`);
                }
            }
        }

        res.json({
            count: countResult.count,
            games: games
        });
    } catch (e) {
        console.error("Error fetching games:", e);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// GET /api/cold/games - Cold Storage Games
router.get('/cold/games', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const search = req.query.search ? req.query.search.trim() : null;
    const limit = 25;
    const offset = (page - 1) * limit;

    try {
        const games = db.getColdGames(limit, offset, search).map(row => JSON.parse(row.details));
        const countResult = db.countColdGames(search);

        res.json({
            count: countResult.count,
            games: games
        });
    } catch (e) {
        console.error("Error fetching cold games:", e);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// GET /api/cold/stats - Cold Storage Stats
router.get('/cold/stats', (req, res) => {
    try {
        const stats = db.getColdDatabaseStats.get();
        res.json(stats);
    } catch (e) {
        console.error("Error fetching cold stats:", e);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// GET /api/game/:id - Get specific game (DB first, then API/Scraper)
router.get('/game/:id', async (req, res) => {
    const id = req.params.id;

    // Check if ID is an IP address (simple check: contains dots and not just numbers)
    const isIpAddress = id.includes('.') && isNaN(id);

    if (isIpAddress) {
        // It's a live game request! Check cache first, then use the scraper.
        const liveCacheKey = `live_game_${id}`;
        const cachedLiveData = await cacheService.get(liveCacheKey);
        if (cachedLiveData) {
            return res.json(cachedLiveData);
        }

        const liveData = await scraperService.fetchLiveGameData(id);
        if (liveData) {
            // Cache live game scraping for 10 seconds to protect upstream from burst requests
            await cacheService.set(liveCacheKey, liveData, 10);
            return res.json(liveData);
        } else {
            return res.status(404).json({ error: "Live game not found or could not be scraped" });
        }
    }

    // --- Existing Logic for Historical Games (Numeric IDs) ---
    try {
        // Check Cache for Game Details
        const cacheKey = `game_${id}`;
        const cachedGame = await cacheService.get(cacheKey);
        if (cachedGame) {
            return res.json(cachedGame);
        }

        // 1. Try Local DB First
        const row = db.getGameById.get(id);
        let game = null;

        if (row) {
            game = JSON.parse(row.details);
            // Check if it's a full game detail or just a summary
            const isSummary = (!game.events || game.events.length === 0) &&
                (!game.kills || game.kills.length === 0) &&
                (!game.damageMatrix);

            if (!isSummary) {
                // Cache full game details for a long time (1 hour) as they don't change often
                await cacheService.set(cacheKey, game, 3600);
                return res.json(game);
            }
            console.log(`Game ${id} found in DB but appears to be a summary. Fetching full details...`);
        } else {
            console.log(`Game ${id} not in DB. Fetching from API...`);
        }

        // 2. If missing or summary, fetch from API with a 4s timeout
        let freshGame = null;
        try {
            const response = await axios.get(`https://tracker.otl.gg/api/game/${id}`, { timeout: 4000 });
            freshGame = response.data;
        } catch (fetchErr) {
            console.warn(`[API] Upstream tracker.otl.gg request for game ${id} failed: ${fetchErr.message}`);
        }

        if (freshGame) {
            if (row) {
                // Update existing record with full details
                db.updateGameDetails(freshGame);
            } else {
                // Save new record
                db.saveGames([freshGame]);
            }
            // Cache the fresh game
            await cacheService.set(cacheKey, freshGame, 3600);
            return res.json(freshGame);
        } else {
            if (game) {
                console.warn(`Upstream unavailable for game ${id}, returning local DB record.`);
                return res.json({ ...game, _partial: true });
            } else {
                return res.status(503).json({
                    error: "Tracker telemetry currently unavailable. The upstream service (tracker.otl.gg) could not be reached.",
                    gameId: id
                });
            }
        }
    } catch (e) {
        console.error(`Error fetching game ${id}:`, e.message);
        // Fallback to DB summary if API fails
        const row = db.getGameById.get(id);
        if (row) {
            try {
                return res.json(JSON.parse(row.details));
            } catch {}
        }
        res.status(503).json({
            error: "Tracker telemetry currently unavailable.",
            gameId: id
        });
    }
});

// GET /api/match/:id/kills & /api/game/:id/kills - Normalized kill feed for Tactical Replay
const getMatchKillsHandler = async (req, res) => {
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: "Invalid match ID" });

    try {
        let game = null;
        const cacheKey = `game_${id}`;
        const cachedGame = await cacheService.get(cacheKey);
        if (cachedGame) {
            game = cachedGame;
        } else {
            const row = db.getGameById.get(id);
            if (row) {
                game = JSON.parse(row.details);
            }
        }

        // If not found or summary without kills, attempt upstream fetch if numeric ID
        const hasKills = game && Array.isArray(game.kills) && game.kills.length > 0;
        if (!hasKills && !isNaN(id)) {
            try {
                const response = await axios.get(`https://tracker.otl.gg/api/game/${id}`, { timeout: 4000 });
                if (response.data) {
                    game = response.data;
                    const row = db.getGameById.get(id);
                    if (row) {
                        db.updateGameDetails(game);
                    } else {
                        db.saveGames([game]);
                    }
                    await cacheService.set(cacheKey, game, 3600);
                }
            } catch (err) {
                // Ignore upstream fetch error, proceed with whatever we have
            }
        }

        if (!game) {
            return res.status(404).json({ error: "Match not found" });
        }

        let rawKills = game.kills || [];
        if (!rawKills.length && game.events && Array.isArray(game.events)) {
            rawKills = game.events.filter(e => e.type === 'Kill').map(e => ({
                time: e.time,
                attacker: e.attacker || e.player,
                defender: e.defender,
                weapon: e.weapon
            }));
        }

        const kills = rawKills.map(k => {
            const killer = k.attacker || k.killer || '';
            const victim = k.defender || k.victim || '';
            const weapon = k.weapon || 'Unknown';
            const suicide = Boolean((killer && victim && killer === victim) || weapon === 'Suicide' || weapon === 'Self-Destruct' || !killer);
            return {
                t: typeof k.time === 'number' ? k.time : (parseFloat(k.time) || 0),
                killer,
                victim,
                weapon,
                suicide
            };
        }).sort((a, b) => a.t - b.t);

        return res.json(kills);
    } catch (e) {
        console.error(`Error fetching kills for match ${id}:`, e.message);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

router.get('/match/:id/kills', getMatchKillsHandler);
router.get('/game/:id/kills', getMatchKillsHandler);

export default router;
