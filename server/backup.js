import fs from 'fs';
import path from 'path';
import db, { backupsDir } from './db.js';

// Days of backups kept in backupsDir.
const KEEP_DAYS = 7;
const DAY_DIR = /^\d{4}-\d{2}-\d{2}$/;
const PARTIAL = '.partial';

// Local calendar day (the container runs with TZ=America/Chicago).
const localDay = date => [
  date.getFullYear(),
  String(date.getMonth() + 1).padStart(2, '0'),
  String(date.getDate()).padStart(2, '0')
].join('-');

// Copy tracker.db and cold_storage.db into backupsDir/YYYY-MM-DD through
// SQLite's backup API, then delete all but the KEEP_DAYS newest days. The copy
// is written to a .partial directory and renamed when both files are done, so a
// day directory always holds a complete pair. A second run on the same day
// replaces that day's pair. Returns the day directory.
export async function backupDatabases(now = new Date()) {
  fs.mkdirSync(backupsDir, { recursive: true });
  for (const name of fs.readdirSync(backupsDir)) {
    if (name.endsWith(PARTIAL)) fs.rmSync(path.join(backupsDir, name), { recursive: true, force: true });
  }

  const day = localDay(now);
  const partial = path.join(backupsDir, `${day}${PARTIAL}`);
  fs.mkdirSync(partial);
  await db.backupHot(path.join(partial, 'tracker.db'));
  await db.backupCold(path.join(partial, 'cold_storage.db'));

  const target = path.join(backupsDir, day);
  fs.rmSync(target, { recursive: true, force: true });
  fs.renameSync(partial, target);

  const days = fs.readdirSync(backupsDir).filter(name => DAY_DIR.test(name)).sort().reverse();
  for (const old of days.slice(KEEP_DAYS)) {
    fs.rmSync(path.join(backupsDir, old), { recursive: true, force: true });
  }
  return target;
}
