import axios from 'axios';

const BASE_URL = 'https://tracker.otl.gg/game';

/**
 * Fetches live game data by scraping the HTML page.
 * @param {string} ip - The IP address of the server (e.g., '107.175.219.234')
 * @returns {Promise<Object|null>} The parsed game data or null if not found.
 */
async function fetchLiveGameData(ip) {
    try {
        const url = `${BASE_URL}/${ip}`;
        console.log(`[Scraper] Fetching live data from ${url}...`);

        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 5000 // 5 second timeout
        });

        const html = response.data;

        // Look for the GameJs.game initialization
        // Regex captures the content inside new Game(...);
        const match = html.match(/GameJs\.game\s*=\s*new\s*Game\(([\s\S]*?)\);\s*<\/script>/);

        if (match && match[1]) {
            try {
                const gameData = JSON.parse(match[1]);
                return gameData;
            } catch (parseError) {
                console.error(`[Scraper] Failed to parse JSON for ${ip}:`, parseError.message);
                return null;
            }
        } else {
            console.warn(`[Scraper] No game data found in HTML for ${ip}`);
            return null;
        }

    } catch (error) {
        console.error(`[Scraper] Error fetching ${ip}:`, error.message);
        return null;
    }
}

export default {
    fetchLiveGameData
};
