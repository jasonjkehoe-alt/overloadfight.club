import React, { useEffect, useState } from 'react';
import { Info, Trophy } from 'lucide-react';
import { Loading, EmptyState, ErrorState } from './States';
import Link, { LinkCell } from './Link';
import { urlFor } from '../server/lib/siteRoutes.js';
import { RATING, RATING_HINT, RANKING_HINT } from '../server/lib/gameParse.js';
import { fetchPowerRankings, PowerRankings as Rankings } from '../services/apiService';

// Places gained or lost since a week earlier, NEW when not ranked then. The
// arrow and the word carry it, so the colour is never the only cue.
const Movement: React.FC<{ change: number | null }> = ({ change }) => {
    if (change === null) return <span className="text-2xs font-bold text-brand border border-brand/50 rounded-control px-1.5 py-0.5">NEW</span>;
    if (change === 0) return <span className="text-gray-600" aria-label="No change">–</span>;
    const up = change > 0;
    return (
        <span className={`font-bold ${up ? 'text-emerald-400' : 'text-red-400'}`} aria-label={`${up ? 'Up' : 'Down'} ${Math.abs(change)}`}>
            {up ? '▲' : '▼'}{Math.abs(change)}
        </span>
    );
};

// The top pilots by Glicko-2 rating today, with each one's movement over the
// last week. The ratings come from the stats refresh; this page only reads them.
const PowerRankings: React.FC = () => {
    const [rankings, setRankings] = useState<Rankings | null>(null);
    const [failed, setFailed] = useState(false);
    const [retries, setRetries] = useState(0);

    useEffect(() => {
        let current = true;
        setFailed(false);
        setRankings(null);
        fetchPowerRankings().then(data => {
            if (!current) return;
            setRankings(data);
            setFailed(data === null);
        });
        return () => { current = false; };
    }, [retries]);

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-surface-raised to-black p-5 sm:p-8 rounded-card border border-line">
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 brand-font">Power Rankings</h1>
                <p className="text-gray-400 max-w-2xl text-sm font-mono">
                    The top {RATING.listed} pilots by Glicko-2 rating{rankings ? <>, {rankings.day}, with movement since {rankings.since}</> : null}.
                </p>
                <p className="text-gray-500 max-w-2xl text-xs font-mono mt-2">{RANKING_HINT}</p>
            </div>

            {failed ? (
                <ErrorState title="Rankings unavailable" message="Could not load the power rankings." onRetry={() => setRetries(n => n + 1)} />
            ) : !rankings ? (
                <Loading label="Loading rankings..." />
            ) : rankings.pilots.length === 0 ? (
                <EmptyState
                    card
                    icon={Trophy}
                    title="No ranked pilots yet"
                    message={RANKING_HINT}
                    action={<Link to={urlFor('pilots')} className="text-xs text-brand underline hover:text-brand-hover font-bold">Open the leaderboard</Link>}
                />
            ) : (
                <div className="bg-surface-card border border-line rounded-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm font-mono">
                            <thead className="bg-surface-raised text-gray-500 text-xs uppercase">
                                <tr>
                                    <th className="p-3 text-center w-10">#</th>
                                    <th className="p-3 text-center w-14">Move</th>
                                    <th className="p-3">Pilot</th>
                                    <th className="p-3 text-right" title={RATING_HINT}>
                                        <span className="inline-flex items-center gap-1">Rating <Info size={11} className="text-gray-500" aria-hidden /></span>
                                    </th>
                                    <th className="p-3 text-right hidden sm:table-cell" title="Rating Deviation: the rating's uncertainty. About 95% of the time the true rating is within 2 RD.">RD</th>
                                    <th className="p-3 text-right">Matches</th>
                                    <th className="p-3 text-right hidden sm:table-cell">Last match</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {rankings.pilots.map(pilot => {
                                    const url = urlFor('pilot', pilot.name);
                                    return (
                                        <tr key={pilot.pilot} className="hover:bg-surface-raised transition-colors">
                                            <LinkCell to={url} className="p-3 text-center text-gray-400 font-bold">{pilot.rank}</LinkCell>
                                            <LinkCell to={url} className="p-3 text-center text-xs"><Movement change={pilot.change} /></LinkCell>
                                            <LinkCell main to={url} className="p-3 font-bold text-white hover:text-brand">{pilot.name}</LinkCell>
                                            <LinkCell to={url} className="p-3 text-right font-bold text-brand">{Math.round(pilot.rating)}</LinkCell>
                                            <LinkCell to={url} cellClassName="hidden sm:table-cell" className="p-3 text-right text-gray-400">{Math.round(pilot.rd)}</LinkCell>
                                            <LinkCell to={url} className="p-3 text-right text-gray-300">{pilot.matches.toLocaleString()}</LinkCell>
                                            <LinkCell to={url} cellClassName="hidden sm:table-cell" className="p-3 text-right text-gray-500 text-xs">{new Date(pilot.last_played).toLocaleDateString()}</LinkCell>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-4 py-3 border-t border-line flex flex-wrap justify-between gap-2 text-xs font-mono text-gray-500">
                        <span>{rankings.total.toLocaleString()} pilot{rankings.total === 1 ? '' : 's'} ranked</span>
                        <Link to={urlFor('pilots')} className="text-brand hover:text-brand-hover underline">Full leaderboard</Link>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PowerRankings;
