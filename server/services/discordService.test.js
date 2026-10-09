import fs from 'fs';
import http from 'http';
import os from 'os';
import path from 'path';
import express from 'express';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { day, onDay, sample, veteranSoup } from '../testFixtures.js';
import { FIGHT_NIGHT_PING, dayStart, fightNightDay, netKills, pilotKey, shiftDay } from '../lib/gameParse.js';
import { EMBED_LIMITS, PING_SERVERS, RECAP_RANKINGS, movement, pingMessage, plain, recapMessage } from '../lib/discordMessages.js';

// The Discord webhook (S18) against a local stub server that records what it
// receives. The URL's token is a made-up secret that no log line, error or
// answer may hold.
const SECRET = 'tok3n-s18-never-logged';
const ORIGIN = 'https://ofc.example';

// The fixture games on `day` plus a second night's worth of the same games a
// day later (ids from 91000), so the detector has two nights to judge.
const night = sample.map(g => onDay(structuredClone(g)));
const nextNight = night.map(g => ({
    ...g,
    id: g.id + 91000,
    date: new Date(Date.parse(g.date) + 86400000).toISOString(),
    settings: { ...g.settings, start: new Date(Date.parse(g.settings.start) + 86400000).toISOString() }
}));

let dataDir;
let db;
let discord;
let fightNights;
let stub;
let stubUrl;
let adminUrl;
let adminServer;
const received = [];
let script = [];

// The stub answers each request with the next scripted reply, then 204.
const reply = (status, headers = {}, body = '') => ({ status, headers, body });
const answer = (...replies) => { script = replies; };

const logs = [];
const capture = (...args) => { logs.push(args.map(a => (a instanceof Error ? `${a.message} ${a.stack}` : typeof a === 'string' ? a : JSON.stringify(a))).join(' ')); };

beforeAll(async () => {
    for (const level of ['log', 'warn', 'error', 'info']) vi.spyOn(console, level).mockImplementation(capture);
    dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ofc-discord-'));
    process.env.DATA_DIR = dataDir;
    process.env.SITE_URL = `${ORIGIN}/`;
    stub = http.createServer((req, res) => {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            received.push({ url: req.url, body: JSON.parse(body) });
            const next = script.shift() || reply(204);
            res.writeHead(next.status, next.headers);
            res.end(next.body);
        });
    });
    await new Promise(resolve => stub.listen(0, '127.0.0.1', resolve));
    stubUrl = `http://127.0.0.1:${stub.address().port}/api/webhooks/1234/${SECRET}`;
    process.env.DISCORD_WEBHOOK_URL = stubUrl;

    db = (await import('../db.js')).default;
    discord = await import('./discordService.js');
    fightNights = await import('./fightNightService.js');
    db.saveGames([...night, ...nextNight, veteranSoup]);
    await db.refreshPilotStats();
    // the waits a 5xx or no answer gets, short for the tests
    discord.DISCORD_RETRY.waitMs = 20;

    // the admin router behind a session stub: the x-admin header logs in
    const adminRouter = (await import('../admin-routes.js')).default;
    const app = express();
    app.use(express.json());
    app.use((req, res, next) => { req.session = { isAdmin: req.get('x-admin') === 'yes' }; next(); });
    app.use('/api/admin', adminRouter);
    adminServer = app.listen(0, '127.0.0.1');
    await new Promise(resolve => adminServer.once('listening', resolve));
    adminUrl = `http://127.0.0.1:${adminServer.address().port}/api/admin`;
});

afterAll(async () => {
    await discord.postsSettled();
    await new Promise(resolve => stub.close(resolve));
    await new Promise(resolve => adminServer.close(resolve));
    await db.close();
    fs.rmSync(dataDir, { recursive: true, force: true });
    vi.restoreAllMocks();
});

afterEach(async () => {
    await discord.postsSettled();
    received.length = 0;
    script = [];
    vi.useRealTimers();
});

const switchOn = (on = true) => db.setAdminSetting.run(discord.DISCORD_SETTING, String(on));
const rows = kind => db.getRecentDiscordPosts(100).filter(r => r.kind === kind);
const entry = (ip, players, game = {}) => ({
    server: { ip, name: `Server ${ip}`, online: true },
    game: { currentPlayers: players, maxPlayers: 8, mapName: 'Vault', mode: 'ANARCHY', inLobby: false, ...game }
});
const busy = [entry('10.0.0.1', 4), entry('10.0.0.2', 2, { inLobby: true })];
// a tick with nobody on, so the next busy one starts a new evening
const quiet = at => discord.checkPing([], at);

