import * as JSZipModule from 'jszip';
// @ts-ignore
const JSZip = (JSZipModule && JSZipModule.default) ? JSZipModule.default : JSZipModule;

export interface XPrefsEntry {
    key: string;
    value: string;
    type: 'I' | 'B' | 'S';
    raw: string;
}

export interface ParsedXPrefs {
    tokens: string[]; // Raw semicolon-delimited tokens in original order
    entries: Record<string, XPrefsEntry>;
    trailingSemicolon: boolean;
}

export interface KeyBindingEntry {
    actionName: string;
    axis1Device: number;
    axis1Axis: number;
    axis1Sign: number;
    axis1Invert: boolean;
    axis2Device: number;
    axis2Axis: number;
    axis2Sign: number;
    axis2Invert: boolean;
    key1: number; // Primary Unity KeyCode
    key2: number; // Secondary Unity KeyCode
    lineIndex: number;
}

export interface ParsedXConfig {
    lines: string[]; // Raw lines in original order
    controllers: string[];
    bindings: Record<string, KeyBindingEntry>;
    lineEnding: '\r\n' | '\n';
}

/**
 * Unity KeyCode to human-readable names dictionary
 */
export const UNITY_KEYCODE_NAMES: Record<number, string> = {
    0: 'None',
    8: 'Backspace',
    9: 'Tab',
    13: 'Enter',
    19: 'Pause',
    27: 'Escape',
    32: 'Space',
    39: "'",
    44: ',',
    45: '-',
    46: '.',
    47: '/',
    48: '0', 49: '1', 50: '2', 51: '3', 52: '4', 53: '5', 54: '6', 55: '7', 56: '8', 57: '9',
    59: ';',
    61: '=',
    91: '[',
    92: '\\',
    93: ']',
    96: '`',
    97: 'A', 98: 'B', 99: 'C', 100: 'D', 101: 'E', 102: 'F', 103: 'G', 104: 'H',
    105: 'I', 106: 'J', 107: 'K', 108: 'L', 109: 'M', 110: 'N', 111: 'O', 112: 'P',
    113: 'Q', 114: 'R', 115: 'S', 116: 'T', 117: 'U', 118: 'V', 119: 'W', 120: 'X',
    121: 'Y', 122: 'Z',
    127: 'Delete',
    256: 'Keypad 0', 257: 'Keypad 1', 258: 'Keypad 2', 259: 'Keypad 3', 260: 'Keypad 4',
    261: 'Keypad 5', 262: 'Keypad 6', 263: 'Keypad 7', 264: 'Keypad 8', 265: 'Keypad 9',
    266: 'Keypad .', 267: 'Keypad /', 268: 'Keypad *', 269: 'Keypad -', 270: 'Keypad +',
    271: 'Keypad Enter', 272: 'Keypad =',
    273: 'Up Arrow',
    274: 'Down Arrow',
    275: 'Right Arrow',
    276: 'Left Arrow',
    277: 'Insert',
    278: 'Home',
    279: 'End',
    280: 'Page Up',
    281: 'Page Down',
    282: 'F1', 283: 'F2', 284: 'F3', 285: 'F4', 286: 'F5', 287: 'F6',
    288: 'F7', 289: 'F8', 290: 'F9', 291: 'F10', 292: 'F11', 293: 'F12',
    300: 'Num Lock',
    301: 'Caps Lock',
    302: 'Scroll Lock',
    303: 'Right Shift',
    304: 'Left Shift',
    305: 'Right Control',
    306: 'Left Control',
    307: 'Right Alt',
    308: 'Left Alt',
    323: 'Mouse 0 (Left Click)',
    324: 'Mouse 1 (Right Click)',
    325: 'Mouse 2 (Middle Click)',
    326: 'Mouse 3',
    327: 'Mouse 4 (Thumb)',
    328: 'Mouse 5',
    329: 'Mouse 6',
    501: 'Wheel Up',
    502: 'Wheel Down'
};

/**
 * Get friendly key name from Unity KeyCode
 */
export function getUnityKeyName(keyCode: number): string {
    if (UNITY_KEYCODE_NAMES[keyCode]) {
        return UNITY_KEYCODE_NAMES[keyCode];
    }
    if (keyCode >= 97 && keyCode <= 122) {
        return String.fromCharCode(keyCode).toUpperCase();
    }
    if (keyCode >= 48 && keyCode <= 57) {
        return String.fromCharCode(keyCode);
    }
    return `Key ${keyCode}`;
}

/**
 * Convert Browser KeyboardEvent or MouseEvent to Unity KeyCode
 */
export function browserEventToUnityKeyCode(e: KeyboardEvent | MouseEvent): number | null {
    if ('button' in e && typeof e.button === 'number' && e.type.startsWith('mouse')) {
        // Mouse click mapping
        switch (e.button) {
            case 0: return 323; // Mouse0
            case 2: return 324; // Mouse1
            case 1: return 325; // Mouse2
            case 3: return 326; // Mouse3
            case 4: return 327; // Mouse4
            default: return 323 + e.button;
        }
    }

    if ('code' in e && typeof e.code === 'string') {
        const ke = e as KeyboardEvent;
        const code = ke.code;

        // Letters KeyA - KeyZ
        if (code.startsWith('Key')) {
            const letter = code.substring(3).toLowerCase();
            return letter.charCodeAt(0); // 97-122
        }

        // Digits Digit0 - Digit9
        if (code.startsWith('Digit')) {
            const num = code.substring(5);
            return num.charCodeAt(0); // 48-57
        }

        // Special keys
        switch (code) {
            case 'Space': return 32;
            case 'Tab': return 9;
            case 'Enter': return 13;
            case 'Escape': return 27;
            case 'Backspace': return 8;
            case 'Delete': return 127;
            case 'ArrowUp': return 273;
            case 'ArrowDown': return 274;
            case 'ArrowRight': return 275;
            case 'ArrowLeft': return 276;
            case 'Insert': return 277;
            case 'Home': return 278;
            case 'End': return 279;
            case 'PageUp': return 280;
            case 'PageDown': return 281;
            case 'ShiftLeft': return 304;
            case 'ShiftRight': return 303;
            case 'ControlLeft': return 306;
            case 'ControlRight': return 305;
            case 'AltLeft': return 308;
            case 'AltRight': return 307;
            case 'CapsLock': return 301;
            case 'F1': return 282;
            case 'F2': return 283;
            case 'F3': return 284;
            case 'F4': return 285;
            case 'F5': return 286;
            case 'F6': return 287;
            case 'F7': return 288;
            case 'F8': return 289;
            case 'F9': return 290;
            case 'F10': return 291;
            case 'F11': return 292;
            case 'F12': return 293;
            case 'Semicolon': return 59;
            case 'Equal': return 61;
            case 'Minus': return 45;
            case 'Slash': return 47;
            case 'Backslash': return 92;
            case 'BracketLeft': return 91;
            case 'BracketRight': return 93;
            case 'Quote': return 39;
            case 'Backquote': return 96;
            case 'Comma': return 44;
            case 'Period': return 46;
        }
    }

    return null;
}

