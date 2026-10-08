import React from 'react';
import { Sliders, Check, Lock, User, Archive, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';

interface PilotSettingsHeaderProps {
    gameRunning: boolean;
    selectedPilot: string;
    setSelectedPilot: (pilot: string) => void;
    setActivePilot: (pilot: string) => void;
    pilots: string[];
    activePilot: string;
    handleBackupAll: () => void;
    backingUp: boolean;
    dirHandle: FileSystemDirectoryHandle | null;
    isServerNative: boolean;
    loadPilotFiles: (pilotName: string) => void;
    loading: boolean;
}

// Title, write-guard badge, pilot selector, Backup All Pilots and Reload.
export const PilotSettingsHeader: React.FC<PilotSettingsHeaderProps> = ({
    gameRunning,
    selectedPilot,
    setSelectedPilot,
    setActivePilot,
    pilots,
    activePilot,
    handleBackupAll,
    backingUp,
    dirHandle,
    isServerNative,
    loadPilotFiles,
    loading
}) => {
    return (
        <div className="bg-[#121215] border border-gray-800 rounded-2xl p-6 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl bg-[#ff6600]/10 border border-[#ff6600]/40 flex items-center justify-center text-[#ff6600] shadow-[0_0_20px_rgba(255,102,0,0.2)]">
                    <Sliders className="w-6 h-6" />
                </div>
                <div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold tracking-wider brand-font text-white">
                            PILOT <span className="text-[#ff6600]">SETTINGS</span> &amp; CLIENT CONFIG
                        </h2>
                        {gameRunning ? (
                            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-red-500/40 bg-red-950/40 text-red-400 text-xs font-semibold animate-pulse">
                                <Lock className="w-3 h-3" />
                                <span>Overload Running (Locked)</span>
                            </span>
                        ) : (
                            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-emerald-500/40 bg-emerald-950/40 text-emerald-400 text-xs font-semibold">
                                <Check className="w-3 h-3" />
                                <span>Ready / Safe to Write</span>
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                        Direct round-trip editor for .xprefs, .xprefsmod, and .xconfig bindings with automated backup.
                    </p>
                </div>
            </div>

            {/* Pilot Selector & Quick Backup */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                {/* Active Pilot Selector */}
                <div className="flex items-center gap-2 bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs">
                    <User className="w-4 h-4 text-[#ff6600]" />
                    <span className="text-gray-400 font-bold">Pilot:</span>
                    <select
                        value={selectedPilot}
                        onChange={(e) => {
                            setSelectedPilot(e.target.value);
                            setActivePilot(e.target.value);
                        }}
                        className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
                    >
                        {pilots.map(p => (
                            <option key={p} value={p} className="bg-[#121215] text-white">
                                {p} {p === activePilot ? '(Active)' : ''}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Backup All Pilots */}
                <button
                    onClick={handleBackupAll}
                    disabled={backingUp || (!dirHandle && !isServerNative)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-300 hover:text-white transition-all"
                    title="Create timestamped zip of all pilots in Pilot Backup/"
                >
                    <Archive className={clsx("w-3.5 h-3.5", backingUp && "animate-spin")} />
                    <span>{backingUp ? 'Archiving...' : 'Backup All Pilots'}</span>
                </button>

                {/* Reload Button */}
                <button
                    onClick={() => loadPilotFiles(selectedPilot)}
                    disabled={loading}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-all"
                    title="Reload from disk"
                >
                    <RefreshCw className={clsx("w-4 h-4", loading && "animate-spin")} />
                </button>
            </div>
        </div>
    );
};
