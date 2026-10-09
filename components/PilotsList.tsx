import React, { useState, useMemo } from 'react';
import { BrowserApiResponse, GameData } from '../types';
import { User, Calendar, Filter, Trophy, TrendingUp, Skull, Info, Search, X, Users, Swords } from 'lucide-react';
import { Loading, EmptyState, ErrorState } from './States';
import Link, { LinkCell } from './Link';
import SortHeader from './SortHeader';
import Pager, { usePage } from './Pager';
import { useQueryParam, useQueryText } from '../hooks/useLocation';
import { urlFor } from '../server/lib/siteRoutes.js';
import { combatRatio, COMBAT_RATIO_HINT, LETHALITY_HINT } from '../server/lib/gameParse.js';

// Pilots per page of the roster, kept in ?page=
const ROSTER_PAGE_SIZE = 50;
const FIRST_PAGE = { page: null };
// Columns the roster sorts by, kept in ?sort= (with ?dir=asc), so a page
// number in the URL always means the same pilots
const SORT_KEYS = ['name', 'games', 'kills', 'deaths', 'kd', 'kda', 'kpm', 'win_rate', 'suicides', 'lastSeen'] as const;
type SortKey = typeof SORT_KEYS[number];

// The browser API also sends a player list, which types.ts does not declare.
type BrowserGame = NonNullable<BrowserApiResponse['game']> & { players?: (string | { name?: string })[] };

interface PilotsListProps {
    activeGames?: BrowserApiResponse[] | null;
    archivedGames?: GameData[] | null;
}

