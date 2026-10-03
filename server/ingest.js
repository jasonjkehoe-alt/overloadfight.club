import axios from 'axios';
import db from './db.js';
import backfillManager from './backfill.js';

const API_BASE = 'https://tracker.otl.gg/api';

// In-memory TTL cache for page syncs
const pageSyncCache = new Map();
const SYNC_TTL_MS = 30 * 1000; // 30 seconds

/**
 * Syncs a specific page of games from the API to the DB.
 * Uses a TTL to prevent spamming the API if called frequently.
 * @param {number} page - The page number to sync.
 * @param {boolean} force - If true, ignores TTL and forces a fetch.
 * @returns {Promise<Object>} The result of the sync operation.
 */
async function syncPage(page = 1, force = false) {
    const now = Date.now();
    const lastSync = pageSyncCache.get(page) || 0;

    if (!force && (now - lastSync < SYNC_TTL_MS)) {
        console.log(`[Sync] Page ${page} synced recently (${Math.round((now - lastSync) / 1000)}s ago). Skipping API hit.`);
        return { skipped: true };
    }

    try {
        console.log(`[Sync] Fetching page ${page} from API...`);
        const response = await axios.get(`${API_BASE}/gamelist?page=${page}`, { timeout: 5000 });
        const data = response.data;

        if (!data || !data.games || data.games.length === 0) {
            return { count: 0 };
        }

        // Upsert into DB
        db.saveGames(data.games);

        // Update TTL
        pageSyncCache.set(page, now);

        console.log(`[Sync] Successfully synced ${data.games.length} games from page ${page}.`);
        return { count: data.games.length, latestId: data.games[0]?.id };

    } catch (error) {
        console.error(`[Sync] Error syncing page ${page}:`, error.message);
        throw error;
    }
}

/**
 * Checks for gaps at startup and triggers backfills if needed.
 */
async function checkStartupBackfill() {
    try {
        const setting = db.getAdminSetting.get('startup_backfill_enabled');
        if (setting && setting.value === 'false') {
            console.log('Startup backfill check disabled by admin setting.');
            return;
        }

        console.log('Checking for new games (Startup Sync)...');

        // 1. Sync Page 1 immediately
        await syncPage(1, true);

        // 2. Simple Gap Check
        const localMax = db.getLatestGameId.get()?.max_id || 0;

        // We need to know what the latest ID *is* to know if there's a gap.
        // Since we just synced Page 1, we can query the DB for the latest again.
        const newMax = db.getLatestGameId.get()?.max_id || 0;

        // If we have a local max, and the new max is significantly higher, 
        // we might have missed a chunk.
        // However, the "Sync-First" architecture handles deep history via read-through.
        // So we only really care about the "head" gap if we want to be proactive.

        // For now, we'll rely on the user to trigger deep backfills via the Admin Panel
        // or the read-through mechanism to fill in history as they browse.

        console.log('Startup sync complete.');

    } catch (error) {
        console.error('Error in startup backfill check:', error.message);
    }
}

// Legacy polling (optional, can be disabled if we rely purely on Read-Through)
function startPolling(intervalMs = 60000) {
    // Run immediately
    checkStartupBackfill();

    // Then poll Page 1 every minute to keep the "Live" view fresh without user interaction
    setInterval(() => {
        syncPage(1).catch(err => console.error("Polling error:", err.message));
    }, intervalMs);
}

export default {
    syncPage,
    startPolling,
    checkStartupBackfill,
    initialPopulate: checkStartupBackfill
};
