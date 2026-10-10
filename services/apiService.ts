
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

// /api/fight-nights/schedule (S22): the coming scheduled nights, one under
// way included (server/lib/fightNightSchedule.js occurrences).
export interface FightNightOccurrence {
    id: number;
    kind: 'weekly' | 'once';
    title: string;
    notes: string;
    date: string;
    time: string;
    minutes: number;
    start: string;
    end: string;
    day: string;
}
export interface FightNightSchedule {
    feed: string;
    events: FightNightOccurrence[];
}
export const fetchFightNightSchedule = () => getJson<FightNightSchedule>(`${API_BASE}/fight-nights/schedule`);

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
    // 1 when the tracker listed it online, 0 for an offline tick (listed offline, or left off the list)
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
    // when the answer was made (ms); lastDay is the 24 hours of ticks up to
    // it, lastDayHours the same hours from server_hours (UTC hour numbers)
    asOf: number;
    lastDay: ServerTick[];
    lastDayHours: { hour: number; samples: number; online: number; match: number; peak: number }[];
}

export const fetchServerHistory = (ip: string, days: number) =>
    getJson<ServerHistory>(`${API_BASE}/server/${encodeURIComponent(ip)}/history?days=${days}`);

// /api/stats/regions (S15): stored matches per region (serverRegions.js ids)
// per month, from the first stored match to this month.
export interface RegionShare {
    months: { month: string; total: number; counts: Record<string, number> }[];
}

export const fetchRegionShare = () => getJson<RegionShare>(`${API_BASE}/stats/regions`);

// Weapon meta and ladders (S16). Kills per weapon family are keyed by
// gameParse.js WEAPON_FAMILIES ids, every family present.
export interface WeaponMeta {
    community: Record<string, number>;
    kills: number;
    // the maps with the most logged kills, most first
    maps: { map: string; kills: number; families: Record<string, number> }[];
}
export const fetchWeaponMeta = () => getJson<WeaponMeta>(`${API_BASE}/stats/weapons`);

export interface PilotWeaponMix {
    pilot: Record<string, number>;
    kills: number;
    community: Record<string, number>;
    communityKills: number;
}
export const fetchPilotWeaponMix = (name: string) => getJson<PilotWeaponMix>(`${API_BASE}/pilot/${encodeURIComponent(name)}/weapon-mix`);

export interface SpecialistCell {
    matches: number;
    wins: number;
    losses: number;
    ties: number;
}
export interface Specialists {
    pilots: { pilot: string; name: string; matches: number }[];
    maps: { map: string; matches: number }[];
    // cells[i][j]: pilots[i]'s record on maps[j], or null
    cells: (SpecialistCell | null)[][];
}
export const fetchSpecialists = () => getJson<Specialists>(`${API_BASE}/stats/specialists`);

export interface DuelPilot {
    pilot: string;
    name: string;
    // the day of the latest duel snapshot
    day: string;
    rating: number;
    rd: number;
    matches: number;
    rank: number;
    status: 'listed' | 'provisional';
    wins: number;
    losses: number;
    ties: number;
    // the fight-night day of the last duel
    last: string;
}
export interface DuelLadder {
    day: string;
    // how many pilots are past the listing bar
    listed: number;
    pilots: DuelPilot[];
}
export const fetchDuelLadder = () => getJson<DuelLadder>(`${API_BASE}/stats/duels`);

export interface ObjectivePilot {
    pilot: string;
    mode: string;
    name: string;
    matches: number;
    wins: number;
    losses: number;
    ties: number;
    kills: number;
    deaths: number;
    assists: number;
    rank: number;
    // the gameParse.js OBJECTIVE_FIELDS columns
    [field: string]: number | string;
}
export type ObjectiveBoards = Record<string, ObjectivePilot[]>;
export const fetchObjectiveBoards = () => getJson<ObjectiveBoards>(`${API_BASE}/stats/objectives`);

// S17: rivalries and clutch, from ranked matches with a kill or damage log.
// A pair of opponents from `pilot`'s side: kills are pilot on opponent,
// deaths opponent on pilot.
export interface RivalPair {
    pilot: string;
    opponent: string;
    name: string;
    opponent_name: string;
    matches: number;
    kills: number;
    deaths: number;
    damage_dealt: number;
    damage_taken: number;
}
export interface RivalNetwork {
    // the pilots with the most logged kills on opponents, totals over every opponent
    pilots: { pilot: string; name: string; kills: number; damage: number }[];
    // [i][j]: what pilot i did to pilot j, null on the diagonal
    kills: (number | null)[][];
    damage: (number | null)[][];
    // most kills exchanged first, each pair once
    pairs: RivalPair[];
    totals: { kills: number; damage: number };
}
export const fetchRivalNetwork = () => getJson<RivalNetwork>(`${API_BASE}/stats/rivalries`);

