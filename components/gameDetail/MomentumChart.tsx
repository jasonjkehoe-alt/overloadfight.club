import React, { useId, useMemo } from 'react';
import { ComposedChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ReferenceDot, ResponsiveContainer } from 'recharts';
import { GameData, KillEvent } from '../../types';
import { EmptyState } from '../States';
import { momentumOf, leadChanges, hasKillLog, killScored, weaponFamily, WEAPON_FAMILIES } from '../../server/lib/gameParse.js';
import { clock } from '../../server/lib/matchResult.js';
import { chart, chartTooltip, colors } from '../../designTokens.js';

interface MomentumChartProps {
    game: GameData;
    // seconds the x axis spans, from replayLengthOf()
    end: number;
    // the scrubber's second, or null at the end
    time: number | null;
    onSeek: (seconds: number) => void;
}

// The plot's insets inside its box: the Y axis on the left, a gap on the
// right, the chart's top margin and Recharts' default X axis height. The
// weapon strips and the scrubber's cursor line up with the plot through them.
const AXIS_WIDTH = 32;
const RIGHT_GAP = 8;
const TOP_GAP = 8;
const X_AXIS_HEIGHT = 30;

type Point = ReturnType<typeof momentumOf>['points'][number];

const signed = (n: number) => (n > 0 ? `+${n}` : String(n));
const killText = (kill: KillEvent) => `${kill.attacker || 'Unknown'} → ${kill.defender || 'Unknown'}, ${kill.weapon || 'unknown weapon'}`;

function MomentumTooltip({ active, payload, winner }: { active?: boolean; payload?: { payload: Point }[]; winner: string }) {
    const point = active && payload?.[0]?.payload;
    if (!point) return null;
    const { kill } = point;
    return (
        <div style={{ ...chartTooltip, color: chart.ink }} className="px-3 py-2 font-mono text-xs space-y-1">
            <div style={{ color: chart.text }}>{clock(point.t)}</div>
            <div className="text-sm font-bold">{signed(point.margin)} <span style={{ color: chart.text }} className="font-normal">{winner}</span></div>
            <div style={{ color: chart.text }}>{point.scores.map(s => `${s.name} ${s.score}`).join(' · ')}</div>
            {kill && (
                <div className="flex items-center gap-2">
                    <span className="inline-block w-3 h-0.5" style={{ backgroundColor: chart.weapon[weaponFamily(kill.weapon)] }} />
                    <span>{killText(kill)}</span>
                </div>
            )}
        </div>
    );
}

