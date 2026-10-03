import JSZip from 'jszip';
import db from '../db.js';

export const ARCHIVE_MONTHS = [
    '2019-07', '2019-08', '2019-09', '2019-10', '2019-11', '2019-12',
    '2020-01', '2020-02', '2020-03', '2020-04', '2020-05', '2020-06',
    '2020-07', '2020-08', '2020-09', '2020-10', '2020-11', '2020-12',
    '2021-01', '2021-02', '2021-03', '2021-04', '2021-05', '2021-06',
    '2021-07', '2021-08', '2021-09', '2021-10', '2021-11', '2021-12',
    '2022-01', '2022-02', '2022-03', '2022-04'
];

const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/overload-development-community/tracker-log-archive/main';

class ArchiveIngestService {
    constructor() {
        this.state = {
            isRunning: false,
            status: 'idle', // 'idle' | 'running' | 'completed' | 'cancelled' | 'error'
            currentMonth: null,
            completedMonths: [],
            totalMonths: ARCHIVE_MONTHS.length,
            totalGamesInserted: 0,
            currentMonthGames: 0,
            startedAt: null,
            completedAt: null,
            error: null,
            logs: []
        };
        this.cancelRequested = false;
    }

    getStatus() {
        const completedMonthsList = Array.isArray(this.state.completedMonths) ? this.state.completedMonths : [];
        return {
            ...this.state,
            completedMonths: completedMonthsList,
            completedCount: completedMonthsList.length,
            percent: this.state.totalMonths > 0 
                ? Math.round((completedMonthsList.length / this.state.totalMonths) * 100) 
                : 0
        };
    }

    log(message) {
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
        const entry = `[${timestamp}] ${message}`;
        console.log(`[ArchiveIngest] ${entry}`);
        this.state.logs.push(entry);
        if (this.state.logs.length > 50) {
            this.state.logs.shift();
        }
    }

    cancel() {
        if (this.state.isRunning) {
            this.cancelRequested = true;
            this.log('Cancellation requested by operator...');
            this.state.status = 'cancelled';
        }
    }

    async parseXmlArchive(xmlContent, defaultServerName = '') {
        const games = [];
        // Regex scanning for each <row>...</row> entry
        const rowRegex = /<row>([\s\S]*?)<\/row>/g;
        let match;

        while ((match = rowRegex.exec(xmlContent)) !== null) {
            const rowContent = match[1];

            const idMatch = rowContent.match(/<CompletedId>(\d+)<\/CompletedId>/i);
            const serverMatch = rowContent.match(/<Server>(.*?)<\/Server>/i);
            const statsMatch = rowContent.match(/<Stats>([\s\S]*?)<\/Stats>/i);

            if (!idMatch || !statsMatch) continue;

            const gameId = parseInt(idMatch[1], 10);
            const serverName = serverMatch ? serverMatch[1].trim() : defaultServerName;

            try {
                let statsStr = statsMatch[1].trim();
                // Parse stats JSON
                const statsObj = JSON.parse(statsStr);

                // Ensure essential properties exist
                statsObj.id = gameId;
                if (!statsObj.server) {
                    statsObj.server = { name: serverName };
                } else if (typeof statsObj.server === 'object' && !statsObj.server.name) {
                    statsObj.server.name = serverName;
                }

                const gameDate = statsObj.start || statsObj.end || statsObj.date || new Date().toISOString();

                games.push({
                    id: gameId,
                    date: gameDate,
                    ip: statsObj.server?.ip || null,
                    details: JSON.stringify(statsObj)
                });
            } catch (jsonErr) {
                // Skip malformed individual row
            }
        }

        return games;
    }

    async startIngestion(monthsToProcess = ARCHIVE_MONTHS) {
        if (this.state.isRunning) {
            throw new Error('An archive ingestion job is already currently running.');
        }

        this.cancelRequested = false;
        this.state = {
            isRunning: true,
            status: 'running',
            currentMonth: null,
            completedMonths: [],
            totalMonths: monthsToProcess.length,
            totalGamesInserted: 0,
            currentMonthGames: 0,
            startedAt: new Date().toISOString(),
            completedAt: null,
            error: null,
            logs: []
        };

        this.log(`Starting ingestion of ${monthsToProcess.length} monthly archive packages from GitHub...`);

        // Run asynchronously
        (async () => {
            try {
                for (const month of monthsToProcess) {
                    if (this.cancelRequested) {
                        this.log('Ingestion stopped due to operator cancellation.');
                        this.state.status = 'cancelled';
                        this.state.isRunning = false;
                        return;
                    }

                    this.state.currentMonth = month;
                    this.state.currentMonthGames = 0;
                    const url = `${GITHUB_RAW_BASE}/${month}.zip`;
                    this.log(`Fetching ${month}.zip from GitHub repository...`);

                    const response = await fetch(url);
                    if (!response.ok) {
                        throw new Error(`Failed to download ${month}.zip: HTTP ${response.status} ${response.statusText}`);
                    }

                    const arrayBuffer = await response.arrayBuffer();
                    this.log(`Downloaded ${month}.zip (${(arrayBuffer.byteLength / (1024 * 1024)).toFixed(2)} MB). Unpacking in-memory...`);

                    const zip = await JSZip.loadAsync(arrayBuffer);
                    const xmlFileName = `${month}.xml`;
                    const zipFile = zip.files[xmlFileName] || Object.values(zip.files).find(f => f.name.endsWith('.xml'));

                    if (!zipFile) {
                        this.log(`Warning: No XML log file found in ${month}.zip. Skipping month.`);
                        this.state.completedMonths.push(month);
                        continue;
                    }

                    const xmlText = await zipFile.async('string');
                    const games = await this.parseXmlArchive(xmlText, `Overload Archive ${month}`);
                    this.log(`Parsed ${games.length} match combat logs for ${month}. Inserting into cold_storage.db...`);

                    // Batch insert in chunks of 500
                    const chunkSize = 500;
                    let monthInserted = 0;
                    for (let i = 0; i < games.length; i += chunkSize) {
                        if (this.cancelRequested) break;
                        const chunk = games.slice(i, i + chunkSize);
                        const count = db.saveColdGamesBatch(chunk);
                        monthInserted += count;
                        this.state.currentMonthGames = monthInserted;
                        this.state.totalGamesInserted += count;
                    }

                    this.state.completedMonths.push(month);
                    this.log(`Successfully completed ${month}: inserted ${monthInserted} games. (Total: ${this.state.totalGamesInserted})`);
                }

                if (!this.cancelRequested) {
                    this.state.status = 'completed';
                    this.log(`All ${monthsToProcess.length} months ingested successfully! Total games inserted: ${this.state.totalGamesInserted}.`);
                    this.log('Refreshing pilot performance cache across all historical matches...');
                    try {
                        db.refreshPilotStats();
                        this.log('Pilot performance intelligence cache updated successfully.');
                    } catch (cacheErr) {
                        this.log(`Warning: Cache refresh encountered: ${cacheErr.message}`);
                    }
                }
            } catch (err) {
                this.state.status = 'error';
                this.state.error = err.message;
                this.log(`Ingestion failed with error: ${err.message}`);
            } finally {
                this.state.isRunning = false;
                this.state.completedAt = new Date().toISOString();
                this.state.currentMonth = null;
            }
        })();

        return this.getStatus();
    }
}

export const archiveIngestService = new ArchiveIngestService();
export default archiveIngestService;