/**
 * Parse .xprefs or .xprefsmod content while maintaining strict round-trip fidelity
 */
export function parseXPrefs(content: string): ParsedXPrefs {
    const trailingSemicolon = content.endsWith(';');
    const rawTokens = content.split(';');
    const tokens: string[] = [];
    const entries: Record<string, XPrefsEntry> = {};

    for (let i = 0; i < rawTokens.length; i++) {
        const tok = rawTokens[i].trim();
        if (!tok && i === rawTokens.length - 1 && !trailingSemicolon) {
            continue;
        }
        tokens.push(tok);
        if (tok.includes(':')) {
            const firstColon = tok.indexOf(':');
            const lastColon = tok.lastIndexOf(':');
            const key = tok.substring(0, firstColon);
            const type = tok.substring(lastColon + 1) as 'I' | 'B' | 'S';
            const value = tok.substring(firstColon + 1, lastColon);
            entries[key] = { key, value, type, raw: tok };
        }
    }

    return {
        tokens,
        entries,
        trailingSemicolon
    };
}

/**
 * Serialize ParsedXPrefs back into string with exact byte-identical fidelity
 */
export function serializeXPrefs(parsed: ParsedXPrefs): string {
    let result = parsed.tokens.join(';');
    if (parsed.trailingSemicolon && !result.endsWith(';')) {
        result += ';';
    }
    return result;
}

/**
 * Update a specific key in ParsedXPrefs, preserving exact ordering and delimiter formatting
 */
export function updateXPrefsValue(
    parsed: ParsedXPrefs,
    key: string,
    newValue: string | number | boolean
): ParsedXPrefs {
    const existing = parsed.entries[key];
    let strVal: string;
    let type: 'I' | 'B' | 'S' = existing ? existing.type : 'S';

    if (typeof newValue === 'boolean') {
        strVal = newValue ? 'T' : 'F';
        type = 'B';
    } else if (typeof newValue === 'number') {
        strVal = Math.round(newValue).toString();
        type = 'I';
    } else {
        strVal = String(newValue);
    }

    const newRaw = `${key}:${strVal}:${type}`;
    const newTokens = [...parsed.tokens];
    let found = false;

    for (let i = 0; i < newTokens.length; i++) {
        if (newTokens[i].startsWith(key + ':')) {
            newTokens[i] = newRaw;
            found = true;
            break;
        }
    }

    if (!found) {
        newTokens.push(newRaw);
    }

    const newEntries = {
        ...parsed.entries,
        [key]: { key, value: strVal, type, raw: newRaw }
    };

    return {
        tokens: newTokens,
        entries: newEntries,
        trailingSemicolon: parsed.trailingSemicolon
    };
}

/**
 * Parse .xconfig content (input bindings and controllers) preserving round-trip line structure
 */
export function parseXConfig(content: string): ParsedXConfig {
    const lineEnding = content.includes('\r\n') ? '\r\n' : '\n';
    const lines = content.split(/\r?\n/);
    const controllers: string[] = [];
    const bindings: Record<string, KeyBindingEntry> = {};

    // Action name list in Overload
    const knownActions = new Set([
        'TURN_LEFT', 'TURN_RIGHT', 'PITCH_UP', 'PITCH_DOWN',
        'ROLL_LEFT', 'ROLL_RIGHT', 'ROLL_LEFT_90', 'ROLL_RIGHT_90',
        'MOVE_FORE', 'MOVE_BACK', 'SLIDE_LEFT', 'SLIDE_RIGHT', 'SLIDE_UP', 'SLIDE_DOWN',
        'FIRE_WEAPON', 'FIRE_MISSILE', 'SWITCH_WEAPON', 'SWITCH_MISSILE',
        'FIRE_FLARE', 'USE_BOOST', 'TOGGLE_HEADLIGHT', 'VIEW_MAP',
        'HOLOGUIDE', 'SMASH_ATTACK', 'REAR_VIEW', 'PREV_WEAPON', 'PREV_MISSILE',
        'SLIDE_MODIFIER', 'QUICKSAVE', 'TOGGLE_COCKPIT', 'FULL_CHAT', 'TOGGLE_HUD', 'RECENTER_VR',
        'WEAPON_1x2', 'WEAPON_3x4', 'WEAPON_5x6', 'WEAPON_7x8',
        'MISSILE_1x2', 'MISSILE_3x4', 'MISSILE_5x6', 'MISSILE_7x8',
        'WHEEL_LEFT', 'WHEEL_RIGHT', 'WHEEL_UP', 'WHEEL_DOWN'
    ]);

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Detect named controller blocks (e.g. line starts with controller name like XInput Gamepad)
        if (i > 3 && i < 600 && line.length > 2 && !/^-?\d+$/.test(line) && line !== 'True' && line !== 'False' && !knownActions.has(line)) {
            if (!controllers.includes(line)) {
                controllers.push(line);
            }
        }

        // Action block: 11 lines
        if (knownActions.has(line) && i + 10 < lines.length) {
            const actionName = line;
            const axis1Device = parseInt(lines[i + 1], 10) || -1;
            const axis1Axis = parseInt(lines[i + 2], 10) || 0;
            const axis1Sign = parseInt(lines[i + 3], 10) || -1;
            const axis1Invert = lines[i + 4] === 'True';

            const axis2Device = parseInt(lines[i + 5], 10) || -1;
            const axis2Axis = parseInt(lines[i + 6], 10) || 0;
            const axis2Sign = parseInt(lines[i + 7], 10) || -1;
            const axis2Invert = lines[i + 8] === 'True';

            const key1 = parseInt(lines[i + 9], 10) || 0;
            const key2 = parseInt(lines[i + 10], 10) || 0;

            bindings[actionName] = {
                actionName,
                axis1Device,
                axis1Axis,
                axis1Sign,
                axis1Invert,
                axis2Device,
                axis2Axis,
                axis2Sign,
                axis2Invert,
                key1,
                key2,
                lineIndex: i
            };
        }
    }

    return {
        lines,
        controllers,
        bindings,
        lineEnding
    };
}

