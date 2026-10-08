import React from 'react';
import {
    FileVideo,
    Play,
    Pause,
    Scissors,
    Loader2,
    Download,
    AlertCircle,
    Check,
    Film
} from 'lucide-react';
import type { WebImportPreview } from '../../hooks/useWebImportPreview';
import type { WebImportVideo } from '../../hooks/useWebImportVideo';

interface VideoTabProps {
    video: WebImportVideo;
    preview: WebImportPreview;
    onAudioReady: (file: File) => void;
    onClose: () => void;
}

// TAB 3: LOCAL VIDEO FILE EXTRACTOR
export const VideoTab: React.FC<VideoTabProps> = ({ video, preview, onAudioReady, onClose }) => {
    const { previewUrl, isPlaying, stopPreview, togglePlayPreview } = preview;
    const {
        videoFile,
        videoProcessing,
        videoProgress,
        videoError,
        extractedAudio,
        handleVideoFileChange,
        handleExtractVideoAudio,
    } = video;

    return (
        <div className="space-y-5">
            <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-xs text-gray-300">
                <div className="flex items-center gap-2 font-bold text-cyan-400 mb-1">
                    <Film className="w-4 h-4" />
                    <span>Client-Side WebAssembly Video Audio Extractor</span>
                </div>
                Select or drop any video file (.mp4, .webm, .mov, .mkv). Our browser-based FFmpeg engine extracts the audio track without uploading your video to any remote server.
            </div>

            {/* Video File Drop Zone */}
            <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-white/15 hover:border-cyan-400/60 rounded-xl cursor-pointer bg-black/40 hover:bg-black/60 transition-all">
                <div className="flex flex-col items-center justify-center p-4 text-center">
                    <FileVideo className="w-8 h-8 mb-2 text-gray-500 group-hover:text-cyan-400" />
                    <p className="text-xs text-gray-300">
                        <span className="font-bold text-cyan-400">Click to choose</span> or drop a video file
                    </p>
                    <p className="text-[10px] text-gray-500 mt-1">
                        Supports MP4, WebM, MOV, MKV, AVI
                    </p>
                </div>
                <input
                    type="file"
                    className="hidden"
                    accept="video/*,.mkv"
                    onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                            handleVideoFileChange(e.target.files[0]);
                        }
                    }}
                />
            </label>

            {/* Selected Video Details & Action */}
            {videoFile && (
                <div className="p-4 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 truncate">
                        <div className="w-8 h-8 rounded bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
                            <Film className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                            <p className="text-xs font-bold text-white truncate">{videoFile.name}</p>
                            <p className="text-[10px] text-gray-400">
                                {(videoFile.size / 1024 / 1024).toFixed(1)} MB &bull; {videoFile.type || 'video'}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleExtractVideoAudio}
                        disabled={videoProcessing}
                        className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-bold text-xs flex items-center gap-2 transition-all shrink-0"
                    >
                        {videoProcessing ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>{videoProgress || 'Extracting...'}</span>
                            </>
                        ) : (
                            <>
                                <Download className="w-4 h-4" />
                                <span>Extract Audio Track</span>
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Video Error */}
            {videoError && (
                <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-3">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{videoError}</span>
                </div>
            )}

            {/* Extracted Audio Result */}
            {extractedAudio && (
                <div className="p-4 rounded-xl bg-black/60 border border-green-500/40 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-green-950/60 border border-green-500/40 flex items-center justify-center text-green-400 shrink-0">
                            <Check className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-white">{extractedAudio.file.name}</p>
                            <p className="text-[10px] text-green-400">Audio successfully extracted into uncompressed WAV</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => togglePlayPreview(extractedAudio.url)}
                            className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs flex items-center gap-1.5 transition-colors"
                        >
                            {isPlaying && previewUrl === extractedAudio.url ? (
                                <Pause className="w-3.5 h-3.5 text-[#ff6600]" />
                            ) : (
                                <Play className="w-3.5 h-3.5 text-[#ff6600]" />
                            )}
                            <span>Play</span>
                        </button>

                        <button
                            onClick={() => {
                                stopPreview();
                                onAudioReady(extractedAudio.file);
                                onClose();
                            }}
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
