import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { day, onDay, sample, veteranSoup } from '../testFixtures.js';
import { combatRatio, durationOf, fightNightDay, netKills, pilotKey, rankedMatch } from '../lib/gameParse.js';
import { cardKey } from '../lib/shareCards.js';
import { dayLabel } from '../lib/matchResult.js';

// satori, counted: how many cards it drew, how many at once at most, and a
// title that makes it throw.
const drawn = vi.hoisted(() => ({ calls: 0, running: 0, most: 0 }));
vi.mock('satori', async importOriginal => {
    const real = (await importOriginal()).default;
    return {
        default: async (tree, options) => {
            drawn.calls++;
            drawn.running++;
            drawn.most = Math.max(drawn.most, drawn.running);
            try {
                if (JSON.stringify(tree).includes('THROW ME')) throw new Error('satori failed');
                return await real(tree, options);
            } finally {
                drawn.running--;
            }
        }
    };
});

const template = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'index.html'), 'utf8');
const ORIGIN = 'https://overloadfight.club';

let dataDir;
let db;
let cards;
let withPageMeta;
let pageCard;
let recap;
let server;
let base;

beforeAll(async () => {
    dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ofc-cards-'));
    process.env.DATA_DIR = dataDir;
    db = (await import('../db.js')).default;
    cards = await import('./cardService.js');
    ({ withPageMeta, pageCard } = await import('../pageMeta.js'));
    db.saveGames([...sample.map(g => onDay(structuredClone(g))), veteranSoup]);
    await db.refreshPilotStats();
    recap = await (await import('./fightNightService.js')).generateRecapForDate(day, true);
    const app = express();
    app.use('/api', (await import('../routes/cards.js')).default);
    server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    base = `http://127.0.0.1:${server.address().port}`;
});

afterAll(async () => {
    await new Promise(resolve => server.close(resolve));
    await db.close();
    fs.rmSync(dataDir, { recursive: true, force: true });
});

beforeEach(() => {
    cards.clearCards();
    Object.assign(drawn, { calls: 0, running: 0, most: 0 });
});

afterEach(() => vi.restoreAllMocks());

// The width and height in a PNG's IHDR chunk.
const pngSize = png => ({ width: png.readUInt32BE(16), height: png.readUInt32BE(20), signature: png.subarray(1, 4).toString() });
const stat = (card, label) => card.stats.find(s => s.label === label);
// A card with only a title, cheap to draw.
const stub = (title, path = '/game/1') => ({ path, kind: 'K', title, line: '', stats: [], description: '' });
// Make the fight night's card fail to draw (satori throws on this text), quietly.
const failNight = () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    return vi.spyOn(db, 'getFightNightRecapByDate').mockReturnValue({ ...recap, formattedDate: 'THROW ME' });
};
const ogImage = url => withPageMeta(template, ORIGIN, url).match(/<meta property="og:image" content="([^"]*)" \/>/)?.[1];

