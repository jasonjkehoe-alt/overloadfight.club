import React, { useState } from 'react';
import { Header } from './components/Header';
import { AudioEditor } from './components/AudioEditor';
import { LoadoutManager } from './components/LoadoutManager';
import { AudioManual } from './components/AudioManual';

export const App: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'editor' | 'loadout' | 'manual'>('editor');

    return (
        <div className="min-h-screen bg-black text-gray-200 flex flex-col selection:bg-[#ff6600] selection:text-black">
            <Header activeTab={activeTab} onSelectTab={setActiveTab} />

            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
                {activeTab === 'editor' && <AudioEditor />}
                {activeTab === 'loadout' && <LoadoutManager />}
                {activeTab === 'manual' && <AudioManual />}
            </main>

            <footer className="border-t border-white/10 bg-[#080808] py-6 text-center text-xs font-mono text-gray-500">
                <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p>
                        Overload Audio Taunt Maker 2.0 &bull; WebAssembly Client DSP Engine
                    </p>
                    <p className="text-[11px] text-gray-600">
                        Tailored for the Revival Productions Overload 6DOF community
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default App;
