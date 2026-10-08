
import React, { useState, useMemo } from 'react';
import { BrowserApiResponse, GameData } from '../types';
import Link from './Link';
import { urlFor } from '../server/lib/siteRoutes.js';
import { colors } from '../designTokens.js';

interface ServerStatsProps {
    activeGames?: BrowserApiResponse[] | null;
    archivedGames?: GameData[] | null;
    globalStats?: any;
}

interface ServerMapCardProps {
    activeGames?: BrowserApiResponse[] | null;
}

const ServerMapCard: React.FC<ServerMapCardProps> = ({ activeGames }) => {
    const [userExpandedMap, setUserExpandedMap] = useState(false);

    const totalActivePlayers = useMemo(() => {
        return activeGames?.reduce((acc, curr) => acc + (curr.game?.currentPlayers || 0), 0) || 0;
    }, [activeGames]);

    const activeServersCount = activeGames?.filter(s => s.game && !s.game.inLobby).length || 0;
    const lobbyServersCount = activeGames?.filter(s => s.game && s.game.inLobby).length || 0;

    // Show full map if active players exist OR if user clicked to expand it
    const shouldShowFullMap = totalActivePlayers > 0 || userExpandedMap;

    // Precise location mapping based on user data
    const getServerLocation = (server: BrowserApiResponse) => {
        const combinedText = (server.server.name + " " + (server.server.serverNotes || "")).toUpperCase();

        const LOCATION_LOOKUP = [
            { keys: ["OTL.GG US-CENTRAL", "DES MOINES"], x: 19, y: 30 },
            { keys: ["OTL.GG AU-SOUTHEAST", "MELBOURNE"], x: 88, y: 82 },
            { keys: ["DESCENTFORUM.NET", "D.CENT", "A-GARAGE", "FRANKFURT", "GERMANY", "DEUTSCHLAND"], x: 50, y: 23 },
            { keys: ["NERD NAVY", "ASHBURN", "VIRGINIA"], x: 27, y: 31 },
            { keys: ["SEATTLE", "WASHINGTON"], x: 9, y: 26 },
            { keys: ["SAN FRANCISCO", "SAN JOSE", "CALIFORNIA", "BAY AREA"], x: 8, y: 33 },
            { keys: ["PHOENIX", "ARIZONA"], x: 12, y: 35 },
            { keys: ["DENVER", "COLORADO"], x: 15, y: 32 },
            { keys: ["DALLAS", "TEXAS"], x: 18, y: 36 },
            { keys: ["CHICAGO", "ILLINOIS"], x: 21, y: 30 },
            { keys: ["ATLANTA", "GEORGIA"], x: 23, y: 36 },
            { keys: ["NEW YORK", "BUFFALO", "PISCATAWAY", "JERSEY", "NJ ", "NY "], x: 27, y: 29 },
            { keys: ["TORONTO", "MONTREAL", "QUEBEC", "ONTARIO", "CANADA"], x: 25, y: 27 },
            { keys: ["LONDON", "UK ", "ENGLAND", "BRITAIN"], x: 46, y: 21 },
            { keys: ["AMSTERDAM", "NETHERLANDS", "NL "], x: 48, y: 22 },
            { keys: ["PARIS", "FRANCE"], x: 47, y: 25 },
            { keys: ["MOSCOW", "RUSSIA"], x: 60, y: 18 },
            { keys: ["SINGAPORE", "SG "], x: 76, y: 55 },
            { keys: ["TOKYO", "JAPAN", "JP "], x: 88, y: 35 },
            { keys: ["SYDNEY", "AUSTRALIA", "AU "], x: 91, y: 78 },
            { keys: ["SEOUL", "KOREA"], x: 84, y: 33 },
            { keys: ["BRAZIL", "SAO PAULO", "CHILE"], x: 30, y: 65 },
        ];

        for (const loc of LOCATION_LOOKUP) {
            if (loc.keys.some(k => combinedText.includes(k))) {
                const ipParts = server.server.ip.split('.');
                const lastOctet = parseInt(ipParts[ipParts.length - 1] || '0');
                const jitterX = ((lastOctet % 7) - 3) * 0.3;
                const jitterY = ((server.server.name.length % 7) - 3) * 0.3;
                return { x: loc.x + jitterX, y: loc.y + jitterY };
            }
        }

        return { x: 38, y: 40 };
    };

    const WorldMapPath = () => (
        <g className="text-neutral-700 fill-current">
            <path d="M 5,20 L 10,15 L 20,10 L 35,10 L 40,25 L 30,40 L 20,45 L 10,35 L 5,20 Z" opacity="0" />
            <path d="M9.5,28.5 C9.5,28.5 12.5,22.5 17.5,18.5 C22.5,14.5 30.5,14.5 35.5,16.5 C35.5,16.5 40.5,22.5 35.5,28.5 C30.5,34.5 25.5,40.5 20.5,42.5 C15.5,44.5 12.5,40.5 9.5,28.5 Z" />
            <path d="M22.5,45.5 C22.5,45.5 28.5,45.5 32.5,48.5 C36.5,51.5 35.5,65.5 32.5,72.5 C29.5,79.5 25.5,75.5 24.5,65.5 C23.5,55.5 22.5,45.5 22.5,45.5 Z" />
            <path d="M42.5,22.5 C42.5,22.5 45.5,18.5 50.5,18.5 C55.5,18.5 58.5,22.5 55.5,28.5 C52.5,34.5 48.5,30.5 46.5,28.5 C44.5,26.5 42.5,22.5 42.5,22.5 Z" />
            <path d="M46,23 L48,21 L49,23 L47,25 Z" />
            <path d="M42.5,32.5 C42.5,32.5 50.5,32.5 55.5,35.5 C60.5,38.5 60.5,55.5 52.5,62.5 C44.5,69.5 40.5,55.5 39.5,45.5 C38.5,35.5 42.5,32.5 42.5,32.5 Z" />
            <path d="M58.5,18.5 C58.5,18.5 70.5,14.5 85.5,16.5 C100.5,18.5 95.5,35.5 85.5,45.5 C75.5,55.5 65.5,45.5 60.5,35.5 C55.5,25.5 58.5,18.5 58.5,18.5 Z" />
            <path d="M88,34 L90,32 L92,36 L88,38 Z" />
            <path d="M78.5,65.5 C78.5,65.5 85.5,62.5 92.5,65.5 C99.5,68.5 95.5,82.5 88.5,85.5 C81.5,88.5 75.5,78.5 78.5,65.5 Z" />
        </g>
    );

    return (
        <div className="bg-surface-card border border-line p-4 rounded-card flex flex-col justify-between relative overflow-hidden h-full min-h-[220px]">
            <div className="flex justify-between items-start z-10">
                <div>
                    <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest">Active Servers</h3>
                    <div className="text-2xs font-mono text-brand mt-0.5">
                        {activeGames?.length || 0} Servers Standing By
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setUserExpandedMap(!userExpandedMap)}
                        className="text-2xs font-mono px-2 py-0.5 rounded-control bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-line transition-colors"
                        title={shouldShowFullMap ? "Collapse map" : "Expand map"}
                    >
                        {shouldShowFullMap ? "Hide Map" : "Show Map"}
                    </button>
                    <div className="hidden sm:flex gap-1.5 text-2xs font-mono text-gray-500">
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>{activeServersCount}</span>
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>{lobbyServersCount}</span>
                    </div>
                </div>
            </div>

            {shouldShowFullMap ? (
                <div className="flex-1 relative w-full h-full mt-3 bg-surface-page rounded-card border border-line min-h-[140px]">
                    <div className="absolute inset-0" style={{ backgroundImage: `linear-gradient(${colors.surface.card} 1px, transparent 1px), linear-gradient(90deg, ${colors.surface.card} 1px, transparent 1px)`, backgroundSize: '20px 20px' }}></div>
                    <svg viewBox="0 0 100 100" className="w-full h-full absolute top-0 left-0">
                        <WorldMapPath />
                        {activeGames?.map(s => {
                            const { x, y } = getServerLocation(s);
                            const isActive = s.game && !s.game.inLobby;
                            const isLobby = s.game && s.game.inLobby;
                            const color = isActive ? '#22c55e' : isLobby ? '#eab308' : '#4b5563';

                            return (
                                <Link key={s.server.ip} to={urlFor('live-game-detail', s.server.ip)}>
                                <g className="group cursor-pointer">
                                    {isActive && (
                                        <circle cx={x} cy={y} r="1" fill="none" stroke={color} strokeWidth="0.5" opacity="0.5">
                                            <animate attributeName="r" from="1" to="8" dur="2s" repeatCount="indefinite" />
                                            <animate attributeName="opacity" from="0.8" to="0" dur="2s" repeatCount="indefinite" />
                                        </circle>
                                    )}
                                    <circle cx={x} cy={y} r={isActive ? 2 : 1.5} fill={color} stroke="#000" strokeWidth="0.5" className="transition-all" />
                                    <foreignObject x={Math.min(x - 20, 60)} y={y - 15} width="40" height="20" className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none overflow-visible z-50">
                                        <div className="flex flex-col items-center">
                                            {/* inside a 100x100 viewBox: 5px here is drawn at the map's scale */}
                                            <div className="bg-black/90 border border-gray-600 text-[5px] text-white px-1.5 py-0.5 rounded-control whitespace-nowrap shadow-xl mb-0.5">
                                                {s.server.name}
                                            </div>
                                            <div className="w-0 h-0 border-l-[2px] border-l-transparent border-r-[2px] border-r-transparent border-t-[3px] border-t-gray-600"></div>
                                        </div>
                                    </foreignObject>
                                </g>
                                </Link>
                            );
                        })}
                    </svg>
                </div>
            ) : (
                <div className="flex-1 flex flex-col justify-center space-y-2.5 my-2">
                    <div className="text-2xs text-gray-600 font-mono">
                        {totalActivePlayers > 0 ? `${totalActivePlayers} pilot(s) active in dogfights` : 'No dogfights currently in progress'}
                    </div>
                </div>
            )}
        </div>
    );
};

