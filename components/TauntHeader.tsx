import React, { useState } from 'react';
import { Volume2, ExternalLink, Gamepad2, BookOpen, Sliders, FolderOpen, Check, HardDrive, Unplug, RefreshCw } from 'lucide-react';
import { useOverloadFs } from '../context/OverloadFsContext';

interface TauntHeaderProps {
    activeTab: 'editor' | 'vault' | 'loadout' | 'manual';
    onSelectTab: (tab: 'editor' | 'vault' | 'loadout' | 'manual') => void;
}

export const TauntHeader: React.FC<TauntHeaderProps> = ({ activeTab, onSelectTab }) => {
    const { 
        isSupported, 
        isServerNative, 
        isClientConnected, 
        isConnecting, 
        folderName, 
        activePilot,
        connectLocalFolder, 
        disconnectLocalFolder 
    } = useOverloadFs();
    const [copiedPath, setCopiedPath] = useState(false);

    const handleCopyPath = () => {
        navigator.clipboard.writeText('%LOCALAPPDATA%Low\\Revival\\Overload\\AudioTaunts');
        setCopiedPath(true);
        setTimeout(() => setCopiedPath(false), 2000);
    };

    return (
        <header className="border-b border-gray-800 bg-[#0d0d0f]/90 backdrop-blur-md sticky top-16 z-30 font-mono rounded-t-xl mb-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                {/* Logo & Brand */}
                <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-[#ff6600]/10 border border-[#ff6600]/40 flex items-center justify-center text-[#ff6600] shadow-[0_0_15px_rgba(255,102,0,0.2)]">
                        <Volume2 className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-lg md:text-xl font-bold tracking-wider brand-font text-white flex items-center gap-2">
                            OVERLOAD <span className="text-[#ff6600]">TAUNT</span> MAKER
                        </h1>
                        <p className="text-[10px] text-gray-500 hidden sm:block uppercase tracking-widest">
                            Combat Audio System // 2.0 Pro
                        </p>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <nav className="flex items-center space-x-1 sm:space-x-2 bg-black/60 p-1 rounded-xl border border-gray-800 text-xs">
                    <button
                        onClick={() => onSelectTab('editor')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                            activeTab === 'editor'
                                ? 'bg-[#ff6600] text-black font-bold shadow-lg shadow-[#ff6600]/20'
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        <Sliders className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Editor</span>
                    </button>

                    <button
                        onClick={() => onSelectTab('vault')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                            activeTab === 'vault'
                                ? 'bg-[#ff6600] text-black font-bold shadow-lg shadow-[#ff6600]/20'
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        <FolderOpen className="w-3.5 h-3.5" />
                        <span>Vault</span>
                    </button>

                    <button
                        onClick={() => onSelectTab('loadout')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                            activeTab === 'loadout'
                                ? 'bg-[#ff6600] text-black font-bold shadow-lg shadow-[#ff6600]/20'
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        <Gamepad2 className="w-3.5 h-3.5" />
                        <span>Loadout (F1–F6)</span>
                    </button>

                    <button
                        onClick={() => onSelectTab('manual')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                            activeTab === 'manual'
                                ? 'bg-[#ff6600] text-black font-bold shadow-lg shadow-[#ff6600]/20'
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Manual</span>
                    </button>
                </nav>

                {/* Local PC Folder Connection / Game Link */}
                <div className="flex items-center space-x-2 sm:space-x-3">
                    {isClientConnected ? (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/40 bg-emerald-950/30 text-emerald-300 text-xs">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span className="hidden lg:inline font-semibold">PC Folder:</span>
                            <span className="truncate max-w-[120px] font-bold text-white">{activePilot || folderName}</span>
                            <button
                                onClick={disconnectLocalFolder}
                                className="ml-1 text-emerald-400/60 hover:text-red-400 p-0.5 rounded transition-colors"
                                title="Disconnect local PC folder"
                            >
                                <Unplug className="w-3 h-3" />
                            </button>
                        </div>
                    ) : isServerNative ? (
                        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-500/40 bg-blue-950/30 text-blue-300 text-xs">
                            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                            <span>Local Bridge Active</span>
                        </div>
                    ) : (
                        <button
                            onClick={connectLocalFolder}
                            disabled={isConnecting}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#ff6600]/60 bg-[#ff6600]/15 hover:bg-[#ff6600]/25 text-[#ff6600] hover:text-white text-xs font-bold transition-all shadow-[0_0_12px_rgba(255,102,0,0.15)]"
                            title="Connect to C:\Users\...\AppData\LocalLow\Revival\Overload on your PC"
                        >
                            {isConnecting ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <HardDrive className="w-3.5 h-3.5" />
                            )}
                            <span>{isConnecting ? 'Connecting...' : 'Connect PC Folder'}</span>
                        </button>
                    )}

                    <button
                        onClick={handleCopyPath}
                        className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-800 hover:border-[#ff6600]/40 text-gray-400 hover:text-white text-xs transition-all"
                        title="Copy game AudioTaunts folder path: %LOCALAPPDATA%Low\Revival\Overload\AudioTaunts"
                    >
                        {copiedPath ? <Check className="w-3 h-3 text-emerald-400" /> : <FolderOpen className="w-3 h-3 text-[#ff6600]" />}
                        <span>{copiedPath ? 'Path Copied' : 'Game Path'}</span>
                    </button>

                    <a 
                        href="https://github.com/overload-development-community/olmod/wiki/Audio-taunts" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-800 hover:border-[#ff6600]/50 hover:bg-[#ff6600]/10 text-gray-300 hover:text-white text-xs transition-all"
                    >
                        <span>OLMod</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                </div>
            </div>
        </header>
    );
};

export default TauntHeader;
