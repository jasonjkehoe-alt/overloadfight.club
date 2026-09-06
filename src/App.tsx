import React from 'react';
import { Header } from './components/Header';
import { AudioEditor } from './components/AudioEditor';

export const App: React.FC = () => {
    return (
        <div className="min-h-screen bg-black text-gray-200 flex flex-col selection:bg-[#ff6600] selection:text-black">
            <Header />
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                <AudioEditor />
            </main>
            <footer className="border-t border-white/10 bg-[#080808] py-6 text-center text-xs font-mono text-gray-500">
                <p>Overload Audio Taunt Maker &bull; Client-side WASM Audio Processor</p>
                <p className="mt-1 text-[11px] text-gray-600">Built for the Overload 6DOF community &bull; Independent Standalone Tool</p>
            </footer>
        </div>
    );
};

export default App;
