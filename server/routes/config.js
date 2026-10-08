import express from 'express';
import db from '../db.js';

// Public settings read from admin_settings.
const router = express.Router();

// Get Calendar URL
router.get('/calendar-url', (req, res) => {
    try {
        const setting = db.getAdminSetting.get('CALENDAR_EMBED_URL');
        res.json({ url: setting ? setting.value : null });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch calendar url' });
    }
});

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
