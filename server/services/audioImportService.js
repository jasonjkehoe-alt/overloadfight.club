import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import os from 'os';
import fs from 'fs';

const execFileAsync = promisify(execFile);

/**
 * Normalizes YouTube video URLs to avoid extraneous query parameters or playlists
 */
export function normalizeYouTubeUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') return '';
    const trimmed = rawUrl.trim();

    // Check if it's a short URL: youtu.be/<id>
    const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/i);
    if (shortMatch) {
        return `https://www.youtube.com/watch?v=${shortMatch[1]}`;
    }

    // Check for Shorts: youtube.com/shorts/<id>
    const shortsMatch = trimmed.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/i);
    if (shortsMatch) {
        return `https://www.youtube.com/watch?v=${shortsMatch[1]}`;
    }

    // Standard watch URL: extract v parameter
    const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/i);
    if (watchMatch) {
        return `https://www.youtube.com/watch?v=${watchMatch[1]}`;
    }

    return trimmed;
}

/**
 * Warms up Python and yt_dlp in memory/cache so subsequent calls are instantaneous
 */
let isWarmedUp = false;
export async function warmupEngine() {
    if (isWarmedUp) return { warmed: true };
    try {
        await execFileAsync('python', ['-m', 'yt_dlp', '--version'], { timeout: 8000 });
        isWarmedUp = true;
        console.log('[AudioImport] yt-dlp engine pre-warmed successfully.');
        return { warmed: true };
    } catch (err) {
        console.warn('[AudioImport] Pre-warm notice:', err.message);
        return { warmed: false, error: err.message };
    }
}

/**
 * Searches YouTube videos without downloading using yt-dlp metadata extraction
 */
export async function searchYouTube(query, limit = 8) {
    const cleanQuery = (query || '').trim();
    if (!cleanQuery) return [];

    const pyScript = `
import yt_dlp, json, sys
sys.stdout.reconfigure(encoding='utf-8')
ydl_opts = {
    'quiet': True,
    'no_warnings': True,
    'extract_flat': True,
    'skip_download': True,
}
q = sys.argv[1]
limit = sys.argv[2]
try:
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        res = ydl.extract_info('ytsearch' + limit + ':' + q, download=False)
        entries = res.get('entries', []) if res else []
        out = []
        for e in entries:
            if not e or not e.get('id'): continue
            dur = e.get('duration')
            dur_str = ''
            if dur is not None:
                try:
                    m, s = divmod(int(dur), 60)
                    h, m = divmod(m, 60)
                    dur_str = f"{h}:{m:02d}:{s:02d}" if h else f"{m}:{s:02d}"
                except:
                    dur_str = ''
            
            vid_id = e.get('id')
            thumbs = e.get('thumbnails') or []
            thumb_url = thumbs[-1].get('url') if thumbs else f"https://i.ytimg.com/vi/{vid_id}/mqdefault.jpg"

            out.append({
                'id': vid_id,
                'title': e.get('title') or 'Untitled',
                'url': f"https://www.youtube.com/watch?v={vid_id}",
                'duration': dur,
                'durationStr': dur_str,
                'uploader': e.get('uploader') or e.get('channel') or 'YouTube Creator',
                'viewCount': e.get('view_count'),
                'thumbnail': thumb_url
            })
        print(json.dumps(out))
except Exception as ex:
    print(json.dumps({'error': str(ex)}))
`;

    try {
        const { stdout } = await execFileAsync('python', ['-c', pyScript, cleanQuery, String(limit)], {
            timeout: 20000,
            maxBuffer: 10 * 1024 * 1024
        });
        const parsed = JSON.parse(stdout.trim());
        if (parsed.error) {
            throw new Error(parsed.error);
        }
        return parsed;
    } catch (err) {
        console.error('[AudioImport] YouTube search error:', err.message);
        throw err;
    }
}

// In-memory cache and in-flight deduplication for extracted YouTube audio
const youtubeAudioCache = new Map();
const inFlightExtractions = new Map();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Extracts raw audio stream from a YouTube URL via yt-dlp with automatic retry,
 * 10MB HTTP range chunking (bypasses YouTube throttling), and in-memory caching.
 */
