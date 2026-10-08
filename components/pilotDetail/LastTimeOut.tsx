import React from 'react';
import Link from '../Link';
import { urlFor } from '../../server/lib/siteRoutes.js';
import { COMBAT_RATIO_HINT, daysBetween } from '../../server/lib/gameParse.js';
import { dayLabel } from '../../server/lib/matchResult.js';
import { LastOut } from '../../services/apiService';

// Matches listed before "and N more"
const SHOWN = 5;
const OUTCOME = { win: 'W', loss: 'L', tie: 'T' } as const;

const ago = (day: string, today: string) => {
    const days = daysBetween(day, today);
    return days <= 0 ? 'today' : days === 1 ? 'yesterday' : `${days.toLocaleString()} days ago`;
};

// The pilot's latest fight-night day (gameParse.js lastOuting): the night's
// record and numbers, the rating it moved, and its matches.
const LastTimeOut: React.FC<{ lastOut: LastOut; today: string }> = ({ lastOut, today }) => {
    const { day, matches, wins, losses, ties, kills, deaths, assists, combatRatio, ratingChange, recap } = lastOut;
    return (
        <div>
            <h4 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Last time out</h4>
            <p className="text-sm text-white">
                {dayLabel(day)} <span className="text-gray-500">({ago(day, today)})</span>
                {recap && <> · <Link to={urlFor('fight-night', day)} className="text-brand hover:text-brand-hover underline">Fight Night card</Link></>}
            </p>
            <dl className="grid grid-cols-3 sm:grid-cols-6 gap-2 my-3 text-center">
                {[
                    { label: 'Matches', value: matches.length.toLocaleString() },
                    { label: 'Record', value: `${wins}W ${losses}L${ties ? ` ${ties}T` : ''}` },
                    { label: 'Kills', value: kills.toLocaleString() },
                    { label: 'Deaths', value: deaths.toLocaleString() },
                    { label: 'Combat Ratio', value: combatRatio.toFixed(2), hint: COMBAT_RATIO_HINT },
                    {
                        label: 'Rating',
                        hint: 'Rating change over the night; – when no match that night was rated.',
                        value: ratingChange === null ? '–' : (
                            <>
                                <span aria-hidden>{ratingChange > 0 ? '▲' : ratingChange < 0 ? '▼' : ''}</span>
                                <span className="sr-only">{ratingChange > 0 ? 'up ' : ratingChange < 0 ? 'down ' : 'no change '}</span>
                                {Math.abs(ratingChange).toFixed(1)}
                            </>
                        )
                    }
                ].map(({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) => (
                    <div key={label} className="bg-surface-raised rounded-control px-2 py-1.5" title={hint}>
                        <dt className="text-2xs text-gray-500 uppercase">{label}</dt>
                        <dd className="text-sm font-bold text-white">{value}</dd>
                    </div>
                ))}
            </dl>
            <p className="sr-only">{assists} assists.</p>
            <ul className="text-xs divide-y divide-line border-y border-line">
                {matches.slice(0, SHOWN).map(m => (
                    <li key={m.id}>
                        <Link to={urlFor('game-detail', m.id)} className="flex items-center gap-3 py-1.5 hover:bg-surface-raised">
                            <span className={`w-4 font-bold ${m.outcome === 'win' ? 'text-emerald-400' : m.outcome === 'loss' ? 'text-red-400' : 'text-gray-500'}`}>
                                {m.outcome ? OUTCOME[m.outcome] : '–'}
                                <span className="sr-only">{m.outcome ?? 'no result'}</span>
                            </span>
                            <span className="text-gray-300 truncate flex-1">{m.map ?? 'Unknown map'}</span>
                            <span className="text-gray-500 hidden sm:inline">{m.mode}</span>
                            <span className="text-gray-400 font-mono whitespace-nowrap">{m.kills}/{m.deaths}/{m.assists}</span>
                        </Link>
                    </li>
                ))}
            </ul>
            <p className="text-2xs text-gray-500 mt-1">
                Kills/deaths/assists per match{matches.length > SHOWN ? `; ${matches.length - SHOWN} more in the match list below` : ''}.
            </p>
        </div>
    );
};

export default LastTimeOut;
