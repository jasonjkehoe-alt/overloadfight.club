import React, { memo } from 'react';
import Link from '../Link';
import { urlFor } from '../../server/lib/siteRoutes.js';
import { RivalPair } from '../../services/apiService';

// The ranked list of pairs (S17): the pairs of opponents with the most kills
// exchanged, each read from the side with more kills; the kills open the
// pair's tape (S20).
const RivalPairs: React.FC<{ pairs: RivalPair[] }> = ({ pairs }) => (
    <div className="overflow-x-auto">
        <table className="w-full text-left text-sm font-mono">
            <caption className="sr-only">The pairs of opponents with the most kills exchanged in logged ranked matches</caption>
            <thead className="bg-surface-raised text-gray-500 text-xs uppercase">
                <tr>
                    <th className="px-2 py-2 sm:p-3 text-center w-10">#</th>
                    <th className="px-2 py-2 sm:p-3">Pilot</th>
                    <th className="px-2 py-2 sm:p-3 text-center" title="Kills by the first pilot on the second, then the second's on the first; opens their tale of the tape">Kills</th>
                    <th className="px-2 py-2 sm:p-3">Opponent</th>
                    <th className="px-2 py-2 sm:p-3 text-right" title="Logged ranked matches the two played on different sides">Matches</th>
                    <th className="px-2 py-2 sm:p-3 text-right hidden sm:table-cell" title="Damage by the first pilot on the second, then the second's on the first">Damage</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-line">
                {pairs.map((p, i) => {
                    return (
                        <tr key={`${p.pilot}\n${p.opponent}`} className="hover:bg-surface-raised transition-colors">
                            <td className="px-2 py-2 sm:p-3 text-center text-gray-400 font-bold">{i + 1}</td>
                            <td className="px-2 py-2 sm:p-3 font-bold"><Link to={urlFor('pilot', p.name)} className="text-white hover:text-brand">{p.name}</Link></td>
                            <td className="px-2 py-2 sm:p-3 text-center whitespace-nowrap tabular-nums">
                                <Link to={urlFor('tape', p.name, p.opponent_name)} className="hover:underline" title={`Tale of the tape: ${p.name} against ${p.opponent_name}`} aria-label={`${p.kills} kills to ${p.deaths}: tale of the tape, ${p.name} against ${p.opponent_name}`}>
                                    <span className="text-brand font-bold">{p.kills.toLocaleString()}</span><span className="text-gray-500">–</span><span className="text-gray-300">{p.deaths.toLocaleString()}</span>
                                </Link>
                            </td>
                            <td className="px-2 py-2 sm:p-3"><Link to={urlFor('pilot', p.opponent_name)} className="text-gray-300 hover:text-brand">{p.opponent_name}</Link></td>
                            <td className="px-2 py-2 sm:p-3 text-right text-gray-300">{p.matches.toLocaleString()}</td>
                            <td className="px-2 py-2 sm:p-3 text-right text-gray-400 hidden sm:table-cell whitespace-nowrap tabular-nums">{p.damage_dealt.toLocaleString()} / {p.damage_taken.toLocaleString()}</td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    </div>
);

export default memo(RivalPairs);
