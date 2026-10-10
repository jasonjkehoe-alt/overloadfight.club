import React from 'react';
import { Award } from 'lucide-react';
import { pilotKey } from '../server/lib/gameParse.js';
import { useBeltHolders } from '../hooks/useBeltHolders';

// The belt mark (S21): beside a current champion's name, the mode in its title
// and in screen-reader text, so the icon is never the only cue. Nothing for
// anyone else.
const BeltMark: React.FC<{ name: string; size?: number }> = ({ name, size = 14 }) => {
    const held = useBeltHolders().get(pilotKey(name));
    if (!held?.length) return null;
    const words = held.map(r => `${r.label} champion`).join(', ');
    return (
        <span className="inline-flex align-middle ml-1.5 text-brand shrink-0" title={words} data-belt={held.map(r => r.mode).join(',')}>
            <Award size={size} aria-hidden />
            <span className="sr-only"> ({words})</span>
        </span>
    );
};

export default BeltMark;
