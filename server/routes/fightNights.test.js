import fs from 'fs';
import os from 'os';
import path from 'path';
import express from 'express';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { day, onDay, sample, veteranSoup } from '../testFixtures.js';
import { DAY_MS, fightNightDay } from '../lib/gameParse.js';
import { FEED_PATH, SCHEDULE, occurrences } from '../lib/fightNightSchedule.js';

// The schedule's reads and routes (S22) on a temp database of the fixture
// games: the events repo, the public schedule and feed, and the admin
// endpoints behind a session stub (the x-admin header logs in).
let dataDir;
let db;
let base;
let server;
let night;

const get = (url, headers = {}) => fetch(`${base}${url}`, { headers });
const send = (method, url, body, admin = true) => fetch(`${base}${url}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(admin ? { 'x-admin': 'yes' } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body)
});
const weekly = { kind: 'weekly', weekday: 5, time: '20:00', minutes: 180, title: 'Saturday Night Anarchy', notes: 'Bring a flag' };
const clear = () => { for (const row of db.listFightNightEvents()) db.deleteFightNightEvent(row.id); };
// a one-off `days` from now at the wall-clock hour of now plus `hours`, so its
// place in the window is known
const oneOff = (days, title = 'Once') => {
    const at = new Date(Date.now() + days * DAY_MS);
    return { kind: 'once', date: fightNightDay(at), time: '12:00', minutes: 60, title, notes: '' };
};

beforeAll(async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ofc-schedule-'));
    process.env.DATA_DIR = dataDir;
    db = (await import('../db.js')).default;
    night = sample.map(g => onDay(structuredClone(g)));
    db.saveGames(night);
    db.saveColdGamesBatch([veteranSoup]);
    // the recap reads pilot_stats_cache, which the first refresh creates
    await db.refreshPilotStats();
    const fightNights = await import('../services/fightNightService.js');
    await fightNights.generateRecapForDate(day, true);

    const routes = (await import('../routes.js')).default;
    const adminRouter = (await import('../admin-routes.js')).default;
    const { fightNightFeed } = await import('./fightNights.js');
    const app = express();
    app.use(express.json());
    app.use((req, res, next) => { req.session = { isAdmin: req.get('x-admin') === 'yes' }; next(); });
    app.get(FEED_PATH, fightNightFeed);
    app.use('/api', routes);
    app.use('/api/admin', adminRouter);
    server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    base = `http://127.0.0.1:${server.address().port}`;
});

afterAll(async () => {
    if (server) await new Promise(resolve => server.close(resolve));
    await db?.close();
    fs.rmSync(dataDir, { recursive: true, force: true });
    vi.restoreAllMocks();
});

describe('the events repo', () => {
    it('stores, lists weekly rules before one-offs, changes and deletes', () => {
        clear();
        const once = db.saveFightNightEvent({ kind: 'once', weekday: null, date: '2026-12-26', time: '19:00', minutes: 120, title: 'Boxing Day', notes: '' });
        const sat = db.saveFightNightEvent({ ...weekly, date: null });
        expect(sat).toMatchObject({ ...weekly, date: null });
        expect(sat.id).toBeGreaterThan(once.id);
        expect(Date.parse(sat.updated_at)).toBeGreaterThan(Date.now() - 5000);
        expect(db.listFightNightEvents().map(e => e.title)).toEqual(['Saturday Night Anarchy', 'Boxing Day']);
        expect(db.getFightNightEvent(sat.id)).toEqual(sat);
        expect(db.saveFightNightEvent({ ...sat, title: 'Renamed', minutes: 90 })).toMatchObject({ id: sat.id, title: 'Renamed', minutes: 90 });
        expect(db.getFightNightEvent(99999)).toBeNull();
        expect(db.deleteFightNightEvent(once.id)).toBe(1);
        expect(db.deleteFightNightEvent(once.id)).toBe(0);
        expect(db.listFightNightEvents()).toHaveLength(1);
    });

    it('reads a day\'s span from the first match\'s start to the last match\'s end, over both files', () => {
        const games = night.filter(g => fightNightDay(g.date) === day);
        const first = new Date(Math.min(...games.map(g => Date.parse(g.settings.start)))).toISOString();
        const last = games.map(g => g.date).sort().at(-1);
        expect(db.getDaySpan(day)).toEqual({ start: first, end: last });
        // a copy of the night's first match an hour earlier, moved to cold storage (a cold move
        // during a night splits it): the span starts there
        const earliest = games.find(g => new Date(g.settings.start).toISOString() === first);
        const moved = { ...earliest, id: 90001, date: new Date(Date.parse(earliest.date) - 3600000).toISOString(), settings: { ...earliest.settings, start: new Date(Date.parse(first) - 3600000).toISOString() } };
        db.saveColdGamesBatch([moved]);
        expect(db.getDaySpan(day)).toEqual({ start: moved.settings.start, end: last });
        // the 2019 archive game carries a top-level start
        const soupDay = fightNightDay(veteranSoup.date);
        expect(db.getDaySpan(soupDay)).toEqual({ start: veteranSoup.start, end: veteranSoup.date });
        expect(db.getDaySpan('2000-01-01')).toBeNull();
        expect(db.getDaySpan('not a day')).toBeNull();
    });
});

