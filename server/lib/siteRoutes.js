// The site's page URLs and titles. App.tsx routes with these and
// server/pageMeta.js builds share previews with them, so a link, the tab
// title and the og:title always agree.

export const SITE_NAME = 'overloadfight.club';

// Page title per view; detail views add a name below.
const VIEW_TITLES = {
    dashboard: 'Live',
    history: 'Match history',
    maps: 'Maps',
    olmod: 'OLMod',
    taunts: 'Taunts',
    'pilot-manager': 'Pilot settings',
    'fight-night': 'Fight Night',
    resources: 'Resources',
    'cold-storage': 'Archive',
    admin: 'Admin',
    pilots: 'Leaderboards',
    'game-detail': 'Match',
    'live-game-detail': 'Live'
};

const decode = part => {
    try {
        return decodeURIComponent(part);
    } catch {
        return part;
    }
};

/**
 * The view and its parameter for a URL path.
 * @param {string} pathname
 * @returns {{ view: string, param?: string | number }}
 */
export function parseRoute(pathname) {
    const [first, second] = String(pathname).split('/').filter(Boolean);
    const param = second ? decode(second) : undefined;
    switch (first) {
        case undefined:
        case 'dashboard': return { view: 'dashboard' };
        case 'history': return { view: 'history' };
        case 'maps': return { view: 'maps', param };
        case 'olmod': return { view: 'olmod' };
        case 'tools':
        case 'taunts': return { view: 'taunts' };
        case 'fight-night':
        case 'fight-nights': return { view: 'fight-night', param };
        case 'resources': return { view: 'resources' };
        case 'cold-storage':
        case 'archive': return { view: 'cold-storage' };
        case 'admin': return { view: 'admin' };
        case 'pilots': return { view: 'pilots' };
        case 'pilot': return param ? { view: 'pilot', param } : { view: 'pilot-manager' };
        case 'game': {
            const id = parseInt(second, 10);
            return isNaN(id) ? { view: 'history' } : { view: 'game-detail', param: id };
        }
        case 'live': return param ? { view: 'live-game-detail', param } : { view: 'dashboard' };
        default: return { view: 'dashboard' };
    }
}

/**
 * The URL path of a view.
 * @param {string} view
 * @param {string | number} [param]
 * @returns {string}
 */
export function urlFor(view, param) {
    const part = param === undefined || param === null || param === '' ? '' : `/${encodeURIComponent(String(param))}`;
    switch (view) {
        case 'dashboard': return '/';
        case 'history': return '/history';
        case 'maps': return `/maps${part}`;
        case 'olmod': return '/olmod';
        case 'tools':
        case 'taunts': return '/taunts';
        case 'pilot-manager': return '/pilot';
        case 'fight-night': return `/fight-night${part}`;
        case 'resources': return '/resources';
        case 'cold-storage': return '/archive';
        case 'admin': return '/admin';
        case 'pilots': return '/pilots';
        case 'pilot': return `/pilot${part}`;
        case 'game-detail': return part ? `/game${part}` : '/history';
        case 'live-game-detail': return part ? `/live${part}` : '/';
        default: return '/';
    }
}

/**
 * "<page> | overloadfight.club". `name` is what the page shows that the URL
 * may not: a match's map, a live server's name.
 * @param {{ view: string, param?: string | number }} route
 * @param {string} [name]
 * @returns {string}
 */
export function pageTitle({ view, param }, name) {
    let page = VIEW_TITLES[view] || '';
    if (view === 'pilot') page = String(param);
    else if (view === 'maps' && param) page = `${param} map`;
    else if (view === 'fight-night' && param) page = `Fight Night ${param}`;
    else if (view === 'game-detail') page = `Match ${param}${name ? `: ${name}` : ''}`;
    else if (view === 'live-game-detail') page = `Live: ${name || param}`;
    return page ? `${page} | ${SITE_NAME}` : SITE_NAME;
}
