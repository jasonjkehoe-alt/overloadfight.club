import { useState, useEffect, useMemo } from 'react';
import {
    ParsedXPrefs,
    ParsedXConfig,
    parseXPrefs,
    parseXConfig,
    checkOverloadRunningClient,
    PilotAutoselectConfig,
    readPilotAutoselectClient,
    getDefaultAutoselectConfig,
    parseAutoselectConfig
} from '../utils/pilotSettingsBridge';

// Pilot files, pending edits and the game-running guard for PilotSettingsPanel.
export function usePilotSettings({
    activePilot,
    dirHandle,
    isServerNative
}: {
    activePilot: string;
    dirHandle: FileSystemDirectoryHandle | null;
    isServerNative: boolean;
}) {
    const [selectedPilot, setSelectedPilot] = useState<string>(activePilot || 'Soup');
    const [loading, setLoading] = useState<boolean>(false);
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

    // Overload running guard state
    const [gameRunning, setGameRunning] = useState<boolean>(false);
    const [guardReason, setGuardReason] = useState<string>('');

    // Original and parsed state
    const [xprefs, setXprefs] = useState<ParsedXPrefs | null>(null);
    const [xprefsmod, setXprefsmod] = useState<ParsedXPrefs | null>(null);
    const [xconfig, setXconfig] = useState<ParsedXConfig | null>(null);

    // Autoselect configuration state
    const [autoselectConfig, setAutoselectConfig] = useState<PilotAutoselectConfig | null>(null);
    const [initialAutoselectConfig, setInitialAutoselectConfig] = useState<string>('');

    // Pending dirty changes
    const [pendingPrefs, setPendingPrefs] = useState<Record<string, string>>({});
    const [pendingMod, setPendingMod] = useState<Record<string, string>>({});
    const [pendingBindings, setPendingBindings] = useState<Record<string, { slot: 1 | 2; keyCode: number }>>({});

    // XP editor state
    const [xpInput, setXpInput] = useState<string>('0');

    // Keep selectedPilot in sync with activePilot if user switches
    useEffect(() => {
        if (activePilot && !selectedPilot) {
            setSelectedPilot(activePilot);
        }
    }, [activePilot]);

    // Check game running status periodically
    useEffect(() => {
        let isMounted = true;
        const checkStatus = async () => {
            const res = await checkOverloadRunningClient(dirHandle);
            if (isMounted) {
                setGameRunning(res.isRunning);
                setGuardReason(res.reason || '');
            }
        };
        checkStatus();
        const interval = setInterval(checkStatus, 6000);
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [dirHandle]);

    // Load pilot configuration files whenever selectedPilot or dirHandle changes
    const loadPilotFiles = async (pilotName: string) => {
        if (!pilotName) return;
        setLoading(true);
        setStatusMessage(null);
        setPendingPrefs({});
        setPendingMod({});
        setPendingBindings({});

        try {
            if (dirHandle) {
                // 1. Read .xprefs
                try {
                    const prefsHandle = await dirHandle.getFileHandle(`${pilotName}.xprefs`, { create: false });
                    const file = await prefsHandle.getFile();
                    const text = await file.text();
                    const parsed = parseXPrefs(text);
                    setXprefs(parsed);

                    // Load current XP
                    if (parsed.entries['PS_XP2']) {
                        setXpInput(parsed.entries['PS_XP2'].value || '0');
                    }
                } catch (e) {
                    console.warn(`Could not load ${pilotName}.xprefs:`, e);
                    setXprefs(null);
                }

                // 2. Read .xprefsmod
                try {
                    const modHandle = await dirHandle.getFileHandle(`${pilotName}.xprefsmod`, { create: false });
                    const file = await modHandle.getFile();
                    const text = await file.text();
                    setXprefsmod(parseXPrefs(text));
                } catch {
                    setXprefsmod(null);
                }

                // 3. Read .xconfig (case insensitive check: pilotName.xconfig or lower)
                try {
                    let configHandle: FileSystemFileHandle | null = null;
                    try {
                        configHandle = await dirHandle.getFileHandle(`${pilotName}.xconfig`, { create: false });
                    } catch {
                        try {
                            configHandle = await dirHandle.getFileHandle(`${pilotName.toLowerCase()}.xconfig`, { create: false });
                        } catch {}
                    }
                    if (configHandle) {
                        const file = await configHandle.getFile();
                        const text = await file.text();
                        setXconfig(parseXConfig(text));
                    } else {
                        setXconfig(null);
                    }
                } catch {
                    setXconfig(null);
                }

                // 4. Read .extendedconfig autoselect
                try {
                    const autoCfg = await readPilotAutoselectClient(dirHandle, pilotName);
                    setAutoselectConfig(autoCfg);
                    setInitialAutoselectConfig(JSON.stringify(autoCfg));
                } catch (e) {
                    console.warn(`Could not load autoselect for ${pilotName}:`, e);
                    const defCfg = getDefaultAutoselectConfig();
                    setAutoselectConfig(defCfg);
                    setInitialAutoselectConfig(JSON.stringify(defCfg));
                }
            } else if (isServerNative) {
                // Server native fetch
                const res = await fetch(`/api/overload/pilot/${encodeURIComponent(pilotName)}/settings`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.xprefs) setXprefs(parseXPrefs(data.xprefs));
                    if (data.xprefsmod) setXprefsmod(parseXPrefs(data.xprefsmod));
                    if (data.xconfig) setXconfig(parseXConfig(data.xconfig));
                    if (data.xp !== undefined) setXpInput(String(data.xp));
                    if (data.extendedconfigRaw) {
                        const autoCfg = parseAutoselectConfig(data.extendedconfigRaw);
                        setAutoselectConfig(autoCfg);
                        setInitialAutoselectConfig(JSON.stringify(autoCfg));
                    } else {
                        const defCfg = getDefaultAutoselectConfig();
                        setAutoselectConfig(defCfg);
                        setInitialAutoselectConfig(JSON.stringify(defCfg));
                    }
                }
            }
        } catch (err: any) {
            console.error('Error loading pilot files:', err);
            setStatusMessage({ type: 'error', text: `Failed to load pilot files: ${err.message}` });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedPilot && (dirHandle || isServerNative)) {
            loadPilotFiles(selectedPilot);
        }
    }, [selectedPilot, dirHandle, isServerNative]);

    // Helper to get effective value of an xpref entry (pending or original)
    const getPrefVal = (key: string, isMod = false): string => {
        if (isMod) {
            if (pendingMod[key] !== undefined) return pendingMod[key];
            return xprefsmod?.entries[key]?.value ?? '';
        }
        if (pendingPrefs[key] !== undefined) return pendingPrefs[key];
        return xprefs?.entries[key]?.value ?? '';
    };

    // Helper to get effective boolean value
    const getPrefBool = (key: string, isMod = false): boolean => {
        const val = getPrefVal(key, isMod);
        return val === 'T' || val === '1' || val.toLowerCase() === 'true';
    };

    // Set a pref value into pending changes
    const setPrefVal = (key: string, val: string | number | boolean, isMod = false) => {
        let strVal = '';
        if (typeof val === 'boolean') strVal = val ? 'T' : 'F';
        else if (typeof val === 'number') strVal = Math.round(val).toString();
        else strVal = String(val);

        if (isMod) {
            setPendingMod(prev => ({ ...prev, [key]: strVal }));
        } else {
            setPendingPrefs(prev => ({ ...prev, [key]: strVal }));
        }
    };

    // Get effective keybinding (pending or original)
    const getActionBinding = (actionName: string, slot: 1 | 2): number => {
        const pendingKey = `${actionName}:${slot}`;
        if (pendingBindings[pendingKey] !== undefined) {
            return pendingBindings[pendingKey].keyCode;
        }
        if (xconfig?.bindings[actionName]) {
            return slot === 1 ? xconfig.bindings[actionName].key1 : xconfig.bindings[actionName].key2;
        }
        return 0;
    };

    // Autoselect dirty state
    const isAutoselectDirty = useMemo(() => {
        if (!autoselectConfig || !initialAutoselectConfig) return false;
        return JSON.stringify(autoselectConfig) !== initialAutoselectConfig;
    }, [autoselectConfig, initialAutoselectConfig]);

    // Total count of pending changes
    const dirtyCount = useMemo(() => {
        const autoselectDirty = isAutoselectDirty ? 1 : 0;
        return Object.keys(pendingPrefs).length + Object.keys(pendingMod).length + Object.keys(pendingBindings).length + autoselectDirty;
    }, [pendingPrefs, pendingMod, pendingBindings, isAutoselectDirty]);

    // Discard all pending changes
    const handleDiscard = () => {
        setPendingPrefs({});
        setPendingMod({});
        setPendingBindings({});
        if (initialAutoselectConfig) {
            setAutoselectConfig(JSON.parse(initialAutoselectConfig));
        }
        if (xprefs?.entries['PS_XP2']) {
            setXpInput(xprefs.entries['PS_XP2'].value || '0');
        }
        setStatusMessage({ type: 'info', text: 'All unsaved changes discarded.' });
    };

    return {
        selectedPilot,
        setSelectedPilot,
        loading,
        setLoading,
        statusMessage,
        setStatusMessage,
        gameRunning,
        setGameRunning,
        xprefs,
        xprefsmod,
        xconfig,
        autoselectConfig,
        setAutoselectConfig,
        initialAutoselectConfig,
        setInitialAutoselectConfig,
        pendingPrefs,
        setPendingPrefs,
        pendingMod,
        setPendingMod,
        pendingBindings,
        setPendingBindings,
        xpInput,
        setXpInput,
        loadPilotFiles,
        getPrefVal,
        getPrefBool,
        setPrefVal,
        getActionBinding,
        isAutoselectDirty,
        dirtyCount,
        handleDiscard
    };
}
