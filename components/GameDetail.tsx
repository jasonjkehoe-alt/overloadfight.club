
import React, { useMemo } from 'react';
import { GameData } from '../types';
import DamageMatrix from './DamageMatrix';
import Analysis from './Analysis';
import MatchAnalysis from './MatchAnalysis';
import { EmptyState } from './States';
import MatchReplay from './MatchReplay';
import FightCard from './gameDetail/FightCard';
import Scoreboard from './gameDetail/Scoreboard';
import MatchScrubber from './gameDetail/MatchScrubber';
import MomentumChart from './gameDetail/MomentumChart';
import { getMapImage } from '../services/mapService';
// The server's rules, so this page shows the result and length the stats count.
import { durationOf, measuredDurationOf, replayLengthOf } from '../server/lib/gameParse.js';
import { clock } from '../server/lib/matchResult.js';
import { useQueryParam } from '../hooks/useLocation';
import { useMatchTime } from '../hooks/useMatchTime';

const TABS = ['overview', 'deep-dive', 'damage', 'timeline', 'analysis'] as const;

interface GameDetailProps {
    game: GameData;
    onBack: () => void;
}

const GameDetail: React.FC<GameDetailProps> = ({ game, onBack }) => {
    const [activeTab, setActiveTab] = useQueryParam('tab', 'overview', TABS);

    const mapImage = getMapImage(game.settings?.level);
    // durationOf is what the stats count; it falls back to the time limit
    // when the game does not record how long it ran.
    const durationSec = useMemo(() => durationOf(game), [game]);
    const durationIsLimit = durationSec > 0 && !measuredDurationOf(game);

    // The scrubber's second (null at the end), shared by the scoreboard and the momentum chart.
    const replayEnd = useMemo(() => replayLengthOf(game), [game]);
    const [time, setTime] = useMatchTime(replayEnd);
    const hasKillLog = Boolean(game.kills?.length);

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
            <div className="bg-surface-card border border-line rounded-card font-mono text-sm h-[600px] overflow-auto">
                <table className="w-full text-left">
                    <thead className="bg-surface-raised text-gray-500 sticky top-0 z-10">
                        <tr>
                            <th className="p-3 w-24 text-center border-b border-line">TIME</th>
                            <th className="p-3 w-32 border-b border-line">TYPE</th>
                            <th className="p-3 border-b border-line">EVENT LOG</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-line/50">
                        {timelineEvents.map((evt, idx) => (
                            <tr key={idx} className="hover:bg-surface-raised group">
                                <td className="p-3 text-center text-gray-600 font-bold group-hover:text-gray-400">
                                    {clock(evt.time)}
                                </td>
                                <td className="p-3">
                                    <span className={`
                                    px-2 py-0.5 rounded-control text-2xs font-bold uppercase border
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
                {timelineEvents.length === 0 && <EmptyState title="No events recorded for this match." />}
            </div>
        );
    };

    return (
        <div>
            <button
                onClick={onBack}
                className="mb-4 flex items-center text-gray-500 hover:text-brand transition-colors font-mono text-sm"
            >
                <span className="mr-1">&lt;</span> BACK
            </button>

            {/* Game Header */}
            <div className="bg-surface-card border border-line p-6 rounded-card mb-6 relative overflow-hidden min-h-[160px] flex flex-col justify-center">
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
                                <span className="text-brand bg-brand/10 px-2 py-0.5 rounded-control border border-brand/30">{game.settings?.matchMode}</span>
                            </div>
                        </div>
                        <div className="text-right font-mono">
                            <div className="text-2xl font-bold text-white">
                                {durationSec > 0 ? clock(durationSec) : 'Unknown'}
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

            <FightCard game={game} />

            {/* Navigation Tabs */}
            <div className="flex border-b border-line mb-6 font-mono overflow-x-auto">
                {TABS.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-3 text-sm font-bold transition-colors border-b-2 ${activeTab === tab
                                ? 'border-brand text-brand bg-brand/5'
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
                        {hasKillLog && <MatchScrubber game={game} end={replayEnd} time={time} onChange={setTime} />}
                        <Scoreboard game={game} durationSec={durationSec} time={time} />
                        <MomentumChart game={game} end={replayEnd} time={time} onSeek={setTime} />
                        <MatchReplay game={game} mapImage={mapImage} />
                    </>
                )}

                {activeTab === 'deep-dive' && <MatchAnalysis game={game} />}
                {activeTab === 'damage' && <DamageMatrix game={game} />}
                {activeTab === 'timeline' && (
                    <div className="space-y-6">
                        <MatchReplay game={game} mapImage={mapImage} />
                        {renderTimeline()}
                    </div>
                )}
                {activeTab === 'analysis' && <Analysis game={game} />}
            </div>
        </div>
    );
};

export default GameDetail;