/**
 * Serialize ParsedXConfig back into exact string
 */
export function serializeXConfig(parsed: ParsedXConfig): string {
    return parsed.lines.join(parsed.lineEnding);
}

/**
 * Update Key1 or Key2 for a given action in ParsedXConfig
 */
export function updateKeyBinding(
    parsed: ParsedXConfig,
    actionName: string,
    slot: 1 | 2,
    newKeyCode: number
): ParsedXConfig {
    const binding = parsed.bindings[actionName];
    if (!binding) return parsed;

    const newLines = [...parsed.lines];
    const targetLineIndex = slot === 1 ? binding.lineIndex + 9 : binding.lineIndex + 10;
    newLines[targetLineIndex] = newKeyCode.toString();

    const newBindings = {
        ...parsed.bindings,
        [actionName]: {
            ...binding,
            key1: slot === 1 ? newKeyCode : binding.key1,
            key2: slot === 2 ? newKeyCode : binding.key2
        }
    };

    return {
        ...parsed,
        lines: newLines,
        bindings: newBindings
    };
}

/**
 * Probe whether Overload or olmod is actively running
 */
export async function checkOverloadRunningClient(
    dirHandle?: FileSystemDirectoryHandle | null
): Promise<{ isRunning: boolean; reason?: string }> {
    // 1. Check local backend API if available
    try {
        const res = await fetch('/api/overload/status');
        if (res.ok) {
            const data = await res.json();
            if (data.isGameRunning) {
                return {
                    isRunning: true,
                    reason: 'Overload.exe or olmod is currently running according to system process monitor.'
                };
            }
        }
    } catch {
        // remote host or offline
    }

    // 2. Check if output_log.txt or ConsoleLog has been written in last 15 seconds
    if (dirHandle) {
        try {
            const logHandle = await dirHandle.getFileHandle('output_log.txt', { create: false });
            const logFile = await logHandle.getFile();
            const timeDiffSec = (Date.now() - logFile.lastModified) / 1000;
            if (timeDiffSec < 15) {
                return {
                    isRunning: true,
                    reason: `output_log.txt was updated ${Math.round(timeDiffSec)}s ago. Overload is currently active.`
                };
            }
        } catch {
            // no log file
        }
    }

    return { isRunning: false };
}

/**
 * Create a timestamped backup of a pilot file in "Pilot Backup/"
 */
export async function createPilotFileBackup(
    dirHandle: FileSystemDirectoryHandle,
    pilotName: string,
    extension: string,
    originalContent: string | Blob
): Promise<string> {
    const backupDirHandle = await dirHandle.getDirectoryHandle('Pilot Backup', { create: true });
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timeStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const cleanExt = extension.startsWith('.') ? extension.substring(1) : extension;
    const backupFileName = `${pilotName}_backup_${timeStr}.${cleanExt}`;

    // Write timestamped backup in Pilot Backup/
    const backupFileHandle = await backupDirHandle.getFileHandle(backupFileName, { create: true });
    const backupWritable = await (backupFileHandle as any).createWritable();
    await backupWritable.write(originalContent);
    await backupWritable.close();

    // Also write snapshot .bak in root
    try {
        const bakFileHandle = await dirHandle.getFileHandle(`${pilotName}.${cleanExt}.bak`, { create: true });
        const bakWritable = await (bakFileHandle as any).createWritable();
        await bakWritable.write(originalContent);
        await bakWritable.close();
    } catch (e) {
        console.warn('Could not write .bak file snapshot:', e);
    }

    return backupFileName;
}

/**
 * Write updated .xprefs back to file system with Overload-running guard and backup
 */
export async function savePilotXPrefsClient(
    dirHandle: FileSystemDirectoryHandle,
    pilotName: string,
    parsed: ParsedXPrefs,
    isMod = false
): Promise<{ success: boolean; backupFileName?: string; error?: string }> {
    // 1. Guard check
    const status = await checkOverloadRunningClient(dirHandle);
    if (status.isRunning) {
        return {
            success: false,
            error: 'Close Overload to change settings'
        };
    }

    const filename = `${pilotName}.${isMod ? 'xprefsmod' : 'xprefs'}`;

    try {
        const fileHandle = await dirHandle.getFileHandle(filename, { create: false });
        const originalFile = await fileHandle.getFile();
        const originalContent = await originalFile.text();

        // 2. Mandatory backup
        const backupFileName = await createPilotFileBackup(dirHandle, pilotName, isMod ? 'xprefsmod' : 'xprefs', originalContent);

        // 3. Serialize and write
        const newContent = serializeXPrefs(parsed);
        const writable = await (fileHandle as any).createWritable();
        await writable.write(newContent);
        await writable.close();

        return { success: true, backupFileName };
    } catch (err: any) {
        console.error(`Failed to save ${filename}:`, err);
        return {
            success: false,
            error: err.message || `Failed to write ${filename}`
        };
    }
}

