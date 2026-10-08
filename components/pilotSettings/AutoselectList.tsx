import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { clsx } from 'clsx';
import { PilotAutoselectConfig } from '../../utils/pilotSettingsBridge';

// What differs between the two columns. Class strings stay whole so Tailwind finds them.
const VARIANTS = {
    primary: {
        dot: 'bg-[#ff6600]',
        title: 'PRIMARY WEAPONS (8)',
        topRow: 'bg-[#ff6600]/5 border-[#ff6600]/40 shadow-sm',
        stepper: 'text-gray-300 hover:text-[#ff6600]',
        topRank: 'bg-[#ff6600] text-black font-extrabold',
        topName: 'text-[#ff6600]',
        topBadge: 'bg-[#ff6600]/20 text-[#ff6600] border border-[#ff6600]/30',
        typeOf: (id: string) => ['CRUSHER', 'DRILLER', 'FLAK'].includes(id) ? 'Projectile Ammo' : 'Energy Weapon',
        noun: 'weapon'
    },
    secondary: {
        dot: 'bg-cyan-400',
        title: 'SECONDARY MISSILES (8)',
        topRow: 'bg-cyan-500/5 border-cyan-500/40 shadow-sm',
        stepper: 'text-gray-300 hover:text-cyan-400',
        topRank: 'bg-cyan-500 text-black font-extrabold',
        topName: 'text-cyan-400',
        topBadge: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
        typeOf: (id: string) => ['DEVASTATOR', 'TIMEBOMB', 'VORTEX', 'NOVA'].includes(id) ? 'Heavy Ordinance' : 'Guided / Standard',
        noun: 'missile'
    }
};

interface AutoselectListProps {
    variant: keyof typeof VARIANTS;
    items: PilotAutoselectConfig['primaries'] | PilotAutoselectConfig['secondaries'] | undefined;
    onMove: (index: number, direction: 'up' | 'down') => void;
    onToggleNeverSelect: (index: number) => void;
    onToggleCycle: (index: number) => void;
}

// One column of the autoselect tab: priority order and the two inclusion toggles per item.
export const AutoselectList: React.FC<AutoselectListProps> = ({ variant, items, onMove, onToggleNeverSelect, onToggleCycle }) => {
    const v = VARIANTS[variant];
    return (
        <div className="bg-[#121215] border border-gray-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span className={clsx("w-2.5 h-2.5 rounded-full", v.dot)}></span>
                        <span>{v.title}</span>
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
                {items?.map((weapon, idx) => {
                    const isHighest = idx === 0;
                    return (
                        <div
                            key={weapon.id}
                            className={clsx(
                                "flex items-center justify-between p-3 rounded-xl border transition-all",
                                isHighest
                                    ? v.topRow
                                    : "bg-black/40 border-white/5 hover:border-white/15"
                            )}
                        >
                            {/* Left: Reorder & Name */}
                            <div className="flex items-center gap-3">
                                {/* Priority Rank & Up/Down Steppers */}
                                <div className="flex items-center gap-1">
                                    <div className="flex flex-col gap-0.5">
                                        <button
                                            onClick={() => onMove(idx, 'up')}
                                            disabled={idx === 0}
                                            className={clsx(
                                                "p-1 rounded hover:bg-white/10 transition-all",
                                                idx === 0 ? "opacity-20 cursor-not-allowed" : v.stepper
                                            )}
                                            title="Move priority up"
                                        >
                                            <ArrowUp className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => onMove(idx, 'down')}
                                            disabled={idx === 7}
                                            className={clsx(
                                                "p-1 rounded hover:bg-white/10 transition-all",
                                                idx === 7 ? "opacity-20 cursor-not-allowed" : v.stepper
                                            )}
                                            title="Move priority down"
                                        >
                                            <ArrowDown className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <span className={clsx(
                                        "w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs",
                                        isHighest
                                            ? v.topRank
                                            : "bg-white/5 text-gray-300 border border-white/10"
                                    )}>
                                        #{idx + 1}
                                    </span>
                                </div>

                                {/* Name & Type */}
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className={clsx("text-xs font-bold tracking-wide", isHighest ? v.topName : "text-white")}>
                                            {weapon.name}
                                        </span>
                                        {isHighest && (
                                            <span className={clsx("text-[9px] uppercase font-bold px-1.5 rounded", v.topBadge)}>
                                                Top Pick
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-[10px] text-gray-500 font-mono">
                                        {v.typeOf(weapon.id)}
                                    </span>
                                </div>
                            </div>

                            {/* Right: Dual Inclusion Switches */}
                            <div className="flex items-center gap-2">
                                {/* Autoselect Inclusion Toggle */}
                                <button
                                    onClick={() => onToggleNeverSelect(idx)}
                                    className={clsx(
                                        "px-2.5 py-1 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5",
                                        !weapon.neverSelect
                                            ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50"
                                            : "bg-white/5 border-white/10 text-gray-500 hover:text-gray-300"
                                    )}
                                    title={!weapon.neverSelect ? `Autoselect: Active (+). Ship will swap to this ${v.noun}.` : "Autoselect: Excluded (-). Ship will not auto-swap."}
                                >
                                    <span className="text-[11px] font-mono">{!weapon.neverSelect ? '+' : '–'}</span>
                                    <span className="text-[11px]">Auto</span>
                                </button>

                                {/* Cycle Inclusion Toggle */}
                                <button
                                    onClick={() => onToggleCycle(idx)}
                                    className={clsx(
                                        "px-2.5 py-1 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5",
                                        weapon.cycle
                                            ? "bg-cyan-950/40 border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/50"
                                            : "bg-white/5 border-white/10 text-gray-500 hover:text-gray-300"
                                    )}
                                    title={weapon.cycle ? `Cycling: Included (+). Appears in Next/Prev ${v.noun} cycle.` : "Cycling: Excluded (-). Skipped during manual cycle."}
                                >
                                    <span className="text-[11px] font-mono">{weapon.cycle ? '+' : '–'}</span>
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
