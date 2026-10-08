import React, { useId, useMemo } from 'react';
import { ComposedChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ReferenceDot, ResponsiveContainer } from 'recharts';
import { GameData } from '../../types';
import { EmptyState } from '../States';
import { momentumOf, leadChanges, killScored, weaponFamily, winnerOf, WEAPON_FAMILIES } from '../../server/lib/gameParse.js';
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

const FAMILIES = [...WEAPON_FAMILIES, { id: 'other', label: 'Other', weapons: [] }];
// Y axis width; the weapon strip below is inset by the same amount so its
// times line up with the chart's.
const AXIS_WIDTH = 32;
const RIGHT_GAP = 8;

type Point = ReturnType<typeof momentumOf>['points'][number];

const signed = (n: number) => (n > 0 ? `+${n}` : String(n));

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
                    <span>{kill.attacker || 'Unknown'} → {kill.defender}, {kill.weapon || 'unknown weapon'}</span>
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
    const changes = useMemo(() => leadChanges(game), [game]);

    if (!momentum) {
        const hasLog = Boolean(game.kills?.length);
        return (
            <EmptyState
                card
                compact
                title={hasLog && !killScored(game) ? 'No momentum chart for this mode' : 'No kill log for this match'}
                message={hasLog && !killScored(game)
                    ? 'Momentum follows the score, and the kill log does not carry captures or goals.'
                    : 'The tracker kept no kill log for this match, so there is nothing to replay.'}
            />
        );
    }

    const { points } = momentum;
    const data = [...points, { ...points[points.length - 1], t: end, kill: null }];
    const margins = points.map(p => p.margin);
    const top = Math.max(...margins);
    const bottom = Math.min(...margins);
    // where zero sits in the gradient, from the top of the plotted range
    const zero = top <= 0 ? 0 : bottom >= 0 ? 1 : top / (top - bottom);

    // Team games colour each side by its team; FFA has the winner against the field.
    const result = winnerOf(game);
    const other = result.team && result.ranking.length === 2 ? result.ranking[1] : null;
    const teamColors: Record<string, string> = chart.team;
    const winnerColor = (result.team && teamColors[momentum.side]) || chart.ffa.winner;
    const otherColor = (other && teamColors[other.side]) || chart.ffa.field;
    const otherName = result.team ? (other?.name ?? 'the other teams') : 'the next best pilot';
    const ticks = Array.from({ length: Math.floor(end / 60) + 1 }, (_, i) => i * 60);

    const killsByFamily = new Map<string, Point[]>(FAMILIES.map(f => [f.id, []]));
    for (const p of points) if (p.kill) killsByFamily.get(weaponFamily(p.kill.weapon))!.push(p);
    const strips = FAMILIES.filter(f => f.id !== 'other' || killsByFamily.get('other')!.length > 0);
    const at = (t: number) => `${Math.min(100, Math.max(0, (t / end) * 100))}%`;
    const marginAt = (t: number) => [...points].reverse().find(p => p.t === t)?.margin ?? 0;

    return (
        <div className="bg-surface-card border border-line rounded-card p-4 font-mono">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-1">
                <h3 className="text-gray-300 font-bold">Momentum</h3>
                <span className="text-xs text-gray-400">{changes.length} lead change{changes.length === 1 ? '' : 's'}</span>
            </div>
            <p className="text-xs text-gray-500 mb-3">
                {momentum.name}'s lead over {otherName} after every kill. Click the chart to replay the scoreboard to that kill.
            </p>
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-2xs text-gray-400 mb-2">
                <li className="flex items-center gap-1.5"><span className="inline-block w-3 h-0.5" style={{ backgroundColor: winnerColor }} />{momentum.name} ahead</li>
                <li className="flex items-center gap-1.5"><span className="inline-block w-3 h-0.5" style={{ backgroundColor: otherColor }} />{otherName} ahead</li>
                <li className="flex items-center gap-1.5"><span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: chart.ink }} />Lead change</li>
            </ul>

            <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                        data={data}
                        margin={{ top: 8, right: RIGHT_GAP, bottom: 0, left: 0 }}
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
                            domain={[0, end]}
                            ticks={ticks}
                            minTickGap={24}
                            tickFormatter={clock}
                            stroke={chart.axis}
                            tick={{ fill: chart.label, fontSize: 10 }}
                        />
                        <YAxis width={AXIS_WIDTH} allowDecimals={false} stroke={chart.axis} tick={{ fill: chart.label, fontSize: 10 }} tickFormatter={signed} />
                        <ReferenceLine y={0} stroke={chart.axis} />
                        <Tooltip content={<MomentumTooltip winner={momentum.name} />} cursor={{ stroke: chart.label }} />
                        <Area
                            type="stepAfter"
                            dataKey="margin"
                            stroke={`url(#${gradientId}-line)`}
                            strokeWidth={2}
                            fill={`url(#${gradientId}-fill)`}
                            isAnimationActive={false}
                            activeDot={{ r: 4, fill: chart.ink, stroke: colors.surface.card, strokeWidth: 2 }}
                        />
                        {changes.map(c => (
                            <ReferenceDot key={c.t} x={c.t} y={marginAt(c.t)} r={4} fill={chart.ink} stroke={colors.surface.card} strokeWidth={2} />
                        ))}
                        {time !== null && <ReferenceLine x={time} stroke={colors.brand.DEFAULT} strokeWidth={1} />}
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-4 space-y-1.5" style={{ paddingLeft: AXIS_WIDTH, paddingRight: RIGHT_GAP }}>
                <div className="text-2xs text-gray-500 uppercase tracking-widest">Kills by weapon</div>
                {strips.map(f => {
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
                                        title={`${clock(p.t)} ${p.kill.attacker || 'Unknown'} → ${p.kill.defender}, ${p.kill.weapon}`}
                                    />
                                ))}
                                {time !== null && <span className="absolute -top-0.5 -bottom-0.5 w-px bg-brand" style={{ left: at(time) }} />}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default MomentumChart;
