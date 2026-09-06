import React, { useEffect, useRef, useState } from 'react';
import { AudioManual } from './AudioManual';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';
import { FFmpegService } from '../utils/ffmpeg';
import { saveTaunt, getTaunts, deleteTaunt, updateTauntName } from '../utils/audioHistoryDb';
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
    ChevronDown,
    ChevronUp,
    CheckCircle2
} from 'lucide-react';
import { clsx } from 'clsx';

interface HistoryItem {
    id: string;
    name: string;
    date: number;
    blob: Blob;
}

export const AudioEditor: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const regionsRef = useRef<RegionsPlugin | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [exportSuccess, setExportSuccess] = useState<string | null>(null);
    const [regionStart, setRegionStart] = useState(0);
    const [audioDuration, setAudioDuration] = useState(0);
    const [zoomLevel, setZoomLevel] = useState(50);
    const [duration, setDuration] = useState(3.0);
    const durationRef = useRef(3.0);
    const [debugLog, setDebugLog] = useState<string[]>([]);
    const [showDebug, setShowDebug] = useState(false);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [playingId, setPlayingId] = useState<string | null>(null);
    const previewAudioRef = useRef<HTMLAudioElement | null>(null);

    const addLog = (msg: string) => {
        console.log(msg);
        setDebugLog(prev => [...prev, `${new Date().toISOString().split('T')[1].split('.')[0]} ${msg}`]);
    };

    const loadHistory = async () => {
        try {
            const items = await getTaunts();
            setHistory(items.sort((a, b) => b.date - a.date));
        } catch (e) {
            console.error('Failed to load history', e);
        }
    };

    useEffect(() => {
        addLog('Initializing WebAssembly audio engine...');
        FFmpegService.getInstance()
            .then(() => {
                addLog('FFmpeg WASM loaded successfully.');
                setFfmpegLoaded(true);
            })
            .catch((e) => {
                console.error('FFmpeg load error object:', e);
                const msg = e instanceof Error ? e.message : JSON.stringify(e);
                addLog(`FFmpeg load error: ${msg}`);
                setError(`Failed to load WebAssembly FFmpeg: ${msg}`);
            });

        loadHistory();

        return () => {
            if (wavesurferRef.current) {
                wavesurferRef.current.destroy();
            }
            if (previewAudioRef.current) {
                previewAudioRef.current.pause();
                previewAudioRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (!containerRef.current || !file) return;
        addLog(`File loaded: ${file.name}`);

        if (wavesurferRef.current) {
            wavesurferRef.current.destroy();
        }

        try {
            const ws = WaveSurfer.create({
                container: containerRef.current,
                waveColor: '#4b5563',
                progressColor: '#ff6600',
                cursorColor: '#ff9933',
                barWidth: 2,
                barGap: 1,
                height: 128,
                normalize: true,
                minPxPerSec: zoomLevel,
            });

            const wsRegions = RegionsPlugin.create();
            ws.registerPlugin(wsRegions);
            regionsRef.current = wsRegions;

            ws.loadBlob(file);

            ws.on('ready', () => {
                addLog('Waveform rendered and ready.');
                const dur = ws.getDuration();
                setAudioDuration(dur);
                
                // Add initial region
                const initialDuration = Math.min(durationRef.current, dur);
                wsRegions.addRegion({
                    start: 0,
                    end: initialDuration,
                    color: 'rgba(255, 102, 0, 0.25)',
                    drag: true,
                    resize: false,
                });
            });

            ws.on('error', (e) => {
                addLog(`WaveSurfer error: ${e}`);
            });

            ws.on('play', () => setIsPlaying(true));
            ws.on('pause', () => setIsPlaying(false));

            wsRegions.on('region-updated', (region) => {
                setRegionStart(region.start);
                const currentEnd = region.end;
                const currentStart = region.start;
                const diff = currentEnd - currentStart;

                if (Math.abs(diff - durationRef.current) > 0.01) {
                    region.setOptions({ end: currentStart + durationRef.current });
                }
            });

            // Loop region playback
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

    // Duration update
    useEffect(() => {
        durationRef.current = duration;
        if (regionsRef.current) {
            const regions = regionsRef.current.getRegions();
            if (regions.length > 0) {
                const region = regions[0];
                const newEnd = region.start + duration;
                region.setOptions({ end: newEnd });
            }
        }
    }, [duration]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
            setExportSuccess(null);
        }
    };

    const handlePlayPause = () => {
        if (wavesurferRef.current && regionsRef.current) {
            if (wavesurferRef.current.isPlaying()) {
                wavesurferRef.current.pause();
            } else {
                const currentTime = wavesurferRef.current.getCurrentTime();
                const regions = regionsRef.current.getRegions();

                if (regions.length > 0) {
                    const region = regions[0];
                    if (currentTime >= region.start && currentTime < region.end) {
                        wavesurferRef.current.play();
                    } else {
                        region.play();
                    }
                } else {
                    wavesurferRef.current.play();
                }
            }
        }
    };

    const handleExport = async () => {
        if (!file || !ffmpegLoaded) return;
        setIsProcessing(true);
        setError(null);
        setExportSuccess(null);
        addLog('Starting export pipeline...');

        try {
            const ffmpeg = await FFmpegService.getInstance();
            const lastDotIndex = file.name.lastIndexOf('.');
            const inputName = 'input' + (lastDotIndex !== -1 ? file.name.substring(lastDotIndex) : '.tmp');
            const outputName = 'taunt.ogg';

            // Clean naming
            const rawBase = lastDotIndex !== -1 ? file.name.substring(0, lastDotIndex) : file.name;
            const baseName = rawBase.replace(/[^a-zA-Z0-9_-]/g, '_');
            let finalName = `${baseName}.ogg`;
            let counter = 2;
            const existingNames = new Set(history.map(item => item.name));
            
            while (existingNames.has(finalName)) {
                finalName = `${baseName}_${counter}.ogg`;
                counter++;
            }

            addLog(`Writing source file (${inputName}) to virtual memory...`);
            await ffmpeg.writeFile(inputName, await fetchFile(file));

            addLog('Executing FFmpeg: Trimming region, stripping leading silence, downmixing to Mono, Vorbis Q4...');
            const execArgs = [
                '-ss', regionStart.toString(),
                '-t', duration.toString(),
                '-i', inputName,
                '-af', 'silenceremove=start_periods=1:start_threshold=-50dB',
                '-ac', '1',
                '-c:a', 'libvorbis',
                '-q:a', '4',
                outputName
            ];

            await ffmpeg.exec(execArgs);

            addLog('Reading encoded OGG data...');
            const data = await ffmpeg.readFile(outputName);
            const blob = new Blob([data as unknown as BlobPart], { type: 'audio/ogg' });

            const sizeKb = (blob.size / 1024).toFixed(1);
            if (blob.size > 128 * 1024) {
                setError(`Warning: File size is ${sizeKb} kB, which exceeds the 128 kB Overload limit. Try selecting a shorter clip or quieter section.`);
            } else {
                setExportSuccess(`Exported "${finalName}" successfully (${sizeKb} kB)`);
            }

            // Save to IndexedDB history
            await saveTaunt(finalName, blob);
            await loadHistory();

            // Trigger browser download
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = finalName;
            a.click();
            URL.revokeObjectURL(url);
            addLog(`Export complete: ${finalName} (${sizeKb} kB)`);
        } catch (err: any) {
            console.error(err);
            const msg = err instanceof Error ? err.message : String(err);
            addLog(`Export failed: ${msg}`);
            setError(`Export failed: ${msg}`);
        } finally {
            setIsProcessing(false);
        }
    };

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

    const handleStartRename = (item: HistoryItem) => {
        setEditingId(item.id);
        setEditName(item.name);
    };

    const handleCancelRename = () => {
        setEditingId(null);
        setEditName('');
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
            if (previewAudioRef.current) {
                previewAudioRef.current.pause();
            }
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

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newStart = parseFloat(e.target.value);
        setRegionStart(newStart);

        if (regionsRef.current) {
            const regions = regionsRef.current.getRegions();
            if (regions.length > 0) {
                regions[0].setOptions({
                    start: newStart,
                    end: newStart + duration
                });
            }
        }
    };

    return (
        <div className="w-full max-w-5xl mx-auto space-y-8">
            {/* Main Editor Card */}
            <div className="bg-[#121212] rounded-xl border border-white/10 shadow-2xl p-6 md:p-8">
                <div className="mb-6 text-center">
                    <h2 className="text-3xl font-bold text-[#ff6600] mb-2 tracking-tight brand-font">
                        OVERLOAD TAUNT MAKER
                    </h2>
                    <p className="text-gray-400 font-mono text-sm">
                        Create game-compliant 3.0s .ogg audio taunts natively in your browser
                    </p>
                </div>

                {!ffmpegLoaded && (
                    <div className="mb-6 p-4 bg-orange-950/30 border border-orange-500/30 text-orange-200 rounded-lg flex flex-col items-center justify-center font-mono">
                        <div className="flex items-center mb-2">
                            <div className="animate-spin mr-3 h-5 w-5 border-2 border-orange-400 border-t-transparent rounded-full"></div>
                            <span>Loading WebAssembly FFmpeg Core...</span>
                        </div>
                        <div className="text-xs text-orange-300/70">
                            {debugLog[debugLog.length - 1] || 'Initializing...'}
                        </div>
                    </div>
                )}

                {/* Upload Zone */}
                <div className="mb-8">
                    <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-white/20 hover:border-[#ff6600]/60 rounded-xl cursor-pointer bg-black/40 hover:bg-black/60 transition-all group">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-10 h-10 mb-3 text-gray-400 group-hover:text-[#ff6600] transition-colors" />
                            <p className="mb-2 text-sm text-gray-300">
                                <span className="font-semibold text-[#ff6600]">Click to select audio</span> or drag and drop here
                            </p>
                            <p className="text-xs text-gray-500 font-mono">MP3, WAV, FLAC, OGG (Engine outputs max 3.0s mono Ogg)</p>
                        </div>
                        <input type="file" className="hidden" accept="audio/*" onChange={handleFileUpload} />
                    </label>
                </div>

                {/* Waveform Workspace */}
                {file && (
                    <div className="space-y-6 bg-black/50 p-6 rounded-xl border border-white/5 animate-fade-in">
                        <div className="flex items-center justify-between pb-2 border-b border-white/5 text-sm">
                            <div className="flex items-center gap-2 text-gray-300 font-mono">
                                <FileAudio className="w-4 h-4 text-[#ff6600]" />
                                <span className="font-semibold">{file.name}</span>
                            </div>
                            <span className="text-xs text-gray-500 font-mono">
                                Total: {audioDuration.toFixed(2)}s
                            </span>
                        </div>

                        {/* Waveform Canvas Container */}
                        <div className="bg-black/80 p-4 rounded-lg border border-white/10 shadow-inner">
                            <div ref={containerRef} className="w-full" />
                        </div>

                        {/* Start Scrubber */}
                        <div className="flex flex-col space-y-2">
                            <div className="flex justify-between text-xs text-gray-400 font-mono">
                                <span>0.00s</span>
                                <span className="text-[#ff6600] font-bold">Start: {regionStart.toFixed(2)}s</span>
                                <span>{audioDuration.toFixed(2)}s</span>
                            </div>
                            <input
                                type="range"
                                min={0}
                                max={Math.max(0, audioDuration - duration)}
                                step={0.01}
                                value={regionStart}
                                onChange={handleSliderChange}
                                className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#ff6600]"
                            />
                        </div>

                        {/* Controls Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Zoom Slider */}
                            <div className="bg-white/5 p-4 rounded-lg border border-white/5">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center text-sm text-gray-300 font-mono">
                                        <ZoomIn className="w-4 h-4 mr-2 text-[#ff6600]" />
                                        <span>Waveform Zoom</span>
                                    </div>
                                    <span className="text-xs text-[#ff6600] font-mono">{zoomLevel} px/s</span>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <ZoomOut className="w-4 h-4 text-gray-500" />
                                    <input
                                        type="range"
                                        min={10}
                                        max={500}
                                        step={10}
                                        value={zoomLevel}
                                        onChange={(e) => setZoomLevel(parseInt(e.target.value))}
                                        className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#ff6600]"
                                    />
                                    <ZoomIn className="w-4 h-4 text-gray-500" />
                                </div>
                            </div>

                            {/* Duration Slider */}
                            <div className="bg-white/5 p-4 rounded-lg border border-white/5">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center text-sm text-gray-300 font-mono">
                                        <Maximize className="w-4 h-4 mr-2 text-[#ff6600]" />
                                        <span>Taunt Window (Max 3.0s)</span>
                                    </div>
                                    <span className="text-xs text-[#ff6600] font-mono font-bold">{duration.toFixed(1)}s</span>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <span className="text-xs text-gray-500 font-mono">0.5s</span>
                                    <input
                                        type="range"
                                        min={0.5}
                                        max={3.0}
                                        step={0.1}
                                        value={duration}
                                        onChange={(e) => setDuration(parseFloat(e.target.value))}
                                        className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#ff6600]"
                                    />
                                    <span className="text-xs text-gray-500 font-mono">3.0s</span>
                                </div>
                            </div>
                        </div>

                        {/* Playback & Export Buttons */}
                        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/5">
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={handlePlayPause}
                                    className="p-3 bg-white/10 hover:bg-[#ff6600] hover:text-black rounded-full transition-all text-white shadow-lg"
                                    title={isPlaying ? "Pause" : "Play Region"}
                                >
                                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                                </button>
                                <div className="text-sm font-mono text-gray-400">
                                    Clip: <span className="text-[#ff6600]">{regionStart.toFixed(2)}s</span> &rarr; <span className="text-[#ff6600]">{(regionStart + duration).toFixed(2)}s</span>
                                </div>
                            </div>

                            <button
                                onClick={handleExport}
                                disabled={isProcessing || !ffmpegLoaded}
                                className={clsx(
                                    "flex items-center px-6 py-3 rounded-lg font-bold font-mono transition-all uppercase tracking-wider",
                                    isProcessing || !ffmpegLoaded
                                        ? "bg-white/5 text-gray-500 cursor-not-allowed border border-white/5"
                                        : "bg-[#ff6600] hover:bg-[#ff8533] text-black shadow-lg shadow-[#ff6600]/25 hover:shadow-[#ff6600]/40"
                                )}
                            >
                                {isProcessing ? (
                                    <>
                                        <div className="animate-spin mr-2 h-4 w-4 border-2 border-black border-t-transparent rounded-full"></div>
                                        Encoding OGG...
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-5 h-5 mr-2" />
                                        Export Taunt (.ogg)
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Status / Alert Messages */}
                        {error && (
                            <div className="p-4 bg-red-950/40 text-red-200 rounded-lg flex items-center border border-red-500/30 font-mono text-sm">
                                <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 text-red-400" />
                                <span>{error}</span>
                            </div>
                        )}

                        {exportSuccess && (
                            <div className="p-4 bg-green-950/40 text-green-200 rounded-lg flex items-center border border-green-500/30 font-mono text-sm">
                                <CheckCircle2 className="w-5 h-5 mr-3 flex-shrink-0 text-green-400" />
                                <span>{exportSuccess}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* History Section */}
                {history.length > 0 && (
                    <div className="mt-10 pt-6 border-t border-white/10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2 text-white font-mono">
                                <History className="w-5 h-5 text-[#ff6600]" />
                                <h3 className="text-lg font-bold">Recent Exports ({history.length})</h3>
                            </div>
                            <span className="text-xs text-gray-500 font-mono">Saved in browser IndexedDB</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {history.map((item) => (
                                <div 
                                    key={item.id} 
                                    className="bg-black/40 border border-white/5 hover:border-white/20 rounded-lg p-3 flex items-center justify-between group transition-all"
                                >
                                    <div className="flex flex-col overflow-hidden flex-grow mr-3">
                                        {editingId === item.id ? (
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="text"
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    className="bg-black border border-orange-500 rounded px-2 py-1 text-xs text-white w-full focus:outline-none font-mono"
                                                    autoFocus
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleSaveRename(item.id);
                                                        if (e.key === 'Escape') handleCancelRename();
                                                    }}
                                                />
                                                <button onClick={() => handleSaveRename(item.id)} className="text-green-400 hover:text-green-300 p-1">
                                                    <Check className="w-4 h-4" />
                                                </button>
                                                <button onClick={handleCancelRename} className="text-red-400 hover:text-red-300 p-1">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <span className="font-mono text-sm text-gray-200 truncate font-semibold" title={item.name}>
                                                    {item.name}
                                                </span>
                                                <div className="flex space-x-3 text-xs text-gray-500 font-mono mt-0.5">
                                                    <span>{new Date(item.date).toLocaleDateString()} {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    <span>{(item.blob.size / 1024).toFixed(1)} KB</span>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                        <button
                                            onClick={() => handlePreviewHistory(item)}
                                            className={clsx(
                                                "p-2 rounded-md hover:bg-white/10 transition-colors",
                                                playingId === item.id ? "text-green-400 bg-green-500/10" : "text-gray-400"
                                            )}
                                            title={playingId === item.id ? "Pause" : "Preview"}
                                        >
                                            {playingId === item.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                        </button>
                                        <button
                                            onClick={() => handleStartRename(item)}
                                            className="p-2 hover:bg-white/10 rounded-md text-yellow-400 transition-colors"
                                            title="Rename"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDownloadHistoryItem(item)}
                                            className="p-2 hover:bg-white/10 rounded-md text-blue-400 transition-colors"
                                            title="Download again"
                                        >
                                            <Download className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteHistoryItem(item.id)}
                                            className="p-2 hover:bg-white/10 rounded-md text-red-400 transition-colors"
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
                        className="flex items-center justify-between w-full text-xs font-mono text-gray-500 hover:text-gray-300 py-1"
                    >
                        <span>WebAssembly & Audio Log ({debugLog.length} events)</span>
                        {showDebug ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {showDebug && (
                        <div className="mt-2 p-3 bg-black/80 rounded-lg border border-white/5 font-mono text-xs text-gray-400 h-36 overflow-y-auto space-y-1">
                            {debugLog.map((log, i) => (
                                <div key={i} className="leading-relaxed">{log}</div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Start & In-Game Manual */}
            <AudioManual />
        </div>
    );
};
