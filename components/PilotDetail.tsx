import React, { useEffect, useState } from 'react';
import { GameData } from '../types';
import { Trophy, Crosshair, Map as MapIcon, Shield, Skull, Zap, Clock, Flame, Filter } from 'lucide-react';
import PilotPerformanceCard from './PilotPerformanceCard';
import RatingCard from './pilotDetail/RatingCard';
import CareerCard from './pilotDetail/CareerCard';
import WeaponMix from './pilotDetail/WeaponMix';
import KillLogRivalry from './pilotDetail/KillLogRivalry';
import TapeOpponents from './pilotDetail/TapeOpponents';
import AchievementsCard from './pilotDetail/AchievementsCard';
import BeltMark from './BeltMark';
import { useLoad } from '../hooks/useLoad';
import { fetchPilotAchievements, fetchPilotCareer, fetchPilotOpponents, fetchPilotRating, fetchPilotRivalry, fetchPilotWeaponMix } from '../services/apiService';
import { colors } from '../designTokens.js';
import { Loading, EmptyState, ErrorState } from './States';
import { LinkCell } from './Link';
import { useQueryParam } from '../hooks/useLocation';
import { urlFor } from '../server/lib/siteRoutes.js';
import { combatRatio, fightNightDay, COMBAT_RATIO_HINT, LETHALITY_HINT, MATCH_MODES } from '../server/lib/gameParse.js';
import { dayLabel } from '../server/lib/matchResult.js';

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

// /api/pilot/:name/breakdown also answers `rivals`, which the page no longer reads (S20)
interface PilotBreakdown {
    mapStats: MapStat[];
}

interface PilotDetailProps {
    pilotName: string;
    onBack?: () => void;
}

const PilotDetail: React.FC<PilotDetailProps> = ({ pilotName, onBack }) => {
    const [stats, setStats] = useState<PilotStats | null>(null);
    const [breakdown, setBreakdown] = useState<PilotBreakdown>({ mapStats: [] });
    const [games, setGames] = useState<GameData[]>([]);
    const [loading, setLoading] = useState(true);
    const [failed, setFailed] = useState(false);
    const [retries, setRetries] = useState(0);
    // ?mode= filters the stats and match list; ?weapons=defense picks the weapon tab
    const [selectedMode, setSelectedMode] = useQueryParam('mode', 'ALL');
    const [weaponView, setWeaponView] = useQueryParam('weapons', 'offense', ['offense', 'defense'] as const);
    // the rating does not depend on the mode, so it loads once beside the page's requests
    const rating = useLoad(() => fetchPilotRating(pilotName), [pilotName]);
    const career = useLoad(() => fetchPilotCareer(pilotName), [pilotName]);
    // all-time and all modes, like the community it is set against
    const weaponMix = useLoad(() => fetchPilotWeaponMix(pilotName), [pilotName]);
    const rivalry = useLoad(() => fetchPilotRivalry(pilotName), [pilotName]);
    const opponents = useLoad(() => fetchPilotOpponents(pilotName), [pilotName]);
    const achievements = useLoad(() => fetchPilotAchievements(pilotName), [pilotName]);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setFailed(false);
            try {
                const modeQuery = selectedMode !== 'ALL' ? `?mode=${encodeURIComponent(selectedMode)}` : '';
                const [statsRes, gamesRes, breakdownRes] = await Promise.all([
                    fetch(`/api/pilot/${encodeURIComponent(pilotName)}/stats${modeQuery}`),
                    fetch(`/api/pilot/${encodeURIComponent(pilotName)}/games${modeQuery}`),
                    fetch(`/api/pilot/${encodeURIComponent(pilotName)}/breakdown`)
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
                if (breakdownRes.ok) {
                    setBreakdown(await breakdownRes.json());
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
    // the fight-night day, as the career block and the rankings count days
    const lastActiveDay = stats?.last_seen ? fightNightDay(stats.last_seen) : null;
    const lastActiveDate = lastActiveDay ? dayLabel(lastActiveDay) : 'Unknown';

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
                    {[{ id: 'ALL', label: 'All Modes' }, ...MATCH_MODES].map(m => (
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
                        <h2 className="text-3xl font-bold text-white mb-2 text-center tracking-tight break-all">{pilotName}<BeltMark name={pilotName} size={20} /></h2>
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

                            <CareerCard load={career} />

                            {/* PPI Framework Dashboard */}
                            <PilotPerformanceCard pilotName={pilotName} />

                            <RatingCard load={rating} />

                            <AchievementsCard load={achievements} />

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

                            <WeaponMix load={weaponMix} />

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

                            <TapeOpponents name={pilotName} load={opponents} />

                            <KillLogRivalry name={pilotName} load={rivalry} />

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
