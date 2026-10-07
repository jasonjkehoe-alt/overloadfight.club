import React, { useState, useEffect, useMemo } from 'react';
import { 
    Search, Database, Calendar, Server, User, ArrowRight, Trophy, Map as MapIcon, 
    Crosshair, Clock, Zap, Award, Skull, Moon, BarChart3, 
    X
} from 'lucide-react';
import { fetchColdGames } from '../services/apiService';
import { getMapImage } from '../services/mapService';
import Link from './Link';
import { useQueryParam, setQueryParams, rowLink } from '../hooks/useLocation';
import { urlFor } from '../server/lib/siteRoutes.js';
import { Loading, EmptyState, ErrorState } from './States';

// A record card; with a match it is a link to that match.
const RecordCard: React.FC<{ matchId?: number; className: string; children: React.ReactNode }> = ({ matchId, className, children }) =>
    matchId ? <Link to={urlFor('game-detail', matchId)} className={`block ${className}`}>{children}</Link> : <div className={className}>{children}</div>;

const DeepStatCard: React.FC<{
    title: string;
    value: React.ReactNode;
    subtitle?: React.ReactNode;
    icon: React.ReactNode;
    color?: string;
    loading?: boolean;
    onClick?: () => void;
}> = ({ title, value, subtitle, icon, color = 'text-blue-500', loading, onClick }) => (
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
            {loading ? (
                <div className="space-y-1.5 my-1">
                    <div className="h-7 w-24 bg-gray-800/70 rounded animate-pulse" />
                    <div className="h-3 w-32 bg-gray-800/40 rounded animate-pulse" />
                </div>
            ) : (
                <>
                    <div className="text-xl md:text-2xl font-bold text-white font-mono mb-1 truncate">{value ?? '-'}</div>
                    {subtitle && <div className="text-[11px] text-gray-500 font-mono truncate">{subtitle}</div>}
                </>
            )}
        </div>
    </div>
);

const RecordCardSkeleton: React.FC = () => (
    <div className="bg-[#121212] border border-gray-800 p-5 rounded-xl animate-pulse space-y-3">
        <div className="h-4 w-28 bg-gray-800 rounded" />
        <div className="h-5 w-36 bg-gray-700 rounded" />
        <div className="h-8 w-24 bg-gray-800 rounded mt-2" />
        <div className="h-3 w-32 bg-gray-800/60 rounded" />
        <div className="h-3 w-20 bg-gray-800/40 rounded" />
    </div>
);

const TimelineSkeleton: React.FC = () => (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-32 bg-[#151515] border border-gray-800 rounded-lg p-3 animate-pulse flex flex-col justify-between">
                <div className="h-4 w-10 bg-gray-800 rounded" />
                <div className="h-6 w-16 bg-gray-800 rounded my-auto" />
                <div className="h-1.5 w-full bg-gray-800 rounded" />
            </div>
        ))}
    </div>
);

const TableSkeletonRows: React.FC<{ cols: number }> = ({ cols }) => (
    <>
        {Array.from({ length: 6 }).map((_, i) => (
            <tr key={i} className="animate-pulse">
                {Array.from({ length: cols }).map((_, j) => (
                    <td key={j} className="p-3">
                        <div className="h-4 bg-gray-800/60 rounded w-full" />
                    </td>
                ))}
            </tr>
        ))}
    </>
);

