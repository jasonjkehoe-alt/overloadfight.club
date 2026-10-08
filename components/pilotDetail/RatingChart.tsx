import React, { useMemo } from 'react';
import { ComposedChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import { DAY_MS, RATING } from '../../server/lib/gameParse.js';
import { chart, chartTooltip, colors } from '../../designTokens.js';
import { RatingPoint } from '../../services/apiService';

// up to this many days played, each one gets a dot
const MAX_DOTS = 30;
// each day's point sits at noon UTC, which is that date in every US time zone
const timeOf = (day: string) => Date.parse(`${day}T12:00:00Z`);
const shortDate = (t: number, long: boolean) =>
    new Date(t).toLocaleDateString(undefined, long ? { month: 'short', year: 'numeric', timeZone: 'UTC' } : { month: 'short', day: 'numeric', timeZone: 'UTC' });

type Point = RatingPoint & { t: number; band: [number, number] };

function RatingTooltip({ active, payload }: { active?: boolean; payload?: { payload: Point }[] }) {
    const point = active && payload?.[0]?.payload;
    if (!point) return null;
    return (
        <div style={{ ...chartTooltip, color: chart.ink }} className="px-3 py-2 font-mono text-xs space-y-1">
            <div style={{ color: chart.text }}>{point.day}</div>
            <div className="text-sm font-bold">{Math.round(point.rating)} <span style={{ color: chart.text }} className="font-normal">± {Math.round(2 * point.rd)}</span></div>
            <div style={{ color: chart.text }}>{point.matches.toLocaleString()} rated matches</div>
        </div>
    );
}

// The line of a pilot's rating at the end of each day played, in a band of
// ±2 RD, with the 1500 start marked.
const RatingChart: React.FC<{ history: RatingPoint[] }> = ({ history }) => {
    const view = useMemo(() => {
        const points: Point[] = history.map(p => ({ ...p, t: timeOf(p.day), band: [p.rating - 2 * p.rd, p.rating + 2 * p.rd] }));
        const first = points[0].t;
        const last = points[points.length - 1].t;
        // a single day gets a day either side, so its point is not on the edge
        const domain = first === last ? [first - DAY_MS, last + DAY_MS] : [first, last];
        // ticks on a round step, so the axis does not end on odd values, and
        // the 1500 start always inside, so its dashed line is always drawn
        const min = Math.min(RATING.start, ...points.map(p => p.band[0]));
        const max = Math.max(RATING.start, ...points.map(p => p.band[1]));
        const step = max - min <= 400 ? 100 : max - min <= 1000 ? 200 : 500;
        const low = Math.floor(min / step) * step;
        const high = Math.ceil(max / step) * step;
        const yTicks = Array.from({ length: (high - low) / step + 1 }, (_, i) => low + i * step);
        return { points, domain, yTicks, long: last - first > 120 * DAY_MS };
    }, [history]);
    const first = history[0];
    const last = history[history.length - 1];

    return (
        <div
            className="h-56"
            role="img"
            aria-label={`Rating from ${Math.round(first.rating)} on ${first.day} to ${Math.round(last.rating)} on ${last.day}, over ${history.length} days played.`}
        >
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={view.points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid stroke={chart.grid} vertical={false} />
                    <XAxis
                        dataKey="t"
                        type="number"
                        scale="time"
                        domain={view.domain}
                        tickFormatter={t => shortDate(t, view.long)}
                        minTickGap={32}
                        stroke={chart.axis}
                        tick={{ fill: chart.label, fontSize: 10 }}
                    />
                    <YAxis width={40} domain={[view.yTicks[0], view.yTicks[view.yTicks.length - 1]]} ticks={view.yTicks} stroke={chart.axis} tick={{ fill: chart.label, fontSize: 10 }} />
                    <ReferenceLine y={RATING.start} stroke={chart.axis} strokeDasharray="4 4" />
                    <Tooltip content={<RatingTooltip />} cursor={{ stroke: chart.label }} />
                    <Area type="linear" dataKey="band" stroke="none" fill={chart.series} fillOpacity={0.1} isAnimationActive={false} activeDot={false} />
                    {/* the line is an unfilled Area: Recharts' Line would add its own code to this page's chunk */}
                    <Area
                        type="linear"
                        dataKey="rating"
                        stroke={chart.series}
                        strokeWidth={2}
                        fill="none"
                        dot={history.length <= MAX_DOTS ? { r: 4, fill: chart.series, stroke: colors.surface.card, strokeWidth: 2 } : false}
                        activeDot={{ r: 4, fill: chart.ink, stroke: colors.surface.card, strokeWidth: 2 }}
                        isAnimationActive={false}
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
};

export default RatingChart;
