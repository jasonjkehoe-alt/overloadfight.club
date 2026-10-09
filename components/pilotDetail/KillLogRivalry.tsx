import React, { memo } from 'react';
import { Swords } from 'lucide-react';
import { Loading, EmptyState, ErrorState } from '../States';
import RivalBars from './RivalBars';
import ClutchProfile from './ClutchProfile';
import { LOGGED_ONLY } from '../rivals/rivalText';
import { PilotRivalry } from '../../services/apiService';

// The pilot's rivals and clutch from the kill and damage logs (S17), from
// /api/pilot/:name/rivalry: all time and all modes, ranked logged matches only.
const KillLogRivalry: React.FC<{ name: string; load: { data: PilotRivalry | null; failed: boolean; retry: () => void } }> = ({ name, load: { data, failed, retry } }) => {
    let body: React.ReactNode;
    if (failed) {
        body = <ErrorState compact title="Rivals unavailable" message="Could not load the kill-log rivals." onRetry={retry} />;
    } else if (!data) {
        body = <Loading compact label="Loading kill-log rivals..." />;
    } else if (data.opponents.length === 0 && data.clutch.length === 0) {
        body = <EmptyState compact icon={Swords} title="No logged matches" message={`None of this pilot's ranked matches has a kill or damage log. ${LOGGED_ONLY}`} />;
    } else {
        body = (
            <div className="grid gap-6 lg:grid-cols-2">
                {data.opponents.length > 0 && <RivalBars name={name} data={data} />}
                {data.clutch.length > 0 && <ClutchProfile clutch={data.clutch} community={data.community} />}
            </div>
        );
    }
    return (
        <section className="bg-surface-card border border-line p-4 rounded-card" aria-label="Rivals and clutch from the kill log">
            {body}
            {data && (data.opponents.length > 0 || data.clutch.length > 0) && <p className="text-2xs text-gray-500 mt-3">All time, all modes. {LOGGED_ONLY}</p>}
        </section>
    );
};

// memo: the pilot page re-renders on every mode and rival change
export default memo(KillLogRivalry);