const ColdStorage: React.FC = () => {
    const [deepStats, setDeepStats] = useState<any>(null);
    const [pilotRoster, setPilotRoster] = useState<any[]>([]);
    const [topMaps, setTopMaps] = useState<any[]>([]);
    const [loadingStats, setLoadingStats] = useState(true);
    const [statsError, setStatsError] = useState(false);

    // Hall of Fame Category
    const [hallCategory, setHallCategory] = useQueryParam('hall', 'kills', ['kills', 'games', 'kd', 'damage', 'win_rate'] as const);

    // Archive Browser State
    const [games, setGames] = useState<any[]>([]);
    const [gamesTotalCount, setGamesTotalCount] = useState(0);
    const [loadingGames, setLoadingGames] = useState(true);
    const [gamesError, setGamesError] = useState(false);
    // The submitted search, the year pill and the page live in the URL: ?q=, ?year=, ?page=
    const [search] = useQueryParam('q');
    const [searchInput, setSearchInput] = useState(search);
    const [selectedYear] = useQueryParam('year', 'ALL');
    const [pageParam, setPageParam] = useQueryParam('page', '1');
    const page = Math.max(1, parseInt(pageParam, 10) || 1);
    const setPage = (next: number) => setPageParam(String(next));

    // Initial Load of Deep Stats, Pilots & Maps
    useEffect(() => {
        setLoadingStats(true);
        setStatsError(false);
        Promise.all([
            fetch('/api/stats/cold/deep').then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            }),
            fetch('/api/stats/pilots?source=all').then(res => res.json()).catch(() => []),
            fetch('/api/stats/maps?source=all').then(res => res.json()).catch(() => null)
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
            setStatsError(true);
            setLoadingStats(false);
        });
    }, []);

    // Load Games whenever page, search, or selectedYear changes
    useEffect(() => {
        loadGames();
    }, [page, search, selectedYear]);

    const loadGames = async () => {
        setLoadingGames(true);
        setGamesError(false);
        try {
            let effectiveSearch = search.trim();
            if (selectedYear !== 'ALL') {
                effectiveSearch = effectiveSearch ? `${selectedYear} ${effectiveSearch}` : selectedYear;
            }

            const gamesData = await fetchColdGames(page, effectiveSearch);
            setGamesError(!gamesData);
            setGames(gamesData?.games || []);
            setGamesTotalCount(gamesData?.count || 0);
        } catch (error) {
            console.error("Failed to load cold storage games", error);
            setGames([]);
            setGamesTotalCount(0);
        }
        setLoadingGames(false);
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setQueryParams({ q: searchInput.trim(), page: null });
    };

    const handleClearSearch = () => {
        setSearchInput('');
        setQueryParams({ q: null, page: null });
    };

    const handleYearFilter = (year: string) => {
        setQueryParams({ year: year === 'ALL' ? null : year, page: null });
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

    // Computed date range subtitle: "Every match since [Month Year]"
    const computedSubtitle = useMemo(() => {
        if (!deepStats?.first_game) return null;
        try {
            const first = new Date(deepStats.first_game);
            const month = first.toLocaleDateString('en-US', { month: 'long' });
            const year = first.getFullYear();
            return `Every match since ${month} ${year}`;
        } catch {
            return null;
        }
    }, [deepStats]);

    // Computed date range badge in header
    const computedDateRangeBadge = useMemo(() => {
        if (!deepStats?.first_game) return null;
        try {
            const start = new Date(deepStats.first_game);
            const month = start.toLocaleDateString('en-US', { month: 'short' });
            const year = start.getFullYear();
            const years = Math.max(0, (Date.now() - start.getTime()) / (365.25 * 24 * 3600 * 1000)).toFixed(1);
            return `${month} ${year} – Present (${years} yrs)`;
        } catch {
            return null;
        }
    }, [deepStats]);

    // Peak Year and Max Count derived dynamically from yearly data
    const peakYearData = useMemo(() => {
        if (!deepStats?.yearly || !Array.isArray(deepStats.yearly) || deepStats.yearly.length === 0) return null;
        return deepStats.yearly.reduce((max: any, item: any) => {
            return (item.count > (max?.count || 0)) ? item : max;
        }, null);
    }, [deepStats]);

    // Title range for timeline
    const timelineTitleRange = useMemo(() => {
        if (!deepStats?.yearly || !Array.isArray(deepStats.yearly) || deepStats.yearly.length === 0) {
            return 'Historical Activity Curve';
        }
        const first = deepStats.yearly[0]?.year;
        const last = deepStats.yearly[deepStats.yearly.length - 1]?.year;
        if (first && last && first !== last) {
            return `Historical Activity Curve (${first} – ${last})`;
        }
        return 'Historical Activity Curve';
    }, [deepStats]);

    // Dynamic list of years for filter pills
    const availableYears = useMemo(() => {
        if (!deepStats?.yearly || !Array.isArray(deepStats.yearly) || deepStats.yearly.length === 0) {
            return ['ALL', '2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019'];
        }
        const yrs = deepStats.yearly.map((y: any) => String(y.year)).sort().reverse();
        return ['ALL', ...yrs];
    }, [deepStats]);

    return (
        <div className="min-h-screen bg-[#050505] text-gray-300 font-sans selection:bg-[#ff6600] selection:text-white pb-24">
            <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
                
                {/* --- 1. HEADER & METADATA STRIP --- */}
                <div className="border-b border-gray-800 pb-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-950/40 border border-blue-800/60 rounded-xl shadow-inner shadow-blue-500/10">
                                <Database className="text-blue-400 w-7 h-7" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-3xl font-black text-white tracking-tight">Historical Archive</h1>
                                    <span className="text-[10px] font-mono font-bold bg-blue-900/40 text-blue-300 border border-blue-700/50 px-2 py-0.5 rounded uppercase">
                                        Active Archive
                                    </span>
                                </div>
                                {loadingStats ? (
                                    <div className="h-4 w-48 bg-gray-800/60 rounded animate-pulse mt-1" />
                                ) : (
                                    <p className="text-gray-400 font-mono text-xs mt-0.5">
                                        {computedSubtitle || 'Archived historical combat matches'}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Metadata Badges */}
                        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                            {loadingStats ? (
                                <>
                                    <div className="h-8 w-44 bg-[#111] border border-gray-800 rounded animate-pulse" />
                                    <div className="h-8 w-36 bg-[#111] border border-gray-800 rounded animate-pulse" />
                                </>
                            ) : (
                                <>
                                    {computedDateRangeBadge && (
                                        <div className="bg-[#111] border border-gray-800 px-3 py-1.5 rounded flex items-center gap-2 text-gray-300">
                                            <Calendar size={13} className="text-emerald-400" />
                                            <span>{computedDateRangeBadge}</span>
                                        </div>
                                    )}
                                    {deepStats?.unique_servers ? (
                                        <div className="bg-[#111] border border-gray-800 px-3 py-1.5 rounded flex items-center gap-2 text-gray-300">
                                            <Server size={13} className="text-purple-400" />
                                            <span>{deepStats.unique_servers.toLocaleString()} Servers</span>
                                        </div>
                                    ) : null}
                                    {deepStats?.total_games ? (
                                        <div className="bg-[#111] border border-gray-800 px-3 py-1.5 rounded flex items-center gap-2 text-gray-300">
                                            <Database size={13} className="text-blue-400" />
                                            <span>{deepStats.total_games.toLocaleString()} Matches</span>
                                        </div>
                                    ) : null}
                                </>
                            )}
                        </div>
                    </div>

                    {statsError && !deepStats && (
                        <div className="mt-3">
                            <ErrorState
                                compact
                                title="Archive telemetry unavailable"
                                message="Unable to load historical archive telemetry. Some statistics may be unavailable."
                                onRetry={() => window.location.reload()}
                            />
                        </div>
                    )}
                </div>

                {/* --- 2. HISTORICAL ACTIVITY CURVE (HERO) --- */}
                <div className="bg-[#111] border border-gray-800 rounded-xl p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                        <div>
                            <h2 className="text-base font-bold text-white flex items-center gap-2">
                                <Calendar size={18} className="text-blue-400" /> {timelineTitleRange}
                            </h2>
                            <p className="text-xs text-gray-500 font-mono mt-0.5">
                                Match distribution across all community eras. Click any year to filter the archive below.
                            </p>
                        </div>
                        {peakYearData && (
                            <div className="text-xs font-mono text-gray-400 bg-gray-900 px-3 py-1 rounded border border-gray-800 self-start sm:self-auto">
                                Peak Era: <span className="text-[#ff6600] font-bold">{peakYearData.year} ({peakYearData.count.toLocaleString()} Matches)</span>
                            </div>
                        )}
                    </div>

                    {loadingStats ? (
                        <TimelineSkeleton />
                    ) : deepStats?.yearly && deepStats.yearly.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                            {deepStats.yearly.map((item: any) => {
                                const maxCount = peakYearData ? peakYearData.count : 1;
                                const pct = Math.max(8, Math.round((item.count / maxCount) * 100));
                                const isSelected = selectedYear === item.year;
                                const isPeak = peakYearData && item.year === peakYearData.year;
                                const totalMatches = deepStats?.total_games || 0;
                                const sharePct = totalMatches > 0 ? ((item.count / totalMatches) * 100).toFixed(1) : null;

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
                                            {isPeak && (
                                                <span className="text-[9px] bg-amber-950/80 text-amber-300 px-1.5 py-0.5 rounded border border-amber-800/40 font-bold">
                                                    Peak
                                                </span>
                                            )}
                                        </div>

                                        <div className="my-auto">
                                            <div className="text-base font-bold font-mono text-gray-200">
                                                {item.count.toLocaleString()}
                                            </div>
                                            {sharePct !== null && (
                                                <div className="text-[10px] text-gray-500 font-mono">
                                                    {sharePct}% of total
                                                </div>
                                            )}
                                        </div>

                                        {/* Activity Bar */}
                                        <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full transition-all ${
                                                    isSelected ? 'bg-blue-400' : isPeak ? 'bg-[#ff6600]' : 'bg-gray-500 group-hover:bg-blue-400'
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
                            No historical timeline data available.
                        </div>
                    )}
                </div>

                {/* --- 3. ALL-TIME RECORDS (THE FOUR EXTREME-MATCH CARDS) --- */}
                <div className="space-y-3">
                    <h2 className="text-xs font-bold font-mono uppercase tracking-widest text-gray-400 flex items-center gap-2">
                        <Trophy size={14} className="text-yellow-500" /> All-Time Records
                    </h2>

                    {loadingStats ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <RecordCardSkeleton />
                            <RecordCardSkeleton />
                            <RecordCardSkeleton />
                            <RecordCardSkeleton />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* 1. Bloodiest Battle */}
                            {(() => {
                                const rec = deepStats?.records?.bloodiest_match;
                                const hasRecord = Boolean(rec && rec.id);
                                return (
                                    <RecordCard
                                        matchId={hasRecord ? rec.id : undefined}
                                        className={`bg-gradient-to-br from-[#131111] to-[#1a1111] border border-red-900/40 p-5 rounded-xl transition-all group relative overflow-hidden shadow-lg ${
                                            hasRecord ? 'hover:border-red-500/70 cursor-pointer' : 'opacity-80'
                                        }`}
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
                                                {rec?.kills ? `${rec.kills.toLocaleString()} Frags` : '-'}
                                            </div>
                                            <div className="text-xs font-mono text-gray-400 mt-2 space-y-0.5">
                                                <div className="text-gray-300 font-bold truncate">
                                                    {rec?.map || 'Unknown Arena'}
                                                </div>
                                                <div className="text-[11px] text-gray-500">
                                                    {hasRecord ? `Match #${rec.id} • ${rec.players || 0} Pilots` : 'No record established'}
                                                </div>
                                            </div>
                                            {hasRecord && (
                                                <div className="mt-4 pt-3 border-t border-red-950/60 flex items-center justify-between text-xs font-mono text-red-300 group-hover:text-white transition-colors">
                                                    <span>Inspect Match</span>
                                                    <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                                                </div>
                                            )}
                                        </div>
                                    </RecordCard>
                                );
                            })()}

                            {/* 2. Single-Pilot Frag Record */}
                            {(() => {
                                const rec = deepStats?.records?.max_single_pilot_frags;
                                const hasRecord = Boolean(rec && rec.id);
                                return (
                                    <RecordCard
                                        matchId={hasRecord ? rec.id : undefined}
                                        className={`bg-gradient-to-br from-[#131311] to-[#1a1811] border border-amber-900/40 p-5 rounded-xl transition-all group relative overflow-hidden shadow-lg ${
                                            hasRecord ? 'hover:border-amber-500/70 cursor-pointer' : 'opacity-80'
                                        }`}
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
                                                {rec?.kills ? `${rec.kills.toLocaleString()} Frags` : '-'}
                                            </div>
                                            <div className="text-xs font-mono text-gray-400 mt-2 space-y-0.5">
                                                <div className="text-amber-300 font-bold truncate">
                                                    {rec?.pilot || 'Unknown Pilot'}
                                                </div>
                                                <div className="text-[11px] text-gray-500 truncate">
                                                    {hasRecord ? `${rec.map || 'Unknown Arena'} • Match #${rec.id}` : 'No record established'}
                                                </div>
                                            </div>
                                            {hasRecord && (
                                                <div className="mt-4 pt-3 border-t border-amber-950/60 flex items-center justify-between text-xs font-mono text-amber-300 group-hover:text-white transition-colors">
                                                    <span>Inspect Match</span>
                                                    <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                                                </div>
                                            )}
                                        </div>
                                    </RecordCard>
                                );
                            })()}

                            {/* 3. Endurance Marathon */}
                            {(() => {
                                const rec = deepStats?.records?.longest_match;
                                const hasRecord = Boolean(rec && rec.id);
                                return (
                                    <RecordCard
                                        matchId={hasRecord ? rec.id : undefined}
                                        className={`bg-gradient-to-br from-[#111218] to-[#121622] border border-blue-900/40 p-5 rounded-xl transition-all group relative overflow-hidden shadow-lg ${
                                            hasRecord ? 'hover:border-blue-500/70 cursor-pointer' : 'opacity-80'
                                        }`}
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
                                                {rec?.duration ? formatDuration(rec.duration) : '-'}
                                            </div>
                                            <div className="text-xs font-mono text-gray-400 mt-2 space-y-0.5">
                                                <div className="text-gray-300 font-bold truncate">
                                                    {rec?.map || 'Unknown Arena'}
                                                </div>
                                                <div className="text-[11px] text-gray-500">
                                                    {hasRecord ? `Match #${rec.id} • Non-stop dogfight` : 'No record established'}
                                                </div>
                                            </div>
                                            {hasRecord && (
                                                <div className="mt-4 pt-3 border-t border-blue-950/60 flex items-center justify-between text-xs font-mono text-blue-300 group-hover:text-white transition-colors">
                                                    <span>Inspect Match</span>
                                                    <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                                                </div>
                                            )}
                                        </div>
                                    </RecordCard>
                                );
                            })()}

                            {/* 4. Most Attended Match */}
                            {(() => {
                                const rec = deepStats?.records?.most_attended_match;
                                const hasRecord = Boolean(rec && rec.id);
                                return (
                                    <RecordCard
                                        matchId={hasRecord ? rec.id : undefined}
                                        className={`bg-gradient-to-br from-[#121118] to-[#181224] border border-purple-900/40 p-5 rounded-xl transition-all group relative overflow-hidden shadow-lg ${
                                            hasRecord ? 'hover:border-purple-500/70 cursor-pointer' : 'opacity-80'
                                        }`}
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
                                                {rec?.count ? `${rec.count.toLocaleString()} Pilots` : '-'}
                                            </div>
                                            <div className="text-xs font-mono text-gray-400 mt-2 space-y-0.5">
                                                <div className="text-gray-300 font-bold truncate">
                                                    {rec?.map || 'Unknown Arena'}
                                                </div>
                                                <div className="text-[11px] text-gray-500">
                                                    {hasRecord ? `Match #${rec.id} • Anarchy chaos` : 'No record established'}
                                                </div>
                                            </div>
                                            {hasRecord && (
                                                <div className="mt-4 pt-3 border-t border-purple-950/60 flex items-center justify-between text-xs font-mono text-purple-300 group-hover:text-white transition-colors">
                                                    <span>Inspect Match</span>
                                                    <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                                                </div>
                                            )}
                                        </div>
                                    </RecordCard>
                                );
                            })()}
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

                        <div className="overflow-y-auto flex-1">
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
                                    {loadingStats ? (
                                        <TableSkeletonRows cols={5} />
                                    ) : hallOfFamePilots.length === 0 ? (
                                        <tr>
                                            <td colSpan={5}>
                                                <EmptyState compact title="No pilots found with 50+ matches." />
                                            </td>
                                        </tr>
                                    ) : (
                                        hallOfFamePilots.map((pilot, idx) => (
                                            <tr 
                                                key={pilot.name} 
                                                {...rowLink(urlFor('pilot', pilot.name))}
                                                className="hover:bg-[#181818] cursor-pointer group transition-colors"
                                            >
                                                <td className="p-3 text-center text-gray-600 font-bold">
                                                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                                                </td>
                                                <td className="p-3 font-bold text-white group-hover:text-[#ff6600] transition-colors">
                                                    <Link to={urlFor('pilot', pilot.name)}>{pilot.name}</Link>
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
                                        ))
                                    )}
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
                                {deepStats?.unique_maps 
                                    ? `${deepStats.unique_maps.toLocaleString()} total arenas` 
                                    : topMaps.length > 0 
                                        ? `${topMaps.length} arenas` 
                                        : 'Custom arenas'}
                            </span>
                        </div>

                        <div className="overflow-y-auto flex-1">
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
                                    {loadingStats ? (
                                        <TableSkeletonRows cols={4} />
                                    ) : topMaps.length === 0 ? (
                                        <tr>
                                            <td colSpan={4}>
                                                <EmptyState compact title="No arena records found." />
                                            </td>
                                        </tr>
                                    ) : (
                                        topMaps.slice(0, 10).map((mapItem, idx) => {
                                            const totalMatches = deepStats?.total_games;
                                            const share = totalMatches ? ((mapItem.count / totalMatches) * 100).toFixed(1) : null;

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
                                                        {share !== null ? `${share}%` : '-'}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* --- 5. ALL-TIME TOTALS (TELEMETRY GRID MINUS PHYSICAL ARCHIVE CARD) --- */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xs font-bold font-mono uppercase tracking-widest text-gray-400 flex items-center gap-2">
                            <BarChart3 size={14} className="text-blue-500" /> All-Time Totals
                        </h2>
                        {deepStats?.last_calculated && (
                            <span className="text-[10px] font-mono text-gray-600">
                                Cache synced: {new Date(deepStats.last_calculated).toLocaleTimeString()}
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {/* 1. Total Matches */}
                        <DeepStatCard
                            title="Total Matches"
                            loading={loadingStats}
                            value={deepStats?.total_games ? deepStats.total_games.toLocaleString() : null}
                            subtitle="Matches"
                            icon={<Database size={28} />}
                            color="text-blue-400"
                        />

                        {/* 2. Flight Time */}
                        <DeepStatCard
                            title="Flight Time"
                            loading={loadingStats}
                            value={deepStats?.total_flight_hours ? `${Math.round(deepStats.total_flight_hours).toLocaleString()}h` : null}
                            subtitle={deepStats?.total_flight_hours ? `~${(deepStats.total_flight_hours / (24 * 365.25)).toFixed(2)} continuous years` : 'Continuous flight'}
                            icon={<Clock size={28} />}
                            color="text-emerald-400"
                        />

                        {/* 3. Total Frags */}
                        <DeepStatCard
                            title="Total Frags"
                            loading={loadingStats}
                            value={deepStats?.total_kills ? formatLargeNumber(deepStats.total_kills) : null}
                            subtitle={deepStats?.total_kills ? `${deepStats.total_kills.toLocaleString()} kills` : 'All-time eliminations'}
                            icon={<Skull size={28} />}
                            color="text-red-400"
                        />

                        {/* 4. Total Damage */}
                        <DeepStatCard
                            title="Total Damage"
                            loading={loadingStats}
                            value={deepStats?.total_damage ? formatLargeNumber(deepStats.total_damage) : null}
                            subtitle="Kinetic & energy dealt"
                            icon={<Zap size={28} />}
                            color="text-[#ff6600]"
                        />

                        {/* 5. Pilots */}
                        <DeepStatCard
                            title="Pilots"
                            loading={loadingStats}
                            value={deepStats?.unique_pilots ? deepStats.unique_pilots.toLocaleString() : null}
                            subtitle="Registered callsigns"
                            icon={<User size={28} />}
                            color="text-yellow-400"
                        />

                        {/* 6. Servers */}
                        <DeepStatCard
                            title="Servers"
                            loading={loadingStats}
                            value={deepStats?.unique_servers ? deepStats.unique_servers.toLocaleString() : null}
                            subtitle="Global community servers"
                            icon={<Server size={28} />}
                            color="text-purple-400"
                        />

                        {/* 7. Combat Arenas */}
                        <DeepStatCard
                            title="Combat Arenas"
                            loading={loadingStats}
                            value={deepStats?.unique_maps ? `${deepStats.unique_maps.toLocaleString()} Arenas` : null}
                            subtitle="Custom maps cataloged"
                            icon={<MapIcon size={28} />}
                            color="text-cyan-400"
                        />

                        {/* 8. Most Played Mode */}
                        <DeepStatCard
                            title="Most Played Mode"
                            loading={loadingStats}
                            value={deepStats?.most_popular_mode?.mode || null}
                            subtitle={
                                deepStats?.most_popular_mode?.count && deepStats?.total_games
                                    ? `${deepStats.most_popular_mode.count.toLocaleString()} matches (${((deepStats.most_popular_mode.count / deepStats.total_games) * 100).toFixed(1)}%)`
                                    : deepStats?.most_popular_mode?.mode 
                                        ? 'Most played match type' 
                                        : null
                            }
                            icon={<Crosshair size={28} />}
                            color="text-pink-400"
                        />

                        {/* 9. Graveyard Shift */}
                        <DeepStatCard
                            title="Graveyard Shift"
                            loading={loadingStats}
                            value={deepStats?.graveyard_shift_count !== undefined ? deepStats.graveyard_shift_count.toLocaleString() : null}
                            subtitle="Matches fought 2AM–5AM"
                            icon={<Moon size={28} />}
                            color="text-indigo-400"
                        />
                    </div>
                </div>

                {/* --- 6. ARCHIVAL MATCH BROWSER WITH QUICK FILTERS --- */}
                <div className="bg-[#0e0e0e] border border-gray-800 rounded-xl p-6 space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Database className="text-blue-400" />
                                Archival Match Browser
                            </h2>
                            <p className="text-xs text-gray-500 font-mono mt-0.5">
                                {gamesTotalCount > 0 
                                    ? `Search individual matches across all ${gamesTotalCount.toLocaleString()} archived historical records.`
                                    : 'Search individual matches across archived historical records.'}
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
                            <Calendar size={12} className="text-blue-400" /> Year:
                        </span>
                        {availableYears.map(yr => (
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
                            <Loading label="Scanning Archive Records..." />
                        ) : gamesError ? (
                            <ErrorState title="Archive unavailable" message="Could not load archived matches." onRetry={loadGames} />
                        ) : games.length === 0 ? (
                            <div className="bg-surface-card rounded-card border border-line">
                                <EmptyState
                                    icon={Search}
                                    title="No archived matches found matching criteria."
                                    message="Try adjusting your search terms or clearing the year filter."
                                    action={
                                        <button
                                            onClick={() => { setSearchInput(''); setQueryParams({ q: null, year: null, page: null }); }}
                                            className="text-xs text-blue-400 underline font-bold"
                                        >
                                            Reset Filters
                                        </button>
                                    }
                                />
                            </div>
                        ) : (
                            <>
                                <div className="mb-2 text-xs font-mono text-gray-500 uppercase tracking-wider flex justify-between items-center">
                                    <span>Archived Matches ({gamesTotalCount.toLocaleString()} Total)</span>
                                    <span>Page {page} &bull; Showing {games.length} matches</span>
                                </div>

                                {games.map((game) => (
                                    <Link
                                        key={game.id}
                                        to={urlFor('game-detail', game.id)}
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
                                    </Link>
                                ))}
                            </>
                        )}
                    </div>

                    {/* Pagination */}
                    <div className="flex justify-between items-center pt-4 border-t border-gray-800">
                        <button
                            onClick={() => setPage(Math.max(1, page - 1))}
                            disabled={page === 1 || loadingGames}
                            className="px-4 py-2 bg-[#151515] border border-gray-800 rounded text-xs font-bold font-mono hover:bg-[#202020] disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-white"
                        >
                            PREVIOUS PAGE
                        </button>
                        <span className="text-gray-500 font-mono text-xs">
                            PAGE <span className="text-white font-bold">{page}</span> OF <span className="text-gray-400">{Math.ceil(gamesTotalCount / 25) || 1}</span>
                        </span>
                        <button
                            onClick={() => setPage(page + 1)}
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
