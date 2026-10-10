import React from 'react';
import { Flag } from 'lucide-react';
import { Loading, EmptyState, ErrorState } from '../States';
import Link, { LinkCell } from '../Link';
import { urlFor } from '../../server/lib/siteRoutes.js';
import { BOARD_ROWS, OBJECTIVE_FIELDS, OBJECTIVE_MODES, RANKED } from '../../server/lib/gameParse.js';
import { fetchObjectiveBoards } from '../../services/apiService';
import { useLoad } from '../../hooks/useLoad';
import BeltMark from '../BeltMark';

// each objective column's word, by pilot_objectives field
export const LABEL: Record<string, string> = Object.fromEntries(OBJECTIVE_FIELDS.map(f => [f.field, f.label]));

// A CTF or Monsterball board (S16): each pilot's objective counts over their
// ranked matches in that mode, by the mode's sort field (OBJECTIVE_MODES).
const ObjectiveBoard: React.FC<{ mode: keyof typeof OBJECTIVE_MODES }> = ({ mode }) => {
    const { data, failed, retry } = useLoad(fetchObjectiveBoards, []);
    const { label, fields, sort } = OBJECTIVE_MODES[mode];

    if (failed) return <ErrorState title={`${label} board unavailable`} message={`Could not load the ${label} board.`} onRetry={retry} />;
    if (!data) return <Loading label={`Loading the ${label} board...`} />;
    const pilots = data[mode] || [];
    if (pilots.length === 0) {
        return <EmptyState card icon={Flag} title={`No ranked ${label} match yet`} message={`The board counts ${label} matches with ${RANKED.pilots}+ pilots that ran ${RANKED.seconds} s or more.`} action={<Link to={urlFor('pilots')} className="text-xs text-brand underline hover:text-brand-hover font-bold">Open the leaderboard</Link>} />;
    }
    return (
        <div className="bg-surface-card border border-line rounded-card overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm font-mono">
                    <thead className="bg-surface-raised text-gray-500 text-xs uppercase">
                        <tr>
                            <th className="p-3 text-center w-10">#</th>
                            <th className="p-3">Pilot</th>
                            {fields.map(f => <th key={f} className={`p-3 text-right ${f === sort ? 'text-brand' : ''}`}>{LABEL[f]}</th>)}
                            <th className="p-3 text-right">Matches</th>
                            <th className="p-3 text-right hidden sm:table-cell" title="Wins, losses and ties by the team score">W-L-T</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                        {pilots.map(p => {
                            const url = urlFor('pilot', p.name);
                            return (
                                <tr key={p.pilot} className="hover:bg-surface-raised transition-colors">
                                    <LinkCell to={url} className="p-3 text-center text-gray-400 font-bold">{p.rank}</LinkCell>
                                    <LinkCell main to={url} className="p-3 font-bold text-white hover:text-brand">{p.name}<BeltMark name={p.name} /></LinkCell>
                                    {fields.map(f => <LinkCell key={f} to={url} className={`p-3 text-right ${f === sort ? 'font-bold text-brand' : 'text-gray-300'}`}>{Number(p[f]).toLocaleString()}</LinkCell>)}
                                    <LinkCell to={url} className="p-3 text-right text-gray-300">{p.matches.toLocaleString()}</LinkCell>
                                    <LinkCell to={url} cellClassName="hidden sm:table-cell" className="p-3 text-right text-gray-400 whitespace-nowrap">{p.wins}-{p.losses}-{p.ties}</LinkCell>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <div className="px-4 py-3 border-t border-line flex flex-wrap justify-between gap-2 text-xs font-mono text-gray-500">
                <span>{pilots.length === BOARD_ROWS ? `Top ${BOARD_ROWS} pilots` : `${pilots.length} pilot${pilots.length === 1 ? '' : 's'}`} by {LABEL[sort].toLowerCase()}, over ranked {label} matches</span>
                <Link to={urlFor('pilots')} className="text-brand hover:text-brand-hover underline">Full leaderboard</Link>
            </div>
        </div>
    );
};

export default ObjectiveBoard;
