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
    ShieldCheck,
    Save,
    AlertCircle,
    User,
    RefreshCw,
    HardDrive,
    Unplug,
    X
} from 'lucide-react';
import { clsx } from 'clsx';
import { GameTauntItem } from './OverloadVault';
import { getTaunts } from '../utils/audioHistoryDb';
import { useOverloadFs } from '../context/OverloadFsContext';
import { getPilotDataClient, applyPilotTauntsClient } from '../utils/overloadFsBridge';

interface LoadoutSlot {
    slotNumber: number; // 1 to 6
    keybind: string;    // F1 to F6
    tauntId: string | null;
    tauntName: string | null;
    audioUrl: string | null;
    blob: Blob | null;
}

export interface PendingSlotAssignment {
    slotNum: number;
    tauntId: string;
    tauntName: string;
    audioUrl?: string | null;
    timestamp: number;
}

interface LoadoutManagerProps {
    onLoadTauntIntoEditor?: (file: File) => void;
    pendingAssignment?: PendingSlotAssignment | null;
}

export const LoadoutManager: React.FC<LoadoutManagerProps> = ({ onLoadTauntIntoEditor, pendingAssignment }) => {
    const {
        isSupported,
        isServerNative,
        isClientConnected,
        isConnecting,
        folderName,
        pilots: fsPilots,
        activePilot: fsActivePilot,
        setActivePilot: setFsActivePilot,
        vaultTaunts,
        dirHandle,
        connectLocalFolder,
        disconnectLocalFolder,
        refreshData
    } = useOverloadFs();

    const [selectedPilot, setSelectedPilot] = useState<string>(fsActivePilot || 'Soup');
    const [localHistoryTaunts, setLocalHistoryTaunts] = useState<Array<{ id: string; name: string; blob: Blob }>>([]);
    const [slots, setSlots] = useState<LoadoutSlot[]>([1, 2, 3, 4, 5, 6].map(i => ({
        slotNumber: i,
        keybind: `F${i}`,
        tauntId: null,
        tauntName: null,
        audioUrl: null,
        blob: null,
    })));

    const [playingSlot, setPlayingSlot] = useState<number | null>(null);
    const [highlightedSlot, setHighlightedSlot] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isGameRunning, setIsGameRunning] = useState(false);
    const [saveFeedback, setSaveFeedback] = useState<{ success: boolean; message: string } | null>(null);
    const [copiedPath, setCopiedPath] = useState(false);
    const previewAudioRef = useRef<HTMLAudioElement | null>(null);
    const pendingAssignmentRef = useRef<PendingSlotAssignment | null>(pendingAssignment || null);

    const [isConnectBannerDismissed, setIsConnectBannerDismissed] = useState<boolean>(() => {
        try {
            return localStorage.getItem('overload_hide_connect_banner') === 'true';
        } catch {
            return false;
        }
    });

    const handleDismissBanner = () => {
        setIsConnectBannerDismissed(true);
        try {
            localStorage.setItem('overload_hide_connect_banner', 'true');
        } catch {}
    };

    const hasValidPilot = fsPilots.length > 0 && Boolean(selectedPilot && selectedPilot !== 'No Pilots Detected' && fsPilots.includes(selectedPilot));
    const hasFilledSlot = slots.some(s => Boolean(s.tauntId || s.blob));
    const canApply = hasValidPilot && hasFilledSlot && (dirHandle !== null || isServerNative);

    // Sync selectedPilot when fsActivePilot changes
    useEffect(() => {
        if (fsActivePilot) {
            setSelectedPilot(fsActivePilot);
        }
    }, [fsActivePilot]);

    // Keep pending ref synchronized
    useEffect(() => {
        if (pendingAssignment) {
            pendingAssignmentRef.current = pendingAssignment;
        }
    }, [pendingAssignment]);

    // Load local history taunts from IndexedDB
    useEffect(() => {
        getTaunts().then(items => setLocalHistoryTaunts(items)).catch(() => {});
    }, []);

    // Load pilot slots whenever active pilot, directory handle, or vault taunts change
    const loadPilotSlots = async (pilotName: string, vaultList: GameTauntItem[]) => {
        if (!pilotName) return;
        try {
            let hashes: string[] = [];
            if (dirHandle) {
                const clientData = await getPilotDataClient(dirHandle, pilotName);
                if (clientData) {
                    hashes = clientData.selectedTaunts || [];
                }
            } else if (isServerNative) {
                const res = await fetch(`/api/overload/pilot/${encodeURIComponent(pilotName)}`);
                if (res.ok) {
                    const data = await res.json();
                    hashes = data.selectedTaunts || [];
                }
            }

            const pending = pendingAssignmentRef.current;

            setSlots([1, 2, 3, 4, 5, 6].map(idx => {
                // If this slot was assigned from Vault/Editor, prioritize it!
                if (pending && pending.slotNum === idx) {
                    return {
                        slotNumber: idx,
                        keybind: `F${idx}`,
                        tauntId: pending.tauntId,
                        tauntName: pending.tauntName,
                        audioUrl: pending.audioUrl || null,
                        blob: null,
                    };
                }

                const hash = hashes[idx - 1] || null;
                const matched = vaultList.find(v => v.id.toLowerCase() === hash?.toLowerCase());
                return {
                    slotNumber: idx,
                    keybind: `F${idx}`,
                    tauntId: hash,
                    tauntName: matched ? matched.cleanName : (hash ? `${hash.substring(0, 10)}...` : null),
                    audioUrl: matched ? matched.audioUrl : null,
                    blob: null,
                };
            }));
        } catch (err) {
            console.error('Failed to load pilot slots', err);
        }
    };

    useEffect(() => {
        if (selectedPilot) {
            loadPilotSlots(selectedPilot, vaultTaunts);
        }
    }, [selectedPilot, dirHandle, isServerNative, vaultTaunts]);

    // React immediately to any incoming assignment from Vault or Editor
    useEffect(() => {
        if (!pendingAssignment || pendingAssignment.slotNum < 1 || pendingAssignment.slotNum > 6) return;

        pendingAssignmentRef.current = pendingAssignment;

        setSlots(prev => prev.map(s => {
            if (s.slotNumber === pendingAssignment.slotNum) {
                return {
                    ...s,
                    tauntId: pendingAssignment.tauntId,
                    tauntName: pendingAssignment.tauntName,
                    audioUrl: pendingAssignment.audioUrl || null,
                    blob: null,
                };
            }
            return s;
        }));

        setHighlightedSlot(pendingAssignment.slotNum);
        setSaveFeedback({
            success: true,
            message: `Equipped "${pendingAssignment.tauntName}" into Slot ${pendingAssignment.slotNum} (F${pendingAssignment.slotNum}). Click "Apply to Overload" to save to ${selectedPilot}.`
        });

        const timer = setTimeout(() => {
            setHighlightedSlot(null);
        }, 3500);

        return () => clearTimeout(timer);
    }, [pendingAssignment]);

    const handleAssignTaunt = (slotNum: number, tauntId: string) => {
        const foundVault = vaultTaunts.find(t => t.id.toLowerCase() === tauntId.toLowerCase());
        const foundLocal = localHistoryTaunts.find(t => t.id === tauntId);

        setSlots(prev => prev.map(s => {
            if (s.slotNumber === slotNum) {
                if (foundVault) {
                    return {
                        ...s,
                        tauntId: foundVault.id,
                        tauntName: foundVault.cleanName,
                        audioUrl: foundVault.audioUrl,
                        blob: null,
                    };
                } else if (foundLocal) {
                    return {
                        ...s,
                        tauntId: foundLocal.id,
                        tauntName: foundLocal.name,
                        audioUrl: null,
                        blob: foundLocal.blob,
                    };
                } else {
                    return {
                        ...s,
                        tauntId: tauntId,
                        tauntName: `${tauntId.substring(0, 10)}...`,
                        audioUrl: `/api/overload/audio?file=${tauntId}.ogg`,
                        blob: null,
                    };
                }
            }
            return s;
        }));
        setSaveFeedback(null);
    };

    const handleClearSlot = (slotNum: number) => {
        const updated = slots.map(s => {
            if (s.slotNumber === slotNum) {
                return { ...s, tauntId: null, tauntName: null, audioUrl: null, blob: null };
            }
            return s;
        });
        setSlots(updated);
        setSaveFeedback(null);
    };

    const handlePlaySlot = (slot: LoadoutSlot) => {
        if (!slot.audioUrl && !slot.blob) return;

        if (playingSlot === slot.slotNumber) {
            if (previewAudioRef.current) {
                previewAudioRef.current.pause();
                previewAudioRef.current = null;
            }
            setPlayingSlot(null);
        } else {
            if (previewAudioRef.current) previewAudioRef.current.pause();

            let url = slot.audioUrl;
            let shouldRevoke = false;
            if (!url && slot.blob) {
                url = URL.createObjectURL(slot.blob);
                shouldRevoke = true;
            }

            if (url) {
                const audio = new Audio(url);
                audio.onended = () => {
                    setPlayingSlot(null);
                    if (shouldRevoke) URL.revokeObjectURL(url!);
                };
                audio.play();
                previewAudioRef.current = audio;
                setPlayingSlot(slot.slotNumber);
            }
        }
    };

    // Apply to Pilot with MANDATORY BACKUP
    const handleApplyToPilot = async () => {
        if (!selectedPilot) {
            setSaveFeedback({ success: false, message: 'Please select a pilot first.' });
            return;
        }

        if (!dirHandle && !isServerNative) {
            setSaveFeedback({
                success: false,
                message: 'Your Overload game folder is not connected. Please click "Connect Overload Folder" above to grant browser access to your AppData\\LocalLow\\Revival\\Overload directory.'
            });
            return;
        }

        setIsSaving(true);
        setSaveFeedback(null);

        try {
            if (dirHandle) {
                // Option 1: Browser File System Access API
                const blobsToInstall: Array<{ name: string; blob: Blob; hash?: string }> = [];
                for (let i = 0; i < slots.length; i++) {
                    const slot = slots[i];
                    if (slot.blob) {
                        blobsToInstall.push({
                            name: slot.tauntName || `taunt_${slot.slotNumber}`,
                            blob: slot.blob,
                            hash: slot.tauntId || undefined
                        });
                    }
                }

                const hashes = slots.map(s => s.tauntId || 'EMPTY');
                const result = await applyPilotTauntsClient(dirHandle, selectedPilot, hashes, blobsToInstall);

                if (result.success) {
                    let extraMsg = '';
                    if (result.promotedCount > 0) {
                        extraMsg += ` (Auto-promoted ${result.promotedCount} opponent taunt(s) into your game folder).`;
                    }
                    if (result.installedCount > 0) {
                        extraMsg += ` (Saved ${result.installedCount} custom taunt audio file(s) into AudioTaunts).`;
                    }
                    setSaveFeedback({
                        success: true,
                        message: `Applied to ${selectedPilot}! (Backup: "${result.backupFileName}" saved in Pilot Backup).${extraMsg}`
                    });
                    await refreshData();
                } else {
                    setSaveFeedback({
                        success: false,
                        message: `Failed to save: ${result.error || 'Unknown error'}`
                    });
                }
            } else if (isServerNative) {
                // Option 2: Server running on local PC
                const updatedSlots = [...slots];
                for (let i = 0; i < updatedSlots.length; i++) {
                    const slot = updatedSlots[i];
                    const isMd5 = slot.tauntId && /^[0-9a-f]{32}$/i.test(slot.tauntId);

                    if (slot.blob && (!slot.tauntId || !isMd5)) {
                        try {
                            const formData = new FormData();
                            formData.append('audio', slot.blob, `${slot.tauntName || `taunt_${slot.slotNumber}`}.ogg`);
                            formData.append('name', slot.tauntName || `taunt_${slot.slotNumber}`);

                            const installRes = await fetch('/api/overload/install', {
                                method: 'POST',
                                body: formData
                            });
                            if (installRes.ok) {
                                const installData = await installRes.json();
                                if (installData.success && installData.hash) {
                                    updatedSlots[i] = {
                                        ...slot,
                                        tauntId: installData.hash,
                                        audioUrl: `/api/overload/audio?file=${encodeURIComponent(installData.filename)}`
                                    };
                                }
                            }
                        } catch (uploadErr) {
                            console.error('Failed to auto-install audio blob to game folder', uploadErr);
                        }
                    }
                }
                setSlots(updatedSlots);

                const hashes = updatedSlots.map(s => s.tauntId || 'EMPTY');

                const res = await fetch(`/api/overload/pilot/${encodeURIComponent(selectedPilot)}/apply`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ selectedTaunts: hashes })
                });

                const data = await res.json();
                if (res.ok && data.success) {
                    if (data.isGameRunning !== undefined) {
                        setIsGameRunning(data.isGameRunning);
                    }
                    const backupBaseName = data.backupPath.split(/[\\/]/).pop();
                    let extraMsg = '';
                    if (data.promotedCount > 0) {
                        extraMsg += ` (Auto-promoted ${data.promotedCount} opponent taunt(s) into your game folder).`;
                    }
                    if (data.isGameRunning) {
                        extraMsg += ` ⚠️ Note: Overload is currently running. In Overload, please switch to another pilot and switch back to ${selectedPilot} (or restart the game) so OLMod reloads your new taunts without overwriting them.`;
                    }
                    setSaveFeedback({
                        success: true,
                        message: `Applied to ${selectedPilot}! (Backup: "${backupBaseName}" saved in Pilot Backup).${extraMsg}`
                    });
                } else {
                    setSaveFeedback({
                        success: false,
                        message: `Failed to save: ${data.error || 'Unknown error'}`
                    });
                }
            }
        } catch (err: any) {
            setSaveFeedback({
                success: false,
                message: `Error saving loadout: ${err.message}`
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDownloadZip = async () => {
        const activeSlots = slots.filter(s => s.tauntId && s.tauntName);
        if (activeSlots.length === 0) {
            alert('Please equip at least one taunt slot.');
            return;
        }

        try {
            const zip = new JSZip();
            for (const slot of activeSlots) {
                const keyPrefix = slot.keybind || `F${slot.slotNumber}`;
                const fileName = `${keyPrefix}_${slot.tauntName}.ogg`;
                if (slot.audioUrl) {
                    const res = await fetch(slot.audioUrl);
                    const b = await res.blob();
                    zip.file(fileName, b);
                } else if (slot.blob) {
                    zip.file(fileName, slot.blob);
                }
            }

            const content = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${selectedPilot}_Taunt_Loadout.zip`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error(e);
            alert('Failed to generate ZIP.');
        }
    };

    return (
        <div className="w-full max-w-5xl mx-auto space-y-6 font-mono animate-fade-in">
            <div className="bg-[#121212] border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6">
                {/* Header & Pilot Selector */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
                    <div>
                        <div className="flex items-center gap-2">
                            <Gamepad2 className="w-6 h-6 text-[#ff6600]" />
                            <h2 className="text-2xl font-bold text-white brand-font tracking-wide">
                                COMBAT LOADOUT MANAGER
                            </h2>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                            Configure Overload's 6 multiplayer taunt slots (F1–F6) with automated backup protection
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-lg border border-white/10 text-xs">
                            <User className="w-3.5 h-3.5 text-[#ff6600]" />
                            <span className="text-gray-400">Pilot:</span>
                            <select
                                value={selectedPilot}
                                onChange={(e) => {
                                    setSelectedPilot(e.target.value);
                                    setFsActivePilot(e.target.value);
                                }}
                                className="bg-transparent font-bold text-[#ff6600] focus:outline-none"
                            >
                                {fsPilots.length === 0 && (
                                    <option value="" className="bg-black text-gray-400">No Pilots Detected</option>
                                )}
                                {fsPilots.map(p => (
                                    <option key={p} value={p} className="bg-black text-white">{p}</option>
                                ))}
                            </select>
                        </div>

                        {/* Apply to Overload Game Button - Disabled until actionable */}
                        <button
                            onClick={handleApplyToPilot}
                            disabled={!canApply || isSaving}
                            className={clsx(
                                "flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all uppercase tracking-wider",
                                canApply && !isSaving
                                    ? "bg-[#ff6600] hover:bg-[#ff8533] text-black shadow-lg shadow-[#ff6600]/25 cursor-pointer"
                                    : "bg-white/5 border border-white/10 text-gray-500 cursor-not-allowed opacity-50 shadow-none"
                            )}
                            title={
                                !hasValidPilot
                                    ? "Connect your Overload folder to detect an active pilot"
                                    : !hasFilledSlot
                                    ? "Equip at least one taunt slot to apply"
                                    : !dirHandle && !isServerNative
                                    ? "Connect your Overload folder to apply"
                                    : "Apply taunt loadout directly to your pilot configuration"
                            }
                        >
                            {isSaving ? (
                                <div className="animate-spin h-3.5 w-3.5 border-2 border-black border-t-transparent rounded-full" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            Apply to Overload
                        </button>
                    </div>
                </div>

                {/* Connection Status / Dismissible First-Run Banner */}
                {!isClientConnected && !isServerNative && !isConnectBannerDismissed && (
                    <div className="relative p-4 rounded-xl border border-[#ff6600]/40 bg-[#ff6600]/10 flex flex-col md:flex-row items-center justify-between gap-4 font-mono shadow-[0_0_20px_rgba(255,102,0,0.1)]">
                        <button
                            onClick={handleDismissBanner}
                            className="absolute top-2.5 right-2.5 p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                            title="Dismiss notice (you can connect anytime using the top bar)"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <div className="flex items-start gap-3 pr-6">
                            <div className="p-2 rounded-lg bg-[#ff6600]/20 text-[#ff6600] flex-shrink-0 mt-0.5">
                                <HardDrive className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-white font-bold text-sm flex items-center gap-2">
                                    Connect Your PC's Overload Folder
                                    <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-[#ff6600]/20 text-[#ff6600] border border-[#ff6600]/30 font-semibold">Web Browser</span>
                                </h4>
                                <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                                    Overload Fight Club is running in your web browser. Grant access to your local Overload directory (<code className="text-[#ff6600] bg-black/50 px-1 py-0.5 rounded">AppData\LocalLow\Revival\Overload</code>) so the Loadout Manager can read your pilot configs and apply taunts directly to your PC!
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={connectLocalFolder}
                            disabled={isConnecting}
                            className="px-4 py-2.5 bg-[#ff6600] hover:bg-[#ff7711] disabled:opacity-50 text-black font-bold text-xs rounded-xl transition-all shadow-lg flex-shrink-0 flex items-center gap-2 uppercase tracking-wider"
                        >
                            {isConnecting ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                                <FolderOpen className="w-4 h-4" />
                            )}
                            <span>{isConnecting ? 'Connecting...' : 'Connect Overload Folder'}</span>
                        </button>
                    </div>
                )}

                {isClientConnected && (
                    <div className="p-3 px-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-emerald-300 font-mono">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span>Connected to Local PC Folder: <strong className="text-white">{folderName}</strong></span>
                            <span className="text-emerald-400/60 text-[11px]">({fsPilots.length} pilot(s) loaded)</span>
                        </div>
                        <button
                            onClick={disconnectLocalFolder}
                            className="text-gray-400 hover:text-red-400 text-[11px] flex items-center gap-1 transition-colors self-end sm:self-auto"
                            title="Disconnect local PC folder"
                        >
                            <Unplug className="w-3 h-3" />
                            <span>Disconnect Folder</span>
                        </button>
                    </div>
                )}

                {/* Overload Running Warning */}
                {isGameRunning && (
                    <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-xl text-xs text-amber-300 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                        <span>
                            <strong>Overload is currently running:</strong> Overload caches pilot files while active. When you click Apply, please switch to another pilot and back in Overload (or restart the game) so OLMod reloads your new taunts without overwriting them.
                        </span>
                    </div>
                )}

                {/* Feedback Banner */}
                {saveFeedback && (
                    <div className={`p-4 rounded-xl text-xs flex items-center gap-3 border ${
                        saveFeedback.success 
                            ? 'bg-green-950/40 border-green-500/30 text-green-300' 
                            : 'bg-red-950/40 border-red-500/30 text-red-300'
                    }`}>
                        {saveFeedback.success ? (
                            <ShieldCheck className="w-5 h-5 flex-shrink-0 text-green-400" />
                        ) : (
                            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
                        )}
                        <span>{saveFeedback.message}</span>
                    </div>
                )}

                {/* 6 Slots Rack */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {slots.map(slot => (
                        <div
                            key={slot.slotNumber}
                            className={`rounded-xl border p-4 transition-all duration-300 ${
                                highlightedSlot === slot.slotNumber
                                    ? 'bg-black/90 border-[#ff6600] ring-2 ring-[#ff6600] shadow-xl shadow-[#ff6600]/30 scale-[1.02]'
                                    : slot.tauntId 
                                        ? 'bg-black/60 border-[#ff6600]/40 shadow-lg shadow-[#ff6600]/5' 
                                        : 'bg-black/30 border-white/5 hover:border-white/10'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded font-bold text-xs border ${
                                        highlightedSlot === slot.slotNumber
                                            ? 'bg-[#ff6600] text-black border-[#ff6600]'
                                            : 'bg-white/10 text-white border border-white/10'
                                    }`}>
                                        Slot {slot.slotNumber}
                                    </span>
                                    <span className="text-[#ff6600] text-xs font-bold font-sans">
                                        [{slot.keybind}]
                                    </span>
                                    {highlightedSlot === slot.slotNumber && (
                                        <span className="text-[10px] text-green-400 font-bold uppercase animate-pulse">
                                            Just Equipped!
                                        </span>
                                    )}
                                </div>

                                {slot.tauntId && (
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

                            {slot.tauntId ? (
                                <div className="space-y-2">
                                    <div>
                                        <div className="text-sm font-bold text-gray-200 truncate" title={slot.tauntName || ''}>
                                            {slot.tauntName}
                                        </div>
                                        <div className="text-[10px] text-gray-500 font-mono truncate">
                                            Hash: {slot.tauntId}
                                        </div>
                                    </div>
                                    
                                    {/* Direct Replace dropdown without needing to delete first */}
                                    <select
                                        onChange={(e) => {
                                            if (e.target.value) handleAssignTaunt(slot.slotNumber, e.target.value);
                                        }}
                                        defaultValue=""
                                        className="w-full bg-black/60 border border-white/10 hover:border-white/20 rounded-lg p-1.5 text-[11px] text-gray-400 hover:text-gray-200 focus:outline-none focus:border-[#ff6600]"
                                    >
                                        <option value="" disabled>Change / Replace taunt...</option>
                                        <optgroup label="Overload In-Game Vault">
                                            {vaultTaunts.map(t => (
                                                <option key={t.id + '-' + t.relativePath} value={t.id}>{t.cleanName} ({t.location})</option>
                                            ))}
                                        </optgroup>
                                        {localHistoryTaunts.length > 0 && (
                                            <optgroup label="Recent Web Exports">
                                                {localHistoryTaunts.map(h => (
                                                    <option key={'hist-' + h.id} value={h.id}>{h.name}</option>
                                                ))}
                                            </optgroup>
                                        )}
                                    </select>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="text-xs text-gray-500 italic">
                                        Slot empty
                                    </div>
                                    <select
                                        onChange={(e) => {
                                            if (e.target.value) handleAssignTaunt(slot.slotNumber, e.target.value);
                                        }}
                                        defaultValue=""
                                        className="w-full bg-black/80 border border-white/10 rounded-lg p-2 text-xs text-gray-300 focus:outline-none focus:border-[#ff6600]"
                                    >
                                        <option value="" disabled>Equip from Vault / History...</option>
                                        <optgroup label="Overload In-Game Vault">
                                            {vaultTaunts.map(t => (
                                                <option key={t.id + '-' + t.relativePath} value={t.id}>{t.cleanName} ({t.location})</option>
                                            ))}
                                        </optgroup>
                                        {localHistoryTaunts.length > 0 && (
                                            <optgroup label="Recent Web Exports">
                                                {localHistoryTaunts.map(h => (
                                                    <option key={'hist2-' + h.id} value={h.id}>{h.name}</option>
                                                ))}
                                            </optgroup>
                                        )}
                                    </select>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Footer Tools Bar */}
                <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-2 text-gray-400">
                        <ShieldCheck className="w-4 h-4 text-green-400" />
                        <span>Automatic Backup enabled before every game write</span>
                    </div>

                    <button
                        onClick={handleDownloadZip}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-all"
                    >
                        <Package className="w-3.5 h-3.5" />
                        <span>Download ZIP Backup</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