/**
 * Write updated .xconfig back to file system with Overload-running guard and backup
 */
export async function savePilotXConfigClient(
    dirHandle: FileSystemDirectoryHandle,
    pilotName: string,
    parsed: ParsedXConfig
): Promise<{ success: boolean; backupFileName?: string; error?: string }> {
    // 1. Guard check
    const status = await checkOverloadRunningClient(dirHandle);
    if (status.isRunning) {
        return {
            success: false,
            error: 'Close Overload to change settings'
        };
    }

    const filename = `${pilotName}.xconfig`;

    try {
        const fileHandle = await dirHandle.getFileHandle(filename, { create: false });
        const originalFile = await fileHandle.getFile();
        const originalContent = await originalFile.text();

        // 2. Mandatory backup
        const backupFileName = await createPilotFileBackup(dirHandle, pilotName, 'xconfig', originalContent);

        // 3. Serialize and write
        const newContent = serializeXConfig(parsed);
        const writable = await (fileHandle as any).createWritable();
        await writable.write(newContent);
        await writable.close();

        return { success: true, backupFileName };
    } catch (err: any) {
        console.error(`Failed to save ${filename}:`, err);
        return {
            success: false,
            error: err.message || `Failed to write ${filename}`
        };
    }
}

/**
 * The 6-file family for each Overload pilot
 */
export const PILOT_FILE_FAMILY = [
    '.xconfig',
    '.xprefs',
    '.xprefsmod',
    '.xscores',
    '.extendedconfig',
    '.xconfigmod'
];

/**
 * Backup all pilots into a single timestamped ZIP file in "Pilot Backup/"
 */
export async function backupAllPilotsZipClient(
    dirHandle: FileSystemDirectoryHandle,
    pilots: string[]
): Promise<{ success: boolean; fileName: string; fileCount: number; error?: string }> {
    try {
        const zip = new JSZip();
        let fileCount = 0;

        for (const pilot of pilots) {
            for (const ext of PILOT_FILE_FAMILY) {
                const fname = `${pilot}${ext}`;
                try {
                    const fileHandle = await dirHandle.getFileHandle(fname, { create: false });
                    const file = await fileHandle.getFile();
                    const buf = await file.arrayBuffer();
                    zip.file(fname, buf);
                    fileCount++;
                } catch {
                    // file might not exist for this pilot (e.g. xprefsmod or xconfigmod)
                }
            }
        }

        if (fileCount === 0) {
            return {
                success: false,
                fileName: '',
                fileCount: 0,
                error: 'No pilot configuration files were found to back up.'
            };
        }

        const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 9 } });

        const now = new Date();
        const pad = (n: number) => String(n).padStart(2, '0');
        const timeStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
        const fileName = `Overload_Pilots_${timeStr}.zip`;

        // Save to Pilot Backup/ folder
        const backupDir = await dirHandle.getDirectoryHandle('Pilot Backup', { create: true });
        const targetHandle = await backupDir.getFileHandle(fileName, { create: true });
        const writable = await (targetHandle as any).createWritable();
        await writable.write(zipBlob);
        await writable.close();

        return {
            success: true,
            fileName,
            fileCount
        };
    } catch (err: any) {
        console.error('Backup all pilots failed:', err);
        return {
            success: false,
            fileName: '',
            fileCount: 0,
            error: err.message || 'Failed to generate pilot backup zip'
        };
    }
}

/**
 * Clone pilot across entire 6-file family
 */
export async function clonePilotClient(
    dirHandle: FileSystemDirectoryHandle,
    sourcePilot: string,
    newPilotName: string,
    existingPilots: string[]
): Promise<{ success: boolean; clonedCount: number; error?: string }> {
    const trimmed = newPilotName.trim();
    if (!trimmed) {
        return { success: false, clonedCount: 0, error: 'New pilot name cannot be empty.' };
    }
    if (existingPilots.map(p => p.toLowerCase()).includes(trimmed.toLowerCase())) {
        return { success: false, clonedCount: 0, error: `A pilot named "${trimmed}" already exists!` };
    }

    const guard = await checkOverloadRunningClient(dirHandle);
    if (guard.isRunning) {
        return { success: false, clonedCount: 0, error: 'Close Overload to clone pilot' };
    }

    const createdHandles: string[] = [];
    try {
        let clonedCount = 0;
        for (const ext of PILOT_FILE_FAMILY) {
            const srcName = `${sourcePilot}${ext}`;
            const dstName = `${trimmed}${ext}`;

            try {
                const srcHandle = await dirHandle.getFileHandle(srcName, { create: false });
                const srcFile = await srcHandle.getFile();

                const dstHandle = await dirHandle.getFileHandle(dstName, { create: true });
                createdHandles.push(dstName);
                const writable = await (dstHandle as any).createWritable();
                await writable.write(srcFile);
                await writable.close();
                clonedCount++;
            } catch {
                // optional file doesn't exist
            }
        }

        return { success: true, clonedCount };
    } catch (err: any) {
        // Rollback created files on failure
        for (const fname of createdHandles) {
            try {
                // @ts-ignore
                if (dirHandle.removeEntry) await dirHandle.removeEntry(fname);
            } catch {}
        }
        return { success: false, clonedCount: 0, error: err.message || 'Clone failed.' };
    }
}

/**
 * Rename pilot across entire 6-file family with rollback on failure
 */
