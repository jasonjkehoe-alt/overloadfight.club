import React from 'react';
import { Volume2 } from 'lucide-react';
import { PrefAccessors } from './types';

// TAB 2: General & Audio.
export const AudioTab: React.FC<Pick<PrefAccessors, 'getPrefVal' | 'setPrefVal'>> = ({ getPrefVal, setPrefVal }) => {
    return (
        <div className="bg-[#121215] border border-gray-800 rounded-2xl p-6 space-y-6">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-[#ff6600]" />
                <span>LANGUAGE &amp; AUDIO PREFERENCES</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Language */}
                <div className="space-y-2">
                    <label className="text-xs text-gray-400 font-bold">In-Game Language (O_LANGUAGE)</label>
                    <select
                        value={getPrefVal('O_LANGUAGE') || '0'}
                        onChange={(e) => setPrefVal('O_LANGUAGE', e.target.value)}
                        className="w-full bg-black/60 border border-white/15 focus:border-[#ff6600] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    >
                        <option value="0">0 — English</option>
                        <option value="1">1 — Deutsch (German)</option>
                        <option value="2">2 — Español (Spanish)</option>
                        <option value="3">3 — Français (French)</option>
                        <option value="4">4 — Русский (Russian)</option>
                    </select>
                </div>

                {/* Speaker Mode */}
                <div className="space-y-2">
                    <label className="text-xs text-gray-400 font-bold">Speaker Setup (O_SPEAKER_MODE)</label>
                    <select
                        value={getPrefVal('O_SPEAKER_MODE') || '2'}
                        onChange={(e) => setPrefVal('O_SPEAKER_MODE', e.target.value)}
                        className="w-full bg-black/60 border border-white/15 focus:border-[#ff6600] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    >
                        <option value="0">Stereo (2 Channels)</option>
                        <option value="1">Quadraphonic (4 Channels)</option>
                        <option value="2">Surround 5.1</option>
                        <option value="3">Surround 7.1</option>
                    </select>
                </div>

                {/* Sound Effects Volume */}
                <div className="bg-black/40 border border-white/5 p-4 rounded-xl space-y-2">
                    <div className="flex justify-between text-xs">
                        <span className="text-gray-300 font-bold">Sound Effects (SFX)</span>
                        <span className="text-[#ff6600] font-bold">{getPrefVal('O_VOLUME_SFX') || '25'}%</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={getPrefVal('O_VOLUME_SFX') || '25'}
                        onChange={(e) => setPrefVal('O_VOLUME_SFX', e.target.value)}
                        className="w-full accent-[#ff6600]"
                    />
                </div>

                {/* Music Volume */}
                <div className="bg-black/40 border border-white/5 p-4 rounded-xl space-y-2">
                    <div className="flex justify-between text-xs">
                        <span className="text-gray-300 font-bold">Music Volume</span>
                        <span className="text-[#ff6600] font-bold">{getPrefVal('O_VOLUME_MUSIC') || '0'}%</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={getPrefVal('O_VOLUME_MUSIC') || '0'}
                        onChange={(e) => setPrefVal('O_VOLUME_MUSIC', e.target.value)}
                        className="w-full accent-[#ff6600]"
                    />
                </div>

                {/* Voice Volume */}
                <div className="bg-black/40 border border-white/5 p-4 rounded-xl space-y-2">
                    <div className="flex justify-between text-xs">
                        <span className="text-gray-300 font-bold">Voice &amp; Comms Volume</span>
                        <span className="text-[#ff6600] font-bold">{getPrefVal('O_VOLUME_VOICE') || '14'}%</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={getPrefVal('O_VOLUME_VOICE') || '14'}
                        onChange={(e) => setPrefVal('O_VOLUME_VOICE', e.target.value)}
                        className="w-full accent-[#ff6600]"
                    />
                </div>

                {/* Ambient Volume */}
                <div className="bg-black/40 border border-white/5 p-4 rounded-xl space-y-2">
                    <div className="flex justify-between text-xs">
                        <span className="text-gray-300 font-bold">Ambient Environment Volume</span>
                        <span className="text-[#ff6600] font-bold">{getPrefVal('O_VOLUME_AMBIENT') || '38'}%</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={getPrefVal('O_VOLUME_AMBIENT') || '38'}
                        onChange={(e) => setPrefVal('O_VOLUME_AMBIENT', e.target.value)}
                        className="w-full accent-[#ff6600]"
                    />
                </div>
            </div>
        </div>
    );
};
