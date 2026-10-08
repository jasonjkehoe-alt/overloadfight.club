import { useState, useRef } from 'react';

// The web import dialog's shared audio preview player: one Audio element at a
// time, used by every tab. togglePlayYouTubePreview (useWebImportYouTube)
// drives the same state and refs.
export function useWebImportPreview() {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewLoadingId, setPreviewLoadingId] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const activePreviewRequestRef = useRef<string | null>(null);

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

    return {
        previewUrl,
        setPreviewUrl,
        previewLoadingId,
        setPreviewLoadingId,
        isPlaying,
        setIsPlaying,
        audioRef,
        activePreviewRequestRef,
        stopPreview,
        togglePlayPreview,
    };
}

export type WebImportPreview = ReturnType<typeof useWebImportPreview>;