export async function renamePilotClient(
    dirHandle: FileSystemDirectoryHandle,
    oldPilotName: string,
    newPilotName: string,
    activePilot: string,
    existingPilots: string[]
): Promise<{ success: boolean; renamedCount: number; error?: string }> {
    const trimmed = newPilotName.trim();
    if (!trimmed) {
        return { success: false, renamedCount: 0, error: 'New pilot name cannot be empty.' };
    }
    if (trimmed.toLowerCase() === oldPilotName.toLowerCase()) {
        return { success: false, renamedCount: 0, error: 'New pilot name must be different from current name.' };
    }
    if (existingPilots.map(p => p.toLowerCase()).includes(trimmed.toLowerCase())) {
        return { success: false, renamedCount: 0, error: `A pilot named "${trimmed}" already exists!` };
    }

    const guard = await checkOverloadRunningClient(dirHandle);
    if (guard.isRunning) {
        return { success: false, renamedCount: 0, error: 'Close Overload to rename pilot' };
    }

    const movedPairs: Array<{ oldName: string; newName: string }> = [];
    try {
        let renamedCount = 0;

        for (const ext of PILOT_FILE_FAMILY) {
            const oldFname = `${oldPilotName}${ext}`;
            const newFname = `${trimmed}${ext}`;

            try {
                const srcHandle = await dirHandle.getFileHandle(oldFname, { create: false });
                const srcFile = await srcHandle.getFile();

                // Copy to new file
                const dstHandle = await dirHandle.getFileHandle(newFname, { create: true });
                const writable = await (dstHandle as any).createWritable();
                await writable.write(srcFile);
                await writable.close();

                // Remove old file
                // @ts-ignore
                if (dirHandle.removeEntry) {
                    // @ts-ignore
                    await dirHandle.removeEntry(oldFname);
                }

                movedPairs.push({ oldName: oldFname, newName: newFname });
                renamedCount++;
            } catch {
                // file may not exist
            }
        }

        return { success: true, renamedCount };
    } catch (err: any) {
        // Rollback: try to restore files from movedPairs
        for (const pair of movedPairs) {
            try {
                const newHandle = await dirHandle.getFileHandle(pair.newName, { create: false });
                const newFile = await newHandle.getFile();
                const oldHandle = await dirHandle.getFileHandle(pair.oldName, { create: true });
                const writable = await (oldHandle as any).createWritable();
                await writable.write(newFile);
                await writable.close();
                // @ts-ignore
                if (dirHandle.removeEntry) await dirHandle.removeEntry(pair.newName);
            } catch {}
        }
        return { success: false, renamedCount: 0, error: err.message || 'Rename failed.' };
    }
}

/**
 * Delete pilot across entire 6-file family
 */
export async function deletePilotClient(
    dirHandle: FileSystemDirectoryHandle,
    pilotToDelete: string,
    existingPilots: string[],
    activePilot: string
): Promise<{ success: boolean; deletedCount: number; error?: string }> {
    if (existingPilots.length <= 1) {
        return { success: false, deletedCount: 0, error: 'Cannot delete the only remaining pilot!' };
    }

    const guard = await checkOverloadRunningClient(dirHandle);
    if (guard.isRunning) {
        return { success: false, deletedCount: 0, error: 'Close Overload to delete pilot' };
    }

    try {
        let deletedCount = 0;
        for (const ext of PILOT_FILE_FAMILY) {
            const fname = `${pilotToDelete}${ext}`;
            try {
                // @ts-ignore
                if (dirHandle.removeEntry) {
                    // @ts-ignore
                    await dirHandle.removeEntry(fname);
                    deletedCount++;
                }
            } catch {
                // file didn't exist
            }
        }

        return { success: true, deletedCount };
    } catch (err: any) {
        return { success: false, deletedCount: 0, error: err.message || 'Delete operation failed.' };
    }
}

/**
 * Read Pilot XP from .xprefs
 */
export async function readPilotXPClient(
    dirHandle: FileSystemDirectoryHandle,
    pilotName: string
): Promise<number | null> {
    try {
        const fileHandle = await dirHandle.getFileHandle(`${pilotName}.xprefs`, { create: false });
        const file = await fileHandle.getFile();
        const text = await file.text();
        const parsed = parseXPrefs(text);
        if (parsed.entries['PS_XP2']) {
            const val = parseInt(parsed.entries['PS_XP2'].value, 10);
            return isNaN(val) ? 0 : val;
        }
    } catch (e) {
        console.warn(`Could not read XP for ${pilotName}:`, e);
    }
    return null;
}

/**
 * Set Pilot XP in .xprefs (Single player only, 0-9,999,999)
 */
export async function setPilotXPClient(
    dirHandle: FileSystemDirectoryHandle,
    pilotName: string,
    newXP: number
): Promise<{ success: boolean; backupFileName?: string; error?: string }> {
    const clamped = Math.max(0, Math.min(9999999, Math.round(newXP)));

    try {
        const fileHandle = await dirHandle.getFileHandle(`${pilotName}.xprefs`, { create: false });
        const file = await fileHandle.getFile();
        const text = await file.text();
        const parsed = parseXPrefs(text);
        const updated = updateXPrefsValue(parsed, 'PS_XP2', clamped);
        return await savePilotXPrefsClient(dirHandle, pilotName, updated, false);
    } catch (err: any) {
        return { success: false, error: err.message || 'Failed to update pilot XP.' };
    }
}

/* ==========================================================================
   WEAPON AUTOSELECT & CYCLING CONFIGURATION ENGINE
   ========================================================================== */

export type PrimaryWeaponId =
    | 'IMPULSE'
    | 'CYCLONE'
    | 'REFLEX'
    | 'CRUSHER'
    | 'DRILLER'
    | 'FLAK'
    | 'THUNDERBOLT'
    | 'LANCER';

export type SecondaryWeaponId =
    | 'FALCON'
    | 'MISSILE_POD'
    | 'HUNTER'
    | 'CREEPER'
    | 'NOVA'
    | 'DEVASTATOR'
    | 'TIMEBOMB'
    | 'VORTEX';

export interface WeaponAutoselectItem {
    id: PrimaryWeaponId | SecondaryWeaponId;
    name: string;
    type: 'primary' | 'secondary';
    neverSelect: boolean; // Autoselect inclusion: False in file = included (+), True = excluded (-)
    cycle: boolean;       // Cycle inclusion: True in file = included (+), False = excluded (-)
    defaultPriority: number;
}

