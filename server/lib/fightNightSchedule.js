// The fight-night schedule (S22): what a scheduled night is, when each one
// happens, which is next and when the Discord reminder is due. The day rules
// come from gameParse.js; the page and the server both read this file, so
// the dashboard's "next" is the feed's (fightNightFeed.js, server only).
import { DAY_MS, FIGHT_NIGHT_DAY, dayBounds, fightNightDay, localInstant, localWall, shiftDay, weekdayOf } from './gameParse.js';

// How far the feed and the dashboard look ahead, an event's length when the
// admin gives none, how many coming nights the dashboard lists, how long
// before a night the reminder posts, and the limits on what the admin types.
export const SCHEDULE = { horizonWeeks: 12, defaultMinutes: 180, minMinutes: 15, maxMinutes: 24 * 60, listed: 3, reminderMinutes: 60, titleMax: 80, notesMax: 500 };
export const FEED_PATH = '/fight-nights.ics';

const EVENT_KINDS = ['weekly', 'once'];
const MINUTE_MS = 60000;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
// A whole number from what a form or a request sends: a number as it is, a
// string of digits read as one; NaN for anything else (null, '', a boolean,
// an array, or a string Number() would read as a number: ' ', '1e1', '0x10').
export const wholeNumber = value => (typeof value === 'number' ? value : typeof value === 'string' && /^-?\d+$/.test(value) ? Number(value) : NaN);

/**
 * Checks an event as the admin sends it: a weekly rule (weekday 0 Monday to
 * 6 Sunday) or a one-off (a calendar date), a start time 'HH:MM' in
 * FIGHT_NIGHT_DAY.timeZone, a length in minutes, a title and notes. Gives
 * the row to store, or the first thing wrong with it.
 * @param {object} input
 * @returns {{ event?: object, error?: string }}
 */
export function validateEvent(input = {}) {
    const kind = String(input.kind ?? '');
    if (!EVENT_KINDS.includes(kind)) return { error: 'kind must be weekly or once' };
    const time = String(input.time ?? '');
    if (!TIME.test(time)) return { error: `time must be HH:MM, 24-hour, ${FIGHT_NIGHT_DAY.label}` };
    const minutes = input.minutes === undefined || input.minutes === '' ? SCHEDULE.defaultMinutes : wholeNumber(input.minutes);
    if (!Number.isInteger(minutes) || minutes < SCHEDULE.minMinutes || minutes > SCHEDULE.maxMinutes) {
        return { error: `minutes must be a whole number from ${SCHEDULE.minMinutes} to ${SCHEDULE.maxMinutes}` };
    }
    const title = String(input.title ?? '').trim();
    if (!title || title.length > SCHEDULE.titleMax) return { error: `title must be 1 to ${SCHEDULE.titleMax} characters` };
    const notes = String(input.notes ?? '').trim();
    if (notes.length > SCHEDULE.notesMax) return { error: `notes must be at most ${SCHEDULE.notesMax} characters` };
    const event = { kind, weekday: null, date: null, time, minutes, title, notes };
    if (kind === 'weekly') {
        const weekday = wholeNumber(input.weekday);
        if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) return { error: 'weekday must be 0 (Monday) to 6 (Sunday)' };
        event.weekday = weekday;
    } else {
        const date = String(input.date ?? '');
        if (!dayBounds(date)) return { error: 'date must be a calendar day, YYYY-MM-DD' };
        event.date = date;
    }
    return { event };
}

// A stored event on the calendar date `date`: its UTC start and end, its end
// on the wall clock in the zone (read back from the instant, so a night
// across a DST change ends when its real end says), and the fight-night day
// it belongs to (a night that starts after midnight is the evening before's).
function occurrence(event, date) {
    const start = localInstant(date, event.time);
    const end = new Date(Date.parse(start) + event.minutes * MINUTE_MS).toISOString();
    const wall = localWall(end);
    return { id: event.id, title: event.title, notes: event.notes, updated_at: event.updated_at, date, time: event.time, endDate: wall.date, endTime: wall.time, start, end, day: fightNightDay(start) };
}

/**
 * Every occurrence of `events` that overlaps [from, to) (ms), by start then
 * id: a weekly rule on each of its weekdays in the window, a one-off on its
 * date. A DST change moves an occurrence's UTC time, never its wall-clock time.
 * @param {object[]} events stored rows (fightNightEvents.js)
 * @param {number} fromMs
 * @param {number} toMs
 */
export function occurrences(events, fromMs, toMs) {
    const out = [];
    // the calendar dates that can hold one: a fight-night day may start the
    // calendar day before, and a night can run on past `from`'s day
    const first = shiftDay(fightNightDay(fromMs), -1);
    const last = shiftDay(fightNightDay(toMs), 1);
    for (let date = first; date <= last; date = shiftDay(date, 1)) {
        const weekday = weekdayOf(date);
        for (const event of events) {
            if (event.kind === 'weekly' ? event.weekday !== weekday : event.date !== date) continue;
            const one = occurrence(event, date);
            if (Date.parse(one.end) > fromMs && Date.parse(one.start) < toMs) out.push(one);
        }
    }
    return out.sort((a, b) => a.start.localeCompare(b.start) || a.id - b.id);
}

// [now, now + the horizon), the window the feed and the dashboard show.
export const scheduleWindow = now => [now, now + SCHEDULE.horizonWeeks * 7 * DAY_MS];

// The occurrences not yet over at `now` (ms): one under way first, then the
// coming ones; and the first of them, or null.
export const comingOccurrences = (list, now) => list.filter(o => Date.parse(o.end) > now);
export const nextOccurrence = (list, now) => comingOccurrences(list, now)[0] ?? null;

// Whether an occurrence has started and not ended at `now` (ms).
export const underWay = (one, now) => Boolean(one) && Date.parse(one.start) <= now && Date.parse(one.end) > now;

/**
 * The occurrences whose reminder is due at `now`: starting within
 * SCHEDULE.reminderMinutes, not yet started.
 * @param {object[]} events stored rows
 * @param {number} now ms
 */
export function dueReminders(events, now) {
    const until = now + SCHEDULE.reminderMinutes * MINUTE_MS;
    // the window's end is inclusive: a start exactly an hour away is due
    return occurrences(events, now, until + 1).filter(o => Date.parse(o.start) > now);
}

// A reminder's key in discord_posts: the start first, so the keys sort by
// time and the ISO string of `now` bounds the ones for nights that have
// started (a night starting this very ms is bounded by the next tick). The
// start is in the key on purpose: a night whose time the admin moves is
// announced again at its new time (and a deleted and recreated event, with
// its new id, too); a title or notes edit does not post again.
export const reminderKey = one => `${one.start} ${one.id}`;
