// Share-card PNGs (S19): a card from shareCards.js drawn by satori (element
// tree to SVG, the text as paths) and resvg (SVG to PNG). Rendered when a card
// URL is first asked for, one at a time, and kept in memory keyed by the
// card's hash (cardKey), so a card whose words and numbers have not changed is
// never drawn twice and one whose numbers moved gets a new key. resvg's
// renderAsync runs on libuv's thread pool; satori's part runs here and takes a
// few milliseconds. A card that fails is remembered, so its page leaves
// og:image out instead of pointing at a broken image.
import fs from 'fs';
import { createRequire } from 'module';
import satori from 'satori';
import { renderAsync } from '@resvg/resvg-js';
import { CARD_FONTS, CARD_SIZE, cardTree } from '../lib/cardLayout.js';
import { cardKey } from '../lib/shareCards.js';

const require = createRequire(import.meta.url);

// The cards kept, newest use last; a 1200 × 630 card is about 30 to 250 KB.
export const CARD_CACHE_SIZE = 200;
// The most draws waiting at once. Past it a card is not queued (CardBusy): a
// crawler asking for thousands of cards cannot hold a preview's fetch behind
// all of them.
export const CARD_QUEUE_LIMIT = 20;
export class CardBusy extends Error {}

const cache = new Map();
const failed = new Map();
const pending = new Map();
let queue = Promise.resolve();
let fonts = null;

// The Fontsource files the layout's two families need. Orbitron has latin
// only. For a glyph a font lacks, satori tries the other fonts in the list,
// but only those under another name, so each extra Roboto Mono script is
// named apart ("Roboto Mono cyrillic"): a name in Cyrillic, Greek or
// Vietnamese draws in Roboto Mono. CJK and emoji have no font here.
const ROBOTO_SUBSETS = ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext', 'greek', 'vietnamese'];
const FONT_FILES = [
    [CARD_FONTS.display, 700, '@fontsource/orbitron/files/orbitron-latin-700-normal.woff'],
    [CARD_FONTS.display, 900, '@fontsource/orbitron/files/orbitron-latin-900-normal.woff'],
    ...ROBOTO_SUBSETS.flatMap(subset => [400, 600].map(weight => [
        subset === 'latin' ? CARD_FONTS.text : `${CARD_FONTS.text} ${subset}`, weight,
        `@fontsource/roboto-mono/files/roboto-mono-${subset}-${weight}-normal.woff`
    ]))
];

const loadFonts = async () => fonts ??= await Promise.all(FONT_FILES.map(async ([name, weight, file]) =>
    ({ name, weight, style: 'normal', data: await fs.promises.readFile(require.resolve(file)) })));

// The card's image file as a data: URL, or nothing when it cannot be read or
// is not a JPEG or PNG (the image route saves whatever the map site sent).
async function imageData(image) {
    if (!image) return undefined;
    try {
        const bytes = await fs.promises.readFile(image.file);
        const type = bytes[0] === 0xff && bytes[1] === 0xd8 ? 'jpeg' : bytes.subarray(1, 4).toString() === 'PNG' ? 'png' : null;
        return type ? `data:image/${type};base64,${bytes.toString('base64')}` : undefined;
    } catch {
        return undefined;
    }
}

async function draw(card) {
    const started = performance.now();
    const svg = await satori(cardTree(card, await imageData(card.image)), { ...CARD_SIZE, fonts: await loadFonts() });
    // satori draws text as paths, so resvg needs no fonts of its own
    const png = (await renderAsync(svg, { font: { loadSystemFonts: false }, fitTo: { mode: 'width', value: CARD_SIZE.width } })).asPng();
    return { png, ms: Math.round(performance.now() - started) };
}

// Keep `key` last in `map`, dropping the oldest past CARD_CACHE_SIZE.
function remember(map, key, entry) {
    map.delete(key);
    map.set(key, entry);
    if (map.size > CARD_CACHE_SIZE) map.delete(map.keys().next().value);
}

/**
 * The card's PNG and how long it took to draw (0 when it came from the cache).
 * Rejects when the card cannot be drawn (cardFailed then says so), or with
 * CardBusy when CARD_QUEUE_LIMIT draws are already waiting.
 * @param {import('../lib/shareCards.js').Card} card
 * @returns {Promise<{ png: Buffer, ms: number }>}
 */
export function renderCard(card) {
    const key = cardKey(card);
    const hit = cache.get(key);
    if (hit) {
        remember(cache, key, hit);
        return Promise.resolve({ png: hit, ms: 0 });
    }
    if (pending.has(key)) return pending.get(key);
    if (pending.size >= CARD_QUEUE_LIMIT) return Promise.reject(new CardBusy(`${CARD_QUEUE_LIMIT} cards are already waiting`));
    const job = queue.then(() => draw(card)).then(result => {
        remember(cache, key, result.png);
        failed.delete(key);
        console.log(`[Card] ${card.path} drawn in ${result.ms} ms`);
        return result;
    }, error => {
        remember(failed, key, true);
        console.error(`[Card] ${card.path} could not be drawn:`, error.message);
        throw error;
    }).finally(() => pending.delete(key));
    pending.set(key, job);
    // the next render waits for this one, whatever its outcome
    queue = job.catch(() => {});
    return job;
}

// Whether the card with this key (cardKey) failed to draw, so its page should
// leave og:image out.
export const cardFailed = key => failed.has(key);

// Empty the cache and the failures (tests).
export function clearCards() {
    cache.clear();
    failed.clear();
}
