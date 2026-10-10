// The <title> and share-preview tags (og:title, og:description, og:url and,
// for a page with a share card, og:image) for a page URL. index.js fills them
// into index.html for every page it serves, so a link pasted into Discord
// previews the pilot, match, fight night, map, tape or belts it opens.
import fs from 'fs';
import db from './db.js';
import { parseRoute, pageTitle } from './lib/siteRoutes.js';
import { SERVER_WINDOW_DEFAULT, tapeMode } from './lib/gameParse.js';
import { regionLabel } from './lib/serverRegions.js';
import { count, percent } from './lib/matchResult.js';
import { beltsCard, cardKey, cardUrl, fightNightCard, mapCard, matchCard, pilotCard, tapeCard } from './lib/shareCards.js';
import { CARD_SIZE } from './lib/cardLayout.js';
import { cardFailed } from './services/cardService.js';

const SITE_DESCRIPTION = 'Live Overload servers, match results and pilot stats.';

// The pilot, match, fight-night, map, tape and belts pages describe themselves with
// their share card's own sentence (shareCards.js), so the preview's text and its
// image read the same numbers.
const withCard = (card, extra = {}) => (card ? { ...extra, card, description: card.description } : {});

// "WD-40: 20 matches, 325 kills, last match 2026-10-07." (a fight-night day)
function pilotMeta(name) {
    const summary = db.getPilotSummary(name);
    if (!summary) return {};
    return withCard(pilotCard(summary, db.getPilotRating(summary.name), db.getPilotPPI(summary.name), db.getPilotAchievements(summary.name)));
}

// "BLUE wins 42–35. TEAM ANARCHY on Vault, 15:10." The name is the map, for the title.
function matchMeta(id) {
    const row = db.getGameById.get(id);
    if (!row) return {};
    const game = JSON.parse(row.details);
    return withCard(matchCard(id, game), { name: game.settings?.level });
}

// The card for the date, or the latest card on /fight-night.
function fightNightMeta(date) {
    return withCard(fightNightCard(date ? db.getFightNightRecapByDate(date) : db.getFightNightRecaps(1)[0]));
}

// "BLIZZARD by Revival Productions: 40 matches, 1,200 kills, top pilot WD-40."
// The image is drawn on the card when the image route has cached it on disk;
// its time is part of the card, so a replaced image makes a new card.
function mapMeta(name) {
    const intel = db.getMapIntel(name);
    if (!intel) return {};
    const map = intel.id ? db.getMapById(intel.id) : null;
    const file = map && db.mapImagePath(map);
    // undefined until the image route has downloaded it
    const stat = file && fs.statSync(file, { throwIfNoEntry: false });
    return withCard(mapCard(intel, stat ? { file, mtime: stat.mtimeMs } : null));
}

// "WD-40 vs OKSTER: OKSTER leads 5–3, 1 tie, in 9 ranked matches." Nothing
// for an unknown pilot or one pilot twice (the page says why).
function tapeMeta(a, b, mode) {
    const tape = db.getTape(a, b, tapeMode(mode));
    return tape.pilots ? withCard(tapeCard(tape)) : {};
}

// "Power rankings for 2026-10-08: 1. WD-40 (1612), 2. OKSTER (1580), 3. RAZOR (1555)."
function rankingsMeta() {
    const { day, pilots } = db.getPowerRankings();
    if (pilots.length === 0) return {};
    const top = pilots.slice(0, 3).map(p => `${p.rank}. ${p.name} (${Math.round(p.rating)})`).join(', ');
    return { description: `Power rankings for ${day}: ${top}.` };
}

// "Duel ladder for 2026-10-08: 1. WD-40 (1612), 2. OKSTER (1580), 3. RAZOR (1555)."
// (listed pilots only; nothing while none is listed, nor for an objective board)
function laddersMeta(board) {
    if (board && board !== 'duels') return {};
    const { day, listed, pilots } = db.getDuelLadder();
    if (listed === 0) return {};
    // the listed pilots come first
    const top = pilots.slice(0, Math.min(3, listed)).map(p => `${p.rank}. ${p.name} (${Math.round(p.rating)})`).join(', ');
    return { description: `Duel ladder for ${day}: ${top}.` };
}

// "Rivalries from the kill log: FUTZPIMMEL 41-21 BADASS (3 matches), ..." for the
// three pairs with the most kills exchanged (each read from the leader's side).
// "Champions: Anarchy WD-40 (since 2026-10-06, 3 defenses), ..." (S21);
// nothing while no mode has a champion.
const beltsMeta = () => withCard(beltsCard(db.getBelts()));

