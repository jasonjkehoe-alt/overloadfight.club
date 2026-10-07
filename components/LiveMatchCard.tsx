import React, { useEffect, useState } from 'react';
import { BrowserApiResponse, GameData } from '../types';
import { apiService } from '../services/apiService';
import { getMapImage } from '../services/mapService';
import MatchTimer from './MatchTimer';
import Link from './Link';
import { Loading, EmptyState } from './States';
import { urlFor } from '../server/lib/siteRoutes.js';

interface LiveMatchCardProps {
    server: BrowserApiResponse;
}

interface PlayerState {
    name: string;
    team: string;
    score: number;
    kills: number;
    deaths: number;
    assists?: number;
}

const LiveMatchCard: React.FC<LiveMatchCardProps> = ({ server }) => {
    const [gameData, setGameData] = useState<GameData | null>(null);
    const [players, setPlayers] = useState<Record<string, PlayerState>>({});

    // Use IP for reliable live fetching
    const serverIp = server.server.ip;
    const mapImage = getMapImage(gameData?.settings?.level || server.game?.mapName || '');

    // Poll for live data
    useEffect(() => {
        const fetchLiveStats = async () => {
            try {
                const data = await apiService.getGame(serverIp);
                if (data) {
                    setGameData(data);

                    if (data.players) {
                        const next: Record<string, PlayerState> = {};
                        data.players.forEach(p => {
                            next[p.name] = {
                                name: p.name,
                                team: p.team || 'NONE',
                                score: (p.kills * 1) + (p.goals || 0),
                                kills: p.kills,
                                deaths: p.deaths,
                                assists: p.assists
                            };
                        });
                        setPlayers(next);
                    }
                }
            } catch (e) {
                console.error("Error polling live match:", e);
            }
        };

        fetchLiveStats();
        const interval = setInterval(fetchLiveStats, 30000);
        return () => clearInterval(interval);
    }, [serverIp]);

    const playerList = (Object.values(players) as PlayerState[]).sort((a, b) => b.score - a.score);

    const copyIp = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(serverIp);
    };

    // Calculate time string from countdown if available
    const getTimeString = () => {
        if (gameData?.countdown) {
            const timeRemaining = Math.max(0, Math.floor(gameData.countdown / 1000));
            const minutes = Math.floor(timeRemaining / 60);
            const seconds = timeRemaining % 60;
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
        // Fallback to MatchTimer logic if we have start time but no countdown (rare for live)
        return null;
    };

    const timeString = getTimeString();

    return (
        <div className="bg-black border border-line rounded-card overflow-hidden flex flex-col shadow-lg min-h-[200px]">
            {/* Map Header */}
            <div className="relative h-16 bg-surface-raised flex items-center justify-center overflow-hidden border-b border-line">
                {mapImage && (
                    <div
                        className="absolute inset-0 bg-cover bg-center opacity-40"
                        style={{ backgroundImage: `url(${mapImage})` }}
                    ></div>
                )}
                <div className="absolute inset-0 bg-black/30"></div>
                <h3 className="relative z-10 text-white font-bold text-lg tracking-wider shadow-black drop-shadow-md">
                    {server.server.name}
                </h3>
            </div>

            {/* IP / Connection Info */}
            <div className="bg-surface-card border-b border-line p-2 flex justify-between items-center">
                <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
                    <span>Join at <span className="text-white">{serverIp}</span></span>
                </div>
                <button onClick={copyIp} className="text-gray-500 hover:text-brand transition-colors" title="Copy IP">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                </button>
            </div>

            {/* Player List */}
            <div className="flex-grow bg-black p-2 overflow-y-auto max-h-[200px]">
                <table className="w-full text-left text-sm font-mono">
                    <thead className="text-2xs text-gray-600 uppercase border-b border-line">
                        <tr>
                            <th className="pb-1">Pilot</th>
                            <th className="pb-1 text-center">K</th>
                            <th className="pb-1 text-center">D</th>
                            <th className="pb-1 text-right">Score</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                        {playerList.length > 0 ? (
                            playerList.map((p) => (
                                <tr key={p.name}>
                                    <td className={`py-1 font-bold truncate max-w-[120px] ${p.team === 'BLUE' ? 'text-blue-400' :
                                        p.team === 'ORANGE' ? 'text-orange-400' : 'text-gray-300'
                                        }`}>
                                        <Link
                                            to={urlFor('pilot', p.name)}
                                            className="hover:underline hover:text-brand text-left transition-colors truncate max-w-full block"
                                            title={`View ${p.name}'s pilot dossier`}
                                        >
                                            {p.name}
                                        </Link>
                                    </td>
                                    <td className="text-center text-gray-500">{p.kills}</td>
                                    <td className="text-center text-gray-600">{p.deaths}</td>
                                    <td className="text-right font-bold text-gray-400">{p.score}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4}>
                                    {server.game?.currentPlayers ? (
                                        <Loading compact label={`Scanning ${server.game.currentPlayers} active pilots...`} />
                                    ) : (
                                        <EmptyState compact title="Waiting for players..." />
                                    )}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer Info */}
            <div className="bg-surface-page border-t border-line p-2 text-2xs font-mono text-gray-500 flex flex-col gap-1">
                <div className="flex justify-between items-center">
                    <span>{playerList.length}/{gameData?.settings?.maxPlayers || server.game?.maxPlayers || '?'} Players</span>

                    {timeString ? (
                        <span className="font-bold text-white">{timeString}</span>
                    ) : (
                        server.game && <MatchTimer startTime={server.game.gameStarted} timeLimit={server.game.matchLength} className="font-bold text-white" />
                    )}
                </div>
                <div className="flex justify-between uppercase">
                    <span className="text-brand">{gameData?.settings?.matchMode || server.game?.mode}</span>
                    <span className="truncate max-w-[120px] text-gray-400" title={gameData?.settings?.level || server.game?.mapName}>
                        {gameData?.settings?.level || server.game?.mapName}
                    </span>
                </div>
            </div>

            <Link
                to={urlFor('live-game-detail', serverIp)}
                className="block text-center w-full bg-surface-raised hover:bg-brand text-gray-400 hover:text-white text-xs py-2 uppercase font-bold transition-colors border-t border-line"
            >
                Full Screen View
            </Link>
        </div>
    );
};

export default LiveMatchCard;
