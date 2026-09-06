import React from 'react';

export const AudioManual: React.FC = () => {
    return (
        <div className="w-full max-w-5xl mx-auto px-6 py-8 bg-[#111111] text-gray-200 font-sans antialiased selection:bg-orange-500 selection:text-white rounded-xl mt-8 border border-white/10 shadow-2xl">
            <style>
                {`
                .manual-content ::-webkit-scrollbar { width: 8px; }
                .manual-content ::-webkit-scrollbar-track { background: #1f2937; }
                .manual-content ::-webkit-scrollbar-thumb { background: #f97316; border-radius: 4px; }
                .manual-content ::-webkit-scrollbar-thumb:hover { background: #ea580c; }
                `}
            </style>

            <header className="mb-8 text-center border-b border-white/10 pb-4">
                <h2 className="text-3xl font-bold text-white mb-2 tracking-tight brand-font">
                    <span className="text-[#ff6600]">QUICK START</span> GUIDE
                </h2>
                <p className="text-gray-400 text-sm font-mono">
                    How to prepare, export, and load custom audio taunts in Overload
                </p>
            </header>

            <div className="space-y-6">
                {/* Step 1 */}
                <div className="flex gap-4 items-start bg-black/30 p-4 rounded-lg border border-white/5">
                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-[#ff6600] text-black font-bold text-sm">1</div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Accessing the Tool</h3>
                        <p className="text-gray-400 text-sm">Wait for the "Loading FFmpeg core..." status to complete on initial launch. The single-threaded WebAssembly engine runs directly in your browser without uploading audio to any server.</p>
                    </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-4 items-start bg-black/30 p-4 rounded-lg border border-white/5">
                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-[#ff6600] text-black font-bold text-sm">2</div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Uploading Audio</h3>
                        <p className="text-gray-400 text-sm">Drag and drop or browse to select your source audio file.</p>
                        <span className="inline-block mt-1 text-xs text-[#ff8833] font-mono">Supported formats: MP3, WAV, FLAC, OGG</span>
                    </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-4 items-start bg-black/30 p-4 rounded-lg border border-white/5">
                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-[#ff6600] text-black font-bold text-sm">3</div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Editing Your Taunt</h3>
                        <p className="text-gray-400 text-sm">Drag the highlighted region on the waveform or use the start slider to position your clip. Adjust the duration (up to 3.0s) and use the Play button to preview the loop.</p>
                        <p className="text-xs text-[#ff8833] font-mono mt-1">Constraint: Overload limits taunt duration to a maximum of 3.0 seconds.</p>
                    </div>
                </div>

                {/* Step 4 */}
                <div className="flex gap-4 items-start bg-black/30 p-4 rounded-lg border border-white/5">
                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-[#ff6600] text-black font-bold text-sm">4</div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Exporting</h3>
                        <p className="text-gray-400 text-sm">Click <strong className="text-white">Export Taunt</strong>. The tool removes leading silence, downmixes to mono, encodes to Vorbis .ogg (Quality 4), and automatically checks the 128 kB file size limit.</p>
                    </div>
                </div>

                {/* Step 5 */}
                <div className="flex gap-4 items-start bg-black/30 p-4 rounded-lg border border-white/5">
                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-[#ff6600] text-black font-bold text-sm">5</div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Managing History</h3>
                        <p className="text-gray-400 text-sm">Access "Recent Exports" below the editor to preview audio, rename clips, re-download, or remove items saved in your browser's local database.</p>
                    </div>
                </div>
            </div>

            {/* In-Game Setup */}
            <div className="mt-12 pt-8 border-t border-white/10">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center brand-font">
                    <span className="text-[#ff6600] mr-3">🎮</span> IN-GAME SETUP
                </h2>

                <div className="bg-black/40 rounded-lg overflow-hidden border border-white/10 mb-8">
                    <div className="p-6">
                        <h3 className="text-lg font-bold text-white mb-4">1. Installation Folders</h3>
                        <p className="text-gray-400 text-sm mb-4">
                            Move your exported <code className="text-[#ff8833]">.ogg</code> files to the <code className="text-[#ff8833]">AudioTaunts</code> folder in your Overload directory.
                            Create the folder if it does not already exist.
                        </p>
                        <div className="space-y-3 font-mono text-xs">
                            <div className="bg-black/60 p-3 rounded border border-white/5">
                                <span className="text-blue-400 block mb-1 font-sans font-bold">Windows</span>
                                <span className="text-gray-300 break-all select-all">%LOCALAPPDATA%Low\Revival\Overload\AudioTaunts</span>
                                <p className="text-gray-500 text-[11px] mt-1">(Usually: C:\Users\&lt;Username&gt;\AppData\LocalLow\Revival\Overload\AudioTaunts)</p>
                            </div>
                            <div className="bg-black/60 p-3 rounded border border-white/5">
                                <span className="text-yellow-400 block mb-1 font-sans font-bold">Linux / Steam Deck</span>
                                <span className="text-gray-300 break-all select-all">~/.config/unity3d/Revival/Overload/AudioTaunts</span>
                            </div>
                            <div className="bg-black/60 p-3 rounded border border-white/5">
                                <span className="text-gray-200 block mb-1 font-sans font-bold">macOS</span>
                                <span className="text-gray-300 break-all select-all">~/Library/Application Support/Revival/Overload/AudioTaunts</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-black/40 p-6 rounded-lg border border-white/10">
                        <h3 className="text-lg font-bold text-white mb-3">2. In-Game Configuration</h3>
                        <ul className="space-y-3 text-sm text-gray-400 list-disc list-inside">
                            <li>Launch <strong className="text-white">Overload / OLMOD</strong>.</li>
                            <li>Go to <span className="text-orange-400 font-mono">Options &gt; Multiplayer Options &gt; Audio Taunts</span>.</li>
                            <li>Select up to <strong className="text-white">6 taunts</strong> to load for your matches.</li>
                            <li>Assign <strong className="text-white">Keybinds</strong> to each taunt slot.</li>
                            <li>Use the toggle in the top-right to completely <span className="text-red-400">Disable</span> taunts if needed.</li>
                        </ul>
                    </div>

                    <div className="bg-black/40 p-6 rounded-lg border border-white/10">
                        <h3 className="text-lg font-bold text-white mb-3">3. Volume & Multiplayer Usage</h3>
                        <ul className="space-y-3 text-sm text-gray-400 list-disc list-inside">
                            <li>Adjust taunt volume in the main <strong className="text-white">Sound Options</strong> menu.</li>
                            <li>Taunt checksum hashes are automatically shared when joining a multiplayer match.</li>
                            <li>Files are streamed peer-to-peer to opponents who have taunts enabled.</li>
                            <li>Downloaded peer taunts are automatically cached in <code className="text-gray-300">AudioTaunts/external</code>.</li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="mt-10 pt-6 border-t border-white/10">
                <h2 className="text-xl font-bold text-white mb-4 brand-font">TROUBLESHOOTING</h2>
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="bg-black/40 p-4 rounded border border-white/10">
                        <h4 className="text-red-400 font-bold text-sm mb-1">Warning: "File size exceeds 128kB"</h4>
                        <p className="text-gray-400 text-xs mb-2">Overload rejects multiplayer audio taunts larger than 128 kB to protect network bandwidth.</p>
                        <p className="text-gray-300 text-xs font-semibold">Solution:</p>
                        <ul className="list-disc list-inside text-gray-400 text-xs">
                            <li>Shorten clip duration slightly (e.g. 2.0s - 2.5s).</li>
                            <li>Select a section with less complex audio or lower loudness.</li>
                        </ul>
                    </div>

                    <div className="bg-black/40 p-4 rounded border border-white/10">
                        <h4 className="text-orange-400 font-bold text-sm mb-1">"Loading FFmpeg core..." stuck</h4>
                        <p className="text-gray-400 text-xs">This indicates the single-threaded WebAssembly engine is downloading or initializing from CDN.</p>
                        <p className="text-gray-300 text-xs font-semibold mt-1">Fix:</p>
                        <p className="text-gray-400 text-xs">Ensure you have an active internet connection on first load, refresh the browser, or ensure WebAssembly is enabled.</p>
                    </div>

                    <div className="bg-black/40 p-4 rounded border border-white/10 md:col-span-2">
                        <h4 className="text-blue-400 font-bold text-sm mb-1">No Audio on Playback</h4>
                        <p className="text-gray-400 text-xs">Ensure your browser tab isn't muted and system volume is enabled. Browsers require user interaction with the page before playing audio elements.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