function rivalsMeta() {
    const { pairs } = db.getRivalNetwork();
    if (pairs.length === 0) return {};
    const top = pairs.slice(0, 3).map(p => `${p.name} ${p.kills}-${p.deaths} ${p.opponent_name} (${count(p.matches)} ${p.matches === 1 ? 'match' : 'matches'})`).join(', ');
    return { description: `Rivalries from the kill log: ${top}.` };
}

// "Overloader: Dallas, TX (North America Central): online 99.0% of the minutes
// checked in the last 30 days, a match running 12.0% of that time, 6.5 pilots
// in a match on average. Join at 192.227.193.172." The parts with no ticks
// behind them are left out; "minutes checked" because a server stored for two
// days has two days of ticks, not 30.
function serverMeta(ip) {
    const s = db.getServerSummary(ip, SERVER_WINDOW_DEFAULT);
    if (!s.firstSeen) return {};
    const parts = [
        s.uptime !== null && `online ${percent(s.uptime, 1)} of the minutes checked in the last ${s.days} days`,
        s.inUse !== null && `a match running ${percent(s.inUse, 1)} of that time`,
        s.avgPilots !== null && `${s.avgPilots.toFixed(1)} pilots in a match on average`
    ].filter(Boolean);
    const name = s.name || ip;
    return { name: s.name, description: `${name} (${regionLabel(s.region)})${parts.length ? `: ${parts.join(', ')}` : ''}. Join at ${ip}.` };
}

function routeMeta({ view, param, other }, query) {
    switch (view) {
        case 'pilot': return pilotMeta(param);
        case 'tape': return tapeMeta(param, other, query.get('mode'));
        case 'game-detail': return matchMeta(param);
        case 'fight-night': return fightNightMeta(param);
        case 'maps': return param ? mapMeta(param) : {};
        case 'rankings': return rankingsMeta();
        case 'ladders': return laddersMeta(query.get('board'));
        case 'rivals': return rivalsMeta();
        case 'belts': return beltsMeta();
        case 'live-game-detail': return { name: db.getServerListing(param)?.name, description: `Live Overload match. Join at ${param}.` };
        case 'server': return serverMeta(param);
        default: return {};
    }
}

const escapeHtml = text => String(text).replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);

// The views with a share card.
const CARD_VIEWS = new Set(['pilot', 'game-detail', 'fight-night', 'maps', 'tape', 'belts']);

/**
 * The share card of the page at `pathname` with `query` (a tape's ?mode=), or
 * null for a page without one (server/routes/cards.js). Throws when the
 * lookup does.
 * @param {string} pathname
 * @param {URLSearchParams} [query]
 */
export function pageCard(pathname, query = new URLSearchParams()) {
    const route = parseRoute(pathname);
    return CARD_VIEWS.has(route.view) ? routeMeta(route, query).card ?? null : null;
}

/**
 * index.html with the page's title and share tags in place of its <title>.
 * @param {string} html the built index.html
 * @param {string} origin "https://overloadfight.club"
 * @param {string} url the request's path and query
 */
export function withPageMeta(html, origin, url) {
    const [pathname, search] = url.split('?');
    const route = parseRoute(pathname);
    let meta = {};
    try {
        meta = routeMeta(route, new URLSearchParams(search));
    } catch (e) {
        // a bad row or a closed database must not stop the page from loading
        console.error('[PageMeta] Falling back to the site description:', e.message);
    }
    const title = escapeHtml(pageTitle(route, meta.name));
    const tags = [
        `<title>${title}</title>`,
        `<meta property="og:title" content="${title}" />`,
        `<meta property="og:description" content="${escapeHtml(meta.description || SITE_DESCRIPTION)}" />`,
        `<meta property="og:url" content="${escapeHtml(origin + url)}" />`
    ];
    // a card that failed to draw is left out rather than shown broken
    const key = meta.card && cardKey(meta.card);
    if (key && !cardFailed(key)) {
        tags.push(
            `<meta property="og:image" content="${escapeHtml(origin + cardUrl(meta.card, key))}" />`,
            `<meta property="og:image:width" content="${CARD_SIZE.width}" />`,
            `<meta property="og:image:height" content="${CARD_SIZE.height}" />`,
            `<meta property="og:image:alt" content="${escapeHtml(meta.card.description)}" />`,
            '<meta name="twitter:card" content="summary_large_image" />'
        );
    }
    // a function, so a "$" in a pilot name is not read as a replacement pattern
    return html.replace(/<title>[\s\S]*?<\/title>/, () => tags.join('\n    '));
}
