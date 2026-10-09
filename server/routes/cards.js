import express from 'express';
import { pageCard } from '../pageMeta.js';
import { renderCard } from '../services/cardService.js';

// The share cards (S19): GET /api/card/<page path> answers the PNG a page's
// og:image points at, for the pages that have one (a pilot, a match, a fight
// night, a map). The ?v= the page adds is only for previews' own caches; the
// card drawn is always the page's current one.
const router = express.Router();

router.get('/card/*', async (req, res) => {
    let card;
    try {
        card = pageCard(req.path.slice('/card'.length));
    } catch (e) {
        console.error('[Card] Lookup failed:', e.message);
        return res.status(500).json({ error: 'Failed to read the card' });
    }
    if (!card) return res.status(404).json({ error: 'No card for this page' });
    try {
        const { png, ms } = await renderCard(card);
        res.set({ 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=600', 'Server-Timing': `render;dur=${ms}` });
        res.send(png);
    } catch {
        // renderCard has logged it
        res.status(500).json({ error: 'Failed to draw the card' });
    }
});

export default router;
