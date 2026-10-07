// The site's page URLs and titles. App.tsx routes with these and
// server/pageMeta.js builds share previews with them, so a link, the tab
// title and the og:title always agree.

export const SITE_NAME = 'overloadfight.club';

// One row per view: its path, older paths that still open it, and the title of
// the page without a parameter. A row with `param` takes /path/:param.
const ROUTES = [
    { view: 'dashboard', path: '/', aliases: ['/dashboard'], title: 'Live' },
    { view: 'history', path: '/history', title: 'Match history' },
    { view: 'maps', path: '/maps', param: true, title: 'Maps' },
    { view: 'olmod', path: '/olmod', title: 'OLMod' },
    { view: 'taunts', path: '/taunts', aliases: ['/tools'], title: 'Taunts' },
    { view: 'fight-night', path: '/fight-night', aliases: ['/fight-nights'], param: true, title: 'Fight Night' },
    { view: 'resources', path: '/resources', title: 'Resources' },
    { view: 'cold-storage', path: '/archive', aliases: ['/cold-storage'], title: 'Archive' },
    { view: 'admin', path: '/admin', title: 'Admin' },
    { view: 'pilots', path: '/pilots', title: 'Leaderboards' },
    { view: 'pilot-manager', path: '/pilot', title: 'Pilot settings' },
    // detail pages: always a parameter; without one they fall back to `bare`
    { view: 'pilot', path: '/pilot', param: true, bare: 'pilot-manager' },
    { view: 'game-detail', path: '/game', param: true, bare: 'history' },
    { view: 'live-game-detail', path: '/live', param: true, bare: 'dashboard' }
];
const byView = new Map(ROUTES.map(r => [r.view, r]));

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
    const base = first ? `/${first}` : '/';
    // a detail row first, so /pilot/:name is the pilot and /pilot alone the settings page
    const route = (second && ROUTES.find(r => r.bare && r.path === base))
        || ROUTES.find(r => !r.bare && (r.path === base || r.aliases?.includes(base)));
    if (!route) return { view: 'dashboard' };
    if (route.view === 'game-detail') {
        const id = parseInt(second, 10);
        return isNaN(id) ? { view: 'history' } : { view: route.view, param: id };
    }
    return route.param && second ? { view: route.view, param: decode(second) } : { view: route.view };
}

/**
 * The URL path of a view.
 * @param {string} view
 * @param {string | number} [param]
 * @returns {string}
 */
export function urlFor(view, param) {
    const route = byView.get(view) || ROUTES[0];
    const hasParam = route.param && param !== undefined && param !== null && param !== '';
    if (route.bare && !hasParam) return urlFor(route.bare);
    return hasParam ? `${route.path}/${encodeURIComponent(String(param))}` : route.path;
}

/**
 * "<page> | overloadfight.club". `name` is what the page shows that the URL
 * may not: a match's map, a live server's name.
 * @param {{ view: string, param?: string | number }} route
 * @param {string} [name]
 * @returns {string}
 */
export function pageTitle({ view, param }, name) {
    let page = byView.get(view)?.title || '';
    if (view === 'pilot') page = String(param);
    else if (view === 'maps' && param) page = `${param} map`;
    else if (view === 'fight-night' && param) page = `Fight Night ${param}`;
    else if (view === 'game-detail') page = `Match ${param}${name ? `: ${name}` : ''}`;
    else if (view === 'live-game-detail') page = `Live: ${name || param}`;
    return page ? `${page} | ${SITE_NAME}` : SITE_NAME;
}
