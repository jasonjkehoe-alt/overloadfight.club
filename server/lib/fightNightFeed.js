// The .ics feed (S22): the coming scheduled nights and the saved recaps as
// one VCALENDAR, written by hand to RFC 5545. Server only: the recap events
// read the night's share card (shareCards.js, which hashes with node:crypto),
// so the page imports fightNightSchedule.js and never this file.
import { FIGHT_NIGHT_DAY } from './gameParse.js';
import { SITE_NAME, urlFor } from './siteRoutes.js';
import { fightNightCard } from './shareCards.js';

// RFC 5545 text: backslashes, semicolons, commas and newlines escaped.
export const icsText = text => String(text ?? '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

const LINE_OCTETS = 75;
// The UTF-8 size of one character (a code point).
const charOctets = char => {
    const code = char.codePointAt(0);
    return code < 0x80 ? 1 : code < 0x800 ? 2 : code < 0x10000 ? 3 : 4;
};

// A content line folded at 75 octets: a CRLF and one space start each
// continuation, and no character is split.
export function foldLine(line) {
    const parts = [];
    let current = '';
    let size = 0;
    for (const char of line) {
        const width = charOctets(char);
        if (size + width > LINE_OCTETS) {
            parts.push(current);
            current = ' ';
            size = 1;
        }
        current += char;
        size += width;
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
        `DTSTAMP:${utcStamp(one.updated_at)}`,
        `DTSTART;TZID=${FIGHT_NIGHT_DAY.timeZone}:${wallStamp(one.date, one.time)}`,
        `DTEND;TZID=${FIGHT_NIGHT_DAY.timeZone}:${wallStamp(one.endDate, one.endTime)}`,
        `SUMMARY:${icsText(one.title)}`,
        `DESCRIPTION:${icsText(notes)}`,
        `URL:${origin}${urlFor('fight-night')}`
    ]);
}

// A night that happened: the saved recap on its fight-night day, from its
// first match's start to its last match's end, in UTC, with the recap page.
// Its words are the night's share card's (S19), so the three places that
// describe a night say one thing.
function recapEvent({ recap, span }, origin) {
    const card = fightNightCard(recap);
    if (!card || !span?.end) return [];
    return vevent([
        `UID:recap-${recap.date}@${SITE_NAME}`,
        `DTSTAMP:${utcStamp(recap.created_at ? `${recap.created_at.replace(' ', 'T')}Z` : span.end)}`,
        `DTSTART:${utcStamp(span.start ?? span.end)}`,
        `DTEND:${utcStamp(span.end)}`,
        `SUMMARY:${icsText(`Fight Night recap: ${card.title}`)}`,
        `DESCRIPTION:${icsText(card.description)}`,
        `URL:${origin}${card.path}`
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
