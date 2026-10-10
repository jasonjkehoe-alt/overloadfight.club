import axios from 'axios';
import cacheService from './cacheService.js';
import db from '../db.js';
import { checkPing, checkReminders } from './discordService.js';
import { SNAPSHOT } from '../lib/gameParse.js';

// The tracker's live server browser. /api/browser answers from it and the
// snapshot timer stores it, through one 15 s cache, so the site asks the
// tracker at most once per 15 s whoever is asking: callers that miss the cache
// together share the request out (the refreshPilotStats pattern).
const CACHE_KEY = 'browser_servers';
const CACHE_SECONDS = 15;
let inflight = null;

export function fetchServerBrowser() {
    inflight ??= fetchAndCache().finally(() => {
        inflight = null;
    });
    return inflight;
}

async function fetchAndCache() {
    const cached = await cacheService.get(CACHE_KEY);
    if (cached) return cached;
    const response = await axios.get('https://tracker.otl.gg/api/browser', { timeout: 5000 });
    if (response.data) await cacheService.set(CACHE_KEY, response.data, CACHE_SECONDS);
    return response.data;
}

// One tick: the server browser now, stored (S15). A failed fetch stores
// nothing, so a tracker outage does not count against any server's uptime; an
// empty list is read the same way (a tracker filling up again), since storing
// it would mark every server offline for that minute.
export async function takeSnapshot(now = Date.now()) {
    try {
        const servers = await fetchServerBrowser();
        if (!Array.isArray(servers)) throw new Error(`the answer is not a list (${typeof servers})`);
        if (servers.length === 0) throw new Error('the answer lists no servers');
        // a fetch still out when shutdown began must not write to a closed database
        if (!stopped) {
            const stored = db.saveServerSnapshot(now, servers);
            checkPing(servers, now); // the Discord ping (S18), not waited for
            return stored;
        }
    } catch (error) {
        console.error('[Snapshots] Server browser not stored:', error.message);
    } finally {
        // the reminder before a scheduled night (S22) rides the tick too, and
        // a tracker outage must not silence it
        if (!stopped) checkReminders(now);
    }
    return 0;
}

let timer = null;
let stopped = false;

// Every SNAPSHOT.everyMs whether or not anyone has the site open.
export function startSnapshots() {
    if (timer) return;
    stopped = false;
    takeSnapshot();
    timer = setInterval(takeSnapshot, SNAPSHOT.everyMs);
}

// Before the database closes on shutdown.
export function stopSnapshots() {
    clearInterval(timer);
    timer = null;
    stopped = true;
}
