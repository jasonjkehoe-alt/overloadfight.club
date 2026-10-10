// The fight-night schedule (S22): what a scheduled night is, when each one
// happens, which is next, when the Discord reminder is due, and the .ics feed.
// The day rules come from gameParse.js; the page and the server both read
// this file, so the dashboard's "next" is the feed's.
import { FIGHT_NIGHT_DAY, dayBounds, fightNightDay, localInstant, localWall, shiftDay, weekdayOf } from './gameParse.js';
import { SITE_NAME, urlFor } from './siteRoutes.js';
import { count, plural } from './matchResult.js';

// How far the feed and the dashboard look ahead, an event's length when the
// admin gives none, how many coming nights the dashboard lists, how long
// before a night the reminder posts, and the limits on what the admin types.
export const SCHEDULE = { horizonWeeks: 12, defaultMinutes: 180, minMinutes: 15, maxMinutes: 24 * 60, listed: 3, reminderMinutes: 60, titleMax: 80, notesMax: 500 };
export const EVENT_KINDS = ['weekly', 'once'];
export const FEED_PATH = '/fight-nights.ics';

const MINUTE_MS = 60000;
const ms = at => (typeof at === 'number' ? at : Date.parse(at));
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

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
    const minutes = input.minutes === undefined || input.minutes === '' ? SCHEDULE.defaultMinutes : Number(input.minutes);
    if (!Number.isInteger(minutes) || minutes < SCHEDULE.minMinutes || minutes > SCHEDULE.maxMinutes) {
        return { error: `minutes must be a whole number from ${SCHEDULE.minMinutes} to ${SCHEDULE.maxMinutes}` };
    }
    const title = String(input.title ?? '').trim();
    if (!title || title.length > SCHEDULE.titleMax) return { error: `title must be 1 to ${SCHEDULE.titleMax} characters` };
    const notes = String(input.notes ?? '').trim();
    if (notes.length > SCHEDULE.notesMax) return { error: `notes must be at most ${SCHEDULE.notesMax} characters` };
    const event = { kind, weekday: null, date: null, time, minutes, title, notes };
    if (kind === 'weekly') {
        // Number() would read null, '' and false as Monday
        const weekday = input.weekday === null || input.weekday === '' || typeof input.weekday === 'boolean' ? NaN : Number(input.weekday);
        if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) return { error: 'weekday must be 0 (Monday) to 6 (Sunday)' };
        event.weekday = weekday;
    } else {
        const date = String(input.date ?? '');
        if (!dayBounds(date)) return { error: 'date must be a calendar day, YYYY-MM-DD' };
        event.date = date;
    }
    return { event };
}

// A stored event on the calendar date `date`: its UTC start and end and the
// fight-night day it belongs to (a night that starts after midnight is the
// evening before's).
function occurrence(event, date) {
    const start = localInstant(date, event.time);
    const end = new Date(Date.parse(start) + event.minutes * MINUTE_MS).toISOString();
    return { id: event.id, kind: event.kind, title: event.title, notes: event.notes, updated_at: event.updated_at, date, time: event.time, minutes: event.minutes, start, end, day: fightNightDay(start) };
}

/**
 * Every occurrence of `events` that overlaps [from, to), by start then id: a
 * weekly rule on each of its weekdays in the window, a one-off on its date.
 * The window's ends are ms or ISO strings. A DST change moves an occurrence's
 * UTC time, never its wall-clock time.
 * @param {object[]} events stored rows (fightNightEvents.js)
 * @param {number | string} from
 * @param {number | string} to
 */
