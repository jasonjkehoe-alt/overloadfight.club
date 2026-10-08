
import { BrowserApiResponse, GameData, GameListApiResponse } from '../types';

const API_BASE = '/api'; // Relative path to local server

export const fetchActiveGames = async (): Promise<BrowserApiResponse[] | null> => {
    try {
        const response = await fetch(`${API_BASE}/browser`);
        if (response.ok) {
            return await response.json();
        }
    } catch (e) {
        console.error("Failed to fetch active games", e);
    }
    return null;
};

export const fetchArchivedGames = async (page = 1, search = '', startDate = ''): Promise<GameListApiResponse | null> => {
    try {
        let query = `?page=${page}`;
        if (search) query += `&search=${encodeURIComponent(search)}`;
        if (startDate) query += `&startDate=${encodeURIComponent(startDate)}`;

        const response = await fetch(`${API_BASE}/games${query}`);
        if (response.ok) {
            return await response.json();
        }
    } catch (e) {
        console.error("Failed to fetch archived games", e);
    }
    return null;
};

export const fetchDeepArchivedGames = async (pagesToFetch = 4): Promise<GameListApiResponse | null> => {
    // Restore reliable deep fetching logic
    try {
        let allGames: any[] = [];
        let totalCount = 0;

        for (let i = 1; i <= pagesToFetch; i++) {
            const response = await fetchArchivedGames(i);
            if (response && response.games) {
                allGames = [...allGames, ...response.games];
                totalCount = response.count; // Update count from latest page
            } else {
                break; // Stop if a page fails
            }
        }

        if (allGames.length > 0) {
            return {
                count: totalCount,
                games: allGames
            };
        }
    } catch (e) {
        console.error("Failed to fetch deep archived games", e);
    }
    return null;
};

export const fetchGameDetail = async (id: number | string): Promise<GameData | null> => {
    try {
        const response = await fetch(`${API_BASE}/game/${id}`);
        if (response.ok) {
            return await response.json();
        }
    } catch (e) {
        console.error("Failed to fetch game detail", e);
    }
    return null;
};

export const fetchOldestGame = async (): Promise<GameData | null> => {
    // but for now, we can leave it or implement a backend endpoint for it.
    // Given the current backend implementation, we don't have a direct "oldest" endpoint yet.
    // Let's return null for now or implement it later if critical.
    return null;
};

// Admin API Functions
export const adminLogin = async (password: string): Promise<{ success: boolean; error?: string }> => {
    try {
        const response = await fetch(`${API_BASE}/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password }),
            credentials: 'include'
        });

        if (response.ok) {
            return { success: true };
        } else {
            const error = await response.json();
            return { success: false, error: error.error || 'Login failed' };
        }
    } catch (e) {
        return { success: false, error: 'Network error' };
    }
};

export const adminLogout = async (): Promise<void> => {
    try {
        await fetch(`${API_BASE}/admin/logout`, {
            method: 'POST',
            credentials: 'include'
        });
    } catch (e) {
        console.error('Logout failed', e);
    }
};

export const checkAdminAuth = async (): Promise<boolean> => {
    try {
        const response = await fetch(`${API_BASE}/admin/auth-status`, {
            credentials: 'include'
        });
        if (response.ok) {
            const data = await response.json();
            return data.isAuthenticated || false;
        }
    } catch (e) {
        console.error('Auth check failed', e);
    }
    return false;
};

export const getPublicStats = async (): Promise<any> => {
    try {
        const response = await fetch(`${API_BASE}/stats`);
        if (response.ok) {
            return await response.json();
        }
        return null;
    } catch (error) {
        console.error('Error fetching public stats:', error);
        return null;
    }
};

export const getAdminStats = async (): Promise<any> => {
    try {
        const response = await fetch(`${API_BASE}/admin/stats`, {
            credentials: 'include'
        });
        if (response.ok) {
            return await response.json();
        }
    } catch (e) {
        console.error('Failed to fetch admin stats', e);
    }
    return null;
};

export const startBackfill = async (startGameId: number, endGameId: number, rateLimitMs: number, jobType: 'id_range' | 'page_sync' = 'id_range'): Promise<any> => {
    try {
        const response = await fetch(`${API_BASE}/admin/backfill/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ startGameId, endGameId, rateLimitMs, jobType })
        });
        if (response.ok) {
            return await response.json();
        }
    } catch (e) {
        console.error('Failed to start backfill', e);
    }
    return null;
};

