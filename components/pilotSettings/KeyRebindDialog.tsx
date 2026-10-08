import React from 'react';
import { Keyboard } from 'lucide-react';
import type { useKeyRebind } from '../../hooks/useKeyRebind';

interface KeyRebindDialogProps {
    rebindAction: { actionName: string; slot: 1 | 2 };
    setRebindAction: (action: null) => void;
    rebindDialog: ReturnType<typeof useKeyRebind>['rebindDialog'];
}

// Key Rebind Listener Modal. The dialog hook and the capture listener live in
// hooks/useKeyRebind.ts; this renders the panel they act on.
export const KeyRebindDialog: React.FC<KeyRebindDialogProps> = ({ rebindAction, setRebindAction, rebindDialog }) => {
    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div {...rebindDialog.props} className="bg-[#16161a] border border-[#ff6600]/60 rounded-2xl p-6 max-w-md w-full text-center space-y-4 shadow-2xl shadow-[#ff6600]/10">
                <div className="w-12 h-12 mx-auto rounded-full bg-[#ff6600]/10 border border-[#ff6600]/40 flex items-center justify-center text-[#ff6600] animate-pulse">
                    <Keyboard className="w-6 h-6" />
                </div>
                <div>
                    <h3 id={rebindDialog.titleId} className="text-base font-bold text-white brand-font tracking-wider">
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
    );
};
