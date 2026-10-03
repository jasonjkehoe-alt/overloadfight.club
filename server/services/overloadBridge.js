import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import os from 'os';
import { execSync } from 'child_process';

// Check if Overload process is currently active
export function isOverloadRunning() {
    try {
        const out = execSync('tasklist').toString();
        return out.toLowerCase().includes('overload.exe');
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

// List all pilot names with extendedconfig
export function listPilots(overloadDir) {
    if (!fs.existsSync(overloadDir)) return [];
    const files = fs.readdirSync(overloadDir);
    const pilots = [];

    for (const f of files) {
        if (f.toLowerCase().endsWith('.extendedconfig')) {
            const name = f.substring(0, f.length - '.extendedconfig'.length);
            pilots.push(name);
        }
    }
    return pilots;
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
