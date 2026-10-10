import React from 'react';
import { TIERS } from '../../server/lib/gameParse.js';

// An achievement's tier as pips (S21): one per tier, the ones earned filled.
// The tier's name sits beside them in text, so the pips are never the only cue.
const TierPips: React.FC<{ tier: number }> = ({ tier }) => (
    <span className="inline-flex gap-1" aria-hidden>
        {TIERS.map((name, i) => (
            <span key={name} className={`w-2 h-2 rounded-full border ${i < tier ? 'bg-brand border-brand' : 'border-gray-600'}`} />
        ))}
    </span>
);

// "Silver", or "Not yet" for tier 0.
export const tierName = (tier: number) => (tier > 0 ? TIERS[tier - 1] : 'Not yet');

export default TierPips;
