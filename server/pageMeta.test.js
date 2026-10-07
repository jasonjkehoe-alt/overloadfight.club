import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { day, onDay, sample, veteranSoup } from './testFixtures.js';
import { netKills } from './lib/gameParse.js';

const template = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'index.html'), 'utf8');
const origin = 'https://overloadfight.club';

let dataDir;
let db;
let withPageMeta;
let recap;

beforeAll(async () => {
    dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ofc-meta-'));
    process.env.DATA_DIR = dataDir;
    db = (await import('./db.js')).default;
    ({ withPageMeta } = await import('./pageMeta.js'));
    const { generateRecapForDate } = await import('./services/fightNightService.js');
    db.saveGames([...sample.map(g => onDay(structuredClone(g))), veteranSoup]);
    await db.refreshPilotStats(); // the recap reads pilot_stats_cache
    recap = await generateRecapForDate(day, true);
});

afterAll(async () => {
    await db.close();
    fs.rmSync(dataDir, { recursive: true, force: true });
});

// The tags withPageMeta wrote, by name.
const tagsFor = url => {
    const html = withPageMeta(template, origin, url);
    const meta = name => html.match(new RegExp(`<meta property="og:${name}" content="([^"]*)" />`))?.[1];
    return { html, title: html.match(/<title>([^<]*)<\/title>/)?.[1], ogTitle: meta('title'), description: meta('description'), url: meta('url') };
};

describe('withPageMeta', () => {
    it('describes a match by its result, mode, map and measured length', () => {
        const tags = tagsFor('/game/72102');
        expect(tags.title).toBe('Match 72102: ASCENT | overloadfight.club');
        expect(tags.ogTitle).toBe(tags.title);
        expect(tags.description).toBe('BLUE wins 42–35. TEAM ANARCHY on ASCENT, 15:10.');
        expect(tags.url).toBe('https://overloadfight.club/game/72102');
        expect(tagsFor('/game/72108').description).toBe('ZERGLING wins on 48, 17 ahead of RAPTOR. ANARCHY on SUB ROSA V4, 15:10.');
    });

    it('describes a pilot from game_players in hot and cold storage, whatever the case in the URL', () => {
        const zergling = sample.flatMap(g => g.players).filter(p => p.name === 'ZERGLING');
        const kills = zergling.reduce((sum, p) => sum + netKills(p), 0);
        const tags = tagsFor('/pilot/zergling');
        expect(tags.title).toBe('zergling | overloadfight.club');
        expect(tags.description).toBe(`ZERGLING: ${zergling.length} matches, ${kills} kills, last match ${day}.`);
        // Soup's 2019 game sits in cold storage; the name is the spelling from the latest game
        const soup = [...sample.flatMap(g => g.players), ...veteranSoup.players].filter(p => p.name.toLowerCase() === 'soup');
        const soupKills = soup.reduce((sum, p) => sum + netKills(p), 0);
        expect(tagsFor('/pilot/Soup').description).toBe(`SOUP: ${soup.length} matches, ${soupKills} kills, last match ${day}.`);
        expect(tagsFor('/pilot/NOBODY').description).toBe('Live Overload servers, match results and pilot stats.');
    });

    it('describes a fight night from its saved card, and the latest card on /fight-night', () => {
        const expected = `${recap.formattedDate}: ${recap.totalMatches} matches, ${recap.totalPilots} pilots, top fragger ${recap.topFragger.name} (${recap.topFragger.kills}).`;
        const tags = tagsFor(`/fight-night/${day}`);
        expect(tags.title).toBe(`Fight Night ${day} | overloadfight.club`);
        expect(tags.description).toBe(expected);
        expect(tagsFor('/fight-night').description).toBe(expected);
        expect(tagsFor('/fight-night/2001-01-01').description).toBe('Live Overload servers, match results and pilot stats.');
    });

    it('keeps the query string in og:url and leaves the rest of the page alone', () => {
        const tags = tagsFor('/pilots?tab=online&min=10');
        expect(tags.url).toBe('https://overloadfight.club/pilots?tab=online&#38;min=10');
        expect(tags.title).toBe('Leaderboards | overloadfight.club');
        expect(tags.html).toContain('<div id="root"></div>');
        expect(tags.html.match(/<title>/g)).toHaveLength(1);
    });

    it('escapes names from the URL', () => {
        const tags = tagsFor('/pilot/%3Cscript%3E%22%24%26');
        expect(tags.title).toBe('&#60;script&#62;&#34;$&#38; | overloadfight.club');
        expect(tags.html).not.toContain('<script>');
    });
});
