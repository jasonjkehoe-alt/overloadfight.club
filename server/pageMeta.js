// The <title> and share-preview tags (og:title, og:description, og:url) for a
// page URL. index.js fills them into index.html for every page it serves, so a
// link pasted into Discord previews the pilot, match or fight night it opens.
import db from './db.js';
import { parseRoute, pageTitle } from './lib/siteRoutes.js';
import { winnerOf, measuredDurationOf } from './lib/gameParse.js';
import { resultLine } from './lib/matchResult.js';

const SITE_DESCRIPTION = 'Live Overload servers, match results and pilot stats.';

const count = n => Number(n || 0).toLocaleString('en-US');
const clock = seconds => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

// "WD-40: 20 matches, 325 kills, last match 2026-10-07."
function pilotMeta(name) {
    const pilot = db.getPilotSummary(name);
    if (!pilot) return {};
    return { description: `${pilot.name}: ${count(pilot.games)} matches, ${count(pilot.kills)} kills, last match ${pilot.lastSeen.slice(0, 10)}.` };
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

function routeMeta({ view, param }) {
    switch (view) {
        case 'pilot': return pilotMeta(param);
        case 'game-detail': return matchMeta(param);
        case 'fight-night': return fightNightMeta(param);
        case 'live-game-detail': return { description: `Live Overload match. Join at ${param}.` };
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
    const route = parseRoute(url.split('?')[0]);
    let meta = {};
    try {
        meta = routeMeta(route);
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
