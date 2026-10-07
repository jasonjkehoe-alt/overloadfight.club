import React, { useEffect, useState, useMemo } from 'react';
import { BrowserApiResponse, GameData } from '../types';
import ActivityGraph from './ActivityGraph';
import GlobalActivityChart from './GlobalActivityChart';
import ServerActivitySparkline from './ServerActivitySparkline';
import ServerStats from './ServerStats';
import { fetchArchivedGames, getGlobalStats } from '../services/apiService';
import { getMapImage } from '../services/mapService';
import MatchTimer from './MatchTimer';
import LiveMatchCard from './LiveMatchCard';
import CalendarWidget from './CalendarWidget';
import { Database, Copy, Check, Server, Search } from 'lucide-react';
import { Loading, EmptyState, ErrorState } from './States';
import Link from './Link';
import { useQueryParam, rowLink } from '../hooks/useLocation';
import { urlFor } from '../server/lib/siteRoutes.js';

interface GameListProps {
    activeGames?: BrowserApiResponse[] | null;
    archivedGames?: GameData[] | null;
    globalStats?: any;
    startDate?: string;
    showColdStorage?: boolean;
    initialTab?: 'servers' | 'history';
    // Rendered on the servers tab between the server browser and the recent matches.
    afterLive?: React.ReactNode;
}

// Favorite servers survive a reload: a JSON array of server IPs.
const FAVORITES_KEY = 'favorite_servers';

const loadFavorites = (): string[] => {
    try {
        const saved = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
        return Array.isArray(saved) ? saved.filter((ip): ip is string => typeof ip === 'string') : [];
    } catch {
        return [];
    }
};

