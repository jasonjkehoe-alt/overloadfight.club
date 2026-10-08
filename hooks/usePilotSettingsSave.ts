import { useState } from 'react';
import {
    updateXPrefsValue,
    updateKeyBinding,
    checkOverloadRunningClient,
    savePilotXPrefsClient,
    savePilotXConfigClient,
    backupAllPilotsZipClient,
    setPilotXPClient,
    savePilotAutoselectClient
} from '../utils/pilotSettingsBridge';
import type { usePilotSettings } from './usePilotSettings';

// PilotSettingsPanel's writes: Set XP, Save Settings and Backup All Pilots.
export function usePilotSettingsSave(
    settings: ReturnType<typeof usePilotSettings>,
    {
        dirHandle,
        isServerNative,
        pilots
    }: {
        dirHandle: FileSystemDirectoryHandle | null;
        isServerNative: boolean;
        pilots: string[];
    }
) {
    const {
        selectedPilot,
        setLoading,
        setStatusMessage,
        setGameRunning,
        xprefs,
        xprefsmod,
        xconfig,
        autoselectConfig,
        setInitialAutoselectConfig,
        pendingPrefs,
        setPendingPrefs,
        pendingMod,
        setPendingMod,
        pendingBindings,
        setPendingBindings,
        xpInput,
        loadPilotFiles,
        isAutoselectDirty
    } = settings;

    const [xpSaving, setXpSaving] = useState<boolean>(false);

    // Backup state
    const [backingUp, setBackingUp] = useState(false);

    // Save XP specifically
    const handleSaveXP = async () => {
        if (!dirHandle && !isServerNative) return;
        const xpNum = parseInt(xpInput, 10);
        if (isNaN(xpNum) || xpNum < 0 || xpNum > 9999999) {
            setStatusMessage({ type: 'error', text: 'XP must be a number between 0 and 9,999,999.' });
            return;
        }

        setXpSaving(true);
        setStatusMessage(null);

        try {
            if (dirHandle) {
                const res = await setPilotXPClient(dirHandle, selectedPilot, xpNum);
                if (res.success) {
                    setStatusMessage({
                        type: 'success',
                        text: `Updated XP for ${selectedPilot} to ${xpNum.toLocaleString()}! (Backup created: ${res.backupFileName})`
                    });
                    // Reload
                    loadPilotFiles(selectedPilot);
                } else {
                    setStatusMessage({ type: 'error', text: res.error || 'Failed to update pilot XP.' });
                }
            } else if (isServerNative) {
                const res = await fetch(`/api/overload/pilot/${encodeURIComponent(selectedPilot)}/xp`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ xp: xpNum })
                });
                const data = await res.json();
                if (res.ok) {
                    setStatusMessage({
                        type: 'success',
                        text: `Updated XP for ${selectedPilot} to ${xpNum.toLocaleString()}! (Backup created: ${data.backupFileName})`
                    });
                    loadPilotFiles(selectedPilot);
                } else {
                    setStatusMessage({ type: 'error', text: data.error || 'Failed to update XP' });
                }
            }
        } catch (err: any) {
            setStatusMessage({ type: 'error', text: err.message || 'Failed to set XP.' });
        } finally {
            setXpSaving(false);
        }
    };

    // Save all pending settings (P0 Write-Back with Guard & Mandatory Backup)
    const handleSaveAll = async () => {
        if (!dirHandle && !isServerNative) return;

        // Guard check
        const guard = await checkOverloadRunningClient(dirHandle);
        if (guard.isRunning) {
            setStatusMessage({
                type: 'error',
                text: 'Close Overload to change settings. Changes cannot be applied while the game is running.'
            });
            setGameRunning(true);
            return;
        }

        setLoading(true);
        setStatusMessage(null);
        const backupsCreated: string[] = [];

        try {
            if (dirHandle) {
                // 1. Save .xprefs if modified
                if (xprefs && Object.keys(pendingPrefs).length > 0) {
                    let updated = xprefs;
                    for (const [k, v] of Object.entries(pendingPrefs)) {
                        updated = updateXPrefsValue(updated, k, v as string);
                    }
                    const res = await savePilotXPrefsClient(dirHandle, selectedPilot, updated, false);
                    if (!res.success) throw new Error(res.error || 'Failed to save .xprefs');
                    if (res.backupFileName) backupsCreated.push(res.backupFileName);
                }

                // 2. Save .xprefsmod if modified
                if (xprefsmod && Object.keys(pendingMod).length > 0) {
                    let updated = xprefsmod;
                    for (const [k, v] of Object.entries(pendingMod)) {
                        updated = updateXPrefsValue(updated, k, v as string);
                    }
                    const res = await savePilotXPrefsClient(dirHandle, selectedPilot, updated, true);
                    if (!res.success) throw new Error(res.error || 'Failed to save .xprefsmod');
                    if (res.backupFileName) backupsCreated.push(res.backupFileName);
                }

                // 3. Save .xconfig if bindings modified
                if (xconfig && Object.keys(pendingBindings).length > 0) {
                    let updated = xconfig;
                    for (const [key, binding] of Object.entries(pendingBindings)) {
                        const { slot, keyCode } = binding as { slot: 1 | 2; keyCode: number };
                        const actionName = key.split(':')[0];
                        updated = updateKeyBinding(updated, actionName, slot, keyCode);
                    }
                    const res = await savePilotXConfigClient(dirHandle, selectedPilot, updated);
                    if (!res.success) throw new Error(res.error || 'Failed to save .xconfig');
                    if (res.backupFileName) backupsCreated.push(res.backupFileName);
                }

                // 4. Save .extendedconfig autoselect if modified
                if (autoselectConfig && isAutoselectDirty) {
                    const res = await savePilotAutoselectClient(dirHandle, selectedPilot, autoselectConfig);
                    if (!res.success) throw new Error(res.error || 'Failed to save autoselect configuration');
                    if (res.backupFileName) backupsCreated.push(res.backupFileName);
                    setInitialAutoselectConfig(JSON.stringify(autoselectConfig));
                }

                setStatusMessage({
                    type: 'success',
                    text: `All changes saved successfully! Automatic backup created: ${backupsCreated.join(', ')}`
                });

                // Clear dirty state and reload
                setPendingPrefs({});
                setPendingMod({});
                setPendingBindings({});
                await loadPilotFiles(selectedPilot);
            }
        } catch (err: any) {
            console.error('Failed to save settings:', err);
            setStatusMessage({
                type: 'error',
                text: `Save failed: ${err.message}`
            });
        } finally {
            setLoading(false);
        }
    };

    // Backup All Pilots action
    const handleBackupAll = async () => {
        if (!dirHandle) return;
        setBackingUp(true);
        setStatusMessage(null);
        try {
            const res = await backupAllPilotsZipClient(dirHandle, pilots);
            if (res.success) {
                setStatusMessage({
                    type: 'success',
                    text: `Successfully created backup archive "${res.fileName}" (${res.fileCount} files) in Pilot Backup/`
                });
            } else {
                setStatusMessage({ type: 'error', text: res.error || 'Backup failed.' });
            }
        } catch (err: any) {
            setStatusMessage({ type: 'error', text: err.message || 'Backup failed.' });
        } finally {
            setBackingUp(false);
        }
    };

    return { xpSaving, backingUp, handleSaveXP, handleSaveAll, handleBackupAll };
}
