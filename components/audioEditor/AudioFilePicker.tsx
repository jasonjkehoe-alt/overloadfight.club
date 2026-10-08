import React from 'react';
import { Upload } from 'lucide-react';

interface AudioFilePickerProps {
    loadAudioFile: (f: File) => Promise<void>;
}

export const AudioFilePicker: React.FC<AudioFilePickerProps> = ({
    loadAudioFile,
}) => {
    return (
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
    );
};
