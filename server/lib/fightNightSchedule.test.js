import { describe, expect, it } from 'vitest';
import {
    SCHEDULE, comingOccurrences, dueReminders, nextOccurrence, occurrences,
    reminderKey, scheduleWindow, underWay, validateEvent, wholeNumber
} from './fightNightSchedule.js';
import { foldLine, icsFeed, icsText } from './fightNightFeed.js';
import { DAY_MS, fightNightDay, localInstant } from './gameParse.js';
import { day, onDay, sample } from '../testFixtures.js';

// The schedule rules (S22) on hand-made events over the DST days (clocks go
// forward at 02:00 on 2026-03-08 and back on 2026-11-01).
const weekly = (over = {}) => ({ id: 1, kind: 'weekly', weekday: 5, date: null, time: '20:00', minutes: 180, title: 'Saturday Night Anarchy', notes: '', updated_at: '2026-10-01T00:00:00.000Z', ...over });
const once = (over = {}) => ({ id: 2, kind: 'once', weekday: null, date: '2026-10-14', time: '19:30', minutes: 120, title: 'CTF special', notes: 'Flags; captures, and more\nsecond line', updated_at: '2026-10-02T00:00:00.000Z', ...over });
const at = iso => Date.parse(iso);

// A hand parser for the feed: CRLF lines unfolded, then the components with
// their properties (a repeated property keeps the last value, which no
// component here repeats).
function parseIcs(text) {
    expect(text.endsWith('\r\n')).toBe(true);
    expect(text).not.toMatch(/[^\r]\n/);
    const lines = [];
    for (const raw of text.split('\r\n').slice(0, -1)) {
        expect(Buffer.byteLength(raw, 'utf8')).toBeLessThanOrEqual(75);
        if (raw.startsWith(' ')) lines[lines.length - 1] += raw.slice(1);
        else lines.push(raw);
    }
    const stack = [{ type: 'root', props: {}, children: [] }];
    for (const line of lines) {
        const [name, ...rest] = line.split(':');
        const value = rest.join(':');
        if (name === 'BEGIN') {
            const node = { type: value, props: {}, children: [] };
            stack[stack.length - 1].children.push(node);
            stack.push(node);
        } else if (name === 'END') {
            expect(stack.pop().type).toBe(value);
        } else {
            stack[stack.length - 1].props[name] = value;
        }
    }
    expect(stack).toHaveLength(1);
    return stack[0].children[0];
}

describe('validateEvent', () => {
    it('gives back a weekly rule or a one-off as stored, trimmed, with the length defaulted', () => {
        expect(validateEvent({ kind: 'weekly', weekday: '5', time: '20:00', minutes: '', title: '  Saturday Night Anarchy ', notes: ' bring flags ' }))
            .toEqual({ event: { kind: 'weekly', weekday: 5, date: null, time: '20:00', minutes: SCHEDULE.defaultMinutes, title: 'Saturday Night Anarchy', notes: 'bring flags' } });
        expect(validateEvent({ kind: 'once', date: '2026-10-14', time: '19:30', minutes: 120, title: 'CTF special' }))
            .toEqual({ event: { kind: 'once', weekday: null, date: '2026-10-14', time: '19:30', minutes: 120, title: 'CTF special', notes: '' } });
        // the one number reader behind weekday, minutes and the admin routes' ids
        expect([wholeNumber('5'), wholeNumber(5), wholeNumber(null), wholeNumber(''), wholeNumber(false), wholeNumber('x')]).toEqual([5, 5, NaN, NaN, NaN, NaN]);
    });

    it('names the first thing wrong', () => {
        const good = { kind: 'weekly', weekday: 5, time: '20:00', minutes: 180, title: 'x' };
        expect(validateEvent({ ...good, kind: 'daily' }).error).toMatch(/kind/);
        expect(validateEvent({ ...good, time: '8pm' }).error).toMatch(/time/);
        expect(validateEvent({ ...good, time: '24:00' }).error).toMatch(/time/);
        expect(validateEvent({ ...good, minutes: 10 }).error).toMatch(/minutes/);
        expect(validateEvent({ ...good, minutes: 90.5 }).error).toMatch(/minutes/);
        expect(validateEvent({ ...good, minutes: SCHEDULE.maxMinutes + 1 }).error).toMatch(/minutes/);
        expect(validateEvent({ ...good, title: '   ' }).error).toMatch(/title/);
        expect(validateEvent({ ...good, title: 'x'.repeat(SCHEDULE.titleMax + 1) }).error).toMatch(/title/);
        expect(validateEvent({ ...good, notes: 'x'.repeat(SCHEDULE.notesMax + 1) }).error).toMatch(/notes/);
        expect(validateEvent({ ...good, weekday: 7 }).error).toMatch(/weekday/);
        expect(validateEvent({ ...good, weekday: 'Sat' }).error).toMatch(/weekday/);
        // Number() would read these as Monday
        for (const weekday of [null, '', false, undefined]) expect(validateEvent({ ...good, weekday }).error).toMatch(/weekday/);
        expect(validateEvent({ ...good, weekday: '0' }).event.weekday).toBe(0);
        expect(validateEvent({ kind: 'once', time: '20:00', title: 'x', date: '2026-02-30' }).error).toMatch(/date/);
        expect(validateEvent({ kind: 'once', time: '20:00', title: 'x', date: '14/10/2026' }).error).toMatch(/date/);
        expect(validateEvent().error).toMatch(/kind/);
    });
});

