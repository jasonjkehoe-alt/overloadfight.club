import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';
import { REGIONS, regionLabel, regionOf, serverLocation } from './serverRegions.js';
import { regionPass } from './statsPasses.js';

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sample = JSON.parse(fs.readFileSync(path.join(repoRoot, 'gamelist_sample.json'), 'utf8')).games;
const detailSample = JSON.parse(fs.readFileSync(path.join(repoRoot, 'game_detail_sample.json'), 'utf8'));

describe('server regions', () => {
    it('names the region of every server in the sample games from its name and notes', () => {
        const byName = Object.fromEntries(sample.map(g => [g.server.name, regionOf(g.server.name, g.server.notes)]));
        expect(byName).toEqual({
            'Overloader: Dallas, TX': 'na-central',
            'Amsterdam 1': 'europe',
            'A-Garage-server': 'europe', // nothing in its notes; the name
            'Overloader: Amsterdam': 'europe',
            'San Francisco 1': 'na-west',
            'Overloader: San Jose, CA': 'na-west',
            'Sydney 1': 'oceania'
        });
    });

    it('reads the notes when the name says nothing, and calls the rest Unknown', () => {
        expect(regionOf('Descent Forum box', 'Real Dedi in Europe, Germany')).toBe('europe');
        expect(regionOf('US-MN-STEFFL Overload', '')).toBe('na-central');
        expect(regionOf('My Overload Server', 'Change these notes to give information about your server')).toBe('unknown');
        expect(regionOf(null, undefined)).toBe('unknown');
        expect(serverLocation('Mystery', '')).toEqual({ x: 38, y: 40, region: 'unknown' });
    });

    it('matches whole words, the name before the notes', () => {
        expect(regionOf('Any mode welcome', '')).toBe('unknown'); // not NY
        expect(regionOf('Overload NY 1', '')).toBe('na-east');
        expect(regionOf('My server', 'Comparison with the old box')).toBe('unknown'); // not PARIS
        expect(regionOf('Seattle 1', 'moved from Germany')).toBe('na-west');
        expect(regionOf('Overloader: Atlanta, GA', 'we beat Chicago')).toBe('na-east');
        expect(regionOf('A-Garage-server', '')).toBe('europe');
    });

    it('takes an IP\'s region from its latest named match, whatever order they are read in', () => {
        const pass = regionPass();
        const at = (date, name) => ({ ...sample[0], date, server: name ? { ...sample[0].server, name, notes: '' } : undefined });
        // hot storage is read first: the newer match (Dallas) comes before the older one (Amsterdam)
        for (const g of [at('2025-11-24T03:00:00Z', 'Overloader: Dallas, TX'), at('2019-07-03T04:00:00Z', 'Amsterdam 1'), at('2025-11-24T05:00:00Z', null)]) {
            pass.add({ id: 1, date: g.date, ip: g.ip }, g);
        }
        expect(pass.rows().find(r => r.month === '2025-11' && r.matches === 2)).toMatchObject({ region: 'na-central' });
    });

    it('labels every region and lists Unknown last', () => {
        expect(REGIONS.at(-1).id).toBe('unknown');
        expect(regionLabel('na-east')).toBe('North America East');
        expect(regionLabel('nowhere')).toBe('Unknown');
    });

    it('counts the sample games by region and month, by IP when a match has no server', () => {
        const pass = regionPass(new Map([[detailSample.ip, 'na-west'], [sample[0].ip, 'asia']]));
        // 72107 again without its server: Amsterdam 1's other matches name the IP, ahead of the listing
        const { server, ...bare } = sample.find(g => g.id === 72107);
        // and one Dallas match with the place-less notes of a fresh server
        const dallas = { ...sample[0], id: 1, server: { ...sample[0].server, name: 'My Overload Server', notes: '' } };
        for (const g of [...sample, detailSample, bare, dallas]) pass.add({ id: g.id, date: g.date, ip: g.ip }, g);
        pass.add({ id: 2, date: 'not a date', ip: null }, null);
        const rows = pass.rows().sort((a, b) => (a.region + a.month < b.region + b.month ? -1 : 1));
        // the samples were played on the evening of 2025-11-23 and the day after (Chicago time)
        expect(rows).toEqual([
            { region: 'europe', month: '2025-11', matches: 14 },
            { region: 'na-central', month: '2025-11', matches: 4 },
            { region: 'na-west', month: '2019-07', matches: 1 },
            { region: 'na-west', month: '2025-11', matches: 8 },
            { region: 'oceania', month: '2025-11', matches: 1 }
        ]);
        expect(rows.reduce((a, r) => a + r.matches, 0)).toBe(sample.length + 3);
    });
});
