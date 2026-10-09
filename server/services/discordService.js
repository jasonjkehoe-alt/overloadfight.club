import db from '../db.js';
import { FIGHT_NIGHT_PING, browserPilots, fightNightDay, shiftDay } from '../lib/gameParse.js';
import { pingMessage, recapMessage, testMessage } from '../lib/discordMessages.js';

// Posts to the fight-night channel's Discord webhook (S18) with Node's fetch.
// The URL comes from DISCORD_WEBHOOK_URL only and never goes into a log line,
// an error or an answer; the admin page switches posting on and off
// (admin_settings discord_enabled) and sees the URL masked. Each post is a
// row in discord_posts, so it goes out once: the ping once per fight-night
// day, a recap once per date.

export const DISCORD_SETTING = 'discord_enabled';
// A post is one attempt plus one more after a 429 (after Retry-After, capped)
// or a 5xx or no answer (after waitMs). One that still fails stays pending for
// the next tick (ping) or detector run (recap), up to `tries` posts; then it is
// dropped, as it is at once after any other 4xx, and once its day is past
// (expireDiscordPosts).
export const DISCORD_RETRY = { waitMs: 5000, maxWaitMs: 60000, timeoutMs: 10000, tries: 3 };
const DEFAULT_ORIGIN = 'https://overloadfight.club';

let stopped = false;
const inflight = new Map();
// The pilots at the last tick: the ping needs the count to cross the line, so
// an evening still on when the day rolls over at 06:00 is not a new one.
let lastPilots = 0;

const webhookUrl = () => process.env.DISCORD_WEBHOOK_URL?.trim() || null;
const validUrl = url => URL.canParse(url) && ['http:', 'https:'].includes(new URL(url).protocol);
const retryable = status => status === 0 || status === 429 || status >= 500;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms).unref());

// The origin the messages link to: SITE_URL, or the public site.
export const siteOrigin = () => (process.env.SITE_URL?.trim() || DEFAULT_ORIGIN).replace(/\/+$/, '');
export const discordEnabled = () => db.getAdminSetting.get(DISCORD_SETTING)?.value === 'true';
const posting = () => !stopped && validUrl(webhookUrl() ?? '') && discordEnabled();
export const hasWebhook = () => Boolean(webhookUrl());

// The URL as the admin page shows it: its origin and last four characters.
export const maskWebhook = url => (validUrl(url) ? `${new URL(url).origin}/…${url.slice(-4)}` : 'not a valid http(s) URL');

const failureText = result => (result.status ? `Discord answered ${result.status}` : result.reason);

// One request: { ok, status, wait } where `status` 0 is no answer and `wait`
// the ms a 429 asks for.
async function attempt(url, body) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(DISCORD_RETRY.timeoutMs)
        });
        const text = await response.text().catch(() => '');
        let wait = null;
        if (response.status === 429) {
            let seconds = Number(response.headers.get('retry-after'));
            if (!(seconds > 0)) {
                try { seconds = Number(JSON.parse(text).retry_after); } catch { seconds = NaN; }
            }
            if (seconds > 0) wait = seconds * 1000;
        }
        return { ok: response.ok, status: response.status, wait };
    } catch (error) {
        // never error.message: fetch quotes a URL it cannot parse there
        return { ok: false, status: 0, reason: `no answer from Discord (${error.name === 'TimeoutError' ? 'timed out' : error.cause?.code || error.name})` };
    }
}

// One post (see DISCORD_RETRY); `retry: false` makes it a single attempt.
async function send(body, { retry = true } = {}) {
    const url = webhookUrl();
    if (!url) return { ok: false, status: 0, reason: 'no webhook URL' };
    if (!validUrl(url)) return { ok: false, status: 0, reason: 'the webhook URL is not a valid http(s) URL' };
    let result = await attempt(url, body);
    if (retry && !result.ok && retryable(result.status) && !stopped) {
        await sleep(Math.min(result.wait ?? DISCORD_RETRY.waitMs, DISCORD_RETRY.maxWaitMs));
        if (!stopped) result = await attempt(url, body);
    }
    return result;
}

