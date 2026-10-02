import React, { useState, useRef, useEffect } from 'react';
import { 
    X, 
    Globe, 
    Search, 
    FileVideo, 
    Link2, 
    Play, 
    Pause, 
    Scissors, 
    Loader2, 
    Download, 
    Sparkles, 
    Volume2, 
    Radio, 
    Rocket, 
    Flame, 
    AlertCircle, 
    Check, 
    FileAudio,
    Film
} from 'lucide-react';
import { FFmpegService } from '../utils/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

const YouTubeIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
);

interface WebImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAudioReady: (file: File) => void;
}

type TabType = 'youtube' | 'archive' | 'video' | 'direct';

interface ArchiveTrack {
    name: string;
    title: string;
    length: number | null;
    size: number | null;
    directUrl: string;
    proxyUrl: string;
}

interface ArchiveItem {
    identifier: string;
    title: string;
    year: number | null;
    downloads: number;
    description: string;
    tracks: ArchiveTrack[];
}

const ARCHIVE_PRESETS = [
    { label: '🚀 NASA Apollo & Space Comms', query: 'apollo OR "space mission" OR nasa' },
    { label: '🤖 1950s Sci-Fi Radio', query: '"X Minus One" OR "Dimension X" OR "sci-fi radio"' },
    { label: '👾 Classic Arcade SFX', query: 'arcade sound effects OR "video game sfx"' },
    { label: '💥 Combat SFX & Lasers', query: '"laser sound effects" OR "explosion sfx" OR "sci-fi sfx"' },
    { label: '📻 Vintage Radio Thrillers', query: '"radio drama" OR "suspense" OR "the shadow"' }
];

