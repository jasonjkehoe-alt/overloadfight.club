import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    Sliders,
    Save,
    RotateCcw,
    Check,
    AlertTriangle,
    ShieldAlert,
    Gamepad2,
    Volume2,
    Monitor,
    Sparkles,
    Search,
    RefreshCw,
    Archive,
    Award,
    ChevronDown,
    Lock,
    ExternalLink,
    HelpCircle,
    User,
    Keyboard,
    Crosshair,
    ArrowUp,
    ArrowDown,
    Zap,
    Layers
} from 'lucide-react';
import { clsx } from 'clsx';
import { useOverloadFs } from '../context/OverloadFsContext';
import {
    ParsedXPrefs,
    ParsedXConfig,
    XPrefsEntry,
    parseXPrefs,
    parseXConfig,
    updateXPrefsValue,
    updateKeyBinding,
    getUnityKeyName,
    browserEventToUnityKeyCode,
    checkOverloadRunningClient,
    savePilotXPrefsClient,
    savePilotXConfigClient,
    backupAllPilotsZipClient,
    setPilotXPClient,
    PilotAutoselectConfig,
    WeaponAutoselectItem,
    AutoselectLogicSwitches,
    PrimaryWeaponId,
    SecondaryWeaponId,
    readPilotAutoselectClient,
    savePilotAutoselectClient,
    getDefaultAutoselectConfig,
    parseAutoselectConfig,
    serializeAutoselectConfig
} from '../utils/pilotSettingsBridge';

type SettingsTab = 'autoselect' | 'controls' | 'audio' | 'graphics' | 'olmod' | 'raw';