const ServerStats: React.FC<ServerStatsProps> = ({ activeGames, archivedGames, globalStats }) => {
    const stats = useMemo(() => {
        if (!activeGames || !archivedGames) return null;

        const totalPlayers = activeGames.reduce((acc, curr) => acc + (curr.game?.currentPlayers || 0), 0);
        const topMaps = globalStats?.topMaps || [];
        const modes = globalStats?.modes || [];

        return { totalPlayers, topMaps, modes };
    }, [activeGames, archivedGames, globalStats]);

    if (!stats) return null;

    const COLORS = [colors.brand.DEFAULT, '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Total Pop */}
            <Link
                to={urlFor('pilots')}
                className="bg-surface-card border border-line p-4 rounded-card flex flex-col justify-center items-center relative overflow-hidden group cursor-pointer hover:border-brand transition-colors"
            >
                <div className="absolute inset-0 bg-gradient-to-t from-brand/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest z-10">Pilots Online</h3>
                <div className="text-5xl font-bold text-white z-10 mt-2 group-hover:text-brand transition-colors">{stats.totalPlayers}</div>
                <div className="text-xs text-brand z-10 mt-1 font-mono">Active across {activeGames?.length || 0} servers</div>
            </Link>

            {/* World Map - Adaptive */}
            <ServerMapCard activeGames={activeGames} />

            {/* Map Pop */}
            <div className="bg-surface-card border border-line p-4 rounded-card flex flex-col justify-between">
                <div>
                    <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-3">Top Maps</h3>
                    <div className="space-y-2">
                        {stats.topMaps.slice(0, 5).map((map: any, i: number) => (
                            <Link
                                key={map.name}
                                to={urlFor('maps', map.name)}
                                className="flex items-center gap-2 text-xs cursor-pointer group"
                            >
                                <div className="w-4 text-gray-600 font-mono">{i + 1}</div>
                                <div className="flex-1 text-gray-300 truncate group-hover:text-brand transition-colors">{map.name}</div>
                                <div className="text-brand font-mono">{map.value}</div>
                            </Link>
                        ))}
                    </div>
                </div>
                <div className="text-2xs text-gray-600 font-mono mt-2">Ranked by matches</div>
            </div>

            {/* Mode Distribution - Horizontal Labeled Bars */}
            <div className="bg-surface-card border border-line p-4 rounded-card flex flex-col justify-between">
                <div>
                    <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-3">Mode Distribution</h3>
                    <div className="space-y-2.5">
                        {(() => {
                            const totalModeMatches = stats.modes.reduce((acc: number, m: any) => acc + (m.value || 0), 0) || 1;
                            return stats.modes.slice(0, 4).map((entry: any, index: number) => {
                                const pct = Math.round((entry.value / totalModeMatches) * 100);
                                const color = COLORS[index % COLORS.length];
                                return (
                                    <div key={entry.name} className="space-y-1">
                                        <div className="flex justify-between items-center text-xs font-mono">
                                            <span className="text-gray-300 font-bold truncate max-w-[140px]">{entry.name}</span>
                                            <span className="text-gray-400 font-mono text-2xs">{entry.value} ({pct}%)</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-gray-900 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-500"
                                                style={{ width: `${pct}%`, backgroundColor: color }}
                                            />
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                </div>
                <div className="text-2xs text-gray-600 font-mono mt-2">Historical match modes (Last 365 Days)</div>
            </div>
        </div>
    );
};

export default ServerStats;
