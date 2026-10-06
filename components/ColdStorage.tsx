import React, { useState, useEffect, useMemo } from 'react';
import { 
    Search, Database, Calendar, Server, User, ArrowRight, Trophy, Map as MapIcon, 
    Crosshair, Activity, Clock, Flame, Zap, Award, Skull, Moon, Shield, BarChart3, 
    TrendingUp, HardDrive, Filter, X, ChevronRight, Hash, Eye, Sparkles
} from 'lucide-react';
import { fetchColdGames } from '../services/apiService';
import { getMapImage } from '../services/mapService';

interface ColdStorageProps {
    onNavigate: (view: string, params?: any) => void;
}

const DeepStatCard: React.FC<{
    title: string;
    value: React.ReactNode;
    subtitle?: string;
    icon: React.ReactNode;
    color?: string;
    onClick?: () => void;
}> = ({ title, value, subtitle, icon, color = 'text-blue-500', onClick }) => (
    <div
        onClick={onClick}
        className={`bg-[#111] border border-gray-800 p-4 rounded-lg relative overflow-hidden group transition-all duration-200 ${
            onClick ? 'cursor-pointer hover:border-blue-500/60 hover:bg-[#151515] hover:shadow-lg' : ''
        }`}
    >
        <div className={`absolute top-3 right-3 opacity-15 ${color} group-hover:opacity-35 transition-opacity`}>
            {icon}
        </div>
        <div className="relative z-10">
            <h3 className="text-gray-500 text-[11px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                {title}
            </h3>
            <div className="text-xl md:text-2xl font-bold text-white font-mono mb-1 truncate">{value}</div>
            {subtitle && <div className="text-[11px] text-gray-500 font-mono truncate">{subtitle}</div>}
        </div>
    </div>
);

