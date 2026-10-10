import { useEffect, useState } from 'react';
import { BeltReign, fetchBelts } from '../services/apiService';

type Holders = Map<string, BeltReign[]>;
const NONE: Holders = new Map();

// The current champions (S21) by pilotKey(), from one /api/stats/belts request
// per page load that every belt mark shares; empty until it answers, and
// empty when it fails (the next mark to mount asks again).
let holders: Promise<Holders> | null = null;
const load = () => {
    holders ??= fetchBelts().then(belts => {
        if (!belts) {
            holders = null;
            return NONE;
        }
        const byPilot: Holders = new Map();
        for (const { holder } of belts.modes) {
            if (holder) byPilot.set(holder.pilot, [...(byPilot.get(holder.pilot) ?? []), holder]);
        }
        return byPilot;
    });
    return holders;
};

export function useBeltHolders(): Holders {
    const [current, setCurrent] = useState<Holders>(NONE);
    useEffect(() => {
        let live = true;
        load().then(map => {
            if (live) setCurrent(map);
        });
        return () => { live = false; };
    }, []);
    return current;
}
