import React, { useState } from 'react';
import { Volume2, ExternalLink, Gamepad2, BookOpen, Sliders, FolderOpen, Check, Copy } from 'lucide-react';

interface HeaderProps {
    activeTab: 'editor' | 'vault' | 'loadout' | 'manual';
    onSelectTab: (tab: 'editor' | 'vault' | 'loadout' | 'manual') => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onSelectTab }) => {
    const [copiedPath, setCopiedPath] = useState(false);

    const handleCopyPath = () => {
        navigator.clipboard.writeText('%LOCALAPPDATA%Low\\Revival\\Overload\\AudioTaunts');
        setCopiedPath(true);
        setTimeout(() => setCopiedPath(false), 2000);
    };

    return (
        <header className="border-b border-white/10 bg-[#0c0c0c]/90 backdrop-blur-md sticky top-0 z-40 font-mono">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                {/* Logo & Brand */}
                <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-[#ff6600]/10 border border-[#ff6600]/40 flex items-center justify-center text-[#ff6600] shadow-glow">
                        <Volume2 className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-lg md:text-xl font-bold tracking-wider brand-font text-white flex items-center gap-2">
                            OVERLOAD <span className="text-[#ff6600]">FIGHT</span> CLUB
                        </h1>
                        <p className="text-[10px] text-gray-500 hidden sm:block uppercase tracking-widest">
                            overloadfight.club // Server, Pilot & Combat Station
                        </p>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <nav className="flex items-center space-x-1 sm:space-x-2 bg-black/50 p-1 rounded-xl border border-white/10 text-xs">
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

                {/* External Links / Quick Tool */}
                <div className="flex items-center space-x-2 sm:space-x-3">
                    <button
                        onClick={handleCopyPath}
                        className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/10 hover:border-[#ff6600]/40 text-gray-400 hover:text-white text-xs transition-all"
                        title="Copy game AudioTaunts folder path"
                    >
                        {copiedPath ? <Check className="w-3 h-3 text-green-400" /> : <FolderOpen className="w-3 h-3 text-[#ff6600]" />}
                        <span>{copiedPath ? 'Path Copied' : 'Game Folder'}</span>
                    </button>

                    <a 
                        href="https://github.com/overload-development-community/olmod/wiki/Audio-taunts" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 hover:border-[#ff6600]/50 hover:bg-[#ff6600]/10 text-gray-300 hover:text-white text-xs transition-all"
                    >
                        <span>OLMod</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                </div>
            </div>
        </header>
    );
};
