import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Layout from './components/Layout';
import GameList from './components/GameList';
import GameDetail from './components/GameDetail';
import LiveGameDetail from './components/LiveGameDetail';
import PilotDetail from './components/PilotDetail';
import PilotsList from './components/PilotsList';
import MapLibrary from './components/MapLibrary';
import OlmodInfo from './components/OlmodInfo';
import AdminPanel from './components/AdminPanel';
import ColdStorage from './components/ColdStorage';
import Resources from './components/Resources';
import AudioTauntMaker from './components/AudioTauntMaker';
import { fetchActiveGames, fetchArchivedGames, fetchGameDetail, getGlobalStats, fetchConfig } from './services/apiService';
import { BrowserApiResponse, GameData, AdminSettings } from './types';

interface RouteState {
  view: string;
  param?: string | number;
}

const getUrlForView = (view: string, param?: string | number): string => {
  switch (view) {
    case 'dashboard': return '/';
    case 'history': return '/history';
    case 'maps': return param ? `/maps/${encodeURIComponent(String(param))}` : '/maps';
    case 'olmod': return '/olmod';
    case 'tools': return '/taunts';
    case 'resources': return '/resources';
    case 'cold-storage': return '/cold-storage';
    case 'admin': return '/admin';
    case 'pilots': return '/pilots';
    case 'pilot': return param ? `/pilot/${encodeURIComponent(String(param))}` : '/pilots';
    case 'game-detail': return param ? `/game/${param}` : '/history';
    case 'live-game-detail': return param ? `/live/${param}` : '/dashboard';
    default: return '/';
  }
};

const parseUrlPath = (): RouteState => {
  const pathname = window.location.pathname;
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length === 0 || parts[0] === 'dashboard') {
    return { view: 'dashboard' };
  }
  const [first, second] = parts;
  if (first === 'history') return { view: 'history' };
  if (first === 'maps') return { view: 'maps', param: second ? decodeURIComponent(second) : '' };
  if (first === 'olmod') return { view: 'olmod' };
  if (first === 'tools' || first === 'taunts') return { view: 'tools' };
  if (first === 'resources') return { view: 'resources' };
  if (first === 'cold-storage') return { view: 'cold-storage' };
  if (first === 'admin') return { view: 'admin' };
  if (first === 'pilots') return { view: 'pilots' };
  if (first === 'pilot' && second) return { view: 'pilot', param: decodeURIComponent(second) };
  if (first === 'game' && second) {
    const gameId = parseInt(second, 10);
    return isNaN(gameId) ? { view: 'history' } : { view: 'game-detail', param: gameId };
  }
  if (first === 'live' && second) return { view: 'live-game-detail', param: second };
  return { view: 'dashboard' };
};

