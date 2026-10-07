import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import Layout from './components/Layout';
import FightNightTeaser from './components/FightNightTeaser';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useServerBrowser } from './hooks/useServerBrowser';
import { usePathname, goBack } from './hooks/useLocation';
import { parseRoute, urlFor, pageTitle } from './server/lib/siteRoutes.js';
import { OverloadFsProvider } from './context/OverloadFsContext';
import { fetchArchivedGames, fetchGameDetail, getGlobalStats, fetchConfig } from './services/apiService';
import { GameData, AdminSettings } from './types';

// Every view loads on demand, so the first page fetches only its own code.
const GameList = lazy(() => import('./components/GameList'));
const GameDetail = lazy(() => import('./components/GameDetail'));
const LiveGameDetail = lazy(() => import('./components/LiveGameDetail'));
const PilotDetail = lazy(() => import('./components/PilotDetail'));
const PilotsList = lazy(() => import('./components/PilotsList'));
const MapLibrary = lazy(() => import('./components/MapLibrary'));
const OlmodInfo = lazy(() => import('./components/OlmodInfo'));
const AdminPanel = lazy(() => import('./components/AdminPanel'));
const ColdStorage = lazy(() => import('./components/ColdStorage'));
const Resources = lazy(() => import('./components/Resources'));
const AudioTauntMaker = lazy(() => import('./components/AudioTauntMaker'));
const PilotManager = lazy(() => import('./components/PilotManager'));
const FightNightSection = lazy(() => import('./components/FightNightSection'));

