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
    Film,
    Clock,
    Eye,
    Layers,
    ExternalLink
} from 'lucide-react';
import { FFmpegService } from '../utils/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { useDialog } from '../hooks/useDialog';

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

export interface YouTubeSearchResult {
    id: string;
    title: string;
    url: string;
    duration: number | null;
    durationStr: string;
    uploader: string;
    thumbnail: string;
    viewCount?: number;
}

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
    { label: '👾 Classic Arcade & Game SFX', query: 'arcade sound effects', category: 'sfx' as const },
    { label: '💥 Combat SFX & Lasers', query: 'laser explosion sound effects', category: 'sfx' as const },
    { label: '🚀 NASA Apollo Flight Comms', query: 'apollo 11 flight audio', category: 'vintage' as const },
    { label: '🤖 1950s Sci-Fi Radio Drama', query: '"X Minus One" radio drama', category: 'vintage' as const },
    { label: '📻 Vintage Radio Suspense', query: '"the shadow" radio', category: 'vintage' as const }
];

export const WebImportModal: React.FC<WebImportModalProps> = ({ isOpen, onClose, onAudioReady }) => {
    const dialog = useDialog(isOpen, onClose);
    const [activeTab, setActiveTab] = useState<TabType>('youtube');

    // 1. YouTube state
    const [ytMode, setYtMode] = useState<'search' | 'url'>('search');
    const [ytQuery, setYtQuery] = useState('');
    const [ytUrl, setYtUrl] = useState('');
    const [ytSearchLoading, setYtSearchLoading] = useState(false);
    const [ytSearchResults, setYtSearchResults] = useState<YouTubeSearchResult[]>([]);
    const [ytLoading, setYtLoading] = useState(false);
    const [ytError, setYtError] = useState<string | null>(null);
    const [extractingId, setExtractingId] = useState<string | null>(null);
    const [ytResult, setYtResult] = useState<{
        title: string;
        filename: string;
        mimeType: string;
        base64: string;
        size: number;
    } | null>(null);

    // 2. Archive state
    const [archiveQuery, setArchiveQuery] = useState('');
    const [archiveCategory, setArchiveCategory] = useState<'sfx' | 'vintage' | 'all'>('sfx');
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
    const [previewLoadingId, setPreviewLoadingId] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const activePreviewRequestRef = useRef<string | null>(null);
    const ytClientCache = useRef<Map<string, { file: File; blobUrl: string; data: any }>>(new Map());

    const stopPreview = () => {
        activePreviewRequestRef.current = null;
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.removeAttribute('src');
            audioRef.current.load();
            audioRef.current = null;
        }
        setPreviewUrl(null);
        setIsPlaying(false);
        setPreviewLoadingId(null);
    };

    useEffect(() => {
        if (isOpen) {
            // Pre-warm backend extraction engine so first user click is instant
            fetch('/api/import/warmup').catch(() => {});
        } else {
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

    // Shared helper: Fetch YouTube audio via fast yt-dlp backend with client-side Blob caching & retry
    const fetchYouTubeAudioWithCache = async (urlToUse: string, videoId?: string) => {
        const cacheKey = videoId || urlToUse;
        const existing = ytClientCache.current.get(cacheKey);
        if (existing) {
            return existing;
        }

        let lastErr: any = null;
        for (let attempt = 1; attempt <= 2; attempt++) {
            try {
                const res = await fetch('/api/import/youtube', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: urlToUse })
                });

                const text = await res.text();
                let data: any;
                try {
                    data = JSON.parse(text);
                } catch {
                    throw new Error(`Server returned unexpected response (HTTP ${res.status})`);
                }

                if (!res.ok || !data.success) {
                    throw new Error(data.error || 'Failed to extract audio from video');
                }

                const file = base64ToFile(data.base64, data.filename, data.mimeType);
                const blobUrl = URL.createObjectURL(file);
                const entry = { file, blobUrl, data };
                ytClientCache.current.set(cacheKey, entry);
                if (videoId) ytClientCache.current.set(urlToUse, entry);
                return entry;
            } catch (err: any) {
                lastErr = err;
                if (attempt === 1) {
                    await new Promise(r => setTimeout(r, 500));
                }
            }
        }
        throw lastErr;
    };

    const togglePlayPreview = (url: string) => {
        if (previewUrl === url && isPlaying) {
            stopPreview();
            return;
        }

        stopPreview();

        const audio = new Audio();
        audio.crossOrigin = 'anonymous';
        audio.preload = 'auto';
        audioRef.current = audio;
        setPreviewUrl(url);

        audio.onplaying = () => {
            setIsPlaying(true);
        };

        audio.onpause = () => {
            setIsPlaying(false);
        };

        audio.onended = () => {
            setIsPlaying(false);
            setPreviewUrl(null);
        };
        audio.onerror = () => {
            setIsPlaying(false);
            setPreviewUrl(null);
        };

        audio.src = url;
        audio.play().catch(e => {
            console.error('Audio playback error:', e);
            setIsPlaying(false);
        });
    };

    // Live YouTube audio preview player using fast yt-dlp extraction + local Blob URL playback
    const togglePlayYouTubePreview = async (videoId: string) => {
        const previewKey = `yt:${videoId}`;
        if ((previewUrl === previewKey && isPlaying) || previewLoadingId === videoId) {
            stopPreview();
            return;
        }

        stopPreview();
        activePreviewRequestRef.current = videoId;
        setPreviewLoadingId(videoId);
        setPreviewUrl(previewKey);
        setYtError(null);

        try {
            const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
            const entry = await fetchYouTubeAudioWithCache(videoUrl, videoId);

            // If user stopped or switched preview while downloading, abort
            if (activePreviewRequestRef.current !== videoId) {
                return;
            }

            const audio = new Audio(entry.blobUrl);
            audioRef.current = audio;

            audio.onplaying = () => {
                setIsPlaying(true);
                setPreviewLoadingId(null);
            };

            audio.onpause = () => {
                setIsPlaying(false);
            };

            audio.onended = () => {
                setIsPlaying(false);
                setPreviewUrl(null);
                setPreviewLoadingId(null);
            };

            audio.onerror = (e) => {
                console.error('Audio preview playback error:', e);
                setIsPlaying(false);
                setPreviewUrl(null);
                setPreviewLoadingId(null);
                setYtError('Could not play audio preview in this browser.');
            };

            await audio.play();
            setIsPlaying(true);
            setPreviewLoadingId(null);
        } catch (err: any) {
            if (activePreviewRequestRef.current === videoId) {
                console.error('Audio preview error:', err);
                setIsPlaying(false);
                setPreviewUrl(null);
                setPreviewLoadingId(null);
                setYtError(err.message || 'Audio preview could not be loaded for this video.');
            }
        }
    };

    // ==========================================
    // TAB 1: YOUTUBE SEARCH & EXTRACTOR
    // ==========================================
    const handleSearchYouTube = async (queryToSearch?: string) => {
        const q = (queryToSearch !== undefined ? queryToSearch : ytQuery).trim();
        if (!q) return;

        // If the user entered or pasted a URL into the search box, extract directly!
        if (q.includes('youtube.com/') || q.includes('youtu.be/')) {
            setYtUrl(q);
            setYtMode('url');
            handleExtractYouTube(q, undefined, true);
            return;
        }

        stopPreview();
        setYtSearchLoading(true);
        setYtError(null);
        setYtSearchResults([]);

        try {
            const res = await fetch(`/api/import/youtube/search?q=${encodeURIComponent(q)}&limit=8`);
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || 'Failed to search YouTube');
            }
            setYtSearchResults(data.results || []);
        } catch (err: any) {
            setYtError(err.message || 'Error searching YouTube');
        } finally {
            setYtSearchLoading(false);
        }
    };

    const handleExtractYouTube = async (targetUrl?: string, videoId?: string, autoLoad = true) => {
        const urlToUse = (targetUrl || ytUrl).trim();
        if (!urlToUse) return;

        stopPreview();
        setYtLoading(true);
        if (videoId) setExtractingId(videoId);
        setYtError(null);
        setYtResult(null);

        try {
            const entry = await fetchYouTubeAudioWithCache(urlToUse, videoId);
            setYtResult(entry.data);

            // Automatically load into editor and close modal if requested!
            if (autoLoad) {
                const freshFile = new File([entry.file], entry.file.name, { type: entry.file.type });
                stopPreview();
                onAudioReady(freshFile);
                onClose();
            }
        } catch (err: any) {
            setYtError(err.message || 'Error communicating with extraction engine');
        } finally {
            setYtLoading(false);
            setExtractingId(null);
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
    const searchArchive = async (query: string, cat?: 'sfx' | 'vintage' | 'all') => {
        const q = query.trim();
        if (!q) return;

        const categoryToUse = cat || archiveCategory;
        stopPreview();
        setArchiveLoading(true);
        setArchiveError(null);
        setArchiveResults([]);

        try {
            const res = await fetch(`/api/import/archive/search?q=${encodeURIComponent(q)}&category=${categoryToUse}&rows=6`);
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

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 font-mono ${isOpen ? 'block' : 'hidden'}`}>
            <div {...dialog.props} className="bg-[#141414] border border-[#ff6600]/40 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-black/80 to-[#1a0e05]/80">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#ff6600]/20 border border-[#ff6600]/50 flex items-center justify-center text-[#ff6600] shadow-md">
                            <Globe className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 id={dialog.titleId} className="text-xl font-bold text-white brand-font tracking-tight flex items-center gap-2">
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
                        aria-label="Close"
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
                    )}

                    {/* TAB 2: INTERNET ARCHIVE */}
                    {activeTab === 'archive' && (
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
