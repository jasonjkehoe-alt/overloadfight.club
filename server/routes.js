import express from 'express';
import axios from 'axios';
import path from 'path';
import fs from 'fs';
import db from './db.js';
import scraperService from './services/scraperService.js';
import ingest from './ingest.js';
import cacheService from './services/cacheService.js';
import fightNightService from './services/fightNightService.js';
import { requireAuth } from './auth.js';
import { GoogleGenAI } from "@google/genai";

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

// GET /api/browser - Proxy for live server browser with 15s caching
router.get('/browser', async (req, res) => {
    try {
        const cacheKey = 'browser_servers';
        const cached = await cacheService.get(cacheKey);
        if (cached) {
            return res.json(cached);
        }

        const response = await axios.get('https://tracker.otl.gg/api/browser', { timeout: 5000 });
        if (response.data) {
            await cacheService.set(cacheKey, response.data, 15); // 15-second TTL
        }
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching browser servers:', error.message);
        res.status(500).json({ error: 'Failed to fetch browser servers' });
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
        const stats = db.getColdStorageStats();
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
            if (source === 'all') {
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

// GET /api/maps - Query map library from SQLite with attached telemetry
router.get('/maps', (req, res) => {
    try {
        const search = req.query.search || null;
        const size = req.query.size || null;
        const type = req.query.type || null; // 'all', 'stock', 'custom'
        const limit = parseInt(req.query.limit, 10) || 1000;
        const offset = parseInt(req.query.offset, 10) || 0;
        const sortBy = req.query.sortBy || 'popularity'; // 'popularity', 'deadliest', 'recent', 'name', 'downloads', 'date'

        const rows = db.getMaps({ search, size, type, limit, offset, sortBy });
        const count = db.countMaps({ search, size, type });

        const mapped = rows.map(m => {
            const isStock = !m.is_custom && (m.author?.toLowerCase().includes('revival') || false);
            let topPilot = null;
            if (m.top_pilot) {
                try {
                    topPilot = typeof m.top_pilot === 'string' ? JSON.parse(m.top_pilot) : m.top_pilot;
                } catch {}
            }
            let recordMatch = null;
            if (m.record_match) {
                try {
                    recordMatch = typeof m.record_match === 'string' ? JSON.parse(m.record_match) : m.record_match;
                } catch {}
            }

            return {
                id: m.id,
                name: m.name,
                author: m.author,
                size: m.size,
                maxPlayers: m.max_players,
                bestTeamSize: m.best_team_size,
                supportsCTF: !!m.supports_ctf,
                style: m.style,
                date: m.release_date || '',
                image: `/api/maps/${m.id}/image`,
                downloadLink: m.is_custom ? `/api/maps/${m.id}/download` : null,
                downloads: m.downloads || 0,
                fileSize: m.file_size || 0,
                isCustom: !!m.is_custom,
                isStock: isStock,
                // Attached combat telemetry
                sorties: m.total_matches || 0,
                totalKills: m.total_kills || 0,
                totalDeaths: m.total_deaths || 0,
                totalDamage: m.total_damage || 0,
                avgPlayers: m.avg_players || 0,
                recent30d: m.recent_30d_matches || 0,
                firstPlayed: m.first_played || null,
                lastPlayed: m.last_played || null,
                topPilot: topPilot,
                recordMatch: recordMatch
            };
        });

        res.json({ count, maps: mapped });
    } catch (e) {
        console.error('Error fetching maps:', e);
        res.status(500).json({ error: 'Failed to fetch maps' });
    }
});

// GET /api/maps/:id/intel - Detailed combat intel and aces for a map
router.get('/maps/:id/intel', (req, res) => {
    try {
        const idOrName = req.params.id;
        const intel = db.getMapIntel(idOrName);
        if (!intel) {
            return res.status(404).json({ error: 'Map intel not found' });
        }
        res.json(intel);
    } catch (e) {
        console.error('Error fetching map intel:', e);
        res.status(500).json({ error: e.message });
    }
});

// GET /api/maps/:id - Specific map detail
router.get('/maps/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const m = db.getMapById(id);
        if (!m) {
            return res.status(404).json({ error: 'Map not found' });
        }
        res.json({
            id: m.id,
            name: m.name,
            author: m.author,
            size: m.size,
            maxPlayers: m.max_players,
            bestTeamSize: m.best_team_size,
            supportsCTF: !!m.supports_ctf,
            style: m.style,
            date: m.release_date || '',
            image: `/api/maps/${m.id}/image`,
            downloadLink: `/api/maps/${m.id}/download`,
            downloads: m.downloads || 0,
            fileSize: m.file_size || 0,
            isCustom: !!m.is_custom
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/maps/by-name/:name/image - Lookup map by name and stream image
router.get('/maps/by-name/:name/image', async (req, res) => {
    try {
        const name = req.params.name;
        const map = db.getMapByName(name);
        if (!map) {
            return res.status(404).json({ error: 'Map not found' });
        }
        return res.redirect(`/api/maps/${map.id}/image`);
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
});

// GET /api/maps/:id/image - Local image cache and streaming
router.get('/maps/:id/image', async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const map = db.getMapById(id);
        if (!map) {
            return res.status(404).json({ error: 'Map not found' });
        }

        const safeBase = map.name.replace(/[^a-zA-Z0-9_-]/g, '_');
        const filename = map.local_image || `${safeBase}_${map.id}.jpg`;
        const localPath = path.join(db.mapImagesDir, filename);

        // If local file exists, serve with browser cache
        if (fs.existsSync(localPath)) {
            res.setHeader('Cache-Control', 'public, max-age=86400');
            res.setHeader('Content-Type', 'image/jpeg');
            return res.sendFile(localPath);
        }

        // If not cached locally, try remote image URL
        if (map.remote_image_url) {
            try {
                const imgRes = await axios.get(map.remote_image_url, {
                    responseType: 'arraybuffer',
                    timeout: 8000
                });
                fs.writeFileSync(localPath, imgRes.data);
                db.updateMapLocalPaths(map.id, null, filename);

                res.setHeader('Cache-Control', 'public, max-age=86400');
                res.setHeader('Content-Type', imgRes.headers['content-type'] || 'image/jpeg');
                return res.send(imgRes.data);
            } catch (err) {
                console.warn(`[MapImage] Remote image fetch failed for ${map.name}:`, err.message);
            }
        }

        res.status(404).json({ error: 'Image not available' });
    } catch (e) {
        console.error('Error fetching map image:', e);
        res.status(500).json({ error: 'Failed to fetch map image' });
    }
});

// GET /api/maps/:id/download - Stream/download map zip locally
router.get('/maps/:id/download', async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const map = db.getMapById(id);
        if (!map) {
            return res.status(404).json({ error: 'Map not found' });
        }

        // Track download count
        db.incrementMapDownloads(map.id);

        const safeBase = map.name.replace(/[^a-zA-Z0-9_-]/g, '_');
        const downloadFilename = `${map.name}.zip`;
        const localFilename = map.local_file || `${safeBase}_${map.id}.zip`;
        const localPath = path.join(db.mapsDir, localFilename);

        // If local file exists, serve directly from disk
        if (fs.existsSync(localPath)) {
            return res.download(localPath, downloadFilename);
        }

        // If not cached, download from remote URL and cache on disk
        if (map.remote_url) {
            try {
                console.log(`[MapDownload] Caching ${map.name} from ${map.remote_url}...`);
                const response = await axios({
                    method: 'GET',
                    url: map.remote_url,
                    responseType: 'stream',
                    timeout: 45000
                });

                res.attachment(downloadFilename);
                res.setHeader('Content-Type', 'application/zip');

                const fileStream = fs.createWriteStream(localPath);
                response.data.pipe(fileStream);
                response.data.pipe(res);

                fileStream.on('finish', () => {
                    db.updateMapLocalPaths(map.id, localFilename, null);
                    console.log(`[MapDownload] Successfully cached ${map.name} to disk.`);
                });

                fileStream.on('error', (err) => {
                    console.error(`[MapDownload] File write error for ${map.name}:`, err.message);
                });

                return;
            } catch (dlError) {
                console.error(`[MapDownload] Failed to download remote zip for ${map.name}:`, dlError.message);
                return res.status(502).json({ error: 'Failed to retrieve map archive from source' });
            }
        }

        res.status(404).json({ error: 'Download not available' });
    } catch (e) {
        console.error('Error processing map download:', e);
        res.status(500).json({ error: 'Failed to process download' });
    }
});

// Get robust map stats
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

// Get Calendar URL
router.get('/calendar-url', (req, res) => {
    try {
        const setting = db.getAdminSetting.get('CALENDAR_EMBED_URL');
        res.json({ url: setting ? setting.value : null });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch calendar url' });
    }
});


// GET /api/stats/activity-timeline - Get All-Time Activity
router.get('/stats/activity-timeline', async (req, res) => {
    try {
        // This query fetches daily game counts for the entire history
        // We use the existing function getGameCountsByDate
        const timeline = db.getGameCountsByDate.all();
        res.json(timeline);
    } catch (error) {
        console.error('Error fetching activity timeline:', error);
        res.status(500).json({ error: 'Failed to fetch activity timeline' });
    }
});

// POST /api/analyze-match - Generate AI Analysis for a game
router.post('/analyze-match', requireAuth, async (req, res) => {
    let ai;
    try {
        const gameData = req.body;
        if (!gameData) {
            return res.status(400).json({ error: "No game data provided" });
        }

        // 1. Get API Key (Env Var > DB Setting)
        let apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            const keySetting = db.getAdminSetting.get('GEMINI_API_KEY');
            if (keySetting && keySetting.value) {
                apiKey = keySetting.value;
            }
        }

        if (!apiKey) {
            return res.status(500).json({ error: "AI Service not configured (Key missing). Set GEMINI_API_KEY in environment or Admin Panel." });
        }

        // 2. Initialize Gemini
        ai = new GoogleGenAI({ apiKey });

        // 3. Construct Prompt
        const playersList = gameData.players?.map(p => `- ${p.name} (K:${p.kills}/D:${p.deaths}/A:${p.assists})`).join('\n') || "Unknown players";
        const damageList = gameData.damage?.slice(0, 5).map(d => `${d.attacker} hit ${d.defender} with ${d.weapon} for ${Math.round(d.damage)}`).join('\n') || "No damage data";
        const killFeed = gameData.kills?.slice(0, 5).map(k => `${k.attacker} killed ${k.defender} with ${k.weapon}`).join('\n') || "No kills";

        const prompt = `
          Analyze the following Overload (6DOF shooter) match statistics and provide a specialized, exciting commentary summary.
          Highlight the MVP, the most effective weapon, and any interesting rivalries based on the kill feed.
          
          Match Info: ${gameData.settings?.matchMode || 'Unknown Mode'} on ${gameData.settings?.level || 'Unknown Level'}
          Date: ${gameData.date || 'Unknown Date'}
          
          Players:
          ${playersList}
          
          Notable Weapon Usage (from first 5 records):
          ${damageList}
    
          Kill Feed Sample:
          ${killFeed}
          
          Keep it under 150 words. Use a sportscaster tone.
        `;

        // 4. Call API
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt,
        });

        // Handle response text extraction safely
        let text = "Analysis generated but text extraction failed.";
        if (response && typeof response.text === 'function') {
            text = response.text();
        } else if (response && response.text) {
            text = response.text;
        } else if (response?.candidates?.[0]?.content?.parts?.[0]?.text) {
            text = response.candidates[0].content.parts[0].text;
        }

        res.json({ text });

    } catch (e) {
        console.error("AI Analysis Failed:", e);
        const msg = e.response?.data?.error?.message || e.message || "Unknown Error";
        res.status(500).json({ error: "AI Analysis Failed: " + msg });
    }
});

// GET /api/pilot/:name/stats - Detailed Pilot Stats
router.get('/pilot/:name/stats', async (req, res) => {
    try {
        const name = req.params.name;
        const mode = req.query.mode || null;
        let startDate = req.query.startDate || null;
        if (startDate === 'all') startDate = null;

        // Default to checking 365d first
        const isDefault365 = (!startDate && req.query.timeframe !== 'all');
        if (isDefault365) {
            const oneYearAgo = new Date();
            oneYearAgo.setDate(oneYearAgo.getDate() - 365);
            startDate = oneYearAgo.toISOString();
        }

        const cacheKey = `pilot_telemetry_${name.toLowerCase()}_${isDefault365 ? '365d' : (startDate ? startDate.slice(0, 10) : 'all')}_${mode ? mode.toLowerCase() : 'all'}`;
        const cached = await cacheService.get(cacheKey);
        if (cached) return res.json(cached);

        let stats = db.getPilotDetailedStats.get({ name, startDate, mode });

        // If pilot has no games in the 365d window, fallback to all-time record
        if ((!stats || !stats.games) && startDate) {
            stats = db.getPilotDetailedStats.get({ name, startDate: null, mode });
        }

        if (stats) {
            if ((req.query.timeframe === 'all' || !startDate) && (!mode || mode.toLowerCase() === 'all')) {
                if (stats.career_games) {
                    stats.games = stats.career_games;
                    stats.kills = stats.career_kills ?? stats.kills;
                    stats.deaths = stats.career_deaths ?? stats.deaths;
                    stats.assists = stats.career_assists ?? stats.assists;
                    stats.suicides = stats.career_suicides ?? stats.suicides;
                    stats.wins = stats.career_wins ?? stats.wins;
                    stats.losses = stats.career_losses ?? stats.losses;
                    stats.ties = stats.career_ties ?? stats.ties;
                    stats.win_rate = stats.career_win_rate ?? stats.win_rate;
                    stats.pure_kd = stats.career_kd ?? stats.pure_kd;
                    stats.kda = stats.career_kda ?? stats.kda;
                    stats.flight_hours = stats.career_flight_hours ?? stats.flight_hours;
                }
            }
            stats.scope = isDefault365 ? 'recent' : 'all';
            await cacheService.set(cacheKey, stats, 300);
        }

        res.json(stats);
    } catch (e) {
        console.error("Pilot Stats Error:", e);
        res.status(500).json({ error: "Failed to fetch pilot stats" });
    }
});

// GET /api/pilot/:name/weapons - Pilot Weapon Mastery Breakdown
router.get('/pilot/:name/weapons', async (req, res) => {
    try {
        const name = req.params.name;
        const cacheKey = `pilot_weapons_${name.toLowerCase()}`;
        const cached = await cacheService.get(cacheKey);
        if (cached) return res.json(cached);

        const telemetry = db.getPilotTelemetry(name);
        if (!telemetry) return res.status(404).json({ error: "Pilot not found" });

        const result = {
            weapons: telemetry.weapons || [],
            summary: telemetry.weapon_summary || {}
        };
        await cacheService.set(cacheKey, result, 300);
        res.json(result);
    } catch (e) {
        console.error("Pilot Weapons Error:", e);
        res.status(500).json({ error: "Failed to fetch weapon stats" });
    }
});

// GET /api/pilot/:name/ppi - Pilot Performance Intelligence
router.get('/pilot/:name/ppi', async (req, res) => {
    try {
        const name = req.params.name;
        // A miss stays a miss until the scheduled refresh (maintenance.js) rebuilds
        // the cache; rebuilding it here let any visitor block the server.
        const stats = db.getPilotPPI(name);
        res.json(stats || {});
    } catch (e) {
        console.error("PPI API Error:", e);
        res.status(500).json({ error: "Failed to fetch PPI stats" });
    }
});

// GET /api/pilot/:name/breakdown - Pilot Map Combat & Rivals Breakdown
router.get('/pilot/:name/breakdown', async (req, res) => {
    try {
        const name = req.params.name;
        const cacheKey = `pilot_breakdown_${name.toLowerCase()}`;
        const cached = await cacheService.get(cacheKey);
        if (cached) return res.json(cached);

        const breakdown = db.getPilotBreakdown(name);
        if (breakdown) {
            await cacheService.set(cacheKey, breakdown, 300);
        }
        res.json(breakdown);
    } catch (e) {
        console.error("Pilot Breakdown Error:", e);
        res.status(500).json({ error: "Failed to fetch pilot breakdown" });
    }
});

// GET /api/pilot/:name/games - Pilot Match History
router.get('/pilot/:name/games', async (req, res) => {
    try {
        const name = req.params.name;
        const page = parseInt(req.query.page) || 1;
        const mode = req.query.mode || null;
        const limit = 25;
        const offset = (page - 1) * limit;

        let startDate = req.query.startDate || null;
        if (startDate === 'all') startDate = null;

        let filterDate = startDate;
        if (!filterDate && req.query.timeframe !== 'all') {
            const oneYearAgo = new Date();
            oneYearAgo.setDate(oneYearAgo.getDate() - 365);
            filterDate = oneYearAgo.toISOString();
        }

        const isModeFiltered = Boolean(mode && mode.toLowerCase() !== 'all');
        const fetchLimit = isModeFiltered ? 200 : limit;
        const fetchOffset = isModeFiltered ? 0 : offset;

        let countResult = db.countGamesByPilot.get({ name, startDate: filterDate });
        let games = db.getGamesByPilot.all({ name, startDate: filterDate, limit: fetchLimit, offset: fetchOffset }).map(row => JSON.parse(row.details));

        // If 0 games in 365d window, fallback to all-time match history
        if ((!games || games.length === 0) && filterDate) {
            countResult = db.countGamesByPilot.get({ name, startDate: null });
            games = db.getGamesByPilot.all({ name, startDate: null, limit: fetchLimit, offset: fetchOffset }).map(row => JSON.parse(row.details));
        }

        if (isModeFiltered) {
            const normMode = mode.toUpperCase().replace(/[\s_]+/g, '');
            games = games.filter(g => (g.settings?.matchMode || '').toUpperCase().replace(/[\s_]+/g, '') === normMode);
            const totalCount = games.length;
            games = games.slice(offset, offset + limit);
            countResult = { count: totalCount };
        }

        res.json({
            count: countResult ? countResult.count : 0,
            games: games
        });
    } catch (e) {
        console.error("Pilot Games Error:", e);
        res.status(500).json({ error: "Failed to fetch pilot match history" });
    }
});

// GET /api/config - Public configuration
router.get('/config', (req, res) => {
    try {
        const showColdStorage = db.getAdminSetting.get('show_cold_storage');
        res.json({
            show_cold_storage: showColdStorage ? showColdStorage.value === 'true' : false
        });
    } catch (error) {
        console.error('Error fetching config:', error);
        res.status(500).json({ error: 'Failed to fetch config' });
    }
});

// GET /api/fight-nights - List Fight Night Recaps
router.get('/fight-nights', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        let recaps = db.getFightNightRecaps(limit);
        if (!recaps || recaps.length === 0) {
            await fightNightService.initializeFightNights();
            recaps = db.getFightNightRecaps(limit);
        }
        res.json({
            count: recaps.length,
            recaps: recaps
        });
    } catch (error) {
        console.error('Error fetching fight nights:', error);
        res.status(500).json({ error: 'Failed to fetch fight nights' });
    }
});

// GET /api/fight-nights/:date - Specific Fight Night Recap
router.get('/fight-nights/:date', async (req, res) => {
    const { date } = req.params;
    try {
        let recap = db.getFightNightRecapByDate(date);
        if (!recap) {
            recap = await fightNightService.generateRecapForDate(date);
        }
        if (!recap) {
            return res.status(404).json({ error: `No fight night recap available for ${date}` });
        }
        res.json(recap);
    } catch (error) {
        console.error(`Error fetching fight night for ${date}:`, error);
        res.status(500).json({ error: 'Failed to fetch fight night recap' });
    }
});

// POST /api/fight-nights/check - Trigger big night detector check manually
router.post('/fight-nights/check', requireAuth, async (req, res) => {
    try {
        await fightNightService.checkAndGenerateRecentFightNight();
        res.json({ success: true, message: 'Fight night detector check executed' });
    } catch (error) {
        console.error('Error running fight night check:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
