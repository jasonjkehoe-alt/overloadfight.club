import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface DiagnosticsPanelProps {
    showDebug: boolean;
    setShowDebug: React.Dispatch<React.SetStateAction<boolean>>;
    debugLog: string[];
}

export const DiagnosticsPanel: React.FC<DiagnosticsPanelProps> = ({
    showDebug,
    setShowDebug,
    debugLog,
}) => {
    return (
        <div className="mt-8 pt-4 border-t border-white/5">
            <button 
                onClick={() => setShowDebug(!showDebug)}
                className="flex items-center justify-between w-full text-[11px] text-gray-500 hover:text-gray-300 py-1"
            >
                <span>FFmpeg WASM & DSP Diagnostics ({debugLog.length})</span>
                {showDebug ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {showDebug && (
                <div className="mt-2 p-3 bg-black/80 rounded-lg border border-white/5 text-[11px] text-gray-400 h-32 overflow-y-auto space-y-0.5">
                    {debugLog.map((log, i) => (
                        <div key={i}>{log}</div>
                    ))}
                </div>
            )}
        </div>
    );
};
