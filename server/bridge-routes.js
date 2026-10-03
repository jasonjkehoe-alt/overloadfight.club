import express from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { execSync } from 'child_process';
import {
    getOverloadPath,
    isOverloadRunning,
    scanGameTaunts,
    listPilots,
    getPilotData,
    applyPilotTaunts,
    getBufferMd5,
} from './services/overloadBridge.js';
import {
    warmupEngine,
    searchYouTube,
    extractYouTubeAudio,
    getYouTubeStreamUrl,
    searchArchive,
} from './services/audioImportService.js';

const router = express.Router();
const overloadDir = getOverloadPath();

// 1. GET /api/overload/status
router.get('/overload/status', (req, res) => {
    try {
        const installed = fs.existsSync(overloadDir);
        const pilots = listPilots(overloadDir);
        const audioTauntsDir = path.join(overloadDir, 'AudioTaunts');
        const tauntCount = fs.existsSync(audioTauntsDir)
            ? fs.readdirSync(audioTauntsDir).filter(f => f.endsWith('.ogg')).length
            : 0;
        const isGameRunning = isOverloadRunning();

        res.json({
            installed,
            gamePath: overloadDir,
            pilots,
            activePilot: pilots.includes('Soup') ? 'Soup' : pilots[0] || null,
            tauntCount,
            isGameRunning
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. GET /api/overload/taunts
router.get('/overload/taunts', (req, res) => {
    try {
        const taunts = scanGameTaunts(overloadDir);
        res.json({ taunts });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. GET /api/overload/audio?file=...
router.get('/overload/audio', (req, res) => {
    try {
        const relFile = req.query.file;
        if (!relFile || typeof relFile !== 'string') {
            return res.status(400).send('Missing file parameter');
        }

        // Prevent path traversal
        const safeRel = path.normalize(relFile).replace(/^(\.\.[\/\\])+/, '');
        const fullPath = path.join(overloadDir, 'AudioTaunts', safeRel);

        if (!fs.existsSync(fullPath)) {
            return res.status(404).send('Taunt audio file not found');
        }

        const stat = fs.statSync(fullPath);
        res.setHeader('Content-Type', 'audio/ogg');
        res.setHeader('Content-Length', stat.size);
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

        const readStream = fs.createReadStream(fullPath);
        readStream.pipe(res);
    } catch (err) {
        res.status(500).send('Error streaming audio');
    }
});

// 4. GET /api/overload/pilot/:name
router.get('/overload/pilot/:name', (req, res) => {
    try {
        const pilotName = req.params.name;
        const pilot = getPilotData(overloadDir, pilotName);
        if (!pilot) {
            return res.status(404).json({ error: 'Pilot not found' });
        }
        res.json(pilot);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. POST /api/overload/pilot/:name/apply
router.post('/overload/pilot/:name/apply', (req, res) => {
    try {
        const pilotName = req.params.name;
        const hashes = req.body.selectedTaunts || [];
        const result = applyPilotTaunts(overloadDir, pilotName, hashes);
        res.json(result);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 6. POST /api/overload/install (Save directly into AudioTaunts)
router.post('/overload/install', (req, res) => {
    try {
        const { filename, base64 } = req.body;
        if (!filename || !base64) {
            return res.status(400).json({ error: 'Missing filename or base64 data' });
        }

        const audioBuf = Buffer.from(base64, 'base64');

        // Audiophile Guard: Reject empty/corrupt audio slices (<6000 bytes = 0 audio samples)
        if (audioBuf.length < 6000) {
            return res.status(400).json({ 
                error: `Audio file contains no playable samples or is corrupted (${audioBuf.length} bytes). Please re-cut the selection.` 
            });
        }

        const hash = getBufferMd5(audioBuf);
        const audioTauntsDir = path.join(overloadDir, 'AudioTaunts');

        if (!fs.existsSync(audioTauntsDir)) {
            fs.mkdirSync(audioTauntsDir, { recursive: true });
        }

        const cleanName = filename.replace(/\.ogg$/i, '').replace(/[^a-zA-Z0-9_-]/g, '_');
        const targetFilename = `${hash}-${cleanName}.ogg`;
        const targetPath = path.join(audioTauntsDir, targetFilename);

        fs.writeFileSync(targetPath, audioBuf);
        console.log(`[OverloadBridge] Installed taunt directly to: ${targetPath}`);

        res.json({
            success: true,
            installedPath: targetPath,
            filename: targetFilename,
            hash
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 6b. POST /api/overload/taunts/prune-empty (Prune zero-sample/corrupt taunt files < 6kB)
router.post('/overload/taunts/prune-empty', (req, res) => {
    try {
        const audioTauntsDir = path.join(overloadDir, 'AudioTaunts');
        if (!fs.existsSync(audioTauntsDir)) {
            return res.json({ success: true, prunedCount: 0 });
        }
        let pruned = 0;
        const files = fs.readdirSync(audioTauntsDir);
        for (const f of files) {
            if (!f.toLowerCase().endsWith('.ogg')) continue;
            const fullPath = path.join(audioTauntsDir, f);
            try {
                const stat = fs.statSync(fullPath);
                if (stat.isFile() && stat.size < 6000) {
                    fs.unlinkSync(fullPath);
                    pruned++;
                }
            } catch {}
        }
        console.log(`[OverloadBridge] Pruned ${pruned} corrupt/empty taunt files (<6kB).`);
        res.json({ success: true, prunedCount: pruned });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 7a. GET /api/import/proxy?url=... (CORS-friendly streaming audio proxy)
router.get('/import/proxy', async (req, res) => {
    try {
        const targetUrl = req.query.url;
        if (!targetUrl || typeof targetUrl !== 'string') {
            return res.status(400).send('Missing url parameter');
        }

        const remoteRes = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!remoteRes.ok) {
            return res.status(remoteRes.status).send(`Failed to fetch target URL: ${remoteRes.statusText}`);
        }

        const contentType = remoteRes.headers.get('content-type') || 'audio/mpeg';
        const contentLength = remoteRes.headers.get('content-length');

        res.setHeader('Content-Type', contentType);
        if (contentLength) res.setHeader('Content-Length', contentLength);
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

        const arrayBuf = await remoteRes.arrayBuffer();
        res.send(Buffer.from(arrayBuf));
    } catch (err) {
        res.status(500).send(`Proxy error: ${err.message}`);
    }
});

// 7b. GET /api/import/warmup (Pre-warm Python & yt-dlp in background)
router.get('/import/warmup', async (req, res) => {
    try {
        const result = await warmupEngine();
        res.json({ success: true, ...result });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 7c. GET /api/import/youtube/search?q=... (Instant YouTube metadata search)
router.get('/import/youtube/search', async (req, res) => {
    try {
        const query = req.query.q;
        const limit = parseInt(req.query.limit || '8', 10);
        if (!query || typeof query !== 'string' || !query.trim()) {
            return res.status(400).json({ success: false, error: 'Query parameter "q" is required' });
        }
        const results = await searchYouTube(query, limit);
        res.json({ success: true, results });
    } catch (err) {
        console.error('[BridgeRoutes] YouTube search error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// 7d. GET /api/import/youtube/stream?id=... (Live audio preview streaming with Range support & shared yt-dlp cache)
router.get('/import/youtube/stream', async (req, res) => {
    try {
        const videoId = req.query.id;
        if (!videoId || typeof videoId !== 'string') {
            return res.status(400).send('Missing video id');
        }

        const entry = await extractYouTubeAudio(`https://www.youtube.com/watch?v=${videoId}`, true);
        if (!entry || !entry.buffer) {
            return res.status(404).send('Audio stream not available');
        }

        const buffer = entry.buffer;
        const contentType = entry.mimeType || 'audio/webm';
        const totalLength = buffer.length;
        const range = req.headers.range;

        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        res.setHeader('Content-Type', contentType);

        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : totalLength - 1;
            const chunksize = (end - start) + 1;
            const chunk = buffer.subarray(start, end + 1);

            res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${totalLength}`,
                'Content-Length': chunksize,
                'Content-Type': contentType,
                'Accept-Ranges': 'bytes',
                'Access-Control-Allow-Origin': '*',
                'Cross-Origin-Resource-Policy': 'cross-origin'
            });
            res.end(chunk);
        } else {
            res.setHeader('Content-Length', totalLength);
            res.end(buffer);
        }
    } catch (err) {
        console.error('[BridgeRoutes] YouTube stream error:', err.message);
        res.status(500).send(`Stream error: ${err.message}`);
    }
});

// 7d. POST /api/import/youtube (Audio extraction via yt-dlp with auto-retry)
router.post('/import/youtube', async (req, res) => {
    try {
        const { url: videoUrl } = req.body;
        if (!videoUrl || typeof videoUrl !== 'string' || !videoUrl.trim()) {
            return res.status(400).json({ success: false, error: 'Valid video URL required' });
        }
        const result = await extractYouTubeAudio(videoUrl);
        res.json(result);
    } catch (err) {
        console.error('[BridgeRoutes] YouTube extraction error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// 7e. GET /api/import/archive/search (Tuned Internet Archive search with category & track ranking)
router.get('/import/archive/search', async (req, res) => {
    try {
        const query = req.query.q || 'laser sound effects';
        const category = req.query.category || 'sfx';
        const rows = parseInt(req.query.rows || '8', 10);

        const results = await searchArchive(query, category, rows);
        res.json({ success: true, results });
    } catch (err) {
        console.error('[BridgeRoutes] Archive search error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// 7d. GET /api/import/archive/files?id=... (Fetch all tracks for an archive item)
router.get('/import/archive/files', async (req, res) => {
    try {
        const id = req.query.id;
        if (!id) {
            return res.status(400).json({ success: false, error: 'Missing archive id' });
        }

        const metaRes = await fetch(`https://archive.org/metadata/${encodeURIComponent(id)}/files`);
        const metaData = await metaRes.json();
        const files = metaData.result || [];

        const tracks = files.filter((f) => {
            if (!f.name) return false;
            const nameLower = f.name.toLowerCase();
            const isAudio = nameLower.endsWith('.mp3') || nameLower.endsWith('.ogg') || nameLower.endsWith('.wav');
            const isNotVbrOrSpectro = !nameLower.includes('_vbr.') && !nameLower.includes('_spectrogram.');
            return isAudio && isNotVbrOrSpectro;
        }).map((f) => {
            const directUrl = `https://archive.org/download/${id}/${encodeURIComponent(f.name)}`;
            return {
                name: f.name,
                title: f.title || f.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '),
                length: f.length ? parseFloat(f.length) : null,
                size: f.size ? parseInt(f.size, 10) : null,
                directUrl,
                proxyUrl: `/api/import/proxy?url=${encodeURIComponent(directUrl)}`
            };
        });

        res.json({ success: true, tracks });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

export default router;
