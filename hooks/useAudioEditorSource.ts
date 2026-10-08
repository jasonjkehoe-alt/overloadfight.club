import React, { useEffect, useState, useCallback } from 'react';
import type { SetMessage } from './useAudioEditorStatus';

interface UseAudioEditorSourceOptions {
    initialFile?: File | null;
    audioCtxRef: React.RefObject<AudioContext | null>;
    setError: SetMessage;
    setExportSuccess: SetMessage;
}

// AudioEditor: the loaded source file, its decoded PCM and peak metering,
// the taunt name, and the window drag & drop listener.
export function useAudioEditorSource({ initialFile, audioCtxRef, setError, setExportSuccess }: UseAudioEditorSourceOptions) {
    // Audio Buffer & Analysis (Internal peak measurement for automated headroom)
    const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
    const [measuredPeakDb, setMeasuredPeakDb] = useState<number | null>(null);

    // Audio Source State
    const [file, setFile] = useState<File | null>(initialFile || null);
    const [tauntName, setTauntName] = useState('combat_taunt');
    const [isDraggingOver, setIsDraggingOver] = useState(false);

    // Analyze Slice Metrics (True Peak and RMS in dBFS)
    const analyzeSliceMetrics = useCallback((buf: AudioBuffer, start: number, dur: number) => {
        try {
            const pcm = buf.getChannelData(0);
            const startSample = Math.max(0, Math.floor(start * buf.sampleRate));
            const endSample = Math.min(pcm.length, Math.floor((start + dur) * buf.sampleRate));
            if (endSample <= startSample) return;

            let peak = 0;
            const sampleCount = endSample - startSample;
            const step = Math.max(1, Math.floor(sampleCount / 4000));

            for (let i = startSample; i < endSample; i += step) {
                const val = Math.abs(pcm[i]);
                if (val > peak) peak = val;
            }

            const peakDb = peak > 0.00001 ? 20 * Math.log10(peak) : -60;
            setMeasuredPeakDb(Math.max(-60, Math.min(6, peakDb)));
        } catch (err) {
            console.warn('[AudioEditor] AudioBuffer analysis failed:', err);
        }
    }, []);

    // Load Audio File and Decode PCM for Audiophile Precision
    const loadAudioFile = useCallback(async (f: File) => {
        setFile(f);
        setError(null);
        setExportSuccess(null);

        // Sanitize taunt name
        const rawName = f.name.replace(/\.[^/.]+$/, '');
        const cleanName = rawName.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
        setTauntName(cleanName || 'combat_taunt');

        // Decode into Web Audio PCM buffer for live metering
        try {
            if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
                audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            const arrayBuffer = await f.slice(0).arrayBuffer();
            const decoded = await audioCtxRef.current.decodeAudioData(arrayBuffer);
            setAudioBuffer(decoded);
            analyzeSliceMetrics(decoded, 0, Math.min(3.0, decoded.duration));
        } catch (e) {
            console.warn('[AudioEditor] Web Audio decode fallback (file will still process via FFmpeg):', e);
            setAudioBuffer(null);
            setMeasuredPeakDb(null);
        }
    }, [analyzeSliceMetrics]);

    useEffect(() => {
        if (initialFile) {
            loadAudioFile(initialFile);
        }
    }, [initialFile, loadAudioFile]);

    // Global Drag & Drop Listener
    useEffect(() => {
        const handleDragOver = (e: DragEvent) => {
            e.preventDefault();
            setIsDraggingOver(true);
        };
        const handleDragLeave = (e: DragEvent) => {
            if (e.relatedTarget === null) {
                setIsDraggingOver(false);
            }
        };
        const handleDrop = (e: DragEvent) => {
            e.preventDefault();
            setIsDraggingOver(false);
            if (e.dataTransfer && e.dataTransfer.files.length > 0) {
                const droppedFile = e.dataTransfer.files[0];
                if (droppedFile.type.startsWith('audio/') || droppedFile.name.match(/\.(mp3|wav|ogg|flac|m4a|aac|webm)$/i)) {
                    loadAudioFile(droppedFile);
                }
            }
        };

        window.addEventListener('dragover', handleDragOver);
        window.addEventListener('dragleave', handleDragLeave);
        window.addEventListener('drop', handleDrop);

        return () => {
            window.removeEventListener('dragover', handleDragOver);
            window.removeEventListener('dragleave', handleDragLeave);
            window.removeEventListener('drop', handleDrop);
        };
    }, [loadAudioFile]);

    return {
        file, audioBuffer, measuredPeakDb, tauntName, setTauntName, isDraggingOver,
        analyzeSliceMetrics, loadAudioFile,
    };
}
