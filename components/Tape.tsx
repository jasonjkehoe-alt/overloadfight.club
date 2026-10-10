import React from 'react';
import { Swords, UserX } from 'lucide-react';
import { Loading, EmptyState, ErrorState } from './States';
import Link from './Link';
import TapeCareer from './tape/TapeCareer';
import TapeHeadToHead from './tape/TapeHeadToHead';
import { CORNER } from './tape/SplitBar';
import { useQueryParam } from '../hooks/useLocation';
import { useLoad } from '../hooks/useLoad';
import { fetchTape } from '../services/apiService';
import { urlFor } from '../server/lib/siteRoutes.js';
import { TAPE_MODES } from '../server/lib/gameParse.js';

const ALL = 'ALL';
const MODE_IDS = [ALL, ...TAPE_MODES.map(m => m.id)];
const CORNER_NAMES = ['Red corner', 'Blue corner'];
const leaderboardLink = <Link to={urlFor('pilots')} className="text-xs text-brand underline hover:text-brand-hover font-bold">Open the leaderboard</Link>;

// /tape/:a/:b (S20): two pilots' Tale of the Tape, from
// /api/pilot/:a/tape/:b. A is the red corner and B the blue, in the order the
// URL gives. ?mode= (all modes left out of the URL) filters the head-to-head;
// the careers stay all-mode.
const Tape: React.FC<{ a: string; b: string; onBack?: () => void }> = ({ a, b, onBack }) => {
    const [mode, setMode] = useQueryParam('mode', ALL, MODE_IDS);
    const { data, failed, retry } = useLoad(() => fetchTape(a, b, mode === ALL ? null : mode), [a, b, mode]);

    let body: React.ReactNode;
    if (failed) {
        body = <ErrorState title="Tape unavailable" message="Could not load the tale of the tape." onRetry={retry} />;
    } else if (!data) {
        body = <Loading label="Loading the tape..." />;
    } else if ('missing' in data) {
        const names = data.missing.join(' or ');
        body = <EmptyState card icon={UserX} title={`No pilot named ${names}`} message="No stored match has a pilot by that name. Check the spelling in the link." action={leaderboardLink} />;
    } else if ('same' in data) {
        body = <EmptyState card icon={Swords} title="Pick two different pilots" message={`A tape sets one pilot against another, and both of these are ${data.same}.`} action={<Link to={urlFor('pilot', data.same)} className="text-xs text-brand underline hover:text-brand-hover font-bold">Open {data.same}'s page</Link>} />;
    } else {
        // the modes they met in, and the one in the URL even when they did not
        const shown = TAPE_MODES.filter(m => m.id === mode || data.modes.some(x => x.mode === m.id));
        const matchesIn = (id: string) => data.modes.find(x => x.mode === id)?.matches ?? 0;
        body = (
            <>
                <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-2 sm:gap-4">
                    {data.pilots.map((p, i) => (
                        <div key={p.key} className={`bg-surface-card border-2 rounded-card p-3 sm:p-4 min-w-0 ${i ? 'order-last text-right' : 'order-first'}`} style={{ borderColor: CORNER[i] }}>
                            <div className="text-2xs uppercase tracking-wider font-bold" style={{ color: CORNER[i] }}>{CORNER_NAMES[i]}</div>
                            <Link to={urlFor('pilot', p.name)} className="block text-lg sm:text-2xl font-black text-white hover:underline truncate brand-font" title={`Open ${p.name}'s page`}>{p.name}</Link>
                        </div>
                    ))}
                    <div className="self-center text-xs font-black text-gray-500 uppercase" aria-hidden>vs</div>
                </div>

                <section className="bg-surface-card border border-line rounded-card p-4" aria-labelledby="tape-h2h-title">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                        <h2 id="tape-h2h-title" className="text-gray-500 font-bold text-xs uppercase tracking-widest">Head-to-head</h2>
                        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Mode">
                            {[{ id: ALL, label: 'All modes' }, ...shown].map(m => (
                                <button key={m.id} onClick={() => setMode(m.id)} aria-pressed={mode === m.id}
                                    className={`px-2.5 py-1 text-xs font-mono rounded-control border transition-colors ${mode === m.id ? 'bg-brand/10 border-brand/50 text-brand' : 'bg-surface-raised border-gray-700 text-gray-400 hover:text-white'}`}>
                                    {m.label}{m.id !== ALL && <span className="text-gray-500"> {matchesIn(m.id)}</span>}
                                </button>
                            ))}
                        </div>
                    </div>
                    <TapeHeadToHead tape={data} />
                </section>

                <section className="bg-surface-card border border-line rounded-card p-4" aria-labelledby="tape-career-title">
                    <h2 id="tape-career-title" className="text-gray-500 font-bold text-xs uppercase tracking-widest mb-2">
                        Careers <span className="normal-case tracking-normal font-normal">(every ranked match, all modes)</span>
                    </h2>
                    <TapeCareer pilots={data.pilots} />
                </section>
            </>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {onBack && (
                <button onClick={onBack} className="flex items-center text-gray-500 hover:text-brand transition-colors font-mono text-sm">
                    <span className="mr-1">&lt;</span> BACK
                </button>
            )}
            <div className="bg-gradient-to-r from-surface-raised to-black p-5 sm:p-8 rounded-card border border-line">
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 brand-font">Tale of the Tape</h1>
                <p className="text-gray-400 max-w-2xl text-sm font-mono [overflow-wrap:anywhere]">{a} against {b}: what they did to each other, then their careers side by side.</p>
            </div>
            {body}
        </div>
    );
};

export default Tape;
