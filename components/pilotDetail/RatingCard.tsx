import React, { lazy, Suspense } from 'react';
import { Info, TrendingUp } from 'lucide-react';
import { Loading, EmptyState, ErrorState } from '../States';
import Link from '../Link';
import { urlFor } from '../../server/lib/siteRoutes.js';
import { RATING, RATING_HINT, RATED_MATCH_TEXT } from '../../server/lib/gameParse.js';
import { PilotRating, RatingPoint } from '../../services/apiService';
import { useLoad } from '../../hooks/useLoad';
import DetailsTable from './DetailsTable';

// Recharts is a large chunk the rest of the pilot page does not need, so the
// chart renders behind its own Suspense (not the views' one). Its download
// starts with the pilot page instead of after the rating arrives. If it fails
// (after index.tsx's one reload), only the chart gives way.
const ChartUnavailable: React.FC<{ history: RatingPoint[] }> = () => (
    <ErrorState compact title="Chart unavailable" message="The days are in the table below." />
);
const chartModule = import('./RatingChart').catch(() => ({ default: ChartUnavailable }));
const RatingChart = lazy(() => chartModule);

// The days behind the chart, newest first; built only while open.
const RatingTable: React.FC<{ history: RatingPoint[] }> = ({ history }) => (
    <DetailsTable
        summary={`Rating by day (${history.length})`}
        headers={['Day', 'Rating', 'RD', 'Rated matches']}
        rows={[...history].reverse().map(p => ({ key: p.day, cells: [p.day, Math.round(p.rating), Math.round(p.rd), p.matches.toLocaleString()] }))}
    />
);

// Where the pilot stands in the power rankings, or why they are not in them
// (rankStatus in gameParse.js). The rankings page lists the top RATING.listed,
// so only those link to it.
const standing = (rating: PilotRating) => {
    if (rating.status === 'provisional') return `Provisional: ${rating.matches} of ${RATING.rankedAfter} rated matches`;
    if (rating.status === 'inactive' || rating.rank === null) return `Not ranked: no rated match in the last ${RATING.activeDays} days`;
    if (rating.rank > RATING.listed) return `#${rating.rank} in the power rankings`;
    return <Link to={urlFor('rankings')} className="text-brand hover:text-brand-hover underline">#{rating.rank} in the power rankings</Link>;
};

// The pilot page's Glicko-2 rating: the number, its RD, the standing and the
// history. PilotDetail loads it (useLoad), so the request does not wait for
// the page's own and survives a change of mode.
const RatingCard: React.FC<{ load: ReturnType<typeof useLoad<PilotRating>> }> = ({ load: { data: rating, failed, retry } }) => {
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
                <EmptyState compact title="No rated match yet" message={`A match counts once it has ${RATED_MATCH_TEXT}.`} />
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
