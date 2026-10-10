import React from 'react';
import { chart } from '../../designTokens.js';

// The corners' colours: the red corner in chart.team's ORANGE, the blue in its
// BLUE, the pair the dataviz validator passed for the team charts (S12).
export const CORNER = [chart.team.ORANGE, chart.team.BLUE] as const;

// Two counts as one bar split at their share of the total, the first
// corner's from the left, with each number beside its end and the bar in
// words for a screen reader. An empty bar when both are 0.
const SplitBar: React.FC<{ label: string; a: number; b: number; words: string; format?: (n: number) => string }> = ({ label, a, b, words, format = n => n.toLocaleString() }) => {
    const total = a + b;
    return (
        <div>
            <div className="text-2xs uppercase tracking-wider text-gray-400 text-center mb-1">{label}</div>
            <span className="sr-only">{words}</span>
            <div className="grid grid-cols-[4.5rem_1fr_4.5rem] sm:grid-cols-[5.5rem_1fr_5.5rem] items-center gap-2 text-xs sm:text-sm font-mono tabular-nums" aria-hidden>
                <span className="text-right font-bold" style={{ color: CORNER[0] }}>{format(a)}</span>
                <div className="flex h-3 rounded overflow-hidden" style={{ backgroundColor: chart.axis }}>
                    {total > 0 && <div style={{ width: `${(a / total) * 100}%`, backgroundColor: CORNER[0] }} />}
                    {total > 0 && <div className="border-l-2 border-surface-card" style={{ width: `${(b / total) * 100}%`, backgroundColor: CORNER[1] }} />}
                </div>
                <span className="font-bold" style={{ color: CORNER[1] }}>{format(b)}</span>
            </div>
        </div>
    );
};

export default SplitBar;
