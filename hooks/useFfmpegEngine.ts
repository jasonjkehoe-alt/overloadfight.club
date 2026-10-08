import React, { useEffect, useState } from 'react';
import type WaveSurfer from 'wavesurfer.js';
import { FFmpegService } from '../utils/ffmpeg';

type SetMessage = React.Dispatch<React.SetStateAction<string | null>>;

interface UseFfmpegEngineOptions {
    addLog: (msg: string) => void;
    setError: SetMessage;
    loadHistory: () => Promise<void>;
    wavesurferRef: React.RefObject<WaveSurfer | null>;
    previewAudioRef: React.RefObject<HTMLAudioElement | null>;
    audioCtxRef: React.RefObject<AudioContext | null>;
}

// AudioEditor mount effect: loads the ffmpeg.wasm core and the taunt history;
// on unmount destroys the waveform, the history preview audio and the AudioContext.
export function useFfmpegEngine({ addLog, setError, loadHistory, wavesurferRef, previewAudioRef, audioCtxRef }: UseFfmpegEngineOptions) {
    const [ffmpegLoaded, setFfmpegLoaded] = useState(false);

    // Initialize WebAssembly Core and Load History
    useEffect(() => {
        addLog('Initializing WebAssembly audio engine...');
        FFmpegService.getInstance()
            .then(() => {
                addLog('FFmpeg WASM loaded and ready.');
                setFfmpegLoaded(true);
            })
            .catch((e) => {
                console.error('FFmpeg load error:', e);
                const msg = e instanceof Error ? e.message : JSON.stringify(e);
                addLog(`FFmpeg load error: ${msg}`);
                setError(`Failed to load WebAssembly FFmpeg: ${msg}`);
            });

        loadHistory();

        return () => {
            if (wavesurferRef.current) wavesurferRef.current.destroy();
            if (previewAudioRef.current) {
                previewAudioRef.current.pause();
                previewAudioRef.current = null;
            }
            if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
                audioCtxRef.current.close().catch(() => {});
            }
        };
    }, []);

    return { ffmpegLoaded };
}
