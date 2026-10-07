import db from './db.js';
import { backupDatabases } from './backup.js';
import fightNightService from './services/fightNightService.js';

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

        // Run Fight Night Recap Big Night Detector
        await fightNightService.checkAndGenerateRecentFightNight();
    } catch (error) {
        console.error('[Maintenance] Error running maintenance:', error);
    }
}

async function refreshPilotStats() {
    console.log('[Maintenance] Refreshing pilot stats cache...');
    await db.refreshPilotStats();
    console.log('[Maintenance] Pilot stats cache refresh finished.');
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
                console.log('[Maintenance] Cache already warm on startup, skipping blocking sync.');
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

    // 3. Schedule Pilot Stats Cache Refresh every 6 hours (21600000 ms)
    setInterval(refreshPilotStats, 21600000);
}

export default {
    runDailyMaintenance,
    refreshPilotStats,
    scheduleMaintenance
};
