import React from 'react';
import { Maximize, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';

interface TauntWindowBarProps {
    duration: number;
    regionStart: number;
    handleSetDuration: (newDur: number) => void;
}

export const TauntWindowBar: React.FC<TauntWindowBarProps> = ({
    duration,
    regionStart,
    handleSetDuration,
}) => {
    return (
        <div className="bg-[#121216] p-4 rounded-xl border border-white/10 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <Maximize className="w-3.5 h-3.5 text-[#ff6600]" />
                    <span className="text-white font-bold text-xs">Taunt Window:</span>
                    <span className="text-[#ff6600] font-bold text-sm font-mono">
                        {duration.toFixed(2)}s
                    </span>
                    <span className="text-gray-500 text-xs">/ 3.0s cap</span>
                    <span className="text-gray-600 text-xs hidden sm:inline">&bull;</span>
                    <span className="text-[11px] text-gray-400 hidden sm:inline">
                        [{regionStart.toFixed(2)}s &rarr; {(regionStart + duration).toFixed(2)}s]
                    </span>
                </div>

                {/* Quick-Pill Duration Presets (Friendlier than slider) */}
                <div className="flex items-center gap-1.5">
                    {[0.5, 1.0, 1.5, 2.0, 3.0].map((d) => (
                        <button
                            key={d}
                            onClick={() => handleSetDuration(d)}
                            className={clsx(
                                "px-3 py-1.5 rounded-lg text-xs font-bold border transition-all text-center",
                                Math.abs(duration - d) < 0.04
                                    ? "bg-[#ff6600] text-black border-[#ff6600] shadow-md shadow-[#ff6600]/20"
                                    : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
                            )}
                        >
                            {d === 3.0 ? '3.0s Max' : `${d.toFixed(1)}s`}
                        </button>
                    ))}
                </div>
            </div>

            {/* Automatic Mastering Status Line */}
            <div className="pt-2.5 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-400">
                <div className="flex items-center gap-2 text-gray-300">
                    <Sparkles className="w-3.5 h-3.5 text-[#ff6600]" />
                    <span className="font-semibold text-gray-200">Auto-Mastering:</span>
                    <span>-0.5 dBFS Limiter</span>
                    <span>&bull;</span>
                    <span>Anti-Click Fades</span>
                    <span>&bull;</span>
                    <span>Mono 44.1kHz Vorbis</span>
                </div>
                <div className="flex items-center gap-1.5 text-green-400 font-bold text-[10px] uppercase tracking-wider bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span>Always On</span>
                </div>
            </div>
        </div>
    );
};
