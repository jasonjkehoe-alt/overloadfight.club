// Runs the full passes (server/lib/statsPasses.js) off the main thread, so a
// refresh over every stored game does not stall requests. The rating pass
// sorts what it kept by date once both files are read. It reads each file
// on its own read-only connection in pages by id: each page is a short read,
// so WAL checkpoints are not held back for the length of the pass. db.js
// writes the results.
import fs from 'fs';
import { parentPort, workerData } from 'worker_threads';
import Database from 'better-sqlite3';
import { PILOT_MONTH_COLUMNS, RATING_SNAPSHOT_COLUMNS, REGION_MONTH_COLUMNS, archivePass, mapPass, pilotPass, ratingPass, regionPass } from './lib/statsPasses.js';
import { regionOf } from './lib/serverRegions.js';

const PAGE_SIZE = 500;
const { hotPath, coldPath, thirtyDaysAgo } = workerData;

// Each stored server's region by IP, for matches stored without a server name
// (S15). Read once, before the scan.
function regionsByIp() {
    const conn = new Database(hotPath, { readonly: true, fileMustExist: true });
    try {
        return new Map(conn.prepare('SELECT ip, name, notes FROM servers').all().map(s => [s.ip, regionOf(s.name, s.notes)]));
    } finally {
        conn.close();
    }
}

const passes = { pilots: pilotPass(), archive: archivePass(), maps: mapPass(thirtyDaysAgo), ratings: ratingPass(), regions: regionPass(regionsByIp()) };
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

// What the main thread must write to bring a derived table (rating_snapshots,
// pilot_months, region_months) in line with the rows this pass built: the rows that are new or
// differ, and the keys (two columns, `columns[0]` and `columns[1]`) the pass no
// longer has. Most refreshes change only the latest days or months, so this
// keeps a rewrite of every row off the main thread.
function tableChanges(table, columns, rows) {
    const [a, b] = columns;
    const fresh = new Map(rows.map(r => [`${r[a]}\n${r[b]}`, r]));
    const deletes = [];
    const conn = new Database(hotPath, { readonly: true, fileMustExist: true });
    try {
        for (const old of conn.prepare(`SELECT * FROM ${table}`).iterate()) {
            const key = `${old[a]}\n${old[b]}`;
            const row = fresh.get(key);
            if (!row) deletes.push([old[a], old[b]]);
            else if (columns.every(c => row[c] === old[c])) fresh.delete(key);
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
        ratings = tableChanges('rating_snapshots', RATING_SNAPSHOT_COLUMNS, passes.ratings.rows());
    } catch (err) {
        errors.ratings = err.message;
    }
}
let months = null;
if (!errors.pilots) {
    try {
        months = tableChanges('pilot_months', PILOT_MONTH_COLUMNS, passes.pilots.months());
    } catch (err) {
        errors.months = err.message;
    }
}
let regions = null;
if (!errors.regions) {
    try {
        regions = tableChanges('region_months', REGION_MONTH_COLUMNS, passes.regions.rows());
    } catch (err) {
        errors.regions = err.message;
    }
}
parentPort.postMessage({
    errors,
    pilots,
    archive: errors.archive || errors.pilots ? null : passes.archive.payload(pilots, { hotDbSize: size(hotPath), coldDbSize: size(coldPath) }),
    maps: errors.maps ? null : passes.maps.rows(),
    ratings,
    months,
    regions
});
