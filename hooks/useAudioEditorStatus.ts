import { useState } from 'react';

export type SetMessage = React.Dispatch<React.SetStateAction<string | null>>;

// AudioEditor: error / success banners and the diagnostics log.
export function useAudioEditorStatus() {
    const [error, setError] = useState<string | null>(null);
    const [exportSuccess, setExportSuccess] = useState<string | null>(null);
    const [debugLog, setDebugLog] = useState<string[]>([]);

    const addLog = (msg: string) => {
        console.log(`[AudioEditor] ${msg}`);
        setDebugLog(prev => [...prev.slice(-49), `${new Date().toISOString().split('T')[1].split('.')[0]} ${msg}`]);
    };

    return { error, setError, exportSuccess, setExportSuccess, debugLog, addLog };
}
