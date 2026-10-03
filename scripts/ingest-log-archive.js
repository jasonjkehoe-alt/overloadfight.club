import archiveIngestService, { ARCHIVE_MONTHS } from '../server/services/archiveIngestService.js';
import db from '../server/db.js';

async function main() {
    console.log('====================================================');
    console.log('  OVERLOAD FIGHT CLUB - GITHUB LOG ARCHIVE INGESTER ');
    console.log('====================================================');
    console.log(`Source: https://github.com/overload-development-community/tracker-log-archive`);
    console.log(`Total Monthly Archives: ${ARCHIVE_MONTHS.length} (Jul 2019 - Apr 2022)`);
    console.log('Target: cold_storage.db (High-throughput batch transactions)');
    console.log('----------------------------------------------------');

    // Optional argument to ingest specific months e.g. node scripts/ingest-log-archive.js 2019-07 2019-08
    const specificMonths = process.argv.slice(2).filter(m => /^\d{4}-\d{2}$/.test(m));
    const targetMonths = specificMonths.length > 0 ? specificMonths : ARCHIVE_MONTHS;

    console.log(`Queued Months (${targetMonths.length}): ${targetMonths.join(', ')}`);
    console.log('Starting ingestion...\n');

    const startTime = Date.now();

    try {
        await archiveIngestService.startIngestion(targetMonths);

        // Poll status until done
        await new Promise((resolve) => {
            const interval = setInterval(() => {
                const status = archiveIngestService.getStatus();
                if (!status.isRunning) {
                    clearInterval(interval);
                    resolve();
                }
            }, 500);
        });

        const finalStatus = archiveIngestService.getStatus();
        const durationSec = Math.round((Date.now() - startTime) / 1000);

        console.log('\n----------------------------------------------------');
        if (finalStatus.status === 'completed') {
            console.log(`✔ Ingestion Complete in ${durationSec}s!`);
            console.log(`✔ Total Games Inserted into Cold Storage: ${finalStatus.totalGamesInserted}`);
        } else if (finalStatus.status === 'cancelled') {
            console.log(`⚠ Ingestion was cancelled by operator.`);
        } else {
            console.log(`✖ Ingestion ended with status: ${finalStatus.status}`);
            if (finalStatus.error) console.error(`Error details: ${finalStatus.error}`);
        }
        console.log('====================================================');
        process.exit(0);
    } catch (err) {
        console.error('Fatal Error during ingestion:', err);
        process.exit(1);
    }
}

main();
