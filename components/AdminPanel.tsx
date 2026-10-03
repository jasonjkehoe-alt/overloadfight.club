
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    LayoutDashboard,
    Database,
    History,
    Play,
    Pause,
    Square,
    RefreshCw,
    AlertTriangle,
    CheckCircle,
    Server,
    Download,
    Calendar as CalendarIcon,
    Key,
    Save,
    Map as MapIcon,
    PlusCircle,
    Archive
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

interface AdminStats {
    overview: {
        totalGames: number;
        maxId: number;
        minId: number;
        earliestDate: string;
        latestDate: string;
        coveragePercent: number;
    };
    history: { month: string; count: number }[];
    activeJob: any;
}

interface VersionInfo {
    hash: string;
    date: string;
    buildTime: string;
}

interface ArchiveStatus {
    isRunning: boolean;
    status: 'idle' | 'running' | 'completed' | 'error' | 'cancelled';
    currentMonth: string | null;
    completedMonths: string[];
    totalMonths: number;
    totalGamesInserted: number;
    error: string | null;
    logs: string[];
}

const ARCHIVE_MONTHS_LIST = [
    '2019-07', '2019-08', '2019-09', '2019-10', '2019-11', '2019-12',
    '2020-01', '2020-02', '2020-03', '2020-04', '2020-05', '2020-06',
    '2020-07', '2020-08', '2020-09', '2020-10', '2020-11', '2020-12',
    '2021-01', '2021-02', '2021-03', '2021-04', '2021-05', '2021-06',
    '2021-07', '2021-08', '2021-09', '2021-10', '2021-11', '2021-12',
    '2022-01', '2022-02', '2022-03', '2022-04'
];

