// Fixture games for the DB tests, read from the two sample files at the repo root.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const readFixture = file => JSON.parse(fs.readFileSync(path.join(repoRoot, file), 'utf8'));
export const sample = readFixture('gamelist_sample.json').games;
export const detailSample = readFixture('game_detail_sample.json');

// The sample games were all played on 2025-11-24 (UTC). Move them to a recent
// day so saveGames files them in hot storage whatever today's date is.
export const day = new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10);
const shift = Date.parse(`${day}T00:00:00Z`) - Date.parse('2025-11-24T00:00:00Z');
const moved = iso => new Date(Date.parse(iso) + shift).toISOString();
export const onDay = game => ({ ...game, date: moved(game.date), settings: { ...game.settings, start: moved(game.settings.start) } });
