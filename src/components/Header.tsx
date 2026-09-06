import React from 'react';
import { Volume2, ExternalLink, ShieldCheck } from 'lucide-react';

export const Header: React.FC = () => {
    return (
        <header className="border-b border-white/10 bg-[#0c0c0c]/80 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-lg bg-[#ff6600]/10 border border-[#ff6600]/40 flex items-center justify-center text-[#ff6600] shadow-glow">
                        <Volume2 className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-lg md:text-xl font-bold tracking-wider brand-font text-white flex items-center gap-2">
                            OVERLOAD <span className="text-[#ff6600]">TAUNT</span> MAKER
                        </h1>
                        <p className="text-[10px] text-gray-400 font-mono hidden sm:block tracking-widest uppercase">
                            Standalone Pilot Audio Tool // 3.0s .ogg Vorbis
                        </p>
                    </div>
                </div>

                <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-green-950/40 border border-green-500/30 text-green-400 text-xs font-mono">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Client WASM Engine</span>
                    </div>

                    <a 
                        href="https://github.com/overload-development-community/olmod/wiki/Audio-taunts" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 hover:border-[#ff6600]/50 hover:bg-[#ff6600]/10 text-gray-300 hover:text-white text-xs font-mono transition-all"
                    >
                        <span>OLMod Wiki</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                </div>
            </div>
        </header>
    );
};