interface PilotStats {
    name: string;
    kills: number;
    deaths: number;
    assists: number;
    suicides: number;
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

const PilotsList: React.FC<PilotsListProps> = ({ activeGames, archivedGames }) => {
    // The tab and the filters live in the URL: ?tab=online, ?q=, ?min=, ?active=1
    const [activeTab, setActiveTab] = useQueryParam('tab', 'roster', ['roster', 'online'] as const);
    const [searchTerm, setSearchTerm] = useQueryText('q');
    // A new filter, sort or search starts the roster at page 1 (FIRST_PAGE).
    const [sortKey, setSortKey] = useQueryParam<SortKey>('sort', 'games', SORT_KEYS);
    const [sortDir] = useQueryParam('dir', 'desc', ['asc', 'desc'] as const);
    const [activeParam, setActiveParam] = useQueryParam('active');
    const activeOnly = activeParam === '1';
    const setActiveOnly = (on: boolean) => setActiveParam(on ? '1' : '', FIRST_PAGE);
    const [minParam, setMinParam] = useQueryParam('min', '50');
    const minGamesThreshold = parseInt(minParam, 10) || 50;
    const setMinGamesThreshold = (min: number) => setMinParam(String(min), FIRST_PAGE);


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
                const players = (server.game as BrowserGame).players;
                if (Array.isArray(players)) {
                    players.forEach(p => {
                        const pName = typeof p === 'string' ? p : p?.name;
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
    const [rosterError, setRosterError] = useState(false);

    const activeReqRef = React.useRef(0);

    // Fetch aggregated stats from server
    const loadRoster = (isActiveWindow: boolean = activeOnly) => {
        const reqId = ++activeReqRef.current;
        setLoadingRoster(true);
        setRosterError(false);
        let url = '/api/stats/pilots?source=all';
        if (isActiveWindow) {
            const d = new Date();
            d.setDate(d.getDate() - 90);
            d.setMinutes(0, 0, 0);
            url = `/api/stats/pilots?startDate=${encodeURIComponent(d.toISOString())}&source=hot`;
        }

        fetch(url)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then(data => {
                if (reqId !== activeReqRef.current) return;
                const formatted = data.map((p: any) => ({
                    ...p,
                    lastSeen: new Date(p.lastSeen || p.last_updated),
                    suicides: p.suicides || 0,
                    kd: p.kd !== undefined ? p.kd : (p.kills / Math.max(1, p.deaths)),
                    kda: p.kda !== undefined ? p.kda : combatRatio(p.kills, p.assists, p.deaths),
                    win_rate: p.win_rate !== undefined ? p.win_rate : (p.games > 0 && p.wins !== undefined ? ((p.wins / p.games) * 100) : undefined),
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
                if (reqId !== activeReqRef.current) return;
                console.error("Failed to load pilot stats", err);
                setRosterError(true);
                setLoadingRoster(false);
            });
    };

    React.useEffect(() => {
        loadRoster(activeOnly);
    }, [activeOnly]);


    const sortedRoster = useMemo(() => {
        let data = [...pilotRoster];

        // Qualification Filter (min matches) - automatically bypassed during search
        if (!searchTerm.trim() && minGamesThreshold > 1) {
            data = data.filter(p => p.games >= minGamesThreshold);
        }

        if (searchTerm.trim()) {
            data = data.filter(p => p.name.toLowerCase().includes(searchTerm.trim().toLowerCase()));
        }

        return data.sort((a, b) => {
            // a missing number (Lethality before the stats cache exists) sorts as lowest
            const valA = a[sortKey] ?? -Infinity;
            const valB = b[sortKey] ?? -Infinity;

            if (valA < valB) return sortDir === 'asc' ? -1 : 1;
            if (valA > valB) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });
    }, [pilotRoster, searchTerm, sortKey, sortDir, minGamesThreshold]);

    const paging = usePage(sortedRoster, ROSTER_PAGE_SIZE);

    // A click on the sorted column flips it; another column starts descending.
    const handleSort = (key: SortKey) => {
        const flip = key === sortKey && sortDir === 'desc';
        setSortKey(key, { ...FIRST_PAGE, dir: flip ? 'asc' : null });
    };
    const sortProps = (key: SortKey) => ({
        direction: sortKey === key ? sortDir : null,
        onSort: () => handleSort(key)
    });
    const search = (text: string) => {
        setSearchTerm(text);
        paging.setPage(1);
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

    // Leaderboard Freshness Indicator
    const freshnessText = useMemo(() => {
        if (!pilotRoster || pilotRoster.length === 0) return null;
        let latestTime = 0;
        for (const p of pilotRoster) {
            const t = p.lastSeen instanceof Date ? p.lastSeen.getTime() : new Date(p.lastSeen).getTime();
            if (t > latestTime) latestTime = t;
        }
        if (!latestTime) return null;
        const diffMs = Date.now() - latestTime;
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return 'Updated just now';
        if (diffMins < 60) return `Updated ${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `Updated ${diffHours}h ago`;
        const diffDays = Math.floor(diffHours / 24);
        return `Updated ${diffDays}d ago`;
    }, [pilotRoster]);

    return (
        <div className="space-y-6">

            <div className="flex flex-wrap justify-between items-center border-b border-line mb-6">
                <div className="flex">
                    <button
                        onClick={() => setActiveTab('online')}
                        className={`px-6 py-3 font-mono text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                            activeTab === 'online'
                                ? 'border-brand text-brand bg-brand/5'
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
                                ? 'border-brand text-brand bg-brand/5'
                                : 'border-transparent text-gray-500 hover:text-gray-300'
                        }`}
                    >
                        PILOT ROSTER & LEADERBOARD
                        <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400">
                            {pilotRoster.length}
                        </span>
                    </button>
                </div>
                <Link to={urlFor('rankings')} className="px-4 py-3 font-mono text-sm font-bold text-gray-400 hover:text-brand flex items-center gap-2 whitespace-nowrap">
                    <Trophy size={14} className="text-brand" aria-hidden /> POWER RANKINGS
                </Link>
                <Link to={urlFor('ladders')} className="px-4 py-3 font-mono text-sm font-bold text-gray-400 hover:text-brand flex items-center gap-2 whitespace-nowrap">
                    <Swords size={14} className="text-brand" aria-hidden /> LADDERS
                </Link>
            </div>

            {activeTab === 'online' && (
                <div className="space-y-4">
                    {onlinePilots.length > 0 ? (
                        <div className="bg-surface-card border border-line rounded-card overflow-x-auto">
                            <table className="w-full text-left text-sm font-mono">
                                <thead className="bg-surface-raised text-gray-500 text-xs uppercase">
                                    <tr>
                                        <th className="p-4">Pilot Name</th>
                                        <th className="p-4">Playing On</th>
                                        <th className="p-4">Mode / Map</th>
                                        <th className="p-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-line">
                                    {onlinePilots.map((pilot, idx) => (
                                        <tr key={`${pilot.name}-${idx}`} className="hover:bg-surface-raised group transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                                    <Link
                                                        to={urlFor('pilot', pilot.name)}
                                                        className="font-bold text-white text-lg hover:text-brand hover:underline transition-colors text-left"
                                                    >
                                                        {pilot.name}
                                                    </Link>
                                                    {pilot.isCreator && <span className="text-2xs bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded-control border border-gray-700">HOST</span>}
                                                </div>
                                            </td>
                                            <td className="p-4 text-gray-300">
                                                {pilot.server.server.name}
                                            </td>
                                            <td className="p-4 text-gray-400 text-xs">
                                                <span className="text-brand font-bold">{pilot.server.game?.mode}</span>
                                                <span className="mx-2">|</span>
                                                {pilot.server.game?.mapName}
                                            </td>
                                            <td className="p-4 text-right">
                                                <Link
                                                    to={urlFor('live-game-detail', pilot.server.server.ip)}
                                                    className="bg-brand/10 hover:bg-brand text-brand hover:text-white border border-brand/50 px-3 py-1.5 rounded-control text-xs font-bold uppercase transition-all"
                                                >
                                                    View Match
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <EmptyState
                            card
                            icon={Users}
                            title="No identified pilots in active matches."
                            message="Pilots show here while they are in a match on a listed server."
                        />
                    )}
                </div>
            )}

            {activeTab === 'roster' && (
                <div className="space-y-6">
                    {/* Highlights Section */}
                    {highlights && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {highlights.topGun && (
                                <div className="bg-gradient-to-br from-surface-card to-surface-raised border border-line p-6 rounded-card relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Trophy size={64} />
                                    </div>
                                    <div className="relative z-10">
                                        <h3 className="text-brand text-xs font-bold uppercase mb-2 flex items-center gap-2 group cursor-help" title={`Pilot with the best Combat Ratio (min ${Math.max(minGamesThreshold > 1 ? minGamesThreshold : 25, 25)} matches). ${COMBAT_RATIO_HINT}`}>
                                            <Trophy size={14} /> Top Gun (Best Combat Ratio) <Info size={10} className="text-gray-600 group-hover:text-brand" />
                                        </h3>
                                        <div className="text-2xl font-bold text-white mb-1">{highlights.topGun.name}</div>
                                        <div className="text-sm text-gray-400 font-mono">
                                            <span className="text-brand font-bold">{highlights.topGun.kda.toFixed(2)}</span> Combat Ratio / {highlights.topGun.games} Matches
                                        </div>
                                    </div>
                                </div>
                            )}
                            {highlights.mostActive && (
                                <div className="bg-gradient-to-br from-surface-card to-surface-raised border border-line p-6 rounded-card relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <TrendingUp size={64} />
                                    </div>
                                    <div className="relative z-10">
                                        <h3 className="text-blue-400 text-xs font-bold uppercase mb-2 flex items-center gap-2 group cursor-help" title="Pilot with the most matches played">
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
                                <div className="bg-gradient-to-br from-surface-card to-surface-raised border border-line p-6 rounded-card relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Skull size={64} />
                                    </div>
                                    <div className="relative z-10">
                                        <h3 className="text-red-400 text-xs font-bold uppercase mb-2 flex items-center gap-2 group cursor-help" title="Pilot with highest total kills">
                                            <Skull size={14} /> Slayer (Most Kills) <Info size={10} className="text-gray-600 group-hover:text-red-400" />
                                        </h3>
                                        <div className="text-2xl font-bold text-white mb-1">{highlights.slayer.name}</div>
                                        <div className="text-sm text-gray-400 font-mono">
                                            <span className="text-red-400 font-bold">{Math.max(0, highlights.slayer.kills).toLocaleString()}</span> Total Confirmed Kills
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="bg-surface-card border border-line rounded-card overflow-hidden">
                        <div className="p-4 border-b border-line bg-surface-raised flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-white font-bold text-sm uppercase tracking-wider">Pilot Roster</h3>
                                        <span className="text-xs text-gray-400 font-mono bg-gray-800/80 px-2 py-0.5 rounded-control border border-gray-700">
                                            {searchTerm.trim() ? `${sortedRoster.length} found` : `${sortedRoster.length} pilots`}
                                        </span>
                                    </div>
                                    {freshnessText && (
                                        <span className="text-2xs text-gray-500 font-mono flex items-center gap-1.5 sm:border-l sm:border-line sm:pl-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                            {freshnessText}
                                        </span>
                                    )}
                                </div>

                                {/* Qualification Threshold Pills */}
                                <div className="flex items-center gap-1 bg-surface-page border border-gray-700 rounded-control p-1 text-xs">
                                    <span className="text-2xs uppercase font-bold text-gray-400 px-2 flex items-center gap-1">
                                        <Trophy size={11} className="text-brand" /> Min Matches:
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
                                            className={`px-2.5 py-1 text-xs font-bold rounded-control transition-all ${
                                                minGamesThreshold === tier.value
                                                    ? 'bg-brand text-black shadow font-extrabold'
                                                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                            }`}
                                        >
                                            {tier.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Timeframe Toggle */}
                                <div className="flex items-center gap-1 bg-surface-page border border-gray-700 rounded-control p-1 text-xs">
                                    <button
                                        onClick={() => setActiveOnly(false)}
                                        className={`px-3 py-1 text-xs font-bold rounded-control transition-colors ${!activeOnly ? 'bg-blue-900/60 text-blue-200 border border-blue-500/40' : 'text-gray-400 hover:text-white'}`}
                                    >
                                        ALL TIME
                                    </button>
                                    <button
                                        onClick={() => setActiveOnly(true)}
                                        className={`px-3 py-1 text-xs font-bold rounded-control transition-colors ${activeOnly ? 'bg-blue-900/60 text-blue-200 border border-blue-500/40' : 'text-gray-400 hover:text-white'}`}
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
                                        className="bg-surface-page border border-gray-700 text-white text-xs px-3 py-2 pl-9 pr-7 rounded-control w-full focus:border-brand outline-none font-mono"
                                        value={searchTerm}
                                        onChange={(e) => search(e.target.value)}
                                        aria-label="Search pilots"
                                    />
                                    <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                    {searchTerm && (
                                        <button
                                            onClick={() => search('')}
                                            aria-label="Clear search"
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
                            <div className="px-4 py-1.5 bg-blue-950/30 border-b border-blue-900/30 text-2xs text-blue-300 font-mono flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                    <Info size={12} className="text-blue-400" />
                                    <span>Sample size threshold bypassed &mdash; searching across all {pilotRoster.length.toLocaleString()} pilots.</span>
                                </span>
                                <button onClick={() => search('')} className="underline hover:text-white text-blue-400">
                                    Clear Search
                                </button>
                            </div>
                        )}

                        {loadingRoster ? (
                            <Loading compact label="Loading pilot data..." />
                        ) : rosterError ? (
                            <div className="p-4">
                                <ErrorState compact title="Roster unavailable" message="Could not load pilot stats." onRetry={() => loadRoster()} />
                            </div>
                        ) : sortedRoster.length === 0 ? (
                            <EmptyState
                                icon={Search}
                                title="No pilots match current filters"
                                message="Try selecting a lower matches threshold or switching to All Time."
                                action={
                                    <button
                                        onClick={() => { setMinParam('1', { ...FIRST_PAGE, active: null }); setSearchTerm(''); }}
                                        className="text-xs text-brand underline hover:text-brand-hover font-bold"
                                    >
                                        Reset Filters
                                    </button>
                                }
                            />
                        ) : (
                            <div id="pilot-roster" className="scroll-mt-20">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm font-mono">
                                    <thead className="bg-surface-raised text-gray-500 text-xs uppercase">
                                        <tr>
                                            <th className="p-3 text-center w-10">#</th>
                                            <SortHeader className="p-3" {...sortProps('name')}>Pilot</SortHeader>
                                            <SortHeader className="p-3 text-right" {...sortProps('games')}>Matches</SortHeader>
                                            <SortHeader className="p-3 text-right" {...sortProps('kills')}>Kills (K)</SortHeader>
                                            <SortHeader className="p-3 text-right" {...sortProps('deaths')}>Deaths (D)</SortHeader>
                                            <SortHeader className="p-3 text-right" {...sortProps('kd')} title="Kills ÷ Deaths. Kills are the in-game count, which already loses 1 per suicide; a match that ends below zero counts as 0. With no deaths, K/D equals kills.">
                                                K/D <Info size={11} className="text-gray-500" aria-hidden />
                                            </SortHeader>
                                            <SortHeader className="p-3 text-right" {...sortProps('kda')} title={COMBAT_RATIO_HINT}>
                                                Combat Ratio <Info size={11} className="text-gray-500" aria-hidden />
                                            </SortHeader>
                                            <SortHeader className="p-3 text-right" {...sortProps('kpm')} title={LETHALITY_HINT}>
                                                Lethality <Info size={11} className="text-gray-500" aria-hidden />
                                            </SortHeader>
                                            <SortHeader className="p-3 text-right" {...sortProps('win_rate')} title="Wins ÷ (Wins + Losses + Ties). Ties count as non-wins. In free-for-all, only 1st place earns a win; all others take a loss (shared top = tie).">
                                                Win Rate <Info size={11} className="text-gray-500" aria-hidden />
                                            </SortHeader>
                                            <SortHeader className="p-3 text-right" {...sortProps('suicides')} title="The game subtracts 1 kill per suicide (game rule); tracked separately here.">
                                                Suicides <Info size={11} className="text-gray-500" aria-hidden />
                                            </SortHeader>
                                            <SortHeader className="p-3 text-right" {...sortProps('lastSeen')}>Last Seen</SortHeader>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-line">
                                        {paging.items.map((pilot, index) => {
                                            const url = urlFor('pilot', pilot.name);
                                            return (
                                            <tr key={pilot.name} className="hover:bg-surface-raised group transition-colors">
                                                <LinkCell to={url} className="p-3 text-center text-gray-600 font-bold">{paging.start + index + 1}</LinkCell>
                                                <LinkCell main to={url} className="p-3 flex items-center gap-2 font-bold text-white hover:text-brand">
                                                    <User size={14} className="text-gray-600" aria-hidden />
                                                    {pilot.name}
                                                </LinkCell>
                                                <LinkCell to={url} className="p-3 text-right text-gray-400">{pilot.games.toLocaleString()}</LinkCell>
                                                <LinkCell to={url} className="p-3 text-right font-bold text-gray-200">{Math.max(0, pilot.kills).toLocaleString()}</LinkCell>
                                                <LinkCell to={url} className="p-3 text-right font-mono text-red-400">{pilot.deaths.toLocaleString()}</LinkCell>
                                                <LinkCell to={url} className="p-3 text-right font-mono text-gray-300">{Math.max(0, pilot.kd).toFixed(2)}</LinkCell>
                                                <LinkCell to={url} className="p-3 text-right font-bold text-brand text-sm">{Math.max(0, pilot.kda).toFixed(2)}</LinkCell>
                                                <LinkCell to={url} className="p-3 text-right font-mono text-gray-300">{pilot.kpm != null ? pilot.kpm.toFixed(2) : '—'}</LinkCell>
                                                <LinkCell to={url} className="p-3 text-right">
                                                    <div className="font-bold text-emerald-400 text-sm">
                                                        {pilot.win_rate !== undefined ? `${pilot.win_rate.toFixed(1)}%` : '—'}
                                                    </div>
                                                    {pilot.wins !== undefined && (
                                                        <div className="text-2xs text-gray-500 font-mono">
                                                            {pilot.wins}W - {pilot.losses}L
                                                        </div>
                                                    )}
                                                </LinkCell>
                                                <LinkCell to={url} className={`p-3 text-right font-mono text-xs ${pilot.suicides > 0 ? 'text-amber-400 font-bold' : 'text-gray-600'}`}>
                                                    {pilot.suicides.toLocaleString()}
                                                </LinkCell>
                                                <LinkCell to={url} className="p-3 text-gray-500 text-xs flex items-center justify-end gap-1">
                                                    <Calendar size={12} aria-hidden />
                                                    {pilot.lastSeen.toLocaleDateString()}
                                                </LinkCell>
                                            </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            {paging.pageCount > 1 && (
                                <div className="px-4 pb-4">
                                    <Pager paging={paging} listId="pilot-roster" />
                                </div>
                            )}
                            </div>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
};

export default PilotsList;
