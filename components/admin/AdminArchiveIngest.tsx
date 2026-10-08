import React from 'react';
import { Square, CheckCircle, Archive } from 'lucide-react';
import type { ArchiveStatus } from '../../hooks/useAdminArchiveSync';

const ARCHIVE_MONTHS_LIST = [
    '2019-07', '2019-08', '2019-09', '2019-10', '2019-11', '2019-12',
    '2020-01', '2020-02', '2020-03', '2020-04', '2020-05', '2020-06',
    '2020-07', '2020-08', '2020-09', '2020-10', '2020-11', '2020-12',
    '2021-01', '2021-02', '2021-03', '2021-04', '2021-05', '2021-06',
    '2021-07', '2021-08', '2021-09', '2021-10', '2021-11', '2021-12',
    '2022-01', '2022-02', '2022-03', '2022-04'
];

interface AdminArchiveIngestProps {
    archiveStatus: ArchiveStatus | null;
    handleCancelArchiveSync: () => void;
}

const AdminArchiveIngest: React.FC<AdminArchiveIngestProps> = ({ archiveStatus, handleCancelArchiveSync }) => {
    return (
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
                        <div className="px-4 py-2 rounded-lg font-semibold flex items-center gap-2 text-sm bg-green-900/40 text-green-300 border border-green-700/60 shadow">
                            <CheckCircle className="w-4 h-4 text-green-400" /> Ingest Completed
                        </div>
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
                                <p className="text-gray-400 text-xs uppercase font-semibold">Matches Inserted</p>
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
                                <p className="text-gray-400 text-xs uppercase font-semibold">Archive Target</p>
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
    );
};

export default AdminArchiveIngest;
