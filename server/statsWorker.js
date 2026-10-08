// Runs the full passes (server/lib/statsPasses.js) off the main thread, so a
// refresh over every stored game does not stall requests. The rating pass
// sorts what it kept by date once both files are read. It reads each file
// on its own read-only connection in pages by id: each page is a short read,
// so WAL checkpoints are not held back for the length of the pass. db.js
// writes the results.
import fs from 'fs';
import { parentPort, workerData } from 'worker_threads';
import Database from 'better-sqlite3';
import { RATING_SNAPSHOT_COLUMNS, archivePass, mapPass, pilotPass, ratingPass } from './lib/statsPasses.js';

const PAGE_SIZE = 500;
const { hotPath, coldPath, thirtyDaysAgo } = workerData;

const passes = { pilots: pilotPass(), archive: archivePass(), maps: mapPass(thirtyDaysAgo), ratings: ratingPass() };
// A pass that throws stops on its own; the others carry on, as when each pass
// ran its own scan.
const errors = {};
// Ids read from hot storage. The pages are separate reads, so a game moved to
// cold storage mid-pass (or left in both files by a crash) would otherwise be
// read twice.
const seen = new Set();

for (const file of [hotPath, coldPath]) {
    const isHot = file === hotPath;
    const conn = new Database(file, { readonly: true, fileMustExist: true });
    try {
        const page = conn.prepare('SELECT id, date, ip, details FROM games WHERE id > ? ORDER BY id LIMIT ?');
        let afterId = Number.MIN_SAFE_INTEGER;
        for (let rows = page.all(afterId, PAGE_SIZE); rows.length > 0; rows = page.all(afterId, PAGE_SIZE)) {
            for (const row of rows) {
                if (isHot) seen.add(row.id);
                else if (seen.has(row.id)) continue;
                let game = null;
                try {
                    game = JSON.parse(row.details);
                } catch {}
                for (const [name, pass] of Object.entries(passes)) {
                    if (errors[name]) continue;
                    try {
                        pass.add(row, game);
                    } catch (err) {
                        errors[name] = err.message;
                    }
                }
            }
            afterId = rows[rows.length - 1].id;
        }
    } finally {
        conn.close();
    }
}

// What the main thread must write to bring rating_snapshots in line with the
// replay: the rows that are new or differ, and the (pilot, day) keys the
// replay no longer has. Most refreshes change only the latest days, so this
// keeps a rewrite of every row off the main thread.
function ratingChanges(rows) {
    const fresh = new Map(rows.map(r => [`${r.pilot}\n${r.day}`, r]));
    const deletes = [];
    const conn = new Database(hotPath, { readonly: true, fileMustExist: true });
    try {
        for (const old of conn.prepare('SELECT * FROM rating_snapshots').iterate()) {
            const key = `${old.pilot}\n${old.day}`;
            const row = fresh.get(key);
            if (!row) deletes.push([old.pilot, old.day]);
            else if (RATING_SNAPSHOT_COLUMNS.every(c => row[c] === old[c])) fresh.delete(key);
        }
    } finally {
        conn.close();
    }
    return { total: rows.length, upserts: [...fresh.values()], deletes };
}

const size = file => (fs.existsSync(file) ? fs.statSync(file).size : 0);
const pilots = errors.pilots ? [] : passes.pilots.rows();
// The replay runs here, after the scan, so a failure in it must not lose the other passes.
let ratings = null;
if (!errors.ratings) {
    try {
        ratings = ratingChanges(passes.ratings.rows());
    } catch (err) {
        errors.ratings = err.message;
    }
}
parentPort.postMessage({
    errors,
    pilots,
    archive: errors.archive || errors.pilots ? null : passes.archive.payload(pilots, { hotDbSize: size(hotPath), coldDbSize: size(coldPath) }),
    maps: errors.maps ? null : passes.maps.rows(),
    ratings
});
