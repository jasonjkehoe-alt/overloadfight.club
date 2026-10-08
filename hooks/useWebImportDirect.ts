import { useState } from 'react';

interface UseWebImportDirectArgs {
    stopPreview: () => void;
    onAudioReady: (file: File) => void;
    onClose: () => void;
}

// Direct audio URL tab of the web import dialog: checks a URL through
// /api/import/proxy with a HEAD request, then downloads it through the proxy.
export function useWebImportDirect({ stopPreview, onAudioReady, onClose }: UseWebImportDirectArgs) {
    const [directUrl, setDirectUrl] = useState('');
    const [directLoading, setDirectLoading] = useState(false);
    const [directError, setDirectError] = useState<string | null>(null);
    const [directAudio, setDirectAudio] = useState<{ url: string; filename: string } | null>(null);

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

    return {
        directUrl,
        setDirectUrl,
        directLoading,
        directError,
        setDirectError,
        directAudio,
        handleTestDirectUrl,
        handleLoadDirectAudio,
    };
}

export type WebImportDirect = ReturnType<typeof useWebImportDirect>;
