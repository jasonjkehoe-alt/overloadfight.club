import React from 'react';
import DuelLadder from './ladders/DuelLadder';
import ObjectiveBoard from './ladders/ObjectiveBoard';
import { useQueryParam } from '../hooks/useLocation';
import { DUEL_HINT, OBJECTIVE_MODES } from '../server/lib/gameParse.js';

const BOARDS = [
    { id: 'duels', label: '1v1 duels', blurb: DUEL_HINT },
    { id: 'ctf', label: 'CTF', blurb: `Captures, returns, pickups and carrier kills as the tracker counts them per pilot, over ranked ${OBJECTIVE_MODES.CTF.label} matches.` },
    { id: 'monsterball', label: 'Monsterball', blurb: `Goals, goal assists and blunders as the tracker counts them per pilot, over ranked ${OBJECTIVE_MODES.MONSTERBALL.label} matches.` }
] as const;
type Board = (typeof BOARDS)[number]['id'];
const BOARD_IDS = BOARDS.map(b => b.id);

// /ladders (S16): the 1v1 duel ladder and the CTF and Monsterball objective
// boards, the board in ?board= (duels left out of the URL).
const Ladders: React.FC = () => {
    const [board, setBoard] = useQueryParam<Board>('board', 'duels', BOARD_IDS);
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

            {board === 'duels' ? <DuelLadder /> : <ObjectiveBoard mode={board === 'ctf' ? 'CTF' : 'MONSTERBALL'} />}
        </div>
    );
};

export default Ladders;
