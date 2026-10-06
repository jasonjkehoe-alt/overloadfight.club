<!-- Audit notes from the 2026-10-06 four-lens review at commit 10223be. Condensed subagent output; file:line refs are as of that commit. -->
# Overload Fight Club: feature completeness and community audit

Repo: liberating-lupin-13ed9872 @ 10223be. Read-only audit. Line refs are file:line at that commit.

## Fix before building anything (found during the audit)

- **Plaintext NAS SSH password committed to git.** It is in `scripts/analyze_fight_nights.py:6` and five other scripts (`update_reverse_proxy.py`, `evaluate_thresholds.py`, `inspect_game_sample.py`, `docker_build_synology.py`, `inspect_ds1515b.py`). Rotate the password and scrub the history.
- **Default admin password.** `ADMIN_PASSWORD=admin123` is set in `docker-compose.yml` and `docker-compose.prod.yml`, `server/auth.js:38` falls back to the "admin123" hash, and the session secret has a default value (`auth.js:10`).
- **AI Match Analysis is broken today.** It is pinned to `gemini-2.0-flash` (`server/routes.js:723`), and Google shut that model down on 2026-06-01. The endpoint also has no auth (`routes.js:672`), so anyone can spend the key. `vite.config.ts:23-24` puts `GEMINI_API_KEY` into the client bundle if the key is set at build time.
- **The Upcoming Events calendar never renders in production.** The CSP has `default-src 'self'` and no `frame-src` (`server/index.js:71-74`), and COEP `require-corp` applies too (`index.js:70`). The Google Calendar embed returns `cross-origin-resource-policy: same-site` (checked with curl), so `CalendarWidget.tsx:23` is blocked twice over.

---

## A. Feature inventory

### Live tracking
- **Upstream:** tracker.otl.gg is the only data source.
  - Game list poll: `server/ingest.js:5,29`. It polls page 1 every 60 s (`ingest.js:89-96`).
  - Single game: `routes.js:241`. Server browser: `routes.js:294`, with a 15 s cache.
  - Live game detail scrapes the tracker's HTML for `GameJs.game = new Game(...)` (`server/services/scraperService.js:3,26`). This is fragile and breaks if roncli changes the markup.
