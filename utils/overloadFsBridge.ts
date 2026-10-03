import { md5 } from './md5';
import { GameTauntItem } from '../components/OverloadVault';

// Database & Store constants for storing FileSystemDirectoryHandle
const DB_NAME = 'overload_fs_storage';
const DB_VERSION = 1;
const STORE_NAME = 'handles';
const HANDLE_KEY = 'overload_root';

/**
 * Open or create the IndexedDB store for storing FileSystemDirectoryHandles
 */
function openFsDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

/**
 * Checks if the browser supports the File System Access API
 */
export function isFileSystemAccessSupported(): boolean {
    return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

/**
 * Save directory handle into IndexedDB
 */
export async function saveStoredDirectoryHandle(handle: FileSystemDirectoryHandle): Promise<void> {
    const db = await openFsDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(handle, HANDLE_KEY);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

/**
 * Retrieve previously stored directory handle from IndexedDB
 */
export async function getStoredDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
    try {
        const db = await openFsDb();
        return new Promise((resolve) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const req = store.get(HANDLE_KEY);
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => resolve(null);
        });
    } catch {
        return null;
    }
}

/**
 * Remove stored directory handle from IndexedDB
 */
export async function clearStoredDirectoryHandle(): Promise<void> {
    try {
        const db = await openFsDb();
        return new Promise((resolve) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            store.delete(HANDLE_KEY);
            tx.oncomplete = () => resolve();
            tx.onerror = () => resolve();
        });
    } catch {
        // ignore
    }
}

/**
 * Verify or prompt for readwrite permission on a directory handle
 */
export async function verifyDirectoryPermission(handle: FileSystemDirectoryHandle, readWrite = true): Promise<boolean> {
    try {
        const options: FileSystemHandlePermissionDescriptor = {
            mode: readWrite ? 'readwrite' : 'read'
        };
        // Check current permission state
        // @ts-ignore
        if ((await handle.queryPermission(options)) === 'granted') {
            return true;
        }
        // Request user interaction prompt
        // @ts-ignore
        if ((await handle.requestPermission(options)) === 'granted') {
            return true;
        }
    } catch (e) {
        console.warn('Error querying permission for directory handle:', e);
    }
    return false;
}

/**
 * Prompt the user to select their Overload directory (AppData\LocalLow\Revival\Overload)
 */
export async function pickOverloadDirectory(): Promise<FileSystemDirectoryHandle> {
    if (!isFileSystemAccessSupported()) {
        throw new Error('Your browser does not support the File System Access API. Please use Google Chrome or Microsoft Edge.');
    }

    // @ts-ignore
    const dirHandle: FileSystemDirectoryHandle = await window.showDirectoryPicker({
        mode: 'readwrite',
        startIn: 'documents'
    });

    // Verify it's either the Overload folder or contains Overload
    let actualHandle = dirHandle;
    let hasOverloadFiles = false;

    // Check if this directory directly has .extendedconfig files
    for await (const entry of (actualHandle as any).values()) {
        if (entry.name.toLowerCase().endsWith('.extendedconfig') || entry.name === 'AudioTaunts') {
            hasOverloadFiles = true;
            break;
        }
    }

    // If not, check if user picked 'Revival' and there's an 'Overload' subfolder
    if (!hasOverloadFiles) {
        try {
            const sub = await actualHandle.getDirectoryHandle('Overload', { create: false });
            actualHandle = sub;
            hasOverloadFiles = true;
        } catch {
            // not a subfolder
        }
    }

    // Save for future visits
    await saveStoredDirectoryHandle(actualHandle);
    return actualHandle;
}

/**
 * List all pilots in the connected Overload directory
 */
export async function listPilotsClient(dirHandle: FileSystemDirectoryHandle): Promise<string[]> {
    const pilots: string[] = [];
    try {
        for await (const entry of (dirHandle as any).values()) {
            if (entry.kind === 'file' && entry.name.toLowerCase().endsWith('.extendedconfig')) {
                const name = entry.name.substring(0, entry.name.length - '.extendedconfig'.length);
                pilots.push(name);
            }
        }
    } catch (err) {
        console.error('Failed to list pilots from directory handle:', err);
    }
    return pilots.sort((a, b) => a.localeCompare(b));
}

/**
 * Read pilot extendedconfig from directory handle
 */
