import React from 'react';
import {
    Search,
    Link2,
    Play,
    Pause,
    Scissors,
    Loader2,
    AlertCircle,
    ExternalLink
} from 'lucide-react';
import { YouTubeIcon } from './YouTubeIcon';
import type { WebImportPreview } from '../../hooks/useWebImportPreview';
import type { WebImportYouTube } from '../../hooks/useWebImportYouTube';

interface YouTubeTabProps {
    yt: WebImportYouTube;
    preview: WebImportPreview;
}

// TAB 1: YOUTUBE SEARCH & EXTRACTOR
export const YouTubeTab: React.FC<YouTubeTabProps> = ({ yt, preview }) => {
    const { previewUrl, previewLoadingId, isPlaying, stopPreview, togglePlayPreview } = preview;
    const {
        ytMode,
        setYtMode,
        ytQuery,
        setYtQuery,
        ytUrl,
        setYtUrl,
        ytSearchLoading,
        ytSearchResults,
        ytLoading,
        ytError,
        extractingId,
        ytResult,
        togglePlayYouTubePreview,
        handleSearchYouTube,
        handleExtractYouTube,
        handleLoadYouTubeToEditor,
    } = yt;

    return (
        <div className="space-y-5">
            {/* Mode Switcher: Search by Keyword vs Paste URL */}
            <div className="flex items-center justify-between gap-4 p-1.5 bg-black/60 rounded-xl border border-white/10">
                <div className="flex gap-1 flex-1">
                    <button
                        onClick={() => { stopPreview(); setYtMode('search'); }}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                            ytMode === 'search'
                                ? 'bg-[#ff6600] text-black shadow-md'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <Search className="w-3.5 h-3.5" />
                        <span>Search by Keyword</span>
                    </button>
                    <button
                        onClick={() => { stopPreview(); setYtMode('url'); }}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                            ytMode === 'url'
                                ? 'bg-[#ff6600] text-black shadow-md'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <Link2 className="w-3.5 h-3.5" />
                        <span>Paste Video URL</span>
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {ytError && (
                <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                        <p className="font-bold">Extraction Notice</p>
                        <p className="text-gray-400 leading-relaxed">{ytError}</p>
                    </div>
                </div>
            )}

            {/* Extracted Result Card (Prominent if ready) */}
            {ytResult && (
                <div className="p-5 rounded-xl bg-black/60 border border-green-500/40 space-y-4 shadow-xl shadow-green-950/20">
                    <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                            <span className="px-2 py-0.5 rounded bg-green-950/60 border border-green-500/40 text-green-400 text-[10px] uppercase font-bold tracking-wider">
                                Ready for Trimming
                            </span>
                            <h3 className="text-sm font-bold text-white leading-snug mt-1">
                                {ytResult.title}
                            </h3>
                            <p className="text-[11px] text-gray-400">
                                Size: {(ytResult.size / 1024 / 1024).toFixed(2)} MB &bull; Container: {ytResult.mimeType}
                            </p>
                        </div>

                        <button
                            onClick={handleLoadYouTubeToEditor}
                            className="px-5 py-2.5 rounded-xl bg-[#ff6600] hover:bg-[#ff8533] text-black font-bold text-xs flex items-center gap-2 transition-all shadow-xl hover:scale-105 shrink-0"
                        >
                            <Scissors className="w-4 h-4" />
                            <span>Load into Audio Editor</span>
                        </button>
                    </div>

                    {/* Inline Audio Preview */}
                    <div className="pt-2 border-t border-white/10 flex items-center gap-3">
                        <button
                            onClick={() => togglePlayPreview(`data:${ytResult.mimeType};base64,${ytResult.base64}`)}
                            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs flex items-center gap-2 transition-all"
                        >
                            {isPlaying ? <Pause className="w-3.5 h-3.5 text-[#ff6600]" /> : <Play className="w-3.5 h-3.5 text-[#ff6600]" />}
                            <span>{isPlaying ? 'Pause Preview' : 'Play Audio Stream'}</span>
                        </button>
                        <span className="text-[11px] text-gray-500">
                            Preview raw stream before bringing into the 3.0s trimmer
                        </span>
                    </div>
                </div>
            )}

            {/* MODE 1: SEARCH YOUTUBE */}
            {ytMode === 'search' && (
                <div className="space-y-4">
                    {/* Search Input Bar */}
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
                            <input
                                type="text"
                                placeholder="Search YouTube for quotes, memes, or sounds (or paste a link)..."
                                value={ytQuery}
                                onChange={(e) => setYtQuery(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleSearchYouTube(); }}
                                className="w-full pl-10 pr-4 py-3 bg-black/60 border border-white/20 focus:border-[#ff6600] rounded-xl text-white text-xs outline-none transition-all placeholder:text-gray-600"
                            />
                        </div>
                        <button
                            onClick={() => handleSearchYouTube()}
                            disabled={ytSearchLoading || !ytQuery.trim()}
                            className="px-5 py-3 rounded-xl bg-[#ff6600] hover:bg-[#ff771a] disabled:opacity-50 text-black font-bold text-xs flex items-center gap-2 transition-all shadow-lg hover:shadow-[#ff6600]/30 shrink-0"
                        >
                            {ytSearchLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Searching...</span>
                                </>
                            ) : (
                                <>
                                    <Search className="w-4 h-4" />
                                    <span>Search</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Search Results List */}
                    {ytSearchResults.length > 0 && (
                        <div className="space-y-3 pt-1">
                            <div className="flex items-center justify-between text-xs text-gray-400">
                                <span>Found {ytSearchResults.length} YouTube videos:</span>
                                <span className="text-[10px] text-gray-500">Preview audio or load directly into editor</span>
                            </div>

                            <div className="grid grid-cols-1 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
                                {ytSearchResults.map((video) => (
                                    <div
                                        key={video.id}
                                        className="p-2.5 rounded-xl bg-black/60 border border-white/10 hover:border-white/20 transition-all flex items-center justify-between gap-3 group"
                                    >
                                        <div className="flex items-center gap-3 truncate min-w-0">
                                            {/* Thumbnail with duration overlay */}
                                            <div className="relative w-24 h-14 rounded-lg overflow-hidden shrink-0 bg-neutral-900 border border-white/10">
                                                <img
                                                    src={video.thumbnail}
                                                    alt={video.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                    loading="lazy"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`;
                                                    }}
                                                />
                                                {video.durationStr && (
                                                    <span className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/80 text-[9px] font-bold text-gray-200">
                                                        {video.durationStr}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Title & Metadata */}
                                            <div className="truncate">
                                                <h4 className="text-xs font-bold text-white truncate leading-snug group-hover:text-[#ff6600] transition-colors">
                                                    {video.title}
                                                </h4>
                                                <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                                                    <span>{video.uploader}</span>
                                                    {video.viewCount && (
                                                        <>
                                                            <span>&bull;</span>
                                                            <span>{video.viewCount >= 1000000 ? `${(video.viewCount / 1000000).toFixed(1)}M views` : `${Math.round(video.viewCount / 1000)}k views`}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            {/* Live Audio Preview Stream */}
                                            <button
                                                type="button"
                                                onClick={() => togglePlayYouTubePreview(video.id)}
                                                className={`px-2.5 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 text-xs font-semibold ${
                                                    previewUrl?.includes(video.id) && isPlaying
                                                        ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                                                        : previewLoadingId === video.id
                                                        ? 'bg-[#ff6600]/20 border-[#ff6600]/50 text-[#ff6600]'
                                                        : 'bg-white/5 border-white/10 hover:bg-white/15 text-gray-300 hover:text-white'
                                                }`}
                                                title={previewUrl?.includes(video.id) && isPlaying ? "Pause Audio Preview" : "Play Audio Preview"}
                                            >
                                                {previewLoadingId === video.id ? (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#ff6600]" />
                                                ) : previewUrl?.includes(video.id) && isPlaying ? (
                                                    <Pause className="w-3.5 h-3.5 text-amber-400" />
                                                ) : (
                                                    <Play className="w-3.5 h-3.5 text-[#ff6600]" />
                                                )}
                                                <span className="text-[11px]">
                                                    {previewLoadingId === video.id
                                                        ? 'Loading...'
                                                        : previewUrl?.includes(video.id) && isPlaying
                                                        ? 'Pause'
                                                        : 'Preview'}
                                                </span>
                                            </button>

                                            <a
                                                href={video.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                                                title="Open on YouTube"
                                            >
                                                <ExternalLink className="w-3.5 h-3.5" />
                                            </a>

                                            <button
                                                type="button"
                                                onClick={() => handleExtractYouTube(video.url, video.id, true)}
                                                disabled={ytLoading && extractingId === video.id}
                                                className="px-3 py-1.5 rounded-lg bg-[#ff6600] hover:bg-[#ff8533] disabled:opacity-50 text-black font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shrink-0"
                                                title="Extract and immediately load into Taunt Audio Editor"
                                            >
                                                {ytLoading && extractingId === video.id ? (
                                                    <>
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                        <span>Loading into Editor...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Scissors className="w-3.5 h-3.5" />
                                                        <span>Load into Editor</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* MODE 2: DIRECT URL */}
            {ytMode === 'url' && (
                <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-gradient-to-r from-red-950/20 via-black to-black border border-red-500/20 text-xs text-gray-300">
                        <div className="flex items-center gap-2 font-bold text-red-400 mb-1">
                            <YouTubeIcon className="w-4 h-4" />
                            <span>Stream Audio Extraction via yt-dlp</span>
                        </div>
                        Paste any public YouTube video link or Shorts URL. We extract the raw audio stream directly to prepare it for your 3-second combat taunt.
                    </div>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="https://www.youtube.com/watch?v=... or youtu.be/..."
                            value={ytUrl}
                            onChange={(e) => setYtUrl(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleExtractYouTube(undefined, undefined, true); }}
                            className="flex-1 px-4 py-3 bg-black/60 border border-white/20 focus:border-[#ff6600] rounded-xl text-white text-xs outline-none transition-all placeholder:text-gray-600"
                        />
                        <button
                            onClick={() => handleExtractYouTube(undefined, undefined, true)}
                            disabled={ytLoading || !ytUrl.trim()}
                            className="px-5 py-3 rounded-xl bg-[#ff6600] hover:bg-[#ff771a] disabled:opacity-50 text-black font-bold text-xs flex items-center gap-2 transition-all shadow-lg hover:shadow-[#ff6600]/30 shrink-0"
                        >
                            {ytLoading && !extractingId ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Loading into Editor...</span>
                                </>
                            ) : (
                                <>
                                    <Scissors className="w-4 h-4" />
                                    <span>Load into Editor</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
