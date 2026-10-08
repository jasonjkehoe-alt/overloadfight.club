import React from 'react';
import { Play, Pause, Square, RefreshCw, Download, Zap } from 'lucide-react';
import type { AdminStats } from '../../hooks/useAdminStats';

interface AdminBackfillPanelProps {
    stats: AdminStats;
    targetDuration: number;
    setTargetDuration: (hours: number) => void;
    rateLimitCalc: number;
    startBackfill: (type: 'page_sync' | 'hydrate') => void;
    controlJob: (action: 'pause' | 'resume' | 'cancel') => void;
    refreshingStats: boolean;
    refreshStatsMessage: string | null;
    handleRefreshStats: () => void;
}

const formatLastRefreshed = (val?: string | null) => {
    if (!val) return 'Never / Not yet run';
    try {
        const d = new Date(val);
        if (isNaN(d.getTime())) return val;
        return d.toLocaleString();
    } catch {
        return val;
    }
};

const AdminBackfillPanel: React.FC<AdminBackfillPanelProps> = ({
    stats,
    targetDuration,
    setTargetDuration,
    rateLimitCalc,
    startBackfill,
    controlJob,
    refreshingStats,
    refreshStatsMessage,
    handleRefreshStats
}) => {
    return (
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
                            onClick={() => startBackfill('hydrate')}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-lg flex items-center justify-center gap-2 transition"
                        >
                            <Zap className="w-5 h-5 text-yellow-400" /> Hydrate Kill Logs
                        </button>
                        <p className="text-xs text-gray-400 text-center">
                            Walks matches and fetches full kill logs for matches over 1 minute.
                        </p>
                    </div>
                </div>
            )}

            <div className="border-t border-gray-700 my-6"></div>

            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2">
                            <RefreshCw className={`w-4 h-4 text-emerald-400 ${refreshingStats ? 'animate-spin' : ''}`} />
                            <span className="font-semibold text-white text-sm">Stats Cache Freshness</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                            Last refreshed:{' '}
                            <span className="text-emerald-300 font-mono font-medium">
                                {formatLastRefreshed(stats?.overview?.lastStatsRefresh || stats?.lastRefreshed)}
                            </span>
                        </p>
                    </div>
                    <button
                        onClick={handleRefreshStats}
                        disabled={refreshingStats}
                        className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition whitespace-nowrap"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshingStats ? 'animate-spin' : ''}`} />
                        {refreshingStats ? 'Refreshing...' : 'Refresh stats now'}
                    </button>
                </div>
                {refreshStatsMessage && (
                    <p className="text-xs text-emerald-400 font-medium">{refreshStatsMessage}</p>
                )}
                <p className="text-xs text-gray-400">
                    Rebuilds pilot, archive, and map telemetry caches from current match &amp; kill data.
                </p>
            </div>
        </div>
    );
};

export default AdminBackfillPanel;
