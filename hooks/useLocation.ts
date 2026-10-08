import React, { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

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

// Several query-string values in one history write; '' or null removes a key.
export function setQueryParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(updates)) {
        if (value) params.set(key, value);
        else params.delete(key);
    }
    const query = params.toString();
    navigate(window.location.pathname + (query ? `?${query}` : ''), { replace: true });
}

export const useUrl = () => useSyncExternalStore(subscribe, currentUrl);

// Its own snapshot, so a query-string change does not re-render App.
export const usePathname = () => useSyncExternalStore(subscribe, () => window.location.pathname);

// One query-string value. Setting it replaces the current entry rather than
// adding one, so back leaves the page instead of undoing each filter; the
// default value is left out of the URL. With `allowed`, anything else in the
// URL reads as the default. `also` writes other keys in the same history
// entry, such as `{ page: null }` when a filter changes a paged list.
export function useQueryParam<T extends string = string>(key: string, fallback = '' as NoInfer<T>, allowed?: readonly T[]): [T, (value: T, also?: Record<string, string | null>) => void] {
    const url = useUrl();
    const raw = new URLSearchParams(url.split('?')[1]).get(key);
    const value = raw !== null && (!allowed || allowed.includes(raw as T)) ? raw as T : fallback;
    const setValue = useCallback((next: T, also?: Record<string, string | null>) => {
        setQueryParams({ ...also, [key]: next === fallback ? null : next });
    }, [key, fallback]);
    return [value, setValue];
}

// A query-string value typed into a box: the box follows every keystroke, the
// URL catches up after a pause (browsers throttle rapid history writes), and a
// URL change from elsewhere (a reset, a redirect) refills the box.
export function useQueryText(key: string): [string, (value: string) => void] {
    const [value, setValue] = useQueryParam(key);
    const [text, setText] = useState(value);
    const written = useRef(value);
    useEffect(() => {
        if (value !== written.current) {
            written.current = value;
            setText(value);
        }
    }, [value]);
    useEffect(() => {
        if (text === written.current) return;
        const timer = setTimeout(() => {
            written.current = text;
            setValue(text);
        }, 300);
        return () => clearTimeout(timer);
    }, [text, setValue]);
    return [text, setText];
}