export const getBackfillStatus = async (jobId?: number): Promise<any> => {
    try {
        const url = jobId ? `${API_BASE}/admin/backfill/status/${jobId}` : `${API_BASE}/admin/backfill/status`;
        const response = await fetch(url, {
            credentials: 'include'
        });
        if (response.ok) {
            return await response.json();
        }
    } catch (e) {
        console.error('Failed to get backfill status', e);
    }
    return null;
};

export const pauseBackfill = async (): Promise<any> => {
    try {
        const response = await fetch(`${API_BASE}/admin/backfill/pause`, {
            method: 'POST',
            credentials: 'include'
        });
        if (response.ok) {
            return await response.json();
        }
    } catch (e) {
        console.error('Failed to pause backfill', e);
    }
    return null;
};

export const resumeBackfill = async (jobId: number): Promise<any> => {
    try {
        const response = await fetch(`${API_BASE}/admin/backfill/resume/${jobId}`, {
            method: 'POST',
            credentials: 'include'
        });
        if (response.ok) {
            return await response.json();
        }
    } catch (e) {
        console.error('Failed to resume backfill', e);
    }
    return null;
};

export const cancelBackfillJob = async (jobId: number): Promise<any> => {
    try {
        const response = await fetch(`${API_BASE}/admin/backfill/cancel/${jobId}`, {
            method: 'POST',
            credentials: 'include'
        });
        if (response.ok) {
            return await response.json();
        }
    } catch (e) {
        console.error('Failed to cancel backfill', e);
    }
    return null;
};

export const fetchGameManually = async (gameId: number): Promise<any> => {
    try {
        const response = await fetch(`${API_BASE}/admin/fetch-game/${gameId}`, {
            method: 'POST',
            credentials: 'include'
        });
        if (response.ok) {
            return await response.json();
        }
    } catch (e) {
        console.error('Failed to fetch game manually', e);
    }
    return null;
};

export const scanLocalArchive = async (path?: string): Promise<any> => {
    try {
        const response = await fetch(`${API_BASE}/admin/scan-local`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ path })
        });
        if (response.ok) {
            return await response.json();
        }
    } catch (e) {
        console.error('Failed to scan local archive', e);
    }
    return null;
};

export const getAdminSettings = async (): Promise<any> => {
    try {
        const response = await fetch(`${API_BASE}/admin/settings`, {
            credentials: 'include'
        });
        if (response.ok) {
            return await response.json();
        }
    } catch (e) {
        console.error('Failed to get admin settings', e);
    }
    return null;
};

