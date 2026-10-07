<!-- Audit notes from the 2026-10-06 four-lens review at commit 10223be. Condensed subagent output; file:line refs are as of that commit. -->
# DATA LENS — key findings (from subagent)
## Storage
- Each game = one JSON blob in games(id,date,ip,details); hot DB (365d) + cold DB; UNION ALL. No player/kill/damage tables.
- Kill/damage logs exist mainly 2019-07..2022-04 (GitHub archive ingest). gamelist payload has empty kills/damage/events.
- Hydrate job is a no-op: getSummaryGames (db.js:554-564) filters on fields tracker never sends.
- Page-1 polling (60s) upserts details = excluded.details (db.js:1777-1782) → wipes hydrated detail for games still on page 1.
## Correctness bugs
1. Team wins read teamScore.RED; teams are BLUE/ORANGE → BLUE wins whenever it scored; ORANGE never wins (db.js:712,2047,2422). fightNightService handles RED ?? ORANGE correctly.
2. Monsterball scored by kills; >2 teams ignored.
3. Live-era durations fallback to timeLimit/900s (db.js:672-681, 2025-2034) → KPM/DPM/flight hours wrong. date − settings.start would be right.
4. Net-kill clamping inconsistent across caches. PilotsList K/D tooltip wrong ("Unassisted").
5. Zero deaths → KD = raw kills. 6. Suicides undercounted; getPilotStats hardcodes 0 (db.js:446).
7. Name matching: case-sensitive in cache (db.js:2061), case-insensitive in SQL (db.js:457); no alias table; LIKE wildcards (db.js:612,2375).
8. Hot/cold mixing on pilot card; first-seen reads hot only & caches permanently → veterans show as New Blood (db.js:2856-2879).
9. Play styles read p.damage which tracker lacks → everyone <5 deaths = Pacifist (statCalculators.ts:83). Fight-night streak falls back to hardcoded 3 (fightNightService.js:359-386).
10. Upset uses current all-time stats not pre-match. 11. Activity heatmap UTC but labeled LOCAL (ActivityGraph.tsx:8,60-66,108); fight nights are UTC days → US evenings split.
12. Hot→cold move not atomic → possible double count. 13. Self-damage inconsistent. 14. "Hits" counts rows. 15. Rival encounters include teammates. 16. Pilot games mode filter only last 200 (routes.js:880-897). 17. Hardcoded archive numbers ColdStorage.tsx:436,601. 18. connected/disconnected ignored.
- arsenal_entropy hardcoded 0 (db.js:2335). threat_centrality PageRank uses estimated edges not real kill log (db.js:2176-2179).
- Computed but never shown: mostActive, marathon, akdr, tce, monthly counts.
- Server browser proxied 15s cache, never persisted → no occupancy history.
## Unused data
- kill times, assisted field, goals/flagStats/teamChanges, CTF/MB player fields, connected/disconnected, ruleset settings (forceWeapon, powerups, respawn, turnSpeed), creator, server notes (region), map catalog vs stats.
## Top viz ideas (wow×feas)
1 Elo/Glicko + history (no logs needed) 2 weekday×hour local heatmap 3 match momentum chart 4 career arc + calendar 5 1v1 duel ladder/matrix 6 rivalry network (real kills) 7 damage chord/Sankey 8 weapon meta by map/year 9 pilot weapon mix vs community radar 10 clutch/first-blood profile 11 pilot×map specialist grid 12 retention cohorts 13 CTF/MB objective leaderboards 14 regional activity + BLUE vs ORANGE per map 15 match pace by ruleset.
- Not possible: kill positions, accuracy, ping, occupancy history (unless browser snapshots persisted).
## Unlock fixes: hydration filter+overwrite; BLUE/ORANGE; durations; name key.
