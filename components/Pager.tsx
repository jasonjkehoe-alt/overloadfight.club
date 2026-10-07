import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useQueryParam } from '../hooks/useLocation';
import { secondaryButtonClass } from './States';

export interface Paging<T> {
    page: number;
    pageCount: number;
    // the page's first item's index in the whole list, for ranks
    start: number;
    items: T[];
    setPage: (page: number) => void;
}

// One page of a list the client pages itself, from ?page= (1 by default, left
// out of the URL). A page past the end reads as the last page. A caller that
// changes the list's filters writes `page: null` with them.
export function usePage<T>(all: T[], size: number): Paging<T> {
    const [param, setParam] = useQueryParam('page', '1');
    const pageCount = Math.ceil(all.length / size);
    const page = Math.min(Math.max(1, parseInt(param, 10) || 1), Math.max(1, pageCount));
    const start = (page - 1) * size;
    return { page, pageCount, start, items: all.slice(start, start + size), setPage: next => setParam(String(next)) };
}

interface PagerProps {
    paging: Paging<unknown>;
    // the list's top, scrolled into view when the page changes
    listId: string;
}

const BUTTON = `${secondaryButtonClass} disabled:opacity-40 disabled:cursor-not-allowed`;

// Previous, "Page N of M", Next. Renders nothing for a single page.
const Pager: React.FC<PagerProps> = ({ paging: { page, pageCount, setPage }, listId }) => {
    if (pageCount <= 1) return null;
    const go = (next: number) => {
        setPage(next);
        document.getElementById(listId)?.scrollIntoView({ block: 'start' });
    };
    return (
        <nav aria-label="Pages" className="flex justify-between items-center gap-3 pt-4">
            <button onClick={() => go(page - 1)} disabled={page <= 1} className={BUTTON}>
                <ChevronLeft className="w-4 h-4" aria-hidden /> Previous
            </button>
            <span className="text-gray-500 font-mono text-xs" aria-live="polite">
                Page <span className="text-white font-bold">{page}</span> of {pageCount}
            </span>
            <button onClick={() => go(page + 1)} disabled={page >= pageCount} className={BUTTON}>
                Next <ChevronRight className="w-4 h-4" aria-hidden />
            </button>
        </nav>
    );
};

export default Pager;
