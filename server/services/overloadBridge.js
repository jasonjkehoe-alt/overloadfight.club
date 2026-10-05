import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import os from 'os';
import { execSync } from 'child_process';
import JSZip from 'jszip';

// Check if Overload or olmod process is currently active
export function isOverloadRunning() {
    if (process.platform !== 'win32') return false;
    try {
        const out = execSync('tasklist').toString().toLowerCase();
        return out.includes('overload.exe') || out.includes('olmod.exe');
    } catch {
        return false;
    }
}

// Resolve Overload AppData path on Windows
export function getOverloadPath() {
    const localAppData = process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE || 'C:\\Users\\admin', 'AppData', 'Local');
    const localLow = path.join(path.dirname(localAppData), 'LocalLow');
    const overloadDir = path.join(localLow, 'Revival', 'Overload');

    if (fs.existsSync(overloadDir)) {
        return overloadDir;
    }
    const defaultWin = 'C:\\Users\\admin\\AppData\\LocalLow\\Revival\\Overload';
    return defaultWin;
}

// Compute MD5 of a file buffer
export function getBufferMd5(buf) {
    return crypto.createHash('md5').update(buf).digest('hex').toLowerCase();
}

// Extract TITLE tag from Vorbis Comment Header inside OGG file
export function extractVorbisTitle(filePath) {
    try {
        const fd = fs.openSync(filePath, 'r');
        const buffer = Buffer.alloc(8192);
        const bytesRead = fs.readSync(fd, buffer, 0, 8192, 0);
        fs.closeSync(fd);

        if (bytesRead < 50) return null;

        const str = buffer.toString('latin1', 0, bytesRead);
        const match = str.match(/TITLE=([^\x00\r\n\x01-\x1F]+)/i);
        if (match && match[1] && match[1].trim()) {
            return match[1].trim();
        }
    } catch {
        // ignore
    }
    return null;
}

// Scan all game taunts from AudioTaunts directory
export function scanGameTaunts(overloadDir) {
    const audioTauntsDir = path.join(overloadDir, 'AudioTaunts');
    const items = [];

    if (!fs.existsSync(audioTauntsDir)) {
        return items;
    }

    const processDir = (dirPath, location) => {
        if (!fs.existsSync(dirPath)) return;
        const files = fs.readdirSync(dirPath);

        for (const f of files) {
            if (!f.toLowerCase().endsWith('.ogg')) continue;
            const fullPath = path.join(dirPath, f);
            try {
                const stat = fs.statSync(fullPath);
                if (!stat.isFile()) continue;

                const relativePath = location === 'external' ? `external/${f}` : f;
                let id = '';
                let cleanName = '';

                // Check if name is in the format: <32-char-hash>-<name>.ogg
                const hashPrefixMatch = f.match(/^([a-fA-F0-9]{32})-(.+)\.ogg$/i);
                if (hashPrefixMatch) {
                    id = hashPrefixMatch[1].toLowerCase();
                    cleanName = hashPrefixMatch[2];
                } else {
                    const pureHashMatch = f.match(/^([a-fA-F0-9]{32})\.ogg$/i);
                    if (pureHashMatch) {
                        id = pureHashMatch[1].toLowerCase();
                        const vorbisTitle = extractVorbisTitle(fullPath);
                        cleanName = vorbisTitle || id.substring(0, 10);
                    } else {
                        try {
                            const fileBuf = fs.readFileSync(fullPath);
                            id = getBufferMd5(fileBuf);
                        } catch {
                            id = f.replace(/\.ogg$/i, '');
                        }
                        cleanName = f.replace(/\.ogg$/i, '');
                    }
                }

                items.push({
                    id,
                    cleanName,
                    rawFileName: f,
                    relativePath,
                    location,
                    sizeBytes: stat.size,
                    modifiedTime: stat.mtimeMs,
                    audioUrl: `/api/overload/audio?file=${encodeURIComponent(relativePath)}`
                });
            } catch {
                // skip unreadable files
            }
        }
    };

    processDir(audioTauntsDir, 'user');
    processDir(path.join(audioTauntsDir, 'external'), 'external');

    return items;
}

// List all pilot names with config files
export function listPilots(overloadDir) {
    if (!fs.existsSync(overloadDir)) return [];
    const files = fs.readdirSync(overloadDir);
    const pilotsSet = new Set();
    const exts = ['.extendedconfig', '.xprefs', '.xconfig', '.xprefsmod', '.xscores'];

    for (const f of files) {
        for (const ext of exts) {
            if (f.toLowerCase().endsWith(ext)) {
                const name = f.substring(0, f.length - ext.length);
                if (name && name.length > 0 && !name.startsWith('.')) {
                    pilotsSet.add(name);
                }
                break;
            }
        }
    }
    return Array.from(pilotsSet).sort();
}

