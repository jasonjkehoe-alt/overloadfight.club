import React, { useState, useEffect, useRef } from 'react';
import { 
    Folder, 
    Search, 
    Play, 
    Pause, 
    Copy, 
    Check, 
    User, 
    Users, 
    Sliders, 
    Gamepad2, 
    ExternalLink, 
    HardDrive,
    Sparkles,
    RefreshCw,
    ShieldCheck,
    Clock,
    ArrowUpDown,
    X,
    FolderOpen,
    Unplug,
    Archive,
    Copy as CopyIcon,
    Edit2,
    Trash2,
    Award
} from 'lucide-react';
import Link from './Link';
import { Loading, EmptyState } from './States';
import { useDialog } from '../hooks/useDialog';
import { clsx } from 'clsx';
import { useOverloadFs } from '../context/OverloadFsContext';
import { getPilotDataClient } from '../utils/overloadFsBridge';
import {
    backupAllPilotsZipClient,
    clonePilotClient,
    renamePilotClient,
    deletePilotClient,
    readPilotXPClient,
    setPilotXPClient,
    checkOverloadRunningClient
} from '../utils/pilotSettingsBridge';

export interface GameTauntItem {
    id: string; // MD5 hash (lowercase)
    cleanName: string;
    rawFileName: string;
    relativePath: string;
    location: 'user' | 'external';
    sizeBytes: number;
    modifiedTime: number;
    audioUrl: string;
}

interface OverloadVaultProps {
    onLoadIntoEditor: (file: File) => void;
    onEquipToSlot: (item: GameTauntItem, slotNum: number) => void;
    settingsUrl?: string;
}

export type VaultSortOption = 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc' | 'size-desc' | 'size-asc';

