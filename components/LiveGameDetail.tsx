import React, { useEffect, useState } from 'react';
import { ArrowLeft, Clock, Users, Trophy, Activity, AlertCircle } from 'lucide-react';
import { GameData, GameEvent, GameSettings } from '../types';
import { apiService } from '../services/apiService';
import JoinIp from './JoinIp';

// Fields this page reads from the live game that types.ts does not declare.
type LiveGame = GameData & {
    settings?: GameSettings & { respawnTimeSeconds?: number };
    events?: (GameEvent & { source?: string; target?: string; weapon?: string; message?: string })[];
};

interface LiveGameDetailProps {
    ip?: string;
    onBack?: () => void;
    serverData?: any;
    archivedGames?: any;
    onNavigate?: (view: string, param?: string) => void;
}

const LiveGameDetail: React.FC<LiveGameDetailProps> = ({ ip: propIp, onBack, serverData, onNavigate }) => {
    // Prioritize prop IP, fallback to serverData IP
    const ip = propIp || serverData?.server?.ip;

    const [healthHistory, setHealthHistory] = useState<any[]>([]);

    // Restore missing state variables that caused the blank screen/render failure
    const [game, setGame] = useState<LiveGame | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        const fetchGameData = async () => {
            if (!ip) {
                setLoading(false);
                return;
            }

            try {
                // Try fetching live game first
                const data = await apiService.getGame(ip);
                if (data) {
                    setGame(data);
                    setLastUpdated(new Date());
                    setError(null);
                } else {
                    throw new Error("No game data");
                }
            } catch (err) {
                // If live game fails, just generic error - we removed health check probing
                setError('Server unreachable or game not found.');
            } finally {
                setLoading(false);
            }
        };

        // Initial fetch
        fetchGameData();

        // Poll every 30 seconds
        intervalId = setInterval(fetchGameData, 30000);

        return () => clearInterval(intervalId);
    }, [ip]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    // Special Offline View
    if (error === "OFFLINE") {
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold text-white tracking-tight">
                                    {serverData?.server?.name || ip}
                                </h1>
                                <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-500 border border-red-500/30">
                                    OFFLINE
                                </span>
                            </div>
                            <div className="text-sm text-gray-400 mt-1 font-mono">
                                {ip}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6">
                    <div className="bg-gray-800/50 rounded-xl border border-white/5 p-6 backdrop-blur-sm">
                        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-gray-400" />
                            Server Health History
                        </h3>
                        <p className="text-gray-400 text-sm mb-6">
                            This server is currently not hosting a game. Below is the recent reachability and latency history.
                        </p>
                        <p className="text-gray-400 text-sm mb-6">
                            This server is currently not hosting a game.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !game) {
        return (
            <div className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-900/20 mb-4">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Unable to Load Game</h2>
                <p className="text-gray-400 mb-4">{error || "Game not found"}</p>
                {ip && <div className="flex justify-center mb-6"><JoinIp ip={ip} /></div>}
                <button
                    onClick={onBack}
                    className="inline-flex items-center px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                </button>
            </div>
        );
    }

    // Calculate time remaining if available
    const timeRemaining = game.countdown ? Math.max(0, Math.floor(game.countdown / 1000)) : 0;
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-white tracking-tight">
                                {game.server?.name || game.ip}
                            </h1>
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30 animate-pulse">
                                LIVE
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                            <span className="flex items-center gap-1.5">
                                <Activity className="w-3.5 h-3.5" />
                                {game.settings?.matchMode || "Unknown Mode"}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-gray-600" />
                            <span>{game.settings?.level || "Unknown Map"}</span>
                        </div>
                        {ip && <div className="mt-2"><JoinIp ip={ip} /></div>}
                    </div>
                </div>

                <div className="flex items-center gap-6 bg-gray-800/50 px-6 py-3 rounded-xl border border-white/5 backdrop-blur-sm">
                    <div className="text-center">
                        <div className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-0.5">Time Remaining</div>
                        <div className="text-xl font-mono font-bold text-white tabular-nums flex items-center justify-center gap-2">
                            <Clock className="w-4 h-4 text-primary-400" />
                            {timeString}
                        </div>
                    </div>
                    <div className="w-px h-8 bg-white/10" />
                    <div className="text-center">
                        <div className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-0.5">Players</div>
                        <div className="text-xl font-bold text-white tabular-nums flex items-center justify-center gap-2">
                            <Users className="w-4 h-4 text-blue-400" />
                            {game.players?.length || 0} / {game.settings?.maxPlayers || 16}
                        </div>
                    </div>
                </div>
            </div>

            {/* Scoreboard */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Main Scoreboard */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-gray-800/50 rounded-xl border border-white/5 overflow-hidden backdrop-blur-sm">
                        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                            <h3 className="font-semibold text-white flex items-center gap-2">
                                <Trophy className="w-4 h-4 text-yellow-500" />
                                Live Standings
                            </h3>
                            <span className="text-xs text-gray-500">
                                Updating every 30s • Last update: {lastUpdated.toLocaleTimeString()}
                            </span>
                        </div>

                        <div className="divide-y divide-white/5">
                            {game.players?.sort((a, b) => (b.kills || 0) - (a.kills || 0)).map((player, index) => (
                                <div
                                    key={player.name}
                                    className="px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`
                      w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm
                      ${index === 0 ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' :
                                                index === 1 ? 'bg-gray-400/20 text-gray-400 border border-gray-400/30' :
                                                    index === 2 ? 'bg-orange-700/20 text-orange-500 border border-orange-700/30' :
                                                        'bg-gray-800 text-gray-500'}
                    `}>
                                            {index + 1}
                                        </div>
                                        <div>
                                            <button
                                                onClick={() => onNavigate && onNavigate('pilot', player.name)}
                                                className="font-medium text-white hover:text-[#ff6600] hover:underline transition-colors text-left"
                                                title={`View ${player.name}'s pilot dossier`}
                                            >
                                                {player.name}
                                            </button>
                                            <div className="text-xs text-gray-500 flex items-center gap-2">
                                                <span>{player.team ? `Team ${player.team}` : 'Free For All'}</span>
                                                {player.connected === false && (
                                                    <span className="text-red-500 flex items-center gap-1">
                                                        • Disconnected
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-8 text-sm">
                                        <div className="text-center w-16">
                                            <div className="text-gray-500 text-xs uppercase mb-0.5">Kills</div>
                                            <div className="font-bold text-white text-lg">{player.kills}</div>
                                        </div>
                                        <div className="text-center w-16">
                                            <div className="text-gray-500 text-xs uppercase mb-0.5">Deaths</div>
                                            <div className="font-bold text-gray-400 text-lg">{player.deaths}</div>
                                        </div>
                                        <div className="text-center w-16">
                                            <div className="text-gray-500 text-xs uppercase mb-0.5">Assists</div>
                                            <div className="font-bold text-gray-400 text-lg">{player.assists}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {(!game.players || game.players.length === 0) && (
                                <div className="px-6 py-12 text-center text-gray-500">
                                    No players currently connected
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Game Info / Settings */}
                <div className="space-y-4">
                    <div className="bg-gray-800/50 rounded-xl border border-white/5 p-6 backdrop-blur-sm">
                        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-primary-400" />
                            Match Settings
                        </h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between py-2 border-b border-white/5">
                                <span className="text-gray-400">Score Limit</span>
                                <span className="text-white font-mono">{game.settings?.scoreLimit || "None"}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-white/5">
                                <span className="text-gray-400">Time Limit</span>
                                <span className="text-white font-mono">{game.settings?.timeLimit ? `${game.settings.timeLimit / 60} min` : "None"}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-white/5">
                                <span className="text-gray-400">Friendly Fire</span>
                                <span className={game.settings?.friendlyFire ? "text-red-400" : "text-green-400"}>
                                    {game.settings?.friendlyFire ? "ON" : "OFF"}
                                </span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-white/5">
                                <span className="text-gray-400">Respawn Time</span>
                                <span className="text-white font-mono">{game.settings?.respawnTimeSeconds}s</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-white/5">
                                <span className="text-gray-400">Creator</span>
                                {game.settings?.creator && game.settings.creator !== "Server" ? (
                                    <button
                                        onClick={() => onNavigate && onNavigate('pilot', game.settings!.creator)}
                                        className="text-white hover:text-[#ff6600] hover:underline transition-colors font-mono"
                                    >
                                        {game.settings.creator}
                                    </button>
                                ) : (
                                    <span className="text-white">{game.settings?.creator || "Server"}</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Match Log */}
            {game.events && game.events.length > 0 && (
                <div className="bg-gray-800/50 rounded-xl border border-white/5 overflow-hidden backdrop-blur-sm">
                    <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                        <h3 className="font-semibold text-white flex items-center gap-2">
                            <Activity className="w-4 h-4 text-gray-400" />
                            Match Log
                        </h3>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto p-4 space-y-2 font-mono text-xs">
                        {[...game.events].reverse().map((event, i) => (
                            <div key={i} className="flex items-center gap-2 text-gray-400 border-b border-white/5 pb-1 last:border-0">
                                <span className="text-gray-600">[{new Date(event.time * 1000).toLocaleTimeString([], { minute: '2-digit', second: '2-digit' })}]</span>
                                <span className="text-gray-300">
                                    {event.type === 'kill' ? (
                                        <>
                                            <span className="text-white font-bold">{event.source}</span> killed <span className="text-white font-bold">{event.target}</span> with <span className="text-[#ff6600]">{event.weapon}</span>
                                        </>
                                    ) : event.type === 'suicide' ? (
                                        <>
                                            <span className="text-white font-bold">{event.source}</span> committed suicide
                                        </>
                                    ) : (
                                        <span>{event.message || JSON.stringify(event)}</span>
                                    )}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LiveGameDetail;
