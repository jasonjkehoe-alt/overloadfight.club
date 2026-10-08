
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

// Ratings (S13): the shapes server/db/analytics/ratings.js answers with.
export interface RatingPoint {
    day: string;
    rating: number;
    rd: number;
    matches: number;
}

export interface PilotRating {
    name: string | null;
    rating: number | null;
    rd: number | null;
    matches: number;
    // 'ranked', 'provisional' (too few rated matches) or 'inactive' (none lately); null with no rating
    status: 'ranked' | 'provisional' | 'inactive' | null;
    rank: number | null;
    history: RatingPoint[];
}

export interface RankedPilot {
    pilot: string;
    name: string;
    day: string;
    rating: number;
    rd: number;
    matches: number;
    rank: number;
    // places gained since `since`, null when not ranked then (NEW)
    change: number | null;
}

export interface PowerRankings {
    day: string;
    since: string;
    total: number;
    pilots: RankedPilot[];
}

// null when the request fails; a pilot with no rated match has an empty history
const getJson = async <T,>(url: string): Promise<T | null> => {
    try {
        const response = await fetch(url);
        if (response.ok) return await response.json();
    } catch (e) {
        console.error(`Failed to fetch ${url}`, e);
    }
    return null;
};

export const fetchPilotRating = (name: string) => getJson<PilotRating>(`${API_BASE}/pilot/${encodeURIComponent(name)}/rating`);

export const fetchPowerRankings = () => getJson<PowerRankings>(`${API_BASE}/stats/rankings`);

// /api/stats/heatmap (S14): matches per weekday and clock hour, `cells[0]`
// Monday by fight-night day, each row 24 counts by hour, over [since, until).
export interface ActivityHeatmap {
    since: string;
    until: string;
    total: number;
    cells: number[][];
}

export const fetchActivityHeatmap = () => getJson<ActivityHeatmap>(`${API_BASE}/stats/heatmap`);

// /api/pilot/:name/career (S14), built by gameParse.js careerSeries,
// calendarDays and lastOuting.
export interface CareerMonth {
    month: string;
    matches: number;
    wins: number;
    losses: number;
    ties: number;
    kills: number;
    deaths: number;
    assists: number;
    seconds: number;
    // null for a month with no ranked match
    winRate: number | null;
    combatRatio: number | null;
    lethality: number | null;
}

export interface OutingMatch {
    id: number;
    date: string;
    map: string | null;
    mode: string | null;
    outcome: 'win' | 'loss' | 'tie' | null;
    kills: number;
    deaths: number;
    assists: number;
}

export interface LastOut {
    day: string;
    matches: OutingMatch[];
    wins: number;
    losses: number;
    ties: number;
    kills: number;
    deaths: number;
    assists: number;
    combatRatio: number;
    // null when the night had no rated match
    ratingChange: number | null;
    recap: boolean;
}

export interface PilotCareer {
    months: CareerMonth[];
    // `until` is today's fight-night day
    calendar: { since: string; until: string; days: { day: string; matches: number }[] };
    lastOut: LastOut | null;
}

export const fetchPilotCareer = (name: string) => getJson<PilotCareer>(`${API_BASE}/pilot/${encodeURIComponent(name)}/career`);

// /api/server/:ip/history (S15): the server's listing and gameParse.js
// serverSummary() over `days` whole fight-night days before `until`, and its
// raw ticks of the last 24 hours. `firstSeen` is null for a server never stored.
export interface ServerTick {
    at: number;
    online: number;
    players: number;
    // gameParse.js SERVER_STATE: 0 idle, 1 lobby, 2 match
    state: number;
}

export interface ServerHistory {
    ip: string;
    name: string | null;
    notes: string | null;
    version: string | null;
    region: string;
    firstSeen: string | null;
    lastSeen: string | null;
    lastOnline: string | null;
    days: number;
    since: string;
    until: string;
    samples: number;
    uptime: number | null;
    inUse: number | null;
    avgPilots: number | null;
    peak: { pilots: number; at: string } | null;
    // 7 rows (Monday first) of 24 average pilots by clock hour, null without a tick
    cells: (number | null)[][];
    busiest: { weekday: number; hour: number; pilots: number } | null;
    lastDay: ServerTick[];
}

export const fetchServerHistory = (ip: string, days: number) =>
    getJson<ServerHistory>(`${API_BASE}/server/${encodeURIComponent(ip)}/history?days=${days}`);

// /api/stats/regions (S15): stored matches per region (serverRegions.js ids,
// in stacking order) per month, from the first stored match to this month.
export interface RegionShare {
    regions: string[];
    months: { month: string; total: number; counts: Record<string, number> }[];
}

export const fetchRegionShare = () => getJson<RegionShare>(`${API_BASE}/stats/regions`);

// Admin panel (hooks/useAdmin*.ts) requests. These keep the axios semantics the
// panel was written against: a non-2xx status or a network failure rejects; the error's
// `response.data` is the body parsed as JSON, or the raw text when it is not JSON.
class AdminRequestError extends Error {
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

export const postAdminBackfillJobAction = (action: 'pause' | 'resume' | 'cancel', jobId: number | string): Promise<any> =>
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
    getBackfillStatus,
    pauseBackfill,
    fetchGameManually,
    scanLocalArchive,
    getAdminSettings,
    getAdminStats,
    getPublicStats,
    getGlobalStats,
    getCalendarStats,
    adminLogout
};

export default apiService;
