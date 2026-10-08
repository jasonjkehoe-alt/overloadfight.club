import React, { useState } from 'react';
import { FFmpegService } from '../utils/ffmpeg';
import { saveTaunt } from '../utils/audioHistoryDb';
import { fetchFile } from '@ffmpeg/util';
import type { SetMessage } from './useAudioEditorStatus';

interface UseFfmpegExportOptions {
    file: File | null;
    ffmpegLoaded: boolean;
    tauntName: string;
    measuredPeakDb: number | null;
    durationRef: React.RefObject<number>;
    regionStartRef: React.RefObject<number>;
    addLog: (msg: string) => void;
    setError: SetMessage;
    setExportSuccess: SetMessage;
    loadHistory: () => Promise<void>;
}

// AudioEditor: the ffmpeg.wasm mastering pipeline (download or install to game).
export function useFfmpegExport({
    file,
    ffmpegLoaded,
    tauntName,
    measuredPeakDb,
    durationRef,
    regionStartRef,
    addLog,
    setError,
    setExportSuccess,
    loadHistory,
}: UseFfmpegExportOptions) {
    const [isProcessing, setIsProcessing] = useState(false);

    // Audiophile FFmpeg Mastering & Game Installation Pipeline
    const handleExport = async (installToGame = false) => {
        if (!file || !ffmpegLoaded || isProcessing) return;
        setIsProcessing(true);
        setError(null);
        setExportSuccess(null);
        addLog('Initiating audiophile mastering pipeline...');

        try {
            const ffmpeg = await FFmpegService.getInstance();
            const lastDotIndex = file.name.lastIndexOf('.');
            const ext = lastDotIndex !== -1 ? file.name.substring(lastDotIndex) : '.tmp';
            const inputName = `input_${Date.now()}${ext}`;
            const outputName = `taunt_${Date.now()}.ogg`;

            let cleanBase = tauntName.trim().replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
            if (!cleanBase) cleanBase = 'combat_taunt';
            let finalFilename = cleanBase.endsWith('.ogg') ? cleanBase : `${cleanBase}.ogg`;

            addLog(`Writing input audio stream to virtual memory: ${inputName}`);
            await ffmpeg.writeFile(inputName, await fetchFile(file));

            // Construct Audiophile DSP Filter Graph
            const filters: string[] = [];

            const curDuration = durationRef.current;
            const curStart = regionStartRef.current;

            // 1. Automatic Optimal Loudness Normalization & Brickwall Safety Limiter
            // Brings audio to clear combat presence (-0.5 dBFS target)
            let targetGainDb = 0;
            if (measuredPeakDb !== null && measuredPeakDb > -50) {
                const headroom = -0.5 - measuredPeakDb;
                // Boost quiet audio up to +12dB, or gently attenuate overly hot clips down to -6dB
                targetGainDb = Math.min(12, Math.max(-6, headroom));
            } else {
                targetGainDb = 2.5; // fallback standard boost
            }

            if (Math.abs(targetGainDb) >= 0.1) {
                filters.push(`volume=${targetGainDb.toFixed(2)}dB`);
            }
            // Brickwall safety limiter (0.95 ceiling ~ -0.45 dBFS) to prevent clipping in game
            filters.push('alimiter=limit=0.95:attack=5:release=50');

            // 2. Anti-Click Zero-Crossing Micro-Fades (15ms smooth in/out)
            const fadeDur = Math.min(0.015, curDuration / 8);
            const fadeOutStart = Math.max(0, curDuration - fadeDur);
            filters.push(`afade=t=in:ss=0:d=${fadeDur.toFixed(3)}`);
            filters.push(`afade=t=out:st=${fadeOutStart.toFixed(3)}:d=${fadeDur.toFixed(3)}`);

            const filterString = filters.join(',');
            addLog(`Active DSP Chain: ${filterString}`);

            // Precise Slicing: -ss and -t BEFORE -i extracts the full duration from the in-point
            const execArgs = [
                '-ss', curStart.toFixed(3),
                '-t', curDuration.toFixed(3),
                '-i', inputName,
                '-af', filterString,
                '-ac', '1',               // Strict Mono for 3D game spatialization
                '-ar', '44100',           // 44.1 kHz standard
                '-c:a', 'libvorbis',      // Ogg Vorbis codec
                '-q:a', '4',              // Quality level 4 (~128kbps)
                outputName
            ];

            addLog(`Executing FFmpeg: ${execArgs.join(' ')}`);
            await ffmpeg.exec(execArgs);

            addLog('Mastering complete. Reading rendered Vorbis stream...');
            const data = await ffmpeg.readFile(outputName);
            const blob = new Blob([data as unknown as BlobPart], { type: 'audio/ogg' });

            // AUDIOPHILE INTEGRITY CHECK: Reject empty/corrupt streams (<6000 bytes = 0 samples)
            if (blob.size < 6000) {
                throw new Error(`Mastering engine produced an empty audio stream (${blob.size} bytes). The selected slice contained zero decoded audio frames. Please move the selection slightly.`);
            }

            const sizeKb = (blob.size / 1024).toFixed(1);
            if (blob.size > 128 * 1024) {
                setError(`Warning: File is ${sizeKb} kB (exceeds Overload 128 kB limit). Try reducing duration slightly.`);
            } else {
                setExportSuccess(`Mastered "${finalFilename}" (${sizeKb} kB, ${curDuration.toFixed(2)}s Mono Vorbis) - Overload multiplayer compliant!`);
            }

            // Save to IndexedDB local history
            await saveTaunt(finalFilename, blob);
            await loadHistory();

            if (installToGame) {
                addLog('Installing directly into Overload AudioTaunts folder...');
                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = async () => {
                    try {
                        const base64data = (reader.result as string).split(',')[1];
                        const res = await fetch('/api/overload/install', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ filename: finalFilename, base64: base64data })
                        });
                        const installData = await res.json();
                        if (res.ok && installData.success) {
                            setExportSuccess(`Installed directly into Overload as "${installData.filename}"! Ready to use in-game.`);
                        } else {
                            setError(`Failed to install to game: ${installData.error || 'Unknown error'}`);
                        }
                    } catch (e: any) {
                        setError(`Game install error: ${e.message}`);
                    }
                };
            } else {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = finalFilename;
                a.click();
                URL.revokeObjectURL(url);
            }

            // Virtual FS cleanup
            try {
                await ffmpeg.deleteFile(inputName);
                await ffmpeg.deleteFile(outputName);
            } catch {
                // ignore
            }

            addLog(`Pipeline successful: ${finalFilename}`);
        } catch (err: any) {
            console.error(err);
            const msg = err instanceof Error ? err.message : String(err);
            addLog(`Pipeline error: ${msg}`);
            setError(`Audio export failed: ${msg}`);
        } finally {
            setIsProcessing(false);
        }
    };

    return { isProcessing, handleExport };
}
