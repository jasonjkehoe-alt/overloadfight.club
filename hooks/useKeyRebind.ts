import React, { useState, useEffect } from 'react';
import { useDialog } from './useDialog';
import { browserEventToUnityKeyCode } from '../utils/pilotSettingsBridge';

// PilotSettingsPanel's key rebind dialog: which binding is being captured, the
// dialog's keyboard contract, and the capture listener that writes the new key
// into the pending bindings.
export function useKeyRebind(
    setPendingBindings: React.Dispatch<React.SetStateAction<Record<string, { slot: 1 | 2; keyCode: number }>>>
) {
    // Key rebind modal / listener
    const [rebindAction, setRebindAction] = useState<{ actionName: string; slot: 1 | 2 } | null>(null);
    // The rebind listener below sees every key first and closes on Escape itself;
    // the hook adds the focus handling and the label.
    const rebindDialog = useDialog(rebindAction !== null, () => setRebindAction(null));

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

    return { rebindAction, setRebindAction, rebindDialog };
}
