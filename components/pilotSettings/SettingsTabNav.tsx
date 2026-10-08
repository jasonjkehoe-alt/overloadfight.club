import React from 'react';
import { Crosshair, Keyboard, Volume2, Monitor, Sparkles, Search } from 'lucide-react';
import { clsx } from 'clsx';
import { SettingsTab } from './types';
import type { RawEntry } from '../../hooks/usePilotSettingsRawEntries';

interface SettingsTabNavProps {
    activeTab: SettingsTab;
    setActiveTab: (tab: SettingsTab) => void;
    isAutoselectDirty: boolean;
    allRawEntries: RawEntry[];
}

// The six settings tab buttons.
export const SettingsTabNav: React.FC<SettingsTabNavProps> = ({ activeTab, setActiveTab, isAutoselectDirty, allRawEntries }) => {
    return (
        <div className="flex items-center space-x-1 sm:space-x-2 bg-black/40 p-1.5 rounded-xl border border-gray-800 text-xs overflow-x-auto">
            <button
                onClick={() => setActiveTab('autoselect')}
                className={clsx(
                    "flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all shrink-0",
                    activeTab === 'autoselect'
                        ? "bg-[#ff6600] text-black font-bold shadow-md"
                        : "text-gray-400 hover:text-white"
                )}
            >
                <Crosshair className="w-4 h-4" />
                <span>Weapon Autoselect</span>
                {isAutoselectDirty && (
                    <span className="w-2 h-2 rounded-full bg-[#ff6600] animate-pulse"></span>
                )}
            </button>

            <button
                onClick={() => setActiveTab('controls')}
                className={clsx(
                    "flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all shrink-0",
                    activeTab === 'controls'
                        ? "bg-[#ff6600] text-black font-bold shadow-md"
                        : "text-gray-400 hover:text-white"
                )}
            >
                <Keyboard className="w-4 h-4" />
                <span>Controls &amp; Bindings</span>
            </button>

            <button
                onClick={() => setActiveTab('audio')}
                className={clsx(
                    "flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all shrink-0",
                    activeTab === 'audio'
                        ? "bg-[#ff6600] text-black font-bold shadow-md"
                        : "text-gray-400 hover:text-white"
                )}
            >
                <Volume2 className="w-4 h-4" />
                <span>General &amp; Audio</span>
            </button>

            <button
                onClick={() => setActiveTab('graphics')}
                className={clsx(
                    "flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all shrink-0",
                    activeTab === 'graphics'
                        ? "bg-[#ff6600] text-black font-bold shadow-md"
                        : "text-gray-400 hover:text-white"
                )}
            >
                <Monitor className="w-4 h-4" />
                <span>Graphics &amp; Video</span>
            </button>

            <button
                onClick={() => setActiveTab('olmod')}
                className={clsx(
                    "flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all shrink-0",
                    activeTab === 'olmod'
                        ? "bg-[#ff6600] text-black font-bold shadow-md"
                        : "text-gray-400 hover:text-white"
                )}
            >
                <Sparkles className="w-4 h-4" />
                <span>OLMOD Preferences</span>
            </button>

            <button
                onClick={() => setActiveTab('raw')}
                className={clsx(
                    "flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all shrink-0",
                    activeTab === 'raw'
                        ? "bg-[#ff6600] text-black font-bold shadow-md"
                        : "text-gray-400 hover:text-white"
                )}
            >
                <Search className="w-4 h-4" />
                <span>All Settings ({allRawEntries.length})</span>
            </button>
        </div>
    );
};
