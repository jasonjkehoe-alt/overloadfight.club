import React, { useMemo } from 'react';
import { GameData } from '../../types';
import Link from '../Link';
import { teamColor } from './teamColor';
import { urlFor } from '../../server/lib/siteRoutes.js';
import { winnerOf, verdictOf, leadChanges, firstBloodOf, killScored, VERDICT_LABEL, VERDICT_HINT } from '../../server/lib/gameParse.js';
import { clock, resultLine } from '../../server/lib/matchResult.js';

const PODIUM = [['1st', 'text-yellow-400'], ['2nd', 'text-gray-300'], ['3rd', 'text-amber-600']];

// The result panel: winner, score or podium and result line (S7), with the
// verdict, the lead changes and first blood under it.
const FightCard: React.FC<{ game: GameData }> = ({ game }) => {
    const result = useMemo(() => winnerOf(game), [game]);
    const verdict = verdictOf(result);
    const hasLog = Boolean(game.kills?.length);
    const changes = useMemo(() => (hasLog && killScored(game) ? leadChanges(game).length : null), [game, hasLog]);
    const firstBlood = useMemo(() => firstBloodOf(game), [game]);

    return (
        <div className="bg-surface-card border border-line rounded-card p-5 mb-6 font-mono">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">
                        {result.winners.length === 1 ? 'Winner' : 'Result'}
                    </div>
                    {result.winners.length === 1 && (
                        <div className={`text-2xl font-bold brand-font ${result.team ? teamColor(result.ranking[0].side) : 'text-brand'}`}>
                            {result.ranking[0].name}
                        </div>
                    )}
                    <div className="text-sm text-gray-300 mt-1">{resultLine(result)}</div>
                </div>
                {result.winners.length > 0 && (
                    result.team ? (
                        <div className="flex items-center gap-3 text-3xl font-bold">
                            {result.ranking.map((r, i) => (
                                <React.Fragment key={r.side}>
                                    {i > 0 && <span className="text-gray-600 text-xl">–</span>}
                                    <span className="flex flex-col items-center">
                                        <span className={teamColor(r.side)}>{r.score}</span>
                                        <span className="text-2xs text-gray-500 tracking-widest">{r.name}</span>
                                    </span>
                                </React.Fragment>
                            ))}
                        </div>
                    ) : (
                        <ol className="flex gap-4 text-sm">
                            {result.ranking.slice(0, 3).map((r, i) => (
                                <li key={r.side} className="flex flex-col items-center min-w-[72px]">
                                    <span className={`text-xs font-bold ${PODIUM[i][1]}`}>{PODIUM[i][0]}</span>
                                    <Link
                                        to={urlFor('pilot', r.name)}
                                        className="text-white font-bold hover:text-brand hover:underline truncate max-w-[140px]"
                                    >
                                        {r.name}
                                    </Link>
                                    <span className="text-gray-400 text-xs">{r.score}</span>
                                </li>
                            ))}
                        </ol>
                    )
                )}
            </div>

            {(verdict || changes !== null || firstBlood) && (
                <dl className="mt-4 pt-4 border-t border-line flex flex-wrap gap-x-8 gap-y-3 text-sm">
                    {verdict && (
                        <div>
                            <dt className="text-2xs text-gray-500 uppercase tracking-widest">Verdict</dt>
                            <dd className="text-white font-bold uppercase cursor-help" title={VERDICT_HINT}>{VERDICT_LABEL[verdict]}</dd>
                        </div>
                    )}
                    {changes !== null && (
                        <div>
                            <dt className="text-2xs text-gray-500 uppercase tracking-widest">Lead changes</dt>
                            <dd className="text-white font-bold">{changes}</dd>
                        </div>
                    )}
                    {firstBlood && (
                        <div>
                            <dt className="text-2xs text-gray-500 uppercase tracking-widest">First blood</dt>
                            <dd className="text-gray-300">
                                <Link to={urlFor('pilot', firstBlood.attacker)} className="text-white font-bold hover:text-brand hover:underline">
                                    {firstBlood.attacker}
                                </Link>
                                {' '}({firstBlood.weapon || 'unknown weapon'}, {clock(Number(firstBlood.time) || 0)})
                            </dd>
                        </div>
                    )}
                </dl>
            )}
        </div>
    );
};

export default FightCard;