const ColdStorage: React.FC<ColdStorageProps> = ({ onNavigate }) => {
    const [deepStats, setDeepStats] = useState<any>(null);
    const [pilotRoster, setPilotRoster] = useState<any[]>([]);
    const [topMaps, setTopMaps] = useState<any[]>([]);
    const [loadingStats, setLoadingStats] = useState(true);

    // Hall of Fame Category
    const [hallCategory, setHallCategory] = useState<'kills' | 'games' | 'kd' | 'damage' | 'win_rate'>('kills');

    // Archive Browser State
    const [games, setGames] = useState<any[]>([]);
    const [gamesTotalCount, setGamesTotalCount] = useState(0);
    const [loadingGames, setLoadingGames] = useState(true);
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [selectedYear, setSelectedYear] = useState<string>('ALL');
    const [page, setPage] = useState(1);

    // Initial Load of Deep Stats, Pilots & Maps
    useEffect(() => {
        setLoadingStats(true);
        Promise.all([
            fetch('/api/stats/cold/deep').then(res => res.json()),
            fetch('/api/stats/pilots?source=all').then(res => res.json()),
            fetch('/api/stats/maps?source=all').then(res => res.json())
        ]).then(([deepData, pilotsData, mapsData]) => {
            setDeepStats(deepData);
            if (Array.isArray(pilotsData)) {
                setPilotRoster(pilotsData);
            }
            if (mapsData?.topPlayed) {
                setTopMaps(mapsData.topPlayed);
            } else if (deepData?.top_maps) {
                setTopMaps(deepData.top_maps);
            }
            setLoadingStats(false);
        }).catch(err => {
            console.error("Failed to load cold deep stats", err);
            setLoadingStats(false);
        });
    }, []);

    // Load Games whenever page, search, or selectedYear changes
    useEffect(() => {
        loadGames();
    }, [page, search, selectedYear]);

    const loadGames = async () => {
        setLoadingGames(true);
        try {
            let effectiveSearch = search.trim();
            if (selectedYear !== 'ALL') {
                effectiveSearch = effectiveSearch ? `${selectedYear} ${effectiveSearch}` : selectedYear;
            }

            const gamesData = await fetchColdGames(page, effectiveSearch);
            setGames(gamesData.games || []);
            setGamesTotalCount(gamesData.count || 0);
        } catch (error) {
            console.error("Failed to load cold storage games", error);
        }
        setLoadingGames(false);
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        setSearch(searchInput);
    };

    const handleClearSearch = () => {
        setSearchInput('');
        setSearch('');
        setPage(1);
    };

    const handleYearFilter = (year: string) => {
        setSelectedYear(year);
        setPage(1);
    };

    // Filtered & Sorted Hall of Fame Pilots (requiring min 50 games for genuine competitive ranking)
    const hallOfFamePilots = useMemo(() => {
        if (!pilotRoster || pilotRoster.length === 0) return [];

        const qualified = pilotRoster.filter(p => (p.games || 0) >= 50);

        return [...qualified].sort((a, b) => {
            if (hallCategory === 'kills') return (b.kills || 0) - (a.kills || 0);
            if (hallCategory === 'games') return (b.games || 0) - (a.games || 0);
            if (hallCategory === 'kd') return (b.kd || 0) - (a.kd || 0);
            if (hallCategory === 'damage') return (b.total_damage || 0) - (a.total_damage || 0);
            if (hallCategory === 'win_rate') return (b.win_rate || 0) - (a.win_rate || 0);
            return 0;
        }).slice(0, 10);
    }, [pilotRoster, hallCategory]);

    const formatDuration = (seconds: number) => {
        if (!seconds) return '-';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) return `${hours.toLocaleString()}h ${minutes}m`;
        return `${minutes}m ${seconds % 60}s`;
    };

    const formatLargeNumber = (num: number) => {
        if (!num) return '0';
        if (num >= 1000000000) return `${(num / 1000000000).toFixed(2)}B`;
        if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
        return num.toLocaleString();
    };

    return (
        <div className="min-h-screen bg-[#050505] text-gray-300 font-sans selection:bg-[#ff6600] selection:text-white pb-24">
            <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
                
                {/* --- HEADER & ARCHIVE METADATA STRIP --- */}
                <div className="border-b border-gray-800 pb-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-950/40 border border-blue-800/60 rounded-xl shadow-inner shadow-blue-500/10">
                                <Database className="text-blue-400 w-7 h-7" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-3xl font-black text-white tracking-tight">Cold Storage Archive</h1>
                                    <span className="text-[10px] font-mono font-bold bg-blue-900/40 text-blue-300 border border-blue-700/50 px-2 py-0.5 rounded uppercase">
                                        Active Archive
                                    </span>
                                </div>
                                <p className="text-gray-400 font-mono text-xs mt-0.5">
                                    ARCHIVAL DEEP INTELLIGENCE & HISTORICAL COMBAT TELEMETRY
                                </p>
                            </div>
                        </div>

                        {/* Tactical Metadata Badges */}
                        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                            <div className="bg-[#111] border border-gray-800 px-3 py-1.5 rounded flex items-center gap-2 text-gray-300">
                                <HardDrive size={13} className="text-blue-400" />
                                <span>{deepStats?.storage?.total_gb ? `${deepStats.storage.total_gb} GB Telemetry` : '2.76 GB Archive'}</span>
                            </div>
                            <div className="bg-[#111] border border-gray-800 px-3 py-1.5 rounded flex items-center gap-2 text-gray-300">
                                <Calendar size={13} className="text-emerald-400" />
                                <span>Jul 2019 – Present (7.2 yrs)</span>
                            </div>
                            <div className="bg-[#111] border border-gray-800 px-3 py-1.5 rounded flex items-center gap-2 text-gray-300">
                                <Server size={13} className="text-purple-400" />
                                <span>{deepStats?.unique_servers || 294} Dedicated Nodes</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- 1. CORE ARCHIVAL TELEMETRY GRID (10 WIDGETS) --- */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xs font-bold font-mono uppercase tracking-widest text-gray-400 flex items-center gap-2">
                            <BarChart3 size={14} className="text-blue-500" /> Global Archival Telemetry
                        </h2>
                        {deepStats?.last_calculated && (
                            <span className="text-[10px] font-mono text-gray-600">
                                Cache synced: {new Date(deepStats.last_calculated).toLocaleTimeString()}
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <DeepStatCard
                            title="Total Matches"
                            value={deepStats?.total_games ? deepStats.total_games.toLocaleString() : '75,820'}
                            subtitle="Matched combat matches"
                            icon={<Database size={28} />}
                            color="text-blue-400"
                        />
                        <DeepStatCard
                            title="Combat Flight Time"
                            value={deepStats?.total_flight_hours ? `${Math.round(deepStats.total_flight_hours).toLocaleString()}h` : '84,636h'}
                            subtitle="~9.66 continuous years"
                            icon={<Clock size={28} />}
                            color="text-emerald-400"
                        />
                        <DeepStatCard
                            title="Confirmed Frags"
                            value={deepStats?.total_kills ? formatLargeNumber(deepStats.total_kills) : '9.18M'}
                            subtitle={deepStats?.total_kills ? `${deepStats.total_kills.toLocaleString()} kills` : 'All-time eliminations'}
                            icon={<Skull size={28} />}
                            color="text-red-400"
                        />
                        <DeepStatCard
                            title="Total Damage"
                            value={deepStats?.total_damage ? formatLargeNumber(deepStats.total_damage) : '1.21B'}
                            subtitle="Kinetic & energy dealt"
                            icon={<Zap size={28} />}
                            color="text-[#ff6600]"
                        />
                        <DeepStatCard
                            title="Combat Aviators"
                            value={deepStats?.unique_pilots ? deepStats.unique_pilots.toLocaleString() : '4,510'}
                            subtitle="Registered callsigns"
                            icon={<User size={28} />}
                            color="text-yellow-400"
                        />
                        <DeepStatCard
                            title="Host Nodes"
                            value={deepStats?.unique_servers ? deepStats.unique_servers.toLocaleString() : '294'}
                            subtitle="Global community servers"
                            icon={<Server size={28} />}
                            color="text-purple-400"
                        />
                        <DeepStatCard
                            title="Combat Arenas"
                            value={deepStats?.unique_maps ? `${deepStats.unique_maps} Arenas` : '438 Maps'}
                            subtitle="Custom maps cataloged"
                            icon={<MapIcon size={28} />}
                            color="text-cyan-400"
                        />
                        <DeepStatCard
                            title="Dominant Mode"
                            value={deepStats?.most_popular_mode?.mode || 'ANARCHY'}
                            subtitle={deepStats?.most_popular_mode?.count ? `${deepStats.most_popular_mode.count.toLocaleString()} matches (81.3%)` : 'FFA dogfights'}
                            icon={<Crosshair size={28} />}
                            color="text-pink-400"
                        />
                        <DeepStatCard
                            title="Graveyard Shift"
                            value={deepStats?.graveyard_shift_count ? deepStats.graveyard_shift_count.toLocaleString() : '-'}
                            subtitle="Matches fought 2AM–5AM"
                            icon={<Moon size={28} />}
                            color="text-indigo-400"
                        />
                        <DeepStatCard
                            title="Physical Archive"
                            value={deepStats?.storage?.total_gb ? `${deepStats.storage.total_gb} GB` : '2.76 GB'}
                            subtitle={deepStats?.storage?.cold_db_mb ? `Cold: ${(deepStats.storage.cold_db_mb / 1024).toFixed(2)}GB` : 'High-density SQLite'}
                            icon={<HardDrive size={28} />}
                            color="text-gray-400"
                        />
                    </div>
                </div>

                {/* --- 2. HALL OF RECORDS (CLICKABLE RECORD-BREAKER MATCHES) --- */}
                <div className="space-y-3">
                    <h2 className="text-xs font-bold font-mono uppercase tracking-widest text-gray-400 flex items-center gap-2">
                        <Trophy size={14} className="text-yellow-500" /> Hall of Records & Extreme Matches
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* 1. Bloodiest Battle */}
                        <div 
                            onClick={() => deepStats?.records?.bloodiest_match?.id && onNavigate('game-detail', deepStats.records.bloodiest_match.id.toString())}
                            className="bg-gradient-to-br from-[#131111] to-[#1a1111] border border-red-900/40 hover:border-red-500/70 p-5 rounded-xl cursor-pointer transition-all group relative overflow-hidden shadow-lg"
                        >
                            <div className="absolute top-2 right-2 opacity-10 group-hover:opacity-20 transition-opacity text-red-500">
                                <Skull size={80} />
                            </div>
                            <div className="relative z-10">
                                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-red-400 bg-red-950/60 border border-red-800/40 px-2 py-0.5 rounded">
                                    All-Time Frag Record
                                </span>
                                <h3 className="text-white font-bold text-base mt-2 flex items-center gap-1.5">
                                    Bloodiest Match
                                </h3>
                                <div className="text-2xl font-black font-mono text-red-400 mt-1">
                                    {deepStats?.records?.bloodiest_match?.kills ? `${deepStats.records.bloodiest_match.kills.toLocaleString()} Frags` : '1,507 Frags'}
                                </div>
                                <div className="text-xs font-mono text-gray-400 mt-2 space-y-0.5">
                                    <div className="text-gray-300 font-bold truncate">
                                        {deepStats?.records?.bloodiest_match?.map || 'REVENGE OF THE GOBLINS'}
                                    </div>
                                    <div className="text-[11px] text-gray-500">
                                        Match #{deepStats?.records?.bloodiest_match?.id || '49973'} • {deepStats?.records?.bloodiest_match?.players || 16} Pilots
                                    </div>
                                </div>
                                <div className="mt-4 pt-3 border-t border-red-950/60 flex items-center justify-between text-xs font-mono text-red-300 group-hover:text-white transition-colors">
                                    <span>Inspect Match</span>
                                    <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </div>

                        {/* 2. Single-Pilot Frag Record */}
                        <div 
                            onClick={() => deepStats?.records?.max_single_pilot_frags?.id && onNavigate('game-detail', deepStats.records.max_single_pilot_frags.id.toString())}
                            className="bg-gradient-to-br from-[#131311] to-[#1a1811] border border-amber-900/40 hover:border-amber-500/70 p-5 rounded-xl cursor-pointer transition-all group relative overflow-hidden shadow-lg"
                        >
                            <div className="absolute top-2 right-2 opacity-10 group-hover:opacity-20 transition-opacity text-amber-500">
                                <Award size={80} />
                            </div>
                            <div className="relative z-10">
                                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-950/60 border border-amber-800/40 px-2 py-0.5 rounded">
                                    Single-Pilot Record
                                </span>
                                <h3 className="text-white font-bold text-base mt-2 flex items-center gap-1.5">
                                    Ace Frag World Record
                                </h3>
                                <div className="text-2xl font-black font-mono text-amber-400 mt-1">
                                    {deepStats?.records?.max_single_pilot_frags?.kills ? `${deepStats.records.max_single_pilot_frags.kills} Frags` : '399 Frags'}
                                </div>
                                <div className="text-xs font-mono text-gray-400 mt-2 space-y-0.5">
                                    <div className="text-amber-300 font-bold truncate">
                                        {deepStats?.records?.max_single_pilot_frags?.pilot || 'BEHEMOTH'}
                                    </div>
                                    <div className="text-[11px] text-gray-500 truncate">
                                        {deepStats?.records?.max_single_pilot_frags?.map || 'SUB ROSA V4'} • Match #{deepStats?.records?.max_single_pilot_frags?.id || '69787'}
                                    </div>
                                </div>
                                <div className="mt-4 pt-3 border-t border-amber-950/60 flex items-center justify-between text-xs font-mono text-amber-300 group-hover:text-white transition-colors">
                                    <span>Inspect Match</span>
                                    <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </div>

                        {/* 3. Endurance Marathon */}
                        <div 
                            onClick={() => deepStats?.records?.longest_match?.id && onNavigate('game-detail', deepStats.records.longest_match.id.toString())}
                            className="bg-gradient-to-br from-[#111218] to-[#121622] border border-blue-900/40 hover:border-blue-500/70 p-5 rounded-xl cursor-pointer transition-all group relative overflow-hidden shadow-lg"
                        >
                            <div className="absolute top-2 right-2 opacity-10 group-hover:opacity-20 transition-opacity text-blue-500">
                                <Clock size={80} />
                            </div>
                            <div className="relative z-10">
                                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-400 bg-blue-950/60 border border-blue-800/40 px-2 py-0.5 rounded">
                                    Longest Match
                                </span>
                                <h3 className="text-white font-bold text-base mt-2 flex items-center gap-1.5">
                                    Endurance Marathon
                                </h3>
                                <div className="text-2xl font-black font-mono text-blue-400 mt-1">
                                    {deepStats?.records?.longest_match?.duration ? formatDuration(deepStats.records.longest_match.duration) : '16h 40m'}
                                </div>
                                <div className="text-xs font-mono text-gray-400 mt-2 space-y-0.5">
                                    <div className="text-gray-300 font-bold truncate">
                                        {deepStats?.records?.longest_match?.map || 'BLIZZARD'}
                                    </div>
                                    <div className="text-[11px] text-gray-500">
                                        Match #{deepStats?.records?.longest_match?.id || '71163'} • Non-stop dogfight
                                    </div>
                                </div>
                                <div className="mt-4 pt-3 border-t border-blue-950/60 flex items-center justify-between text-xs font-mono text-blue-300 group-hover:text-white transition-colors">
                                    <span>Inspect Match</span>
                                    <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </div>

                        {/* 4. Most Attended Match */}
                        <div 
                            onClick={() => deepStats?.records?.most_attended_match?.id && onNavigate('game-detail', deepStats.records.most_attended_match.id.toString())}
                            className="bg-gradient-to-br from-[#121118] to-[#181224] border border-purple-900/40 hover:border-purple-500/70 p-5 rounded-xl cursor-pointer transition-all group relative overflow-hidden shadow-lg"
                        >
                            <div className="absolute top-2 right-2 opacity-10 group-hover:opacity-20 transition-opacity text-purple-500">
                                <User size={80} />
                            </div>
                            <div className="relative z-10">
                                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-400 bg-purple-950/60 border border-purple-800/40 px-2 py-0.5 rounded">
                                    Peak Attendance
                                </span>
                                <h3 className="text-white font-bold text-base mt-2 flex items-center gap-1.5">
                                    Mass Anarchy Brawl
                                </h3>
                                <div className="text-2xl font-black font-mono text-purple-400 mt-1">
                                    {deepStats?.records?.most_attended_match?.count ? `${deepStats.records.most_attended_match.count} Pilots` : '19 Pilots'}
                                </div>
                                <div className="text-xs font-mono text-gray-400 mt-2 space-y-0.5">
                                    <div className="text-gray-300 font-bold truncate">
                                        {deepStats?.records?.most_attended_match?.map || 'KRADENKO'}
                                    </div>
                                    <div className="text-[11px] text-gray-500">
                                        Match #{deepStats?.records?.most_attended_match?.id || '11513'} • Anarchy chaos
                                    </div>
                                </div>
                                <div className="mt-4 pt-3 border-t border-purple-950/60 flex items-center justify-between text-xs font-mono text-purple-300 group-hover:text-white transition-colors">
                                    <span>Inspect Match</span>
                                    <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- 3. MULTI-YEAR TIMELINE & HISTORICAL EPOCHS --- */}
                <div className="bg-[#111] border border-gray-800 rounded-xl p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                        <div>
                            <h2 className="text-base font-bold text-white flex items-center gap-2">
                                <Calendar size={18} className="text-blue-400" /> Historical Activity Curve (2019 – 2026)
                            </h2>
                            <p className="text-xs text-gray-500 font-mono mt-0.5">
                                Match distribution across all 7+ community eras. Click any year to filter the archive below.
                            </p>
                        </div>
                        <div className="text-xs font-mono text-gray-400 bg-gray-900 px-3 py-1 rounded border border-gray-800 self-start sm:self-auto">
                            Peak Golden Era: <span className="text-[#ff6600] font-bold">2020 (20,711 Matches)</span>
                        </div>
                    </div>

                    {deepStats?.yearly && deepStats.yearly.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                            {deepStats.yearly.map((item: any) => {
                                const maxCount = 20711;
                                const pct = Math.max(8, Math.round((item.count / maxCount) * 100));
                                const isSelected = selectedYear === item.year;

                                return (
                                    <button
                                        key={item.year}
                                        onClick={() => handleYearFilter(isSelected ? 'ALL' : item.year)}
                                        className={`p-3 rounded-lg border text-left transition-all group flex flex-col justify-between h-32 ${
                                            isSelected 
                                                ? 'bg-blue-950/50 border-blue-500 shadow-md shadow-blue-500/10' 
                                                : 'bg-[#151515] border-gray-800 hover:border-gray-700 hover:bg-[#1a1a1a]'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between w-full">
                                            <span className={`font-mono text-sm font-black ${isSelected ? 'text-blue-400' : 'text-white'}`}>
                                                {item.year}
                                            </span>
                                            {item.year === '2020' && (
                                                <span className="text-[9px] bg-amber-950/80 text-amber-300 px-1.5 py-0.5 rounded border border-amber-800/40 font-bold">
                                                    Peak
                                                </span>
                                            )}
                                        </div>

                                        <div className="my-auto">
                                            <div className="text-base font-bold font-mono text-gray-200">
                                                {item.count.toLocaleString()}
                                            </div>
                                            <div className="text-[10px] text-gray-500 font-mono">
                                                {((item.count / (deepStats?.total_games || 75820)) * 100).toFixed(1)}% of total
                                            </div>
                                        </div>

                                        {/* Activity Bar */}
                                        <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full transition-all ${
                                                    isSelected ? 'bg-blue-400' : item.year === '2020' ? 'bg-[#ff6600]' : 'bg-gray-500 group-hover:bg-blue-400'
                                                }`} 
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="h-24 flex items-center justify-center text-gray-600 font-mono text-xs">
                            Loading timeline data...
                        </div>
                    )}
                </div>

                {/* --- 4. HALL OF FAME: PILOTS & MAPS --- */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Top Pilots with Category Switcher */}
                    <div className="bg-[#111] border border-gray-800 rounded-xl overflow-hidden flex flex-col h-[480px]">
                        <div className="p-4 border-b border-gray-800 bg-[#161616] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <Trophy size={16} className="text-yellow-500" />
                                <h3 className="text-white font-bold text-sm uppercase">Hall of Fame: Pilots</h3>
                                <span className="text-[10px] text-gray-500 font-mono">(50+ matches)</span>
                            </div>

                            {/* Category Selector Pills */}
                            <div className="flex items-center gap-1 bg-[#0a0a0a] border border-gray-800 rounded p-1 text-[11px] font-mono">
                                {[
                                    { key: 'kills', label: 'FRAGS' },
                                    { key: 'games', label: 'MATCHES' },
                                    { key: 'kd', label: 'K/D' },
                                    { key: 'damage', label: 'DAMAGE' },
                                    { key: 'win_rate', label: 'WIN %' }
                                ].map(cat => (
                                    <button
                                        key={cat.key}
                                        onClick={() => setHallCategory(cat.key as any)}
                                        className={`px-2 py-0.5 rounded font-bold transition-all ${
                                            hallCategory === cat.key
                                                ? 'bg-[#ff6600] text-black shadow-sm'
                                                : 'text-gray-400 hover:text-white'
                                        }`}
                                    >
                                        {cat.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="overflow-y-auto flex-1 custom-scrollbar">
                            <table className="w-full text-left text-xs font-mono">
                                <thead className="bg-[#1a1a1a] text-gray-500 uppercase sticky top-0 z-10 text-[10px]">
                                    <tr>
                                        <th className="p-3 w-10 text-center">#</th>
                                        <th className="p-3">Pilot</th>
                                        <th className="p-3 text-right">Matches</th>
                                        <th className="p-3 text-right">
                                            {hallCategory === 'kills' && 'Total Frags'}
                                            {hallCategory === 'games' && 'Matches Played'}
                                            {hallCategory === 'kd' && 'Combat Ratio (K/D)'}
                                            {hallCategory === 'damage' && 'Total Damage'}
                                            {hallCategory === 'win_rate' && 'Win Rate'}
                                        </th>
                                        <th className="p-3 text-right text-gray-500">Combat Record</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {hallOfFamePilots.map((pilot, idx) => (
                                        <tr 
                                            key={pilot.name} 
                                            onClick={() => onNavigate('pilot', pilot.name)}
                                            className="hover:bg-[#181818] cursor-pointer group transition-colors"
                                        >
                                            <td className="p-3 text-center text-gray-600 font-bold">
                                                {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                                            </td>
                                            <td className="p-3 font-bold text-white group-hover:text-[#ff6600] transition-colors">
                                                {pilot.name}
                                            </td>
                                            <td className="p-3 text-right text-gray-400">
                                                {pilot.games?.toLocaleString()}
                                            </td>
                                            <td className="p-3 text-right font-bold text-white">
                                                {hallCategory === 'kills' && (
                                                    <span className="text-red-400">{pilot.kills?.toLocaleString()}</span>
                                                )}
                                                {hallCategory === 'games' && (
                                                    <span className="text-blue-400">{pilot.games?.toLocaleString()}</span>
                                                )}
                                                {hallCategory === 'kd' && (
                                                    <span className="text-[#ff6600]">{(pilot.kd || (pilot.kills / Math.max(1, pilot.deaths))).toFixed(2)}</span>
                                                )}
                                                {hallCategory === 'damage' && (
                                                    <span className="text-emerald-400">{formatLargeNumber(pilot.total_damage || 0)}</span>
                                                )}
                                                {hallCategory === 'win_rate' && (
                                                    <span className="text-emerald-400">{(pilot.win_rate || 0).toFixed(1)}%</span>
                                                )}
                                            </td>
                                            <td className="p-3 text-right text-gray-500 text-[11px]">
                                                {pilot.wins !== undefined ? `${pilot.wins}W - ${pilot.losses}L` : `${pilot.kills}K / ${pilot.deaths}D`}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Top Maps */}
                    <div className="bg-[#111] border border-gray-800 rounded-xl overflow-hidden flex flex-col h-[480px]">
                        <div className="p-4 border-b border-gray-800 bg-[#161616] flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <MapIcon size={16} className="text-blue-400" />
                                <h3 className="text-white font-bold text-sm uppercase">Hall of Fame: Maps</h3>
                            </div>
                            <span className="text-[10px] text-gray-500 font-mono">
                                438 total custom arenas
                            </span>
                        </div>

                        <div className="overflow-y-auto flex-1 custom-scrollbar">
                            <table className="w-full text-left text-xs font-mono">
                                <thead className="bg-[#1a1a1a] text-gray-500 uppercase sticky top-0 z-10 text-[10px]">
                                    <tr>
                                        <th className="p-3 w-10 text-center">#</th>
                                        <th className="p-3">Arena Level</th>
                                        <th className="p-3 text-right">Matches</th>
                                        <th className="p-3 text-right">Share</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {topMaps.slice(0, 10).map((mapItem, idx) => {
                                        const totalAll = deepStats?.total_games || 75820;
                                        const share = ((mapItem.count / totalAll) * 100).toFixed(1);

                                        return (
                                            <tr key={mapItem.map} className="hover:bg-[#181818] transition-colors">
                                                <td className="p-3 text-center text-gray-600 font-bold">
                                                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                                                </td>
                                                <td className="p-3 font-bold text-white flex items-center gap-2.5">
                                                    <div 
                                                        className="w-7 h-7 bg-gray-800 rounded bg-cover bg-center border border-gray-700 shrink-0" 
                                                        style={{ backgroundImage: `url(${getMapImage(mapItem.map)})` }}
                                                    />
                                                    <span className="truncate">{mapItem.map}</span>
                                                </td>
                                                <td className="p-3 text-right text-gray-300 font-bold">
                                                    {mapItem.count?.toLocaleString()}
                                                </td>
                                                <td className="p-3 text-right text-gray-500 text-[11px]">
                                                    {share}%
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* --- 5. ARCHIVE BROWSER WITH QUICK FILTERS --- */}
                <div className="bg-[#0e0e0e] border border-gray-800 rounded-xl p-6 space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Database className="text-blue-400" />
                                Archival Match Browser
                            </h2>
                            <p className="text-xs text-gray-500 font-mono mt-0.5">
                                Search individual matches across all 70,500+ archived historical flight records.
                            </p>
                        </div>

                        {/* Search Bar */}
                        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                            <input
                                type="text"
                                placeholder="Search by ID, Map, Server, Pilot, Year..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                className="w-full bg-[#151515] border border-gray-700 text-white pl-10 pr-9 py-2 rounded-lg text-xs focus:border-blue-500 focus:outline-none font-mono"
                            />
                            {searchInput && (
                                <button
                                    type="button"
                                    onClick={handleClearSearch}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </form>
                    </div>

                    {/* Filter Pills: Years */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
                        <span className="text-[10px] uppercase font-bold text-gray-500 mr-1 flex items-center gap-1">
                            <Calendar size={12} className="text-blue-400" /> Epoch:
                        </span>
                        {['ALL', '2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019'].map(yr => (
                            <button
                                key={yr}
                                onClick={() => handleYearFilter(yr)}
                                className={`px-2.5 py-1 rounded transition-all text-xs font-bold ${
                                    selectedYear === yr
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'bg-[#151515] text-gray-400 hover:text-white border border-gray-800'
                                }`}
                            >
                                {yr}
                            </button>
                        ))}
                    </div>

                    {/* Match List */}
                    <div className="space-y-2">
                        {loadingGames ? (
                            <div className="text-center py-16 text-gray-500 font-mono animate-pulse space-y-2">
                                <Database size={32} className="mx-auto text-blue-500 animate-bounce" />
                                <p>Scanning Cold Storage Records...</p>
                            </div>
                        ) : games.length === 0 ? (
                            <div className="text-center py-16 text-gray-500 font-mono space-y-2 bg-[#111] rounded-lg border border-gray-800/60">
                                <p className="text-gray-300 font-bold">No archived matches found matching criteria.</p>
                                <p className="text-xs text-gray-600">Try adjusting your search terms or clearing the epoch filter.</p>
                                <button
                                    onClick={() => { setSearchInput(''); setSearch(''); setSelectedYear('ALL'); }}
                                    className="text-xs text-blue-400 underline font-bold mt-2 inline-block"
                                >
                                    Reset Filters
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="mb-2 text-xs font-mono text-gray-500 uppercase tracking-wider flex justify-between items-center">
                                    <span>Archived Matches ({gamesTotalCount.toLocaleString()} Total)</span>
                                    <span>Page {page} &bull; Showing {games.length} matches</span>
                                </div>

                                {games.map((game) => (
                                    <div
                                        key={game.id}
                                        onClick={() => onNavigate('game-detail', game.id.toString())}
                                        className="group bg-[#111] border border-gray-800/80 hover:border-blue-500/60 p-3.5 rounded-lg transition-all hover:bg-[#161616] flex flex-col md:flex-row items-center gap-4 cursor-pointer"
                                    >
                                        <div className="flex items-center gap-4 w-full md:w-auto">
                                            <div className="w-16 text-center shrink-0">
                                                <div className="text-xs text-blue-400 font-mono font-bold">
                                                    {new Date(game.start || game.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                                <div className="text-[10px] text-gray-500 font-mono">
                                                    {new Date(game.start || game.date).toLocaleDateString()}
                                                </div>
                                            </div>

                                            <div className="w-10 h-10 bg-[#0a0a0a] rounded flex items-center justify-center border border-gray-800 text-blue-400 font-black text-xs group-hover:border-blue-500/50 transition-colors shrink-0">
                                                {game.settings?.matchMode?.substring(0, 2).toUpperCase() || 'FFA'}
                                            </div>
                                        </div>

                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3 w-full font-mono">
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-200 font-bold text-sm truncate group-hover:text-blue-400 transition-colors">
                                                    {game.settings?.level || game.Level || 'Unknown Arena'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-400 truncate">
                                                <span className="truncate">{game.server?.name || 'Dedicated Node'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                                <User size={12} className="text-gray-500 shrink-0" />
                                                <span>{game.players?.length || 0} Pilots</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                                            <div className="text-right hidden md:block text-[11px] text-gray-500 font-mono">
                                                #{game.id}
                                            </div>
                                            <ArrowRight size={14} className="text-gray-600 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>

                    {/* Pagination */}
                    <div className="flex justify-between items-center pt-4 border-t border-gray-800">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1 || loadingGames}
                            className="px-4 py-2 bg-[#151515] border border-gray-800 rounded text-xs font-bold font-mono hover:bg-[#202020] disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-white"
                        >
                            PREVIOUS PAGE
                        </button>
                        <span className="text-gray-500 font-mono text-xs">
                            PAGE <span className="text-white font-bold">{page}</span> OF <span className="text-gray-400">{Math.ceil(gamesTotalCount / 25) || 1}</span>
                        </span>
                        <button
                            onClick={() => setPage(p => p + 1)}
                            disabled={games.length < 25 || loadingGames}
                            className="px-4 py-2 bg-[#151515] border border-gray-800 rounded text-xs font-bold font-mono hover:bg-[#202020] disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-white"
                        >
                            NEXT PAGE
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ColdStorage;
