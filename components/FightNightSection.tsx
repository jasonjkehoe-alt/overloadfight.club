import React, { useState, useEffect } from 'react';
import { fetchFightNights, FightNightRecap } from '../services/apiService';
import FightNightRecapCard from './FightNightRecapCard';
import Link from './Link';
import { urlFor } from '../server/lib/siteRoutes.js';
import { Flame, Calendar, ChevronRight } from 'lucide-react';
import { Loading, EmptyState, ErrorState } from './States';

interface FightNightSectionProps {
    // The date in the URL (/fight-night/:date); the latest card when absent.
    date?: string;
}

export const FightNightSection: React.FC<FightNightSectionProps> = ({ date }) => {
    const [recaps, setRecaps] = useState<FightNightRecap[]>([]);
    const [loading, setLoading] = useState(true);
    const [failed, setFailed] = useState(false);
    const [retries, setRetries] = useState(0);

    useEffect(() => {
        let isCurrent = true;
        setLoading(true);
        setFailed(false);
        fetchFightNights(15).then(res => {
            if (!isCurrent) return;
            // fetchFightNights answers null when the request fails
            setFailed(!res);
            setRecaps(res?.recaps ?? []);
            setLoading(false);
        });
        return () => { isCurrent = false; };
    }, [retries]);

    const activeRecap = recaps.find(r => r.date === date) || recaps[0];

    if (loading) return <Loading label="Loading Fight Night Recaps..." />;

    if (failed) {
        return <ErrorState title="Fight night recaps unavailable" message="Could not load the fight night cards." onRetry={() => setRetries(n => n + 1)} />;
    }

    if (recaps.length === 0) {
        return (
            <div className="bg-surface-card border border-line rounded-card">
                <EmptyState
                    icon={Flame}
                    title="No fight nights yet"
                    message="Check back after the next big one. When the arena erupts with heavy traffic and high frags, the official fight card will auto-generate here."
                />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header and Date Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[#111114] border border-gray-800 px-4 py-3 rounded-lg">
                <div className="flex items-center gap-2">
                    <span className="text-lg">🥊</span>
                    <h2 className="text-base font-bold text-white tracking-wide uppercase font-mono flex items-center gap-2">
                        Fight Night Recaps
                        <span className="text-xs px-2 py-0.5 rounded bg-[#ff6600]/20 text-[#ff6600] border border-[#ff6600]/40 font-mono">
                            Auto-Generated
                        </span>
                    </h2>
                </div>

                {/* Date Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    <span className="text-xs text-gray-500 font-mono flex items-center gap-1 mr-1">
                        <Calendar size={12} /> Past Cards:
                    </span>
                    {recaps.map(r => {
                        const isSelected = r === activeRecap;
                        return (
                            <Link
                                key={r.date}
                                to={urlFor('fight-night', r.date)}
                                className={`px-2.5 py-1 text-xs font-mono rounded whitespace-nowrap transition-colors ${
                                    isSelected
                                        ? 'bg-[#ff6600] text-black font-bold shadow'
                                        : 'bg-black/60 hover:bg-gray-800 text-gray-400 hover:text-white border border-gray-800'
                                }`}
                            >
                                {r.date}
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Poster Card */}
            {activeRecap && (
                <FightNightRecapCard recap={activeRecap} />
            )}
        </div>
    );
};

export default FightNightSection;