describe('the recap embed on fixture data', () => {
    let recap;
    let rankings;
    let message;
    beforeAll(async () => {
        recap = await fightNights.generateRecapForDate(day, true);
        rankings = db.getPowerRankings(shiftDay(day, 1));
        message = recapMessage(recap, rankings, discord.siteOrigin());
    });

    it('carries the night\'s totals and top pilots, counted from the fixture games', () => {
        // the night's games: `day`'s fixtures and the copies of the day before's
        const games = [...night, ...nextNight].filter(g => fightNightDay(g.date) === day);
        const kills = new Map();
        const matches = new Map();
        for (const g of games) {
            for (const p of g.players) {
                const key = pilotKey(p.name);
                kills.set(key, (kills.get(key) || 0) + netKills(p));
                matches.set(key, (matches.get(key) || 0) + 1);
            }
        }
        const total = [...kills.values()].reduce((a, b) => a + b, 0);
        const [embed] = message.embeds;
        expect(embed.title).toBe(`Fight Night: ${recap.formattedDate}`);
        expect(embed.url).toBe(`${ORIGIN}/fight-night/${day}`);
        expect(embed.description).toBe(`${games.length} matches, ${kills.size} pilots, ${total.toLocaleString('en-US')} kills.`);
        const most = Math.max(...kills.values());
        const busiest = Math.max(...matches.values());
        const field = name => embed.fields.find(f => f.name === name);
        expect(field('Most kills')).toEqual({ name: 'Most kills', value: `${plain(recap.topFragger.name)}, ${most}`, inline: true });
        expect(kills.get(pilotKey(recap.topFragger.name))).toBe(most);
        expect(field('Most matches').value).toBe(`${plain(recap.mostActivePilot.name)}, ${busiest}`);
        expect(matches.get(pilotKey(recap.mostActivePilot.name))).toBe(busiest);
        expect(message.allowed_mentions).toEqual({ parse: [] });
    });

    it('carries the saved recap\'s lines and the power rankings after the night', () => {
        const [embed] = message.embeds;
        expect(embed.fields.slice(2, 9).map(f => [f.name, f.value])).toEqual([
            ['Headline match', plain(recap.headlineBout.copy)],
            ['Upset', plain(recap.biggestUpset.copy)],
            ['Biggest win', plain(recap.biggestBlowout.copy)],
            ['Closest finish', plain(recap.closestFinish.copy)],
            ['Busiest map', plain(recap.hottestArena.copy)],
            ['New pilots', plain(recap.newBlood.copy)],
            ['Longest streak', plain(recap.longestStreak.copy)]
        ]);
        // the two nights rank more than five pilots, all NEW in their first week
        expect(rankings.pilots.length).toBeGreaterThan(RECAP_RANKINGS);
        expect(rankings.pilots.every(p => p.change === null)).toBe(true);
        const ranked = embed.fields[9];
        expect(ranked.name).toBe(`Power rankings on ${shiftDay(day, 1)} (▲▼ over 7 days)`);
        expect(ranked.value.split('\n')).toEqual(rankings.pilots.slice(0, 5).map(p => `${p.rank}. ${plain(p.name)} ${Math.round(p.rating)} NEW`));
        expect(embed.fields).toHaveLength(10);
    });

    it('shows each kind of movement and the top 5 only', () => {
        expect([3, -1, 0, null].map(movement)).toEqual(['▲3', '▼1', '–', 'NEW']);
        const pilots = Array.from({ length: 8 }, (_, i) => ({ rank: i + 1, name: `P_${i}`, rating: 1700.4 - i * 10, change: [2, -3, 0, null][i % 4] }));
        const { fields } = recapMessage(recap, { day: '2026-10-05', pilots }, ORIGIN).embeds[0];
        expect(fields.at(-1).value.split('\n')).toEqual(['1. P\\_0 1700 ▲2', '2. P\\_1 1690 ▼3', '3. P\\_2 1680 –', '4. P\\_3 1670 NEW', '5. P\\_4 1660 ▲2']);
        expect(RECAP_RANKINGS).toBe(5);
    });

    it('stays inside Discord\'s limits with absurd names, and escapes their markdown', () => {
        const long = '**@everyone**'.repeat(200);
        const wild = { ...recap, topFragger: { name: long, kills: 3 } };
        for (const key of ['headlineBout', 'biggestUpset', 'biggestBlowout', 'closestFinish', 'hottestArena', 'newBlood', 'longestStreak']) {
            wild[key] = { ...recap[key], copy: `${long} [link](https://evil.example)` };
        }
        const [embed] = recapMessage(wild, { day, pilots: [{ rank: 1, name: long, rating: 1500, change: 0 }] }, ORIGIN).embeds;
        const length = embed.title.length + embed.description.length + embed.fields.reduce((s, f) => s + f.name.length + f.value.length, 0);
        expect(length).toBeLessThanOrEqual(EMBED_LIMITS.total);
        expect(embed.fields.every(f => f.value.length <= EMBED_LIMITS.fieldValue)).toBe(true);
        expect(embed.fields[0].value.startsWith('\\*\\*@everyone\\*\\*')).toBe(true);
        // a masked link's brackets are escaped, so it shows as text
        expect(embed.fields.some(f => /(^|[^\\])\]\(/.test(f.value))).toBe(false);
        expect(plain('RAPTOR [link](https://evil.example) *x*')).toBe('RAPTOR \\[link\\](https://evil.example) \\*x\\*');
    });
});