export async function extractYouTubeAudio(videoUrl, includeBuffer = false) {
    const cleanUrl = normalizeYouTubeUrl(videoUrl);
    if (!cleanUrl) throw new Error('A valid YouTube URL is required');

    // 1. Check in-memory cache first
    const cached = youtubeAudioCache.get(cleanUrl);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
        return includeBuffer ? cached : {
            success: true,
            title: cached.title,
            filename: cached.filename,
            mimeType: cached.mimeType,
            base64: cached.base64,
            size: cached.size
        };
    }

    // 2. Deduplicate concurrent requests for the same URL (e.g. Preview + Load into Editor)
    if (inFlightExtractions.has(cleanUrl)) {
        const result = await inFlightExtractions.get(cleanUrl);
        return includeBuffer ? result : {
            success: true,
            title: result.title,
            filename: result.filename,
            mimeType: result.mimeType,
            base64: result.base64,
            size: result.size
        };
    }

    const extractionPromise = (async () => {
        const tempPrefix = path.join(os.tmpdir(), `yt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
        const outTemplate = `${tempPrefix}.%(ext)s`;

        const args = [
            '-m', 'yt_dlp',
            '--js-runtimes', 'node',
            '--remote-components', 'ejs:github',
            '-f', 'ba[ext=webm][filesize<35M]/ba[filesize<35M]/ba',
            '--http-chunk-size', '10M',
            '--no-playlist',
            '--no-simulate',
            '--retries', '3',
            '--fragment-retries', '3',
            '--socket-timeout', '20',
            '--print', '%(title)s',
            '-o', outTemplate,
            '--',
            cleanUrl
        ];

        let stdout = '';
        let lastError = null;

        for (let attempt = 1; attempt <= 2; attempt++) {
            try {
                console.log(`[AudioImport] Attempt ${attempt}: Extracting audio for ${cleanUrl}`);
                const result = await execFileAsync('python', args, {
                    timeout: 65000,
                    maxBuffer: 10 * 1024 * 1024
                });
                stdout = result.stdout;
                lastError = null;
                break;
            } catch (err) {
                lastError = err;
                console.warn(`[AudioImport] Attempt ${attempt} failed: ${err.message}`);
                if (attempt === 1) {
                    await new Promise(r => setTimeout(r, 600));
                }
            }
        }

        if (lastError) {
            const errorDetail = lastError.stderr ? lastError.stderr.toString() : lastError.message;
            throw new Error(`Audio extraction failed: ${errorDetail}`);
        }

        const lines = stdout.trim().split(/\r?\n/).filter(l => l.trim().length > 0);
        const title = lines[lines.length - 1] || 'youtube_audio';

        const tempDir = os.tmpdir();
        const prefixBase = path.basename(tempPrefix);
        const matchedFiles = fs.readdirSync(tempDir).filter(f => f.startsWith(prefixBase));

        if (matchedFiles.length === 0) {
            throw new Error('Downloaded audio stream could not be located in temporary storage.');
        }

        const targetTempFile = path.join(tempDir, matchedFiles[0]);
        const ext = path.extname(targetTempFile).replace('.', '').toLowerCase() || 'webm';
        const fileBuf = fs.readFileSync(targetTempFile);

        try { fs.unlinkSync(targetTempFile); } catch {}

        const mimeMap = {
            'webm': 'audio/webm',
            'm4a': 'audio/mp4',
            'mp3': 'audio/mpeg',
            'ogg': 'audio/ogg',
            'opus': 'audio/opus',
            'wav': 'audio/wav'
        };

        const mimeType = mimeMap[ext] || 'audio/webm';
        const safeTitle = title.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 45);

        const entry = {
            success: true,
            title,
            filename: `${safeTitle}.${ext}`,
            mimeType,
            buffer: fileBuf,
            base64: fileBuf.toString('base64'),
            size: fileBuf.length,
            timestamp: Date.now()
        };

        // Keep cache bounded to 15 recent videos
        if (youtubeAudioCache.size >= 15) {
            const oldestKey = youtubeAudioCache.keys().next().value;
            if (oldestKey) youtubeAudioCache.delete(oldestKey);
        }
        youtubeAudioCache.set(cleanUrl, entry);
        return entry;
    })();

    inFlightExtractions.set(cleanUrl, extractionPromise);
    try {
        const result = await extractionPromise;
        return includeBuffer ? result : {
            success: true,
            title: result.title,
            filename: result.filename,
            mimeType: result.mimeType,
            base64: result.base64,
            size: result.size
        };
    } finally {
        inFlightExtractions.delete(cleanUrl);
    }
}

/**
 * Searches Internet Archive with category tuning, title boosting, and smart track scoring
 */
export async function searchArchive(query, category = 'sfx', rows = 8) {
    const cleanTerms = (query || '').trim().replace(/['"]/g, '');
    if (!cleanTerms) return [];

    let categoryFilter = '';
    if (category === 'sfx') {
        // Target sound effects, arcade, and audio sample collections
        categoryFilter = 'AND (collection:(audio_sound_effects OR freesound OR samplepacks OR soundeffects) OR subject:(sound effects) OR subject:(sfx) OR subject:(game) OR subject:(sample) OR subject:(arcade) OR title:(sound effect) OR title:(sfx)) AND -collection:librivoxaudio AND -collection:audio_bookspoetry AND -collection:podcasts';
    } else if (category === 'vintage') {
        // Target vintage radio, NASA communications, sci-fi drama
        categoryFilter = 'AND (collection:(nasaaudiocollection OR oldtimeradio OR radio_drama) OR subject:(nasa) OR subject:(apollo) OR subject:(radio drama) OR subject:(sci-fi)) AND -collection:librivoxaudio';
    } else {
        // All audio archives, just exclude 50-hour audiobooks
        categoryFilter = 'AND -collection:librivoxaudio AND -collection:audio_bookspoetry AND -collection:podcasts';
    }

    const lucene = `mediatype:audio AND (title:(${cleanTerms})^5 OR subject:(${cleanTerms})^3 OR description:(${cleanTerms})) ${categoryFilter}`;
    const searchApiUrl = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(lucene)}&fl[]=identifier,title,description,year,downloads&rows=${rows}&page=1&output=json`;

    const searchRes = await fetch(searchApiUrl);
    if (!searchRes.ok) throw new Error(`Internet Archive returned HTTP ${searchRes.status}`);

    const searchData = await searchRes.json();
    const docs = searchData?.response?.docs || [];

    const qTerms = cleanTerms.toLowerCase().split(/\s+/).filter(Boolean);

    const results = await Promise.all(docs.map(async (doc) => {
        try {
            const metaRes = await fetch(`https://archive.org/metadata/${encodeURIComponent(doc.identifier)}/files`);
            const metaData = await metaRes.json();
            const files = metaData.result || [];

            const audioFiles = files.filter(f => {
                if (!f.name) return false;
                const nameLower = f.name.toLowerCase();
                const isAudio = nameLower.endsWith('.mp3') || nameLower.endsWith('.ogg') || nameLower.endsWith('.wav');
                const isNotSpectro = !nameLower.includes('_spectrogram.') && !nameLower.includes('_vbr.');
                const isReasonableSize = !f.size || parseInt(f.size, 10) < 50 * 1024 * 1024;
                return isAudio && isNotSpectro && isReasonableSize;
            });

            // Smart Sort Tracks:
            // 1. Files containing search keywords in filename or title
            // 2. Short duration (< 60s, < 120s) ideal for Overload combat taunts
            audioFiles.sort((a, b) => {
                const aName = (a.title || a.name).toLowerCase();
                const bName = (b.title || b.name).toLowerCase();
                const aMatches = qTerms.filter(t => aName.includes(t)).length;
                const bMatches = qTerms.filter(t => bName.includes(t)).length;
                if (aMatches !== bMatches) return bMatches - aMatches;

                const aLen = parseFloat(a.length || '9999');
                const bLen = parseFloat(b.length || '9999');
                // Prefer tracks under 90s
                const aUnder90 = aLen > 0 && aLen <= 90 ? 1 : 0;
                const bUnder90 = bLen > 0 && bLen <= 90 ? 1 : 0;
                if (aUnder90 !== bUnder90) return bUnder90 - aUnder90;

                return aLen - bLen;
            });

            const topTracks = audioFiles.slice(0, 8).map(f => {
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
                tracks: topTracks
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

    return results;
}

/**
 * Resolves a direct audio stream URL from YouTube for live in-browser previewing
 */
export async function getYouTubeStreamUrl(videoId) {
    if (!videoId) throw new Error('Video ID required');
    const pyScript = `
import yt_dlp, json, sys
sys.stdout.reconfigure(encoding='utf-8')
ydl_opts = {
    'quiet': True,
    'format': '140/ba[ext=m4a]/ba[ext=mp3]/ba',
    'no_warnings': True,
    'js_runtimes': {'node': {}}
}
try:
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info('https://www.youtube.com/watch?v=' + sys.argv[1], download=False)
        print(json.dumps({'url': info.get('url'), 'ext': info.get('ext'), 'title': info.get('title')}))
except Exception as e:
    print(json.dumps({'error': str(e)}))
`;
    const { stdout } = await execFileAsync('python', ['-c', pyScript, videoId], { timeout: 15000 });
    const parsed = JSON.parse(stdout.trim());
    if (parsed.error) throw new Error(parsed.error);
    return parsed;
}