describe('GET /api/fight-nights/schedule', () => {
    it('answers the coming nights to the horizon, one under way included', async () => {
        clear();
        db.saveFightNightEvent({ ...weekly, date: null });
        const soon = db.saveFightNightEvent({ ...oneOff(2, 'Soon'), weekday: null });
        db.saveFightNightEvent({ ...oneOff(SCHEDULE.horizonWeeks * 7 + 3, 'Too far'), weekday: null });
        // a night under way: from the start of today's fight-night day (06:00) for a whole day
        db.saveFightNightEvent({ kind: 'once', weekday: null, date: fightNightDay(Date.now()), time: '06:00', minutes: SCHEDULE.maxMinutes, title: 'Running', notes: '' });
        const before = Date.now();
        const res = await get('/api/fight-nights/schedule');
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(Object.keys(body).sort()).toEqual(['events', 'feed']);
        expect(body.feed).toBe('/fight-nights.ics');
        const expected = occurrences(db.listFightNightEvents(), before, before + SCHEDULE.horizonWeeks * 7 * DAY_MS);
        expect(body.events).toEqual(expected);
        expect(body.events.map(e => e.title)).toContain('Soon');
        expect(body.events.map(e => e.title)).not.toContain('Too far');
        expect(body.events.filter(e => e.title === 'Saturday Night Anarchy')).toHaveLength(SCHEDULE.horizonWeeks);
        expect(body.events.find(e => e.title === 'Soon')).toMatchObject({ id: soon.id, kind: 'once', time: '12:00', minutes: 60 });
        for (let i = 1; i < body.events.length; i++) expect(body.events[i].start >= body.events[i - 1].start).toBe(true);
        expect(body.events.every(e => Date.parse(e.end) > before)).toBe(true);
        const running = body.events.find(e => e.title === 'Running');
        expect(Date.parse(running.start) <= before).toBe(true);
        expect(body.events[0]).toBe(running);
    });

    it('answers with nothing scheduled', async () => {
        clear();
        const body = await (await get('/api/fight-nights/schedule')).json();
        expect(body.events).toEqual([]);
    });
});

