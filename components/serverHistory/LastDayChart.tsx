import React from 'react';
import { chart } from '../../designTokens.js';
import { DAY_MS, HOUR_MS, SERVER_STATE, SNAPSHOT, clockHour, localClock } from '../../server/lib/gameParse.js';
import { ServerTick } from '../../services/apiService';
import DetailsTable from '../DetailsTable';

const H = 80;
const MINUTES = DAY_MS / 60000;

// The last 24 hours of a server, one tick a minute: pilots as a 2px line,
// broken where ticks are missing (the site was down or the tracker did not
// answer), and the minutes a match was running as a band under it. Hand-drawn
// SVG (no Recharts on this page), a title per hour on hover and the hours as a
// table for the keyboard.
const LastDayChart: React.FC<{ ticks: ServerTick[]; now: number }> = ({ ticks, now }) => {
    const start = now - DAY_MS;
    const x = (at: number) => ((at - start) / DAY_MS) * MINUTES;
    const max = Math.max(4, ...ticks.map(t => t.players));
    const y = (players: number) => H - 2 - (players / max) * (H - 4);

    let path = '';
    ticks.forEach((t, i) => {
        const gap = i === 0 || t.at - ticks[i - 1].at > 2 * SNAPSHOT.everyMs;
        path += `${gap ? 'M' : 'L'}${x(t.at)},${y(t.players)}`;
    });

    // per Chicago clock hour, oldest first: the most pilots and the minutes with a match
    const firstHour = Math.floor(start / HOUR_MS);
    const hours = Array.from({ length: 25 }, (_, i) => ({ hour: firstHour + i, ticks: 0, peak: 0, match: 0 }));
    for (const t of ticks) {
        const h = hours[Math.floor(t.at / HOUR_MS) - firstHour];
        if (!h) continue;
        h.ticks++;
        h.peak = Math.max(h.peak, t.players);
        if (t.state === SERVER_STATE.match) h.match++;
    }
    const label = (hour: number) => clockHour(localClock(hour * HOUR_MS)!.hour);
    const hourText = (h: typeof hours[number]) =>
        h.ticks === 0 ? 'no ticks' : `up to ${h.peak} pilot${h.peak === 1 ? '' : 's'}, a match running ${h.match} of ${h.ticks} minutes`;

    return (
        <>
            <svg viewBox={`0 0 ${MINUTES} ${H}`} preserveAspectRatio="none" className="w-full h-24" role="img"
                aria-label={`Pilots on the server over the last 24 hours, at most ${Math.max(0, ...ticks.map(t => t.players))}.`}>
                <line x1="0" x2={MINUTES} y1={H - 1} y2={H - 1} stroke={chart.axis} strokeWidth="1" vectorEffect="non-scaling-stroke" />
                <line x1="0" x2={MINUTES} y1={y(max)} y2={y(max)} stroke={chart.grid} strokeWidth="1" vectorEffect="non-scaling-stroke" />
                {ticks.map(t => t.state === SERVER_STATE.match ? (
                    <rect key={t.at} x={x(t.at)} y={y(t.players)} width={SNAPSHOT.everyMs / 60000} height={H - 1 - y(t.players)} fill={chart.series} opacity={0.2} />
                ) : null)}
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
                rows={hours.filter(h => h.ticks > 0).reverse().map(h => ({
                    key: String(h.hour),
                    cells: [label(h.hour), h.peak, `${h.match} of ${h.ticks}`]
                }))}
            />
        </>
    );
};

export default LastDayChart;