const AdminPanel: React.FC = () => {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [targetDuration, setTargetDuration] = useState(5); // Hours
    const [estimatedPages, setEstimatedPages] = useState(3000); // Default approx
    const [version, setVersion] = useState<VersionInfo | null>(null);

    // Settings
    const [geminiKey, setGeminiKey] = useState('');
    const [calendarUrl, setCalendarUrl] = useState('');
    const [showColdStorage, setShowColdStorage] = useState(false);

    // Auth state
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    // Map Management state
    const [syncingMaps, setSyncingMaps] = useState(false);
    const [syncResult, setSyncResult] = useState<string | null>(null);
    const [totalMapsCount, setTotalMapsCount] = useState<number | null>(null);
    const [newMapName, setNewMapName] = useState('');
    const [newMapAuthor, setNewMapAuthor] = useState('');
    const [newMapSize, setNewMapSize] = useState('medium');
    const [newMapMaxPlayers, setNewMapMaxPlayers] = useState(8);
    const [newMapSupportsCtf, setNewMapSupportsCtf] = useState(false);
    const [newMapStyle, setNewMapStyle] = useState('mixed');
    const [newMapDownloadUrl, setNewMapDownloadUrl] = useState('');
    const [newMapImageUrl, setNewMapImageUrl] = useState('');
    const [addingMap, setAddingMap] = useState(false);
    const [mapMessage, setMapMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    // Historical Archive Sync state
    const [archiveStatus, setArchiveStatus] = useState<ArchiveStatus | null>(null);
    const [archiveLoading, setArchiveLoading] = useState(false);

    useEffect(() => {
        checkAuth();
        fetchVersion();
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            fetchStats();
            fetchSettings();
            fetchMapCount();
            fetchArchiveStatus();
            const interval = setInterval(() => {
                fetchStats();
                fetchArchiveStatus();
            }, 2000); // Poll for updates
            return () => clearInterval(interval);
        }
    }, [isAuthenticated]);

    const checkAuth = async () => {
        try {
            // Add timestamp to prevent caching
            const res = await axios.get(`/api/admin/auth-status?t=${Date.now()}`);
            setIsAuthenticated(res.data.isAuthenticated);
        } catch (e) {
            setIsAuthenticated(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post('/api/admin/login', { password });
            setIsAuthenticated(true);
            setError('');
        } catch (e) {
            setError('Invalid password');
        }
    };

    const fetchVersion = async () => {
        try {
            const res = await axios.get('/version.json');
            setVersion(res.data);
        } catch (e) {
            console.error("Failed to fetch version info");
        }
    };

    const fetchStats = async () => {
        try {
            const res = await axios.get('/api/admin/stats/extended');
            setStats(res.data);
            setError('');

            // Update estimated pages based on max ID if available
            if (res.data.overview.maxId) {
                setEstimatedPages(Math.ceil(res.data.overview.maxId / 25));
            }
        } catch (e: any) {
            console.error("Failed to fetch stats", e);
            const errorMsg = e.response?.data?.error || e.message || "Failed to load stats";

            // Check for 401 status OR "Unauthorized" in the error message
            if ((e.response && e.response.status === 401) || errorMsg.includes('Unauthorized')) {
                setIsAuthenticated(false);
                return;
            }
            setError(errorMsg);
        }
        setLoading(false);
    };

    const fetchSettings = async () => {
        try {
            const keyRes = await axios.get('/api/admin/settings/GEMINI_API_KEY');
            setGeminiKey(keyRes.data.value || '');

            const calRes = await axios.get('/api/admin/settings/CALENDAR_EMBED_URL');
            setCalendarUrl(calRes.data.value || '');

            const coldRes = await axios.get('/api/admin/settings/show_cold_storage');
            setShowColdStorage(coldRes.data.value === 'true');
        } catch (e) {
            console.error("Failed to fetch settings");
        }
    };

    const saveSetting = async (key: string, value: string) => {
        try {
            await axios.post('/api/admin/settings', { key, value });
            // Only alert for manual saves (buttons), not toggle
            if (key !== 'show_cold_storage') {
                alert(`${key} saved successfully`);
            }
        } catch (e) {
            alert(`Failed to save ${key}`);
        }
    };

    const fetchMapCount = async () => {
        try {
            const res = await axios.get('/api/maps?limit=1');
            setTotalMapsCount(res.data.count || 0);
        } catch (e) {
            console.error("Failed to fetch map count", e);
        }
    };

    const handleSyncMaps = async () => {
        setSyncingMaps(true);
        setSyncResult(null);
        try {
            const res = await axios.post('/api/admin/maps/sync');
            setSyncResult(`Synced ${res.data.count} levels successfully from overloadmaps.com`);
            fetchMapCount();
        } catch (err: any) {
            setSyncResult(`Sync failed: ${err.response?.data?.error || err.message}`);
        } finally {
            setSyncingMaps(false);
        }
    };

    const handleAddMap = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMapName.trim()) {
            setMapMessage({ text: 'Map name is required', type: 'error' });
            return;
        }
        setAddingMap(true);
        setMapMessage(null);
        try {
            await axios.post('/api/admin/maps', {
                name: newMapName.trim(),
                author: newMapAuthor.trim() || 'Unknown',
                size: newMapSize,
                max_players: newMapMaxPlayers,
                best_team_size: Math.ceil(newMapMaxPlayers / 2),
                supports_ctf: newMapSupportsCtf,
                style: newMapStyle,
                remote_url: newMapDownloadUrl.trim() || null,
                remote_image_url: newMapImageUrl.trim() || null
            });
            setMapMessage({ text: `Map "${newMapName}" successfully registered!`, type: 'success' });
            setNewMapName('');
            setNewMapAuthor('');
            setNewMapDownloadUrl('');
            setNewMapImageUrl('');
            fetchMapCount();
        } catch (err: any) {
            setMapMessage({ text: err.response?.data?.error || 'Failed to add map', type: 'error' });
        } finally {
            setAddingMap(false);
        }
    };

    const startBackfill = async (type: 'page_sync' | 'gap_fill') => {
        if (!stats) return;

        let start = 1;
        let end = stats.overview.maxId || 75000;
        let rateLimit = 1000;

        if (type === 'page_sync') {
            // Calculate rate limit based on target duration
            const totalMs = targetDuration * 60 * 60 * 1000;
            const totalPages = Math.ceil(end / 25);
            rateLimit = Math.floor(totalMs / totalPages);

            // Ensure we don't go too fast (min 200ms)
            if (rateLimit < 200) rateLimit = 200;

            // For page sync, start/end are page numbers
            start = 1;
            end = totalPages;
        } else {
            // Gap fill - usually faster per item but we want to be gentle
            rateLimit = 500;
        }

        try {
            await axios.post('/api/admin/backfill/start', {
                startGameId: start,
                endGameId: end,
                rateLimitMs: rateLimit,
                jobType: type
            });
            fetchStats();
        } catch (e: any) {
            alert(e.response?.data?.error || 'Failed to start job');
        }
    };

    const controlJob = async (action: 'pause' | 'resume' | 'cancel') => {
        if (!stats?.activeJob) return;
        try {
            if (action === 'resume') {
                await axios.post(`/api/admin/backfill/resume/${stats.activeJob.id}`);
            } else {
                await axios.post(`/api/admin/backfill/${action}/${stats.activeJob.id}`);
            }
            fetchStats();
        } catch (e) {
            console.error(e);
        }
    };

    const fetchArchiveStatus = async () => {
        try {
            const res = await axios.get('/api/admin/archive-sync/status');
            setArchiveStatus(res.data);
        } catch (e) {
            console.error("Failed to fetch archive status", e);
        }
    };

    const handleStartArchiveSync = async () => {
        if (!window.confirm('Start historical archive ingest (2019-07 through 2022-04)? This will download and bulk-insert ~20,000 matches into cold storage.')) {
            return;
        }
        setArchiveLoading(true);
        try {
            await axios.post('/api/admin/archive-sync/start');
            fetchArchiveStatus();
        } catch (e: any) {
            alert(e.response?.data?.error || 'Failed to start archive sync');
        } finally {
            setArchiveLoading(false);
        }
    };

    const handleCancelArchiveSync = async () => {
        try {
            await axios.post('/api/admin/archive-sync/cancel');
            fetchArchiveStatus();
        } catch (e: any) {
            alert(e.response?.data?.error || 'Failed to cancel archive sync');
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
                <form onSubmit={handleLogin} className="bg-gray-800 p-8 rounded-lg shadow-lg w-96">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <LayoutDashboard className="text-blue-500" /> Admin Access
                    </h2>
                    {error && <div className="bg-red-500/20 text-red-400 p-3 rounded mb-4">{error}</div>}
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter Admin Password"
                        className="w-full bg-gray-700 border border-gray-600 rounded p-3 mb-4 text-white focus:outline-none focus:border-blue-500"
                    />
                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded transition">
                        Login
                    </button>
                </form>
            </div>
        );
    }

    if (loading) return <div className="p-8 text-white">Loading stats...</div>;

    if (!stats) {
        return (
            <div className="p-8 text-white">
                <div className="bg-red-900/50 border border-red-500 p-4 rounded mb-4">
                    <h3 className="font-bold text-red-200">Error Loading Stats</h3>
                    <p className="text-red-300">{error || "Unknown error occurred"}</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => { setLoading(true); fetchStats(); }}
                        className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-500 font-bold"
                    >
                        Retry
                    </button>
                    <button
                        onClick={() => setIsAuthenticated(false)}
                        className="bg-gray-700 px-4 py-2 rounded hover:bg-gray-600 font-bold"
                    >
                        Logout
                    </button>
                </div>
            </div>
        );
    }

    const rateLimitCalc = Math.floor((targetDuration * 3600 * 1000) / estimatedPages);

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <LayoutDashboard className="w-8 h-8 text-blue-500" />
                        Command Center
                    </h1>
                    <p className="text-gray-400 mt-1">System Status & Ingestion Control</p>
                </div>
                <button onClick={() => setIsAuthenticated(false)} className="text-gray-400 hover:text-white">
                    Logout
                </button>
            </header>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-gray-400 text-sm">Total Games Tracked</p>
                            <h3 className="text-3xl font-bold text-white mt-1">{stats.overview.totalGames.toLocaleString()}</h3>
                        </div>
                        <Database className="text-blue-500 w-8 h-8 opacity-80" />
                    </div>
                    <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                        <div
                            className="bg-blue-500 h-full"
                            style={{ width: `${stats.overview.coveragePercent}%` }}
                        />
                    </div>
                    <p className="text-xs text-gray-400 mt-2">{stats.overview.coveragePercent}% Coverage of known history</p>
                </div>

                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-gray-400 text-sm">Earliest Record</p>
                            <h3 className="text-xl font-bold text-white mt-1">
                                {stats.overview.earliestDate ? new Date(stats.overview.earliestDate).toLocaleDateString() : 'N/A'}
                            </h3>
                        </div>
                        <History className="text-purple-500 w-8 h-8 opacity-80" />
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                        Latest: {stats.overview.latestDate ? new Date(stats.overview.latestDate).toLocaleDateString() : 'N/A'}
                    </p>
                </div>

                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-gray-400 text-sm">System Status</p>
                            <h3 className="text-xl font-bold text-green-400 mt-1 flex items-center gap-2">
                                <CheckCircle className="w-5 h-5" /> Online
                            </h3>
                        </div>
                        <Server className="text-green-500 w-8 h-8 opacity-80" />
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Sync-First Architecture Active</p>
                    {version && (
                        <div className="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-500 font-mono">
                            <p>Build: {version.hash}</p>
                            <p>{new Date(version.date).toLocaleDateString()}</p>
                        </div>
                    )}
                </div>

                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-gray-400 text-sm">Active Job</p>
                            <h3 className="text-xl font-bold text-white mt-1">
                                {stats.activeJob ? (
                                    <span className="text-yellow-400">{stats.activeJob.job_type === 'page_sync' ? 'Page Sync' : 'Gap Fill'}</span>
                                ) : (
                                    <span className="text-gray-500">Idle</span>
                                )}
                            </h3>
                        </div>
                        <RefreshCw className={`w-8 h-8 opacity-80 ${stats.activeJob ? 'text-yellow-500 animate-spin' : 'text-gray-600'}`} />
                    </div>
                    {stats.activeJob && (
                        <div className="text-xs text-gray-400 mt-2">
                            {stats.activeJob.progress}% Complete • {Math.round(stats.activeJob.gamesPerMinute)} gpm
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Chart Section */}
                <div className="lg:col-span-2 bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <History className="text-blue-400" /> Historical Coverage
                    </h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.history}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="month" stroke="#9CA3AF" />
                                <YAxis stroke="#9CA3AF" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#fff' }}
                                    itemStyle={{ color: '#60A5FA' }}
                                />
                                <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Smart Backfill Controls */}
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Download className="text-green-400" /> Smart Backfill
                    </h3>

                    {stats.activeJob ? (
                        <div className="space-y-6">
                            <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600">
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm text-gray-300">Progress</span>
                                    <span className="text-sm font-bold text-white">{stats.activeJob.progress}%</span>
                                </div>
                                <div className="w-full bg-gray-700 h-3 rounded-full overflow-hidden mb-4">
                                    <div
                                        className="bg-green-500 h-full transition-all duration-500"
                                        style={{ width: `${stats.activeJob.progress}%` }}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-400">ETA</p>
                                        <p className="font-mono text-white">
                                            {stats.activeJob.etaSeconds > 3600
                                                ? `${(stats.activeJob.etaSeconds / 3600).toFixed(1)}h`
                                                : `${Math.ceil(stats.activeJob.etaSeconds / 60)}m`}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400">Speed</p>
                                        <p className="font-mono text-white">{stats.activeJob.gamesPerMinute} / min</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                {stats.activeJob.status === 'paused' ? (
                                    <button
                                        onClick={() => controlJob('resume')}
                                        className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded flex items-center justify-center gap-2"
                                    >
                                        <Play className="w-4 h-4" /> Resume
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => controlJob('pause')}
                                        className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white py-2 rounded flex items-center justify-center gap-2"
                                    >
                                        <Pause className="w-4 h-4" /> Pause
                                    </button>
                                )}
                                <button
                                    onClick={() => controlJob('cancel')}
                                    className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2 rounded flex items-center justify-center gap-2"
                                >
                                    <Square className="w-4 h-4" /> Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">
                                    Target Duration: <span className="text-white font-bold">{targetDuration} Hours</span>
                                </label>
                                <input
                                    type="range"
                                    min="1"
                                    max="48"
                                    value={targetDuration}
                                    onChange={(e) => setTargetDuration(parseInt(e.target.value))}
                                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                    Calculated Speed: <span className="text-blue-400">{(rateLimitCalc / 1000).toFixed(1)}s / request</span>
                                </p>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={() => startBackfill('page_sync')}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg flex items-center justify-center gap-2 transition"
                                >
                                    <Download className="w-5 h-5" /> Start Bulk Sync (Phase 1)
                                </button>
                                <p className="text-xs text-gray-400 text-center">
                                    Recommended for initial load. Fetches by page (Fast).
                                </p>

                                <div className="border-t border-gray-700 my-4"></div>

                                <button
                                    onClick={() => startBackfill('gap_fill')}
                                    className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg flex items-center justify-center gap-2 transition"
                                >
                                    <AlertTriangle className="w-5 h-5 text-yellow-500" /> Start Gap Fill (Phase 2)
                                </button>
                                <p className="text-xs text-gray-400 text-center">
                                    Scans for missing IDs and fills them (Precise).
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                {/* Integrations Section */}
                <div className="lg:col-span-1 bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Server className="text-purple-400" /> Integrations
                    </h3>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm text-gray-400 mb-2 flex items-center gap-2">
                                <Key size={14} /> Gemini API Key
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="password"
                                    value={geminiKey}
                                    onChange={(e) => setGeminiKey(e.target.value)}
                                    placeholder="Enter Gemini API Key"
                                    className="flex-1 bg-gray-700 border border-gray-600 rounded p-2 text-white focus:outline-none focus:border-purple-500"
                                />
                                <button
                                    onClick={() => saveSetting('GEMINI_API_KEY', geminiKey)}
                                    className="bg-purple-600 hover:bg-purple-500 text-white p-2 rounded"
                                >
                                    <Save size={18} />
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                Used for AI-powered analysis and insights.
                            </p>
                        </div>

                        <div className="border-t border-gray-700 pt-4">
                            <label className="block text-sm text-gray-400 mb-2 flex items-center gap-2">
                                <CalendarIcon size={14} /> Google Calendar Embed URL
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={calendarUrl}
                                    onChange={(e) => setCalendarUrl(e.target.value)}
                                    placeholder="https://calendar.google.com/embed..."
                                    className="flex-1 bg-gray-700 border border-gray-600 rounded p-2 text-white focus:outline-none focus:border-purple-500 text-xs font-mono"
                                />
                                <button
                                    onClick={() => saveSetting('CALENDAR_EMBED_URL', calendarUrl)}
                                    className="bg-purple-600 hover:bg-purple-500 text-white p-2 rounded"
                                >
                                    <Save size={18} />
                                </button>
                            </div>
                            <p className="text-xs text-gray-400 mt-2">
                                Must be the 'Embed Code' URL (starts with https://calendar.google.com/calendar/embed?...)
                            </p>
                        </div>
                    </div>
                </div>

                {/* Dashboard Settings */}
                <div className="lg:col-span-1 bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <LayoutDashboard className="text-orange-400" /> Dashboard Config
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between bg-gray-700/50 p-4 rounded-lg border border-gray-600">
                            <div>
                                <p className="font-bold text-white text-sm">Show Cold Storage</p>
                                <p className="text-xs text-gray-400">Enable historical archive view</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={showColdStorage}
                                    onChange={(e) => {
                                        setShowColdStorage(e.target.checked);
                                        saveSetting('show_cold_storage', String(e.target.checked));
                                    }}
                                />
                                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* Historical Tracker Archive Ingestion Section */}
            <div className="mt-8 bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-gray-700 pb-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                                <Archive className="text-cyan-400" /> Historical Tracker Archive Ingest (2019–2022)
                            </h3>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                                archiveStatus?.status === 'running' ? 'bg-cyan-900/60 text-cyan-300 border border-cyan-500 animate-pulse' :
                                archiveStatus?.status === 'completed' ? 'bg-green-900/60 text-green-300 border border-green-500' :
                                archiveStatus?.status === 'error' ? 'bg-red-900/60 text-red-300 border border-red-500' :
                                archiveStatus?.status === 'cancelled' ? 'bg-yellow-900/60 text-yellow-300 border border-yellow-500' :
                                'bg-gray-700 text-gray-400'
                            }`}>
                                {archiveStatus?.status || 'idle'}
                            </span>
                        </div>
                        <p className="text-sm text-gray-400 mt-1">
                            Fast-ingests 34 pre-bundled monthly XML archives directly from GitHub raw storage into <code className="text-cyan-300 bg-gray-900 px-1 py-0.5 rounded text-xs">cold_storage.db</code>.
                            Bypasses live web scraping and populates ~20,000 matches with zero API rate-limiting risk.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {archiveStatus?.isRunning ? (
                            <button
                                onClick={handleCancelArchiveSync}
                                className="px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-sm bg-red-600 hover:bg-red-500 text-white transition shadow"
                            >
                                <Square className="w-4 h-4" /> Cancel Ingest
                            </button>
                        ) : (
                            <button
                                onClick={handleStartArchiveSync}
                                disabled={archiveLoading}
                                className={`px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 text-sm transition shadow ${
                                    archiveLoading ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                                }`}
                            >
                                <Download className="w-4 h-4" />
                                {archiveLoading ? 'Starting...' : 'Start Archive Ingest'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Progress Stats Summary */}
                {(() => {
                    const completedMonthsList: string[] = Array.isArray(archiveStatus?.completedMonths)
                        ? archiveStatus.completedMonths
                        : [];
                    const completedMonthsCount = typeof archiveStatus?.completedMonths === 'number'
                        ? archiveStatus.completedMonths
                        : completedMonthsList.length;
                    const totalMonthsCount = archiveStatus?.totalMonths || 34;
                    const archivePercent = totalMonthsCount > 0
                        ? Math.min(100, Math.round((completedMonthsCount / totalMonthsCount) * 100))
                        : 0;

                    return (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-gray-900/60 p-4 rounded-lg border border-gray-700">
                                    <p className="text-gray-400 text-xs uppercase font-semibold">Months Processed</p>
                                    <p className="text-2xl font-bold text-white mt-1">
                                        {completedMonthsCount} <span className="text-gray-500 text-sm font-normal">/ {totalMonthsCount}</span>
                                    </p>
                                </div>

                                <div className="bg-gray-900/60 p-4 rounded-lg border border-gray-700">
                                    <p className="text-gray-400 text-xs uppercase font-semibold">Games Inserted</p>
                                    <p className="text-2xl font-bold text-cyan-400 mt-1">
                                        {(archiveStatus?.totalGamesInserted ?? 0).toLocaleString()}
                                    </p>
                                </div>

                                <div className="bg-gray-900/60 p-4 rounded-lg border border-gray-700">
                                    <p className="text-gray-400 text-xs uppercase font-semibold">Active Month</p>
                                    <p className="text-lg font-mono font-bold text-yellow-400 mt-1 truncate">
                                        {archiveStatus?.currentMonth || (archiveStatus?.isRunning ? 'Processing...' : 'None')}
                                    </p>
                                </div>

                                <div className="bg-gray-900/60 p-4 rounded-lg border border-gray-700">
                                    <p className="text-gray-400 text-xs uppercase font-semibold">Cold Storage Target</p>
                                    <p className="text-sm font-mono text-gray-300 mt-2">
                                        cold_storage.db
                                    </p>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="mb-6">
                                <div className="flex justify-between text-xs text-gray-400 mb-1 font-medium">
                                    <span>Ingestion Progress</span>
                                    <span>{archivePercent}%</span>
                                </div>
                                <div className="w-full bg-gray-900 rounded-full h-3 overflow-hidden border border-gray-700">
                                    <div
                                        className={`h-full transition-all duration-300 ${
                                            archiveStatus?.status === 'error' ? 'bg-red-500' :
                                            archiveStatus?.status === 'completed' ? 'bg-green-500' :
                                            'bg-cyan-500'
                                        }`}
                                        style={{ width: `${archivePercent}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Monthly Archives Matrix */}
                            <div className="mb-6">
                                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">
                                    Monthly Archive Batches (34 Total)
                                </p>
                                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-9 lg:grid-cols-12 gap-1.5">
                                    {ARCHIVE_MONTHS_LIST.map((m, idx) => {
                                        const isDone = completedMonthsList.includes(m) ||
                                            (archiveStatus?.status === 'completed') ||
                                            (typeof archiveStatus?.completedMonths === 'number' && idx < archiveStatus.completedMonths);
                                        const isCur = archiveStatus?.currentMonth === m;
                                        return (
                                            <div
                                                key={m}
                                                className={`text-center py-1.5 px-1 rounded text-xs font-mono font-medium transition ${
                                                    isDone
                                                        ? 'bg-green-900/60 border border-green-600 text-green-300'
                                                        : isCur
                                                        ? 'bg-cyan-900/80 border border-cyan-400 text-cyan-200 animate-pulse font-bold'
                                                        : 'bg-gray-900/60 border border-gray-700 text-gray-500'
                                                }`}
                                            >
                                                {m.replace('-', '/')}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    );
                })()}

                {/* Realtime Ingestion Logs Console */}
                {archiveStatus?.logs && archiveStatus.logs.length > 0 && (
                    <div className="bg-gray-950 p-3 rounded-lg border border-gray-800 font-mono text-xs text-gray-300 max-h-48 overflow-y-auto space-y-1">
                        <div className="text-gray-500 text-[10px] uppercase tracking-wider mb-1 sticky top-0 bg-gray-950 pb-1 border-b border-gray-800">
                            Live Ingestion Console
                        </div>
                        {archiveStatus.logs.map((log, idx) => (
                            <div key={idx} className="whitespace-pre-wrap leading-relaxed">
                                {log}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Map Database Management Section */}
            <div className="mt-8 bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-gray-700 pb-4">
                    <div>
                        <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                            <MapIcon className="text-[#ff6600]" /> Map Database Management
                        </h3>
                        <p className="text-sm text-gray-400 mt-1">
                            Manage the local catalog, sync upstream from overloadmaps.com, and register custom levels.
                            {totalMapsCount !== null && (
                                <span className="ml-2 px-2 py-0.5 rounded bg-gray-700 text-blue-400 font-mono text-xs">
                                    {totalMapsCount} Maps in DB
                                </span>
                            )}
                        </p>
                    </div>
                    <button
                        onClick={handleSyncMaps}
                        disabled={syncingMaps}
                        className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-sm transition ${
                            syncingMaps ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-[#ff6600] hover:bg-[#ff7722] text-white'
                        }`}
                    >
                        <RefreshCw className={`w-4 h-4 ${syncingMaps ? 'animate-spin' : ''}`} />
                        {syncingMaps ? 'Syncing Catalog...' : 'Sync Catalog from OverloadMaps.com'}
                    </button>
                </div>

                {syncResult && (
                    <div className={`p-3 rounded-lg text-sm mb-6 ${
                        syncResult.includes('failed') ? 'bg-red-900/50 text-red-200 border border-red-700' : 'bg-green-900/50 text-green-200 border border-green-700'
                    }`}>
                        {syncResult}
                    </div>
                )}

                {/* Add Custom Map Form */}
                <div className="bg-gray-900/60 p-6 rounded-lg border border-gray-700">
                    <h4 className="text-md font-bold text-gray-200 mb-4 flex items-center gap-2">
                        <PlusCircle size={18} className="text-green-400" /> Manually Add Custom Map
                    </h4>

                    {mapMessage && (
                        <div className={`p-3 rounded text-sm mb-4 ${
                            mapMessage.type === 'success' ? 'bg-green-900/50 text-green-200 border border-green-700' : 'bg-red-900/50 text-red-200 border border-red-700'
                        }`}>
                            {mapMessage.text}
                        </div>
                    )}

                    <form onSubmit={handleAddMap} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Map Name *</label>
                            <input
                                type="text"
                                required
                                value={newMapName}
                                onChange={(e) => setNewMapName(e.target.value)}
                                placeholder="e.g. Neon Citadel"
                                className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-sm text-white focus:outline-none focus:border-[#ff6600]"
                            />
                        </div>

                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Author</label>
                            <input
                                type="text"
                                value={newMapAuthor}
                                onChange={(e) => setNewMapAuthor(e.target.value)}
                                placeholder="e.g. PilotOne"
                                className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-sm text-white focus:outline-none focus:border-[#ff6600]"
                            />
                        </div>

                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Size</label>
                            <select
                                value={newMapSize}
                                onChange={(e) => setNewMapSize(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-sm text-white focus:outline-none focus:border-[#ff6600]"
                            >
                                <option value="tiny">Tiny (1v1)</option>
                                <option value="small">Small (2-4)</option>
                                <option value="medium">Medium (4-8)</option>
                                <option value="large">Large (8+)</option>
                                <option value="gigantic">Gigantic (10+)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Style</label>
                            <select
                                value={newMapStyle}
                                onChange={(e) => setNewMapStyle(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-sm text-white focus:outline-none focus:border-[#ff6600]"
                            >
                                <option value="mixed">Mixed</option>
                                <option value="tech">Tech</option>
                                <option value="organic">Organic</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Max Players</label>
                            <input
                                type="number"
                                min="2"
                                max="16"
                                value={newMapMaxPlayers}
                                onChange={(e) => setNewMapMaxPlayers(parseInt(e.target.value, 10) || 8)}
                                className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-sm text-white focus:outline-none focus:border-[#ff6600]"
                            />
                        </div>

                        <div className="flex items-center pt-5">
                            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-300">
                                <input
                                    type="checkbox"
                                    checked={newMapSupportsCtf}
                                    onChange={(e) => setNewMapSupportsCtf(e.target.checked)}
                                    className="w-4 h-4 rounded text-blue-600 bg-gray-800 border-gray-600 focus:ring-blue-500"
                                />
                                Supports CTF
                            </label>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-xs text-gray-400 mb-1">Download URL (.zip)</label>
                            <input
                                type="url"
                                value={newMapDownloadUrl}
                                onChange={(e) => setNewMapDownloadUrl(e.target.value)}
                                placeholder="https://.../map.zip"
                                className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-sm text-white focus:outline-none focus:border-[#ff6600]"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-xs text-gray-400 mb-1">Preview Image URL (.jpg / .png)</label>
                            <input
                                type="url"
                                value={newMapImageUrl}
                                onChange={(e) => setNewMapImageUrl(e.target.value)}
                                placeholder="https://.../map.jpg"
                                className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-sm text-white focus:outline-none focus:border-[#ff6600]"
                            />
                        </div>

                        <div className="md:col-span-2 flex items-end">
                            <button
                                type="submit"
                                disabled={addingMap}
                                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 text-sm transition"
                            >
                                <PlusCircle size={16} />
                                {addingMap ? 'Adding...' : 'Save & Register Map'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;
