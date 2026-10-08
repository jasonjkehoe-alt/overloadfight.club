import React from 'react';
import { Globe, Mic, Keyboard } from 'lucide-react';

interface WorkstationHeaderProps {
    setIsWebImportModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setIsRecordingModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    showShortcuts: boolean;
    setShowShortcuts: React.Dispatch<React.SetStateAction<boolean>>;
}

export const WorkstationHeader: React.FC<WorkstationHeaderProps> = ({
    setIsWebImportModalOpen,
    setIsRecordingModalOpen,
    showShortcuts,
    setShowShortcuts,
}) => {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
            <div>
                <div className="flex items-center gap-3">
                    <h2 className="text-2xl md:text-3xl font-bold text-[#ff6600] tracking-tight brand-font">
                        TAUNT WORKSTATION
                    </h2>
                    <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-widest bg-[#ff6600]/15 border border-[#ff6600]/40 text-[#ff6600] rounded">
                        Auto-Mastered
                    </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                    Precision audio cutter &amp; auto-mastering pipeline for Overload 6-DOF
                </p>
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={() => setIsWebImportModalOpen(true)}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#ff6600]/15 hover:bg-[#ff6600]/25 border border-[#ff6600]/50 text-[#ff6600] text-xs font-bold transition-all shadow-lg hover:shadow-[#ff6600]/20"
                >
                    <Globe className="w-3.5 h-3.5 text-[#ff6600]" />
                    <span>Import Web / YouTube</span>
                </button>

                <button
                    onClick={() => setIsRecordingModalOpen(true)}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-red-950/40 hover:bg-red-900/40 border border-red-500/40 text-red-300 text-xs font-bold transition-all shadow-lg"
                >
                    <Mic className="w-3.5 h-3.5 text-red-400" />
                    <span>Record Voice</span>
                </button>

                <button
                    onClick={() => setShowShortcuts(!showShortcuts)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-all text-xs"
                    title="Keyboard Hotkeys & Studio Cheatsheet"
                >
                    <Keyboard className="w-3.5 h-3.5 text-gray-400" />
                    <span>Hotkeys</span>
                </button>
            </div>
        </div>
    );
};
