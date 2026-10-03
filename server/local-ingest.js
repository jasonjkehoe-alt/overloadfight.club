import fs from 'fs';
import path from 'path';
import db from './db.js';

/**
 * Extracts the game JSON object from the HTML content.
 * @param {string} htmlContent 
 * @returns {object|null}
 */
function extractGameData(htmlContent) {
    try {
        const marker = 'ArchiveJs.game = ';
        const startIndex = htmlContent.indexOf(marker);
        if (startIndex === -1) return null;

        const jsonStartIndex = htmlContent.indexOf('{', startIndex);
        if (jsonStartIndex === -1) return null;

        // Simple brace counting to find the end of the JSON object
        let braceCount = 0;
        let jsonEndIndex = -1;
        let inString = false;
        let escape = false;

        for (let i = jsonStartIndex; i < htmlContent.length; i++) {
            const char = htmlContent[i];

            if (escape) {
                escape = false;
                continue;
            }

            if (char === '\\') {
                escape = true;
                continue;
            }

            if (char === '"') {
                inString = !inString;
                continue;
            }

            if (!inString) {
                if (char === '{') {
                    braceCount++;
                } else if (char === '}') {
                    braceCount--;
                    if (braceCount === 0) {
                        jsonEndIndex = i + 1;
                        break;
                    }
                }
            }
        }

        if (jsonEndIndex !== -1) {
            const jsonString = htmlContent.substring(jsonStartIndex, jsonEndIndex);
            return JSON.parse(jsonString);
        }
    } catch (e) {
        console.error("Error parsing game JSON:", e);
    }
    return null;
}

/**
 * Scans a directory for HTML files and ingests them into the database.
 * @param {string} directoryPath 
 * @returns {Promise<{processed: number, errors: number, games: number}>}
 */
async function scanDirectory(directoryPath) {
    const stats = {
        processed: 0,
        errors: 0,
        games: 0
    };

    if (!fs.existsSync(directoryPath)) {
        throw new Error(`Directory not found: ${directoryPath}`);
    }

    const files = fs.readdirSync(directoryPath).filter(f => f.endsWith('.html'));
    console.log(`Found ${files.length} HTML files in ${directoryPath}`);

    for (const file of files) {
        try {
            const filePath = path.join(directoryPath, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            const gameData = extractGameData(content);

            if (gameData) {
                // Ensure ID is present (use filename if missing, though JSON should have it)
                if (!gameData.id) {
                    const idFromFilename = parseInt(path.basename(file, '.html'));
                    if (!isNaN(idFromFilename)) {
                        gameData.id = idFromFilename;
                    }
                }

                if (gameData.id) {
                    db.saveGames([gameData]);
                    stats.games++;
                }
            }
            stats.processed++;
        } catch (e) {
            console.error(`Error processing file ${file}:`, e.message);
            stats.errors++;
        }

        // Yield to event loop every 10 files to not block server
        if (stats.processed % 10 === 0) {
            await new Promise(resolve => setTimeout(resolve, 0));
        }
    }

    return stats;
}

export default {
    scanDirectory,
    extractGameData
};
