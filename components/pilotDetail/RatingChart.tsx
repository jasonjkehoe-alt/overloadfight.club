import React, { useMemo } from 'react';
import { ComposedChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import { RATING } from '../../server/lib/gameParse.js';
import { chart, chartTooltip, colors } from '../../designTokens.js';
import { RatingPoint } from '../../services/apiService';

const DAY_MS = 86400000;
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
        const low = Math.floor(Math.min(...points.map(p => p.band[0])) / 50) * 50;
        const high = Math.ceil(Math.max(...points.map(p => p.band[1])) / 50) * 50;
        return { points, domain, yDomain: [low, high], long: last - first > 120 * DAY_MS };
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
                    <YAxis width={40} domain={view.yDomain} allowDecimals={false} stroke={chart.axis} tick={{ fill: chart.label, fontSize: 10 }} />
                    <ReferenceLine y={RATING.start} stroke={chart.axis} strokeDasharray="4 4" />
                    <Tooltip content={<RatingTooltip />} cursor={{ stroke: chart.label }} />
                    <Area type="stepAfter" dataKey="band" stroke="none" fill={chart.series} fillOpacity={0.1} isAnimationActive={false} activeDot={false} />
                    {/* the line is an unfilled Area: Recharts' Line would add its own code to this page's chunk */}
                    <Area
                        type="stepAfter"
                        dataKey="rating"
                        stroke={chart.series}
                        strokeWidth={2}
                        fill="none"
                        dot={history.length === 1 ? { r: 4, fill: chart.series, stroke: colors.surface.card, strokeWidth: 2 } : false}
                        activeDot={{ r: 4, fill: chart.ink, stroke: colors.surface.card, strokeWidth: 2 }}
                        isAnimationActive={false}
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
};

export default RatingChart;
