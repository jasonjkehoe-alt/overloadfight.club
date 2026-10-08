import db from './db.js';
import { backupDatabases } from './backup.js';
import fightNightService from './services/fightNightService.js';
import { dayStart, fightNightDay, shiftDay } from './lib/gameParse.js';

// The fight-night detector runs this long after a fight-night day ends (06:00
// Chicago time), so the night's last matches have been synced from the tracker.
const DETECTOR_DELAY_MS = 15 * 60 * 1000;

async function runNightlyBackup() {
    console.log('[Maintenance] Backing up databases...');
    try {
        const dir = await backupDatabases();
        console.log(`[Maintenance] Databases backed up to ${dir}.`);
    } catch (error) {
        console.error('[Maintenance] Database backup failed:', error);
    }
}

async function runDailyMaintenance() {
    console.log('[Maintenance] Starting daily maintenance...');
    try {
        const movedCount = db.moveGamesToColdStorage();
        if (movedCount > 0) {
            console.log(`[Maintenance] Moved ${movedCount} old games to Cold Storage.`);
        } else {
            console.log('[Maintenance] No games needed moving to Cold Storage.');
        }
        console.log(`[Maintenance] Deleted ${db.pruneServerSnapshots()} server-browser ticks older than the raw window.`);
    } catch (error) {
        console.error('[Maintenance] Error running maintenance:', error);
    }
}

async function refreshPilotStats() {
    console.log('[Maintenance] Refreshing stats caches...');
    try {
        // One pass builds every cache, the archive and map stats and the ratings included.
        await db.refreshPilotStats();
        console.log('[Maintenance] Stats caches refreshed successfully.');
    } catch (error) {
        console.error('[Maintenance] Error refreshing stats caches:', error);
    }
}

function scheduleMaintenance() {
    // 1. Initial startup checks (after 10s grace period)
    setTimeout(async () => {
        try {
            if (db.hasPilotStatsCache && !db.hasPilotStatsCache()) {
                console.log('[Maintenance] Cache empty on startup, initializing...');
                await runDailyMaintenance();
                await refreshPilotStats();
            } else {
                const maxGameDate = db.getMaxGameDate ? db.getMaxGameDate() : null;
                const maxCacheDate = db.getMaxPilotStatsLastUpdated ? db.getMaxPilotStatsLastUpdated() : null;
                if (maxGameDate && (!maxCacheDate || maxGameDate > maxCacheDate)) {
                    console.log(`[Maintenance] Data is newer than cache on startup (${maxGameDate} > ${maxCacheDate}), refreshing stats...`);
                    await refreshPilotStats();
                } else if (!db.hasRatingSnapshots() || !db.hasPilotMonths() || !db.hasRegionMonths()) {
                    // the first start with ratings (S13), career months (S14) or region
                    // months (S15), or a restored backup from before them
                    console.log('[Maintenance] No rating snapshots, career months or region months on startup, refreshing stats...');
                    await refreshPilotStats();
                } else {
                    console.log('[Maintenance] Cache already warm on startup, skipping blocking sync.');
                }
            }
        } catch (e) {
            console.error('[Maintenance] Error checking initial cache:', e);
        }

        // Initialize Fight Nights (generates recaps if empty, checks recent days)
        try {
            await fightNightService.initializeFightNights();
        } catch (err) {
            console.error('[Maintenance] Initial fight night check error:', err);
        }
    }, 10000);

    // 2. Schedule Nightly Maintenance: runs daily at 03:00 AM Central
    const scheduleNextNightly = () => {
        const now = new Date();
        const nextNight = new Date(now);
        nextNight.setHours(3, 0, 0, 0);
        if (nextNight <= now) {
            nextNight.setDate(nextNight.getDate() + 1);
        }
        const msUntilNext = nextNight.getTime() - now.getTime();
        console.log(`[Maintenance] Nightly maintenance scheduled for ${nextNight.toISOString()} (in ${Math.round(msUntilNext / 60000)}m).`);

        setTimeout(async () => {
            // Before the cold move, so the backup holds the files as they were before the night's writes.
            await runNightlyBackup();
            await runDailyMaintenance();
            scheduleNextNightly();
        }, msUntilNext);
    };
    scheduleNextNightly();

    // 3. The Fight Night detector, once each fight-night day has ended: the
    // day rolls over at 06:00 Chicago time (gameParse.js FIGHT_NIGHT_DAY), so
    // the 03:00 job would still be inside the night it should judge.
    // Scheduled by day, so a timer that fires a little early by the wall clock
    // still moves on to the next day.
    const runAt = day => Date.parse(dayStart(day)) + DETECTOR_DELAY_MS;
    const scheduleDetector = day => {
        console.log(`[Maintenance] Fight night detector scheduled for ${new Date(runAt(day)).toISOString()} (in ${Math.round((runAt(day) - Date.now()) / 60000)}m).`);
        setTimeout(async () => {
            await fightNightService.checkAndGenerateRecentFightNight();
            scheduleDetector(shiftDay(day, 1));
        }, Math.max(0, runAt(day) - Date.now()));
    };
    const today = fightNightDay(Date.now());
    scheduleDetector(runAt(today) > Date.now() ? today : shiftDay(today, 1));

    // 4. Schedule Pilot Stats Cache Refresh every 6 hours (21600000 ms)
    setInterval(refreshPilotStats, 21600000);
}

export default {
    runDailyMaintenance,
    refreshPilotStats,
    scheduleMaintenance
};
