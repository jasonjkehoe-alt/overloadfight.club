import React, { useState } from 'react';

// A table behind a <details>, built only while open: the keyboard and
// screen-reader path for a chart (the rating by day, the career by month).
// `rows` are newest first; the first column is left-aligned, the rest right.
const DetailsTable: React.FC<{ summary: string; headers: string[]; rows: { key: string; cells: React.ReactNode[] }[] }> = ({ summary, headers, rows }) => {
    const [open, setOpen] = useState(false);
    return (
        <details className="mt-3 text-xs" onToggle={e => setOpen(e.currentTarget.open)}>
            <summary className="cursor-pointer text-gray-400 hover:text-white">{summary}</summary>
            {open && (
                <div className="mt-2 max-h-64 overflow-auto border border-line rounded-control">
                    <table className="w-full text-left">
                        <thead className="bg-surface-raised text-gray-500 uppercase sticky top-0">
                            <tr>
                                {headers.map((h, i) => <th key={h} className={`px-3 py-1.5${i ? ' text-right' : ''}`}>{h}</th>)}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-line text-gray-300">
                            {rows.map(row => (
                                <tr key={row.key}>
                                    {row.cells.map((cell, i) => <td key={i} className={`px-3 py-1.5${i ? ' text-right' : ''}`}>{cell}</td>)}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </details>
    );
};

export default DetailsTable;
