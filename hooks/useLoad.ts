import { useCallback, useEffect, useMemo, useState } from 'react';

// Calls `load` when `deps` change and keeps its answer: `data` is null while
// it loads, `failed` is true when it answered null (the apiService functions
// do on any failure), and retry() asks again. An answer that arrives after
// the deps changed is dropped. The result is the same object until the
// answer changes, so a memoised component can take it as a prop.
export function useLoad<T>(load: () => Promise<T | null>, deps: unknown[]) {
    const [state, setState] = useState<{ data: T | null; failed: boolean }>({ data: null, failed: false });
    const [retries, setRetries] = useState(0);

    useEffect(() => {
        let current = true;
        setState({ data: null, failed: false });
        load().then(data => {
            if (current) setState({ data, failed: data === null });
        });
        return () => { current = false; };
    }, [...deps, retries]);

    const retry = useCallback(() => setRetries(n => n + 1), []);
    return useMemo(() => ({ ...state, retry }), [state, retry]);
}
