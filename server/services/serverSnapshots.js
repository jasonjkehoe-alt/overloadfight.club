import axios from 'axios';
import cacheService from './cacheService.js';
import db from '../db.js';
import { SNAPSHOT } from '../lib/gameParse.js';

// The tracker's live server browser. /api/browser answers from it and the
// snapshot timer stores it, through one 15 s cache, so the site asks the
// tracker at most once per 15 s whoever is asking.
const CACHE_KEY = 'browser_servers';
const CACHE_SECONDS = 15;

export async function fetchServerBrowser() {
    const cached = await cacheService.get(CACHE_KEY);
    if (cached) return cached;
    const response = await axios.get('https://tracker.otl.gg/api/browser', { timeout: 5000 });
    if (response.data) await cacheService.set(CACHE_KEY, response.data, CACHE_SECONDS);
    return response.data;
}

// One tick: the server browser now, stored (S15). A failed fetch stores
// nothing, so a tracker outage does not count against any server's uptime.
export async function takeSnapshot(now = Date.now()) {
    try {
        const servers = await fetchServerBrowser();
        // a fetch still out when shutdown began must not write to a closed database
        if (Array.isArray(servers) && !stopped) return db.saveServerSnapshot(now, servers);
    } catch (error) {
        console.error('[Snapshots] Server browser not stored:', error.message);
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
