import React, { useEffect, useState } from 'react';
import { fetchFightNights, FightNightRecap } from '../services/apiService';
import Link from './Link';
import { urlFor } from '../server/lib/siteRoutes.js';

// One request per page load: switching tabs or coming back to the dashboard
// reuses it. A failed request is dropped so the next mount tries again.
let latest: ReturnType<typeof fetchFightNights> | undefined;

// One line on the dashboard pointing at the latest fight-night card. Renders
// nothing until a recap exists; the full card lives on the Fight Night page.
const FightNightTeaser: React.FC = () => {
    const [recap, setRecap] = useState<FightNightRecap | null>(null);

    useEffect(() => {
        let isCurrent = true;
        latest ??= fetchFightNights(1);
        latest.then(res => {
            if (!res) latest = undefined;
            if (isCurrent) setRecap(res?.recaps?.[0] ?? null);
        });
        return () => { isCurrent = false; };
    }, []);

    if (!recap) return null;

    return (
        <Link
            to={urlFor('fight-night', recap.date)}
            className="w-full flex items-center gap-3 bg-surface-card border border-line hover:border-brand px-4 py-3 rounded-card text-left font-mono text-xs transition-colors group"
        >
            <span className="text-base">🥊</span>
            <span className="font-bold text-white uppercase tracking-wide whitespace-nowrap">Fight Night</span>
            <span className="text-gray-400 truncate">
                {recap.formattedDate}: {recap.totalMatches} matches, {recap.totalPilots} pilots
                {recap.topFragger?.name && <>, most kills {recap.topFragger.name} ({recap.topFragger.kills})</>}
            </span>
            <span className="ml-auto text-brand whitespace-nowrap group-hover:underline">Full card &rarr;</span>
        </Link>
    );
};

export default FightNightTeaser;