export async function getPilotDataClient(
    dirHandle: FileSystemDirectoryHandle,
    pilotName: string
): Promise<{ pilotName: string; selectedTaunts: string[]; keybinds: number[]; lastModified: number } | null> {
    try {
        const fileHandle = await dirHandle.getFileHandle(`${pilotName}.extendedconfig`, { create: false });
        const file = await fileHandle.getFile();
        const content = await file.text();

        const selectedTaunts: string[] = [];
        const keybinds: number[] = [];

        const tauntMatch = content.match(/\[SECTION:\s*AUDIOTAUNT_SELECTED_TAUNTS\]([\s\S]*?)\[\/END\]/);
        if (tauntMatch) {
            const lines = tauntMatch[1].split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
            selectedTaunts.push(...lines);
        }

        const keyMatch = content.match(/\[SECTION:\s*AUDIOTAUNT_KEYBINDS\]([\s\S]*?)\[\/END\]/);
        if (keyMatch) {
            const lines = keyMatch[1].split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
            lines.forEach(k => {
                const parsed = parseInt(k, 10);
                if (!isNaN(parsed)) keybinds.push(parsed);
            });
        }

        return {
            pilotName,
            selectedTaunts,
            keybinds,
            lastModified: file.lastModified
        };
    } catch (err) {
        console.error(`Failed to read pilot ${pilotName} config:`, err);
        return null;
    }
}

/**
 * Extract Vorbis TITLE comment tag from OGG file header
 */
export async function extractVorbisTitleClient(file: File): Promise<string | null> {
    try {
        const slice = file.slice(0, 8192);
        const buf = await slice.arrayBuffer();
        const str = new TextDecoder('latin1').decode(buf);
        const match = str.match(/TITLE=([^\x00\r\n\x01-\x1F]+)/i);
        if (match && match[1] && match[1].trim()) {
            return match[1].trim();
        }
    } catch {
        // ignore
    }
    return null;
}

/**
 * Scan all OGG files in AudioTaunts/ and AudioTaunts/external/
 */
export async function scanGameTauntsClient(dirHandle: FileSystemDirectoryHandle): Promise<GameTauntItem[]> {
    const items: GameTauntItem[] = [];

    let audioTauntsHandle: FileSystemDirectoryHandle | null = null;
    try {
        audioTauntsHandle = await dirHandle.getDirectoryHandle('AudioTaunts', { create: false });
    } catch {
        return items;
    }

    // Process a directory handle
    const processDir = async (folderHandle: FileSystemDirectoryHandle, location: 'user' | 'external') => {
        try {
            for await (const entry of (folderHandle as any).values()) {
                if (entry.kind !== 'file' || !entry.name.toLowerCase().endsWith('.ogg')) continue;

                const fileHandle = entry as FileSystemFileHandle;
                const file = await fileHandle.getFile();
                const f = entry.name;
                const relativePath = location === 'external' ? `external/${f}` : f;
                let id = '';
                let cleanName = '';

                // Pattern 1: <hash>-<name>.ogg
                const hashPrefixMatch = f.match(/^([a-fA-F0-9]{32})-(.+)\.ogg$/i);
                if (hashPrefixMatch) {
                    id = hashPrefixMatch[1].toLowerCase();
                    cleanName = hashPrefixMatch[2];
                } else {
                    // Pattern 2: <hash>.ogg
                    const pureHashMatch = f.match(/^([a-fA-F0-9]{32})\.ogg$/i);
                    if (pureHashMatch) {
                        id = pureHashMatch[1].toLowerCase();
                        const vorbis = await extractVorbisTitleClient(file);
                        cleanName = vorbis || id.substring(0, 10);
                    } else {
                        // Pattern 3: Calculate MD5
                        const buf = await file.arrayBuffer();
                        id = md5(buf);
                        cleanName = f.replace(/\.ogg$/i, '');
                    }
                }

                // Create local Blob URL for instantaneous playback
                const audioUrl = URL.createObjectURL(file);

                items.push({
                    id,
                    cleanName,
                    rawFileName: f,
                    relativePath,
                    location,
                    sizeBytes: file.size,
                    modifiedTime: file.lastModified,
                    audioUrl
                });
            }
        } catch (err) {
            console.warn(`Error scanning directory (${location}):`, err);
        }
    };

    // Scan user taunts
    await processDir(audioTauntsHandle, 'user');

    // Scan external taunts
    try {
        const externalHandle = await audioTauntsHandle.getDirectoryHandle('external', { create: false });
        await processDir(externalHandle, 'external');
    } catch {
        // no external dir
    }

    return items;
}

/**
 * Apply Pilot Taunts directly to Windows local folder with MANDATORY AUTOMATIC BACKUP
 */