export interface AutoselectLogicSwitches {
    status: boolean;                   // Global Active status: (weaponLogic || missileLogic)
    weaponLogic: boolean;              // p_swap: ON / OFF
    missileLogic: boolean;             // s_swap: ON / OFF
    swapWhileFiring: boolean;          // swap_while_firing: ON / OFF ("Don't Swap While Firing")
    dontAutoselectAfterFiring: boolean;// dont_autoselect_after_firing: ON / OFF ("Retry Swap After Firing")
    devAlert: boolean;                 // dev_alert: ON / OFF ("Devastator Alert")
    reducedHud: boolean;               // reduced_hud: ON / OFF
}

export interface PilotAutoselectConfig {
    primaries: WeaponAutoselectItem[];   // 8 items in priority order (0 = highest)
    secondaries: WeaponAutoselectItem[]; // 8 items in priority order (0 = highest)
    switches: AutoselectLogicSwitches;
}

export const PRIMARY_WEAPONS_META: Record<PrimaryWeaponId, { name: string; cycleKey: string; defaultPriority: number }> = {
    'IMPULSE': { name: 'Impulse', cycleKey: 'p_cycle_0', defaultPriority: 3 },
    'CYCLONE': { name: 'Cyclone', cycleKey: 'p_cycle_1', defaultPriority: 1 },
    'REFLEX': { name: 'Reflex', cycleKey: 'p_cycle_2', defaultPriority: 7 },
    'CRUSHER': { name: 'Crusher', cycleKey: 'p_cycle_3', defaultPriority: 5 },
    'DRILLER': { name: 'Driller', cycleKey: 'p_cycle_4', defaultPriority: 2 },
    'FLAK': { name: 'Flak', cycleKey: 'p_cycle_5', defaultPriority: 4 },
    'THUNDERBOLT': { name: 'Thunderbolt', cycleKey: 'p_cycle_6', defaultPriority: 0 },
    'LANCER': { name: 'Lancer', cycleKey: 'p_cycle_7', defaultPriority: 6 },
};

export const SECONDARY_WEAPONS_META: Record<SecondaryWeaponId, { name: string; cycleKey: string; defaultPriority: number }> = {
    'FALCON': { name: 'Falcon', cycleKey: 's_cycle_0', defaultPriority: 5 },
    'MISSILE_POD': { name: 'Missile Pod', cycleKey: 's_cycle_1', defaultPriority: 6 },
    'HUNTER': { name: 'Hunter', cycleKey: 's_cycle_2', defaultPriority: 4 },
    'CREEPER': { name: 'Creeper', cycleKey: 's_cycle_3', defaultPriority: 7 },
    'NOVA': { name: 'Nova', cycleKey: 's_cycle_4', defaultPriority: 1 },
    'DEVASTATOR': { name: 'Devastator', cycleKey: 's_cycle_5', defaultPriority: 0 },
    'TIMEBOMB': { name: 'Timebomb', cycleKey: 's_cycle_6', defaultPriority: 2 },
    'VORTEX': { name: 'Vortex', cycleKey: 's_cycle_7', defaultPriority: 3 },
};

export const DEFAULT_PRIMARY_PRIORITY: PrimaryWeaponId[] = [
    'THUNDERBOLT',
    'CYCLONE',
    'DRILLER',
    'IMPULSE',
    'FLAK',
    'CRUSHER',
    'LANCER',
    'REFLEX'
];

export const DEFAULT_SECONDARY_PRIORITY: SecondaryWeaponId[] = [
    'DEVASTATOR',
    'NOVA',
    'TIMEBOMB',
    'VORTEX',
    'HUNTER',
    'FALCON',
    'MISSILE_POD',
    'CREEPER'
];

export const DEFAULT_AUTOSELECT_SWITCHES: AutoselectLogicSwitches = {
    status: false,
    weaponLogic: false,
    missileLogic: false,
    swapWhileFiring: false,
    dontAutoselectAfterFiring: false,
    devAlert: true,
    reducedHud: false
};

/**
 * Return a default autoselect configuration mirroring olmod's factory settings
 */
export function getDefaultAutoselectConfig(): PilotAutoselectConfig {
    return {
        primaries: DEFAULT_PRIMARY_PRIORITY.map((id) => ({
            id,
            name: PRIMARY_WEAPONS_META[id].name,
            type: 'primary',
            neverSelect: false,
            cycle: true,
            defaultPriority: PRIMARY_WEAPONS_META[id].defaultPriority
        })),
        secondaries: DEFAULT_SECONDARY_PRIORITY.map((id) => ({
            id,
            name: SECONDARY_WEAPONS_META[id].name,
            type: 'secondary',
            neverSelect: false,
            cycle: true,
            defaultPriority: SECONDARY_WEAPONS_META[id].defaultPriority
        })),
        switches: { ...DEFAULT_AUTOSELECT_SWITCHES }
    };
}

/**
 * Parse [SECTION: AUTOSELECT] and [SECTION: WEAPONCYCLING] from .extendedconfig
 */
