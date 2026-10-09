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
    const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

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
        setTestResult(null);
        try {
            const result = await sendAdminDiscordTest();
            setTestResult({ ok: true, message: result.message });
        } catch (e: any) {
            setTestResult({ ok: false, message: e?.response?.data?.error || 'The test post failed.' });
        } finally {
            setTesting(false);
        }
    };

    return { status, failed, saveFailed, testing, testResult, fetchDiscord, setEnabled, sendTest };
}