describe('occurrences', () => {
    it('expands a weekly rule day by day, the wall clock fixed and the UTC time moving with DST', () => {
        const spring = occurrences([weekly()], at('2026-03-02T00:00:00Z'), at('2026-03-20T00:00:00Z'));
        expect(spring.map(o => [o.date, o.start, o.end, o.day])).toEqual([
            ['2026-03-07', '2026-03-08T02:00:00.000Z', '2026-03-08T05:00:00.000Z', '2026-03-07'], // CST
            ['2026-03-14', '2026-03-15T01:00:00.000Z', '2026-03-15T04:00:00.000Z', '2026-03-14'] // CDT
        ]);
        const autumn = occurrences([weekly()], at('2026-10-26T00:00:00Z'), at('2026-11-10T00:00:00Z'));
        expect(autumn.map(o => [o.date, o.start, o.day])).toEqual([
            ['2026-10-31', '2026-11-01T01:00:00.000Z', '2026-10-31'],
            ['2026-11-07', '2026-11-08T02:00:00.000Z', '2026-11-07']
        ]);
        expect(spring[0]).toEqual({ id: 1, title: 'Saturday Night Anarchy', notes: '', updated_at: '2026-10-01T00:00:00.000Z', date: '2026-03-07', time: '20:00', endDate: '2026-03-07', endTime: '23:00', start: '2026-03-08T02:00:00.000Z', end: '2026-03-08T05:00:00.000Z', day: '2026-03-07' });
        for (const one of [...spring, ...autumn]) expect(one.start).toBe(localInstant(one.date, one.time));
    });

    it('keeps a night across the autumn change its real length, its wall-clock end read back in the zone', () => {
        const [late] = occurrences([weekly({ time: '23:30' })], at('2026-10-31T00:00:00Z'), at('2026-11-02T00:00:00Z'));
        expect([late.start, late.end]).toEqual(['2026-11-01T04:30:00.000Z', '2026-11-01T07:30:00.000Z']);
        // 07:30Z is 01:30 CST, after the clocks went back at 02:00 CDT
        expect([late.endDate, late.endTime]).toEqual(['2026-11-01', '01:30']);
        // a night across the spring change is an hour shorter on the clock
        const [spring] = occurrences([weekly({ weekday: 5, time: '23:30' })], at('2026-03-07T00:00:00Z'), at('2026-03-09T00:00:00Z'));
        expect([spring.start, spring.end, spring.endDate, spring.endTime]).toEqual(['2026-03-08T05:30:00.000Z', '2026-03-08T08:30:00.000Z', '2026-03-08', '03:30']);
    });

    it('places a one-off on its date, a night after midnight on the evening before, and sorts by start then id', () => {
        const list = occurrences([weekly({ weekday: 1 }), once(), once({ id: 3, date: '2026-10-14', time: '19:00', minutes: 30 }), weekly({ id: 4, weekday: 5, time: '00:30' })],
            at('2026-10-12T00:00:00Z'), at('2026-10-19T00:00:00Z'));
        expect(list.map(o => [o.id, o.date, o.start, o.day])).toEqual([
            [1, '2026-10-13', '2026-10-14T01:00:00.000Z', '2026-10-13'], // Tuesday
            [3, '2026-10-14', '2026-10-15T00:00:00.000Z', '2026-10-14'],
            [2, '2026-10-14', '2026-10-15T00:30:00.000Z', '2026-10-14'],
            [4, '2026-10-17', '2026-10-17T05:30:00.000Z', '2026-10-16'] // Saturday 00:30 is Friday's night
        ]);
    });

    it('includes a night that falls inside the window by the wall clock in the zone', () => {
        // 2026-03-01T00:00Z is 18:00 Central on Saturday 2026-02-28, before that night's 20:00
        expect(occurrences([weekly()], at('2026-03-01T00:00:00Z'), at('2026-03-02T00:00:00Z')).map(o => o.date)).toEqual(['2026-02-28']);
    });

    it('includes a night under way at the window\'s start and not one that has ended or starts at its end', () => {
        const start = at('2026-10-11T01:00:00.000Z'); // Saturday 2026-10-10 20:00 CDT
        expect(occurrences([weekly()], start + 2 * 3600000, start + 7 * DAY_MS)).toHaveLength(1);
        expect(occurrences([weekly()], start + 3 * 3600000, start + 7 * DAY_MS)).toHaveLength(0);
        expect(occurrences([weekly()], start - DAY_MS, start)).toHaveLength(0);
        expect(occurrences([weekly()], start - DAY_MS, start + 1)).toHaveLength(1);
        expect(occurrences([], start, start + 30 * DAY_MS)).toEqual([]);
    });

    it('names the one under way or the next, and the window ahead', () => {
        const list = occurrences([weekly()], at('2026-10-05T00:00:00Z'), at('2026-10-30T00:00:00Z'));
        expect(comingOccurrences(list, at('2026-10-11T02:00:00Z')).map(o => o.date)).toEqual(['2026-10-10', '2026-10-17', '2026-10-24']);
        expect(nextOccurrence(list, at('2026-10-11T02:00:00Z')).date).toBe('2026-10-10');
        expect(underWay(nextOccurrence(list, at('2026-10-11T02:00:00Z')), at('2026-10-11T02:00:00Z'))).toBe(true);
        expect(nextOccurrence(list, at('2026-10-11T04:00:00Z')).date).toBe('2026-10-17');
        expect(underWay(nextOccurrence(list, at('2026-10-11T04:00:00Z')), at('2026-10-11T04:00:00Z'))).toBe(false);
        expect(nextOccurrence(list, at('2026-10-25T04:00:00Z'))).toBeNull();
        expect(underWay(null, 0)).toBe(false);
        const [from, to] = scheduleWindow(at('2026-10-10T00:00:00Z'));
        expect(to - from).toBe(SCHEDULE.horizonWeeks * 7 * DAY_MS);
    });

    it('finds the reminders due within the hour before a start, keyed so they sort by start', () => {
        const start = at('2026-10-11T01:00:00.000Z');
        expect(dueReminders([weekly()], start - 59 * 60000).map(o => o.date)).toEqual(['2026-10-10']);
        expect(dueReminders([weekly()], start - 60 * 60000).map(o => o.date)).toEqual(['2026-10-10']);
        expect(dueReminders([weekly()], start - 61 * 60000)).toEqual([]);
        expect(dueReminders([weekly()], start)).toEqual([]);
        expect(dueReminders([weekly()], start + 60000)).toEqual([]);
        const [one] = dueReminders([weekly()], start - 30 * 60000);
        expect(reminderKey(one)).toBe('2026-10-11T01:00:00.000Z 1');
        // stale once a later tick's ISO bounds it, not a minute before
        expect(reminderKey(one) < new Date(start + 60000).toISOString()).toBe(true);
        expect(reminderKey(one) < new Date(start - 60000).toISOString()).toBe(false);
        expect(reminderKey({ ...one, id: 1234 }) < new Date(start + 1).toISOString()).toBe(true);
    });
});

