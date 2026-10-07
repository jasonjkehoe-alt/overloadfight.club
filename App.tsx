import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import Layout from './components/Layout';
import FightNightTeaser from './components/FightNightTeaser';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Loading, ErrorState, secondaryButtonClass } from './components/States';
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
    // back to the match just shown: it is already loaded
    if (!selectedGameId || (loadedGame?.id === selectedGameId && loadedGame.data)) return;
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
      {/* a view that throws, or a failed chunk load (see index.tsx), lands here and keeps
          the nav; the next page clears it */}
      <ErrorBoundary resetKey={pathname}>
      <Suspense fallback={<Loading />}>
      {currentView === 'dashboard' && (
        <div className="space-y-8">
          <div className="bg-gradient-to-r from-surface-raised to-black p-5 sm:p-8 rounded-card border border-line mb-8 flex justify-between items-end">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-1 brand-font">
                overloadfight<span className="text-brand">.club</span>
              </h1>
              <p className="text-brand font-mono text-xs font-semibold uppercase tracking-wider mb-2">
                First rule of Overload Fight Club: tell everyone.
              </p>
              <p className="text-gray-400 max-w-2xl text-xs font-mono">
                Monitoring live server telemetry and match logs (Last 365 Days).
              </p>
            </div>
            <div className="text-xs font-mono text-gray-600 text-right hidden md:block">
              LAST UPDATE: <span className="text-gray-400">{lastRefreshed ? lastRefreshed.toLocaleTimeString() : '...'}</span>
              <br />
              TOTAL MATCHES TRACKED (365 Days): <span className="text-gray-400">{stats?.total_games || '...'}</span>
            </div>
          </div>

          {/* Live first: wait for the first poll rather than flash "Connection Failed" */}
          {!browserSettled || (loading && archivedGames === null) ? (
            <Loading label="Connecting to servers..." />
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
        <div className="space-y-8">
          <div className="bg-gradient-to-r from-surface-raised to-black p-5 sm:p-8 rounded-card border border-line mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-1 brand-font">Fight Night Recaps</h1>
            <p className="text-brand font-mono text-xs font-semibold uppercase tracking-wider mb-2">
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
        <div className="space-y-8">
          <div className="bg-gradient-to-r from-surface-raised to-black p-5 sm:p-8 rounded-card border border-line mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 brand-font">Match History</h1>
            <p className="text-gray-400 max-w-2xl text-sm font-mono">
              Every match from the last 365 days.
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
          <ErrorState
            title="Combat telemetry unavailable"
            message={`Could not retrieve match details for match #${selectedGameId}. The upstream telemetry provider (tracker.otl.gg) may be offline or experiencing connection timeouts.`}
            action={
              <button onClick={() => goBack(urlFor('history'))} className={secondaryButtonClass}>
                Back
              </button>
            }
            onRetry={() => {
              setLoadedGame(null);
              setGameRetries(n => n + 1);
            }}
            retryLabel="Retry Telemetry"
          />
        ) : (
          <Loading label={`Loading match #${selectedGameId}...`} />
        )
      )}

      {currentView === 'live-game-detail' && (
        <LiveGameDetail
          key={activeServerIp}
          ip={activeServerIp}
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

      {currentView === 'taunts' && (
        <AudioTauntMaker />
      )}
      </Suspense>
      </ErrorBoundary>
    </Layout>
  </OverloadFsProvider>
  );
};

export default App;
