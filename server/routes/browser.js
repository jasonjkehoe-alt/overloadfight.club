import express from 'express';
import db from '../db.js';
import { fetchServerBrowser } from '../services/serverSnapshots.js';
import { SERVER_WINDOWS, SERVER_WINDOW_DEFAULT } from '../lib/gameParse.js';

// The live server browser, proxied from the tracker, and each server's stored history.
const router = express.Router();

// GET /api/browser - Proxy for live server browser with 15s caching
router.get('/browser', async (req, res) => {
    try {
        res.json(await fetchServerBrowser());
    } catch (error) {
        console.error('Error fetching browser servers:', error.message);
        res.status(500).json({ error: 'Failed to fetch browser servers' });
    }
});

// GET /api/server/:ip/history?days= - a server's stored ticks (S15): uptime,
// use, pilots and peak hours over the last `days` fight-night days (7, 30, 90
// or 365; anything else is 30), and its last 24 hours. A server never stored
// answers with a null firstSeen.
router.get('/server/:ip/history', (req, res) => {
    try {
        const asked = Number(req.query.days);
        const days = SERVER_WINDOWS.includes(asked) ? asked : SERVER_WINDOW_DEFAULT;
        res.json(db.getServerHistory(req.params.ip, days));
    } catch (error) {
        console.error('Error reading server history:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;
