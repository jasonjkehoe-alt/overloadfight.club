import { useSyncExternalStore } from 'react';
import { BeltReign, fetchBelts } from '../services/apiService';

type Holders = Map<string, BeltReign[]>;

// The current champions (S21) by pilotKey(), one store for every belt mark on
// the page: one /api/stats/belts request, asked again when a mark mounts and
// the answer is older than STALE_MS (a stats refresh can move a belt while the
// tab stays open). Empty until it answers; a failed request keeps what it had
// and the next mark to mount asks again.
const STALE_MS = 10 * 60 * 1000;
let holders: Holders = new Map();
let fetchedAt = 0;
let loading = false;
const listeners = new Set<() => void>();

async function load() {
    if (loading || Date.now() - fetchedAt < STALE_MS) return;
    loading = true;
    const belts = await fetchBelts();
    loading = false;
    if (!belts) return;
    fetchedAt = Date.now();
    const byPilot: Holders = new Map();
    for (const { holder } of belts.modes) {
        if (holder) byPilot.set(holder.pilot, [...(byPilot.get(holder.pilot) ?? []), holder]);
    }
    holders = byPilot;
    listeners.forEach(listener => listener());
}

function subscribe(listener: () => void) {
    listeners.add(listener);
    load();
    return () => { listeners.delete(listener); };
}

export const useBeltHolders = (): Holders => useSyncExternalStore(subscribe, () => holders);
