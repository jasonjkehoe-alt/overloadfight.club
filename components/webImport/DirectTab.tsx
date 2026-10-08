import React from 'react';
import {
    Globe,
    Link2,
    Play,
    Pause,
    Scissors,
    Loader2,
    AlertCircle,
    Check
} from 'lucide-react';
import type { WebImportPreview } from '../../hooks/useWebImportPreview';
import type { WebImportDirect } from '../../hooks/useWebImportDirect';

interface DirectTabProps {
    direct: WebImportDirect;
    preview: WebImportPreview;
}

// TAB 4: DIRECT URL STREAMER
export const DirectTab: React.FC<DirectTabProps> = ({ direct, preview }) => {
    const { previewUrl, isPlaying, togglePlayPreview } = preview;
    const {
        directUrl,
        setDirectUrl,
        directLoading,
        directError,
        directAudio,
        handleTestDirectUrl,
        handleLoadDirectAudio,
    } = direct;

    return (
        <div className="space-y-5">
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-xs text-gray-300">
                <div className="flex items-center gap-2 font-bold text-emerald-400 mb-1">
                    <Link2 className="w-4 h-4" />
                    <span>Direct Web Audio Link Streamer</span>
                </div>
                Have a direct link to an MP3, WAV, or OGG file online? Paste it here. Our local CORS proxy streams it directly into your workstation.
            </div>

            <div className="flex gap-2">
                <input
                    type="text"
                    placeholder="https://example.com/sound-effect.mp3"
                    value={directUrl}
                    onChange={(e) => setDirectUrl(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleTestDirectUrl(); }}
                    className="flex-1 px-4 py-3 bg-black/60 border border-white/20 focus:border-[#ff6600] rounded-xl text-white text-xs outline-none transition-all placeholder:text-gray-600"
                />
                <button
                    onClick={handleTestDirectUrl}
                    disabled={directLoading || !directUrl.trim()}
                    className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold text-xs flex items-center gap-2 transition-all shadow-lg shrink-0"
                >
                    {directLoading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Checking...</span>
                        </>
                    ) : (
                        <>
                            <Globe className="w-4 h-4" />
                            <span>Fetch Audio</span>
                        </>
                    )}
                </button>
            </div>

            {/* Direct Error */}
            {directError && (
                <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-3">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{directError}</span>
                </div>
            )}

            {/* Direct Result */}
            {directAudio && (
                <div className="p-4 rounded-xl bg-black/60 border border-green-500/40 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 truncate">
                        <div className="w-8 h-8 rounded bg-green-950/60 border border-green-500/40 flex items-center justify-center text-green-400 shrink-0">
                            <Check className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                            <p className="text-xs font-bold text-white truncate">{directAudio.filename}</p>
                            <p className="text-[10px] text-green-400">Remote audio stream verified and ready</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => togglePlayPreview(directAudio.url)}
                            className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs flex items-center gap-1.5 transition-colors"
                        >
                            {isPlaying && previewUrl === directAudio.url ? (
                                <Pause className="w-3.5 h-3.5 text-[#ff6600]" />
                            ) : (
                                <Play className="w-3.5 h-3.5 text-[#ff6600]" />
                            )}
                            <span>Play</span>
                        </button>

                        <button
                            onClick={handleLoadDirectAudio}
                            disabled={directLoading}
                            className="px-4 py-2 rounded-xl bg-[#ff6600] hover:bg-[#ff8533] text-black font-bold text-xs flex items-center gap-2 transition-all shadow-lg"
                        >
                            <Scissors className="w-4 h-4" />
                            <span>Load into Audio Editor</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
