import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { handleOverloadApiRequest, getOverloadPath } from './overloadBridge';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '5173', 10);
const HOST = process.env.HOST || '0.0.0.0';
const DIST_PATH = process.env.DIST_PATH || path.resolve(__dirname, '../dist');

// MIME types dictionary
const MIME_TYPES: Record<string, string> = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.mjs': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.wasm': 'application/wasm',
    '.ogg': 'audio/ogg',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.webm': 'audio/webm',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
    '.ttf': 'font/ttf',
    '.txt': 'text/plain; charset=utf-8'
};

// Set cross-origin isolation headers required for WebAssembly FFmpeg SharedArrayBuffer
function setSecurityHeaders(res: http.ServerResponse) {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
}

// Serve static file with caching and range support
function serveStaticFile(req: http.IncomingMessage, res: http.ServerResponse, filePath: string): boolean {
    if (!fs.existsSync(filePath)) {
        return false;
    }
    const stat = fs.statSync(filePath);
    if (!stat.isFile()) {
        return false;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    setSecurityHeaders(res);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Accept-Ranges', 'bytes');

    // Immutable caching for hashed assets and ffmpeg wasm
    if (filePath.includes('/assets/') || filePath.includes('\\assets\\') || filePath.includes('ffmpeg-core')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else {
        res.setHeader('Cache-Control', 'no-cache');
    }

    // Range request handling for audio streaming
    const range = req.headers.range;
    if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;

        if (start >= stat.size || end >= stat.size || start > end) {
            res.statusCode = 416;
            res.setHeader('Content-Range', `bytes */${stat.size}`);
            res.end();
            return true;
        }

        const chunksize = (end - start) + 1;
        res.statusCode = 206;
        res.setHeader('Content-Range', `bytes ${start}-${end}/${stat.size}`);
        res.setHeader('Content-Length', chunksize);

        if (req.method === 'HEAD') {
            res.end();
            return true;
        }

        const stream = fs.createReadStream(filePath, { start, end });
        stream.pipe(res);
        return true;
    }

    res.statusCode = 200;
    res.setHeader('Content-Length', stat.size);

    if (req.method === 'HEAD') {
        res.end();
        return true;
    }

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
    return true;
}

const server = http.createServer(async (req, res) => {
    try {
        const rawUrl = req.url || '/';
        const urlObj = new URL(rawUrl, `http://${req.headers.host || 'localhost'}`);
        const pathname = decodeURIComponent(urlObj.pathname);

        // 1. Health check endpoint for Docker / Synology Container Manager
        if (pathname === '/healthz' || pathname === '/api/health') {
            res.writeHead(200, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            });
            res.end(JSON.stringify({
                status: 'ok',
                uptime: process.uptime(),
                version: '2.0.0',
                overloadDir: getOverloadPath()
            }));
            return;
        }

        // 2. Overload API & Import API
        if (pathname.startsWith('/api/overload/') || pathname.startsWith('/api/import/')) {
            const handled = await handleOverloadApiRequest(req, res);
            if (handled) return;
        }

        // 3. Static files & SPA fallback
        const safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
        let targetFile = path.join(DIST_PATH, safePath);

        // Try exact file match
        if (fs.existsSync(targetFile) && fs.statSync(targetFile).isFile()) {
            serveStaticFile(req, res, targetFile);
            return;
        }

        // Fallback to index.html for Single-Page Application routing
        const indexHtml = path.join(DIST_PATH, 'index.html');
        if (fs.existsSync(indexHtml)) {
            serveStaticFile(req, res, indexHtml);
            return;
        }

        res.statusCode = 404;
        res.end('Not Found');
    } catch (err: any) {
        console.error('[Server Error]', err);
        if (!res.headersSent) {
            res.statusCode = 500;
            res.end('Internal Server Error: ' + err.message);
        }
    }
});

server.listen(PORT, HOST, () => {
    console.log('====================================================');
    console.log(' Overload Audio Taunt Maker 2.0 Server');
    console.log(` Listening on: http://${HOST}:${PORT}`);
    console.log(` Overload Data: ${getOverloadPath()}`);
    console.log(` Web Root:      ${DIST_PATH}`);
    console.log('====================================================');
});