export const WebImportModal: React.FC<WebImportModalProps> = ({ isOpen, onClose, onAudioReady }) => {
    const [activeTab, setActiveTab] = useState<TabType>('youtube');

    // 1. YouTube state
    const [ytUrl, setYtUrl] = useState('');
    const [ytLoading, setYtLoading] = useState(false);
    const [ytError, setYtError] = useState<string | null>(null);
    const [ytResult, setYtResult] = useState<{
        title: string;
        filename: string;
        mimeType: string;
        base64: string;
        size: number;
    } | null>(null);

    // 2. Archive state
    const [archiveQuery, setArchiveQuery] = useState('');
    const [archiveLoading, setArchiveLoading] = useState(false);
    const [archiveError, setArchiveError] = useState<string | null>(null);
    const [archiveResults, setArchiveResults] = useState<ArchiveItem[]>([]);
    const [loadingTrackName, setLoadingTrackName] = useState<string | null>(null);

    // 3. Video state
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoProcessing, setVideoProcessing] = useState(false);
    const [videoProgress, setVideoProgress] = useState<string | null>(null);
    const [videoError, setVideoError] = useState<string | null>(null);
    const [extractedAudio, setExtractedAudio] = useState<{ file: File; url: string } | null>(null);

    // 4. Direct URL state
    const [directUrl, setDirectUrl] = useState('');
    const [directLoading, setDirectLoading] = useState(false);
    const [directError, setDirectError] = useState<string | null>(null);
    const [directAudio, setDirectAudio] = useState<{ url: string; filename: string } | null>(null);

    // Shared Audio Preview Player
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const stopPreview = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        setPreviewUrl(null);
        setIsPlaying(false);
    };

    useEffect(() => {
        if (!isOpen) {
            stopPreview();
            setYtError(null);
            setArchiveError(null);
            setVideoError(null);
            setDirectError(null);
        }
    }, [isOpen]);

    // Cleanup object URLs
    useEffect(() => {
        return () => {
            if (extractedAudio) URL.revokeObjectURL(extractedAudio.url);
        };
    }, [extractedAudio]);

    const togglePlayPreview = (url: string) => {
        if (previewUrl === url && isPlaying) {
            stopPreview();
            return;
        }

        if (audioRef.current) {
            audioRef.current.pause();
        }

        const audio = new Audio(url);
        audioRef.current = audio;
        setPreviewUrl(url);
        setIsPlaying(true);

        audio.onended = () => {
            setIsPlaying(false);
            setPreviewUrl(null);
        };
        audio.onerror = () => {
            setIsPlaying(false);
            setPreviewUrl(null);
        };

        audio.play().catch(e => {
            console.error('Audio playback error:', e);
            setIsPlaying(false);
        });
    };

    // Helper: Convert base64 to File
    const base64ToFile = (base64: string, filename: string, mimeType: string): File => {
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType });
        return new File([blob], filename, { type: mimeType });
    };

    // ==========================================
    // TAB 1: YOUTUBE EXTRACTOR
    // ==========================================
    const handleExtractYouTube = async () => {
        if (!ytUrl.trim()) return;
        stopPreview();
        setYtLoading(true);
        setYtError(null);
        setYtResult(null);

        try {
            const res = await fetch('/api/import/youtube', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: ytUrl.trim() })
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || 'Failed to extract audio from video');
            }

            setYtResult(data);
        } catch (err: any) {
            setYtError(err.message || 'Error communicating with extraction engine');
        } finally {
            setYtLoading(false);
        }
    };

    const handleLoadYouTubeToEditor = () => {
        if (!ytResult) return;
        const file = base64ToFile(ytResult.base64, ytResult.filename, ytResult.mimeType);
        stopPreview();
        onAudioReady(file);
        onClose();
    };

    // ==========================================
    // TAB 2: INTERNET ARCHIVE EXPLORER
    // ==========================================
    const searchArchive = async (query: string) => {
        stopPreview();
        setArchiveLoading(true);
        setArchiveError(null);
        setArchiveResults([]);

        try {
            const res = await fetch(`/api/import/archive/search?q=${encodeURIComponent(query)}&rows=6`);
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || 'Failed to query Internet Archive');
            }
            setArchiveResults(data.results || []);
        } catch (err: any) {
            setArchiveError(err.message || 'Failed to connect to Internet Archive');
        } finally {
            setArchiveLoading(false);
        }
    };

    const handleLoadArchiveTrack = async (track: ArchiveTrack) => {
        stopPreview();
        setLoadingTrackName(track.name);
        try {
            const res = await fetch(track.proxyUrl);
            if (!res.ok) throw new Error('Failed to download track from archive proxy');
            const blob = await res.blob();
            const file = new File([blob], track.name, { type: blob.type || 'audio/mpeg' });
            onAudioReady(file);
            onClose();
        } catch (err: any) {
            setArchiveError(`Failed to load track "${track.name}": ${err.message}`);
        } finally {
            setLoadingTrackName(null);
        }
    };

    // ==========================================
    // TAB 3: LOCAL VIDEO FILE EXTRACTOR
    // ==========================================
    const handleVideoFileChange = (file: File) => {
        stopPreview();
        setVideoFile(file);
        setVideoError(null);
        setExtractedAudio(null);
    };

    const handleExtractVideoAudio = async () => {
        if (!videoFile) return;
        stopPreview();
        setVideoProcessing(true);
        setVideoProgress('Loading WebAssembly FFmpeg engine...');
        setVideoError(null);

        try {
            const ffmpeg = await FFmpegService.getInstance();
            setVideoProgress('Reading video data...');
            const data = await fetchFile(videoFile);
            
            const safeInputName = `input_${Date.now()}_video`;
            const safeOutputName = `output_${Date.now()}.wav`;

            await ffmpeg.writeFile(safeInputName, data);
            setVideoProgress('Extracting audio track (stripping video)...');

            // Strip video stream and convert audio directly to 44.1kHz WAV
            await ffmpeg.exec(['-i', safeInputName, '-vn', '-ar', '44100', '-ac', '2', safeOutputName]);

            setVideoProgress('Finalizing audio stream...');
            const audioData = await ffmpeg.readFile(safeOutputName);
            const audioBlob = new Blob([audioData as unknown as BlobPart], { type: 'audio/wav' });
            const cleanBaseName = videoFile.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
            const finalFile = new File([audioBlob], `${cleanBaseName}_audio.wav`, { type: 'audio/wav' });
            const previewBlobUrl = URL.createObjectURL(audioBlob);

            setExtractedAudio({ file: finalFile, url: previewBlobUrl });

            // Cleanup virtual files
            try {
                await ffmpeg.deleteFile(safeInputName);
                await ffmpeg.deleteFile(safeOutputName);
            } catch {}
        } catch (err: any) {
            console.error('Video extraction error:', err);
            setVideoError(err.message || 'Failed to extract audio track from video');
        } finally {
            setVideoProcessing(false);
            setVideoProgress(null);
        }
    };

    // ==========================================
    // TAB 4: DIRECT URL STREAMER
    // ==========================================
    const handleTestDirectUrl = async () => {
        if (!directUrl.trim()) return;
        stopPreview();
        setDirectLoading(true);
        setDirectError(null);
        setDirectAudio(null);

        try {
            const proxyUrl = `/api/import/proxy?url=${encodeURIComponent(directUrl.trim())}`;
            const testRes = await fetch(proxyUrl, { method: 'HEAD' });
            if (!testRes.ok) throw new Error(`URL returned HTTP ${testRes.status}: ${testRes.statusText}`);

            // Derive filename from URL
            const urlPath = new URL(directUrl.trim()).pathname;
            let filename = urlPath.split('/').pop() || 'web_audio.mp3';
            if (!filename.match(/\.(mp3|wav|ogg|flac|m4a|aac)$/i)) {
                filename += '.mp3';
            }

            setDirectAudio({ url: proxyUrl, filename });
        } catch (err: any) {
            setDirectError(err.message || 'Failed to reach direct audio URL');
        } finally {
            setDirectLoading(false);
        }
    };

    const handleLoadDirectAudio = async () => {
        if (!directAudio) return;
        stopPreview();
        setDirectLoading(true);
        try {
            const res = await fetch(directAudio.url);
            if (!res.ok) throw new Error('Failed to download audio file');
            const blob = await res.blob();
            const file = new File([blob], directAudio.filename, { type: blob.type || 'audio/mpeg' });
            onAudioReady(file);
            onClose();
        } catch (err: any) {
            setDirectError(err.message || 'Failed to load audio stream');
        } finally {
            setDirectLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in font-mono">
            <div className="bg-[#141414] border border-[#ff6600]/40 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-black/80 to-[#1a0e05]/80">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#ff6600]/20 border border-[#ff6600]/50 flex items-center justify-center text-[#ff6600] shadow-md">
                            <Globe className="w-5 h-5 animate-spin-slow" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white brand-font tracking-tight flex items-center gap-2">
                                IMPORT AUDIO FROM WEB & MEDIA
                                <span className="px-2 py-0.5 text-[9px] uppercase font-bold tracking-widest bg-[#ff6600]/10 border border-[#ff6600]/40 text-[#ff6600] rounded">
                                    Universal Grabber
                                </span>
                            </h2>
                            <p className="text-xs text-gray-400">
                                Rip YouTube clips, explore open-source archives, or extract audio from videos
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation Tabs */}
                <div className="flex border-b border-white/10 bg-black/40 px-6 gap-2 text-xs overflow-x-auto">
                    <button
                        onClick={() => { stopPreview(); setActiveTab('youtube'); }}
                        className={`flex items-center gap-2 py-3 px-4 border-b-2 font-bold transition-all whitespace-nowrap ${
                            activeTab === 'youtube'
                                ? 'border-[#ff6600] text-[#ff6600] bg-[#ff6600]/10'
                                : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5'
                        }`}
                    >
                        <YouTubeIcon className="w-4 h-4 text-red-500" />
                        <span>YouTube Ripper</span>
                    </button>

                    <button
                        onClick={() => { stopPreview(); setActiveTab('archive'); }}
                        className={`flex items-center gap-2 py-3 px-4 border-b-2 font-bold transition-all whitespace-nowrap ${
                            activeTab === 'archive'
                                ? 'border-[#ff6600] text-[#ff6600] bg-[#ff6600]/10'
                                : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5'
                        }`}
                    >
                        <Radio className="w-4 h-4 text-amber-400" />
                        <span>Internet Archive Vault</span>
                    </button>

                    <button
                        onClick={() => { stopPreview(); setActiveTab('video'); }}
                        className={`flex items-center gap-2 py-3 px-4 border-b-2 font-bold transition-all whitespace-nowrap ${
                            activeTab === 'video'
                                ? 'border-[#ff6600] text-[#ff6600] bg-[#ff6600]/10'
                                : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5'
                        }`}
                    >
                        <Film className="w-4 h-4 text-cyan-400" />
                        <span>Video File Extractor</span>
                    </button>

                    <button
                        onClick={() => { stopPreview(); setActiveTab('direct'); }}
                        className={`flex items-center gap-2 py-3 px-4 border-b-2 font-bold transition-all whitespace-nowrap ${
                            activeTab === 'direct'
                                ? 'border-[#ff6600] text-[#ff6600] bg-[#ff6600]/10'
                                : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5'
                        }`}
                    >
                        <Link2 className="w-4 h-4 text-emerald-400" />
                        <span>Direct Audio URL</span>
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    {/* TAB 1: YOUTUBE */}
                    {activeTab === 'youtube' && (
                        <div className="space-y-5">
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
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleExtractYouTube(); }}
                                    className="flex-1 px-4 py-3 bg-black/60 border border-white/20 focus:border-[#ff6600] rounded-xl text-white text-xs outline-none transition-all placeholder:text-gray-600"
                                />
                                <button
                                    onClick={handleExtractYouTube}
                                    disabled={ytLoading || !ytUrl.trim()}
                                    className="px-5 py-3 rounded-xl bg-[#ff6600] hover:bg-[#ff771a] disabled:opacity-50 text-black font-bold text-xs flex items-center gap-2 transition-all shadow-lg hover:shadow-[#ff6600]/30 shrink-0"
                                >
                                    {ytLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Extracting Audio...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Download className="w-4 h-4" />
                                            <span>Extract Audio</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Error Message */}
                            {ytError && (
                                <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                                    <div className="space-y-1">
                                        <p className="font-bold">Extraction Failed</p>
                                        <p className="text-gray-400 leading-relaxed">{ytError}</p>
                                    </div>
                                </div>
                            )}

                            {/* Extracted Result Card */}
                            {ytResult && (
                                <div className="p-5 rounded-xl bg-black/60 border border-green-500/40 space-y-4 animate-fade-in">
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

                            {/* Tips */}
                            <div className="text-[11px] text-gray-500 space-y-1">
                                <p className="text-gray-400 font-bold">💡 Taunt Ideas:</p>
                                <p>&bull; Movie quotes & famous lines (e.g. "I'll be back", "Game over man!")</p>
                                <p>&bull; Video game announcer callouts ("First Blood", "Denied", "Headshot")</p>
                                <p>&bull; Memes & viral audio soundbites</p>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: INTERNET ARCHIVE */}
                    {activeTab === 'archive' && (
                        <div className="space-y-5">
                            {/* Preset Inspiration Chips */}
                            <div className="space-y-2">
                                <label className="text-xs text-gray-400 flex items-center gap-1.5 font-bold">
                                    <Sparkles className="w-3.5 h-3.5 text-[#ff6600]" />
                                    <span>Public Domain Vault Presets (1-Click Browse):</span>
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {ARCHIVE_PRESETS.map((preset) => (
                                        <button
                                            key={preset.label}
                                            onClick={() => {
                                                setArchiveQuery(preset.query);
                                                searchArchive(preset.query);
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
                                        placeholder="Search public domain audio archives (e.g., 'apollo 11', 'space lasers', 'retro synth', 'radio drama')..."
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
                                        <span className="text-[10px] text-gray-500">Filtered for clean MP3/OGG soundbites</span>
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
                                                                        <div className="text-[10px] text-gray-500">
                                                                            {track.length ? `${Math.round(track.length)}s` : ''} 
                                                                            {track.size ? ` &bull; ${(track.size / 1024 / 1024).toFixed(1)}MB` : ''}
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
                    )}

                    {/* TAB 3: VIDEO FILE EXTRACTOR */}
                    {activeTab === 'video' && (
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
                                <div className="p-4 rounded-xl bg-black/60 border border-green-500/40 flex items-center justify-between gap-4 animate-fade-in">
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
                    )}

                    {/* TAB 4: DIRECT URL */}
                    {activeTab === 'direct' && (
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
                                <div className="p-4 rounded-xl bg-black/60 border border-green-500/40 flex items-center justify-between gap-4 animate-fade-in">
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
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 border-t border-white/10 bg-black/60 flex items-center justify-between text-[11px] text-gray-500">
                    <span>Overload Taunt Master &bull; Web & Media Pipeline</span>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
