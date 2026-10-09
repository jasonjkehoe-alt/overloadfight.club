import React from 'react';
import DuelLadder from './ladders/DuelLadder';
import ObjectiveBoard, { LABEL } from './ladders/ObjectiveBoard';
import { useQueryParam } from '../hooks/useLocation';
import { DUEL_HINT, OBJECTIVE_MODES } from '../server/lib/gameParse.js';

type Mode = keyof typeof OBJECTIVE_MODES;
type BoardId = 'duels' | Lowercase<Mode>;
// the duel ladder, then one board per objective mode in gameParse.js
const BOARDS: { id: BoardId; mode: Mode | null; label: string; blurb: string }[] = [
    { id: 'duels', mode: null, label: '1v1 duels', blurb: DUEL_HINT },
    ...(Object.keys(OBJECTIVE_MODES) as Mode[]).map(mode => {
        const { label, fields } = OBJECTIVE_MODES[mode];
        const counts = fields.map(f => LABEL[f].toLowerCase());
        return { id: mode.toLowerCase() as Lowercase<Mode>, mode, label, blurb: `${counts.slice(0, -1).join(', ')} and ${counts[counts.length - 1]} as the tracker counts them per pilot, over ranked ${label} matches.` };
    })
];
const BOARD_IDS = BOARDS.map(b => b.id);

// /ladders (S16): the 1v1 duel ladder and the CTF and Monsterball objective
// boards, the board in ?board= (duels left out of the URL).
const Ladders: React.FC = () => {
    const [board, setBoard] = useQueryParam('board', 'duels', BOARD_IDS);
    const current = BOARDS.find(b => b.id === board)!;

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-surface-raised to-black p-5 sm:p-8 rounded-card border border-line">
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 brand-font">Ladders</h1>
                <p className="text-gray-400 max-w-2xl text-sm font-mono">The 1v1 duel ladder and the objective boards for CTF and Monsterball.</p>
                <p className="text-gray-500 max-w-2xl text-xs font-mono mt-2">{current.blurb}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Board">
                {BOARDS.map(b => (
                    <button key={b.id} onClick={() => setBoard(b.id)} aria-pressed={board === b.id}
                        className={`px-3 py-1.5 text-xs font-mono rounded-control border transition-colors ${board === b.id ? 'bg-brand/10 border-brand/50 text-brand' : 'bg-surface-raised border-gray-700 text-gray-400 hover:text-white'}`}>
                        {b.label}
                    </button>
                ))}
            </div>

            {current.mode ? <ObjectiveBoard mode={current.mode} /> : <DuelLadder />}
        </div>
    );
};

export default Ladders;
