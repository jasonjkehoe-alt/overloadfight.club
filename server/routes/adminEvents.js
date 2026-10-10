import express from 'express';
import db from '../db.js';
import { validateEvent } from '../lib/fightNightSchedule.js';
import { clearFeedCache } from './fightNights.js';

// The scheduled fight nights (S22), behind the admin session: admin-routes.js
// mounts this router after requireAuth.
const router = express.Router();

// GET /api/admin/events - every event as stored
router.get('/events', (req, res) => {
    try {
        res.json(db.listFightNightEvents());
    } catch (error) {
        console.error('Error listing the fight-night events:', error);
        res.status(500).json({ error: 'Failed to list the events' });
    }
});

// POST /api/admin/events - a new event, or the event with `id` changed;
// answers the row as stored, 400 with what is wrong, 404 for an unknown id
router.post('/events', (req, res) => {
    try {
        const { event, error } = validateEvent(req.body);
        if (error) return res.status(400).json({ error });
        const id = req.body?.id === undefined || req.body.id === null ? null : Number(req.body.id);
        if (id !== null && (!Number.isInteger(id) || !db.getFightNightEvent(id))) {
            return res.status(404).json({ error: 'No event with that id' });
        }
        const saved = db.saveFightNightEvent(id === null ? event : { ...event, id });
        clearFeedCache();
        res.json(saved);
    } catch (error) {
        console.error('Error saving a fight-night event:', error);
        res.status(500).json({ error: 'Failed to save the event' });
    }
});

// DELETE /api/admin/events/:id
router.delete('/events/:id', (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || db.deleteFightNightEvent(id) === 0) {
            return res.status(404).json({ error: 'No event with that id' });
        }
        clearFeedCache();
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting a fight-night event:', error);
        res.status(500).json({ error: 'Failed to delete the event' });
    }
});

export default router;
