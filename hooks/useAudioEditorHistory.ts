import React, { useState } from 'react';
import type WaveSurfer from 'wavesurfer.js';
import { getTaunts, deleteTaunt, updateTauntName } from '../utils/audioHistoryDb';
import type { SetMessage } from './useAudioEditorStatus';

export interface HistoryItem {
    id: string;
    name: string;
    date: number;
    blob: Blob;
}

interface UseAudioEditorHistoryOptions {
    wavesurferRef: React.RefObject<WaveSurfer | null>;
    previewAudioRef: React.RefObject<HTMLAudioElement | null>;
    setError: SetMessage;
    setExportSuccess: SetMessage;
}

// AudioEditor: the IndexedDB taunt history list and its item actions.
export function useAudioEditorHistory({ wavesurferRef, previewAudioRef, setError, setExportSuccess }: UseAudioEditorHistoryOptions) {
    // History & UI State
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [playingId, setPlayingId] = useState<string | null>(null);
    const [isPruning, setIsPruning] = useState(false);

    // Load Local IndexedDB History
    const loadHistory = async () => {
        try {
            const items = await getTaunts();
            setHistory(items.sort((a, b) => b.date - a.date));
        } catch (e) {
            console.error('Failed to load history', e);
        }
    };

    // History Item Actions
    const handleDownloadHistoryItem = (item: HistoryItem) => {
        const url = URL.createObjectURL(item.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = item.name;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleDeleteHistoryItem = async (id: string) => {
        if (window.confirm('Delete this taunt from your local history?')) {
            await deleteTaunt(id);
            await loadHistory();
        }
    };

    const handleSaveRename = async (id: string) => {
        if (editName.trim()) {
            await updateTauntName(id, editName.trim());
            await loadHistory();
            setEditingId(null);
        }
    };

    const handlePreviewHistory = (item: HistoryItem) => {
        if (playingId === item.id) {
            if (previewAudioRef.current) {
                previewAudioRef.current.pause();
                previewAudioRef.current = null;
            }
            setPlayingId(null);
        } else {
            if (previewAudioRef.current) previewAudioRef.current.pause();
            if (wavesurferRef.current && wavesurferRef.current.isPlaying()) {
                wavesurferRef.current.pause();
            }

            const url = URL.createObjectURL(item.blob);
            const audio = new Audio(url);
            audio.onended = () => {
                setPlayingId(null);
                URL.revokeObjectURL(url);
            };
            audio.play();
            previewAudioRef.current = audio;
            setPlayingId(item.id);
        }
    };

    // Prune Corrupt / Empty Taunt Files (<6kB)
    const handlePruneCorruptFiles = async () => {
        setIsPruning(true);
        try {
            // Prune from disk
            const res = await fetch('/api/overload/taunts/prune-empty', { method: 'POST' });
            const data = await res.json();

            // Prune corrupt items from browser IndexedDB
            const corruptItems = history.filter(h => h.blob.size < 6000);
            for (const item of corruptItems) {
                await deleteTaunt(item.id);
            }
            await loadHistory();

            setExportSuccess(`Pruned ${data.prunedCount || corruptItems.length} corrupt/empty taunt files.`);
        } catch (e: any) {
            setError(`Prune error: ${e.message}`);
        } finally {
            setIsPruning(false);
        }
    };

    return {
        history, editingId, setEditingId, editName, setEditName, playingId, isPruning,
        loadHistory, handleDownloadHistoryItem, handleDeleteHistoryItem, handleSaveRename,
        handlePreviewHistory, handlePruneCorruptFiles,
    };
}
