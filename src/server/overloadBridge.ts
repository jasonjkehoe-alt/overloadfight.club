import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import os from 'os';
import { execSync } from 'child_process';
import type { Plugin, ViteDevServer } from 'vite';

// Check if Overload process is currently active
export function isOverloadRunning(): boolean {
    try {
        if (process.platform === 'win32') {
            const out = execSync('tasklist', { stdio: ['pipe', 'pipe', 'ignore'] }).toString();
            return out.toLowerCase().includes('overload.exe');
        } else {
            const out = execSync('ps -ef 2>/dev/null || ps aux 2>/dev/null', { stdio: ['pipe', 'pipe', 'ignore'] }).toString();
            return out.toLowerCase().includes('overload');
        }
    } catch {
        return false;
    }
}

// Find yt-dlp binary across systems
export function findYtDlpCommand(): string {
    try {
        execSync('yt-dlp --version', { stdio: 'ignore' });
        return 'yt-dlp';
    } catch {}

    try {
        execSync('python3 -m yt_dlp --version', { stdio: 'ignore' });
        return 'python3 -m yt_dlp';
    } catch {}

    return 'python -m yt_dlp';
}

// Resolve Overload AppData path on Windows, Linux, macOS, or Docker
export function getOverloadPath(): string {
    if (process.env.OVERLOAD_PATH) {
        return process.env.OVERLOAD_PATH;
    }
    if (process.platform === 'win32') {
        const localAppData = process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE || 'C:\\Users\\admin', 'AppData', 'Local');
        const localLow = path.join(path.dirname(localAppData), 'LocalLow');
        const overloadDir = path.join(localLow, 'Revival', 'Overload');

        if (fs.existsSync(overloadDir)) {
            return overloadDir;
        }
        return 'C:\\Users\\admin\\AppData\\LocalLow\\Revival\\Overload';
    } else if (process.platform === 'darwin') {
        const home = os.homedir();
        const macDir = path.join(home, 'Library', 'Application Support', 'Revival', 'Overload');
        if (fs.existsSync(macDir)) return macDir;
        return '/overload';
    } else {
        const home = os.homedir();
        const linuxDir = path.join(home, '.config', 'unity3d', 'Revival', 'Overload');
        if (fs.existsSync(linuxDir)) return linuxDir;
        return '/overload';
    }
}

export interface GameTauntItem {
    id: string; // MD5 hash (lowercase)
    cleanName: string;
    rawFileName: string;
    relativePath: string; // 'd699...ogg' or 'external/f0d8...ogg'
    location: 'user' | 'external';
    sizeBytes: number;
    modifiedTime: number;
    audioUrl: string;
}

// Compute MD5 of a file buffer
export function getBufferMd5(buf: Buffer): string {
    return crypto.createHash('md5').update(buf).digest('hex').toLowerCase();
}

// Helper: Try to extract TITLE tag from Vorbis Comment Header inside OGG file
export function extractVorbisTitle(filePath: string): string | null {
    try {
        const fd = fs.openSync(filePath, 'r');
        const buffer = Buffer.alloc(8192); // First 8KB usually contains comment header
        const bytesRead = fs.readSync(fd, buffer, 0, 8192, 0);
        fs.closeSync(fd);

        if (bytesRead < 50) return null;

        const str = buffer.toString('latin1', 0, bytesRead);
        // Look for TITLE= or title=
        const match = str.match(/TITLE=([^\x00\r\n\x01-\x1F]+)/i);
        if (match && match[1] && match[1].trim()) {
            return match[1].trim();
        }
    } catch {
        // ignore
    }
    return null;
}

