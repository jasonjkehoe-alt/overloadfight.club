import React, { useEffect, useRef, useState, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline.esm.js';
import { FFmpegService } from '../utils/ffmpeg';
import { saveTaunt, getTaunts, deleteTaunt, updateTauntName } from '../utils/audioHistoryDb';
import { generatePresetAudio } from '../utils/testPresets';
import { VoiceRecorderModal } from './VoiceRecorderModal';
import { fetchFile } from '@ffmpeg/util';
import { 
    Upload, 
    Download, 
    Play, 
    Pause, 
    AlertCircle, 
    Trash2, 
    History, 
    Pencil, 
    X, 
    Check, 
    ZoomIn, 
    ZoomOut, 
    Maximize, 
    FileAudio,
    Volume2,
    Sliders,
    ChevronDown,
    ChevronUp,
    CheckCircle2,
    Mic,
    Sparkles,
    RotateCcw,
    Zap,
    Keyboard,
    ShieldAlert
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
}

export const AudioEditor: React.FC<AudioEditorProps> = () => {
    // Refs
    const containerRef = useRef<HTMLDivElement>(null);
    const timelineRef = useRef<HTMLDivElement>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const regionsRef = useRef<RegionsPlugin | null>(null);
    const previewAudioRef = useRef<HTMLAudioElement | null>(null);

    // Audio & Processing State
    const [file, setFile] = useState<File | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [exportSuccess, setExportSuccess] = useState<string | null>(null);

    // Trimming & Waveform State
    const [regionStart, setRegionStart] = useState(0);
    const [audioDuration, setAudioDuration] = useState(0);
    const [zoomLevel, setZoomLevel] = useState(60);
    const [duration, setDuration] = useState(3.0);
    const durationRef = useRef(3.0);
    const regionStartRef = useRef(0);

    // DSP & Audio Polish Settings
    const [gainDb, setGainDb] = useState(3); // +3 dB default boost for combat audibility
    const [autoNormalize, setAutoNormalize] = useState(true);
    const [antiClickFade, setAntiClickFade] = useState(true);
    const [tauntName, setTauntName] = useState('combat_taunt');

    // History & UI State
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [playingId, setPlayingId] = useState<string | null>(null);
    const [isRecordingModalOpen, setIsRecordingModalOpen] = useState(false);
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const [debugLog, setDebugLog] = useState<string[]>([]);
    const [showDebug, setShowDebug] = useState(false);
    const [showShortcuts, setShowShortcuts] = useState(false);

    const addLog = (msg: string) => {
        console.log(msg);
        setDebugLog(prev => [...prev.slice(-49), `${new Date().toISOString().split('T')[1].split('.')[0]} ${msg}`]);
    };

    const loadHistory = async () => {
        try {
            const items = await getTaunts();
            setHistory(items.sort((a, b) => b.date - a.date));
        } catch (e) {
            console.error('Failed to load history', e);
        }
    };

    // Initialize FFmpeg WASM and History
    useEffect(() => {
        addLog('Initializing WebAssembly audio engine...');
        FFmpegService.getInstance()
            .then(() => {
                addLog('FFmpeg WASM loaded successfully.');
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
        };
    }, []);

    // Global drag-and-drop listener across entire window
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
    }, []);

    const loadAudioFile = (f: File) => {
        setFile(f);
        setError(null);
        setExportSuccess(null);
        // Clean default name
        const rawName = f.name.replace(/\.[^/.]+$/, '');
        const cleanName = rawName.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
        setTauntName(cleanName || 'combat_taunt');
    };

    // Load presets
    const handleLoadPreset = async (type: 'alarm' | 'target' | 'chatter') => {
        try {
            addLog(`Generating synthetic ${type} preset sound bite...`);
            const presetFile = await generatePresetAudio(type);
            loadAudioFile(presetFile);
        } catch (err) {
            console.error('Failed to generate preset', err);
        }
    };

    // WaveSurfer initialization with Timeline and Regions
    useEffect(() => {
        if (!containerRef.current || !file) return;
        addLog(`Loading audio stream: ${file.name}`);

        if (wavesurferRef.current) {
            wavesurferRef.current.destroy();
        }

        try {
            const ws = WaveSurfer.create({
                container: containerRef.current,
                waveColor: '#3f3f46',
                progressColor: '#ff6600',
                cursorColor: '#ff9933',
                barWidth: 2,
                barGap: 1,
                height: 120,
                normalize: true,
                minPxPerSec: zoomLevel,
            });

            // Register Timeline Plugin
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
                    formatTimeCallback: (seconds: number) => `${seconds.toFixed(1)}s`,
                });
                ws.registerPlugin(wsTimeline);
            }

            // Register Regions Plugin with interactive resizing enabled
            const wsRegions = RegionsPlugin.create();
            ws.registerPlugin(wsRegions);
            regionsRef.current = wsRegions;

            ws.loadBlob(file);

            ws.on('ready', () => {
                const totalDur = ws.getDuration();
                setAudioDuration(totalDur);
                addLog(`Waveform ready. Total duration: ${totalDur.toFixed(2)}s`);

                const initialLen = Math.min(3.0, totalDur);
                setDuration(initialLen);
                durationRef.current = initialLen;
                setRegionStart(0);
                regionStartRef.current = 0;

                wsRegions.clearRegions();
                wsRegions.addRegion({
                    start: 0,
                    end: initialLen,
                    color: 'rgba(255, 102, 0, 0.28)',
                    drag: true,
                    resize: true, // Draggable boundary handles!
                });
            });

            ws.on('error', (e) => {
                addLog(`WaveSurfer runtime error: ${e}`);
            });

            ws.on('play', () => setIsPlaying(true));
            ws.on('pause', () => setIsPlaying(false));

            // Clamping on region update
            wsRegions.on('region-updated', (region) => {
                let currentStart = Math.max(0, region.start);
                let currentEnd = region.end;
                let currentDiff = currentEnd - currentStart;

                // Enforce Overload max 3.0s constraint and min 0.5s
                if (currentDiff > 3.0) {
                    currentEnd = currentStart + 3.0;
                    region.setOptions({ end: currentEnd });
                    currentDiff = 3.0;
                } else if (currentDiff < 0.5) {
                    currentEnd = currentStart + 0.5;
                    region.setOptions({ end: currentEnd });
                    currentDiff = 0.5;
                }

                setRegionStart(currentStart);
                regionStartRef.current = currentStart;
                setDuration(currentDiff);
                durationRef.current = currentDiff;
            });

            // Loop region playback smoothly
            wsRegions.on('region-out', (region) => {
                region.play();
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
    }, [file]);

    // Zoom update
    useEffect(() => {
        if (wavesurferRef.current) {
            wavesurferRef.current.zoom(zoomLevel);
        }
    }, [zoomLevel]);

    // Nudge helper
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
    }, [audioDuration]);

    // Keyboard Hotkeys
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if typing in text inputs
            const active = document.activeElement;
            if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) {
                return;
            }

            if (e.code === 'Space') {
                e.preventDefault();
                handlePlayPause();
            } else if (e.code === 'ArrowLeft') {
                e.preventDefault();
                nudgeRegion(e.shiftKey ? -0.1 : -0.02);
            } else if (e.code === 'ArrowRight') {
                e.preventDefault();
                nudgeRegion(e.shiftKey ? 0.1 : 0.02);
            } else if (e.key === 'r' || e.key === 'R') {
                e.preventDefault();
                replayFromStart();
            } else if (e.code === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                handleExport();
            } else if (e.code === 'Escape') {
                if (wavesurferRef.current && wavesurferRef.current.isPlaying()) {
                    wavesurferRef.current.pause();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [file, ffmpegLoaded, nudgeRegion]);

    const handlePlayPause = () => {
        if (!wavesurferRef.current || !regionsRef.current) return;
        const ws = wavesurferRef.current;
        const regions = regionsRef.current.getRegions();

        if (ws.isPlaying()) {
            ws.pause();
        } else {
            if (regions.length > 0) {
                const region = regions[0];
                const cur = ws.getCurrentTime();
                if (cur >= region.start && cur < region.end) {
                    ws.play();
                } else {
                    region.play();
                }
            } else {
                ws.play();
            }
        }
    };

    const replayFromStart = () => {
        if (!wavesurferRef.current || !regionsRef.current) return;
        const regions = regionsRef.current.getRegions();
        if (regions.length > 0) {
            regions[0].play();
        } else {
            wavesurferRef.current.seekTo(0);
            wavesurferRef.current.play();
        }
    };

    const handleDurationSliderChange = (newDur: number) => {
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
            }
        }
    };

    // FFmpeg WASM Audio Export Pipeline
    const handleExport = async () => {
        if (!file || !ffmpegLoaded || isProcessing) return;
        setIsProcessing(true);
        setError(null);
        setExportSuccess(null);
        addLog('Starting audio mastering pipeline...');

        try {
            const ffmpeg = await FFmpegService.getInstance();
            const lastDotIndex = file.name.lastIndexOf('.');
            const ext = lastDotIndex !== -1 ? file.name.substring(lastDotIndex) : '.tmp';
            const inputName = `input_${Date.now()}${ext}`;
            const outputName = `taunt_${Date.now()}.ogg`;

            // Sanitize taunt filename
            let cleanBase = tauntName.trim().replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
            if (!cleanBase) cleanBase = 'combat_taunt';
            let finalFilename = cleanBase.endsWith('.ogg') ? cleanBase : `${cleanBase}.ogg`;

            addLog(`Writing input buffer: ${inputName}`);
            await ffmpeg.writeFile(inputName, await fetchFile(file));

            // Construct audio filter chain
            const filters: string[] = [
                'silenceremove=start_periods=1:start_threshold=-50dB' // Remove dead leading air
            ];

            // Gain / Normalization
            if (autoNormalize) {
                // Peak normalization with soft limiter
                filters.push('loudnorm=I=-14:TP=-0.5:LRA=11');
            } else if (gainDb !== 0) {
                filters.push(`volume=${gainDb}dB`);
            }

            // Anti-click micro-fades (50ms)
            if (antiClickFade) {
                const fadeDur = Math.min(0.05, duration / 4);
                const fadeOutStart = Math.max(0, duration - fadeDur);
                filters.push(`afade=t=in:ss=0:d=${fadeDur.toFixed(3)}`);
                filters.push(`afade=t=out:st=${fadeOutStart.toFixed(3)}:d=${fadeDur.toFixed(3)}`);
            }

            const filterString = filters.join(',');
            addLog(`Active DSP Filters: ${filterString}`);

            const execArgs = [
                '-ss', regionStart.toString(),
                '-t', duration.toString(),
                '-i', inputName,
                '-af', filterString,
                '-ac', '1',               // Strict Mono downmix for 3D game spatialization
                '-c:a', 'libvorbis',      // Vorbis codec
                '-q:a', '4',              // Quality level 4 (~128kbps)
                outputName
            ];

            addLog(`Running FFmpeg: ${execArgs.join(' ')}`);
            await ffmpeg.exec(execArgs);

            addLog('Reading output Vorbis data...');
            const data = await ffmpeg.readFile(outputName);
            const blob = new Blob([data as unknown as BlobPart], { type: 'audio/ogg' });

            // Size verification
            const sizeKb = (blob.size / 1024).toFixed(1);
            if (blob.size > 128 * 1024) {
                setError(`Warning: File is ${sizeKb} kB (exceeds Overload 128 kB limit). Try reducing duration or volume.`);
            } else {
                setExportSuccess(`Mastered "${finalFilename}" (${sizeKb} kB) - Overload multiplayer compliant!`);
            }

            // Save to IndexedDB local history
            await saveTaunt(finalFilename, blob);
            await loadHistory();

            // Trigger download
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = finalFilename;
            a.click();
            URL.revokeObjectURL(url);

            // Cleanup virtual FS
            try {
                await ffmpeg.deleteFile(inputName);
                await ffmpeg.deleteFile(outputName);
            } catch {
                // ignore cleanup errors
            }

            addLog(`Export successful: ${finalFilename}`);
        } catch (err: any) {
            console.error(err);
            const msg = err instanceof Error ? err.message : String(err);
            addLog(`Pipeline error: ${msg}`);
            setError(`Audio export failed: ${msg}`);
        } finally {
            setIsProcessing(false);
        }
    };

    // History controls
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

    // Estimated OGG size (approx 16 kB/s at Q4 mono + header overhead ~4kB)
    const estimatedSizeKb = Math.round(duration * 16 + 4);

    return (
        <div className="w-full max-w-5xl mx-auto space-y-8 font-mono">
            {/* Global Drag Overlay */}
            {isDraggingOver && (
                <div className="fixed inset-0 z-50 bg-[#ff6600]/20 backdrop-blur-sm border-4 border-dashed border-[#ff6600] flex items-center justify-center pointer-events-none">
                    <div className="bg-black/90 p-8 rounded-2xl border border-[#ff6600] text-center shadow-2xl">
                        <Upload className="w-16 h-16 mx-auto mb-4 text-[#ff6600] animate-bounce" />
                        <h2 className="text-2xl font-bold text-white brand-font">DROP AUDIO FILE HERE</h2>
                        <p className="text-sm text-gray-300 mt-2">Release to load straight into the Waveform Editor</p>
                    </div>
                </div>
            )}

            {/* Main Workstation Card */}
            <div className="bg-[#121212] rounded-2xl border border-white/10 shadow-2xl p-6 md:p-8 relative">
                {/* Header Strip */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl md:text-3xl font-bold text-[#ff6600] tracking-tight brand-font">
                                TAUNT WORKSTATION
                            </h2>
                            <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-widest bg-[#ff6600]/10 border border-[#ff6600]/40 text-[#ff6600] rounded">
                                v2.0 Pro
                            </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                            Visual 3.0s wave trimmer &bull; Vorbis mono DSP &bull; Overload multiplayer safe
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsRecordingModalOpen(true)}
                            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-red-950/40 hover:bg-red-900/40 border border-red-500/40 text-red-300 text-xs font-bold transition-all shadow-lg"
                        >
                            <Mic className="w-3.5 h-3.5 text-red-400" />
                            <span>Record Voice</span>
                        </button>

                        <button
                            onClick={() => setShowShortcuts(!showShortcuts)}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-all text-xs"
                            title="Keyboard Shortcuts"
                        >
                            <Keyboard className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Keyboard Shortcut Drawer */}
                {showShortcuts && (
                    <div className="mt-4 p-4 rounded-xl bg-black/60 border border-white/10 text-xs grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-in text-gray-300">
                        <div><kbd className="px-1.5 py-0.5 bg-white/10 rounded border border-white/20 text-[#ff6600]">Space</kbd> Play / Pause</div>
                        <div><kbd className="px-1.5 py-0.5 bg-white/10 rounded border border-white/20 text-[#ff6600]">&larr; / &rarr;</kbd> Nudge 20ms</div>
                        <div><kbd className="px-1.5 py-0.5 bg-white/10 rounded border border-white/20 text-[#ff6600]">Shift + &rarr;</kbd> Nudge 100ms</div>
                        <div><kbd className="px-1.5 py-0.5 bg-white/10 rounded border border-white/20 text-[#ff6600]">Ctrl+Enter</kbd> Export Taunt</div>
                    </div>
                )}

                {/* FFmpeg WASM Status Bar */}
                {!ffmpegLoaded && (
                    <div className="mt-6 p-4 bg-orange-950/30 border border-orange-500/30 text-orange-200 rounded-xl flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                            <div className="animate-spin h-4 w-4 border-2 border-orange-400 border-t-transparent rounded-full" />
                            <span>Loading Local WebAssembly Audio Core...</span>
                        </div>
                        <span className="text-orange-400/80">{debugLog[debugLog.length - 1]}</span>
                    </div>
                )}

                {/* Upload & Quick Presets Section */}
                {!file ? (
                    <div className="mt-8 space-y-6">
                        <label className="flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-white/15 hover:border-[#ff6600]/60 rounded-2xl cursor-pointer bg-black/40 hover:bg-black/60 transition-all group">
                            <div className="flex flex-col items-center justify-center p-6 text-center">
                                <Upload className="w-10 h-10 mb-3 text-gray-500 group-hover:text-[#ff6600] group-hover:scale-110 transition-all" />
                                <p className="text-sm text-gray-300">
                                    <span className="font-bold text-[#ff6600]">Click to browse</span> or drop an audio file anywhere
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    Supports MP3, WAV, FLAC, OGG, M4A, WebM (Auto-transcodes to Overload 3.0s Mono Ogg)
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

                        {/* Quick Presets for Instant Testing */}
                        <div className="p-4 rounded-xl bg-black/30 border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                            <span className="text-gray-400 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-[#ff6600]" />
                                Don't have an audio file ready? Try a preset sound bite:
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleLoadPreset('alarm')}
                                    className="px-2.5 py-1.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white"
                                >
                                    Combat Alarm
                                </button>
                                <button
                                    onClick={() => handleLoadPreset('target')}
                                    className="px-2.5 py-1.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white"
                                >
                                    Target Lock
                                </button>
                                <button
                                    onClick={() => handleLoadPreset('chatter')}
                                    className="px-2.5 py-1.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white"
                                >
                                    Radio Static
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Active Audio Workspace */
                    <div className="mt-8 space-y-6">
                        {/* Audio File Header */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/5 text-xs">
                            <div className="flex items-center gap-2 text-gray-300">
                                <FileAudio className="w-4 h-4 text-[#ff6600]" />
                                <span className="font-bold truncate max-w-xs">{file.name}</span>
                                <span className="text-gray-500">({audioDuration.toFixed(2)}s total)</span>
                            </div>

                            <label className="text-[#ff6600] hover:text-[#ff8533] cursor-pointer font-bold">
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

                        {/* Waveform Canvas & DAW Timeline */}
                        <div className="bg-black/90 p-4 rounded-xl border border-white/10 shadow-inner">
                            {/* WaveSurfer Container */}
                            <div ref={containerRef} className="w-full cursor-pointer" />
                            {/* Timeline Ruler Plugin Container */}
                            <div ref={timelineRef} className="w-full mt-2 text-[10px] text-gray-500 border-t border-white/10" />
                        </div>

                        {/* Visual Region Handle Info & Micro-Nudge Bar */}
                        <div className="bg-black/50 p-4 rounded-xl border border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
                            <div className="flex items-center gap-3">
                                <span className="text-gray-400">Position:</span>
                                <span className="text-[#ff6600] font-bold text-sm bg-black px-2 py-1 rounded border border-white/10">
                                    {regionStart.toFixed(2)}s &rarr; {(regionStart + duration).toFixed(2)}s
                                </span>
                                <span className="text-gray-400">Duration:</span>
                                <span className="text-white font-bold text-sm bg-black px-2 py-1 rounded border border-white/10">
                                    {duration.toFixed(2)}s
                                </span>
                            </div>

                            {/* Micro-Nudge Buttons */}
                            <div className="flex items-center gap-1.5">
                                <span className="text-gray-500 text-[11px] mr-1">Micro-Nudge:</span>
                                <button
                                    onClick={() => nudgeRegion(-0.05)}
                                    className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-[11px]"
                                    title="Nudge -50ms"
                                >
                                    -50ms
                                </button>
                                <button
                                    onClick={() => nudgeRegion(-0.01)}
                                    className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-[11px]"
                                    title="Nudge -10ms"
                                >
                                    -10ms
                                </button>
                                <button
                                    onClick={() => nudgeRegion(0.01)}
                                    className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-[11px]"
                                    title="Nudge +10ms"
                                >
                                    +10ms
                                </button>
                                <button
                                    onClick={() => nudgeRegion(0.05)}
                                    className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-[11px]"
                                    title="Nudge +50ms"
                                >
                                    +50ms
                                </button>
                            </div>
                        </div>

                        {/* Controls Grid (Sliders & Audio DSP Options) */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Duration Slider (0.5s - 3.0s) */}
                            <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-2">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-300 flex items-center gap-1.5">
                                        <Maximize className="w-3.5 h-3.5 text-[#ff6600]" /> Taunt Window
                                    </span>
                                    <span className="text-[#ff6600] font-bold">{duration.toFixed(2)}s / 3.0s</span>
                                </div>
                                <input
                                    type="range"
                                    min={0.5}
                                    max={3.0}
                                    step={0.05}
                                    value={duration}
                                    onChange={(e) => handleDurationSliderChange(parseFloat(e.target.value))}
                                    className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#ff6600]"
                                />
                                <div className="flex justify-between text-[10px] text-gray-500">
                                    <span>0.5s</span>
                                    <span>3.0s (Max Game Cap)</span>
                                </div>
                            </div>

                            {/* Waveform Zoom */}
                            <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-2">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-300 flex items-center gap-1.5">
                                        <ZoomIn className="w-3.5 h-3.5 text-[#ff6600]" /> Zoom
                                    </span>
                                    <span className="text-gray-400">{zoomLevel} px/s</span>
                                </div>
                                <input
                                    type="range"
                                    min={10}
                                    max={400}
                                    step={10}
                                    value={zoomLevel}
                                    onChange={(e) => setZoomLevel(parseInt(e.target.value))}
                                    className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#ff6600]"
                                />
                                <div className="flex justify-between text-[10px] text-gray-500">
                                    <span>Wide</span>
                                    <span>Close-up</span>
                                </div>
                            </div>

                            {/* Audio DSP (Gain / Normalization / Anti-Click) */}
                            <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-3 text-xs">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-300 flex items-center gap-1.5">
                                        <Volume2 className="w-3.5 h-3.5 text-[#ff6600]" /> Combat Audio DSP
                                    </span>
                                    <label className="flex items-center gap-1.5 cursor-pointer text-gray-300">
                                        <input
                                            type="checkbox"
                                            checked={autoNormalize}
                                            onChange={(e) => setAutoNormalize(e.target.checked)}
                                            className="rounded accent-[#ff6600]"
                                        />
                                        <span className="text-[11px]">Auto-Normalize</span>
                                    </label>
                                </div>

                                {!autoNormalize && (
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-[10px] text-gray-400">
                                            <span>Gain Boost</span>
                                            <span>{gainDb > 0 ? `+${gainDb} dB` : `${gainDb} dB`}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min={-6}
                                            max={12}
                                            step={1}
                                            value={gainDb}
                                            onChange={(e) => setGainDb(parseInt(e.target.value))}
                                            className="w-full h-1 bg-gray-700 rounded appearance-none cursor-pointer accent-[#ff6600]"
                                        />
                                    </div>
                                )}

                                <label className="flex items-center justify-between cursor-pointer pt-1 border-t border-white/5 text-gray-400 hover:text-gray-200">
                                    <span className="text-[11px]">Anti-Click Micro-Fades</span>
                                    <input
                                        type="checkbox"
                                        checked={antiClickFade}
                                        onChange={(e) => setAntiClickFade(e.target.checked)}
                                        className="rounded accent-[#ff6600]"
                                    />
                                </label>
                            </div>
                        </div>

                        {/* Export & Naming Bar */}
                        <div className="bg-black/60 p-5 rounded-xl border border-white/10 space-y-4">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                {/* Custom Taunt Filename Input */}
                                <div className="w-full sm:w-80 space-y-1">
                                    <label className="text-[11px] text-gray-400 flex items-center justify-between">
                                        <span>Target Taunt Filename:</span>
                                        <span className="text-gray-500">.ogg will be added</span>
                                    </label>
                                    <div className="flex items-center bg-black border border-white/20 focus-within:border-[#ff6600] rounded-lg px-3 py-1.5">
                                        <input
                                            type="text"
                                            value={tauntName}
                                            onChange={(e) => setTauntName(e.target.value)}
                                            placeholder="my_taunt"
                                            className="bg-transparent text-white text-xs w-full focus:outline-none"
                                        />
                                        <span className="text-xs text-gray-500 font-bold ml-1">.ogg</span>
                                    </div>
                                </div>

                                {/* Size Estimator Meter */}
                                <div className="w-full sm:w-48 space-y-1 text-center sm:text-right">
                                    <div className="flex justify-between sm:justify-end gap-2 text-[11px] text-gray-400">
                                        <span>Estimated Size:</span>
                                        <span className="text-[#ff6600] font-bold">~{estimatedSizeKb} kB</span>
                                        <span className="text-gray-600">/ 128 kB</span>
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

                            {/* Action Buttons */}
                            <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-white/5">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={handlePlayPause}
                                        className="p-3.5 bg-white/10 hover:bg-[#ff6600] hover:text-black rounded-full transition-all text-white shadow-lg"
                                        title={isPlaying ? "Pause (Space)" : "Play Region (Space)"}
                                    >
                                        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                                    </button>
                                    <button
                                        onClick={replayFromStart}
                                        className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-all text-gray-400 hover:text-white"
                                        title="Replay from Clip Start (R)"
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                    </button>
                                </div>

                                <button
                                    onClick={handleExport}
                                    disabled={isProcessing || !ffmpegLoaded}
                                    className={clsx(
                                        "flex items-center px-6 py-3 rounded-xl font-bold font-mono transition-all uppercase tracking-wider text-xs",
                                        isProcessing || !ffmpegLoaded
                                            ? "bg-white/5 text-gray-500 cursor-not-allowed border border-white/5"
                                            : "bg-[#ff6600] hover:bg-[#ff8533] text-black shadow-lg shadow-[#ff6600]/25 hover:shadow-[#ff6600]/40 hover:scale-[1.02]"
                                    )}
                                >
                                    {isProcessing ? (
                                        <>
                                            <div className="animate-spin mr-2 h-4 w-4 border-2 border-black border-t-transparent rounded-full" />
                                            Mastering Vorbis OGG...
                                        </>
                                    ) : (
                                        <>
                                            <Download className="w-4 h-4 mr-2" />
                                            Export Taunt (.ogg)
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Alerts */}
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

                {/* History Section with Quick Slot Assignments */}
                {history.length > 0 && (
                    <div className="mt-10 pt-6 border-t border-white/10 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-white">
                                <History className="w-4 h-4 text-[#ff6600]" />
                                <h3 className="text-base font-bold">Recent Audio Taunts ({history.length})</h3>
                            </div>
                            <span className="text-[11px] text-gray-500">Stored in browser IndexedDB</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {history.map((item) => (
                                <div 
                                    key={item.id} 
                                    className="bg-black/40 border border-white/5 hover:border-white/15 rounded-xl p-3 flex items-center justify-between group transition-all"
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
                                                <span className="text-xs font-bold text-gray-200 truncate" title={item.name}>
                                                    {item.name}
                                                </span>
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
                                            title="Preview"
                                        >
                                            {playingId === item.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
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
                            ))}
                        </div>
                    </div>
                )}

                {/* Collapsible Debug Console */}
                <div className="mt-8 pt-4 border-t border-white/5">
                    <button 
                        onClick={() => setShowDebug(!showDebug)}
                        className="flex items-center justify-between w-full text-[11px] text-gray-500 hover:text-gray-300 py-1"
                    >
                        <span>FFmpeg WASM & Audio Event Log ({debugLog.length})</span>
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
        </div>
    );
};