export const PilotSettingsPanel: React.FC = () => {
    const {
        isSupported,
        isClientConnected,
        isServerNative,
        pilots,
        activePilot,
        setActivePilot,
        dirHandle,
        connectLocalFolder
    } = useOverloadFs();

    const [selectedPilot, setSelectedPilot] = useState<string>(activePilot || 'Soup');
    const [activeTab, setActiveTab] = useState<SettingsTab>('controls');
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
    const [xpSaving, setXpSaving] = useState<boolean>(false);

    // Key rebind modal / listener
    const [rebindAction, setRebindAction] = useState<{ actionName: string; slot: 1 | 2 } | null>(null);

    // Raw search query
    const [rawSearchQuery, setRawSearchQuery] = useState('');
    const [rawFilterSource, setRawFilterSource] = useState<'all' | 'xprefs' | 'xprefsmod'>('all');

    // Backup state
    const [backingUp, setBackingUp] = useState(false);

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

    // Handle key listener for rebind modal
    useEffect(() => {
        if (!rebindAction) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            e.preventDefault();
            e.stopPropagation();

            if (e.code === 'Escape') {
                setRebindAction(null);
                return;
            }

            const keyCode = browserEventToUnityKeyCode(e);
            if (keyCode !== null) {
                applyKeyBindingChange(rebindAction.actionName, rebindAction.slot, keyCode);
                setRebindAction(null);
            }
        };

        const handleMouseDown = (e: MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            const keyCode = browserEventToUnityKeyCode(e);
            if (keyCode !== null) {
                applyKeyBindingChange(rebindAction.actionName, rebindAction.slot, keyCode);
                setRebindAction(null);
            }
        };

        window.addEventListener('keydown', handleKeyDown, true);
        window.addEventListener('mousedown', handleMouseDown, true);

        return () => {
            window.removeEventListener('keydown', handleKeyDown, true);
            window.removeEventListener('mousedown', handleMouseDown, true);
        };
    }, [rebindAction]);

    // Apply key binding change into pending state
    const applyKeyBindingChange = (actionName: string, slot: 1 | 2, keyCode: number) => {
        setPendingBindings(prev => ({
            ...prev,
            [`${actionName}:${slot}`]: { slot, keyCode }
        }));
    };

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

    // Autoselect priority and toggle helpers
    const movePrimaryPriority = (index: number, direction: 'up' | 'down') => {
        if (!autoselectConfig) return;
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= autoselectConfig.primaries.length) return;

        const newPrimaries = [...autoselectConfig.primaries];
        const temp = newPrimaries[index];
        newPrimaries[index] = newPrimaries[targetIndex];
        newPrimaries[targetIndex] = temp;

        setAutoselectConfig({
            ...autoselectConfig,
            primaries: newPrimaries
        });
    };

    const moveSecondaryPriority = (index: number, direction: 'up' | 'down') => {
        if (!autoselectConfig) return;
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= autoselectConfig.secondaries.length) return;

        const newSecondaries = [...autoselectConfig.secondaries];
        const temp = newSecondaries[index];
        newSecondaries[index] = newSecondaries[targetIndex];
        newSecondaries[targetIndex] = temp;

        setAutoselectConfig({
            ...autoselectConfig,
            secondaries: newSecondaries
        });
    };

    const togglePrimaryNeverSelect = (index: number) => {
        if (!autoselectConfig) return;
        const newPrimaries = [...autoselectConfig.primaries];
        newPrimaries[index] = {
            ...newPrimaries[index],
            neverSelect: !newPrimaries[index].neverSelect
        };
        setAutoselectConfig({
            ...autoselectConfig,
            primaries: newPrimaries
        });
    };

    const togglePrimaryCycle = (index: number) => {
        if (!autoselectConfig) return;
        const newPrimaries = [...autoselectConfig.primaries];
        newPrimaries[index] = {
            ...newPrimaries[index],
            cycle: !newPrimaries[index].cycle
        };
        setAutoselectConfig({
            ...autoselectConfig,
            primaries: newPrimaries
        });
    };

    const toggleSecondaryNeverSelect = (index: number) => {
        if (!autoselectConfig) return;
        const newSecondaries = [...autoselectConfig.secondaries];
        newSecondaries[index] = {
            ...newSecondaries[index],
            neverSelect: !newSecondaries[index].neverSelect
        };
        setAutoselectConfig({
            ...autoselectConfig,
            secondaries: newSecondaries
        });
    };

    const toggleSecondaryCycle = (index: number) => {
        if (!autoselectConfig) return;
        const newSecondaries = [...autoselectConfig.secondaries];
        newSecondaries[index] = {
            ...newSecondaries[index],
            cycle: !newSecondaries[index].cycle
        };
        setAutoselectConfig({
            ...autoselectConfig,
            secondaries: newSecondaries
        });
    };

    const toggleAutoselectSwitch = (key: keyof AutoselectLogicSwitches) => {
        if (!autoselectConfig) return;
        const cur = autoselectConfig.switches;
        if (key === 'status') {
            const nextActive = !cur.status;
            setAutoselectConfig({
                ...autoselectConfig,
                switches: {
                    ...cur,
                    status: nextActive,
                    weaponLogic: nextActive,
                    missileLogic: nextActive
                }
            });
            return;
        }

        if (key === 'weaponLogic') {
            const nextVal = !cur.weaponLogic;
            setAutoselectConfig({
                ...autoselectConfig,
                switches: {
                    ...cur,
                    weaponLogic: nextVal,
                    status: nextVal || cur.missileLogic
                }
            });
            return;
        }

        if (key === 'missileLogic') {
            const nextVal = !cur.missileLogic;
            setAutoselectConfig({
                ...autoselectConfig,
                switches: {
                    ...cur,
                    missileLogic: nextVal,
                    status: cur.weaponLogic || nextVal
                }
            });
            return;
        }

        setAutoselectConfig({
            ...autoselectConfig,
            switches: {
                ...cur,
                [key]: !cur[key]
            }
        });
    };

    const handleResetAutoselectDefaults = () => {
        const def = getDefaultAutoselectConfig();
        setAutoselectConfig(def);
        setStatusMessage({
            type: 'info',
            text: 'Autoselect priorities, weapon cycling, and logic switches reset to factory defaults (Unsaved changes).'
        });
    };

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

    // Actions list for Keybindings display
    const actionGroups = [
        {
            title: 'Movement & 6-DOF Flight',
            actions: [
                { id: 'MOVE_FORE', label: 'Move Forward (Thrust)' },
                { id: 'MOVE_BACK', label: 'Move Backward (Reverse)' },
                { id: 'SLIDE_LEFT', label: 'Slide Left (Strafe)' },
                { id: 'SLIDE_RIGHT', label: 'Slide Right (Strafe)' },
                { id: 'SLIDE_UP', label: 'Slide Up (Levitate)' },
                { id: 'SLIDE_DOWN', label: 'Slide Down (Descend)' },
                { id: 'ROLL_LEFT', label: 'Roll Counter-Clockwise' },
                { id: 'ROLL_RIGHT', label: 'Roll Clockwise' },
                { id: 'TURN_LEFT', label: 'Turn Left (Yaw)' },
                { id: 'TURN_RIGHT', label: 'Turn Right (Yaw)' },
                { id: 'PITCH_UP', label: 'Pitch Up (Nose Up)' },
                { id: 'PITCH_DOWN', label: 'Pitch Down (Nose Down)' }
            ]
        },
        {
            title: 'Combat & Ordnance',
            actions: [
                { id: 'FIRE_WEAPON', label: 'Primary Weapon (Laser/Cannon)' },
                { id: 'FIRE_MISSILE', label: 'Secondary Missile (Launch)' },
                { id: 'SWITCH_WEAPON', label: 'Next Primary Weapon' },
                { id: 'SWITCH_MISSILE', label: 'Next Secondary Missile' },
                { id: 'FIRE_FLARE', label: 'Deploy Flare / Countermeasure' },
                { id: 'USE_BOOST', label: 'Afterburner / Speed Boost' },
                { id: 'SMASH_ATTACK', label: 'Smash Attack (Melee/Ram)' }
            ]
        },
        {
            title: 'Tactical & Cockpit Views',
            actions: [
                { id: 'REAR_VIEW', label: 'Rear View Mirror' },
                { id: 'VIEW_MAP', label: 'Guidebot / Auto-Map' },
                { id: 'TOGGLE_HEADLIGHT', label: 'Headlight Toggle' },
                { id: 'TOGGLE_COCKPIT', label: 'Cockpit Geometry View' },
                { id: 'TOGGLE_HUD', label: 'HUD Overlay Toggle' },
                { id: 'FULL_CHAT', label: 'Open Multiplayer Chat' }
            ]
        }
    ];

    // Raw settings list for Search & Filter
    const allRawEntries = useMemo(() => {
        const list: Array<{ key: string; value: string; type: string; source: 'xprefs' | 'xprefsmod' }> = [];

        if (xprefs) {
            for (const [k, e] of Object.entries(xprefs.entries)) {
                const entry = e as XPrefsEntry;
                list.push({
                    key: k,
                    value: pendingPrefs[k] !== undefined ? pendingPrefs[k] : entry.value,
                    type: entry.type,
                    source: 'xprefs'
                });
            }
        }

        if (xprefsmod) {
            for (const [k, e] of Object.entries(xprefsmod.entries)) {
                const entry = e as XPrefsEntry;
                list.push({
                    key: k,
                    value: pendingMod[k] !== undefined ? pendingMod[k] : entry.value,
                    type: entry.type,
                    source: 'xprefsmod'
                });
            }
        }

        return list.filter(item => {
            if (rawFilterSource !== 'all' && item.source !== rawFilterSource) return false;
            if (rawSearchQuery) {
                const q = rawSearchQuery.toLowerCase();
                return item.key.toLowerCase().includes(q) || item.value.toLowerCase().includes(q);
            }
            return true;
        }).sort((a, b) => a.key.localeCompare(b.key));
    }, [xprefs, xprefsmod, pendingPrefs, pendingMod, rawSearchQuery, rawFilterSource]);

    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 font-mono text-gray-200">
            {/* Top Header Card */}
            <div className="bg-[#121215] border border-gray-800 rounded-2xl p-6 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-[#ff6600]/10 border border-[#ff6600]/40 flex items-center justify-center text-[#ff6600] shadow-[0_0_20px_rgba(255,102,0,0.2)]">
                        <Sliders className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold tracking-wider brand-font text-white">
                                PILOT <span className="text-[#ff6600]">SETTINGS</span> &amp; CLIENT CONFIG
                            </h2>
                            {gameRunning ? (
                                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-red-500/40 bg-red-950/40 text-red-400 text-xs font-semibold animate-pulse">
                                    <Lock className="w-3 h-3" />
                                    <span>Overload Running (Locked)</span>
                                </span>
                            ) : (
                                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-emerald-500/40 bg-emerald-950/40 text-emerald-400 text-xs font-semibold">
                                    <Check className="w-3 h-3" />
                                    <span>Ready / Safe to Write</span>
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                            Direct round-trip editor for .xprefs, .xprefsmod, and .xconfig bindings with automated backup.
                        </p>
                    </div>
                </div>

                {/* Pilot Selector & Quick Backup */}
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    {/* Active Pilot Selector */}
                    <div className="flex items-center gap-2 bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs">
                        <User className="w-4 h-4 text-[#ff6600]" />
                        <span className="text-gray-400 font-bold">Pilot:</span>
                        <select
                            value={selectedPilot}
                            onChange={(e) => {
                                setSelectedPilot(e.target.value);
                                setActivePilot(e.target.value);
                            }}
                            className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
                        >
                            {pilots.map(p => (
                                <option key={p} value={p} className="bg-[#121215] text-white">
                                    {p} {p === activePilot ? '(Active)' : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Backup All Pilots */}
                    <button
                        onClick={handleBackupAll}
                        disabled={backingUp || (!dirHandle && !isServerNative)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-300 hover:text-white transition-all"
                        title="Create timestamped zip of all pilots in Pilot Backup/"
                    >
                        <Archive className={clsx("w-3.5 h-3.5", backingUp && "animate-spin")} />
                        <span>{backingUp ? 'Archiving...' : 'Backup All Pilots'}</span>
                    </button>

                    {/* Reload Button */}
                    <button
                        onClick={() => loadPilotFiles(selectedPilot)}
                        disabled={loading}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-all"
                        title="Reload from disk"
                    >
                        <RefreshCw className={clsx("w-4 h-4", loading && "animate-spin")} />
                    </button>
                </div>
            </div>

            {/* Overload Running Warning Alert Banner */}
            {gameRunning && (
                <div className="bg-red-950/40 border border-red-500/50 rounded-xl p-4 flex items-center justify-between gap-4 text-red-200 text-xs">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                        <div>
                            <span className="font-bold text-white uppercase tracking-wider">Writes are guarded:</span>
                            <span className="ml-2">Close Overload to change settings. Overload overwrites pilot configuration when exiting.</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Status Feedback Toast */}
            {statusMessage && (
                <div className={clsx(
                    "p-3 rounded-xl border text-xs flex items-center justify-between",
                    statusMessage.type === 'success' && "bg-emerald-950/40 border-emerald-500/40 text-emerald-300",
                    statusMessage.type === 'error' && "bg-red-950/40 border-red-500/40 text-red-300",
                    statusMessage.type === 'info' && "bg-blue-950/40 border-blue-500/40 text-blue-300"
                )}>
                    <span>{statusMessage.text}</span>
                    <button onClick={() => setStatusMessage(null)} className="opacity-60 hover:opacity-100 ml-3">✕</button>
                </div>
            )}

            {/* Folder Connection Warning if not connected */}
            {!dirHandle && !isServerNative && (
                <div className="bg-[#121215] border border-dashed border-gray-700 rounded-2xl p-8 text-center space-y-4">
                    <div className="w-12 h-12 mx-auto rounded-xl bg-[#ff6600]/10 border border-[#ff6600]/30 flex items-center justify-center text-[#ff6600]">
                        <Lock className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-white brand-font tracking-wider">
                            OVERLOAD FOLDER NOT CONNECTED
                        </h3>
                        <p className="text-xs text-gray-400 max-w-md mx-auto mt-1">
                            Connect your Overload configuration directory (<code className="text-[#ff6600]">%LocalLow%\Revival\Overload</code>) to view and edit pilot settings directly.
                        </p>
                    </div>
                    <button
                        onClick={connectLocalFolder}
                        className="px-5 py-2.5 rounded-xl bg-[#ff6600] hover:bg-[#ff8533] text-black font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#ff6600]/20 transition-all inline-flex items-center gap-2"
                    >
                        <span>Connect Overload Folder</span>
                    </button>
                </div>
            )}

            {/* Main Editor Tabs & Interface */}
            {(dirHandle || isServerNative) && (
                <div className="space-y-6">
                    {/* Pilot XP Quick Editor Card (Item 6) */}
                    <div className="bg-[#121215] border border-gray-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/40 flex items-center justify-center text-purple-400">
                                <Award className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-bold text-white">PILOT EXPERIENCE (XP)</h4>
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950/60 text-purple-300 border border-purple-500/30 uppercase tracking-widest">
                                        Single-Player Only
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400">
                                    Governs single-player campaign unlocks and upgrades in PS_XP2. Range: 0 &ndash; 9,999,999.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <input
                                type="number"
                                min="0"
                                max="9999999"
                                value={xpInput}
                                onChange={(e) => setXpInput(e.target.value)}
                                className="bg-black/60 border border-white/20 focus:border-[#ff6600] rounded-xl px-3 py-1.5 text-xs text-white w-32 font-bold focus:outline-none"
                            />
                            <button
                                onClick={handleSaveXP}
                                disabled={xpSaving || gameRunning}
                                className={clsx(
                                    "px-4 py-1.5 rounded-xl text-xs font-bold transition-all uppercase tracking-wider flex items-center gap-1.5",
                                    gameRunning 
                                        ? "bg-gray-800 text-gray-500 cursor-not-allowed" 
                                        : "bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/20"
                                )}
                                title={gameRunning ? "Close Overload to change settings" : "Write XP to .xprefs"}
                            >
                                {xpSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                <span>Set XP</span>
                            </button>
                            <button
                                onClick={() => setXpInput('999999')}
                                className="px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-gray-400 hover:text-white"
                                title="Max Campaign XP"
                            >
                                Max
                            </button>
                        </div>
                    </div>

                    {/* Sub-Tab Navigation */}
                    <div className="flex items-center space-x-1 sm:space-x-2 bg-black/40 p-1.5 rounded-xl border border-gray-800 text-xs overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('autoselect')}
                            className={clsx(
                                "flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all shrink-0",
                                activeTab === 'autoselect'
                                    ? "bg-[#ff6600] text-black font-bold shadow-md"
                                    : "text-gray-400 hover:text-white"
                            )}
                        >
                            <Crosshair className="w-4 h-4" />
                            <span>Weapon Autoselect</span>
                            {isAutoselectDirty && (
                                <span className="w-2 h-2 rounded-full bg-[#ff6600] animate-pulse"></span>
                            )}
                        </button>

                        <button
                            onClick={() => setActiveTab('controls')}
                            className={clsx(
                                "flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all shrink-0",
                                activeTab === 'controls'
                                    ? "bg-[#ff6600] text-black font-bold shadow-md"
                                    : "text-gray-400 hover:text-white"
                            )}
                        >
                            <Keyboard className="w-4 h-4" />
                            <span>Controls &amp; Bindings</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('audio')}
                            className={clsx(
                                "flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all shrink-0",
                                activeTab === 'audio'
                                    ? "bg-[#ff6600] text-black font-bold shadow-md"
                                    : "text-gray-400 hover:text-white"
                            )}
                        >
                            <Volume2 className="w-4 h-4" />
                            <span>General &amp; Audio</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('graphics')}
                            className={clsx(
                                "flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all shrink-0",
                                activeTab === 'graphics'
                                    ? "bg-[#ff6600] text-black font-bold shadow-md"
                                    : "text-gray-400 hover:text-white"
                            )}
                        >
                            <Monitor className="w-4 h-4" />
                            <span>Graphics &amp; Video</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('olmod')}
                            className={clsx(
                                "flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all shrink-0",
                                activeTab === 'olmod'
                                    ? "bg-[#ff6600] text-black font-bold shadow-md"
                                    : "text-gray-400 hover:text-white"
                            )}
                        >
                            <Sparkles className="w-4 h-4" />
                            <span>OLMOD Preferences</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('raw')}
                            className={clsx(
                                "flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all shrink-0",
                                activeTab === 'raw'
                                    ? "bg-[#ff6600] text-black font-bold shadow-md"
                                    : "text-gray-400 hover:text-white"
                            )}
                        >
                            <Search className="w-4 h-4" />
                            <span>All Settings ({allRawEntries.length})</span>
                        </button>
                    </div>

                    {/* TAB: Weapon Autoselect & Cycling Matrix */}
                    {activeTab === 'autoselect' && (
                        <div className="space-y-6">
                            {/* Autoselect Header & Reset Action */}
                            <div className="bg-[#121215] border border-gray-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-base font-bold text-white brand-font tracking-wider flex items-center gap-2">
                                            <Crosshair className="w-5 h-5 text-[#ff6600]" />
                                            <span>WEAPON AUTOSELECT &amp; CYCLING MATRIX</span>
                                        </h3>
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#ff6600]/10 text-[#ff6600] border border-[#ff6600]/30 uppercase">
                                            OLMOD Enhanced
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-400 max-w-2xl">
                                        Configure automatic weapon swap priority, dual inclusion switches (Pickup Autoselect &amp; Manual Next/Prev Cycling), and combat swap logic.
                                    </p>
                                </div>

                                <button
                                    onClick={handleResetAutoselectDefaults}
                                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-300 hover:text-white transition-all shadow-md shrink-0"
                                    title="Restore olmod default weapon priorities, cycling, and logic switches"
                                >
                                    <RotateCcw className="w-4 h-4 text-[#ff6600]" />
                                    <span>Reset to Defaults</span>
                                </button>
                            </div>

                            {/* 6 Logic Switches Grid */}
                            <div className="bg-[#121215] border border-gray-800 rounded-2xl p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                                        <Zap className="w-4 h-4 text-[#ff6600]" />
                                        <span>Combat Swap Logic &amp; Behavior Switches</span>
                                    </h4>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] text-gray-400">Master Status:</span>
                                        <button
                                            onClick={() => toggleAutoselectSwitch('status')}
                                            className={clsx(
                                                "px-2.5 py-0.5 rounded text-[11px] font-bold uppercase transition-all",
                                                autoselectConfig?.switches.status
                                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                                                    : "bg-red-500/20 text-red-400 border border-red-500/40"
                                            )}
                                        >
                                            {autoselectConfig?.switches.status ? 'Active' : 'Inactive'}
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {/* Switch 1: Primary Weapon Logic */}
                                    <div className="bg-black/50 border border-white/5 rounded-xl p-3.5 flex flex-col justify-between gap-3">
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-white">Primary Weapon Logic</span>
                                                <span className={clsx("text-[10px] font-bold px-1.5 py-0.5 rounded", autoselectConfig?.switches.weaponLogic ? "bg-[#ff6600]/20 text-[#ff6600]" : "bg-white/5 text-gray-400")}>
                                                    {autoselectConfig?.switches.weaponLogic ? 'ON' : 'OFF'}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-gray-400 leading-relaxed">
                                                Automatically equips higher-priority primary weapons when picked up or when ammo is replenished.
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => toggleAutoselectSwitch('weaponLogic')}
                                            className={clsx(
                                                "w-full py-1.5 px-3 rounded-lg text-xs font-bold transition-all border text-center",
                                                autoselectConfig?.switches.weaponLogic
                                                    ? "bg-[#ff6600]/15 border-[#ff6600]/40 text-[#ff6600] hover:bg-[#ff6600]/25"
                                                    : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                                            )}
                                        >
                                            {autoselectConfig?.switches.weaponLogic ? 'Disable Weapon Logic' : 'Enable Weapon Logic'}
                                        </button>
                                    </div>

                                    {/* Switch 2: Secondary Missile Logic */}
                                    <div className="bg-black/50 border border-white/5 rounded-xl p-3.5 flex flex-col justify-between gap-3">
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-white">Secondary Missile Logic</span>
                                                <span className={clsx("text-[10px] font-bold px-1.5 py-0.5 rounded", autoselectConfig?.switches.missileLogic ? "bg-[#ff6600]/20 text-[#ff6600]" : "bg-white/5 text-gray-400")}>
                                                    {autoselectConfig?.switches.missileLogic ? 'ON' : 'OFF'}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-gray-400 leading-relaxed">
                                                Automatically equips higher-priority secondary missiles when collected during combat.
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => toggleAutoselectSwitch('missileLogic')}
                                            className={clsx(
                                                "w-full py-1.5 px-3 rounded-lg text-xs font-bold transition-all border text-center",
                                                autoselectConfig?.switches.missileLogic
                                                    ? "bg-[#ff6600]/15 border-[#ff6600]/40 text-[#ff6600] hover:bg-[#ff6600]/25"
                                                    : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                                            )}
                                        >
                                            {autoselectConfig?.switches.missileLogic ? 'Disable Missile Logic' : 'Enable Missile Logic'}
                                        </button>
                                    </div>

                                    {/* Switch 3: Don't Swap While Firing */}
                                    <div className="bg-black/50 border border-white/5 rounded-xl p-3.5 flex flex-col justify-between gap-3">
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-white">Don't Swap While Firing</span>
                                                <span className={clsx("text-[10px] font-bold px-1.5 py-0.5 rounded", autoselectConfig?.switches.swapWhileFiring ? "bg-[#ff6600]/20 text-[#ff6600]" : "bg-white/5 text-gray-400")}>
                                                    {autoselectConfig?.switches.swapWhileFiring ? 'ON' : 'OFF'}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-gray-400 leading-relaxed">
                                                Delays automatic weapon switches while primary or secondary fire is active, preventing interrupted attack bursts.
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => toggleAutoselectSwitch('swapWhileFiring')}
                                            className={clsx(
                                                "w-full py-1.5 px-3 rounded-lg text-xs font-bold transition-all border text-center",
                                                autoselectConfig?.switches.swapWhileFiring
                                                    ? "bg-[#ff6600]/15 border-[#ff6600]/40 text-[#ff6600] hover:bg-[#ff6600]/25"
                                                    : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                                            )}
                                        >
                                            {autoselectConfig?.switches.swapWhileFiring ? 'Disable Swap Delay' : 'Enable Swap Delay'}
                                        </button>
                                    </div>

                                    {/* Switch 4: Retry Swap After Firing */}
                                    <div className="bg-black/50 border border-white/5 rounded-xl p-3.5 flex flex-col justify-between gap-3">
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-white">Retry Swap After Firing</span>
                                                <span className={clsx("text-[10px] font-bold px-1.5 py-0.5 rounded", autoselectConfig?.switches.dontAutoselectAfterFiring ? "bg-[#ff6600]/20 text-[#ff6600]" : "bg-white/5 text-gray-400")}>
                                                    {autoselectConfig?.switches.dontAutoselectAfterFiring ? 'ON' : 'OFF'}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-gray-400 leading-relaxed">
                                                Attempts to execute a deferred weapon switch immediately after releasing the firing trigger.
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => toggleAutoselectSwitch('dontAutoselectAfterFiring')}
                                            className={clsx(
                                                "w-full py-1.5 px-3 rounded-lg text-xs font-bold transition-all border text-center",
                                                autoselectConfig?.switches.dontAutoselectAfterFiring
                                                    ? "bg-[#ff6600]/15 border-[#ff6600]/40 text-[#ff6600] hover:bg-[#ff6600]/25"
                                                    : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                                            )}
                                        >
                                            {autoselectConfig?.switches.dontAutoselectAfterFiring ? 'Disable Retry' : 'Enable Retry'}
                                        </button>
                                    </div>

                                    {/* Switch 5: Devastator Alert */}
                                    <div className="bg-black/50 border border-white/5 rounded-xl p-3.5 flex flex-col justify-between gap-3">
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-white">Devastator Missile Alert</span>
                                                <span className={clsx("text-[10px] font-bold px-1.5 py-0.5 rounded", autoselectConfig?.switches.devAlert ? "bg-[#ff6600]/20 text-[#ff6600]" : "bg-white/5 text-gray-400")}>
                                                    {autoselectConfig?.switches.devAlert ? 'ON' : 'OFF'}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-gray-400 leading-relaxed">
                                                Triggers acoustic and HUD alert signals whenever an opponent launches a Devastator missile in your vicinity.
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => toggleAutoselectSwitch('devAlert')}
                                            className={clsx(
                                                "w-full py-1.5 px-3 rounded-lg text-xs font-bold transition-all border text-center",
                                                autoselectConfig?.switches.devAlert
                                                    ? "bg-[#ff6600]/15 border-[#ff6600]/40 text-[#ff6600] hover:bg-[#ff6600]/25"
                                                    : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                                            )}
                                        >
                                            {autoselectConfig?.switches.devAlert ? 'Disable Alert' : 'Enable Alert'}
                                        </button>
                                    </div>

                                    {/* Switch 6: Reduced HUD */}
                                    <div className="bg-black/50 border border-white/5 rounded-xl p-3.5 flex flex-col justify-between gap-3">
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-white">Reduced HUD Indicators</span>
                                                <span className={clsx("text-[10px] font-bold px-1.5 py-0.5 rounded", autoselectConfig?.switches.reducedHud ? "bg-[#ff6600]/20 text-[#ff6600]" : "bg-white/5 text-gray-400")}>
                                                    {autoselectConfig?.switches.reducedHud ? 'ON' : 'OFF'}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-gray-400 leading-relaxed">
                                                Simplifies autoselect weapon swap HUD notifications to minimal indicators during intense combat.
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => toggleAutoselectSwitch('reducedHud')}
                                            className={clsx(
                                                "w-full py-1.5 px-3 rounded-lg text-xs font-bold transition-all border text-center",
                                                autoselectConfig?.switches.reducedHud
                                                    ? "bg-[#ff6600]/15 border-[#ff6600]/40 text-[#ff6600] hover:bg-[#ff6600]/25"
                                                    : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                                            )}
                                        >
                                            {autoselectConfig?.switches.reducedHud ? 'Disable Reduced HUD' : 'Enable Reduced HUD'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Dual Weapon Priority & Inclusion Columns */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Left Column: Primary Weapons */}
                                <div className="bg-[#121215] border border-gray-800 rounded-2xl p-6 space-y-4">
                                    <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                                        <div>
                                            <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                                <span className="w-2.5 h-2.5 rounded-full bg-[#ff6600]"></span>
                                                <span>PRIMARY WEAPONS (8)</span>
                                            </h4>
                                            <p className="text-[11px] text-gray-400 mt-0.5">
                                                Rank #1 is highest priority. Use ▲ ▼ buttons to reorder.
                                            </p>
                                        </div>
                                        <span className="text-[10px] text-gray-500 font-mono">
                                            Autoselect &bull; Cycle
                                        </span>
                                    </div>

                                    <div className="space-y-2.5">
                                        {autoselectConfig?.primaries.map((weapon, idx) => {
                                            const isHighest = idx === 0;
                                            return (
                                                <div
                                                    key={weapon.id}
                                                    className={clsx(
                                                        "flex items-center justify-between p-3 rounded-xl border transition-all",
                                                        isHighest
                                                            ? "bg-[#ff6600]/5 border-[#ff6600]/40 shadow-sm"
                                                            : "bg-black/40 border-white/5 hover:border-white/15"
                                                    )}
                                                >
                                                    {/* Left: Reorder & Name */}
                                                    <div className="flex items-center gap-3">
                                                        {/* Priority Rank & Up/Down Steppers */}
                                                        <div className="flex items-center gap-1">
                                                            <div className="flex flex-col gap-0.5">
                                                                <button
                                                                    onClick={() => movePrimaryPriority(idx, 'up')}
                                                                    disabled={idx === 0}
                                                                    className={clsx(
                                                                        "p-1 rounded hover:bg-white/10 transition-all",
                                                                        idx === 0 ? "opacity-20 cursor-not-allowed" : "text-gray-300 hover:text-[#ff6600]"
                                                                    )}
                                                                    title="Move priority up"
                                                                >
                                                                    <ArrowUp className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button
                                                                    onClick={() => movePrimaryPriority(idx, 'down')}
                                                                    disabled={idx === 7}
                                                                    className={clsx(
                                                                        "p-1 rounded hover:bg-white/10 transition-all",
                                                                        idx === 7 ? "opacity-20 cursor-not-allowed" : "text-gray-300 hover:text-[#ff6600]"
                                                                    )}
                                                                    title="Move priority down"
                                                                >
                                                                    <ArrowDown className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                            <span className={clsx(
                                                                "w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs",
                                                                isHighest
                                                                    ? "bg-[#ff6600] text-black font-extrabold"
                                                                    : "bg-white/5 text-gray-300 border border-white/10"
                                                            )}>
                                                                #{idx + 1}
                                                            </span>
                                                        </div>

                                                        {/* Weapon Name & Tags */}
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className={clsx("text-xs font-bold tracking-wide", isHighest ? "text-[#ff6600]" : "text-white")}>
                                                                    {weapon.name}
                                                                </span>
                                                                {isHighest && (
                                                                    <span className="text-[9px] uppercase font-bold px-1.5 rounded bg-[#ff6600]/20 text-[#ff6600] border border-[#ff6600]/30">
                                                                        Top Pick
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <span className="text-[10px] text-gray-500 font-mono">
                                                                {['CRUSHER', 'DRILLER', 'FLAK'].includes(weapon.id) ? 'Projectile Ammo' : 'Energy Weapon'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Right: Dual Inclusion Switches */}
                                                    <div className="flex items-center gap-2">
                                                        {/* Autoselect Inclusion Toggle */}
                                                        <button
                                                            onClick={() => togglePrimaryNeverSelect(idx)}
                                                            className={clsx(
                                                                "px-2.5 py-1 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5",
                                                                !weapon.neverSelect
                                                                    ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50"
                                                                    : "bg-white/5 border-white/10 text-gray-500 hover:text-gray-300"
                                                            )}
                                                            title={!weapon.neverSelect ? "Autoselect: Active (+). Ship will swap to this weapon." : "Autoselect: Excluded (-). Ship will not auto-swap."}
                                                        >
                                                            <span className="text-[11px] font-mono">{!weapon.neverSelect ? '+' : '–'}</span>
                                                            <span className="text-[11px]">Auto</span>
                                                        </button>

                                                        {/* Cycle Inclusion Toggle */}
                                                        <button
                                                            onClick={() => togglePrimaryCycle(idx)}
                                                            className={clsx(
                                                                "px-2.5 py-1 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5",
                                                                weapon.cycle
                                                                    ? "bg-cyan-950/40 border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/50"
                                                                    : "bg-white/5 border-white/10 text-gray-500 hover:text-gray-300"
                                                            )}
                                                            title={weapon.cycle ? "Cycling: Included (+). Appears in Next/Prev weapon cycle." : "Cycling: Excluded (-). Skipped during manual cycle."}
                                                        >
                                                            <span className="text-[11px] font-mono">{weapon.cycle ? '+' : '–'}</span>
                                                            <span className="text-[11px]">Cycle</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Right Column: Secondary Missiles */}
                                <div className="bg-[#121215] border border-gray-800 rounded-2xl p-6 space-y-4">
                                    <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                                        <div>
                                            <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                                                <span>SECONDARY MISSILES (8)</span>
                                            </h4>
                                            <p className="text-[11px] text-gray-400 mt-0.5">
                                                Rank #1 is highest priority. Use ▲ ▼ buttons to reorder.
                                            </p>
                                        </div>
                                        <span className="text-[10px] text-gray-500 font-mono">
                                            Autoselect &bull; Cycle
                                        </span>
                                    </div>

                                    <div className="space-y-2.5">
                                        {autoselectConfig?.secondaries.map((missile, idx) => {
                                            const isHighest = idx === 0;
                                            return (
                                                <div
                                                    key={missile.id}
                                                    className={clsx(
                                                        "flex items-center justify-between p-3 rounded-xl border transition-all",
                                                        isHighest
                                                            ? "bg-cyan-500/5 border-cyan-500/40 shadow-sm"
                                                            : "bg-black/40 border-white/5 hover:border-white/15"
                                                    )}
                                                >
                                                    {/* Left: Reorder & Name */}
                                                    <div className="flex items-center gap-3">
                                                        {/* Priority Rank & Up/Down Steppers */}
                                                        <div className="flex items-center gap-1">
                                                            <div className="flex flex-col gap-0.5">
                                                                <button
                                                                    onClick={() => moveSecondaryPriority(idx, 'up')}
                                                                    disabled={idx === 0}
                                                                    className={clsx(
                                                                        "p-1 rounded hover:bg-white/10 transition-all",
                                                                        idx === 0 ? "opacity-20 cursor-not-allowed" : "text-gray-300 hover:text-cyan-400"
                                                                    )}
                                                                    title="Move priority up"
                                                                >
                                                                    <ArrowUp className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button
                                                                    onClick={() => moveSecondaryPriority(idx, 'down')}
                                                                    disabled={idx === 7}
                                                                    className={clsx(
                                                                        "p-1 rounded hover:bg-white/10 transition-all",
                                                                        idx === 7 ? "opacity-20 cursor-not-allowed" : "text-gray-300 hover:text-cyan-400"
                                                                    )}
                                                                    title="Move priority down"
                                                                >
                                                                    <ArrowDown className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                            <span className={clsx(
                                                                "w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs",
                                                                isHighest
                                                                    ? "bg-cyan-500 text-black font-extrabold"
                                                                    : "bg-white/5 text-gray-300 border border-white/10"
                                                            )}>
                                                                #{idx + 1}
                                                            </span>
                                                        </div>

                                                        {/* Missile Name & Type */}
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className={clsx("text-xs font-bold tracking-wide", isHighest ? "text-cyan-400" : "text-white")}>
                                                                    {missile.name}
                                                                </span>
                                                                {isHighest && (
                                                                    <span className="text-[9px] uppercase font-bold px-1.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                                                        Top Pick
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <span className="text-[10px] text-gray-500 font-mono">
                                                                {['DEVASTATOR', 'TIMEBOMB', 'VORTEX', 'NOVA'].includes(missile.id) ? 'Heavy Ordinance' : 'Guided / Standard'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Right: Dual Inclusion Switches */}
                                                    <div className="flex items-center gap-2">
                                                        {/* Autoselect Inclusion Toggle */}
                                                        <button
                                                            onClick={() => toggleSecondaryNeverSelect(idx)}
                                                            className={clsx(
                                                                "px-2.5 py-1 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5",
                                                                !missile.neverSelect
                                                                    ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50"
                                                                    : "bg-white/5 border-white/10 text-gray-500 hover:text-gray-300"
                                                            )}
                                                            title={!missile.neverSelect ? "Autoselect: Active (+). Ship will swap to this missile." : "Autoselect: Excluded (-). Ship will not auto-swap."}
                                                        >
                                                            <span className="text-[11px] font-mono">{!missile.neverSelect ? '+' : '–'}</span>
                                                            <span className="text-[11px]">Auto</span>
                                                        </button>

                                                        {/* Cycle Inclusion Toggle */}
                                                        <button
                                                            onClick={() => toggleSecondaryCycle(idx)}
                                                            className={clsx(
                                                                "px-2.5 py-1 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5",
                                                                missile.cycle
                                                                    ? "bg-cyan-950/40 border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/50"
                                                                    : "bg-white/5 border-white/10 text-gray-500 hover:text-gray-300"
                                                            )}
                                                            title={missile.cycle ? "Cycling: Included (+). Appears in Next/Prev missile cycle." : "Cycling: Excluded (-). Skipped during manual cycle."}
                                                        >
                                                            <span className="text-[11px] font-mono">{missile.cycle ? '+' : '–'}</span>
                                                            <span className="text-[11px]">Cycle</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 1: Controls & Keybindings (.xconfig) */}
                    {activeTab === 'controls' && (
                        <div className="space-y-6">
                            {/* Sensitivity and Flight controls card */}
                            <div className="bg-[#121215] border border-gray-800 rounded-2xl p-6 space-y-4">
                                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                    <Gamepad2 className="w-4 h-4 text-[#ff6600]" />
                                    <span>FLIGHT &amp; SENSITIVITY CONFIGURATION</span>
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div className="bg-black/40 border border-white/5 p-3 rounded-xl space-y-2">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-300">Mouse Sensitivity X</span>
                                            <span className="text-[#ff6600] font-bold">{getPrefVal('O_MOUSE_SENS_X') || '100'}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="10"
                                            max="300"
                                            value={getPrefVal('O_MOUSE_SENS_X') || '100'}
                                            onChange={(e) => setPrefVal('O_MOUSE_SENS_X', e.target.value)}
                                            className="w-full accent-[#ff6600]"
                                        />
                                    </div>

                                    <div className="bg-black/40 border border-white/5 p-3 rounded-xl space-y-2">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-300">Mouse Sensitivity Y</span>
                                            <span className="text-[#ff6600] font-bold">{getPrefVal('O_MOUSE_SENS_Y') || '100'}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="10"
                                            max="300"
                                            value={getPrefVal('O_MOUSE_SENS_Y') || '100'}
                                            onChange={(e) => setPrefVal('O_MOUSE_SENS_Y', e.target.value)}
                                            className="w-full accent-[#ff6600]"
                                        />
                                    </div>

                                    <div className="bg-black/40 border border-white/5 p-3 rounded-xl space-y-2">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-300">Joystick Speed</span>
                                            <span className="text-[#ff6600] font-bold">{getPrefVal('O_JOY_SPEED') || '7'}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="1"
                                            max="15"
                                            value={getPrefVal('O_JOY_SPEED') || '7'}
                                            onChange={(e) => setPrefVal('O_JOY_SPEED', e.target.value)}
                                            className="w-full accent-[#ff6600]"
                                        />
                                    </div>

                                    <label className="bg-black/40 border border-white/5 p-3 rounded-xl flex items-center justify-between cursor-pointer">
                                        <span className="text-xs text-gray-300">Invert Pitch (Mouse Y)</span>
                                        <input
                                            type="checkbox"
                                            checked={getPrefVal('O_INVERT_MOUSE') === '1' || getPrefVal('O_INVERT_MOUSE') === 'T'}
                                            onChange={(e) => setPrefVal('O_INVERT_MOUSE', e.target.checked ? '1' : '0')}
                                            className="accent-[#ff6600] w-4 h-4"
                                        />
                                    </label>

                                    <label className="bg-black/40 border border-white/5 p-3 rounded-xl flex items-center justify-between cursor-pointer">
                                        <span className="text-xs text-gray-300">Auto-Leveling</span>
                                        <input
                                            type="checkbox"
                                            checked={getPrefVal('O_AUTO_LEVEL') === '1' || getPrefVal('O_AUTO_LEVEL') === 'T'}
                                            onChange={(e) => setPrefVal('O_AUTO_LEVEL', e.target.checked ? '1' : '0')}
                                            className="accent-[#ff6600] w-4 h-4"
                                        />
                                    </label>

                                    <label className="bg-black/40 border border-white/5 p-3 rounded-xl flex items-center justify-between cursor-pointer">
                                        <span className="text-xs text-gray-300">OLMOD Mouse Roll Fix</span>
                                        <input
                                            type="checkbox"
                                            checked={getPrefBool('MOUSE_ROLL_FIX', true)}
                                            onChange={(e) => setPrefVal('MOUSE_ROLL_FIX', e.target.checked, true)}
                                            className="accent-[#ff6600] w-4 h-4"
                                        />
                                    </label>
                                </div>
                            </div>

                            {/* Keybindings Table from .xconfig */}
                            <div className="bg-[#121215] border border-gray-800 rounded-2xl p-6 space-y-6">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-800 pb-4">
                                    <div>
                                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                            <Keyboard className="w-4 h-4 text-[#ff6600]" />
                                            <span>INPUT &amp; CONTROLLER BINDINGS (.XCONFIG)</span>
                                        </h3>
                                        <p className="text-xs text-gray-400 mt-1">
                                            Click any button to listen for keyboard or mouse button input to rebind.
                                        </p>
                                    </div>
                                    {xconfig?.controllers && xconfig.controllers.length > 0 && (
                                        <div className="text-[11px] text-gray-400 bg-black/60 px-3 py-1.5 rounded-lg border border-white/10">
                                            Detected: {xconfig.controllers.join(', ')}
                                        </div>
                                    )}
                                </div>

                                {actionGroups.map(group => (
                                    <div key={group.title} className="space-y-3">
                                        <h4 className="text-xs font-bold text-[#ff6600] uppercase tracking-wider">
                                            {group.title}
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {group.actions.map(act => {
                                                const k1 = getActionBinding(act.id, 1);
                                                const k2 = getActionBinding(act.id, 2);

                                                return (
                                                    <div
                                                        key={act.id}
                                                        className="bg-black/40 border border-white/5 hover:border-white/15 p-3 rounded-xl flex items-center justify-between gap-3 text-xs"
                                                    >
                                                        <div className="truncate">
                                                            <div className="font-bold text-white">{act.label}</div>
                                                            <div className="text-[10px] text-gray-500 font-mono">{act.id}</div>
                                                        </div>

                                                        <div className="flex items-center gap-2 shrink-0">
                                                            {/* Primary Key Button */}
                                                            <button
                                                                onClick={() => setRebindAction({ actionName: act.id, slot: 1 })}
                                                                className={clsx(
                                                                    "px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border",
                                                                    k1 > 0 
                                                                        ? "bg-white/10 border-white/20 text-white hover:border-[#ff6600]" 
                                                                        : "bg-black/60 border-white/10 text-gray-500 hover:text-white"
                                                                )}
                                                            >
                                                                {getUnityKeyName(k1)}
                                                            </button>

                                                            {/* Secondary Key Button */}
                                                            <button
                                                                onClick={() => setRebindAction({ actionName: act.id, slot: 2 })}
                                                                className={clsx(
                                                                    "px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border",
                                                                    k2 > 0 
                                                                        ? "bg-white/10 border-white/20 text-white hover:border-[#ff6600]" 
                                                                        : "bg-black/60 border-white/10 text-gray-500 hover:text-white"
                                                                )}
                                                            >
                                                                {getUnityKeyName(k2)}
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* TAB 2: General & Audio */}
                    {activeTab === 'audio' && (
                        <div className="bg-[#121215] border border-gray-800 rounded-2xl p-6 space-y-6">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                <Volume2 className="w-4 h-4 text-[#ff6600]" />
                                <span>LANGUAGE &amp; AUDIO PREFERENCES</span>
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Language */}
                                <div className="space-y-2">
                                    <label className="text-xs text-gray-400 font-bold">In-Game Language (O_LANGUAGE)</label>
                                    <select
                                        value={getPrefVal('O_LANGUAGE') || '0'}
                                        onChange={(e) => setPrefVal('O_LANGUAGE', e.target.value)}
                                        className="w-full bg-black/60 border border-white/15 focus:border-[#ff6600] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                                    >
                                        <option value="0">0 — English</option>
                                        <option value="1">1 — Deutsch (German)</option>
                                        <option value="2">2 — Español (Spanish)</option>
                                        <option value="3">3 — Français (French)</option>
                                        <option value="4">4 — Русский (Russian)</option>
                                    </select>
                                </div>

                                {/* Speaker Mode */}
                                <div className="space-y-2">
                                    <label className="text-xs text-gray-400 font-bold">Speaker Setup (O_SPEAKER_MODE)</label>
                                    <select
                                        value={getPrefVal('O_SPEAKER_MODE') || '2'}
                                        onChange={(e) => setPrefVal('O_SPEAKER_MODE', e.target.value)}
                                        className="w-full bg-black/60 border border-white/15 focus:border-[#ff6600] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                                    >
                                        <option value="0">Stereo (2 Channels)</option>
                                        <option value="1">Quadraphonic (4 Channels)</option>
                                        <option value="2">Surround 5.1</option>
                                        <option value="3">Surround 7.1</option>
                                    </select>
                                </div>

                                {/* Sound Effects Volume */}
                                <div className="bg-black/40 border border-white/5 p-4 rounded-xl space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-300 font-bold">Sound Effects (SFX)</span>
                                        <span className="text-[#ff6600] font-bold">{getPrefVal('O_VOLUME_SFX') || '25'}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={getPrefVal('O_VOLUME_SFX') || '25'}
                                        onChange={(e) => setPrefVal('O_VOLUME_SFX', e.target.value)}
                                        className="w-full accent-[#ff6600]"
                                    />
                                </div>

                                {/* Music Volume */}
                                <div className="bg-black/40 border border-white/5 p-4 rounded-xl space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-300 font-bold">Music Volume</span>
                                        <span className="text-[#ff6600] font-bold">{getPrefVal('O_VOLUME_MUSIC') || '0'}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={getPrefVal('O_VOLUME_MUSIC') || '0'}
                                        onChange={(e) => setPrefVal('O_VOLUME_MUSIC', e.target.value)}
                                        className="w-full accent-[#ff6600]"
                                    />
                                </div>

                                {/* Voice Volume */}
                                <div className="bg-black/40 border border-white/5 p-4 rounded-xl space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-300 font-bold">Voice &amp; Comms Volume</span>
                                        <span className="text-[#ff6600] font-bold">{getPrefVal('O_VOLUME_VOICE') || '14'}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={getPrefVal('O_VOLUME_VOICE') || '14'}
                                        onChange={(e) => setPrefVal('O_VOLUME_VOICE', e.target.value)}
                                        className="w-full accent-[#ff6600]"
                                    />
                                </div>

                                {/* Ambient Volume */}
                                <div className="bg-black/40 border border-white/5 p-4 rounded-xl space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-300 font-bold">Ambient Environment Volume</span>
                                        <span className="text-[#ff6600] font-bold">{getPrefVal('O_VOLUME_AMBIENT') || '38'}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={getPrefVal('O_VOLUME_AMBIENT') || '38'}
                                        onChange={(e) => setPrefVal('O_VOLUME_AMBIENT', e.target.value)}
                                        className="w-full accent-[#ff6600]"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 3: Graphics & Video */}
                    {activeTab === 'graphics' && (
                        <div className="bg-[#121215] border border-gray-800 rounded-2xl p-6 space-y-6">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                <Monitor className="w-4 h-4 text-[#ff6600]" />
                                <span>GRAPHICS &amp; VISUAL PERFORMANCE</span>
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                                {/* Brightness */}
                                <div className="bg-black/40 border border-white/5 p-3 rounded-xl space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-300">Brightness</span>
                                        <span className="text-[#ff6600] font-bold">{getPrefVal('GFX_BRIGHTNESS') || '6'}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="12"
                                        value={getPrefVal('GFX_BRIGHTNESS') || '6'}
                                        onChange={(e) => setPrefVal('GFX_BRIGHTNESS', e.target.value)}
                                        className="w-full accent-[#ff6600]"
                                    />
                                </div>

                                {/* Texture Quality */}
                                <div className="bg-black/40 border border-white/5 p-3 rounded-xl space-y-2">
                                    <span className="text-gray-300">Texture Quality</span>
                                    <select
                                        value={getPrefVal('GFX_TEX_LEVEL') || '2'}
                                        onChange={(e) => setPrefVal('GFX_TEX_LEVEL', e.target.value)}
                                        className="w-full bg-black/60 border border-white/10 rounded-lg p-1.5 text-white"
                                    >
                                        <option value="0">Low</option>
                                        <option value="1">Medium</option>
                                        <option value="2">High / Ultra</option>
                                    </select>
                                </div>

                                {/* Shadow Quality */}
                                <div className="bg-black/40 border border-white/5 p-3 rounded-xl space-y-2">
                                    <span className="text-gray-300">Shadows Quality</span>
                                    <select
                                        value={getPrefVal('GFX_SHADOW_QUALITY') || '0'}
                                        onChange={(e) => setPrefVal('GFX_SHADOW_QUALITY', e.target.value)}
                                        className="w-full bg-black/60 border border-white/10 rounded-lg p-1.5 text-white"
                                    >
                                        <option value="0">Off / Simplified</option>
                                        <option value="1">Low</option>
                                        <option value="2">Medium</option>
                                        <option value="3">High</option>
                                    </select>
                                </div>

                                {/* Target Framerate */}
                                <div className="bg-black/40 border border-white/5 p-3 rounded-xl space-y-2">
                                    <span className="text-gray-300">Target Framerate (OLMOD)</span>
                                    <select
                                        value={getPrefVal('TARGET_FRAMERATE', true) || '0'}
                                        onChange={(e) => setPrefVal('TARGET_FRAMERATE', e.target.value, true)}
                                        className="w-full bg-black/60 border border-white/10 rounded-lg p-1.5 text-white"
                                    >
                                        <option value="0">0 — Uncapped / Unlimited</option>
                                        <option value="60">60 FPS</option>
                                        <option value="120">120 FPS</option>
                                        <option value="144">144 FPS</option>
                                        <option value="240">240 FPS</option>
                                        <option value="360">360 FPS</option>
                                    </select>
                                </div>

                                <label className="bg-black/40 border border-white/5 p-3 rounded-xl flex items-center justify-between cursor-pointer">
                                    <span className="text-gray-300">Vertical Sync (V-Sync)</span>
                                    <input
                                        type="checkbox"
                                        checked={getPrefVal('GFX_VSYNC') === '1'}
                                        onChange={(e) => setPrefVal('GFX_VSYNC', e.target.checked ? '1' : '0')}
                                        className="accent-[#ff6600] w-4 h-4"
                                    />
                                </label>

                                <label className="bg-black/40 border border-white/5 p-3 rounded-xl flex items-center justify-between cursor-pointer">
                                    <span className="text-gray-300">SMAA Anti-Aliasing</span>
                                    <input
                                        type="checkbox"
                                        checked={getPrefVal('GFX_SMAA') === '1'}
                                        onChange={(e) => setPrefVal('GFX_SMAA', e.target.checked ? '1' : '0')}
                                        className="accent-[#ff6600] w-4 h-4"
                                    />
                                </label>

                                <label className="bg-black/40 border border-white/5 p-3 rounded-xl flex items-center justify-between cursor-pointer">
                                    <span className="text-gray-300">Screen Space Reflections (SSR)</span>
                                    <input
                                        type="checkbox"
                                        checked={getPrefVal('GFX_SSR') === '1'}
                                        onChange={(e) => setPrefVal('GFX_SSR', e.target.checked ? '1' : '0')}
                                        className="accent-[#ff6600] w-4 h-4"
                                    />
                                </label>

                                <label className="bg-black/40 border border-white/5 p-3 rounded-xl flex items-center justify-between cursor-pointer">
                                    <span className="text-gray-300">Ambient Occlusion (SSAO)</span>
                                    <input
                                        type="checkbox"
                                        checked={getPrefVal('GFX_SSAO') === '1'}
                                        onChange={(e) => setPrefVal('GFX_SSAO', e.target.checked ? '1' : '0')}
                                        className="accent-[#ff6600] w-4 h-4"
                                    />
                                </label>

                                <label className="bg-black/40 border border-white/5 p-3 rounded-xl flex items-center justify-between cursor-pointer">
                                    <span className="text-gray-300">Bloom Lighting</span>
                                    <input
                                        type="checkbox"
                                        checked={getPrefVal('GFX_BLOOM') === '1'}
                                        onChange={(e) => setPrefVal('GFX_BLOOM', e.target.checked ? '1' : '0')}
                                        className="accent-[#ff6600] w-4 h-4"
                                    />
                                </label>
                            </div>
                        </div>
                    )}

                    {/* TAB 4: OLMOD Preferences */}
                    {activeTab === 'olmod' && (
                        <div className="bg-[#121215] border border-gray-800 rounded-2xl p-6 space-y-6">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-[#ff6600]" />
                                <span>OLMOD MULTIPLAYER &amp; HUD ENHANCEMENTS</span>
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                {/* Taunt Volume */}
                                <div className="bg-black/40 border border-white/5 p-4 rounded-xl space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-300 font-bold">Audio Taunt In-Game Volume</span>
                                        <span className="text-[#ff6600] font-bold">{getPrefVal('MP_AUDIOTAUNT_VOLUME', true) || '21'}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={getPrefVal('MP_AUDIOTAUNT_VOLUME', true) || '21'}
                                        onChange={(e) => setPrefVal('MP_AUDIOTAUNT_VOLUME', e.target.value, true)}
                                        className="w-full accent-[#ff6600]"
                                    />
                                </div>

                                {/* Lag Compensation */}
                                <div className="bg-black/40 border border-white/5 p-4 rounded-xl space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-300 font-bold">Lag Compensation Level</span>
                                        <span className="text-[#ff6600] font-bold">Level {getPrefVal('MP_PM_LAG_COMPENSATION', true) || '3'}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="5"
                                        value={getPrefVal('MP_PM_LAG_COMPENSATION', true) || '3'}
                                        onChange={(e) => setPrefVal('MP_PM_LAG_COMPENSATION', e.target.value, true)}
                                        className="w-full accent-[#ff6600]"
                                    />
                                </div>

                                <label className="bg-black/40 border border-white/5 p-3 rounded-xl flex items-center justify-between cursor-pointer">
                                    <span className="text-gray-300">Enable Combat Audio Taunts</span>
                                    <input
                                        type="checkbox"
                                        checked={getPrefBool('MP_AUDIOTAUNTS_ACTIVE', true)}
                                        onChange={(e) => setPrefVal('MP_AUDIOTAUNTS_ACTIVE', e.target.checked, true)}
                                        className="accent-[#ff6600] w-4 h-4"
                                    />
                                </label>

                                <label className="bg-black/40 border border-white/5 p-3 rounded-xl flex items-center justify-between cursor-pointer">
                                    <span className="text-gray-300">Show FPS Counter (Framerate)</span>
                                    <input
                                        type="checkbox"
                                        checked={getPrefBool('MP_PM_SHOWFRAMERATE', true)}
                                        onChange={(e) => setPrefVal('MP_PM_SHOWFRAMERATE', e.target.checked, true)}
                                        className="accent-[#ff6600] w-4 h-4"
                                    />
                                </label>

                                <label className="bg-black/40 border border-white/5 p-3 rounded-xl flex items-center justify-between cursor-pointer">
                                    <span className="text-gray-300">Show HUD Velocity (Speedometer)</span>
                                    <input
                                        type="checkbox"
                                        checked={getPrefBool('MP_PM_SHOWHUDVELOCITY', true)}
                                        onChange={(e) => setPrefVal('MP_PM_SHOWHUDVELOCITY', e.target.checked, true)}
                                        className="accent-[#ff6600] w-4 h-4"
                                    />
                                </label>

                                <label className="bg-black/40 border border-white/5 p-3 rounded-xl flex items-center justify-between cursor-pointer">
                                    <span className="text-gray-300">Distinct Kill Confirmation Sound</span>
                                    <input
                                        type="checkbox"
                                        checked={getPrefBool('MP_DISTINCT_KILL_SOUND', true)}
                                        onChange={(e) => setPrefVal('MP_DISTINCT_KILL_SOUND', e.target.checked, true)}
                                        className="accent-[#ff6600] w-4 h-4"
                                    />
                                </label>

                                <label className="bg-black/40 border border-white/5 p-3 rounded-xl flex items-center justify-between cursor-pointer">
                                    <span className="text-gray-300">Floating Damage Numbers</span>
                                    <input
                                        type="checkbox"
                                        checked={getPrefBool('MP_DAMAGE_NUMBERS', true)}
                                        onChange={(e) => setPrefVal('MP_DAMAGE_NUMBERS', e.target.checked, true)}
                                        className="accent-[#ff6600] w-4 h-4"
                                    />
                                </label>

                                <label className="bg-black/40 border border-white/5 p-3 rounded-xl flex items-center justify-between cursor-pointer">
                                    <span className="text-gray-300">Directional Threat Warnings</span>
                                    <input
                                        type="checkbox"
                                        checked={getPrefBool('MP_PM_DIRECTIONAL_WARNINGS', true)}
                                        onChange={(e) => setPrefVal('MP_PM_DIRECTIONAL_WARNINGS', e.target.checked, true)}
                                        className="accent-[#ff6600] w-4 h-4"
                                    />
                                </label>
                            </div>
                        </div>
                    )}

                    {/* TAB 5: Raw Settings Search & Table */}
                    {activeTab === 'raw' && (
                        <div className="bg-[#121215] border border-gray-800 rounded-2xl p-6 space-y-4">
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                                <div className="relative flex-grow max-w-md">
                                    <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
                                    <input
                                        type="text"
                                        value={rawSearchQuery}
                                        onChange={(e) => setRawSearchQuery(e.target.value)}
                                        placeholder="Search any setting key or value..."
                                        className="w-full bg-black/80 border border-white/10 focus:border-[#ff6600] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none"
                                    />
                                </div>

                                <div className="flex items-center gap-1.5 bg-black/60 p-1 rounded-xl border border-white/10 text-xs">
                                    <button
                                        onClick={() => setRawFilterSource('all')}
                                        className={clsx("px-3 py-1 rounded-lg", rawFilterSource === 'all' ? "bg-[#ff6600] text-black font-bold" : "text-gray-400 hover:text-white")}
                                    >
                                        All
                                    </button>
                                    <button
                                        onClick={() => setRawFilterSource('xprefs')}
                                        className={clsx("px-3 py-1 rounded-lg", rawFilterSource === 'xprefs' ? "bg-[#ff6600] text-black font-bold" : "text-gray-400 hover:text-white")}
                                    >
                                        .xprefs
                                    </button>
                                    <button
                                        onClick={() => setRawFilterSource('xprefsmod')}
                                        className={clsx("px-3 py-1 rounded-lg", rawFilterSource === 'xprefsmod' ? "bg-[#ff6600] text-black font-bold" : "text-gray-400 hover:text-white")}
                                    >
                                        .xprefsmod
                                    </button>
                                </div>
                            </div>

                            <div className="max-h-[500px] overflow-y-auto border border-gray-800 rounded-xl">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-black/60 text-gray-400 uppercase text-[10px] tracking-wider sticky top-0 border-b border-gray-800">
                                        <tr>
                                            <th className="p-3">Source</th>
                                            <th className="p-3">Key</th>
                                            <th className="p-3">Type</th>
                                            <th className="p-3">Value</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800/60 font-mono">
                                        {allRawEntries.map(entry => (
                                            <tr key={`${entry.source}:${entry.key}`} className="hover:bg-white/[0.02]">
                                                <td className="p-3 text-[10px] text-gray-500">
                                                    {entry.source}
                                                </td>
                                                <td className="p-3 font-bold text-white">
                                                    {entry.key}
                                                </td>
                                                <td className="p-3">
                                                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/5 border border-white/10 text-gray-400">
                                                        {entry.type}
                                                    </span>
                                                </td>
                                                <td className="p-3">
                                                    <input
                                                        type="text"
                                                        value={entry.value}
                                                        onChange={(e) => setPrefVal(entry.key, e.target.value, entry.source === 'xprefsmod')}
                                                        className="bg-black/60 border border-white/10 focus:border-[#ff6600] rounded px-2 py-1 text-xs text-white w-48 font-mono focus:outline-none"
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Bottom Save & Discard Action Bar */}
                    <div className="bg-[#121215] border border-gray-800 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-4 z-20 backdrop-blur-md">
                        <div className="flex items-center gap-2 text-xs">
                            {dirtyCount > 0 ? (
                                <span className="text-[#ff6600] font-bold flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-[#ff6600] animate-ping"></span>
                                    <span>{dirtyCount} unsaved {dirtyCount === 1 ? 'change' : 'changes'}</span>
                                </span>
                            ) : (
                                <span className="text-gray-500">No unsaved changes</span>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            {dirtyCount > 0 && (
                                <button
                                    onClick={handleDiscard}
                                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-400 hover:text-white transition-all"
                                >
                                    Discard
                                </button>
                            )}

                            <button
                                onClick={handleSaveAll}
                                disabled={dirtyCount === 0 || loading || gameRunning}
                                className={clsx(
                                    "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg",
                                    (dirtyCount === 0 || gameRunning)
                                        ? "bg-gray-800 text-gray-500 cursor-not-allowed shadow-none"
                                        : "bg-[#ff6600] hover:bg-[#ff8533] text-black shadow-[#ff6600]/25"
                                )}
                                title={gameRunning ? "Close Overload to change settings" : "Write changes with mandatory backup"}
                            >
                                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                <span>Save Settings</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Key Rebind Listener Modal */}
            {rebindAction && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#16161a] border border-[#ff6600]/60 rounded-2xl p-6 max-w-md w-full text-center space-y-4 shadow-2xl shadow-[#ff6600]/10">
                        <div className="w-12 h-12 mx-auto rounded-full bg-[#ff6600]/10 border border-[#ff6600]/40 flex items-center justify-center text-[#ff6600] animate-pulse">
                            <Keyboard className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-white brand-font tracking-wider">
                                PRESS ANY KEY OR MOUSE BUTTON
                            </h3>
                            <p className="text-xs text-[#ff6600] font-bold mt-1">
                                {rebindAction.actionName} &bull; Slot {rebindAction.slot}
                            </p>
                            <p className="text-[11px] text-gray-400 mt-2">
                                Press any keyboard key or click any mouse button to assign. Press <code className="text-white">Esc</code> to cancel.
                            </p>
                        </div>
                        <button
                            onClick={() => setRebindAction(null)}
                            className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-gray-300"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PilotSettingsPanel;
