import React, { memo } from 'react';
import { chart } from '../../designTokens.js';
import { DAY_MS, HOUR_MS, SERVER_STATE, SNAPSHOT, clockHour, localClock } from '../../server/lib/gameParse.js';
import { ServerHistory } from '../../services/apiService';
import DetailsTable from '../DetailsTable';

const H = 80;
const MINUTES = DAY_MS / 60000;

// The last 24 hours of a server, one tick a minute: pilots as a 2px line,
// broken where ticks are missing (the site was down or the tracker did not
// answer), and the minutes a match was running as a band under it. Hand-drawn
// SVG (no Recharts on this page), a title per hour on hover and the hours (from
// server_hours) as a table for the keyboard.
const LastDayChart: React.FC<{ ticks: ServerHistory['lastDay']; hours: ServerHistory['lastDayHours']; now: number }> = ({ ticks, hours, now }) => {
    const start = now - DAY_MS;
    const x = (at: number) => ((at - start) / DAY_MS) * MINUTES;
    const most = Math.max(0, ...ticks.map(t => t.players));
    const max = Math.max(4, most);
    const y = (players: number) => H - 2 - (players / max) * (H - 4);

    // the line, and under it one area per run of minutes with a match running
    let path = '';
    let band = '';
    ticks.forEach((t, i) => {
        const gap = i === 0 || t.at - ticks[i - 1].at > 2 * SNAPSHOT.everyMs;
        path += `${gap ? 'M' : 'L'}${x(t.at)},${y(t.players)}`;
        const match = t.state === SERVER_STATE.match;
        const inRun = !gap && ticks[i - 1].state === SERVER_STATE.match;
        if (match && !inRun) band += `M${x(t.at)},${H - 1}`;
        if (match) band += `L${x(t.at)},${y(t.players)}`;
        const ends = i === ticks.length - 1 || ticks[i + 1].at - t.at > 2 * SNAPSHOT.everyMs || ticks[i + 1].state !== SERVER_STATE.match;
        if (match && ends) band += `L${x(t.at)},${H - 1}Z`;
    });

    const label = (hour: number) => clockHour(localClock(hour * HOUR_MS)!.hour);
    const hourText = (h: typeof hours[number]) =>
        `up to ${h.peak} pilot${h.peak === 1 ? '' : 's'}, a match running ${h.match} of ${h.samples} minutes`;

    return (
        <>
            <svg viewBox={`0 0 ${MINUTES} ${H}`} preserveAspectRatio="none" className="w-full h-24" role="img"
                aria-label={`Pilots on the server over the last 24 hours, at most ${most}.`}>
                <line x1="0" x2={MINUTES} y1={H - 1} y2={H - 1} stroke={chart.axis} strokeWidth="1" vectorEffect="non-scaling-stroke" />
                <line x1="0" x2={MINUTES} y1={y(max)} y2={y(max)} stroke={chart.grid} strokeWidth="1" vectorEffect="non-scaling-stroke" />
                <path d={band} fill={chart.series} opacity={0.2} />
                <path d={path} fill="none" stroke={chart.series} strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                {hours.map(h => (
                    <rect key={h.hour} x={x(h.hour * HOUR_MS)} width={60} y="0" height={H} fill="transparent">
                        <title>{`${label(h.hour)}: ${hourText(h)}`}</title>
                    </rect>
                ))}
            </svg>
            <div className="flex justify-between text-2xs text-gray-500 mt-1" aria-hidden>
                {[0, 6, 12, 18, 24].map(i => <span key={i}>{i === 24 ? 'now' : label(Math.floor((start + i * HOUR_MS) / HOUR_MS))}</span>)}
            </div>
            <p className="text-2xs text-gray-500 mt-1">
                The line is pilots on the server, the shaded minutes had a match running; top line {max} pilots. Central time.
            </p>
            <DetailsTable
                summary="The last 24 hours by hour"
                headers={['Hour', 'Most pilots', 'Match minutes']}
                rows={[...hours].reverse().map(h => ({
                    key: String(h.hour),
                    cells: [label(h.hour), h.peak, `${h.match} of ${h.samples}`]
                }))}
            />
        </>
    );
};

// memo: the page re-renders on every server-browser poll
export default memo(LastDayChart);
