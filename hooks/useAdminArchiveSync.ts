import { useState } from 'react';
import { cancelAdminArchiveSync, fetchAdminArchiveSyncStatus } from '../services/apiService';

export interface ArchiveStatus {
    isRunning: boolean;
    status: 'idle' | 'running' | 'completed' | 'error' | 'cancelled';
    currentMonth: string | null;
    completedMonths: string[];
    totalMonths: number;
    totalGamesInserted: number;
    error: string | null;
    logs: string[];
}

// Historical tracker archive ingest: its polled status and the cancel action.
export function useAdminArchiveSync() {
    const [archiveStatus, setArchiveStatus] = useState<ArchiveStatus | null>(null);

    const fetchArchiveStatus = async () => {
        try {
            const data = await fetchAdminArchiveSyncStatus();
            setArchiveStatus(data);
        } catch (e) {
            console.error("Failed to fetch archive status", e);
        }
    };

    const handleCancelArchiveSync = async () => {
        try {
            await cancelAdminArchiveSync();
            fetchArchiveStatus();
        } catch (e: any) {
            alert(e.response?.data?.error || 'Failed to cancel archive sync');
        }
    };

    return { archiveStatus, fetchArchiveStatus, handleCancelArchiveSync };
}
