import React, { useEffect } from 'react';
import type WaveSurfer from 'wavesurfer.js';

interface UseAudioEditorHotkeysOptions {
    handleAuditionCut: () => void;
    handlePlayFullTrack: () => void;
    handleRewindToCut: () => void;
    handleMoveCutToCursor: () => void;
    nudgeRegion: (deltaSec: number) => void;
    setLoopRegion: React.Dispatch<React.SetStateAction<boolean>>;
    handleExport: (installToGame?: boolean) => Promise<void>;
    wavesurferRef: React.RefObject<WaveSurfer | null>;
}

// AudioEditor: the window keydown listener for the editor hotkeys.
export function useAudioEditorHotkeys({
    handleAuditionCut,
    handlePlayFullTrack,
    handleRewindToCut,
    handleMoveCutToCursor,
    nudgeRegion,
    setLoopRegion,
    handleExport,
    wavesurferRef,
}: UseAudioEditorHotkeysOptions) {
    // Keyboard Hotkey Listener
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const active = document.activeElement;
            if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) {
                return;
            }

            if (e.code === 'Space') {
                e.preventDefault();
                if (e.shiftKey) {
                    handlePlayFullTrack();
                } else {
                    handleAuditionCut();
                }
            } else if (e.code === 'ArrowLeft') {
                e.preventDefault();
                nudgeRegion(e.shiftKey ? -0.1 : -0.01);
            } else if (e.code === 'ArrowRight') {
                e.preventDefault();
                nudgeRegion(e.shiftKey ? 0.1 : 0.01);
            } else if (e.key === 'r' || e.key === 'R') {
                e.preventDefault();
                handleRewindToCut();
            } else if (e.key === 'c' || e.key === 'C') {
                e.preventDefault();
                handleMoveCutToCursor();
            } else if (e.key === 'l' || e.key === 'L') {
                e.preventDefault();
                setLoopRegion(prev => !prev);
            } else if (e.code === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                handleExport(false);
            } else if (e.code === 'Escape') {
                if (wavesurferRef.current && wavesurferRef.current.isPlaying()) {
                    wavesurferRef.current.pause();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleAuditionCut, handlePlayFullTrack, handleRewindToCut, handleMoveCutToCursor, nudgeRegion]);
}
