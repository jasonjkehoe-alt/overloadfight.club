import React, { memo } from 'react';
import { CalendarClock } from 'lucide-react';
import { Loading, EmptyState, ErrorState } from '../States';
import { DAY_HOURS, FIGHT_NIGHT_DAY_TEXT, HEATMAP, shiftDay } from '../../server/lib/gameParse.js';
import { fetchActivityHeatmap } from '../../services/apiService';
import { useLoad } from '../../hooks/useLoad';
import RampLegend from '../RampLegend';
import HourGrid, { when } from '../HourGrid';

const matches = (n: number) => `${n.toLocaleString()} match${n === 1 ? '' : 'es'}`;

// The dashboard's "when do people play": matches per weekday and hour in
// Central time over the last weeks (HourGrid).
const ActivityHeatmap: React.FC = () => {
    const { data, failed, retry } = useLoad(fetchActivityHeatmap, []);

    let body: React.ReactNode;
    if (failed) {
        body = <ErrorState compact title="Heatmap unavailable" message="Could not load when matches were played." onRetry={retry} />;
    } else if (!data) {
        body = <Loading compact label="Loading activity..." />;
    } else if (data.total === 0) {
        body = <EmptyState compact icon={CalendarClock} title={`No matches in the last ${HEATMAP.weeks} weeks`} />;
    } else {
        let busiest = { weekday: 0, hour: 0, count: -1 };
        data.cells.forEach((row, weekday) => DAY_HOURS.forEach(hour => {
            if (row[hour] > busiest.count) busiest = { weekday, hour, count: row[hour] };
        }));
        const last = shiftDay(data.until, -1);
        body = (
            <>
                <p className="text-xs text-gray-400 mb-3">
                    Busiest: <span className="text-white font-bold">{when(busiest.weekday, busiest.hour)}</span>,{' '}
                    {matches(busiest.count)}. {matches(data.total)} from {data.since} to {last}.
                </p>
                <HourGrid
                    cells={data.cells}
                    caption={`Matches per weekday and hour, ${data.since} to ${last}. ${FIGHT_NIGHT_DAY_TEXT}, so each row ends the next morning.`}
                    valueText={matches}
                />
                <div className="flex flex-wrap items-center justify-between gap-2 mt-3 text-2xs text-gray-500">
                    <span>
                        {FIGHT_NIGHT_DAY_TEXT}; the outlined hour is now.
                    </span>
                    <RampLegend />
                </div>
            </>
        );
    }

    return (
        <section className="bg-surface-card border border-line rounded-card p-4" aria-labelledby="heatmap-title">
            <h3 id="heatmap-title" className="text-gray-500 font-bold text-xs uppercase tracking-widest mb-2">
                When pilots play <span className="normal-case tracking-normal font-normal">(last {HEATMAP.weeks} weeks)</span>
            </h3>
            {body}
        </section>
    );
};

// memo: GameList re-renders on every server-browser poll
export default memo(ActivityHeatmap);
