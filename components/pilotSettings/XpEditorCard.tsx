import React from 'react';
import { Award, Save, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';

interface XpEditorCardProps {
    xpInput: string;
    setXpInput: (value: string) => void;
    handleSaveXP: () => void;
    xpSaving: boolean;
    gameRunning: boolean;
}

// Pilot XP (PS_XP2) quick editor.
export const XpEditorCard: React.FC<XpEditorCardProps> = ({ xpInput, setXpInput, handleSaveXP, xpSaving, gameRunning }) => {
    return (
        <div className="bg-[#121215] border border-gray-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/40 flex items-center justify-center text-purple-400">
                    <Award className="w-5 h-5" />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">PILOT EXPERIENCE (XP)</h4>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950/60 text-purple-300 border border-purple-500/30 uppercase tracking-widest">
                            Single-Player Only
                        </span>
                    </div>
                    <p className="text-xs text-gray-400">
                        Governs single-player campaign unlocks and upgrades in PS_XP2. Range: 0 &ndash; 9,999,999.
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
                <input
                    type="number"
                    min="0"
                    max="9999999"
                    value={xpInput}
                    onChange={(e) => setXpInput(e.target.value)}
                    className="bg-black/60 border border-white/20 focus:border-[#ff6600] rounded-xl px-3 py-1.5 text-xs text-white w-32 font-bold focus:outline-none"
                />
                <button
                    onClick={handleSaveXP}
                    disabled={xpSaving || gameRunning}
                    className={clsx(
                        "px-4 py-1.5 rounded-xl text-xs font-bold transition-all uppercase tracking-wider flex items-center gap-1.5",
                        gameRunning 
                            ? "bg-gray-800 text-gray-500 cursor-not-allowed" 
                            : "bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/20"
                    )}
                    title={gameRunning ? "Close Overload to change settings" : "Write XP to .xprefs"}
                >
                    {xpSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>Set XP</span>
                </button>
                <button
                    onClick={() => setXpInput('999999')}
                    className="px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-gray-400 hover:text-white"
                    title="Max Campaign XP"
                >
                    Max
                </button>
            </div>
        </div>
    );
};