describe('the cards on fixture data', () => {
    it('counts a pilot\'s matches, kills and ranked Combat Ratio from the fixture games, and reads the rating as the rating card does', () => {
        const rows = sample.flatMap(g => g.players.map(p => ({ g, p }))).filter(({ p }) => p.name === 'ZERGLING');
        const ranked = rows.filter(({ g }) => rankedMatch(g, durationOf(g)));
        const sum = (list, f) => list.reduce((total, x) => total + f(x), 0);
        const card = pageCard('/pilot/zergling');
        expect(card.title).toBe('ZERGLING');
        expect(stat(card, 'Matches').value).toBe(String(rows.length));
        expect(stat(card, 'Kills').value).toBe(String(sum(rows, ({ p }) => netKills(p))));
        const ratio = combatRatio(sum(ranked, ({ p }) => netKills(p)), sum(ranked, ({ p }) => p.assists || 0), sum(ranked, ({ p }) => p.deaths || 0));
        expect(stat(card, 'Combat Ratio').value).toBe(ratio.toFixed(2));
        const rating = db.getPilotRating('ZERGLING');
        expect(rating.matches).toBeGreaterThan(0);
        expect(stat(card, 'Rating').value).toBe(String(Math.round(rating.rating)));
        expect(card.line).toBe(`Last match ${dayLabel(day)}`);
        // only WD-40 has 10 rated matches in the samples (pageMeta.test.js)
        expect(stat(pageCard('/pilot/WD-40'), 'Rating').note).toMatch(/^#1 in the power rankings$/);
        expect(stat(card, 'Rating').note).toMatch(/^Provisional: \d of 10 rated matches$/);
    });

    it('counts a fight night\'s matches, pilots, kills and most kills from the fixture games', () => {
        // the samples moved onto `day` run past its 06:00 rollover into the next
        const night = sample.map(onDay).filter(g => fightNightDay(g.date) === day);
        expect(night.length).toBeGreaterThan(1);
        expect(night.length).toBeLessThan(sample.length);
        const kills = new Map();
        for (const g of night) for (const p of g.players) kills.set(pilotKey(p.name), (kills.get(pilotKey(p.name)) || 0) + netKills(p));
        const card = pageCard(`/fight-night/${day}`);
        expect(stat(card, 'Matches').value).toBe(String(night.length));
        expect(stat(card, 'Pilots').value).toBe(String(kills.size));
        expect(stat(card, 'Kills').value).toBe([...kills.values()].reduce((a, b) => a + b, 0).toLocaleString('en-US'));
        const most = Math.max(...kills.values());
        expect(stat(card, 'Most kills')).toEqual({ label: 'Most kills', value: recap.topFragger.name, note: `${most} kills` });
        expect(kills.get(pilotKey(recap.topFragger.name))).toBe(most);
        // /fight-night alone is the latest saved night's card
        expect(pageCard('/fight-night')).toEqual(card);
        expect(pageCard('/fight-night/2001-01-01')).toBeNull();
    });

    it('counts a map\'s matches, kills and top pilot from the fixture games', () => {
        const games = sample.filter(g => g.settings.level?.toLowerCase() === 'ascent');
        const byPilot = new Map();
        for (const g of games) for (const p of g.players) byPilot.set(p.name, (byPilot.get(p.name) || 0) + netKills(p));
        const card = pageCard('/maps/ascent');
        expect(card.title).toBe('ASCENT');
        expect(stat(card, 'Matches').value).toBe(String(games.length));
        expect(stat(card, 'Kills').value).toBe(String([...byPilot.values()].reduce((a, b) => a + b, 0)));
        // the fixtures sit 3 days back, inside the 30
        expect(stat(card, 'Last 30 days').value).toBe(String(games.length));
        const top = [...byPilot].sort((a, b) => b[1] - a[1])[0];
        expect(stat(card, 'Top pilot')).toEqual({ label: 'Top pilot', value: top[0], note: `${top[1]} kills` });
        expect(card).not.toHaveProperty('image');
        expect(pageCard('/maps/NO SUCH MAP')).toBeNull();
        expect(pageCard('/maps')).toBeNull();
    });

    it('has no card for the other pages, an unknown pilot or an unknown match', () => {
        for (const url of ['/', '/pilots', '/rankings', '/pilot/NOBODY', '/game/1', '/server/10.0.0.1']) expect(pageCard(url)).toBeNull();
        expect(pageCard('/game/72102').title).toBe('ASCENT');
    });
});

describe('renderCard', () => {
    it('draws a 1200 × 630 PNG once and answers the same bytes from the cache', async () => {
        const card = pageCard('/game/72102');
        const first = await cards.renderCard(card);
        expect(pngSize(first.png)).toEqual({ width: 1200, height: 630, signature: 'PNG' });
        expect(first.ms).toBeGreaterThan(0);
        const again = await cards.renderCard(structuredClone(card));
        expect(again).toEqual({ png: first.png, ms: 0 });
        expect(drawn.calls).toBe(1);
    });

    it('draws one card at a time and shares a draw already under way', async () => {
        const all = await Promise.all([
            cards.renderCard(pageCard('/game/72102')),
            cards.renderCard(pageCard('/game/72102')),
            cards.renderCard(pageCard('/game/72108')),
            cards.renderCard(pageCard('/pilot/WD-40')),
            cards.renderCard(pageCard(`/fight-night/${day}`))
        ]);
        expect(all[0]).toBe(all[1]);
        expect(drawn.calls).toBe(4);
        expect(drawn.most).toBe(1);
    });

    it('draws a new card when its numbers change', async () => {
        const card = pageCard('/game/72102');
        await cards.renderCard(card);
        await cards.renderCard({ ...card, stats: [...card.stats, { label: 'Extra', value: '1' }] });
        expect(drawn.calls).toBe(2);
    });

    it('keeps the CARD_LIMITS.cards cards used most recently', async () => {
        const card = i => stub(String(i));
        const size = cards.CARD_LIMITS.cards;
        for (let i = 0; i < size; i++) await cards.renderCard(card(i));
        await cards.renderCard(card(0)); // a hit makes the first card the newest
        expect(drawn.calls).toBe(size);
        await cards.renderCard(card(size)); // one more drops the oldest, card 1
        expect(drawn.calls).toBe(size + 1);
        await cards.renderCard(card(0));
        expect(drawn.calls).toBe(size + 1);
        await cards.renderCard(card(1));
        expect(drawn.calls).toBe(size + 2);
    }, 30000);

    it('keeps at most CARD_LIMITS.bytes of PNG, dropping the oldest', async () => {
        const bytes = cards.CARD_LIMITS.bytes;
        const first = await cards.renderCard(stub('first'));
        // room for two of these cards, not three
        cards.CARD_LIMITS.bytes = Math.round(first.png.length * 2.5);
        try {
            await cards.renderCard(stub('second'));
            await cards.renderCard(stub('third'));
            expect(drawn.calls).toBe(3);
            await cards.renderCard(stub('first')); // dropped for the third
            expect(drawn.calls).toBe(4);
            expect(cards.cachedCard(cardKey(stub('third')))).toBeDefined();
        } finally {
            cards.CARD_LIMITS.bytes = bytes;
        }
    });

    it('draws a map card with its cached image, and without one it cannot read', async () => {
        // a stock map with its image on disk: a PNG the render itself made
        db.seedStockMaps();
        const vault = db.getMapByName('Vault');
        const file = db.mapImagePath(vault);
        expect(pageCard('/maps/Vault')).not.toHaveProperty('image');
        fs.writeFileSync(file, (await cards.renderCard(pageCard('/game/72102'))).png);
        const card = pageCard('/maps/vault');
        expect(card.image).toEqual({ file, mtime: fs.statSync(file).mtimeMs });
        const withImage = await cards.renderCard(card);
        expect(pngSize(withImage.png).width).toBe(1200);
        // the same card drawn without the image is a different picture
        const without = await cards.renderCard({ ...card, image: { file: path.join(dataDir, 'missing.jpg'), mtime: 0 } });
        expect(without.png.equals(withImage.png)).toBe(false);
        // a file that is neither JPEG nor PNG is left out, not a failed card
        fs.writeFileSync(file, 'not an image');
        const junk = await cards.renderCard({ ...card, title: 'Vault ' });
        expect(pngSize(junk.png).width).toBe(1200);
        fs.rmSync(file);
    });

    it('turns away a card past its wait limit, without calling it failed; with none, every card waits', async () => {
        const card = i => stub(`busy ${i}`);
        const limit = cards.CARD_LIMITS.waiting;
        const jobs = Array.from({ length: limit + 3 }, (_, i) => cards.renderCard(card(i), { waitLimit: limit }));
        const settled = await Promise.allSettled(jobs);
        expect(settled.filter(r => r.status === 'fulfilled')).toHaveLength(limit);
        const busy = settled.filter(r => r.status === 'rejected');
        expect(busy).toHaveLength(3);
        expect(busy.every(r => r.reason instanceof cards.CardBusy)).toBe(true);
        expect(cards.cardFailed(cardKey(card(limit)))).toBe(false);
        // once the queue has drained the same card is drawn
        expect(pngSize((await cards.renderCard(card(limit), { waitLimit: limit })).png).width).toBe(1200);
        // the recap's draw has no limit
        const all = await Promise.allSettled(Array.from({ length: limit + 3 }, (_, i) => cards.renderCard(stub(`open ${i}`))));
        expect(all.every(r => r.status === 'fulfilled')).toBe(true);
    });

    it('draws Cyrillic, Greek and Vietnamese names, from Roboto Mono where Orbitron has no glyph', async () => {
        const blank = (await cards.renderCard(stub(''))).png;
        for (const title of ['Влад', 'Ξένος', 'Nguyễn']) {
            const { png } = await cards.renderCard(stub(title));
            expect(png.length).toBeGreaterThan(blank.length + 500);
        }
    });

    it('remembers a card that failed, rejects, and draws the next one', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        const bad = { ...pageCard('/game/72108'), line: 'THROW ME' };
        await expect(cards.renderCard(bad)).rejects.toThrow('satori failed');
        expect(cards.cardFailed(cardKey(bad))).toBe(true);
        expect(cards.cardFailed(cardKey(pageCard('/game/72108')))).toBe(false);
        expect(pngSize((await cards.renderCard(pageCard('/game/72108'))).png).width).toBe(1200);
    });
});