describe('the "it\'s on" ping', () => {
    it('lists the busy servers, most pilots first, with the count the rule reads', () => {
        const servers = [entry('10.0.0.9', 1, { mode: 'CTF', mapName: 'Mesa' }), ...busy, entry('10.0.0.3', 0), { server: { ip: '10.0.0.4', online: false }, game: { currentPlayers: 5 } }];
        const message = pingMessage(servers, ORIGIN);
        expect(message.content).toBe('It\'s on: 7 pilots in the server browser.');
        const [embed] = message.embeds;
        expect(embed.url).toBe(`${ORIGIN}/`);
        expect(embed.description).toBe('7 pilots on 3 servers.');
        expect(embed.fields).toEqual([
            { name: 'Server 10.0.0.1', value: '4 of 8 pilots, ANARCHY on Vault' },
            { name: 'Server 10.0.0.2', value: '2 of 8 pilots, in the lobby' },
            { name: 'Server 10.0.0.9', value: '1 of 8 pilots, CTF on Mesa' }
        ]);
        const many = Array.from({ length: 14 }, (_, i) => entry(`10.1.0.${i}`, 1 + i, { maxPlayers: 16 }));
        const big = pingMessage(many, ORIGIN).embeds[0];
        expect(big.fields).toHaveLength(PING_SERVERS);
        expect(big.fields[0].value).toBe('14 of 16 pilots, ANARCHY on Vault');
        expect(big.description).toBe('105 pilots on 14 servers; the 4 servers with the fewest are not listed.');
    });

    it('posts once per fight-night day when the browser shows 6 pilots, and not below it or while switched off', async () => {
        const now = Date.parse(dayStart(day)) + 14 * 3600000;
        switchOn(false);
        expect(discord.checkPing(busy, now)).toBeNull();
        switchOn();
        expect(FIGHT_NIGHT_PING.pilots).toBe(6);
        expect(discord.checkPing(busy.slice(0, 1), now)).toBeNull();
        expect(discord.checkPing([entry('10.0.0.1', 5)], now)).toBeNull();
        await discord.checkPing(busy, now);
        // later ticks the same night, one before the 06:00 rollover
        await discord.checkPing(busy, now + 60000);
        await discord.checkPing(busy, Date.parse(dayStart(shiftDay(day, 1))) - 60000);
        expect(received).toHaveLength(1);
        expect(received[0].url).toBe(`/api/webhooks/1234/${SECRET}`);
        expect(received[0].body.content).toBe('It\'s on: 6 pilots in the server browser.');
        expect(received[0].body.allowed_mentions).toEqual({ parse: [] });
        // a second evening the same day, after a quiet spell: still one ping
        quiet(now + 120000);
        expect(discord.checkPing(busy, now + 180000)).toBeNull();
        expect(received).toHaveLength(1);
        // still on after the 06:00 rollover: the same evening, no second ping
        const next = Date.parse(dayStart(shiftDay(day, 1)));
        expect(discord.checkPing(busy, next + 60000)).toBeNull();
        expect(received).toHaveLength(1);
        // a new evening on the next fight-night day
        quiet(next + 3600000);
        await discord.checkPing(busy, next + 7200000);
        expect(received).toHaveLength(2);
        expect(rows('ping').map(r => [r.key, r.status, r.tries]).sort()).toEqual([[day, 'sent', 1], [shiftDay(day, 1), 'sent', 1]]);
    });

    it('waits out a 429\'s Retry-After and tries once more; a 404 is dropped at once', async () => {
        const now = Date.parse(dayStart(shiftDay(day, 2))) + 3600000;
        answer(reply(429, { 'Content-Type': 'application/json' }, JSON.stringify({ retry_after: 0.05 })));
        quiet(now - 60000);
        const started = Date.now();
        expect(await discord.checkPing(busy, now)).toMatchObject({ ok: true });
        expect(Date.now() - started).toBeGreaterThanOrEqual(45);
        expect(received).toHaveLength(2);

        answer(reply(404));
        const later = Date.parse(dayStart(shiftDay(day, 3))) + 3600000;
        quiet(later - 60000);
        expect(await discord.checkPing(busy, later)).toMatchObject({ ok: false, status: 404 });
        await discord.checkPing(busy, later + 60000);
        expect(received).toHaveLength(3);
        expect(db.getDiscordPost('ping', shiftDay(day, 3))).toMatchObject({ status: 'dropped', tries: 1 });
    });

    it('keeps a failing ping pending for the next tick, then drops it after 3 posts', async () => {
        const now = Date.parse(dayStart(shiftDay(day, 4))) + 3600000;
        answer(...Array.from({ length: 6 }, () => reply(500)));
        quiet(now - 60000);
        await discord.checkPing(busy, now);
        expect(db.getDiscordPost('ping', shiftDay(day, 4))).toMatchObject({ status: 'pending', tries: 1 });
        await discord.checkPing(busy, now + 60000);
        await discord.checkPing(busy, now + 120000);
        await discord.checkPing(busy, now + 180000);
        // each post is an attempt and one retry; the later ticks were not a
        // new evening, but the ping was pending
        expect(received).toHaveLength(6);
        expect(db.getDiscordPost('ping', shiftDay(day, 4))).toMatchObject({ status: 'dropped', tries: 3 });
    });
});

