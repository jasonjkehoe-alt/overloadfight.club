import React from 'react';
import { Search } from 'lucide-react';
import { clsx } from 'clsx';
import { PrefAccessors } from './types';
import { RawEntry } from '../../hooks/usePilotSettingsRawEntries';

interface RawSettingsTabProps {
    rawSearchQuery: string;
    setRawSearchQuery: (query: string) => void;
    rawFilterSource: 'all' | 'xprefs' | 'xprefsmod';
    setRawFilterSource: (source: 'all' | 'xprefs' | 'xprefsmod') => void;
    allRawEntries: RawEntry[];
    setPrefVal: PrefAccessors['setPrefVal'];
}

// TAB 5: Raw Settings Search & Table.
export const RawSettingsTab: React.FC<RawSettingsTabProps> = ({
    rawSearchQuery,
    setRawSearchQuery,
    rawFilterSource,
    setRawFilterSource,
    allRawEntries,
    setPrefVal
}) => {
    return (
        <div className="bg-[#121215] border border-gray-800 rounded-2xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-grow max-w-md">
                    <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
                    <input
                        type="text"
                        value={rawSearchQuery}
                        onChange={(e) => setRawSearchQuery(e.target.value)}
                        placeholder="Search any setting key or value..."
                        className="w-full bg-black/80 border border-white/10 focus:border-[#ff6600] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none"
                    />
                </div>

                <div className="flex items-center gap-1.5 bg-black/60 p-1 rounded-xl border border-white/10 text-xs">
                    <button
                        onClick={() => setRawFilterSource('all')}
                        className={clsx("px-3 py-1 rounded-lg", rawFilterSource === 'all' ? "bg-[#ff6600] text-black font-bold" : "text-gray-400 hover:text-white")}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setRawFilterSource('xprefs')}
                        className={clsx("px-3 py-1 rounded-lg", rawFilterSource === 'xprefs' ? "bg-[#ff6600] text-black font-bold" : "text-gray-400 hover:text-white")}
                    >
                        .xprefs
                    </button>
                    <button
                        onClick={() => setRawFilterSource('xprefsmod')}
                        className={clsx("px-3 py-1 rounded-lg", rawFilterSource === 'xprefsmod' ? "bg-[#ff6600] text-black font-bold" : "text-gray-400 hover:text-white")}
                    >
                        .xprefsmod
                    </button>
                </div>
            </div>

            <div className="max-h-[500px] overflow-auto border border-gray-800 rounded-xl">
                <table className="w-full text-left text-xs">
                    <thead className="bg-black/60 text-gray-400 uppercase text-[10px] tracking-wider sticky top-0 border-b border-gray-800">
                        <tr>
                            <th className="p-3">Source</th>
                            <th className="p-3">Key</th>
                            <th className="p-3">Type</th>
                            <th className="p-3">Value</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/60 font-mono">
                        {allRawEntries.map(entry => (
                            <tr key={`${entry.source}:${entry.key}`} className="hover:bg-white/[0.02]">
                                <td className="p-3 text-[10px] text-gray-500">
                                    {entry.source}
                                </td>
                                <td className="p-3 font-bold text-white">
                                    {entry.key}
                                </td>
                                <td className="p-3">
                                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/5 border border-white/10 text-gray-400">
                                        {entry.type}
                                    </span>
                                </td>
                                <td className="p-3">
                                    <input
                                        type="text"
                                        value={entry.value}
                                        onChange={(e) => setPrefVal(entry.key, e.target.value, entry.source === 'xprefsmod')}
                                        className="bg-black/60 border border-white/10 focus:border-[#ff6600] rounded px-2 py-1 text-xs text-white w-48 font-mono focus:outline-none"
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