export interface ClutchCounts {
    kind: 'ffa' | 'team';
    matches: number;
    first_bloods: number;
    kills: number;
    late_kills: number;
    trailing_kills: number;
}
export interface PilotRivalry {
    opponents: RivalPair[];
    totals: { opponents: number; kills: number; deaths: number; damage_dealt: number; damage_taken: number };
    clutch: ClutchCounts[];
    community: ClutchCounts[];
}
export const fetchPilotRivalry = (name: string) => getJson<PilotRivalry>(`${API_BASE}/pilot/${encodeURIComponent(name)}/rivalry`);

// S20: the Tale of the Tape, read from the first pilot's side. A record of
// rated matches as opponents; `logged` counts only those with a log.
export interface BoutRecord {
    matches: number;
    wins: number;
    losses: number;
    ties: number;
}
export interface TapeCorner {
    key: string;
    name: string;
    // pilot_stats_cache's career numbers, null before a ranked match
    career: { matches: number; wins: number; losses: number; ties: number; win_rate: number; combat_ratio: number; lethality: number } | null;
    rating: Pick<PilotRating, 'rating' | 'rd' | 'matches' | 'status' | 'rank'>;
}
export interface Tape {
    pilots: [TapeCorner, TapeCorner];
    // a gameParse.js MATCH_MODES id, null for every mode
    mode: string | null;
    // the matches in each mode they met in, whatever `mode` is
    modes: { mode: string; matches: number }[];
    record: BoutRecord;
    logged: { matches: number; kills: number; deaths: number; damage_dealt: number; damage_taken: number };
    maps: (BoutRecord & { map: string })[];
    duels: { wins: number; losses: number; ties: number; last: string } | null;
}
// The answer for an unknown pilot or one pilot twice.
export type TapeMissing = { missing: string[] } | { same: string };
export const fetchTape = (a: string, b: string, mode: string | null) =>
    getJson<Tape | TapeMissing>(`${API_BASE}/pilot/${encodeURIComponent(a)}/tape/${encodeURIComponent(b)}${mode ? `?mode=${encodeURIComponent(mode)}` : ''}`);

export interface PilotOpponent extends BoutRecord {
    opponent: string;
    name: string;
    logged: number;
    kills: number;
    deaths: number;
}
export const fetchPilotOpponents = (name: string) => getJson<PilotOpponent[]>(`${API_BASE}/pilot/${encodeURIComponent(name)}/opponents`);

// /api/stats/belts and /api/pilot/:name/achievements (S21). Days are
// fight-night days; `until` is null while a reign lasts.
export interface BeltReign {
    mode: string;
    label: string;
    reign: number;
    pilot: string;
    name: string;
    since: string;
    game: number;
    defenses: number;
    until: string | null;
    lost_game: number | null;
    days: number;
    // the champion it was taken from, null for a mode's first
    from: { pilot: string; name: string } | null;
}
export interface Belts {
    day: string;
    // `holder` is the newest reign, null before the mode's first; its `reign` counts the mode's reigns
    modes: { mode: string; label: string; holder: BeltReign | null; lineage: BeltReign[] }[];
    // per achievement id, the pilots who reached each tier (or a higher one)
    achievements: Record<string, number[]>;
}
export const fetchBelts = () => getJson<Belts>(`${API_BASE}/stats/belts`);

export interface PilotAchievement {
    id: string;
    value: number;
    tier: number;
    earned: string | null;
    game: number | null;
    // the next tier's threshold, null at the top
    next: number | null;
}
export interface PilotAchievements {
    belts: BeltReign[];
    achievements: PilotAchievement[];
}
export const fetchPilotAchievements = (name: string) => getJson<PilotAchievements>(`${API_BASE}/pilot/${encodeURIComponent(name)}/achievements`);

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

const adminRequest = async (url: string, method: 'GET' | 'POST' | 'DELETE' = 'GET', body?: unknown): Promise<any> => {
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

// The Discord webhook (S18): the status with the URL masked, and a test post.
export const fetchAdminDiscord = (): Promise<any> =>
    adminRequest(`${API_BASE}/admin/discord`);

export const sendAdminDiscordTest = (): Promise<any> =>
    adminRequest(`${API_BASE}/admin/discord/test`, 'POST');

// The scheduled fight nights (S22): the rows, a new or changed one, a deletion.
export interface FightNightEvent {
    id: number;
    kind: 'weekly' | 'once';
    weekday: number | null;
    date: string | null;
    time: string;
    minutes: number;
    title: string;
    notes: string;
    updated_at: string;
}
export const fetchAdminEvents = (): Promise<FightNightEvent[]> =>
    adminRequest(`${API_BASE}/admin/events`);

export const saveAdminEvent = (event: Partial<FightNightEvent>): Promise<FightNightEvent> =>
    adminRequest(`${API_BASE}/admin/events`, 'POST', event);

export const deleteAdminEvent = (id: number): Promise<any> =>
    adminRequest(`${API_BASE}/admin/events/${id}`, 'DELETE');

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
