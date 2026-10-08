import React, { useEffect, useState } from 'react';
import { GameData } from '../types';
import { Trophy, Crosshair, Map as MapIcon, Shield, Skull, Swords, ExternalLink, Zap, Clock, Flame, Filter } from 'lucide-react';
import PilotPerformanceCard from './PilotPerformanceCard';
import RatingCard from './pilotDetail/RatingCard';
import { colors } from '../designTokens.js';
import { Loading, EmptyState, ErrorState } from './States';
import Link, { LinkCell } from './Link';
import { useQueryParam } from '../hooks/useLocation';
import { urlFor } from '../server/lib/siteRoutes.js';
import { combatRatio, COMBAT_RATIO_HINT, LETHALITY_HINT } from '../server/lib/gameParse.js';

interface PilotStats {
    games: number;
    kills: number;
    deaths: number;
    assists: number;
    suicides?: number;
    last_seen: string;
    favorite_map: string;
    favorite_weapon: string;
    pure_kd?: number;
    kda?: number;
    wins?: number;
    losses?: number;
    ties?: number;
    win_rate?: number;
    flight_time_seconds?: number;
    flight_hours?: number;
    kpm?: number;
    aci?: number;
    total_damage_dealt?: number;
    total_damage_taken?: number;
    dpm?: number;
    damage_taken_per_death?: number;
    net_damage?: number;
    net_dpm?: number;
    career_games?: number;
    career_kills?: number;
    career_deaths?: number;
    career_assists?: number;
    career_suicides?: number;
    career_wins?: number;
    career_losses?: number;
    career_ties?: number;
    career_win_rate?: number;
    career_kd?: number;
    career_kda?: number;
    career_flight_hours?: number;
    recent_games?: number;
    scope?: 'recent' | 'all';
    weapons?: Array<{
        name: string;
        damage: number;
        hits: number;
        kills: number;
        isPrimary: boolean;
        pctOfTotalDamage: number;
    }>;
    weapon_summary?: {
        primaryDamage: number;
        secondaryDamage: number;
        primaryPct: number;
        secondaryPct: number;
        totalDamage: number;
    };
    damage_taken_weapons?: Array<{
        name: string;
        damage: number;
        hits: number;
        deaths: number;
        isPrimary: boolean;
        pctOfTotalDamage: number;
    }>;
    damage_taken_summary?: {
        primaryDamage: number;
        secondaryDamage: number;
        primaryPct: number;
        secondaryPct: number;
        totalDamage: number;
    };
}

interface MapStat {
    map: string;
    games: number;
    kills: number;
    deaths: number;
    assists: number;
    kd: number;
}

interface RivalStat {
    name: string;
    encounters: number;
    your_kills?: number;
    their_kills?: number;
    your_wins?: number;
    their_wins?: number;
    ties?: number;
    h2h_kd?: number;
    their_kd?: number;
    their_deaths?: number;
    kd?: number;
    kda?: number;
    win_rate?: number;
    flight_hours?: number;
    threat_centrality?: number;
    dominance_index?: number;
}

interface PilotBreakdown {
    mapStats: MapStat[];
    rivals: RivalStat[];
}

interface PilotDetailProps {
    pilotName: string;
    onBack?: () => void;
}