const App: React.FC = () => {
  const initialRoute = useMemo(() => parseUrlPath(), []);

  const [currentView, setCurrentView] = useState<string>(initialRoute.view);
  const [selectedGameId, setSelectedGameId] = useState<number | null>(
    initialRoute.view === 'game-detail' && typeof initialRoute.param === 'number' ? initialRoute.param : null
  );
  const [activeServer, setActiveServer] = useState<BrowserApiResponse | null>(null);
  const [activeServerIp, setActiveServerIp] = useState<string | null>(
    initialRoute.view === 'live-game-detail' && typeof initialRoute.param === 'string' ? initialRoute.param : null
  );
  const [selectedPilot, setSelectedPilot] = useState<string | null>(
    initialRoute.view === 'pilot' && typeof initialRoute.param === 'string' ? initialRoute.param : null
  );

  // Shared State Params
  const [mapSearchTerm, setMapSearchTerm] = useState<string>(
    initialRoute.view === 'maps' && typeof initialRoute.param === 'string' ? initialRoute.param : ''
  );

  // Change types to allow null (error state)
  const [activeGames, setActiveGames] = useState<BrowserApiResponse[] | null>(null);
  const [archivedGames, setArchivedGames] = useState<GameData[] | null>(null);
  const [selectedGameData, setSelectedGameData] = useState<GameData | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

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
      // Always fetch Hot DB data (Last 365 Days)
      const [active, archive, publicStats] = await Promise.all([
        fetchActiveGames(),
        fetchArchivedGames(1, ''),
        getGlobalStats()
      ]);
      setActiveGames(active);
      setArchivedGames(archive ? archive.games : null);
      setStats(publicStats);
      setLastRefreshed(new Date());
    } catch (e) {
      console.error("Failed to load data", e);
      setActiveGames(null);
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

  // Poll for active games
  useEffect(() => {
    const intervalId = setInterval(async () => {
      const active = await fetchActiveGames();
      if (active !== null) {
        setActiveGames(active);
        setLastRefreshed(new Date());
      }
    }, 10000);
    return () => clearInterval(intervalId);
  }, []);

  // Load Detail View
  useEffect(() => {
    if (selectedGameId) {
      const loadGame = async () => {
        setLoading(true);
        const data = await fetchGameDetail(selectedGameId);
        setSelectedGameData(data);
        setLoading(false);
      };
      loadGame();
    }
  }, [selectedGameId]);

  const applyView = useCallback((view: string, param?: string | number) => {
    if (view === 'game-detail' && param) {
      const id = typeof param === 'number' ? param : parseInt(String(param), 10);
      setSelectedGameId(id);
      setCurrentView('game-detail');
      window.scrollTo(0, 0);
      return;
    }
    if (view === 'live-game-detail' && param) {
      setActiveServerIp(String(param));
      setCurrentView('live-game-detail');
      window.scrollTo(0, 0);
      return;
    }
    if (view === 'pilot' && param) {
      setSelectedPilot(String(param));
      setCurrentView('pilot');
      window.scrollTo(0, 0);
      return;
    }
    setCurrentView(view);
    if (view === 'maps' && param) {
      setMapSearchTerm(String(param));
    } else if (view !== 'maps') {
      setMapSearchTerm('');
    }

    if (view === 'dashboard' || view === 'history' || view === 'pilots' || view === 'maps' || view === 'weapons' || view === 'olmod' || view === 'admin' || view === 'tools' || view === 'resources' || view === 'cold-storage') {
      setSelectedGameId(null);
      setSelectedGameData(null);
      setActiveServer(null);
      setActiveServerIp(null);
      setSelectedPilot(null);
    }
    window.scrollTo(0, 0);
  }, []);

  const handleNavigate = (view: string, param?: string) => {
    applyView(view, param);
    const targetUrl = getUrlForView(view, param);
    if (window.location.pathname !== targetUrl) {
      window.history.pushState({ view, param }, '', targetUrl);
    }
  };

  const handleSelectGame = (id: number) => {
    setSelectedGameId(id);
    setCurrentView('game-detail');
    const targetUrl = getUrlForView('game-detail', id);
    if (window.location.pathname !== targetUrl) {
      window.history.pushState({ view: 'game-detail', param: id }, '', targetUrl);
    }
    window.scrollTo(0, 0);
  };

  const handleSelectLiveGame = (server: BrowserApiResponse) => {
    setActiveServer(server);
    const ip = server.server?.ip || '';
    setActiveServerIp(ip);
    setCurrentView('live-game-detail');
    const targetUrl = getUrlForView('live-game-detail', ip);
    if (window.location.pathname !== targetUrl) {
      window.history.pushState({ view: 'live-game-detail', param: ip }, '', targetUrl);
    }
    window.scrollTo(0, 0);
  };

  // Listen to browser Back and Forward navigation
  useEffect(() => {
    const onPopState = () => {
      const route = parseUrlPath();
      applyView(route.view, route.param);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [applyView]);

  return (
    <Layout currentView={currentView} onNavigate={handleNavigate} showColdStorage={showColdStorage}>
      {currentView === 'dashboard' && (
        <div className="space-y-8 animate-fade-in">
          <div className="bg-gradient-to-r from-[#1a1a1a] to-black p-8 rounded border border-gray-800 mb-8 flex justify-between items-end">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 brand-font">
                overloadfight<span className="text-[#ff6600]">.club</span>
              </h1>
              <p className="text-gray-400 max-w-2xl text-sm font-mono">
                Monitoring live server telemetry and historical combat logs (Last 365 Days).
              </p>
            </div>
            <div className="text-xs font-mono text-gray-600 text-right hidden md:block">
              LAST UPDATE: <span className="text-gray-400">{lastRefreshed.toLocaleTimeString()}</span>
              <br />
              TOTAL GAMES TRACKED (365 Days): <span className="text-gray-400">{stats?.total_games || '...'}</span>
            </div>
          </div>

          {loading && activeGames === null && archivedGames === null ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-[#ff6600] border-t-transparent rounded-full animate-spin mb-4"></div>
              <div className="text-[#ff6600] font-mono animate-pulse text-sm">ESTABLISHING UPLINK...</div>
              <div className="text-gray-600 text-xs mt-2">Synchronizing latest telemetry...</div>
            </div>
          ) : (
            <GameList
              activeGames={activeGames}
              onSelectGame={handleSelectGame}
              onSelectLiveGame={handleSelectLiveGame}
              archivedGames={archivedGames}
              onNavigate={handleNavigate}
              globalStats={stats}
              startDate={ONE_YEAR_AGO}
              showColdStorage={showColdStorage}
            />
          )}
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
            onSelectGame={handleSelectGame}
            onSelectLiveGame={handleSelectLiveGame}
            archivedGames={null}
            onNavigate={handleNavigate}
            globalStats={stats}
          />
        </div>
      )}

      {currentView === 'cold-storage' && (
        <ColdStorage onNavigate={handleNavigate} />
      )}

      {currentView === 'resources' && (
        <Resources />
      )}

      {currentView === 'game-detail' && (
        selectedGameData ? (
          <GameDetail
            game={selectedGameData}
            onBack={() => handleNavigate('dashboard')}
            onNavigate={handleNavigate}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-12 h-12 border-4 border-[#ff6600] border-t-transparent rounded-full animate-spin mb-4"></div>
            <div className="text-[#ff6600] font-mono text-sm">RETRIEVING COMBAT LOG #{selectedGameId}...</div>
          </div>
        )
      )}

      {currentView === 'live-game-detail' && (
        <LiveGameDetail
          ip={activeServerIp || activeServer?.server?.ip}
          serverData={activeServer || (activeServerIp ? { server: { ip: activeServerIp } } : undefined)}
          archivedGames={archivedGames}
          onBack={() => handleNavigate('dashboard')}
          onNavigate={handleNavigate}
        />
      )}

      {currentView === 'pilots' && (
        <PilotsList
          activeGames={activeGames}
          archivedGames={archivedGames}
          onSelectServer={handleSelectLiveGame}
          onSelectGame={handleSelectGame}
          onNavigate={handleNavigate}
        />
      )}

      {currentView === 'pilot' && selectedPilot && (
        <PilotDetail
          pilotName={selectedPilot}
          onBack={() => handleNavigate('pilots')}
          onSelectGame={handleSelectGame}
          onSelectPilot={(pilot) => handleNavigate('pilot', pilot)}
        />
      )}

      {currentView === 'maps' && (
        <MapLibrary initialSearch={mapSearchTerm} onNavigate={handleNavigate} />
      )}

      {currentView === 'olmod' && (
        <OlmodInfo />
      )}

      {currentView === 'admin' && (
        <AdminPanel />
      )}

      {currentView === 'tools' && (
        <AudioTauntMaker />
      )}
    </Layout>
  );
};

export default App;
