import React from 'react';
import { Sparkles } from 'lucide-react';
import { PrefAccessors } from './types';

// TAB 4: OLMOD Preferences.
export const OlmodTab: React.FC<PrefAccessors> = ({ getPrefVal, getPrefBool, setPrefVal }) => {
    return (
        <div className="bg-[#121215] border border-gray-800 rounded-2xl p-6 space-y-6">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#ff6600]" />
                <span>OLMOD MULTIPLAYER &amp; HUD ENHANCEMENTS</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Taunt Volume */}
                <div className="bg-black/40 border border-white/5 p-4 rounded-xl space-y-2">
                    <div className="flex justify-between">
                        <span className="text-gray-300 font-bold">Audio Taunt In-Game Volume</span>
                        <span className="text-[#ff6600] font-bold">{getPrefVal('MP_AUDIOTAUNT_VOLUME', true) || '21'}%</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={getPrefVal('MP_AUDIOTAUNT_VOLUME', true) || '21'}
                        onChange={(e) => setPrefVal('MP_AUDIOTAUNT_VOLUME', e.target.value, true)}
                        className="w-full accent-[#ff6600]"
                    />
                </div>

                {/* Lag Compensation */}
                <div className="bg-black/40 border border-white/5 p-4 rounded-xl space-y-2">
                    <div className="flex justify-between">
                        <span className="text-gray-300 font-bold">Lag Compensation Level</span>
                        <span className="text-[#ff6600] font-bold">Level {getPrefVal('MP_PM_LAG_COMPENSATION', true) || '3'}</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="5"
                        value={getPrefVal('MP_PM_LAG_COMPENSATION', true) || '3'}
                        onChange={(e) => setPrefVal('MP_PM_LAG_COMPENSATION', e.target.value, true)}
                        className="w-full accent-[#ff6600]"
                    />
                </div>

                <label className="bg-black/40 border border-white/5 p-3 rounded-xl flex items-center justify-between cursor-pointer">
                    <span className="text-gray-300">Enable Combat Audio Taunts</span>
                    <input
                        type="checkbox"
                        checked={getPrefBool('MP_AUDIOTAUNTS_ACTIVE', true)}
                        onChange={(e) => setPrefVal('MP_AUDIOTAUNTS_ACTIVE', e.target.checked, true)}
                        className="accent-[#ff6600] w-4 h-4"
                    />
                </label>

                <label className="bg-black/40 border border-white/5 p-3 rounded-xl flex items-center justify-between cursor-pointer">
                    <span className="text-gray-300">Show FPS Counter (Framerate)</span>
                    <input
                        type="checkbox"
                        checked={getPrefBool('MP_PM_SHOWFRAMERATE', true)}
                        onChange={(e) => setPrefVal('MP_PM_SHOWFRAMERATE', e.target.checked, true)}
                        className="accent-[#ff6600] w-4 h-4"
                    />
                </label>

                <label className="bg-black/40 border border-white/5 p-3 rounded-xl flex items-center justify-between cursor-pointer">
                    <span className="text-gray-300">Show HUD Velocity (Speedometer)</span>
                    <input
                        type="checkbox"
                        checked={getPrefBool('MP_PM_SHOWHUDVELOCITY', true)}
                        onChange={(e) => setPrefVal('MP_PM_SHOWHUDVELOCITY', e.target.checked, true)}
                        className="accent-[#ff6600] w-4 h-4"
                    />
                </label>

                <label className="bg-black/40 border border-white/5 p-3 rounded-xl flex items-center justify-between cursor-pointer">
                    <span className="text-gray-300">Distinct Kill Confirmation Sound</span>
                    <input
                        type="checkbox"
                        checked={getPrefBool('MP_DISTINCT_KILL_SOUND', true)}
                        onChange={(e) => setPrefVal('MP_DISTINCT_KILL_SOUND', e.target.checked, true)}
                        className="accent-[#ff6600] w-4 h-4"
                    />
                </label>

                <label className="bg-black/40 border border-white/5 p-3 rounded-xl flex items-center justify-between cursor-pointer">
                    <span className="text-gray-300">Floating Damage Numbers</span>
                    <input
                        type="checkbox"
                        checked={getPrefBool('MP_DAMAGE_NUMBERS', true)}
                        onChange={(e) => setPrefVal('MP_DAMAGE_NUMBERS', e.target.checked, true)}
                        className="accent-[#ff6600] w-4 h-4"
                    />
                </label>

                <label className="bg-black/40 border border-white/5 p-3 rounded-xl flex items-center justify-between cursor-pointer">
                    <span className="text-gray-300">Directional Threat Warnings</span>
                    <input
                        type="checkbox"
                        checked={getPrefBool('MP_PM_DIRECTIONAL_WARNINGS', true)}
                        onChange={(e) => setPrefVal('MP_PM_DIRECTIONAL_WARNINGS', e.target.checked, true)}
                        className="accent-[#ff6600] w-4 h-4"
                    />
                </label>
            </div>
        </div>
    );
};
