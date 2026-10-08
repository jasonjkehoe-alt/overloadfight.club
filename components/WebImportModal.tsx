import React, { useState, useEffect } from 'react';
import {
    X,
    Globe,
    Link2,
    Radio,
    Film
} from 'lucide-react';
import { useDialog } from '../hooks/useDialog';
import { useWebImportPreview } from '../hooks/useWebImportPreview';
import { useWebImportYouTube } from '../hooks/useWebImportYouTube';
import { useWebImportArchive } from '../hooks/useWebImportArchive';
import { useWebImportVideo } from '../hooks/useWebImportVideo';
import { useWebImportDirect } from '../hooks/useWebImportDirect';
import { YouTubeIcon } from './webImport/YouTubeIcon';
import { YouTubeTab } from './webImport/YouTubeTab';
import { ArchiveTab } from './webImport/ArchiveTab';
import { VideoTab } from './webImport/VideoTab';
import { DirectTab } from './webImport/DirectTab';

export type { YouTubeSearchResult } from '../hooks/useWebImportYouTube';

interface WebImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAudioReady: (file: File) => void;
}

type TabType = 'youtube' | 'archive' | 'video' | 'direct';

export const WebImportModal: React.FC<WebImportModalProps> = ({ isOpen, onClose, onAudioReady }) => {
    const dialog = useDialog(isOpen, onClose);
    const [activeTab, setActiveTab] = useState<TabType>('youtube');

    const preview = useWebImportPreview();
    const { stopPreview } = preview;
    const yt = useWebImportYouTube({ preview, onAudioReady, onClose });
    const archive = useWebImportArchive({ stopPreview, onAudioReady, onClose });
    const video = useWebImportVideo({ stopPreview });
    const direct = useWebImportDirect({ stopPreview, onAudioReady, onClose });
    const { setYtError } = yt;
    const { setArchiveError } = archive;
    const { setVideoError } = video;
    const { setDirectError } = direct;

    useEffect(() => {
        if (isOpen) {
            // Pre-warm backend extraction engine so first user click is instant
            fetch('/api/import/warmup').catch(() => {});
        } else {
            stopPreview();
            setYtError(null);
            setArchiveError(null);
            setVideoError(null);
            setDirectError(null);
        }
    }, [isOpen]);

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 font-mono ${isOpen ? 'block' : 'hidden'}`}>
            <div {...dialog.props} className="bg-[#141414] border border-[#ff6600]/40 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-black/80 to-[#1a0e05]/80">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#ff6600]/20 border border-[#ff6600]/50 flex items-center justify-center text-[#ff6600] shadow-md">
                            <Globe className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 id={dialog.titleId} className="text-xl font-bold text-white brand-font tracking-tight flex items-center gap-2">
                                IMPORT AUDIO FROM WEB & MEDIA
                                <span className="px-2 py-0.5 text-[9px] uppercase font-bold tracking-widest bg-[#ff6600]/10 border border-[#ff6600]/40 text-[#ff6600] rounded">
                                    Universal Grabber
                                </span>
                            </h2>
                            <p className="text-xs text-gray-400">
                                Rip YouTube clips, explore open-source archives, or extract audio from videos
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation Tabs */}
                <div className="flex border-b border-white/10 bg-black/40 px-6 gap-2 text-xs overflow-x-auto">
                    <button
                        onClick={() => { stopPreview(); setActiveTab('youtube'); }}
                        className={`flex items-center gap-2 py-3 px-4 border-b-2 font-bold transition-all whitespace-nowrap ${
                            activeTab === 'youtube'
                                ? 'border-[#ff6600] text-[#ff6600] bg-[#ff6600]/10'
                                : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5'
                        }`}
                    >
                        <YouTubeIcon className="w-4 h-4 text-red-500" />
                        <span>YouTube Ripper</span>
                    </button>

                    <button
                        onClick={() => { stopPreview(); setActiveTab('archive'); }}
                        className={`flex items-center gap-2 py-3 px-4 border-b-2 font-bold transition-all whitespace-nowrap ${
                            activeTab === 'archive'
                                ? 'border-[#ff6600] text-[#ff6600] bg-[#ff6600]/10'
                                : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5'
                        }`}
                    >
                        <Radio className="w-4 h-4 text-amber-400" />
                        <span>Internet Archive Vault</span>
                    </button>

                    <button
                        onClick={() => { stopPreview(); setActiveTab('video'); }}
                        className={`flex items-center gap-2 py-3 px-4 border-b-2 font-bold transition-all whitespace-nowrap ${
                            activeTab === 'video'
                                ? 'border-[#ff6600] text-[#ff6600] bg-[#ff6600]/10'
                                : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5'
                        }`}
                    >
                        <Film className="w-4 h-4 text-cyan-400" />
                        <span>Video File Extractor</span>
                    </button>

                    <button
                        onClick={() => { stopPreview(); setActiveTab('direct'); }}
                        className={`flex items-center gap-2 py-3 px-4 border-b-2 font-bold transition-all whitespace-nowrap ${
                            activeTab === 'direct'
                                ? 'border-[#ff6600] text-[#ff6600] bg-[#ff6600]/10'
                                : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5'
                        }`}
                    >
                        <Link2 className="w-4 h-4 text-emerald-400" />
                        <span>Direct Audio URL</span>
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    {/* TAB 1: YOUTUBE */}
                    {activeTab === 'youtube' && (
                        <YouTubeTab yt={yt} preview={preview} />
                    )}

                    {/* TAB 2: INTERNET ARCHIVE */}
                    {activeTab === 'archive' && (
                        <ArchiveTab archive={archive} preview={preview} />
                    )}

                    {/* TAB 3: VIDEO FILE EXTRACTOR */}
                    {activeTab === 'video' && (
                        <VideoTab video={video} preview={preview} onAudioReady={onAudioReady} onClose={onClose} />
                    )}

                    {/* TAB 4: DIRECT URL */}
                    {activeTab === 'direct' && (
                        <DirectTab direct={direct} preview={preview} />
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 border-t border-white/10 bg-black/60 flex items-center justify-between text-[11px] text-gray-500">
                    <span>Overload Taunt Master &bull; Web & Media Pipeline</span>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