// Read pilot config
export function getPilotData(overloadDir, pilotName) {
    const configPath = path.join(overloadDir, `${pilotName}.extendedconfig`);
    if (!fs.existsSync(configPath)) return null;

    const content = fs.readFileSync(configPath, 'utf8');
    const stat = fs.statSync(configPath);

    const selectedTaunts = [];
    const keybinds = [];

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
        configPath,
        selectedTaunts,
        keybinds,
        lastModified: stat.mtimeMs
    };
}

// Apply Pilot Taunts with MANDATORY automatic backup
export function applyPilotTaunts(overloadDir, pilotName, newTauntHashes) {
    const configPath = path.join(overloadDir, `${pilotName}.extendedconfig`);
    if (!fs.existsSync(configPath)) {
        return { 
            success: false, 
            backupPath: '', 
            promotedCount: 0, 
            isGameRunning: false, 
            error: `Pilot config not found: ${configPath}` 
        };
    }

    const originalContent = fs.readFileSync(configPath, 'utf8');

    // 1. MANDATORY BACKUP: Ensure Pilot Backup directory exists
    const backupDir = path.join(overloadDir, 'Pilot Backup');
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const timeStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
    const backupFileName = `${pilotName}_backup_${timeStr}.extendedconfig`;
    const backupPath = path.join(backupDir, backupFileName);

    // Write primary timestamped backup & snapshot
    fs.writeFileSync(backupPath, originalContent, 'utf8');
    fs.writeFileSync(`${configPath}.bak`, originalContent, 'utf8');

    console.log(`[OverloadBridge] MANDATORY BACKUP CREATED: ${backupPath}`);

    // 2. AUTO-PROMOTE OPPONENT TAUNTS:
    const audioTauntsDir = path.join(overloadDir, 'AudioTaunts');
    const externalDir = path.join(audioTauntsDir, 'external');
    let promotedCount = 0;

    const validHashes = newTauntHashes.slice(0, 6).map(h => (h ? h.toLowerCase().trim() : ''));

    for (const hash of validHashes) {
        if (!hash || hash === 'empty') continue;

        const localFiles = fs.existsSync(audioTauntsDir) ? fs.readdirSync(audioTauntsDir) : [];
        const existsLocally = localFiles.some(f => f.toLowerCase().includes(hash));

        if (!existsLocally && fs.existsSync(externalDir)) {
            const extFiles = fs.readdirSync(externalDir);
            const matchedExt = extFiles.find(f => f.toLowerCase().includes(hash));
            if (matchedExt) {
                const fullExtPath = path.join(externalDir, matchedExt);
                const vorbisTitle = extractVorbisTitle(fullExtPath);
                const safeName = vorbisTitle 
                    ? vorbisTitle.replace(/[^a-zA-Z0-9_\- ]/g, '').trim().replace(/\s+/g, '_')
                    : 'Opponent';
                const destFileName = `${hash}-${safeName}.ogg`;
                const destPath = path.join(audioTauntsDir, destFileName);
                fs.copyFileSync(fullExtPath, destPath);
                console.log(`[OverloadBridge] Promoted opponent taunt to local directory: ${destPath}`);
                promotedCount++;
            }
        }
    }

    // 3. Format replacement section
    const formattedLines = validHashes.map(h => {
        if (!h || h === 'empty') return '   EMPTY';
        return `   ${h}`;
    }).join('\r\n');

    const newSection = `[SECTION: AUDIOTAUNT_SELECTED_TAUNTS]\r\n${formattedLines}\r\n[/END]`;

    let updatedContent = '';
    const sectionRegex = /\[SECTION:\s*AUDIOTAUNT_SELECTED_TAUNTS\][\s\S]*?\[\/END\]/;

    if (sectionRegex.test(originalContent)) {
        updatedContent = originalContent.replace(sectionRegex, newSection);
    } else {
        updatedContent = originalContent.trimEnd() + '\r\n\r\n' + newSection + '\r\n';
    }

    fs.writeFileSync(configPath, updatedContent, 'utf8');
    console.log(`[OverloadBridge] Successfully updated taunts in ${configPath}`);

    const isGameRunning = isOverloadRunning();

    return {
        success: true,
        backupPath,
        promotedCount,
        isGameRunning
    };
}