describe('the .ics feed', () => {
    const recap = (over = {}) => ({ date: day, formattedDate: 'Sunday, October 4, 2026', totalMatches: 18, totalPilots: 11, totalFrags: 1102, topFragger: { name: 'WD-40', kills: 237 }, created_at: '2026-10-05 11:16:00', ...over });
    const night = sample.map(onDay).filter(g => fightNightDay(g.date) === day);
    const span = { start: new Date(Math.min(...night.map(g => Date.parse(g.settings.start)))).toISOString(), end: night.map(g => g.date).sort().at(-1) };

    it('escapes text and folds lines at 75 octets without splitting a character', () => {
        expect(icsText('a, b; c\\d\nnext')).toBe('a\\, b\\; c\\\\d\\nnext');
        expect(icsText(null)).toBe('');
        const ascii = foldLine(`SUMMARY:${'x'.repeat(200)}`);
        // each continuation starts with a space inside its 75 octets
        expect(ascii.split('\r\n').map(l => l.length)).toEqual([75, 75, 60]);
        expect(ascii.replace(/\r\n /g, '')).toBe(`SUMMARY:${'x'.repeat(200)}`);
        const wide = foldLine(`SUMMARY:${'ä'.repeat(60)}`);
        for (const part of wide.split('\r\n')) expect(Buffer.byteLength(part, 'utf8')).toBeLessThanOrEqual(75);
        expect(wide.replace(/\r\n /g, '')).toBe(`SUMMARY:${'ä'.repeat(60)}`);
        expect(foldLine('short')).toBe('short');
    });

    it('carries the coming nights on the wall clock in the zone and the recaps in UTC, each with its page', () => {
        const list = occurrences([weekly({ title: 'Saturday; Night, Anarchy' }), once()], at('2026-10-12T00:00:00Z'), at('2026-10-19T00:00:00Z'));
        const feed = icsFeed({ origin: 'https://ofc.example', occurrences: list, recaps: [{ recap: recap(), span }, { recap: recap({ date: '2020-01-01' }), span: null }] });
        const cal = parseIcs(feed);
        expect(cal.type).toBe('VCALENDAR');
        expect(cal.props).toMatchObject({ VERSION: '2.0', 'X-WR-TIMEZONE': 'America/Chicago', 'X-WR-CALNAME': 'overloadfight.club fight nights', METHOD: 'PUBLISH' });
        const [tz, wednesday, saturday, past] = cal.children;
        expect(tz.type).toBe('VTIMEZONE');
        expect(tz.props.TZID).toBe('America/Chicago');
        expect(tz.children.map(c => [c.type, c.props.TZOFFSETFROM, c.props.TZOFFSETTO, c.props.RRULE])).toEqual([
            ['DAYLIGHT', '-0600', '-0500', 'FREQ=YEARLY;BYMONTH=3;BYDAY=2SU'],
            ['STANDARD', '-0500', '-0600', 'FREQ=YEARLY;BYMONTH=11;BYDAY=1SU']
        ]);
        expect(cal.children).toHaveLength(4); // the recap without a span is left out
        expect(wednesday.props).toEqual({
            UID: 'fight-night-2-2026-10-14@overloadfight.club',
            DTSTAMP: '20261002T000000Z',
            'DTSTART;TZID=America/Chicago': '20261014T193000',
            'DTEND;TZID=America/Chicago': '20261014T213000',
            SUMMARY: 'CTF special',
            DESCRIPTION: 'Flags\\; captures\\, and more\\nsecond line\\nLive servers: https://ofc.example/',
            URL: 'https://ofc.example/fight-night'
        });
        expect(saturday.props).toMatchObject({ UID: 'fight-night-1-2026-10-17@overloadfight.club', 'DTSTART;TZID=America/Chicago': '20261017T200000', 'DTEND;TZID=America/Chicago': '20261017T230000', SUMMARY: 'Saturday\\; Night\\, Anarchy' });
        const stamp = iso => iso.replace(/[-:]/g, '').replace(/\.\d{3}/, '');
        expect(past.props).toEqual({
            UID: `recap-${day}@overloadfight.club`,
            DTSTAMP: '20261005T111600Z',
            DTSTART: stamp(span.start),
            DTEND: stamp(span.end),
            SUMMARY: 'Fight Night recap: Sunday\\, October 4\\, 2026',
            // the night's share card's own sentence (S19), escaped
            DESCRIPTION: 'Sunday\\, October 4\\, 2026: 18 matches\\, 11 pilots\\, most kills WD-40 (237).',
            URL: `https://ofc.example/fight-night/${day}`
        });
    });

    it('leaves out a most-kills line at 0 and starts a recap at its end when the first match has no start', () => {
        const feed = icsFeed({ origin: 'https://ofc.example', occurrences: [], recaps: [{ recap: recap({ topFragger: { name: 'Unknown', kills: 0 }, created_at: undefined }), span: { start: null, end: '2026-10-05T04:00:00.000Z' } }] });
        const [, past] = parseIcs(feed).children;
        expect(past.props).toMatchObject({ DTSTART: '20261005T040000Z', DTEND: '20261005T040000Z', DTSTAMP: '20261005T040000Z', DESCRIPTION: 'Sunday\\, October 4\\, 2026: 18 matches\\, 11 pilots.' });
    });

    it('writes a VTIMEZONE that agrees with localInstant on both sides of each DST change', () => {
        // the zone's offsets the block names, read back from the instants
        const offset = (date, time) => (Date.parse(`${date}T${time}:00Z`) - Date.parse(localInstant(date, time))) / 3600000;
        expect([offset('2026-03-07', '20:00'), offset('2026-03-08', '20:00')]).toEqual([-6, -5]);
        expect([offset('2026-10-31', '20:00'), offset('2026-11-01', '20:00')]).toEqual([-5, -6]);
        // the change is at 02:00: 01:59 is still the old offset, 03:00 the new
        expect([offset('2026-03-08', '01:59'), offset('2026-03-08', '03:00')]).toEqual([-6, -5]);
        expect([offset('2026-11-01', '00:59'), offset('2026-11-01', '03:00')]).toEqual([-5, -6]);
    });
});
