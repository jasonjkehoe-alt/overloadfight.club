import React, { memo } from 'react';
import { CalendarClock } from 'lucide-react';
import { Loading, EmptyState, ErrorState } from '../States';
import { chart, rampColor } from '../../designTokens.js';
import { DAY_HOURS, FIGHT_NIGHT_DAY, FIGHT_NIGHT_DAY_TEXT, HEATMAP, WEEKDAYS, clockHour, localClock, shiftDay } from '../../server/lib/gameParse.js';
import { fetchActivityHeatmap } from '../../services/apiService';
import { useLoad } from '../../hooks/useLoad';
import RampLegend from '../RampLegend';

// Columns in the order a fight-night day runs (DAY_HOURS), so a night past
// midnight reads as one row; a row's hours before the day starts are the next
// morning: "Monday night, 02:00".
const when = (weekday: number, hour: number) =>
    hour < FIGHT_NIGHT_DAY.startHour ? `${WEEKDAYS[weekday]} night, ${clockHour(hour)}` : `${WEEKDAYS[weekday]} ${clockHour(hour)}`;

// The dashboard's "when do people play": matches per weekday and hour in
// Central time over the last weeks, a table so each count has its row and
// column headers for a screen reader and a title on hover.
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
        const max = Math.max(...data.cells.flat());
        let busiest = { weekday: 0, hour: 0, count: -1 };
        data.cells.forEach((row, weekday) => DAY_HOURS.forEach(hour => {
            if (row[hour] > busiest.count) busiest = { weekday, hour, count: row[hour] };
        }));
        const now = localClock(Date.now());
        const last = shiftDay(data.until, -1);
        body = (
            <>
                <p className="text-xs text-gray-400 mb-3">
                    Busiest: <span className="text-white font-bold">{when(busiest.weekday, busiest.hour)}</span>,{' '}
                    {busiest.count.toLocaleString()} matches. {data.total.toLocaleString()} matches from {data.since} to {last}.
                </p>
                <div className="overflow-x-auto">
                    <table className="w-full table-fixed border-separate border-spacing-[2px] min-w-[300px]">
                        <caption className="sr-only">
                            Matches per weekday and hour, {data.since} to {last}. {FIGHT_NIGHT_DAY_TEXT}, so each row ends the next morning.
                        </caption>
                        <thead>
                            <tr>
                                <th scope="col" className="w-8 sm:w-10"><span className="sr-only">Day</span></th>
                                {DAY_HOURS.map((hour, i) => (
                                    <th key={hour} scope="col" className="text-2xs font-normal text-gray-500 text-left whitespace-nowrap overflow-visible">
                                        {i % 3 === 0 ? <span aria-hidden>{String(hour).padStart(2, '0')}</span> : null}
                                        <span className="sr-only">{clockHour(hour)}</span>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.cells.map((row, weekday) => (
                                <tr key={weekday}>
                                    <th scope="row" className="text-2xs font-normal text-gray-500 text-left pr-1">
                                        <span aria-hidden>{WEEKDAYS[weekday].slice(0, 3)}</span>
                                        <span className="sr-only">{WEEKDAYS[weekday]}</span>
                                    </th>
                                    {DAY_HOURS.map(hour => {
                                        const isNow = now?.weekday === weekday && now.hour === hour;
                                        return (
                                            <td
                                                key={hour}
                                                title={`${when(weekday, hour)}: ${row[hour]} match${row[hour] === 1 ? '' : 'es'}${isNow ? ' (now)' : ''}`}
                                                className="h-4 sm:h-6 rounded-[2px] p-0"
                                                style={{ backgroundColor: rampColor(row[hour], max), outline: isNow ? `2px solid ${chart.ink}` : undefined, outlineOffset: -1 }}
                                            >
                                                <span className="sr-only">{row[hour]}{isNow ? ', now' : ''}</span>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
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