// The eventual winner's margin after every kill, with lead changes marked,
// and below it every kill on a strip per weapon family.
const MomentumChart: React.FC<MomentumChartProps> = ({ game, end, time, onSeek }) => {
    const gradientId = useId().replace(/:/g, '');
    const momentum = useMemo(() => momentumOf(game), [game]);

    // Everything but the scrubber's cursor depends on the match alone, so a
    // slider move redraws one line instead of the chart and every kill mark.
    const view = useMemo(() => {
        if (!momentum) return null;
        const { points } = momentum;
        // a match whose length is unknown and whose kills carry no time spans 0 s
        const span = Math.max(end, 1);
        const share = (t: number) => Math.min(1, Math.max(0, t / span));
        const at = (t: number) => `${share(t) * 100}%`;
        const margins = points.map(p => p.margin);
        const top = Math.max(...margins);
        const bottom = Math.min(...margins);
        // where zero sits in the gradient, from the top of the plotted range
        const zero = top <= 0 ? 0 : bottom >= 0 ? 1 : top / (top - bottom);

        // Team games colour each side by its team; FFA has the winner against the field.
        const other = momentum.team && momentum.runnerUp && points[0].scores.length === 2 ? momentum.runnerUp : null;
        const teamColors: Record<string, string> = chart.team;
        const winnerColor = (momentum.team && teamColors[momentum.side]) || chart.ffa.winner;
        const otherColor = (other && teamColors[other.side]) || chart.ffa.field;
        const otherName = momentum.team ? (other?.name ?? 'the other teams') : 'the next best pilot';
        // A flat line has no height, and SVG does not paint a gradient over an empty box.
        const lineColor = top === bottom ? (top < 0 ? otherColor : winnerColor) : `url(#${gradientId}-line)`;

        // the last margin at each time, for the lead-change markers
        const marginAt = new Map(points.map(p => [p.t, p.margin]));
        const killsByFamily = new Map<string, Point[]>(WEAPON_FAMILIES.map(f => [f.id, []]));
        for (const p of points) if (p.kill) killsByFamily.get(weaponFamily(p.kill.weapon))!.push(p);
        const changes = leadChanges(game) ?? [];

        return {
            at,
            share,
            changes: changes.length,
            legend: (
                <ul className="flex flex-wrap gap-x-4 gap-y-1 text-2xs text-gray-400 mb-2">
                    <li className="flex items-center gap-1.5"><span className="inline-block w-3 h-0.5" style={{ backgroundColor: winnerColor }} />{momentum.name} ahead</li>
                    <li className="flex items-center gap-1.5"><span className="inline-block w-3 h-0.5" style={{ backgroundColor: otherColor }} />{otherName} ahead</li>
                    <li className="flex items-center gap-1.5"><span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: chart.ink }} />Lead change</li>
                </ul>
            ),
            subtitle: `${momentum.name}'s lead over ${otherName} after every kill.`,
            chart: (
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                        data={[...points, { ...points[points.length - 1], t: span, kill: null }]}
                        margin={{ top: TOP_GAP, right: RIGHT_GAP, bottom: 0, left: 0 }}
                        onClick={(state: { activeLabel?: string | number } | null) => {
                            const t = Number(state?.activeLabel);
                            if (Number.isFinite(t)) onSeek(t);
                        }}
                        className="cursor-pointer"
                    >
                        <defs>
                            <linearGradient id={`${gradientId}-line`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset={zero} stopColor={winnerColor} />
                                <stop offset={zero} stopColor={otherColor} />
                            </linearGradient>
                            <linearGradient id={`${gradientId}-fill`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset={zero} stopColor={winnerColor} stopOpacity={0.12} />
                                <stop offset={zero} stopColor={otherColor} stopOpacity={0.12} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid stroke={chart.grid} vertical={false} />
                        <XAxis
                            dataKey="t"
                            type="number"
                            domain={[0, span]}
                            ticks={Array.from({ length: Math.floor(span / 60) + 1 }, (_, i) => i * 60)}
                            minTickGap={24}
                            tickFormatter={clock}
                            height={X_AXIS_HEIGHT}
                            stroke={chart.axis}
                            tick={{ fill: chart.label, fontSize: 10 }}
                        />
                        <YAxis width={AXIS_WIDTH} allowDecimals={false} stroke={chart.axis} tick={{ fill: chart.label, fontSize: 10 }} tickFormatter={signed} />
                        <ReferenceLine y={0} stroke={chart.axis} />
                        <Tooltip content={<MomentumTooltip winner={momentum.name} />} cursor={{ stroke: chart.label }} />
                        <Area
                            type="stepAfter"
                            dataKey="margin"
                            stroke={lineColor}
                            strokeWidth={2}
                            fill={`url(#${gradientId}-fill)`}
                            isAnimationActive={false}
                            activeDot={{ r: 4, fill: chart.ink, stroke: colors.surface.card, strokeWidth: 2 }}
                        />
                        {changes.map(c => (
                            <ReferenceDot key={c.t} x={c.t} y={marginAt.get(c.t) ?? 0} r={4} fill={chart.ink} stroke={colors.surface.card} strokeWidth={2} />
                        ))}
                    </ComposedChart>
                </ResponsiveContainer>
            ),
            strips: WEAPON_FAMILIES.filter(f => f.id !== 'other' || killsByFamily.get('other')!.length > 0).map(f => {
                const kills = killsByFamily.get(f.id)!;
                const color = chart.weapon[f.id];
                return (
                    <div key={f.id}>
                        <div className="flex items-center gap-1.5 text-2xs text-gray-400">
                            <span className="inline-block w-2 h-2 rounded-sm" style={{ backgroundColor: color }} />
                            <span>{f.label}</span>
                            <span className="text-gray-600">{kills.length}</span>
                        </div>
                        <div className="relative h-2.5 bg-surface-raised rounded-control">
                            {kills.map((p, i) => (
                                <span
                                    key={i}
                                    className="absolute top-0 bottom-0 w-0.5 -ml-px"
                                    style={{ left: at(p.t), backgroundColor: color }}
                                    title={`${clock(p.t)} ${killText(p.kill)}`}
                                />
                            ))}
                        </div>
                    </div>
                );
            }),
        };
    }, [momentum, game, end, gradientId, onSeek]);

    if (!view) {
        const otherMode = hasKillLog(game) && !killScored(game);
        return (
            <EmptyState
                card
                compact
                title={otherMode ? 'No momentum chart for this mode' : 'No kill log for this match'}
                message={otherMode
                    ? 'Momentum follows the score, and the kill log does not carry captures or goals.'
                    : 'The tracker kept no kill log for this match, so there is nothing to replay.'}
            />
        );
    }

    return (
        <div className="bg-surface-card border border-line rounded-card p-4 font-mono">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-1">
                <h3 className="text-gray-300 font-bold">Momentum</h3>
                <span className="text-xs text-gray-400">{view.changes} lead change{view.changes === 1 ? '' : 's'}</span>
            </div>
            <p className="text-xs text-gray-500 mb-3">
                {view.subtitle} Click the chart to replay the scoreboard to that kill.
            </p>
            {view.legend}

            <div className="h-56 relative">
                {view.chart}
                {time !== null && (
                    <span
                        className="absolute w-px bg-brand pointer-events-none"
                        style={{ top: TOP_GAP, bottom: X_AXIS_HEIGHT, left: `calc(${AXIS_WIDTH}px + (100% - ${AXIS_WIDTH + RIGHT_GAP}px) * ${view.share(time)})` }}
                    />
                )}
            </div>

            <div className="mt-4" style={{ paddingLeft: AXIS_WIDTH, paddingRight: RIGHT_GAP }}>
                <div className="text-2xs text-gray-500 uppercase tracking-widest mb-1.5">Kills by weapon</div>
                <div className="relative space-y-1.5">
                    {view.strips}
                    {time !== null && <span className="absolute top-0 bottom-0 w-px bg-brand pointer-events-none" style={{ left: view.at(time) }} />}
                </div>
            </div>
        </div>
    );
};

export default MomentumChart;
