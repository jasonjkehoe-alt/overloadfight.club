import express from 'express';
import { pageCard } from '../pageMeta.js';
import { CARD_LIMITS, CardBusy, cachedCard, renderCard } from '../services/cardService.js';

// The share cards (S19): GET /api/card/<page path> answers the PNG a page's
// og:image points at, for the pages that have one (a pilot, a match, a fight
// night, a map, a tape). The ?v= the page adds is the card's key: a card cached under
// it is sent with no database read; otherwise the page's current card is
// drawn, whatever the ?v= said.
const router = express.Router();

const sendPng = (res, png, ms) => {
    res.set({ 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=600', 'Server-Timing': `render;dur=${ms}` });
    res.send(png);
};

router.get('/card/*', async (req, res) => {
    const hit = typeof req.query.v === 'string' && cachedCard(req.query.v);
    if (hit) return sendPng(res, hit, 0);
    let card;
    try {
        // the page's query as withPageMeta reads it (a tape's ?mode=)
        card = pageCard(req.path.slice('/card'.length), new URLSearchParams(req.url.split('?')[1]));
    } catch (e) {
        console.error('[Card] Lookup failed:', e.message);
        return res.status(500).json({ error: 'Failed to read the card' });
    }
    if (!card) return res.status(404).json({ error: 'No card for this page' });
    try {
        const { png, ms } = await renderCard(card, { waitLimit: CARD_LIMITS.waiting });
        sendPng(res, png, ms);
    } catch (e) {
        if (e instanceof CardBusy) return res.status(503).set('Retry-After', '5').json({ error: 'Too many cards waiting, try again shortly' });
        // renderCard has logged it
        res.status(500).json({ error: 'Failed to draw the card' });
    }
});

export default router;
