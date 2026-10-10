// Runs the full passes (server/lib/statsPasses.js) off the main thread, so a
// refresh over every stored game does not stall requests. The rating pass
// sorts what it kept by date once both files are read. It reads each file
// on its own read-only connection in pages by id: each page is a short read,
// so WAL checkpoints are not held back for the length of the pass. db.js
// writes the results.
import fs from 'fs';
import { parentPort, workerData } from 'worker_threads';
import Database from 'better-sqlite3';
import { DERIVED_TABLES, archivePass, derivedColumns, derivedKey, duelPass, mapPass, pilotPass, ratingPass, regionPass, rivalPass, weaponPass } from './lib/statsPasses.js';
import { regionOf } from './lib/serverRegions.js';
import { achievementPass } from './lib/achievementPass.js';

const PAGE_SIZE = 500;
const { hotPath, coldPath, thirtyDaysAgo, today } = workerData;

// A pass that throws stops on its own; the others carry on, as when each pass
// ran its own scan.
const errors = {};

// Each stored server's region by IP, for matches stored without a server name
// (S15). Read once, before the scan; a failure here stops the region pass only.
function regionsByIp() {
    const conn = new Database(hotPath, { readonly: true, fileMustExist: true });
    try {
        return new Map(conn.prepare('SELECT ip, name, notes FROM servers').all().map(s => [s.ip, regionOf(s.name, s.notes)]));
    } catch (err) {
        errors.regions = err.message;
        return new Map();
    } finally {
        conn.close();
    }
}

// the keys are the `pass` names in statsPasses.js DERIVED_TABLES
const passes = { pilots: pilotPass(), archive: archivePass(), maps: mapPass(thirtyDaysAgo), ratings: ratingPass(), regions: regionPass(regionsByIp()), weapons: weaponPass(), duels: duelPass(), rivals: rivalPass(), achievements: achievementPass(today) };
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

// What the main thread must write to bring a derived table in line with the
// rows its pass built: the rows that are new or differ, and the keys (its
// key columns, derivedKey) the pass no longer has. Most refreshes change only
// the latest days or months, so this keeps a rewrite of every row off the
// main thread.
function tableChanges(conn, table, rows) {
    const columns = derivedColumns(table);
    const keyOf = derivedKey(table);
    const values = r => keyOf.map(c => r[c]);
    const fresh = new Map(rows.map(r => [values(r).join('\n'), r]));
    const deletes = [];
    for (const old of conn.prepare(`SELECT * FROM ${table}`).iterate()) {
        const key = values(old).join('\n');
        const row = fresh.get(key);
        if (!row) deletes.push(values(old));
        else if (columns.every(c => row[c] === old[c])) fresh.delete(key);
    }
    return { total: rows.length, upserts: [...fresh.values()], deletes };
}

const size = file => (fs.existsSync(file) ? fs.statSync(file).size : 0);
const pilots = errors.pilots ? [] : passes.pilots.rows();
// The rating replays run here, after the scan, so a failure in one must not
// lose the other passes: a table whose pass failed, or whose rows fail, is
// left out (null) and the main thread keeps what it has.
const derived = {};
const hot = new Database(hotPath, { readonly: true, fileMustExist: true });
try {
    for (const [table, { pass, rows }] of Object.entries(DERIVED_TABLES)) {
        if (errors[pass]) continue;
        try {
            derived[table] = tableChanges(hot, table, rows(passes));
        } catch (err) {
            errors[table] = err.message;
        }
    }
} finally {
    hot.close();
}
parentPort.postMessage({
    errors,
    pilots,
    archive: errors.archive || errors.pilots ? null : passes.archive.payload(pilots, { hotDbSize: size(hotPath), coldDbSize: size(coldPath) }),
    maps: errors.maps ? null : passes.maps.rows(),
    derived
});
