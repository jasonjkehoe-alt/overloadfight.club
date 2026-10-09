import { useState } from 'react';
import { fetchAdminDiscord, saveAdminSetting, sendAdminDiscordTest } from '../services/apiService';

// GET /api/admin/discord (server/services/discordService.js discordStatus).
export interface DiscordPost {
    kind: 'ping' | 'recap';
    key: string;
    status: 'pending' | 'sent' | 'dropped';
    tries: number;
    updated_at: string;
}

export interface DiscordStatus {
    enabled: boolean;
    configured: boolean;
    webhook: string | null;
    siteUrl: string;
    pingPilots: number;
    posts: DiscordPost[];
}

// The admin page's Discord card (S18): the status, the on/off switch (the
// discord_enabled setting) and the test post.
export function useAdminDiscord() {
    const [status, setStatus] = useState<DiscordStatus | null>(null);
    const [failed, setFailed] = useState(false);
    const [saveFailed, setSaveFailed] = useState(false);
    const [testing, setTesting] = useState(false);
    // null before a test post, '' after one that went out, else what went wrong
    const [testError, setTestError] = useState<string | null>(null);

    const fetchDiscord = async () => {
        setFailed(false);
        try {
            setStatus(await fetchAdminDiscord());
        } catch {
            setFailed(true);
        }
    };

    // The switch moves at once and moves back if the save fails.
    const setEnabled = async (enabled: boolean) => {
        setSaveFailed(false);
        setStatus(s => s && { ...s, enabled });
        try {
            await saveAdminSetting('discord_enabled', String(enabled));
        } catch {
            setStatus(s => s && { ...s, enabled: !enabled });
            setSaveFailed(true);
        }
    };

    const sendTest = async () => {
        setTesting(true);
        setTestError(null);
        try {
            await sendAdminDiscordTest();
            setTestError('');
        } catch (e: any) {
            setTestError(e?.response?.data?.error || 'The test post failed.');
        } finally {
            setTesting(false);
        }
    };

    return { status, failed, saveFailed, testing, testError, fetchDiscord, setEnabled, sendTest };
}
