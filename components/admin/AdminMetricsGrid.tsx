import React from 'react';
import { Database, History, RefreshCw, CheckCircle, Server } from 'lucide-react';
import type { AdminStats, VersionInfo } from '../../hooks/useAdminStats';

interface AdminMetricsGridProps {
    stats: AdminStats;
    version: VersionInfo | null;
}

const AdminMetricsGrid: React.FC<AdminMetricsGridProps> = ({ stats, version }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="text-gray-400 text-sm">Total Matches Tracked</p>
                        <h3 className="text-3xl font-bold text-white mt-1">{stats.overview.totalGames.toLocaleString()}</h3>
                    </div>
                    <Database className="text-blue-500 w-8 h-8 opacity-80" />
                </div>
                <p className="text-xs text-gray-400 mt-2">Combined Hot &amp; Cold Archive</p>
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
                                <span className="text-yellow-400">
                                    {stats.activeJob.job_type === 'page_sync' ? 'Page Sync' : stats.activeJob.job_type === 'hydrate' ? 'Hydrate Kill Logs' : 'Gap Fill'}
                                </span>
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
    );
};

export default AdminMetricsGrid;