- **Backfill and history:** paged backfill jobs (`server/backfill.js:4`). Monthly logs 2019-07 to 2022-04 come from the GitHub `tracker-log-archive` (`server/services/archiveIngestService.js:4-13`; that repo's last push was 2022-05-22). An admin can also scan a local HTML archive (`admin-routes.js:261`, `local-ingest.js`).
- **Storage:** a hot DB (365 days) plus `cold_storage.db`. Games older than that move nightly (`maintenance.js:7`).
- **What a user sees:**
  - The dashboard server browser has sorting, idle toggle, star favorites and a copy-IP button (`components/GameList.tsx:294-460`, copy at `:32-37`).
  - Live match cards poll every 30 s (`LiveMatchCard.tsx:76`) and show "Join at <ip>" with a copy button (`:85-87,131`).
  - The live game detail page has a scoreboard and polls every 30 s (`LiveGameDetail.tsx:57`). `MatchTimer` shows elapsed time.
  - The Pilots page has an **Online** tab built from active games (`PilotsList.tsx:34,42-71`), so in-game presence already exists.
- **Joining:** copy-IP only. There is no `steam://` or `olmod://` link anywhere. The olmod README documents no URL protocol or connect flag (checked; see B).
- **Half-built:** server favorites are `useState` only and reset on reload (`GameList.tsx:28,98-107`). They are not saved to localStorage.

### Fight Night
- **Detection:** fully automatic, with no scheduling. A day qualifies with ≥16 matches AND (≥14 pilots OR ≥1600 frags) (`server/services/fightNightService.js:3-7`).
  - Runs 10 s after startup, then nightly at 03:00 server-local time (TZ=America/Chicago in compose) (`maintenance.js:32-70`). It checks yesterday and the day before (`fightNightService.js:216-268`).
  - On first boot it backfills the 10 most recent qualifying days (`:273-295`, `db.js:2882`).
- **Recap card:** headline bout, biggest upset (uses the PageRank threat score), blowout, closest finish, hottest arena, new blood (`pilot_first_seen`, `db.js:65,2856`) and longest streak (`FightNightRecapCard.tsx:128-336`).
  - Routes: `/fight-night/:date` (`App.tsx:33`), `GET /api/fight-nights[/:date]` (`routes.js:924,943`).
  - The section is embedded on the dashboard (`App.tsx:308`) but missing from the top nav (`Layout.tsx`).
- **Bug: days are UTC calendar days.** The query is `date LIKE 'YYYY-MM-DD%'` (`db.js:2841-2846`).
  - A US evening session that starts before 7 pm CDT (00:00 UTC) gets split across two recaps.
  - Sessions after that are filed under the next day's date, so the header says "Sunday" for a Saturday-night fight.
- **Gaps:** `POST /api/fight-nights/check` has no auth (`routes.js:961`). There is no scheduling, RSVP, reminders, iCal, notifications or share image.
- **Calendar:** only an admin-set Google Calendar iframe URL (`routes.js:648`, `AdminPanel.tsx:656-669`), and it is blocked by the CSP (see top).
- `scripts/analyze_fight_nights.py` is a one-off SSH script used to tune the thresholds (it contains the leaked credential).

### Pilots
- **Roster:** `PilotsList.tsx` has search, sort, min-games tiers (`:360-363`), "Top Gun / Most Active / Slayer" call-outs (`:161-163`) and the Online tab.
- **Pilot page (`PilotDetail.tsx`):**
  - Mode filter (`:186`), career vs recent scope (`:358`), PPI panel (`:371`, `PilotPerformanceCard.tsx`).
  - Weapon breakdown (`:374`), rivals with the **Tale of the Tape** card (`:498-624`, data from `db.js:2373-2525`), map performance (`:687`), match history (`:731`).
  - API: `/api/pilot/:name/{stats,weapons,ppi,breakdown,games}` (`routes.js:747-861`).
- **PPI:** ACI, Lethality, Dominance Index, "Threat Tier" and Finisher Rate (`PilotPerformanceCard.tsx`).
  - Threat Tier is PageRank power iteration over the kill graph (`db.js:2229`). It is refreshed every 6 h and overwritten in place (`maintenance.js:73`, `db.js:1945`).
- **Half-built or missing:**
  - The README advertises "ELO Ratings" (`README.md:9`), but there is no ELO in the code.
  - `arsenal_entropy` is hard-coded to 0 (`db.js:2335`).
  - Tale of the Tape only compares you against your own top rivals. There is no "any A vs any B" view and no permalink.
  - Pilot stats have no history, so nothing can show rank movement.
  - There are no accounts, pilot claiming, following, favorites, aliases or alias merging (stats are keyed on raw name, `db.js:2365`).
  - There are no badges, achievements or tiers beyond the Threat Tier number.

### Maps
- **Catalog sync:** from overloadmaps.com `data/all.json` (552 entries; url/size/mtime/levels only). Authors are scraped from the homepage's `var missions` (`server/services/mapSyncService.js:9-53,103-190`). 12 stock maps are seeded with omdb.net thumbnails (`db.js:1260-1392`).
- **When it syncs:** only when the table holds ≤12 maps, or when an admin clicks sync (`mapSyncService.js:198-210`, `admin-routes.js:319`). New uploads do not appear on their own.
- **Map Library (`MapLibrary.tsx`):** KPI row, search by name/author, sort including "most downloaded" (`:334`), top pilot per map (`:511-524`), an intel modal (`:560+`, `/api/maps/:id/intel` at `routes.js:441`) and a download button (`:540-547`).
- **Downloads:** proxied and cached zip with a download counter (`routes.js:544`). Images are proxied through `/api/maps/:id/image`.
- **Telemetry:** `map_stats_cache` holds matches, kills, average players, modes, top pilots and record match (`db.js:142-160`). It is rebuilt with the pilot refresh (`db.js:2348`).
- **Missing:** ratings, comments, a "being played right now" badge, author pages, map of the week, links back to the overloadmaps page, and installing a map into the local folder. Installing matters less because olmod already auto-downloads maps.

### Local PC integration (the main differentiator)
- **How it works:** the browser File System Access API. The site stores a `FileSystemDirectoryHandle` for `AppData\LocalLow\Revival\Overload` in IndexedDB (`utils/overloadFsBridge.ts:11-150`) and re-requests readwrite permission (`:87`). It works in Chromium browsers only (`isFileSystemAccessSupported`, `:30`).
- **Pilot management** (`utils/pilotSettingsBridge.ts`, UI in `PilotManager.tsx` and `PilotSettingsPanel.tsx`):
  - Lists pilots from `*.extendedconfig`.
  - Clones, renames (with rollback) and deletes across the 6-file family `.xconfig/.xprefs/.xprefsmod/.xscores/.extendedconfig/.xconfigmod` (`:577-825`).
  - Backs up all pilots to a timestamped ZIP in `Pilot Backup/` (`:589`).
  - Reads and sets campaign XP (`:828-870`).
- **Settings editor tabs:** autoselect, controls, audio, graphics, olmod and raw (`PilotSettingsPanel.tsx:58`).
  - Keybind capture maps browser events to Unity KeyCodes (`pilotSettingsBridge.ts:43-200`).
  - Weapon autoselect priority parses and serializes `.extendedconfig` (`:1000,1134`).
  - `.xprefs/.xconfig` round-trip byte-identically (`:207-410`).
  - Every write makes a timestamped backup and checks that Overload isn't running (`:455-570`).
- **Overload-running check (half-wired):** it asks `/api/overload/status` on the server first (`pilotSettingsBridge.ts:413-430`). In production that is the NAS, so the answer is always "not running". Only the fallback, an `output_log.txt` modified in the last 15 s, really protects the user.
- **Taunts:**
  - `OverloadVault.tsx` scans `AudioTaunts/` and `AudioTaunts/external/` (taunts downloaded from opponents). It parses MD5-prefixed filenames and Vorbis TITLE tags (`overloadFsBridge.ts:213-300`).
  - `LoadoutManager.tsx` fills six slots (F1-F6) and applies them to a pilot. That writes `.extendedconfig`, makes a mandatory backup into `Pilot Backup/` plus a `.bak`, and copies equipped opponent taunts out of `external/` so they stick (`overloadFsBridge.ts:310-400`).
- **Server-side bridge (dead in production):** `server/bridge-routes.js:120-352` and `services/overloadBridge.js` hard-code a Windows path (`overloadBridge.js:20-30`). They ignore the `OVERLOAD_PATH` env var that `SYNOLOGY_GUIDE.md` documents, and they have no auth. On the Linux container they do nothing, so they only help when the server runs on the player's own PC.

### Audio taunt maker
- **Layout:** `AudioTauntMaker.tsx` has four tabs: Editor, Vault, Loadout and Manual.
- **Editor (`AudioEditor.tsx`):** waveform cut/audition, duration, drag-drop, and export to mono Vorbis `.ogg` under 128 kB with optional install-to-game (`:536`). Export history is kept in IndexedDB (`utils/audioHistoryDb.ts`, `:676-731`). FFmpeg runs as WASM in the browser.
- **Import (`WebImportModal.tsx:42`):**
  - YouTube search and URL rip via yt-dlp on the server (`bridge-routes.js:440-505`, `audioImportService.js`). `python` exists in the Alpine image (checked).
  - archive.org search with sfx/vintage categories (`:520-560`), video file extraction, and direct URL. The proxy has a host allowlist plus private-IP SSRF blocking (`bridge-routes.js:34-115`).
- **Other:** a microphone recorder (`VoiceRecorderModal.tsx`) and a written guide (`AudioManual.tsx`).
- **Missing:** no shared community taunt library. Everything stays on the user's machine.

### Outbound links
- **`OlmodInfo.tsx`:**
  - Download button is pinned to the v0.5.14 tag (`:26`). That matches the latest release (2025-10-19) but is hard-coded.
  - Discord link goes to `discord.com/invite/6dof` (`:137`).
  - The footer GitHub link is `github.com/olmod/olmod` (`:143`), which is not the `overload-development-community` org repo.
- **`Resources.tsx:10-38`:** overloadmaps.com, omdb.net, the Level Editor source, olmod.overloadmaps.com, olmod source, OCT, the taunts wiki, otl.gg, tracker.otl.gg, Steam and GOG.

### Admin (`AdminPanel.tsx`, `server/admin-routes.js`, behind a session password)
- **Data:** DB backup and restore (`:25,35`), metrics and calendar heatmap (`:57-101`).
- **Ingest:** smart backfill start/pause/resume/cancel (`:111-209`), fetch one game (`:229`), detect gaps (`:241`), scan local archive (`:261`), and archive-sync of 2019-2022 logs with a progress matrix and log console (`:372-386`).
- **Settings:** Gemini key, calendar URL, show cold storage, startup backfill (`:283-305`).
- **Maps:** sync, add a custom map, delete (`:319-358`).
- **Missing:** no fight-night controls (force or regenerate a date, edit thresholds, write copy), no announcements, and no moderation (nothing exists to moderate yet).

### Sharing and notifications
- No Discord webhook or bot, RSS, iCal, web manifest/PWA, service worker, push, `navigator.share`, or OG/Twitter meta.
- `index.html:6` has only a `<title>`, and the server returns the same static `index.html` for every route (`server/index.js:188-196`). Every shared link unfurls as the generic site.

### Dead code and TODOs
- `services/mockDataService.ts` is an empty file (0 bytes).
- The TODO/FIXME/XXX/HACK grep finds nothing real; the only hit is a test string in `scripts/seed_and_test.js:22`.

---

## B. Ecosystem map

| Thing | What it offers (checked) | Relation to this site |
|---|---|---|
| **tracker.otl.gg** (roncli, v3.1.0; repo `overload-development-community/tracker.otl.gg`) | Live server browser, Summary (recent games, games in progress, servers), Archived Games, Search Games (filterable by server), olmod getting-started, server setup, Links. The Summary page has no leaderboards, pilot profiles or ratings. Servers were updating today (2026-10-06). | **Feeds from it**, as the sole upstream. The live game page is HTML-scraped. A single point of failure. **Could integrate:** ask roncli for a JSON live-game endpoint or a completed-game webhook. Positioning: the tracker records games; this site explains them. |
| **olmod** (v0.5.14, released 2025-10-19) | Server browser, auto-downloads MP maps from overloadmaps.com, built-in olproxy for internet matches, the server writes kill/damage logs "and optionally send it to tracker", CTF/Race/Monsterball, observer mode. **No documented URL protocol or `-connect` flag.** | **Links to it.** The whole telemetry pipeline depends on olmod servers reporting. A one-click Join needs an upstream olmod change. |
| **olproxy** | Now built into olmod (README). | Nothing separate to integrate. |
| **overloadmaps.com** | Repository of levels from the Discord #level-publishing channel, with an author login. `data/all.json` has 552 entries (url/size/mtime/levels; no ratings or authors). | **Feeds from it** (catalog, zips). The site duplicates download, but adds play telemetry that overloadmaps lacks. **Could integrate:** link each map back to its overloadmaps page and sync nightly. |
| **omdb.net** | Map search engine; source of the stock map thumbnails. | Feeds the stock map images; linked from Resources. |
| **otl.gg** (Overload Teams League) | Season standings with team ratings, match schedule, player stats, team pages, records, Challonge brackets, Google Calendar, Discord. Mentions "Season 11" (whether that is current is unverified). | **Linked** (`Resources.tsx:29`). OTL owns organized team-league stats. Don't duplicate it. Own pickup/anarchy play, fight nights and individual rivalry. Could later show an OTL badge on pilot pages. |
| **tracker-log-archive** (GitHub, last push 2022-05-22) | Monthly tracker logs. | **Ingested**: 2019-07 to 2022-04. |
| **Discords** | `discord.com/invite/6dof` (linked here); Nerd Navy (`nerdnavy.org/discord`, listed on tracker servers). OTL coordinates on Discord. | **Where the community actually talks.** The site has no Discord presence: no webhook, bot, OAuth or link unfurls. This is the biggest gap. |
| **Server hosts** | The tracker's server filter lists the "Overloader:" fleet (Amsterdam, Atlanta, Buffalo, Chicago, Dallas, Denver x2, Piscataway, San Jose, Seattle, Toronto), Nerd Navy, D.Cent's EU, Descentforum.NET London, Sydney 1, Toronto 1, San Francisco 1 and others. | Shown in the browser. Hosts get no analytics anywhere. |
| **Revival Productions** | playoverload.com, revivalprod.com, Steam app 448850, GOG, Twitch, the Gamepedia wiki. | Store links only. |
| **OCT** (maestrodk/OCT) | "Overload Community Tool". Its features were not checked. | Linked. It may overlap with the Pilot Manager. |

Not verified: Discord sizes and activity, whether the 6dof invite is still the main Overload server, OCT's current features, whether tracker `/search` filters by pilot, and any Steam-side join protocol for Overload.

---

## C. Missing features by persona

### Competitive player
- **Power rankings with week-over-week movement.** Gives players a reason to come back every week. Needs: snapshots of `pilot_stats_cache` (the threat score is in hand; history is not).
- **Pick any two pilots for Tale of the Tape, with a permalink.** Settles arguments. Needs: the pairwise query generalized from `db.js:2373-2525` (in hand).
- **Belts and achievements** (fight-night top fragger, 10-streak, "killed the #1 threat"). Needs: recaps plus kill events (in hand).
- **Per-weapon leaderboards.** Weapon data is in hand (`/pilot/:name/weapons`).
- **Rivalry alerts.** Needs identity and push (neither in hand).

### Casual or returning player
- **"When do people play?"** An hour-of-week activity heatmap in the viewer's local time. Needs: the games table (in hand).
- **"Who's on now," right on the dashboard.** Online pilots exist but sit in a Pilots tab (in hand).
- **A "get back in" checklist:** install olmod (link), back up the pilot (bridge), import a strong pilot's autoselect order. Needs: share codes on top of existing serializers (in hand).
- **Join with one click.** Blocked: olmod has no URL protocol, and copy-IP already exists.

### Map author
- **Author page:** maps, total matches, kills, trend, top pilots on each map. Needs: `maps.author` plus `map_stats_cache` (in hand).
- **"Your map is being played right now."** Needs: browser `level` matched to the catalog (in hand).
- **New-map spotlight** after a nightly sync. Needs a scheduled `syncFromUpstream` (in hand, just not scheduled).

### Server host
- **Server page:** uptime from `lastSeen`, games per day, peak hours, average players, olmod version, top maps. Needs: browser data plus `games.ip`. The data is partly there: `ServerStats.tsx` and `ServerActivitySparkline.tsx` exist on the dashboard, but there is no per-server page.

### Community organizer
- **Native fight-night schedule** with an iCal feed, a dashboard countdown and RSVP. Replaces the broken iframe. Needs: a new `events` table; RSVP needs identity.
- **Discord recap webhook** when a fight night is detected, plus an optional "it's on" ping from live player counts. Needs: a webhook URL setting (new) and recap data (in hand).
- **Share images** for recaps and games. Needs: server-side OG meta and image rendering (new).

### Admin (the brother)
- **Fight-night controls:** force-generate a date, re-run, delete, edit thresholds, set the time-zone offset, add a custom headline. Needs: the existing service plus admin routes.
- **Merge pilot aliases.** Needs: a new alias table applied in stats queries.
- **Health page for upstream dependencies:** last successful tracker poll, scrape failures, map sync age. Needs: logging that partly exists.
- **Moderation queue,** once taunt sharing or claims exist.

---

## D. Differentiators (what nobody else in the ecosystem does)

1. **Read/write access to the player's local Overload folder.** No other site touches pilot files. Backups, keybinds, autoselect, taunt equipping and XP already work. Next: **share codes** for autoselect orders and binds, and "equip this taunt" from a community library.
2. **Years of kill-level telemetry with a PageRank threat score.** The tracker lists games and OTL rates league teams; nobody explains individual pickup play over time. Next: power rankings, Wrapped-style season reviews, belts, pairwise Tale of the Tape.
3. **Automatic fight-night detection with generated fight cards.** Nobody else declares and narrates the big nights. Next: Discord recap webhook, OG fight cards, a live "it's on" ping.
4. **A browser taunt studio that installs straight into the game.** YouTube/archive.org import → trim → .ogg under 128 kB → slot F1-F6. Next: a community taunt library keyed by the MD5 Overload already uses (`overloadFsBridge.ts:254-262`), with voting and one-click equip.
5. **Map catalog joined with play telemetry.** overloadmaps hosts files but has no play data. Next: author dashboards, map of the week, a "played right now" badge.

---

## E. Top 20 feature ideas (ranked by delight × feasibility)

| # | Name | Pitch | Persona | Data / integration | In hand? | Effort | Files |
|---|---|---|---|---|---|---|---|
| 1 | **Fight Night Discord drop** | When a recap is saved, post a rich embed (headline bout, upset, top fragger, link) to a Discord webhook | Organizer | Recap: yes. Webhook URL admin setting: no | Mostly | S | `server/services/fightNightService.js:407` (after `saveFightNightRecap`), `server/admin-routes.js:305`, `components/AdminPanel.tsx:618` |
| 2 | **OG share cards** | Pilot, game, recap and tape URLs unfurl in Discord with a rendered PNG card | All | Data yes. Needs per-route meta injection and image rendering (satori/resvg or node-canvas) | Partly | M | `server/index.js:188-196` (inject meta), new `server/services/ogImage.js`, `routes.js` |
| 3 | **Fix the dead features** | Calendar (CSP `frame-src` or native events), AI commentary (new model + auth), persist server favorites, fight-night day boundary in local time | All | Code only | Yes | S | `server/index.js:70-74`, `routes.js:672-723`, `GameList.tsx:28,98`, `db.js:2841`, `fightNightService.js:216` |
| 4 | **Native fight-night schedule + iCal** | Admin creates events; `/api/fight-nights.ics` subscribes in any calendar; dashboard countdown "Next fight: Sat 8 pm CT" | Organizer, casual | New `events` table | No | S-M | `db.js` (schema), `routes.js`, `CalendarWidget.tsx` (replace), `AdminPanel.tsx` |
| 5 | **Weekly power rankings with arrows** | Top 25 by threat score with ▲▼ movement and "new entry" tags; becomes a Discord post | Competitive | Threat score: yes. Snapshots: no | Partly | M | `db.js:1945` (snapshot after refresh), `maintenance.js:73`, new `components/PowerRankings.tsx`, `Layout.tsx` |
| 6 | **Tale of the Tape permalinks** | `/tape/A/B`: any two pilots, head-to-head bouts, kills exchanged, map splits, shareable | Competitive | Pairwise query from the rivals code | Yes | M | `db.js:2373-2525`, `routes.js` (new route), `App.tsx:25-70` (route), extract card from `PilotDetail.tsx:548-624` |
| 7 | **"It's on" live ping** | When the browser shows ≥N pilots across servers, post "Fight night is live on X, Y" to Discord once per evening | Casual, organizer | Browser poll: yes. Webhook from #1 | Yes | S | `server/ingest.js:89-96` or `routes.js:286`, `fightNightService.js` |
| 8 | **When-to-play heatmap + Online strip** | Hour-of-week heatmap in local time, and an "Online now" pilot strip on the dashboard | Casual | Games and browser data | Yes | S | `GameList.tsx`, `PilotsList.tsx:42-71` (lift), `routes.js` (aggregate), `db.js` |
| 9 | **Belts and achievements** | Fight-night belt holder (defend it next time), Boss Slayer, 10-streak, Century (100 games), anniversary | Competitive | Recaps, kills, `pilot_first_seen` | Yes | M | new `server/services/achievements.js`, `db.js`, `PilotDetail.tsx:214`, `FightNightRecapCard.tsx` |
| 10 | **Map of the Week + author pages** | Weekly featured map, `/author/:name` with plays, kills and top pilots on their maps; "played now" badge | Map author | `maps.author`, `map_stats_cache`, browser `level` | Yes | S | `MapLibrary.tsx`, `routes.js:376-456`, `mapSyncService.js:198` (schedule nightly sync) |
| 11 | **Season Wrapped** | Per-pilot yearly story: hours flown, nemesis, favorite victim, best map, longest streak, fight nights attended, rank change | Competitive, casual | Hot + cold games | Yes (rank change needs #5) | M-L | new `components/PilotWrapped.tsx`, `db.js` (yearly aggregate), `routes.js`, OG card from #2 |
| 12 | **Kill-feed scrubber** | Drag a slider through a match: scoreboard, streaks and first blood replay from `kills[].time` | Competitive | `KillEvent.time` exists; no positions | Yes | M | `GameDetail.tsx:56-80,227`, `ScoreChart.tsx`, `utils/statCalculators.ts` |
| 13 | **Loadout share codes** | Copy a pilot's autoselect order and binds as a code; paste to apply with an automatic backup | Casual, competitive | Parse/serialize exists | Yes | M | `utils/pilotSettingsBridge.ts:1000,1134,300-410`, `PilotSettingsPanel.tsx:918+` |
| 14 | **Fight-card AI narrator** | Replace the dead Gemini call with a grounded recap narration generated once per fight night (cached, admin-only trigger) | Organizer | Recap JSON: yes. Model key: yes | Yes | S | `routes.js:672-745`, `fightNightService.js`, `FightNightRecapCard.tsx:50` |
| 15 | **Server host pages** | `/server/:ip`: uptime, peak hours, average players, top maps, olmod version, "games hosted" leaderboard | Server host | Browser + `games.ip` | Yes | S-M | `ServerStats.tsx`, `ServerActivitySparkline.tsx`, `routes.js`, `App.tsx` |
| 16 | **Discord login + pilot claim + aliases** | Sign in with Discord, claim pilot names (admin-approved), merge aliases into one career | All; foundation for 17-19 | OAuth, `users` and `pilot_claims` tables | No | L | `server/auth.js`, `db.js`, `PilotDetail.tsx`, `AdminPanel.tsx` |
| 17 | **Community taunt library** | Upload exported taunts (MD5 named), tag, upvote, one-click equip to F1-F6 | Casual | Storage, moderation, identity from #16 | No | M-L | `AudioEditor.tsx:536`, `LoadoutManager.tsx:212`, `utils/overloadFsBridge.ts:310`, new server routes |
| 18 | **Fight-night RSVP** | "I'm in" headcount on the next event, with the list posted to Discord | Organizer | #4 + #16 | No | M | event components, `routes.js` |
| 19 | **Rivalry and nemesis alerts (PWA push)** | "Your nemesis just joined Overloader: Chicago" | Competitive | Online pilots: yes. Identity #16, service worker, web-push: no | No | L | new `public/manifest.webmanifest`, service worker, `PilotsList.tsx:42`, `ingest.js` |
| 20 | **One-click Join** | `olmod://join/ip` button on live cards | Casual | Needs an olmod PR adding a protocol handler; nothing documented today | No (external) | L | `LiveMatchCard.tsx:131`, `GameList.tsx:32`; upstream olmod repo |

### Suggested order
- **Week 1:** #3, #1, #7, #2. This puts the site into Discord, where the community already is.
- **Next:** #5, #6, #9 for weekly return visits; #4 to replace the broken calendar.
- **Later:** #16 unlocks #17-19.
- **Throughout:** keep scope off organized league play (otl.gg owns it) and lean into pickup play, fight nights and the local PC bridge.

---

Sources: [tracker.otl.gg](https://tracker.otl.gg/), [tracker.otl.gg/summary](https://tracker.otl.gg/summary), [otl.gg](https://otl.gg/), [olmod README](https://github.com/overload-development-community/olmod), [overloadmaps.com](https://www.overloadmaps.com/), [Gemini deprecations](https://ai.google.dev/gemini-api/docs/deprecations?hl=en), [Gemini 2.0 Flash discontinuation thread](https://discuss.ai.google.dev/t/gemini-2-0-flash-discontinuation-date/131389); `gh api` for olmod releases and tracker-log-archive; curl for the tracker links page, the CORP headers and `all.json`.
