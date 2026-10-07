import React, { useCallback, useSyncExternalStore } from 'react';

// The address bar is the app's navigation state. App.tsx picks the view from
// the path, and components keep tabs and filters in the query string, so a
// reload, a shared link and the back button all land on the same screen.

const listeners = new Set<() => void>();
const emit = () => listeners.forEach(listener => listener());
window.addEventListener('popstate', emit);

const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
};

const currentUrl = () => window.location.pathname + window.location.search;

// Entries this tab pushed carry their depth, so goBack knows whether the
// previous entry is ours. A page opened from outside starts at 0.
const depth = (): number => window.history.state?.depth ?? 0;

export function navigate(url: string, { replace = false } = {}) {
    if (url === currentUrl()) return;
    if (replace) window.history.replaceState(window.history.state, '', url);
    else window.history.pushState({ depth: depth() + 1 }, '', url);
    emit();
}

// Back to the previous screen in this tab, or to `fallback` when the page was
// opened directly (a shared link, a new tab), where history.back() would leave the site.
export function goBack(fallback: string) {
    if (depth() > 0) window.history.back();
    else navigate(fallback, { replace: true });
}

// A click the browser should handle itself: a new tab or window, a download.
export const isModifiedClick = (e: React.MouseEvent) =>
    e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;

// Click handlers for a table row or card that cannot be an <a> (it holds other
// buttons or links). Clicks on those inner controls are theirs; a modified or
// middle click opens the row's page in a new tab, as a link would.
export function rowLink(url: string) {
    const open = (e: React.MouseEvent) => {
        if ((e.target as Element).closest('a, button')) return;
        if (!isModifiedClick(e)) navigate(url);
        else if (e.button <= 1) window.open(url, '_blank', 'noopener');
    };
    return { onClick: open, onAuxClick: open };
}

export const useUrl = () => useSyncExternalStore(subscribe, currentUrl);

export const usePathname = () => useUrl().split('?')[0];

// One query-string value. Setting it replaces the current entry rather than
// adding one, so back leaves the page instead of undoing each filter; the
// default value is left out of the URL.
export function useQueryParam(key: string, fallback = ''): [string, (value: string) => void] {
    const url = useUrl();
    const value = new URLSearchParams(url.split('?')[1]).get(key) ?? fallback;
    const setValue = useCallback((next: string) => {
        const params = new URLSearchParams(window.location.search);
        if (next === fallback || next === '') params.delete(key);
        else params.set(key, next);
        const query = params.toString();
        navigate(window.location.pathname + (query ? `?${query}` : ''), { replace: true });
    }, [key, fallback]);
    return [value, setValue];
}
