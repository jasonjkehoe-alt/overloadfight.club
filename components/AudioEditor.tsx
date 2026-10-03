import React, { useEffect, useRef, useState, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline.esm.js';
import { FFmpegService } from '../utils/ffmpeg';
import { saveTaunt, getTaunts, deleteTaunt, updateTauntName } from '../utils/audioHistoryDb';
import { VoiceRecorderModal } from './VoiceRecorderModal';
import { WebImportModal } from './WebImportModal';
import { fetchFile } from '@ffmpeg/util';
import { 
    Upload, 
    Download, 
    ArrowLeft,
    Play, 
    Pause, 
    Globe, 
    AlertCircle, 
    Trash2, 
    History, 
    Pencil, 
    X, 
    Check, 
    Maximize, 
    FileAudio,
    ChevronDown,
    ChevronUp,
    CheckCircle2,
    Mic,
    Sparkles,
    RotateCcw,
    Keyboard,
    HardDrive,
    Repeat,
    Activity,
    Scissors,
    Layers,
    FolderOpen
} from 'lucide-react';
import { clsx } from 'clsx';

interface HistoryItem {
    id: string;
    name: string;
    date: number;
    blob: Blob;
}

interface AudioEditorProps {
    onEquipToSlot?: (tauntId: string, slotNum: number) => void;
    initialFile?: File | null;
}

export const AudioEditor: React.FC<AudioEditorProps> = ({ initialFile }) => {
    // Waveform & Audio Canvas Refs
    const containerRef = useRef<HTMLDivElement>(null);
    const timelineRef = useRef<HTMLDivElement>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const regionsRef = useRef<RegionsPlugin | null>(null);
    const previewAudioRef = useRef<HTMLAudioElement | null>(null);

    // Audio Buffer & Analysis (Internal peak measurement for automated headroom)
    const audioCtxRef = useRef<AudioContext | null>(null);
    const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
    const [measuredPeakDb, setMeasuredPeakDb] = useState<number | null>(null);

    // Audio Source State
    const [file, setFile] = useState<File | null>(initialFile || null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [exportSuccess, setExportSuccess] = useState<string | null>(null);

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

    const [tauntName, setTauntName] = useState('combat_taunt');

    // History & UI State
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [playingId, setPlayingId] = useState<string | null>(null);
    const [isRecordingModalOpen, setIsRecordingModalOpen] = useState(false);
    const [isWebImportModalOpen, setIsWebImportModalOpen] = useState(false);
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const [debugLog, setDebugLog] = useState<string[]>([]);
    const [showDebug, setShowDebug] = useState(false);
    const [showShortcuts, setShowShortcuts] = useState(false);
    const [isPruning, setIsPruning] = useState(false);

    const addLog = (msg: string) => {
        console.log(`[AudioEditor] ${msg}`);
        setDebugLog(prev => [...prev.slice(-49), `${new Date().toISOString().split('T')[1].split('.')[0]} ${msg}`]);
    };

    // Load Local IndexedDB History
    const loadHistory = async () => {
        try {
            const items = await getTaunts();
            setHistory(items.sort((a, b) => b.date - a.date));
        } catch (e) {
            console.error('Failed to load history', e);
        }
    };

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

    const handleReloadIntoEditor = (item: HistoryItem) => {
        const f = new File([item.blob], item.name, { type: 'audio/ogg' });
        loadAudioFile(f);
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

    // Estimated OGG size (~16 kB/s at Q4 mono + header ~4kB)
    const estimatedSizeKb = Math.round(duration * 16 + 4);
    const corruptHistoryCount = history.filter(h => h.blob.size < 6000).length;

    return (
        <div className="w-full max-w-5xl mx-auto space-y-8 font-mono">
            {/* Global Drag & Drop Overlay */}
            {isDraggingOver && (
                <div className="fixed inset-0 z-50 bg-[#ff6600]/20 backdrop-blur-sm border-4 border-dashed border-[#ff6600] flex items-center justify-center pointer-events-none">
                    <div className="bg-black/90 p-8 rounded-2xl border border-[#ff6600] text-center shadow-2xl">
                        <Upload className="w-16 h-16 mx-auto mb-4 text-[#ff6600] animate-bounce" />
                        <h2 className="text-2xl font-bold text-white brand-font">DROP AUDIO FILE HERE</h2>
                        <p className="text-sm text-gray-300 mt-2">Release to load straight into the Visual Waveform Workstation</p>
                    </div>
                </div>
            )}

            {/* Main Studio Workstation Card */}
            <div className="bg-[#0f0f12] rounded-2xl border border-white/10 shadow-2xl p-6 md:p-8 relative">
                {/* Header Strip with Live Studio Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl md:text-3xl font-bold text-[#ff6600] tracking-tight brand-font">
                                TAUNT WORKSTATION
                            </h2>
                            <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-widest bg-[#ff6600]/15 border border-[#ff6600]/40 text-[#ff6600] rounded">
                                Auto-Mastered
                            </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                            Precision audio cutter &amp; auto-mastering pipeline for Overload 6-DOF
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsWebImportModalOpen(true)}
                            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#ff6600]/15 hover:bg-[#ff6600]/25 border border-[#ff6600]/50 text-[#ff6600] text-xs font-bold transition-all shadow-lg hover:shadow-[#ff6600]/20"
                        >
                            <Globe className="w-3.5 h-3.5 text-[#ff6600]" />
                            <span>Import Web / YouTube</span>
                        </button>

                        <button
                            onClick={() => setIsRecordingModalOpen(true)}
                            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-red-950/40 hover:bg-red-900/40 border border-red-500/40 text-red-300 text-xs font-bold transition-all shadow-lg"
                        >
                            <Mic className="w-3.5 h-3.5 text-red-400" />
                            <span>Record Voice</span>
                        </button>

                        <button
                            onClick={() => setShowShortcuts(!showShortcuts)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-all text-xs"
                            title="Keyboard Hotkeys & Studio Cheatsheet"
                        >
                            <Keyboard className="w-3.5 h-3.5 text-gray-400" />
                            <span>Hotkeys</span>
                        </button>
                    </div>
                </div>

                {/* Keyboard Shortcut Cheat Sheet */}
                {showShortcuts && (
                    <div className="mt-4 p-4 rounded-xl bg-black/70 border border-white/10 text-xs grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-in text-gray-300">
                        <div><kbd className="px-1.5 py-0.5 bg-white/10 rounded border border-white/20 text-[#ff6600]">Space</kbd> Audition Cut</div>
                        <div><kbd className="px-1.5 py-0.5 bg-white/10 rounded border border-white/20 text-[#ff6600]">Shift+Space</kbd> Play Full Track</div>
                        <div><kbd className="px-1.5 py-0.5 bg-white/10 rounded border border-white/20 text-[#ff6600]">C</kbd> Move Cut to Cursor</div>
                        <div><kbd className="px-1.5 py-0.5 bg-white/10 rounded border border-white/20 text-[#ff6600]">R</kbd> Rewind to Cut Start</div>
                        <div><kbd className="px-1.5 py-0.5 bg-white/10 rounded border border-white/20 text-[#ff6600]">L</kbd> Toggle Cut Loop</div>
                        <div><kbd className="px-1.5 py-0.5 bg-white/10 rounded border border-white/20 text-[#ff6600]">&larr; / &rarr;</kbd> Nudge 10ms</div>
                        <div><kbd className="px-1.5 py-0.5 bg-white/10 rounded border border-white/20 text-[#ff6600]">Shift+&rarr;</kbd> Nudge 100ms</div>
                        <div><kbd className="px-1.5 py-0.5 bg-white/10 rounded border border-white/20 text-[#ff6600]">Ctrl+Enter</kbd> Export Taunt</div>
                    </div>
                )}

                {/* Engine Loading Indicator */}
                {!ffmpegLoaded && (
                    <div className="mt-6 p-4 bg-orange-950/30 border border-orange-500/30 text-orange-200 rounded-xl flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                            <div className="animate-spin h-4 w-4 border-2 border-orange-400 border-t-transparent rounded-full" />
                            <span>Loading Local WebAssembly Mastering Engine...</span>
                        </div>
                        <span className="text-orange-400/80">{debugLog[debugLog.length - 1]}</span>
                    </div>
                )}

                {/* Upload & Initial Audio Picker */}
                {!file ? (
                    <div className="mt-8">
                        <label className="flex flex-col items-center justify-center w-full h-56 border-2 border-dashed border-white/15 hover:border-[#ff6600]/60 rounded-2xl cursor-pointer bg-black/40 hover:bg-black/60 transition-all group">
                            <div className="flex flex-col items-center justify-center p-6 text-center">
                                <Upload className="w-12 h-12 mb-3 text-gray-500 group-hover:text-[#ff6600] group-hover:scale-110 transition-all" />
                                <p className="text-sm text-gray-200">
                                    <span className="font-bold text-[#ff6600]">Click to choose file</span> or drop audio anywhere
                                </p>
                                <p className="text-xs text-gray-500 mt-1.5">
                                    Supports MP3, WAV, FLAC, OGG, M4A, WebM (Auto-transcodes to Overload 3.0s Mono Vorbis)
                                </p>
                            </div>
                            <input 
                                type="file" 
                                className="hidden" 
                                accept="audio/*" 
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) loadAudioFile(e.target.files[0]);
                                }} 
                            />
                        </label>
                    </div>
                ) : (
                    /* Active Audio Workstation */
                    <div className="mt-8 space-y-6">
                        {/* Audio File Top Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/5 text-xs">
                            <div className="flex items-center gap-2 text-gray-300">
                                <FileAudio className="w-4 h-4 text-[#ff6600]" />
                                <span className="font-bold truncate max-w-xs">{file.name}</span>
                                <span className="text-gray-500">({audioDuration.toFixed(2)}s track)</span>
                            </div>

                            <div className="flex items-center gap-3">
                                <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white font-medium cursor-pointer transition-all">
                                    <FolderOpen className="w-3.5 h-3.5 text-[#ff6600]" />
                                    <span>Change Audio File</span>
                                    <input 
                                        type="file" 
                                        className="hidden" 
                                        accept="audio/*" 
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) loadAudioFile(e.target.files[0]);
                                        }} 
                                    />
                                </label>
                            </div>
                        </div>

                        {/* Interactive Waveform Canvas */}
                        <div className="bg-[#09090b] p-4 rounded-xl border border-white/10 shadow-inner relative overflow-hidden">
                            {/* Live Audition Mode Badge */}
                            <div className="flex items-center justify-between pb-2 text-[11px] text-gray-400 border-b border-white/5">
                                <div className="flex items-center gap-2">
                                    {isPlaying ? (
                                        <span className="flex items-center gap-1.5 text-green-400 text-xs font-semibold animate-pulse">
                                            <Activity className="w-3.5 h-3.5" /> Playing ({currentTime.toFixed(2)}s)
                                        </span>
                                    ) : (
                                        <span className="text-gray-400 text-xs">
                                            Cut Window: <strong className="text-white font-mono">{duration.toFixed(2)}s</strong>
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-1.5 bg-black/50 px-2 py-1 rounded-lg border border-white/10 text-xs">
                                    <span className="text-gray-400 text-[11px] mr-1">Zoom:</span>
                                    <button
                                        onClick={() => setZoomLevel(prev => Math.max(20, prev - 25))}
                                        disabled={zoomLevel <= 20}
                                        className="w-5 h-5 flex items-center justify-center rounded bg-white/5 hover:bg-white/15 disabled:opacity-30 text-white font-bold text-xs"
                                        title="Zoom Out"
                                    >
                                        &minus;
                                    </button>
                                    <button
                                        onClick={() => setZoomLevel(prev => Math.min(350, prev + 25))}
                                        disabled={zoomLevel >= 350}
                                        className="w-5 h-5 flex items-center justify-center rounded bg-white/5 hover:bg-white/15 disabled:opacity-30 text-white font-bold text-xs"
                                        title="Zoom In"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            {/* WaveSurfer Container */}
                            <div ref={containerRef} className="w-full cursor-crosshair mt-2" />
                            {/* DAW Timeline Plugin Container */}
                            <div ref={timelineRef} className="w-full mt-2 text-[10px] text-gray-500 border-t border-white/10" />
                        </div>

                        {/* DAW Transport Bar & Nudge Controls */}
                        <div className="bg-black/60 p-4 rounded-xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
                            {/* Main Audition Controls */}
                            <div className="flex flex-wrap items-center gap-2">
                                {/* Primary: Audition Cut (Space) */}
                                <button
                                    onClick={handleAuditionCut}
                                    className="px-4 py-2.5 bg-[#ff6600] hover:bg-[#ff8533] text-black font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-[#ff6600]/20 hover:scale-[1.02]"
                                    title="Play / Pause the 0.5s–3.0s cut (Space)"
                                >
                                    {isPlaying && activeAuditionMode === 'cut' ? (
                                        <Pause className="w-4 h-4 fill-black" />
                                    ) : (
                                        <Play className="w-4 h-4 fill-black" />
                                    )}
                                    <span>Audition Cut</span>
                                    <kbd className="px-1 py-0.5 bg-black/20 text-black text-[10px] rounded font-mono">Space</kbd>
                                </button>

                                {/* Secondary: Play Full Track from Cursor */}
                                <button
                                    onClick={handlePlayFullTrack}
                                    className="px-3 py-2.5 bg-white/5 hover:bg-white/15 border border-white/10 text-gray-300 hover:text-white rounded-xl flex items-center gap-1.5 transition-all text-xs"
                                    title="Play track continuously from current cursor (Shift+Space)"
                                >
                                    {isPlaying && activeAuditionMode === 'full' ? (
                                        <Pause className="w-3.5 h-3.5" />
                                    ) : (
                                        <Play className="w-3.5 h-3.5" />
                                    )}
                                    <span>Play Track</span>
                                </button>

                                {/* Rewind to Cut In-Point */}
                                <button
                                    onClick={handleRewindToCut}
                                    className="px-2.5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white rounded-xl flex items-center gap-1.5 transition-all text-xs"
                                    title="Rewind playhead to start of cut (R)"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>Rewind</span>
                                </button>

                                {/* Move Cut Window to Current Cursor */}
                                <button
                                    onClick={handleMoveCutToCursor}
                                    className="px-2.5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-[#ff6600] rounded-xl flex items-center gap-1 transition-all text-[11px]"
                                    title="Center the 3.0s cut window right at the current listening cursor (C)"
                                >
                                    <Scissors className="w-3.5 h-3.5 text-[#ff6600]" />
                                    <span>Snap Cut Here</span>
                                </button>

                                {/* Loop Cut Toggle */}
                                <button
                                    onClick={() => setLoopRegion(prev => !prev)}
                                    className={clsx(
                                        "px-2.5 py-2.5 rounded-xl border transition-all flex items-center gap-1.5 text-xs",
                                        loopRegion 
                                            ? "bg-[#ff6600]/20 border-[#ff6600]/60 text-[#ff6600]" 
                                            : "bg-white/5 border-white/10 text-gray-400 hover:text-gray-200"
                                    )}
                                    title={loopRegion ? "Loop Cut is ON (L)" : "Single-Shot Cut is ON (L)"}
                                >
                                    <Repeat className="w-3.5 h-3.5" />
                                    <span>{loopRegion ? 'Loop: On' : 'Loop: Off'}</span>
                                </button>
                            </div>

                            {/* Consolidated Micro-Nudge Precision Stepper */}
                            <div className="flex items-center gap-1 bg-black/50 px-2.5 py-1.5 rounded-xl border border-white/10 text-xs">
                                <span className="text-gray-400 text-[11px] mr-1">Nudge:</span>
                                <button
                                    onClick={() => nudgeRegion(-nudgeStep / 1000)}
                                    className="w-6 h-6 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-gray-200 font-bold text-xs"
                                    title={`Nudge cut left by ${nudgeStep}ms`}
                                >
                                    &minus;
                                </button>
                                <button
                                    onClick={() => setNudgeStep(prev => prev === 10 ? 100 : 10)}
                                    className="px-2 py-0.5 rounded-md bg-[#ff6600]/15 hover:bg-[#ff6600]/25 border border-[#ff6600]/30 text-[#ff6600] font-bold text-[11px]"
                                    title="Click to toggle nudge step (10ms / 100ms)"
                                >
                                    {nudgeStep}ms
                                </button>
                                <button
                                    onClick={() => nudgeRegion(nudgeStep / 1000)}
                                    className="w-6 h-6 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-gray-200 font-bold text-xs"
                                    title={`Nudge cut right by ${nudgeStep}ms`}
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {/* Minimalist Taunt Window & Automated Mastering Bar */}
                        <div className="bg-[#121216] p-4 rounded-xl border border-white/10 space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <Maximize className="w-3.5 h-3.5 text-[#ff6600]" />
                                    <span className="text-white font-bold text-xs">Taunt Window:</span>
                                    <span className="text-[#ff6600] font-bold text-sm font-mono">
                                        {duration.toFixed(2)}s
                                    </span>
                                    <span className="text-gray-500 text-xs">/ 3.0s cap</span>
                                    <span className="text-gray-600 text-xs hidden sm:inline">&bull;</span>
                                    <span className="text-[11px] text-gray-400 hidden sm:inline">
                                        [{regionStart.toFixed(2)}s &rarr; {(regionStart + duration).toFixed(2)}s]
                                    </span>
                                </div>

                                {/* Quick-Pill Duration Presets (Friendlier than slider) */}
                                <div className="flex items-center gap-1.5">
                                    {[0.5, 1.0, 1.5, 2.0, 3.0].map((d) => (
                                        <button
                                            key={d}
                                            onClick={() => handleSetDuration(d)}
                                            className={clsx(
                                                "px-3 py-1.5 rounded-lg text-xs font-bold border transition-all text-center",
                                                Math.abs(duration - d) < 0.04
                                                    ? "bg-[#ff6600] text-black border-[#ff6600] shadow-md shadow-[#ff6600]/20"
                                                    : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
                                            )}
                                        >
                                            {d === 3.0 ? '3.0s Max' : `${d.toFixed(1)}s`}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Automatic Mastering Status Line */}
                            <div className="pt-2.5 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-400">
                                <div className="flex items-center gap-2 text-gray-300">
                                    <Sparkles className="w-3.5 h-3.5 text-[#ff6600]" />
                                    <span className="font-semibold text-gray-200">Auto-Mastering:</span>
                                    <span>-0.5 dBFS Limiter</span>
                                    <span>&bull;</span>
                                    <span>Anti-Click Fades</span>
                                    <span>&bull;</span>
                                    <span>Mono 44.1kHz Vorbis</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-green-400 font-bold text-[10px] uppercase tracking-wider bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                    <span>Always On</span>
                                </div>
                            </div>
                        </div>

                        {/* Export & Overload Game Installation Console */}
                        <div className="bg-black/70 p-5 rounded-xl border border-white/10 space-y-4">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                {/* Taunt Filename Input */}
                                <div className="w-full sm:w-80 space-y-1">
                                    <label className="text-[11px] text-gray-400 flex items-center justify-between">
                                        <span>Combat Taunt Filename:</span>
                                        <span className="text-gray-500">.ogg will be added</span>
                                    </label>
                                    <div className="flex items-center bg-black border border-white/20 focus-within:border-[#ff6600] rounded-lg px-3 py-1.5">
                                        <input
                                            type="text"
                                            value={tauntName}
                                            onChange={(e) => setTauntName(e.target.value)}
                                            placeholder="combat_taunt"
                                            className="bg-transparent text-white text-xs w-full focus:outline-none"
                                        />
                                        <span className="text-xs text-gray-500 font-bold ml-1">.ogg</span>
                                    </div>
                                </div>

                                {/* Overload Size Compliance Meter */}
                                <div className="w-full sm:w-56 space-y-1 text-center sm:text-right">
                                    <div className="flex justify-between sm:justify-end gap-2 text-[11px] text-gray-400">
                                        <span>Estimated Size:</span>
                                        <span className="text-[#ff6600] font-bold">~{estimatedSizeKb} kB</span>
                                        <span className="text-gray-600">/ 128 kB limit</span>
                                    </div>
                                    <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden border border-white/10">
                                        <div 
                                            className={clsx(
                                                "h-full rounded-full transition-all duration-300",
                                                estimatedSizeKb > 120 ? "bg-red-500" : "bg-[#ff6600]"
                                            )}
                                            style={{ width: `${Math.min(100, (estimatedSizeKb / 128) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Export Buttons: Install as Primary, Download as Secondary */}
                            <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-white/5">
                                <div className="flex items-center gap-2 text-[11px] text-gray-400">
                                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                                    <span>Strict Mono 44.1kHz &bull; 0.5–3.0s Cap &bull; Auto-Mastered Vorbis</span>
                                </div>

                                <div className="flex items-center gap-2.5">
                                    {/* Secondary CTA: Download (.ogg) */}
                                    <button
                                        onClick={() => handleExport(false)}
                                        disabled={isProcessing || !ffmpegLoaded}
                                        className={clsx(
                                            "flex items-center px-4 py-2.5 rounded-xl font-bold font-mono transition-all uppercase tracking-wider text-xs",
                                            isProcessing || !ffmpegLoaded
                                                ? "bg-white/5 text-gray-600 cursor-not-allowed border border-white/5"
                                                : "bg-white/10 hover:bg-white/15 border border-white/20 text-gray-200 hover:text-white"
                                        )}
                                        title="Download Vorbis .ogg file directly"
                                    >
                                        {isProcessing ? (
                                            <>
                                                <div className="animate-spin mr-2 h-3.5 w-3.5 border-2 border-gray-400 border-t-transparent rounded-full" />
                                                Mastering...
                                            </>
                                        ) : (
                                            <>
                                                <Download className="w-3.5 h-3.5 mr-2 text-gray-400" />
                                                Download (.ogg)
                                            </>
                                        )}
                                    </button>

                                    {/* Primary CTA: Install to Overload */}
                                    <button
                                        onClick={() => handleExport(true)}
                                        disabled={isProcessing || !ffmpegLoaded}
                                        className={clsx(
                                            "flex items-center px-6 py-3 rounded-xl font-bold font-mono transition-all uppercase tracking-wider text-xs",
                                            isProcessing || !ffmpegLoaded
                                                ? "bg-white/5 text-gray-500 cursor-not-allowed border border-white/5"
                                                : "bg-[#ff6600] hover:bg-[#ff8533] text-black shadow-lg shadow-[#ff6600]/25 hover:shadow-[#ff6600]/40 hover:scale-[1.02]"
                                        )}
                                        title="Saves directly into your local Overload AudioTaunts directory"
                                    >
                                        <HardDrive className="w-4 h-4 mr-2" />
                                        Install to Overload
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Status Banners */}
                        {error && (
                            <div className="p-4 bg-red-950/40 text-red-200 rounded-xl flex items-center border border-red-500/30 text-xs">
                                <AlertCircle className="w-4 h-4 mr-2.5 flex-shrink-0 text-red-400" />
                                <span>{error}</span>
                            </div>
                        )}

                        {exportSuccess && (
                            <div className="p-4 bg-green-950/40 text-green-200 rounded-xl flex items-center border border-green-500/30 text-xs">
                                <CheckCircle2 className="w-4 h-4 mr-2.5 flex-shrink-0 text-green-400" />
                                <span>{exportSuccess}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Recent Taunts Library with Corrupt File Detection & Reload to Editor */}
                {history.length > 0 && (
                    <div className="mt-10 pt-6 border-t border-white/10 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-white">
                                <History className="w-4 h-4 text-[#ff6600]" />
                                <h3 className="text-base font-bold">Recent Audio Taunts ({history.length})</h3>
                            </div>

                            {corruptHistoryCount > 0 && (
                                <button
                                    onClick={handlePruneCorruptFiles}
                                    disabled={isPruning}
                                    className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 text-xs rounded-lg flex items-center gap-1.5 transition-all"
                                    title="Removes empty/0-sample cuts generated by previous sessions"
                                >
                                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                    <span>Prune {corruptHistoryCount} Empty Taunts</span>
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {history.map((item) => {
                                const isCorrupt = item.blob.size < 6000;
                                return (
                                    <div 
                                        key={item.id} 
                                        className={clsx(
                                            "border rounded-xl p-3 flex items-center justify-between group transition-all",
                                            isCorrupt 
                                                ? "bg-red-950/20 border-red-500/20" 
                                                : "bg-black/40 border-white/5 hover:border-white/15"
                                        )}
                                    >
                                        <div className="flex flex-col overflow-hidden flex-grow mr-3">
                                            {editingId === item.id ? (
                                                <div className="flex items-center space-x-2">
                                                    <input
                                                        type="text"
                                                        value={editName}
                                                        onChange={(e) => setEditName(e.target.value)}
                                                        className="bg-black border border-[#ff6600] rounded px-2 py-1 text-xs text-white w-full focus:outline-none"
                                                        autoFocus
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleSaveRename(item.id);
                                                            if (e.key === 'Escape') setEditingId(null);
                                                        }}
                                                    />
                                                    <button onClick={() => handleSaveRename(item.id)} className="text-green-400 p-1"><Check className="w-4 h-4" /></button>
                                                    <button onClick={() => setEditingId(null)} className="text-red-400 p-1"><X className="w-4 h-4" /></button>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-gray-200 truncate" title={item.name}>
                                                            {item.name}
                                                        </span>
                                                        {isCorrupt && (
                                                            <span className="px-1.5 py-0.2 rounded text-[9px] bg-red-500/20 text-red-400 font-bold border border-red-500/30">
                                                                Empty / 0 samples
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex space-x-3 text-[11px] text-gray-500 mt-0.5">
                                                        <span>{new Date(item.date).toLocaleDateString()}</span>
                                                        <span>{(item.blob.size / 1024).toFixed(1)} kB</span>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-1 opacity-85 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handlePreviewHistory(item)}
                                                className={clsx(
                                                    "p-1.5 rounded-lg hover:bg-white/10 transition-colors",
                                                    playingId === item.id ? "text-green-400 bg-green-500/10" : "text-gray-400"
                                                )}
                                                title="Preview Taunt"
                                            >
                                                {playingId === item.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                            </button>

                                            {/* Reload into Workstation to re-trim */}
                                            <button
                                                onClick={() => handleReloadIntoEditor(item)}
                                                className="p-1.5 hover:bg-white/10 rounded-lg text-[#ff6600]"
                                                title="Load back into Waveform Editor"
                                            >
                                                <Layers className="w-4 h-4" />
                                            </button>

                                            <button
                                                onClick={() => {
                                                    setEditingId(item.id);
                                                    setEditName(item.name);
                                                }}
                                                className="p-1.5 hover:bg-white/10 rounded-lg text-yellow-400"
                                                title="Rename"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>

                                            <button
                                                onClick={() => handleDownloadHistoryItem(item)}
                                                className="p-1.5 hover:bg-white/10 rounded-lg text-blue-400"
                                                title="Download"
                                            >
                                                <Download className="w-4 h-4" />
                                            </button>

                                            <button
                                                onClick={() => handleDeleteHistoryItem(item.id)}
                                                className="p-1.5 hover:bg-white/10 rounded-lg text-red-400"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Collapsible WebAssembly & DSP Diagnostics */}
                <div className="mt-8 pt-4 border-t border-white/5">
                    <button 
                        onClick={() => setShowDebug(!showDebug)}
                        className="flex items-center justify-between w-full text-[11px] text-gray-500 hover:text-gray-300 py-1"
                    >
                        <span>FFmpeg WASM & DSP Diagnostics ({debugLog.length})</span>
                        {showDebug ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                    {showDebug && (
                        <div className="mt-2 p-3 bg-black/80 rounded-lg border border-white/5 text-[11px] text-gray-400 h-32 overflow-y-auto space-y-0.5">
                            {debugLog.map((log, i) => (
                                <div key={i}>{log}</div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Voice Recorder Modal */}
            <VoiceRecorderModal
                isOpen={isRecordingModalOpen}
                onClose={() => setIsRecordingModalOpen(false)}
                onAudioReady={loadAudioFile}
            />

            {/* Web & Media Import Modal - Kept mounted to preserve search queries, scroll position, and results */}
            <WebImportModal
                isOpen={isWebImportModalOpen}
                onClose={() => setIsWebImportModalOpen(false)}
                onAudioReady={loadAudioFile}
            />
        </div>
    );
};
