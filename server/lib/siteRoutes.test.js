import { describe, expect, it } from 'vitest';
import { parseRoute, urlFor, pageTitle, navSection } from './siteRoutes.js';

describe('parseRoute and urlFor', () => {
    it('read back every page URL they write', () => {
        const routes = [
            { view: 'dashboard' },
            { view: 'history' },
            { view: 'maps' },
            { view: 'maps', param: 'Sub Rosa V4' },
            { view: 'fight-night' },
            { view: 'fight-night', param: '2026-10-07' },
            { view: 'pilot', param: 'LORD JOHN WARFIN' },
            { view: 'pilot', param: 'a/b?c#d%' },
            { view: 'pilot-manager' },
            { view: 'game-detail', param: 72102 },
            { view: 'live-game-detail', param: '143.110.230.67' },
            { view: 'pilots' },
            { view: 'rankings' },
            { view: 'cold-storage' },
            { view: 'taunts' },
            { view: 'olmod' },
            { view: 'resources' },
            { view: 'admin' }
        ];
        for (const route of routes) {
            const parsed = parseRoute(urlFor(route.view, route.param));
            expect(parsed.view).toBe(route.view);
            expect(parsed.param).toBe(route.param);
        }
    });

    it('keep the old paths and send a bad match id to the history', () => {
        expect(parseRoute('/fight-nights/2026-10-07')).toEqual({ view: 'fight-night', param: '2026-10-07' });
        expect(parseRoute('/cold-storage')).toEqual({ view: 'cold-storage' });
        expect(parseRoute('/tools')).toEqual({ view: 'taunts' });
        expect(parseRoute('/game/abc')).toEqual({ view: 'history' });
        expect(parseRoute('/nowhere')).toEqual({ view: 'dashboard' });
        expect(parseRoute('/game')).toEqual({ view: 'dashboard' });
        expect(urlFor('game-detail')).toBe('/history');
        expect(urlFor('pilot')).toBe('/pilot');
        expect(urlFor('live-game-detail')).toBe('/');
        expect(parseRoute('/pilot/%E0%A4%A')).toEqual({ view: 'pilot', param: '%E0%A4%A' });
    });
});

describe('pageTitle', () => {
    it('names the page first and the site last', () => {
        expect(pageTitle({ view: 'dashboard' })).toBe('Live | overloadfight.club');
        expect(pageTitle({ view: 'pilots' })).toBe('Leaderboards | overloadfight.club');
        expect(pageTitle({ view: 'rankings' })).toBe('Power rankings | overloadfight.club');
        expect(pageTitle({ view: 'pilot', param: 'WD-40' })).toBe('WD-40 | overloadfight.club');
        expect(pageTitle({ view: 'game-detail', param: 72102 })).toBe('Match 72102 | overloadfight.club');
        expect(pageTitle({ view: 'game-detail', param: 72102 }, 'ASCENT')).toBe('Match 72102: ASCENT | overloadfight.club');
        expect(pageTitle({ view: 'fight-night', param: '2026-10-07' })).toBe('Fight Night 2026-10-07 | overloadfight.club');
        expect(pageTitle({ view: 'maps', param: 'Vault' })).toBe('Vault map | overloadfight.club');
        expect(pageTitle({ view: 'live-game-detail', param: '1.2.3.4' })).toBe('Live: 1.2.3.4 | overloadfight.club');
        expect(pageTitle({ view: 'live-game-detail', param: '1.2.3.4' }, 'San Francisco 1')).toBe('Live: San Francisco 1 | overloadfight.club');
    });
});

describe('navSection', () => {
    it('lights Leaderboards on the power rankings, and a page\'s own item otherwise', () => {
        expect(navSection('rankings')).toBe('pilots');
        expect(navSection('pilots')).toBe('pilots');
        expect(navSection('maps')).toBe('maps');
    });
});
