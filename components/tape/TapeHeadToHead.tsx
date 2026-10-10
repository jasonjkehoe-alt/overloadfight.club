import React from 'react';
import { Swords } from 'lucide-react';
import { EmptyState } from '../States';
import SplitBar, { CORNER } from './SplitBar';
import { TAPE_HINT, fightNightDay } from '../../server/lib/gameParse.js';
import { boutLead, modeLabel, noBouts, plural, rankedMatches, recordText } from '../../server/lib/matchResult.js';
import { Tape } from '../../services/apiService';

// The tape's head-to-head in its mode (S20): who leads and the record as a
// split bar, the kills and damage each way in the logged matches, the 1v1
// duel record, and the record on each map, all read from the red corner's
// side and drawn in the corners' colours.
const TapeHeadToHead: React.FC<{ tape: Tape }> = ({ tape }) => {
    const { pilots: [a, b], record, logged, duels, maps } = tape;
    const label = modeLabel(tape.mode);
    const lead = boutLead([a.name, b.name], record);
    if (!lead) {
        return <EmptyState compact icon={Swords} title={noBouts(tape.mode)} message={TAPE_HINT} />;
    }
    return (
        <div className="space-y-5">
            <p className="text-center text-lg sm:text-xl font-bold text-white [overflow-wrap:anywhere]">
                {lead} <span className="text-gray-400 font-normal text-sm">in {rankedMatches(record.matches, tape.mode)}</span>
            </p>
            <SplitBar label="Wins" a={record.wins} b={record.losses}
                words={`${a.name} won ${record.wins}, ${b.name} won ${record.losses}, ${plural(record.ties, 'tie', 'ties')}.`} />
            {record.ties > 0 && <p className="text-center text-xs text-gray-400 -mt-3">{plural(record.ties, 'tie', 'ties')}</p>}

            <div className="border-t border-line pt-4 space-y-4">
                <h3 className="text-xs uppercase tracking-wider text-gray-500 font-bold">
                    From the logs <span className="normal-case tracking-normal font-normal">({plural(logged.matches, 'logged match', 'logged matches')})</span>
                </h3>
                {logged.matches > 0 ? (
                    <>
                        <SplitBar label="Kills on the other" a={logged.kills} b={logged.deaths}
                            words={`${a.name} killed ${b.name} ${logged.kills} times; ${b.name} killed ${a.name} ${logged.deaths} times.`} />
                        <SplitBar label="Damage on the other" a={logged.damage_dealt} b={logged.damage_taken}
                            words={`${a.name} dealt ${b.name} ${logged.damage_dealt} damage; ${b.name} dealt ${a.name} ${logged.damage_taken}.`} />
                    </>
                ) : (
                    <p className="text-xs text-gray-400">The tracker kept no kill or damage log for their matches{label ? ` in ${label}` : ''}, so there are no kills or damage to compare.</p>
                )}
            </div>

            {duels && (
                <div className="border-t border-line pt-4">
                    <SplitBar label="1v1 duel wins" a={duels.wins} b={duels.losses}
                        words={`In 1v1 duels ${a.name} won ${duels.wins}, ${b.name} won ${duels.losses}, ${plural(duels.ties, 'tie', 'ties')}.`} />
                    <p className="text-center text-xs text-gray-400 mt-1">
                        {duels.ties > 0 && `${plural(duels.ties, 'tie', 'ties')}, `}last duel {fightNightDay(duels.last) ?? 'unknown'}
                    </p>
                </div>
            )}

            {maps.length > 0 && (
                <div className="border-t border-line pt-4">
                    <h3 className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-2">By map</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm font-mono">
                            <caption className="sr-only">Their ranked {label ? `${label} ` : ''}matches on each map: {a.name}'s wins, the ties and {b.name}'s wins</caption>
                            <thead className="text-gray-500 text-xs uppercase">
                                <tr>
                                    <th className="py-1.5 pr-2">Map</th>
                                    <th className="py-1.5 px-2 text-right">Matches</th>
                                    <th className="py-1.5 px-2 text-right max-w-[6rem] truncate" style={{ color: CORNER[0] }} title={`${a.name}'s wins`}>{a.name}</th>
                                    <th className="py-1.5 px-2 text-right">Ties</th>
                                    <th className="py-1.5 pl-2 text-right max-w-[6rem] truncate" style={{ color: CORNER[1] }} title={`${b.name}'s wins`}>{b.name}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {maps.map(m => (
                                    <tr key={m.map}>
                                        <td className="py-1.5 pr-2 text-gray-300 max-w-[10rem] truncate" title={`${m.map}: ${recordText(m)} from ${a.name}'s side`}>{m.map}</td>
                                        <td className="py-1.5 px-2 text-right text-gray-400">{m.matches.toLocaleString()}</td>
                                        <td className={`py-1.5 px-2 text-right ${m.wins > m.losses ? 'font-bold text-white' : 'text-gray-300'}`}>{m.wins}</td>
                                        <td className="py-1.5 px-2 text-right text-gray-400">{m.ties}</td>
                                        <td className={`py-1.5 pl-2 text-right ${m.losses > m.wins ? 'font-bold text-white' : 'text-gray-300'}`}>{m.losses}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            <p className="text-2xs text-gray-500">{TAPE_HINT}</p>
        </div>
    );
};

export default TapeHeadToHead;
