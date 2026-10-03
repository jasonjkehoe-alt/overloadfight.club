import React, { useState, useEffect, useMemo } from 'react';
import { MapData, MapIntelData } from '../types';
import { 
    Trophy, TrendingUp, Users, Map as MapIcon, Skull, Timer, Info, 
    Download, Search, X, Shield, Crosshair, Award, Flame, Calendar, 
    ExternalLink, ChevronRight, Activity
} from 'lucide-react';

interface MapLibraryProps {
    initialSearch?: string;
    onSelectMap?: (mapName: string) => void;
    onNavigate?: (view: string, id?: any) => void;
}

interface MapStats {
    topPlayed: { map: string; count: number; total_kills?: number }[];
    recentTop: { map: string; count: number; total_matches?: number }[];
    mostActive: { map: string; avg_players: number; games: number }[];
    deadliest: { map: string; total_kills: number; total_matches?: number }[];
    marathon: { map: string; avg_duration: number }[];
}

const MapLibrary: React.FC<MapLibraryProps> = ({ initialSearch, onNavigate }) => {
    const [maps, setMaps] = useState<MapData[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<MapStats | null>(null);

    // Filter and Sort states
    const [search, setSearch] = useState(initialSearch || '');
    const [filterSize, setFilterSize] = useState('all');
    const [filterOrigin, setFilterOrigin] = useState<'all' | 'stock' | 'custom'>('all');
    const [sortBy, setSortBy] = useState<'popularity' | 'deadliest' | 'recent' | 'name' | 'downloads'>('popularity');
    
    // Tactical Dossier Modal State
    const [selectedMapForIntel, setSelectedMapForIntel] = useState<MapData | null>(null);
    const [intelData, setIntelData] = useState<MapIntelData | null>(null);
    const [loadingIntel, setLoadingIntel] = useState(false);

    // Initial load of maps and global stats
    useEffect(() => {
        loadMaps();
        loadStats();
    }, [sortBy, filterOrigin]);

    const loadMaps = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams();
            query.append('limit', '1000');
            query.append('sortBy', sortBy);
            if (filterOrigin !== 'all') {
                query.append('type', filterOrigin);
            }
            const res = await fetch(`/api/maps?${query.toString()}`);
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data.maps)) {
                    setMaps(data.maps);
                }
            }
        } catch (err) {
            console.error('Failed to load map data from /api/maps:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadStats = () => {
        fetch('/api/stats/maps')
            .then(res => res.json())
            .then(data => setStats(data))
            .catch(err => console.error("Failed to load map stats", err));
    };

    useEffect(() => {
        if (initialSearch) setSearch(initialSearch);
    }, [initialSearch]);

    // Client-side filtering for fast interactive typing
    const filteredMaps = useMemo(() => {
        let result = maps;

        if (search.trim()) {
            const term = search.toLowerCase().trim();
            result = result.filter(m =>
                m.name.toLowerCase().includes(term) ||
                m.author.toLowerCase().includes(term)
            );
        }

        if (filterSize !== 'all') {
            result = result.filter(m => m.size?.toLowerCase() === filterSize.toLowerCase());
        }

        return result;
    }, [maps, search, filterSize]);

    // Open Tactical Dossier Modal
    const handleOpenDossier = async (map: MapData) => {
        setSelectedMapForIntel(map);
        setLoadingIntel(true);
        try {
            const res = await fetch(`/api/maps/${map.id || encodeURIComponent(map.name)}/intel`);
            if (res.ok) {
                const data = await res.json();
                setIntelData(data);
            } else {
                setIntelData(map as MapIntelData);
            }
        } catch (err) {
            console.error('Failed to load map intel:', err);
            setIntelData(map as MapIntelData);
        } finally {
            setLoadingIntel(false);
        }
    };

    const handleCloseDossier = () => {
        setSelectedMapForIntel(null);
        setIntelData(null);
    };

    const formatNumber = (num?: number) => {
        if (!num) return '0';
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
        return num.toLocaleString();
    };

    return (
        <div className="animate-fade-in space-y-8 pb-16">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-[#141414] via-[#0d0d0d] to-black p-8 rounded-xl border border-gray-800 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#ff6600]/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 bg-[#ff6600]/10 border border-[#ff6600]/30 text-[#ff6600] text-[10px] font-bold uppercase tracking-wider rounded">
                                Combat Zone Intelligence
                            </span>
                            <span className="text-gray-500 font-mono text-xs">• 75,820 Sorties Indexed</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight brand-font">
                            Overload Map Database
                        </h1>
                        <p className="text-gray-400 font-mono text-xs md:text-sm mt-1 max-w-2xl">
                            Tactical schematics, historical engagement volume, arena records, and combat statistics for all official Revival Productions stock zones and community custom arenas.
                        </p>
                    </div>

                    <div className="flex gap-4 items-center">
                        <div className="bg-[#111] border border-gray-800 px-4 py-3 rounded-lg text-center font-mono">
                            <div className="text-[10px] uppercase font-bold text-gray-500">Catalogued Arenas</div>
                            <div className="text-xl md:text-2xl font-bold text-white">{maps.length || '...'}</div>
                        </div>
                        <div className="bg-[#111] border border-gray-800 px-4 py-3 rounded-lg text-center font-mono">
                            <div className="text-[10px] uppercase font-bold text-gray-500">Base Game</div>
                            <div className="text-xl md:text-2xl font-bold text-emerald-400">11 Stock</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Tactical Intel KPI Row */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* All-Time Favorites */}
                    <div className="bg-[#101012] border border-gray-800/80 p-5 rounded-xl shadow-md relative overflow-hidden">
                        <div className="flex items-center justify-between mb-4 border-b border-gray-800/60 pb-3">
                            <h3 className="text-[#ff6600] font-bold uppercase text-xs flex items-center gap-2 tracking-wider">
                                <Trophy className="w-4 h-4" /> All-Time Favorites
                            </h3>
                            <span className="text-[10px] text-gray-500 font-mono">ALL 75k SORTIES</span>
                        </div>
                        <ul className="space-y-2.5">
                            {stats.topPlayed.slice(0, 5).map((m, i) => (
                                <li 
                                    key={i} 
                                    onClick={() => {
                                        const match = maps.find(x => x.name.toLowerCase() === m.map.toLowerCase());
                                        if (match) handleOpenDossier(match);
                                        else setSearch(m.map);
                                    }}
                                    className="flex justify-between items-center text-xs p-1.5 rounded hover:bg-gray-800/40 cursor-pointer transition-colors"
                                >
                                    <div className="flex items-center gap-2 truncate">
                                        <span className={`w-4 text-center font-mono font-bold ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-gray-600'}`}>
                                            {i + 1}.
                                        </span>
                                        <span className="text-gray-200 font-bold truncate hover:text-[#ff6600]">{m.map}</span>
                                    </div>
                                    <span className="text-gray-400 font-mono font-bold">{m.count.toLocaleString()} <span className="text-gray-600 text-[10px]">sorties</span></span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Deadliest Arenas */}
                    <div className="bg-[#101012] border border-gray-800/80 p-5 rounded-xl shadow-md relative overflow-hidden">
                        <div className="flex items-center justify-between mb-4 border-b border-gray-800/60 pb-3">
                            <h3 className="text-red-400 font-bold uppercase text-xs flex items-center gap-2 tracking-wider">
                                <Skull className="w-4 h-4" /> Deadliest Arenas
                            </h3>
                            <span className="text-[10px] text-gray-500 font-mono">TOTAL FRAGS</span>
                        </div>
                        <ul className="space-y-2.5">
                            {stats.deadliest?.slice(0, 5).map((m, i) => (
                                <li 
                                    key={i} 
                                    onClick={() => {
                                        const match = maps.find(x => x.name.toLowerCase() === m.map.toLowerCase());
                                        if (match) handleOpenDossier(match);
                                        else setSearch(m.map);
                                    }}
                                    className="flex justify-between items-center text-xs p-1.5 rounded hover:bg-gray-800/40 cursor-pointer transition-colors"
                                >
                                    <div className="flex items-center gap-2 truncate">
                                        <span className="w-4 text-center font-mono font-bold text-red-500/80">{i + 1}.</span>
                                        <span className="text-gray-200 font-bold truncate hover:text-red-400">{m.map}</span>
                                    </div>
                                    <span className="text-red-400 font-mono font-bold">{formatNumber(m.total_kills)} <span className="text-gray-600 text-[10px]">frags</span></span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Trending (30 Days) */}
                    <div className="bg-[#101012] border border-gray-800/80 p-5 rounded-xl shadow-md relative overflow-hidden">
                        <div className="flex items-center justify-between mb-4 border-b border-gray-800/60 pb-3">
                            <h3 className="text-cyan-400 font-bold uppercase text-xs flex items-center gap-2 tracking-wider">
                                <TrendingUp className="w-4 h-4" /> Active Rotation
                            </h3>
                            <span className="text-[10px] text-gray-500 font-mono">LAST 30 DAYS</span>
                        </div>
                        <ul className="space-y-2.5">
                            {stats.recentTop.slice(0, 5).map((m, i) => (
                                <li 
                                    key={i} 
                                    onClick={() => {
                                        const match = maps.find(x => x.name.toLowerCase() === m.map.toLowerCase());
                                        if (match) handleOpenDossier(match);
                                        else setSearch(m.map);
                                    }}
                                    className="flex justify-between items-center text-xs p-1.5 rounded hover:bg-gray-800/40 cursor-pointer transition-colors"
                                >
                                    <div className="flex items-center gap-2 truncate">
                                        <span className="w-4 text-center font-mono font-bold text-cyan-500/80">{i + 1}.</span>
                                        <span className="text-gray-200 font-bold truncate hover:text-cyan-400">{m.map}</span>
                                    </div>
                                    <span className="text-cyan-400 font-mono font-bold">{m.count} <span className="text-gray-600 text-[10px]">recent</span></span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* Filter, Origin & Sort Control Bar */}
            <div className="bg-[#101012] border border-gray-800 p-4 rounded-xl flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
                
                {/* Search Input */}
                <div className="relative flex-grow max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search arena name, author, or code..."
                        className="w-full bg-[#0a0a0c] border border-gray-800 text-white pl-10 pr-10 py-2.5 rounded-lg focus:border-[#ff6600] outline-none font-mono text-xs transition-colors"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                {/* Origin Quick Toggles */}
                <div className="flex items-center gap-1 bg-[#0a0a0c] p-1 border border-gray-800 rounded-lg">
                    <button
                        onClick={() => setFilterOrigin('all')}
                        className={`px-3 py-1.5 rounded text-xs font-mono font-bold transition-colors ${filterOrigin === 'all' ? 'bg-[#ff6600] text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                    >
                        ALL ARENAS
                    </button>
                    <button
                        onClick={() => setFilterOrigin('stock')}
                        className={`px-3 py-1.5 rounded text-xs font-mono font-bold flex items-center gap-1 transition-colors ${filterOrigin === 'stock' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Shield className="w-3 h-3" /> BASE GAME (11)
                    </button>
                    <button
                        onClick={() => setFilterOrigin('custom')}
                        className={`px-3 py-1.5 rounded text-xs font-mono font-bold transition-colors ${filterOrigin === 'custom' ? 'bg-[#ff6600] text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                    >
                        COMMUNITY CUSTOM
                    </button>
                </div>

                {/* Size & Sorting Selectors */}
                <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center">
                    <select
                        className="bg-[#0a0a0c] border border-gray-800 text-gray-300 px-3 py-2.5 rounded-lg outline-none font-mono text-xs hover:border-gray-700 cursor-pointer"
                        value={filterSize}
                        onChange={(e) => setFilterSize(e.target.value)}
                    >
                        <option value="all">All Sizes</option>
                        <option value="tiny">Tiny (1v1)</option>
                        <option value="small">Small (2-4)</option>
                        <option value="medium">Medium (4-8)</option>
                        <option value="large">Large (8+)</option>
                        <option value="gigantic">Gigantic (10+)</option>
                    </select>

                    <select
                        className="bg-[#0a0a0c] border border-gray-800 text-gray-300 px-3 py-2.5 rounded-lg outline-none font-mono text-xs hover:border-gray-700 cursor-pointer"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                    >
                        <option value="popularity">Sort: Most Played (Sorties)</option>
                        <option value="deadliest">Sort: Deadliest (Frags)</option>
                        <option value="recent">Sort: Recently Active</option>
                        <option value="name">Sort: Alphabetical (A-Z)</option>
                        <option value="downloads">Sort: Most Downloaded</option>
                    </select>
                </div>
            </div>

            {/* Results Count Summary */}
            <div className="flex justify-between items-center text-xs font-mono text-gray-500 px-1">
                <span>
                    DISPLAYING <span className="text-white font-bold">{filteredMaps.length}</span> OF <span className="text-gray-400">{maps.length}</span> ARENAS
                </span>
                {filterOrigin !== 'all' && (
                    <span className="text-[#ff6600] font-bold uppercase tracking-wider">
                        FILTERED: {filterOrigin === 'stock' ? 'OFFICIAL BASE GAME' : 'COMMUNITY CUSTOM'}
                    </span>
                )}
            </div>

            {/* Arena Cards Grid */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="bg-[#121214] border border-gray-800/80 rounded-xl h-72 animate-pulse"></div>
                    ))}
                </div>
            ) : filteredMaps.length === 0 ? (
                <div className="bg-[#111] border border-gray-800 rounded-xl p-12 text-center text-gray-500 font-mono">
                    <MapIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <div className="text-base font-bold text-gray-400">No combat zones match your filters</div>
                    <div className="text-xs mt-1">Try resetting the search terms or origin filter.</div>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {filteredMaps.map((map, index) => {
                        const isStock = map.isStock || (!map.isCustom && map.author?.toLowerCase().includes('revival'));
                        const hasTelemetry = (map.sorties || 0) > 0;

                        return (
                            <div 
                                key={map.id || map.name} 
                                className="bg-[#121214] border border-gray-800/80 hover:border-[#ff6600]/80 rounded-xl overflow-hidden flex flex-col group transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-[#ff6600]/5"
                            >
                                {/* Thumbnail Container */}
                                <div 
                                    className="relative h-44 overflow-hidden bg-gray-950 cursor-pointer"
                                    onClick={() => handleOpenDossier(map)}
                                >
                                    <img
                                        src={map.image?.startsWith('http') || map.image?.startsWith('/') ? map.image : `https://www.omdb.net/${map.image}`}
                                        alt={map.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-90 group-hover:brightness-100"
                                        loading="lazy"
                                        onError={(e) => {
                                            const target = e.currentTarget;
                                            target.onerror = null;
                                            target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="250" viewBox="0 0 400 250" fill="%23111"><rect width="400" height="250" fill="%23141416"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23444" font-family="monospace" font-size="13">MAP SCHEMATIC</text></svg>';
                                        }}
                                    />

                                    {/* Top Badges */}
                                    <div className="absolute top-2.5 right-2.5 flex gap-1.5 z-10">
                                        {isStock ? (
                                            <span className="bg-emerald-950/90 text-emerald-300 text-[10px] px-2 py-0.5 rounded font-bold border border-emerald-700/80 flex items-center gap-1 shadow">
                                                <Shield className="w-2.5 h-2.5" /> BASE GAME
                                            </span>
                                        ) : map.isCustom ? (
                                            <span className="bg-orange-950/90 text-orange-300 text-[10px] px-2 py-0.5 rounded font-bold border border-orange-700/80 shadow">
                                                CUSTOM
                                            </span>
                                        ) : null}

                                        {map.supportsCTF && (
                                            <span className="bg-blue-950/90 text-blue-300 text-[10px] px-1.5 py-0.5 rounded font-bold border border-blue-700/80 shadow">
                                                CTF
                                            </span>
                                        )}

                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold border uppercase shadow ${
                                            map.size === 'tiny' ? 'bg-gray-800 text-gray-300 border-gray-600' :
                                            map.size === 'small' ? 'bg-cyan-950/90 text-cyan-300 border-cyan-700' :
                                            map.size === 'medium' ? 'bg-green-950/90 text-green-300 border-green-700' :
                                            map.size === 'large' ? 'bg-amber-950/90 text-amber-300 border-amber-700' :
                                            'bg-purple-950/90 text-purple-300 border-purple-700'
                                        }`}>
                                            {map.size || 'MED'}
                                        </span>
                                    </div>

                                    {/* Popularity Rank Badge (if top 15) */}
                                    {sortBy === 'popularity' && index < 15 && hasTelemetry && (
                                        <div className="absolute top-2.5 left-2.5 z-10">
                                            <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold border shadow ${
                                                index === 0 ? 'bg-yellow-500 text-black border-yellow-300 font-extrabold' :
                                                index === 1 ? 'bg-gray-200 text-black border-white' :
                                                index === 2 ? 'bg-amber-700 text-white border-amber-500' :
                                                'bg-black/80 text-gray-300 border-gray-700'
                                            }`}>
                                                #{index + 1} ARENA
                                            </span>
                                        </div>
                                    )}

                                    {/* Bottom Style Strip */}
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/70 to-transparent p-2.5 pt-8 flex justify-between items-end">
                                        <span className={`text-[10px] uppercase font-bold tracking-wider px-1 rounded ${
                                            map.style === 'tech' ? 'text-cyan-400' :
                                            map.style === 'organic' ? 'text-emerald-400' : 'text-gray-400'
                                        }`}>
                                            {map.style || 'mixed'}
                                        </span>
                                        {map.maxPlayers && (
                                            <span className="text-[10px] font-mono text-gray-400">
                                                MAX {map.maxPlayers} PILOTS
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Content Details */}
                                <div className="p-4 flex flex-col flex-grow justify-between space-y-3">
                                    <div>
                                        <div className="flex justify-between items-start gap-2 mb-1">
                                            <h3 
                                                onClick={() => handleOpenDossier(map)}
                                                className="text-white font-bold text-base leading-snug group-hover:text-[#ff6600] transition-colors truncate cursor-pointer" 
                                                title={map.name}
                                            >
                                                {map.name}
                                            </h3>
                                        </div>

                                        <div className="flex justify-between items-center text-[11px] text-gray-500 font-mono mb-3">
                                            <span className="truncate pr-2">
                                                BY <span className={`font-semibold ${isStock ? 'text-emerald-400' : 'text-gray-300'}`}>{map.author}</span>
                                            </span>
                                            <span className="shrink-0">{map.date ? map.date.substring(0, 10) : ''}</span>
                                        </div>

                                        {/* Combat Telemetry HUD */}
                                        <div className="bg-[#0b0b0d] border border-gray-850 p-2.5 rounded-lg font-mono space-y-1.5 mb-3">
                                            <div className="flex justify-between items-center text-[11px]">
                                                <span className="text-gray-500 flex items-center gap-1">
                                                    <Crosshair className="w-3 h-3 text-[#ff6600]" /> SORTIES:
                                                </span>
                                                <span className="text-white font-bold">
                                                    {map.sorties ? map.sorties.toLocaleString() : '0'}
                                                </span>
                                            </div>

                                            <div className="flex justify-between items-center text-[11px]">
                                                <span className="text-gray-500 flex items-center gap-1">
                                                    <Skull className="w-3 h-3 text-red-500" /> FRAGS:
                                                </span>
                                                <span className="text-red-400 font-bold">
                                                    {map.totalKills ? formatNumber(map.totalKills) : '0'}
                                                </span>
                                            </div>

                                            <div className="flex justify-between items-center text-[11px]">
                                                <span className="text-gray-500 flex items-center gap-1">
                                                    <Users className="w-3 h-3 text-cyan-400" /> HEADCOUNT:
                                                </span>
                                                <span className="text-gray-300">
                                                    {map.avgPlayers ? `${map.avgPlayers} pilots` : '-'}
                                                </span>
                                            </div>

                                            {/* Arena Ace Pilot */}
                                            {map.topPilot && (
                                                <div className="pt-1 border-t border-gray-800/60 flex justify-between items-center text-[10px]">
                                                    <span className="text-amber-500 font-bold flex items-center gap-1">
                                                        <Award className="w-2.5 h-2.5" /> ACE:
                                                    </span>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (onNavigate) onNavigate('pilot', map.topPilot?.name);
                                                        }}
                                                        className="text-amber-300 font-bold hover:underline truncate max-w-[130px]"
                                                        title={`Top Pilot: ${map.topPilot.name} (${map.topPilot.kills} kills)`}
                                                    >
                                                        {map.topPilot.name}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Footer */}
                                    <div className="flex items-center justify-between gap-2 border-t border-gray-800/80 pt-2.5 text-xs">
                                        <button
                                            onClick={() => handleOpenDossier(map)}
                                            className="flex-1 bg-[#1a1a1c] hover:bg-[#ff6600] text-gray-300 hover:text-white py-1.5 px-2.5 rounded text-[11px] font-mono font-bold transition-colors flex items-center justify-center gap-1"
                                        >
                                            DOSSIER <ChevronRight className="w-3 h-3" />
                                        </button>

                                        {map.downloadLink && (
                                            <a
                                                href={map.downloadLink}
                                                download
                                                className="bg-[#ff6600]/10 hover:bg-[#ff6600]/20 text-[#ff6600] hover:text-white p-1.5 rounded transition-colors"
                                                title="Download Map File"
                                            >
                                                <Download className="w-3.5 h-3.5" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Tactical Dossier Modal */}
            {selectedMapForIntel && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
                    <div className="bg-[#0e0e10] border border-gray-800 w-full max-w-3xl max-h-[90vh] rounded-2xl overflow-y-auto shadow-2xl flex flex-col">
                        
                        {/* Modal Header */}
                        <div className="relative h-52 sm:h-64 overflow-hidden bg-gray-950 shrink-0 border-b border-gray-800">
                            <img
                                src={selectedMapForIntel.image?.startsWith('http') || selectedMapForIntel.image?.startsWith('/') 
                                    ? selectedMapForIntel.image 
                                    : `https://www.omdb.net/${selectedMapForIntel.image}`}
                                alt={selectedMapForIntel.name}
                                className="w-full h-full object-cover brightness-75"
                                onError={(e) => {
                                    const target = e.currentTarget;
                                    target.onerror = null;
                                    target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="300" viewBox="0 0 600 300" fill="%23111"><rect width="600" height="300" fill="%23141416"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23444" font-family="monospace" font-size="16">TACTICAL COMBAT ZONE</text></svg>';
                                }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e10] via-[#0e0e10]/40 to-transparent"></div>

                            {/* Close Button */}
                            <button
                                onClick={handleCloseDossier}
                                className="absolute top-4 right-4 bg-black/60 hover:bg-[#ff6600] text-white p-2 rounded-full backdrop-blur transition-colors z-20"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            {/* Modal Title Overlay */}
                            <div className="absolute bottom-4 left-6 right-6 z-10">
                                <div className="flex items-center gap-2 mb-1">
                                    {selectedMapForIntel.isStock ? (
                                        <span className="bg-emerald-950 text-emerald-300 text-[10px] px-2 py-0.5 rounded font-bold border border-emerald-700 flex items-center gap-1">
                                            <Shield className="w-3 h-3" /> OFFICIAL BASE GAME
                                        </span>
                                    ) : (
                                        <span className="bg-orange-950 text-orange-300 text-[10px] px-2 py-0.5 rounded font-bold border border-orange-700">
                                            CUSTOM ARENA
                                        </span>
                                    )}
                                    <span className="bg-gray-800 text-gray-300 text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase">
                                        STYLE: {selectedMapForIntel.style || 'mixed'}
                                    </span>
                                </div>
                                <h2 className="text-2xl sm:text-3xl font-extrabold text-white brand-font tracking-tight">
                                    {selectedMapForIntel.name}
                                </h2>
                                <p className="text-gray-400 font-mono text-xs">
                                    ENGINEERED BY <span className="text-gray-200 font-bold">{selectedMapForIntel.author}</span>
                                    {selectedMapForIntel.date ? ` • RELEASED ${selectedMapForIntel.date.substring(0, 10)}` : ''}
                                </p>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-6 overflow-y-auto">
                            
                            {/* Lifetime Combat Telemetry 6-Widget Grid */}
                            <div>
                                <h3 className="text-xs uppercase font-bold text-gray-400 font-mono tracking-wider mb-3 flex items-center gap-1.5">
                                    <Activity className="w-4 h-4 text-[#ff6600]" /> Lifetime Combat Telemetry
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono">
                                    <div className="bg-[#151518] border border-gray-800 p-3 rounded-lg">
                                        <div className="text-[10px] text-gray-500 uppercase font-bold">Total Sorties</div>
                                        <div className="text-lg font-bold text-white">
                                            {intelData?.sorties ? intelData.sorties.toLocaleString() : (selectedMapForIntel.sorties?.toLocaleString() || '0')}
                                        </div>
                                    </div>
                                    <div className="bg-[#151518] border border-gray-800 p-3 rounded-lg">
                                        <div className="text-[10px] text-gray-500 uppercase font-bold">Total Frags</div>
                                        <div className="text-lg font-bold text-red-400">
                                            {intelData?.totalKills ? intelData.totalKills.toLocaleString() : (selectedMapForIntel.totalKills?.toLocaleString() || '0')}
                                        </div>
                                    </div>
                                    <div className="bg-[#151518] border border-gray-800 p-3 rounded-lg">
                                        <div className="text-[10px] text-gray-500 uppercase font-bold">Avg Headcount</div>
                                        <div className="text-lg font-bold text-cyan-400">
                                            {intelData?.avgPlayers ? `${intelData.avgPlayers} pilots` : (selectedMapForIntel.avgPlayers ? `${selectedMapForIntel.avgPlayers} pilots` : '-')}
                                        </div>
                                    </div>
                                    <div className="bg-[#151518] border border-gray-800 p-3 rounded-lg">
                                        <div className="text-[10px] text-gray-500 uppercase font-bold">Max Capacity</div>
                                        <div className="text-lg font-bold text-gray-300">
                                            {selectedMapForIntel.maxPlayers || 8} Pilots
                                        </div>
                                    </div>
                                    <div className="bg-[#151518] border border-gray-800 p-3 rounded-lg">
                                        <div className="text-[10px] text-gray-500 uppercase font-bold">First Deployed</div>
                                        <div className="text-xs font-bold text-gray-300 truncate">
                                            {intelData?.firstPlayed ? intelData.firstPlayed.substring(0, 10) : (selectedMapForIntel.firstPlayed?.substring(0, 10) || 'N/A')}
                                        </div>
                                    </div>
                                    <div className="bg-[#151518] border border-gray-800 p-3 rounded-lg">
                                        <div className="text-[10px] text-gray-500 uppercase font-bold">Last Engagement</div>
                                        <div className="text-xs font-bold text-emerald-400 truncate">
                                            {intelData?.lastPlayed ? intelData.lastPlayed.substring(0, 10) : (selectedMapForIntel.lastPlayed?.substring(0, 10) || 'N/A')}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Game Mode Distribution */}
                            {intelData?.modes && Object.keys(intelData.modes).length > 0 && (
                                <div>
                                    <h3 className="text-xs uppercase font-bold text-gray-400 font-mono tracking-wider mb-3">
                                        Combat Mode Distribution
                                    </h3>
                                    <div className="bg-[#151518] border border-gray-800 p-4 rounded-lg space-y-3 font-mono">
                                        <div className="flex flex-wrap gap-2">
                                            {Object.entries(intelData.modes).map(([mode, count]) => {
                                                const total = intelData.sorties || 1;
                                                const pct = Math.round((Number(count) / total) * 100);
                                                return (
                                                    <span 
                                                        key={mode} 
                                                        className="px-2.5 py-1 bg-[#1c1c20] border border-gray-700/60 rounded text-xs text-gray-300 flex items-center gap-1.5"
                                                    >
                                                        <span className="font-bold text-white">{mode}:</span>
                                                        <span>{Number(count).toLocaleString()}</span>
                                                        <span className="text-[#ff6600] font-bold">({pct}%)</span>
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Record Match Card */}
                            {intelData?.recordMatch && (
                                <div>
                                    <h3 className="text-xs uppercase font-bold text-gray-400 font-mono tracking-wider mb-3 flex items-center gap-1.5">
                                        <Flame className="w-4 h-4 text-[#ff6600]" /> Arena World Record Match
                                    </h3>
                                    <div className="bg-[#151518] border border-orange-900/30 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono">
                                        <div>
                                            <div className="text-xs text-gray-400 mb-1">
                                                Match #{intelData.recordMatch.id} • {intelData.recordMatch.date ? intelData.recordMatch.date.substring(0, 10) : ''}
                                            </div>
                                            <div className="text-base font-bold text-white flex items-center gap-2">
                                                <span className="text-red-400">{intelData.recordMatch.kills} Frags Logged</span>
                                                <span className="text-gray-500">•</span>
                                                <span className="text-cyan-400">{intelData.recordMatch.players} Pilots in Arena</span>
                                            </div>
                                        </div>
                                        {onNavigate && (
                                            <button
                                                onClick={() => {
                                                    handleCloseDossier();
                                                    onNavigate('game-detail', intelData.recordMatch?.id);
                                                }}
                                                className="px-4 py-2 bg-[#ff6600] hover:bg-[#ff771a] text-white font-bold text-xs rounded transition-colors shrink-0"
                                            >
                                                INSPECT SCOREBOARD &rarr;
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Top 5 Arena Aces Table */}
                            {intelData?.topPilots && intelData.topPilots.length > 0 && (
                                <div>
                                    <h3 className="text-xs uppercase font-bold text-gray-400 font-mono tracking-wider mb-3 flex items-center gap-1.5">
                                        <Award className="w-4 h-4 text-amber-500" /> Top 5 Combat Aces of {selectedMapForIntel.name}
                                    </h3>
                                    <div className="bg-[#151518] border border-gray-800 rounded-lg overflow-hidden font-mono text-xs">
                                        <table className="w-full text-left">
                                            <thead className="bg-[#1c1c20] text-gray-500 border-b border-gray-800 text-[10px] uppercase">
                                                <tr>
                                                    <th className="p-2.5 pl-4">Rank</th>
                                                    <th className="p-2.5">Callsign</th>
                                                    <th className="p-2.5 text-right">Sorties</th>
                                                    <th className="p-2.5 text-right">Frags</th>
                                                    <th className="p-2.5 text-right pr-4">Combat K/D</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-800/60">
                                                {intelData.topPilots.map((pilot, i) => (
                                                    <tr key={i} className="hover:bg-gray-800/30 transition-colors">
                                                        <td className="p-2.5 pl-4 font-bold text-gray-500">
                                                            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                                                        </td>
                                                        <td className="p-2.5">
                                                            <button
                                                                onClick={() => {
                                                                    handleCloseDossier();
                                                                    if (onNavigate) onNavigate('pilot', pilot.name);
                                                                }}
                                                                className="text-white font-bold hover:text-[#ff6600] transition-colors"
                                                            >
                                                                {pilot.name}
                                                            </button>
                                                        </td>
                                                        <td className="p-2.5 text-right text-gray-400">{pilot.sorties}</td>
                                                        <td className="p-2.5 text-right text-red-400 font-bold">{pilot.kills.toLocaleString()}</td>
                                                        <td className="p-2.5 text-right pr-4 font-bold text-amber-400">{pilot.kd}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 bg-[#121215] border-t border-gray-800 flex justify-between items-center text-xs font-mono">
                            <span className="text-gray-500">
                                OVERLOAD ARENA TELEMETRY ARCHIVE
                            </span>
                            <div className="flex gap-2">
                                {selectedMapForIntel.downloadLink && (
                                    <a
                                        href={selectedMapForIntel.downloadLink}
                                        download
                                        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded flex items-center gap-1.5 transition-colors"
                                    >
                                        <Download className="w-3.5 h-3.5" /> DOWNLOAD FILE
                                    </a>
                                )}
                                <button
                                    onClick={handleCloseDossier}
                                    className="px-4 py-2 bg-[#ff6600] hover:bg-[#ff771a] text-white font-bold rounded transition-colors"
                                >
                                    CLOSE
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
};

export default MapLibrary;