// Scan all game taunts from AudioTaunts directory
export function scanGameTaunts(overloadDir: string): GameTauntItem[] {
    const audioTauntsDir = path.join(overloadDir, 'AudioTaunts');
    const items: GameTauntItem[] = [];

    if (!fs.existsSync(audioTauntsDir)) {
        return items;
    }

    const processDir = (dirPath: string, location: 'user' | 'external') => {
        if (!fs.existsSync(dirPath)) return;
        const files = fs.readdirSync(dirPath);

        for (const f of files) {
            if (!f.toLowerCase().endsWith('.ogg')) continue;
            const fullPath = path.join(dirPath, f);
            const stat = fs.statSync(fullPath);
            if (!stat.isFile()) continue;

            const relativePath = location === 'external' ? `external/${f}` : f;
            let id = '';
            let cleanName = '';

            // Check if name is in the format: <32-char-hash>-<name>.ogg
            const hashPrefixMatch = f.match(/^([a-fA-F0-9]{32})-(.+)\.ogg$/i);
            if (hashPrefixMatch) {
                id = hashPrefixMatch[1].toLowerCase();
                cleanName = hashPrefixMatch[2];
            } else {
                // If it's just <32-char-hash>.ogg
                const pureHashMatch = f.match(/^([a-fA-F0-9]{32})\.ogg$/i);
                if (pureHashMatch) {
                    id = pureHashMatch[1].toLowerCase();
                    // Try to read Vorbis title tag
                    const vorbisTitle = extractVorbisTitle(fullPath);
                    cleanName = vorbisTitle || id.substring(0, 10);
                } else {
                    // Custom non-prefixed file: calculate its MD5
                    try {
                        const fileBuf = fs.readFileSync(fullPath);
                        id = getBufferMd5(fileBuf);
                    } catch {
                        id = f.replace(/\.ogg$/i, '');
                    }
                    cleanName = f.replace(/\.ogg$/i, '');
                }
            }

            items.push({
                id,
                cleanName,
                rawFileName: f,
                relativePath,
                location,
                sizeBytes: stat.size,
                modifiedTime: stat.mtimeMs,
                audioUrl: `/api/overload/audio?file=${encodeURIComponent(relativePath)}`
            });
        }
    };

    // 1. Scan user taunts in AudioTaunts/
    processDir(audioTauntsDir, 'user');

    // 2. Scan external taunts in AudioTaunts/external/
    processDir(path.join(audioTauntsDir, 'external'), 'external');

    return items;
}

// Read pilot config
export interface PilotData {
    pilotName: string;
    configPath: string;
    selectedTaunts: string[]; // 6 MD5 hashes
    keybinds: number[];       // Key codes
    lastModified: number;
}

export function listPilots(overloadDir: string): string[] {
    if (!fs.existsSync(overloadDir)) return [];
    const files = fs.readdirSync(overloadDir);
    const pilots: string[] = [];

    for (const f of files) {
        if (f.toLowerCase().endsWith('.extendedconfig')) {
            const name = f.substring(0, f.length - '.extendedconfig'.length);
            pilots.push(name);
        }
    }
    return pilots;
}

export function getPilotData(overloadDir: string, pilotName: string): PilotData | null {
    const configPath = path.join(overloadDir, `${pilotName}.extendedconfig`);
    if (!fs.existsSync(configPath)) return null;

    const content = fs.readFileSync(configPath, 'utf8');
    const stat = fs.statSync(configPath);

    const selectedTaunts: string[] = [];
    const keybinds: number[] = [];

    // Parse AUDIOTAUNT_SELECTED_TAUNTS
    const tauntMatch = content.match(/\[SECTION:\s*AUDIOTAUNT_SELECTED_TAUNTS\]([\s\S]*?)\[\/END\]/);
    if (tauntMatch) {
        const lines = tauntMatch[1].split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
        selectedTaunts.push(...lines);
    }

    // Parse AUDIOTAUNT_KEYBINDS
    const keyMatch = content.match(/\[SECTION:\s*AUDIOTAUNT_KEYBINDS\]([\s\S]*?)\[\/END\]/);
    if (keyMatch) {
        const lines = keyMatch[1].split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
        lines.forEach(k => {
            const parsed = parseInt(k, 10);
            if (!isNaN(parsed)) keybinds.push(parsed);
        });
    }

    return {
        pilotName,
        configPath,
        selectedTaunts,
        keybinds,
        lastModified: stat.mtimeMs
    };
}

