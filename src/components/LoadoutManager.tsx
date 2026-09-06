import React, { useState, useEffect, useRef } from 'react';
import JSZip from 'jszip';
import { 
    Gamepad2, 
    Download, 
    Play, 
    Pause, 
    Trash2, 
    Copy, 
    Check, 
    FolderOpen, 
    Package, 
    Sparkles 
} from 'lucide-react';
import { getTaunts } from '../utils/audioHistoryDb';

interface LoadoutSlot {
    slotNumber: number; // 1 to 6
    keybind: string;    // F1 to F6
    tauntId: string | null;
    tauntName: string | null;
    blob: Blob | null;
}

interface LoadoutManagerProps {
    onLoadTauntIntoEditor?: (blob: Blob, name: string) => void;
}

export const LoadoutManager: React.FC<LoadoutManagerProps> = ({ onLoadTauntIntoEditor }) => {
    const [slots, setSlots] = useState<LoadoutSlot[]>(() => {
        const saved = localStorage.getItem('overload_loadout_v1');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                return [1, 2, 3, 4, 5, 6].map(i => ({
                    slotNumber: i,
                    keybind: `F${i}`,
                    tauntId: parsed[i]?.tauntId || null,
                    tauntName: parsed[i]?.tauntName || null,
                    blob: null, // Will rehydrate from DB
                }));
            } catch {
                // fall through
            }
        }
        return [1, 2, 3, 4, 5, 6].map(i => ({
            slotNumber: i,
            keybind: `F${i}`,
            tauntId: null,
            tauntName: null,
            blob: null,
        }));
    });

    const [availableTaunts, setAvailableTaunts] = useState<Array<{ id: string; name: string; blob: Blob }>>([]);
    const [playingSlot, setPlayingSlot] = useState<number | null>(null);
    const [isZipping, setIsZipping] = useState(false);
    const [copiedPath, setCopiedPath] = useState(false);
    const previewAudioRef = useRef<HTMLAudioElement | null>(null);

    // Rehydrate blobs from IndexedDB
    useEffect(() => {
        const load = async () => {
            try {
                const dbTaunts = await getTaunts();
                setAvailableTaunts(dbTaunts.map(t => ({ id: t.id, name: t.name, blob: t.blob })));

                setSlots(prev => prev.map(slot => {
                    if (slot.tauntId) {
                        const match = dbTaunts.find(t => t.id === slot.tauntId);
                        if (match) {
                            return { ...slot, tauntName: match.name, blob: match.blob };
                        }
                    }
                    return slot;
                }));
            } catch (e) {
                console.error('Failed to load taunts for loadout', e);
            }
        };
        load();
    }, []);

    const saveSlotState = (newSlots: LoadoutSlot[]) => {
        setSlots(newSlots);
        const toSave: Record<number, { tauntId: string | null; tauntName: string | null }> = {};
        newSlots.forEach(s => {
            toSave[s.slotNumber] = { tauntId: s.tauntId, tauntName: s.tauntName };
        });
        localStorage.setItem('overload_loadout_v1', JSON.stringify(toSave));
    };

    const handleAssignTaunt = (slotNum: number, tauntId: string) => {
        const found = availableTaunts.find(t => t.id === tauntId);
        if (!found) return;

        const updated = slots.map(s => {
            if (s.slotNumber === slotNum) {
                return {
                    ...s,
                    tauntId: found.id,
                    tauntName: found.name,
                    blob: found.blob,
                };
            }
            return s;
        });
        saveSlotState(updated);
    };

    const handleClearSlot = (slotNum: number) => {
        const updated = slots.map(s => {
            if (s.slotNumber === slotNum) {
                return { ...s, tauntId: null, tauntName: null, blob: null };
            }
            return s;
        });
        saveSlotState(updated);
    };

    const handlePlaySlot = (slot: LoadoutSlot) => {
        if (!slot.blob) return;

        if (playingSlot === slot.slotNumber) {
            if (previewAudioRef.current) {
                previewAudioRef.current.pause();
                previewAudioRef.current = null;
            }
            setPlayingSlot(null);
        } else {
            if (previewAudioRef.current) {
                previewAudioRef.current.pause();
            }
            const url = URL.createObjectURL(slot.blob);
            const audio = new Audio(url);
            audio.onended = () => {
                setPlayingSlot(null);
                URL.revokeObjectURL(url);
            };
            audio.play();
            previewAudioRef.current = audio;
            setPlayingSlot(slot.slotNumber);
        }
    };

    const handleDownloadZip = async () => {
        const activeSlots = slots.filter(s => s.blob && s.tauntName);
        if (activeSlots.length === 0) {
            alert('Please assign at least one taunt to your loadout slots first!');
            return;
        }

        setIsZipping(true);
        try {
            const zip = new JSZip();
            activeSlots.forEach(slot => {
                if (slot.blob && slot.tauntName) {
                    zip.file(slot.tauntName, slot.blob);
                }
            });

            const content = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Overload_Taunt_Loadout_${new Date().toISOString().slice(0, 10)}.zip`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Failed to create ZIP', err);
            alert('Failed to generate ZIP archive.');
        } finally {
            setIsZipping(false);
        }
    };

    const handleDownloadBatchOpener = () => {
        const batContent = `@echo off
echo Opening Overload AudioTaunts Folder...
set TARGET=%LOCALAPPDATA%Low\\Revival\\Overload\\AudioTaunts
if not exist "%TARGET%" mkdir "%TARGET%"
start "" explorer "%TARGET%"
`;
        const blob = new Blob([batContent], { type: 'application/bat' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Open-AudioTaunts.bat';
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleCopyPath = () => {
        const path = '%LOCALAPPDATA%Low\\Revival\\Overload\\AudioTaunts';
        navigator.clipboard.writeText(path);
        setCopiedPath(true);
        setTimeout(() => setCopiedPath(false), 2000);
    };

    return (
        <div className="w-full max-w-5xl mx-auto space-y-6 animate-fade-in font-mono">
            {/* Header / Actions Card */}
            <div className="bg-[#121212] border border-white/10 rounded-xl p-6 md:p-8 shadow-2xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
                    <div>
                        <div className="flex items-center gap-2">
                            <Gamepad2 className="w-6 h-6 text-[#ff6600]" />
                            <h2 className="text-2xl font-bold text-white brand-font tracking-wide">
                                MULTIPLAYER COMBAT LOADOUT
                            </h2>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                            Equip up to 6 custom audio taunts mapped to your in-game Overload hotkeys (F1–F6)
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <button
                            onClick={handleDownloadZip}
                            disabled={isZipping || slots.every(s => !s.blob)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#ff6600] hover:bg-[#ff8533] disabled:bg-white/5 disabled:text-gray-500 text-black font-bold text-xs shadow-lg shadow-[#ff6600]/20 transition-all uppercase tracking-wider"
                        >
                            {isZipping ? (
                                <div className="animate-spin h-3.5 w-3.5 border-2 border-black border-t-transparent rounded-full" />
                            ) : (
                                <Package className="w-4 h-4" />
                            )}
                            Download Loadout (.zip)
                        </button>
                    </div>
                </div>

                {/* 6-Slot Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                    {slots.map(slot => (
                        <div 
                            key={slot.slotNumber}
                            className={`rounded-xl border p-4 transition-all ${
                                slot.blob 
                                    ? 'bg-black/60 border-[#ff6600]/40 shadow-lg shadow-[#ff6600]/5' 
                                    : 'bg-black/30 border-white/5 hover:border-white/10'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded bg-white/10 text-white font-bold text-xs border border-white/10">
                                        Slot {slot.slotNumber}
                                    </span>
                                    <span className="text-[#ff6600] text-xs font-bold font-sans">
                                        [{slot.keybind}]
                                    </span>
                                </div>

                                {slot.blob && (
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handlePlaySlot(slot)}
                                            className={`p-1.5 rounded-md hover:bg-white/10 ${
                                                playingSlot === slot.slotNumber ? 'text-green-400 bg-green-500/10' : 'text-gray-300'
                                            }`}
                                            title="Preview"
                                        >
                                            {playingSlot === slot.slotNumber ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                        </button>
                                        <button
                                            onClick={() => handleClearSlot(slot.slotNumber)}
                                            className="p-1.5 rounded-md hover:bg-white/10 text-red-400"
                                            title="Clear Slot"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {slot.blob ? (
                                <div className="space-y-2">
                                    <div className="text-sm font-bold text-gray-200 truncate" title={slot.tauntName || ''}>
                                        {slot.tauntName}
                                    </div>
                                    <div className="text-[11px] text-gray-500">
                                        Size: {(slot.blob.size / 1024).toFixed(1)} kB &bull; Ready for OLMod
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="text-xs text-gray-500 italic">
                                        No taunt equipped in this slot
                                    </div>
                                    <select
                                        onChange={(e) => {
                                            if (e.target.value) handleAssignTaunt(slot.slotNumber, e.target.value);
                                        }}
                                        defaultValue=""
                                        className="w-full bg-black/80 border border-white/10 rounded-lg p-2 text-xs text-gray-300 focus:outline-none focus:border-[#ff6600]"
                                    >
                                        <option value="" disabled>Equip from History...</option>
                                        {availableTaunts.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Fast In-Game Deployment Assistant */}
                <div className="mt-8 pt-6 border-t border-white/10 bg-black/40 -mx-6 md:-mx-8 -mb-6 md:-mb-8 p-6 md:p-8 rounded-b-xl">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <div className="text-sm font-bold text-white flex items-center gap-2">
                                <FolderOpen className="w-4 h-4 text-[#ff6600]" />
                                Fast Windows Game Folder Deployment
                            </div>
                            <p className="text-xs text-gray-400">
                                Unzip your exported taunts directly into your Overload data directory.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                onClick={handleCopyPath}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-xs transition-all"
                            >
                                {copiedPath ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                                {copiedPath ? 'Copied Path!' : 'Copy Windows Path'}
                            </button>

                            <button
                                onClick={handleDownloadBatchOpener}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#ff6600]/10 hover:bg-[#ff6600]/20 border border-[#ff6600]/30 text-[#ff6600] text-xs transition-all"
                                title="Download script that opens the game folder in 1 click"
                            >
                                <Download className="w-3.5 h-3.5" />
                                Download 1-Click Folder Opener (.bat)
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
