
import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';

const publicDir = path.join(process.cwd(), 'public');
const distDir = path.join(process.cwd(), 'dist');
const versionFile = path.join(publicDir, 'version.json');
const distVersionFile = path.join(distDir, 'version.json');

try {
    // Ensure public dir exists
    if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
    }

    let commitHash = '';
    let commitDate = '';

    // 1. Try Git command directly
    try {
        const hash = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
        const date = execSync('git log -1 --format=%cd', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
        if (hash) commitHash = hash;
        if (date) commitDate = date;
    } catch (e) {
        // Git CLI not available or not inside a working git tree
    }

    // 2. Try manual .git directory inspection if git CLI failed
    if (!commitHash) {
        try {
            let cur = process.cwd();
            for (let i = 0; i < 3; i++) {
                const gitDir = path.join(cur, '.git');
                if (fs.existsSync(gitDir)) {
                    const headPath = path.join(gitDir, 'HEAD');
                    if (fs.existsSync(headPath)) {
                        const headContent = fs.readFileSync(headPath, 'utf8').trim();
                        if (headContent.startsWith('ref: ')) {
                            const refRelative = headContent.replace('ref: ', '').trim();
                            const refPath = path.join(gitDir, refRelative);
                            if (fs.existsSync(refPath)) {
                                commitHash = fs.readFileSync(refPath, 'utf8').trim().substring(0, 7);
                            } else {
                                const packedPath = path.join(gitDir, 'packed-refs');
                                if (fs.existsSync(packedPath)) {
                                    const packed = fs.readFileSync(packedPath, 'utf8');
                                    for (const line of packed.split('\n')) {
                                        if (line.endsWith(refRelative)) {
                                            commitHash = line.split(' ')[0].trim().substring(0, 7);
                                            break;
                                        }
                                    }
                                }
                            }
                        } else if (headContent.length >= 7) {
                            commitHash = headContent.substring(0, 7);
                        }
                    }
                    break;
                }
                cur = path.dirname(cur);
            }
        } catch (e) {}
    }

    // 3. Try Environment Variables
    if (!commitHash) {
        commitHash = process.env.GIT_COMMIT_HASH || process.env.COMMIT_HASH || process.env.VITE_GIT_COMMIT_HASH || '';
    }
    if (!commitDate) {
        commitDate = process.env.GIT_COMMIT_DATE || process.env.COMMIT_DATE || '';
    }

    // 4. Try existing public/version.json or dist/version.json (PRESERVE prior real hash)
    const candidates = [
        versionFile,
        distVersionFile,
        path.join(process.cwd(), 'version.json')
    ];
    for (const cand of candidates) {
        if ((!commitHash || !commitDate) && fs.existsSync(cand)) {
            try {
                const raw = JSON.parse(fs.readFileSync(cand, 'utf8'));
                if (!commitHash && raw.hash && raw.hash !== 'unknown') {
                    commitHash = raw.hash;
                }
                if (!commitDate && raw.date && raw.date !== 'unknown') {
                    commitDate = raw.date;
                }
            } catch (e) {}
        }
    }

    // Fallbacks if nothing found
    if (!commitHash) commitHash = 'unknown';
    if (!commitDate) commitDate = 'unknown';

    const versionInfo = {
        hash: commitHash,
        date: commitDate,
        buildTime: new Date().toISOString()
    };

    fs.writeFileSync(versionFile, JSON.stringify(versionInfo, null, 2));
    if (fs.existsSync(distDir)) {
        fs.writeFileSync(distVersionFile, JSON.stringify(versionInfo, null, 2));
    }
    console.log(`Generated version.json: ${JSON.stringify(versionInfo)}`);

} catch (error) {
    console.error('Error generating version file:', error);
    process.exit(1);
}