export const OverloadVault: React.FC<OverloadVaultProps> = ({ onLoadIntoEditor, onEquipToSlot, settingsUrl }) => {
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

    const [loading, setLoading] = useState(false);
    const [filterLocation, setFilterLocation] = useState<'all' | 'user' | 'external'>('all');
    const [sortBy, setSortBy] = useState<VaultSortOption>('date-desc');
    const [searchQuery, setSearchQuery] = useState('');
    const [playingId, setPlayingId] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [selectedPilot, setSelectedPilot] = useState<string>(fsActivePilot || 'Soup');
    const [pilotTauntHashes, setPilotTauntHashes] = useState<string[]>([]);

    // Pilot Management State (P1)
    const [pilotXP, setPilotXP] = useState<number | null>(null);
    const [pilotModal, setPilotModal] = useState<'clone' | 'rename' | 'delete' | 'xp' | null>(null);
    const [pilotModalInput, setPilotModalInput] = useState<string>('');
    const [pilotOpLoading, setPilotOpLoading] = useState<boolean>(false);
    // Escape closes the pilot dialog unless an operation is running, like its close button
    const pilotDialog = useDialog(pilotModal !== null, () => { if (!pilotOpLoading) setPilotModal(null); });
    const [pilotOpMessage, setPilotOpMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const currentAudioRef = useRef<HTMLAudioElement | null>(null);

    // Sync selectedPilot when fsActivePilot updates
    useEffect(() => {
        if (fsActivePilot) {
            setSelectedPilot(fsActivePilot);
        }
    }, [fsActivePilot]);

    // Load pilot selected taunts and XP
    const fetchPilotData = async (name: string) => {
        if (!name) return;
        try {
            if (dirHandle) {
                const pData = await getPilotDataClient(dirHandle, name);
                if (pData) {
                    setPilotTauntHashes(pData.selectedTaunts || []);
                }
                const xp = await readPilotXPClient(dirHandle, name);
                setPilotXP(xp);
            } else if (isServerNative) {
                const res = await fetch(`/api/overload/pilot/${encodeURIComponent(name)}`);
                if (res.ok) {
                    const data = await res.json();
                    setPilotTauntHashes(data.selectedTaunts || []);
                    if (data.xp !== undefined) setPilotXP(data.xp);
                }
            }
        } catch (err) {
            console.error('Failed to fetch pilot data', err);
        }
    };

    useEffect(() => {
        if (selectedPilot) {
            fetchPilotData(selectedPilot);
        }
    }, [selectedPilot, dirHandle, isServerNative]);

    // Use vaultTaunts from context
    const taunts = vaultTaunts;
    const pilots = fsPilots;

    const handlePlayPause = (item: GameTauntItem) => {
        if (playingId === item.id) {
            if (currentAudioRef.current) {
                currentAudioRef.current.pause();
                currentAudioRef.current = null;
            }
            setPlayingId(null);
        } else {
            if (currentAudioRef.current) {
                currentAudioRef.current.pause();
            }
            const audio = new Audio(item.audioUrl);
            audio.onended = () => {
                setPlayingId(null);
            };
            audio.play();
            currentAudioRef.current = audio;
            setPlayingId(item.id);
        }
    };

    const handleCopyHash = (hash: string) => {
        navigator.clipboard.writeText(hash);
        setCopiedId(hash);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleLoadIntoEditor = async (item: GameTauntItem) => {
        try {
            const res = await fetch(item.audioUrl);
            const blob = await res.blob();
            const file = new File([blob], `${item.cleanName}.ogg`, { type: 'audio/ogg' });
            onLoadIntoEditor(file);
        } catch (err) {
            console.error('Failed to load taunt into editor', err);
        }
    };

    // Format timestamp into human-readable relative time
    const formatModifiedTime = (timestamp: number) => {
        if (!timestamp) return '';
        const now = Date.now();
        const diffMs = now - timestamp;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHours = Math.floor(diffMin / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffSec < 60) return 'Just now';
        if (diffMin < 60) return `${diffMin}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;

        return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    // Filter items
    const filteredTaunts = taunts.filter(t => {
        if (filterLocation !== 'all' && t.location !== filterLocation) {
            return false;
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            return (
                t.cleanName.toLowerCase().includes(q) ||
                t.id.toLowerCase().includes(q) ||
                t.rawFileName.toLowerCase().includes(q)
            );
        }
        return true;
    });

    // Sort items by chosen criteria (Default: Latest created first)
    const processedTaunts = [...filteredTaunts].sort((a, b) => {
        switch (sortBy) {
            case 'date-desc':
                return (b.modifiedTime || 0) - (a.modifiedTime || 0);
            case 'date-asc':
                return (a.modifiedTime || 0) - (b.modifiedTime || 0);
            case 'name-asc':
                return a.cleanName.localeCompare(b.cleanName, undefined, { sensitivity: 'base' });
            case 'name-desc':
                return b.cleanName.localeCompare(a.cleanName, undefined, { sensitivity: 'base' });
            case 'size-desc':
                return b.sizeBytes - a.sizeBytes;
            case 'size-asc':
                return a.sizeBytes - b.sizeBytes;
            default:
                return (b.modifiedTime || 0) - (a.modifiedTime || 0);
        }
    });

    const userTauntsCount = taunts.filter(t => t.location === 'user').length;
    const externalTauntsCount = taunts.filter(t => t.location === 'external').length;


    // Pilot Management Actions (P1)
    const handleBackupAll = async () => {
        if (!dirHandle) return;
        setPilotOpLoading(true);
        setPilotOpMessage(null);
        try {
            const res = await backupAllPilotsZipClient(dirHandle, pilots);
            if (res.success) {
                setPilotOpMessage({ type: 'success', text: `Archived ${res.fileCount} pilot files to "${res.fileName}" in Pilot Backup/` });
            } else {
                setPilotOpMessage({ type: 'error', text: res.error || 'Backup failed' });
            }
        } catch (e: any) {
            setPilotOpMessage({ type: 'error', text: e.message || 'Backup failed' });
        } finally {
            setPilotOpLoading(false);
        }
    };

    const handleConfirmPilotModal = async () => {
        if (!dirHandle) return;
        setPilotOpLoading(true);
        setPilotOpMessage(null);

        try {
            if (pilotModal === 'clone') {
                const res = await clonePilotClient(dirHandle, selectedPilot, pilotModalInput, pilots);
                if (res.success) {
                    setPilotOpMessage({ type: 'success', text: `Cloned ${selectedPilot} → ${pilotModalInput.trim()} (${res.clonedCount} files)` });
                    setPilotModal(null);
                    await refreshData();
                } else {
                    setPilotOpMessage({ type: 'error', text: res.error || 'Clone failed' });
                }
            } else if (pilotModal === 'rename') {
                const res = await renamePilotClient(dirHandle, selectedPilot, pilotModalInput, fsActivePilot, pilots);
                if (res.success) {
                    setPilotOpMessage({ type: 'success', text: `Renamed ${selectedPilot} → ${pilotModalInput.trim()}` });
                    setSelectedPilot(pilotModalInput.trim());
                    setFsActivePilot(pilotModalInput.trim());
                    setPilotModal(null);
                    await refreshData();
                } else {
                    setPilotOpMessage({ type: 'error', text: res.error || 'Rename failed' });
                }
            } else if (pilotModal === 'delete') {
                const res = await deletePilotClient(dirHandle, selectedPilot, pilots, fsActivePilot);
                if (res.success) {
                    setPilotOpMessage({ type: 'success', text: `Deleted pilot ${selectedPilot} (${res.deletedCount} files)` });
                    setPilotModal(null);
                    await refreshData();
                } else {
                    setPilotOpMessage({ type: 'error', text: res.error || 'Delete failed' });
                }
            } else if (pilotModal === 'xp') {
                const xpNum = parseInt(pilotModalInput, 10);
                if (isNaN(xpNum) || xpNum < 0 || xpNum > 9999999) {
                    setPilotOpMessage({ type: 'error', text: 'XP must be a number between 0 and 9,999,999' });
                    setPilotOpLoading(false);
                    return;
                }
                const res = await setPilotXPClient(dirHandle, selectedPilot, xpNum);
                if (res.success) {
                    setPilotXP(xpNum);
                    setPilotOpMessage({ type: 'success', text: `Updated ${selectedPilot} XP to ${xpNum.toLocaleString()} (Backup created: ${res.backupFileName})` });
                    setPilotModal(null);
                } else {
                    setPilotOpMessage({ type: 'error', text: res.error || 'Failed to update XP' });
                }
            }
        } catch (e: any) {
            setPilotOpMessage({ type: 'error', text: e.message || 'Operation failed' });
        } finally {
            setPilotOpLoading(false);
        }
    };

    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 font-mono text-gray-200">
            {/* Top Toolbar Card */}
            <div className="bg-[#121215] border border-gray-800 rounded-2xl p-6 shadow-2xl space-y-4">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                            <Folder className="w-5 h-5 text-[#ff6600]" />
                            <h2 className="text-xl font-bold tracking-wider brand-font text-white">
                                TAUNT <span className="text-[#ff6600]">LIBRARY</span> &amp; PILOT REPOSITORY
                            </h2>
                        </div>
                        <p className="text-xs text-gray-400">
                            Local OGG audio library and pilot client file family (.xconfig, .xprefs, .extendedconfig)
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {!isClientConnected && !isServerNative && (
                            <button
                                onClick={connectLocalFolder}
                                disabled={isConnecting}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#ff6600] hover:bg-[#ff8533] text-black font-bold text-xs shadow-lg shadow-[#ff6600]/20 transition-all uppercase tracking-wider"
                            >
                                {isConnecting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <HardDrive className="w-3.5 h-3.5" />}
                                <span>{isConnecting ? 'Connecting...' : 'Connect Folder'}</span>
                            </button>
                        )}
                        {(isClientConnected || isServerNative) && (
                            <button
                                onClick={refreshData}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-xs transition-all"
                                title="Refresh game files"
                            >
                                <RefreshCw className={clsx("w-3.5 h-3.5", (loading || isConnecting) && "animate-spin")} />
                                <span>Refresh Library</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Operation Feedback Toast */}
                {pilotOpMessage && (
                    <div className={clsx(
                        "p-3 rounded-xl border text-xs flex items-center justify-between",
                        pilotOpMessage.type === 'success' ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300" : "bg-red-950/40 border-red-500/40 text-red-300"
                    )}>
                        <span>{pilotOpMessage.text}</span>
                        <button onClick={() => setPilotOpMessage(null)} className="opacity-60 hover:opacity-100 ml-3">✕</button>
                    </div>
                )}

                {/* Pilot Management Toolbar (P1) */}
                {(isClientConnected || isServerNative) && selectedPilot && (
                    <div className="bg-black/50 p-3.5 rounded-xl border border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2">
                                <User className="w-3.5 h-3.5 text-[#ff6600]" />
                                <span className="text-gray-400 font-semibold">Pilot:</span>
                                <select
                                    value={selectedPilot}
                                    onChange={(e) => {
                                        setSelectedPilot(e.target.value);
                                        setFsActivePilot(e.target.value);
                                    }}
                                    className="bg-black/80 border border-white/20 focus:border-[#ff6600] rounded-lg px-2.5 py-1 text-xs text-white font-bold focus:outline-none cursor-pointer"
                                >
                                    {pilots.map(p => (
                                        <option key={p} value={p}>{p} {p === fsActivePilot ? '(Active)' : ''}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Pilot XP Chip */}
                            {pilotXP !== null && (
                                <button
                                    onClick={() => {
                                        setPilotModalInput(String(pilotXP));
                                        setPilotModal('xp');
                                    }}
                                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-950/40 border border-purple-500/30 text-purple-300 hover:bg-purple-900/40 transition-colors"
                                    title="Campaign XP (Single-player only) — click to edit"
                                >
                                    <Award className="w-3.5 h-3.5 text-purple-400" />
                                    <span>XP: {pilotXP.toLocaleString()}</span>
                                    <span className="text-[10px] text-purple-400/60 uppercase">SP</span>
                                </button>
                            )}
                        </div>

                        {/* Pilot Family Operations */}
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                onClick={handleBackupAll}
                                disabled={pilotOpLoading}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-all text-xs"
                                title="Backup all pilots into a timestamped zip in Pilot Backup/"
                            >
                                <Archive className="w-3 h-3 text-[#ff6600]" />
                                <span>Backup All</span>
                            </button>

                            <button
                                onClick={() => {
                                    setPilotModalInput(`${selectedPilot}_Copy`);
                                    setPilotModal('clone');
                                }}
                                disabled={pilotOpLoading}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-all text-xs"
                                title="Clone this pilot across the 6-file family"
                            >
                                <CopyIcon className="w-3 h-3 text-blue-400" />
                                <span>Clone</span>
                            </button>

                            <button
                                onClick={() => {
                                    setPilotModalInput(selectedPilot);
                                    setPilotModal('rename');
                                }}
                                disabled={pilotOpLoading}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-all text-xs"
                                title="Rename this pilot across the 6-file family"
                            >
                                <Edit2 className="w-3 h-3 text-yellow-400" />
                                <span>Rename</span>
                            </button>

                            <button
                                onClick={() => setPilotModal('delete')}
                                disabled={pilotOpLoading || pilots.length <= 1}
                                className={clsx(
                                    "flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-all text-xs",
                                    pilots.length <= 1 
                                        ? "bg-black/40 border-white/5 text-gray-600 cursor-not-allowed" 
                                        : "bg-white/5 hover:bg-red-950/40 border-white/10 text-gray-300 hover:text-red-400"
                                )}
                                title={pilots.length <= 1 ? "Cannot delete the only pilot" : "Delete this pilot across the 6-file family"}
                            >
                                <Trash2 className="w-3 h-3" />
                                <span>Delete</span>
                            </button>

                            {settingsUrl && (
                                <Link
                                    to={settingsUrl}
                                    className="flex items-center gap-1 px-3 py-1 rounded-lg bg-[#ff6600]/15 hover:bg-[#ff6600]/25 border border-[#ff6600]/40 text-[#ff6600] font-bold transition-all text-xs"
                                    title="Open Pilot Settings (.xprefs, .xconfig, keybinds)"
                                >
                                    <Sliders className="w-3 h-3" />
                                    <span>Settings</span>
                                </Link>
                            )}
                        </div>
                    </div>
                )}

                {/* Filter, Sort, and Search Bar */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2">
                    {/* Location Pills */}
                    <div className="flex items-center gap-1.5 w-full md:w-auto bg-black/40 p-1 rounded-xl border border-white/10 text-xs overflow-x-auto">
                        <button
                            onClick={() => setFilterLocation('all')}
                            className={clsx(
                                "px-3 py-1.5 rounded-lg transition-all shrink-0",
                                filterLocation === 'all' 
                                    ? "bg-[#ff6600] text-black font-bold shadow-lg" 
                                    : "text-gray-400 hover:text-white"
                            )}
                        >
                            All ({taunts.length})
                        </button>
                        <button
                            onClick={() => setFilterLocation('user')}
                            className={clsx(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all shrink-0",
                                filterLocation === 'user' 
                                    ? "bg-[#ff6600] text-black font-bold shadow-lg" 
                                    : "text-gray-400 hover:text-white"
                            )}
                        >
                            <User className="w-3.5 h-3.5" />
                            <span>My Taunts ({userTauntsCount})</span>
                        </button>
                        <button
                            onClick={() => setFilterLocation('external')}
                            className={clsx(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all shrink-0",
                                filterLocation === 'external' 
                                    ? "bg-[#ff6600] text-black font-bold shadow-lg" 
                                    : "text-gray-400 hover:text-white"
                            )}
                        >
                            <Users className="w-3.5 h-3.5" />
                            <span>Opponent Taunts ({externalTauntsCount})</span>
                        </button>
                    </div>

                    {/* Sort & Search Controls */}
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        {/* Sort Selector */}
                        <div className="flex items-center gap-1.5 bg-black/80 border border-white/10 focus-within:border-[#ff6600] rounded-xl px-2.5 py-1.5 text-xs text-gray-300 shrink-0">
                            <ArrowUpDown className="w-3.5 h-3.5 text-[#ff6600]" />
                            <span className="text-gray-500 text-[11px] hidden sm:inline">Sort:</span>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as VaultSortOption)}
                                className="bg-transparent text-white text-xs font-bold focus:outline-none cursor-pointer"
                            >
                                <option value="date-desc" className="bg-[#121212] text-white">Latest Created</option>
                                <option value="date-asc" className="bg-[#121212] text-white">Oldest First</option>
                                <option value="name-asc" className="bg-[#121212] text-white">Name (A → Z)</option>
                                <option value="name-desc" className="bg-[#121212] text-white">Name (Z → A)</option>
                                <option value="size-desc" className="bg-[#121212] text-white">Size (Largest)</option>
                                <option value="size-asc" className="bg-[#121212] text-white">Size (Smallest)</option>
                            </select>
                        </div>

                        {/* Search Input - Widened to prevent placeholder truncation */}
                        <div className="relative flex-grow sm:w-80 md:w-96">
                            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by name, hash, file..."
                                className="w-full bg-black/80 border border-white/10 focus:border-[#ff6600] rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-gray-500 focus:outline-none"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-2.5 top-2.5 text-gray-500 hover:text-white"
                                    title="Clear search"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Taunt List */}
                <div className="space-y-2 pt-2">
                    {processedTaunts.length === 0 ? (
                        !isClientConnected && !isServerNative ? (
                            <EmptyState
                                icon={FolderOpen}
                                title="Your PC Overload folder is not connected."
                                message={<>Connect your local game directory (<code className="text-brand bg-black/40 px-1 py-0.5 rounded-control">AppData\LocalLow\Revival\Overload</code>) to index your custom taunts and opponent audio in your Library.</>}
                                action={
                                    <button
                                        onClick={connectLocalFolder}
                                        disabled={isConnecting}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-brand text-black font-bold text-xs rounded-xl shadow-lg hover:bg-brand-hover transition-all uppercase tracking-wider"
                                    >
                                        {isConnecting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <HardDrive className="w-3.5 h-3.5" />}
                                        <span>{isConnecting ? 'Connecting...' : 'Connect Overload Folder'}</span>
                                    </button>
                                }
                            />
                        ) : loading ? (
                            <Loading compact label="Scanning game files..." />
                        ) : (
                            <EmptyState icon={FolderOpen} title="No matching audio taunts found in Overload folder." />
                        )
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto pr-1">
                            {processedTaunts.map((item) => {
                                const isEquipped = pilotTauntHashes.includes(item.id);
                                const isPlayingThis = playingId === item.id;

                                return (
                                    <div
                                        key={item.id + item.relativePath}
                                        className={clsx(
                                            "p-3 rounded-xl border transition-all flex items-center justify-between group",
                                            isEquipped 
                                                ? "bg-black/70 border-[#ff6600]/40 shadow-lg shadow-[#ff6600]/5"
                                                : "bg-black/40 border-white/5 hover:border-white/20"
                                        )}
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden mr-3">
                                            {/* Play button */}
                                            <button
                                                onClick={() => handlePlayPause(item)}
                                                className={clsx(
                                                    "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all shadow-md",
                                                    isPlayingThis 
                                                        ? "bg-green-500 text-black font-bold animate-pulse" 
                                                        : "bg-white/10 hover:bg-[#ff6600] hover:text-black text-white"
                                                )}
                                                title={isPlayingThis ? "Pause" : "Play Preview"}
                                            >
                                                {isPlayingThis ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                                            </button>

                                            {/* Info */}
                                            <div className="overflow-hidden space-y-0.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-sm text-gray-200 truncate" title={item.cleanName}>
                                                        {item.cleanName}
                                                    </span>
                                                    {isEquipped && (
                                                        <span className="px-1.5 bg-[#ff6600]/20 text-[#ff6600] border border-[#ff6600]/40 text-[9px] rounded uppercase font-bold flex-shrink-0">
                                                            Equipped
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                                    <button
                                                        onClick={() => handleCopyHash(item.id)}
                                                        className="hover:text-gray-300 flex items-center gap-1 font-mono"
                                                        title="Click to copy 32-character MD5 hash"
                                                    >
                                                        {copiedId === item.id ? (
                                                            <span className="text-green-400 flex items-center gap-0.5">
                                                                <Check className="w-3 h-3" /> Copied
                                                            </span>
                                                        ) : (
                                                            <span>{item.id.substring(0, 10)}...</span>
                                                        )}
                                                    </button>
                                                    <span>&bull;</span>
                                                    <span>{(item.sizeBytes / 1024).toFixed(1)} kB</span>
                                                    <span>&bull;</span>
                                                    <span className={item.location === 'user' ? 'text-orange-400/80 font-bold' : 'text-cyan-400/80'}>
                                                        {item.location === 'user' ? 'Local' : 'Opponent'}
                                                    </span>
                                                    {item.modifiedTime > 0 && (
                                                        <>
                                                            <span>&bull;</span>
                                                            <span className="text-gray-400 flex items-center gap-1 font-sans text-[10px]" title={new Date(item.modifiedTime).toLocaleString()}>
                                                                <Clock className="w-2.5 h-2.5 text-gray-500" />
                                                                {formatModifiedTime(item.modifiedTime)}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                            {/* Equip Dropdown */}
                                            <select
                                                onChange={(e) => {
                                                    const slotNum = parseInt(e.target.value, 10);
                                                    if (!isNaN(slotNum)) {
                                                        onEquipToSlot(item, slotNum);
                                                        e.target.value = "";
                                                    }
                                                }}
                                                defaultValue=""
                                                className="bg-black/60 border border-white/10 hover:border-[#ff6600] rounded px-2 py-1 text-[11px] text-gray-300 focus:outline-none cursor-pointer"
                                                title="Equip to pilot slot"
                                            >
                                                <option value="" disabled>Equip...</option>
                                                <option value="1">Slot 1 (F1)</option>
                                                <option value="2">Slot 2 (F2)</option>
                                                <option value="3">Slot 3 (F3)</option>
                                                <option value="4">Slot 4 (F4)</option>
                                                <option value="5">Slot 5 (F5)</option>
                                                <option value="6">Slot 6 (F6)</option>
                                            </select>

                                            {/* Load in editor */}
                                            <button
                                                onClick={() => handleLoadIntoEditor(item)}
                                                className="p-1.5 rounded bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white transition-colors"
                                                title="Edit / Trim in Waveform Editor"
                                            >
                                                <Sliders className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Pilot Management Modal (Clone, Rename, Delete, XP) */}
            {pilotModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div {...pilotDialog.props} className="bg-[#121214] border border-white/15 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                        {/* Header */}
                        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-black/40">
                            <div className="flex items-center gap-2.5">
                                {pilotModal === 'clone' && <CopyIcon className="w-5 h-5 text-blue-400" />}
                                {pilotModal === 'rename' && <Edit2 className="w-5 h-5 text-yellow-400" />}
                                {pilotModal === 'delete' && <Trash2 className="w-5 h-5 text-red-400" />}
                                {pilotModal === 'xp' && <Award className="w-5 h-5 text-purple-400" />}
                                <h3 id={pilotDialog.titleId} className="font-bold text-base text-white tracking-wide">
                                    {pilotModal === 'clone' && `Clone Pilot: ${selectedPilot}`}
                                    {pilotModal === 'rename' && `Rename Pilot: ${selectedPilot}`}
                                    {pilotModal === 'delete' && `Delete Pilot: ${selectedPilot}`}
                                    {pilotModal === 'xp' && `Campaign XP: ${selectedPilot}`}
                                </h3>
                            </div>
                            <button
                                onClick={() => setPilotModal(null)}
                                disabled={pilotOpLoading}
                                aria-label="Close"
                                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-5 space-y-4 text-xs font-mono">
                            {pilotModal === 'clone' && (
                                <>
                                    <p className="text-gray-300 leading-relaxed font-sans">
                                        Creates an exact copy of <span className="text-[#ff6600] font-bold">{selectedPilot}</span> across all 6 pilot family files (<code className="text-gray-400">.xconfig, .xprefs, .xprefsmod, .xscores, .extendedconfig, .xconfigmod</code>).
                                    </p>
                                    <div>
                                        <label className="block text-gray-400 mb-1.5 uppercase tracking-wider text-[11px] font-bold">New Pilot Name</label>
                                        <input
                                            type="text"
                                            value={pilotModalInput}
                                            onChange={(e) => setPilotModalInput(e.target.value)}
                                            placeholder="Enter new pilot name"
                                            maxLength={32}
                                            autoFocus
                                            className="w-full bg-black/60 border border-white/20 focus:border-[#ff6600] rounded-xl px-3.5 py-2.5 text-white font-bold text-sm focus:outline-none placeholder:text-gray-600"
                                        />
                                    </div>
                                </>
                            )}

                            {pilotModal === 'rename' && (
                                <>
                                    <p className="text-gray-300 leading-relaxed font-sans">
                                        Renames the entire file family for <span className="text-[#ff6600] font-bold">{selectedPilot}</span>. 
                                        Make sure <strong className="text-white">Overload is closed</strong> before renaming.
                                    </p>
                                    <div>
                                        <label className="block text-gray-400 mb-1.5 uppercase tracking-wider text-[11px] font-bold">New Pilot Name</label>
                                        <input
                                            type="text"
                                            value={pilotModalInput}
                                            onChange={(e) => setPilotModalInput(e.target.value)}
                                            placeholder="Enter new pilot name"
                                            maxLength={32}
                                            autoFocus
                                            className="w-full bg-black/60 border border-white/20 focus:border-[#ff6600] rounded-xl px-3.5 py-2.5 text-white font-bold text-sm focus:outline-none placeholder:text-gray-600"
                                        />
                                    </div>
                                </>
                            )}

                            {pilotModal === 'delete' && (
                                <div className="space-y-3 font-sans">
                                    <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-500/30 text-red-200 text-xs leading-relaxed">
                                        <p className="font-bold text-red-400 mb-1">Are you sure you want to delete {selectedPilot}?</p>
                                        <p className="text-red-300/80">
                                            This permanently removes all 6 configuration and score files. A safety backup will automatically be archived in <code className="text-white">Pilot Backup/</code> before deletion.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {pilotModal === 'xp' && (
                                <>
                                    <p className="text-gray-300 leading-relaxed font-sans">
                                        Adjust single-player campaign XP stored in <code className="text-purple-400">PS_XP2</code>. An automatic backup will be saved to <code className="text-gray-400">Pilot Backup/</code> before saving.
                                    </p>
                                    <div>
                                        <label className="block text-gray-400 mb-1.5 uppercase tracking-wider text-[11px] font-bold">XP Amount (0 – 9,999,999)</label>
                                        <input
                                            type="number"
                                            min={0}
                                            max={9999999}
                                            value={pilotModalInput}
                                            onChange={(e) => setPilotModalInput(e.target.value)}
                                            autoFocus
                                            className="w-full bg-black/60 border border-white/20 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-white font-bold text-base focus:outline-none"
                                        />
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                        <button
                                            type="button"
                                            onClick={() => setPilotModalInput(String(Math.min(9999999, (parseInt(pilotModalInput, 10) || 0) + 10000)))}
                                            className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-gray-300"
                                        >
                                            +10,000
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPilotModalInput(String(Math.min(9999999, (parseInt(pilotModalInput, 10) || 0) + 50000)))}
                                            className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-gray-300"
                                        >
                                            +50,000
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPilotModalInput('9999999')}
                                            className="px-2 py-1 rounded bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/30 text-[11px] text-purple-300"
                                        >
                                            Max (9,999,999)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPilotModalInput('0')}
                                            className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-gray-400"
                                        >
                                            Reset (0)
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-5 py-3.5 bg-black/50 border-t border-white/10 flex items-center justify-end gap-2.5 font-sans">
                            <button
                                onClick={() => setPilotModal(null)}
                                disabled={pilotOpLoading}
                                className="px-4 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-xs font-semibold"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmPilotModal}
                                disabled={pilotOpLoading || (pilotModal !== 'delete' && !pilotModalInput.trim())}
                                className={clsx(
                                    "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg",
                                    pilotModal === 'delete'
                                        ? "bg-red-600 hover:bg-red-500 text-white"
                                        : pilotModal === 'xp'
                                            ? "bg-purple-600 hover:bg-purple-500 text-white"
                                            : "bg-[#ff6600] hover:bg-[#ff8533] text-black"
                                )}
                            >
                                {pilotOpLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                                <span>
                                    {pilotModal === 'clone' && 'Clone Pilot'}
                                    {pilotModal === 'rename' && 'Rename Pilot'}
                                    {pilotModal === 'delete' && 'Delete Pilot'}
                                    {pilotModal === 'xp' && 'Save XP'}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