// 6-File Pilot Family Extensions
export const PILOT_FAMILY_EXTS = [
    '.xconfig',
    '.xprefs',
    '.xprefsmod',
    '.xscores',
    '.extendedconfig',
    '.xconfigmod'
];

// Read pilot settings (.xprefs, .xprefsmod, .xconfig)
export function getPilotSettings(overloadDir, pilotName) {
    if (!fs.existsSync(overloadDir)) {
        return { error: 'Overload directory not found' };
    }

    const xprefsPath = path.join(overloadDir, `${pilotName}.xprefs`);
    const xprefsmodPath = path.join(overloadDir, `${pilotName}.xprefsmod`);
    const xconfigPath = path.join(overloadDir, `${pilotName}.xconfig`);
    const extendedconfigPath = path.join(overloadDir, `${pilotName}.extendedconfig`);

    let xprefsRaw = '';
    let xprefsmodRaw = '';
    let xconfigRaw = '';
    let extendedconfigRaw = '';

    if (fs.existsSync(xprefsPath)) {
        xprefsRaw = fs.readFileSync(xprefsPath, 'utf8');
    }
    if (fs.existsSync(xprefsmodPath)) {
        xprefsmodRaw = fs.readFileSync(xprefsmodPath, 'utf8');
    }
    if (fs.existsSync(xconfigPath)) {
        xconfigRaw = fs.readFileSync(xconfigPath, 'utf8');
    }
    if (fs.existsSync(extendedconfigPath)) {
        extendedconfigRaw = fs.readFileSync(extendedconfigPath, 'utf8');
    }

    // Extract XP (PS_XP2)
    let xp = 0;
    const xpMatch = xprefsRaw.match(/PS_XP2:(\d+):I/);
    if (xpMatch) {
        xp = parseInt(xpMatch[1], 10) || 0;
    }

    return {
        pilotName,
        xprefsRaw,
        xprefsmodRaw,
        xconfigRaw,
        extendedconfigRaw,
        xp,
        isGameRunning: isOverloadRunning()
    };
}

// Save pilot settings with process guard and auto-backup
export function savePilotSettings(overloadDir, pilotName, { xprefsRaw, xprefsmodRaw, xconfigRaw, extendedconfigRaw }) {
    if (isOverloadRunning()) {
        return { success: false, error: 'Close Overload to change settings' };
    }

    const backupDir = path.join(overloadDir, 'Pilot Backup');
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const timeStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
    const backupsCreated = [];

    // Helper to backup and write file
    const backupAndWrite = (ext, content) => {
        if (content === undefined || content === null) return;
        const filePath = path.join(overloadDir, `${pilotName}${ext}`);
        if (fs.existsSync(filePath)) {
            const backupFile = `${pilotName}_backup_${timeStr}${ext}`;
            const backupPath = path.join(backupDir, backupFile);
            fs.copyFileSync(filePath, backupPath);
            fs.copyFileSync(filePath, `${filePath}.bak`);
            backupsCreated.push(backupFile);
        }
        fs.writeFileSync(filePath, content, 'utf8');
    };

    if (xprefsRaw !== undefined) backupAndWrite('.xprefs', xprefsRaw);
    if (xprefsmodRaw !== undefined) backupAndWrite('.xprefsmod', xprefsmodRaw);
    if (xconfigRaw !== undefined) backupAndWrite('.xconfig', xconfigRaw);
    if (extendedconfigRaw !== undefined) backupAndWrite('.extendedconfig', extendedconfigRaw);

    return {
        success: true,
        backups: backupsCreated
    };
}

// Set pilot SP XP (PS_XP2)
export function setPilotXP(overloadDir, pilotName, xp) {
    if (isOverloadRunning()) {
        return { success: false, error: 'Close Overload to change settings' };
    }

    const xprefsPath = path.join(overloadDir, `${pilotName}.xprefs`);
    if (!fs.existsSync(xprefsPath)) {
        return { success: false, error: `Pilot .xprefs not found: ${xprefsPath}` };
    }

    const raw = fs.readFileSync(xprefsPath, 'utf8');
    const backupDir = path.join(overloadDir, 'Pilot Backup');
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const timeStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
    const backupFileName = `${pilotName}_backup_${timeStr}.xprefs`;
    fs.writeFileSync(path.join(backupDir, backupFileName), raw, 'utf8');

    let updated = '';
    if (raw.includes('PS_XP2:')) {
        updated = raw.replace(/PS_XP2:\d+:I/g, `PS_XP2:${xp}:I`);
    } else {
        updated = raw.endsWith(';') ? `${raw}PS_XP2:${xp}:I;` : `${raw};PS_XP2:${xp}:I;`;
    }

    fs.writeFileSync(xprefsPath, updated, 'utf8');
    return { success: true, backupFileName };
}