const GameList: React.FC<GameListProps> = ({ activeGames, archivedGames: initialArchivedGames, globalStats, startDate, showColdStorage, initialTab = 'servers', afterLive }) => {
    // ?tab=, ?idle=1 and ?q= (the submitted history search) keep the list's state in the URL
    const [activeTab, setActiveTab] = useQueryParam('tab', initialTab, ['servers', 'history'] as const);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'activity', direction: 'desc' });
    const [favorites, setFavorites] = useState<string[]>(loadFavorites);
    const [idleParam, setIdleParam] = useQueryParam('idle');
    const showIdleServers = idleParam === '1';
    const setShowIdleServers = (show: boolean) => setIdleParam(show ? '1' : '');
    const [copiedIp, setCopiedIp] = useState<string | null>(null);

    const handleCopyIp = (ip: string, e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(ip);
        setCopiedIp(ip);
        setTimeout(() => setCopiedIp(null), 2000);
    };

    // ... (rest of state items are unchanged)

    // Local state for archived games to allow "Load More" functionality
    const [historyGames, setHistoryGames] = useState<GameData[] | null>(initialArchivedGames || null);
    const [historyPage, setHistoryPage] = useState(1);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [historyError, setHistoryError] = useState(false);

    // Archive Search State: the box's text, and the search last run (in the URL)
    const [query, setQuery] = useQueryParam('q');
    const [searchId, setSearchId] = useState(query);
    const [isSearching, setIsSearching] = useState(false);

    // Global Stats State
    const [totalGamesTracked, setTotalGamesTracked] = useState<number>(0);

    // ... (useEffect hooks unchanged)

    const loadFirstPage = () => {
        setIsLoadingHistory(true);
        setHistoryError(false);
        fetchArchivedGames(1, '', startDate).then(response => {
            if (response && response.games) {
                setHistoryGames(response.games);
                if (response.count) setTotalGamesTracked(response.count);
            } else {
                setHistoryError(true);
            }
            setIsLoadingHistory(false);
        });
    };

    useEffect(() => {
        // a search in the URL fills the list itself (below)
        if (query) return;
        if (initialArchivedGames) {
            setHistoryGames(initialArchivedGames);
        } else if (!historyGames) {
            // No games handed in (the History view, or the dashboard's fetch failed): fetch page 1
            loadFirstPage();
        }
    }, [initialArchivedGames, startDate]);

    // ... (other handlers unchanged)

    const runSearch = async (term: string) => {
        setIsSearching(true);
        setHistoryError(false);

        // Reset to page 1 for new search
        setHistoryPage(1);

        try {
            // Fix: Include startDate
            const response = await fetchArchivedGames(1, term, startDate);
            if (response && response.games) {
                setHistoryGames(response.games);
                if (response.count !== undefined) {
                    setTotalGamesTracked(response.count);
                }
            } else {
                setHistoryGames(null);
                setHistoryError(true);
            }
        } catch (err) {
            console.error("Error searching games", err);
        }
        setIsSearching(false);
    };

    // Run the search in the URL when the page opens with one, and whenever it changes.
    useEffect(() => {
        if (query) runSearch(query);
    }, [query]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const term = searchId.trim();
        // the effect runs a new search; an empty or repeated one runs here
        if (!term || term === query) runSearch(term);
        setQuery(term);
    };

    const toggleFavorite = (ip: string, e: React.MouseEvent) => {
        e.stopPropagation();
        let newFavs = [];
        if (favorites.includes(ip)) {
            newFavs = favorites.filter(f => f !== ip);
        } else {
            newFavs = [...favorites, ip];
        }
        setFavorites(newFavs);
        try {
            localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavs));
        } catch {
            // storage blocked (private mode): the star still works until the next reload
        }
    };

    const handleLoadMoreHistory = async () => {
        setIsLoadingHistory(true);
        const nextPage = historyPage + 1;
        // Fix: Include startDate
        const response = await fetchArchivedGames(nextPage, query, startDate);
        if (response && response.games) {
            setHistoryGames(prev => {
                // Filter out duplicates just in case
                const existingIds = new Set(prev?.map(g => g.id));
                const newGames = response.games.filter(g => !existingIds.has(g.id));
                return [...(prev || []), ...newGames];
            });
            setHistoryPage(nextPage);

            // Update total count if provided
            if (response.count) {
                setTotalGamesTracked(response.count);
            }
        }
        setIsLoadingHistory(false);
    };

    const sortedActiveGames = useMemo(() => {
        if (!activeGames) return null;
        const sorted = [...activeGames];

        sorted.sort((a, b) => {
            // Favorite check first
            const aFav = favorites.includes(a.server.ip) ? 1 : 0;
            const bFav = favorites.includes(b.server.ip) ? 1 : 0;
            if (aFav !== bFav) return bFav - aFav; // Favs on top

            const getSortValue = (item: BrowserApiResponse, key: string) => {
                switch (key) {
                    case 'name': return item.server.name.toLowerCase();
                    case 'players': return item.game?.currentPlayers || 0;
                    case 'map': return item.game?.mapName.toLowerCase() || '';
                    case 'ip': return item.server.ip;
                    case 'activity':
                        if (item.game && !item.game.inLobby) return 3;
                        if (item.game && item.game.inLobby) return 2;
                        return 1;
                    case 'activity_24h':
                        if (!globalStats?.serverActivity) return 0;
                        return globalStats.serverActivity
                            .filter((s: any) => s.server_ip === item.server.ip)
                            .reduce((acc: number, curr: any) => acc + curr.count, 0);
                    default: return 0;
                }
            };

            const valA = getSortValue(a, sortConfig.key);
            const valB = getSortValue(b, sortConfig.key);

            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;

            if (sortConfig.key === 'activity' || sortConfig.key === 'activity_24h') {
                const pA = a.game?.currentPlayers || 0;
                const pB = b.game?.currentPlayers || 0;
                return sortConfig.direction === 'asc' ? pA - pB : pB - pA;
            }
            return 0;
        });

        return sorted;
    }, [activeGames, sortConfig, favorites, globalStats]);

    const requestSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key) {
            direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
        } else {
            if (['players', 'activity', 'activity_24h'].includes(key)) direction = 'desc';
            else direction = 'asc';
        }
        setSortConfig({ key, direction });
    };

    const SortIndicator = ({ column }: { column: string }) => {
        if (sortConfig.key !== column) return <span className="ml-1 text-gray-700 opacity-0 group-hover:opacity-50">↕</span>;
        return <span className="ml-1 text-brand">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
    };

    const activeCount = activeGames ? activeGames.filter(g => g.game && !g.game.inLobby).length : 0;
    const lobbyCount = activeGames ? activeGames.filter(g => g.game && g.game.inLobby).length : 0;
    const idleCount = activeGames ? activeGames.filter(g => !g.game || (!g.game.inLobby && (g.game.currentPlayers || 0) === 0)).length : 0;
    const liveMatches = useMemo(() => {
        return activeGames ? activeGames.filter(g => g.game && !g.game.inLobby) : [];
    }, [activeGames]);
    const liveServerIps = useMemo(() => {
        return new Set(liveMatches.map(m => m.server.ip));
    }, [liveMatches]);

    const displayServers = useMemo(() => {
        if (!sortedActiveGames) return null;
        return sortedActiveGames.filter(item => {
            // Exclude servers featured in the live match cards above to prevent duplicate rows
            if (liveMatches.length > 0 && liveServerIps.has(item.server.ip)) {
                return false;
            }
            // If not showing idle servers, only show servers with a game (lobby or active)
            if (!showIdleServers) {
                const hasActivity = item.game && (item.game.inLobby || (item.game.currentPlayers || 0) > 0);
                return hasActivity;
            }
            return true;
        });
    }, [sortedActiveGames, liveMatches, liveServerIps, showIdleServers]);

    const getHealthBadge = (lastSeen: string) => {
        const diff = new Date().getTime() - new Date(lastSeen).getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 5) return <span className="w-2 h-2 bg-green-500 rounded-full" title="Healthy"></span>;
        if (minutes < 60) return <span className="w-2 h-2 bg-yellow-500 rounded-full" title="Stale"></span>;
        return <span className="w-2 h-2 bg-red-500 rounded-full" title="Offline"></span>;
    };

    return (
        <div className="space-y-6">
            <ServerStats
                activeGames={activeGames}
                archivedGames={historyGames}
                globalStats={globalStats}
            />

            <div className="flex border-b border-line justify-between items-end">
                <div className="flex">
                    <button
                        onClick={() => setActiveTab('servers')}
                        className={`px-6 py-3 font-mono text-sm font-bold transition-colors border-b-2 ${activeTab === 'servers'
                            ? 'border-brand text-brand bg-brand/5'
                            : 'border-transparent text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        SERVER BROWSER {activeGames && <span className="ml-2 px-1.5 py-0.5 bg-surface-raised text-gray-300 rounded-control text-xs">{activeGames.length}</span>}
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-6 py-3 font-mono text-sm font-bold transition-colors border-b-2 ${activeTab === 'history'
                            ? 'border-brand text-brand bg-brand/5'
                            : 'border-transparent text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        HISTORY (365 DAYS) {totalGamesTracked > 0 && <span className="ml-2 px-1.5 py-0.5 bg-surface-raised text-gray-300 rounded-control text-xs">{totalGamesTracked.toLocaleString()}</span>}
                    </button>
                </div>
                {showColdStorage && (
                    <Link
                        to={urlFor('cold-storage')}
                        className="mb-3 mr-4 text-xs font-mono text-blue-500 hover:text-blue-400 uppercase font-bold flex items-center gap-2 transition-colors"
                    >
                        <span className="flex items-center gap-1"><Database size={12} /> Historical Archive</span>
                        <span>→</span>
                    </Link>
                )}
            </div>

            {activeTab === 'servers' && (
                <section className="space-y-8">
                    {/* Live Match Cards Section (Games In Progress) - Spotlighted at the top */}
                    {liveMatches.length > 0 && (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-brand font-bold text-lg uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                                    Games In Progress
                                </h3>
                                <span className="text-xs text-gray-600 font-mono animate-pulse">LIVE FEED ACTIVE</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {liveMatches.map(match => (
                                    <LiveMatchCard
                                        key={match.server.ip}
                                        server={match}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Server Browser Section */}
                    <div>
                        <div className="flex flex-wrap items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <h3 className="text-brand font-bold text-lg uppercase tracking-widest">Server Browser</h3>
                                <div className="text-xs text-gray-500 font-mono hidden sm:inline-block">
                                    <span className="text-green-500 font-bold">{activeCount}</span> ACTIVE &bull; <span className="text-yellow-500 font-bold">{lobbyCount}</span> LOBBY &bull; <span className="text-gray-500 font-bold">{idleCount}</span> IDLE
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowIdleServers(!showIdleServers)}
                                    className={`px-3 py-1.5 text-xs font-mono rounded-control border transition-colors flex items-center gap-1.5 ${
                                        showIdleServers
                                            ? 'bg-brand/10 border-brand/50 text-brand'
                                            : 'bg-surface-raised border-gray-700 text-gray-400 hover:text-white hover:border-gray-500'
                                    }`}
                                >
                                    <span>{showIdleServers ? 'Hide Idle Servers' : `Show Idle Servers (${idleCount})`}</span>
                                </button>
                            </div>
                        </div>

                        {sortedActiveGames === null ? (
                            <ErrorState compact title="Connection failed" message="Could not retrieve live data." />
                        ) : displayServers && displayServers.length === 0 ? (
                            <div className="bg-surface-card border border-line rounded-card">
                                <EmptyState
                                    compact
                                    icon={Server}
                                    title={idleCount > 0 ? `All ${idleCount} Idle Servers Standing By` : 'No Idle Servers'}
                                    message={liveMatches.length > 0 ? 'Active match is running above. Other servers are idle.' : 'No active matches or lobbies in progress right now.'}
                                    action={
                                        <button
                                            onClick={() => setShowIdleServers(true)}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-surface-raised border border-gray-700 hover:border-brand text-gray-300 hover:text-brand text-xs font-mono font-bold uppercase tracking-wider rounded-control transition-colors"
                                        >
                                            <span>Show Idle Servers ({idleCount})</span>
                                        </button>
                                    }
                                />
                            </div>
                        ) : (
                            <>
                                {/* Mobile Cards View */}
                                <div className="md:hidden space-y-2">
                                    {displayServers?.map((item) => {
                                        const isGameActive = item.game && !item.game.inLobby;
                                        const isLobby = item.game && item.game.inLobby;
                                        return (
                                            <div
                                                key={item.server.ip}
                                                {...rowLink(urlFor('live-game-detail', item.server.ip))}
                                                className="bg-surface-card border border-line rounded-card p-3 cursor-pointer hover:border-brand transition-colors"
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <button onClick={(e) => toggleFavorite(item.server.ip, e)} className={`text-sm ${favorites.includes(item.server.ip) ? 'text-yellow-500' : 'text-gray-700'}`}>★</button>
                                                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isGameActive ? 'bg-green-500 animate-pulse' : isLobby ? 'bg-yellow-500' : 'bg-gray-700'}`}></span>
                                                        <Link to={urlFor('live-game-detail', item.server.ip)} className="font-bold text-gray-200 text-sm truncate">{item.server.name}</Link>
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        <button
                                                            onClick={(e) => handleCopyIp(item.server.ip, e)}
                                                            className="text-gray-500 hover:text-brand p-1 text-xs"
                                                            title={`Copy IP: ${item.server.ip}`}
                                                        >
                                                            {copiedIp === item.server.ip ? <span className="text-green-400 text-2xs font-mono">Copied</span> : <Copy size={12} />}
                                                        </button>
                                                        <span className="text-xs font-mono px-2 py-0.5 rounded-control bg-surface-raised border border-line text-gray-400">
                                                            {item.game?.currentPlayers || 0}/{item.game?.maxPlayers || 8}
                                                        </span>
                                                    </div>
                                                </div>
                                                {item.game ? (
                                                    <div className="flex justify-between items-center text-xs text-gray-400 font-mono pt-2 border-t border-line">
                                                        <span className="text-brand font-bold">{item.game.mode}</span>
                                                        <span className="text-gray-500">{item.game.mapName}</span>
                                                    </div>
                                                ) : (
                                                    <div className="text-2xs text-gray-600 font-mono">Idle &bull; {item.server.ip}</div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Desktop Table View */}
                                <div className="hidden md:block bg-surface-card border border-line rounded-card overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm font-mono">
                                            <thead className="bg-surface-raised text-gray-500 text-xs uppercase select-none">
                                                <tr>
                                                    <th className="p-3 border-b border-line w-10 text-center">★</th>
                                                    <th className="p-3 border-b border-line w-10 text-center cursor-pointer hover:text-gray-300" onClick={() => requestSort('activity')}>ST <SortIndicator column="activity" /></th>
                                                    <th className="p-3 border-b border-line cursor-pointer hover:text-gray-300 group" onClick={() => requestSort('name')}>Server Name <SortIndicator column="name" /></th>
                                                    <th className="p-3 border-b border-line w-32 cursor-pointer hover:text-gray-300 group" onClick={() => requestSort('activity_24h')}>Activity <SortIndicator column="activity_24h" /></th>
                                                    <th className="p-3 border-b border-line w-28 text-center cursor-pointer hover:text-gray-300 group" onClick={() => requestSort('players')}>Players <SortIndicator column="players" /></th>
                                                    <th className="p-3 border-b border-line cursor-pointer hover:text-gray-300 group" onClick={() => requestSort('map')}>Mode / Map <SortIndicator column="map" /></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-line">
                                                {displayServers?.map((item) => {
                                                    const isGameActive = item.game && !item.game.inLobby;
                                                    const isLobby = item.game && item.game.inLobby;
                                                    const mapImage = item.game ? getMapImage(item.game.mapName) : null;

                                                    return (
                                                        <tr key={item.server.ip} {...rowLink(urlFor('live-game-detail', item.server.ip))} className="hover:bg-surface-raised transition-colors group cursor-pointer">
                                                            <td className="p-3 text-center">
                                                                <button onClick={(e) => toggleFavorite(item.server.ip, e)} className={`hover:scale-125 transition-transform ${favorites.includes(item.server.ip) ? 'text-yellow-500' : 'text-gray-700 hover:text-gray-500'}`}>★</button>
                                                            </td>
                                                            <td className="p-3 text-center">
                                                                {isGameActive ? <div className="w-2 h-2 bg-green-500 rounded-full mx-auto animate-pulse shadow-[0_0_5px_#22c55e]" title="Active"></div> :
                                                                    isLobby ? <div className="w-2 h-2 bg-yellow-500 rounded-full mx-auto" title="Lobby"></div> :
                                                                        <div className="w-2 h-2 bg-gray-700 rounded-full mx-auto" title="Idle"></div>}
                                                            </td>
                                                            <td className="p-3">
                                                                <div className="flex items-center gap-2">
                                                                    <Link to={urlFor('live-game-detail', item.server.ip)} className="font-bold text-gray-300 group-hover:text-white truncate">
                                                                        {item.server.name}
                                                                    </Link>
                                                                    {getHealthBadge(item.server.lastSeen)}
                                                                    <button
                                                                        onClick={(e) => handleCopyIp(item.server.ip, e)}
                                                                        className="text-gray-500 hover:text-brand transition-colors p-1 rounded-control hover:bg-gray-800/60 inline-flex items-center gap-1"
                                                                        title={`Click to copy join IP: ${item.server.ip}`}
                                                                    >
                                                                        {copiedIp === item.server.ip ? (
                                                                            <span className="text-2xs text-green-400 font-mono font-bold flex items-center gap-0.5">
                                                                                <Check size={11} /> Copied
                                                                            </span>
                                                                        ) : (
                                                                            <Copy size={11} className="opacity-50 hover:opacity-100" />
                                                                        )}
                                                                    </button>
                                                                </div>
                                                                <div className="text-2xs text-gray-600 flex gap-2 items-center mt-0.5">
                                                                    <span className="border border-line px-1 rounded-control">{item.server.version || 'v?'}</span>
                                                                    <span className="font-mono text-gray-500">{item.server.ip}</span>
                                                                    {item.server.serverNotes && (
                                                                        <span className="truncate max-w-[200px] hidden lg:inline-block border-l border-line pl-2 text-gray-500">
                                                                            {item.server.serverNotes}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="p-3">
                                                                <ServerActivitySparkline
                                                                    serverIp={item.server.ip}
                                                                    activityData={globalStats?.serverActivity}
                                                                />
                                                            </td>
                                                            <td className="p-3 w-28 text-center whitespace-nowrap">
                                                                {item.game ? (
                                                                    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-control bg-surface-raised border border-line text-xs font-mono">
                                                                        <span className={item.game.currentPlayers > 0 ? "text-green-400 font-bold" : "text-gray-500"}>
                                                                            {item.game.currentPlayers}
                                                                        </span>
                                                                        <span className="text-gray-600">/</span>
                                                                        <span className="text-gray-500">{item.game.maxPlayers}</span>
                                                                        {isGameActive && (
                                                                            <div className="ml-1 pl-1 border-l border-line">
                                                                                <MatchTimer startTime={item.game.gameStarted} timeLimit={item.game.matchLength} className="text-2xs text-brand" />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-gray-600 text-xs font-mono">0 / 8</span>
                                                                )}
                                                            </td>
                                                            <td className="p-3">
                                                                {item.game ? (
                                                                    <div className="flex items-center gap-2">
                                                                        {mapImage ? (
                                                                            <div className="w-8 h-8 rounded-control bg-cover bg-center border border-line flex-shrink-0" style={{ backgroundImage: `url(${mapImage})` }}></div>
                                                                        ) : (
                                                                            <div className="w-8 h-8 rounded-control bg-gray-800 border border-gray-700 flex items-center justify-center text-2xs text-gray-500 flex-shrink-0">?</div>
                                                                        )}
                                                                        <div>
                                                                            <div className="text-gray-300 font-bold text-xs">{item.game.mode}</div>
                                                                            <div className="text-2xs text-gray-500">{item.game.mapName}</div>
                                                                        </div>
                                                                    </div>
                                                                ) : <span className="text-gray-700 text-xs">-</span>}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {afterLive}

                    {/* Recently Completed Matches (Top 3) */}
                    {historyGames && historyGames.length > 0 && (
                        <div className="pt-2">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-gray-500 font-bold text-xs uppercase tracking-widest">Recent Bouts</h3>
                                <button
                                    onClick={() => setActiveTab('history')}
                                    className="text-xs font-mono text-brand hover:underline"
                                >
                                    View 365-day history &rarr;
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {historyGames.slice(0, 3).map(game => {
                                    const thumb = getMapImage(game.settings?.level);
                                    return (
                                        <Link key={game.id} to={urlFor('game-detail', game.id)} className="bg-surface-card border border-line hover:border-brand rounded-card flex overflow-hidden cursor-pointer group h-20 transition-colors">
                                            <div className="w-20 bg-gray-900 bg-cover bg-center relative flex-shrink-0" style={{ backgroundImage: `url(${thumb})` }}>
                                                <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors"></div>
                                            </div>
                                            <div className="flex-1 p-2 flex flex-col justify-center min-w-0">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-2xs text-brand font-bold uppercase">{game.settings?.matchMode}</span>
                                                    <span className="text-2xs text-gray-600 font-mono">{game.date ? new Date(game.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                                                </div>
                                                <div className="text-xs font-bold text-gray-300 truncate group-hover:text-white">{game.server?.name}</div>
                                                <div className="text-2xs text-gray-500 truncate">{game.settings?.level}</div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Upcoming Events Calendar */}
                    <CalendarWidget />
                </section>
            )}

            {activeTab === 'history' && (
                <section className="space-y-6">
                    {/* 365-Day Network Traffic Analysis */}
                    <div className="bg-surface-card border border-line rounded-card overflow-hidden">
                        <div className="p-4 border-b border-line flex justify-between items-center bg-surface-raised">
                            <h3 className="text-white font-bold text-sm tracking-wider uppercase flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                Network Traffic Analysis (365 Days)
                            </h3>
                        </div>

                        <div className="flex flex-col h-[500px]">
                            <div className="h-2/3 border-b border-line p-4">
                                <ActivityGraph globalActivity={globalStats?.activity} />
                            </div>
                            <div className="h-1/3 p-4 bg-surface-card">
                                <GlobalActivityChart />
                            </div>
                        </div>
                    </div>
                        {/* Archive Search & Stats */}
                        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 bg-surface-card border border-line rounded-card p-4">
                            <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto">
                                <input
                                    type="text"
                                    placeholder="Search Player, Map, Server, ID..."
                                    className="bg-surface-page border border-gray-700 text-white text-sm px-4 py-2 rounded-control w-full md:w-64 focus:border-brand outline-none font-mono"
                                    value={searchId}
                                    onChange={(e) => setSearchId(e.target.value)}
                                />
                                <button
                                    type="submit"
                                    disabled={isSearching}
                                    className="bg-brand hover:bg-brand-hover text-white text-sm px-6 py-2 rounded-control font-bold transition-colors uppercase"
                                >
                                    Search
                                </button>
                            </form>

                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <div className="text-xs text-gray-500 uppercase tracking-widest">Total Games Archived</div>
                                    <div className="text-2xl font-bold text-white font-mono leading-none">{totalGamesTracked > 0 ? totalGamesTracked.toLocaleString() : (historyGames?.length || 0)}</div>
                                </div>
                            </div>
                        </div>

                        {historyGames === null ? (
                            isLoadingHistory || isSearching ? (
                                <Loading compact label="Fetching archival data..." />
                            ) : historyError ? (
                                <ErrorState
                                    compact
                                    title="Archive unavailable"
                                    message="Could not load the match history."
                                    onRetry={() => (query ? runSearch(query) : loadFirstPage())}
                                />
                            ) : null
                        ) : historyGames.length === 0 ? (
                            <EmptyState
                                icon={Search}
                                title="No matches found"
                                message={query ? `Nothing in the last 365 days matches "${query}".` : 'No matches recorded in the last 365 days.'}
                            />
                        ) : (
                            <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {historyGames.map((game) => {
                                    const thumb = getMapImage(game.settings?.level);
                                    return (
                                        <div key={game.id} {...rowLink(urlFor('game-detail', game.id))} className="bg-surface-card border border-line hover:border-brand rounded-card overflow-hidden cursor-pointer transition-all group relative">
                                            {thumb && (
                                                <div className="absolute inset-0 opacity-10 group-hover:opacity-20 bg-cover bg-center transition-opacity" style={{ backgroundImage: `url(${thumb})` }}></div>
                                            )}
                                            <div className="p-3 relative z-10">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-2xs text-gray-500 font-mono bg-black px-1.5 py-0.5 rounded-control border border-line">{game.date ? new Date(game.date).toLocaleDateString() : 'Unknown'}</span>
                                                    <span className="text-2xs text-brand font-bold uppercase">{game.settings?.matchMode}</span>
                                                </div>
                                                <h3 className="font-bold text-gray-300 truncate text-sm mb-1 group-hover:text-white"><Link to={urlFor('game-detail', game.id)}>{game.server?.name || "Unknown"}</Link></h3>
                                                <div className="text-xs text-gray-500 mb-3">Map: {game.settings?.level}</div>
                                                <div className="pt-2 border-t border-line/50 flex flex-wrap gap-2 text-2xs font-mono">
                                                    {game.teamScore && Object.keys(game.teamScore).length > 0 ?
                                                        Object.entries(game.teamScore).map(([team, score]) => <span key={team} className={team === 'BLUE' ? 'text-blue-400' : 'text-orange-400'}>{team}:{score}</span>) :
                                                        game.players?.slice(0, 3).sort((a, b) => b.kills - a.kills).map((p, i) => (
                                                            <Link
                                                                key={p.name}
                                                                to={urlFor('pilot', p.name)}
                                                                className={`hover:underline hover:text-brand transition-colors ${i === 0 ? 'text-white font-bold' : 'text-gray-400'}`}
                                                                title={`View ${p.name}'s pilot dossier`}
                                                            >
                                                                {p.name}({p.kills})
                                                            </Link>
                                                        ))
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-4 text-center">
                                <button
                                    onClick={handleLoadMoreHistory}
                                    disabled={isLoadingHistory}
                                    className="text-gray-500 hover:text-brand text-xs font-mono underline"
                                >
                                    {isLoadingHistory ? 'Fetching archival data...' : 'Load older games...'}
                                </button>
                            </div>
                            </>
                        )}
                    </section>
                )
            }
        </div >
    );
};

export default GameList;
