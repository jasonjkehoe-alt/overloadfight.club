import React from 'react';
import Link from '../Link';
import { chart } from '../../designTokens.js';
import { urlFor } from '../../server/lib/siteRoutes.js';
import { PilotRivalry } from '../../services/apiService';

// The pilot's kills on an opponent and the opponent's on the pilot: the
// accent hue and the palette's de-emphasis grey, the S16 emphasis pair the
// validator passed, so the pilot is the point and the opponent the context.
const PILOT = chart.series;
const OPPONENT = chart.label;

// "Rivals from the kill log" (S17): the opponents with the most kills
// exchanged, each a back-to-back bar (their kills on the pilot to the left,
// the pilot's on them to the right, on one scale), with the matches and the
// damage each way in words.
const RivalBars: React.FC<{ name: string; data: PilotRivalry }> = ({ name, data }) => {
    const { opponents, totals } = data;
    const max = Math.max(1, ...opponents.flatMap(o => [o.kills, o.deaths]));
    const width = (n: number) => `${(n / max) * 100}%`;
    return (
        <div>
            <h4 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Rivals from the kill log</h4>
            <p className="text-xs text-gray-400 mb-2">
                {totals.kills.toLocaleString()} kills on {totals.opponents.toLocaleString()} opponent{totals.opponents === 1 ? '' : 's'} and {totals.deaths.toLocaleString()} deaths to them; {totals.damage_dealt.toLocaleString()} damage dealt, {totals.damage_taken.toLocaleString()} taken.
            </p>
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-2xs text-gray-400 mb-2" aria-hidden>
                <li className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: OPPONENT }} />Their kills on {name}</li>
                <li className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: PILOT }} />{name}'s kills on them</li>
            </ul>
            <ol className="divide-y divide-line">
                {opponents.map(o => (
                    <li key={o.opponent} className="py-1.5">
                        <div className="flex items-baseline justify-between gap-2 text-xs">
                            <Link to={urlFor('pilot', o.opponent_name)} className="text-white font-bold hover:text-brand truncate">{o.opponent_name}</Link>
                            <span className="text-gray-500 whitespace-nowrap">{o.matches.toLocaleString()} {o.matches === 1 ? 'match' : 'matches'}</span>
                        </div>
                        <span className="sr-only">{name} killed {o.opponent_name} {o.kills} times and died to them {o.deaths} times.</span>
                        <div className="grid grid-cols-[2.5rem_1fr_2.5rem] items-center gap-2 text-xs tabular-nums" aria-hidden>
                            <span className="text-right text-gray-400">{o.deaths.toLocaleString()}</span>
                            <div className="flex h-3">
                                <div className="w-1/2 flex justify-end pr-px"><div className="h-full rounded-l" style={{ width: width(o.deaths), backgroundColor: OPPONENT }} /></div>
                                <div className="w-px" style={{ backgroundColor: chart.axis }} />
                                <div className="w-1/2 pl-px"><div className="h-full rounded-r" style={{ width: width(o.kills), backgroundColor: PILOT }} /></div>
                            </div>
                            <span className="text-white font-bold">{o.kills.toLocaleString()}</span>
                        </div>
                        <div className="text-2xs text-gray-500">Damage {o.damage_dealt.toLocaleString()} dealt, {o.damage_taken.toLocaleString()} taken</div>
                    </li>
                ))}
            </ol>
        </div>
    );
};

export default RivalBars;
