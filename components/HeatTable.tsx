import React from 'react';
import { chart, colors, rampColor, rampStep } from '../designTokens.js';

export interface HeatCell {
    // 0 to 1, the share that picks the chart.ramp colour; null leaves the cell uncoloured
    share: number | null;
    // what the cell shows
    text: string;
    // the cell in words, for its title and for a screen reader
    title: string;
}

interface HeatTableProps {
    caption: string;
    // the row-label column's header, for screen readers
    corner: string;
    columns: { key: string; label: React.ReactNode; title?: string }[];
    rows: { key: string; label: React.ReactNode; cells: (HeatCell | null)[] }[];
}

// A rows × columns table coloured by chart.ramp (the weapon meta and the
// specialist grid, S16), each step a fifth of the way to the largest share
// shown, as the hour grids scale: a header per row and column, each cell's
// words as its title and as screen-reader text. Wide tables scroll inside
// the box.
const HeatTable: React.FC<HeatTableProps> = ({ caption, corner, columns, rows }) => {
    const max = Math.max(0, ...rows.flatMap(r => r.cells.map(c => c?.share ?? 0)));
    return (
    <div className="overflow-x-auto">
        <table className="border-separate border-spacing-[2px] text-2xs font-mono">
            <caption className="sr-only">{caption}</caption>
            <thead>
                <tr>
                    <th scope="col" className="sticky left-0 bg-surface-card text-left font-normal text-gray-500"><span className="sr-only">{corner}</span></th>
                    {columns.map(c => (
                        <th key={c.key} scope="col" title={c.title} className="font-normal text-gray-500 text-center px-1 whitespace-nowrap max-w-[5.5rem] truncate align-bottom">{c.label}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {rows.map(row => (
                    <tr key={row.key}>
                        <th scope="row" className="sticky left-0 bg-surface-card text-left font-normal text-gray-300 pr-2 whitespace-nowrap max-w-[11rem] truncate">{row.label}</th>
                        {row.cells.map((cell, j) => {
                            // dark ink on the two lightest steps, where white fails contrast
                            const dark = cell?.share != null && rampStep(cell.share, max) >= chart.ramp.length - 2;
                            return (
                            <td
                                key={columns[j].key}
                                title={cell?.title}
                                className="h-6 min-w-[2.5rem] text-center rounded-[2px] p-0"
                                style={{ backgroundColor: cell?.share == null ? 'transparent' : rampColor(cell.share, max), color: dark ? colors.surface.page : chart.ink }}
                            >
                                {cell ? <><span aria-hidden>{cell.text}</span><span className="sr-only">{cell.title}</span></> : <span className="sr-only">none</span>}
                            </td>
                            );
                        })}
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
    );
};

export default HeatTable;
