import { useState, useEffect } from 'react';
import { FFmpegService } from '../utils/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

interface UseWebImportVideoArgs {
    stopPreview: () => void;
}

// Video file tab of the web import dialog: extracts the audio track of a local
// video with the in-browser FFmpeg engine.
export function useWebImportVideo({ stopPreview }: UseWebImportVideoArgs) {
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoProcessing, setVideoProcessing] = useState(false);
    const [videoProgress, setVideoProgress] = useState<string | null>(null);
    const [videoError, setVideoError] = useState<string | null>(null);
    const [extractedAudio, setExtractedAudio] = useState<{ file: File; url: string } | null>(null);

    // Cleanup object URLs
    useEffect(() => {
        return () => {
            if (extractedAudio) URL.revokeObjectURL(extractedAudio.url);
        };
    }, [extractedAudio]);

    const handleVideoFileChange = (file: File) => {
        stopPreview();
        setVideoFile(file);
        setVideoError(null);
        setExtractedAudio(null);
    };

    const handleExtractVideoAudio = async () => {
        if (!videoFile) return;
        stopPreview();
        setVideoProcessing(true);
        setVideoProgress('Loading WebAssembly FFmpeg engine...');
        setVideoError(null);

        try {
            const ffmpeg = await FFmpegService.getInstance();
            setVideoProgress('Reading video data...');
            const data = await fetchFile(videoFile);

            const safeInputName = `input_${Date.now()}_video`;
            const safeOutputName = `output_${Date.now()}.wav`;

            await ffmpeg.writeFile(safeInputName, data);
            setVideoProgress('Extracting audio track (stripping video)...');

            // Strip video stream and convert audio directly to 44.1kHz WAV
            await ffmpeg.exec(['-i', safeInputName, '-vn', '-ar', '44100', '-ac', '2', safeOutputName]);

            setVideoProgress('Finalizing audio stream...');
            const audioData = await ffmpeg.readFile(safeOutputName);
            const audioBlob = new Blob([audioData as unknown as BlobPart], { type: 'audio/wav' });
            const cleanBaseName = videoFile.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
            const finalFile = new File([audioBlob], `${cleanBaseName}_audio.wav`, { type: 'audio/wav' });
            const previewBlobUrl = URL.createObjectURL(audioBlob);

            setExtractedAudio({ file: finalFile, url: previewBlobUrl });

            // Cleanup virtual files
            try {
                await ffmpeg.deleteFile(safeInputName);
                await ffmpeg.deleteFile(safeOutputName);
            } catch {}
        } catch (err: any) {
            console.error('Video extraction error:', err);
            setVideoError(err.message || 'Failed to extract audio track from video');
        } finally {
            setVideoProcessing(false);
            setVideoProgress(null);
        }
    };

    return {
        videoFile,
        videoProcessing,
        videoProgress,
        videoError,
        setVideoError,
        extractedAudio,
        handleVideoFileChange,
        handleExtractVideoAudio,
    };
}

export type WebImportVideo = ReturnType<typeof useWebImportVideo>;