// Apply Pilot Taunts with MANDATORY automatic backup
export function applyPilotTaunts(
    overloadDir: string, 
    pilotName: string, 
    newTauntHashes: string[]
): { success: boolean; backupPath: string; promotedCount: number; isGameRunning: boolean; error?: string } {
    const configPath = path.join(overloadDir, `${pilotName}.extendedconfig`);
    if (!fs.existsSync(configPath)) {
        return { 
            success: false, 
            backupPath: '', 
            promotedCount: 0, 
            isGameRunning: false, 
            error: `Pilot config not found: ${configPath}` 
        };
    }

    const originalContent = fs.readFileSync(configPath, 'utf8');

    // 1. MANDATORY BACKUP: Ensure Pilot Backup directory exists
    const backupDir = path.join(overloadDir, 'Pilot Backup');
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    // Format timestamp: YYYY-MM-DD_HH-mm-ss
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timeStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
    const backupFileName = `${pilotName}_backup_${timeStr}.extendedconfig`;
    const backupPath = path.join(backupDir, backupFileName);

    // Write primary timestamped backup
    fs.writeFileSync(backupPath, originalContent, 'utf8');

    // Also write snapshot next to original file
    fs.writeFileSync(`${configPath}.bak`, originalContent, 'utf8');

    console.log(`[OverloadBridge] MANDATORY BACKUP CREATED: ${backupPath}`);

    // 2. AUTO-PROMOTE OPPONENT TAUNTS:
    // OLMod explicitly requires active taunts to be in the root AudioTaunts folder:
    // "AudioTaunt at = taunts.Find(t => t.hash.Equals(hash) && !t.is_external_taunt);"
    // Files in AudioTaunts/external/ are marked external and rejected in-game unless copied to AudioTaunts/.
    const audioTauntsDir = path.join(overloadDir, 'AudioTaunts');
    const externalDir = path.join(audioTauntsDir, 'external');
    let promotedCount = 0;

    const validHashes = newTauntHashes.slice(0, 6).map(h => (h ? h.toLowerCase().trim() : ''));

    for (const hash of validHashes) {
        if (!hash || hash === 'empty') continue;

        // Check if file already exists in root AudioTaunts/
        const localFiles = fs.existsSync(audioTauntsDir) ? fs.readdirSync(audioTauntsDir) : [];
        const existsLocally = localFiles.some(f => f.toLowerCase().includes(hash));

        if (!existsLocally && fs.existsSync(externalDir)) {
            const extFiles = fs.readdirSync(externalDir);
            const matchedExt = extFiles.find(f => f.toLowerCase().includes(hash));
            if (matchedExt) {
                const fullExtPath = path.join(externalDir, matchedExt);
                const vorbisTitle = extractVorbisTitle(fullExtPath);
                const safeName = vorbisTitle 
                    ? vorbisTitle.replace(/[^a-zA-Z0-9_\- ]/g, '').trim().replace(/\s+/g, '_')
                    : 'Opponent';
                const destFileName = `${hash}-${safeName}.ogg`;
                const destPath = path.join(audioTauntsDir, destFileName);
                fs.copyFileSync(fullExtPath, destPath);
                console.log(`[OverloadBridge] Promoted opponent taunt to local directory: ${destPath}`);
                promotedCount++;
            }
        }
    }

    // 3. Prepare replacement section
    // Overload expects up to 6 lines, one for each taunt hash
    // Each line starts with 3 spaces. Empty slots are written as "   EMPTY"
    const formattedLines = validHashes.map(h => {
        if (!h || h === 'empty') return '   EMPTY';
        return `   ${h}`;
    }).join('\r\n');

    const newSection = `[SECTION: AUDIOTAUNT_SELECTED_TAUNTS]\r\n${formattedLines}\r\n[/END]`;

    let updatedContent = '';
    const sectionRegex = /\[SECTION:\s*AUDIOTAUNT_SELECTED_TAUNTS\][\s\S]*?\[\/END\]/;

    if (sectionRegex.test(originalContent)) {
        updatedContent = originalContent.replace(sectionRegex, newSection);
    } else {
        // If section was missing, append it
        updatedContent = originalContent.trimEnd() + '\r\n\r\n' + newSection + '\r\n';
    }

    // Write updated content back to the pilot config
    fs.writeFileSync(configPath, updatedContent, 'utf8');
    console.log(`[OverloadBridge] Successfully updated taunts in ${configPath}`);

    const isGameRunning = isOverloadRunning();

    return {
        success: true,
        backupPath,
        promotedCount,
        isGameRunning
    };
}

