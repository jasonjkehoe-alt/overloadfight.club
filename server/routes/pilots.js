import express from 'express';
import db from '../db.js';
import cacheService from '../services/cacheService.js';
import { tapeMode } from '../lib/gameParse.js';

// /pilot/:name/*: one pilot's stats, weapons, PPI, rating, career, rivalry, tape, opponents, breakdown and match history.
const router = express.Router();

// GET /api/pilot/:name/stats - Detailed Pilot Stats
router.get('/pilot/:name/stats', async (req, res) => {
    try {
        const name = req.params.name;
        const mode = req.query.mode || null;
        let startDate = req.query.startDate || null;
        if (startDate === 'all') startDate = null;

        // Default to checking 365d first
        const isDefault365 = (!startDate && req.query.timeframe !== 'all');
        if (isDefault365) {
            const oneYearAgo = new Date();
            oneYearAgo.setDate(oneYearAgo.getDate() - 365);
            startDate = oneYearAgo.toISOString();
        }

        const cacheKey = `pilot_telemetry_${name.toLowerCase()}_${isDefault365 ? '365d' : (startDate ? startDate.slice(0, 10) : 'all')}_${mode ? mode.toLowerCase() : 'all'}`;
        const cached = await cacheService.get(cacheKey);
        if (cached) return res.json(cached);

        let stats = db.getPilotDetailedStats.get({ name, startDate, mode });

        // If pilot has no games in the 365d window, fallback to all-time record
        let allTimeFallback = false;
        if ((!stats || !stats.games) && startDate) {
            stats = db.getPilotDetailedStats.get({ name, startDate: null, mode });
            allTimeFallback = true;
        }

        if (stats) {
            if ((req.query.timeframe === 'all' || !startDate) && (!mode || mode.toLowerCase() === 'all')) {
                if (stats.career_games) {
                    stats.games = stats.career_games;
                    stats.kills = stats.career_kills ?? stats.kills;
                    stats.deaths = stats.career_deaths ?? stats.deaths;
                    stats.assists = stats.career_assists ?? stats.assists;
                    stats.suicides = stats.career_suicides ?? stats.suicides;
                    stats.wins = stats.career_wins ?? stats.wins;
                    stats.losses = stats.career_losses ?? stats.losses;
                    stats.ties = stats.career_ties ?? stats.ties;
                    stats.win_rate = stats.career_win_rate ?? stats.win_rate;
                    stats.pure_kd = stats.career_kd ?? stats.pure_kd;
                    stats.kda = stats.career_kda ?? stats.kda;
                    stats.flight_hours = stats.career_flight_hours ?? stats.flight_hours;
                }
            }
            stats.scope = isDefault365 && !allTimeFallback ? 'recent' : 'all';
            await cacheService.set(cacheKey, stats, 300);
        }

        res.json(stats);
    } catch (e) {
        console.error("Pilot Stats Error:", e);
        res.status(500).json({ error: "Failed to fetch pilot stats" });
    }
});

// GET /api/pilot/:name/weapons - Pilot Weapon Mastery Breakdown
router.get('/pilot/:name/weapons', async (req, res) => {
    try {
        const name = req.params.name;
        const cacheKey = `pilot_weapons_${name.toLowerCase()}`;
        const cached = await cacheService.get(cacheKey);
        if (cached) return res.json(cached);

        const telemetry = db.getPilotTelemetry(name);
        if (!telemetry) return res.status(404).json({ error: "Pilot not found" });

        const result = {
            weapons: telemetry.weapons || [],
            summary: telemetry.weapon_summary || {}
        };
        await cacheService.set(cacheKey, result, 300);
        res.json(result);
    } catch (e) {
        console.error("Pilot Weapons Error:", e);
        res.status(500).json({ error: "Failed to fetch weapon stats" });
    }
});

// GET /api/pilot/:name/ppi - Pilot Performance Intelligence
router.get('/pilot/:name/ppi', async (req, res) => {
    try {
        const name = req.params.name;
        // A miss stays a miss until the scheduled refresh (maintenance.js) rebuilds
        // the cache; rebuilding it here let any visitor block the server.
        const stats = db.getPilotPPI(name);
        res.json(stats || {});
    } catch (e) {
        console.error("PPI API Error:", e);
        res.status(500).json({ error: "Failed to fetch PPI stats" });
    }
});

// GET /api/pilot/:name/rating - Glicko-2 rating, rank and daily history (S13)
router.get('/pilot/:name/rating', (req, res) => {
    try {
        res.json(db.getPilotRating(req.params.name));
    } catch (e) {
        console.error("Pilot Rating Error:", e);
        res.status(500).json({ error: "Failed to fetch pilot rating" });
    }
});

// GET /api/pilot/:name/career - Career months, activity calendar and last time out (S14)
router.get('/pilot/:name/career', async (req, res) => {
    try {
        const cacheKey = `pilot_career_${req.params.name.toLowerCase()}`;
        const cached = await cacheService.get(cacheKey);
        if (cached) return res.json(cached);
        const career = db.getPilotCareer(req.params.name);
        // not before pilot_months' first build, when every pilot reads as unplayed
        if (db.hasPilotMonths()) await cacheService.set(cacheKey, career, 300);
        res.json(career);
    } catch (e) {
        console.error("Pilot Career Error:", e);
        res.status(500).json({ error: "Failed to fetch pilot career" });
    }
});

