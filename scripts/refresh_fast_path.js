
import db from '../server/db.js';

console.log("Running Fast Path Refresh...");
await db.refreshPilotStats();
console.log("Done.");