describe('og:image', () => {
    it('points the four pages at their card on the request\'s origin, with its size and alt text', () => {
        for (const url of ['/pilot/WD-40', '/game/72102', `/fight-night/${day}`, '/fight-night', '/maps/ascent']) {
            const card = pageCard(url);
            const html = withPageMeta(template, 'http://192.168.0.105:3000', url);
            expect(ogImage(url).startsWith(`${ORIGIN}/api/card/`)).toBe(true);
            expect(html).toContain(`<meta property="og:image" content="http://192.168.0.105:3000/api/card${card.path}?v=${cardKey(card)}" />`);
            expect(html).toContain('<meta property="og:image:width" content="1200" />');
            expect(html).toContain('<meta property="og:image:height" content="630" />');
            expect(html).toContain('<meta name="twitter:card" content="summary_large_image" />');
            // the alt text and og:description are the card's own sentence
            const description = html.match(/<meta property="og:description" content="([^"]*)" \/>/)[1];
            expect(html).toContain(`<meta property="og:image:alt" content="${description}" />`);
        }
        expect(ogImage('/maps/ascent')).toMatch(/\/api\/card\/maps\/ASCENT\?v=/);
    });

    it('gives the map page a description from its card', () => {
        const html = withPageMeta(template, ORIGIN, '/maps/ascent');
        expect(html).toContain(`<meta property="og:description" content="${pageCard('/maps/ascent').description}" />`);
        expect(pageCard('/maps/ascent').description).toMatch(/^ASCENT: \d+ match(es)?, \d+ kills?, top pilot .+\.$/);
    });

    it('is left out for pages without a card and for a card that failed', async () => {
        for (const url of ['/', '/pilots', '/rankings', '/pilot/NOBODY', '/maps', '/server/10.0.0.1']) {
            expect(withPageMeta(template, ORIGIN, url)).not.toMatch(/og:image|twitter:card/);
        }
        const card = pageCard('/game/72102');
        // make this card's draw fail, then load its page
        const failing = failNight();
        await expect(cards.renderCard(pageCard(`/fight-night/${day}`))).rejects.toThrow();
        const html = withPageMeta(template, ORIGIN, `/fight-night/${day}`);
        expect(html).not.toMatch(/og:image|twitter:card/);
        expect(html).toContain('<meta property="og:description" content="THROW ME: ');
        failing.mockRestore();
        expect(ogImage(`/fight-night/${day}`)).toBeDefined();
        expect(ogImage('/game/72102')).toBe(`${ORIGIN}/api/card/game/72102?v=${cardKey(card)}`);
    });
});

