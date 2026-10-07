import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Check, X, Radio, AlertCircle } from 'lucide-react';

interface VoiceRecorderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAudioReady: (file: File) => void;
}

export const VoiceRecorderModal: React.FC<VoiceRecorderModalProps> = ({ isOpen, onClose, onAudioReady }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [isPlayingPreview, setIsPlayingPreview] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [audioLevel, setAudioLevel] = useState(0);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<any>(null);
    const animFrameRef = useRef<number | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const previewAudioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (!isOpen) {
            stopRecordingSession();
            setAudioBlob(null);
            setError(null);
            setRecordingTime(0);
        }
    }, [isOpen]);

    const startRecording = async () => {
        try {
            setError(null);
            audioChunksRef.current = [];
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Set up audio analyzer for VU meter
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            audioContextRef.current = audioCtx;
            const source = audioCtx.createMediaStreamSource(stream);
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const updateLevel = () => {
                analyser.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) {
                    sum += dataArray[i];
                }
                const avg = sum / dataArray.length;
                setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
                animFrameRef.current = requestAnimationFrame(updateLevel);
            };
            updateLevel();

            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                setIsRecording(false);
                if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
                setAudioLevel(0);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);

            // Timer with max 5.0 seconds
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => {
                    if (prev >= 4.9) {
                        stopRecording();
                        return 5.0;
                    }
                    return Math.round((prev + 0.1) * 10) / 10;
                });
            }, 100);
        } catch (err: any) {
            console.error('Microphone access denied:', err);
            setError('Could not access microphone. Please check browser permissions.');
        }
    };

    const stopRecording = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
    };

    const stopRecordingSession = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
        if (previewAudioRef.current) {
            previewAudioRef.current.pause();
            previewAudioRef.current = null;
        }
        setIsPlayingPreview(false);
    };

    const handlePlayPreview = () => {
        if (!audioBlob) return;
        if (isPlayingPreview && previewAudioRef.current) {
            previewAudioRef.current.pause();
            setIsPlayingPreview(false);
        } else {
            const url = URL.createObjectURL(audioBlob);
            const audio = new Audio(url);
            audio.onended = () => {
                setIsPlayingPreview(false);
                URL.revokeObjectURL(url);
            };
            audio.play();
            previewAudioRef.current = audio;
            setIsPlayingPreview(true);
        }
    };

    const handleConfirm = () => {
        if (!audioBlob) return;
        const file = new File([audioBlob], `voice_taunt_${Date.now().toString().slice(-4)}.webm`, {
            type: audioBlob.type,
        });
        onAudioReady(file);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-mono">
            <div className="bg-[#121212] border border-[#ff6600]/40 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white p-1"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="text-center mb-6">
                    <div className="w-12 h-12 rounded-full bg-[#ff6600]/10 border border-[#ff6600]/30 flex items-center justify-center mx-auto mb-3 text-[#ff6600]">
                        <Mic className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-white brand-font tracking-wide">
                        HEADSET VOICE RECORDER
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                        Record a battle cry directly from your mic (up to 5.0s)
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-950/40 border border-red-500/30 text-red-300 rounded text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Meter & Status */}
                <div className="bg-black/60 rounded-xl p-4 border border-white/5 mb-6 text-center space-y-3">
                    <div className="text-3xl font-bold text-[#ff6600]">
                        {recordingTime.toFixed(1)}s <span className="text-xs text-gray-500">/ 5.0s</span>
                    </div>

                    {/* Live VU meter */}
                    <div className="w-full bg-gray-800 h-3 rounded-full overflow-hidden p-0.5 border border-white/10">
                        <div 
                            className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-[#ff6600] rounded-full transition-all duration-75"
                            style={{ width: `${isRecording ? audioLevel : 0}%` }}
                        />
                    </div>

                    <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                        {isRecording ? (
                            <span className="flex items-center gap-1.5 text-red-400 font-bold animate-pulse">
                                <Radio className="w-3.5 h-3.5" /> Recording Live Mic Input...
                            </span>
                        ) : audioBlob ? (
                            <span className="text-green-400 font-bold flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" /> Audio Captured!
                            </span>
                        ) : (
                            <span>Press Record to start</span>
                        )}
                    </div>
                </div>

                {/* Control Buttons */}
                <div className="flex items-center justify-center gap-4">
                    {!isRecording ? (
                        <button
                            onClick={startRecording}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition-all shadow-lg shadow-red-600/30 text-sm"
                        >
                            <Mic className="w-4 h-4" />
                            {audioBlob ? 'Re-Record' : 'Start Recording'}
                        </button>
                    ) : (
                        <button
                            onClick={stopRecording}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#ff6600] hover:bg-[#ff8533] text-black font-bold transition-all shadow-lg shadow-[#ff6600]/30 text-sm animate-pulse"
                        >
                            <Square className="w-4 h-4" />
                            Stop Recording
                        </button>
                    )}

                    {audioBlob && !isRecording && (
                        <button
                            onClick={handlePlayPreview}
                            className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
                            title={isPlayingPreview ? "Stop" : "Preview"}
                        >
                            {isPlayingPreview ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                        </button>
                    )}
                </div>

                {audioBlob && !isRecording && (
                    <div className="mt-6 pt-4 border-t border-white/10 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg border border-white/10 text-gray-400 hover:text-white text-xs"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#ff6600] hover:bg-[#ff8533] text-black font-bold text-xs shadow-lg shadow-[#ff6600]/25"
                        >
                            <Check className="w-4 h-4" />
                            Load into Editor
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
