
import React, { useMemo } from 'react';
import { GameData } from '../types';
import { 
    calculateNemesis, calculateWeaponStats, calculateStreaks, 
    calculatePlayStyles, calculateKillHeatmap, calculateFirstBlood,
    calculateTeamSynergy
} from '../utils/statCalculators';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis } from 'recharts';

interface MatchAnalysisProps {
    game: GameData;
}

const MatchAnalysis: React.FC<MatchAnalysisProps> = ({ game }) => {
    const nemesis = useMemo(() => calculateNemesis(game.kills), [game.kills]);
    const weaponStats = useMemo(() => calculateWeaponStats(game), [game]);
    const streak = useMemo(() => calculateStreaks(game.kills), [game.kills]);
    const styles = useMemo(() => calculatePlayStyles(game), [game]);
    const firstBlood = useMemo(() => calculateFirstBlood(game.kills), [game.kills]);
    const heatmap = useMemo(() => {
        const duration = game.end && game.start 
            ? (new Date(game.end).getTime() - new Date(game.start).getTime()) / 60000
            : (game.settings?.timeLimit || 15 * 60) / 60;
        return calculateKillHeatmap(game.kills, duration);
    }, [game]);
    const synergy = useMemo(() => calculateTeamSynergy(game.players || []), [game.players]);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

    const notableStyles = styles.filter(s => s.style !== 'Balanced');

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Highlights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* First Blood */}
                {firstBlood && (
                    <div className="bg-[#1a1a1a] border border-gray-800 p-4 rounded relative overflow-hidden">
                        <div className="absolute top-0 right-0 text-6xl text-red-900/20 font-bold select-none">!</div>
                        <h4 className="text-xs uppercase text-gray-500 font-bold tracking-wider mb-1">First Blood</h4>
                        <div className="text-xl font-bold text-white">{firstBlood.attacker}</div>
                        <div className="text-xs text-gray-400">vs {firstBlood.defender} ({Math.floor(firstBlood.time)}s)</div>
                    </div>
                )}

                {/* Nemesis */}
                {nemesis && (
                    <div className="bg-[#1a1a1a] border border-gray-800 p-4 rounded">
                        <h4 className="text-xs uppercase text-gray-500 font-bold tracking-wider mb-1">Rivalry</h4>
                        <div className="text-white font-bold text-sm truncate">
                            {nemesis.p1} <span className="text-[#ff6600]">vs</span> {nemesis.p2}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                            Traded <span className="text-white font-mono text-sm">{nemesis.count}</span> kills
                        </div>
                    </div>
                )}

                {/* Streak */}
                {streak && (
                    <div className="bg-[#1a1a1a] border border-gray-800 p-4 rounded">
                        <h4 className="text-xs uppercase text-gray-500 font-bold tracking-wider mb-1">Unstoppable</h4>
                        <div className="text-xl font-bold text-white">{streak.player}</div>
                        <div className="text-xs text-gray-400">{streak.count} Kill Streak</div>
                    </div>
                )}

                {/* Glass Cannon */}
                {styles.find(s => s.style === 'Glass Cannon') && (
                    <div className="bg-[#1a1a1a] border border-gray-800 p-4 rounded border-l-4 border-l-red-500">
                        <h4 className="text-xs uppercase text-gray-500 font-bold tracking-wider mb-1">Glass Cannon</h4>
                        <div className="text-xl font-bold text-white">{styles.find(s => s.style === 'Glass Cannon')?.name}</div>
                        <div className="text-xs text-gray-400">High Dmg / High Deaths</div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Weapon Efficiency */}
                <div className="bg-[#111] border border-gray-800 p-4 rounded h-80">
                    <h3 className="text-white font-bold mb-4 text-sm uppercase">Weapon Efficiency (Kills vs Damage)</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                            <XAxis type="number" dataKey="damage" name="Damage" unit="dmg" stroke="#666" fontSize={10} />
                            <YAxis type="number" dataKey="kills" name="Kills" unit="k" stroke="#666" fontSize={10} />
                            <ZAxis type="category" dataKey="name" name="Weapon" />
                            <Tooltip 
                                cursor={{ strokeDasharray: '3 3' }} 
                                contentStyle={{backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '4px'}} 
                                itemStyle={{color: '#fff'}}
                                labelStyle={{color: '#ccc'}}
                            />
                            <Scatter name="Weapons" data={weaponStats} fill="#ff6600">
                                {weaponStats.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>

                {/* Damage Distribution */}
                <div className="bg-[#111] border border-gray-800 p-4 rounded h-80">
                    <h3 className="text-white font-bold mb-4 text-sm uppercase">Damage Meta</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={weaponStats}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="damage"
                            >
                                {weaponStats.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '4px'}} 
                                itemStyle={{color: '#fff'}}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Kill Heatmap */}
                <div className="lg:col-span-2 bg-[#111] border border-gray-800 p-4 rounded h-64">
                    <h3 className="text-white font-bold mb-4 text-sm uppercase">Match Intensity (Kills/Min)</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={heatmap}>
                            <XAxis dataKey="minute" stroke="#666" fontSize={10} tickFormatter={val => `${val}'`} />
                            <Tooltip 
                                contentStyle={{backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '4px'}} 
                                cursor={{fill: '#222'}} 
                                itemStyle={{color: '#fff'}}
                                labelStyle={{color: '#ccc'}}
                            />
                            <Bar dataKey="count" fill="#ef4444" radius={[2, 2, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Team Synergy or Playstyles List */}
                <div className="bg-[#111] border border-gray-800 p-4 rounded h-64 overflow-y-auto custom-scrollbar">
                    <h3 className="text-white font-bold mb-4 text-sm uppercase">Player Badges</h3>
                    <div className="space-y-2">
                        {notableStyles.length === 0 ? (
                            <div className="text-gray-600 text-xs italic text-center py-8">
                                No distinct playstyles detected.<br/>(Everyone played balanced)
                            </div>
                        ) : (
                            notableStyles.map(s => (
                                <div key={s.name} className="flex justify-between items-center bg-[#1a1a1a] p-2 rounded border border-gray-800">
                                    <span className="text-sm font-bold text-gray-300">{s.name}</span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded font-mono uppercase border ${
                                        s.style === 'Glass Cannon' ? 'text-red-400 border-red-900/30 bg-red-900/10' :
                                        s.style === 'Pacifist' ? 'text-green-400 border-green-900/30 bg-green-900/10' :
                                        s.style === 'Punching Bag' ? 'text-gray-400 border-gray-700 bg-gray-800' :
                                        'text-yellow-400 border-yellow-900/30 bg-yellow-900/10'
                                    }`}>
                                        {s.style}
                                    </span>
                                </div>
                            ))
                        )}
                        
                        {Object.keys(synergy).length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-800">
                                <h4 className="text-xs text-gray-500 uppercase mb-2">Teamwork (Assists)</h4>
                                {Object.entries(synergy).map(([team, count]) => (
                                    <div key={team} className="flex justify-between text-xs font-mono mb-1">
                                        <span className={team === 'BLUE' ? 'text-blue-400' : 'text-orange-400'}>{team}</span>
                                        <span className="text-white">{count} Assists</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MatchAnalysis;
