import express from 'express';
import db from '../db.js';
import fightNightService from '../services/fightNightService.js';
import { requireAuth } from '../auth.js';

// Fight-night recaps and the admin's detector run.
const router = express.Router();

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