// GET /api/pilot/:name/rivalry - the pilot's opponents from the kill and damage
// logs and their clutch counts beside everyone's (S17), from pilot_rivals and
// pilot_clutch; a pilot with no logged ranked match gets empty lists, not a
// 404. No route cache, as for the weapon mix.
router.get('/pilot/:name/rivalry', (req, res) => {
    try {
        res.json(db.getPilotRivalry(req.params.name));
    } catch (e) {
        console.error("Pilot Rivalry Error:", e);
        res.status(500).json({ error: "Failed to fetch pilot rivalry" });
    }
});

// GET /api/pilot/:name/tape/:opponent?mode= - the Tale of the Tape (S20): the
// two pilots' career numbers and their head-to-head from the first's side,
// from pilot_bouts and pilot_duels. `{ missing: [names] }` for a pilot with no
// stored match and `{ same: name }` for one pilot twice, answered 200 like an
// unknown server's history (S15), so the page's own states log no error. No
// route cache, as for the rivalry.
router.get('/pilot/:name/tape/:opponent', (req, res) => {
    try {
        res.json(db.getTape(req.params.name, req.params.opponent, tapeMode(req.query.mode)));
    } catch (e) {
        console.error("Pilot Tape Error:", e);
        res.status(500).json({ error: "Failed to fetch the tape" });
    }
});

// GET /api/pilot/:name/opponents - the opponents the pilot met in the most
// rated matches (S20), from pilot_bouts, for the pilot page's links to the
// tape; a pilot with none gets an empty list.
router.get('/pilot/:name/opponents', (req, res) => {
    try {
        res.json(db.getPilotOpponents(req.params.name));
    } catch (e) {
        console.error("Pilot Opponents Error:", e);
        res.status(500).json({ error: "Failed to fetch pilot opponents" });
    }
});

// GET /api/pilot/:name/weapon-mix - the pilot's logged kills per weapon family
// beside the community's (S16), from pilot_weapons and map_weapons; a pilot
// with no logged kill gets zeros, not a 404. No route cache: the tables change
// only when a refresh writes them.
router.get('/pilot/:name/weapon-mix', (req, res) => {
    try {
        res.json(db.getPilotWeaponMix(req.params.name));
    } catch (e) {
        console.error("Pilot Weapon Mix Error:", e);
        res.status(500).json({ error: "Failed to fetch pilot weapon mix" });
    }
});

// GET /api/pilot/:name/breakdown - Pilot Map Combat & Rivals Breakdown
router.get('/pilot/:name/breakdown', async (req, res) => {
    try {
        const name = req.params.name;
        const cacheKey = `pilot_breakdown_${name.toLowerCase()}`;
        const cached = await cacheService.get(cacheKey);
        if (cached) return res.json(cached);

        const breakdown = db.getPilotBreakdown(name);
        if (breakdown) {
            await cacheService.set(cacheKey, breakdown, 300);
        }
        res.json(breakdown);
    } catch (e) {
        console.error("Pilot Breakdown Error:", e);
        res.status(500).json({ error: "Failed to fetch pilot breakdown" });
    }
});

// GET /api/pilot/:name/games - Pilot Match History
router.get('/pilot/:name/games', async (req, res) => {
    try {
        const name = req.params.name;
        const page = parseInt(req.query.page) || 1;
        const mode = req.query.mode || null;
        const limit = 25;
        const offset = (page - 1) * limit;

        let startDate = req.query.startDate || null;
        if (startDate === 'all') startDate = null;

        let filterDate = startDate;
        if (!filterDate && req.query.timeframe !== 'all') {
            const oneYearAgo = new Date();
            oneYearAgo.setDate(oneYearAgo.getDate() - 365);
            filterDate = oneYearAgo.toISOString();
        }

        const isModeFiltered = Boolean(mode && mode.toLowerCase() !== 'all');
        const fetchLimit = isModeFiltered ? 200 : limit;
        const fetchOffset = isModeFiltered ? 0 : offset;

        let countResult = db.countGamesByPilot.get({ name, startDate: filterDate });
        let games = db.getGamesByPilot.all({ name, startDate: filterDate, limit: fetchLimit, offset: fetchOffset }).map(row => JSON.parse(row.details));

        // If 0 games in 365d window, fallback to all-time match history
        if ((!games || games.length === 0) && filterDate) {
            countResult = db.countGamesByPilot.get({ name, startDate: null });
            games = db.getGamesByPilot.all({ name, startDate: null, limit: fetchLimit, offset: fetchOffset }).map(row => JSON.parse(row.details));
        }

        if (isModeFiltered) {
            const normMode = mode.toUpperCase().replace(/[\s_]+/g, '');
            games = games.filter(g => (g.settings?.matchMode || '').toUpperCase().replace(/[\s_]+/g, '') === normMode);
            const totalCount = games.length;
            games = games.slice(offset, offset + limit);
            countResult = { count: totalCount };
        }

        res.json({
            count: countResult ? countResult.count : 0,
            games: games
        });
    } catch (e) {
        console.error("Pilot Games Error:", e);
        res.status(500).json({ error: "Failed to fetch pilot match history" });
    }
});

export default router;
