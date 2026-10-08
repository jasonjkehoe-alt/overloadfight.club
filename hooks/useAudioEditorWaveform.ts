import React, { useEffect, useRef, useState, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline.esm.js';

interface UseAudioEditorWaveformOptions {
    file: File | null;
    audioBuffer: AudioBuffer | null;
    analyzeSliceMetrics: (buf: AudioBuffer, start: number, dur: number) => void;
    addLog: (msg: string) => void;
    wavesurferRef: React.RefObject<WaveSurfer | null>;
}

// AudioEditor: the WaveSurfer canvas, the taunt-slice region, zoom, loop
// and the transport / nudge actions.
export function useAudioEditorWaveform({ file, audioBuffer, analyzeSliceMetrics, addLog, wavesurferRef }: UseAudioEditorWaveformOptions) {
    // Waveform & Audio Canvas Refs
    const containerRef = useRef<HTMLDivElement>(null);
    const timelineRef = useRef<HTMLDivElement>(null);
    const regionsRef = useRef<RegionsPlugin | null>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);

    // Trimming & Waveform State
    const [regionStart, setRegionStart] = useState(0);
    const [audioDuration, setAudioDuration] = useState(0);
    const [zoomLevel, setZoomLevel] = useState(70);
    const [duration, setDuration] = useState(3.0);
    const durationRef = useRef(3.0);
    const regionStartRef = useRef(0);

    // Audition & Transport State
    const [activeAuditionMode, setActiveAuditionMode] = useState<'cut' | 'full'>('cut');
    const activeAuditionModeRef = useRef<'cut' | 'full'>('cut');
    const [loopRegion, setLoopRegion] = useState(true);
    const loopRegionRef = useRef(true);
    const [nudgeStep, setNudgeStep] = useState<10 | 100>(10);

    // WaveSurfer DAW Canvas & Precision Region Engine
    useEffect(() => {
        if (!containerRef.current || !file) return;
        addLog(`Loading audio stream into visual workstation: ${file.name}`);

        if (wavesurferRef.current) {
            wavesurferRef.current.destroy();
            wavesurferRef.current = null;
        }

        try {
            const ws = WaveSurfer.create({
                container: containerRef.current,
                waveColor: '#3f3f46',         // Inactive audio in sleek zinc/carbon
                progressColor: '#71717a',     // Subtle progress tracking
                cursorColor: '#ffffff',       // Crisp white playhead
                cursorWidth: 2,
                barWidth: 2,
                barGap: 1.5,
                barRadius: 2,
                height: 125,
                normalize: true,
                minPxPerSec: zoomLevel,
            });

            // DAW Timeline Plugin
            if (timelineRef.current) {
                timelineRef.current.innerHTML = '';
                const wsTimeline = TimelinePlugin.create({
                    container: timelineRef.current,
                    height: 20,
                    timeInterval: 0.5,
                    primaryLabelInterval: 1,
                    style: {
                        color: '#ff6600',
                        fontSize: '10px',
                    },
                    formatTimeCallback: (seconds: number) => {
                        const m = Math.floor(seconds / 60);
                        const s = (seconds % 60).toFixed(1);
                        return m > 0 ? `${m}:${s.padStart(4, '0')}` : `${s}s`;
                    },
                });
                ws.registerPlugin(wsTimeline);
            }

            // WaveSurfer Regions Plugin with native 0.5s min / 3.0s max clamping
            const wsRegions = RegionsPlugin.create();
            ws.registerPlugin(wsRegions);
            regionsRef.current = wsRegions;

            ws.loadBlob(file);

            ws.on('ready', () => {
                const totalDur = ws.getDuration();
                setAudioDuration(totalDur);
                addLog(`Waveform loaded. Total track duration: ${totalDur.toFixed(2)}s`);

                const initialLen = Math.min(3.0, totalDur);
                setDuration(initialLen);
                durationRef.current = initialLen;
                setRegionStart(0);
                regionStartRef.current = 0;

                wsRegions.clearRegions();
                wsRegions.addRegion({
                    id: 'taunt-slice',
                    start: 0,
                    end: initialLen,
                    color: 'rgba(255, 102, 0, 0.26)',
                    drag: true,
                    resize: true,
                    minLength: 0.5,
                    maxLength: 3.0,
                });
            });

            ws.on('play', () => setIsPlaying(true));
            ws.on('pause', () => setIsPlaying(false));

            // Live Time Tracking and Loop Controller
            ws.on('timeupdate', (time) => {
                setCurrentTime(time);

                // If auditioning the cut specifically:
                if (activeAuditionModeRef.current === 'cut') {
                    const cStart = regionStartRef.current;
                    const cEnd = cStart + durationRef.current;

                    if (time >= cEnd) {
                        if (loopRegionRef.current) {
                            // Smooth Loop Cut back to start
                            ws.setTime(cStart);
                        } else {
                            // Clean single-shot audition stop
                            ws.pause();
                            ws.setTime(cStart);
                            setIsPlaying(false);
                        }
                    }
                }
            });

            // Smooth Region Updates (without recursive setOptions)
            wsRegions.on('region-updated', (region) => {
                const s = Math.max(0, region.start);
                const d = Math.max(0.5, Math.min(3.0, region.end - s));

                setRegionStart(s);
                regionStartRef.current = s;
                setDuration(d);
                durationRef.current = d;

                if (audioBuffer) {
                    analyzeSliceMetrics(audioBuffer, s, d);
                }
            });

            wavesurferRef.current = ws;
        } catch (e: any) {
            addLog(`WaveSurfer init error: ${e.message}`);
        }

        return () => {
            if (wavesurferRef.current) {
                try {
                    wavesurferRef.current.destroy();
                } catch {
                    // ignore
                }
            }
        };
    }, [file, analyzeSliceMetrics]);

    // Dynamic Zoom Level Update
    useEffect(() => {
        if (wavesurferRef.current) {
            wavesurferRef.current.zoom(zoomLevel);
        }
    }, [zoomLevel]);

    // Keep Loop Ref Synced
    useEffect(() => {
        loopRegionRef.current = loopRegion;
    }, [loopRegion]);

    // Precision Micro-Nudge Helper
    const nudgeRegion = useCallback((deltaSec: number) => {
        if (!regionsRef.current || !wavesurferRef.current) return;
        const regions = regionsRef.current.getRegions();
        if (regions.length === 0) return;

        const region = regions[0];
        const maxStart = Math.max(0, audioDuration - durationRef.current);
        const newStart = Math.min(maxStart, Math.max(0, region.start + deltaSec));
        const newEnd = newStart + durationRef.current;

        region.setOptions({ start: newStart, end: newEnd });
        setRegionStart(newStart);
        regionStartRef.current = newStart;

        if (audioBuffer) {
            analyzeSliceMetrics(audioBuffer, newStart, durationRef.current);
        }
    }, [audioDuration, audioBuffer, analyzeSliceMetrics]);

    // Transport Action 1: Audition Cut (Spacebar)
    const handleAuditionCut = useCallback(() => {
        if (!wavesurferRef.current) return;
        const ws = wavesurferRef.current;

        if (ws.isPlaying() && activeAuditionModeRef.current === 'cut') {
            ws.pause();
            return;
        }

        activeAuditionModeRef.current = 'cut';
        setActiveAuditionMode('cut');
        ws.setTime(regionStartRef.current);
        ws.play();
    }, []);

    // Transport Action 2: Play Full Track from Cursor (Audition Anywhere)
    const handlePlayFullTrack = useCallback(() => {
        if (!wavesurferRef.current) return;
        const ws = wavesurferRef.current;

        if (ws.isPlaying() && activeAuditionModeRef.current === 'full') {
            ws.pause();
            return;
        }

        activeAuditionModeRef.current = 'full';
        setActiveAuditionMode('full');
        ws.play();
    }, []);

    // Transport Action 3: Rewind to Cut Start (HotKey: R)
    const handleRewindToCut = useCallback(() => {
        if (!wavesurferRef.current) return;
        const ws = wavesurferRef.current;
        ws.setTime(regionStartRef.current);
        if (activeAuditionModeRef.current === 'cut' && !ws.isPlaying()) {
            ws.play();
        }
    }, []);

    // Transport Action 4: Move Cut to Current Cursor (HotKey: C)
    const handleMoveCutToCursor = useCallback(() => {
        if (!wavesurferRef.current || !regionsRef.current) return;
        const ws = wavesurferRef.current;
        const cur = ws.getCurrentTime();
        const maxStart = Math.max(0, audioDuration - durationRef.current);
        const newStart = Math.min(maxStart, Math.max(0, cur));
        const newEnd = newStart + durationRef.current;

        const regions = regionsRef.current.getRegions();
        if (regions.length > 0) {
            regions[0].setOptions({ start: newStart, end: newEnd });
            setRegionStart(newStart);
            regionStartRef.current = newStart;
            if (audioBuffer) {
                analyzeSliceMetrics(audioBuffer, newStart, durationRef.current);
            }
        }
    }, [audioDuration, audioBuffer, analyzeSliceMetrics]);

    // Quick Duration Setter (e.g. 1.0s, 1.5s, 2.0s, 3.0s)
    const handleSetDuration = (newDur: number) => {
        const clamped = Math.min(3.0, Math.max(0.5, newDur));
        setDuration(clamped);
        durationRef.current = clamped;

        if (regionsRef.current) {
            const regions = regionsRef.current.getRegions();
            if (regions.length > 0) {
                const region = regions[0];
                const maxStart = Math.max(0, audioDuration - clamped);
                const safeStart = Math.min(region.start, maxStart);
                region.setOptions({
                    start: safeStart,
                    end: safeStart + clamped,
                });
                setRegionStart(safeStart);
                regionStartRef.current = safeStart;
                if (audioBuffer) {
                    analyzeSliceMetrics(audioBuffer, safeStart, clamped);
                }
            }
        }
    };

    return {
        containerRef, timelineRef, isPlaying, currentTime, regionStart, audioDuration,
        zoomLevel, setZoomLevel, duration, durationRef, regionStartRef, activeAuditionMode,
        loopRegion, setLoopRegion, nudgeStep, setNudgeStep, nudgeRegion, handleAuditionCut,
        handlePlayFullTrack, handleRewindToCut, handleMoveCutToCursor, handleSetDuration,
    };
}
