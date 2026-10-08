import React, { useRef, useState } from 'react';
import type WaveSurfer from 'wavesurfer.js';
import { VoiceRecorderModal } from './VoiceRecorderModal';
import { WebImportModal } from './WebImportModal';
import { AlertCircle, CheckCircle2, Upload } from 'lucide-react';
import { useAudioEditorStatus } from '../hooks/useAudioEditorStatus';
import { useAudioEditorHistory, type HistoryItem } from '../hooks/useAudioEditorHistory';
import { useAudioEditorLifecycle } from '../hooks/useAudioEditorLifecycle';
import { useAudioEditorSource } from '../hooks/useAudioEditorSource';
import { useAudioEditorWaveform } from '../hooks/useAudioEditorWaveform';
import { useFfmpegExport } from '../hooks/useFfmpegExport';
import { useAudioEditorHotkeys } from '../hooks/useAudioEditorHotkeys';
import { WorkstationHeader } from './audioEditor/WorkstationHeader';
import { AudioFilePicker } from './audioEditor/AudioFilePicker';
import { AudioFileBar } from './audioEditor/AudioFileBar';
import { WaveformCanvas } from './audioEditor/WaveformCanvas';
import { TransportBar } from './audioEditor/TransportBar';
import { TauntWindowBar } from './audioEditor/TauntWindowBar';
import { ExportConsole } from './audioEditor/ExportConsole';
import { TauntHistoryList } from './audioEditor/TauntHistoryList';
import { DiagnosticsPanel } from './audioEditor/DiagnosticsPanel';

interface AudioEditorProps {
    onEquipToSlot?: (tauntId: string, slotNum: number) => void;
    initialFile?: File | null;
}

export const AudioEditor: React.FC<AudioEditorProps> = ({ initialFile }) => {
    // Shared between the hooks below: the mount effect in useAudioEditorLifecycle tears all three down on unmount.
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const previewAudioRef = useRef<HTMLAudioElement | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);

    // UI State
    const [isRecordingModalOpen, setIsRecordingModalOpen] = useState(false);
    const [isWebImportModalOpen, setIsWebImportModalOpen] = useState(false);
    const [showDebug, setShowDebug] = useState(false);
    const [showShortcuts, setShowShortcuts] = useState(false);

    // Hook order fixes effect order: mount/teardown, initialFile, drag & drop, waveform, zoom, loop sync, hotkeys.
    const { error, setError, exportSuccess, setExportSuccess, debugLog, addLog } = useAudioEditorStatus();
    const historyState = useAudioEditorHistory({ wavesurferRef, previewAudioRef, setError, setExportSuccess });
    const { history, loadHistory } = historyState;
    const { ffmpegLoaded } = useAudioEditorLifecycle({ addLog, setError, loadHistory, wavesurferRef, previewAudioRef, audioCtxRef });
    const {
        file, audioBuffer, measuredPeakDb, tauntName, setTauntName, isDraggingOver,
        analyzeSliceMetrics, loadAudioFile,
    } = useAudioEditorSource({ initialFile, audioCtxRef, setError, setExportSuccess });
    const {
        containerRef, timelineRef, isPlaying, currentTime, regionStart, audioDuration,
        zoomLevel, setZoomLevel, duration, durationRef, regionStartRef, activeAuditionMode,
        loopRegion, setLoopRegion, nudgeStep, setNudgeStep, nudgeRegion, handleAuditionCut,
        handlePlayFullTrack, handleRewindToCut, handleMoveCutToCursor, handleSetDuration,
    } = useAudioEditorWaveform({ file, audioBuffer, analyzeSliceMetrics, addLog, wavesurferRef });
    const { isProcessing, handleExport } = useFfmpegExport({
        file, ffmpegLoaded, tauntName, measuredPeakDb, durationRef, regionStartRef,
        addLog, setError, setExportSuccess, loadHistory,
    });
    useAudioEditorHotkeys({
        handleAuditionCut, handlePlayFullTrack, handleRewindToCut, handleMoveCutToCursor,
        nudgeRegion, setLoopRegion, handleExport, wavesurferRef,
    });

    const handleReloadIntoEditor = (item: HistoryItem) => {
        const f = new File([item.blob], item.name, { type: 'audio/ogg' });
        loadAudioFile(f);
    };

    // Estimated OGG size (~16 kB/s at Q4 mono + header ~4kB)
    const estimatedSizeKb = Math.round(duration * 16 + 4);

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
                <WorkstationHeader
                    setIsWebImportModalOpen={setIsWebImportModalOpen}
                    setIsRecordingModalOpen={setIsRecordingModalOpen}
                    showShortcuts={showShortcuts}
                    setShowShortcuts={setShowShortcuts}
                />

                {/* Keyboard Shortcut Cheat Sheet */}
                {showShortcuts && (
                    <div className="mt-4 p-4 rounded-xl bg-black/70 border border-white/10 text-xs grid grid-cols-2 sm:grid-cols-4 gap-3 text-gray-300">
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
                    <AudioFilePicker loadAudioFile={loadAudioFile} />
                ) : (
                    /* Active Audio Workstation */
                    <div className="mt-8 space-y-6">
                        {/* Audio File Top Bar */}
                        <AudioFileBar file={file} audioDuration={audioDuration} loadAudioFile={loadAudioFile} />

                        {/* Interactive Waveform Canvas */}
                        <WaveformCanvas
                            isPlaying={isPlaying}
                            currentTime={currentTime}
                            duration={duration}
                            zoomLevel={zoomLevel}
                            setZoomLevel={setZoomLevel}
                            containerRef={containerRef}
                            timelineRef={timelineRef}
                        />

                        {/* DAW Transport Bar & Nudge Controls */}
                        <TransportBar
                            handleAuditionCut={handleAuditionCut}
                            isPlaying={isPlaying}
                            activeAuditionMode={activeAuditionMode}
                            handlePlayFullTrack={handlePlayFullTrack}
                            handleRewindToCut={handleRewindToCut}
                            handleMoveCutToCursor={handleMoveCutToCursor}
                            setLoopRegion={setLoopRegion}
                            loopRegion={loopRegion}
                            nudgeRegion={nudgeRegion}
                            nudgeStep={nudgeStep}
                            setNudgeStep={setNudgeStep}
                        />

                        {/* Minimalist Taunt Window & Automated Mastering Bar */}
                        <TauntWindowBar duration={duration} regionStart={regionStart} handleSetDuration={handleSetDuration} />

                        {/* Export & Overload Game Installation Console */}
                        <ExportConsole
                            tauntName={tauntName}
                            setTauntName={setTauntName}
                            estimatedSizeKb={estimatedSizeKb}
                            handleExport={handleExport}
                            isProcessing={isProcessing}
                            ffmpegLoaded={ffmpegLoaded}
                        />

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
                    <TauntHistoryList historyState={historyState} handleReloadIntoEditor={handleReloadIntoEditor} />
                )}

                {/* Collapsible WebAssembly & DSP Diagnostics */}
                <DiagnosticsPanel showDebug={showDebug} setShowDebug={setShowDebug} debugLog={debugLog} />
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
