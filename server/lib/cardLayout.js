// The share cards' one layout (S19): a satori element tree for a card from
// shareCards.js, 1200 × 630, the size link previews show large. The colours,
// the radius and the small text size are the site's tokens (designTokens.js)
// drawn at SCALE times, so a card reads as the site enlarged.
import { borderRadius, chart, colors, fontSize } from '../../designTokens.js';
import { SITE_NAME } from './siteRoutes.js';

export const CARD_SIZE = { width: 1200, height: 630 };
// The layout's version, part of every card's key (shareCards.js cardKey):
// raised by one whenever the drawing changes, so each card gets a new ?v= and
// link previews fetch the new look instead of keeping the old one.
export const CARD_LAYOUT = 3;
// The fonts the tree names (cardService.js loads their files): Orbitron for
// titles and numbers, as the site's headings, Roboto Mono for the rest.
export const CARD_FONTS = { display: 'Orbitron', text: 'Roboto Mono' };

const SCALE = 2.5;
const px = rem => parseFloat(rem) * 16 * SCALE;
const SMALL = px(fontSize['2xs'][0]); // 25 px
const RADIUS = px(borderRadius.card); // 20 px

const el = (type, style, children) => ({ type, props: { style, children } });
// One line of text, cut with an ellipsis where it would overflow.
const oneLine = { overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' };

// Smaller type for longer text, so most names fit a tile (Orbitron's capitals
// are about 0.85 em wide); past 11 characters a value wraps onto a second
// line before the ellipsis. The sizes are for four tiles; with more (five on
// the pilot card with a belt or achievements, S21) each tile is narrower, so
// its type and padding scale by `fit`, four over the number of tiles.
const MAX_TILES = 5;
const titleSize = text => (text.length <= 12 ? 88 : text.length <= 20 ? 72 : text.length <= 27 ? 58 : 48);
const valueSize = text => (text.length <= 5 ? 46 : text.length <= 7 ? 34 : text.length <= 11 ? 26 : 22);
// Up to `lines` lines, cut with an ellipsis after the last.
const clamp = lines => ({ display: 'block', lineClamp: lines, overflow: 'hidden', wordBreak: 'break-word' });

function tile({ label, value, note }, fit) {
    return el('div', {
        display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, padding: `22px ${24 * fit}px`,
        background: colors.surface.card, border: `2px solid ${colors.line}`, borderRadius: RADIUS
    }, [
        el('div', { fontSize: SMALL * 0.9 * fit, color: chart.label, textTransform: 'uppercase', letterSpacing: 1, ...oneLine }, label),
        el('div', { fontFamily: CARD_FONTS.display, fontWeight: 700, fontSize: Math.round(valueSize(value) * fit), lineHeight: 1.15, color: colors.brand.DEFAULT, marginTop: 10, ...clamp(2) }, value),
        ...(note ? [el('div', { fontSize: SMALL * 0.8 * fit, lineHeight: 1.3, color: chart.text, marginTop: 8, ...clamp(3) }, note)] : [])
    ]);
}

// The card's tiles, at most MAX_TILES, sized for how many there are.
const tiles = stats => {
    const shown = stats.slice(0, MAX_TILES);
    return shown.map(stat => tile(stat, 4 / Math.max(4, shown.length)));
};

/**
 * The element tree satori draws for a card.
 * @param {import('./shareCards.js').Card} card
 * @param {string} [image] the card's image as a data: URL, drawn faint behind the text
 */
export function cardTree(card, image) {
    const { width, height } = CARD_SIZE;
    const backdrop = image ? [
        { type: 'img', props: { src: image, width, height, style: { position: 'absolute', top: 0, left: 0, width, height, objectFit: 'cover', opacity: 0.3 } } },
        el('div', { position: 'absolute', top: 0, left: 0, width, height, display: 'flex', backgroundImage: `linear-gradient(90deg, ${colors.surface.page} 35%, transparent)` }, [])
    ] : [];
    return el('div', {
        display: 'flex', flexDirection: 'column', position: 'relative', width, height,
        padding: '52px 64px 56px 76px', background: colors.surface.page,
        color: chart.ink, fontFamily: CARD_FONTS.text, fontWeight: 400
    }, [
        ...backdrop,
        el('div', { position: 'absolute', top: 0, left: 0, width: 12, height, display: 'flex', background: colors.brand.DEFAULT }, []),
        el('div', { display: 'flex', justifyContent: 'space-between', fontSize: SMALL, letterSpacing: 3, textTransform: 'uppercase' }, [
            el('div', { color: colors.brand.DEFAULT, fontWeight: 600, ...oneLine }, card.kind),
            el('div', { color: chart.label }, SITE_NAME)
        ]),
        el('div', { fontFamily: CARD_FONTS.display, fontWeight: 900, fontSize: titleSize(card.title), marginTop: 28, lineHeight: 1.1, ...oneLine }, card.title),
        el('div', { fontSize: 30, color: chart.text, marginTop: 20, lineHeight: 1.35, ...clamp(2) }, card.line),
        el('div', { display: 'flex', flexGrow: 1 }, []),
        el('div', { display: 'flex', gap: 20 }, tiles(card.stats))
    ]);
}