describe('GET /api/card/*', () => {
    it('answers a page\'s card as a PNG with its draw time', async () => {
        const res = await fetch(`${base}/api/card/pilot/WD-40?v=whatever`);
        expect(res.status).toBe(200);
        expect(res.headers.get('content-type')).toBe('image/png');
        expect(res.headers.get('cache-control')).toBe('public, max-age=600');
        expect(res.headers.get('server-timing')).toMatch(/^render;dur=[1-9]\d*$/);
        expect(pngSize(Buffer.from(await res.arrayBuffer()))).toEqual({ width: 1200, height: 630, signature: 'PNG' });
        const cached = await fetch(`${base}/api/card/pilot/WD-40`);
        expect(cached.headers.get('server-timing')).toBe('render;dur=0');
        // a cached card is sent by its ?v= with no database read
        const key = cardKey(pageCard('/pilot/WD-40'));
        const read = vi.spyOn(db, 'getPilotSummary');
        const byKey = await fetch(`${base}/api/card/pilot/WD-40?v=${key}`);
        expect([byKey.status, byKey.headers.get('server-timing')]).toEqual([200, 'render;dur=0']);
        expect(read).not.toHaveBeenCalled();
        // an old ?v= reads the page and answers its current card
        expect((await fetch(`${base}/api/card/pilot/WD-40?v=000000000000`)).status).toBe(200);
        expect(read).toHaveBeenCalledTimes(1);
        for (const url of [`/fight-night/${day}`, '/fight-night', '/fight-nights/' + day, '/game/72102', '/maps/ASCENT', '/pilot/zergling']) {
            expect((await fetch(`${base}/api/card${url}`)).status).toBe(200);
        }
    });

    it('answers 404 for a page without a card and 500 for a card that cannot be drawn', async () => {
        for (const url of ['', '/', '/pilots', '/pilot/NOBODY', '/game/1', '/game/abc', '/maps/NOPE', '/fight-night/2001-01-01', '/admin']) {
            const res = await fetch(`${base}/api/card${url}`);
            expect(res.status).toBe(404);
        }
        const failing = failNight();
        expect((await fetch(`${base}/api/card/fight-night/${day}`)).status).toBe(500);
        failing.mockImplementation(() => { throw new Error('database closed'); });
        const res = await fetch(`${base}/api/card/fight-night/${day}`);
        expect(res.status).toBe(500);
        expect(await res.json()).toEqual({ error: 'Failed to read the card' });
    });

    it('answers 503 past the wait limit for a card it would have to draw, and a cached one still', async () => {
        await fetch(`${base}/api/card/game/72102`);
        const waiting = cards.CARD_LIMITS.waiting;
        cards.CARD_LIMITS.waiting = 0;
        try {
            const busy = await fetch(`${base}/api/card/game/72108`);
            expect([busy.status, busy.headers.get('retry-after')]).toEqual([503, '5']);
            expect((await fetch(`${base}/api/card/game/72102`)).status).toBe(200);
        } finally {
            cards.CARD_LIMITS.waiting = waiting;
        }
        expect((await fetch(`${base}/api/card/game/72108`)).status).toBe(200);
    });
});
