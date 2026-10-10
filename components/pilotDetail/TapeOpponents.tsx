import React, { memo } from 'react';
import { Swords } from 'lucide-react';
import { Loading, EmptyState, ErrorState } from '../States';
import Link from '../Link';
import { urlFor } from '../../server/lib/siteRoutes.js';
import { TAPE_HINT } from '../../server/lib/gameParse.js';
import { plural, recordText } from '../../server/lib/matchResult.js';
import { PilotOpponent } from '../../services/apiService';

// "Tale of the Tape" on the pilot page (S20): the opponents the pilot met in
// the most ranked matches, from /api/pilot/:name/opponents, each a link to
// the pair's tape at /tape/<pilot>/<opponent>. All time, all modes.
const TapeOpponents: React.FC<{ name: string; load: { data: PilotOpponent[] | null; failed: boolean; retry: () => void } }> = ({ name, load: { data, failed, retry } }) => {
    let body: React.ReactNode;
    if (failed) {
        body = <ErrorState compact title="Opponents unavailable" message="Could not load this pilot's opponents." onRetry={retry} />;
    } else if (!data) {
        body = <Loading compact label="Loading opponents..." />;
    } else if (data.length === 0) {
        body = <EmptyState compact icon={Swords} title="No opponents yet" message={`No ranked match against another pilot yet. ${TAPE_HINT}`} />;
    } else {
        body = (
            <>
                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {data.map(o => (
                        <li key={o.opponent}>
                            <Link to={urlFor('tape', name, o.name)} className="block h-full bg-surface-raised border border-line hover:border-brand/60 active:border-brand rounded-card p-3 transition-colors group"
                                aria-label={`Tale of the tape: ${name} against ${o.name}, ${plural(o.matches, 'match', 'matches')}, ${o.wins} wins, ${o.losses} losses, ${plural(o.ties, 'tie', 'ties')}`}>
                                <div className="flex items-baseline justify-between gap-2">
                                    <span className="font-bold text-white group-hover:text-brand truncate">{o.name}</span>
                                    <span className="text-2xs text-gray-400 whitespace-nowrap">{plural(o.matches, 'match', 'matches')}</span>
                                </div>
                                <div className="mt-2 flex items-baseline justify-between gap-2 text-xs font-mono">
                                    <span className="text-gray-500">W–L–T</span>
                                    <span className={`font-bold ${o.wins > o.losses ? 'text-brand' : 'text-gray-300'}`}>{recordText(o)}</span>
                                </div>
                                {o.logged > 0 && (
                                    <div className="flex items-baseline justify-between gap-2 text-xs font-mono">
                                        <span className="text-gray-500">Kills, {plural(o.logged, 'logged match', 'logged matches')}</span>
                                        <span className="text-gray-300">{o.kills}–{o.deaths}</span>
                                    </div>
                                )}
                            </Link>
                        </li>
                    ))}
                </ul>
                <p className="text-2xs text-gray-500 mt-3">All time, all modes. {TAPE_HINT}</p>
            </>
        );
    }
    return (
        <section aria-labelledby="tape-opponents-title">
            <h3 id="tape-opponents-title" className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-4 border-b border-line pb-2 flex items-center gap-2">
                <Swords size={16} className="text-brand" aria-hidden /> Tale of the Tape <span className="normal-case tracking-normal font-normal">(opponents met most; open one to compare)</span>
            </h3>
            {body}
        </section>
    );
};

// memo: the pilot page re-renders on every mode change
export default memo(TapeOpponents);
