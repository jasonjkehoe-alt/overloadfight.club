
import React, { useMemo } from 'react';
import { GameData } from '../types';
import ScoreChart from './ScoreChart';
import DamageMatrix from './DamageMatrix';
import Analysis from './Analysis';
import MatchAnalysis from './MatchAnalysis';
import { getMapImage } from '../services/mapService';
// The server's rules, so this page shows the result and length the stats count.
import { winnerOf, durationOf, measuredDurationOf } from '../server/lib/gameParse.js';
import { resultLine } from '../utils/matchResult';
import Link from './Link';
import { useQueryParam } from '../hooks/useLocation';
import { urlFor } from '../server/lib/siteRoutes.js';

const TABS = ['overview', 'deep-dive', 'damage', 'timeline', 'analysis'] as const;

const teamColor = (team?: string | null) =>
    team === 'BLUE' ? 'text-blue-400' : team === 'ORANGE' ? 'text-orange-400' : 'text-white';

const PODIUM = [['1st', 'text-yellow-400'], ['2nd', 'text-gray-300'], ['3rd', 'text-amber-600']];

interface GameDetailProps {
    game: GameData;
    onBack: () => void;
}

const GameDetail: React.FC<GameDetailProps> = ({ game, onBack }) => {
    const [activeTab, setActiveTab] = useQueryParam('tab', 'overview', TABS);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(Math.abs(seconds) / 60);
        const secs = Math.floor(Math.abs(seconds) % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const mapImage = getMapImage(game.settings?.level);
    const result = useMemo(() => winnerOf(game), [game]);
    // durationOf is what the stats count; it falls back to the time limit
    // when the game does not record how long it ran.
    const durationSec = useMemo(() => durationOf(game), [game]);
    const durationIsLimit = durationSec > 0 && !measuredDurationOf(game);

    // Calculate derived stats
    const processedPlayers = useMemo(() => {
        if (!game.players) return [];

        const durationMinutes = durationSec / 60;

        return game.players.map(p => {
            // Calculate damage from events if not present in player object
            let totalDamage = p.damage || 0;
            if (!totalDamage && game.damage) {
                totalDamage = game.damage
                    .filter(d => d.attacker === p.name)
                    .reduce((sum, d) => sum + d.damage, 0);
            }

            const dpm = durationMinutes > 0 ? totalDamage / durationMinutes : null;
            const kda = (p.kills + p.assists * 0.5) / Math.max(1, p.deaths);

            return {
                ...p,
                totalDamage,
                dpm,
                kda
            };
        }).sort((a, b) => b.kills - a.kills);
    }, [game, durationSec]);

    const renderTimeline = () => {
        let timelineEvents = [];

        if (game.events && game.events.length > 0) {
            timelineEvents = [...game.events];
        } else if (game.kills) {
            timelineEvents = game.kills.map(k => ({
                time: k.time,
                type: 'Kill',
                description: `${k.attacker} killed ${k.defender} with ${k.weapon}`
            }));
        }

        timelineEvents.sort((a, b) => a.time - b.time);

        return (
            <div className="bg-[#111] border border-gray-800 rounded font-mono text-sm h-[600px] overflow-y-auto">
                <table className="w-full text-left">
                    <thead className="bg-[#1a1a1a] text-gray-500 sticky top-0 z-10">
                        <tr>
                            <th className="p-3 w-24 text-center border-b border-gray-800">TIME</th>
                            <th className="p-3 w-32 border-b border-gray-800">TYPE</th>
                            <th className="p-3 border-b border-gray-800">EVENT LOG</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/50">
                        {timelineEvents.map((evt, idx) => (
                            <tr key={idx} className="hover:bg-[#161616] group">
                                <td className="p-3 text-center text-gray-600 font-bold group-hover:text-gray-400">
                                    {formatTime(evt.time)}
                                </td>
                                <td className="p-3">
                                    <span className={`
                                    px-2 py-0.5 rounded text-[10px] font-bold uppercase border
                                    ${evt.type === 'Kill' ? 'bg-red-900/20 text-red-400 border-red-900/30' :
                                            evt.type === 'Goal' ? 'bg-green-900/20 text-green-400 border-green-900/30' :
                                                evt.type === 'Blunder' ? 'bg-orange-900/20 text-orange-400 border-orange-900/30' :
                                                    'bg-gray-800 text-gray-400 border-gray-700'}
                                `}>
                                        {evt.type}
                                    </span>
                                </td>
                                <td className="p-3 text-gray-300">
                                    {evt.description}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="animate-fade-in">
            <button
                onClick={onBack}
                className="mb-4 flex items-center text-gray-500 hover:text-[#ff6600] transition-colors font-mono text-sm"
            >
                <span className="mr-1">&lt;</span> BACK
            </button>

            {/* Game Header */}
            <div className="bg-[#151515] border border-gray-800 p-6 rounded-sm mb-6 relative overflow-hidden min-h-[160px] flex flex-col justify-center">
                {mapImage && (
                    <>
                        <div
                            className="absolute inset-0 bg-cover bg-center opacity-30"
                            style={{ backgroundImage: `url(${mapImage})` }}
                        ></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent"></div>
                    </>
                )}
                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2 brand-font">{game.server?.name || "Unknown Server"}</h1>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-400 font-mono items-center">
                                <span>{game.date ? new Date(game.date).toLocaleDateString() : 'Unknown Date'}</span>
                                <span className="text-gray-600">|</span>
                                <span className="text-gray-200 flex items-center gap-2">
                                    {game.settings?.level}
                                </span>
                                <span className="text-gray-600">|</span>
                                <span className="text-[#ff6600] bg-[#ff6600]/10 px-2 py-0.5 rounded border border-[#ff6600]/30">{game.settings?.matchMode}</span>
                            </div>
                        </div>
                        <div className="text-right font-mono">
                            <div className="text-2xl font-bold text-white">
                                {durationSec > 0 ? formatTime(durationSec) : 'Unknown'}
                            </div>
                            <div className="text-xs text-gray-500 uppercase tracking-widest">
                                {durationIsLimit
                                    ? 'Time limit, real length unknown'
                                    : `Duration${game.settings?.timeLimit ? ` of ${Math.floor(game.settings.timeLimit / 60)} min limit` : ''}`}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Result */}
            <div className="bg-[#111] border border-gray-800 rounded-sm p-5 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono">
                <div>
                    <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">
                        {result.winners.length === 1 ? 'Winner' : 'Result'}
                    </div>
                    {result.winners.length === 1 && (
                        <div className={`text-2xl font-bold brand-font ${result.team ? teamColor(result.ranking[0].side) : 'text-[#ff6600]'}`}>
                            {result.ranking[0].name}
                        </div>
                    )}
                    <div className="text-sm text-gray-300 mt-1">{resultLine(result)}</div>
                </div>
                {result.winners.length > 0 && (
                    result.team ? (
                        <div className="flex items-center gap-3 text-3xl font-bold">
                            {result.ranking.map((r, i) => (
                                <React.Fragment key={r.side}>
                                    {i > 0 && <span className="text-gray-600 text-xl">–</span>}
                                    <span className="flex flex-col items-center">
                                        <span className={teamColor(r.side)}>{r.score}</span>
                                        <span className="text-[10px] text-gray-500 tracking-widest">{r.name}</span>
                                    </span>
                                </React.Fragment>
                            ))}
                        </div>
                    ) : (
                        <ol className="flex gap-4 text-sm">
                            {result.ranking.slice(0, 3).map((r, i) => (
                                <li key={r.side} className="flex flex-col items-center min-w-[72px]">
                                    <span className={`text-xs font-bold ${PODIUM[i][1]}`}>{PODIUM[i][0]}</span>
                                    <Link
                                        to={urlFor('pilot', r.name)}
                                        className="text-white font-bold hover:text-[#ff6600] hover:underline truncate max-w-[140px]"
                                    >
                                        {r.name}
                                    </Link>
                                    <span className="text-gray-400 text-xs">{r.score}</span>
                                </li>
                            ))}
                        </ol>
                    )
                )}
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-gray-800 mb-6 font-mono overflow-x-auto">
                {TABS.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-3 text-sm font-bold transition-colors border-b-2 ${activeTab === tab
                                ? 'border-[#ff6600] text-[#ff6600] bg-[#ff6600]/5'
                                : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-700'
                            } uppercase tracking-wider`}
                    >
                        {tab.replace('-', ' ')}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="space-y-6">
                {activeTab === 'overview' && (
                    <>
                        <div className="bg-[#111] border border-gray-800 rounded overflow-hidden overflow-x-auto">
                            <table className="w-full text-left font-mono text-sm min-w-[800px]">
                                <thead className="bg-[#1a1a1a] text-gray-400 text-xs uppercase font-bold">
                                    <tr>
                                        <th className="p-4">Player</th>
                                        <th className="p-4 text-right">Kills</th>
                                        <th className="p-4 text-right">Assists</th>
                                        <th className="p-4 text-right">Deaths</th>
                                        <th className="p-4 text-right">Damage</th>
                                        <th className="p-4 text-right">DPM</th>
                                        <th className="p-4 text-right cursor-help" title="Combat Ratio: (Kills + 0.5 × Assists) ÷ Deaths">KDA Ratio</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {processedPlayers.map((p, idx) => (
                                         <tr key={p.name} className="hover:bg-[#1a1a1a] transition-colors">
                                             <td className="p-4 font-bold text-white flex items-center gap-3">
                                                 <span className="text-gray-600 w-4">{idx + 1}</span>
                                                 <Link
                                                     to={urlFor('pilot', p.name)}
                                                     className={`hover:underline hover:text-[#ff6600] transition-colors text-left font-bold ${teamColor(p.team)}`}
                                                     title={`View ${p.name}'s pilot dossier`}
                                                 >
                                                     {p.name}
                                                 </Link>
                                             </td>
                                             <td className="p-4 text-right text-lg">{p.kills}</td>
                                             <td className="p-4 text-right text-gray-400">{p.assists}</td>
                                             <td className="p-4 text-right text-red-400">{p.deaths}</td>
                                             <td className="p-4 text-right text-gray-300">
                                                 {Math.round(p.totalDamage).toLocaleString()}
                                             </td>
                                             <td className="p-4 text-right text-gray-500">
                                                 {p.dpm === null ? '–' : Math.round(p.dpm).toLocaleString()}
                                             </td>
                                             <td className="p-4 text-right">
                                                 <div className="flex flex-col items-end">
                                                     <span className="text-[#ff6600] font-bold text-base">{p.kda.toFixed(3)}</span>
                                                     <span className="text-[10px] text-gray-500">
                                                         ({p.kills} K, {p.assists} A, {p.deaths} D)
                                                     </span>
                                                 </div>
                                             </td>
                                         </tr>
                                     ))}
                                 </tbody>
                            </table>
                        </div>
                        <ScoreChart game={game} />
                    </>
                )}

                {activeTab === 'deep-dive' && <MatchAnalysis game={game} />}
                {activeTab === 'damage' && <DamageMatrix game={game} />}
                {activeTab === 'timeline' && renderTimeline()}
                {activeTab === 'analysis' && <Analysis game={game} />}
            </div>
        </div>
    );
};

export default GameDetail;
