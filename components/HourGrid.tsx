import React, { useEffect, useState } from 'react';
import { chart, rampColor } from '../designTokens.js';
import { DAY_HOURS, WEEKDAYS, atClock, clockHour, localClock } from '../server/lib/gameParse.js';

// Columns in the order a fight-night day runs (DAY_HOURS), so a night past
// midnight reads as one row; a row's hours before the day starts are the next
// morning: "Monday night, 02:00".
export const when = (weekday: number, hour: number) => atClock(WEEKDAYS[weekday], hour);

interface HourGridProps {
    // 7 rows (Monday first, by fight-night day) of 24 values by clock hour; null: nothing was counted
    cells: (number | null)[][];
    caption: string;
    // a cell's value in words, for its title and for a screen reader
    valueText: (value: number) => string;
}

// A weekday × hour table in chart.ramp colours: the dashboard's heatmap (S14)
// and a server's peak hours (S15). A header per row and column and the value
// as screen-reader text, a title on hover; the current hour is outlined and
// the outline moves on the hour while the page stays open (Chicago's offset
// is whole hours, so its hours turn with UTC's).
const HourGrid: React.FC<HourGridProps> = ({ cells, caption, valueText }) => {
    const [now, setNow] = useState(() => localClock(Date.now()));
    useEffect(() => {
        const timer = setTimeout(() => setNow(localClock(Date.now())), 3600000 - (Date.now() % 3600000) + 1000);
        return () => clearTimeout(timer);
    }, [now]);
    const max = Math.max(0, ...cells.flat().map(v => v ?? 0));

    return (
        <div className="overflow-x-auto">
            <table className="w-full table-fixed border-separate border-spacing-[2px] min-w-[300px]">
                <caption className="sr-only">{caption}</caption>
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
                    {cells.map((row, weekday) => (
                        <tr key={weekday}>
                            <th scope="row" className="text-2xs font-normal text-gray-500 text-left pr-1">
                                <span aria-hidden>{WEEKDAYS[weekday].slice(0, 3)}</span>
                                <span className="sr-only">{WEEKDAYS[weekday]}</span>
                            </th>
                            {DAY_HOURS.map(hour => {
                                const isNow = now?.weekday === weekday && now.hour === hour;
                                const value = row[hour];
                                const text = value === null ? 'nothing counted' : valueText(value);
                                return (
                                    <td
                                        key={hour}
                                        title={`${when(weekday, hour)}: ${text}${isNow ? ' (now)' : ''}`}
                                        className="h-4 sm:h-6 rounded-[2px] p-0"
                                        style={{
                                            backgroundColor: value === null ? 'transparent' : rampColor(value, max),
                                            outline: isNow ? `2px solid ${chart.ink}` : undefined,
                                            outlineOffset: -1
                                        }}
                                    >
                                        <span className="sr-only">{text}{isNow ? ', now' : ''}</span>
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default HourGrid;
