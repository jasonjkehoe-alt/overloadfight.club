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
    X
} from 'lucide-react';
import { clsx } from 'clsx';

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
}

export type VaultSortOption = 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc' | 'size-desc' | 'size-asc';

export const OverloadVault: React.FC<OverloadVaultProps> = ({ onLoadIntoEditor, onEquipToSlot }) => {
    const [taunts, setTaunts] = useState<GameTauntItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterLocation, setFilterLocation] = useState<'all' | 'user' | 'external'>('all');
    const [sortBy, setSortBy] = useState<VaultSortOption>('date-desc');
    const [searchQuery, setSearchQuery] = useState('');
    const [playingId, setPlayingId] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [selectedPilot, setSelectedPilot] = useState<string>('Soup');
    const [pilots, setPilots] = useState<string[]>([]);
    const [pilotTauntHashes, setPilotTauntHashes] = useState<string[]>([]);
    const [gamePath, setGamePath] = useState<string>('');

    const currentAudioRef = useRef<HTMLAudioElement | null>(null);

    const fetchVaultData = async () => {
        setLoading(true);
        try {
            // 1. Fetch status
            const statusRes = await fetch('/api/overload/status');
            if (statusRes.ok) {
                const statusData = await statusRes.json();
                setGamePath(statusData.gamePath);
                setPilots(statusData.pilots || []);
                if (statusData.activePilot) {
                    setSelectedPilot(statusData.activePilot);
                }
            }

            // 2. Fetch taunts
            const tauntsRes = await fetch('/api/overload/taunts');
            if (tauntsRes.ok) {
                const data = await tauntsRes.json();
                setTaunts(data.taunts || []);
            }
        } catch (err) {
            console.error('Failed to fetch Overload vault data', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchPilotData = async (name: string) => {
        try {
            const res = await fetch(`/api/overload/pilot/${encodeURIComponent(name)}`);
            if (res.ok) {
                const data = await res.json();
                setPilotTauntHashes(data.selectedTaunts || []);
            }
        } catch (err) {
            console.error('Failed to fetch pilot data', err);
        }
    };

    useEffect(() => {
        fetchVaultData();
    }, []);

    useEffect(() => {
        if (selectedPilot) {
            fetchPilotData(selectedPilot);
        }
    }, [selectedPilot]);

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

    return (
        <div className="w-full max-w-6xl mx-auto space-y-6 font-mono animate-fade-in">
            {/* Top Vault Header */}
            <div className="bg-[#121212] rounded-2xl border border-white/10 p-6 md:p-8 shadow-2xl space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl md:text-3xl font-bold text-[#ff6600] tracking-tight brand-font">
                                OVERLOAD VAULT
                            </h2>
                            <span className="px-2.5 py-0.5 text-[10px] uppercase font-bold tracking-widest bg-green-500/10 border border-green-500/30 text-green-400 rounded-full flex items-center gap-1.5">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                Live Game Link Active
                            </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                            Installed Game Taunts &bull; {gamePath}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchVaultData}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-xs transition-all"
                            title="Refresh game files"
                        >
                            <RefreshCw className={clsx("w-3.5 h-3.5", loading && "animate-spin")} />
                            <span>Refresh Vault</span>
                        </button>
                    </div>
                </div>

                {/* Active Pilot Loadout Quick View */}
                <div className="bg-black/50 p-4 rounded-xl border border-white/5 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-[#ff6600]" />
                            <span className="text-sm font-bold text-white">Active Pilot:</span>
                            <select
                                value={selectedPilot}
                                onChange={(e) => setSelectedPilot(e.target.value)}
                                className="bg-black border border-white/20 rounded px-2 py-1 text-xs text-[#ff6600] font-bold focus:outline-none"
                            >
                                {pilots.map(p => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
                        </div>
                        <span className="text-xs text-gray-500">
                            Equipped Taunts from <code className="text-gray-400">{selectedPilot}.extendedconfig</code>
                        </span>
                    </div>

                    {/* 6 Equipped Mini-Slots */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                        {[0, 1, 2, 3, 4, 5].map(idx => {
                            const hash = pilotTauntHashes[idx];
                            const matched = taunts.find(t => t.id === hash);
                            return (
                                <div 
                                    key={idx}
                                    className={`p-2 rounded-lg border text-left flex flex-col justify-between ${
                                        matched 
                                            ? 'bg-black/60 border-[#ff6600]/40' 
                                            : 'bg-black/30 border-white/5'
                                    }`}
                                >
                                    <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
                                        <span className="font-bold text-gray-300">Slot {idx + 1}</span>
                                        <span className="text-[#ff6600]">F{idx + 1}</span>
                                    </div>
                                    <div className="text-xs font-bold text-gray-200 truncate" title={matched?.cleanName || hash || 'Empty'}>
                                        {matched?.cleanName || (hash ? `${hash.substring(0, 8)}...` : 'Empty')}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

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

                        {/* Search Input */}
                        <div className="relative flex-grow sm:w-64">
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
                        <div className="py-12 text-center text-gray-500 text-sm">
                            {loading ? 'Scanning game files...' : 'No matching audio taunts found in Overload folder.'}
                        </div>
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
                                                        <span className="px-1.5 py-0.2 bg-[#ff6600]/20 text-[#ff6600] border border-[#ff6600]/40 text-[9px] rounded uppercase font-bold flex-shrink-0">
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
        </div>
    );
};
