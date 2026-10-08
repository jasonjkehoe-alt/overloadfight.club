import React, { memo, useEffect, useRef } from 'react';
import { ArrowLeft, Radio, ServerOff } from 'lucide-react';
import { Loading, EmptyState, ErrorState, secondaryButtonClass } from './States';
import JoinIp from './JoinIp';
import Link from './Link';
import HourGrid, { when } from './HourGrid';
import RampLegend from './RampLegend';
import LastDayChart from './serverHistory/LastDayChart';
import { useQueryParam } from '../hooks/useLocation';
import { useLoad } from '../hooks/useLoad';
import { useServerBrowser } from '../hooks/useServerBrowser';
import { fetchServerHistory, ServerHistory as History } from '../services/apiService';
import { urlFor } from '../server/lib/siteRoutes.js';
import { regionLabel } from '../server/lib/serverRegions.js';
import { FIGHT_NIGHT_DAY_TEXT, SERVER_WINDOWS, SERVER_WINDOW_DEFAULT, atClock, localClock, shiftDay } from '../server/lib/gameParse.js';
import { dayLabel, percent } from '../server/lib/matchResult.js';

const WINDOWS = SERVER_WINDOWS.map(String);
const share = (n: number | null) => (n === null ? '–' : percent(n, 1));
const pilots = (n: number) => `${n.toFixed(1)} pilot${n === 1 ? '' : 's'} on average`;
// "Sat, Oct 3, 2026 night, 01:00" for an hour of a fight-night day
const atHour = (iso: string) => {
    const clock = localClock(iso)!;
    return atClock(dayLabel(clock.day), clock.hour);
};

const Card: React.FC<{ label: string; value: string; detail: string; title?: string }> = ({ label, value, detail, title }) => (
    <div className="bg-surface-card border border-line rounded-card p-4" title={title}>
        <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest">{label}</h3>
        <div className="text-3xl font-bold text-white mt-1 tabular-nums">{value}</div>
        <div className="text-2xs text-gray-500 mt-1">{detail}</div>
    </div>
);

// The numbers for the window: uptime, use, pilots in a match, the peak, and
// the peak hours.
const WindowStats: React.FC<{ data: History }> = memo(({ data }) => {
    const last = shiftDay(data.until, -1);
    if (data.samples === 0) {
        return (
            <EmptyState card compact icon={ServerOff} title={`No ticks in the last ${data.days} days`}
                message={`The site has stored this server since ${dayLabel(localClock(data.firstSeen!)!.day)}. A day counts once it has ended (${FIGHT_NIGHT_DAY_TEXT}).`} />
        );
    }
    return (
        <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card label="Uptime" value={share(data.uptime)} detail="of checked minutes online" title="The minutes the tracker listed this server online, over every minute the site checked it. A minute it was missing from the list counts as offline." />
                <Card label="In use" value={share(data.inUse)} detail="of online minutes in a match" title="The share of the online minutes with a match being played (not a lobby)." />
                <Card label="Pilots" value={data.avgPilots === null ? '–' : data.avgPilots.toFixed(1)} detail="on average in a match" title="Pilots on the server per minute, over the minutes a match was being played." />
                <Card label="Peak" value={data.peak ? String(data.peak.pilots) : '–'} detail={data.peak ? atHour(data.peak.at) : 'no pilots'} title="The most pilots in one minute, and the latest hour it happened." />
            </div>
            <section className="bg-surface-card border border-line rounded-card p-4" aria-labelledby="peak-hours-title">
                <h3 id="peak-hours-title" className="text-gray-500 font-bold text-xs uppercase tracking-widest mb-2">Peak hours</h3>
                <p className="text-xs text-gray-400 mb-3">
                    {data.busiest
                        ? <>Busiest: <span className="text-white font-bold">{when(data.busiest.weekday, data.busiest.hour)}</span>, {pilots(data.busiest.pilots)}.</>
                        : 'No pilots in this window.'}{' '}
                    {data.since} to {last}, {data.samples.toLocaleString()} server-minutes.
                </p>
                <HourGrid
                    cells={data.cells}
                    caption={`Average pilots per weekday and hour, ${data.since} to ${last}. ${FIGHT_NIGHT_DAY_TEXT}, so each row ends the next morning.`}
                    valueText={pilots}
                />
                <div className="flex flex-wrap items-center justify-between gap-2 mt-3 text-2xs text-gray-500">
                    <span>Pilots on the server per minute, idle minutes included. {FIGHT_NIGHT_DAY_TEXT}; the outlined hour is now.</span>
                    <RampLegend />
                </div>
            </section>
        </>
    );
});

