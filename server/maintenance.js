import db from './db.js';
import fightNightService from './services/fightNightService.js';

function runDailyMaintenance() {
    console.log('[Maintenance] Starting daily maintenance...');
    try {
        const movedCount = db.moveGamesToColdStorage();
        if (movedCount > 0) {
            console.log(`[Maintenance] Moved ${movedCount} old games to Cold Storage.`);
        } else {
            console.log('[Maintenance] No games needed moving to Cold Storage.');
        }

        // Run Fight Night Recap Big Night Detector
        fightNightService.checkAndGenerateRecentFightNight().catch(err => {
            console.error('[Maintenance] Fight night check error:', err);
        });
    } catch (error) {
        console.error('[Maintenance] Error running maintenance:', error);
    }
}

function refreshPilotStats() {
    console.log('[Maintenance] Refreshing pilot stats cache...');
    try {
        db.refreshPilotStats();
        console.log('[Maintenance] Pilot stats cache refreshed successfully.');
    } catch (error) {
        console.error('[Maintenance] Error refreshing pilot stats cache:', error);
    }
}

function scheduleMaintenance() {
    // Only run on startup if cache is missing/empty, preventing 5-minute event loop lock on boot
    setTimeout(() => {
        try {
            if (db.hasPilotStatsCache && !db.hasPilotStatsCache()) {
                console.log('[Maintenance] Cache empty on startup, initializing...');
                runDailyMaintenance();
                refreshPilotStats();
            } else {
                console.log('[Maintenance] Cache already warm on startup, skipping blocking sync.');
            }
        } catch (e) {
            console.error('[Maintenance] Error checking initial cache:', e);
        }

        // Initialize Fight Nights (generates recaps if empty, checks recent days)
        fightNightService.initializeFightNights().catch(err => {
            console.error('[Maintenance] Initial fight night check error:', err);
        });
    }, 10000);

    // Schedule Cold Storage and Fight Night checks every 24 hours (86400000 ms)
    setInterval(runDailyMaintenance, 86400000);

    // Schedule Pilot Stats Cache Refresh every 6 hours (21600000 ms)
    setInterval(refreshPilotStats, 21600000);
}

export default {
    runDailyMaintenance,
    refreshPilotStats,
    scheduleMaintenance
};