describe('the recap post from the detector', () => {
    let thresholds;
    beforeAll(() => {
        thresholds = { ...fightNights.FIGHT_NIGHT_THRESHOLDS };
        Object.assign(fightNights.FIGHT_NIGHT_THRESHOLDS, { minMatches: 1, minPilots: 1 });
    });
    afterAll(() => {
        Object.assign(fightNights.FIGHT_NIGHT_THRESHOLDS, thresholds);
    });
    // The detector two fight-night days after `day`, so it judges `day` and the day after.
    const detectAt = async when => {
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(when);
        await fightNights.checkAndGenerateRecentFightNight();
        vi.useRealTimers();
        await discord.postsSettled();
    };
    const morning = Date.parse(dayStart(shiftDay(day, 2))) + 15 * 60000;
    const recapPosts = () => received.filter(r => r.body.embeds?.[0]?.title?.startsWith('Fight Night'));

    it('posts a recap the detector saves once, and nothing for saves made elsewhere', async () => {
        switchOn();
        // saved by a page view or the forced regenerate: no post
        await fightNights.generateRecapForDate(day, true);
        await discord.postsSettled();
        expect(recapPosts()).toHaveLength(0);
        // the detector saves the next day's (new) and finds `day`'s already saved
        await detectAt(morning);
        expect(recapPosts().map(r => r.body.embeds[0].url)).toEqual([`${ORIGIN}/fight-night/${shiftDay(day, 1)}`]);
        // the rankings on the morning after that night
        expect(recapPosts()[0].body.embeds[0].fields.at(-1).name).toBe(`Power rankings on ${shiftDay(day, 2)} (▲▼ over 7 days)`);
        expect(db.getDiscordPost('recap', day)).toBeNull();
        expect(db.getDiscordPost('recap', shiftDay(day, 1))).toMatchObject({ status: 'sent', tries: 1 });
        // a second run, the S14 rebuild and the empty-table backfill post nothing more
        await detectAt(morning + 3600000);
        db.setAdminSetting.run('fight_night_day_rule', 'UTC');
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(morning);
        await fightNights.rebuildRecapsForDayRule();
        vi.useRealTimers();
        expect(db.getFightNightRecapByDate(shiftDay(day, 1))).not.toBeNull();
        await discord.postsSettled();
        expect(recapPosts()).toHaveLength(1);
    });

    it('tries a failed recap again on the next detector run, and posts none while switched off', async () => {
        db.deleteFightNightRecapsSince(day);
        switchOn(false);
        await detectAt(morning);
        expect(db.getFightNightRecapByDate(day)).not.toBeNull();
        expect(received).toHaveLength(0);

        db.deleteFightNightRecapsSince(day);
        db.putDiscordPost({ kind: 'recap', key: shiftDay(day, 1), status: 'sent', tries: 1 });
        switchOn();
        answer(reply(503), reply(503));
        await detectAt(morning);
        expect(received).toHaveLength(2);
        expect(db.getDiscordPost('recap', day)).toMatchObject({ status: 'pending', tries: 1 });
        await detectAt(morning + 3600000);
        expect(received).toHaveLength(3);
        expect(received[2].body.embeds[0].url).toBe(`${ORIGIN}/fight-night/${day}`);
        expect(db.getDiscordPost('recap', day)).toMatchObject({ status: 'sent', tries: 2 });
    });

    it('counts a recap that cannot be built as a failed try', async () => {
        switchOn();
        // queued, but its recap is gone (a save that failed, a hand delete)
        db.putDiscordPost({ kind: 'recap', key: '2001-01-01', status: 'pending', tries: 0 });
        await discord.postRecap('2001-01-01');
        expect(received).toHaveLength(0);
        expect(db.getDiscordPost('recap', '2001-01-01')).toMatchObject({ status: 'pending', tries: 1 });
        // a try that cannot be written is logged, not thrown at a caller that does not wait
        const put = vi.spyOn(db, 'putDiscordPost').mockImplementation(() => { throw new Error('disk full'); });
        await expect(discord.postRecap('2001-01-01')).resolves.toBeNull();
        put.mockRestore();
        expect(db.getDiscordPost('recap', '2001-01-01')).toMatchObject({ status: 'pending', tries: 1 });
    });

    it('drops the posts still pending that no tick or detector run will try again', async () => {
        db.putDiscordPost({ kind: 'ping', key: shiftDay(day, 9), status: 'pending', tries: 1 });
        db.putDiscordPost({ kind: 'ping', key: shiftDay(day, 10), status: 'pending', tries: 1 });
        db.putDiscordPost({ kind: 'recap', key: shiftDay(day, -1), status: 'pending', tries: 1 });
        // a busy tick on day + 10 drops the day before's ping and posts its own
        const evening = Date.parse(dayStart(shiftDay(day, 10))) + 3600000;
        await discord.checkPing(busy, evening);
        expect(db.getDiscordPost('ping', shiftDay(day, 9)).status).toBe('dropped');
        expect(db.getDiscordPost('ping', shiftDay(day, 10))).toMatchObject({ status: 'sent', tries: 2 });
        // the detector on day + 2: its window is `day` and the day after
        await detectAt(morning);
        expect(db.getDiscordPost('recap', shiftDay(day, -1)).status).toBe('dropped');
        expect(db.getDiscordPost('recap', '2001-01-01').status).toBe('dropped');
        expect(db.getDiscordPost('recap', day).status).toBe('sent');
    });
});

