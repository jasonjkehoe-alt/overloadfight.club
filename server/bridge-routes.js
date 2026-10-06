import express from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import dns from 'dns';
import { execSync } from 'child_process';
import {
    getOverloadPath,
    isOverloadRunning,
    scanGameTaunts,
    listPilots,
    getPilotData,
    applyPilotTaunts,
    getBufferMd5,
    getPilotSettings,
    savePilotSettings,
    setPilotXP,
    backupAllPilotsZip,
    clonePilot,
    renamePilot,
    deletePilot,
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

// SSRF Protection: Restrict proxy to trusted audio hosts & prevent private/loopback/CGNAT IP access
const ALLOWED_AUDIO_HOST_PATTERNS = [
    /(^|\.)archive\.org$/,
    /(^|\.)freesound\.org$/,
    /(^|\.)myinstants\.com$/,
    /(^|\.)soundbible\.com$/,
    /(^|\.)wikimedia\.org$/,
    /(^|\.)raw\.githubusercontent\.com$/,
    /(^|\.)cdn\.discordapp\.com$/,
    /(^|\.)discordapp\.com$/,
    /(^|\.)discord\.com$/,
    /(^|\.)googlevideo\.com$/,
    /(^|\.)youtube\.com$/,
    /^youtu\.be$/,
    /(^|\.)overloadfight\.club$/
];

function isPrivateIp(ip) {
    if (!ip) return true;
    if (ip.startsWith('::ffff:')) {
        ip = ip.substring(7);
    }
    const parts = ip.split('.').map(Number);
    if (parts.length === 4 && parts.every(p => !isNaN(p) && p >= 0 && p <= 255)) {
        // 0.0.0.0/8
        if (parts[0] === 0) return true;
        // 127.0.0.0/8 (loopback)
        if (parts[0] === 127) return true;
        // 10.0.0.0/8 (private)
        if (parts[0] === 10) return true;
        // 172.16.0.0/12 (private: 172.16.0.0 - 172.31.255.255)
        if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
        // 192.168.0.0/16 (private)
        if (parts[0] === 192 && parts[1] === 168) return true;
        // 169.254.0.0/16 (link-local)
        if (parts[0] === 169 && parts[1] === 254) return true;
        // 100.64.0.0/10 (CGNAT / Tailscale: 100.64.0.0 - 100.127.255.255)
        if (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) return true;
        return false;
    }
    const lower = ip.toLowerCase();
    if (lower === '::1' || lower === '::' || lower.startsWith('fe80:') || lower.startsWith('fc') || lower.startsWith('fd')) {
        return true;
    }
    return false;
}

async function validateSafeAudioUrl(targetUrl) {
    let parsed;
    try {
        parsed = new URL(targetUrl);
    } catch {
        return { valid: false, error: 'Invalid URL format' };
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return { valid: false, error: 'Only HTTP and HTTPS protocols are permitted' };
    }

    const hostname = parsed.hostname.toLowerCase();

    // 1. Host allowlist
    const isAllowedHost = ALLOWED_AUDIO_HOST_PATTERNS.some(pattern => pattern.test(hostname));
    if (!isAllowedHost) {
        return { valid: false, error: `Host "${hostname}" is not on the permitted audio importer allowlist` };
    }

    // 2. Resolve DNS and block private / loopback / link-local / CGNAT addresses
    try {
        const addresses = await dns.promises.lookup(hostname, { all: true });
        if (!addresses || addresses.length === 0) {
            return { valid: false, error: 'Could not resolve host' };
        }
        for (const addr of addresses) {
            if (isPrivateIp(addr.address)) {
                return { valid: false, error: 'Target resolves to a private or restricted network address' };
            }
        }
    } catch (e) {
        return { valid: false, error: `DNS resolution failed: ${e.message}` };
    }

    return { valid: true };
}

// 1. GET /api/overload/status
router.get('/overload/status', (req, res) => {
    try {
        const installed = fs.existsSync(overloadDir);
        const pilots = installed ? listPilots(overloadDir) : [];
        const audioTauntsDir = path.join(overloadDir, 'AudioTaunts');
        const tauntCount = installed && fs.existsSync(audioTauntsDir)
            ? fs.readdirSync(audioTauntsDir).filter(f => f.endsWith('.ogg')).length
            : 0;
        const isGameRunning = installed ? isOverloadRunning() : false;

        res.json({
            installed,
            gamePath: installed ? overloadDir : null,
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

// 5b. GET /api/overload/pilot/:name/settings (Read .xprefs, .xprefsmod, .xconfig)
router.get('/overload/pilot/:name/settings', (req, res) => {
    try {
        const pilotName = req.params.name;
        const result = getPilotSettings(overloadDir, pilotName);
        if (result.error) {
            return res.status(404).json(result);
        }
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5c. POST /api/overload/pilot/:name/settings (Save settings with process guard & auto backup)
router.post('/overload/pilot/:name/settings', (req, res) => {
    try {
        const pilotName = req.params.name;
        const result = savePilotSettings(overloadDir, pilotName, req.body);
        if (!result.success) {
            return res.status(400).json(result);
        }
        res.json(result);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 5d. POST /api/overload/pilot/:name/xp (Edit single-player XP PS_XP2)
router.post('/overload/pilot/:name/xp', (req, res) => {
    try {
        const pilotName = req.params.name;
        const xp = parseInt(req.body.xp, 10);
        if (isNaN(xp) || xp < 0 || xp > 9999999) {
            return res.status(400).json({ success: false, error: 'XP must be between 0 and 9,999,999' });
        }
        const result = setPilotXP(overloadDir, pilotName, xp);
        if (!result.success) {
            return res.status(400).json(result);
        }
        res.json(result);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 5e. POST /api/overload/pilots/backup (Backup all pilots to timestamped zip in Pilot Backup/)
router.post('/overload/pilots/backup', async (req, res) => {
    try {
        const result = await backupAllPilotsZip(overloadDir);
        if (!result.success) {
            return res.status(400).json(result);
        }
        res.json(result);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 5f. POST /api/overload/pilots/clone (Clone pilot across 6-file family)
router.post('/overload/pilots/clone', (req, res) => {
    try {
        const { sourcePilot, targetPilot } = req.body;
        const result = clonePilot(overloadDir, sourcePilot, targetPilot);
        if (!result.success) {
            return res.status(400).json(result);
        }
        res.json(result);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 5g. POST /api/overload/pilots/rename (Rename pilot across 6-file family)
router.post('/overload/pilots/rename', (req, res) => {
    try {
        const { sourcePilot, targetPilot } = req.body;
        const result = renamePilot(overloadDir, sourcePilot, targetPilot);
        if (!result.success) {
            return res.status(400).json(result);
        }
        res.json(result);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 5h. POST /api/overload/pilots/delete (Delete pilot across 6-file family with safety backup)
router.post('/overload/pilots/delete', (req, res) => {
    try {
        const { pilotName } = req.body;
        const result = deletePilot(overloadDir, pilotName);
        if (!result.success) {
            return res.status(400).json(result);
        }
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

// 7a. GET /api/import/proxy?url=... (CORS-friendly streaming audio proxy with strict SSRF protection)
router.get('/import/proxy', async (req, res) => {
    try {
        const targetUrl = req.query.url;
        if (!targetUrl || typeof targetUrl !== 'string') {
            return res.status(400).send('Missing url parameter');
        }

        const validation = await validateSafeAudioUrl(targetUrl);
        if (!validation.valid) {
            return res.status(403).send(`Forbidden: ${validation.error}`);
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000);

        const remoteRes = await fetch(targetUrl, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        clearTimeout(timeout);

        if (!remoteRes.ok) {
            return res.status(remoteRes.status).send(`Failed to fetch target URL: ${remoteRes.statusText}`);
        }

        const contentType = remoteRes.headers.get('content-type') || 'audio/mpeg';
        const contentLength = remoteRes.headers.get('content-length');

        if (contentLength && parseInt(contentLength, 10) > 60 * 1024 * 1024) {
            return res.status(413).send('Target audio file exceeds maximum allowed size (60MB)');
        }

        res.setHeader('Content-Type', contentType);
        if (contentLength) res.setHeader('Content-Length', contentLength);
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

        const arrayBuf = await remoteRes.arrayBuffer();
        res.send(Buffer.from(arrayBuf));
    } catch (err) {
        if (err.name === 'AbortError') {
            return res.status(504).send('Proxy timeout fetching target URL');
        }
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
