import React from 'react';
import { FileAudio, FolderOpen } from 'lucide-react';

interface AudioFileBarProps {
    file: File;
    audioDuration: number;
    loadAudioFile: (f: File) => Promise<void>;
}

export const AudioFileBar: React.FC<AudioFileBarProps> = ({
    file,
    audioDuration,
    loadAudioFile,
}) => {
    return (
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
    );
};
