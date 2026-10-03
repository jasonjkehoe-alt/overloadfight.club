
import db from '../server/db.js';

console.log("Running Fast Path Refresh...");
db.refreshPilotStats();
console.log("Done.");