// Posts build()'s message for (kind, key) unless its row is sent or dropped,
// then writes the outcome to the row. One post per row at a time; a post
// that ends after shutdown began writes nothing.
function deliver(kind, key, build) {
    const id = `${kind} ${key}`;
    if (inflight.has(id)) return inflight.get(id);
    const row = db.getDiscordPost(kind, key);
    if (row && row.status !== 'pending') return null;
    const record = result => {
        if (stopped) return;
        const tries = (row?.tries ?? 0) + 1;
        const status = result.ok ? 'sent' : tries >= DISCORD_RETRY.tries || !retryable(result.status) ? 'dropped' : 'pending';
        db.putDiscordPost({ kind, key, status, tries });
        console.log(`[Discord] ${id}: ${result.ok ? `sent (${result.status})` : `${failureText(result)}, ${status === 'pending' ? 'will try again' : 'dropped'} (post ${tries} of ${DISCORD_RETRY.tries})`}.`);
    };
    const job = (async () => {
        let message;
        try {
            message = await build();
        } catch (error) {
            // a message that cannot be built counts as a failed try
            record({ ok: false, status: 0, reason: `the message could not be built (${error.message})` });
            return null;
        }
        const result = await send(message);
        try {
            record(result);
        } catch (error) {
            console.error(`[Discord] ${id} not recorded:`, error.message);
        }
        return result;
    })().finally(() => inflight.delete(id));
    inflight.set(id, job);
    return job;
}

/**
 * Each server-browser tick (serverSnapshots.js): the day's "it's on" ping
 * once the browser shows FIGHT_NIGHT_PING.pilots. Returns the post under way,
 * or null; the tick does not wait for it.
 */
export function checkPing(servers, now = Date.now()) {
    try {
        const pilots = browserPilots(servers);
        const rising = lastPilots < FIGHT_NIGHT_PING.pilots;
        lastPilots = pilots;
        if (pilots < FIGHT_NIGHT_PING.pilots || !posting()) return null;
        const day = fightNightDay(now);
        // a new evening, or one whose ping is still pending
        if (!rising && db.getDiscordPost('ping', day)?.status !== 'pending') return null;
        return deliver('ping', day, () => pingMessage(servers, siteOrigin()));
    } catch (error) {
        console.error('[Discord] Ping check failed:', error.message);
        return null;
    }
}

// The power rankings on the day after the night, after a stats refresh so
// the night's matches count (one already under way may have started before
// they were stored, so it is waited out first).
async function rankingsAfter(date) {
    try {
        await db.refreshInProgress();
        await db.refreshPilotStats();
    } catch (error) {
        console.error('[Discord] Stats refresh before the recap failed:', error.message);
    }
    return db.getPowerRankings(shiftDay(date, 1));
}

/**
 * The detector (fightNightService.js): a recap it has just `saved` is queued,
 * and a queued one still pending is posted again on each run. No other save
 * of a recap posts. Returns the post under way, or null.
 */
export function postRecap(date, saved = false) {
    try {
        if (!posting()) return null;
        if (saved && !db.getDiscordPost('recap', date)) db.putDiscordPost({ kind: 'recap', key: date, status: 'pending', tries: 0 });
        if (db.getDiscordPost('recap', date)?.status !== 'pending') return null;
        return deliver('recap', date, async () => recapMessage(db.getFightNightRecapByDate(date), await rankingsAfter(date), siteOrigin()));
    } catch (error) {
        console.error(`[Discord] Recap ${date} not queued:`, error.message);
        return null;
    }
}

// Each detector run: drops the pings still pending from before today and the
// recaps from before the detector's window, which no tick or run will try again.
export function expireDiscordPosts(today, firstRecapDay) {
    try {
        db.dropStaleDiscordPosts('ping', today);
        db.dropStaleDiscordPosts('recap', firstRecapDay);
    } catch (error) {
        console.error('[Discord] Old posts not expired:', error.message);
    }
}

// The admin's test post: one attempt, whether or not posting is switched on,
// and no row.
export async function sendTest() {
    const result = await send(testMessage(), { retry: false });
    console.log(`[Discord] Test post: ${result.ok ? `sent (${result.status})` : failureText(result)}.`);
    return { ok: result.ok, status: result.status, message: result.ok ? 'Sent.' : `${failureText(result)}.` };
}

// What the admin page shows: the switch, whether a URL is set (masked), the
// ping's rule and the latest posts.
export function discordStatus() {
    const url = webhookUrl();
    return {
        enabled: discordEnabled(),
        configured: Boolean(url),
        webhook: url ? maskWebhook(url) : null,
        siteUrl: siteOrigin(),
        pingPilots: FIGHT_NIGHT_PING.pilots,
        posts: db.getRecentDiscordPosts(5)
    };
}

// Before the database closes on shutdown.
export function stopDiscord() {
    stopped = true;
}

// The posts under way (for tests).
export const postsSettled = () => Promise.all(inflight.values());

export default { checkPing, postRecap, expireDiscordPosts, sendTest, discordStatus, hasWebhook, stopDiscord };
