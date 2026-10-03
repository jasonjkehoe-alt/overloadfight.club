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
import { Database } from 'lucide-react';

interface GameListProps {
    activeGames?: BrowserApiResponse[] | null;
    archivedGames?: GameData[] | null;
    onSelectGame: (id: number) => void;
    onSelectLiveGame: (server: BrowserApiResponse) => void;
    onNavigate: (view: string, param?: string) => void;
    globalStats?: any;
    startDate?: string;
    showColdStorage?: boolean;
}

const GameList: React.FC<GameListProps> = ({ activeGames, archivedGames: initialArchivedGames, onSelectGame, onSelectLiveGame, onNavigate, globalStats, startDate, showColdStorage }) => {
    const [activeTab, setActiveTab] = useState<'servers' | 'history'>('servers');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'activity', direction: 'desc' });
    const [favorites, setFavorites] = useState<string[]>([]);

    // ... (rest of state items are unchanged)

    // Local state for archived games to allow "Load More" functionality
    const [historyGames, setHistoryGames] = useState<GameData[] | null>(initialArchivedGames || null);
    const [historyPage, setHistoryPage] = useState(1);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    // Archive Search State
    const [searchId, setSearchId] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    // Global Stats State
    const [totalGamesTracked, setTotalGamesTracked] = useState<number>(0);

    // ... (useEffect hooks unchanged)

    useEffect(() => {
        if (initialArchivedGames) {
            setHistoryGames(initialArchivedGames);
        } else if (!initialArchivedGames && !historyGames && !activeGames) {
            // If no initial games provided (e.g. History View), fetch page 1
            setIsLoadingHistory(true);
            fetchArchivedGames(1, '', startDate).then(response => {
                if (response && response.games) {
                    setHistoryGames(response.games);
                    if (response.count) setTotalGamesTracked(response.count);
                }
                setIsLoadingHistory(false);
            });
        }
    }, [initialArchivedGames, startDate]);

    // ... (other handlers unchanged)

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSearching(true);

        // Reset to page 1 for new search
        setHistoryPage(1);

        try {
            // Fix: Include startDate
            const response = await fetchArchivedGames(1, searchId, startDate);
            if (response && response.games) {
                setHistoryGames(response.games);
                if (response.count !== undefined) {
                    setTotalGamesTracked(response.count);
                }
            } else {
                setHistoryGames([]);
                setTotalGamesTracked(0);
            }
        } catch (err) {
            console.error("Error searching games", err);
        }
        setIsSearching(false);
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
    };

    const handleLoadMoreHistory = async () => {
        setIsLoadingHistory(true);
        const nextPage = historyPage + 1;
        // Fix: Include startDate
        const response = await fetchArchivedGames(nextPage, searchId, startDate);
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
        return <span className="ml-1 text-[#ff6600]">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
    };

    const activeCount = activeGames ? activeGames.filter(g => g.game && !g.game.inLobby).length : 0;
    const lobbyCount = activeGames ? activeGames.filter(g => g.game && g.game.inLobby).length : 0;
    const liveMatches = activeGames ? activeGames.filter(g => g.game && !g.game.inLobby) : [];

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
                onNavigate={onNavigate}
                onSelectLiveGame={onSelectLiveGame}
                globalStats={globalStats}
            />

            <CalendarWidget />

            <div className="bg-[#111] border border-gray-800 rounded mb-8 overflow-hidden">
                <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-[#1a1a1a]">
                    <h3 className="text-white font-bold text-sm tracking-wider uppercase flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#ff6600]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Network Traffic Analysis
                    </h3>
                </div>

                <div className="flex flex-col h-[500px]">
                    <div className="h-2/3 border-b border-gray-800 p-4">
                        <ActivityGraph globalActivity={globalStats?.activity} />
                    </div>
                    <div className="h-1/3 p-4 bg-[#0e0e0e]">
                        <GlobalActivityChart />
                    </div>
                </div>
            </div>

            <div className="flex border-b border-gray-800 justify-between items-end">
                <div className="flex">
                    <button
                        onClick={() => setActiveTab('servers')}
                        className={`px-6 py-3 font-mono text-sm font-bold transition-colors border-b-2 ${activeTab === 'servers'
                            ? 'border-[#ff6600] text-[#ff6600] bg-[#ff6600]/5'
                            : 'border-transparent text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        SERVER BROWSER {activeGames && <span className="ml-2 px-1.5 py-0.5 bg-[#222] text-gray-300 rounded text-xs">{activeGames.length}</span>}
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-6 py-3 font-mono text-sm font-bold transition-colors border-b-2 ${activeTab === 'history'
                            ? 'border-[#ff6600] text-[#ff6600] bg-[#ff6600]/5'
                            : 'border-transparent text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        HISTORY (365 DAYS) {totalGamesTracked > 0 && <span className="ml-2 px-1.5 py-0.5 bg-[#222] text-gray-300 rounded text-xs">{totalGamesTracked.toLocaleString()}</span>}
                    </button>
                </div>
                {showColdStorage && (
                    <button
                        onClick={() => onNavigate('cold-storage')}
                        className="mb-3 mr-4 text-xs font-mono text-blue-500 hover:text-blue-400 uppercase font-bold flex items-center gap-2 transition-colors"
                    >
                        <span className="flex items-center gap-1"><Database size={12} /> Cold Storage Archive</span>
                        <span>→</span>
                    </button>
                )}
            </div>

            {
                activeTab === 'servers' && (
                    <section>
                        {/* Recent Games Widget (Top 3) */}
                        {historyGames && historyGames.length > 0 && (
                            <div className="mb-8">
                                <h3 className="text-gray-500 font-bold text-xs uppercase tracking-widest mb-3">Recently Completed Matches</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {historyGames.slice(0, 3).map(game => {
                                        const thumb = getMapImage(game.settings?.level);
                                        return (
                                            <div key={game.id} onClick={() => game.id && onSelectGame(game.id)} className="bg-[#111] border border-gray-800 hover:border-[#ff6600] rounded flex overflow-hidden cursor-pointer group h-20 transition-colors">
                                                <div className="w-20 bg-gray-900 bg-cover bg-center relative" style={{ backgroundImage: `url(${thumb})` }}>
                                                    <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors"></div>
                                                </div>
                                                <div className="flex-1 p-2 flex flex-col justify-center">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-[10px] text-[#ff6600] font-bold uppercase">{game.settings?.matchMode}</span>
                                                        <span className="text-[10px] text-gray-600 font-mono">{game.date ? new Date(game.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                                                    </div>
                                                    <div className="text-xs font-bold text-gray-300 truncate group-hover:text-white">{game.server?.name}</div>
                                                    <div className="text-[10px] text-gray-500 truncate">{game.settings?.level}</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Live Match Cards Section */}
                        {liveMatches.length > 0 && (
                            <div className="mb-8">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-[#ff6600] font-bold text-lg uppercase tracking-widest">Games In Progress</h3>
                                    <span className="text-xs text-gray-600 font-mono animate-pulse">LIVE FEED ACTIVE</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {liveMatches.map(match => (
                                        <LiveMatchCard
                                            key={match.server.ip}
                                            server={match}
                                            onWatch={onSelectLiveGame}
                                            onSelectPilot={(pilot) => onNavigate && onNavigate('pilot', pilot)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex flex-wrap items-center justify-between mb-4 mt-6">
                            <h3 className="text-[#ff6600] font-bold text-lg uppercase tracking-widest">Server Browser</h3>
                            <div className="text-xs text-gray-500 font-mono">
                                <span className="text-green-500 font-bold">{activeCount}</span> ACTIVE &bull; <span className="text-yellow-500 font-bold">{lobbyCount}</span> LOBBY
                            </div>
                        </div>

                        {sortedActiveGames === null ? (
                            <div className="bg-[#150505] border border-red-900/50 p-4 rounded-lg text-center">
                                <p className="text-red-500 font-bold text-sm">Connection Failed</p>
                                <p className="text-xs text-gray-600 font-mono mt-1">Could not retrieve live data.</p>
                            </div>
                        ) : (
                            <div className="bg-[#111] border border-gray-800 rounded overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm font-mono">
                                        <thead className="bg-[#161616] text-gray-500 text-xs uppercase select-none">
                                            <tr>
                                                <th className="p-3 border-b border-gray-800 w-10 text-center">★</th>
                                                <th className="p-3 border-b border-gray-800 w-10 text-center" onClick={() => requestSort('activity')}>ST <SortIndicator column="activity" /></th>
                                                <th className="p-3 border-b border-gray-800 cursor-pointer hover:text-gray-300 group" onClick={() => requestSort('name')}>Server Name <SortIndicator column="name" /></th>
                                                <th className="p-3 border-b border-gray-800 w-32 hidden sm:table-cell cursor-pointer hover:text-gray-300 group" onClick={() => requestSort('activity_24h')}>Activity <SortIndicator column="activity_24h" /></th>
                                                <th className="p-3 border-b border-gray-800 w-48 cursor-pointer hover:text-gray-300 group" onClick={() => requestSort('players')}>Players <SortIndicator column="players" /></th>
                                                <th className="p-3 border-b border-gray-800 cursor-pointer hover:text-gray-300 group" onClick={() => requestSort('map')}>Mode / Map <SortIndicator column="map" /></th>
                                                <th className="p-3 border-b border-gray-800 text-right" onClick={() => requestSort('ip')}>IP Address <SortIndicator column="ip" /></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-800">
                                            {sortedActiveGames.length === 0 ? (
                                                <tr><td colSpan={7} className="p-8 text-center text-gray-600 italic">No servers detected.</td></tr>
                                            ) : sortedActiveGames.map((item) => {
                                                const isGameActive = item.game && !item.game.inLobby;
                                                const isLobby = item.game && item.game.inLobby;
                                                const mapImage = item.game ? getMapImage(item.game.mapName) : null;

                                                return (
                                                    <tr key={item.server.ip} onClick={() => onSelectLiveGame(item)} className="hover:bg-[#1a1a1a] transition-colors group cursor-pointer">
                                                        <td className="p-3 text-center">
                                                            <button onClick={(e) => toggleFavorite(item.server.ip, e)} className={`hover:scale-125 transition-transform ${favorites.includes(item.server.ip) ? 'text-yellow-500' : 'text-gray-700 hover:text-gray-500'}`}>★</button>
                                                        </td>
                                                        <td className="p-3 text-center">
                                                            {isGameActive ? <div className="w-2 h-2 bg-green-500 rounded-full mx-auto animate-pulse shadow-[0_0_5px_#22c55e]" title="Active"></div> :
                                                                isLobby ? <div className="w-2 h-2 bg-yellow-500 rounded-full mx-auto" title="Lobby"></div> :
                                                                    <div className="w-2 h-2 bg-gray-700 rounded-full mx-auto" title="Idle"></div>}
                                                        </td>
                                                        <td className="p-3">
                                                            <div className="font-bold text-gray-300 group-hover:text-white flex items-center gap-2">
                                                                {item.server.name}
                                                                {getHealthBadge(item.server.lastSeen)}
                                                            </div>
                                                            <div className="text-[10px] text-gray-600 flex gap-2 items-center">
                                                                <span className="border border-gray-800 px-1 rounded">{item.server.version || 'v?'}</span>
                                                                {item.server.serverNotes && <span className="truncate max-w-[150px] hidden md:inline-block border-l border-gray-800 pl-2">{item.server.serverNotes}</span>}
                                                            </div>
                                                        </td>
                                                        <td className="p-3 hidden sm:table-cell">
                                                            <ServerActivitySparkline
                                                                serverIp={item.server.ip}
                                                                activityData={globalStats?.serverActivity}
                                                            />
                                                        </td>
                                                        <td className="p-3">
                                                            {item.game ? (
                                                                <div className="w-full max-w-[150px]">
                                                                    <div className="flex justify-between text-[10px] mb-1 text-gray-500">
                                                                        <span>{item.game.currentPlayers} / {item.game.maxPlayers}</span>
                                                                        {isGameActive && <MatchTimer startTime={item.game.gameStarted} timeLimit={item.game.matchLength} className="font-mono" />}
                                                                    </div>
                                                                    <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                                                                        <div className={`h-full ${isGameActive ? 'bg-green-500' : 'bg-yellow-500'}`} style={{ width: `${(item.game.currentPlayers / Math.max(item.game.maxPlayers, 1)) * 100}%` }}></div>
                                                                    </div>
                                                                </div>
                                                            ) : <span className="text-gray-700 text-xs">Empty</span>}
                                                        </td>
                                                        <td className="p-3">
                                                            {item.game ? (
                                                                <div className="flex items-center gap-2">
                                                                    {mapImage ? (
                                                                        <div className="w-8 h-8 rounded bg-cover bg-center border border-gray-800" style={{ backgroundImage: `url(${mapImage})` }}></div>
                                                                    ) : (
                                                                        <div className="w-8 h-8 rounded bg-gray-800 border border-gray-700 flex items-center justify-center text-[8px] text-gray-500">?</div>
                                                                    )}
                                                                    <div>
                                                                        <div className="text-gray-300">{item.game.mode}</div>
                                                                        <div className="text-[10px] text-gray-500">{item.game.mapName}</div>
                                                                    </div>
                                                                </div>
                                                            ) : <span className="text-gray-700 text-xs">-</span>}
                                                        </td>
                                                        <td className="p-3 text-right">
                                                            <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(item.server.ip) }} className="text-xs bg-gray-900 hover:bg-gray-800 text-gray-400 px-2 py-1 rounded font-mono border border-gray-800 transition-colors">{item.server.ip}</button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </section>
                )
            }

            {
                activeTab === 'history' && (
                    <section>
                        {/* Archive Search & Stats */}
                        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 bg-[#111] border border-gray-800 rounded p-4">
                            <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto">
                                <input
                                    type="text"
                                    placeholder="Search Player, Map, Server, ID..."
                                    className="bg-[#0a0a0a] border border-gray-700 text-white text-sm px-4 py-2 rounded w-full md:w-64 focus:border-[#ff6600] outline-none font-mono"
                                    value={searchId}
                                    onChange={(e) => setSearchId(e.target.value)}
                                />
                                <button
                                    type="submit"
                                    disabled={isSearching}
                                    className="bg-[#ff6600] hover:bg-[#e55b00] text-white text-sm px-6 py-2 rounded font-bold transition-colors uppercase"
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

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {historyGames?.map((game) => {
                                const thumb = getMapImage(game.settings?.level);
                                return (
                                    <div key={game.id} onClick={() => game.id && onSelectGame(game.id)} className="bg-[#111] border border-gray-800 hover:border-[#ff6600] rounded-sm overflow-hidden cursor-pointer transition-all group relative">
                                        {thumb && (
                                            <div className="absolute inset-0 opacity-10 group-hover:opacity-20 bg-cover bg-center transition-opacity" style={{ backgroundImage: `url(${thumb})` }}></div>
                                        )}
                                        <div className="p-3 relative z-10">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-[10px] text-gray-500 font-mono bg-black px-1.5 py-0.5 rounded border border-gray-800">{game.date ? new Date(game.date).toLocaleDateString() : 'Unknown'}</span>
                                                <span className="text-[10px] text-[#ff6600] font-bold uppercase">{game.settings?.matchMode}</span>
                                            </div>
                                            <h3 className="font-bold text-gray-300 truncate text-sm mb-1 group-hover:text-white">{game.server?.name || "Unknown"}</h3>
                                            <div className="text-xs text-gray-500 mb-3">Map: {game.settings?.level}</div>
                                            <div className="pt-2 border-t border-gray-800/50 flex flex-wrap gap-2 text-[10px] font-mono">
                                                {game.teamScore && Object.keys(game.teamScore).length > 0 ?
                                                    Object.entries(game.teamScore).map(([team, score]) => <span key={team} className={team === 'BLUE' ? 'text-blue-400' : 'text-orange-400'}>{team}:{score}</span>) :
                                                    game.players?.slice(0, 3).sort((a, b) => b.kills - a.kills).map((p, i) => (
                                                        <button
                                                            key={p.name}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onNavigate && onNavigate('pilot', p.name);
                                                            }}
                                                            className={`hover:underline hover:text-[#ff6600] transition-colors ${i === 0 ? 'text-white font-bold' : 'text-gray-400'}`}
                                                            title={`View ${p.name}'s pilot dossier`}
                                                        >
                                                            {p.name}({p.kills})
                                                        </button>
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
                                className="text-gray-500 hover:text-[#ff6600] text-xs font-mono underline"
                            >
                                {isLoadingHistory ? 'Fetching archival data...' : 'Load older games...'}
                            </button>
                        </div>
                    </section>
                )
            }
        </div >
    );
};

export default GameList;
