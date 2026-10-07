import express from 'express';
import cors from 'cors';
import compression from 'compression';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
// auth.js first: it exits before anything else loads when production secrets are missing
import { sessionMiddleware } from './auth.js';
import routes from './routes.js';
import adminRoutes from './admin-routes.js';
import ingest from './ingest.js';
import backfillManager from './backfill.js';
import maintenance from './maintenance.js';
import mapSyncService from './services/mapSyncService.js';
import db from './db.js';

import bridgeRoutes from './bridge-routes.js';
import { warmupEngine } from './services/audioImportService.js';

import cacheService from './services/cacheService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Security: Disable x-powered-by header
app.disable('x-powered-by');

// One reverse proxy hop (DSM) in front: req.ip and req.secure come from X-Forwarded-*
app.set('trust proxy', 1);

// Reverse Proxy HTTPS Redirection
app.use((req, res, next) => {
  if (req.headers['x-forwarded-proto'] === 'http') {
    return res.redirect(301, 'https://' + req.headers.host + req.originalUrl);
  }
  next();
});

// Middleware
app.use(compression());

// CORS: Restrict to application domains and local networks
const allowedOrigins = [
  'https://overloadfight.club',
  'http://overloadfight.club',
  'http://192.168.0.52:3000',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173'
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || origin.endsWith('.overloadfight.club')) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));

// Security Headers: CSP, Frame Options, Sniffing, HSTS & Cross-Origin Isolation for FFmpeg WASM
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  if (req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https:; media-src 'self' data: blob: https:; connect-src 'self' data: blob: https://tracker.otl.gg https://archive.org https://www.omdb.net; worker-src 'self' blob:; frame-ancestors 'self';"
  );
  next();
});

app.use(sessionMiddleware); // Session support for admin auth

