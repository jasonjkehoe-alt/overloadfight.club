import React, { useEffect, useState } from 'react';
import { fetchFightNights, FightNightRecap } from '../services/apiService';

interface FightNightTeaserProps {
    onNavigate: (view: string, param?: string) => void;
}

// One line on the dashboard pointing at the latest fight-night card. Renders
// nothing until a recap exists; the full card lives on the Fight Night page.
const FightNightTeaser: React.FC<FightNightTeaserProps> = ({ onNavigate }) => {
    const [recap, setRecap] = useState<FightNightRecap | null>(null);

    useEffect(() => {
        let isCurrent = true;
        fetchFightNights(1).then(res => {
            if (isCurrent) setRecap(res?.recaps?.[0] ?? null);
        });
        return () => { isCurrent = false; };
    }, []);

    if (!recap) return null;

    return (
        <button
            onClick={() => onNavigate('fight-night', recap.date)}
            className="w-full flex items-center gap-3 bg-[#111114] border border-gray-800 hover:border-[#ff6600] px-4 py-3 rounded-lg text-left font-mono text-xs transition-colors group"
        >
            <span className="text-base">🥊</span>
            <span className="font-bold text-white uppercase tracking-wide whitespace-nowrap">Fight Night</span>
            <span className="text-gray-400 truncate">
                {recap.formattedDate}: {recap.totalMatches} matches, {recap.totalPilots} pilots
                {recap.topFragger?.name && <>, top fragger {recap.topFragger.name} ({recap.topFragger.kills})</>}
            </span>
            <span className="ml-auto text-[#ff6600] whitespace-nowrap group-hover:underline">Full card &rarr;</span>
        </button>
    );
};

export default FightNightTeaser;
