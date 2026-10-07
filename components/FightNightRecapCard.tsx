import React from 'react';
import { FightNightRecap } from '../services/apiService';
import { Shield, Zap, Flame, Award, Skull, ExternalLink, Users, Crosshair, ChevronRight } from 'lucide-react';
import Link from './Link';
import { urlFor } from '../server/lib/siteRoutes.js';

interface FightNightRecapCardProps {
    recap: FightNightRecap;
}

export const FightNightRecapCard: React.FC<FightNightRecapCardProps> = ({ recap }) => {

    return (
        <div className="relative bg-[#0d0d10] border-2 border-gray-800 rounded-xl overflow-hidden shadow-2xl font-mono text-gray-200">
            {/* Top Fight Poster Banner */}
            <div className="bg-gradient-to-r from-red-950/80 via-black to-[#2a1202] p-5 sm:p-6 border-b-2 border-[#ff6600]/40 relative overflow-hidden">
                <div className="absolute -right-8 -top-8 w-40 h-40 bg-[#ff6600]/10 rounded-full blur-2xl pointer-events-none" />
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-widest bg-[#ff6600] text-black rounded">
                                FIGHT NIGHT RECAP
                            </span>
                            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                                {recap.formattedDate}
                            </span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase brand-font">
                            THE OFFICIAL CARD
                        </h2>
                    </div>

                    {/* Night Tale-of-the-Tape Quick Numbers */}
                    <div className="flex items-center gap-3 bg-black/60 border border-gray-800 px-4 py-2 rounded-lg text-xs">
                        <div className="text-center">
                            <div className="text-[#ff6600] font-black text-base leading-none">{recap.totalMatches}</div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-wider">Matches</div>
                        </div>
                        <div className="h-6 w-px bg-gray-800" />
                        <div className="text-center">
                            <div className="text-white font-black text-base leading-none">{recap.totalPilots}</div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-wider">Pilots</div>
                        </div>
                        <div className="h-6 w-px bg-gray-800" />
                        <div className="text-center">
                            <div className="text-yellow-400 font-black text-base leading-none">{recap.totalFrags.toLocaleString()}</div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-wider">Total Kills</div>
                        </div>
                    </div>
                </div>

                {/* Sub-Banner Leaders */}
                <div className="mt-3 pt-3 border-t border-gray-800/80 flex flex-wrap items-center gap-4 text-xs text-gray-400">
                    <div className="flex items-center gap-1.5">
                        <Award size={13} className="text-yellow-400" />
                        <span>Most Kills:</span>
                        <Link
                            to={urlFor('pilot', recap.topFragger.name)}
                            className="font-bold text-white hover:text-[#ff6600] underline decoration-[#ff6600]/40 transition-colors"
                        >
                            {recap.topFragger.name}
                        </Link>
                        <span className="text-gray-500">({recap.topFragger.kills} K)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Zap size={13} className="text-[#ff6600]" />
                        <span>Most Active:</span>
                        <Link
                            to={urlFor('pilot', recap.mostActivePilot.name)}
                            className="font-bold text-white hover:text-[#ff6600] underline decoration-[#ff6600]/40 transition-colors"
                        >
                            {recap.mostActivePilot.name}
                        </Link>
                        <span className="text-gray-500">({recap.mostActivePilot.matches} Matches)</span>
                    </div>
                </div>
            </div>

            {/* Poster Grid of 7 Items */}
            <div className="p-4 sm:p-6 space-y-4">
                {/* 1. MAIN EVENT (Headline Bout) */}
                {recap.headlineBout && (
                    <div className="bg-gradient-to-r from-[#1a120c] via-[#121214] to-black border border-[#ff6600]/50 rounded-lg p-4 relative overflow-hidden group">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <span className="bg-[#ff6600]/20 text-[#ff6600] border border-[#ff6600]/40 text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-widest">
                                    MAIN EVENT
                                </span>
                                <Link
                                    to={urlFor('maps', recap.headlineBout.map)}
                                    className="text-white font-bold hover:text-[#ff6600] transition-colors"
                                >
                                    {recap.headlineBout.map}
                                </Link>
                                <span className="text-gray-500 text-xs">• {recap.headlineBout.matchMode}</span>
                            </div>
                            <Link
                                to={urlFor('game-detail', recap.headlineBout.gameId)}
                                className="flex items-center gap-1 text-xs text-[#ff6600] hover:text-white transition-colors bg-[#ff6600]/10 hover:bg-[#ff6600]/20 border border-[#ff6600]/30 px-2.5 py-1 rounded"
                            >
                                <span>Scoreboard #{recap.headlineBout.gameId}</span>
                                <ExternalLink size={11} />
                            </Link>
                        </div>
                        <p className="text-sm text-gray-300 leading-relaxed">
                            {recap.headlineBout.copy}
                        </p>
                        <div className="mt-2.5 flex items-center gap-3 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                                <Users size={12} className="text-[#ff6600]" /> {recap.headlineBout.pilotCount} Pilots in Ring
                            </span>
                            <span className="flex items-center gap-1">
                                <Crosshair size={12} className="text-yellow-400" /> {recap.headlineBout.totalFrags} Kills
                            </span>
                            <span className="text-gray-500">
                                Match Victor / MVP:{' '}
                                <Link
                                    to={urlFor('pilot', recap.headlineBout.topPilot)}
                                    className="font-bold text-white hover:text-[#ff6600] transition-colors ml-1"
                                >
                                    {recap.headlineBout.topPilot}
                                </Link>
                            </span>
                        </div>
                    </div>
                )}

                {/* Grid for items 2 through 5 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 2. UPSET OF THE NIGHT */}
                    {recap.biggestUpset && (
                        <div className="bg-[#121216] border border-gray-800 hover:border-yellow-500/50 transition-colors rounded-lg p-3.5 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400 flex items-center gap-1">
                                        <Zap size={11} /> UPSET OF THE NIGHT
                                    </span>
                                    {recap.biggestUpset.gameId && (
                                        <Link
                                            to={urlFor('game-detail', recap.biggestUpset.gameId)}
                                            className="text-[11px] text-gray-400 hover:text-white flex items-center gap-0.5"
                                        >
                                            #{recap.biggestUpset.gameId} <ExternalLink size={10} />
                                        </Link>
                                    )}
                                </div>
                                <p className="text-xs text-gray-300 leading-relaxed">
                                    {recap.biggestUpset.copy}
                                </p>
                            </div>
                            {recap.biggestUpset.winner && recap.biggestUpset.defeated && (
                                <div className="mt-2.5 pt-2 border-t border-gray-800/80 flex items-center justify-between text-[11px]">
                                    <Link
                                        to={urlFor('pilot', recap.biggestUpset.winner)}
                                        className="font-bold text-yellow-400 hover:underline"
                                    >
                                        {recap.biggestUpset.winner} ({recap.biggestUpset.winnerKd} KD)
                                    </Link>
                                    <span className="text-gray-500 font-bold">def.</span>
                                    <Link
                                        to={urlFor('pilot', recap.biggestUpset.defeated)}
                                        className="font-bold text-gray-300 hover:underline"
                                    >
                                        {recap.biggestUpset.defeated} ({recap.biggestUpset.defeatedKd} KD)
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 3. BIGGEST BLOWOUT */}
                    {recap.biggestBlowout && (
                        <div className="bg-[#121216] border border-gray-800 hover:border-red-500/50 transition-colors rounded-lg p-3.5 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-red-400 flex items-center gap-1">
                                        <Skull size={11} /> BIGGEST BLOWOUT
                                    </span>
                                    <Link
                                        to={urlFor('game-detail', recap.biggestBlowout.gameId)}
                                        className="text-[11px] text-gray-400 hover:text-white flex items-center gap-0.5"
                                    >
                                        #{recap.biggestBlowout.gameId} <ExternalLink size={10} />
                                    </Link>
                                </div>
                                <p className="text-xs text-gray-300 leading-relaxed">
                                    {recap.biggestBlowout.copy}
                                </p>
                            </div>
                            <div className="mt-2.5 pt-2 border-t border-gray-800/80 flex items-center justify-between text-[11px]">
                                <span className="text-gray-400">
                                    Margin: <strong className="text-red-400 font-mono">+{recap.biggestBlowout.differential} Kills</strong>
                                </span>
                                <span className="text-gray-500 font-mono">{recap.biggestBlowout.score}</span>
                            </div>
                        </div>
                    )}

                    {/* 4. CLOSEST FINISH (Down to the Wire) */}
                    {recap.closestFinish && (
                        <div className="bg-[#121216] border border-gray-800 hover:border-emerald-500/50 transition-colors rounded-lg p-3.5 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1">
                                        <Shield size={11} /> DOWN TO THE WIRE
                                    </span>
                                    <Link
                                        to={urlFor('game-detail', recap.closestFinish.gameId)}
                                        className="text-[11px] text-gray-400 hover:text-white flex items-center gap-0.5"
                                    >
                                        #{recap.closestFinish.gameId} <ExternalLink size={10} />
                                    </Link>
                                </div>
                                <p className="text-xs text-gray-300 leading-relaxed">
                                    {recap.closestFinish.copy}
                                </p>
                            </div>
                            <div className="mt-2.5 pt-2 border-t border-gray-800/80 flex items-center justify-between text-[11px]">
                                <span className="text-gray-400">
                                    Margin:{' '}
                                    <strong className="text-emerald-400 font-mono">
                                        {recap.closestFinish.margin === 0 ? 'Dead Draw (0)' : `${recap.closestFinish.margin} ${recap.closestFinish.margin === 1 ? 'Kill' : 'Kills'}`}
                                    </strong>
                                </span>
                                <span className="text-gray-500 font-mono">{recap.closestFinish.score}</span>
                            </div>
                        </div>
                    )}

                    {/* 5. HOTTEST MAP */}
                    {recap.hottestArena && (
                        <div className="bg-[#121216] border border-gray-800 hover:border-orange-500/50 transition-colors rounded-lg p-3.5 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 flex items-center gap-1">
                                        <Flame size={11} /> HOTTEST MAP
                                    </span>
                                    <Link
                                        to={urlFor('maps', recap.hottestArena.name)}
                                        className="text-[11px] text-[#ff6600] hover:text-white flex items-center gap-0.5"
                                    >
                                        Map Intel <ChevronRight size={10} />
                                    </Link>
                                </div>
                                <p className="text-xs text-gray-300 leading-relaxed">
                                    {recap.hottestArena.copy}
                                </p>
                            </div>
                            <div className="mt-2.5 pt-2 border-t border-gray-800/80 flex items-center justify-between text-[11px]">
                                <span className="text-gray-400">
                                    Activity: <strong className="text-white">{recap.hottestArena.matches} Matches</strong> ({recap.hottestArena.frags} K)
                                </span>
                                {recap.hottestArena.topPilot && (
                                    <span className="text-gray-400">
                                        Map King:{' '}
                                        <Link
                                            to={urlFor('pilot', recap.hottestArena.topPilot)}
                                            className="font-bold text-[#ff6600] hover:underline"
                                        >
                                            {recap.hottestArena.topPilot}
                                        </Link>
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Bottom Row: 6. NEW BLOOD and 7. STREAK WATCH */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 6. NEW BLOOD */}
                    {recap.newBlood && (
                        <div className="bg-[#121216] border border-gray-800 rounded-lg p-3.5">
                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 flex items-center gap-1 mb-1.5">
                                <Users size={11} /> NEW BLOOD
                            </span>
                            <p className="text-xs text-gray-300 leading-relaxed mb-2">
                                {recap.newBlood.copy}
                            </p>
                            {recap.newBlood.pilots && recap.newBlood.pilots.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    {recap.newBlood.pilots.map(p => (
                                        <Link
                                            key={p}
                                            to={urlFor('pilot', p)}
                                            className="text-[11px] bg-blue-950/60 border border-blue-800/80 hover:border-blue-500 text-blue-200 px-2 py-0.5 rounded transition-colors"
                                        >
                                            {p}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* 7. STREAK WATCH */}
                    {recap.longestStreak && (
                        <div className="bg-[#121216] border border-gray-800 rounded-lg p-3.5 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-purple-400 flex items-center gap-1">
                                        <Award size={11} /> STREAK WATCH
                                    </span>
                                    {recap.longestStreak.gameId && (
                                        <Link
                                            to={urlFor('game-detail', recap.longestStreak.gameId)}
                                            className="text-[11px] text-gray-400 hover:text-white flex items-center gap-0.5"
                                        >
                                            #{recap.longestStreak.gameId} <ExternalLink size={10} />
                                        </Link>
                                    )}
                                </div>
                                <p className="text-xs text-gray-300 leading-relaxed">
                                    {recap.longestStreak.copy}
                                </p>
                            </div>
                            <div className="mt-2.5 pt-2 border-t border-gray-800/80 flex items-center justify-between text-[11px]">
                                <span>
                                    Gunner:{' '}
                                    <Link
                                        to={urlFor('pilot', recap.longestStreak.pilot)}
                                        className="font-bold text-purple-300 hover:underline"
                                    >
                                        {recap.longestStreak.pilot}
                                    </Link>
                                </span>
                                <span className="bg-purple-950 border border-purple-800 text-purple-300 font-mono font-bold px-2 py-0.5 rounded">
                                    {recap.longestStreak.streak} K Streak
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FightNightRecapCard;
