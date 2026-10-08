import React from 'react';
import { Monitor } from 'lucide-react';
import { PrefAccessors } from './types';

// TAB 3: Graphics & Video.
export const GraphicsTab: React.FC<Pick<PrefAccessors, 'getPrefVal' | 'setPrefVal'>> = ({ getPrefVal, setPrefVal }) => {
    return (
        <div className="bg-[#121215] border border-gray-800 rounded-2xl p-6 space-y-6">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Monitor className="w-4 h-4 text-[#ff6600]" />
                <span>GRAPHICS &amp; VISUAL PERFORMANCE</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                {/* Brightness */}
                <div className="bg-black/40 border border-white/5 p-3 rounded-xl space-y-2">
                    <div className="flex justify-between">
                        <span className="text-gray-300">Brightness</span>
                        <span className="text-[#ff6600] font-bold">{getPrefVal('GFX_BRIGHTNESS') || '6'}</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="12"
                        value={getPrefVal('GFX_BRIGHTNESS') || '6'}
                        onChange={(e) => setPrefVal('GFX_BRIGHTNESS', e.target.value)}
                        className="w-full accent-[#ff6600]"
                    />
                </div>

                {/* Texture Quality */}
                <div className="bg-black/40 border border-white/5 p-3 rounded-xl space-y-2">
                    <span className="text-gray-300">Texture Quality</span>
                    <select
                        value={getPrefVal('GFX_TEX_LEVEL') || '2'}
                        onChange={(e) => setPrefVal('GFX_TEX_LEVEL', e.target.value)}
                        className="w-full bg-black/60 border border-white/10 rounded-lg p-1.5 text-white"
                    >
                        <option value="0">Low</option>
                        <option value="1">Medium</option>
                        <option value="2">High / Ultra</option>
                    </select>
                </div>

                {/* Shadow Quality */}
                <div className="bg-black/40 border border-white/5 p-3 rounded-xl space-y-2">
                    <span className="text-gray-300">Shadows Quality</span>
                    <select
                        value={getPrefVal('GFX_SHADOW_QUALITY') || '0'}
                        onChange={(e) => setPrefVal('GFX_SHADOW_QUALITY', e.target.value)}
                        className="w-full bg-black/60 border border-white/10 rounded-lg p-1.5 text-white"
                    >
                        <option value="0">Off / Simplified</option>
                        <option value="1">Low</option>
                        <option value="2">Medium</option>
                        <option value="3">High</option>
                    </select>
                </div>

                {/* Target Framerate */}
                <div className="bg-black/40 border border-white/5 p-3 rounded-xl space-y-2">
                    <span className="text-gray-300">Target Framerate (OLMOD)</span>
                    <select
                        value={getPrefVal('TARGET_FRAMERATE', true) || '0'}
                        onChange={(e) => setPrefVal('TARGET_FRAMERATE', e.target.value, true)}
                        className="w-full bg-black/60 border border-white/10 rounded-lg p-1.5 text-white"
                    >
                        <option value="0">0 — Uncapped / Unlimited</option>
                        <option value="60">60 FPS</option>
                        <option value="120">120 FPS</option>
                        <option value="144">144 FPS</option>
                        <option value="240">240 FPS</option>
                        <option value="360">360 FPS</option>
                    </select>
                </div>

                <label className="bg-black/40 border border-white/5 p-3 rounded-xl flex items-center justify-between cursor-pointer">
                    <span className="text-gray-300">Vertical Sync (V-Sync)</span>
                    <input
                        type="checkbox"
                        checked={getPrefVal('GFX_VSYNC') === '1'}
                        onChange={(e) => setPrefVal('GFX_VSYNC', e.target.checked ? '1' : '0')}
                        className="accent-[#ff6600] w-4 h-4"
                    />
                </label>

                <label className="bg-black/40 border border-white/5 p-3 rounded-xl flex items-center justify-between cursor-pointer">
                    <span className="text-gray-300">SMAA Anti-Aliasing</span>
                    <input
                        type="checkbox"
                        checked={getPrefVal('GFX_SMAA') === '1'}
                        onChange={(e) => setPrefVal('GFX_SMAA', e.target.checked ? '1' : '0')}
                        className="accent-[#ff6600] w-4 h-4"
                    />
                </label>

                <label className="bg-black/40 border border-white/5 p-3 rounded-xl flex items-center justify-between cursor-pointer">
                    <span className="text-gray-300">Screen Space Reflections (SSR)</span>
                    <input
                        type="checkbox"
                        checked={getPrefVal('GFX_SSR') === '1'}
                        onChange={(e) => setPrefVal('GFX_SSR', e.target.checked ? '1' : '0')}
                        className="accent-[#ff6600] w-4 h-4"
                    />
                </label>

                <label className="bg-black/40 border border-white/5 p-3 rounded-xl flex items-center justify-between cursor-pointer">
                    <span className="text-gray-300">Ambient Occlusion (SSAO)</span>
                    <input
                        type="checkbox"
                        checked={getPrefVal('GFX_SSAO') === '1'}
                        onChange={(e) => setPrefVal('GFX_SSAO', e.target.checked ? '1' : '0')}
                        className="accent-[#ff6600] w-4 h-4"
                    />
                </label>

                <label className="bg-black/40 border border-white/5 p-3 rounded-xl flex items-center justify-between cursor-pointer">
                    <span className="text-gray-300">Bloom Lighting</span>
                    <input
                        type="checkbox"
                        checked={getPrefVal('GFX_BLOOM') === '1'}
                        onChange={(e) => setPrefVal('GFX_BLOOM', e.target.checked ? '1' : '0')}
                        className="accent-[#ff6600] w-4 h-4"
                    />
                </label>
            </div>
        </div>
    );
};
