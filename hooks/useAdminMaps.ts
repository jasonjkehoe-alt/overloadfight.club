import React, { useState } from 'react';
import { addAdminMap, fetchAdminMapCount, syncAdminMaps } from '../services/apiService';

// Admin map database management: catalog count, upstream sync, and the
// add-custom-map form.
export function useAdminMaps() {
    const [syncingMaps, setSyncingMaps] = useState(false);
    const [syncResult, setSyncResult] = useState<string | null>(null);
    const [totalMapsCount, setTotalMapsCount] = useState<number | null>(null);
    const [newMapName, setNewMapName] = useState('');
    const [newMapAuthor, setNewMapAuthor] = useState('');
    const [newMapSize, setNewMapSize] = useState('medium');
    const [newMapMaxPlayers, setNewMapMaxPlayers] = useState(8);
    const [newMapSupportsCtf, setNewMapSupportsCtf] = useState(false);
    const [newMapStyle, setNewMapStyle] = useState('mixed');
    const [newMapDownloadUrl, setNewMapDownloadUrl] = useState('');
    const [newMapImageUrl, setNewMapImageUrl] = useState('');
    const [addingMap, setAddingMap] = useState(false);
    const [mapMessage, setMapMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    const fetchMapCount = async () => {
        try {
            const data = await fetchAdminMapCount();
            setTotalMapsCount(data.count || 0);
        } catch (e) {
            console.error("Failed to fetch map count", e);
        }
    };

    const handleSyncMaps = async () => {
        setSyncingMaps(true);
        setSyncResult(null);
        try {
            const data = await syncAdminMaps();
            setSyncResult(`Synced ${data.count} maps successfully from overloadmaps.com`);
            fetchMapCount();
        } catch (err: any) {
            setSyncResult(`Sync failed: ${err.response?.data?.error || err.message}`);
        } finally {
            setSyncingMaps(false);
        }
    };

    const handleAddMap = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMapName.trim()) {
            setMapMessage({ text: 'Map name is required', type: 'error' });
            return;
        }
        setAddingMap(true);
        setMapMessage(null);
        try {
            await addAdminMap({
                name: newMapName.trim(),
                author: newMapAuthor.trim() || 'Unknown',
                size: newMapSize,
                max_players: newMapMaxPlayers,
                best_team_size: Math.ceil(newMapMaxPlayers / 2),
                supports_ctf: newMapSupportsCtf,
                style: newMapStyle,
                remote_url: newMapDownloadUrl.trim() || null,
                remote_image_url: newMapImageUrl.trim() || null
            });
            setMapMessage({ text: `Map "${newMapName}" successfully registered!`, type: 'success' });
            setNewMapName('');
            setNewMapAuthor('');
            setNewMapDownloadUrl('');
            setNewMapImageUrl('');
            fetchMapCount();
        } catch (err: any) {
            setMapMessage({ text: err.response?.data?.error || 'Failed to add map', type: 'error' });
        } finally {
            setAddingMap(false);
        }
    };

    return {
        syncingMaps,
        syncResult,
        totalMapsCount,
        newMapName,
        setNewMapName,
        newMapAuthor,
        setNewMapAuthor,
        newMapSize,
        setNewMapSize,
        newMapMaxPlayers,
        setNewMapMaxPlayers,
        newMapSupportsCtf,
        setNewMapSupportsCtf,
        newMapStyle,
        setNewMapStyle,
        newMapDownloadUrl,
        setNewMapDownloadUrl,
        newMapImageUrl,
        setNewMapImageUrl,
        addingMap,
        mapMessage,
        fetchMapCount,
        handleSyncMaps,
        handleAddMap
    };
}

export type AdminMaps = ReturnType<typeof useAdminMaps>;