// /server/:ip (S15): one server's stored history from the site's minute-by-
// minute record of the tracker's server browser. The window is ?days= (7, 30,
// 90 or 365 whole fight-night days before today; 30 left out of the URL).
// `onName` hands App the stored name for the tab title (App owns it), so a
// server that has left the live list is not titled by its IP.
const ServerHistory: React.FC<{ ip: string; onBack: () => void; onName: (name: string) => void }> = ({ ip, onBack, onName }) => {
    const [days, setDays] = useQueryParam('days', String(SERVER_WINDOW_DEFAULT), WINDOWS);
    const { data, failed, retry } = useLoad(() => fetchServerHistory(ip, Number(days)), [ip, days]);
    // the last answer, so the header stays while another window loads
    const shown = useRef<History | null>(null);
    if (data) shown.current = data;
    const listing = shown.current;
    const live = useServerBrowser().games?.find(s => s.server?.ip === ip);
    useEffect(() => {
        if (listing?.name) onName(listing.name);
    }, [listing?.name]);
    const playing = Boolean(live?.game && !live.game.inLobby);

    const back = (
        <button onClick={onBack} aria-label="Back" className="p-2 hover:bg-white/5 rounded-control transition-colors text-gray-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
        </button>
    );
    if (failed) {
        return <ErrorState title="Server history unavailable" message="Could not load this server's history." onRetry={retry}
            action={<button onClick={onBack} className={secondaryButtonClass}><ArrowLeft className="w-4 h-4" /> Back</button>} />;
    }
    if (!listing && !live) return <Loading label="Loading server history..." />;
    if (listing && !listing.firstSeen) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">{back}<h1 className="text-2xl font-bold text-white break-all">{ip}</h1></div>
                <EmptyState card icon={ServerOff} title="No history for this server"
                    message="The site has not seen it in the tracker's server browser, which it records once a minute." />
            </div>
        );
    }

    const name = listing?.name || live?.server?.name || ip;
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-4 min-w-0">
                    {back}
                    <div className="min-w-0">
                        <h1 className="text-2xl font-bold text-white tracking-tight break-words">{name}</h1>
                        <div className="text-sm text-gray-400 mt-1 flex flex-wrap gap-x-2">
                            {listing && <span>{regionLabel(listing.region)}</span>}
                            {listing?.version && <span className="font-mono"><span aria-hidden>· </span>{listing.version}</span>}
                        </div>
                        {listing?.notes && <p className="text-xs text-gray-500 mt-1 break-words">{listing.notes}</p>}
                        <div className="mt-2"><JoinIp ip={ip} /></div>
                    </div>
                </div>
                <Link to={urlFor('live-game-detail', ip)} className={`${secondaryButtonClass} self-start`}>
                    <Radio className={`w-4 h-4 ${playing ? 'text-green-400' : ''}`} /> {playing ? 'Watch the match live' : 'Live page'}
                </Link>
            </div>

            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Window">
                {WINDOWS.map(w => (
                    <button key={w} onClick={() => setDays(w)} aria-pressed={days === w}
                        className={`px-3 py-1.5 text-xs font-mono rounded-control border transition-colors ${days === w ? 'bg-brand/10 border-brand/50 text-brand' : 'bg-surface-raised border-gray-700 text-gray-400 hover:text-white'}`}>
                        {w === '365' ? 'Year' : `${w} days`}
                    </button>
                ))}
            </div>

            {!data ? <Loading compact label="Loading server history..." /> : (
                <>
                    <WindowStats data={data} />
                    <section className="bg-surface-card border border-line rounded-card p-4" aria-labelledby="last-day-title">
                        <h3 id="last-day-title" className="text-gray-500 font-bold text-xs uppercase tracking-widest mb-2">Last 24 hours</h3>
                        {data.lastDay.length === 0
                            ? <EmptyState compact icon={ServerOff} title="No ticks in the last 24 hours" />
                            : <LastDayChart ticks={data.lastDay} hours={data.lastDayHours} now={data.asOf} />}
                    </section>
                </>
            )}
        </div>
    );
};

export default ServerHistory;
