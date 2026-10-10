import express from 'express';
import db from '../db.js';
import fightNightService from '../services/fightNightService.js';
import { requireAuth } from '../auth.js';
import { FEED_PATH, occurrences, scheduleWindow } from '../lib/fightNightSchedule.js';
import { icsFeed } from '../lib/fightNightFeed.js';

// Fight-night recaps, the admin's detector run, and the schedule (S22): the
// coming nights and the .ics feed.
const router = express.Router();

// The coming nights: every occurrence of the stored events from now to the
// horizon, one under way included.
const comingNights = now => occurrences(db.listFightNightEvents(), ...scheduleWindow(now));

// How many saved recaps the feed carries as past events, and how long a
// built feed is kept: calendar apps poll it about hourly and each build
// reads every recap's day, so the last feed built is kept for FEED_CACHE_MS
// as long as the events and the recaps it was built from have not changed
// (their versions: counts and latest writes). One origin at a time: the
// feed's links carry the request's origin, as og:url does.
const FEED_CACHE_MS = 10 * 60 * 1000;
let feed = null;

/**
 * GET /fight-nights.ics (and under /api): the coming nights and every saved
 * recap as a calendar anyone can subscribe to. Mounted at the root by
 * index.js too, so the subscription link needs no /api/.
 */
export function fightNightFeed(req, res) {
    try {
        const origin = `${req.protocol}://${req.get('host')}`;
        const now = Date.now();
        const version = `${origin} ${db.fightNightEventsVersion()} ${db.fightNightRecapsVersion()}`;
        if (!feed || feed.version !== version || feed.until <= now) {
            const recaps = db.getAllFightNightRecaps().map(recap => ({ recap, span: db.getDaySpan(recap.date) }));
            feed = { version, body: icsFeed({ origin, occurrences: comingNights(now), recaps }), until: now + FEED_CACHE_MS };
        }
        res.type('text/calendar; charset=utf-8');
        res.setHeader('Content-Disposition', 'inline; filename="fight-nights.ics"');
        res.setHeader('Cache-Control', `public, max-age=${FEED_CACHE_MS / 1000}`);
        res.send(feed.body);
    } catch (error) {
        console.error('Error building the fight-night feed:', error);
        res.status(500).type('text/plain').send('The feed could not be built.');
    }
}
router.get(FEED_PATH, fightNightFeed);

// GET /api/fight-nights/schedule - the coming nights for the dashboard
// (before /fight-nights/:date, which would read "schedule" as a date)
router.get('/fight-nights/schedule', (req, res) => {
    try {
        res.json(comingNights(Date.now()));
    } catch (error) {
        console.error('Error reading the fight-night schedule:', error);
        res.status(500).json({ error: 'Failed to read the schedule' });
    }
});

// GET /api/fight-nights - List Fight Night Recaps
router.get('/fight-nights', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        let recaps = db.getFightNightRecaps(limit);
        if (!recaps || recaps.length === 0) {
            await fightNightService.initializeFightNights();
            recaps = db.getFightNightRecaps(limit);
        }
        res.json({
            count: recaps.length,
            recaps: recaps
        });
    } catch (error) {
        console.error('Error fetching fight nights:', error);
        res.status(500).json({ error: 'Failed to fetch fight nights' });
    }
});

// GET /api/fight-nights/:date - Specific Fight Night Recap
router.get('/fight-nights/:date', async (req, res) => {
    const { date } = req.params;
    try {
        let recap = db.getFightNightRecapByDate(date);
        if (!recap) {
            recap = await fightNightService.generateRecapForDate(date);
        }
        if (!recap) {
            return res.status(404).json({ error: `No fight night recap available for ${date}` });
        }
        res.json(recap);
    } catch (error) {
        console.error(`Error fetching fight night for ${date}:`, error);
        res.status(500).json({ error: 'Failed to fetch fight night recap' });
    }
});

// POST /api/fight-nights/check - Trigger big night detector check manually
router.post('/fight-nights/check', requireAuth, async (req, res) => {
    try {
        await fightNightService.checkAndGenerateRecentFightNight();
        res.json({ success: true, message: 'Fight night detector check executed' });
    } catch (error) {
        console.error('Error running fight night check:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
