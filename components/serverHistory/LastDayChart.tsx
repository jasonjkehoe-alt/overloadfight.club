import React, { memo } from 'react';
import { chart } from '../../designTokens.js';
import { DAY_MS, HOUR_MS, SERVER_STATE, SNAPSHOT, clockHour, localClock } from '../../server/lib/gameParse.js';
import { ServerHistory } from '../../services/apiService';
import DetailsTable from '../DetailsTable';

const H = 80;
const MINUTES = DAY_MS / 60000;
// One missed tick breaks the line: ticks are about a minute apart, so a gap
// of a minute and a half is a tick that never came.
const BREAK_MS = 1.5 * SNAPSHOT.everyMs;

// The last 24 hours of a server, one tick a minute: pilots as a 2px line over
// the minutes the tracker listed it online, broken where it was offline or
// ticks are missing (the site was down or the tracker did not answer), and the
// minutes a match was running as a band under it. Hand-drawn SVG (no Recharts
// on this page), a title per hour on hover and the hours (from server_hours) as
// a table for the keyboard.
const LastDayChart: React.FC<{ ticks: ServerHistory['lastDay']; hours: ServerHistory['lastDayHours']; now: number }> = ({ ticks, hours, now }) => {
    const start = now - DAY_MS;
    const x = (at: number) => ((at - start) / DAY_MS) * MINUTES;
    // offline minutes are left out, so the line breaks across them like a missing tick
    const online = ticks.filter(t => t.online);
    const most = Math.max(0, ...online.map(t => t.players));
    const max = Math.max(4, most);
    const y = (players: number) => H - 2 - (players / max) * (H - 4);

    // the line, and under it one area per run of minutes with a match running
    let path = '';
    let band = '';
    online.forEach((t, i) => {
        const gap = i === 0 || t.at - online[i - 1].at > BREAK_MS;
        const last = i === online.length - 1 || online[i + 1].at - t.at > BREAK_MS;
        path += `${gap ? 'M' : 'L'}${x(t.at)},${y(t.players)}`;
        // a tick on its own is a dot (a moveto alone paints nothing)
        if (gap && last) path += 'h0.01';
        const match = t.state === SERVER_STATE.match;
        const inRun = !gap && online[i - 1].state === SERVER_STATE.match;
        if (match && !inRun) band += `M${x(t.at)},${H - 1}`;
        if (match) band += `L${x(t.at)},${y(t.players)}`;
        const ends = last || online[i + 1].state !== SERVER_STATE.match;
        if (match && ends) band += `L${x(t.at)},${H - 1}Z`;
    });
    // the axis: whole hours, so each label sits where that hour starts
    const firstHour = Math.ceil(start / HOUR_MS);

    const label = (hour: number) => clockHour(localClock(hour * HOUR_MS)!.hour);
    const hourText = (h: typeof hours[number]) =>
        `online ${h.online} of ${h.samples} minutes, up to ${h.peak} pilot${h.peak === 1 ? '' : 's'}, a match running ${h.match}`;

    return (
        <>
            <svg viewBox={`0 0 ${MINUTES} ${H}`} preserveAspectRatio="none" className="w-full h-24" role="img"
                aria-label={`Pilots on the server over the last 24 hours, at most ${most}.`}>
                <line x1="0" x2={MINUTES} y1={H - 1} y2={H - 1} stroke={chart.axis} strokeWidth="1" vectorEffect="non-scaling-stroke" />
                <line x1="0" x2={MINUTES} y1={y(max)} y2={y(max)} stroke={chart.grid} strokeWidth="1" vectorEffect="non-scaling-stroke" />
                <path d={band} fill={chart.series} opacity={0.2} />
                <path d={path} fill="none" stroke={chart.series} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                {hours.map(h => (
                    <rect key={h.hour} x={x(h.hour * HOUR_MS)} width={60} y="0" height={H} fill="transparent">
                        <title>{`${label(h.hour)}: ${hourText(h)}`}</title>
                    </rect>
                ))}
            </svg>
            <div className="relative h-4 text-2xs text-gray-500 mt-1" aria-hidden>
                {[0, 6, 12, 18].map(i => (
                    <span key={i} className="absolute" style={{ left: `${(x((firstHour + i) * HOUR_MS) / MINUTES) * 100}%` }}>{label(firstHour + i)}</span>
                ))}
                <span className="absolute right-0">now</span>
            </div>
            <p className="text-2xs text-gray-500 mt-1">
                The line is pilots on the server while the tracker listed it online, broken where it was offline or a tick is missing; the shaded minutes had a match running; top line {max} pilots. Central time.
            </p>
            <DetailsTable
                summary="The last 24 hours by hour"
                headers={['Hour', 'Online minutes', 'Most pilots', 'Match minutes']}
                rows={hours.filter(h => h.hour >= firstHour).reverse().map(h => ({
                    key: String(h.hour),
                    cells: [label(h.hour), `${h.online} of ${h.samples}`, h.peak, h.match]
                }))}
            />
        </>
    );
};

// memo: the page re-renders on every server-browser poll
export default memo(LastDayChart);
