import React from 'react';
import Link from '../Link';
import { urlFor } from '../../server/lib/siteRoutes.js';
import { count, plural } from '../../server/lib/matchResult.js';
import { BeltReign } from '../../services/apiService';

// One mode's line of holders (S21), newest first: each reign's champion, the
// days it ran, its defenses and the match that ended it.
// (The newest reign's number is how many the mode has had.)
const BeltLineage: React.FC<{ label: string; lineage: BeltReign[] }> = ({ label, lineage }) => (
    <div className="bg-surface-card border border-line rounded-card overflow-hidden">
        <h3 className="px-4 py-3 border-b border-line text-gray-500 font-bold text-xs uppercase tracking-widest">
            {label} <span className="normal-case tracking-normal font-normal">({plural(lineage[0].reign, 'reign', 'reigns')}{lineage[0].reign > lineage.length ? `, the last ${lineage.length}` : ''})</span>
        </h3>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-mono">
                <thead className="bg-surface-raised text-gray-500 text-xs uppercase">
                    <tr>
                        <th className="p-3 text-center w-10">#</th>
                        <th className="p-3">Champion</th>
                        <th className="p-3 hidden sm:table-cell">Won</th>
                        <th className="p-3 text-right">Days</th>
                        <th className="p-3 text-right">Defenses</th>
                        <th className="p-3 text-right">Lost</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-line">
                    {lineage.map(r => (
                        <tr key={r.reign}>
                            <td className="p-3 text-center text-gray-500 font-bold">{r.reign}</td>
                            <td className="p-3 font-bold"><Link to={urlFor('pilot', r.name)} className="text-white hover:text-brand [overflow-wrap:anywhere]">{r.name}</Link></td>
                            <td className="p-3 hidden sm:table-cell text-gray-400 whitespace-nowrap">
                                <Link to={urlFor('game-detail', r.game)} className="hover:text-brand underline decoration-gray-700">{r.since}</Link>
                            </td>
                            <td className="p-3 text-right text-gray-300">{count(r.days)}</td>
                            <td className="p-3 text-right text-brand font-bold">{count(r.defenses)}</td>
                            <td className="p-3 text-right text-gray-400 whitespace-nowrap">
                                {r.lost_game ? <Link to={urlFor('game-detail', r.lost_game)} className="hover:text-brand underline decoration-gray-700">{r.until}</Link> : <span className="text-brand">Holds it</span>}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

export default BeltLineage;
