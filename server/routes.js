import express from 'express';
import games from './routes/games.js';
import stats from './routes/stats.js';
import browser from './routes/browser.js';
import maps from './routes/maps.js';
import config from './routes/config.js';
import analysis from './routes/analysis.js';
import pilots from './routes/pilots.js';
import fightNights from './routes/fightNights.js';
import cards from './routes/cards.js';

// The public /api routes, mounted by index.js: one router per resource in
// server/routes/. Each router keeps its full paths and no two of them match the
// same URL, so the order below never decides which handler answers.
const router = express.Router();
for (const resource of [games, stats, browser, maps, config, analysis, pilots, fightNights, cards]) {
    router.use(resource);
}

export default router;
