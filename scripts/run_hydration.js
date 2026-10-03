
import backfillManager from '../server/backfill.js';
import db from '../server/db.js';

console.log("--- Manual Data Hydration Trigger ---");
console.log("This script will find 'summary-only' games and fetch full details from the API.");

try {
    // Create a job record so progress is tracked in DB and visible in Admin UI
    // Usage: createJob(startId, endId, rateLimitMs, jobType)
    // We set rateLimit to 100ms for faster processing (approx 10 games/sec)
    const jobId = backfillManager.createJob(0, 0, 100, 'hydrate');
    console.log(`Created Backfill Job ID: ${jobId}`);

    const job = db.getBackfillJob.get(jobId);

    console.log("Starting Hydration Loop... (Press Ctrl+C to stop)");

    // We run the logic directly in this process
    // This allows us to see console logs immediately
    await backfillManager.processHydrationJob(job);

    console.log("Job Complete!");

} catch (e) {
    console.error("Detailed Error:", e);
}
