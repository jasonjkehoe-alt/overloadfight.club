import { useState } from 'react';
import { fetchAdminSetting, saveAdminSetting } from '../services/apiService';

// Admin dashboard config: the "Show Archive" (show_cold_storage) setting.
export function useAdminSettings() {
    const [showColdStorage, setShowColdStorage] = useState(false);

    const fetchSettings = async () => {
        try {
            const coldData = await fetchAdminSetting('show_cold_storage');
            setShowColdStorage(coldData.value === 'true');
        } catch (e) {
            console.error("Failed to fetch settings");
        }
    };

    const saveSetting = async (key: string, value: string) => {
        try {
            await saveAdminSetting(key, value);
        } catch (e) {
            alert(`Failed to save ${key}`);
        }
    };

    return { showColdStorage, setShowColdStorage, fetchSettings, saveSetting };
}
