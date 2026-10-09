import React from 'react';
import { Network } from 'lucide-react';
import RivalGrid, { GridBy } from './rivals/RivalGrid';
import RivalPairs from './rivals/RivalPairs';
import { Loading, EmptyState, ErrorState } from './States';
import Link from './Link';
import { useQueryParam } from '../hooks/useLocation';
import { useLoad } from '../hooks/useLoad';
import { fetchRivalNetwork } from '../services/apiService';
import { urlFor } from '../server/lib/siteRoutes.js';
import { RIVALS_HINT } from '../server/lib/gameParse.js';

const VIEWS: { id: GridBy; label: string }[] = [
    { id: 'kills', label: 'Kills' },
    { id: 'damage', label: 'Damage' }
];
const VIEW_IDS = VIEWS.map(v => v.id);

// /rivals (S17): the rivalry network as a killer × victim heat table (or
// dealer × target with ?by=damage; kills left out of the URL) and the pairs
// with the most kills exchanged, from /api/stats/rivalries (the stats
// worker's pilot_rivals table).
const Rivals: React.FC = () => {
    const [by, setBy] = useQueryParam('by', 'kills', VIEW_IDS);
    const { data, failed, retry } = useLoad(fetchRivalNetwork, []);

    let body: React.ReactNode;
    if (failed) {
        body = <ErrorState title="Rivalries unavailable" message="Could not load the rivalries." onRetry={retry} />;
    } else if (!data) {
        body = <Loading label="Loading rivalries..." />;
    } else if (data.pilots.length === 0) {
        body = <EmptyState card icon={Network} title="No logged kills yet" message={RIVALS_HINT} action={<Link to={urlFor('pilots')} className="text-xs text-brand underline hover:text-brand-hover font-bold">Open the leaderboard</Link>} />;
    } else {
        const top = data.pairs[0];
        body = (
            <>
                <section className="bg-surface-card border border-line rounded-card p-4" aria-labelledby="rival-grid-title">
                    <h2 id="rival-grid-title" className="text-gray-500 font-bold text-xs uppercase tracking-widest mb-2">
                        Who {by === 'kills' ? 'kills' : 'damages'} whom <span className="normal-case tracking-normal font-normal">(the {data.pilots.length} pilots with the most logged kills)</span>
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 mb-3" role="group" aria-label="Count">
                        {VIEWS.map(v => (
                            <button key={v.id} onClick={() => setBy(v.id)} aria-pressed={by === v.id}
                                className={`px-3 py-1.5 text-xs font-mono rounded-control border transition-colors ${by === v.id ? 'bg-brand/10 border-brand/50 text-brand' : 'bg-surface-raised border-gray-700 text-gray-400 hover:text-white'}`}>
                                {v.label}
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-gray-400 mb-3">
                        {data.totals.kills.toLocaleString()} logged kills and {data.totals.damage.toLocaleString()} damage between opponents.
                        {top && <> The most kills between two pilots: <span className="text-white font-bold">{top.name}</span> {top.kills.toLocaleString()}–{top.deaths.toLocaleString()} {top.opponent_name}.</>}
                    </p>
                    <RivalGrid data={data} by={by} />
                </section>
                <section className="bg-surface-card border border-line rounded-card overflow-hidden" aria-labelledby="rival-pairs-title">
                    <h2 id="rival-pairs-title" className="text-gray-500 font-bold text-xs uppercase tracking-widest p-4 pb-2">
                        Top rivalries <span className="normal-case tracking-normal font-normal">(most kills exchanged)</span>
                    </h2>
                    <RivalPairs pairs={data.pairs} />
                </section>
            </>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-surface-raised to-black p-5 sm:p-8 rounded-card border border-line">
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 brand-font">Rivalries</h1>
                <p className="text-gray-400 max-w-2xl text-sm font-mono">Who kills whom and who damages whom, from the kill and damage logs.</p>
                <p className="text-gray-500 max-w-2xl text-xs font-mono mt-2">{RIVALS_HINT}</p>
            </div>
            {body}
        </div>
    );
};

export default Rivals;
