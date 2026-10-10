// The database entry point. Every caller imports this file; the code lives in
// server/db/: connection.js (files, pragmas, SQL functions, the cold attach),
// migrations.js (schema and the game_players backfill), repos/ (reads and writes
// of one table each) and analytics/ (aggregates, pilot numbers, the stats refresh).
// The `db` object below keeps the keys it had when all of that was one file.
import Database from 'better-sqlite3';
import { hotDb, coldDb, dbPath, backupHot, backupCold, mapsDir, mapImagesDir } from './db/connection.js';
import { ensureAdminSettings, ensureDerivedTables, ensureDiscordPosts, ensureFightNightEvents, ensureGamePlayersTable, ensureServerTables, migrateGamePlayers } from './db/migrations.js';
import {
  getGames, countGames, getColdGames, countColdGames, countColdGamesInMonth, getGameById,
  getGameGaps, getLatestGameId, insertGame, saveGames, saveColdGamesBatch, updateGameDetails,
  moveGamesToColdStorage, getMaxGameDate, getSummaryGames, getGamesForDate, getDaySpan, hotCutoff
} from './db/repos/games.js';
import {
  getBackfillJob, getActiveBackfillJob, createBackfillJob, updateBackfillJob, deleteBackfillJob,
  insertGameMetadata, getGameMetadata
} from './db/repos/jobs.js';
import { getAdminSetting, setAdminSetting } from './db/repos/settings.js';
import { dropStaleDiscordPosts, getAllDiscordPosts, getDiscordPost, getRecentDiscordPosts, putDiscordPost, restoreDiscordPosts } from './db/repos/discordPosts.js';
import {
  seedStockMaps, getMaps, countMaps, getMapIntel, getMapById, getMapByName, mapImagePath, upsertMap,
  incrementMapDownloads, updateMapLocalPaths, deleteMap
} from './db/repos/maps.js';
import { getAllFightNightRecaps, getFightNightRecaps, getFightNightRecapByDate, saveFightNightRecap, deleteFightNightRecapsSince, fightNightRecapsVersion } from './db/repos/fightNights.js';
import { deleteFightNightEvent, fightNightEventsVersion, getFightNightEvent, listFightNightEvents, saveFightNightEvent } from './db/repos/fightNightEvents.js';
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
import { getPilotRating, getPowerRankings, hasRatingSnapshots } from './db/analytics/ratings.js';
import { getPilotCareer, hasPilotMonths } from './db/analytics/career.js';
import { clearServerSummaries, getServerHistory, getServerSummary, getRegionShare, hasRegionMonths } from './db/analytics/servers.js';
import { clearDerivedCaches, clearDerivedTablesBuilt, derivedTablesBuilt, getDuelLadder, getObjectiveBoards, getPilotWeaponMix, getSpecialists, getWeaponMeta } from './db/analytics/meta.js';
import { getPilotRivalry, getRivalNetwork } from './db/analytics/rivals.js';
import { getPilotOpponents, getTape } from './db/analytics/tape.js';
import { getBeltChanges, getBelts, getPilotAchievements } from './db/analytics/belts.js';
import { refreshPilotStats, refreshInProgress, stopStatsWorker, getColdStorageStats } from './db/analytics/refresh.js';

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
    // a refresh under way would write its diffs of the old tables into the
    // restored ones and set the built marker back: stop it and wait it out
    await stopStatsWorker();
    await refreshInProgress();
    // the posts already made outlive the restore, so none goes out twice (S18)
    const posts = getAllDiscordPosts();
    const uploaded = new Database(source, { readonly: true, fileMustExist: true });
    try {
      await uploaded.backup(dbPath);
    } finally {
      uploaded.close();
    }
    // A backup from before S5 has no game_players; build it for the restored games.
    ensureGamePlayersTable(hotDb);
    migrateGamePlayers();
    // A backup from before S13 to S17 lacks some of the derived tables; the
    // next refresh fills them. The built marker is cleared whatever the
    // backup carried, so a restore always gets one refresh at the next start.
    // Nor does it have the server tables, which start empty again.
    ensureDerivedTables();
    ensureServerTables();
    ensureAdminSettings();
    ensureDiscordPosts();
    // a backup from before S22 has no schedule; the admin enters it again
    ensureFightNightEvents();
    restoreDiscordPosts(posts);
    clearDerivedTablesBuilt();
    clearDerivedCaches();
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
  getDaySpan,
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

  // repos/discordPosts.js
  getDiscordPost,
  putDiscordPost,
  getRecentDiscordPosts,
  dropStaleDiscordPosts,

  // repos/maps.js
  seedStockMaps,
  getMaps,
  countMaps,
  getMapIntel,
  getMapById,
  getMapByName,
  mapImagePath,
  upsertMap,
  incrementMapDownloads,
  updateMapLocalPaths,
  deleteMap,

  // repos/fightNights.js
  getAllFightNightRecaps,
  getFightNightRecaps,
  getFightNightRecapByDate,
  saveFightNightRecap,
  deleteFightNightRecapsSince,
  fightNightRecapsVersion,

  // repos/fightNightEvents.js
  listFightNightEvents,
  getFightNightEvent,
  saveFightNightEvent,
  deleteFightNightEvent,
  fightNightEventsVersion,

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

  // analytics/meta.js
  derivedTablesBuilt,
  getWeaponMeta,
  getPilotWeaponMix,
  getSpecialists,
  getDuelLadder,
  getObjectiveBoards,

  // analytics/rivals.js
  getRivalNetwork,
  getPilotRivalry,

  // analytics/tape.js
  getTape,
  getPilotOpponents,

  // analytics/belts.js
  getBelts,
  getPilotAchievements,
  getBeltChanges,

  // analytics/refresh.js
  refreshPilotStats,
  refreshInProgress,
  buildColdStorageStatsCache: refreshPilotStats,
  buildMapStatsCache: refreshPilotStats,
  getColdStorageStats
};

export default db;
