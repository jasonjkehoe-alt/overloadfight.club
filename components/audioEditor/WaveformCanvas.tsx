import React from 'react';
import { Activity } from 'lucide-react';

interface WaveformCanvasProps {
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    zoomLevel: number;
    setZoomLevel: React.Dispatch<React.SetStateAction<number>>;
    containerRef: React.RefObject<HTMLDivElement | null>;
    timelineRef: React.RefObject<HTMLDivElement | null>;
}

export const WaveformCanvas: React.FC<WaveformCanvasProps> = ({
    isPlaying,
    currentTime,
    duration,
    zoomLevel,
    setZoomLevel,
    containerRef,
    timelineRef,
}) => {
    return (
        <div className="bg-[#09090b] p-4 rounded-xl border border-white/10 shadow-inner relative overflow-hidden">
            {/* Live Audition Mode Badge */}
            <div className="flex items-center justify-between pb-2 text-[11px] text-gray-400 border-b border-white/5">
                <div className="flex items-center gap-2">
                    {isPlaying ? (
                        <span className="flex items-center gap-1.5 text-green-400 text-xs font-semibold animate-pulse">
                            <Activity className="w-3.5 h-3.5" /> Playing ({currentTime.toFixed(2)}s)
                        </span>
                    ) : (
                        <span className="text-gray-400 text-xs">
                            Cut Window: <strong className="text-white font-mono">{duration.toFixed(2)}s</strong>
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1.5 bg-black/50 px-2 py-1 rounded-lg border border-white/10 text-xs">
                    <span className="text-gray-400 text-[11px] mr-1">Zoom:</span>
                    <button
                        onClick={() => setZoomLevel(prev => Math.max(20, prev - 25))}
                        disabled={zoomLevel <= 20}
                        className="w-5 h-5 flex items-center justify-center rounded bg-white/5 hover:bg-white/15 disabled:opacity-30 text-white font-bold text-xs"
                        title="Zoom Out"
                    >
                        &minus;
                    </button>
                    <button
                        onClick={() => setZoomLevel(prev => Math.min(350, prev + 25))}
                        disabled={zoomLevel >= 350}
                        className="w-5 h-5 flex items-center justify-center rounded bg-white/5 hover:bg-white/15 disabled:opacity-30 text-white font-bold text-xs"
                        title="Zoom In"
                    >
                        +
                    </button>
                </div>
            </div>

            {/* WaveSurfer Container */}
            <div ref={containerRef} className="w-full cursor-crosshair mt-2" />
            {/* DAW Timeline Plugin Container */}
            <div ref={timelineRef} className="w-full mt-2 text-[10px] text-gray-500 border-t border-white/10" />
        </div>
    );
};
