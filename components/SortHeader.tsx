import React from 'react';

interface SortHeaderProps {
    // this column's sort, or null when the table is sorted by another column
    direction: 'asc' | 'desc' | null;
    onSort: () => void;
    className?: string;
    title?: string;
    children: React.ReactNode;
}

// A column header that sorts the table: a button inside the <th>, so it takes
// focus and Enter, with aria-sort on the header.
const SortHeader: React.FC<SortHeaderProps> = ({ direction, onSort, className = '', title, children }) => (
    <th className={className} aria-sort={direction ? (direction === 'asc' ? 'ascending' : 'descending') : undefined}>
        <button onClick={onSort} title={title} className="inline-flex items-center gap-1 uppercase hover:text-white transition-colors">
            {children}
            {direction && <span aria-hidden>{direction === 'desc' ? '↓' : '↑'}</span>}
        </button>
    </th>
);

export default SortHeader;