// API Routes
app.get('/api/stats', (req, res) => {
    try {
        const stats = db.getDatabaseStats.get();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.use('/api', routes);
app.use('/api', bridgeRoutes);
app.use('/api/admin', adminRoutes);

// In production (or if dist exists), serve compiled static files with optimal caching
const isProduction = process.env.NODE_ENV === 'production';
const distPath = path.join(__dirname, '../dist');

// Favicon & Robots handlers (guarantees proper MIME type, never returns SPA HTML)
app.get('/robots.txt', (req, res) => {
    const robotsPath = fs.existsSync(path.join(distPath, 'robots.txt'))
        ? path.join(distPath, 'robots.txt')
        : path.join(__dirname, '../public/robots.txt');
    if (fs.existsSync(robotsPath)) {
        res.setHeader('Content-Type', 'text/plain');
        return res.sendFile(robotsPath);
    }
    res.setHeader('Content-Type', 'text/plain');
    res.send("User-agent: *\nAllow: /\nAllow: /pilots\nAllow: /maps\nAllow: /stats\nAllow: /history\nDisallow: /api/\nDisallow: /admin\n");
});

app.get('/favicon.ico', (req, res) => {
    const favPath = fs.existsSync(path.join(distPath, 'favicon.ico'))
        ? path.join(distPath, 'favicon.ico')
        : path.join(__dirname, '../public/favicon.ico');
    if (fs.existsSync(favPath)) {
        res.setHeader('Content-Type', 'image/x-icon');
        return res.sendFile(favPath);
    }
    res.status(204).end();
});

app.get('/favicon.svg', (req, res) => {
    const favSvgPath = fs.existsSync(path.join(distPath, 'favicon.svg'))
        ? path.join(distPath, 'favicon.svg')
        : path.join(__dirname, '../public/favicon.svg');
    if (fs.existsSync(favSvgPath)) {
        res.setHeader('Content-Type', 'image/svg+xml');
        return res.sendFile(favSvgPath);
    }
    res.status(404).end();
});

// Never cache version manifest; fallback to public/version.json if dist is missing or has unknown
app.get('/version.json', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Content-Type', 'application/json');

    const distVersion = path.join(distPath, 'version.json');
    const publicVersion = path.join(process.cwd(), 'public', 'version.json');

    let versionData = null;
    if (fs.existsSync(distVersion)) {
        try {
            const parsed = JSON.parse(fs.readFileSync(distVersion, 'utf8'));
            if (parsed && parsed.hash && parsed.hash !== 'unknown') {
                versionData = parsed;
            }
        } catch (e) {}
    }
    if (!versionData && fs.existsSync(publicVersion)) {
        try {
            const parsed = JSON.parse(fs.readFileSync(publicVersion, 'utf8'));
            if (parsed && parsed.hash && parsed.hash !== 'unknown') {
                versionData = parsed;
            }
        } catch (e) {}
    }

    if (versionData) {
        return res.json(versionData);
    }
    if (fs.existsSync(distVersion)) {
        return res.sendFile(distVersion);
    } else if (fs.existsSync(publicVersion)) {
        return res.sendFile(publicVersion);
    }
    return res.json({ hash: 'unknown', date: 'unknown', buildTime: new Date().toISOString() });
});

if ((isProduction || true) && fs.existsSync(path.join(distPath, 'index.html'))) {
    // The build writes .br and .gz copies of the 32 MB ffmpeg wasm (vite.config.ts).
    // Send one of those rather than letting compression() gzip it on every request.
    // express.static then serves the copy, keeping this Content-Type and its cache rules.
    const wasmUrl = '/ffmpeg/ffmpeg-core.wasm';
    const wasmCopies = Object.entries({ br: '.br', gzip: '.gz' })
        .filter(([, ext]) => fs.existsSync(path.join(distPath, wasmUrl + ext)));
    app.get(wasmUrl, (req, res, next) => {
        // br first: acceptsEncodings('br', 'gzip') would follow the client's order, and Chrome lists gzip first
        const copy = wasmCopies.find(([encoding]) => req.acceptsEncodings(encoding));
        if (copy) {
            res.setHeader('Content-Type', 'application/wasm');
            res.setHeader('Content-Encoding', copy[0]);
            res.setHeader('Vary', 'Accept-Encoding');
            req.url = wasmUrl + copy[1];
        }
        next();
    });

    app.use(express.static(distPath, {
        setHeaders: (res, filePath) => {
            // Never cache index.html or version manifest so users get new builds instantly
            if (filePath.endsWith('.html') || filePath.endsWith('version.json')) {
                res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
                res.setHeader('Pragma', 'no-cache');
                res.setHeader('Expires', '0');
            } else if (filePath.includes(path.sep + 'assets' + path.sep) || filePath.includes('/assets/')) {
                // Content-hashed Vite assets: 1 year immutable cache
                res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
            } else {
                // No content hash (ffmpeg, icons, images): the file can change under the same URL
                res.setHeader('Cache-Control', 'public, max-age=3600');
            }
        }
    }));
    app.get('*', (req, res) => {
        if (req.path.startsWith('/api')) {
            return res.status(404).json({ error: `API route not found: ${req.method} ${req.path}` });
        }
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.sendFile(path.join(distPath, 'index.html'));
    });
} else {
    // API Gateway & Status Console for Development
    app.get('*', (req, res) => {
        // If an API request somehow reached here without matching, return 404 JSON
        if (req.path.startsWith('/api')) {
            return res.status(404).json({ error: `API route not found: ${req.method} ${req.path}` });
        }

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Overload Tracker // API Gateway</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;800&family=Rajdhani:wght@600;700&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            background-color: #080808;
            color: #d1d5db;
            font-family: 'JetBrains Mono', monospace;
            padding: 2.5rem 1.5rem;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .container {
            max-width: 860px;
            width: 100%;
            background: #0f0f10;
            border: 1px solid #262626;
            border-radius: 12px;
            padding: 2.5rem;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #262626;
            padding-bottom: 1.5rem;
            margin-bottom: 2rem;
        }
        .title-group h1 {
            font-family: 'Rajdhani', sans-serif;
            font-size: 2.2rem;
            font-weight: 700;
            color: #ffffff;
            letter-spacing: 0.05em;
            text-transform: uppercase;
        }
        .title-group p {
            color: #9ca3af;
            font-size: 0.85rem;
            margin-top: 0.25rem;
        }
        .badge {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            background: rgba(16, 185, 129, 0.1);
            color: #10b981;
            border: 1px solid rgba(16, 185, 129, 0.3);
            padding: 0.35rem 0.85rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 600;
            letter-spacing: 0.05em;
        }
        .dot {
            width: 8px;
            height: 8px;
            background: #10b981;
            border-radius: 50%;
            box-shadow: 0 0 10px #10b981;
        }
        .banner {
            background: linear-gradient(135deg, rgba(255, 102, 0, 0.12) 0%, rgba(255, 102, 0, 0.04) 100%);
            border: 1px solid rgba(255, 102, 0, 0.35);
            border-radius: 8px;
            padding: 1.5rem;
            margin-bottom: 2rem;
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }
        .banner-text h2 {
            color: #ff6600;
            font-family: 'Rajdhani', sans-serif;
            font-size: 1.3rem;
            font-weight: 700;
            letter-spacing: 0.05em;
            margin-bottom: 0.3rem;
        }
        .banner-text p {
            font-size: 0.825rem;
            color: #e5e7eb;
            line-height: 1.4;
        }
        .btn-launch {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            background: #ff6600;
            color: #ffffff;
            text-decoration: none;
            font-weight: 700;
            font-size: 0.875rem;
            padding: 0.75rem 1.5rem;
            border-radius: 6px;
            transition: all 0.2s ease;
            box-shadow: 0 4px 14px rgba(255, 102, 0, 0.3);
            align-self: flex-start;
        }
        .btn-launch:hover {
            background: #ff771a;
            transform: translateY(-1px);
            box-shadow: 0 6px 20px rgba(255, 102, 0, 0.45);
        }
        .section-title {
            color: #9ca3af;
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            margin-bottom: 1rem;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }
        .card {
            background: #151517;
            border: 1px solid #262626;
            border-radius: 8px;
            padding: 1rem;
        }
        .card-label {
            font-size: 0.7rem;
            color: #6b7280;
            text-transform: uppercase;
            font-weight: 600;
            margin-bottom: 0.25rem;
        }
        .card-value {
            font-size: 0.95rem;
            color: #f3f4f6;
            font-weight: 600;
        }
        .endpoints {
            list-style: none;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }
        .endpoint-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: #151517;
            border: 1px solid #262626;
            padding: 0.75rem 1rem;
            border-radius: 6px;
            font-size: 0.8rem;
            transition: border-color 0.15s ease;
        }
        .endpoint-item:hover {
            border-color: #404040;
        }
        .endpoint-link {
            color: #ff6600;
            text-decoration: none;
            font-weight: 600;
        }
        .endpoint-link:hover {
            text-decoration: underline;
        }
        .endpoint-desc {
            color: #6b7280;
            font-size: 0.75rem;
        }
        .method {
            background: #262626;
            color: #9ca3af;
            padding: 0.15rem 0.4rem;
            border-radius: 4px;
            font-size: 0.65rem;
            font-weight: 800;
            margin-right: 0.5rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="title-group">
                <h1>Overload Tracker</h1>
                <p>Backend API Gateway // Server Port 3000</p>
            </div>
            <div class="badge">
                <span class="dot"></span>
                <span>SYSTEM ONLINE</span>
            </div>
        </div>

        <div class="banner">
            <div class="banner-text">
                <h2>Looking for the Web Dashboard?</h2>
                <p>You are viewing the raw API backend on port 3000. The full live web user interface (with live taunt editor, pilot dossiers, and cold storage) is running on Vite.</p>
            </div>
            <a href="http://localhost:5173" class="btn-launch">
                <span>Launch Live Web Dashboard (Port 5173) &rarr;</span>
            </a>
        </div>

        <div class="section-title">Telemetry & Infrastructure</div>
        <div class="grid">
            <div class="card">
                <div class="card-label">Server Mode</div>
                <div class="card-value">Node.js Express (Development)</div>
            </div>
            <div class="card">
                <div class="card-label">Hot Telemetry Database</div>
                <div class="card-value">tracker.db (Active 365 Days)</div>
            </div>
            <div class="card">
                <div class="card-label">Cold Archival Database</div>
                <div class="card-value">cold_storage.db (7.2 Years)</div>
            </div>
        </div>

        <div class="section-title">Key API Endpoints</div>
        <ul class="endpoints">
            <li class="endpoint-item">
                <div>
                    <span class="method">GET</span>
                    <a href="/api/stats" class="endpoint-link" target="_blank">/api/stats</a>
                </div>
                <span class="endpoint-desc">Live database statistics & match counters</span>
            </li>
            <li class="endpoint-item">
                <div>
                    <span class="method">GET</span>
                    <a href="/api/stats/cold/deep" class="endpoint-link" target="_blank">/api/stats/cold/deep</a>
                </div>
                <span class="endpoint-desc">Archival deep statistics across all 75,820 sorties</span>
            </li>
            <li class="endpoint-item">
                <div>
                    <span class="method">GET</span>
                    <a href="/api/stats/pilots?source=all" class="endpoint-link" target="_blank">/api/stats/pilots?source=all</a>
                </div>
                <span class="endpoint-desc">Complete pilot leaderboard with K/D, ACI, Win%</span>
            </li>
            <li class="endpoint-item">
                <div>
                    <span class="method">GET</span>
                    <a href="/api/maps" class="endpoint-link" target="_blank">/api/maps</a>
                </div>
                <span class="endpoint-desc">Combat zones & arena tactical specifications</span>
            </li>
            <li class="endpoint-item">
                <div>
                    <span class="method">GET</span>
                    <a href="/api/games?page=1" class="endpoint-link" target="_blank">/api/games?page=1</a>
                </div>
                <span class="endpoint-desc">Recent sorties & match telemetry records</span>
            </li>
        </ul>
    </div>
</body>
</html>`;
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
    });
}

// Warm up critical stats cache on startup (maps, leaderboards)
async function warmupStatsCache() {
    try {
        console.log('[Warmup] Pre-warming stats cache (maps, pilots)...');
        const topPlayed = db.getTopPlayedMapsFromCache(10);
        const recentTop = db.getRecentTopMapsFromCache(10);
        const deadliest = db.getDeadliestMapsFromCache(10);
        const mostActive = db.getMostActiveMaps.all().map(row => ({
            ...row,
            avg_players: row.avg_players || 0
        }));
        const marathon = db.getMarathonMaps.all();
        const mapDataHot = { topPlayed, recentTop, mostActive, deadliest, marathon };
        await cacheService.set('map_stats_hot', mapDataHot, 600);

        const mapDataAll = { topPlayed: db.getTopPlayedMapsFromCache(20) };
        await cacheService.set('map_stats_all', mapDataAll, 600);

        const pilotStatsAll = db.getAllTimePilotStats.all();
        if (pilotStatsAll && pilotStatsAll.length > 0) {
            await cacheService.set('pilot_stats_all_all', pilotStatsAll, 600);
        }
        console.log('[Warmup] Stats cache pre-warmed successfully.');
    } catch (err) {
        console.error('[Warmup] Failed to pre-warm stats cache:', err.message);
    }
}

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);

    // Start data ingestion and polling
    ingest.startPolling();

    // Ensure map database is populated from catalog
    mapSyncService.ensureMapsPopulated();

    // Check for interrupted backfill jobs and resume
    const activeJob = backfillManager.getActiveJob();
    if (activeJob && activeJob.status === 'running') {
        console.log(`Resuming interrupted backfill job ${activeJob.id}...`);
        backfillManager.startBackfill(activeJob.id).catch(err => {
            console.error('Failed to resume backfill job:', err);
        });
    }

    // Schedule Daily Maintenance (Cold Storage)
    maintenance.scheduleMaintenance();

    // Pre-warm Stats Cache (maps & leaderboard)
    warmupStatsCache().catch(() => {});

    // Pre-warm Audio Import Engine (yt-dlp & python)
    warmupEngine().catch(() => {});
});
