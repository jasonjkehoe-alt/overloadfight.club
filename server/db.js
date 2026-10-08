// The database entry point. Every caller imports this file; the code lives in
// server/db/: connection.js (files, pragmas, SQL functions, the cold attach),
// migrations.js (schema and the game_players backfill), repos/ (reads and writes
// of one table each) and analytics/ (aggregates, pilot numbers, the stats refresh).
// The `db` object below keeps the keys it had when all of that was one file.
import Database from 'better-sqlite3';
import { hotDb, coldDb, dbPath, backupHot, backupCold, mapsDir, mapImagesDir } from './db/connection.js';
import { ensureGamePlayersTable, ensurePilotMonths, ensureRatingSnapshots, ensureRegionMonths, ensureServerTables, migrateGamePlayers } from './db/migrations.js';
import {
  getGames, countGames, getColdGames, countColdGames, countColdGamesInMonth, getGameById,
  getGameGaps, getLatestGameId, insertGame, saveGames, saveColdGamesBatch, updateGameDetails,
  moveGamesToColdStorage, getMaxGameDate, getSummaryGames, getGamesForDate, hotCutoff
} from './db/repos/games.js';
import {
  getBackfillJob, getActiveBackfillJob, createBackfillJob, updateBackfillJob, deleteBackfillJob,
  insertGameMetadata, getGameMetadata
} from './db/repos/jobs.js';
import { getAdminSetting, setAdminSetting } from './db/repos/settings.js';
import {
  seedStockMaps, getMaps, countMaps, getMapIntel, getMapById, getMapByName, upsertMap,
  incrementMapDownloads, updateMapLocalPaths, deleteMap
} from './db/repos/maps.js';
import { getFightNightRecaps, getFightNightRecapByDate, saveFightNightRecap, deleteFightNightRecapsSince } from './db/repos/fightNights.js';
import { saveServerSnapshot, pruneServerSnapshots, getServerListing } from './db/repos/servers.js';
import {
  getDatabaseStats, getColdDatabaseStats, getGlobalMapStats, getGlobalModeStats, getGlobalActivityStats,
  getGameCountsByDate, getMonthlyGameCounts, getTopPlayedMaps, getRecentTopMaps, getMostActiveMaps,
  getDeadliestMaps, getMarathonMaps, getServerActivityStats, getActiveServerIps, getActivePilotCount,
  getAllTimeMapStats, getAllTimeGlobalStats, getAllTimeGlobalKills, countMapStatsCache,
  getTopPlayedMapsFromCache, getDeadliestMapsFromCache, getRecentTopMapsFromCache, getQualifyingFightNightDates,
  getActivityHeatmap
} from './db/analytics/global.js';
import {
  getPilotStats, getAllTimePilotStats, getGamesByPilot, countGamesByPilot, hasPilotStatsCache,
  getMaxPilotStatsLastUpdated, getPilotPPI, updateDeepMetrics, getAllCachedPilotStats,
  isPilotFirstSeenOnDate, getPilotSummary
} from './db/analytics/pilots.js';
import {
  getPilotDetailedStats, getPilotBreakdown, getPilotTelemetry, normalizeWeaponName,
  PRIMARY_WEAPONS, SECONDARY_WEAPONS
} from './db/analytics/pilotTelemetry.js';
import { clearRankings, getPilotRating, getPowerRankings, hasRatingSnapshots } from './db/analytics/ratings.js';
import { getPilotCareer, hasPilotMonths } from './db/analytics/career.js';
import { clearServerSummaries, getServerHistory, getServerSummary, getRegionShare, hasRegionMonths } from './db/analytics/servers.js';
import { refreshPilotStats, stopStatsWorker, getColdStorageStats } from './db/analytics/refresh.js';

export { backupsDir, mapsDir, mapImagesDir } from './db/connection.js';
export { pilotStatements } from './db/analytics/pilots.js';

const healthHot = hotDb.prepare('SELECT 1 FROM games LIMIT 1');
const healthCold = coldDb.prepare('SELECT 1 FROM games LIMIT 1');

