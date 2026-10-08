import React from 'react';
import { Play, Pause, RotateCcw, Repeat, Scissors } from 'lucide-react';
import { clsx } from 'clsx';

interface TransportBarProps {
    handleAuditionCut: () => void;
    isPlaying: boolean;
    activeAuditionMode: 'cut' | 'full';
    handlePlayFullTrack: () => void;
    handleRewindToCut: () => void;
    handleMoveCutToCursor: () => void;
    setLoopRegion: React.Dispatch<React.SetStateAction<boolean>>;
    loopRegion: boolean;
    nudgeRegion: (deltaSec: number) => void;
    nudgeStep: 10 | 100;
    setNudgeStep: React.Dispatch<React.SetStateAction<10 | 100>>;
}

export const TransportBar: React.FC<TransportBarProps> = ({
    handleAuditionCut,
    isPlaying,
    activeAuditionMode,
    handlePlayFullTrack,
    handleRewindToCut,
    handleMoveCutToCursor,
    setLoopRegion,
    loopRegion,
    nudgeRegion,
    nudgeStep,
    setNudgeStep,
}) => {
    return (
        <div className="bg-black/60 p-4 rounded-xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
            {/* Main Audition Controls */}
            <div className="flex flex-wrap items-center gap-2">
                {/* Primary: Audition Cut (Space) */}
                <button
                    onClick={handleAuditionCut}
                    className="px-4 py-2.5 bg-[#ff6600] hover:bg-[#ff8533] text-black font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-[#ff6600]/20 hover:scale-[1.02]"
                    title="Play / Pause the 0.5s–3.0s cut (Space)"
                >
                    {isPlaying && activeAuditionMode === 'cut' ? (
                        <Pause className="w-4 h-4 fill-black" />
                    ) : (
                        <Play className="w-4 h-4 fill-black" />
                    )}
                    <span>Audition Cut</span>
                    <kbd className="px-1 py-0.5 bg-black/20 text-black text-[10px] rounded font-mono">Space</kbd>
                </button>

                {/* Secondary: Play Full Track from Cursor */}
                <button
                    onClick={handlePlayFullTrack}
                    className="px-3 py-2.5 bg-white/5 hover:bg-white/15 border border-white/10 text-gray-300 hover:text-white rounded-xl flex items-center gap-1.5 transition-all text-xs"
                    title="Play track continuously from current cursor (Shift+Space)"
                >
                    {isPlaying && activeAuditionMode === 'full' ? (
                        <Pause className="w-3.5 h-3.5" />
                    ) : (
                        <Play className="w-3.5 h-3.5" />
                    )}
                    <span>Play Track</span>
                </button>

                {/* Rewind to Cut In-Point */}
                <button
                    onClick={handleRewindToCut}
                    className="px-2.5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white rounded-xl flex items-center gap-1.5 transition-all text-xs"
                    title="Rewind playhead to start of cut (R)"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Rewind</span>
                </button>

                {/* Move Cut Window to Current Cursor */}
                <button
                    onClick={handleMoveCutToCursor}
                    className="px-2.5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-[#ff6600] rounded-xl flex items-center gap-1 transition-all text-[11px]"
                    title="Center the 3.0s cut window right at the current listening cursor (C)"
                >
                    <Scissors className="w-3.5 h-3.5 text-[#ff6600]" />
                    <span>Snap Cut Here</span>
                </button>

                {/* Loop Cut Toggle */}
                <button
                    onClick={() => setLoopRegion(prev => !prev)}
                    className={clsx(
                        "px-2.5 py-2.5 rounded-xl border transition-all flex items-center gap-1.5 text-xs",
                        loopRegion 
                            ? "bg-[#ff6600]/20 border-[#ff6600]/60 text-[#ff6600]" 
                            : "bg-white/5 border-white/10 text-gray-400 hover:text-gray-200"
                    )}
                    title={loopRegion ? "Loop Cut is ON (L)" : "Single-Shot Cut is ON (L)"}
                >
                    <Repeat className="w-3.5 h-3.5" />
                    <span>{loopRegion ? 'Loop: On' : 'Loop: Off'}</span>
                </button>
            </div>

            {/* Consolidated Micro-Nudge Precision Stepper */}
            <div className="flex items-center gap-1 bg-black/50 px-2.5 py-1.5 rounded-xl border border-white/10 text-xs">
                <span className="text-gray-400 text-[11px] mr-1">Nudge:</span>
                <button
                    onClick={() => nudgeRegion(-nudgeStep / 1000)}
                    className="w-6 h-6 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-gray-200 font-bold text-xs"
                    title={`Nudge cut left by ${nudgeStep}ms`}
                >
                    &minus;
                </button>
                <button
                    onClick={() => setNudgeStep(prev => prev === 10 ? 100 : 10)}
                    className="px-2 py-0.5 rounded-md bg-[#ff6600]/15 hover:bg-[#ff6600]/25 border border-[#ff6600]/30 text-[#ff6600] font-bold text-[11px]"
                    title="Click to toggle nudge step (10ms / 100ms)"
                >
                    {nudgeStep}ms
                </button>
                <button
                    onClick={() => nudgeRegion(nudgeStep / 1000)}
                    className="w-6 h-6 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-gray-200 font-bold text-xs"
                    title={`Nudge cut right by ${nudgeStep}ms`}
                >
                    +
                </button>
            </div>
        </div>
    );
};