export async function applyPilotTauntsClient(
    dirHandle: FileSystemDirectoryHandle,
    pilotName: string,
    newTauntHashes: (string | null)[],
    audioBlobsToInstall: Array<{ name: string; blob: Blob; hash?: string }> = []
): Promise<{
    success: boolean;
    backupFileName: string;
    promotedCount: number;
    installedCount: number;
    error?: string;
}> {
    try {
        // 1. Ensure Pilot config exists
        let configFileHandle: FileSystemFileHandle;
        try {
            configFileHandle = await dirHandle.getFileHandle(`${pilotName}.extendedconfig`, { create: false });
        } catch {
            return {
                success: false,
                backupFileName: '',
                promotedCount: 0,
                installedCount: 0,
                error: `Pilot config file "${pilotName}.extendedconfig" was not found in the connected Overload directory.`
            };
        }

        const configFile = await configFileHandle.getFile();
        const originalContent = await configFile.text();

        // 2. MANDATORY BACKUP: Ensure "Pilot Backup" directory exists
        const backupDirHandle = await dirHandle.getDirectoryHandle('Pilot Backup', { create: true });
        const now = new Date();
        const pad = (n: number) => String(n).padStart(2, '0');
        const timeStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
        const backupFileName = `${pilotName}_backup_${timeStr}.extendedconfig`;

        // Write primary timestamped backup
        const backupFileHandle = await backupDirHandle.getFileHandle(backupFileName, { create: true });
        const backupWritable = await (backupFileHandle as any).createWritable();
        await backupWritable.write(originalContent);
        await backupWritable.close();

        // Write .bak snapshot
        const bakFileHandle = await dirHandle.getFileHandle(`${pilotName}.extendedconfig.bak`, { create: true });
        const bakWritable = await (bakFileHandle as any).createWritable();
        await bakWritable.write(originalContent);
        await bakWritable.close();

        console.log(`[OverloadFsBridge] MANDATORY BACKUP CREATED: ${backupFileName}`);

        // 3. Ensure AudioTaunts folder exists
        const audioTauntsHandle = await dirHandle.getDirectoryHandle('AudioTaunts', { create: true });

        // 4. Install any new audio blobs directly into AudioTaunts/
        let installedCount = 0;
        for (const item of audioBlobsToInstall) {
            try {
                const buf = await item.blob.arrayBuffer();
                const hash = item.hash || md5(buf);
                const safeName = item.name.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30);
                const targetFilename = `${hash}-${safeName}.ogg`;

                const fileHandle = await audioTauntsHandle.getFileHandle(targetFilename, { create: true });
                const writable = await (fileHandle as any).createWritable();
                await writable.write(item.blob);
                await writable.close();
                installedCount++;
            } catch (installErr) {
                console.warn('Failed to install audio blob:', installErr);
            }
        }

        // 5. AUTO-PROMOTE OPPONENT TAUNTS:
        // If equipped hash is in external/, copy it to AudioTaunts/ so it remains equipped permanently
        let promotedCount = 0;
        try {
            const externalHandle = await audioTauntsHandle.getDirectoryHandle('external', { create: false });
            for (const hash of newTauntHashes) {
                if (!hash || hash === 'EMPTY') continue;
                for await (const entry of (externalHandle as any).values()) {
                    if (entry.kind === 'file' && entry.name.toLowerCase().endsWith('.ogg')) {
                        if (entry.name.toLowerCase().includes(hash.toLowerCase())) {
                            // Check if already in user AudioTaunts
                            let existsInUser = false;
                            try {
                                await audioTauntsHandle.getFileHandle(entry.name, { create: false });
                                existsInUser = true;
                            } catch {}

                            if (!existsInUser) {
                                const extFileHandle = entry as FileSystemFileHandle;
                                const extFile = await extFileHandle.getFile();
                                const newFileHandle = await audioTauntsHandle.getFileHandle(entry.name, { create: true });
                                const writable = await (newFileHandle as any).createWritable();
                                await writable.write(extFile);
                                await writable.close();
                                promotedCount++;
                            }
                        }
                    }
                }
            }
        } catch {
            // no external dir, ignore
        }

        // 6. Update [SECTION: AUDIOTAUNT_SELECTED_TAUNTS] in extendedconfig
        const sectionLines = [
            '[SECTION: AUDIOTAUNT_SELECTED_TAUNTS]',
            ...newTauntHashes.slice(0, 6).map(h => (h && h !== 'EMPTY') ? h : ''),
            '[/END]'
        ].join('\r\n');

        let newConfigContent: string;
        const sectionRegex = /\[SECTION:\s*AUDIOTAUNT_SELECTED_TAUNTS\]([\s\S]*?)\[\/END\]/;
        if (sectionRegex.test(originalContent)) {
            newConfigContent = originalContent.replace(sectionRegex, sectionLines);
        } else {
            newConfigContent = originalContent.trimEnd() + '\r\n\r\n' + sectionLines + '\r\n';
        }

        // Write updated extendedconfig
        const configWritable = await (configFileHandle as any).createWritable();
        await configWritable.write(newConfigContent);
        await configWritable.close();

        return {
            success: true,
            backupFileName,
            promotedCount,
            installedCount
        };
    } catch (err: any) {
        console.error('Failed to apply pilot taunts via File System Access:', err);
        return {
            success: false,
            backupFileName: '',
            promotedCount: 0,
            installedCount: 0,
            error: err.message || 'Unknown error occurred while writing to Overload directory.'
        };
    }
}
