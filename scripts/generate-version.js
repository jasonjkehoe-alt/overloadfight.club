
import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';

const publicDir = path.join(process.cwd(), 'public');
const versionFile = path.join(publicDir, 'version.json');

try {
    // Ensure public dir exists
    if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
    }

    let commitHash = 'unknown';
    let commitDate = 'unknown';

    try {
        commitHash = execSync('git rev-parse --short HEAD').toString().trim();
        commitDate = execSync('git log -1 --format=%cd').toString().trim();
    } catch (e) {
        console.warn('Failed to get git info, using fallback');
    }

    const versionInfo = {
        hash: commitHash,
        date: commitDate,
        buildTime: new Date().toISOString()
    };

    fs.writeFileSync(versionFile, JSON.stringify(versionInfo, null, 2));
    console.log(`Generated version.json: ${JSON.stringify(versionInfo)}`);

} catch (error) {
    console.error('Error generating version file:', error);
    process.exit(1);
}
