import React from 'react';
import {
    PilotAutoselectConfig,
    AutoselectLogicSwitches,
    getDefaultAutoselectConfig
} from '../utils/pilotSettingsBridge';
import type { usePilotSettings } from './usePilotSettings';

// Edits to PilotSettingsPanel's autoselect config: priority order, the two
// inclusion toggles per weapon, the logic switches and the factory reset.
export function usePilotSettingsAutoselect(
    autoselectConfig: PilotAutoselectConfig | null,
    setAutoselectConfig: React.Dispatch<React.SetStateAction<PilotAutoselectConfig | null>>,
    setStatusMessage: ReturnType<typeof usePilotSettings>['setStatusMessage']
) {
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

    return {
        movePrimaryPriority,
        moveSecondaryPriority,
        togglePrimaryNeverSelect,
        togglePrimaryCycle,
        toggleSecondaryNeverSelect,
        toggleSecondaryCycle,
        toggleAutoselectSwitch,
        handleResetAutoselectDefaults
    };
}