export function occurrences(events, from, to) {
    const fromMs = ms(from);
    const toMs = ms(to);
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
export const scheduleWindow = now => [now, now + SCHEDULE.horizonWeeks * 7 * 86400000];

/**
 * The occurrence under way at `now` or, failing that, the next to start;
 * null with none.
 * @param {object[]} list occurrences()
 * @param {number | string} now
 */
export const nextOccurrence = (list, now) => list.find(o => Date.parse(o.end) > ms(now)) ?? null;

// Whether an occurrence has started and not ended at `now`.
export const underWay = (one, now) => Boolean(one) && Date.parse(one.start) <= ms(now) && Date.parse(one.end) > ms(now);

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
// time; and the key every reminder for a night that has started by `now`
// sorts before ('~' sorts after the space and every digit of an id).
export const reminderKey = one => `${one.start} ${one.id}`;
export const reminderKeysBefore = now => `${new Date(now).toISOString()}~`;

// RFC 5545 text: backslashes, semicolons, commas and newlines escaped.
export const icsText = text => String(text ?? '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

const encoder = new TextEncoder();
const octets = text => encoder.encode(text).length;

// A content line folded at 75 octets: a CRLF and one space start each
// continuation, and no character is split.
export function foldLine(line) {
    const parts = [];
    let current = '';
    let limit = 75;
    for (const char of line) {
        if (octets(current) + octets(char) > limit) {
            parts.push(current);
            current = ' ';
            limit = 75;
        }
        current += char;
    }
    parts.push(current);
    return parts.join('\r\n');
}

// 20261018T010000Z for a UTC ISO string, and 20261017T200000 for a wall
// date and time.
const utcStamp = iso => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const wallStamp = (date, time) => `${date.replace(/-/g, '')}T${time.replace(':', '')}00`;

// America/Chicago, the zone of FIGHT_NIGHT_DAY: the US rule since 2007
// (forward on the second Sunday of March, back on the first Sunday of
// November, both at 02:00). A test checks it against localInstant on the
// DST days, so a change of zone fails it rather than drifting the feed.
const VTIMEZONE = [
    'BEGIN:VTIMEZONE',
    `TZID:${FIGHT_NIGHT_DAY.timeZone}`,
    'BEGIN:DAYLIGHT',
    'TZOFFSETFROM:-0600',
    'TZOFFSETTO:-0500',
    'TZNAME:CDT',
    'DTSTART:19700308T020000',
    'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU',
    'END:DAYLIGHT',
    'BEGIN:STANDARD',
    'TZOFFSETFROM:-0500',
    'TZOFFSETTO:-0600',
    'TZNAME:CST',
    'DTSTART:19701101T020000',
    'RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU',
    'END:STANDARD',
    'END:VTIMEZONE'
];

const vevent = lines => ['BEGIN:VEVENT', ...lines.filter(Boolean), 'END:VEVENT'];

// A coming night: its wall-clock start and end in the zone, the title, the
// notes with a line pointing at the live list, and the fight-night page.
function scheduledEvent(one, origin) {
    const notes = [one.notes, `Live servers: ${origin}${urlFor('dashboard')}`].filter(Boolean).join('\n');
    return vevent([
        `UID:fight-night-${one.id}-${one.date}@${SITE_NAME}`,
        `DTSTAMP:${utcStamp(one.updated_at ?? one.start)}`,
        `DTSTART;TZID=${FIGHT_NIGHT_DAY.timeZone}:${wallStamp(one.date, one.time)}`,
        `DTEND;TZID=${FIGHT_NIGHT_DAY.timeZone}:${wallStamp(...wallEnd(one))}`,
        `SUMMARY:${icsText(one.title)}`,
        `DESCRIPTION:${icsText(notes)}`,
        `URL:${origin}${urlFor('fight-night')}`
    ]);
}

// The wall-clock end of an occurrence, as [date, time]: its real end read on
// the clock in the zone, so the feed, the dashboard and underWay agree
// across a DST change (a 3-hour night at 23:00 on the night the clocks go
// back ends at 01:00 CST, 07:00Z).
export function wallEnd(one) {
    const { date, time } = localWall(one.end);
    return [date, time];
}

// A night that happened: the saved recap on its fight-night day, from its
// first match's start to its last match's end, in UTC, with the recap page.
function recapEvent({ recap, span }, origin) {
    if (!recap || !span?.end) return [];
    const top = recap.topFragger?.name && recap.topFragger.kills > 0 ? recap.topFragger : null;
    const totals = `${plural(recap.totalMatches, 'match', 'matches')}, ${plural(recap.totalPilots, 'pilot', 'pilots')}, ${plural(recap.totalFrags, 'kill', 'kills')}`;
    const line = `${totals}${top ? `, most kills ${top.name} (${count(top.kills)})` : ''}.`;
    return vevent([
        `UID:recap-${recap.date}@${SITE_NAME}`,
        `DTSTAMP:${utcStamp(recap.created_at ? `${recap.created_at.replace(' ', 'T')}Z` : span.end)}`,
        `DTSTART:${utcStamp(span.start ?? span.end)}`,
        `DTEND:${utcStamp(span.end)}`,
        `SUMMARY:${icsText(`Fight Night recap: ${recap.formattedDate}`)}`,
        `DESCRIPTION:${icsText(line)}`,
        `URL:${origin}${urlFor('fight-night', recap.date)}`
    ]);
}

/**
 * The .ics feed: the coming occurrences and the nights that happened, as
 * one VCALENDAR with CRLF line ends and lines folded at 75 octets.
 * @param {{ origin: string, occurrences: object[], recaps: { recap: object, span: { start: string | null, end: string } | null }[] }} feed
 * @returns {string}
 */
export function icsFeed({ origin, occurrences: list, recaps }) {
    const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        `PRODID:-//${SITE_NAME}//fight nights//EN`,
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        `X-WR-CALNAME:${icsText(`${SITE_NAME} fight nights`)}`,
        `X-WR-TIMEZONE:${FIGHT_NIGHT_DAY.timeZone}`,
        'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
        ...VTIMEZONE,
        ...list.flatMap(one => scheduledEvent(one, origin)),
        ...recaps.flatMap(entry => recapEvent(entry, origin)),
        'END:VCALENDAR'
    ];
    return `${lines.map(foldLine).join('\r\n')}\r\n`;
}
