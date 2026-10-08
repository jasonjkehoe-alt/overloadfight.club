import React from 'react';
import { Download, CheckCircle2, HardDrive } from 'lucide-react';
import { clsx } from 'clsx';

interface ExportConsoleProps {
    tauntName: string;
    setTauntName: React.Dispatch<React.SetStateAction<string>>;
    estimatedSizeKb: number;
    handleExport: (installToGame?: boolean) => Promise<void>;
    isProcessing: boolean;
    ffmpegLoaded: boolean;
}

export const ExportConsole: React.FC<ExportConsoleProps> = ({
    tauntName,
    setTauntName,
    estimatedSizeKb,
    handleExport,
    isProcessing,
    ffmpegLoaded,
}) => {
    return (
        <div className="bg-black/70 p-5 rounded-xl border border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Taunt Filename Input */}
                <div className="w-full sm:w-80 space-y-1">
                    <label className="text-[11px] text-gray-400 flex items-center justify-between">
                        <span>Combat Taunt Filename:</span>
                        <span className="text-gray-500">.ogg will be added</span>
                    </label>
                    <div className="flex items-center bg-black border border-white/20 focus-within:border-[#ff6600] rounded-lg px-3 py-1.5">
                        <input
                            type="text"
                            value={tauntName}
                            onChange={(e) => setTauntName(e.target.value)}
                            placeholder="combat_taunt"
                            className="bg-transparent text-white text-xs w-full focus:outline-none"
                        />
                        <span className="text-xs text-gray-500 font-bold ml-1">.ogg</span>
                    </div>
                </div>

                {/* Overload Size Compliance Meter */}
                <div className="w-full sm:w-56 space-y-1 text-center sm:text-right">
                    <div className="flex justify-between sm:justify-end gap-2 text-[11px] text-gray-400">
                        <span>Estimated Size:</span>
                        <span className="text-[#ff6600] font-bold">~{estimatedSizeKb} kB</span>
                        <span className="text-gray-600">/ 128 kB limit</span>
                    </div>
                    <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden border border-white/10">
                        <div 
                            className={clsx(
                                "h-full rounded-full transition-all duration-300",
                                estimatedSizeKb > 120 ? "bg-red-500" : "bg-[#ff6600]"
                            )}
                            style={{ width: `${Math.min(100, (estimatedSizeKb / 128) * 100)}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Export Buttons: Install as Primary, Download as Secondary */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-white/5">
                <div className="flex items-center gap-2 text-[11px] text-gray-400">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <span>Strict Mono 44.1kHz &bull; 0.5–3.0s Cap &bull; Auto-Mastered Vorbis</span>
                </div>

                <div className="flex items-center gap-2.5">
                    {/* Secondary CTA: Download (.ogg) */}
                    <button
                        onClick={() => handleExport(false)}
                        disabled={isProcessing || !ffmpegLoaded}
                        className={clsx(
                            "flex items-center px-4 py-2.5 rounded-xl font-bold font-mono transition-all uppercase tracking-wider text-xs",
                            isProcessing || !ffmpegLoaded
                                ? "bg-white/5 text-gray-600 cursor-not-allowed border border-white/5"
                                : "bg-white/10 hover:bg-white/15 border border-white/20 text-gray-200 hover:text-white"
                        )}
                        title="Download Vorbis .ogg file directly"
                    >
                        {isProcessing ? (
                            <>
                                <div className="animate-spin mr-2 h-3.5 w-3.5 border-2 border-gray-400 border-t-transparent rounded-full" />
                                Mastering...
                            </>
                        ) : (
                            <>
                                <Download className="w-3.5 h-3.5 mr-2 text-gray-400" />
                                Download (.ogg)
                            </>
                        )}
                    </button>

                    {/* Primary CTA: Install to Overload */}
                    <button
                        onClick={() => handleExport(true)}
                        disabled={isProcessing || !ffmpegLoaded}
                        className={clsx(
                            "flex items-center px-6 py-3 rounded-xl font-bold font-mono transition-all uppercase tracking-wider text-xs",
                            isProcessing || !ffmpegLoaded
                                ? "bg-white/5 text-gray-500 cursor-not-allowed border border-white/5"
                                : "bg-[#ff6600] hover:bg-[#ff8533] text-black shadow-lg shadow-[#ff6600]/25 hover:shadow-[#ff6600]/40 hover:scale-[1.02]"
                        )}
                        title="Saves directly into your local Overload AudioTaunts directory"
                    >
                        <HardDrive className="w-4 h-4 mr-2" />
                        Install to Overload
                    </button>
                </div>
            </div>
        </div>
    );
};
