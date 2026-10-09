// The <title> and share-preview tags (og:title, og:description, og:url) for a
// page URL. index.js fills them into index.html for every page it serves, so a
// link pasted into Discord previews the pilot, match or fight night it opens.
import db from './db.js';
import { parseRoute, pageTitle } from './lib/siteRoutes.js';
import { SERVER_WINDOW_DEFAULT, fightNightDay, winnerOf, measuredDurationOf } from './lib/gameParse.js';
import { regionLabel } from './lib/serverRegions.js';
import { clock, percent, resultLine } from './lib/matchResult.js';

const SITE_DESCRIPTION = 'Live Overload servers, match results and pilot stats.';

const count = n => Number(n || 0).toLocaleString('en-US');

// "WD-40: 20 matches, 325 kills, last match 2026-10-07." (a fight-night day)
function pilotMeta(name) {
    const pilot = db.getPilotSummary(name);
    if (!pilot) return {};
    return { description: `${pilot.name}: ${count(pilot.games)} matches, ${count(pilot.kills)} kills, last match ${fightNightDay(pilot.lastSeen)}.` };
}

// "BLUE wins 42–35. TEAM ANARCHY on Vault, 15:10." The name is the map, for the title.
function matchMeta(id) {
    const row = db.getGameById.get(id);
    if (!row) return {};
    const game = JSON.parse(row.details);
    const { matchMode, level } = game.settings || {};
    const seconds = measuredDurationOf(game);
    const where = [matchMode, level && `on ${level}`].filter(Boolean).join(' ');
    const detail = where ? `${where}${seconds ? `, ${clock(seconds)}` : ''}.` : '';
    return { name: level, description: [resultLine(winnerOf(game)), detail].filter(Boolean).join(' ') };
}

// The card for the date, or the latest card on /fight-night.
function fightNightMeta(date) {
    const recap = date ? db.getFightNightRecapByDate(date) : db.getFightNightRecaps(1)[0];
    if (!recap) return {};
    const top = recap.topFragger?.name ? `, most kills ${recap.topFragger.name} (${count(recap.topFragger.kills)})` : '';
    return { description: `${recap.formattedDate}: ${count(recap.totalMatches)} matches, ${count(recap.totalPilots)} pilots${top}.` };
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

function routeMeta({ view, param }, query) {
    switch (view) {
        case 'pilot': return pilotMeta(param);
        case 'game-detail': return matchMeta(param);
        case 'fight-night': return fightNightMeta(param);
        case 'rankings': return rankingsMeta();
        case 'ladders': return laddersMeta(query.get('board'));
        case 'rivals': return rivalsMeta();
        case 'live-game-detail': return { name: db.getServerListing(param)?.name, description: `Live Overload match. Join at ${param}.` };
        case 'server': return serverMeta(param);
        default: return {};
    }
}

const escapeHtml = text => String(text).replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);

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
    ].join('\n    ');
    // a function, so a "$" in a pilot name is not read as a replacement pattern
    return html.replace(/<title>[\s\S]*?<\/title>/, () => tags);
}
