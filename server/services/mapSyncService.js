import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OVERLOAD_MAPS_HOMEPAGE = 'https://www.overloadmaps.com/';
const OVERLOAD_MAPS_JSON_URL = 'https://www.overloadmaps.com/data/all.json';

/**
 * Scrapes upstream missions dictionary directly from overloadmaps.com homepage
 */
async function fetchUpstreamMissions() {
    const byName = new Map();
    const byUrl = new Map();
    const byHash = new Map();

    try {
        console.log('[MapSync] Fetching live missions catalog from overloadmaps.com homepage...');
        const res = await axios.get(OVERLOAD_MAPS_HOMEPAGE, { timeout: 15000 });
        const html = res.data;
        const match = html.match(/var missions = (\{[\s\S]*?\});\s*(?:var|\n|function)/);
        if (match) {
            const missions = JSON.parse(match[1]);
            for (const [slug, m] of Object.entries(missions)) {
                const author = m.author?.trim() || null;
                const releaseDate = m.time ? new Date(m.time * 1000).toISOString().split('T')[0] : null;

                const missionInfo = {
                    name: m.name,
                    author: author,
                    releaseDate: releaseDate,
                    img: m.img
                };

                if (m.name) byName.set(m.name.toLowerCase().trim(), missionInfo);

                for (const mode of ['mp', 'cm', 'sp']) {
                    if (m[mode]) {
                        if (m[mode].name) byName.set(m[mode].name.toLowerCase().trim(), missionInfo);
                        if (m[mode].url) byUrl.set(m[mode].url.toLowerCase().trim(), missionInfo);
                    }
                }

                if (m.img) {
                    const hashMatch = m.img.match(/\/imgs\/(?:large\/)?([a-f0-9]{32})\//i);
                    if (hashMatch) {
                        byHash.set(hashMatch[1].toLowerCase(), missionInfo);
                    }
                }
            }
            console.log(`[MapSync] Loaded ${Object.keys(missions).length} missions with verified authors.`);
        }
    } catch (e) {
        console.warn('[MapSync] Could not fetch missions from homepage:', e.message);
    }

    return { byName, byUrl, byHash };
}

/**
 * Parses known offline metadata from maps_export.csv or new_map_data.json if present
 */
function loadKnownMetadata() {
    const metadataMap = new Map();

    // 1. Try maps_export.csv
    const csvPath = path.join(__dirname, '../seed/maps_export.csv');
    if (fs.existsSync(csvPath)) {
        try {
            const csvContent = fs.readFileSync(csvPath, 'utf8');
            const lines = csvContent.split('\n');
            // Header: id,name,image,size,maxPlayers,bestTeamSize,supportsCTF,author,date,downloadLink,style
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                const parts = line.split(',');
                if (parts.length >= 11) {
                    const name = parts[1].trim();
                    metadataMap.set(name.toLowerCase(), {
                        author: parts[7]?.trim() || 'Unknown',
                        size: parts[3]?.trim() || 'medium',
                        max_players: parseInt(parts[4], 10) || 8,
                        best_team_size: parseInt(parts[5], 10) || 4,
                        supports_ctf: parts[6]?.trim().toLowerCase() === 'true',
                        style: parts[10]?.trim() || 'mixed',
                        release_date: parts[8]?.trim() || null
                    });
                }
            }
        } catch (e) {
            console.warn('[MapSync] Could not read maps_export.csv:', e.message);
        }
    }

    return metadataMap;
}

/**
 * Synchronizes maps catalog from overloadmaps.com
 */
