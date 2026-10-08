import React, { useState } from 'react';
import { chart } from '../../designTokens.js';
import { COMBAT_RATIO_HINT, LETHALITY_HINT, RANKED } from '../../server/lib/gameParse.js';
import { CareerMonth } from '../../services/apiService';

type Field = 'matches' | 'winRate' | 'combatRatio' | 'lethality';
const SERIES: { field: Field; label: string; format: (n: number) => string; hint?: string }[] = [
    { field: 'matches', label: 'Matches', format: n => n.toLocaleString() },
    { field: 'winRate', label: 'Win rate', format: n => `${n}%`, hint: 'Wins over matches played; ties count as non-wins.' },
    { field: 'combatRatio', label: 'Combat Ratio', format: n => n.toFixed(2), hint: COMBAT_RATIO_HINT },
    { field: 'lethality', label: 'Lethality', format: n => n.toFixed(2), hint: LETHALITY_HINT }
];

const H = 32;
const monthLabel = (month: string) =>
    new Date(`${month}-15T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });

// One series as a sparkline: bars for the match count, a 2px line for the
// rates, broken over months without a match, a dot on the last month played
// and a hover title per month.
const Sparkline: React.FC<{ months: CareerMonth[]; field: Field; format: (n: number) => string; label: string }> = ({ months, field, format, label }) => {
    const values = months.map(m => m[field]);
    const played = values.filter((v): v is number => v !== null);
    const max = Math.max(...played, 0) || 1;
    const min = field === 'matches' ? 0 : Math.min(...played);
    const span = max - min;
    const n = months.length;
    const x = (i: number) => (n === 1 ? 50 : (i / (n - 1)) * 100);
    // a flat series sits in the middle
    const y = (v: number) => (span ? H - 3 - ((v - min) / span) * (H - 6) : H / 2);
    const barWidth = Math.min(4, 60 / n);
    const lastIndex = values.reduce<number>((last, v, i) => (v !== null && (field !== 'matches' || v > 0) ? i : last), -1);
    let path = '';
    values.forEach((v, i) => {
        if (v === null) return;
        path += `${i === 0 || values[i - 1] === null ? 'M' : 'L'}${x(i)},${y(v)}`;
    });
    return (
        <svg viewBox={`0 0 100 ${H}`} preserveAspectRatio="none" className="w-full h-8 overflow-visible" role="img"
            aria-label={`${label} by month, ${monthLabel(months[0].month)} to ${monthLabel(months[n - 1].month)}: from ${format(min)} to ${format(max)}.`}>
            <line x1="0" x2="100" y1={H - 1} y2={H - 1} stroke={chart.axis} strokeWidth="1" vectorEffect="non-scaling-stroke" />
            {field === 'matches'
                // bars in viewBox units, so they narrow with the box and keep a gap
                ? values.map((v, i) => v ? (
                    <rect key={i} x={x(i) - barWidth / 2} width={barWidth} y={y(v)} height={H - 1 - y(v)} fill={chart.series} />
                ) : null)
                : <path d={path} fill="none" stroke={chart.series} strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />}
            {/* a single month, or a month between gaps, has no segment: show it as a point */}
            {field !== 'matches' && values.map((v, i) => v !== null && values[i - 1] == null && values[i + 1] == null ? (
                <line key={i} x1={x(i)} x2={x(i)} y1={y(v)} y2={y(v)} stroke={chart.series} strokeWidth="4" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            ) : null)}
            {lastIndex >= 0 && (
                <line x1={x(lastIndex)} x2={x(lastIndex)} y1={y(values[lastIndex]!)} y2={y(values[lastIndex]!)} stroke={chart.ink} strokeWidth="6" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            )}
            {months.map((m, i) => (
                <rect key={m.month} x={x(i) - 50 / Math.max(1, n - 1)} width={100 / Math.max(1, n - 1)} y="0" height={H} fill="transparent">
                    <title>{`${monthLabel(m.month)}: ${values[i] === null ? 'no ranked match' : format(values[i]!)}`}</title>
                </rect>
            ))}
        </svg>
    );
};

// The months behind the sparklines, newest first; built only while open.
const MonthTable: React.FC<{ months: CareerMonth[] }> = ({ months }) => {
    const [open, setOpen] = useState(false);
    return (
        <details className="mt-2 text-xs" onToggle={e => setOpen(e.currentTarget.open)}>
            <summary className="cursor-pointer text-gray-400 hover:text-white">Career by month ({months.filter(m => m.matches > 0).length})</summary>
            {open && (
                <div className="mt-2 max-h-64 overflow-auto border border-line rounded-control">
                    <table className="w-full text-left">
                        <thead className="bg-surface-raised text-gray-500 uppercase sticky top-0">
                            <tr>
                                <th className="px-3 py-1.5">Month</th>
                                {SERIES.map(s => <th key={s.field} className="px-3 py-1.5 text-right">{s.label}</th>)}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-line text-gray-300">
                            {months.filter(m => m.matches > 0).reverse().map(m => (
                                <tr key={m.month}>
                                    <td className="px-3 py-1.5">{monthLabel(m.month)}</td>
                                    {SERIES.map(s => <td key={s.field} className="px-3 py-1.5 text-right">{s.format(m[s.field]!)}</td>)}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </details>
    );
};

// Monthly sparklines of the career numbers (gameParse.js careerSeries), from
// the first month played to this month.
const CareerArc: React.FC<{ months: CareerMonth[] }> = ({ months }) => {
    const latest = [...months].reverse().find(m => m.matches > 0);
    return (
        <div>
            <h4 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Career arc</h4>
            <div className="space-y-2">
                {SERIES.map(s => {
                    const value = latest?.[s.field];
                    return (
                        <div key={s.field} className="grid grid-cols-[6.5rem_1fr_4rem] items-center gap-3">
                            <span className="text-xs text-gray-400" title={s.hint}>{s.label}</span>
                            <Sparkline months={months} field={s.field} format={s.format} label={s.label} />
                            <span className="text-sm font-bold text-white text-right">{value === null || value === undefined ? '–' : s.format(value)}</span>
                        </div>
                    );
                })}
            </div>
            <div className="grid grid-cols-[6.5rem_1fr_4rem] gap-3 text-2xs text-gray-500 mt-1">
                <span />
                <span className="flex justify-between"><span>{monthLabel(months[0].month)}</span><span>{monthLabel(months[months.length - 1].month)}</span></span>
                <span className="text-right">{latest ? monthLabel(latest.month) : ''}</span>
            </div>
            <p className="text-2xs text-gray-500 mt-1">Per month, ranked matches ({RANKED.pilots}+ pilots, {RANKED.seconds} s or more) as on the career cards. The white dot and the number on the right are the last month played.</p>
            <MonthTable months={months} />
        </div>
    );
};

export default CareerArc;
