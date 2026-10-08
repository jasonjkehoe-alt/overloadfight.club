import React from 'react';
import { Save, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';

interface SaveActionBarProps {
    dirtyCount: number;
    handleDiscard: () => void;
    handleSaveAll: () => void;
    loading: boolean;
    gameRunning: boolean;
}

// Bottom Save & Discard Action Bar.
export const SaveActionBar: React.FC<SaveActionBarProps> = ({ dirtyCount, handleDiscard, handleSaveAll, loading, gameRunning }) => {
    return (
        <div className="bg-[#121215] border border-gray-800 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-4 z-20 backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs">
                {dirtyCount > 0 ? (
                    <span className="text-[#ff6600] font-bold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#ff6600] animate-ping"></span>
                        <span>{dirtyCount} unsaved {dirtyCount === 1 ? 'change' : 'changes'}</span>
                    </span>
                ) : (
                    <span className="text-gray-500">No unsaved changes</span>
                )}
            </div>

            <div className="flex items-center gap-3">
                {dirtyCount > 0 && (
                    <button
                        onClick={handleDiscard}
                        className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-400 hover:text-white transition-all"
                    >
                        Discard
                    </button>
                )}

                <button
                    onClick={handleSaveAll}
                    disabled={dirtyCount === 0 || loading || gameRunning}
                    className={clsx(
                        "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg",
                        (dirtyCount === 0 || gameRunning)
                            ? "bg-gray-800 text-gray-500 cursor-not-allowed shadow-none"
                            : "bg-[#ff6600] hover:bg-[#ff8533] text-black shadow-[#ff6600]/25"
                    )}
                    title={gameRunning ? "Close Overload to change settings" : "Write changes with mandatory backup"}
                >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Save Settings</span>
                </button>
            </div>
        </div>
    );
};
