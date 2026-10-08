import { useState, useRef } from 'react';
import type { WebImportPreview } from './useWebImportPreview';

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

interface UseWebImportYouTubeArgs {
    preview: WebImportPreview;
    onAudioReady: (file: File) => void;
    onClose: () => void;
}

// YouTube tab of the web import dialog: keyword search, URL extraction through
// /api/import/youtube, and the live audio preview of a search result.
export function useWebImportYouTube({ preview, onAudioReady, onClose }: UseWebImportYouTubeArgs) {
    const {
        previewUrl,
        setPreviewUrl,
        previewLoadingId,
        setPreviewLoadingId,
        isPlaying,
        setIsPlaying,
        audioRef,
        activePreviewRequestRef,
        stopPreview,
    } = preview;

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

    const ytClientCache = useRef<Map<string, { file: File; blobUrl: string; data: any }>>(new Map());

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

    return {
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
        setYtError,
        extractingId,
        ytResult,
        togglePlayYouTubePreview,
        handleSearchYouTube,
        handleExtractYouTube,
        handleLoadYouTubeToEditor,
    };
}

export type WebImportYouTube = ReturnType<typeof useWebImportYouTube>;
