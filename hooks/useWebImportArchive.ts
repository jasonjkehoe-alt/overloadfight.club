import { useState } from 'react';

export interface ArchiveTrack {
    name: string;
    title: string;
    length: number | null;
    size: number | null;
    directUrl: string;
    proxyUrl: string;
}

export interface ArchiveItem {
    identifier: string;
    title: string;
    year: number | null;
    downloads: number;
    description: string;
    tracks: ArchiveTrack[];
}

interface UseWebImportArchiveArgs {
    stopPreview: () => void;
    onAudioReady: (file: File) => void;
    onClose: () => void;
}

// Internet Archive tab of the web import dialog: search through
// /api/import/archive/search and loading a track through its proxy URL.
export function useWebImportArchive({ stopPreview, onAudioReady, onClose }: UseWebImportArchiveArgs) {
    const [archiveQuery, setArchiveQuery] = useState('');
    const [archiveCategory, setArchiveCategory] = useState<'sfx' | 'vintage' | 'all'>('sfx');
    const [archiveLoading, setArchiveLoading] = useState(false);
    const [archiveError, setArchiveError] = useState<string | null>(null);
    const [archiveResults, setArchiveResults] = useState<ArchiveItem[]>([]);
    const [loadingTrackName, setLoadingTrackName] = useState<string | null>(null);

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

    return {
        archiveQuery,
        setArchiveQuery,
        archiveCategory,
        setArchiveCategory,
        archiveLoading,
        archiveError,
        setArchiveError,
        archiveResults,
        loadingTrackName,
        searchArchive,
        handleLoadArchiveTrack,
    };
}

export type WebImportArchive = ReturnType<typeof useWebImportArchive>;