export function parseAutoselectConfig(extendedContent: string): PilotAutoselectConfig {
    const autoselectEntries: Record<string, string> = {};
    const cyclingEntries: Record<string, string> = {};

    // Match [SECTION: AUTOSELECT]
    const autoMatch = extendedContent.match(/\[SECTION:\s*AUTOSELECT\]([\s\S]*?)\[\/END\]/i);
    if (autoMatch) {
        const lines = autoMatch[1].split(/\r?\n/);
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            const colonIdx = trimmed.indexOf(':');
            if (colonIdx !== -1) {
                const k = trimmed.substring(0, colonIdx).trim().toLowerCase();
                const v = trimmed.substring(colonIdx + 1).trim();
                autoselectEntries[k] = v;
            }
        }
    }

    // Match [SECTION: WEAPONCYCLING]
    const cycleMatch = extendedContent.match(/\[SECTION:\s*WEAPONCYCLING\]([\s\S]*?)\[\/END\]/i);
    if (cycleMatch) {
        const lines = cycleMatch[1].split(/\r?\n/);
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            const colonIdx = trimmed.indexOf(':');
            if (colonIdx !== -1) {
                const k = trimmed.substring(0, colonIdx).trim().toLowerCase();
                const v = trimmed.substring(colonIdx + 1).trim();
                cyclingEntries[k] = v;
            }
        }
    }

    // Build ordered primary weapons list
    const primaryOrder: PrimaryWeaponId[] = [];
    const usedPrimaries = new Set<PrimaryWeaponId>();
    for (let i = 0; i < 8; i++) {
        const key = `p_priority_${i}`;
        const rawVal = (autoselectEntries[key] || '').toUpperCase();
        if (rawVal in PRIMARY_WEAPONS_META && !usedPrimaries.has(rawVal as PrimaryWeaponId)) {
            primaryOrder.push(rawVal as PrimaryWeaponId);
            usedPrimaries.add(rawVal as PrimaryWeaponId);
        }
    }
    // Fallback fill for missing primaries
    for (const defId of DEFAULT_PRIMARY_PRIORITY) {
        if (!usedPrimaries.has(defId)) {
            primaryOrder.push(defId);
            usedPrimaries.add(defId);
        }
    }

    const primaries: WeaponAutoselectItem[] = primaryOrder.map((id, index) => {
        const meta = PRIMARY_WEAPONS_META[id];
        const neverSelectRaw = autoselectEntries[`p_neverselect_${index}`];
        const neverSelect = neverSelectRaw !== undefined ? neverSelectRaw.toLowerCase() === 'true' : false;
        const cycleRaw = cyclingEntries[meta.cycleKey.toLowerCase()];
        const cycle = cycleRaw !== undefined ? cycleRaw.toLowerCase() === 'true' : true;

        return {
            id,
            name: meta.name,
            type: 'primary',
            neverSelect,
            cycle,
            defaultPriority: meta.defaultPriority
        };
    });

    // Build ordered secondary weapons list
    const secondaryOrder: SecondaryWeaponId[] = [];
    const usedSecondaries = new Set<SecondaryWeaponId>();
    for (let i = 0; i < 8; i++) {
        const key = `s_priority_${i}`;
        const rawVal = (autoselectEntries[key] || '').toUpperCase();
        if (rawVal in SECONDARY_WEAPONS_META && !usedSecondaries.has(rawVal as SecondaryWeaponId)) {
            secondaryOrder.push(rawVal as SecondaryWeaponId);
            usedSecondaries.add(rawVal as SecondaryWeaponId);
        }
    }
    // Fallback fill for missing secondaries
    for (const defId of DEFAULT_SECONDARY_PRIORITY) {
        if (!usedSecondaries.has(defId)) {
            secondaryOrder.push(defId);
            usedSecondaries.add(defId);
        }
    }

    const secondaries: WeaponAutoselectItem[] = secondaryOrder.map((id, index) => {
        const meta = SECONDARY_WEAPONS_META[id];
        const neverSelectRaw = autoselectEntries[`s_neverselect_${index}`];
        const neverSelect = neverSelectRaw !== undefined ? neverSelectRaw.toLowerCase() === 'true' : false;
        const cycleRaw = cyclingEntries[meta.cycleKey.toLowerCase()];
        const cycle = cycleRaw !== undefined ? cycleRaw.toLowerCase() === 'true' : true;

        return {
            id,
            name: meta.name,
            type: 'secondary',
            neverSelect,
            cycle,
            defaultPriority: meta.defaultPriority
        };
    });

    // Switches
    const pSwap = autoselectEntries['p_swap'] ? autoselectEntries['p_swap'].toLowerCase() === 'true' : false;
    const sSwap = autoselectEntries['s_swap'] ? autoselectEntries['s_swap'].toLowerCase() === 'true' : false;
    const devAlert = autoselectEntries['dev_alert'] ? autoselectEntries['dev_alert'].toLowerCase() === 'true' : true;
    const reducedHud = autoselectEntries['reduced_hud'] ? autoselectEntries['reduced_hud'].toLowerCase() === 'true' : false;
    const swapWhileFiring = autoselectEntries['swap_while_firing'] ? autoselectEntries['swap_while_firing'].toLowerCase() === 'true' : false;
    const dontAutoselectAfterFiring = autoselectEntries['dont_autoselect_after_firing'] ? autoselectEntries['dont_autoselect_after_firing'].toLowerCase() === 'true' : false;

    return {
        primaries,
        secondaries,
        switches: {
            status: pSwap || sSwap,
            weaponLogic: pSwap,
            missileLogic: sSwap,
            swapWhileFiring,
            dontAutoselectAfterFiring,
            devAlert,
            reducedHud
        }
    };
}

/**
 * Format-preserving serializer for .extendedconfig with exact olmod indent (3 spaces) and casing
 */
