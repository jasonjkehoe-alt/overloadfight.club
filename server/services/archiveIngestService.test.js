import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

let dataDir;
let db;
let ArchiveIngestService;
let ARCHIVE_MONTHS;

beforeAll(async () => {
    dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ofc-archive-test-'));
    process.env.DATA_DIR = dataDir;
    db = (await import('../db.js')).default;
    const ingestModule = await import('./archiveIngestService.js');
    ArchiveIngestService = ingestModule.ArchiveIngestService;
    ARCHIVE_MONTHS = ingestModule.ARCHIVE_MONTHS;
});

afterAll(async () => {
    await db.close?.();
    fs.rmSync(dataDir, { recursive: true, force: true });
});

describe('archiveIngestService status derivation', () => {
    it('initializes with 0/34 and idle status when cold storage is empty', () => {
        const service = new ArchiveIngestService();
        const status = service.getStatus();

        expect(status.completedMonths).toEqual([]);
        expect(status.completedCount).toBe(0);
        expect(status.totalMonths).toBe(ARCHIVE_MONTHS.length);
        expect(status.totalGamesInserted).toBe(0);
        expect(status.percent).toBe(0);
        expect(status.status).toBe('idle');
    });

    it('derives completed months and total game counts from cold storage', () => {
        // Insert games for 2019-07 and 2020-01
        db.saveColdGamesBatch([
            { id: 80001, date: '2019-07-15T12:00:00.000Z', details: JSON.stringify({ id: 80001, kills: [] }) },
            { id: 80002, date: '2019-07-28T18:30:00.000Z', details: JSON.stringify({ id: 80002, kills: [] }) },
            { id: 80003, date: '2020-01-10T05:15:00.000Z', details: JSON.stringify({ id: 80003, kills: [] }) }
        ]);

        const service = new ArchiveIngestService();
        const status = service.getStatus();

        expect(status.completedMonths).toEqual(['2019-07', '2020-01']);
        expect(status.completedCount).toBe(2);
        expect(status.totalGamesInserted).toBe(3);
        expect(status.status).toBe('idle');
    });

    it('preserves truthful status across simulated restarts without memory amnesia', () => {
        // Simulate container restart by instantiating a completely new service
        const restartedService = new ArchiveIngestService();
        const status = restartedService.getStatus();

        expect(status.completedMonths).toContain('2019-07');
        expect(status.completedMonths).toContain('2020-01');
        expect(status.completedCount).toBe(2);
        expect(status.totalGamesInserted).toBe(3);
        expect(status.status).toBe('idle');
    });

    it('marks status as completed when all archive months have records', () => {
        // Populate the remaining months in ARCHIVE_MONTHS
        const remainingGames = ARCHIVE_MONTHS
            .filter(m => m !== '2019-07' && m !== '2020-01')
            .map((month, idx) => ({
                id: 81000 + idx,
                date: `${month}-15T12:00:00.000Z`,
                details: JSON.stringify({ id: 81000 + idx, kills: [] })
            }));
        db.saveColdGamesBatch(remainingGames);

        const service = new ArchiveIngestService();
        const status = service.getStatus();

        expect(status.completedCount).toBe(ARCHIVE_MONTHS.length);
        expect(status.completedMonths.length).toBe(ARCHIVE_MONTHS.length);
        expect(status.totalGamesInserted).toBe(3 + remainingGames.length);
        expect(status.percent).toBe(100);
        expect(status.status).toBe('completed');
    });

    it('does not overwrite running state when an ingestion is actively running', () => {
        const service = new ArchiveIngestService();
        service.state.isRunning = true;
        service.state.status = 'running';
        service.state.currentMonth = '2020-06';
        service.state.completedMonths = ['2019-07'];
        service.state.totalGamesInserted = 999;

        const status = service.getStatus();
        expect(status.status).toBe('running');
        expect(status.currentMonth).toBe('2020-06');
        expect(status.completedMonths).toEqual(['2019-07']);
        expect(status.totalGamesInserted).toBe(999);
    });

    it('parses XML archives into database-ready match records', async () => {
        const service = new ArchiveIngestService();
        const xml = `
            <root>
                <row>
                    <CompletedId>77001</CompletedId>
                    <Server>Test Server</Server>
                    <Stats>{"start":"2019-08-01T12:00:00Z","players":[{"name":"PilotA"}]}</Stats>
                </row>
                <row>
                    <CompletedId>77002</CompletedId>
                    <Server>Another Server</Server>
                    <Stats>{"start":"2019-08-02T14:00:00Z","players":[{"name":"PilotB"}]}</Stats>
                </row>
            </root>
        `;

        const games = await service.parseXmlArchive(xml, 'Default');
        expect(games).toHaveLength(2);
        expect(games[0].id).toBe(77001);
        expect(games[0].date).toBe('2019-08-01T12:00:00Z');
        const details = JSON.parse(games[0].details);
        expect(details.server.name).toBe('Test Server');
    });
});