// Unified Request Handler for Overload API & Import Bridge
export async function handleOverloadApiRequest(req: any, res: any, next?: any): Promise<boolean> {
    const url = req.url || '';

    // API Routes check
    if (!url.startsWith('/api/overload/') && !url.startsWith('/api/import/')) {
        return false;
    }

    const overloadDir = getOverloadPath();

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');

    if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        res.end();
        return true;
    }

    // 1. GET /api/overload/status
    if (url === '/api/overload/status' && req.method === 'GET') {
        const installed = fs.existsSync(overloadDir);
        const pilots = listPilots(overloadDir);
        const audioTauntsDir = path.join(overloadDir, 'AudioTaunts');
        const tauntCount = fs.existsSync(audioTauntsDir) 
            ? fs.readdirSync(audioTauntsDir).filter(f => f.endsWith('.ogg')).length
            : 0;
        const isGameRunning = isOverloadRunning();

        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
            installed,
            gamePath: overloadDir,
            pilots,
            activePilot: pilots.includes('Soup') ? 'Soup' : pilots[0] || null,
            tauntCount,
            isGameRunning
        }));
        return true;
    }

    // 2. GET /api/overload/taunts
    if (url === '/api/overload/taunts' && req.method === 'GET') {
        try {
            const taunts = scanGameTaunts(overloadDir);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ taunts }));
        } catch (err: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
        }
        return true;
    }

    // 3. GET /api/overload/audio?file=...
    if (url.startsWith('/api/overload/audio') && (req.method === 'GET' || req.method === 'HEAD')) {
        try {
            const parsedUrl = new URL(url, 'http://localhost');
            const relFile = parsedUrl.searchParams.get('file');

            if (!relFile) {
                res.statusCode = 400;
                res.end('Missing file parameter');
                return true;
            }

            // Prevent path traversal
            const safeRel = path.normalize(relFile).replace(/^(\.\.[\/\\])+/, '');
            const fullPath = path.join(overloadDir, 'AudioTaunts', safeRel);

            if (!fs.existsSync(fullPath)) {
                res.statusCode = 404;
                res.end('Taunt audio file not found');
                return true;
            }

            const stat = fs.statSync(fullPath);
            res.setHeader('Content-Type', 'audio/ogg');
            res.setHeader('Content-Length', stat.size);
            res.setHeader('Accept-Ranges', 'bytes');
            res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

            const readStream = fs.createReadStream(fullPath);
            readStream.pipe(res);
        } catch (err: any) {
            res.statusCode = 500;
            res.end('Error streaming audio');
        }
        return true;
    }

    // 4. GET /api/overload/pilot/:name
    const pilotMatch = url.match(/^\/api\/overload\/pilot\/([^/?]+)/);
    if (pilotMatch && req.method === 'GET') {
        const pilotName = decodeURIComponent(pilotMatch[1]);
        const pilot = getPilotData(overloadDir, pilotName);
        if (!pilot) {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: 'Pilot not found' }));
            return true;
        }
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(pilot));
        return true;
    }

    // 5. POST /api/overload/pilot/:name/apply
    if (pilotMatch && url.includes('/apply') && req.method === 'POST') {
        const pilotName = decodeURIComponent(pilotMatch[1]);
        let body = '';
        req.on('data', (chunk: any) => { body += chunk; });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const hashes: string[] = data.selectedTaunts || [];

                const result = applyPilotTaunts(overloadDir, pilotName, hashes);
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(result));
            } catch (err: any) {
                res.statusCode = 500;
                res.end(JSON.stringify({ success: false, error: err.message }));
            }
        });
        return true;
    }

    // 6. POST /api/overload/install (Save directly into AudioTaunts)
    if (url === '/api/overload/install' && req.method === 'POST') {
        const chunks: Buffer[] = [];
        req.on('data', (chunk: any) => { chunks.push(Buffer.from(chunk)); });
        req.on('end', () => {
            try {
                const totalBuf = Buffer.concat(chunks);
                const json = JSON.parse(totalBuf.toString('utf8'));
                const { filename, base64 } = json;

                if (!filename || !base64) {
                    res.statusCode = 400;
                    res.end(JSON.stringify({ error: 'Missing filename or base64 data' }));
                    return;
                }

                const audioBuf = Buffer.from(base64, 'base64');
                const hash = getBufferMd5(audioBuf);
                const audioTauntsDir = path.join(overloadDir, 'AudioTaunts');

                if (!fs.existsSync(audioTauntsDir)) {
                    fs.mkdirSync(audioTauntsDir, { recursive: true });
                }

                // Clean filename: <hash>-<name>.ogg
                const cleanName = filename.replace(/\.ogg$/i, '').replace(/[^a-zA-Z0-9_-]/g, '_');
                const targetFilename = `${hash}-${cleanName}.ogg`;
                const targetPath = path.join(audioTauntsDir, targetFilename);

                fs.writeFileSync(targetPath, audioBuf);
                console.log(`[OverloadBridge] Installed taunt directly to: ${targetPath}`);

                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                    success: true,
                    installedPath: targetPath,
                    filename: targetFilename,
                    hash
                }));
            } catch (err: any) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: err.message }));
            }
        });
        return true;
    }

    // ==========================================
    // 7. IMPORT ROUTES (Web, YouTube, Archive)
    // ==========================================

    // 7a. GET /api/import/proxy?url=... (CORS-friendly streaming audio proxy)
    if (url.startsWith('/api/import/proxy') && (req.method === 'GET' || req.method === 'HEAD')) {
        try {
            const parsedUrl = new URL(url, 'http://localhost');
            const targetUrl = parsedUrl.searchParams.get('url');

            if (!targetUrl) {
                res.statusCode = 400;
                res.end('Missing url parameter');
                return true;
            }

            const remoteRes = await fetch(targetUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });

            if (!remoteRes.ok) {
                res.statusCode = remoteRes.status;
                res.end(`Failed to fetch target URL: ${remoteRes.statusText}`);
                return true;
            }

            const contentType = remoteRes.headers.get('content-type') || 'audio/mpeg';
            const contentLength = remoteRes.headers.get('content-length');

            res.setHeader('Content-Type', contentType);
            if (contentLength) res.setHeader('Content-Length', contentLength);
            res.setHeader('Accept-Ranges', 'bytes');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

            const arrayBuf = await remoteRes.arrayBuffer();
            res.end(Buffer.from(arrayBuf));
        } catch (err: any) {
            res.statusCode = 500;
            res.end(`Proxy error: ${err.message}`);
        }
        return true;
    }

    // 7b. POST /api/import/youtube (Audio extraction via yt-dlp)
    if (url === '/api/import/youtube' && req.method === 'POST') {
        let body = '';
        req.on('data', (chunk: any) => { body += chunk; });
        req.on('end', async () => {
            try {
                const { url: videoUrl } = JSON.parse(body);
                if (!videoUrl || typeof videoUrl !== 'string') {
                    res.statusCode = 400;
                    res.end(JSON.stringify({ success: false, error: 'Valid video URL required' }));
                    return;
                }

                const cleanUrl = videoUrl.trim();
                const tempPrefix = path.join(os.tmpdir(), `yt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
                const outTemplate = `${tempPrefix}.%(ext)s`;

                const ytdlpBin = findYtDlpCommand();
                console.log(`[ImportBridge] Extracting audio with [${ytdlpBin}] for: ${cleanUrl}`);
                const cmd = `${ytdlpBin} -f "ba[filesize<35M]/ba" --no-playlist --no-simulate --print "%(title)s" -o ${JSON.stringify(outTemplate)} ${JSON.stringify(cleanUrl)}`;

                let stdout = '';
                try {
                    stdout = execSync(cmd, { timeout: 60000, maxBuffer: 10 * 1024 * 1024 }).toString();
                } catch (execErr: any) {
                    console.error('[ImportBridge] yt-dlp error:', execErr.message);
                    res.statusCode = 500;
                    res.end(JSON.stringify({ 
                        success: false, 
                        error: `yt-dlp extraction failed: ${execErr.stderr ? execErr.stderr.toString() : execErr.message}` 
                    }));
                    return;
                }

                const lines = stdout.trim().split(/\r?\n/).filter(l => l.trim().length > 0);
                const title = lines[lines.length - 1] || 'youtube_audio';

                const tempDir = os.tmpdir();
                const prefixBase = path.basename(tempPrefix);
                const matchedFiles = fs.readdirSync(tempDir).filter(f => f.startsWith(prefixBase));

                if (matchedFiles.length === 0) {
                    res.statusCode = 500;
                    res.end(JSON.stringify({ success: false, error: 'Downloaded audio file could not be located in temp storage.' }));
                    return;
                }

                const targetTempFile = path.join(tempDir, matchedFiles[0]);
                const ext = path.extname(targetTempFile).replace('.', '').toLowerCase() || 'webm';
                const fileBuf = fs.readFileSync(targetTempFile);

                try { fs.unlinkSync(targetTempFile); } catch {}

                const mimeMap: Record<string, string> = {
                    'webm': 'audio/webm',
                    'm4a': 'audio/mp4',
                    'mp3': 'audio/mpeg',
                    'ogg': 'audio/ogg',
                    'opus': 'audio/opus',
                    'wav': 'audio/wav'
                };

                const mimeType = mimeMap[ext] || 'audio/webm';
                const safeTitle = title.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 40);

                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                    success: true,
                    title,
                    filename: `${safeTitle}.${ext}`,
                    mimeType,
                    base64: fileBuf.toString('base64'),
                    size: fileBuf.length
                }));
            } catch (err: any) {
                res.statusCode = 500;
                res.end(JSON.stringify({ success: false, error: err.message }));
            }
        });
        return true;
    }

    // 7c. GET /api/import/archive/search (Search Internet Archive public domain audio)
    if (url.startsWith('/api/import/archive/search') && req.method === 'GET') {
        try {
            const parsedUrl = new URL(url, 'http://localhost');
            const query = parsedUrl.searchParams.get('q') || 'arcade sound effects';
            const rows = parseInt(parsedUrl.searchParams.get('rows') || '8', 10);

            const searchApiUrl = `https://archive.org/advancedsearch.php?q=mediatype:audio+AND+(${encodeURIComponent(query)})&fl[]=identifier,title,description,year,downloads&sort[]=downloads+desc&rows=${rows}&page=1&output=json`;

            const searchRes = await fetch(searchApiUrl);
            const searchData = await searchRes.json();
            const docs = searchData?.response?.docs || [];

            const results = await Promise.all(docs.map(async (doc: any) => {
                try {
                    const metaRes = await fetch(`https://archive.org/metadata/${doc.identifier}/files`);
                    const metaData = await metaRes.json();
                    const files = metaData.result || [];

                    const tracks = files.filter((f: any) => {
                        if (!f.name) return false;
                        const nameLower = f.name.toLowerCase();
                        const isAudio = nameLower.endsWith('.mp3') || nameLower.endsWith('.ogg') || nameLower.endsWith('.wav');
                        const isNotVbrOrSpectro = !nameLower.includes('_vbr.') && !nameLower.includes('_spectrogram.');
                        const isReasonableSize = !f.size || parseInt(f.size, 10) < 45 * 1024 * 1024;
                        return isAudio && isNotVbrOrSpectro && isReasonableSize;
                    }).slice(0, 5).map((f: any) => {
                        const directUrl = `https://archive.org/download/${doc.identifier}/${encodeURIComponent(f.name)}`;
                        return {
                            name: f.name,
                            title: f.title || f.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '),
                            length: f.length ? parseFloat(f.length) : null,
                            size: f.size ? parseInt(f.size, 10) : null,
                            directUrl,
                            proxyUrl: `/api/import/proxy?url=${encodeURIComponent(directUrl)}`
                        };
                    });

                    return {
                        identifier: doc.identifier,
                        title: doc.title || doc.identifier,
                        year: doc.year || null,
                        downloads: doc.downloads || 0,
                        description: doc.description || '',
                        tracks
                    };
                } catch {
                    return {
                        identifier: doc.identifier,
                        title: doc.title || doc.identifier,
                        year: doc.year || null,
                        downloads: doc.downloads || 0,
                        description: '',
                        tracks: []
                    };
                }
            }));

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, results }));
        } catch (err: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: err.message }));
        }
        return true;
    }

    // 7d. GET /api/import/archive/files?id=... (Fetch all tracks for an archive item)
    if (url.startsWith('/api/import/archive/files') && req.method === 'GET') {
        try {
            const parsedUrl = new URL(url, 'http://localhost');
            const id = parsedUrl.searchParams.get('id');
            if (!id) {
                res.statusCode = 400;
                res.end(JSON.stringify({ success: false, error: 'Missing archive id' }));
                return true;
            }

            const metaRes = await fetch(`https://archive.org/metadata/${encodeURIComponent(id)}/files`);
            const metaData = await metaRes.json();
            const files = metaData.result || [];

            const tracks = files.filter((f: any) => {
                if (!f.name) return false;
                const nameLower = f.name.toLowerCase();
                const isAudio = nameLower.endsWith('.mp3') || nameLower.endsWith('.ogg') || nameLower.endsWith('.wav');
                const isNotVbrOrSpectro = !nameLower.includes('_vbr.') && !nameLower.includes('_spectrogram.');
                return isAudio && isNotVbrOrSpectro;
            }).map((f: any) => {
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

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, tracks }));
        } catch (err: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: err.message }));
        }
        return true;
    }

    if (next) {
        next();
    }
    return false;
}

// Vite Plugin to mount the Overload Bridge API in dev and preview
export function createOverloadBridgePlugin(): Plugin {
    const overloadDir = getOverloadPath();
    console.log(`[OverloadBridge] Initialized with game directory: ${overloadDir}`);

    return {
        name: 'vite-plugin-overload-bridge',
        configureServer(server: ViteDevServer) {
            server.middlewares.use(async (req: any, res: any, next: any) => {
                const handled = await handleOverloadApiRequest(req, res, next);
                if (!handled && next) {
                    next();
                }
            });
        },
        configurePreviewServer(server) {
            server.middlewares.use(async (req: any, res: any, next: any) => {
                const handled = await handleOverloadApiRequest(req, res, next);
                if (!handled && next) {
                    next();
                }
            });
        }
    };
}
