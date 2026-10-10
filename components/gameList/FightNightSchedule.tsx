import React, { useEffect, useState } from 'react';
import { CalendarDays, Check, Copy } from 'lucide-react';
import { fetchFightNightSchedule } from '../../services/apiService';
import { useLoad } from '../../hooks/useLoad';
import { useServerBrowser } from '../../hooks/useServerBrowser';
import { FIGHT_NIGHT_DAY, FIGHT_NIGHT_PING, browserPilots, onlineServers } from '../../server/lib/gameParse.js';
import { SCHEDULE, nextOccurrence, underWay, wallEnd } from '../../server/lib/fightNightSchedule.js';
import { clockLabel, countdown, dayLabel, eventWhen, itsOnLine } from '../../server/lib/matchResult.js';
import { urlFor } from '../../server/lib/siteRoutes.js';
import { ErrorState, Loading } from '../States';
import Link from '../Link';

// The countdown moves this often; the schedule itself is read once per mount.
const TICK_MS = 30000;

// The feed's URL with a copy button (the JoinIp pattern: the clipboard only
// exists on HTTPS and localhost, and the button says when the copy failed).
const CopyFeed: React.FC<{ url: string }> = ({ url }) => {
    const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
    useEffect(() => {
        if (status === 'idle') return;
        const timer = setTimeout(() => setStatus('idle'), 2000);
        return () => clearTimeout(timer);
    }, [status]);
    const copy = () => {
        if (!navigator.clipboard) return setStatus('failed');
        navigator.clipboard.writeText(url).then(() => setStatus('copied'), () => setStatus('failed'));
    };
    return (
        <button type="button" onClick={copy} title={`Copy ${url}`} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-control border border-gray-700 hover:border-brand text-2xs text-gray-400 hover:text-brand transition-colors">
            {status === 'copied' ? <span className="text-green-400 flex items-center gap-1"><Check size={12} /> Copied</span>
                : status === 'failed' ? <span className="text-red-400">Copy failed, select the link</span>
                : <><Copy size={12} /> Copy link</>}
        </button>
    );
};

// The dashboard's "Fight nights" card (S22): "it's on" at the ping's pilot
// count, "on now" inside a scheduled night, else the countdown to the next
// one; the next few nights; and the .ics feed to subscribe to. Nothing while
// nothing is scheduled and nobody is on.
const FightNightSchedule: React.FC = () => {
    const schedule = useLoad(fetchFightNightSchedule, []);
    const { games } = useServerBrowser();
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), TICK_MS);
        return () => clearInterval(timer);
    }, []);

    if (schedule.failed) return <ErrorState compact title="Could not load the fight-night schedule" onRetry={schedule.retry} />;
    if (!schedule.data) return <Loading compact label="Loading the schedule..." />;

    const { events, feed } = schedule.data;
    const timeZone = FIGHT_NIGHT_DAY.label;
    const pilots = games ? browserPilots(games) : 0;
    const itsOn = pilots >= FIGHT_NIGHT_PING.pilots;
    const next = nextOccurrence(events, now);
    if (!next && !itsOn) return null;

    const live = underWay(next, now);
    // the server with the most pilots, for the live link
    const busiest = games ? onlineServers(games).filter(s => s.row.players > 0).sort((a, b) => b.row.players - a.row.players)[0] : undefined;
    const coming = events.filter(one => Date.parse(one.end) > now).slice(0, SCHEDULE.listed);
    const feedUrl = `${window.location.origin}${feed}`;
    const webcal = `webcal://${window.location.host}${feed}`;

    return (
        <section aria-labelledby="fight-nights-title" className="bg-surface-card border border-line rounded-card p-4 space-y-3">
            <div className="flex flex-wrap justify-between items-center gap-2">
                <h3 id="fight-nights-title" className="text-gray-500 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                    <CalendarDays className="text-brand" size={14} aria-hidden /> Fight nights
                </h3>
                <div className="flex items-center gap-2 text-2xs font-mono">
                    <a href={webcal} className="text-brand hover:underline">Subscribe in your calendar</a>
                    <CopyFeed url={feedUrl} />
                </div>
            </div>

            <p role="status" className={`font-mono text-xs ${itsOn || live ? 'text-brand font-bold' : 'text-gray-300'}`}>
                {itsOn ? (
                    <>
                        {itsOnLine(pilots)}{live && next && ` ${next.title} is on now.`}
                        {busiest && <> <Link to={urlFor('live-game-detail', busiest.row.ip)} className="underline">Watch live</Link></>}
                    </>
                ) : live ? (
                    <>On now: {next!.title}, until {clockLabel(wallEnd(next)[1])} {timeZone}.</>
                ) : (
                    <>Next fight night: {next!.title}, {eventWhen(next)}, {countdown(Date.parse(next!.start) - now)}.</>
                )}
            </p>

            {coming.length > 0 && (
                <ul className="divide-y divide-line border border-line rounded-control text-xs font-mono">
                    {coming.map(one => (
                        <li key={`${one.id} ${one.date}`} className="flex flex-wrap justify-between gap-x-4 gap-y-1 px-3 py-2">
                            <span className="text-gray-200 truncate" title={one.notes || undefined}>{one.title}</span>
                            <span className="text-gray-400 whitespace-nowrap">{dayLabel(one.date)}, {clockLabel(one.time)}</span>
                        </li>
                    ))}
                </ul>
            )}
            <p className="text-2xs text-gray-500 font-mono">Times are {timeZone}. The calendar link carries every scheduled night and every recap: <span className="select-all text-gray-400 break-all">{feedUrl}</span></p>
        </section>
    );
};

export default FightNightSchedule;