describe('admin endpoints and secrecy', () => {
    const get = (url, admin = true) => fetch(url, { headers: admin ? { 'x-admin': 'yes' } : {} });
    const post = (url, admin = true) => fetch(url, { method: 'POST', headers: admin ? { 'x-admin': 'yes' } : {} });

    it('answers a non-admin 401 from both', async () => {
        expect((await get(`${adminUrl}/discord`, false)).status).toBe(401);
        expect((await post(`${adminUrl}/discord/test`, false)).status).toBe(401);
        expect(received).toHaveLength(0);
    });

    it('shows the admin the switch and the URL masked', async () => {
        switchOn();
        const status = await (await get(`${adminUrl}/discord`)).json();
        expect(status).toMatchObject({ enabled: true, configured: true, webhook: `${new URL(stubUrl).origin}/…${SECRET.slice(-4)}`, siteUrl: ORIGIN, pingPilots: 6 });
        expect(status.posts.length).toBeGreaterThan(0);
        expect(status.posts.length).toBeLessThanOrEqual(5);
        expect(JSON.stringify(status)).not.toContain(SECRET);
        // the generic settings read has no URL to give
        expect(await (await get(`${adminUrl}/settings/DISCORD_WEBHOOK_URL`)).json()).toEqual({ value: null });
    });

    it('sends one test post, whether or not posting is on, and reports a failure without the URL', async () => {
        switchOn(false);
        const ok = await post(`${adminUrl}/discord/test`);
        expect(ok.status).toBe(200);
        expect(await ok.json()).toEqual({ ok: true, status: 204 });
        expect(received[0].body.content).toBe('Test post from overloadfight.club. Fight-night recaps and the "it\'s on" ping will post to this channel.');

        answer(reply(500));
        const failed = await post(`${adminUrl}/discord/test`);
        expect(failed.status).toBe(502);
        expect(await failed.json()).toEqual({ ok: false, status: 500, error: 'Discord answered 500.' });
        // one attempt, no retry
        expect(received).toHaveLength(2);
    });

    it('says what is wrong with a missing, unparsable or unreachable URL without quoting it', async () => {
        try {
            delete process.env.DISCORD_WEBHOOK_URL;
            const missing = await post(`${adminUrl}/discord/test`);
            expect(missing.status).toBe(400);
            expect((await missing.json()).error).toMatch(/DISCORD_WEBHOOK_URL/);

            process.env.DISCORD_WEBHOOK_URL = `discord.com/api/webhooks/1/${SECRET}`;
            expect((await (await get(`${adminUrl}/discord`)).json()).webhook).toBe('not a valid http(s) URL');
            const bad = await (await post(`${adminUrl}/discord/test`)).json();
            expect(bad.error).toBe('the webhook URL is not a valid http(s) URL.');

            // a port that was just free
            const closedPort = await new Promise(resolve => {
                const probe = http.createServer().listen(0, '127.0.0.1', () => {
                    const { port } = probe.address();
                    probe.close(() => resolve(port));
                });
            });
            process.env.DISCORD_WEBHOOK_URL = `http://127.0.0.1:${closedPort}/api/webhooks/1/${SECRET}`;
            const closed = await (await post(`${adminUrl}/discord/test`)).json();
            expect(closed.error).toBe('no answer from Discord (ECONNREFUSED).');
            switchOn();
            const evening = Date.parse(dayStart(shiftDay(day, 5))) + 3600000;
            quiet(evening - 60000);
            await discord.checkPing(busy, evening);
            expect(db.getDiscordPost('ping', shiftDay(day, 5))).toMatchObject({ status: 'pending', tries: 1 });

            // an unparsable URL posts nothing and leaves no row to retry
            process.env.DISCORD_WEBHOOK_URL = `discord.com/api/webhooks/1/${SECRET}`;
            const another = Date.parse(dayStart(shiftDay(day, 8))) + 3600000;
            quiet(another - 60000);
            expect(discord.checkPing(busy, another)).toBeNull();
            expect(db.getDiscordPost('ping', shiftDay(day, 8))).toBeNull();
        } finally {
            process.env.DISCORD_WEBHOOK_URL = stubUrl;
        }
    });

    it('wrote no log line holding the URL or its token', () => {
        expect(logs.some(line => line.startsWith('[Discord]'))).toBe(true);
        expect(logs.filter(line => line.includes(SECRET))).toEqual([]);
    });
});

describe('shutdown', () => {
    it('writes nothing for a post that ends after the service stopped', async () => {
        switchOn();
        let release;
        const held = new Promise(resolve => { release = resolve; });
        const realFetch = globalThis.fetch;
        const spy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (...args) => { await held; return realFetch(...args); });
        try {
            const key = shiftDay(day, 6);
            quiet(Date.parse(dayStart(key)));
            const pending = discord.checkPing(busy, Date.parse(dayStart(key)) + 3600000);
            discord.stopDiscord();
            release();
            await pending;
            expect(db.getDiscordPost('ping', key)).toBeNull();
            // and nothing new starts
            expect(discord.checkPing(busy, Date.parse(dayStart(shiftDay(day, 7))) + 3600000)).toBeNull();
        } finally {
            spy.mockRestore();
        }
    });
});