export async function syncFromUpstream() {
    console.log('[MapSync] Fetching map catalog from overloadmaps.com...');
    try {
        const [{ byName, byUrl, byHash }, allJsonResponse] = await Promise.all([
            fetchUpstreamMissions(),
            axios.get(OVERLOAD_MAPS_JSON_URL, { timeout: 15000 }).catch(err => {
                console.warn('[MapSync] all.json fetch warning:', err.message);
                return { data: [] };
            })
        ]);

        const items = allJsonResponse.data;
        if (!Array.isArray(items) || items.length === 0) {
            throw new Error('Invalid or empty map catalog received');
        }

        const knownMeta = loadKnownMetadata();
        let upsertedCount = 0;

        for (const item of items) {
            if (!item.levels || item.levels.length === 0) continue;

            const relativeZip = item.url; // e.g. /files/2682b30cabdb7099055515597f53019c/burning_sativa_2.zip
            const remoteUrl = `https://www.overloadmaps.com${relativeZip}`;

            // Derive image URL from zip path
            let relativeImage = relativeZip.replace('/files/', '/imgs/large/');
            if (relativeImage.endsWith('.zip')) {
                relativeImage = relativeImage.slice(0, -4) + '.jpg';
            }
            const remoteImageUrl = `https://www.overloadmaps.com${relativeImage}`;

            const releaseDate = item.mtime ? new Date(item.mtime * 1000).toISOString().split('T')[0] : null;

            // Extract hash from relativeZip if available
            const hashMatch = relativeZip.match(/([a-f0-9]{32})/i);
            const hash = hashMatch ? hashMatch[1].toLowerCase() : null;

            for (const level of item.levels) {
                const mapName = level.name.trim();
                if (!mapName) continue;

                const cleanName = mapName.toLowerCase();

                // 1. Resolve upstream metadata (live author!)
                let upstream = byName.get(cleanName);
                if (!upstream) {
                    upstream = byUrl.get(relativeZip.toLowerCase());
                }
                if (!upstream && hash) {
                    upstream = byHash.get(hash);
                }

                // 2. Resolve offline metadata
                const meta = knownMeta.get(cleanName) || {};

                // Determine author: upstream > offline meta > 'Unknown'
                let author = 'Unknown';
                if (upstream?.author && upstream.author.trim() && upstream.author.toLowerCase() !== 'unknown') {
                    author = upstream.author.trim();
                } else if (meta.author && meta.author.trim() && meta.author.toLowerCase() !== 'unknown') {
                    author = meta.author.trim();
                }

                db.upsertMap({
                    name: mapName,
                    author: author,
                    size: meta.size || 'medium',
                    max_players: meta.max_players || 8,
                    best_team_size: meta.best_team_size || 4,
                    supports_ctf: meta.supports_ctf ?? (level.type === 'ctf'),
                    style: meta.style || 'mixed',
                    release_date: upstream?.releaseDate || meta.release_date || releaseDate,
                    remote_url: remoteUrl,
                    remote_image_url: remoteImageUrl,
                    file_size: item.size || 0,
                    is_custom: true
                });

                upsertedCount++;
            }
        }

        console.log(`[MapSync] Map catalog sync complete. Upserted ${upsertedCount} levels.`);
        return { success: true, count: upsertedCount };

    } catch (err) {
        console.error('[MapSync] Error syncing maps:', err.message);
        throw err;
    }
}

/**
 * Checks if the maps table is empty; if so, populates from local metadata or upstream
 */
export async function ensureMapsPopulated() {
    // 1. Always ensure official Revival Productions base game maps are seeded
    db.seedStockMaps();

    const totalMaps = db.countMaps();
    if (totalMaps <= 12) {
        console.log('[MapSync] Maps table is empty or stock only. Initializing catalog...');
        try {
            await syncFromUpstream();
        } catch (e) {
            console.warn('[MapSync] Initial map sync failed. Retrying later:', e.message);
        }
    }

    // 2. Ensure map stats cache is populated across historical telemetry
    const cachedStatsCount = db.countMapStatsCache();
    if (cachedStatsCount === 0) {
        console.log('[MapSync] Map stats cache is empty. Building map telemetry cache...');
        await db.refreshPilotStats();
    }
}

export default {
    syncFromUpstream,
    ensureMapsPopulated
};
