import { useState } from 'react';
import {
    fetchAdminExtendedStats,
    fetchVersionInfo,
    postAdminBackfillJobAction,
    startAdminBackfill,
    triggerAdminStatsRefresh
} from '../services/apiService';

export interface AdminStats {
    overview: {
        totalGames: number;
        maxId: number;
        minId: number;
        earliestDate: string;
        latestDate: string;
        coveragePercent?: number;
        lastStatsRefresh?: string | null;
    };
    history: { month: string; count: number }[];
    activeJob: any;
    lastRefreshed?: string | null;
}

export interface VersionInfo {
    hash: string;
    date: string;
    buildTime: string;
}

interface AdminStatsDeps {
    setError: (error: string) => void;
    setIsAuthenticated: (isAuthenticated: boolean) => void;
}

// Admin overview: extended stats and build version, the backfill job controls
// that read them, and the stats cache refresh. A stats load failing with 401,
// or with an error containing "Unauthorized", logs the panel out through
// setIsAuthenticated; other failures go to setError.
export function useAdminStats({ setError, setIsAuthenticated }: AdminStatsDeps) {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [targetDuration, setTargetDuration] = useState(5); // Hours
    const [estimatedPages, setEstimatedPages] = useState(3000); // Default approx
    const [version, setVersion] = useState<VersionInfo | null>(null);

    // Stats Cache Refresh state
    const [refreshingStats, setRefreshingStats] = useState(false);
    const [refreshStatsMessage, setRefreshStatsMessage] = useState<string | null>(null);

    const fetchVersion = async () => {
        try {
            const data = await fetchVersionInfo();
            setVersion(data);
        } catch (e) {
            console.error("Failed to fetch version info");
        }
    };

    const fetchStats = async () => {
        try {
            const data = await fetchAdminExtendedStats();
            setStats(data);
            setError('');

            // Update estimated pages based on max ID if available
            if (data.overview.maxId) {
                setEstimatedPages(Math.ceil(data.overview.maxId / 25));
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

    const startBackfill = async (type: 'page_sync' | 'hydrate') => {
        if (!stats) return;

        let start = 1;
        let end = stats.overview.maxId || 75000;
        let rateLimit = 500;

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
            // Hydrate kill logs
            rateLimit = 500;
        }

        try {
            await startAdminBackfill({
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
            await postAdminBackfillJobAction(action, stats.activeJob.id);
            fetchStats();
        } catch (e) {
            console.error(e);
        }
    };

    const handleRefreshStats = async () => {
        try {
            setRefreshingStats(true);
            setRefreshStatsMessage(null);
            await triggerAdminStatsRefresh();
            setRefreshStatsMessage('Refresh started in background.');
            setTimeout(() => {
                fetchStats();
                setRefreshingStats(false);
            }, 1200);
        } catch (e: any) {
            console.error("Failed to trigger stats refresh", e);
            setRefreshStatsMessage(e.response?.data?.error || 'Failed to trigger refresh');
            setRefreshingStats(false);
        }
    };

    return {
        stats,
        loading,
        setLoading,
        targetDuration,
        setTargetDuration,
        estimatedPages,
        version,
        refreshingStats,
        refreshStatsMessage,
        fetchVersion,
        fetchStats,
        startBackfill,
        controlJob,
        handleRefreshStats
    };
}