// Backup all pilots into a timestamped zip in Pilot Backup/
export async function backupAllPilotsZip(overloadDir) {
    const backupDir = path.join(overloadDir, 'Pilot Backup');
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    const zip = new JSZip();
    let fileCount = 0;

    const files = fs.readdirSync(overloadDir);
    for (const f of files) {
        const lower = f.toLowerCase();
        const isFamily = PILOT_FAMILY_EXTS.some(ext => lower.endsWith(ext));
        if (isFamily) {
            const filePath = path.join(overloadDir, f);
            const stat = fs.statSync(filePath);
            if (stat.isFile()) {
                const buf = fs.readFileSync(filePath);
                zip.file(f, buf);
                fileCount++;
            }
        }
    }

    if (fileCount === 0) {
        return { success: false, error: 'No pilot files found to backup' };
    }

    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const timeStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
    const zipName = `Pilots_Full_Backup_${timeStr}.zip`;
    const zipPath = path.join(backupDir, zipName);

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 6 } });
    fs.writeFileSync(zipPath, zipBuffer);

    return {
        success: true,
        fileName: zipName,
        fileCount,
        backupPath: zipPath
    };
}

// Clone pilot across the 6-file family
export function clonePilot(overloadDir, sourcePilot, targetPilot) {
    if (!targetPilot || !targetPilot.trim()) {
        return { success: false, error: 'Target pilot name is required' };
    }
    const cleanTarget = targetPilot.trim();

    let clonedCount = 0;
    for (const ext of PILOT_FAMILY_EXTS) {
        const srcPath = path.join(overloadDir, `${sourcePilot}${ext}`);
        const dstPath = path.join(overloadDir, `${cleanTarget}${ext}`);

        if (fs.existsSync(srcPath)) {
            fs.copyFileSync(srcPath, dstPath);
            clonedCount++;
        }
    }

    if (clonedCount === 0) {
        return { success: false, error: `No files found for source pilot: ${sourcePilot}` };
    }

    return { success: true, clonedCount, targetPilot: cleanTarget };
}

// Rename pilot across the 6-file family
export function renamePilot(overloadDir, sourcePilot, targetPilot) {
    if (isOverloadRunning()) {
        return { success: false, error: 'Close Overload to change settings' };
    }
    if (!targetPilot || !targetPilot.trim()) {
        return { success: false, error: 'Target pilot name is required' };
    }
    const cleanTarget = targetPilot.trim();

    const filesToRename = [];
    for (const ext of PILOT_FAMILY_EXTS) {
        const srcPath = path.join(overloadDir, `${sourcePilot}${ext}`);
        const dstPath = path.join(overloadDir, `${cleanTarget}${ext}`);
        if (fs.existsSync(srcPath)) {
            filesToRename.push({ src: srcPath, dst: dstPath });
        }
    }

    if (filesToRename.length === 0) {
        return { success: false, error: `No files found for pilot ${sourcePilot}` };
    }

    const renamed = [];
    try {
        for (const item of filesToRename) {
            fs.renameSync(item.src, item.dst);
            renamed.push(item);
        }
    } catch (err) {
        // Rollback
        for (const item of renamed) {
            try { fs.renameSync(item.dst, item.src); } catch {}
        }
        return { success: false, error: `Rename failed: ${err.message}` };
    }

    return { success: true, renamedCount: renamed.length, targetPilot: cleanTarget };
}

// Delete pilot across the 6-file family
export function deletePilot(overloadDir, pilotName) {
    if (isOverloadRunning()) {
        return { success: false, error: 'Close Overload to change settings' };
    }

    const pilots = listPilots(overloadDir);
    if (pilots.length <= 1) {
        return { success: false, error: 'Cannot delete the only remaining pilot' };
    }

    // Mandatory safety backup before deletion
    const backupDir = path.join(overloadDir, 'Pilot Backup');
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const timeStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;

    let deletedCount = 0;
    for (const ext of PILOT_FAMILY_EXTS) {
        const filePath = path.join(overloadDir, `${pilotName}${ext}`);
        if (fs.existsSync(filePath)) {
            // Copy to backup first
            const bkpPath = path.join(backupDir, `${pilotName}_predelete_${timeStr}${ext}`);
            fs.copyFileSync(filePath, bkpPath);
            fs.unlinkSync(filePath);
            deletedCount++;
        }
    }

    return { success: true, deletedCount };
}
