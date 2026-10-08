import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { clsx } from 'clsx';
import { PilotAutoselectConfig } from '../../utils/pilotSettingsBridge';

interface AutoselectSecondaryListProps {
    autoselectConfig: PilotAutoselectConfig | null;
    moveSecondaryPriority: (index: number, direction: 'up' | 'down') => void;
    toggleSecondaryNeverSelect: (index: number) => void;
    toggleSecondaryCycle: (index: number) => void;
}

// Right column of the autoselect tab: secondary missile priority and inclusion toggles.
export const AutoselectSecondaryList: React.FC<AutoselectSecondaryListProps> = ({
    autoselectConfig,
    moveSecondaryPriority,
    toggleSecondaryNeverSelect,
    toggleSecondaryCycle
}) => {
    return (
        <div className="bg-[#121215] border border-gray-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                        <span>SECONDARY MISSILES (8)</span>
                    </h4>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                        Rank #1 is highest priority. Use ▲ ▼ buttons to reorder.
                    </p>
                </div>
                <span className="text-[10px] text-gray-500 font-mono">
                    Autoselect &bull; Cycle
                </span>
            </div>

            <div className="space-y-2.5">
                {autoselectConfig?.secondaries.map((missile, idx) => {
                    const isHighest = idx === 0;
                    return (
                        <div
                            key={missile.id}
                            className={clsx(
                                "flex items-center justify-between p-3 rounded-xl border transition-all",
                                isHighest
                                    ? "bg-cyan-500/5 border-cyan-500/40 shadow-sm"
                                    : "bg-black/40 border-white/5 hover:border-white/15"
                            )}
                        >
                            {/* Left: Reorder & Name */}
                            <div className="flex items-center gap-3">
                                {/* Priority Rank & Up/Down Steppers */}
                                <div className="flex items-center gap-1">
                                    <div className="flex flex-col gap-0.5">
                                        <button
                                            onClick={() => moveSecondaryPriority(idx, 'up')}
                                            disabled={idx === 0}
                                            className={clsx(
                                                "p-1 rounded hover:bg-white/10 transition-all",
                                                idx === 0 ? "opacity-20 cursor-not-allowed" : "text-gray-300 hover:text-cyan-400"
                                            )}
                                            title="Move priority up"
                                        >
                                            <ArrowUp className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => moveSecondaryPriority(idx, 'down')}
                                            disabled={idx === 7}
                                            className={clsx(
                                                "p-1 rounded hover:bg-white/10 transition-all",
                                                idx === 7 ? "opacity-20 cursor-not-allowed" : "text-gray-300 hover:text-cyan-400"
                                            )}
                                            title="Move priority down"
                                        >
                                            <ArrowDown className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <span className={clsx(
                                        "w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs",
                                        isHighest
                                            ? "bg-cyan-500 text-black font-extrabold"
                                            : "bg-white/5 text-gray-300 border border-white/10"
                                    )}>
                                        #{idx + 1}
                                    </span>
                                </div>

                                {/* Missile Name & Type */}
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className={clsx("text-xs font-bold tracking-wide", isHighest ? "text-cyan-400" : "text-white")}>
                                            {missile.name}
                                        </span>
                                        {isHighest && (
                                            <span className="text-[9px] uppercase font-bold px-1.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                                Top Pick
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-[10px] text-gray-500 font-mono">
                                        {['DEVASTATOR', 'TIMEBOMB', 'VORTEX', 'NOVA'].includes(missile.id) ? 'Heavy Ordinance' : 'Guided / Standard'}
                                    </span>
                                </div>
                            </div>

                            {/* Right: Dual Inclusion Switches */}
                            <div className="flex items-center gap-2">
                                {/* Autoselect Inclusion Toggle */}
                                <button
                                    onClick={() => toggleSecondaryNeverSelect(idx)}
                                    className={clsx(
                                        "px-2.5 py-1 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5",
                                        !missile.neverSelect
                                            ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50"
                                            : "bg-white/5 border-white/10 text-gray-500 hover:text-gray-300"
                                    )}
                                    title={!missile.neverSelect ? "Autoselect: Active (+). Ship will swap to this missile." : "Autoselect: Excluded (-). Ship will not auto-swap."}
                                >
                                    <span className="text-[11px] font-mono">{!missile.neverSelect ? '+' : '–'}</span>
                                    <span className="text-[11px]">Auto</span>
                                </button>

                                {/* Cycle Inclusion Toggle */}
                                <button
                                    onClick={() => toggleSecondaryCycle(idx)}
                                    className={clsx(
                                        "px-2.5 py-1 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5",
                                        missile.cycle
                                            ? "bg-cyan-950/40 border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/50"
                                            : "bg-white/5 border-white/10 text-gray-500 hover:text-gray-300"
                                    )}
                                    title={missile.cycle ? "Cycling: Included (+). Appears in Next/Prev missile cycle." : "Cycling: Excluded (-). Skipped during manual cycle."}
                                >
                                    <span className="text-[11px] font-mono">{missile.cycle ? '+' : '–'}</span>
                                    <span className="text-[11px]">Cycle</span>
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
