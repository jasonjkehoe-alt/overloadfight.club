import React from 'react';
import {
    Globe,
    Search,
    Play,
    Pause,
    Scissors,
    Loader2,
    Sparkles,
    Volume2,
    Rocket,
    AlertCircle
} from 'lucide-react';
import type { WebImportPreview } from '../../hooks/useWebImportPreview';
import type { WebImportArchive } from '../../hooks/useWebImportArchive';

const ARCHIVE_PRESETS = [
    { label: '👾 Classic Arcade & Game SFX', query: 'arcade sound effects', category: 'sfx' as const },
    { label: '💥 Combat SFX & Lasers', query: 'laser explosion sound effects', category: 'sfx' as const },
    { label: '🚀 NASA Apollo Flight Comms', query: 'apollo 11 flight audio', category: 'vintage' as const },
    { label: '🤖 1950s Sci-Fi Radio Drama', query: '"X Minus One" radio drama', category: 'vintage' as const },
    { label: '📻 Vintage Radio Suspense', query: '"the shadow" radio', category: 'vintage' as const }
];

interface ArchiveTabProps {
    archive: WebImportArchive;
    preview: WebImportPreview;
}

// TAB 2: INTERNET ARCHIVE EXPLORER
export const ArchiveTab: React.FC<ArchiveTabProps> = ({ archive, preview }) => {
    const { previewUrl, isPlaying, togglePlayPreview } = preview;
    const {
        archiveQuery,
        setArchiveQuery,
        archiveCategory,
        setArchiveCategory,
        archiveLoading,
        archiveError,
        archiveResults,
        loadingTrackName,
        searchArchive,
        handleLoadArchiveTrack,
    } = archive;

    return (
        <div className="space-y-5">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-400 font-bold mr-1">Category:</span>
                <button
                    onClick={() => {
                        setArchiveCategory('sfx');
                        if (archiveQuery.trim()) searchArchive(archiveQuery, 'sfx');
                    }}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all text-xs flex items-center gap-1.5 ${
                        archiveCategory === 'sfx'
                            ? 'bg-[#ff6600] text-black shadow-md'
                            : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'
                    }`}
                >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Sound Effects & Clips</span>
                </button>
                <button
                    onClick={() => {
                        setArchiveCategory('vintage');
                        if (archiveQuery.trim()) searchArchive(archiveQuery, 'vintage');
                    }}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all text-xs flex items-center gap-1.5 ${
                        archiveCategory === 'vintage'
                            ? 'bg-[#ff6600] text-black shadow-md'
                            : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'
                    }`}
                >
                    <Rocket className="w-3.5 h-3.5" />
                    <span>NASA & Vintage Radio</span>
                </button>
                <button
                    onClick={() => {
                        setArchiveCategory('all');
                        if (archiveQuery.trim()) searchArchive(archiveQuery, 'all');
                    }}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all text-xs flex items-center gap-1.5 ${
                        archiveCategory === 'all'
                            ? 'bg-[#ff6600] text-black shadow-md'
                            : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'
                    }`}
                >
                    <Globe className="w-3.5 h-3.5" />
                    <span>All Audio Archives</span>
                </button>
            </div>

            {/* Preset Inspiration Chips */}
            <div className="space-y-2">
                <label className="text-xs text-gray-400 flex items-center gap-1.5 font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-[#ff6600]" />
                    <span>Curated Vault Presets (1-Click Browse):</span>
                </label>
                <div className="flex flex-wrap gap-2">
                    {ARCHIVE_PRESETS.map((preset) => (
                        <button
                            key={preset.label}
                            onClick={() => {
                                setArchiveCategory(preset.category);
                                setArchiveQuery(preset.query);
                                searchArchive(preset.query, preset.category);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-[#ff6600]/15 hover:border-[#ff6600]/40 border border-white/10 text-gray-300 hover:text-[#ff6600] text-xs transition-all flex items-center gap-1.5"
                        >
                            <span>{preset.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Search Bar */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
                    <input
                        type="text"
                        placeholder="Search public domain audio (e.g. 'laser explosion', 'arcade coin', 'apollo 11', 'robot voice')..."
                        value={archiveQuery}
                        onChange={(e) => setArchiveQuery(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') searchArchive(archiveQuery); }}
                        className="w-full pl-10 pr-4 py-3 bg-black/60 border border-white/20 focus:border-[#ff6600] rounded-xl text-white text-xs outline-none transition-all placeholder:text-gray-600"
                    />
                </div>
                <button
                    onClick={() => searchArchive(archiveQuery)}
                    disabled={archiveLoading || !archiveQuery.trim()}
                    className="px-5 py-3 rounded-xl bg-[#ff6600] hover:bg-[#ff771a] disabled:opacity-50 text-black font-bold text-xs flex items-center gap-2 transition-all shadow-lg hover:shadow-[#ff6600]/30 shrink-0"
                >
                    {archiveLoading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Searching Vault...</span>
                        </>
                    ) : (
                        <>
                            <Search className="w-4 h-4" />
                            <span>Search Vault</span>
                        </>
                    )}
                </button>
            </div>

            {/* Archive Error */}
            {archiveError && (
                <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-3">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{archiveError}</span>
                </div>
            )}

            {/* Archive Results */}
            {archiveResults.length > 0 && (
                <div className="space-y-4">
                    <div className="text-xs text-gray-400 flex items-center justify-between">
                        <span>Found {archiveResults.length} archive collections:</span>
                        <span className="text-[10px] text-gray-500">Clips ranked by keyword match & taunt duration</span>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {archiveResults.map((item) => (
                            <div
                                key={item.identifier}
                                className="p-4 rounded-xl bg-black/60 border border-white/10 hover:border-white/20 transition-all space-y-3"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                            <span>{item.title}</span>
                                            {item.year && (
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-gray-400">
                                                    {item.year}
                                                </span>
                                            )}
                                        </h4>
                                        <p className="text-[10px] text-gray-500 mt-0.5">
                                            Identifier: {item.identifier} &bull; {item.downloads.toLocaleString()} downloads
                                        </p>
                                    </div>
                                </div>

                                {/* Tracks list */}
                                {item.tracks.length > 0 ? (
                                    <div className="space-y-1.5 pt-2 border-t border-white/5">
                                        {item.tracks.map((track) => (
                                            <div
                                                key={track.name}
                                                className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-xs"
                                            >
                                                <div className="flex items-center gap-2.5 truncate max-w-md">
                                                    <button
                                                        onClick={() => togglePlayPreview(track.proxyUrl)}
                                                        className="p-1.5 rounded bg-black/60 hover:bg-[#ff6600] text-[#ff6600] hover:text-black transition-colors"
                                                        title="Preview track"
                                                    >
                                                        {previewUrl === track.proxyUrl && isPlaying ? (
                                                            <Pause className="w-3.5 h-3.5" />
                                                        ) : (
                                                            <Play className="w-3.5 h-3.5" />
                                                        )}
                                                    </button>
                                                    <div className="truncate">
                                                        <div className="font-bold text-gray-200 truncate">
                                                            {track.title}
                                                        </div>
                                                        <div className="text-[10px] text-gray-500 flex items-center gap-2 mt-0.5">
                                                            {track.length ? (
                                                                <span className="px-1.5 rounded bg-white/10 text-gray-300 font-mono">
                                                                    {Math.round(track.length)}s
                                                                </span>
                                                            ) : null}
                                                            {track.size ? (
                                                                <span>{(track.size / 1024 / 1024).toFixed(1)} MB</span>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => handleLoadArchiveTrack(track)}
                                                    disabled={loadingTrackName === track.name}
                                                    className="px-3 py-1.5 rounded-lg bg-[#ff6600]/20 hover:bg-[#ff6600] border border-[#ff6600]/40 text-[#ff6600] hover:text-black font-bold text-[11px] flex items-center gap-1.5 transition-all shrink-0"
                                                >
                                                    {loadingTrackName === track.name ? (
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    ) : (
                                                        <Scissors className="w-3.5 h-3.5" />
                                                    )}
                                                    <span>Load into Editor</span>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-[11px] text-gray-500 italic py-1">
                                        No standalone MP3/OGG sound clips found in this collection.
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
