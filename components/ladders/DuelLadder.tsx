import React from 'react';
import { Info, Swords } from 'lucide-react';
import { Loading, EmptyState, ErrorState } from '../States';
import Link, { LinkCell } from '../Link';
import { urlFor } from '../../server/lib/siteRoutes.js';
import { DUEL, DUEL_HINT, FIGHT_NIGHT_DAY_TEXT, RD_HINT } from '../../server/lib/gameParse.js';
import { fetchDuelLadder } from '../../services/apiService';
import { useLoad } from '../../hooks/useLoad';

// The 1v1 duel ladder (S16): every pilot with a duel by duel rating, the
// listed ones (DUEL.listedAfter duels or more) above the provisional ones.
// From the second row down, a link to the tape against the pilot one row
// above (S20).
const DuelLadder: React.FC = () => {
    const { data: ladder, failed, retry } = useLoad(fetchDuelLadder, []);

    if (failed) return <ErrorState title="Duel ladder unavailable" message="Could not load the duel ladder." onRetry={retry} />;
    if (!ladder) return <Loading label="Loading the duel ladder..." />;
    if (ladder.pilots.length === 0) {
        return <EmptyState card icon={Swords} title="No duels yet" message={DUEL_HINT} action={<Link to={urlFor('pilots')} className="text-xs text-brand underline hover:text-brand-hover font-bold">Open the leaderboard</Link>} />;
    }
    return (
        <div className="bg-surface-card border border-line rounded-card overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm font-mono">
                    <thead className="bg-surface-raised text-gray-500 text-xs uppercase">
                        <tr>
                            <th className="p-3 text-center w-10">#</th>
                            <th className="p-3">Pilot</th>
                            <th className="p-3 text-right" title={DUEL_HINT}><span className="inline-flex items-center gap-1">Rating <Info size={11} className="text-gray-500" aria-hidden /></span></th>
                            <th className="p-3 text-right hidden sm:table-cell" title={`Rating Deviation. ${RD_HINT}`}>RD</th>
                            <th className="p-3 text-right" title="Wins, losses and ties in duels">W-L-T</th>
                            <th className="p-3 text-right">Duels</th>
                            <th className="p-3 text-right hidden sm:table-cell" title={`The day of the last duel (${FIGHT_NIGHT_DAY_TEXT}).`}>Last duel</th>
                            <th className="p-3 text-center" title="The tale of the tape against the pilot one row above"><span className="sr-only">Tale of the tape against the pilot above</span><Swords size={13} className="inline" aria-hidden /></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                        {ladder.pilots.map((p, i) => {
                            const url = urlFor('pilot', p.name);
                            const provisional = p.status === 'provisional';
                            const first = i === ladder.listed;
                            const above = ladder.pilots[i - 1];
                            return (
                                <React.Fragment key={p.pilot}>
                                    {first && (
                                        <tr className="bg-surface-raised/60">
                                            <td colSpan={8} className="px-3 py-1.5 text-2xs uppercase tracking-wider text-gray-500">Provisional: under {DUEL.listedAfter} duels</td>
                                        </tr>
                                    )}
                                    <tr className={`hover:bg-surface-raised transition-colors ${provisional ? 'text-gray-400' : ''}`}>
                                        <LinkCell to={url} className="p-3 text-center text-gray-400 font-bold">{p.rank}</LinkCell>
                                        <LinkCell main to={url} className={`p-3 font-bold hover:text-brand ${provisional ? 'text-gray-300' : 'text-white'}`}>{p.name}</LinkCell>
                                        <LinkCell to={url} className={`p-3 text-right font-bold ${provisional ? 'text-gray-400' : 'text-brand'}`}>{Math.round(p.rating)}</LinkCell>
                                        <LinkCell to={url} cellClassName="hidden sm:table-cell" className="p-3 text-right text-gray-400">{Math.round(p.rd)}</LinkCell>
                                        <LinkCell to={url} className="p-3 text-right text-gray-300 whitespace-nowrap">{p.wins}-{p.losses}-{p.ties}</LinkCell>
                                        <LinkCell to={url} className="p-3 text-right text-gray-300">{p.matches.toLocaleString()}</LinkCell>
                                        <LinkCell to={url} cellClassName="hidden sm:table-cell" className="p-3 text-right text-gray-500 text-xs">{p.last}</LinkCell>
                                        <td className="p-0 text-center">
                                            {above && (
                                                <Link to={urlFor('tape', p.name, above.name)} className="block p-3 text-gray-500 hover:text-brand" title={`Tale of the tape: ${p.name} against ${above.name}`} aria-label={`Tale of the tape: ${p.name} against ${above.name}, one row above`}>
                                                    <Swords size={13} className="inline" aria-hidden />
                                                </Link>
                                            )}
                                        </td>
                                    </tr>
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <div className="px-4 py-3 border-t border-line flex flex-wrap justify-between gap-2 text-xs font-mono text-gray-500">
                <span>{ladder.listed.toLocaleString()} listed, {(ladder.pilots.length - ladder.listed).toLocaleString()} provisional, {ladder.day}</span>
                <Link to={urlFor('rankings')} className="text-brand hover:text-brand-hover underline">Power rankings</Link>
            </div>
        </div>
    );
};

export default DuelLadder;
