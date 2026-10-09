// Runs the full passes (server/lib/statsPasses.js) off the main thread, so a
// refresh over every stored game does not stall requests. The rating pass
// sorts what it kept by date once both files are read. It reads each file
// on its own read-only connection in pages by id: each page is a short read,
// so WAL checkpoints are not held back for the length of the pass. db.js
// writes the results.
import fs from 'fs';
import { parentPort, workerData } from 'worker_threads';
import Database from 'better-sqlite3';
import { DERIVED_TABLES, archivePass, derivedColumns, duelPass, mapPass, pilotPass, ratingPass, regionPass, weaponPass } from './lib/statsPasses.js';
import { regionOf } from './lib/serverRegions.js';

const PAGE_SIZE = 500;
const { hotPath, coldPath, thirtyDaysAgo } = workerData;

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

const passes = { pilots: pilotPass(), archive: archivePass(), maps: mapPass(thirtyDaysAgo), ratings: ratingPass(), regions: regionPass(regionsByIp()), weapons: weaponPass(), duels: duelPass() };
// Each derived table (statsPasses.js DERIVED_TABLES): the pass that builds it
// and the rows it gives.
const derivedRows = {
    rating_snapshots: ['ratings', () => passes.ratings.rows()],
    pilot_months: ['pilots', () => passes.pilots.months()],
    region_months: ['regions', () => passes.regions.rows()],
    map_weapons: ['weapons', () => passes.weapons.maps()],
    pilot_weapons: ['weapons', () => passes.weapons.pilots()],
    pilot_maps: ['pilots', () => passes.pilots.maps()],
    duel_snapshots: ['duels', () => passes.duels.rows()],
    pilot_duels: ['duels', () => passes.duels.pairs()],
    pilot_objectives: ['pilots', () => passes.pilots.objectives()]
};
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
// rows its pass built: the rows that are new or differ, and the keys (the
// first two columns) the pass no longer has. Most refreshes change only the
// latest days or months, so this keeps a rewrite of every row off the main
// thread.
function tableChanges(table, rows) {
    const columns = derivedColumns(table);
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
// The rating replays run here, after the scan, so a failure in one must not
// lose the other passes: a table whose pass failed, or whose rows fail, is
// left out (null) and the main thread keeps what it has.
const derived = {};
for (const table of Object.keys(DERIVED_TABLES)) {
    const [pass, rows] = derivedRows[table];
    if (errors[pass]) {
        derived[table] = null;
        continue;
    }
    try {
        derived[table] = tableChanges(table, rows());
    } catch (err) {
        errors[table] = err.message;
        derived[table] = null;
    }
}
parentPort.postMessage({
    errors,
    pilots,
    archive: errors.archive || errors.pilots ? null : passes.archive.payload(pilots, { hotDbSize: size(hotPath), coldDbSize: size(coldPath) }),
    maps: errors.maps ? null : passes.maps.rows(),
    derived
});
