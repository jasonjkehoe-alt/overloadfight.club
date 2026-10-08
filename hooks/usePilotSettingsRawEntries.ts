import { useState, useMemo } from 'react';
import { ParsedXPrefs, XPrefsEntry } from '../utils/pilotSettingsBridge';

export type RawEntry = { key: string; value: string; type: string; source: 'xprefs' | 'xprefsmod' };

// The All Settings tab of PilotSettingsPanel: search text, source filter and
// the filtered, sorted entry list (pending values shown in place of saved ones).
export function usePilotSettingsRawEntries({
    xprefs,
    xprefsmod,
    pendingPrefs,
    pendingMod
}: {
    xprefs: ParsedXPrefs | null;
    xprefsmod: ParsedXPrefs | null;
    pendingPrefs: Record<string, string>;
    pendingMod: Record<string, string>;
}) {
    // Raw search query
    const [rawSearchQuery, setRawSearchQuery] = useState('');
    const [rawFilterSource, setRawFilterSource] = useState<'all' | 'xprefs' | 'xprefsmod'>('all');

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

    return { rawSearchQuery, setRawSearchQuery, rawFilterSource, setRawFilterSource, allRawEntries };
}
