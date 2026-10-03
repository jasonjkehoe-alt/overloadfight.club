import React, { useState, useMemo } from 'react';
import { BrowserApiResponse, GameData } from '../types';
import { User, Calendar, Filter, Trophy, TrendingUp, Skull, Info, Search, X } from 'lucide-react';

interface PilotsListProps {
    activeGames?: BrowserApiResponse[] | null;
    archivedGames?: GameData[] | null;
    onSelectServer: (server: BrowserApiResponse) => void;
    onSelectGame: (gameId: number) => void;
    onNavigate: (view: string, param?: string) => void;
}

interface PilotStats {
    name: string;
    kills: number;
    deaths: number;
    assists: number;
    games: number;
    lastSeen: Date;
    kd: number;
    kda: number;
    wins?: number;
    losses?: number;
    ties?: number;
    win_rate?: number;
    total_damage?: number;
    dpm?: number;
    aci?: number;
    kpm?: number;
}

const PilotsList: React.FC<PilotsListProps> = ({ activeGames, archivedGames, onSelectServer, onSelectGame, onNavigate }) => {
    const [activeTab, setActiveTab] = useState<'online' | 'roster'>('roster');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: keyof PilotStats; direction: 'asc' | 'desc' }>({ key: 'games', direction: 'desc' });
    const [activeOnly, setActiveOnly] = useState(false);
    const [minGamesThreshold, setMinGamesThreshold] = useState<number>(50);


    // Generate Online Pilots List from Active Games
    const onlinePilots = useMemo(() => {
        if (!activeGames) return [];

        const pilotsMap = new Map<string, { name: string; server: BrowserApiResponse; isCreator: boolean }>();

        activeGames.forEach(server => {
            if (server.game && !server.game.inLobby) {
                if (server.game.creator) {
                    pilotsMap.set(server.game.creator, {
                        name: server.game.creator,
                        server: server,
                        isCreator: true
                    });
                }
                if (Array.isArray(server.game.players)) {
                    server.game.players.forEach(p => {
                        const pName = typeof p === 'string' ? p : (p as any)?.name;
                        if (pName && !pilotsMap.has(pName)) {
                            pilotsMap.set(pName, {
                                name: pName,
                                server: server,
                                isCreator: pName === server.game?.creator
                            });
                        }
                    });
                }
            }
        });

        return Array.from(pilotsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    }, [activeGames]);

    const [pilotRoster, setPilotRoster] = useState<PilotStats[]>([]);
    const [loadingRoster, setLoadingRoster] = useState(false);

    // Fetch aggregated stats from server
    React.useEffect(() => {
        // Always fetch roster if not loaded, as we need it for autocomplete in comparison too
        if (pilotRoster.length === 0) {
            setLoadingRoster(true);
            let url = '/api/stats/pilots?source=all';

            fetch(url)
                .then(res => res.json())
                .then(data => {
                    const formatted = data.map((p: any) => ({
                        ...p,
                        lastSeen: new Date(p.lastSeen || p.last_updated),
                        kd: p.kd !== undefined ? p.kd : (p.kills / Math.max(1, p.deaths)),
                        kda: p.kda !== undefined ? p.kda : ((p.kills + p.assists * 0.5) / Math.max(1, p.deaths)),
                        win_rate: p.win_rate !== undefined ? p.win_rate : (p.games > 0 && p.wins !== undefined ? ((p.wins / p.games) * 100) : 0),
                        wins: p.wins,
                        losses: p.losses,
                        ties: p.ties,
                        total_damage: p.total_damage,
                        dpm: p.dpm,
                        aci: p.aci,
                        kpm: p.kpm
                    }));
                    setPilotRoster(formatted);
                    setLoadingRoster(false);
                })
                .catch(err => {
                    console.error("Failed to load pilot stats", err);
                    setLoadingRoster(false);
                });
        }
    }, []);


    const sortedRoster = useMemo(() => {
        let data = [...pilotRoster];

        // Filter by Date if activeOnly is toggled and no active text search
        if (activeOnly && !searchTerm.trim()) {
            const ninetyDaysAgo = new Date();
            ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
            data = data.filter(p => p.lastSeen >= ninetyDaysAgo);
        }

        // Qualification Filter (min matches) - automatically bypassed during search
        if (!searchTerm.trim() && minGamesThreshold > 1) {
            data = data.filter(p => p.games >= minGamesThreshold);
        }

        if (searchTerm.trim()) {
            data = data.filter(p => p.name.toLowerCase().includes(searchTerm.trim().toLowerCase()));
        }

        return data.sort((a, b) => {
            const valA = a[sortConfig.key];
            const valB = b[sortConfig.key];

            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [pilotRoster, searchTerm, sortConfig, activeOnly, minGamesThreshold]);

    const handleSort = (key: keyof PilotStats) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
        }));
    };


    // Highlights Calculation - Qualified threshold ensures genuine veteran aces
    const highlights = useMemo(() => {
        if (pilotRoster.length === 0) return null;

        const qualificationCutoff = Math.max(minGamesThreshold > 1 ? minGamesThreshold : 25, 25);
        let validRoster = pilotRoster.filter(p => p.games >= qualificationCutoff);
        if (validRoster.length === 0) {
            validRoster = pilotRoster.filter(p => p.games >= 5);
        }
        const activeRoster = pilotRoster.filter(p => p.games >= 1);

        const topGun = [...validRoster].sort((a, b) => b.kda - a.kda)[0];
        const mostActive = [...activeRoster].sort((a, b) => b.games - a.games)[0];
        const slayer = [...activeRoster].sort((a, b) => b.kills - a.kills)[0];

        return { topGun, mostActive, slayer };
    }, [pilotRoster, minGamesThreshold]);

    return (
        <div className="animate-fade-in space-y-6">

            <div className="flex justify-between items-center border-b border-gray-800 mb-6">
                <div className="flex">
                    <button
                        onClick={() => setActiveTab('online')}
                        className={`px-6 py-3 font-mono text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                            activeTab === 'online'
                                ? 'border-[#ff6600] text-[#ff6600] bg-[#ff6600]/5'
                                : 'border-transparent text-gray-500 hover:text-gray-300'
                        }`}
                    >
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        LIVE IN-GAME PILOTS
                        <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400">
                            {onlinePilots.length}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('roster')}
                        className={`px-6 py-3 font-mono text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                            activeTab === 'roster'
                                ? 'border-[#ff6600] text-[#ff6600] bg-[#ff6600]/5'
                                : 'border-transparent text-gray-500 hover:text-gray-300'
                        }`}
                    >
                        PILOT ROSTER & LEADERBOARD
                        <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400">
                            {pilotRoster.length}
                        </span>
                    </button>
                </div>
            </div>

            {activeTab === 'online' && (
                <div className="space-y-4">
                    {onlinePilots.length > 0 ? (
                        <div className="bg-[#111] border border-gray-800 rounded overflow-hidden">
                            <table className="w-full text-left text-sm font-mono">
                                <thead className="bg-[#161616] text-gray-500 text-xs uppercase">
                                    <tr>
                                        <th className="p-4">Pilot Name</th>
                                        <th className="p-4">Playing On</th>
                                        <th className="p-4">Mode / Map</th>
                                        <th className="p-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {onlinePilots.map((pilot, idx) => (
                                        <tr key={`${pilot.name}-${idx}`} className="hover:bg-[#1a1a1a] group transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                                    <button
                                                        onClick={() => onNavigate('pilot', pilot.name)}
                                                        className="font-bold text-white text-lg hover:text-[#ff6600] hover:underline transition-colors text-left"
                                                    >
                                                        {pilot.name}
                                                    </button>
                                                    {pilot.isCreator && <span className="text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded border border-gray-700">HOST</span>}
                                                </div>
                                            </td>
                                            <td className="p-4 text-gray-300">
                                                {pilot.server.server.name}
                                            </td>
                                            <td className="p-4 text-gray-400 text-xs">
                                                <span className="text-[#ff6600] font-bold">{pilot.server.game?.mode}</span>
                                                <span className="mx-2">|</span>
                                                {pilot.server.game?.mapName}
                                            </td>
                                            <td className="p-4 text-right">
                                                <button
                                                    onClick={() => onSelectServer(pilot.server)}
                                                    className="bg-[#ff6600]/10 hover:bg-[#ff6600] text-[#ff6600] hover:text-white border border-[#ff6600]/50 px-3 py-1.5 rounded text-xs font-bold uppercase transition-all"
                                                >
                                                    View Match
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-[#111] border border-gray-800 rounded">
                            <p className="text-gray-500 italic">No identified pilots in active matches.</p>
                            <p className="text-xs text-gray-700 mt-2">Connect to a server to see the full player manifest.</p>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'roster' && (
                <div className="space-y-6">
                    {/* Highlights Section */}
                    {highlights && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {highlights.topGun && (
                                <div className="bg-gradient-to-br from-[#111] to-[#1a1a1a] border border-gray-800 p-6 rounded-lg relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Trophy size={64} />
                                    </div>
                                    <div className="relative z-10">
                                        <h3 className="text-[#ff6600] text-xs font-bold uppercase mb-2 flex items-center gap-2 group cursor-help" title={`Pilot with highest KDA Ratio (Min ${Math.max(minGamesThreshold > 1 ? minGamesThreshold : 25, 25)} games)`}>
                                            <Trophy size={14} /> Top Gun (Highest KDA) <Info size={10} className="text-gray-600 group-hover:text-[#ff6600]" />
                                        </h3>
                                        <div className="text-2xl font-bold text-white mb-1">{highlights.topGun.name}</div>
                                        <div className="text-sm text-gray-400 font-mono">
                                            <span className="text-[#ff6600] font-bold">{highlights.topGun.kda.toFixed(2)}</span> KDA / {highlights.topGun.games} Games
                                        </div>
                                    </div>
                                </div>
                            )}
                            {highlights.mostActive && (
                                <div className="bg-gradient-to-br from-[#111] to-[#1a1a1a] border border-gray-800 p-6 rounded-lg relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <TrendingUp size={64} />
                                    </div>
                                    <div className="relative z-10">
                                        <h3 className="text-blue-400 text-xs font-bold uppercase mb-2 flex items-center gap-2 group cursor-help" title="Pilot with most games played">
                                            <TrendingUp size={14} /> Enforcer (Most Active) <Info size={10} className="text-gray-600 group-hover:text-blue-400" />
                                        </h3>
                                        <div className="text-2xl font-bold text-white mb-1">{highlights.mostActive.name}</div>
                                        <div className="text-sm text-gray-400 font-mono">
                                            <span className="text-blue-400 font-bold">{highlights.mostActive.games}</span> Matches Played
                                        </div>
                                    </div>
                                </div>
                            )}
                            {highlights.slayer && (
                                <div className="bg-gradient-to-br from-[#111] to-[#1a1a1a] border border-gray-800 p-6 rounded-lg relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Skull size={64} />
                                    </div>
                                    <div className="relative z-10">
                                        <h3 className="text-red-400 text-xs font-bold uppercase mb-2 flex items-center gap-2 group cursor-help" title="Pilot with highest total kills">
                                            <Skull size={14} /> Slayer (Most Kills) <Info size={10} className="text-gray-600 group-hover:text-red-400" />
                                        </h3>
                                        <div className="text-2xl font-bold text-white mb-1">{highlights.slayer.name}</div>
                                        <div className="text-sm text-gray-400 font-mono">
                                            <span className="text-red-400 font-bold">{highlights.slayer.kills}</span> Total Confirmed Kills
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="bg-[#111] border border-gray-800 rounded overflow-hidden">
                        <div className="p-4 border-b border-gray-800 bg-[#161616] flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-white font-bold text-sm uppercase tracking-wider">Pilot Roster</h3>
                                    <span className="text-xs text-gray-400 font-mono bg-gray-800/80 px-2 py-0.5 rounded border border-gray-700">
                                        {searchTerm.trim() ? `${sortedRoster.length} matches` : `${sortedRoster.length} pilots`}
                                    </span>
                                </div>

                                {/* Qualification Threshold Pills */}
                                <div className="flex items-center gap-1 bg-[#0a0a0a] border border-gray-700 rounded p-1 text-xs">
                                    <span className="text-[10px] uppercase font-bold text-gray-400 px-2 flex items-center gap-1">
                                        <Trophy size={11} className="text-[#ff6600]" /> Min Matches:
                                    </span>
                                    {[
                                        { label: '50+ (QUALIFIED)', value: 50 },
                                        { label: '25+', value: 25 },
                                        { label: '10+', value: 10 },
                                        { label: 'ALL (1+)', value: 1 }
                                    ].map(tier => (
                                        <button
                                            key={tier.value}
                                            onClick={() => setMinGamesThreshold(tier.value)}
                                            className={`px-2.5 py-1 text-xs font-bold rounded transition-all ${
                                                minGamesThreshold === tier.value
                                                    ? 'bg-[#ff6600] text-black shadow font-extrabold'
                                                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                            }`}
                                        >
                                            {tier.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Timeframe Toggle */}
                                <div className="flex items-center gap-1 bg-[#0a0a0a] border border-gray-700 rounded p-1 text-xs">
                                    <button
                                        onClick={() => setActiveOnly(false)}
                                        className={`px-3 py-1 text-xs font-bold rounded transition-colors ${!activeOnly ? 'bg-blue-900/60 text-blue-200 border border-blue-500/40' : 'text-gray-400 hover:text-white'}`}
                                    >
                                        ALL TIME
                                    </button>
                                    <button
                                        onClick={() => setActiveOnly(true)}
                                        className={`px-3 py-1 text-xs font-bold rounded transition-colors ${activeOnly ? 'bg-blue-900/60 text-blue-200 border border-blue-500/40' : 'text-gray-400 hover:text-white'}`}
                                    >
                                        ACTIVE (90d)
                                    </button>
                                </div>
                            </div>

                            {/* Search Box with Clear & Override indicator */}
                            <div className="flex items-center gap-2 w-full xl:w-auto">
                                <div className="relative flex-1 xl:w-64">
                                    <input
                                        type="text"
                                        placeholder={`Search all ${pilotRoster.length > 0 ? pilotRoster.length.toLocaleString() : '4,510'} pilots...`}
                                        className="bg-[#0a0a0a] border border-gray-700 text-white text-xs px-3 py-2 pl-9 pr-7 rounded w-full focus:border-[#ff6600] outline-none font-mono"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                    {searchTerm && (
                                        <button
                                            onClick={() => setSearchTerm('')}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs"
                                        >
                                            <X size={12} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Search Override Notice */}
                        {searchTerm.trim() && (
                            <div className="px-4 py-1.5 bg-blue-950/30 border-b border-blue-900/30 text-[11px] text-blue-300 font-mono flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                    <Info size={12} className="text-blue-400" />
                                    <span>Sample size threshold bypassed &mdash; searching across all {pilotRoster.length.toLocaleString()} pilots.</span>
                                </span>
                                <button onClick={() => setSearchTerm('')} className="underline hover:text-white text-blue-400">
                                    Clear Search
                                </button>
                            </div>
                        )}

                        {loadingRoster ? (
                            <div className="p-12 text-center text-gray-500 font-mono animate-pulse">Loading pilot data...</div>
                        ) : sortedRoster.length === 0 ? (
                            <div className="p-12 text-center text-gray-500 font-mono space-y-2">
                                <p className="text-sm font-bold text-gray-400">No pilots match current filters</p>
                                <p className="text-xs text-gray-600">Try selecting a lower matches threshold or switching to All Time.</p>
                                <button
                                    onClick={() => { setMinGamesThreshold(1); setActiveOnly(false); setSearchTerm(''); }}
                                    className="text-xs text-[#ff6600] underline hover:text-orange-400 mt-2 inline-block font-bold"
                                >
                                    Reset Filters
                                </button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm font-mono">
                                    <thead className="bg-[#1a1a1a] text-gray-500 text-xs uppercase">
                                        <tr>
                                            <th className="p-3 text-center w-12">#</th>
                                            <th className="p-3 cursor-pointer hover:text-white" onClick={() => handleSort('name')}>Pilot {sortConfig.key === 'name' && (sortConfig.direction === 'desc' ? '↓' : '↑')}</th>
                                            <th className="p-3 text-right cursor-pointer hover:text-white" onClick={() => handleSort('games')}>Matches {sortConfig.key === 'games' && (sortConfig.direction === 'desc' ? '↓' : '↑')}</th>
                                            <th className="p-3 text-right cursor-pointer hover:text-white" onClick={() => handleSort('win_rate')}>Win Rate {sortConfig.key === 'win_rate' && (sortConfig.direction === 'desc' ? '↓' : '↑')}</th>
                                            <th className="p-3 text-right cursor-pointer hover:text-white" onClick={() => handleSort('kd')}>Combat Ratio {sortConfig.key === 'kd' && (sortConfig.direction === 'desc' ? '↓' : '↑')}</th>
                                            <th className="p-3 text-right text-gray-600">Breakdown (K / A / D)</th>
                                            <th className="p-3 text-right cursor-pointer hover:text-white" onClick={() => handleSort('lastSeen')}>Last Seen {sortConfig.key === 'lastSeen' && (sortConfig.direction === 'desc' ? '↓' : '↑')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800">
                                        {sortedRoster.map((pilot, index) => (
                                            <tr
                                                key={pilot.name}
                                                className="hover:bg-[#1a1a1a] cursor-pointer group transition-colors"
                                                onClick={() => onNavigate('pilot', pilot.name)}
                                            >
                                                <td className="p-3 text-center text-gray-600 font-bold">{index + 1}</td>
                                                <td className="p-3 font-bold text-white">
                                                    <div className="flex items-center gap-2">
                                                        <User size={14} className="text-gray-600" />
                                                        {pilot.name}
                                                    </div>
                                                </td>
                                                <td className="p-3 text-right text-gray-400">{pilot.games}</td>
                                                <td className="p-3 text-right">
                                                    <div className="font-bold text-emerald-400 text-sm">
                                                        {pilot.win_rate !== undefined ? `${pilot.win_rate.toFixed(1)}%` : '—'}
                                                    </div>
                                                    {pilot.wins !== undefined && (
                                                        <div className="text-[10px] text-gray-500 font-mono">
                                                            {pilot.wins}W - {pilot.losses}L
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-3 text-right">
                                                    <div className="font-bold text-[#ff6600] text-base">{pilot.kda.toFixed(2)} <span className="text-xs text-gray-500 font-normal">KDA</span></div>
                                                    <div className="text-xs text-gray-400 font-mono">{pilot.kd.toFixed(2)} K/D</div>
                                                </td>
                                                <td className="p-3 text-right">
                                                    <div className="text-xs text-gray-400">
                                                        <span className="text-gray-300 font-bold">{pilot.kills.toLocaleString()}</span> K <span className="text-gray-600">/</span> <span className="text-gray-300">{pilot.assists.toLocaleString()}</span> A <span className="text-gray-600">/</span> <span className="text-red-400">{pilot.deaths.toLocaleString()}</span> D
                                                    </div>
                                                </td>
                                                <td className="p-3 text-right text-gray-500 text-xs">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Calendar size={12} />
                                                        {pilot.lastSeen.toLocaleDateString()}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
};

export default PilotsList;
