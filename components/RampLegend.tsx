import React from 'react';
import { chart, rampColor } from '../designTokens.js';

// The key to chart.ramp (the heatmap and the activity calendar): the empty
// colour, then fewest to most.
const RampLegend: React.FC<{ className?: string }> = ({ className = '' }) => (
    <span className={`flex items-center gap-1 text-2xs text-gray-500 ${className}`} aria-hidden>
        None <span className="w-3 h-3 rounded-[2px]" style={{ backgroundColor: rampColor(0, 1) }} />
        <span className="ml-1">Fewer</span>
        {chart.ramp.map(color => <span key={color} className="w-3 h-3 rounded-[2px]" style={{ backgroundColor: color }} />)}
        More
    </span>
);

export default RampLegend;
