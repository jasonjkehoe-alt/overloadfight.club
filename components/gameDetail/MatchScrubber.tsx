import React, { useId } from 'react';
import { GameData } from '../../types';
import { scoreboardAt, killScored } from '../../server/lib/gameParse.js';
import { clock } from '../../server/lib/matchResult.js';
import { secondaryButtonClass } from '../States';

interface MatchScrubberProps {
    game: GameData;
    // seconds the slider spans, from replayLengthOf()
    end: number;
    time: number | null;
    // scoreboardAt() at `time`, null at the end
    board: ReturnType<typeof scoreboardAt> | null;
    onChange: (seconds: number | null) => void;
}

// "BLUE 23–18 ORANGE", or "ZERGLING leads on 20", from a scoreboardAt()
// result, whose sides come in the order the final result ranks them. Empty
// for modes whose score is not kills.
function scoreLine(game: GameData, { team, sides }: NonNullable<MatchScrubberProps['board']>): string {
    if (!killScored(game)) return '';
    if (team) {
        return sides.length === 2
            ? `${sides[0].name} ${sides[0].score}–${sides[1].score} ${sides[1].name}`
            : sides.map(s => `${s.name} ${s.score}`).join(', ');
    }
    const top = Math.max(...sides.map(s => s.score));
    const leaders = sides.filter(s => s.score === top).map(s => s.name);
    if (top <= 0 && leaders.length === sides.length) return 'No score yet';
    return leaders.length === 1 ? `${leaders[0]} leads on ${top}` : `${leaders.join(', ')} level on ${top}`;
}

// The slider that replays the scoreboard through the match. Its far right is
// the final scoreboard (time null).
const MatchScrubber: React.FC<MatchScrubberProps> = ({ game, end, time, board, onChange }) => {
    const id = useId();
    const max = Math.ceil(end);
    const position = time ?? max;
    const score = time === null || !board ? '' : scoreLine(game, board);
    const label = time === null ? 'Final scoreboard' : `${clock(time)}${score ? `, ${score}` : ''}`;

    return (
        <div className="bg-surface-card border border-line rounded-card p-4 font-mono">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-3">
                <label htmlFor={id} className="text-xs text-gray-500 uppercase tracking-widest">Replay the scoreboard</label>
                <span className="text-sm text-white font-bold">{label}</span>
            </div>
            <input
                id={id}
                type="range"
                min={0}
                max={max}
                step={1}
                value={position}
                aria-valuetext={label}
                onChange={e => onChange(Number(e.target.value))}
                className="w-full accent-brand cursor-pointer"
            />
            <div className="flex items-center justify-between gap-2 mt-2 text-2xs text-gray-500">
                <span>0:00</span>
                <button
                    type="button"
                    onClick={() => onChange(null)}
                    disabled={time === null}
                    className={`${secondaryButtonClass} disabled:opacity-40 disabled:cursor-default`}
                >
                    Final score
                </button>
                <span>{clock(end)}</span>
            </div>
        </div>
    );
};

export default MatchScrubber;
