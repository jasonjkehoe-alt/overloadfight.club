import React from 'react';
import { ACHIEVEMENTS, ACHIEVEMENT_GROUPS, TIERS } from '../../server/lib/gameParse.js';
import { count, plural } from '../../server/lib/matchResult.js';

// Every achievement (S21) with what it counts, its three thresholds and how
// many pilots reached each tier, by group.
const AchievementList: React.FC<{ pilots: Record<string, number[]> }> = ({ pilots }) => (
    <div className="space-y-6">
        {ACHIEVEMENT_GROUPS.map(group => (
            <div key={group}>
                <h3 className="text-gray-500 font-bold text-xs uppercase tracking-widest mb-3">{group}</h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {ACHIEVEMENTS.filter(a => a.group === group).map(a => (
                        <li key={a.id} className="bg-surface-card border border-line rounded-card p-4" data-achievement={a.id}>
                            <div className="font-bold text-white brand-font">{a.name}</div>
                            <p className="text-xs font-mono text-gray-400 mt-1">{a.best ? 'The most ' : ''}{a.counts}</p>
                            <dl className="grid grid-cols-3 gap-2 mt-3 text-xs font-mono">
                                {TIERS.map((tier, i) => (
                                    <div key={tier} className="bg-surface-raised rounded-control px-2 py-1.5">
                                        <dt className="text-gray-500 uppercase text-2xs">{tier}</dt>
                                        <dd className="text-brand font-bold">{count(a.tiers[i])}</dd>
                                        <dd className="text-gray-400">{plural(pilots[a.id]?.[i] ?? 0, 'pilot', 'pilots')}</dd>
                                    </div>
                                ))}
                            </dl>
                        </li>
                    ))}
                </ul>
            </div>
        ))}
    </div>
);

export default AchievementList;
