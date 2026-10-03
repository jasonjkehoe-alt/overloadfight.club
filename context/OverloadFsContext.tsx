import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { GameTauntItem } from '../components/OverloadVault';
import {
    isFileSystemAccessSupported,
    getStoredDirectoryHandle,
    verifyDirectoryPermission,
    clearStoredDirectoryHandle,
    pickOverloadDirectory,
    listPilotsClient,
    scanGameTauntsClient,
    getPilotDataClient
} from '../utils/overloadFsBridge';

interface OverloadFsContextType {
    // Mode
    isSupported: boolean;
    isServerNative: boolean; // Server itself has direct access (e.g. running on PC)
    isClientConnected: boolean; // Browser has connected local PC folder
    isConnecting: boolean;
    folderName: string;

    // Pilot & Data
    pilots: string[];
    activePilot: string;
    setActivePilot: (p: string) => void;
    vaultTaunts: GameTauntItem[];
    dirHandle: FileSystemDirectoryHandle | null;

    // Actions
    connectLocalFolder: () => Promise<boolean>;
    disconnectLocalFolder: () => Promise<void>;
    refreshData: () => Promise<void>;
}

const OverloadFsContext = createContext<OverloadFsContextType | null>(null);

export const OverloadFsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isSupported] = useState<boolean>(() => isFileSystemAccessSupported());
    const [isServerNative, setIsServerNative] = useState(false);
    const [isClientConnected, setIsClientConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [folderName, setFolderName] = useState('');
    const [dirHandle, setDirHandle] = useState<FileSystemDirectoryHandle | null>(null);

    const [pilots, setPilots] = useState<string[]>([]);
    const [activePilot, setActivePilot] = useState<string>('Soup');
    const [vaultTaunts, setVaultTaunts] = useState<GameTauntItem[]>([]);

    // 1. Initial check: Does server have native access, or do we have a stored handle?
    const checkStatus = useCallback(async () => {
        try {
            // Check server status
            const res = await fetch('/api/overload/status');
            if (res.ok) {
                const data = await res.json();
                if (data.installed && data.pilots && data.pilots.length > 0) {
                    setIsServerNative(true);
                    setPilots(data.pilots);
                    if (data.activePilot) setActivePilot(data.activePilot);
                    setFolderName(data.gamePath || 'Overload');

                    // Fetch server taunts
                    const tRes = await fetch('/api/overload/taunts');
                    if (tRes.ok) {
                        const tData = await tRes.json();
                        setVaultTaunts(tData.taunts || []);
                    }
                    return;
                }
            }
        } catch {
            // server not reachable or error
        }

        // Server does NOT have native access (running remotely on Synology)
        setIsServerNative(false);

        // Check if we have a stored handle in IndexedDB
        if (isSupported) {
            try {
                const storedHandle = await getStoredDirectoryHandle();
                if (storedHandle) {
                    // Check if permission is already granted
                    const permitted = await verifyDirectoryPermission(storedHandle, false);
                    if (permitted) {
                        setDirHandle(storedHandle);
                        setFolderName(storedHandle.name);
                        setIsClientConnected(true);

                        const pList = await listPilotsClient(storedHandle);
                        setPilots(pList);
                        if (pList.includes('Soup')) {
                            setActivePilot('Soup');
                        } else if (pList.length > 0) {
                            setActivePilot(pList[0]);
                        }

                        const tList = await scanGameTauntsClient(storedHandle);
                        setVaultTaunts(tList);
                    }
                }
            } catch (err) {
                console.warn('Failed to load stored directory handle:', err);
            }
        }
    }, [isSupported]);

    useEffect(() => {
        checkStatus();
    }, [checkStatus]);

    // Connect to local directory via browser folder picker
    const connectLocalFolder = async (): Promise<boolean> => {
        if (!isSupported) {
            alert('Your browser does not support the File System Access API. Please use Google Chrome or Microsoft Edge.');
            return false;
        }

        setIsConnecting(true);
        try {
            const handle = await pickOverloadDirectory();
            setDirHandle(handle);
            setFolderName(handle.name);
            setIsClientConnected(true);

            // Read pilots
            const pList = await listPilotsClient(handle);
            setPilots(pList);
            if (pList.includes('Soup')) {
                setActivePilot('Soup');
            } else if (pList.length > 0) {
                setActivePilot(pList[0]);
            }

            // Read taunts
            const tList = await scanGameTauntsClient(handle);
            setVaultTaunts(tList);

            setIsConnecting(false);
            return true;
        } catch (err: any) {
            setIsConnecting(false);
            if (err.name !== 'AbortError') {
                console.error('Failed to connect Overload directory:', err);
                alert(`Folder connection failed: ${err.message}`);
            }
            return false;
        }
    };

    // Disconnect
    const disconnectLocalFolder = async () => {
        await clearStoredDirectoryHandle();
        setDirHandle(null);
        setIsClientConnected(false);
        setFolderName('');
        setPilots([]);
        setVaultTaunts([]);
    };

    // Refresh data from active source
    const refreshData = async () => {
        if (isServerNative) {
            await checkStatus();
        } else if (dirHandle) {
            try {
                const permitted = await verifyDirectoryPermission(dirHandle, false);
                if (permitted) {
                    const pList = await listPilotsClient(dirHandle);
                    setPilots(pList);
                    const tList = await scanGameTauntsClient(dirHandle);
                    setVaultTaunts(tList);
                }
            } catch (err) {
                console.warn('Failed to refresh local folder data:', err);
            }
        }
    };

    return (
        <OverloadFsContext.Provider
            value={{
                isSupported,
                isServerNative,
                isClientConnected,
                isConnecting,
                folderName,
                pilots,
                activePilot,
                setActivePilot,
                vaultTaunts,
                dirHandle,
                connectLocalFolder,
                disconnectLocalFolder,
                refreshData
            }}
        >
            {children}
        </OverloadFsContext.Provider>
    );
};

export const useOverloadFs = () => {
    const ctx = useContext(OverloadFsContext);
    if (!ctx) {
        throw new Error('useOverloadFs must be used within an OverloadFsProvider');
    }
    return ctx;
};
