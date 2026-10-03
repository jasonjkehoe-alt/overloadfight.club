
import React, { useMemo } from 'react';
import { BrowserApiResponse, GameData } from '../types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface ServerStatsProps {
    activeGames?: BrowserApiResponse[] | null;
    archivedGames?: GameData[] | null;
    onNavigate: (view: string, param?: string) => void;
    globalStats?: any;
}

interface ServerMapCardProps {
    activeGames?: BrowserApiResponse[] | null;
    onSelectLiveGame?: (server: BrowserApiResponse) => void;
}

const ServerMapCard: React.FC<ServerMapCardProps> = ({ activeGames, onSelectLiveGame }) => {

    // Precise location mapping based on user data
    const getServerLocation = (server: BrowserApiResponse) => {
        const combinedText = (server.server.name + " " + (server.server.serverNotes || "")).toUpperCase();

        // Coordinate System: 0-100% of SVG ViewBox
        // Tuning based on the WorldMapPath SVG paths

        const LOCATION_LOOKUP = [
            // --- SPECIFIC SERVERS ---
            { keys: ["OTL.GG US-CENTRAL", "DES MOINES"], x: 19, y: 30 }, // Iowa
            { keys: ["OTL.GG AU-SOUTHEAST", "MELBOURNE"], x: 88, y: 82 }, // Victoria, AU
            { keys: ["DESCENTFORUM.NET", "D.CENT", "A-GARAGE", "FRANKFURT", "GERMANY", "DEUTSCHLAND"], x: 50, y: 23 }, // Germany
            { keys: ["NERD NAVY", "ASHBURN", "VIRGINIA"], x: 27, y: 31 }, // VA, USA

            // --- US CITIES ---
            { keys: ["SEATTLE", "WASHINGTON"], x: 9, y: 26 },
            { keys: ["SAN FRANCISCO", "SAN JOSE", "CALIFORNIA", "BAY AREA"], x: 8, y: 33 },
            { keys: ["PHOENIX", "ARIZONA"], x: 12, y: 35 },
            { keys: ["DENVER", "COLORADO"], x: 15, y: 32 },
            { keys: ["DALLAS", "TEXAS"], x: 18, y: 36 },
            { keys: ["CHICAGO", "ILLINOIS"], x: 21, y: 30 },
            { keys: ["ATLANTA", "GEORGIA"], x: 23, y: 36 },
            { keys: ["NEW YORK", "BUFFALO", "PISCATAWAY", "JERSEY", "NJ ", "NY "], x: 27, y: 29 },

            // --- CANADA ---
            { keys: ["TORONTO", "MONTREAL", "QUEBEC", "ONTARIO", "CANADA"], x: 25, y: 27 },

            // --- EUROPE ---
            { keys: ["LONDON", "UK ", "ENGLAND", "BRITAIN"], x: 46, y: 21 },
            { keys: ["AMSTERDAM", "NETHERLANDS", "NL "], x: 48, y: 22 },
            { keys: ["PARIS", "FRANCE"], x: 47, y: 25 },
            { keys: ["MOSCOW", "RUSSIA"], x: 60, y: 18 },

            // --- ASIA / OCEANIA ---
            { keys: ["SINGAPORE", "SG "], x: 76, y: 55 },
            { keys: ["TOKYO", "JAPAN", "JP "], x: 88, y: 35 },
            { keys: ["SYDNEY", "AUSTRALIA", "AU "], x: 91, y: 78 }, // Sydney
            { keys: ["SEOUL", "KOREA"], x: 84, y: 33 },

            // --- SOUTH AMERICA ---
            { keys: ["BRAZIL", "SAO PAULO", "CHILE"], x: 30, y: 65 },
        ];

        // Find first match
        for (const loc of LOCATION_LOOKUP) {
            if (loc.keys.some(k => combinedText.includes(k))) {
                // Deterministic Jitter based on IP to prevent exact overlaps for same-city servers
                const ipParts = server.server.ip.split('.');
                const lastOctet = parseInt(ipParts[ipParts.length - 1] || '0');
                const jitterX = ((lastOctet % 7) - 3) * 0.3;
                const jitterY = ((server.server.name.length % 7) - 3) * 0.3;

                return { x: loc.x + jitterX, y: loc.y + jitterY };
            }
        }

        // Fallback for unknown locations: Middle of Atlantic
        return { x: 38, y: 40 };
    };

    // Detailed Mercator World Map Path
    const WorldMapPath = () => (
        <g className="text-[#333] fill-current">
            {/* North America */}
            <path d="M 5,20 L 10,15 L 20,10 L 35,10 L 40,25 L 30,40 L 20,45 L 10,35 L 5,20 Z" opacity="0" />
            <path d="M9.5,28.5 C9.5,28.5 12.5,22.5 17.5,18.5 C22.5,14.5 30.5,14.5 35.5,16.5 C35.5,16.5 40.5,22.5 35.5,28.5 C30.5,34.5 25.5,40.5 20.5,42.5 C15.5,44.5 12.5,40.5 9.5,28.5 Z" />

            {/* South America */}
            <path d="M22.5,45.5 C22.5,45.5 28.5,45.5 32.5,48.5 C36.5,51.5 35.5,65.5 32.5,72.5 C29.5,79.5 25.5,75.5 24.5,65.5 C23.5,55.5 22.5,45.5 22.5,45.5 Z" />

            {/* Europe */}
            <path d="M42.5,22.5 C42.5,22.5 45.5,18.5 50.5,18.5 C55.5,18.5 58.5,22.5 55.5,28.5 C52.5,34.5 48.5,30.5 46.5,28.5 C44.5,26.5 42.5,22.5 42.5,22.5 Z" />
            <path d="M46,23 L48,21 L49,23 L47,25 Z" /> {/* UKish */}

            {/* Africa */}
            <path d="M42.5,32.5 C42.5,32.5 50.5,32.5 55.5,35.5 C60.5,38.5 60.5,55.5 52.5,62.5 C44.5,69.5 40.5,55.5 39.5,45.5 C38.5,35.5 42.5,32.5 42.5,32.5 Z" />

            {/* Asia / Russia */}
            <path d="M58.5,18.5 C58.5,18.5 70.5,14.5 85.5,16.5 C100.5,18.5 95.5,35.5 85.5,45.5 C75.5,55.5 65.5,45.5 60.5,35.5 C55.5,25.5 58.5,18.5 58.5,18.5 Z" />

            {/* Japan */}
            <path d="M88,34 L90,32 L92,36 L88,38 Z" />

            {/* Australia */}
            <path d="M78.5,65.5 C78.5,65.5 85.5,62.5 92.5,65.5 C99.5,68.5 95.5,82.5 88.5,85.5 C81.5,88.5 75.5,78.5 78.5,65.5 Z" />
        </g>
    );

    return (
        <div className="bg-[#111] border border-gray-800 p-4 rounded flex flex-col relative overflow-hidden h-full min-h-[240px]">
            <div className="flex justify-between items-start z-10">
                <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest">Active Nodes</h3>
                <div className="flex gap-2 text-[10px] font-mono text-gray-600">
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>GAME</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>LOBBY</span>
                </div>
            </div>

            <div className="flex-1 relative w-full h-full mt-4 bg-[#0a0a0a] rounded border border-gray-900">
                {/* Grid Lines for tech feel */}
                <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(#151515 1px, transparent 1px), linear-gradient(90deg, #151515 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

                <svg viewBox="0 0 100 100" className="w-full h-full absolute top-0 left-0">
                    <WorldMapPath />

                    {activeGames?.map(s => {
                        const { x, y } = getServerLocation(s);
                        const isActive = s.game && !s.game.inLobby;
                        const isLobby = s.game && s.game.inLobby;
                        const color = isActive ? '#22c55e' : isLobby ? '#eab308' : '#4b5563';

                        return (
                            <g
                                key={s.server.ip}
                                className={`group ${onSelectLiveGame ? 'cursor-pointer' : ''}`}
                                onClick={() => onSelectLiveGame && onSelectLiveGame(s)}
                            >
                                {/* Ping Wave Animation */}
                                {isActive && (
                                    <circle cx={x} cy={y} r="1" fill="none" stroke={color} strokeWidth="0.5" opacity="0.5">
                                        <animate attributeName="r" from="1" to="8" dur="2s" repeatCount="indefinite" />
                                        <animate attributeName="opacity" from="0.8" to="0" dur="2s" repeatCount="indefinite" />
                                    </circle>
                                )}

                                {/* Server Dot */}
                                <circle cx={x} cy={y} r={isActive ? 2 : 1.5} fill={color} stroke="#000" strokeWidth="0.5" className="transition-all group-hover:r-3" />

                                {/* Connecting Lines to nearest Hub (Visual Flair) */}
                                <line x1={x} y1={y} x2={x} y2={100} stroke={color} strokeWidth="0.1" opacity="0.2" strokeDasharray="1 1" />

                                {/* Tooltip (ForeignObject) */}
                                <foreignObject x={Math.min(x - 20, 60)} y={y - 15} width="40" height="20" className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none overflow-visible z-50">
                                    <div className="flex flex-col items-center">
                                        <div className="bg-black/90 border border-gray-600 text-[5px] text-white px-1.5 py-0.5 rounded whitespace-nowrap shadow-xl mb-0.5">
                                            {s.server.name}
                                        </div>
                                        <div className="w-0 h-0 border-l-[2px] border-l-transparent border-r-[2px] border-r-transparent border-t-[3px] border-t-gray-600"></div>
                                    </div>
                                </foreignObject>
                            </g>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
};

const ServerStats: React.FC<ServerStatsProps & { onSelectLiveGame?: (server: BrowserApiResponse) => void }> = ({ activeGames, archivedGames, onNavigate, onSelectLiveGame, globalStats }) => {

    const stats = useMemo(() => {
        if (!activeGames || !archivedGames) return null;

        // Total Population
        const totalPlayers = activeGames.reduce((acc, curr) => acc + (curr.game?.currentPlayers || 0), 0);

        // Use Global Stats if available, otherwise fallback (though globalStats should be there)
        const topMaps = globalStats?.topMaps || [];
        const modes = globalStats?.modes || [];

        return { totalPlayers, topMaps, modes };
    }, [activeGames, archivedGames, globalStats]);

    if (!stats) return null;

    const COLORS = ['#ff6600', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Total Pop */}
            <div
                onClick={() => onNavigate('pilots')}
                className="bg-[#111] border border-gray-800 p-4 rounded flex flex-col justify-center items-center relative overflow-hidden group cursor-pointer hover:border-[#ff6600] transition-colors"
            >
                <div className="absolute inset-0 bg-gradient-to-t from-[#ff6600]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest z-10">Pilots Online</h3>
                <div className="text-5xl font-bold text-white z-10 mt-2 group-hover:text-[#ff6600] transition-colors">{stats.totalPlayers}</div>
                <div className="text-xs text-[#ff6600] z-10 mt-1 font-mono">Active across {activeGames?.length || 0} servers</div>
            </div>

            {/* World Map */}
            <ServerMapCard activeGames={activeGames} onSelectLiveGame={onSelectLiveGame} />

            {/* Map Pop */}
            <div className="bg-[#111] border border-gray-800 p-4 rounded">
                <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-3">Top Maps</h3>
                <div className="space-y-2">
                    {stats.topMaps.map((map: any, i: number) => (
                        <div
                            key={map.name}
                            onClick={() => onNavigate('maps', map.name)}
                            className="flex items-center gap-2 text-xs cursor-pointer group"
                        >
                            <div className="w-4 text-gray-600 font-mono">{i + 1}</div>
                            <div className="flex-1 text-gray-300 truncate group-hover:text-[#ff6600] transition-colors">{map.name}</div>
                            <div className="text-[#ff6600] font-mono">{map.value}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Mode Dist */}
            <div className="bg-[#111] border border-gray-800 p-4 rounded flex flex-col">
                <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">Mode Distribution</h3>
                <div className="flex-1 min-h-[100px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={stats.modes}
                                cx="50%"
                                cy="50%"
                                innerRadius={30}
                                outerRadius={50}
                                paddingAngle={2}
                                dataKey="value"
                            >
                                {stats.modes.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '4px', fontSize: '12px' }}
                                itemStyle={{ color: '#fff' }}
                                labelStyle={{ color: '#ccc' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>

    );
};

export default ServerStats;