export const updateAdminSetting = async (key: string, value: string | boolean): Promise<any> => {
    try {
        const response = await fetch(`${API_BASE}/admin/settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ key, value })
        });
        if (response.ok) {
            return await response.json();
        }
    } catch (e) {
        console.error('Failed to update admin setting', e);
    }
    return null;
};
export const downloadBackup = async (): Promise<void> => {
    try {
        const response = await fetch(`${API_BASE}/admin/backup`, {
            credentials: 'include'
        });
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `tracker_backup_${new Date().toISOString().split('T')[0]}.db`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } else {
            console.error('Failed to download backup');
        }
    } catch (e) {
        console.error('Backup download error', e);
    }
};

export const restoreBackup = async (file: File): Promise<{ success: boolean; message?: string; error?: string }> => {
    try {
        const formData = new FormData();
        formData.append('backup', file);

        const response = await fetch(`${API_BASE}/admin/restore`, {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });

        return await response.json();
    } catch (e) {
        console.error('Restore error', e);
        return { success: false, error: 'Network error during restore' };
    }
};

export const detectGaps = async (start: number, end: number, limit: number = 100): Promise<any> => {
    try {
        const response = await fetch(`${API_BASE}/admin/detect-gaps?start=${start}&end=${end}&limit=${limit}`, {
            credentials: 'include'
        });
        if (response.ok) {
            return await response.json();
        }
    } catch (e) {
        console.error('Failed to detect gaps', e);
    }
    return null;
};

export const getGlobalStats = async (startDate?: string, source?: string): Promise<any> => {
    try {
        let url = `${API_BASE}/stats/global`;
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (source) params.append('source', source);

        const queryString = params.toString();
        if (queryString) url += `?${queryString}`;

        const response = await fetch(url);
        if (response.ok) {
            return await response.json();
        }
    } catch (e) {
        console.error('Failed to fetch global stats', e);
    }
    return null;
};

export const fetchColdGames = async (page: number = 1, search: string = ''): Promise<{ games: any[], count: number } | null> => {
    try {
        let url = `${API_BASE}/cold/games?page=${page}`;
        if (search) {
            url += `&search=${encodeURIComponent(search)}`;
        }
        const response = await fetch(url);
        if (response.ok) {
            return await response.json();
        }
    } catch (e) {
        console.error('Failed to fetch cold games', e);
    }
    return null;
};

export const fetchColdStats = async (): Promise<any> => {
    try {
        const response = await fetch(`${API_BASE}/cold/stats`);
        if (response.ok) {
            return await response.json();
        }
    } catch (e) {
        console.error('Failed to fetch cold stats', e);
    }
    return null;
};

export const getCalendarStats = async (): Promise<any> => {
    try {
        const response = await fetch(`${API_BASE}/admin/stats/calendar`, {
            credentials: 'include'
        });
        if (response.ok) {
            return await response.json();
        }
    } catch (e) {
        console.error('Failed to fetch calendar stats', e);
    }
    return null;
};

export const fetchConfig = async (): Promise<any> => {
    try {
        const response = await fetch(`${API_BASE}/config`);
        if (response.ok) {
            return await response.json();
        }
    } catch (e) {
        console.error('Failed to fetch config', e);
    }
    return null;
};

export interface FightNightRecap {
    date: string;
    formattedDate: string;
    totalMatches: number;
    totalPilots: number;
    totalFrags: number;
    topFragger: { name: string; kills: number };
    mostActivePilot: { name: string; matches: number };
    headlineBout: {
        gameId: number;
        map: string;
        matchMode: string;
        pilotCount: number;
        totalFrags: number;
        topPilot: string;
        topKills: number;
        copy: string;
    };
    biggestUpset: {
        gameId: number;
        map: string;
        winner?: string;
        winnerKd?: number;
        defeated?: string;
        defeatedKd?: number;
        winnerKills?: number;
        defeatedKills?: number;
        copy: string;
    };
    biggestBlowout: {
        gameId: number;
        map: string;
        differential: number;
        winner: string;
        runnerUp: string;
        score: string;
        copy: string;
    };
    closestFinish: {
        gameId: number;
        map: string;
        margin: number;
        winner: string;
        runnerUp: string;
        score: string;
        copy: string;
    };
    hottestArena: {
        name: string;
        matches: number;
        frags: number;
        topPilot: string;
        copy: string;
    };
    newBlood: {
        pilots: string[];
        count: number;
        copy: string;
    };
    longestStreak: {
        pilot: string;
        streak: number;
        gameId: number;
        map: string;
        copy: string;
    };
}

export const fetchFightNights = async (limit = 20): Promise<{ count: number; recaps: FightNightRecap[] } | null> => {
    try {
        const response = await fetch(`${API_BASE}/fight-nights?limit=${limit}`);
        if (response.ok) {
            return await response.json();
        }
    } catch (e) {
        console.error('Failed to fetch fight nights', e);
    }
    return null;
};

export const fetchFightNightDetail = async (date: string): Promise<FightNightRecap | null> => {
    try {
        const response = await fetch(`${API_BASE}/fight-nights/${encodeURIComponent(date)}`);
        if (response.ok) {
            return await response.json();
        }
    } catch (e) {
        console.error(`Failed to fetch fight night for ${date}`, e);
    }
    return null;
};

// Admin panel (components/AdminPanel.tsx) requests. These keep the axios semantics the
// panel was written against: a non-2xx status or a network failure rejects; the error's
// `response.data` is the body parsed as JSON, or the raw text when it is not JSON.
export class AdminRequestError extends Error {
    response?: { status: number; data: any };

    constructor(message: string, response?: { status: number; data: any }) {
        super(message);
        this.name = 'AdminRequestError';
        this.response = response;
    }
}

const adminRequest = async (url: string, method: 'GET' | 'POST' = 'GET', body?: unknown): Promise<any> => {
    const headers: Record<string, string> = { Accept: 'application/json, text/plain, */*' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    let response: Response;
    let text: string;
    try {
        response = await fetch(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
        text = await response.text();
    } catch {
        throw new AdminRequestError('Network Error');
    }
    let data: any = text;
    if (text) {
        try {
            data = JSON.parse(text);
        } catch {
            // not JSON: keep the text
        }
    }
    if (!response.ok) {
        throw new AdminRequestError(`Request failed with status code ${response.status}`, { status: response.status, data });
    }
    return data;
};

// The timestamp keeps the browser from serving a cached auth status
export const fetchAdminAuthStatus = (): Promise<any> =>
    adminRequest(`${API_BASE}/admin/auth-status?t=${Date.now()}`);

export const submitAdminLogin = (password: string): Promise<any> =>
    adminRequest(`${API_BASE}/admin/login`, 'POST', { password });

export const fetchVersionInfo = (): Promise<any> =>
    adminRequest('/version.json');

export const fetchAdminExtendedStats = (): Promise<any> =>
    adminRequest(`${API_BASE}/admin/stats/extended`);

export const fetchAdminSetting = (key: string): Promise<any> =>
    adminRequest(`${API_BASE}/admin/settings/${key}`);

export const saveAdminSetting = (key: string, value: string): Promise<any> =>
    adminRequest(`${API_BASE}/admin/settings`, 'POST', { key, value });

export const fetchAdminMapCount = (): Promise<any> =>
    adminRequest(`${API_BASE}/maps?limit=1`);

export const syncAdminMaps = (): Promise<any> =>
    adminRequest(`${API_BASE}/admin/maps/sync`, 'POST');

export const addAdminMap = (map: Record<string, unknown>): Promise<any> =>
    adminRequest(`${API_BASE}/admin/maps`, 'POST', map);

export const startAdminBackfill = (job: { startGameId: number; endGameId: number; rateLimitMs: number; jobType: 'page_sync' | 'hydrate' }): Promise<any> =>
    adminRequest(`${API_BASE}/admin/backfill/start`, 'POST', job);

export const resumeAdminBackfillJob = (jobId: number | string): Promise<any> =>
    adminRequest(`${API_BASE}/admin/backfill/resume/${jobId}`, 'POST');

export const postAdminBackfillJobAction = (action: 'pause' | 'cancel', jobId: number | string): Promise<any> =>
    adminRequest(`${API_BASE}/admin/backfill/${action}/${jobId}`, 'POST');

export const fetchAdminArchiveSyncStatus = (): Promise<any> =>
    adminRequest(`${API_BASE}/admin/archive-sync/status`);

export const cancelAdminArchiveSync = (): Promise<any> =>
    adminRequest(`${API_BASE}/admin/archive-sync/cancel`, 'POST');

export const triggerAdminStatsRefresh = (): Promise<any> =>
    adminRequest(`${API_BASE}/admin/maintenance/refresh-stats`, 'POST');

export const apiService = {
    getGame: fetchGameDetail,
    fetchActiveGames,
    fetchArchivedGames,
    downloadBackup,
    restoreBackup,
    detectGaps,
    startBackfill,
    getBackfillStatus,
    pauseBackfill,
    resumeBackfill,
    cancelBackfillJob,
    fetchGameManually,
    scanLocalArchive,
    getAdminSettings,
    updateAdminSetting,
    getAdminStats,
    getPublicStats,
    getGlobalStats,
    getCalendarStats,
    adminLogin,
    adminLogout,
    checkAdminAuth
};

export default apiService;
