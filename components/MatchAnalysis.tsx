
import React, { useMemo } from 'react';
import { GameData } from '../types';
import { EmptyState } from './States';
import { 
    calculateNemesis, calculateWeaponStats, calculateStreaks, 
    calculatePlayStyles, calculateKillHeatmap,
    calculateTeamSynergy
} from '../utils/statCalculators';
import { durationOf, firstBloodOf, weaponFamily, WEAPON_FAMILIES } from '../server/lib/gameParse.js';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis } from 'recharts';
import { colors, chart, chartTooltip, chartTooltipText } from '../designTokens.js';

interface MatchAnalysisProps {
    game: GameData;
}

const MatchAnalysis: React.FC<MatchAnalysisProps> = ({ game }) => {
    const nemesis = useMemo(() => calculateNemesis(game.kills), [game.kills]);
    const weaponStats = useMemo(() => calculateWeaponStats(game), [game]);
    // Damage per weapon family, so each slice has its own colour, the family's
    // colour on the momentum chart.
    const familyDamage = useMemo(() => {
        const damage = new Map<string, number>();
        for (const w of weaponStats) damage.set(weaponFamily(w.name), (damage.get(weaponFamily(w.name)) || 0) + w.damage);
        return [...WEAPON_FAMILIES, { id: 'other', label: 'Other' }]
            .map(f => ({ id: f.id, name: f.label, damage: Math.round(damage.get(f.id) || 0) }))
            .filter(f => f.damage > 0);
    }, [weaponStats]);
    const streak = useMemo(() => calculateStreaks(game.kills), [game.kills]);
    const styles = useMemo(() => calculatePlayStyles(game), [game]);
    const firstBlood = useMemo(() => firstBloodOf(game), [game]);
    // An unknown length (0) falls back to the helper's 15-minute default.
    const heatmap = useMemo(() => calculateKillHeatmap(game.kills, durationOf(game) / 60 || undefined), [game]);
    const synergy = useMemo(() => calculateTeamSynergy(game.players || []), [game.players]);

    // Each weapon in its family's colour, as on the momentum chart and the replay.
    const weaponColor = (name: string) => chart.weapon[weaponFamily(name)];

    const notableStyles = styles.filter(s => s.style !== 'Balanced');

    return (
        <div className="space-y-6">
            {/* Highlights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* First Blood */}
                {firstBlood && (
                    <div className="bg-surface-raised border border-line p-4 rounded-card relative overflow-hidden">
                        <div className="absolute top-0 right-0 text-6xl text-red-900/20 font-bold select-none">!</div>
                        <h4 className="text-xs uppercase text-gray-500 font-bold tracking-wider mb-1">First Blood</h4>
                        <div className="text-xl font-bold text-white">{firstBlood.attacker}</div>
                        <div className="text-xs text-gray-400">vs {firstBlood.defender} ({Math.floor(firstBlood.time)}s)</div>
                    </div>
                )}

                {/* Nemesis */}
                {nemesis && (
                    <div className="bg-surface-raised border border-line p-4 rounded-card">
                        <h4 className="text-xs uppercase text-gray-500 font-bold tracking-wider mb-1">Rivalry</h4>
                        <div className="text-white font-bold text-sm truncate">
                            {nemesis.p1} <span className="text-brand">vs</span> {nemesis.p2}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                            Traded <span className="text-white font-mono text-sm">{nemesis.count}</span> kills
                        </div>
                    </div>
                )}

                {/* Streak */}
                {streak && (
                    <div className="bg-surface-raised border border-line p-4 rounded-card cursor-help" title="Best kill streak within a single match; resets on death.">
                        <h4 className="text-xs uppercase text-gray-500 font-bold tracking-wider mb-1 flex items-center justify-between">
                            <span>Unstoppable</span>
                            <span className="text-2xs text-gray-600 font-normal">STREAK</span>
                        </h4>
                        <div className="text-xl font-bold text-white">{streak.player}</div>
                        <div className="text-xs text-brand font-mono">{streak.count} Kill Streak</div>
                    </div>
                )}

                {/* Glass Cannon */}
                {styles.find(s => s.style === 'Glass Cannon') && (
                    <div className="bg-surface-raised border border-line p-4 rounded-card border-l-4 border-l-red-500">
                        <h4 className="text-xs uppercase text-gray-500 font-bold tracking-wider mb-1">Glass Cannon</h4>
                        <div className="text-xl font-bold text-white">{styles.find(s => s.style === 'Glass Cannon')?.name}</div>
                        <div className="text-xs text-gray-400">High Dmg / High Deaths</div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Weapon Efficiency */}
                <div className="bg-surface-card border border-line p-4 rounded-card h-80">
                    <h3 className="text-white font-bold mb-4 text-sm uppercase">Weapon Efficiency (Kills vs Damage)</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                            <XAxis type="number" dataKey="damage" name="Damage" unit="dmg" stroke={chart.label} fontSize={10} />
                            <YAxis type="number" dataKey="kills" name="Kills" unit="k" stroke={chart.label} fontSize={10} />
                            <ZAxis type="category" dataKey="name" name="Weapon" />
                            <Tooltip 
                                cursor={{ strokeDasharray: '3 3' }} 
                                contentStyle={chartTooltip} 
                                {...chartTooltipText}
                            />
                            <Scatter name="Weapons" data={weaponStats} fill={colors.brand.DEFAULT}>
                                {weaponStats.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={weaponColor(entry.name)} />
                                ))}
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>

                {/* Damage Distribution */}
                <div className="bg-surface-card border border-line p-4 rounded-card h-80">
                    <h3 className="text-white font-bold mb-4 text-sm uppercase">Damage Meta (Weapon Families)</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={familyDamage}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="damage"
                            >
                                {familyDamage.map(entry => (
                                    <Cell key={entry.id} fill={chart.weapon[entry.id]} />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={chartTooltip} 
                                {...chartTooltipText}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Kill Heatmap */}
                <div className="lg:col-span-2 bg-surface-card border border-line p-4 rounded-card h-64">
                    <h3 className="text-white font-bold mb-4 text-sm uppercase">Match Intensity (Kills/Min)</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={heatmap}>
                            <XAxis dataKey="minute" stroke={chart.label} fontSize={10} tickFormatter={val => `${val}'`} />
                            <Tooltip 
                                contentStyle={chartTooltip} 
                                cursor={{fill: colors.surface.raised}} 
                                {...chartTooltipText}
                            />
                            <Bar dataKey="count" fill={colors.brand.DEFAULT} radius={[2, 2, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Team Synergy or Playstyles List */}
                <div className="bg-surface-card border border-line p-4 rounded-card h-64 overflow-y-auto">
                    <h3 className="text-white font-bold mb-4 text-sm uppercase">Pilot Badges</h3>
                    <div className="space-y-2">
                        {notableStyles.length === 0 ? (
                            <EmptyState compact title="No distinct playstyles detected." message="Everyone played balanced." />
                        ) : (
                            notableStyles.map(s => (
                                <div key={s.name} className="flex justify-between items-center bg-surface-raised p-2 rounded-control border border-line">
                                    <span className="text-sm font-bold text-gray-300">{s.name}</span>
                                    <span className={`text-2xs px-2 py-0.5 rounded-control font-mono uppercase border ${
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
                            <div className="mt-4 pt-4 border-t border-line">
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
