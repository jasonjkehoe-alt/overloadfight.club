import express from 'express';
import axios from 'axios';
import cacheService from '../services/cacheService.js';

// The live server browser, proxied from the tracker.
const router = express.Router();

// GET /api/browser - Proxy for live server browser with 15s caching
router.get('/browser', async (req, res) => {
    try {
        const cacheKey = 'browser_servers';
        const cached = await cacheService.get(cacheKey);
        if (cached) {
            return res.json(cached);
        }

        const response = await axios.get('https://tracker.otl.gg/api/browser', { timeout: 5000 });
        if (response.data) {
            await cacheService.set(cacheKey, response.data, 15); // 15-second TTL
        }
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching browser servers:', error.message);
        res.status(500).json({ error: 'Failed to fetch browser servers' });
    }
});

export default router;
