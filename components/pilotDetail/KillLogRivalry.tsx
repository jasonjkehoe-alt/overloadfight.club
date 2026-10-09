import React, { memo } from 'react';
import { Swords } from 'lucide-react';
import { Loading, EmptyState, ErrorState } from '../States';
import RivalBars from './RivalBars';
import ClutchProfile from './ClutchProfile';
import { RIVALS_HINT } from '../../server/lib/gameParse.js';
import { PilotRivalry } from '../../services/apiService';

// The pilot's rivals and clutch from the kill and damage logs (S17), from
// /api/pilot/:name/rivalry: all time and all modes, ranked logged matches only.
const KillLogRivalry: React.FC<{ name: string; load: { data: PilotRivalry | null; failed: boolean; retry: () => void } }> = ({ name, load: { data, failed, retry } }) => {
    let body: React.ReactNode;
    let ready = false;
    if (failed) {
        body = <ErrorState compact title="Rivals unavailable" message="Could not load the kill-log rivals." onRetry={retry} />;
    } else if (!data) {
        body = <Loading compact label="Loading kill-log rivals..." />;
    } else if (data.opponents.length === 0 && data.clutch.length === 0) {
        body = <EmptyState compact icon={Swords} title="No kill-log rivals yet" message={`Nothing from this pilot's ranked matches with a kill or damage log yet. ${RIVALS_HINT}`} />;
    } else {
        ready = true;
        body = (
            <>
                <div className="grid gap-6 lg:grid-cols-2">
                    {data.opponents.length > 0 && <RivalBars name={name} data={data} />}
                    {data.clutch.length > 0 && <ClutchProfile clutch={data.clutch} community={data.community} />}
                </div>
                <p className="text-2xs text-gray-500 mt-3">All time, all modes. {RIVALS_HINT}</p>
            </>
        );
    }
    return (
        <section className="bg-surface-card border border-line p-4 rounded-card" aria-label="Rivals and clutch from the kill log">
            {!ready && <h4 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Rivals and clutch from the kill log</h4>}
            {body}
        </section>
    );
};

// memo: the pilot page re-renders on every mode and rival change
export default memo(KillLogRivalry);
