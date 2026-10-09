import express from 'express';
import axios from 'axios';
import path from 'path';
import fs from 'fs';
import db from '../db.js';

// The map library: list, intel, one map, its image and its download.
const router = express.Router();

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

        const localPath = db.mapImagePath(map);
        const filename = path.basename(localPath);

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

export default router;