const db = {
  // Connection and lifecycle
  backupHot,
  backupCold,
  mapsDir,
  mapImagesDir,
  // Replace tracker.db through SQLite's backup API, then rebuild game_players.
  restoreHot: async source => {
    const uploaded = new Database(source, { readonly: true, fileMustExist: true });
    try {
      await uploaded.backup(dbPath);
    } finally {
      uploaded.close();
    }
    // A backup from before S5 has no game_players; build it for the restored games.
    ensureGamePlayersTable(hotDb);
    migrateGamePlayers();
    // A backup from before S13 has no rating_snapshots, one from before S14 no
    // pilot_months, one from before S15 no region_months; the next refresh
    // fills them. Nor does it have the server tables, which start empty again.
    ensureRatingSnapshots();
    ensurePilotMonths();
    ensureRegionMonths();
    ensureServerTables();
    clearRankings();
    clearServerSummaries();
  },
  migrateGamePlayers,
  // For the healthcheck: throws unless both files answer a query.
  checkHealth: () => {
    healthHot.get();
    healthCold.get();
  },
  // Stop a running stats worker, so no thread keeps the files open, then close both.
  close: async () => {
    await stopStatsWorker();
    try { hotDb.close(); } catch {}
    try { coldDb.close(); } catch {}
  },

  // repos/games.js
  getGames,
  countGames,
  getColdGames,
  countColdGames,
  countColdGamesInMonth,
  getGameById,
  getGameGaps,
  getLatestGameId,
  insertGame,
  saveGames,
  saveColdGamesBatch,
  updateGameDetails,
  moveGamesToColdStorage,
  getMaxGameDate,
  getSummaryGames,
  getGamesForDate,
  hotCutoff,

  // repos/jobs.js
  getBackfillJob,
  getActiveBackfillJob,
  createBackfillJob,
  updateBackfillJob,
  deleteBackfillJob,
  insertGameMetadata,
  getGameMetadata,

  // repos/settings.js
  getAdminSetting,
  setAdminSetting,

  // repos/maps.js
  seedStockMaps,
  getMaps,
  countMaps,
  getMapIntel,
  getMapById,
  getMapByName,
  upsertMap,
  incrementMapDownloads,
  updateMapLocalPaths,
  deleteMap,

  // repos/fightNights.js
  getFightNightRecaps,
  getFightNightRecapByDate,
  saveFightNightRecap,
  deleteFightNightRecapsSince,

  // repos/servers.js
  saveServerSnapshot,
  pruneServerSnapshots,
  getServerListing,

  // analytics/global.js
  getDatabaseStats,
  getColdDatabaseStats,
  getGlobalMapStats,
  getGlobalModeStats,
  getGlobalActivityStats,
  getGameCountsByDate,
  getMonthlyGameCounts,
  getTopPlayedMaps,
  getRecentTopMaps,
  getMostActiveMaps,
  getDeadliestMaps,
  getMarathonMaps,
  getServerActivityStats,
  getActiveServerIps,
  getActivePilotCount,
  getAllTimeMapStats,
  getAllTimeGlobalStats,
  getAllTimeGlobalKills,
  countMapStatsCache,
  getTopPlayedMapsFromCache,
  getDeadliestMapsFromCache,
  getRecentTopMapsFromCache,
  getQualifyingFightNightDates,
  getActivityHeatmap,

  // analytics/pilots.js
  getPilotStats,
  getAllTimePilotStats,
  getGamesByPilot,
  countGamesByPilot,
  hasPilotStatsCache,
  getMaxPilotStatsLastUpdated,
  getPilotPPI,
  updateDeepMetrics,
  getAllCachedPilotStats,
  isPilotFirstSeenOnDate,
  getPilotSummary,

  // analytics/pilotTelemetry.js
  getPilotDetailedStats,
  getPilotBreakdown,
  getPilotTelemetry,
  normalizeWeaponName,
  PRIMARY_WEAPONS,
  SECONDARY_WEAPONS,

  // analytics/ratings.js
  getPilotRating,
  hasRatingSnapshots,
  getPowerRankings,

  // analytics/career.js
  getPilotCareer,
  hasPilotMonths,

  // analytics/servers.js
  getServerHistory,
  getServerSummary,
  getRegionShare,
  hasRegionMonths,

  // analytics/refresh.js
  refreshPilotStats,
  buildColdStorageStatsCache: refreshPilotStats,
  buildMapStatsCache: refreshPilotStats,
  getColdStorageStats
};

export default db;
