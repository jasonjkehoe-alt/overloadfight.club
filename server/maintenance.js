import db from './db.js';

function runDailyMaintenance() {
    console.log('[Maintenance] Starting daily maintenance...');
    try {
        const movedCount = db.moveGamesToColdStorage();
        if (movedCount > 0) {
            console.log(`[Maintenance] Moved ${movedCount} old games to Cold Storage.`);
        } else {
            console.log('[Maintenance] No games needed moving to Cold Storage.');
        }
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
    // Run immediately on startup
    runDailyMaintenance();
    refreshPilotStats();

    // Schedule Cold Storage every 24 hours (86400000 ms)
    setInterval(runDailyMaintenance, 86400000);

    // Schedule Pilot Stats Cache Refresh every 6 hours (21600000 ms)
    setInterval(refreshPilotStats, 21600000);
}

export default {
    runDailyMaintenance,
    refreshPilotStats,
    scheduleMaintenance
};
