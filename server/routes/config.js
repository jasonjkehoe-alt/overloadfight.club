import express from 'express';
import db from '../db.js';

// Public settings read from admin_settings. (/calendar-url, the Google
// Calendar iframe's URL, went with the iframe in S22.)
const router = express.Router();

// GET /api/config - Public configuration
router.get('/config', (req, res) => {
    try {
        const showColdStorage = db.getAdminSetting.get('show_cold_storage');
        res.json({
            show_cold_storage: showColdStorage ? showColdStorage.value === 'true' : false
        });
    } catch (error) {
        console.error('Error fetching config:', error);
        res.status(500).json({ error: 'Failed to fetch config' });
    }
});

export default router;