export function serializeAutoselectConfig(originalContent: string, config: PilotAutoselectConfig): string {
    const boolStr = (b: boolean) => b ? 'True' : 'False';

    // 1. Build [SECTION: AUTOSELECT]
    const autoLines = [
        '[SECTION: AUTOSELECT]',
        ...config.primaries.map((p, i) => `   p_priority_${i}: ${p.id}`),
        ...config.secondaries.map((s, i) => `   s_priority_${i}: ${s.id}`),
        ...config.primaries.map((p, i) => `   p_neverselect_${i}: ${boolStr(p.neverSelect)}`),
        ...config.secondaries.map((s, i) => `   s_neverselect_${i}: ${boolStr(s.neverSelect)}`),
        `   p_swap: ${boolStr(config.switches.weaponLogic)}`,
        `   s_swap: ${boolStr(config.switches.missileLogic)}`,
        `   dev_alert: ${boolStr(config.switches.devAlert)}`,
        `   reduced_hud: ${boolStr(config.switches.reducedHud)}`,
        `   swap_while_firing: ${boolStr(config.switches.swapWhileFiring)}`,
        `   dont_autoselect_after_firing: ${boolStr(config.switches.dontAutoselectAfterFiring)}`,
        '[/END]'
    ];
    const autoBlock = autoLines.join('\r\n');

    // 2. Build [SECTION: WEAPONCYCLING]
    // Weapon enums map:
    // p_cycle_0..7: IMPULSE, CYCLONE, REFLEX, CRUSHER, DRILLER, FLAK, THUNDERBOLT, LANCER
    // s_cycle_0..7: FALCON, MISSILE_POD, HUNTER, CREEPER, NOVA, DEVASTATOR, TIMEBOMB, VORTEX
    const primaryCycleMap = new Map<PrimaryWeaponId, boolean>();
    for (const p of config.primaries) {
        primaryCycleMap.set(p.id as PrimaryWeaponId, p.cycle);
    }
    const secondaryCycleMap = new Map<SecondaryWeaponId, boolean>();
    for (const s of config.secondaries) {
        secondaryCycleMap.set(s.id as SecondaryWeaponId, s.cycle);
    }

    const primaryEnums: PrimaryWeaponId[] = [
        'IMPULSE', 'CYCLONE', 'REFLEX', 'CRUSHER', 'DRILLER', 'FLAK', 'THUNDERBOLT', 'LANCER'
    ];
    const secondaryEnums: SecondaryWeaponId[] = [
        'FALCON', 'MISSILE_POD', 'HUNTER', 'CREEPER', 'NOVA', 'DEVASTATOR', 'TIMEBOMB', 'VORTEX'
    ];

    const cycleLines = [
        '[SECTION: WEAPONCYCLING]',
        ...primaryEnums.map((id, i) => `   p_cycle_${i}: ${boolStr(primaryCycleMap.get(id) ?? true)}`),
        ...secondaryEnums.map((id, i) => `   s_cycle_${i}: ${boolStr(secondaryCycleMap.get(id) ?? true)}`),
        '[/END]'
    ];
    const cycleBlock = cycleLines.join('\r\n');

    let result = originalContent;

    // Replace or insert [SECTION: AUTOSELECT]
    const autoRegex = /\[SECTION:\s*AUTOSELECT\][\s\S]*?\[\/END\]/i;
    if (autoRegex.test(result)) {
        result = result.replace(autoRegex, autoBlock);
    } else {
        result = autoBlock + '\r\n' + result;
    }

    // Replace or insert [SECTION: WEAPONCYCLING]
    const cycleRegex = /\[SECTION:\s*WEAPONCYCLING\][\s\S]*?\[\/END\]/i;
    if (cycleRegex.test(result)) {
        result = result.replace(cycleRegex, cycleBlock);
    } else {
        result = result.trimEnd() + '\r\n\r\n' + cycleBlock + '\r\n';
    }

    return result;
}

/**
 * Read pilot autoselect configuration from connected directory
 */
export async function readPilotAutoselectClient(
    dirHandle: FileSystemDirectoryHandle,
    pilotName: string
): Promise<PilotAutoselectConfig> {
    try {
        const fileHandle = await dirHandle.getFileHandle(`${pilotName}.extendedconfig`, { create: false });
        const file = await fileHandle.getFile();
        const text = await file.text();
        return parseAutoselectConfig(text);
    } catch (e) {
        console.warn(`Could not read ${pilotName}.extendedconfig for autoselect:`, e);
        return getDefaultAutoselectConfig();
    }
}

/**
 * Save pilot autoselect configuration with Overload-running guard and mandatory backup
 */
export async function savePilotAutoselectClient(
    dirHandle: FileSystemDirectoryHandle,
    pilotName: string,
    config: PilotAutoselectConfig
): Promise<{ success: boolean; backupFileName?: string; error?: string }> {
    // 1. Guard check
    const status = await checkOverloadRunningClient(dirHandle);
    if (status.isRunning) {
        return {
            success: false,
            error: 'Close Overload to change settings'
        };
    }

    try {
        let originalContent = '';
        let fileHandle: FileSystemFileHandle;
        try {
            fileHandle = await dirHandle.getFileHandle(`${pilotName}.extendedconfig`, { create: false });
            const originalFile = await fileHandle.getFile();
            originalContent = await originalFile.text();
        } catch {
            fileHandle = await dirHandle.getFileHandle(`${pilotName}.extendedconfig`, { create: true });
        }

        // 2. Mandatory backup if original file existed
        let backupFileName = '';
        if (originalContent) {
            backupFileName = await createPilotFileBackup(dirHandle, pilotName, 'extendedconfig', originalContent);
        }

        // 3. Serialize and write extendedconfig
        const newContent = serializeAutoselectConfig(originalContent, config);
        const writable = await (fileHandle as any).createWritable();
        await writable.write(newContent);
        await writable.close();

        // 4. If autoselect logic is active, synchronize O_PRIMARY_AUTOSWITCH:0:I in .xprefs
        if (config.switches.weaponLogic || config.switches.missileLogic) {
            try {
                const prefsHandle = await dirHandle.getFileHandle(`${pilotName}.xprefs`, { create: false });
                const prefsFile = await prefsHandle.getFile();
                const prefsText = await prefsFile.text();
                const parsed = parseXPrefs(prefsText);
                if (parsed.entries['O_PRIMARY_AUTOSWITCH'] && parsed.entries['O_PRIMARY_AUTOSWITCH'].value !== '0') {
                    const updated = updateXPrefsValue(parsed, 'O_PRIMARY_AUTOSWITCH', '0');
                    await savePilotXPrefsClient(dirHandle, pilotName, updated, false);
                }
            } catch (e) {
                console.warn('Could not sync O_PRIMARY_AUTOSWITCH in .xprefs:', e);
            }
        }

        return { success: true, backupFileName };
    } catch (err: any) {
        console.error(`Failed to save autoselect config for ${pilotName}:`, err);
        return {
            success: false,
            error: err.message || 'Failed to write autoselect configuration'
        };
    }
}
