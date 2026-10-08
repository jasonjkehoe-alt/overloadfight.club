import React, { lazy, Suspense, useState } from 'react';
import { Info, TrendingUp } from 'lucide-react';
import { Loading, EmptyState, ErrorState } from '../States';
import Link from '../Link';
import { urlFor } from '../../server/lib/siteRoutes.js';
import { RATING, RATING_HINT } from '../../server/lib/gameParse.js';
import { fetchPilotRating, PilotRating, RatingPoint } from '../../services/apiService';
import { useLoad } from '../../hooks/useLoad';

// Recharts is a large chunk the rest of the pilot page does not need, so the
// chart loads after the page, behind its own Suspense (not the views' one).
const RatingChart = lazy(() => import('./RatingChart'));

// The days behind the chart, newest first; built only while open.
const RatingTable: React.FC<{ history: RatingPoint[] }> = ({ history }) => {
    const [open, setOpen] = useState(false);
    return (
        <details className="mt-3 text-xs" onToggle={e => setOpen(e.currentTarget.open)}>
            <summary className="cursor-pointer text-gray-400 hover:text-white">Rating by day ({history.length})</summary>
            {open && (
                <div className="mt-2 max-h-64 overflow-auto border border-line rounded-control">
                    <table className="w-full text-left">
                        <thead className="bg-surface-raised text-gray-500 uppercase sticky top-0">
                            <tr>
                                <th className="px-3 py-1.5">Day</th>
                                <th className="px-3 py-1.5 text-right">Rating</th>
                                <th className="px-3 py-1.5 text-right">RD</th>
                                <th className="px-3 py-1.5 text-right">Rated matches</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-line text-gray-300">
                            {[...history].reverse().map(p => (
                                <tr key={p.day}>
                                    <td className="px-3 py-1.5">{p.day}</td>
                                    <td className="px-3 py-1.5 text-right">{Math.round(p.rating)}</td>
                                    <td className="px-3 py-1.5 text-right">{Math.round(p.rd)}</td>
                                    <td className="px-3 py-1.5 text-right">{p.matches.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </details>
    );
};

// Where the pilot stands in the power rankings, or why they are not in them.
// The rankings page lists the top RATING.listed, so only those link to it.
const standing = (rating: PilotRating) => {
    if (rating.rank !== null && rating.rank <= RATING.listed) return <Link to={urlFor('rankings')} className="text-brand hover:text-brand-hover underline">#{rating.rank} in the power rankings</Link>;
    if (rating.rank !== null) return `#${rating.rank} in the power rankings`;
    if (rating.matches < RATING.rankedAfter) return `Provisional: ${rating.matches} of ${RATING.rankedAfter} rated matches`;
    return `Not ranked: no rated match in the last ${RATING.activeDays} days`;
};

// The pilot page's Glicko-2 rating: the number, its RD, the standing and the history.
const RatingCard: React.FC<{ pilotName: string }> = ({ pilotName }) => {
    const { data: rating, failed, retry } = useLoad(() => fetchPilotRating(pilotName), [pilotName]);

    if (failed) return <ErrorState compact title="Rating unavailable" message="Could not load this pilot's rating." onRetry={retry} />;

    return (
        <div className="bg-surface-card border border-line rounded-card p-4 font-mono">
            <h3 className="text-gray-300 font-bold flex items-center gap-2 mb-3">
                <TrendingUp size={16} className="text-brand" aria-hidden /> Rating
                <span title={RATING_HINT} className="cursor-help"><Info size={12} className="text-gray-600" aria-label={RATING_HINT} /></span>
            </h3>
            {!rating ? (
                <Loading compact label="Loading rating..." />
            ) : rating.history.length === 0 || rating.rating === null || rating.rd === null ? (
                <EmptyState compact title="No rated match yet" message="A match counts once it has 2+ pilots, runs 60 seconds or more and has a result." />
            ) : (
                <>
                    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mb-3">
                        <span className="text-3xl font-bold text-white">{Math.round(rating.rating)}</span>
                        <span className="text-sm text-gray-400">± {Math.round(2 * rating.rd)} <span className="text-gray-600">(RD {Math.round(rating.rd)})</span></span>
                        <span className="text-xs text-gray-400">{rating.matches.toLocaleString()} rated matches</span>
                        <span className="text-xs text-gray-400">{standing(rating)}</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">At the end of each day played, with a band of ±2 RD. The dashed line is the {RATING.start} start.</p>
                    <Suspense fallback={<div className="h-56"><Loading compact label="Loading chart..." /></div>}>
                        <RatingChart history={rating.history} />
                    </Suspense>
                    <RatingTable history={rating.history} />
                </>
            )}
        </div>
    );
};

export default RatingCard;
