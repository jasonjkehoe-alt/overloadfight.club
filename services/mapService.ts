import { MapData } from '../types';

let mapCache: Map<string, MapData> = new Map();
let mapListCache: MapData[] = [];
let loadPromise: Promise<MapData[]> | null = null;

/**
 * Fetches all maps from the local backend API (/api/maps)
 */
export const getMapData = async (forceRefresh: boolean = false): Promise<MapData[]> => {
    if (!forceRefresh && mapListCache.length > 0) {
        return mapListCache;
    }

    if (!forceRefresh && loadPromise) {
        return loadPromise;
    }

    loadPromise = (async () => {
        try {
            const res = await fetch('/api/maps?limit=1000');
            if (!res.ok) throw new Error(`HTTP error ${res.status}`);
            const data = await res.json();
            if (data && Array.isArray(data.maps)) {
                mapListCache = data.maps;
                mapCache.clear();
                for (const m of data.maps) {
                    mapCache.set(m.name.toLowerCase().trim(), m);
                }
                return mapListCache;
            }
        } catch (err) {
            console.error('Failed to load map data from /api/maps:', err);
        } finally {
            loadPromise = null;
        }
        return mapListCache;
    })();

    return loadPromise;
};

/**
 * Synchronous helper to get map image URL for a given map name.
 * Uses cached data if available, otherwise points to the by-name endpoint.
 */
export const getMapImage = (mapName?: string): string | null => {
    if (!mapName || !mapName.trim()) return null;
    const clean = mapName.trim().toLowerCase();

    // Direct match in memory cache
    const direct = mapCache.get(clean);
    if (direct) {
        return direct.image || `/api/maps/${direct.id}/image`;
    }

    // Normalized match in memory cache
    const norm = clean.replace(/[^a-z0-9]/g, '');
    for (const [key, m] of mapCache.entries()) {
        const normKey = key.replace(/[^a-z0-9]/g, '');
        if (normKey === norm || (norm.length >= 4 && (normKey.includes(norm) || norm.includes(normKey)))) {
            return m.image || `/api/maps/${m.id}/image`;
        }
    }

    // Fallback: hit server endpoint by name
    return `/api/maps/by-name/${encodeURIComponent(mapName.trim())}/image`;
};

// Warm up map cache
getMapData().catch(() => {});
