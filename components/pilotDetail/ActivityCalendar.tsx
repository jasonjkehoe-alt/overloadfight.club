import React, { useEffect, useRef } from 'react';
import { chart, rampColor } from '../../designTokens.js';
import { CALENDAR, WEEKDAYS, shiftDay } from '../../server/lib/gameParse.js';
import { dayLabel } from '../../server/lib/matchResult.js';
import { PilotCareer } from '../../services/apiService';
import RampLegend from '../RampLegend';

const CELL = 11;
const STEP = CELL + 2; // a 2px surface gap between days
const LEFT = 28; // weekday labels
const TOP = 14; // month labels

// The pilot's matches per fight-night day over CALENDAR.weeks weeks, one
// column per week from Monday, the latest week on the right (scrolled into
// view when the page is narrower than the year).
const ActivityCalendar: React.FC<{ calendar: PilotCareer['calendar'] }> = ({ calendar: { since, until, days } }) => {
    const scroller = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (scroller.current) scroller.current.scrollLeft = scroller.current.scrollWidth;
    }, []);

    const counts = new Map(days.map(d => [d.day, d.matches]));
    const max = Math.max(0, ...days.map(d => d.matches));
    const total = days.reduce((a, d) => a + d.matches, 0);
    const busiest = days.reduce<{ day: string; matches: number } | null>((best, d) => (!best || d.matches > best.matches ? d : best), null);
    const width = LEFT + CALENDAR.weeks * STEP;
    const height = TOP + 7 * STEP;

    const cells: React.ReactNode[] = [];
    const monthMarks: React.ReactNode[] = [];
    for (let week = 0; week < CALENDAR.weeks; week++) {
        for (let weekday = 0; weekday < 7; weekday++) {
            const day = shiftDay(since, week * 7 + weekday);
            if (day > until) break;
            const n = counts.get(day) ?? 0;
            if (day.endsWith('-01') || (week === 0 && weekday === 0)) {
                monthMarks.push(
                    <text key={day} x={LEFT + week * STEP} y={TOP - 4} fill={chart.label} fontSize="9">
                        {new Date(`${day}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })}
                    </text>
                );
            }
            cells.push(
                <rect key={day} x={LEFT + week * STEP} y={TOP + weekday * STEP} width={CELL} height={CELL} rx="2" fill={rampColor(n, max)}>
                    <title>{`${dayLabel(day)}: ${n} match${n === 1 ? '' : 'es'}`}</title>
                </rect>
            );
        }
    }

    return (
        <div>
            <h4 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Activity</h4>
            <p className="text-xs text-gray-400 mb-2">
                {total === 0
                    ? `No matches since ${dayLabel(since)}.`
                    : `${total.toLocaleString()} match${total === 1 ? '' : 'es'} on ${days.length.toLocaleString()} day${days.length === 1 ? '' : 's'} since ${dayLabel(since)}; busiest ${dayLabel(busiest!.day)} with ${busiest!.matches}.`}
            </p>
            <div ref={scroller} className="overflow-x-auto">
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img"
                    aria-label={`Matches per day over the last ${CALENDAR.weeks} weeks, Central time, a day running 06:00 to 06:00.`}>
                    {monthMarks}
                    {[0, 2, 4].map(weekday => (
                        <text key={weekday} x="0" y={TOP + weekday * STEP + CELL - 2} fill={chart.label} fontSize="9">{WEEKDAYS[weekday].slice(0, 3)}</text>
                    ))}
                    {cells}
                </svg>
            </div>
            <RampLegend className="justify-end mt-1" />
        </div>
    );
};

export default ActivityCalendar;
