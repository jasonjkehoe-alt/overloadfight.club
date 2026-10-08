
import React from 'react';
import { Loading, ErrorState, secondaryButtonClass } from './States';
import { LayoutDashboard } from 'lucide-react';
import { useAdminPanel } from '../hooks/useAdminPanel';
import AdminLoginForm from './admin/AdminLoginForm';
import AdminMetricsGrid from './admin/AdminMetricsGrid';
import AdminCoverageChart from './admin/AdminCoverageChart';
import AdminBackfillPanel from './admin/AdminBackfillPanel';
import AdminDashboardConfig from './admin/AdminDashboardConfig';
import AdminArchiveIngest from './admin/AdminArchiveIngest';
import AdminMapManagement from './admin/AdminMapManagement';

const AdminPanel: React.FC = () => {
    const { auth, overview, settings, maps, archive } = useAdminPanel();
    const { isAuthenticated, setIsAuthenticated, password, setPassword, error, handleLogin } = auth;
    const { stats, loading, setLoading, version, fetchStats } = overview;
    const { showColdStorage, setShowColdStorage, saveSetting } = settings;
    const { archiveStatus, handleCancelArchiveSync } = archive;

    if (!isAuthenticated) {
        return (
            <AdminLoginForm
                error={error}
                password={password}
                setPassword={setPassword}
                handleLogin={handleLogin}
            />
        );
    }

    if (loading) return <Loading label="Loading stats..." />;

    if (!stats) {
        return (
            <ErrorState
                title="Error loading stats"
                message={error || "Unknown error occurred"}
                onRetry={() => { setLoading(true); fetchStats(); }}
                action={
                    <button onClick={() => setIsAuthenticated(false)} className={secondaryButtonClass}>
                        Logout
                    </button>
                }
            />
        );
    }

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
            <AdminMetricsGrid stats={stats} version={version} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Chart Section */}
                <AdminCoverageChart stats={stats} />

                {/* Smart Backfill Controls */}
                <AdminBackfillPanel stats={stats} overview={overview} />
            </div>

            <AdminDashboardConfig
                showColdStorage={showColdStorage}
                setShowColdStorage={setShowColdStorage}
                saveSetting={saveSetting}
            />

            {/* Historical Tracker Archive Ingestion Section */}
            <AdminArchiveIngest archiveStatus={archiveStatus} handleCancelArchiveSync={handleCancelArchiveSync} />

            {/* Map Database Management Section */}
            <AdminMapManagement maps={maps} />
        </div>
    );
};

export default AdminPanel;
