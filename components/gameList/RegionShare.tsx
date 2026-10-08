import React, { memo, useEffect, useRef } from 'react';
import { Globe2 } from 'lucide-react';
import { Loading, EmptyState, ErrorState } from '../States';
import DetailsTable from '../DetailsTable';
import { chart } from '../../designTokens.js';
import { REGIONS, regionLabel } from '../../server/lib/serverRegions.js';
import { monthLabel, percent } from '../../server/lib/matchResult.js';
import { fetchRegionShare, RegionShare as RegionShareData } from '../../services/apiService';
import { useLoad } from '../../hooks/useLoad';

const COLOR = chart.region as Record<string, string>;
const H = 120; // the columns' height in px
const W = 10; // a column's width
const GAP = 2; // between columns and between stacked segments
const regions = REGIONS.map(r => r.id);
// A month's regions with a match, largest first, as "Europe 54%, ..."
const shares = (m: RegionShareData['months'][number]) =>
    regions.filter(r => m.counts[r]).sort((a, b) => m.counts[b] - m.counts[a]).map(r => `${regionLabel(r)} ${percent(m.counts[r] / m.total)}`);

// The dashboard's regional share (S15): each month's stored matches split by
// the region of the server they were played on, as 100% stacked columns in
// hand-drawn SVG (the dashboard loads no Recharts). A title per month on
// hover, a legend, and the months as a table for the keyboard. Below the
// history's width the chart scrolls and opens on the latest month.
const RegionShare: React.FC = () => {
    const { data, failed, retry } = useLoad(fetchRegionShare, []);
    const scroller = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (scroller.current) scroller.current.scrollLeft = scroller.current.scrollWidth;
    }, [data]);

    let body: React.ReactNode;
    if (failed) {
        body = <ErrorState compact title="Region share unavailable" message="Could not load where matches were played." onRetry={retry} />;
    } else if (!data) {
        body = <Loading compact label="Loading regions..." />;
    } else if (data.months.every(m => m.total === 0)) {
        body = <EmptyState compact icon={Globe2} title="No matches stored yet" />;
    } else {
        const { months } = data;
        const shown = regions.filter(r => months.some(m => m.counts[r]));
        const latest = [...months].reverse().find(m => m.total > 0)!;
        const total = months.reduce((a, m) => a + m.total, 0);
        const width = months.length * (W + GAP);
        body = (
            <>
                <p className="text-xs text-gray-400 mb-3">
                    <span className="text-white font-bold">{monthLabel(latest.month)}</span>: {shares(latest).join(', ')}.{' '}
                    {total.toLocaleString()} matches from {monthLabel(months[0].month)} on.
                </p>
                <div ref={scroller} className="overflow-x-auto" tabIndex={0} aria-label="Matches by region, by month">
                    <svg width={width} height={H + 16} role="img" className="block"
                        aria-label={`Share of matches by server region per month, ${monthLabel(months[0].month)} to ${monthLabel(months.at(-1)!.month)}. ${monthLabel(latest.month)}: ${shares(latest).join(', ')}.`}>
                        {months.map((m, i) => {
                            const x = i * (W + GAP);
                            let y = H;
                            return (
                                <g key={m.month}>
                                    <title>{m.total ? `${monthLabel(m.month)}, ${m.total.toLocaleString()} matches: ${shares(m).join(', ')}` : `${monthLabel(m.month)}: no matches`}</title>
                                    {/* hit area the full height of the column */}
                                    <rect x={x} y={0} width={W + GAP} height={H} fill="transparent" />
                                    {m.total === 0 && <rect x={x} y={H - 1} width={W} height={1} fill={chart.axis} />}
                                    {regions.map(r => {
                                        const n = m.counts[r];
                                        if (!n) return null;
                                        const h = (n / m.total) * H;
                                        y -= h;
                                        // a 2px gap above each segment, unless that would hide it
                                        return <rect key={r} x={x} y={y} width={W} height={h > GAP + 1 ? h - GAP : h} fill={COLOR[r]} />;
                                    })}
                                    {m.month.endsWith('-01') && (
                                        <text x={x} y={H + 12} fontSize={10} fill={chart.label}>{m.month.slice(0, 4)}</text>
                                    )}
                                </g>
                            );
                        })}
                    </svg>
                </div>
                <ul className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-2xs text-gray-400" aria-label="Regions">
                    {shown.map(r => (
                        <li key={r} className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: COLOR[r] }} aria-hidden />
                            {regionLabel(r)}
                        </li>
                    ))}
                </ul>
                <DetailsTable
                    summary="Matches by region, by month"
                    headers={['Month', ...shown.map(regionLabel), 'Matches']}
                    rows={months.filter(m => m.total > 0).reverse().map(m => ({
                        key: m.month,
                        cells: [monthLabel(m.month), ...shown.map(r => (m.counts[r] ? percent(m.counts[r] / m.total) : '–')), m.total.toLocaleString()]
                    }))}
                />
                <p className="mt-2 text-2xs text-gray-500">
                    A server's region comes from the place its name or notes give; Unknown when they give none.
                </p>
            </>
        );
    }

    return (
        <section className="bg-surface-card border border-line rounded-card p-4" aria-labelledby="region-share-title">
            <h3 id="region-share-title" className="text-gray-500 font-bold text-xs uppercase tracking-widest mb-2">
                Matches by region <span className="normal-case tracking-normal font-normal">(share per month)</span>
            </h3>
            {body}
        </section>
    );
};

// memo: GameList re-renders on every server-browser poll
export default memo(RegionShare);