const App: React.FC = () => {
  // The URL is the route: links and the back button change it, and the view follows.
  const pathname = usePathname();
  const route = useMemo(() => parseRoute(pathname), [pathname]);
  const currentView = route.view;
  const selectedGameId = currentView === 'game-detail' ? Number(route.param) : null;
  const activeServerIp = currentView === 'live-game-detail' ? String(route.param) : null;
  const selectedPilot = currentView === 'pilot' ? String(route.param) : null;
  const selectedFightNightDate = currentView === 'fight-night' && route.param ? String(route.param) : undefined;

  const { games: activeGames, updatedAt: lastRefreshed, settled: browserSettled } = useServerBrowser();
  const activeServer = activeServerIp ? activeGames?.find(s => s.server?.ip === activeServerIp) : undefined;
  const [archivedGames, setArchivedGames] = useState<GameData[] | null>(null);
  // The last match fetched, with its id: a page shows it only when the id is
  // its own, so match B never shows match A while B loads. data null = failed.
  const [loadedGame, setLoadedGame] = useState<{ id: number; data: GameData | null } | null>(null);
  const [gameRetries, setGameRetries] = useState(0);
  const shownGame = loadedGame && loadedGame.id === selectedGameId ? loadedGame : null;
  const selectedGameData = shownGame?.data ?? null;
  const gameDetailError = shownGame !== null && shownGame.data === null;
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Public Config State
  const [showColdStorage, setShowColdStorage] = useState(false);

  // Admin Settings
  const [adminSettings, setAdminSettings] = useState<AdminSettings>({
    historyDepthPages: 8
  });

  useEffect(() => {
    const savedDepth = localStorage.getItem('admin_history_depth');
    if (savedDepth) {
      setAdminSettings(prev => ({ ...prev, historyDepthPages: parseInt(savedDepth, 10) }));
    }

    // Fetch public config
    fetchConfig().then(config => {
      if (config) {
        setShowColdStorage(config.show_cold_storage);
      }
    });
  }, []);

  const ONE_YEAR_AGO = useMemo(() => new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString(), []);

  const refreshData = async () => {
    setLoading(true);
    try {
      // Always fetch Hot DB data (Last 365 Days); live servers come from useServerBrowser
      const [archive, publicStats] = await Promise.all([
        fetchArchivedGames(1, ''),
        getGlobalStats()
      ]);
      setArchivedGames(archive ? archive.games : null);
      setStats(publicStats);
    } catch (e) {
      console.error("Failed to load data", e);
      setArchivedGames(null);
    }
    setLoading(false);
  };

  // Initial Load & View Change
  useEffect(() => {
    if (currentView === 'dashboard' || currentView === 'history') {
      refreshData();
    }
  }, [currentView]);

  // Load Detail View
  useEffect(() => {
    if (!selectedGameId) return;
    let isCurrent = true;
    fetchGameDetail(selectedGameId)
      .catch(() => null)
      .then(data => {
        if (isCurrent) setLoadedGame({ id: selectedGameId, data: data || null });
      });
    return () => { isCurrent = false; };
  }, [selectedGameId, gameRetries]);

  // A new page starts at the top. Opening or closing a map's popup keeps the list where it was.
  const scrollKey = currentView === 'maps' ? 'maps' : pathname;
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [scrollKey]);

  const titleName = currentView === 'game-detail' ? selectedGameData?.settings?.level
    : currentView === 'live-game-detail' ? activeServer?.server?.name
    : undefined;
  useEffect(() => {
    document.title = pageTitle(route, titleName);
  }, [route, titleName]);

  return (
    <OverloadFsProvider>
      <Layout currentView={currentView} showColdStorage={showColdStorage}>
      {/* a failed chunk load (see index.tsx) lands here instead of blanking the page */}
      <ErrorBoundary>
      <Suspense fallback={
        <div className="flex justify-center py-24">
          <div className="w-12 h-12 border-4 border-[#ff6600] border-t-transparent rounded-full animate-spin"></div>
        </div>
      }>
      {currentView === 'dashboard' && (
        <div className="space-y-8 animate-fade-in">
          <div className="bg-gradient-to-r from-[#1a1a1a] to-black p-8 rounded border border-gray-800 mb-8 flex justify-between items-end">
            <div>
              <h1 className="text-4xl font-bold text-white mb-1 brand-font">
                overloadfight<span className="text-[#ff6600]">.club</span>
              </h1>
              <p className="text-[#ff6600] font-mono text-xs font-semibold uppercase tracking-wider mb-2">
                First rule of Overload Fight Club: tell everyone.
              </p>
              <p className="text-gray-400 max-w-2xl text-xs font-mono">
                Monitoring live server telemetry and historical combat logs (Last 365 Days).
              </p>
            </div>
            <div className="text-xs font-mono text-gray-600 text-right hidden md:block">
              LAST UPDATE: <span className="text-gray-400">{lastRefreshed ? lastRefreshed.toLocaleTimeString() : '...'}</span>
              <br />
              TOTAL GAMES TRACKED (365 Days): <span className="text-gray-400">{stats?.total_games || '...'}</span>
            </div>
          </div>

          {/* Live first: wait for the first poll rather than flash "Connection Failed" */}
          {!browserSettled || (loading && archivedGames === null) ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-[#ff6600] border-t-transparent rounded-full animate-spin mb-4"></div>
              <div className="text-[#ff6600] font-mono animate-pulse text-sm">ESTABLISHING UPLINK...</div>
              <div className="text-gray-600 text-xs mt-2">Synchronizing latest telemetry...</div>
            </div>
          ) : (
            <GameList
              activeGames={activeGames}
              archivedGames={archivedGames}
              globalStats={stats}
              startDate={ONE_YEAR_AGO}
              showColdStorage={showColdStorage}
              afterLive={<FightNightTeaser />}
            />
          )}
        </div>
      )}

      {currentView === 'fight-night' && (
        <div className="space-y-8 animate-fade-in">
          <div className="bg-gradient-to-r from-[#1a1a1a] to-black p-8 rounded border border-gray-800 mb-8">
            <h1 className="text-4xl font-bold text-white mb-1 brand-font">Fight Night Recaps</h1>
            <p className="text-[#ff6600] font-mono text-xs font-semibold uppercase tracking-wider mb-2">
              First rule of Overload Fight Club: tell everyone.
            </p>
            <p className="text-gray-400 max-w-2xl text-xs font-mono">
              Auto-generated post-fight intelligence reports from high-traffic combat evenings.
            </p>
          </div>
          <FightNightSection date={selectedFightNightDate} />
        </div>
      )}

      {currentView === 'history' && (
        <div className="space-y-8 animate-fade-in">
          <div className="bg-gradient-to-r from-[#1a1a1a] to-black p-8 rounded border border-gray-800 mb-8">
            <h1 className="text-4xl font-bold text-white mb-2 brand-font">Historical Archive</h1>
            <p className="text-gray-400 max-w-2xl text-sm font-mono">
              Full access to the complete game history database.
            </p>
          </div>
          <GameList
            activeGames={null}
            archivedGames={null}
            globalStats={stats}
            initialTab="history"
          />
        </div>
      )}

      {currentView === 'cold-storage' && (
        <ColdStorage />
      )}

      {currentView === 'resources' && (
        <Resources />
      )}

      {currentView === 'game-detail' && (
        selectedGameData ? (
          <GameDetail
            game={selectedGameData}
            onBack={() => goBack(urlFor('history'))}
          />
        ) : gameDetailError ? (
          <div className="bg-[#101012] border border-red-900/60 rounded-xl p-8 max-w-xl mx-auto my-16 text-center font-mono shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-red-950/80 border border-red-700/80 text-red-400 flex items-center justify-center mx-auto mb-4 text-2xl shadow">
              ⚠️
            </div>
            <h3 className="text-lg font-bold text-white mb-2 tracking-wide uppercase">COMBAT TELEMETRY UNAVAILABLE</h3>
            <p className="text-sm text-gray-400 mb-6 leading-relaxed">
              Could not retrieve match details for log #{selectedGameId}. The upstream telemetry provider (tracker.otl.gg) may be offline or experiencing connection timeouts.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => goBack(urlFor('history'))}
                className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded font-bold text-xs uppercase tracking-wider transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => {
                  setLoadedGame(null);
                  setGameRetries(n => n + 1);
                }}
                className="px-5 py-2.5 bg-[#ff6600] hover:bg-[#ff8533] text-black font-bold rounded text-xs uppercase tracking-wider transition-colors"
              >
                Retry Telemetry
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-12 h-12 border-4 border-[#ff6600] border-t-transparent rounded-full animate-spin mb-4"></div>
            <div className="text-[#ff6600] font-mono text-sm">RETRIEVING COMBAT LOG #{selectedGameId}...</div>
          </div>
        )
      )}

      {currentView === 'live-game-detail' && (
        <LiveGameDetail
          key={activeServerIp}
          ip={activeServerIp || undefined}
          serverData={activeServer}
          archivedGames={archivedGames}
          onBack={() => goBack(urlFor('dashboard'))}
        />
      )}

      {currentView === 'pilots' && (
        <PilotsList
          activeGames={activeGames}
          archivedGames={archivedGames}
        />
      )}

      {currentView === 'pilot' && selectedPilot && (
        <PilotDetail
          key={selectedPilot}
          pilotName={selectedPilot}
          onBack={() => goBack(urlFor('pilots'))}
        />
      )}

      {currentView === 'maps' && (
        <MapLibrary mapName={route.param ? String(route.param) : undefined} />
      )}

      {currentView === 'olmod' && (
        <OlmodInfo />
      )}

      {currentView === 'admin' && (
        <AdminPanel />
      )}

      {currentView === 'pilot-manager' && (
        <PilotManager />
      )}

      {(currentView === 'tools' || currentView === 'taunts') && (
        <AudioTauntMaker />
      )}
      </Suspense>
      </ErrorBoundary>
    </Layout>
  </OverloadFsProvider>
  );
};

export default App;
