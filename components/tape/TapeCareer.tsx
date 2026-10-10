import React from 'react';
import { CORNER } from './SplitBar';
import { COMBAT_RATIO_HINT, LETHALITY_HINT, RATING_HINT, WIN_RATE_HINT } from '../../server/lib/gameParse.js';
import { ratingStanding } from '../../server/lib/matchResult.js';
import { TapeCorner } from '../../services/apiService';

type Row = { label: string; hint: string; value: (p: TapeCorner) => number | null; format: (n: number) => string };

// The career rows, as the pilot page's cards show them: every ranked match in
// every mode, whatever the head-to-head's mode.
const ROWS: Row[] = [
    { label: 'Rating', hint: RATING_HINT, value: p => p.rating.rating, format: n => String(Math.round(n)) },
    { label: 'Ranked matches', hint: 'Ranked matches played, every mode.', value: p => p.career?.matches ?? null, format: n => n.toLocaleString() },
    { label: 'Win rate', hint: WIN_RATE_HINT, value: p => p.career?.win_rate ?? null, format: n => `${n.toFixed(1)}%` },
    { label: 'Combat Ratio', hint: COMBAT_RATIO_HINT, value: p => p.career?.combat_ratio ?? null, format: n => n.toFixed(2) },
    { label: 'Lethality', hint: LETHALITY_HINT, value: p => p.career?.lethality ?? null, format: n => n.toFixed(2) }
];

// The two careers side by side (S20), the higher number of each row marked
// with an arrow toward it; a pilot without the number shows a dash.
const TapeCareer: React.FC<{ pilots: [TapeCorner, TapeCorner] }> = ({ pilots }) => (
    <div>
        <dl className="divide-y divide-line">
            {ROWS.map(row => {
                const [a, b] = pilots.map(row.value);
                const ahead = a !== null && b !== null && a !== b ? (a > b ? 0 : 1) : null;
                return (
                    <div key={row.label} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 py-2 font-mono">
                        <dt className="text-2xs uppercase tracking-wider text-gray-400 text-center" title={row.hint}>{row.label}</dt>
                        {[a, b].map((v, i) => (
                            <dd key={i} className={`${i === 0 ? 'text-left order-first' : 'text-right order-last'} text-sm sm:text-base tabular-nums ${ahead === i ? 'font-bold' : 'text-gray-300'}`} style={ahead === i ? { color: CORNER[i] } : undefined}>
                                {i === 1 && ahead === 1 && <span aria-hidden className="mr-1 text-2xs">▶</span>}
                                {v === null ? '—' : row.format(v)}
                                {i === 0 && ahead === 0 && <span aria-hidden className="ml-1 text-2xs">◀</span>}
                                <span className="sr-only"> {pilots[i].name}{ahead === i ? ', higher' : ''}</span>
                            </dd>
                        ))}
                    </div>
                );
            })}
        </dl>
        <p className="grid grid-cols-2 gap-2 text-2xs text-gray-500 mt-2">
            {pilots.map((p, i) => (
                <span key={p.key} className={i ? 'text-right' : ''}>{p.rating.matches > 0 ? ratingStanding(p.rating) : 'No rated match yet'}</span>
            ))}
        </p>
    </div>
);

export default TapeCareer;