describe('the .ics feed', () => {
    it('answers text/calendar at the root and under /api with the coming nights and the fixture recap', async () => {
        clear();
        (await import('./fightNights.js')).clearFeedCache();
        const sat = db.saveFightNightEvent({ ...weekly, date: null });
        for (const url of ['/fight-nights.ics', '/api/fight-nights.ics']) {
            const res = await get(url);
            expect(res.status).toBe(200);
            expect(res.headers.get('content-type')).toBe('text/calendar; charset=utf-8');
            expect(res.headers.get('content-disposition')).toBe('inline; filename="fight-nights.ics"');
            expect(res.headers.get('cache-control')).toBe('public, max-age=600');
            const text = await res.text();
            expect(text.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
            expect(text.endsWith('END:VCALENDAR\r\n')).toBe(true);
            // one coming night a week, each on the wall clock in the zone
            expect(text.match(/BEGIN:VEVENT/g)).toHaveLength(SCHEDULE.horizonWeeks + 1);
            expect(text.match(/DTSTART;TZID=America\/Chicago:\d{8}T200000/g)).toHaveLength(SCHEDULE.horizonWeeks);
            expect(text).toContain(`UID:fight-night-${sat.id}-`);
            expect(text).toContain(`URL:${base}/fight-night\r\n`);
            expect(text).toContain('SUMMARY:Saturday Night Anarchy');
            // the recap of the fixtures' night, on its matches' span
            const span = db.getDaySpan(day);
            const stamp = iso => iso.replace(/[-:]/g, '').replace(/\.\d{3}/, '');
            expect(text).toContain(`UID:recap-${day}@overloadfight.club\r\nDTSTAMP:`);
            expect(text).toContain(`DTSTART:${stamp(span.start)}\r\nDTEND:${stamp(span.end)}\r\n`);
            expect(text).toContain(`URL:${base}/fight-night/${day}`);
            const recap = db.getFightNightRecapByDate(day);
            expect(text).toContain(`DESCRIPTION:${recap.totalMatches} matches\\, ${recap.totalPilots} pilots\\,`);
        }
    });

    it('answers a feed of recaps alone with nothing scheduled, and keeps a built feed until the schedule changes', async () => {
        clear();
        (await import('./fightNights.js')).clearFeedCache();
        const text = await (await get('/fight-nights.ics')).text();
        expect(text.match(/BEGIN:VEVENT/g)).toHaveLength(1);
        expect(text).toContain(`UID:recap-${day}@`);
        // a row written behind the routes' back is not in the kept feed; one saved through the admin route is
        db.saveFightNightEvent({ ...weekly, date: null });
        expect((await (await get('/fight-nights.ics')).text()).match(/BEGIN:VEVENT/g)).toHaveLength(1);
        await send('POST', '/api/admin/events', { ...weekly, title: 'Through the route' });
        const fresh = await (await get('/fight-nights.ics')).text();
        expect(fresh.match(/BEGIN:VEVENT/g)).toHaveLength(2 * SCHEDULE.horizonWeeks + 1);
        expect(fresh).toContain('SUMMARY:Through the route');
    });
});

describe('the admin endpoints', () => {
    it('refuse a non-admin', async () => {
        expect((await get('/api/admin/events')).status).toBe(401);
        expect((await send('POST', '/api/admin/events', weekly, false)).status).toBe(401);
        expect((await send('DELETE', '/api/admin/events/1', undefined, false)).status).toBe(401);
    });

    it('list, add, change and delete events, and say what is wrong with one', async () => {
        clear();
        const bad = await send('POST', '/api/admin/events', { ...weekly, time: '8pm' });
        expect(bad.status).toBe(400);
        expect(await bad.json()).toEqual({ error: 'time must be HH:MM, 24-hour, Central time' });
        expect((await send('POST', '/api/admin/events', { ...weekly, id: 4242 })).status).toBe(404);
        expect((await send('POST', '/api/admin/events', { ...weekly, id: 'x' })).status).toBe(404);

        const added = await send('POST', '/api/admin/events', { ...weekly, minutes: '' });
        expect(added.status).toBe(200);
        const row = await added.json();
        expect(row).toMatchObject({ ...weekly, minutes: SCHEDULE.defaultMinutes, date: null });
        expect(row.id).toBeGreaterThan(0);

        const changed = await send('POST', '/api/admin/events', { ...row, kind: 'once', date: '2026-12-26', title: 'Boxing Day' });
        expect(await changed.json()).toMatchObject({ id: row.id, kind: 'once', date: '2026-12-26', weekday: null, title: 'Boxing Day' });

        const list = await (await get('/api/admin/events', { 'x-admin': 'yes' })).json();
        expect(list).toEqual([expect.objectContaining({ id: row.id, title: 'Boxing Day' })]);

        expect(await (await send('DELETE', `/api/admin/events/${row.id}`)).json()).toEqual({ success: true });
        expect((await send('DELETE', `/api/admin/events/${row.id}`)).status).toBe(404);
        expect((await send('DELETE', '/api/admin/events/abc')).status).toBe(404);
        expect(await (await get('/api/admin/events', { 'x-admin': 'yes' })).json()).toEqual([]);
    });

    it('the recap route still answers beside the new ones', async () => {
        expect((await get(`/api/fight-nights/${day}`)).status).toBe(200);
        expect((await get('/api/fight-nights/2000-01-01')).status).toBe(404);
    });
});