const PilotDetail: React.FC<PilotDetailProps> = ({ pilotName, onBack }) => {
    const [stats, setStats] = useState<PilotStats | null>(null);
    const [breakdown, setBreakdown] = useState<PilotBreakdown>({ mapStats: [], rivals: [] });
    const [games, setGames] = useState<GameData[]>([]);
    const [pilotPpi, setPilotPpi] = useState<any>(null);
    const [selectedRivalName, setSelectedRivalName] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [failed, setFailed] = useState(false);
    const [retries, setRetries] = useState(0);
    // ?mode= filters the stats and match list; ?weapons=defense picks the weapon tab
    const [selectedMode, setSelectedMode] = useQueryParam('mode', 'ALL');
    const [weaponView, setWeaponView] = useQueryParam('weapons', 'offense', ['offense', 'defense'] as const);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setFailed(false);
            try {
                const modeQuery = selectedMode !== 'ALL' ? `?mode=${encodeURIComponent(selectedMode)}` : '';
                const [statsRes, gamesRes, breakdownRes, ppiRes] = await Promise.all([
                    fetch(`/api/pilot/${encodeURIComponent(pilotName)}/stats${modeQuery}`),
                    fetch(`/api/pilot/${encodeURIComponent(pilotName)}/games${modeQuery}`),
                    fetch(`/api/pilot/${encodeURIComponent(pilotName)}/breakdown`),
                    fetch(`/api/pilot/${encodeURIComponent(pilotName)}/ppi`)
                ]);

                if (statsRes.ok) {
                    setStats(await statsRes.json());
                }
                if (gamesRes.ok) {
                    const gamesData = await gamesRes.json();
                    setGames(gamesData.games || []);
                }
                // without stats or the match list the page has nothing true to show
                if (!statsRes.ok || !gamesRes.ok) setFailed(true);
                if (ppiRes.ok) {
                    setPilotPpi(await ppiRes.json());
                }
                if (breakdownRes.ok) {
                    const bData = await breakdownRes.json();
                    setBreakdown(bData);
                    if (bData.rivals && bData.rivals.length > 0) {
                        setSelectedRivalName(prev => prev || bData.rivals[0].name);
                    }
                }
            } catch (err) {
                console.error("Failed to load pilot detail", err);
                setFailed(true);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [pilotName, selectedMode, retries]);

    if (!pilotName) return null;

    // Real Stats Only - No "Fluff"
    const pureKd = stats?.pure_kd !== undefined ? stats.pure_kd : (stats ? stats.kills / Math.max(1, stats.deaths) : 0);
    const kda = stats?.kda !== undefined ? stats.kda : (stats ? combatRatio(stats.kills, stats.assists, stats.deaths) : 0);
    // Career numbers, the ones the leaderboard shows
    const careerKd = stats?.career_kd ?? pureKd;
    const careerKda = stats?.career_kda ?? kda;
    const eff = stats ? stats.kills / Math.max(1, stats.games) : 0; // Kills per game
    const survival = stats ? stats.deaths / Math.max(1, stats.games) : 0; // Deaths per game
    const lastActiveDate = stats ? new Date(stats.last_seen).toLocaleDateString() : 'Unknown';

    return (
        <div className="w-full max-w-7xl mx-auto pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                {onBack ? (
                    <button
                        onClick={onBack}
                        className="flex items-center text-gray-500 hover:text-brand transition-colors font-mono text-sm"
                    >
                        <span className="mr-1">&lt;</span> BACK
                    </button>
                ) : <div />}

                {/* Match Mode Filter */}
                <div className="flex flex-wrap items-center gap-1.5 bg-surface-page border border-line rounded-control p-1 text-xs font-mono">
                    <span className="text-gray-500 font-bold px-2 flex items-center gap-1">
                        <Filter size={11} className="text-brand" /> MODE:
                    </span>
                    {[
                        { id: 'ALL', label: 'All Modes' },
                        { id: 'ANARCHY', label: 'Anarchy' },
                        { id: 'TEAM ANARCHY', label: 'Team Anarchy' },
                        { id: 'CTF', label: 'CTF' },
                        { id: 'MONSTERBALL', label: 'Monsterball' }
                    ].map(m => (
                        <button
                            key={m.id}
                            onClick={() => setSelectedMode(m.id)}
                            className={`px-2.5 py-1 rounded-control text-xs font-bold transition-all ${
                                selectedMode === m.id
                                    ? 'bg-brand text-black shadow font-extrabold'
                                    : 'text-gray-400 hover:text-white hover:bg-gray-800/80'
                            }`}
                        >
                            {m.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Left Sidebar: Profile & Key Metrics */}
                <div className="w-full lg:w-[320px] shrink-0 space-y-6">
                    <div className="bg-surface-page border border-line rounded-card p-8 flex flex-col items-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-brand"></div>

                        <div className="relative mb-6 group">
                            <div className="w-24 h-24 rounded-card border border-line bg-surface-card shadow-[0_4px_20px_rgba(0,0,0,0.6)] overflow-hidden transition-all duration-300 group-hover:border-brand/50 group-hover:shadow-[0_0_20px_rgba(255,102,0,0.15)]">
                                <PilotAvatar name={pilotName} />
                            </div>
                            {/* Status Indicator Pip */}
                            <div className="absolute -bottom-1 -right-1 bg-black/90 px-1.5 py-0.5 rounded-full border border-line flex items-center gap-1 shadow">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span className="text-2xs font-mono text-gray-400 uppercase tracking-wider font-semibold">PILOT</span>
                            </div>
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-2 text-center tracking-tight break-all">{pilotName}</h2>
                        <div className="text-brand font-mono text-xs uppercase tracking-[0.2em] mb-6">Overload Pilot</div>

                        <div className="text-gray-500 text-xs font-mono mb-6">
                            Last Active: <span className="text-gray-300">{lastActiveDate}</span>
                        </div>

                        {stats && (
                            <div className="w-full grid grid-cols-1 gap-2">
                                <div className="bg-surface-card p-3 rounded-card border border-line flex justify-between items-center">
                                    <div>
                                        <span className="text-gray-500 text-xs uppercase block">Matches</span>
                                        {stats.career_games && stats.career_games > stats.games && (
                                            <span className="text-2xs text-gray-500 font-mono">Recent: {stats.games}</span>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xl font-bold text-white">{(stats.career_games || stats.games).toLocaleString()}</span>
                                        {stats.career_games && stats.career_games > stats.games && (
                                            <div className="text-2xs font-mono text-brand uppercase font-bold">All-Time Career</div>
                                        )}
                                    </div>
                                </div>
                                {stats.wins !== undefined && (
                                    <div
                                        className="bg-surface-card p-3 rounded-card border border-line flex justify-between items-center cursor-help"
                                        title="Wins ÷ (Wins + Losses + Ties). Ties count as non-wins. In free-for-all, only 1st place earns a win; all others take a loss (shared top = tie)."
                                    >
                                        <div>
                                            <span className="text-gray-500 text-xs uppercase block">Record (W-L)</span>
                                            {stats.career_wins !== undefined && stats.career_games && stats.career_games > stats.games && (
                                                <span className="text-2xs text-gray-500 font-mono">Recent: {stats.wins}W-{stats.losses}L</span>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <span className="text-lg font-bold text-white">
                                                {stats.career_wins ?? stats.wins}W - {stats.career_losses ?? stats.losses}L
                                            </span>
                                            <div className="text-2xs font-mono text-emerald-400 font-bold">{stats.career_win_rate ?? stats.win_rate}% Win Rate</div>
                                        </div>
                                    </div>
                                )}
                                <div
                                    className="bg-surface-card p-3 rounded-card border border-line flex justify-between items-center cursor-help"
                                    title={COMBAT_RATIO_HINT}
                                >
                                    <div>
                                        <span className="text-gray-500 text-xs uppercase block">Combat Ratio</span>
                                        {stats.career_kda !== undefined && stats.career_games && stats.career_games > stats.games && (
                                            <span className="text-2xs text-gray-500 font-mono">Recent: {kda.toFixed(2)}</span>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <span className="text-lg font-bold text-brand">{careerKda.toFixed(2)}</span>
                                        <div className="text-2xs font-mono text-gray-400">{careerKd.toFixed(2)} K/D</div>
                                    </div>
                                </div>
                                <div className="bg-surface-card p-3 rounded-card border border-line flex justify-between items-center">
                                    <div>
                                        <span className="text-gray-500 text-xs uppercase block">Total Kills</span>
                                        {stats.career_kills !== undefined && stats.career_games && stats.career_games > stats.games && (
                                            <span className="text-2xs text-gray-500 font-mono">Recent: {Math.max(0, stats.kills).toLocaleString()}</span>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xl font-bold text-white">
                                            {Math.max(0, stats.career_kills ?? stats.kills).toLocaleString()}
                                        </span>
                                        {stats.career_kills !== undefined && stats.career_games && stats.career_games > stats.games && (
                                            <div className="text-2xs font-mono text-brand uppercase font-bold">All-Time Career</div>
                                        )}
                                    </div>
                                </div>
                                <div
                                    className="bg-surface-card p-3 rounded-card border border-line flex justify-between items-center cursor-help"
                                    title="The game subtracts 1 kill per suicide (game rule); tracked separately here."
                                >
                                    <div>
                                        <span className="text-gray-500 text-xs uppercase block">Suicides</span>
                                        {stats.career_suicides !== undefined && stats.career_games && stats.career_games > stats.games && (
                                            <span className="text-2xs text-gray-500 font-mono">Recent: {stats.suicides || 0}</span>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <span className="text-lg font-bold font-mono text-amber-400">
                                            {(stats.career_suicides ?? stats.suicides ?? 0).toLocaleString()}
                                        </span>
                                        <div className="text-2xs font-mono text-gray-500 uppercase">Self-Kills</div>
                                    </div>
                                </div>
                                {stats.total_damage_dealt !== undefined && stats.total_damage_dealt > 0 && (
                                    <div className="bg-surface-card p-3 rounded-card border border-line flex justify-between items-center">
                                        <span className="text-gray-500 text-xs uppercase">Damage Dealt</span>
                                        <div className="text-right">
                                            <span className="text-lg font-bold text-white">
                                                {stats.total_damage_dealt >= 1000000
                                                    ? `${(stats.total_damage_dealt / 1000000).toFixed(2)}M`
                                                    : stats.total_damage_dealt.toLocaleString()}
                                            </span>
                                            {stats.dpm ? <div className="text-2xs font-mono text-brand">{stats.dpm} DPM</div> : null}
                                        </div>
                                    </div>
                                )}
                                {stats.flight_hours !== undefined && stats.flight_hours > 0 && (
                                    <div className="bg-surface-card p-3 rounded-card border border-line flex justify-between items-center">
                                        <span className="text-gray-500 text-xs uppercase">Flight Hours</span>
                                        <span className="text-lg font-bold font-mono text-gray-300">
                                            {stats.career_flight_hours ?? stats.flight_hours} hrs
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Content: Detailed Stats & History */}
                <div className="flex-grow space-y-8">
                    {loading ? (
                        <div className="bg-surface-page border border-line rounded-card">
                            <Loading label="Retrieving combat data..." />
                        </div>
                    ) : failed ? (
                        <ErrorState
                            compact
                            title="Combat data unavailable"
                            message={`Could not load ${pilotName}'s stats.`}
                            onRetry={() => setRetries(n => n + 1)}
                        />
                    ) : stats ? (
                        <div className="space-y-6">
                            {/* Scope Banner if analyzed recent telemetry differs from career total */}
                            {stats.career_games && stats.career_games > stats.games && (
                                <div className="bg-surface-card border border-line/90 rounded-card p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-mono">
                                    <div className="flex items-center gap-2 text-brand">
                                        <span className="w-2 h-2 rounded-full bg-brand animate-pulse"></span>
                                        <span>RECENT FORM: <strong>{stats.games} MATCHES ANALYZED</strong> ({stats.scope === 'all' ? 'All Time' : 'Past 365 Days'})</span>
                                    </div>
                                    <span className="text-gray-400">
                                        CAREER RECORD: <strong className="text-white">{stats.career_games.toLocaleString()} MATCHES</strong>
                                    </span>
                                </div>
                            )}

                            {/* PPI Framework Dashboard */}
                            <PilotPerformanceCard pilotName={pilotName} />

                            <RatingCard pilotName={pilotName} />

                            {/* Arsenal Breakdown & Weapon Mastery */}
                            {((stats.weapons && stats.weapons.length > 0) || (stats.damage_taken_weapons && stats.damage_taken_weapons.length > 0)) && (
                                <div>
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-line pb-2 mb-4 gap-2">
                                        <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                                            <Crosshair size={16} className={weaponView === 'offense' ? 'text-brand' : 'text-blue-400'} />
                                            <span>Arsenal Telemetry & Weapon Impact</span>
                                        </h3>
                                        {/* View Toggle */}
                                        <div className="flex items-center gap-1 bg-surface-page border border-line p-1 rounded-control text-xs font-mono">
                                            <button
                                                onClick={() => setWeaponView('offense')}
                                                className={`px-3 py-1 rounded-control text-xs font-bold transition-all ${
                                                    weaponView === 'offense'
                                                        ? 'bg-brand text-black shadow font-extrabold'
                                                        : 'text-gray-400 hover:text-white'
                                                }`}
                                            >
                                                Damage Dealt (Offense)
                                            </button>
                                            <button
                                                onClick={() => setWeaponView('defense')}
                                                className={`px-3 py-1 rounded-control text-xs font-bold transition-all ${
                                                    weaponView === 'defense'
                                                        ? 'bg-blue-600 text-white shadow font-extrabold'
                                                        : 'text-gray-400 hover:text-white'
                                                }`}
                                            >
                                                Damage Taken (Defense)
                                            </button>
                                        </div>
                                    </div>

                                    {weaponView === 'offense' ? (
                                        <>
                                            {stats.weapon_summary && (
                                                <div className="bg-surface-card border border-line p-4 rounded-card mb-4">
                                                    <div className="flex justify-between text-xs font-mono mb-2">
                                                        <span className="text-cyan-400 font-bold">Primary Guns: {stats.weapon_summary.primaryPct}% ({stats.weapon_summary.primaryDamage >= 1000000 ? `${(stats.weapon_summary.primaryDamage / 1000000).toFixed(1)}M` : stats.weapon_summary.primaryDamage.toLocaleString()} DMG)</span>
                                                        <span className="text-brand font-bold">Secondary Missiles: {stats.weapon_summary.secondaryPct}% ({stats.weapon_summary.secondaryDamage >= 1000000 ? `${(stats.weapon_summary.secondaryDamage / 1000000).toFixed(1)}M` : stats.weapon_summary.secondaryDamage.toLocaleString()} DMG)</span>
                                                    </div>
                                                    <div className="w-full h-2.5 bg-gray-900 rounded-full overflow-hidden flex">
                                                        <div className="bg-cyan-400 h-full transition-all" style={{ width: `${stats.weapon_summary.primaryPct}%` }}></div>
                                                        <div className="bg-brand h-full transition-all" style={{ width: `${stats.weapon_summary.secondaryPct}%` }}></div>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                                {stats.weapons && stats.weapons.slice(0, 8).map((w) => (
                                                    <div key={w.name} className="bg-surface-card border border-line p-3 rounded-card hover:border-brand/50 transition-colors">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <span className={`text-xs font-bold ${w.isPrimary ? 'text-cyan-400' : 'text-brand'}`}>{w.name}</span>
                                                            <span className="text-2xs font-mono text-gray-400 bg-black/60 px-1.5 py-0.5 rounded-control border border-line">{w.pctOfTotalDamage}%</span>
                                                        </div>
                                                        <div className="text-lg font-bold font-mono text-white">
                                                            {w.damage >= 1000000 ? `${(w.damage / 1000000).toFixed(2)}M` : w.damage.toLocaleString()}
                                                            <span className="text-2xs text-gray-500 ml-1 font-normal">DMG</span>
                                                        </div>
                                                        <div className="text-2xs font-mono text-gray-400 flex justify-between mt-1 pt-1 border-t border-line">
                                                            <span>{w.kills.toLocaleString()} Kills</span>
                                                            <span className="text-gray-600">{w.hits.toLocaleString()} Hits</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            {stats.damage_taken_summary && (
                                                <div className="bg-surface-card border border-line p-4 rounded-card mb-4">
                                                    <div className="flex justify-between text-xs font-mono mb-2">
                                                        <span className="text-cyan-400 font-bold">Primary Gun Hits: {stats.damage_taken_summary.primaryPct}% ({stats.damage_taken_summary.primaryDamage >= 1000000 ? `${(stats.damage_taken_summary.primaryDamage / 1000000).toFixed(1)}M` : stats.damage_taken_summary.primaryDamage.toLocaleString()} DMG)</span>
                                                        <span className="text-amber-500 font-bold">Ordnance / Missiles: {stats.damage_taken_summary.secondaryPct}% ({stats.damage_taken_summary.secondaryDamage >= 1000000 ? `${(stats.damage_taken_summary.secondaryDamage / 1000000).toFixed(1)}M` : stats.damage_taken_summary.secondaryDamage.toLocaleString()} DMG)</span>
                                                    </div>
                                                    <div className="w-full h-2.5 bg-gray-900 rounded-full overflow-hidden flex">
                                                        <div className="bg-cyan-500 h-full transition-all" style={{ width: `${stats.damage_taken_summary.primaryPct}%` }}></div>
                                                        <div className="bg-amber-500 h-full transition-all" style={{ width: `${stats.damage_taken_summary.secondaryPct}%` }}></div>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                                {stats.damage_taken_weapons && stats.damage_taken_weapons.slice(0, 8).map((w) => (
                                                    <div key={w.name} className="bg-surface-card border border-line p-3 rounded-card hover:border-blue-500/50 transition-colors">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <span className={`text-xs font-bold ${w.isPrimary ? 'text-cyan-400' : 'text-amber-500'}`}>{w.name}</span>
                                                            <span className="text-2xs font-mono text-gray-400 bg-black/60 px-1.5 py-0.5 rounded-control border border-line">{w.pctOfTotalDamage}%</span>
                                                        </div>
                                                        <div className="text-lg font-bold font-mono text-white">
                                                            {w.damage >= 1000000 ? `${(w.damage / 1000000).toFixed(2)}M` : w.damage.toLocaleString()}
                                                            <span className="text-2xs text-gray-500 ml-1 font-normal">DMG</span>
                                                        </div>
                                                        <div className="text-2xs font-mono text-gray-400 flex justify-between mt-1 pt-1 border-t border-line">
                                                            <span className="text-red-400">{w.deaths.toLocaleString()} Deaths</span>
                                                            <span className="text-gray-500">{w.hits.toLocaleString()} Hits Taken</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Performance Grid */}
                            <div>
                                <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-4 border-b border-line pb-2">Combat Performance</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                                    <StatCard icon={<Skull size={16} />} label="Efficiency" value={eff.toFixed(1)} sub="Kills/Match" />
                                    <StatCard icon={<Shield size={16} />} label="Survival" value={survival.toFixed(1)} sub="Deaths/Match" />
                                    <StatCard icon={<Zap size={16} />} label="Damage Rate" value={stats.dpm ? `${stats.dpm}` : "N/A"} sub="Damage / Min" tooltip="Per-minute rates use total match duration, not your individual time in-game." />
                                    <StatCard icon={<Crosshair size={16} />} label="Lethality" value={stats.kpm ? `${stats.kpm}` : "N/A"} sub={`Kills / Min, ${stats.scope === 'all' ? 'all time' : 'last 365 days'}, ${selectedMode === 'ALL' ? 'all modes' : selectedMode}`} tooltip={`${LETHALITY_HINT} This card counts the matches on this page (its time span and mode); the Lethality card at the top is the whole career.`} />
                                    <StatCard icon={<Shield size={16} />} label="Dmg / Death" value={stats.damage_taken_per_death ? `${stats.damage_taken_per_death.toLocaleString()}` : "N/A"} sub="Punishment Absorbed" tooltip="Damage Taken ÷ Deaths. How much punishment the pilot absorbs before dying." />
                                    <StatCard
                                        icon={<Flame size={16} />}
                                        label="Net DPM"
                                        value={stats.net_dpm !== undefined ? (stats.net_dpm > 0 ? `+${stats.net_dpm}` : `${stats.net_dpm}`) : "N/A"}
                                        sub="Net Damage / Min"
                                        tooltip="(Damage Dealt − Damage Taken) ÷ Total Flight Minutes. True combat efficiency."
                                    />
                                </div>
                            </div>

                            {/* Frequent Adversaries & Combat Rivalries */}
                            {breakdown.rivals && breakdown.rivals.length > 0 && (() => {
                                const activeRival = breakdown.rivals.find(r => r.name === selectedRivalName) || breakdown.rivals[0];

                                const renderTapeRow = (label: string, valA: number, valB: number, format: (v: number) => string = (v) => v.toFixed(2)) => {
                                    const isTie = Math.abs(valA - valB) < 0.001;
                                    const aWins = valA > valB;
                                    const bWins = valB > valA;
                                    const maxVal = Math.max(valA, valB, 0.001);
                                    const pctA = Math.min(100, Math.round((valA / maxVal) * 100));
                                    const pctB = Math.min(100, Math.round((valB / maxVal) * 100));

                                    return (
                                        <div className="bg-black/60 border border-line/80 px-3 py-2 rounded-control grid grid-cols-11 items-center gap-2 font-mono">
                                            <div className={`col-span-3 text-left font-bold ${aWins && !isTie ? 'text-brand' : 'text-gray-300'}`}>
                                                {format(valA)}
                                                {aWins && !isTie && <span className="ml-1 text-2xs text-brand">◀</span>}
                                            </div>

                                            <div className="col-span-5 text-center">
                                                <div className="text-2xs uppercase font-bold tracking-wider text-gray-400 mb-1">{label}</div>
                                                <div className="flex h-1.5 w-full bg-gray-900 rounded-control overflow-hidden">
                                                    <div className="flex-1 flex justify-end">
                                                        <div style={{ width: `${pctA}%` }} className={`h-full ${aWins && !isTie ? 'bg-brand' : 'bg-gray-700'}`} />
                                                    </div>
                                                    <div className="w-0.5 bg-black" />
                                                    <div className="flex-1 flex justify-start">
                                                        <div style={{ width: `${pctB}%` }} className={`h-full ${bWins && !isTie ? 'bg-cyan-500' : 'bg-gray-700'}`} />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className={`col-span-3 text-right font-bold ${bWins && !isTie ? 'text-cyan-400' : 'text-gray-300'}`}>
                                                {bWins && !isTie && <span className="mr-1 text-2xs text-cyan-400">▶</span>}
                                                {format(valB)}
                                            </div>
                                        </div>
                                    );
                                };

                                return (
                                    <div>
                                        <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-4 border-b border-line pb-2 flex items-center justify-between">
                                            <span className="flex items-center gap-2">
                                                <Swords size={16} className="text-brand" />
                                                Frequent Adversaries & Combat Rivalries
                                            </span>
                                            <span className="text-2xs text-gray-600 font-normal">PAST ENCOUNTERS</span>
                                        </h3>

                                        {/* Tale of the Tape Boxing Card */}
                                        {activeRival && (
                                            <div className="bg-gradient-to-b from-surface-card via-surface-card to-black border-2 border-brand/40 rounded-card p-4 sm:p-5 mb-5 shadow-2xl relative overflow-hidden font-mono">
                                                <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xl">🥊</span>
                                                        <div>
                                                            <h4 className="text-sm font-black text-white uppercase tracking-widest brand-font">
                                                                TALE OF THE TAPE
                                                            </h4>
                                                            <p className="text-2xs text-gray-400 uppercase tracking-wider">
                                                                Boxing Card Head-to-Head Comparison
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className="text-xs bg-black text-brand border border-brand/40 px-2.5 py-1 rounded-control font-bold uppercase tracking-wider">
                                                        {activeRival.encounters} {activeRival.encounters === 1 ? 'Match' : 'Matches'} Logged
                                                    </span>
                                                </div>

                                                {/* Fighter Corners */}
                                                <div className="grid grid-cols-11 items-center gap-2 mb-4 text-center">
                                                    <div className="col-span-5 bg-gradient-to-r from-red-950/60 to-black/80 border border-red-900/60 p-2.5 rounded-control text-left">
                                                        <div className="text-2xs text-red-400 font-bold uppercase tracking-wider">HOME CORNER</div>
                                                        <div className="text-sm sm:text-base font-black text-white truncate" title={pilotName}>{pilotName}</div>
                                                    </div>

                                                    <div className="col-span-1 text-xs font-black text-gray-600 uppercase">VS</div>

                                                    <div className="col-span-5 bg-gradient-to-l from-cyan-950/60 to-black/80 border border-cyan-900/60 p-2.5 rounded-control text-right">
                                                        <div className="text-2xs text-cyan-400 font-bold uppercase tracking-wider">RIVAL CORNER</div>
                                                        <Link
                                                            to={urlFor('pilot', activeRival.name)}
                                                            className="text-sm sm:text-base font-black text-white hover:text-cyan-300 transition-colors truncate block ml-auto"
                                                            title={`View ${activeRival.name}'s dossier`}
                                                        >
                                                            {activeRival.name}
                                                        </Link>
                                                    </div>
                                                </div>

                                                {/* Metric Rows */}
                                                <div className="space-y-2 mb-4">
                                                    {renderTapeRow('Kill / Death (KD)', careerKd, activeRival.kd ?? activeRival.their_kd ?? 1.0)}
                                                    {renderTapeRow('Combat Ratio', careerKda, activeRival.kda ?? activeRival.kd ?? 1.0)}
                                                    {renderTapeRow('Win Rate', stats?.career_win_rate ?? stats?.win_rate ?? 0, activeRival.win_rate ?? 0, (v) => `${v.toFixed(1)}%`)}
                                                    {renderTapeRow('Flight Hours', stats?.career_flight_hours ?? stats?.flight_hours ?? 0, activeRival.flight_hours ?? 0, (v) => `${v.toFixed(1)}h`)}
                                                    {renderTapeRow('Threat Centrality', pilotPpi?.threat_centrality ?? 0, activeRival.threat_centrality ?? 0, (v) => v.toFixed(0))}
                                                    {renderTapeRow('Dominance Index', pilotPpi?.dominance_index ?? 0, activeRival.dominance_index ?? 0, (v) => v.toFixed(0))}
                                                </div>

                                                {/* Direct Bout Scoreboard */}
                                                <div className="bg-surface-card border border-line rounded-card p-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
                                                    <span className="text-gray-400">
                                                        Direct Match Series:{' '}
                                                        <strong className="text-white">
                                                            {activeRival.your_wins ?? 0}W - {activeRival.their_wins ?? 0}L{activeRival.ties ? ` (${activeRival.ties}T)` : ''}
                                                        </strong>
                                                    </span>
                                                    <span className="text-gray-400">
                                                        Direct Kills Exchanged:{' '}
                                                        <strong className={(activeRival.your_kills ?? 0) >= (activeRival.their_kills ?? 0) ? 'text-brand' : 'text-gray-300'}>
                                                            {activeRival.your_kills ?? 0} K
                                                        </strong>{' '}
                                                        /{' '}
                                                        <strong className="text-gray-300">
                                                            {activeRival.their_kills ?? 0} D
                                                        </strong>{' '}
                                                        <span className="text-gray-500 font-mono">
                                                            (H2H: {(activeRival.h2h_kd ?? 1).toFixed(2)})
                                                        </span>
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Rivals Selector Grid */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {breakdown.rivals.map((rival) => {
                                                const isSelected = rival.name === activeRival?.name;
                                                return (
                                                    <div
                                                        key={rival.name}
                                                        className={`bg-surface-card border p-4 rounded-card transition-all group relative overflow-hidden ${
                                                            isSelected
                                                                ? 'border-brand ring-1 ring-brand/50 bg-brand/5'
                                                                : 'border-line hover:border-gray-700'
                                                        }`}
                                                    >
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="flex items-center gap-1.5 truncate max-w-[160px]">
                                                                <button
                                                                    onClick={() => setSelectedRivalName(rival.name)}
                                                                    aria-pressed={isSelected}
                                                                    className="stretched-link font-bold text-white group-hover:text-brand transition-colors truncate"
                                                                >
                                                                    {rival.name}
                                                                </button>
                                                                <Link
                                                                    to={urlFor('pilot', rival.name)}
                                                                    title={`View ${rival.name}'s dossier`}
                                                                    aria-label={`Open ${rival.name}'s page`}
                                                                    className="relative z-10 text-gray-500 hover:text-white shrink-0"
                                                                >
                                                                    <ExternalLink size={12} aria-hidden />
                                                                </Link>
                                                            </div>
                                                            <span className={`text-2xs font-mono px-2 py-0.5 rounded-control border ${
                                                                isSelected
                                                                    ? 'bg-brand text-black font-bold border-brand'
                                                                    : 'bg-black text-gray-400 border-line'
                                                            }`}>
                                                                {rival.encounters} {rival.encounters === 1 ? 'Match' : 'Matches'}
                                                            </span>
                                                        </div>
                                                        <div className="space-y-1.5 mt-3 pt-2 border-t border-line text-xs font-mono">
                                                            <div className="flex justify-between items-center text-gray-400">
                                                                <span className="text-gray-500">Match Record:</span>
                                                                <span className="font-bold text-white">
                                                                    {rival.your_wins ?? 0}W - {rival.their_wins ?? 0}L{rival.ties ? ` (${rival.ties}T)` : ''}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-gray-500">Direct H2H:</span>
                                                                <span className={`font-bold ${(rival.your_kills ?? 0) >= (rival.their_kills ?? 0) ? 'text-brand' : 'text-gray-400'}`}>
                                                                    {rival.your_kills ?? 0} K / {rival.their_kills ?? 0} D
                                                                    <span className="text-2xs text-gray-500 ml-1">
                                                                        ({(rival.h2h_kd ?? ((rival.your_kills ?? 0) / Math.max(1, rival.their_kills ?? 0))).toFixed(2)})
                                                                    </span>
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Theater of Operations: Map Performance */}
                            {breakdown.mapStats && breakdown.mapStats.length > 0 && (
                                <div>
                                    <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-4 border-b border-line pb-2 flex items-center justify-between">
                                        <span className="flex items-center gap-2">
                                            <MapIcon size={16} className="text-cyan-400" />
                                            Map Breakdown
                                        </span>
                                        <span className="text-2xs text-gray-600 font-normal">TOP MAPS</span>
                                    </h3>
                                    <div className="bg-surface-page border border-line rounded-card overflow-x-auto">
                                        <table className="w-full text-left text-sm font-mono">
                                            <thead className="bg-surface-card text-gray-500 text-xs uppercase">
                                                <tr>
                                                    <th className="p-3">Map</th>
                                                    <th className="p-3 text-center">Matches</th>
                                                    <th className="p-3 text-center">Kills</th>
                                                    <th className="p-3 text-center">Deaths</th>
                                                    <th className="p-3 text-right">K/D Ratio</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-line/60">
                                                {breakdown.mapStats.map((ms) => (
                                                    <tr key={ms.map} className="hover:bg-surface-card transition-colors">
                                                        <td className="p-3 font-bold text-white flex items-center gap-2">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                                                            {ms.map}
                                                        </td>
                                                        <td className="p-3 text-center text-gray-400">{ms.games}</td>
                                                        <td className="p-3 text-center text-gray-300 font-bold">{ms.kills}</td>
                                                        <td className="p-3 text-center text-red-400">{ms.deaths}</td>
                                                        <td className="p-3 text-right">
                                                            <span className={`font-bold ${ms.kd >= 1 ? 'text-cyan-400' : 'text-gray-500'}`}>
                                                                {ms.kd.toFixed(2)}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Match History Table */}
                            <div>
                                <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-4 border-b border-line pb-2 flex items-center justify-between">
                                    <span>Recent Matches</span>
                                    <span className="text-2xs text-gray-600 font-normal">MATCH HISTORY</span>
                                </h3>
                                <div className="bg-surface-page border border-line rounded-card overflow-x-auto">
                                    <table className="w-full text-left text-sm font-mono">
                                        <thead className="bg-surface-card text-gray-500 text-xs uppercase">
                                            <tr>
                                                <th className="p-4">Date</th>
                                                <th className="p-4">Map / Mode</th>
                                                <th className="p-4 text-center">Outcome</th>
                                                <th className="p-4 text-right">K / A / D</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-line">
                                            {games.map((game) => {
                                                const pStats = game.players?.find(p => p.name?.toLowerCase() === pilotName?.toLowerCase());
                                                if (!pStats) return null;

                                                const isGoodGame = pStats.kills >= pStats.deaths;
                                                const url = urlFor('game-detail', game.id);

                                                return (
                                                    <tr key={game.id} className="hover:bg-surface-card transition-colors group">
                                                        <LinkCell to={url} className="p-4 text-gray-500">
                                                            {new Date(game.date || '').toLocaleDateString()}
                                                            <div className="text-2xs text-gray-700">{new Date(game.date || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                        </LinkCell>
                                                        <LinkCell main to={url} className="p-4">
                                                            <span className="block text-white font-bold group-hover:text-brand transition-colors">{game.settings?.level}</span>
                                                            <span className="block text-2xs text-gray-600">{game.settings?.matchMode}</span>
                                                        </LinkCell>
                                                        <LinkCell to={url} className="p-4 text-center">
                                                            <span className={`text-xs px-2 py-1 rounded-control border ${isGoodGame ? 'border-green-900/50 text-green-500' : 'border-red-900/50 text-red-500'}`}>
                                                                {isGoodGame ? 'POSITIVE' : 'NEGATIVE'}
                                                            </span>
                                                        </LinkCell>
                                                        <LinkCell to={url} className="p-4 text-right">
                                                            <div className="font-bold text-white text-lg">{pStats.kills} <span className="text-gray-600 text-sm font-normal">/ {pStats.assists} / {pStats.deaths}</span></div>
                                                        </LinkCell>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                    {games.length === 0 && <EmptyState compact title="No matches in this mode." />}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="border border-line rounded-card bg-surface-page">
                            <EmptyState title="No data found within the requested timeframe." />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Sub-components

const PilotAvatar = ({ name }: { name: string }) => {
    // Deterministic accent styling based on the pilot's callsign
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const accents = [
        { visorColor: colors.brand.DEFAULT, glow: 'rgba(255,102,0,0.3)', border: 'border-brand/40' },
        { visorColor: '#00d2ff', glow: 'rgba(0,210,255,0.3)', border: 'border-cyan-500/40' },
        { visorColor: '#10b981', glow: 'rgba(16,185,129,0.3)', border: 'border-emerald-500/40' },
        { visorColor: '#f59e0b', glow: 'rgba(245,158,11,0.3)', border: 'border-amber-500/40' },
        { visorColor: '#a855f7', glow: 'rgba(168,85,247,0.3)', border: 'border-purple-500/40' },
    ];
    const theme = accents[Math.abs(hash) % accents.length];
    const initials = (name.slice(0, 2) || 'OP').toUpperCase();

    return (
        <div className="relative w-full h-full flex flex-col items-center justify-center select-none overflow-hidden bg-gradient-to-b from-surface-raised to-surface-page">
            {/* Tactical HUD grid overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:8px_8px] opacity-40 pointer-events-none" />

            {/* Corner telemetry markers */}
            <div className="absolute top-1.5 left-1.5 w-1.5 h-1.5 border-t border-l border-gray-600/70 pointer-events-none" />
            <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 border-t border-r border-gray-600/70 pointer-events-none" />
            <div className="absolute bottom-1.5 left-1.5 w-1.5 h-1.5 border-b border-l border-gray-600/70 pointer-events-none" />
            <div className="absolute bottom-1.5 right-1.5 w-1.5 h-1.5 border-b border-r border-gray-600/70 pointer-events-none" />

            {/* Tactical 6-DOF Pilot Flight Helmet Silhouette */}
            <svg viewBox="0 0 72 72" fill="none" className="w-14 h-14 relative z-10 drop-shadow-md">
                {/* Outer Helmet Crown & Silhouette */}
                <path
                    d="M20 28C20 17 26.5 10 36 10C45.5 10 52 17 52 28C52 36.5 48.5 43.5 46.5 46.5L47.5 53.5L43 55L42 51.5H30L29 55L24.5 53.5L25.5 46.5C23.5 43.5 20 36.5 20 28Z"
                    fill="#18181b"
                    stroke="#3f3f46"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                />

                {/* Tactical Earpiece / Comm Armor Plates */}
                <path d="M17.5 30C17.5 25 19 21.5 21 19.5L20 37C18.5 34.5 17.5 32.5 17.5 30Z" fill="#27272a" stroke="#52525b" strokeWidth="1" />
                <path d="M54.5 30C54.5 25 53 21.5 51 19.5L52 37C53.5 34.5 54.5 32.5 54.5 30Z" fill="#27272a" stroke="#52525b" strokeWidth="1" />

                {/* Pilot Visor Outer Shield */}
                <path
                    d="M23 27.5C23 22 28 19 36 19C44 19 49 22 49 27.5C49 33.5 43.5 37 36 37C28.5 37 23 33.5 23 27.5Z"
                    fill={theme.visorColor}
                    fillOpacity="0.22"
                    stroke={theme.visorColor}
                    strokeWidth="1.6"
                />

                {/* Visor Glare / Specular highlight arc */}
                <path
                    d="M27 24C30 21.8 33 21.5 36 21.5"
                    stroke="#ffffff"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeOpacity="0.65"
                />

                {/* HUD Targeting Reticle & Alignment Ticks */}
                <circle cx="36" cy="28" r="3" stroke={theme.visorColor} strokeWidth="0.8" strokeDasharray="1.5 1.5" />
                <line x1="36" y1="23.5" x2="36" y2="25.5" stroke={theme.visorColor} strokeWidth="0.8" />
                <line x1="36" y1="30.5" x2="36" y2="32.5" stroke={theme.visorColor} strokeWidth="0.8" />
                <line x1="31.5" y1="28" x2="33.5" y2="28" stroke={theme.visorColor} strokeWidth="0.8" />
                <line x1="38.5" y1="28" x2="40.5" y2="28" stroke={theme.visorColor} strokeWidth="0.8" />

                {/* Respirator Filter / Mouth Intake Grille */}
                <path d="M31.5 42H40.5L39.5 49.5H32.5L31.5 42Z" fill="#18181b" stroke="#3f3f46" strokeWidth="1" />
                <line x1="34" y1="44.5" x2="38" y2="44.5" stroke="#71717a" strokeWidth="0.9" strokeLinecap="round" />
                <line x1="34.5" y1="47" x2="37.5" y2="47" stroke="#71717a" strokeWidth="0.9" strokeLinecap="round" />
            </svg>

            {/* Pilot Callsign Tag */}
            <div className="relative z-10 -mt-1 px-2 py-0.5 bg-black/90 rounded-control border border-line flex items-center gap-1 shadow-sm">
                <span className="font-mono text-2xs font-bold tracking-widest text-zinc-300">
                    {initials}
                </span>
            </div>
        </div>
    );
};

const StatCard = ({ icon, label, value, sub, truncate, tooltip }: any) => (
    <div
        className="bg-surface-card border border-line p-4 rounded-card hover:border-brand/30 transition-colors cursor-help"
        title={tooltip || (truncate ? value : undefined)}
    >
        <div className="flex items-center gap-2 text-gray-500 text-xs uppercase mb-2">
            {icon} {label}
        </div>
        <div className={`text-xl font-bold text-white ${truncate ? 'truncate' : ''}`}>{value || "N/A"}</div>
        {sub && <div className="text-2xs text-gray-600 mt-1">{sub}</div>}
    </div>
);

export default PilotDetail;
