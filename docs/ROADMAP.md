# overloadfight.club roadmap tracker

## What this is

The execution queue for the plan in `docs/overload-fight-club-roadmap.html`
(published at https://app.superset.sh/page/overload-fight-club-roadmap-n9wpxv).
The plan came from four audits (data, UX, performance, features) run on
2026-10-06 against commit `10223be`. The condensed audit notes with file:line
references live in `docs/audit/`.

The work is done one session at a time, each in a fresh context. Every session
owns exactly one item from the queue below, lands it as a PR, updates this file
in the same PR, and writes the prompt for the next session at the bottom.

## How to use this file

Each session:

1. Read this file top to bottom. Verify the status line against the repo before
   trusting anything (see "On resume").
2. Take the first unchecked session in the queue unless the user names another.
3. Work on a branch `ofc/sNN-<slug>` based on `origin/main`. Open a PR to
   `main`. Never merge it; merging publishes a Docker image to GHCR `latest`.
4. Before ending: tick the session's box, fill its "Validated" and "NOT
   validated" lists, add decisions to the register, append to the session log,
   re-read the status line and counts at the top and correct them, then rewrite
   the "Next session prompt" section. Commit the tracker change in the same PR
   as the work.
5. End the turn at the phase boundary. Do not start the next session's work.

On resume:

- Confirm the SHA in the status line still exists and the branch named there
  is still where the tracker says it is. If `main` moved, diff the delta before
  building.
- Re-run one verification command and compare with its last recorded result.
- Treat the NOT validated list as unknown, not as broken.
- If the repo contradicts this file, the repo wins. Record the contradiction in
  the session log.

## Status

S1, S2 and S3 are merged into `main` (PRs #1, #2 and #3, merged in that
order on 2026-10-07 UTC). After the PR #3 merge (`2b05787`) the owner
pushed `44e4792` straight to `main` (`saveColdGamesBatch` keeps stored
kill logs, `db.close()`, `scripts/rebuild_and_deploy_nas.py`, a
`public/version.json` bump). On 2026-10-07 the owner pushed three more
commits straight to `main` (`ebe30dd`, `35cddfd`, `fb4064a`: an archive
page refresh, `updateGameDetails` keeping stored kill logs, admin stats
across both files, archive ingest retired from the admin page), which
put `main` at `fb4064a` before the S4 merge.

S4 to S8 are merged into `main` (PRs #4 to #8, merged in order on
2026-10-07 UTC); `main` is at `6bc5857`, the PR #8 merge, with no owner
commits after it.

S9 is merged into `main` (PR #9, squash-merged 2026-10-07 19:50 UTC as
`ae050c4`). During S10 the owner pushed four commits straight to
`main`: `95196e7` (Tactical Replay v3, a 1,970-line
`components/MatchReplay.tsx` on the match page's overview and timeline
tabs), `887934e` (stats caches refresh after a backfill, an admin
refresh button, a startup freshness check), `45cb57b` (awaits those
refreshes) and `5afcdf5` (the leaderboard's Active (90d) toggle fetches
90-day totals and win rates from the server). `main` is at `5afcdf5`.
`5afcdf5` fails `npx tsc --noEmit` on its own (`setMinutes` with four
arguments); S10's branch fixes it.

S10 is merged into `main` (PR #10, squash-merged 2026-10-08 00:05 UTC
as `96f2710`), with no owner commits after it.

S11 is merged into `main` (PR #11, squash-merged 2026-10-08 03:39 UTC
as `5a09e5c`), with no owner commits after it.

S12 is merged into `main` (PR #12, squash-merged 2026-10-08 13:21 UTC
as `6bdeb97`), with no owner commits after it.

S13 is merged into `main` (PR #13, squash-merged 2026-10-08 15:28 UTC
as `d7a81eb`), with no owner commits after it.

A maintenance PR outside the numbered sessions moved the project to
Node 26 and better-sqlite3 13 (see "Maintenance" in the queue): PR #14,
squash-merged 2026-10-08 16:01 UTC as `e35672a`, with no owner commits
after it. (The tracker said it was still open when S14 started; it had
merged.)

S14 is merged into `main` (PR #15, squash-merged 2026-10-08 18:51 UTC
as `aa05428`), with no owner commits after it.

S15 is merged into `main` (PR #16, squash-merged 2026-10-09 03:47 UTC
as `2463b20`), with no owner commits after it. (The S16 prompt said it
was still open; it had merged.)

S16 is merged into `main` (PR #17, squash-merged 2026-10-09 15:57 UTC
as `5e2d02d`), with no owner commits after it. (The S17 prompt allowed
for it still being open; it had merged.)

S17 is merged into `main` (PR #18, squash-merged 2026-10-09 20:01 UTC
as `726e536`), with no owner commits after it.

S18 is merged into `main` (PR #19, squash-merged 2026-10-09 21:25 UTC
as `6e7ed6d`), with no owner commits after it.

S19 is merged into `main` (PR #20, squash-merged 2026-10-10 00:38 UTC
as `00fa782`), with no owner commits after it.

S20 is merged into `main` (PR #21, squash-merged 2026-10-10 12:31 UTC
as `f4d55fd`), with no owner commits after it. (The S21 prompt allowed
for it still being open; it had merged.)

S21 is on branch `ofc/s21-belts-and-achievements`, based on `f4d55fd`,
its PR (#22) open against `main` and not merged, 2026-10-10 UTC.

On 2026-10-06 the repo owner purged the leaked password from history and
force-pushed `main`. Every commit SHA changed. The audits' base `10223be` is
now `2c4f174`, with identical code apart from the redacted password, so the
audits' file:line references still hold. `5516729` came after the audits and
touches only `scripts/` and `.gitignore`. Old clones still hold the
pre-rewrite history: work from a fresh clone and never push a branch that
descends from `10223be`. The local docs branch
`overload-site-redesign-13ed9872` is on the old history; do not use it.

Counts: 21 of 28 sessions done (S1 to S20 merged, S21 in its PR).
Phase 1: 6/6. Phase 2: 5/5. Phase 3: 6/6. Phase 4: 4/11. The Node 26
maintenance item does not count toward the 28.

## Validated (as of 2026-10-10 UTC, audits at 10223be = 2c4f174 after the rewrite, S1 to S20 and Node 26 merged into `main`, `main` at f4d55fd, S21 on `ofc/s21-belts-and-achievements`)

- S21, first move on Node 26.11.1, on `main` at `f4d55fd` (PR #21 merged,
  no owner commits after it; `git diff origin/ofc/s20-tale-of-the-tape
  origin/main` is empty; `10223be` is not an object here, so the
  pre-rewrite check fails as it should): `npx vitest run` passed 22 files,
  387 tests. `npx vite build` wrote the entry at 234.10 KB raw / 75.04 KB
  gzip, `PilotDetail` 52.02 KB / 13.47 KB, `GameList` 41.74 KB / 11.45 KB
  and `Tape` 10.74 KB / 3.56 KB gzip; `npx tsc --noEmit` exited 0. All
  match the S20 records. `wc -l` before building: `gameParse.js` 1,191,
  `statsPasses.js` 820, `analytics/ratings.js` 60, `analytics/meta.js`
  147, `analytics/tape.js` 110, `discordService.js` 224,
  `discordMessages.js` 124, `shareCards.js` 177, `pageMeta.js` 176,
  `PilotDetail.tsx` 707.
- S21, the owner's seven answers at the start (see the decisions): a
  lineal belt per mode, decided match by match; all four groups of
  achievements, from every stored match, tiered; the pilot page, a
  `/belts` view, a belt mark beside names and the share cards; NEW
  CHAMPION in the recap embed; locked achievements shown with progress.
- S21, the fixtures by hand before building: Anarchy's first decisive
  match is 72084 (BEHEMOTH 20, B2AF 15) and BEHEMOTH defends it in 72085;
  Team Anarchy's is 72095 (INSANER alone on BLUE) and BLUE wins 72096,
  72097, 72099 and 72102, so INSANER has 4 defenses; neither belt changes
  hands in the sample. In 72099's hand-written log INSANER's best kill
  streak is 3, STITCH's 2; in 72098's "." has 2.
- S21, tests: `npx vitest run` passes 24 files, 427 tests (387 at the
  start). New: `server/lib/achievementPass.test.js` (22: `beltMatch` on
  72084, a 1-1 draw, 72097 and 72102's top scorers, a level team with
  listing order, CTF by captures and Monsterball by goals with kills
  after them, an unrated match, a mode without a belt; the belt replay
  through the pass on the sample in both orders, a lost belt and a draw
  defended, a holder beaten while the top was shared, a whole winning
  team as slayers, a match without the holder, an undated match;
  `killStreaksOf` on both logs and with a suicide, a death with no
  attacker and a team kill added; `tierOf`; the pass's milestones
  against `pilotPass` for every fixture pilot, its kill-log feats
  against `rivalPass`'s clutch rows and the best streak over two logged
  matches, the match each tier is earned on, the streaks with a tie
  (ranked and duel), a pilot listed twice and a match with no result,
  belts won and Boss Slayer when the belt changes hands, Boss Slayer
  when the holder is beaten with the top shared, the
  anniversary on its day, an undated match, the latest spelling) and
  `server/db/analytics/belts.test.js` (13, through the real refresh on
  the sample with its two logs, the 2019 match in cold storage and two
  more matches passing the Anarchy belt to B2AF and back: each mode's
  champion, lineage and vacancy, the tier counts, a pilot's achievements
  against `pilot_stats_cache` and `pilot_clutch`, B2AF's Boss Slayer and
  BEHEMOTH's two reigns newest first,
  the anniversary from cold storage, an unknown pilot, the belt changes
  on a day, the reign chain and the built marker, both routes, both
  cards, the share tags). `discordService.test.js`: the "New champion"
  field from `getBeltChanges` on the fixtures, its plural, escaping and
  a long name cut with an ellipsis,
  none on a night without a change, and the posted recap carrying it.
  `shareCards.test.js`: the pilot card's belt and achievements tiles
  (two or four belts as a count) and description, `beltsCard`.
  `cardLayout.test.js`: five tiles, the type and horizontal padding
  scaled by four fifths. `siteRoutes.test.js`: `/belts`.
- S21, mutations (`mutate.py` in the scratch folder: each edit on a
  source file restored from a copy named by its absolute path, five test
  files run): 33 of 33 fail a test after /simplify. The first run caught
  28 of 31: a pilot listed twice running a streak twice and a tie not
  ending a streak got tests, and an ended reign shown as the holder
  showed that guard was dead (the newest reign always lasts), so it
  went. `git status` after each run showed only the session's own
  changes.
- S21, real data (`real.mjs` run by plain `node` on a copy of
  `/tmp/ofc-data`, 76 matches): the pass recounted over every stored match
  gives the same rows as the server wrote, 5 of 5 reigns and 249 of 249
  achievement rows (run again after /simplify on tables written before
  it: still equal); the milestones equal `pilot_stats_cache` for 38 of
  38 pilots and the kill-log feats `pilot_clutch` for 20 of 20; the
  reigns chain with no break (Anarchy: WD-40 with 2 defenses, LORD JOHN
  WARFIN, WD-40, then BOOGEYMAN, all on 2026-10-06; Team Anarchy:
  KAUMRAPSEL since 2026-10-05). A pilot's achievements read on the
  primary key; a mode's lineage on the primary key; a pilot's reigns
  scan `belt_reigns` (flagged).
- S21, `PORT=3100 DATA_DIR=/tmp/ofc-data npm start` on the built `dist/`:
  the first start refreshed for the new list ("[Belts] 5 belt reigns: 5
  written", "[Achievements] 249 pilot achievements: 249 written"); the
  restarts after it logged "Cache already warm on startup". The
  seventeen API paths in the prompt answer 200 (`total_games: 76`), and
  so do `/api/stats/belts`, `/api/pilot/WD-40/achievements`,
  `/api/pilot/NOBODY/achievements` (zeros) and `/api/card/belts`
  (`image/png`). `curl /belts`: "Belts | overloadfight.club", "Champions:
  Anarchy BOOGEYMAN (since 2026-10-06, 0 defenses), Team Anarchy
  KAUMRAPSEL (since 2026-10-05, 0 defenses).", `og:image`
  `/api/card/belts?v=...` and `twitter:card`; `/pilot/BOOGEYMAN`'s
  description ends "Anarchy champion since Tue, Oct 6, 2026, 0
  defenses."; WD-40's says nothing of belts. The `og:image` of a pilot,
  a match, the fight night, a map, a tape, a tape in a mode and `/belts`
  each answer 200 `image/png`. Looked at: the belts card, BOOGEYMAN's
  card with the Belt tile, WD-40's with "4 of 42 tiers", and a worst case
  (LORD JOHN WARFIN, 12,345 matches, 123,456 kills, a provisional note,
  Team Anarchy). The first look showed "COMBAT RA..." and
  "ACHIEVEME..." cut in five tiles; fixed.
- S21, headless Chrome 154 over CDP (`checks.mjs` on my own client,
  `cdp.mjs`, over Node's WebSocket on port 9341 with its own profile and
  a Fetch-domain mock list that fulfils, fails or holds), at 1,280 and
  390 px: 134 of 140 on the final build. `/belts` on local data: the
  title, a card per mode equal to the API (holder, days, defenses, the
  match and who it was taken from, Vacant for CTF and Monsterball), a
  lineage per decided mode equal to the API, the tier counts, no
  Recharts, no overflow, Leaderboards lit. Mocked: held (Loading),
  failed (ErrorState) then Retry, every belt vacant (EmptyState and the
  achievements still there), and four champions with 32-character names
  and ten reigns each, no wider than the window. The pilot page:
  BOOGEYMAN's 14 tiles in order with each tier and count equal to the
  API, the belt held named, the mark in the header, the earned tile
  linking its match; WD-40's two ended reigns and no mark; one
  `/api/stats/belts` request per page load; mocked held, failed then
  Retry, and a pilot with nothing (14 greyed tiles, "0 of 100 ranked
  matches", no belt line). The marks: the leaderboard marks exactly the
  champions it lists, each saying its mode; its Belts link opens
  `/belts` in place; the tape's red corner marks a champion; with WD-40
  made a champion by a mock, `/rankings`, the duel ladder and the CTF
  board mark him alone; a failed belts answer leaves no mark and no
  error. The dashboard (no Recharts chunk), fight night, leaderboard,
  rankings, ladders, rivalries, a tape, a pilot, maps, history, a match
  and admin load with their titles and fit. The 6 failures are map-image
  404s from overloadmaps.com: SWAT (map 516) and ICEWOLF DEATH MATCH V.1
  (640) on the dashboard and `/history`, SUB ROSA (424) and REC CENTRE
  (151) on `/history`, 640 on `/maps` (flagged; SWAT is new since S20).
  The first run also failed the pilot card's held state, which was the
  harness reading a DOM node by value.
- S21, /code-review found 8 issues; 7 fixed (CTF and Monsterball belts
  going to the most kills instead of captures or goals, two copies of
  the replay order, the belt marks never asking again and holding state
  per row, the tape's long names no longer truncating, two doc comments
  stranded above the wrong functions), 1 skipped and flagged (each pass
  replaying the kill logs on its own). /simplify (four agents): the belt
  tested through the pass that writes it (`beltReigns` gone), one
  `sideOutcome` for bouts and duels, `tiersEarned`, `TIER_TOTAL` and
  `ACHIEVEMENT_BY_ID` shared, one tile-count rule for the card sizes, the
  clutch kills counted per pilot per match, each match's day worked out
  once, the belts answer without a count its holder carries, the marks
  seeded from `/belts`, `movedTo` in the fixtures; skipped: the
  anniversary computed on read, one replay for streaks and clutch, an
  index on `belt_reigns`, slimmer kept sides, a shared spelling helper
  and a shared totals helper with `pilotPass`, the pilot page's mark fed
  from its own answer (see the flags).
- S21, CI on PR #22 at `2bc89a0`: `check` (tsc, vite build, vitest) passed
  in 58 s and `build` (the Docker image) in 1 min 30 s.
- S21, sizes on Node 26.11.1 at the end, against a build of `origin/main`
  in a scratch worktree: entry 234.10 to 234.57 KB raw, 75.04 to 75.21 KB
  gzip (the route row and the two fetchers); `PilotDetail` 52.02 / 13.47
  to 55.64 / 14.33 (the card); `PilotsList` 18.04 / 5.18 to 18.42 / 5.26;
  `PowerRankings` 4.20 / 1.50 to 4.33 / 1.58; `Ladders` 8.15 / 2.51 to
  8.32 / 2.59; `Tape` 10.74 / 3.56 to 11.02 / 3.67; `Rivals` 7.32 / 2.48
  to 7.36 / 2.50; `GameList` 41.74 / 11.45 to 41.75 / 11.46; new `Belts`
  7.53 / 2.29 and `BeltMark` 0.58 / 0.39 (shared by the five pages). No
  new Recharts chunk. `npx tsc --noEmit` exits 0. `wc -l`:
  `achievementPass.js` 158, `analytics/belts.js` 94, `Belts.tsx` 104,
  `belts/BeltLineage.tsx` 48, `belts/AchievementList.tsx` 34,
  `belts/TierPips.tsx` 17, `pilotDetail/AchievementsCard.tsx` 80,
  `BeltMark.tsx` 21, `useBeltHolders.ts` 42, `gameParse.js` 1,315,
  `PilotDetail.tsx` 712; no new module over 500.

- S20, first move on Node 26.11.1, on `main` at `00fa782` (PR #20 merged,
  no owner commits after it; `git diff origin/ofc/s19-og-share-cards
  origin/main` is empty; `10223be` is not an object here, so the
  pre-rewrite check fails as it should): `npx vitest run` passed 21 files,
  356 tests (the prompt said 352; S19's review fixes in `d4d348d` added
  four). `npx vite build` wrote the entry at 233.36 KB raw / 74.78 KB
  gzip, `PilotDetail` 56.91 KB / 14.57 KB and `GameList` 41.71 KB / 11.43
  KB gzip; `npx tsc --noEmit` exited 0. All match the S19 records. `wc -l`
  before building: `PilotDetail.tsx` 928, `pilotTelemetry.js` 449,
  `rivals.js` 80, `siteRoutes.js` 98, `pageMeta.js` 166, `shareCards.js`
  139, `cardLayout.js` 72, `cardService.js` 143.
- S20, the owner's answers at the start (see the decisions): every
  recommended option but the matches, where the owner chose a `?mode=`
  switch, and the links, where the owner chose all four places.
- S20, tests: `npx vitest run` passes 22 files, 387 tests (356 at the
  start). New: `server/db/analytics/tape.test.js` (15 tests on a temp
  database of the sample with 72099 and 72098 carrying their logs: the
  record, logged kills and damage and map splits of STITCH and PHOENIX
  read by hand from the fixtures, both orders, the mode filter, the
  careers against `getPilotPPI` and `getPilotRating`, the duels of WD-40
  and OKSTER and of JFTP and ".", a pair that never met, a missing pilot
  and one pilot twice, the opponent list and its order, the routes, the
  card route in a mode, the share tags, a stale row removed by a refresh,
  a key change rebuilding the table); in `gameParse.test.js` `boutsOf`
  and `rivalPass`'s bouts (mirrored rows, W+L+T, the rating's games, the
  sums against `pilot_rivals`, a log-only pilot's pair); `tapeCard`,
  `boutLead` and `recordText`, and the route in `siteRoutes.test.js`.
- S20, mutations (`mutate.py` in the scratch folder: each edit on a
  source file restored from a copy named by its absolute path, six test
  files run): 27 of 28 edits fail a test. The first run caught 22; the six
  it missed got tests (a log-only pilot's pair, a match with no map, the
  opponent order decided by deaths, the card route's mode, a key change)
  or, for the one that changed nothing (a rating guarded by its match
  count, already null without one), the dead guard went. `git status`
  after each run showed only the session's own changes.
- S20, real data (`real.mjs` run by plain `node` on `/tmp/ofc-data`,
  which the tracker sync took from 49 to 62 matches during the session):
  `boutsOf` recounted over every stored match gives the same record for
  220 of 220 pairs as `pilot_bouts`; its sums equal all 98 `pilot_rivals`
  rows; every row has its mirror and W+L+T equal to matches; both reads
  search the primary key. The first start built the table ("[Bouts] 514
  bout rows: 514 written") and the start after /simplify rebuilt it from
  the changed marker with `pilot_rivals` unchanged ("98 rival pairs: 0
  written").
- S20, `PORT=3100 DATA_DIR=/tmp/ofc-data npm start` on the built `dist/`:
  `/api/stats/global` (`total_games: 62`), `/api/stats/pilots`,
  `/api/pilot/WD-40/stats`, `/api/stats/rankings`, `/api/stats/heatmap`,
  `/api/pilot/WD-40/career`, `/api/stats/regions`,
  `/api/server/143.110.230.67/history`, `/api/stats/weapons`,
  `/api/stats/duels`, `/api/stats/rivalries`, `/api/pilot/WD-40/rivalry`,
  `/api/card/pilot/WD-40` and `/api/health` all 200, and the S19 cards
  for a match, the fight night and a map still `image/png`. New:
  `/api/pilot/futzpimmel/tape/badass` and `/opponents` 200;
  `/api/pilot/NOBODY/tape/badass` 200 `{"missing":["NOBODY"]}`, one pilot
  twice 200 `{"same":"WD-40"}`; `/api/card/tape/futzpimmel/badass` (and
  `?mode=ANARCHY`) 200 `image/png`, `/api/card/tape/NOBODY/badass` 404.
  curl on `/tape/futzpimmel/badass`: `og:description` "FUTZPIMMEL vs
  BADASS: BADASS leads 3–2 in 5 ranked matches, kills 41–21 in 3 logged
  matches.", `og:image` on `/api/card/tape/FUTZPIMMEL/BADASS?v=...`, its
  size, alt and `twitter:card`; `?mode=ctf` gives "no ranked CTF match
  between them yet" and a CTF card; an unknown pilot or one pilot twice
  gets the site description and no `og:image`. The two cards looked at
  (FUTZPIMMEL vs BADASS, WD-40 vs OKSTER) read in S19's layout with no
  overflow.
- S20, headless Chrome 154 over CDP (`checks.mjs` on my own 87-line
  client, `cdp.mjs`, over Node's WebSocket on port 9333 with its own
  profile and a Fetch-domain mock list), at 1,280 and 390 px: 164 of 168.
  The tape of FUTZPIMMEL and BADASS (title, corners, who leads, the record,
  logged kills and damage and map splits equal to the API, career rows,
  the mode buttons, no Recharts chunk, no overflow); the switch by click,
  in the URL, across a reload and back to all modes; `?mode=anarchy` in
  lower case; a mode they never met in; WD-40 and WILLIE, who never met;
  an unknown pilot; one pilot twice; the duel record of WD-40 and CHEKM8;
  mocked: held, failed then Retry, and a 4,000-match tape with two
  32-character names and 30 maps. The pilot page's list equals
  `/opponents` and links to the tapes, the old card is gone, one `/ppi`
  request (two before), the kill-log rivals' "Tape" links, a click staying
  in the document, and the list held, failed and empty. `/rivals`' pair
  links, the duel ladder's links against the row above, and the damage
  grid's cells on match 78782 (dealer first, in the Tab order, none on a
  teammate). The dashboard (no Recharts chunk), fight night, leaderboard,
  rankings, ladders, rivalries, a pilot, maps, history, a match and admin
  load with their titles and fit. The 4 failures are map-image 404s from
  overloadmaps.com: maps 62, 88, 151 and 424 on `/history`, 640 on
  `/maps` (the S18 and S19 flags). The first run also showed the tape's
  own 404 and 400 logged as console errors, which led to the 200 answers.
- S20, dataviz `validate_palette.js --mode dark --surface "#111111"` on
  the corners' `chart.team` pair (#d95926, #3987e5): every check passes,
  worst adjacent CVD ΔE 26.8 (protan), normal vision 31.8.
- S20, /code-review found 10 issues; 7 fixed (the opponent order read one
  row's kills, damage cells out of the Tab order, `?mode=` case on the
  client, duels under a mode, a corner's totals read for its name, a key
  change not rebuilding a table, the logged base worded as part of the
  record, plus no link on a teammate's cell), 2 skipped and flagged
  (`/breakdown` still building rivals; a general bare-route fallback,
  which would change what `/game` alone opens). /simplify (four agents)
  summed `pilot_rivals` from the bout rows, put `/tape` in the rivals
  row's aliases, forwarded the card route's query, named every key in
  the built marker, shared the mode list with the pilot page and the
  tape's words between page and card, and read the opponents' names in
  one query; skipped: deriving every route's parameter count, a lighter
  read for the card, fetching the tape once for every mode, passing
  `ratingSides` between passes, `recordText` on the older ladders, and a
  shared Back button.
- S20, CI on PR #21 at `d5ce7f6`: `check` (tsc, vite build, vitest)
  passed in 1m02s and `build` (the Docker image) in 1m14s.
- S20, sizes on Node 26.11.1 at the end: entry 234.10 KB raw / 75.04 KB
  gzip (233.36 / 74.78 before: the route, the shared mode list and
  wording), `Tape` 10.74 KB / 3.56 KB gzip (new), `PilotDetail` 52.02 KB
  / 13.47 KB (56.91 / 14.57), `GameList` 41.74 / 11.45 (41.71 / 11.43),
  `Rivals` 7.32 / 2.48 (7.00 / 2.38), `Ladders` 8.15 / 2.51 (7.54 /
  2.38), `GameDetail` 124.19 / 40.12 (123.94 / 40.03), `HeatTable` 1.76 /
  0.79. `PilotDetail.tsx` is 707 lines (928); every new module is under
  500 (`tape.js` 110, `Tape.tsx` 95, `TapeHeadToHead.tsx` 90).

- S19, first move on Node 26.11.1, on `main` at `6e7ed6d` (PR #19
  merged, no owner commits after it; `git diff
  origin/ofc/s18-discord-webhook origin/main` is empty; `10223be` is not
  an object here, so the pre-rewrite check fails as it should): `npx
  vitest run` passed 18 files, 313 tests. `npx vite build` wrote the entry
  at 233.36 KB raw / 74.80 KB gzip, `AdminPanel` 35.18 KB / 9.32 KB gzip,
  `GameList` 41.67 KB / 11.42 KB gzip and `FightNightSection` 14.13 KB /
  3.05 KB gzip. `npx tsc --noEmit` exited 0. All match the S18 records.
  `wc -l` before building: `pageMeta.js` 125, `index.js` 598,
  `siteRoutes.js` 98, `routes/maps.js` 241, `matchResult.js` 57,
  `discordMessages.js` 119, `designTokens.js` 88, `tailwind.config.js`
  16, `index.html` 14, `Dockerfile` 46, `package.json` 53.
- S19, the owner's seven answers at the start (see the decisions).
- S19, a prototype run by plain `node` before building: satori 3 ms and
  resvg 218 ms a card, 2.2 s for the first, with resvg's system fonts
  loaded; 9 ms sync and 1.5 ms through `renderAsync` without them (no
  event-loop tick missed during the async render).
- S19, tests: `npx vitest run` passes 21 files, 352 tests (313 at the
  start). New: `server/lib/shareCards.test.js` (14) builds each card on
  fixture games or hand-made rows: 72102's map, result, mode, 15:10,
  Decision and day, word for word S8's description; 72108 KO, 72098 Draw;
  a match known only by its time limit (no length, as the description); a
  match at 03:00 UTC dated to the Chicago evening; an unparseable date
  leaving the day out; the pilot's four tiles, every standing, a negative
  cached ratio as 0.00, "1 match, 1 kill"; the night's tiles and no most
  kills at 0; the map's tiles, an Unknown author left out, an image and its
  time in the key, an all-digit name by id; the key stable and moving with
  a number, a name with `/` and `?` in its own path segment.
  `server/lib/cardLayout.test.js` (4): 1200 × 630, the tokens at 2.5
  times, four tiles at most, title and value sizes by length, the image
  only when given. `server/services/cardService.test.js` (19) on a temp
  database of the fixtures: ZERGLING's matches, kills and ranked Combat
  Ratio counted again from the fixture games (the ratio by `combatRatio`
  over his ranked matches equals the card's), his rating and standing as
  `getPilotRating` gives them, WD-40 "#1 in the power rankings"; the
  night's matches, pilots, kills and most kills counted from the fixtures
  on `day` (14 of the 25, the rest past 06:00); ASCENT's matches, kills,
  last 30 days and top pilot counted from the fixtures; no card for other
  pages; a 1200 × 630 PNG drawn once and then cached, five requests drawn
  one at a time with a shared draw, a new card when a number moves, the
  200-card and byte caps dropping the least recently used, a map image
  drawn behind the card (a PNG the test drew itself) and a missing or
  non-image file left out, 20 waiting draws and three turned away with
  `CardBusy` and not marked failed (and none turned away with no limit),
  Cyrillic, Greek and Vietnamese names drawn, a failed card remembered;
  the five tags on the four pages on the request's origin, none for other
  pages or a failed card; the route's PNG, `Server-Timing`, a cached card
  by `?v=` with no database read, 404s, 500s, a 503 with `Retry-After`
  past the wait limit. `pageMeta.test.js`: "ZERGLING: 1 match" (S8's test
  expected "1 matches"). `discordService.test.js`: the embed's image under
  `SITE_URL`, its link and sentence the card's, no image when told the
  draw failed, and the posted recap's card cached before the post.
  `matchResult.test.js`: `ratingStanding`.
- S19, mutations (`mutate.py` in the scratch folder: each edit on a source
  file, six test files run, the file restored from a copy named by its
  absolute path; `git status` the same after every run): 26 of 26 fail a
  test. Three had survived the first run (a match length from the time
  limit, the UTC day for Played, a cache hit not counted as recent use)
  and one the run after /simplify (the recap posting without drawing its
  card); each got a test.
- S19, real data from scripts run by plain `node` (so the ES-module
  imports are checked outside vitest) on a copy of `/tmp/ofc-data`: the
  four kinds of card drawn and looked at (WD-40: 23 matches, 380 kills,
  1439 "#2 in the power rankings", 0.76; 78764 STRONGHOLD "BLUE wins
  87–80.", TEAM ANARCHY, 15:11, Split decision; 2026-10-06: 18 matches, 11
  pilots, 1,102 kills, WD-40 237; Blizzard with its image: 2 matches, 257
  kills, FUTZPIMMEL 54), then a worst case (a 56-character title, a 32-W
  value, long notes) and Cyrillic, Greek and Vietnamese names. The looks
  caught "BADASS" running out of its tile at 46 px and a standing cut at
  two lines; both fixed.
- S19, `PORT=3100 DATA_DIR=/tmp/ofc-data npm start` on the built `dist/`
  (49 matches by the end): "Startup sync complete." logged; `curl` of
  `/pilot/WD-40`, `/pilot/LORD%20JOHN%20WARFIN`, `/game/78764`,
  `/game/78758`, `/fight-night`, `/fight-night/2026-10-06`,
  `/maps/BLIZZARD` and `/maps/ASCENT` gives each page's `og:image` on
  `http://localhost:3100`, its size, alt text and `twitter:card`; each
  image URL answers 200 `image/png`, 1200 × 630, `render;dur=98` for the
  first card after the start, 19 to 21 for the others, 76 and 80 for the
  maps with images, 0 the second time. `/pilots`, `/rankings`, `/ladders`,
  `/rivals`, `/`, `/history` and `/server/143.110.230.67` have no
  `og:image`; `/api/card` for an unknown pilot, `/pilots`, `/game/1`, an
  unknown map and `/rankings` answers 404. `/maps/BLIZZARD` describes
  itself: "Blizzard by Revival Productions: 2 matches, 257 kills, top
  pilot FUTZPIMMEL." The thirteen API paths in the prompt answer 200
  (`total_games: 49`). `robots.txt` lists `Allow: /api/card/`. SIGTERM
  logged `[Shutdown] Done.`
- S19, headless Chrome 154 over CDP (`checks.mjs`, my own 144-line client
  over Node's WebSocket on port 9227 with its own profile; another
  session's headless Chrome on a random port was left alone), 172 checks
  at 1,280 and 390 px, 166 pass on the final build: `/`, `/history`, both
  fight-night pages, `/pilots`, `/rankings`, `/ladders`, `/rivals`, two
  pilots, `/maps`, `/maps/BLIZZARD`, `/game/78764`,
  `/server/143.110.230.67` and `/admin` each have their title, content, no
  ErrorState, no overflow; the six card pages carry `og:image` on the
  page's origin with `summary_large_image` and the card loads in the page
  as a 1200 × 630 image; the others carry none; the pilot page's standing
  links to the rankings; the dashboard's first visit loads no Recharts
  chunk; `/admin` logs in with the dev password and shows the Discord card
  with no console error. The six failures are `/history`, `/maps` and
  `/maps/BLIZZARD` at both widths logging 404s for map images
  overloadmaps.com lacks: the S18 four plus JUNEBUG (map 62) on `/maps`
  at 1,280 px (flagged; no S19 change). The first run passed 165 of 172:
  the same six and the harness asking the 390 px login form for 200
  characters of text.
- S19 /code-review found 9 issues: Cyrillic and CJK names drawn blank,
  `dayLabel(null)` throwing on an unparseable date, an unbounded draw
  queue, a replaced map image keeping its old card, an all-digit map name
  read as an id, the full rating history read for the tags, the key
  hashed twice per page, the map page's `existsSync` and second read, and
  the recap embedding a card that failed. Fixed: the fonts (Roboto Mono's
  scripts under their own names, since satori falls back only across
  names; CJK flagged), the date, a wait limit, the image's time in the
  key, the all-digit path, the key hashed once, the recap drawing first.
  Kept: the map's second read (the intel answer lacks the file name and
  adding it changes a public answer). The history read went, then came
  back after /simplify. /simplify (four agents): the embed reading the
  card's `line` and `path`, the wait limit moved to the route (in the
  service it could have turned away the recap's own draw), a cached card
  served by `?v=` before any read, satori loaded on the first draw, a
  20 MB cap, `getPilotRating` again instead of a new standing read, the
  lookup only for the four views, three dead null checks, a flatter
  `mapMeta`, shared test helpers and `afterEach` restores. Skipped:
  `getMapIntel` reading names before ids (it changes a public API's
  lookup), dropping the failure memory (the owner's rule: no `og:image`
  for a failed card), `local_image` in the intel answer, one `careerKda`
  for the page and the card (they differ only before the first refresh),
  no redraw of a failed card (a passing failure should recover), the
  recap drawing beside the rankings (90 ms once a night).
- S19, sizes on Node 26.11.1 at the end, against a build of `origin/main`
  in a scratch worktree: entry `index-*.js` 233.36 KB raw both, 74.80 to
  74.78 KB gzip (hash names of the chunks it imports); `matchResult`
  4.54 to 4.82 KB raw, 2.30 to 2.45 KB gzip (`ratingStanding`);
  `PilotDetail` 57.10 to 56.91 KB raw, 14.65 to 14.57 KB gzip;
  `GameList` 41.67 to 41.71 KB raw, 11.42 to 11.43 KB gzip;
  `GlobalActivityChart` 15.41 to 15.44 KB; `AdminPanel` and
  `FightNightSection` unchanged. No new Recharts chunk. `npx tsc --noEmit`
  exits 0. `wc -l`: `shareCards.js` 138, `cardLayout.js` 68,
  `cardService.js` 141, `routes/cards.js` 38, `pageMeta.js` 166,
  `discordMessages.js` 124, `discordService.js` 223, `matchResult.js` 70,
  `repos/maps.js` 433, `db.js` 249; no new file is over 500.
- S19, the Docker image: `docker build` on the cached `node:26-alpine`
  (arm64) installed `@resvg/resvg-js-linux-arm64-musl` from its prebuilt
  package with no `.o` file anywhere under it; the container ran as uid
  1000, reported healthy, drew WD-40's card (200, 1200 × 630, 132 ms) and
  logged `[Shutdown] Done.` on `docker stop`. The image is 619 MB (599 MB
  in the Node 26 record).
- S19, CI on PR #20 (`9a8ad59`): `check` passed in 1 min 0 s (tsc, the
  vite build, vitest 21 files and 352 tests on Node 26); docker-publish's
  `build` passed in 1 min 54 s, building linux/amd64 with `push: false`,
  so the amd64 image installed resvg's `linux-x64-musl` package and built.

- S18, first move on Node 26.11.1, on `main` at `726e536` (PR #18
  merged, no owner commits after it; `git diff
  origin/ofc/s17-rivalry-network origin/main` is empty; `10223be` is not
  an object here, so the pre-rewrite check fails as it should): `npx
  vitest run` passed 17 files, 293 tests (the S18 prompt said 286, the
  count before S17's review fixes). `npx vite build` wrote the entry at
  233.26 KB raw / 74.78 KB gzip (the table said 74.77), `AdminPanel`
  29.59 KB / 7.65 KB gzip, `GameList` 41.67 KB / 11.43 KB gzip and
  `FightNightSection` 14.13 KB / 3.04 KB gzip. `npx tsc --noEmit` exited
  0. `wc -l` before building: `fightNightService.js` 528, `maintenance.js`
  127, `ingest.js` 105, `repos/settings.js` 6, `repos/fightNights.js` 62,
  `admin-routes.js` 441, `auth.js` 100, `useAdminSettings.ts` 26,
  `AdminDashboardConfig.tsx` 43, `apiService.ts` 798, `pageMeta.js` 127,
  `siteRoutes.js` 98, `gameParse.js` 1,135, `.env.example` 18.
- S18, the owner's answers at the start (see the decisions).
- S18, tests: `npx vitest run` passes 18 files, 313 tests (293 at the
  start). The new `server/services/discordService.test.js` (18 tests)
  runs a temp database with the fixture games on two nights, a local stub
  webhook (`http.createServer` recording each body) and the admin router
  on a session stub. The recap embed's totals, most kills and most
  matches are counted again from the fixture games and match; its seven
  lines equal the saved recap's; its rankings equal `getPowerRankings` on
  the day after the night; ▲, ▼, – and NEW, the top 5 only; 200 copies of
  `**@everyone**` stay inside 6,000 characters and come out escaped; a
  masked link's brackets are escaped. The ping lists the busy servers
  most first with the count `browserPilots` reads, at most 10. One ping
  per fight-night day: none switched off, none at 4 or 5 pilots, none
  again after a quiet spell the same day, none at 06:01 for an evening
  still on, one for a new evening the next day. A 429 with `retry_after`
  0.05 waits it and retries once; a 404 is dropped after one request;
  three failing posts of two requests each end `dropped`. The detector
  posts the recap it saves once, and nothing for `day`'s recap saved by
  a forced generate, a second run or the S14 rebuild; a recap saved while
  switched off posts nothing; a 503 twice leaves it pending and the next
  run posts it; a recap that cannot be built counts a try; stale pending
  pings and recaps are dropped. Admin: 401 for a non-admin on both
  endpoints, the URL masked, the generic settings read has no URL, the
  test post one request with or without the switch, 400 with no URL, a
  scheme-less URL called invalid and a closed port "no answer from
  Discord (ECONNREFUSED)", none quoting the URL; an unparsable URL posts
  no ping and writes no row; no captured console line holds the token; a
  post that ends after `stopDiscord()` writes nothing. `gameParse.test.js`:
  `browserPilots` with offline servers, missing games, lobbies, no IP and
  a server listed twice (the first listing counts). `db.test.js`: the
  restore keeps the rows written before it over a backup without the
  table. `apiService.test.ts`: the two new helpers' URLs, method and a
  502's body.
- S18, mutations (`mutate.py` in the scratch folder: each edit on a source
  file, the four test files run, the file restored from a copy named by
  its absolute path; `git status` the same after every run): 32 of 33
  fail a test. The survivor drops the wait for a refresh already under
  way before the recap's rankings (flagged). Two had survived the first
  run (a 5-pilot tick and the rankings' day) and got tests.
- S18, against the stub webhook with plain `node` (so the ES-module
  imports run outside vitest), on a copy of `/tmp/ofc-data` and the real
  server browser answer of 15:28 local (21 servers, 19 online, 0 pilots)
  with two online servers given 3 and 4 players: one ping ("It's on: 7
  pilots in the server browser.", Overloader: Dallas 4 of 8 in the lobby,
  Descentforum.NET 3 of 8 TEAM ANARCHY on Vault), a second tick posting
  nothing. The detector with the thresholds lowered to 1 match and 1
  pilot (no local night passes the real ones) saved and posted
  2026-10-08 (5 matches, 5 pilots, 436 kills, most kills SMILEYGNOME 123,
  most matches WILLIE 4) and 2026-10-07 (14 matches, 14 pilots, 1,069
  kills, BADASS 216, WILLIE 7), each with 10 fields and the rankings of
  the next day (CHEKM8 1639, WD-40 1439, WILLIE 1409, LORD JOHN WARFIN
  1359, all NEW); a second run posted nothing.
- S18, `PORT=3100 DATA_DIR=/tmp/ofc-data npm start` on the built `dist/`
  with `DISCORD_WEBHOOK_URL` at the stub and `SITE_URL=http://localhost:3100`:
  "Startup sync complete." logged; `/api/admin/discord` and its test 401
  without a session; with one, `{"enabled":false,"configured":true,
  "webhook":"http://127.0.0.1:3901/…zzzz",...}`, a test post 200
  `{"ok":true,"status":204}` and, with the stub answering 404, 502
  `{"ok":false,"status":404,"error":"Discord answered 404."}`. The
  thirteen API paths in the prompt all 200 (`total_games: 48`; rivalries
  12 pilots, 25 pairs, 731 kills). `grep` finds the URL's token in none
  of three server logs. SIGTERM logged `[Shutdown] Done.` twice. The
  real browser had 0 pilots all session, so the server itself never
  pinged.
- S18, headless Chrome 154 over CDP (`cdp.mjs`, my own 120-line client
  over Node's WebSocket with Fetch-domain mocks that fulfil, fail or hold,
  held requests failed when the mocks change), 66 checks at 1,280 and 390
  px, 62 pass. The admin card with a real login: the masked URL, no token
  anywhere in the page, the links' origin, the switch saved and kept
  across a reload, "Test post sent.", no overflow, no console errors.
  Mocked: no URL (the instructions, switch and test button disabled, "No
  posts yet"), on with no URL (the switch can be turned off), every post
  status, a failed save moving the switch back with its message, a
  failed test post saying "Discord answered 404.", a 500 showing
  ErrorState and Retry loading it, a held request showing Loading. Pages:
  `/`, `/fight-night`, `/fight-night/2026-10-06`, `/pilots`, `/rankings`,
  `/ladders`, `/rivals`, `/pilot/WD-40`, `/game/78782` and
  `/server/143.110.230.67` load with content, no alert, no overflow and
  no console error but the S1 401. The four failures are `/history` and
  `/maps` at both widths, each logging 404s for four map images that
  overloadmaps.com itself answers 404 for (flagged; no S18 change).
- S18 /code-review found 9 issues: a recap left pending forever once its
  date leaves the detector's window, a message that cannot be built
  never counting a try, a refresh under way handing back stale rankings,
  a recap saved while switched off never posting, a second ping at the
  06:00 rollover, a restore losing newer rows, an unparsable URL burning
  tries, the test route's extra reads, and the switch stuck on with no
  URL plus a stale posts list. All fixed but the switched-off recap, kept
  by decision. /simplify (four agents): one `browserRows` dedupe for the
  stored tick and the ping (the two copies had opposite rules for a
  server listed twice), `count` and `plural` in `matchResult.js`, the
  default origin from `SITE_NAME`, one upsert for the posts, the recap's
  refresh only when a match is newer than the caches, the detector's
  window named once, stale pings dropped by the tick, a smaller test-post
  answer, one status table and a caption function in the card, three
  test cleanups. Skipped: the previous tick read from the database
  instead of memory (a full scan; flagged), a follow-up refresh queued
  inside `refreshPilotStats` for every caller (outside the diff;
  flagged), one shared switch component (the archive toggle is outside
  the diff), the detector's 06:15 served to the card, an `absoluteUrl`
  helper for two joins, the per-tick reads (microseconds).
- S18, sizes on Node 26.11.1 at the end: entry `index-*.js` 233.36 KB raw
  / 74.80 KB gzip (the two admin helpers); `AdminPanel-*.js` 35.18 KB /
  9.32 KB gzip (7.65: the card and its hook); `GameList` 41.67 KB / 11.42
  KB gzip; `FightNightSection` 14.13 KB / 3.05 KB gzip. No new Recharts
  chunk. `npx tsc --noEmit` exits 0. `wc -l`: `discordService.js` 213,
  `discordMessages.js` 119, `repos/discordPosts.js` 30, `AdminDiscord.tsx`
  112, `useAdminDiscord.ts` 67, `gameParse.js` 1,156,
  `fightNightService.js` 537, `migrations.js` 414, `db.js` 248,
  `admin-routes.js` 463, `apiService.ts` 805, `matchResult.js` 57; no new
  file is over 500.
- S18, `docker compose config` on both compose files: `DISCORD_WEBHOOK_URL`
  and `SITE_URL` empty by default and passed through when set.
- S18, CI on PR #19: `check` (tsc, vite build, vitest) passed; the
  Docker `build` job failed twice before building anything, Docker Hub
  answering 429 to the runner's pull of `node:26-alpine`. Locally, `docker
  build` from the cached `node:26-alpine` built the image, which ran as
  uid 1000, reported healthy with `NODE_ENV=production` and a webhook
  URL set, logged no part of the URL's token, and logged `[Shutdown]
  Done.` on `docker stop`.

- S17, first move on Node 26.11.1, on `main` at `5e2d02d` (PR #17
  merged, no owner commits after it; `git diff
  origin/ofc/s16-weapon-meta origin/main` is empty; `10223be` is not an
  object here, so the pre-rewrite check fails as it should): `npx vitest
  run` passed 17 files, 265 tests. `npx vite build` wrote the entry at
  232.87 KB raw / 74.64 KB gzip, `Ladders` 7.54 KB / 2.37 KB gzip,
  `MapLibrary` 35.68 KB / 9.35 KB gzip, `GameList` 41.68 KB / 11.43 KB
  gzip, `PilotDetail` 51.73 KB / 13.42 KB gzip and `GameDetail` 123.91 KB
  / 39.81 KB gzip. `npx tsc --noEmit` exited 0. All match the S16
  records. `wc -l` before building: `gameParse.js` 998, `statsPasses.js`
  706, `statsWorker.js` 115, `analytics/meta.js` 147,
  `pilotTelemetry.js` 449, `migrations.js` 392, `PilotDetail` 924,
  `DamageMatrix` 86, `HeatTable` 66, `MomentumChart` 221, `FightCard` 97,
  `Ladders` 48, `designTokens.js` 88; the two sample files are one line
  each.
- S17, the local data read by a `node` script before building: 43
  matches, 5 with both a kill log and a damage log (78735, 78761, 78764
  Team Anarchy; 78758, 78760 Anarchy; all ranked), 58 directed kill edges
  among 15 pilots, 89 directed damage edges. The damage log has no time
  and no teams, one entry per attacker, defender and weapon.
- S17, the owner's six answers at the start (see the decisions).
- S17, tests: `npx vitest run` passes 17 files, 293 tests (265 at the
  start, 286 before the review fixes). `gameParse.test.js`: the defender on every `weaponKills` entry;
  `opponentsOf` on `teamWithLog` (the four cross-team pairs) and
  `ffaWithLog`, a pilot without a team and a pilot listed twice, a match
  with a damage log and no kill log, nothing for a short or log-less
  match; `damageFlows` on the new `teamWithDamage` (900.75 on opponents;
  the teammate's, the self-damage and the attacker-less entry left out),
  `ffaWithDamage`, an unlisted defender, nothing unranked or log-less;
  `damageGrid` (teams first, the teammate and self-damage kept, `out`
  without self-damage, 915.75 in all, null without a log or a pilot);
  `clutchOf` on `teamWithLog` (first blood STITCH, trailing INSANER at
  0:25, 1:50, 2:10 and STITCH at 0:55, the 3:00 kill the only late one)
  and `ffaWithLog` (level at 0:45 not trailing), the late window's edge
  at exactly `replayLengthOf - 60` and 0.01 s before it, `null` and
  string entries in the log skipped, nothing for short, CTF or log-less
  matches; `rivalPass` (10 rows, every row mirrored, INSANER on MAESTRO 4-0
  with 301 damage, "jftp" from the later match, teammates never a pair,
  the kills and damage adding up to `weaponKills` and `damageFlows`, the
  clutch rows by kind adding up to the clutch matches' kills). `db.test.js`
  through the real refresh, last in the file: the network (15 kills, 1,292
  damage, six pilots by kills then damage, the diagonal null, a teammate's
  damage not a flow, the pairs read from the leader's side), INSANER's and
  STITCH's opponents in order, totals, clutch and everyone's per kind, an
  unknown pilot's empty answer; the restore test drops the two tables too
  and expects both readers empty. `siteRoutes.test.js` and
  `pageMeta.test.js`: `/rivals` reads back, its title and nav section,
  the site description with no pair, "Rivalries from the kill log: A 41-21
  B (3 matches), D 30-10 C (1 match), E 9-9 F (2 matches)." from a mock,
  `og:url` with `?by=damage`.
- S17, mutations (`mutate.py` in the scratch folder: each source file
  copied, edited, three test files run, then restored from the copy), 24
  in all, every one failing at least one test: team kills as edges (5),
  teammate damage as a flow (4), self-damage as a flow (3), unranked
  damage (1), teammates as opponents (3), a level score as trailing (4),
  trailing behind the eventual winner (4), late as the last tenth (4),
  late from `durationOf` (1), clutch in CTF (1), deaths not mirrored (3),
  damage taken not mirrored (2), the first spelling kept (2), clutch
  matches only for killers (2), pairs from the first key (1), pairs both
  ways (1), the grid's total counting self-damage (1), the grid by name
  only (1), first blood from the last kill (3), opponents by matches (1;
  it survived at first, because INSANER's two opponents tie on matches; a
  STITCH assertion was added), the diagonal filled (1), null entries
  replayed (1), pairs needing a kill log (1). A second run of the script
  from stdin resolved its backup folder to the repo and wrote
  `rivals.js.orig` there, which went into the first commit; the review
  caught it, it was byte-identical to the source and was removed, and the
  script now names its folder outright.
- S17, real data from scripts run by plain `node` (so the ES-module
  imports are checked outside vitest) on the local data: `rivalPass` gave
  60 pair rows and 19 clutch rows; the kills over the rows are 577, equal
  to the deaths and to the weapon meta's 577 `weaponKills`; the damage is
  68,738 against 68,739 summed before rounding per pair. The clutch per
  match: 78735 (team) 85 kills, 7 late, 41 trailing; 78758 (FFA) 53, 6,
  22; 78760 (FFA, six pilots) 148, 3, 111; 78761 (team) 123, 10, 59; 78764
  (team) 168, 7, 81.
- S17, dataviz `validate_palette.js --mode dark --surface "#111111"` on
  the back-to-back bars' pair `#3987e5,#898781` (the S16 dumbbell pair):
  the same as S16, lightness band, CVD ΔE 15.9, normal-vision 17.0 and
  contrast pass, the grey fails the chroma floor by design. The heat
  tables use `chart.ramp`; `--ordinal` passes as in S14 (darkest step
  2.33:1).
- S17, `PORT=3100 DATA_DIR=/tmp/ofc-data npm start` on the built `dist/`
  (43 matches): the first start logged "The derived tables have not all
  been built, refreshing stats..." then "[Rivals] 60 rival pairs: 60
  written, 0 removed" and "[Clutch] 19 clutch rows: 19 written, 0
  removed", the other tables "0 written" apart from "[Ratings] 35 daily
  rating snapshots: 35 written" (the startup sync re-read page 1); the
  restart on the final build logged "Cache already warm on startup,
  skipping blocking sync". `/api/stats/global`, `/api/stats/pilots`,
  `/api/pilot/WD-40/stats`, `/api/stats/rankings`, `/api/stats/heatmap`,
  `/api/pilot/WD-40/career`, `/api/stats/regions`,
  `/api/server/143.110.230.67/history`, `/api/stats/weapons`,
  `/api/stats/specialists`, `/api/stats/duels`, `/api/stats/objectives`,
  `/api/pilot/WD-40/weapon-mix`, `/api/health` and the new
  `/api/stats/rivalries` and `/api/pilot/WD-40/rivalry` all answer 200.
  `curl /rivals` gives "Rivalries | overloadfight.club" and "Rivalries from
  the kill log: FUTZPIMMEL 41-21 BADASS (3 matches), FUTZPIMMEL 42-16
  PHOENIX (3 matches), BADASS 25-12 WD-40 (2 matches)."; `og:url` keeps
  `?by=damage`. SIGTERM logged `[Shutdown] Done.`
- S17, headless Chrome 154 over CDP (a 100-line client over Node's
  WebSocket with a Fetch-domain mock list, held requests failed when the
  mocks change, on port 9223 with its own profile; another session's
  headless Chrome on a random port was left alone), `checks.mjs`, 160 of
  160 at 1,280 and 390 px on the final build (119 of 160 on the first run:
  41 were the harness, which read `innerText` under uppercase CSS, looked
  for an `aria-current` the nav does not set, picked a match that the
  tracker hydrates with a damage log as the log-less one, and did not
  filter the known S1 401 on `/api/overload/status`):
  - `/rivals`: the title, Leaderboards lit; one row per pilot (12), every
    kills cell equal to the API, the diagonal empty, coloured cells only
    ramp steps and the rest uncoloured, the largest row share on the last
    step, titles with the share; one row per pair (25), the first read
    from the leader's side; the damage column shown at 1,280 and hidden
    at 390; Damage writes `?by=damage`, a reload shows the damage cells
    equal to the API (12k-style past 10,000), Kills leaves `by` out,
    `?by=bogus` reads as kills. Mocked: 12 long names, 120,000-damage
    cells and 25 pairs no wider than the window; empty (EmptyState with
    the logged-only rule), a 500 (ErrorState, Retry loads it), held
    (Loading).
  - `/pilot/WD-40`: one row per opponent in the API's order, deaths left
    and kills right, both bars on one scale, the opponent's in
    `chart.label` and the pilot's in `chart.series`; the clutch tiles
    equal to the API's shares and counts with everyone's; no new chunk;
    mocked no logged match (EmptyState), a 500 (ErrorState with the weapon
    mix still there, Retry loads it), held (Loading).
  - `/game/78764?tab=damage`: one row per pilot, every cell the summed
    damage log, ramp colours, the diagonal uncoloured, each dealer's
    total; mocked without a damage log: "No damage log".
  - The leaderboard's Rivalries link opens `/rivals` in place.
  - Then `/`, `/history`, `/pilots?min=1`, `/rankings`, `/ladders`,
    `/ladders?board=ctf`, `/server/143.110.230.67`, `/maps`,
    `/maps/BLIZZARD`, `/game/78764`, `/fight-night` and `/pilot/CHEKM8`
    render at both widths with no console errors but the known 401 and no
    wider than the window; the dashboard's first visit requests no
    Recharts chunk.
  - Element shots of the grid, the pairs, the pilot card and the damage
    tab at both widths were looked at. They showed the pairs table
    hiding Matches behind a sideways scroll at 390 px (cell padding now
    `px-2` there; it still scrolls 70 px inside its own box for the
    longest names) and the clutch card repeating the logged-only rule
    (its own text now gives the definitions only).
- S17 /code-review (high) found 10 issues: the mutation backup committed
  at the root (removed); one non-object kill-log entry throwing in the
  worker's replay and stopping both new tables (`replayLog` skips it); a
  match with a damage log and no kill log giving a pair damage and no
  match (`opponentsOf` takes either log); the leader-first swap in two
  places (moved, then replaced by the query below); `DamageMatrix` with
  no players or a nameless player (now `damageGrid`, null for no pilot);
  a dead self-pair guard; a comment promising `pilot_stats_cache`'s
  spelling. Kept and recorded: a blank-defender kill counting for the
  clutch but having no pair (decision); the clutch's second replay and
  `weaponKills` run by two passes (taken up by /simplify below).
  /simplify (four agents): first blood from the clutch replay's first kill
  (one replay, not two), `bestOtherScore` shared by `momentumOf` and
  `clutchOf`, each pair read from the leader's row in SQL (`leaderFirst`
  gone), `damageGrid` and `RIVALS_HINT` in `gameParse.js` and `shortCount`
  in `matchResult.js` (`rivalText.ts` gone), the pass skipping log-less
  matches before the rules' own checks, one word table in `RivalGrid`, one
  field list in `ClutchProfile`, the footer inside the card's body.
  Skipped: `weaponKills` computed once for two passes (the passes stay
  independent so one failing does not stop the other), one latest-spelling
  rule shared with `pilotPass` (flagged), the kept-answer cache moved out
  of `meta.js`, one `killLog` accessor for every reader of the log,
  shared toggle and header components (wider than the diff), the
  network's first read scanning `pilot_rivals` on the main thread (kept
  until the next refresh; check the row count on the NAS).
- S17, sizes on Node 26.11.1 at the end: entry `index-*.js` 233.26 KB raw
  / 74.77 KB gzip (74.64 at the start: the route row and two fetchers);
  `PilotDetail-*.js` 56.92 KB / 14.61 KB gzip (13.42: the kill-log card);
  `GameDetail-*.js` 123.94 KB / 40.03 KB gzip (39.81: `damageGrid` and
  the heat table's import); `MapLibrary-*.js` 34.22 KB / 8.92 KB gzip
  (9.35: `HeatTable` is now its own 1.61 KB / 0.71 KB chunk shared with
  the match page and `/rivals`); `Ladders-*.js` 7.54 KB / 2.38 KB gzip;
  the new `Rivals-*.js` 7.00 KB / 2.38 KB gzip; `GameList` 41.67 KB /
  11.43 KB gzip. No new Recharts chunk anywhere. `npx tsc --noEmit` exits
  0. `wc -l`: `gameParse.js` 1,116, `statsPasses.js` 786,
  `statsWorker.js` 115, `analytics/rivals.js` 80, `meta.js` 147,
  `migrations.js` 395, `db.js` 236, `routes/stats.js` 273,
  `routes/pilots.js` 223, `pageMeta.js` 127, `matchResult.js` 53,
  `apiService.ts` 798, `Rivals` 78, `RivalGrid` 60, `RivalPairs` 40,
  `KillLogRivalry` 38, `RivalBars` 56, `ClutchProfile` 54, `DamageMatrix`
  57, `PilotDetail` 928; no new file is over 500.

- S16, first move on Node 26.11.1, on `main` at `2463b20` (PR #16
  merged, no owner commits after it; the prompt said it was still open):
  `npx vitest run` passed 17 files, 244 tests. `npx vite build` wrote the
  entry at 232.38 KB raw / 74.46 KB gzip, `GameList` 41.68 KB / 11.43 KB
  gzip, `PilotDetail` 47.94 KB / 12.52 KB gzip, `GameDetail` 123.91 KB /
  39.82 KB gzip and `MapLibrary` 29.34 KB / 7.33 KB gzip. `npx tsc
  --noEmit` exited 0. All match the S15 records. `wc -l`: `gameParse.js`
  888, `statsPasses.js` 606, `statsWorker.js` 128, `pilotTelemetry.js`
  449, `analytics/pilots.js` 289, `analytics/global.js` 394,
  `migrations.js` 418, `PilotDetail` 919, `MapLibrary` 854,
  `MomentumChart` 221, `designTokens.js` 83; the two sample files are one
  line each.
- S16, the fixtures and the local data, read by a `node` script before
  building: the 25 sample matches are 20 Anarchy and 5 Team Anarchy with
  no kill or damage log and empty `goals` and `flagStats`; 11 are
  two-pilot matches, all ranked; the detail sample is a one-pilot
  Monsterball with `goals` (one a blunder) and the per-player `goals`,
  `goalAssists`, `blunders`, `returns`, `pickups`, `captures` and
  `carrierKills`. The 40 local matches: 34 Anarchy, 5 Team Anarchy, one
  CTF (a 1v1 with `flagStats: []` and a 0-0 team score); 5 with kill
  logs (16 weapon spellings, "Thunderbolt", "Missile Pod", "Miscellaneous"
  among them); 20 two-pilot matches.
- S16, the owner's three answers at the start (see the decisions).
- S16, tests: `npx vitest run` passes 17 files, 265 tests (244 at the
  start). `gameParse.test.js` (+13): `weaponKills` on `teamWithLog` (10
  kills on opponents, 8 families, INSANER 5 times) and `ffaWithLog`, with
  a suicide, a team kill whose teams come from the players and an
  attacker-less death left out, nothing for a 30-second copy, a log-less
  fixture or null; `duelMatch` on 72090 (OKSTER 5, WD-40 3), a one-a-side
  Team Anarchy copy, and null for CTF and Monsterball copies, a third
  pilot in FFA, a third pilot on no team in a team game, 72102 and a
  30-second copy, a pilot listed twice counting once; `duelPass` on the
  samples (11 duels, OKSTER 3-1-1 against WD-40 mirrored, JFTP 2-0-1
  against ".", WD-40's five and JFTP's four in the snapshots, undated
  duels in neither); `duelLadder` (listed before provisional, rank, the RD
  on the day, no activity window); `objectiveMode`, `addToObjectives` on
  the detail sample's RONCLI (1 goal, 1 blunder) and a CTF line;
  `weaponPass` (map rows and pilot rows both adding up to 24 kills over
  four fixtures, a mixed-case `ascent` folded into ASCENT, a map-less
  logged match in neither). `db.test.js` (+7, through the real refresh):
  the one logged kill on an opponent in the fixtures (STITCH, Impulse,
  90004's map) and not XB1's suicide, in the meta and in STITCH's and
  XB1's mix; the specialist grid (WD-40 on TERMINAL 0-1-1, JFTP's 10
  ranked matches across spellings); the duel ladder (jftp, OKSTER and
  WD-40 listed from five duels with their records, six provisional
  including the career test's LONER and PARTNER, the Monsterball copies
  out, the duel rating not the main one); the boards (BALLER 3-0-0 and
  FRAGGER 0-3-0 on Monsterball by goals then matches then name, CTF
  empty); the S16 tables brought back in line on the next refresh ("1
  written, 1 removed" for a changed and a stray duel record, map_weapons
  rewritten after a delete); the built marker true after a refresh, false
  once deleted, true again. The restore test drops the six S16 tables
  too and expects the marker false and every S16 reader empty after the
  restore. `siteRoutes.test.js` and `pageMeta.test.js`: `/ladders` reads
  back, its title, its nav section, "Duel ladder for <day>: 1. WD-40
  (...), 2. OKSTER (...)" from the two listed sample pilots, `og:url`
  with `?board=ctf`.
- S16, mutations (each file restored from a copy, three test files run):
  `weaponKills` counting suicides and team kills fails 3 tests; ignoring
  the ranked filter 1; not filling teams from the players 1; `duelMatch`
  accepting CTF and Monsterball 2; accepting a third pilot 1 (the first
  version of that mutant survived, because the test only had a third
  pilot in FFA, where `ratingSides` already gives three sides; a team-game
  test was added); the ladder listing everyone 3; `addToObjectives` adding
  nothing 1; `map_weapons` counting each kill twice 3; `pilot_maps` losing
  outcomes 1; a tie scored as a win in the duel records 2.
- S16, real data from a script run by plain `node` (so the ES-module
  imports are checked outside vitest) on a copy of the 40 local matches:
  the refresh took 42 ms and set the built marker; the weapon meta
  counts 577 logged kills on opponents (Falcon, Missile Pod, Hunter 143;
  Thunderbolt 128; Impulse, Cyclone, Reflex 123; Flak, Crusher 70;
  Creeper, Time Bomb 55; Nova, Devastator, Vortex 39; Driller, Lancer 18;
  Other 1) on 5 maps (STRONGHOLD 168, ASCENT 148, SKYBOX V1.2 123,
  KEGPARTY V3 85, ISOTOXIN V3 53); WD-40's mix is 48 kills, 25 Impulse;
  the grid lists 20 pilots (WD-40 23, LORD JOHN WARFIN 22, CHEKM8 12,
  WILLIE 11) on 12 maps (ICEWOLF DEATH MATCH V.1 4, LURK 3, TRUTH OR
  CONSEQUENCES 3); the duel ladder on 2026-10-08 lists CHEKM8 1719 (3-0-2,
  5 duels), WD-40 1570 (5-2-4, 11), WILLIE 1444 (3-3-1, 7) and LORD JOHN
  WARFIN 1347 (2-8-3, 13), with LITHIUM1 and JESS provisional on one
  duel each (their 1v1 CTF is not one); the boards hold the 1v1 CTF's
  two pilots with zero captures and no Monsterball pilot; the power
  rankings are unchanged (CHEKM8 1639, WD-40 1439). The same rows came
  out of the server's refresh ("31 map weapon rows, 67 pilot weapon rows,
  116 pilot map rows, 12 daily duel snapshots, 10 duel records, 2
  objective rows").
- S16, dataviz `validate_palette.js --mode dark --surface "#111111"` on
  the dumbbell's pair `#3987e5,#898781` (chart.series with chart.label):
  lightness band, CVD separation (ΔE 15.9 protan, 11.5 tritan),
  normal-vision floor (17.0) and contrast pass; the chroma floor fails
  for the grey ("reads gray"), which is what a de-emphasis grey is for.
  The two-shade pairs tried first: `#3987e5,#256abf` fails the
  normal-vision floor (9.5), `#3987e5,#6da7ec` the lightness band
  (0.717) and the floor (10.4), `#184f95` the band and contrast. The heat
  tables use the S14 ramp, validated then.
- S16, `PORT=3100 DATA_DIR=/tmp/ofc-data npm start` on the built `dist/`
  (43 matches by the end: the tracker's sync added three during the
  session): the first start logged "The derived tables have not all been
  built, refreshing stats..." then the nine derived-table lines, with the
  six new tables written in full and the S13 to S15 ones "0 written";
  the restart after the simplify pass logged "Cache already warm on
  startup, skipping blocking sync" (the marker row reads the nine table
  names). `/api/health`, `/api/stats/global` (`total_games: 43`),
  `/api/stats/pilots`, `/api/pilot/WD-40/stats`, `/api/stats/rankings`,
  `/api/stats/heatmap`, `/api/pilot/WD-40/career`, `/api/stats/regions`,
  `/api/server/143.110.230.67/history`, `/api/stats/weapons`,
  `/api/stats/specialists`, `/api/stats/duels`, `/api/stats/objectives`
  and `/api/pilot/WD-40/weapon-mix` all answer 200. `curl /ladders` gives
  "Ladders | overloadfight.club" and "Duel ladder for 2026-10-08: 1.
  CHEKM8 (1719), 2. WD-40 (1570), 3. WILLIE (1444)."; `og:url` keeps
  `?board=ctf`. The only errors in the log are the scraper's 404s.
- S16, headless Chrome 154 over CDP (a 130-line client over Node's
  WebSocket with a Fetch-domain mock list), `checks.mjs`, 124 of 124 at
  1,280 and 390 px on the final build (123 of 124 on the first run: a
  hidden-column count that counted display-none cells; fixed in the
  check):
  - `/maps`: the weapon meta has an "All maps" row and one row per map
    (6), one column per family in `WEAPON_FAMILIES` order (8, Other
    present because one Miscellaneous kill exists), every share equal to
    the API, every cell a ramp step or the empty colour, the largest
    share in the table on the ramp's last step, titles with the kills
    behind the share, the blurb naming the leading family and 577
    kills; the specialists grid 20 × 12 with each cell the record under
    3 matches or the win rate in ramp colours, the pilot links, both
    details tables listing every row; no wider than the window, no
    console errors. Mocked: 25 maps and 20 × 12 cells with blanks, the
    page no wider than 390 px with the grid scrolling inside; a failed
    meta (ErrorState, Retry loads it), an empty grid (EmptyState), no
    logged kills (EmptyState), a held grid (Loading).
  - `/pilot/WD-40`: one dumbbell row per family, each reading the pilot's
    share against the community's ("52% vs 21%"), the pilot dot in
    `chart.series` and the community dot in `chart.label` each at its
    share of an axis that ends at the next tenth above the largest share
    (60%), the row title carrying the kills, the table listing every
    family, no radar chunk and only the rating chart's Recharts chunk,
    no wider than the window, no console errors; mocked: no logged kill
    (EmptyState), a 500 (ErrorState with the rest of the page there,
    Retry loads it), a held answer (Loading).
  - `/ladders`: one row per pilot (6), the first "1, CHEKM8, 1719,
    3-0-2", rows linking to the pilot, the provisional divider after the
    4 listed, the title and Leaderboards lit in the nav, the duels button
    pressed, the footer "4 listed, 2 provisional"; RD and Last duel shown
    at 1,280 and hidden at 390; the CTF button writes `?board=ctf` and
    shows the CTF board (2 rows, Captures, Returns, Pickups, Carrier
    kills), a reload keeps it, `?board=monsterball` shows "No ranked
    Monsterball match yet", `?board=bogus` reads as duels, the duels
    button leaves `board` out of the URL. Mocked: 40 pilots with the
    divider after 30 and rank 40 last, 50 CTF pilots by captures, 20
    Monsterball pilots with goals, goal assists and blunders, each no
    wider than the window; a held ladder (Loading), a 500 (ErrorState,
    Retry loads it), an empty ladder (EmptyState), a failed board
    (ErrorState). The leaderboard's Ladders link opens `/ladders` in
    place.
  - Then `/`, `/history`, `/pilots?min=1`, `/rankings`,
    `/server/143.110.230.67`, `/game/78764`, `/fight-night`,
    `/live/143.110.230.67` and `/maps/BLIZZARD` render at both widths with
    no console errors and no wider than the window; the dashboard's
    first visit requests no Recharts chunk.
  - Element shots of the weapon meta, the specialists grid, the weapon
    mix and the ladders at both widths were looked at. They showed the
    grid's row labels scrolling away at 390 px (now pinned) and the
    blurbs calling the ramp's last step "darker" (it is lighter on the
    dark surface; reworded).
- S16 /code-review (high) found 10 issues, all fixed: a duel without a
  date writing a null `last` into a `NOT NULL` column (and skipping every
  table after it), the ladder cache cleared after one of its two tables,
  the empty-table startup check refreshing on every start wherever a
  table stays empty (a built marker now), pilot appearances shown as a
  map's matches, one failed table write stopping the rest, map-less
  logged matches in one weapon table but not the other, three unused
  column constants, 22 queries per specialists request, the community
  totals re-summed per pilot view, a comment stranded above the wrong
  route. /simplify (four agents, 29 findings): one derived-table list
  carrying each table's pass, rows and log line (the worker's and the
  writer's own maps are gone), the worker's diffs on one connection, the
  read caches cleared once after the writes and on a restore, the weapon
  pass as one loop over the log without the scoreboard replay, the duel
  check's cheap tests first, `mapKey` and `matchModeOf` in `gameParse.js`
  (the map pass keys by the same rule), the grid's cells selected by the
  keys already chosen, kept answers for the maps and ladders reads, a
  `useLoad` result that stays the same object so `memo` works, the
  boards built from `OBJECTIVE_MODES`, a `short` name per family, dead
  guards, duplicate parsing and an empty `exec` removed. Skipped: the
  record fallbacks in the ladder (a reader between the first fill's
  chunks can see a snapshot before its record), `pairOutcome` for the
  duel records (the sides' scores are what the rating compares), one
  per-pilot duel table (the pairs keep the matrix possible),
  `hasRatingSnapshots` and `hasRegionMonths` (db.js keeps its keys).
- S16, sizes on Node 26.11.1 at the end: entry `index-*.js` 232.87 KB
  raw / 74.64 KB gzip (74.46 at the start: the route row, five fetchers
  and the lazy import); `MapLibrary-*.js` 35.68 KB / 9.35 KB gzip (7.33
  before: the two grids); `PilotDetail-*.js` 51.73 KB / 13.42 KB gzip
  (12.52 before: the weapon mix); `GameDetail-*.js` 123.91 KB / 39.81 KB
  gzip (unchanged); the new `Ladders-*.js` 7.54 KB / 2.37 KB gzip;
  `GameList` 41.68 KB / 11.43 KB gzip (unchanged); `HeatTable` lands in
  the `MapLibrary` chunk. No new Recharts chunk anywhere. `npx tsc
  --noEmit` exits 0. `wc -l`: `gameParse.js` 992, `statsPasses.js` 706,
  `statsWorker.js` 115, `analytics/meta.js` 140, `analytics/refresh.js`
  165, `migrations.js` 387, `db.js` 227, `routes/stats.js` 271,
  `routes/pilots.js` 210, `pageMeta.js` 115, `apiService.ts` 756,
  `HeatTable` 62, `WeaponMeta` 76, `SpecialistGrid` 83, `WeaponMix` 88,
  `Ladders` 48, `DuelLadder` 70, `ObjectiveBoard` 61, `PilotDetail` 924,
  `MapLibrary` 860, `useLoad` 23; no new file is over 500.

- S15, first move on Node 26.11.1, on `main` at `aa05428` (PR #15
  merged, no owner commits after it): `npx vitest run` passed 14 files,
  220 tests. `npx vite build` wrote the entry at 231.71 KB raw / 74.26 KB
  gzip, `GameList` 40.40 KB / 11.42 KB gzip and `LiveGameDetail` 12.11 KB
  / 3.17 KB gzip. `npx tsc --noEmit` exited 0. All match the S14 records.
  `wc -l`: `routes/browser.js` 28, `useServerBrowser.ts` 70, `GameList`
  712, `ServerStats` 244, `ServerActivitySparkline` 44, `LiveGameDetail`
  349, `analytics/global.js` 394, `gameParse.js` 788, `siteRoutes.js` 94,
  `pageMeta.js` 85, `migrations.js` 357, `maintenance.js` 124,
  `designTokens.js` 73; the two sample files are one line each.
- S15, the tracker's feed on 2026-10-08: `GET
  tracker.otl.gg/api/browser` listed 21 servers, 19 online, none with a
  game at that minute, and no region field. The fixtures' servers and
  today's feed place all but two ("My Overload Server", "The Silken Sad
  Uncertain Server").
- S15, the local data per fight-night day (a `node` script with
  `fightNightDay`, `pilotKey`, `netKills`): 2026-10-05 6 matches, 6
  pilots, 255 kills; 2026-10-06 18, 11, 1,102; 2026-10-07 14, 14, 1,069;
  2026-10-08 2, 2, 71. None meets 16 matches plus 14 pilots or 1,600
  kills; the owner chose to leave the thresholds.
- S15 at the end: `npx vitest run` passes 17 files, 244 tests (220 at
  the start). New: `server/servers.test.js` (ticks, hours, listings,
  offline ticks for an unlisted server, the window, the prune, the region
  share after a refresh and its repair), `server/lib/serverRegions.test.js`
  (every fixture server's region, the region pass on the fixtures, by IP
  and from the latest match), and `gameParse.test.js`'s server-history
  block (`snapshotRow`, `serverSummary` on a Saturday night and across
  the DST day, null rates, `serverWindow`, `regionShare`); the restore,
  share-tag and route tests cover the new tables, `/server/:ip` and
  `/live/:ip`'s name. `npx tsc --noEmit` exits 0. `npx vite build`: entry
  232.38 KB raw / 74.46 KB gzip (+0.20 gzip: the route row, the two
  fetchers), `GameList` 41.68 KB / 11.43 KB gzip (the region card in,
  the heatmap's table out to `HourGrid`), `LiveGameDetail` 11.47 KB /
  2.93 KB gzip (`JoinIp` became a shared chunk), the new `ServerHistory`
  9.52 KB / 3.76 KB gzip, `HourGrid` 3.9 KB raw. The dashboard's first
  visit requests no Recharts chunk (checked in Chrome).
- S15 mutation checks (each source edit restored from a copy): uptime over
  online ticks, in use over all ticks, pilots over all ticks, the earliest
  peak, peak hours from match pilots only, the listing ahead of the
  learned region, a repeated tick counted twice and today inside the
  window each failed 1 to 4 tests. A server listed twice in one answer
  did not, because the raw row's key already ignores the repeat; the
  extra guard was removed.
- S15, `PORT=3100 DATA_DIR=/tmp/ofc-data npm start`: `Startup sync
  complete`; the first start refreshed for the empty `region_months`
  ("No rating snapshots, career months or region months on startup").
  The timer stored 21 servers a minute (168 rows after 8 ticks). After a
  refresh, `region_months` for 2026-10 holds North America West 22,
  Oceania 7, North America East 6, Europe 2, North America Central 2,
  Unknown 1 (114.75.24.117, "My Overload Server"); the two Ashburn
  matches stored without a server took the region of that IP's other
  matches, and the two Amsterdam 1 matches without one took the
  listing's. `/api/stats/global` (40 matches), `/api/stats/pilots` (24),
  `/api/pilot/WD-40/stats`, `/api/stats/rankings`, `/api/stats/heatmap`,
  `/api/pilot/WD-40/career`, `/api/health`, `/api/stats/regions`,
  `/api/server/143.110.230.67/history` and `/api/browser` all answer 200.
  `/server/143.110.230.67` serves `og:title` "Server: San Francisco 1"
  and `og:description` "San Francisco 1 (North America West). Join at
  143.110.230.67." (no whole day of ticks yet); `/live/143.110.230.67`'s
  `<title>` is "Live: San Francisco 1". SIGTERM logged `[Shutdown] Done.`
  and no tick after it.
- S15 `checks.mjs`, headless Chrome 154 over CDP at 1,280 and 390 px,
  100 of 100: the server page on a real local server (header, region,
  join IP, the tab title, "No ticks in the last 30 days", the 24 hours
  drawn, `?days=7` by click and after a reload, 30 left out of the URL);
  a mocked year at 30 and 365 days (each card equal to `serverSummary` on
  the mock, 168 titled cells in ramp colours only, the busiest line, the
  24-hour line broken at a 10-minute gap, the hours table); a server never
  seen, a 500 and a held answer (EmptyState, ErrorState with Retry,
  Loading); the dashboard's region card on local data (legend = regions
  present) and on 88 mocked months (one column each, opens on the latest
  month, only `chart.region` colours, titles with shares and "no
  matches", the table's rows), failed, empty and held; no Recharts on the
  dashboard's first visit; every server-browser row and card with a
  history link (21 of 21 with idle servers shown); the live page's link
  to the history in place, Back to the live page; then `/`, `/history`,
  `/pilots`, `/rankings`, `/pilot/WD-40`, `/game/78735`, `/fight-night`
  and `/live/143.110.230.67` rendering with no console errors and no
  wider than the window. A separate run with the live list mocked empty
  kept the stored name in the tab title and the header up while another
  window loaded. Screenshots of the mocked year at both widths and the
  dashboard read as expected.
- S15 dataviz `validate_palette.js --mode dark --surface "#111111"` on
  `chart.region`'s seven hues: every check passes (worst adjacent CVD ΔE
  8.4, normal-vision ΔE 19.3).
- S15 /code-review found 10 issues; all fixed: the 24-hour chart drawn
  against the browser clock, the page blanked while a window loads, the
  tab title losing the stored name, a server dropped from the list
  keeping its uptime, a failed `servers` read stopping every pass, the
  region learned from the last file read rather than the latest match, a
  browser entry without `server`, a per-request scan of every server's
  day (key now `(ip, at)`, a summary-only read for the share tags), a
  tick written after shutdown, and a partial listing wiping the name.
  /simplify (four agents): `monthsTo` and `atClock` in `gameParse.js`,
  one `percent`, `chart.region` from `chart.weapon`, the hours table from
  `server_hours`, summaries kept per day, a key-range prune, region names
  read once per server in the worker, `App` the one title writer,
  memoised page parts, unread fields and columns dropped; three skipped
  (see the flags).

- S14, first move on Node 26.11.1, on `main` at `e35672a` (PRs #13 and
  #14 merged): `npx vitest run` passed 14 files, 193 tests. `npx vite
  build` wrote the entry `index-DHFRW1S6.js` at 231.49 KB raw / 74.16 KB
  gzip, `PilotDetail-*.js` 40.33 KB / 9.99 KB gzip and `GameList-*.js`
  54.96 KB / 15.48 KB gzip. `npx tsc --noEmit` exited 0. All three match
  the Node 26 records. `wc -l`: `gameParse.js` 608, `fightNightService.js`
  487, `repos/games.js` 458, `analytics/global.js` 384,
  `analytics/pilots.js` 289, `pilotTelemetry.js` 449, `statsPasses.js`
  536, `backup.js` 43, `maintenance.js` 105, `App.tsx` 291, `GameList`
  711, `ActivityGraph` 175, `GlobalActivityChart` 93, `PilotDetail` 912,
  `RatingCard` 99, `RatingChart` 90, `designTokens.js` 59. The sample
  files are one line each.
- S14, the time-zone question: asked before building. The owner chose
  America/Chicago and a 06:00 rollover.
- S14, tests: `npx vitest run` passes 14 files, 220 tests (27 new).
  `gameParse.test.js`: the rollover at 05:59 and 06:00 in CST and CDT;
  the fixtures' evening (72084 to 72094, 21:24 to 02:49 Chicago time) on
  one fight-night day; `localClock` weekday and hour; `dayBounds` at 24,
  23 (2026-03-07) and 25 hours (2026-10-31), null for 2026-02-30,
  2026-13-01, `foo` and `2026-10`; `dayStart`, `DAY_HOURS` and the day
  wording; the heatmap cells of the 25 fixtures (Sunday 21:00 2, Monday
  01:00 5 and 02:00 4 on Sunday's row, Monday 13:00 to 16:00 2, 8, 3, 1);
  the 12-week window; calendar days (11 on 2025-11-23, 14 on
  2025-11-24) and the Monday 52 weeks back; `careerMonth` across a month
  end; months from `pilotPass` adding up to its career rows for every
  fixture pilot (JFTP 1 in November, 7 in December when half the
  fixtures move a month); `careerSeries` filling gaps up to this month
  with null rates; `winRate`; `nightRatingChange`; `lastOuting` for WD-40
  on the Sunday night (3W 5L 1T, 87 kills, 92 deaths, Combat Ratio 1.01,
  nine matches newest first), a team result, a no-result match, a pilot
  not there. Two S13 rating tests moved with the day: 72090 and WD-40's
  first nine matches are on 2025-11-23 now. `db.test.js` through the
  real refresh: months adding up to `pilot_stats_cache` for JFTP (and
  "jftp "), WD-40, MAESTRO and BALLER; WD-40's calendar (9 the evening
  before `day`, 1 on `day`) and JFTP's matching the match-list count;
  WD-40's last time out (72105: 2 kills, 6 deaths, 2 assists, Combat
  Ratio 0.5, the rating change against the evening before, the recap
  link once a recap exists); B2AF's first rated night against 1500; no
  rating change for a night with no rated match; an unknown pilot; a
  refresh restoring a changed month and removing a stray one ("1
  written, 1 removed"); the heatmap equal to `heatmapCells` over the
  same days and moving with the window; the year of daily counts
  starting at 06:00 on a fight-night day, not at UTC midnight (with the
  clock set a year on); the recap rebuild removing a UTC-keyed recap,
  keeping one 400 days old, saving exactly the qualifying days and
  running once; a restore of a copy without `pilot_months`.
  `backfill.test.js`: the fight-night day runs from 06:00 Chicago time to
  the next 06:00 (a game 1 ms before the end is in, one at the end is
  out); the qualifying scan counts the fixtures' evening as one day.
- S14, mutations (each run, then the file restored from a copy): a
  midnight rollover fails 14 tests; the calendar day instead of the
  fight-night day 13; months not counted 2; the recap rebuild running on
  every start 1; the rating change read from an older day 1; no gap
  months 1; the series stopping at the last month played 1; the year
  window from UTC midnight 1; an invalid month accepted by `dayBounds` 1.
  The first versions of the gap and older-day mutants survived (a broken
  edit, then no test with an unrated last night); tests were added for
  both.
- S14, real data from scripts run by plain `node` (so the ES-module
  imports are checked outside vitest), on the 40 local matches:
  `pilot_months` from `pilotPass` equals the server's table (23 of 23
  rows), `rating_snapshots` from `ratingPass` equals the table (32 of
  32), and all 23 pilots' months add up to `pilot_stats_cache`.
  Fight-night days: 2026-10-05 6 matches, 10-06 18, 10-07 14, 10-08 2
  (UTC days: 1, 7, 22, 10). `EXPLAIN QUERY PLAN`: the calendar's dates
  and the night's games use the covering `idx_game_players_name_date` in
  both files and the games' primary key; the heatmap is `SEARCH games
  USING COVERING INDEX idx_games_date`; the months `SEARCH pilot_months
  USING PRIMARY KEY`.
- S14, synthetic history (75,000 matches 2019 to 2026, 400 pilots, 2 to 8
  a match, a third team games), `pilotPass` on this Mac: 0.62 s with the
  months against 0.58 s on `main`'s code, 2,947 month rows, heap 81 MB
  against 66 MB (most of it the per-hour day cache); `localClock` for
  75,000 dates with the cache warm, 68 ms.
- S14, ramp: dataviz `validate_palette.js "#184f95,#256abf,#3987e5,#6da7ec,#9ec5f4" --ordinal --mode dark --surface "#111111"`:
  lightness monotone, adjacent steps at least 0.06 apart, the darkest at
  2.33:1, hue spread 3°, all pass.
- S14, server (`PORT=3100 DATA_DIR=/tmp/ofc-data npm start` on the
  built `dist/`, after `Startup sync complete`): the first start over the
  S13 data logged "No rating snapshots or career months on startup", then
  "[Ratings] 32 daily rating snapshots: 11 written, 4 removed" and
  "[Career] 23 pilot months: 23 written". After the review fixes the next
  start logged "Days now count America/Chicago from 6:00: removed 1
  recaps of the last 365 days, saved 0", and the one after that skipped
  the rebuild. The detector is scheduled for 2026-10-09T11:15:00Z (06:15
  CDT). `/api/health` `{"status":"ok"}`, `/api/stats/global`
  `total_games: 40`, `/api/stats/pilots` 24 pilots (top WD-40, 23
  matches), `/api/pilot/WD-40/stats` 23 matches and 380 kills,
  `/api/stats/rankings` day 2026-10-08 with WD-40 first,
  `/api/stats/heatmap` 38 matches from 2026-07-16 (today left out),
  `/api/pilot/WD-40/career` one month (23 matches, 26.1%, 0.76, 1.15),
  three calendar days and last time out on 2026-10-07. For the browser
  checks a recap for 2026-10-06 was forced with
  `generateRecapForDate('2026-10-06', true)`.
- S14, headless Chrome 154 over CDP, `checks.mjs`, 124 of 124 before
  the review fixes, 148 of 148 after them and after /simplify (the
  Tokyo run added):
  - Dashboard at 1,280 and 390 px, local data and a mocked year: the
    7×24 counts equal `/api/stats/heatmap` with columns from 06:00, every
    cell is `rampColor(count, max)`, only the current Chicago hour is
    outlined, the busiest line ("Saturday 21:00, 72 matches" mocked;
    "Monday night, 04:00" locally) and the cell titles ("Monday night,
    02:00: ..."), the heatmap under the teaser and above Recent Matches,
    the page no wider than the window. Loading while the request is held,
    ErrorState on a 500 and Retry loading it, EmptyState for 12 empty
    weeks. `/history` shows the timeline chart and no hour chart.
  - `/pilot/WD-40` at 1,280 and 390 px, real and mocked (30 months with
    gaps, 8 matches on the last night, a recap, -12.4 rating): the day
    and "yesterday" / "2 days ago", the night's five newest matches as
    links in order, the recap link only with a recap, record, kills,
    deaths, Combat Ratio, "▼ down 12.4", "3 more in the match list",
    four sparklines, the last-month numbers, one calendar cell per day
    (371 or fewer) with the filled ones exactly the days with matches,
    the calendar scrolled to the latest week, Last Active as the
    fight-night day, "Career by month" listing each month played, no
    wider than the window. Loading, ErrorState with the rest of the page
    still there, Retry, EmptyState with no match, "No ranked match yet"
    beside the rest.
  - The same dashboard and pilot checks with the browser in Asia/Tokyo:
    the same cells, days and labels.
  - `/rankings` (WD-40 first, no wider than the window),
    `/pilots?min=1`, `/game/78764` ("Split decision"), `/fight-night/2026-10-06`.
    No console errors anywhere.
  - Element shots of the heatmap and the career block, local and mocked,
    at both widths, were looked at. They caught a one-month sparkline
    sitting on its baseline, monthly bars running together at 390 px and
    "Monday 04:00" reading as Monday morning; all three fixed.
- S14, sizes on Node 26.11.1 after /simplify: entry `index-*.js` 231.71
  KB raw / 74.26 KB gzip (74.16 before: the two fetchers and their
  types); `GameList-*.js` 40.40 KB / 11.42 KB gzip (54.96 / 15.48
  before: `ActivityGraph` gone, the timeline chart lazy in its own
  `GlobalActivityChart-*.js`, 15.41 / 5.06); `PilotDetail-*.js` 48.79 KB
  / 12.77 KB gzip (40.33 / 9.99 before: the career block). The
  dashboard's first visit now loads no Recharts chunk (from the browser's
  resource list: entry, `GameList`, `gameParse`, `designTokens`,
  `RampLegend`, `useLoad` and icons). Before, `GameList` imported both
  chart components statically, so it pulled `BarChart`, `CartesianChart`
  and `Area` (S4 measured the `BarChart` load). `npx tsc --noEmit` exits
  0. `wc -l`: `gameParse.js` 788, `statsPasses.js` 554, `statsWorker.js`
  103, `analytics/career.js` 77, `analytics/global.js` 394,
  `analytics/refresh.js` 152, `migrations.js` 357, `maintenance.js` 124,
  `fightNightService.js` 511, `GameList` 712, `PilotDetail` 919,
  `ActivityHeatmap` 105, `CareerArc` 107, `ActivityCalendar` 75,
  `LastTimeOut` 76, `CareerCard` 38, `DetailsTable` 33, `RatingCard` 75,
  `RampLegend` 15, `designTokens.js` 73.

- Node 26, first move: `nvm install 26` reported v26.11.1 already
  installed. `origin/main` was `d7a81eb` (2026-10-08T10:28:17-05:00), as
  expected.
- Node 26, install, on 26.11.1 (npm 11.20.0): `npm install
  better-sqlite3@^13.0.3 @types/node@^26` resolved 13.0.3 and 26.6.4.
  The lockfile lost 30 entries (`prebuild-install`, `bindings` and their
  dependencies) and gained `node-addon-api`. Then `rm -rf node_modules
  && npm ci` exited 0. better-sqlite3 13 has no install script, sets
  `"gypfile": false` and has no `hasInstallScript` in the lockfile, yet
  npm 11.20 still ran the implicit `node-gyp rebuild` that a
  `binding.gyp` triggers (its warning names it, and `build/` appeared).
  Nothing compiled: `binding.gyp` makes both targets
  empty when `lib/binding.js` finds a matching prebuild, and
  `build/Release` held two stamp files, no `.node` and no `.o`. The
  module loaded `prebuilds/darwin-arm64.node` and `select
  sqlite_version()` returned 3.53.4. npm warns that the install scripts
  of better-sqlite3, esbuild and fsevents are "not yet covered by
  allowScripts" and runs them anyway.
- Node 26, tests on `d57a852` (the code commit; the same files were
  tested before it was made): `npx vitest run` passed 14 files, 193
  tests on 26.11.1 (705 ms), then without reinstalling on 24.6.0 (954
  ms) and on 22.17.0 (751 ms). Each run was under `timeout 300`; after
  them `pgrep -fl vitest` showed no process from this worktree. It did
  show two vitest fork workers (PIDs 82600 and 84696, Node 24.6.0) from
  the `lush-sun-807e9623` worktree, at 99% CPU after 1 h 19 min. They
  are not from this branch and were left running; cause not
  investigated (flagged).
- Node 26, types and build on 26.11.1: `npx tsc --noEmit` exited 0 with
  `@types/node` 26.6.4 and TypeScript 5.8.3. `npx vite build` wrote the
  entry `index-DHFRW1S6.js` at 231.49 KB raw / 74.16 KB gzip and
  `PilotDetail-*.js` at 40.33 KB / 9.99 KB gzip, the same as S13.
- Node 26, server on 26.11.1: `PORT=3100 DATA_DIR=/tmp/ofc-node26 npm
  start` on an empty folder logged `Startup sync complete.` after about
  2 s (25 matches from the tracker's page 1). `/api/health` answered
  `{"status":"ok"}`, `/api/stats/global` `total_games: 25`,
  `/api/stats/pilots` 18 pilots and `/api/stats/rankings` day
  2026-10-08 with 2 ranked pilots; the stats worker wrote 20 rating
  snapshots. SIGTERM logged `[Shutdown] Done.`
- Node 26, image, on this Mac (Docker 29.2.1, arm64): `docker build
  --no-cache -t ofc-node26 .` exited 0 on `node:26-alpine` (Node 26.10.0
  in the image). In the build stage `npm ci` ran the same implicit
  `node-gyp rebuild` and compiled nothing: the image has 0 `.o` files
  under better-sqlite3's `build/` and loads
  `prebuilds/linuxmusl-arm64.node` (SQLite 3.53.4). Three scratch builds
  of `node:26-alpine` plus `npm ci` showed which tools that step needs:
  with no toolchain `npm ci` fails with "gyp ERR! configure error ...
  Could not find any Python installation to use"; with python3 alone it
  fails with "gyp ERR! stack Error: not found: make"; with python3 and
  make it exits 0, make enters and leaves the empty build folder, and no
  object file is written. So python3 and make are used and g++ is not
  (flagged).
- Node 26, container: `docker run` with `ADMIN_PASSWORD` and
  `SESSION_SECRET` set was `healthy` 5 s after start, `id` gave
  `uid=1000(node)`, `/api/health` answered ok. `docker stop` exited 0
  in 0.21 s, the exit code was 0 and the log ended `[Shutdown] Done.`
  The image is 599 MB (598,778,245 bytes) against S6's 567 MB:
  `node:26-alpine` is 180 MB against 164 MB for `node:22-alpine`, and
  better-sqlite3 13 carries 16 MB of prebuilds for eight platforms.
  Container and image removed afterwards.
- Node 26, the step 5 `git grep` (Node versions, `nvm`,
  `NODE_MODULE`, better-sqlite3 versions): outside this file it now
  finds Node 26 in `README.md`, `ci.yml` and the Dockerfile, and Node
  22 only in `docs/overload-fight-club-roadmap.html` (the plan dated
  2026-10-06, left as written). In this file Node 22 and 24 remain only
  in dated records: session-log lines, Validated entries, the S6
  Done-when, the S6 decisions (marked superseded) and the resolved
  postmortems.
- Node 26, PR #14 checks on `16f6ba3` (the merge of `411d04e` into
  `d7a81eb`): CI (`check`) passed in 41 s on
  Node 26.11.1 x64 from `actions/setup-node` (14 files, 193 tests).
  docker-publish (`build`) passed in 2 min 26 s, building linux/amd64
  with `push: false`. Its `npm ci` step took about 13 s and warned
  about the same uncovered better-sqlite3 install script; the log does
  not show whether that step compiled.
- Node 26, `npm audit`: 30 findings (1 low, 7 moderate, 19 high, 3
  critical), the same count as `main`'s lockfile.

- S13, first move on Node 22.17.0, on `main` at `6bdeb97` (PR #12
  merged): `npx vitest run` passed 14 files, 156 tests. `npx vite build`
  wrote the entry `index-CuixDkA6.js` at 230.81 KB raw / 73.91 KB gzip,
  `PilotDetail-*.js` 36.39 KB / 8.84 KB gzip and `PilotsList-*.js` 17.19
  KB / 5.03 KB gzip. `npx tsc --noEmit` exited 0. All three match the S12
  records. `wc -l`: `gameParse.js` 375, `analytics/pilots.js` 290,
  `migrations.js` 311, `analytics/refresh.js` 110, `statsPasses.js` 526,
  `backup.js` 43, `PilotsList` 583, `PilotDetail` 905, `MomentumChart`
  221, `designTokens.js` 57. The sample files are one line each.
- S13, tests: `npx vitest run` passes 14 files, 189 tests (33 new). In
  `server/lib/gameParse.test.js`: `rankedMatch` on 72087 (84 s), a
  one-pilot copy, a 59 s copy and the detail sample; `ratingSides` on
  72102 (BLUE 42 PHOENIX and INSANER, ORANGE 35) and 72108 (four FFA
  sides by score), none for a team game without `teamScore`, a pilot
  listed twice playing once, a team pilot without a team sitting out,
  one team with pilots giving none; `glicko2` on Glickman's worked
  example (1464.05, RD 151.52, volatility 0.05999; the paper prints
  1464.06) and RD growth with no games; `ratingSnapshots`: one 1v1 win
  between new pilots (72090: OKSTER 1662.3, WD-40 1337.7, both RD
  290.3, the published Glicko-2 values), a team moved by `teamScore`
  (72102: both BLUE pilots 1662.3 though STITCH outscored INSANER), a
  2-2 draw (72098, both 1500), a 4-pilot FFA of new pilots worth one win
  (1662.3), FFA placement in order, a win beside a strong teammate
  paying less than one beside a weak one, the 25 sample matches giving
  the same rows forward and reversed (B2AF 1279.7 and BEHEMOTH 1720.3 on
  the Chicago day 2025-11-23, WD-40 one row with 10 matches), RD growing
  over a year off but staying under 350, a pilot sweeping and swept by
  turns in 300 8-pilot FFAs keeping volatility under 0.07, the latest
  spelling, a match without a date skipped; `ratingDay` across CST and
  CDT; `shiftDay` across months; `rankStatus`, `rdOn` (80 grows to 92.6
  over 20 days, 350 after ten years), `powerRankings` (9 matches out, 28
  days in, 29 out, ties by matches), `rankingMovement` (NEW, 0, -2, -1,
  25 listed). In `server/db.test.js` (fixture games through the real
  refresh and worker): JFTP and "jftp" one history of 10 matches; the
  1v1 Monsterball winner on goals above 1500; an empty history for
  NOBODY; JFTP, STITCH and WD-40 the only pilots with 10 rated matches,
  all NEW; PHOENIX provisional, JFTP inactive 33 days on; a second
  refresh writing 1 row and removing 1 after a row was changed and a
  stray one added, then removing 4,500 stray rows in three chunks; ranks
  unchanged a week on, nobody ranked 29 days after; PHOENIX ranked once
  a tenth match is saved and refreshed. `siteRoutes.test.js`:
  `/rankings` reads back, its title, `navSection`. `pageMeta.test.js`:
  "Power rankings for <day>: 1. WD-40 (rating)."
- S13, mutations (each run, then the file restored): no RD growth for
  idle days fails 1 test; the pilot's own rating in place of the side's
  mean fails 1 (the first version of that test passed on the mutant and
  was rewritten); a draw scored as a win fails 1; no 28-day window fails
  2; the weight of 1 / (sides - 1) removed fails 2; `clearRankings()`
  removed from the refresh fails 1.
- S13, review fixes (/pr-review, three reviewer agents), tests: 4 added
  and 3 tightened. `gameParse.test.js`: Glickman's volatility to six
  places (0.059996); the RD at 350 before a match two years off, as one
  year off; matches on one date replayed in id order; a side's RD the
  root mean square of its pilots' (checked through `glicko2`); a tie on
  rating and matches broken by pilot. `db.test.js`: reads seen between
  the 4,500-row chunks; a 2020 match from cold.db rated with BALLER's hot
  ones; a restore of a copy without `rating_snapshots` leaving the table
  empty and no ranking held in memory. Ten mutations, each failing the
  test written for it: no volatility step, no RD cap, no id order, the
  side's RD a plain mean, the name order reversed, one transaction, no
  yield between chunks, cold.db skipped by the rating pass, and either
  line removed from `restoreHot`. `npx vitest run`: 14 files, 193 tests.
  `npx vite build`: entry 231.49 KB raw / 74.16 KB gzip, `PilotDetail-*.js`
  40.33 KB / 9.99 KB gzip. `npx tsc --noEmit` exits 0.
- S13, real data from a script run by plain `node` (so the ES-module
  import is checked outside vitest), on the 40 local matches: 39 rated
  (78741 had one pilot), 5 with teams (one CTF), up to 6 sides; its 29
  snapshot rows are the same as the 29 the server's worker wrote. On
  that data: WD-40 1439.1 (RD 99.4 today, 23 rated matches) and LORD
  JOHN WARFIN 1375.5 are the two ranked pilots, both NEW; RAZOR is 1742
  but provisional with 4.
- S13, synthetic history (75,000 matches 2019 to 2026, 400 pilots, 2 to
  8 a match, a third team games), before the weight: the busiest pilot's
  volatility reached 5.45, RD 423.8 and rating 5e46 at match 11,081.
  After it: no volatility above 0.0601, no RD above 291.3, 288,766 daily
  rows. On this Mac: sides 0.2 s, replay 0.48 s and the comparison with
  the stored table 0.77 s (all in the worker), 2.3 ms on the main thread
  for a refresh adding 50 matches, 0.60 s in all for the first fill
  (written in 2,000-row chunks). The rankings query is a scan of the
  primary key, 25 ms for 400 pilots; a pilot's history 3 ms.
- S13, chart colour: the dataviz `validate_palette.js --mode dark
  --surface "#111111"` passes `chart.series` `#3987e5` (lightness band,
  chroma floor, 3:1 contrast; slot 1, already passed as BLUE in S12).
- S13, headless Chrome 154 over CDP against `PORT=3100
  DATA_DIR=/tmp/ofc-data npm start` serving the built `dist/` (40
  matches), `checks.mjs`, 68 of 68 before the review, 71 of 71 after
  the review fixes, 75 of 75 after /simplify, each at 1,280 and 390 px:
  - `/rankings` on the local data: one row per ranked pilot, the first
    row "1, NEW, WD-40, 1439", the title "Power rankings |
    overloadfight.club", the day and week in the header, Leaderboards
    lit in the nav, no wider than the window.
  - `/api/stats/rankings` mocked with 25 pilots: movement cells NEW, ▲3
    ("Up 3"), ▼1 ("Down 1"), – ("No change"), ▲12; RD and Last match
    hidden at 390 and shown at 1,280 (the Chicago day, 2026-10-07); "31
    pilots ranked"; one Tab stop per row; a click on a row's rating opens
    `/pilot/WD-40` in the same document. Loading while the request is
    held, ErrorState on a 500 and its Retry loading the table, EmptyState
    with no ranked pilot.
  - `/pilot/WD-40`: the card reads the API's rating, ±2 RD, RD, "23
    rated matches" and "#1 in the power rankings"; the band is a 10%
    fill and the line `#3987e5`; the chart's label names the first and
    last day; `RatingChart-*.js` loads as its own chunk; the "Rating by
    day" table equals the history; the hover tooltip shows the last day,
    its rating and ±2 RD; the rating request starts before `/stats`
    answers and a mode change makes no second one. Mocked: 300 days
    (month ticks, "Not ranked", "1,200 rated matches"), one day (a dot,
    "Provisional: 4 of 10"), rank 40 at 1810 (shown, not linked, the
    1500 line drawn), no rating (EmptyState), a 500 (ErrorState, the rest
    of the page still there).
  - `/pilots?min=1`: the 23 cached pilots, no wider than the window
    (521 px at 390 before the tab bar wrapped), the Power rankings link
    opens `/rankings` in place. `/game/78764`: "Split decision" and the
    momentum chart. No console errors on any of these.
  - Full-page shots of the rankings (local and mocked), the pilot page
    (real and 300 mocked days), the leaderboard and the rating card were
    looked at. The first shots showed the step line hiding the last
    day's rating and odd Y ticks (1100, 1300, 1500, 1750); both fixed.
- S13, sizes on Node 22.17.0 after /simplify: entry `index-*.js` 231.49
  KB raw / 74.17 KB gzip (73.91 before: two fetchers, the route, the nav
  section); `PilotDetail-*.js` 40.21 KB / 9.94 KB gzip (36.39 / 8.84
  before: the rating card); `PilotsList-*.js` 17.49 / 5.09;
  `PowerRankings-*.js` 4.03 / 1.49; `RatingChart-*.js` 2.66 / 1.32. The
  pilot page now also loads the shared Recharts chunk
  (`CartesianChart-*.js`, 309.78 KB / 91.72 KB gzip) for the chart,
  after it renders. With Recharts' `Line` the pilot chunk was 51.62 KB /
  14.18 KB gzip. `npx tsc --noEmit` exits 0. `wc -l`: `gameParse.js`
  608, `statsPasses.js` 536, `statsWorker.js` 92, `analytics/ratings.js`
  56, `analytics/refresh.js` 138, `migrations.js` 333, `PowerRankings`
  95, `RatingCard` 95, `RatingChart` 90, `useLoad` 21, `PilotDetail`
  912, `PilotsList` 586, `apiService.ts` 570.
- S13, server (same command, after `Startup sync complete`):
  `/api/health` `{"status":"ok"}`, `/api/stats/global` `total_games: 40`,
  `/api/stats/pilots` 24 pilots (top WD-40, 23 matches),
  `/api/pilot/WD-40/stats` 23 matches and 380 kills. `curl /rankings`
  gives "Power rankings for 2026-10-08: 1. WD-40 (1439), 2. LORD JOHN
  WARFIN (1376)." The admin refresh button now logs one pass ("[Ratings]
  29 daily rating snapshots: 0 written, 0 removed."); before the fix it
  logged three. On a fresh data folder (`PORT=3101`) the table was
  created with its seven columns and filled by the first refresh (20
  rows, 18 pilots).

- S12, first move on Node 22.17.0, on `main` at `5a09e5c` (PR #11
  merged): `npx vitest run` passed 14 files, 136 tests. `npx vite build`
  wrote the entry `index-D50PdjZf.js` at 230.84 KB raw / 73.94 KB gzip
  and the match page's `GameDetail-*.js` at 135.67 KB raw / 42.25 KB
  gzip. `npx tsc --noEmit` exited 0. All three match the S11 records.
  `wc -l`: `GameDetail` 307, `MatchAnalysis` 190, `ScoreChart` 120,
  `MatchReplay` 1,970, `gameParse.js` 180, `designTokens.js` 26.
- S12, the kill-log rules on real data, from a script run by plain `node`
  (so the ES-module import is checked outside vitest) on the stored
  details of the four local matches with kill logs: 78735 (Team Anarchy,
  86 entries, 1 suicide), 78760 (Anarchy, 148), 78761 (Team Anarchy,
  125, 2 suicides), 78764 (Team Anarchy, 169, 1 suicide). For all four,
  `scoreboardAt(game)` gives every pilot's `kills`, `deaths` and
  `assists` and every team's `teamScore` exactly as the tracker stored
  them. Verdicts: 78735 split decision (43–41), 78760 decision, 78761
  decision (ORANGE 64–57), 78764 split decision (87–80). Lead changes:
  4, 0, 1, 3. First blood: KAUMRAPSEL (Thunderbolt, 0:08), BADASS
  (Hunter, 0:05), BADASS (Thunderbolt, 0:07), BADASS (Flak, 0:14).
- S12, tests: `npx vitest run` passes 14 files, 156 tests (20 new). In
  `server/lib/gameParse.test.js`: `killPoints` for a kill, a suicide
  (case and spaces ignored), a team kill, the same team label in FFA, no
  attacker; the 72099 and 72098 kill logs replay to their players' kills,
  deaths and assists and to BLUE 6–4; the order of the log does not
  matter; the scoreboard at second 55 and at 0; a kill at 52.5 counts at
  second 52; RONCLI's suicide in the detail sample gives -1 to him and to
  BLUE; a team kill; lead changes at 0:40, 1:10 and 2:30 in 72099 and at
  0:45 in 72098; two FFA pilots trading the lead while the winner trails;
  momentum margins after every kill, and against 0 before a second
  side has scored; null momentum and lead changes with no log and for
  Monsterball; first blood skipping a suicide; weapon
  families (16 weapons, none twice); `replayLengthOf`; the verdict on
  seven fixture games and two variants. In `matchResult.test.js`:
  `clock`. The kill logs are written by hand onto fixtures 72099 and
  72098 in `server/testFixtures.js` (the samples have none).
- S12, chart colours: the dataviz skill's `validate_palette.js` with
  `--mode dark --surface "#111111"`: the seven weapon-family hues pass
  every check (worst adjacent CVD ΔE 8.4 protan, normal-vision ΔE 19.3,
  all in the L 0.48–0.67 band, chroma ≥ 0.1, ≥ 3:1 contrast); BLUE
  `#3987e5` and ORANGE `#d95926` pass (ΔE 26.8); Tailwind's `#60a5fa` and
  `#fb923c` fail the lightness band as marks.
- S12, headless Chrome 154 over CDP against `PORT=3100
  DATA_DIR=/tmp/ofc-data npm start` serving the built `dist/` (35
  matches by the end), `checks.mjs`: 71 of 71 before the review, then 76
  of 76 (five checks added for the review's findings) after the review
  fixes and again after /simplify:
  - On 78764 (Team Anarchy) and 78760 (FFA), each at 1,280 and 390 px:
    the final table equals the tracker's numbers; Home on the focused
    slider goes to 0:00 (`?t=0`, every row 0, Damage and DPM "–");
    setting 300 gives the table `scoreboardAt(game, 300)` computes in
    `node` (names, order, kills, assists, deaths, Combat Ratio) and
    `?t=300`; five ArrowRight presses give `?t=305`; a reload of
    `?t=305` keeps the label ("5:05, BLUE 26–26 ORANGE", "5:05, BADASS
    leads on 15") and the table; the cursor sits on the plot at 305 s
    (within 0.02 px of the grid's x for 305 s, from its top to its
    bottom); a click at 60% of the chart moves `t` to a kill's second and
    the clicked kill is on the scoreboard; Final score clears `t`; the
    fight card reads, for 78764, "Verdict Split decision · Lead changes 3
    · First blood BADASS (Flak, 0:14)" and, for 78760, "Decision · 0 ·
    BADASS (Hunter, 0:05)"; one marker per lead change; the page is no
    wider than the window.
  - On 78764 at `?t=330`: "5:30, BLUE 29–28 ORANGE"; the deep dive,
    damage, timeline (169 rows) and analysis tabs open and keep `t`; the
    deep dive's pie has one slice per weapon family, each its own token
    colour, and its first blood is BADASS. MatchReplay opens with "(5
    beats)" (first blood, three lead changes, final minute), its clock
    runs, its length reads 15:11 like the header, a ticker badge for
    Thunderbolt is `rgb(217, 89, 38)` (`chart.weapon.thunderbolt`), the
    scrubber's first-blood marker is there, and the ticker shows FIRST
    BLOOD on BADASS → LORD JOHN WARFIN at 0:14.
  - 78758 with its kill log taken out of `/api/game/78758` through the
    Fetch domain: no slider, the "No kill log for this match"
    EmptyState, the fight card shows the verdict (KO) only, "RAZOR wins
    on 30, 17 ahead of WD-40." and 13:11 as in S7. The same match with
    `?t=30` shows the final table. 78735: "BLUE wins 43–41.", 15:09, as
    in S7.
  - No console errors or exceptions. Full-page shots at 1,280 and 390 px
    of both matches, scrubbed and not, were looked at.
- S12, sizes on Node 22.17.0 after /simplify: entry `index-*.js` 230.81
  KB raw / 73.91 KB gzip (73.94 before); match page `GameDetail-*.js`
  127.92 KB raw / 40.57 KB gzip (42.25 before: `ScoreChart` and
  MatchReplay's copied rules went, the new components came). Recharts
  stays in its shared chunks (`Area-*.js`, `BarChart-*.js`); the entry
  has none of it. `npx tsc --noEmit` exits 0. `wc -l`: `GameDetail` 191,
  `MatchReplay` 1,897, `MomentumChart` 221, `Scoreboard` 112,
  `FightCard` 97, `MatchScrubber` 75, `useMatchTime` 17.
- S12, server (same command, after `Startup sync complete`):
  `/api/health` `{"status":"ok"}`, `/api/stats/global` `total_games: 35`,
  `/api/stats/pilots` 24 pilots (top WD-40, 23 matches),
  `/api/pilot/WD-40/stats` 23 matches and 380 kills.

- S11, first move on Node 22.17.0, on `main` at `96f2710` (PR #10
  merged): `npx vitest run` passed 13 files, 129 tests (the prompt said
  126; the Verification table's 129 after S10's review fixes is right).
  `npx vite build` wrote the entry `index-GihCUZKl.js` at 231.00 KB raw /
  73.76 KB gzip (the table said 73.74; S10's review fixes added 0.02).
  `npx tsc --noEmit` exited 0. `wc -l`: `db.js` 2,620 (not 2,520),
  `routes.js` 1,042 (not 964), `PilotSettingsPanel` 2,119, `AudioEditor`
  1,353, `WebImportModal` 1,332, `AdminPanel` 986.
- S11, what must not change, recorded first and compared at the end:
  - Exports: a script run by plain `node` imports `server/db.js` into a
    fresh `DATA_DIR` and prints the sorted export names (`backupsDir`,
    `default`, `mapImagesDir`, `mapsDir`, `pilotStatements` and its nine
    keys) and every `db` key with the kind of value behind it (90 keys:
    function, prepared statement, `{ get }`/`{ all }` object, string).
    After the split the output is identical. The same script is the
    ES-module check: the import of every new module happens outside
    vitest. A second script finds no import cycle among the 21 new
    server modules.
  - Routes: a script stubs `express.application.listen`, imports
    `server/index.js` and walks `app._router`, printing method and path
    of every route plus each middleware layer (97 entries, including
    `requireAuth` on `/api/overload` and `/api/admin`). After the split
    the set is identical. The order between resources changed; a third
    script built 1,931 URLs from every pattern and found none that
    matches two routes and none whose first match differs.
  - API answers: `/api/stats/global`, `/api/stats/pilots?source=all`,
    `/api/pilot/WD-40/stats`, `/api/pilot/WD-40/ppi`, `/api/games?page=1`
    (plus `/api/health` and `/api/stats/pilots`) from the server started
    on a copy of a frozen snapshot of `/tmp/ofc-data` (30 matches), with
    `https_proxy` pointed at a closed port so the tracker sync cannot add
    games. Two baseline runs gave the same bytes. After the server split,
    and again at the end back to back with a `96f2710` worktree, all
    seven are byte-identical (150,297 bytes for page 1).
- S11, tests: `npx vitest run` passes 14 files, 136 tests. The 7 new ones
  are `services/apiService.test.ts`: the admin request helper rejects a
  non-2xx answer with axios's message and `response`, rejects a network
  failure with "Network Error", keeps a non-JSON body as text, and sends
  `Content-Type` only with a body. Three mutations of the helper
  (`Content-Type` on every request, the status code dropped from the
  message, the network error renamed) fail 2, 2 and 1 of them. `server/match-replay.test.js` looks for
  its routes one level down (both of its tests failed against the new
  `routes.js` until then).
- S11, headless Chrome 154 over CDP, the same script against a build of
  `96f2710` and against the branch, each on its own server and snapshot
  copy, with `/api/browser`, `/api/overload/*`, `/api/import/*` and
  `/api/admin/*` mocked through one `Fetch.enable` (an admin session from
  answers captured after a real dev login; pilots Soup and XB1): the
  Taunts vault, loadout and manual tabs; the Create tab until the ffmpeg
  engine reports ready; the web import dialog opened from the keyboard,
  a YouTube search and an archive search with mocked results, the direct
  tab; the voice recorder; the pilot settings page and all six of its
  tabs; the key rebind dialog from the keyboard; the vault's clone
  dialog; the admin page with its stats. 20 DOM snapshots (React ids
  normalised) are identical before and after, and so is the request log
  (64 requests, same order). After /simplify the snapshots and the
  request multiset were identical again; one request moved a step in
  the log (the pilot page's 6 s game-running poll fired during the next
  tab). Every dialog (web import, voice recorder,
  key rebind, clone) is `role="dialog"`, `aria-modal="true"`, labelled
  by its heading, takes focus, keeps 25 Tabs inside (10 for clone), and
  closes on Escape with focus back on its opener, in both builds. No
  console errors or exceptions. Two baseline runs differed only in a
  React id.
- S11, admin page with a real dev login (no `NODE_ENV`, `admin123`), both
  builds: a wrong password gets a 401 and "Invalid password"; the right
  one loads the stats; the archive toggle posts
  `{"key":"show_cold_storage","value":"true"}`; "Refresh stats now" posts
  and shows "Refresh started in background." The requests, bodies and
  `Content-Type` and `Accept` headers are the same in both builds (run
  again after /simplify, same answer).
- S11, sizes after /simplify: `npx vite build` entry `index-*.js`
  232.24 KB raw / 74.16 KB gzip (+0.40 KB gzip: the admin request
  helpers in `apiService.ts`), CSS 85.16 KB (85.46 before: `.container`
  and `.resize` dropped). After the PR review (six duplicate admin
  helpers deleted, `./hooks/**` in Tailwind's `content`), on Node
  22.17.0: entry 230.84 KB raw / 73.94 KB gzip, CSS 85.49 KB (`main`'s
  rules plus an unused `.visible`). `AudioTauntMaker` chunk 205.64 KB
  (198.77 before; hook and prop names the minifier cannot shorten).
  `npx tsc --noEmit` exits 0. `wc -l`: `PilotSettingsPanel` 224,
  `AudioEditor` 209, `WebImportModal` 176, `AdminPanel` 90, `db.js` 180,
  `routes.js` 19; no new file is over 500 (largest
  `server/db/repos/games.js` 458, on the client
  `components/webImport/YouTubeTab.tsx` 321); `grep axios` in
  `AdminPanel.tsx`, `components/admin/` and `hooks/` prints nothing.
- S11, server: `PORT=3100 DATA_DIR=/tmp/ofc-data npm start` on the
  branch, live tracker, after `Startup sync complete`: `/api/health`
  `{"status":"ok"}`, `/api/stats/global` `total_games: 30`,
  `/api/stats/pilots` 21 pilots (top WD-40, 23 matches),
  `/api/pilot/WD-40/stats` 23 matches and 380 kills. SIGTERM logs both
  shutdown lines.

- S10, second rebase, onto the owner's `5afcdf5` (pushed while S10's
  PR was being prepared). One conflict, in `PilotsList.tsx`: kept the
  owner's server-side 90-day fetch and S10's URL sort, paging and
  `combatRatio()` fallback. The owner's new 90-day rows in
  `db.getPilotStats` computed Combat Ratio inline; they call
  `combatRatio()` now. The roster's Retry passed its click event as the
  new `isActiveWindow` argument (it would have loaded the 90-day
  window); it calls `loadRoster()` with no argument now. `5afcdf5` alone
  fails `tsc` (`d.setMinutes(0, 0, 0, 0)`, TS2554); the branch drops the
  fourth argument, which changes nothing at runtime. After the rebase:
  `npx tsc --noEmit` 0, `npx vitest run` 13 files and 126 tests, entry
  230.93 KB raw / 73.74 KB gzip, every scratch grep 0. The full
  `checks.mjs` run on this build against a restarted server: 81 of 81
  pass, WD-40 at Combat Ratio 0.76 and Lethality 1.15 on the
  leaderboard, the profile and `/ppi` (the cache had refreshed to 23
  matches). Server: `/api/health` ok, `/api/stats/global`
  `total_games: 30`, `/api/stats/pilots` top WD-40 with 23 games,
  `/api/pilot/WD-40/stats` 23 games and 380 kills.

- S10, after rebasing onto the owner's `45cb57b`: no conflicts. The
  glossary script found the replay's new strings (six "frag", the
  "OVERLOAD ARENA" fallback) and one "cold storage" on the admin page;
  all now use the S10 words, and the grep is 0 again. The replay has no
  table and no clickable non-control. `npx vitest run` passes 13 files,
  122 tests (the owner's commits add `server/match-replay.test.js` and
  tests in four files). `npx tsc --noEmit` exits 0; the entry is
  still 230.93 KB raw / 73.74 KB gzip (the replay is in the match
  page's chunk), CSS 85.25 KB / 13.60 KB gzip. All 81 browser checks
  below were run again on the rebased build against a restarted
  server: 80 passed at once. The Combat Ratio check failed (leaderboard
  and profile 0.78, cache 0.76): the owner's new startup check had
  refreshed the cache (WD-40 from 21 to 23 matches), but
  `/api/stats/pilots?source=all` kept answering the old row for more
  than nine minutes while `/ppi` and the database file had the new one
  (flagged). After another restart the leaderboard, the profile and
  the cache all read 0.76 and 1.15, and the check passed. Server on the
  rebased code: `/api/health` ok, `/api/stats/global` `total_games:
  30`, `/api/stats/pilots` 21 pilots (top WD-40, 23 games),
  `/api/pilot/WD-40/stats` 23 games and 380 kills.

- S10, first move on Node 22.17.0, on `main` at `ae050c4` (PR #9
  merged): `npx vitest run` passed 12 files, 107 tests. `npx vite
  build` wrote the entry `index-D3L71jfs.js` at 230.60 KB raw / 73.64
  KB gzip (the table said 73.63; same raw size, a rounding step).
  `npx tsc --noEmit` exited 0.
- S10, counts re-taken with grep and two scratch scripts (a TypeScript
  AST walk over `App.tsx` and `components/*.tsx`) on `ae050c4`: 13
  tables, 9 without a scroll wrapper (the audit said 7 of 13); 22
  clickable elements that were not buttons or links (14 sortable
  `<th>`, 6 `rowLink` rows and cards, the rival picker `div`, and
  `DeepStatCard`'s `onClick` that no caller passed); `hover:` 475,
  `active:` 0 (the audit said 499 and 0); `focus-visible` 0, `aria-*`
  0, `role=` 2. Glossary variants in user-visible strings (JSX text and
  string literals outside `className`, imports, console calls and
  comparisons): match 26 (games, bouts, mission, engagement, sorties,
  combat log), pilot 14 (player, callsign), kill 26 (frag, fragger,
  eliminations), map 37 (arena, combat zone, sector, theater, levels),
  server 4 (node, relay, uplink), archive 9 ("Historical Archive",
  archival, archives).
- S10, before shots on the built `dist/` with `/api/browser` and
  `/api/game/143.110.230.67` mocked from fixture 72102 through CDP's
  Fetch domain (no server had a live game): dashboard, `/pilots?min=1`,
  `/pilot/WD-40`, `/game/78760`, `/live/143.110.230.67` and `/maps`,
  full page at 1,280 and 390 px, no console errors. Widths at 390 px:
  dashboard 411, live 509 (S9 measured 516 with a different live game),
  the other four 390. Thirteen more routes at 390 px: `/taunts` (every
  tab) 854, `/pilot` (pilot settings) 441, the rest 390.
- S10, after, same harness, final run after /simplify: every grep
  above is 0 (13 of 13 tables in a scroll wrapper, no clickable
  non-control, no glossary variant outside the kept words listed in the
  glossary decision). Headless Chrome 154 over CDP, `node checks.mjs`,
  results:
  - Combat Ratio and Lethality for WD-40: leaderboard 0.78 and 1.15,
    profile sidebar 0.78, profile Lethality card 1.15,
    `/api/pilot/WD-40/ppi` `kda` 0.78 and `kpm` 1.15 (the cache then
    held 21 of WD-40's 23 matches; after the rebases and a refresh all
    three read 0.76 and 1.15).
  - Tab from the top of the page reaches every visible focusable
    element, each with a 2px `#ff6600` ring (on the `::after` for
    stretched links): `/` 63 at 1,280 and 49 at 390, `/history` 109,
    `/pilots?min=1` 82, `/pilot/WD-40` 62, `/game/78760` 28,
    `/live/143.110.230.67` 19, `/maps` 144, `/archive` 36,
    `/fight-night` 38. Tab then Enter on a row's link opened its page
    on the server table, the 390 px server cards, the history cards,
    the roster, the pilot's match list, the archive's hall of fame and
    a map card (the map popup). Enter on the Kills header set
    `aria-sort="descending"`; Enter on a rival picked it.
  - Dialogs, each opened from the keyboard: the map popup, the web
    import, the voice recorder, the pilot clone dialog and the key
    rebind dialog are `role="dialog"`, `aria-modal="true"`, labelled by
    their heading, with focus inside; Tab stays in the map popup;
    Escape closes each and focus is back on the control that opened
    it. The two taunt-tool dialogs that need an Overload folder ran
    against mocked `/api/overload/*` answers (pilots Soup and XB1).
  - Pagination: the roster (130 made-up pilots added to the real 16
    through the mocked `/api/stats/pilots`) shows 50 rows, "Page 1 of
    3"; Next writes `?min=1&page=2` and row 51; a reload keeps it;
    opening a pilot and pressing back returns to the same URL and rows.
    Sorting by Combat Ratio, Next, reload: `?min=1&sort=kda&page=2`,
    same first row. A new minimum drops `page`. The map grid (574
    maps) shows 24 cards, "Page 1 of 24"; Next writes `?page=2`; reload
    keeps it; the popup opened from page 2 is `/maps/ALPHA1?page=2` and
    Escape returns to `/maps?page=2`; leaving through the nav and
    pressing back returns to page 2.
  - At 390 px, 21 routes (every view, the match tabs, the map popup,
    all four taunt tabs, admin) are 390 px wide, and each wide table
    scrolls inside its wrapper (`scrollLeft` moves).
  - Touch emulation with `Input.synthesizeTapGesture` (a 800 ms tap;
    `Input.dispatchTouchEvent` does not set `:active` in headless
    Chrome): the menu button, a roster row link, a sort header and the
    pager's Next go from opacity 1 to 0.7 while pressed; a stretched
    server card and the rival picker show `rgba(255, 102, 0, 0.1)` on
    their cover.
  - No console errors or exceptions. Header nav at 768, 1,024, 1,150,
    1,280, 1,440 and 1,600 px: no overflow; at 1,280 the bar ends at
    1,274 px.
  - Full-page shots at 1,280 and 390 px after the change and again
    after /simplify: same layout and content as before apart from the
    intended differences (new words, the Lethality column, the pager,
    the stacked live header, the wrapped taunt header).
- S10: `npx vitest run` passes 12 files, 109 tests (two new in
  `server/lib/gameParse.test.js`: INSANER in fixture 72102 has Combat
  Ratio 2.04 and Lethality 1.25 over 910 s; no deaths gives the kills,
  no match time gives 0). `pageMeta.test.js` expects "most kills"
  instead of "top fragger". `npx vite build` entry 230.93 KB raw /
  73.74 KB gzip, CSS 81.25 KB / 13.06 KB gzip. `npx tsc --noEmit`
  exits 0.
- S10, server (`PORT=3100 DATA_DIR=/tmp/ofc-data npm start` on the
  session's code, restarted after each server change; the data dir
  from earlier sessions, 30 games): `/api/health` `{"status":"ok"}`,
  `/api/stats/global` `total_games: 30`, `/api/stats/pilots` 21 pilots
  (top WD-40, 23 games), `/api/pilot/WD-40/stats` 23 games and 380
  kills. The only errors in the log are the scraper's 404s for an idle
  server's live page.

- S9, first move on Node 22.17.0, on `main` at `6bc5857` (all of PRs #4
  to #8 merged): `npx vitest run` passed 12 files, 107 tests. `npx vite
  build` wrote the entry `index-IHj8glyl.js` at 230.55 KB raw / 73.47 KB
  gzip. `npx tsc --noEmit` exited 0. All three match the S8 records.
- S9, counts re-taken with grep on `6bc5857` over the client (`App.tsx`,
  `index.*`, `components/`, `context/`, `hooks/`, `utils/`): 94 distinct
  hex values, 993 occurrences, `#ff6600` 605 times (the audit said 95 and
  612 at `10223be`). Arbitrary text sizes: `text-[10px]` 147, `[11px]`
  89, `[9px]` 12, `[8px]` 2, `[5px]` 1. Radius: `rounded` 251,
  `rounded-lg` 174, `rounded-xl` 173, `rounded-2xl` 26. Dead classes
  (every `className` token the built CSS does not define, found by a
  script that reads the class strings and looks each one up in
  `dist/assets/index-*.css`): `animate-fade-in` 21, `animate-in` and
  `fade-in` 3 each, `custom-scrollbar` 4, `primary-400`/`-500` 3, `prose`
  and `prose-invert`, plus ones the audit did not list: `py-0.2` 5,
  `animate-scale-up` 2, `no-scrollbar`, `scrollbar-thin`, `text-md`,
  `border-gray-855`, `animate-spin-slow`, `group-hover:r-3`.
- S9, after: the same script finds no dead class; what it still prints
  are tab names compared inside `className` expressions (`'editor'`,
  `'offense'`). Hex values: 82 distinct, 659 occurrences, `#ff6600` 430,
  all outside the migrated pages. On the migrated pages and their child
  components (22 files) hex values went from 388 to 66, and none of the
  66 is a brand orange or a surface black except ActivityGraph's two
  `#222` grid and cursor greys; the rest are chart axis and label greys,
  series palettes, status-dot colours and the helmet avatar (flagged).
  No `text-[Npx]` is left on the migrated pages except the server map's
  `text-[5px]` tooltip, which sits in a 100x100 SVG viewBox.
- S9, headless Chrome 154 over CDP against `PORT=3100
  DATA_DIR=/tmp/ofc-data npm start` serving the built `dist/` (fresh data
  dir, 25 games at the start, 27 by the end). `/api/browser` and
  `/api/game/23.94.53.39` were captured once while a real ANARCHY match on
  ASCENT was running there, and replayed through CDP's Fetch domain in
  every run so before and after saw the same live data. Screenshots of
  `/`, `/pilots`, `/pilots?min=1`, `/pilot/WD-40`, `/game/78735` and
  `/live/23.94.53.39`, full page at 1,280 and 390 px, before the change,
  after it and again after /simplify: same layout and
  content, with the intended differences. Corners on cards are 8px and
  on controls 4px, the live page's panels are `surface-card` instead of
  translucent grey-blue, the idle-servers panel is the shared
  EmptyState with an icon, and 11px text is 10px. Between before and
  after the data grew (WD-40 21 to 22 matches, new recent bouts) and a
  fight night qualified for real (2026-10-07: 19 matches, 14 pilots), so
  the teaser shows on the dashboard. The first after-shots showed 11px
  text mapped to 12px wrapping the Active Nodes header and the tiny map
  tooltip doubling in size; both fixed (see decisions). No console
  errors on any of the twelve shots. Page widths at 390 px are 411
  (dashboard) and 516 (live), the same as before.
- S9, shared states, forced with CDP's Fetch domain (a held request for
  Loading, an empty answer for EmptyState, a 500 or a failed request for
  ErrorState), checked by `role="status"`, `role="alert"` or the text,
  35 of 35 pass before the review and 39 of 39 after /simplify (four
  cases added for paths /simplify changed):
  dashboard (first poll held, poll failed, `/api/browser` `[]`, archive
  failed on `/?tab=history`), history (page 1 held, failed, empty, a
  search with no match), leaderboard (roster held, failed, empty, online
  tab empty), pilot (stats held, stats failed, match list failed,
  unknown pilot, `?mode=CTF` with no matches), match (held, failed,
  timeline with no kills, no damage log), live (held, failed, no
  players), fight night (held, failed, no recaps), archive (games held,
  failed, empty; pilots failed), maps (failed, empty), admin with a
  mocked session (stats held, failed), taunts (vault not connected), the
  history tab's activity timeline (failed). With the dashboard's archive
  request failed, `/api/games` was asked once, not twice.
- S9, error boundaries: `/game/78735` answered with `players: "not a
  list"` makes GameDetail throw; the page shows "Application recovery"
  with the nav still there, and clicking Leaderboards in the nav opens
  `/pilots` with the roster and no alert. `/api/stats/active-count`
  answered with `{"count": {"not": "a number"}}` makes Layout throw; the
  top-level boundary in `index.tsx` shows "Application recovery" with
  no nav, not a blank page.
- S9: `npx vitest run` passes 12 files, 107 tests (no test files
  changed; the session touched no server code). `npx vite build` entry
  `index-DBexm-fv.js` 230.60 KB raw / 73.63 KB gzip (73.47 in S8;
  `States.tsx` and its icons are in the entry because every view imports
  them), CSS 81.07 KB / 12.89 KB gzip. `designTokens.js` lands in a
  0.2 KB shared chunk the chart views load. `npx tsc --noEmit` exits 0.
- S9, server (same command): `/api/health` `{"status":"ok"}`,
  `/api/stats/global` `total_games: 26`, `/api/stats/pilots` JSON (top
  WD-40, 22 games), `/api/pilot/WD-40/stats` 22 games and 356 kills.

- S8, first move on Node 22.17.0, on S7's tip `a9a1699`: `npx vitest
  run` passed 10 files, 99 tests. `npx vite build` wrote the entry
  `index-BQooUDxx.js` at 233.61 KB raw / 73.21 KB gzip. `npx tsc
  --noEmit` exited 0. All three match the S7 records.
- S8, tests: `npx vitest run` passes 12 files, 107 tests. New in
  `server/lib/siteRoutes.test.js`: every view's URL parses back to the
  same view and parameter (a pilot named `a/b?c#d%` included), the old
  paths (`/fight-nights/:date`, `/cold-storage`, `/tools`) still open
  their pages, `/game/abc` goes to the history, and the title of each
  kind of page. New in `server/pageMeta.test.js`, on fixture games:
  `/game/72102` gives "Match 72102: ASCENT | overloadfight.club" and
  "BLUE wins 42–35. TEAM ANARCHY on ASCENT, 15:10."; `/pilot/zergling`
  gives ZERGLING's match and kill totals from the fixtures; Soup's
  totals count the 2019 game in cold storage; a forced recap gives its
  own description on `/fight-night/<day>` and on `/fight-night`; an
  unknown pilot or date falls back to the site description; `og:url`
  keeps the query string; `<`, `"`, `$&` in a name come out escaped and
  never as a tag or a replacement pattern. `gamePlayers.test.js` checks
  that the pilot summary reads `idx_game_players_name_date` in both
  files. `matchResult.test.js` moved beside `server/lib/matchResult.js`.
- S8, share tags with curl against `PORT=3100 DATA_DIR=/tmp/ofc-data npm
  start` serving the built `dist/` (fresh data dir, 25 games synced,
  recaps for 2026-10-06 and 2026-10-07 forced with
  `generateRecapForDate(date, true)`; neither night qualified):
  - `/pilot/WD-40`: "WD-40 | overloadfight.club", "WD-40: 20 matches,
    325 kills, last match 2026-10-07." `/pilot/wd-40` gives the same
    description under the URL's spelling.
  - `/game/78758`: "Match 78758: ISOTOXIN V3 | overloadfight.club",
    "RAZOR wins on 30, 17 ahead of WD-40. ANARCHY on ISOTOXIN V3,
    13:11." `/game/78734`: "ORANGE wins 59–54. TEAM ANARCHY on
    CONVENTION, 15:11." before the match page was opened and 15:10
    after (opening it hydrated the stored details; the page shows
    15:10).
  - `/fight-night/2026-10-06`: "Tuesday, October 6, 2026: 7 matches, 5
    pilots, top fragger WD-40 (109)." `/fight-night` describes the
    latest card (2026-10-07).
  - `og:url` is `http://localhost:3100/<path>`; with `X-Forwarded-Proto:
    https` and `Host: overloadfight.club` it is
    `https://overloadfight.club/pilot/WD-40`. `/pilots?tab=online&min=10`
    keeps its query (`&` escaped). Page responses stay `no-store`,
    `text/html`.
- S8, headless Chrome 154 over CDP against the same server. Run before
  the review, after the review fixes and after /simplify, same answers:
  - Links: a plain click on the nav's Leaderboards went to `/pilots`
    in the same document (a marker set on `window` survived) and opened
    no tab. A middle, Cmd or Shift click on a roster pilot link opened
    `/pilot/WD-40` in a new target and left this tab on
    `/pilots?min=1`. Ctrl-click opened nothing and did not navigate:
    on macOS Chrome treats it as a right click; the handler leaves it to
    the browser. A middle click on a roster row outside the link called
    `window.open('/pilot/WD-40')` and created a target; a plain click on
    the row navigated in place. The server map's markers are SVG `<a>`
    links to `/live/<ip>`.
  - Titles: `/` "Live", `/history` "Match history", `/pilots`
    "Leaderboards", `/pilot/WD-40` "WD-40", `/game/78758` "Match 78758:
    ISOTOXIN V3", `/fight-night` "Fight Night", `/fight-night/2026-10-06`
    "Fight Night 2026-10-06", `/maps` "Maps", `/maps/BLIZZARD` "BLIZZARD
    map", `/archive` "Archive", `/taunts` "Taunts",
    `/live/143.110.230.67` "Live: San Francisco 1", each followed by "|
    overloadfight.club".
  - State: the dashboard's History tab wrote `/?tab=history` and was
    still open after a reload. `/?tab=history&q=RAZOR` reloaded with
    "RAZOR" in the box and 6 cards, the count `/api/games?search=RAZOR`
    returns, with one search request and no unfiltered GameList fetch
    (the one unfiltered `/api/games?page=1` is App's). The leaderboard
    wrote `/pilots?min=10&active=1&q=wd`, kept it across a reload, and
    after opening WD-40 and pressing back the URL and the box were the
    same. The pilot page wrote `?mode=ANARCHY&weapons=defense`, the match
    page `?tab=damage`, the archive `?hall=games&year=2026` (still
    selected after a reload), Reset Filters went to `/archive`. Typing
    "ice" into the map search updated the box at once and the URL
    within 300 ms; a reload kept the box and its 10 cards.
  - Map popup: DOSSIER with Community Custom selected opened
    `/maps/ICEWOLF%20DEATH%20MATCH%20V.1?origin=custom`; after a reload
    the popup and the filter were back. Its CLOSE (no in-app history
    after the reload) went to `/maps?origin=custom`. Opened again,
    browser back closed it and forward reopened it. `/maps/blizzard`
    opens BLIZZARD's popup; `/maps/not a map?sort=name&origin=custom`
    became `/maps?sort=name&origin=custom&q=not+a+map` after the intel
    request answered 404. The popup asks for intel by name
    (`/api/maps/BLIZZARD/intel`) in parallel with the list.
  - Fight night: `/fight-night` selects 2026-10-07; clicking the
    2026-10-06 pill went to `/fight-night/2026-10-06` with that pill
    selected and its title, kept it after a reload, and back returned
    to `/fight-night` with 2026-10-07 selected.
  - Back: from `/pilot/WD-40?mode=ANARCHY&weapons=defense` into match
    78758, the match's BACK button returned to that exact URL. Opened
    directly in a fresh tab, `/game/78758` has `history.state` null; its
    BACK replaced the entry with `/history` and stayed on the site (the
    next browser back left for the page before it, `about:blank`).
  - Stale match: from match 78758 to WD-40, then match 78757 with its
    `/api/game/78757` held for 2 s by CDP's Fetch domain: while it
    loaded, the page showed "RETRIEVING COMBAT LOG #78757" and not
    ISOTOXIN V3, title "Match 78757"; then SWAT and "Match 78757: SWAT".
    Back twice showed 78758 again at once.
  - No console errors or exceptions on 16 routes. At 1,280 px the page
    is 1,280 px wide; at 390 px the menu's Leaderboards went to
    `/pilots`, closed the menu, and the page is 390 px wide.
- S8, server (same command): `/api/health` `{"status":"ok"}`,
  `/api/stats/global` `total_games: 25`, `/api/stats/pilots` 15 pilots
  (top WD-40, 20 games), `/api/pilot/WD-40/stats` 20 games and 325
  kills. The only errors in the log are the scraper's 404s for the idle
  server's live page.
- S8: `npx vite build` entry `index-IHj8glyl.js` 230.55 KB raw / 73.47
  KB gzip (73.21 in S7). `npx tsc --noEmit` exits 0.

- S7, first move on Node 22.17.0, on S6's tip `7c09011`: `npx vitest
  run` passed 9 files, 92 tests. `npx vite build` wrote the entry
  `index-BQwIagdR.js` at 232.11 KB raw / 72.81 KB gzip. `npx tsc
  --noEmit` exited 0. All three match the S6 records.
- S7, tests: `npx vitest run` passes 10 files, 99 tests. New in
  `utils/matchResult.test.js`, the match page's result line from
  `winnerOf` on fixture games: 72102 "BLUE wins 42–35.", the 2019
  Monsterball "BLUE and ORANGE draw, 1–1.", 72108 "ZERGLING wins on 48,
  17 ahead of RAPTOR.", 72098 "JFTP and . tie for first on 2.", a
  three-way tie listed "XB1, JFTP and STITCH", and no result for a team
  game without `teamScore` and for a one-pilot game. `gameParse.test.js`
  checks `measuredDurationOf`: 0 when only `timeLimit` is left, the
  start/end length otherwise.
- S7, types: with the JSDoc `@returns` on `winnerOf`, a probe reading
  `winnerOf({}).ranking[0].nonexistentField` fails `tsc` with `TS2339`;
  without it the same probe compiled (the field came out `any`).
- S7, headless Chrome 154 over CDP against `PORT=3100
  DATA_DIR=/tmp/ofc-data npm start` serving the built `dist/`, fresh
  data dir, 25 games synced from the tracker. No fight night qualified
  (16 matches but 8 pilots on 2026-10-07), so a recap for that day was
  forced with `generateRecapForDate('2026-10-07', true)` from a script.
  Run before the review and again after /simplify, same answers:
  - Dashboard at 1280 px, page offsets from the top: Pilots Online card
    343, Server Browser heading 595, the teaser 828, Recent Bouts 918.
    No "Fight Night Recaps" poster on the dashboard. The teaser reads
    "Fight Night Wednesday, October 7, 2026: 16 matches, 8 pilots, top
    fragger WD-40 (216) Full card →". With `/api/browser` mocked to put
    a live match on 143.110.230.67: Pilots Online 4, Games In Progress
    at 595, the server browser at 1012, the teaser at 1245. No "Global
    Mesh" text; the empty browser reads "All 22 Idle Servers Standing By".
  - Nav: Fight Night is the second item on desktop and in the 390 px
    menu. Clicking it opens `/fight-night` with the item in orange; the
    teaser opens `/fight-night/2026-10-07` with that date's pill.
    `/history` opens on the History tab.
  - Favorites: starring the fourth row (San Francisco 1) wrote
    `favorite_servers` = `["143.110.230.67"]`; after a reload that
    server is the first row, starred.
  - Live page, `/live/143.110.230.67` with `/api/game/<ip>` mocked from
    fixture 72102 (no server had a live game during the session): "Join
    at 143.110.230.67"; Copy IP turns into "Copied" and back after 2 s,
    and `writeText` received `143.110.230.67` (reading the headless
    clipboard back returned an empty string, so the argument was
    recorded instead). On `http://192.168.86.141:3100`, not a secure
    context, the button says "Copy failed, select the IP".
  - Match pages: 78734 "ORANGE wins 59–54.", 15:10; 78735 "BLUE wins
    43–41.", 15:09; 78758 podium RAZOR 30, WD-40 13, OKSTER 8, "RAZOR
    wins on 30, 17 ahead of WD-40.", 13:11 "of 13 min limit" (780 s).
    `winnerOf` and `durationOf` run by `node` on the stored details give
    the same winners, scores and lengths. Mocked: a game with no
    timestamps shows 15:00 and "Time limit, real length unknown"; a
    team game with `teamScore: {}` shows "Result" and the no-result
    sentence with no score panel.
  - `/maps`: "• 25 Matches Indexed", "12 Stock", "ALL 25 MATCHES";
    `/api/stats/cold/deep` says `total_games: 25`, and 12 of the 574
    maps are stock by either rule (`is_custom = 0` and `isStock`).
  - Page width against window width at 768, 1024, 1150, 1280, 1440 and
    1600 px. Before S7: 1,144/760, 1,152/1,016, 1,152/1,142, fits, fits,
    fits. With Fight Night and the old breakpoint: 1,273/760,
    1,281/1,016, 1,281/1,142, 1,345/1,272. After S7 (hamburger below
    `xl`, `space-x-4`): fits at all six.
- S7, server (same command, run before the review and again after a
  restart on the simplified `gameParse.js`): `/api/health`
  `{"status":"ok"}`, `/api/stats/global` `total_games: 25`,
  `/api/stats/pilots` 15 pilots (top WD-40, 20 games),
  `/api/pilot/WD-40/stats` 20 games and 325 kills. No errors in the log.
- S7: `npx vite build` entry `index-BQooUDxx.js` 233.61 KB raw / 73.21
  KB gzip (the teaser is in the entry). The dashboard no longer loads
  the `FightNightSection` chunk.

- S6, first move on Node 22.17.0, on S5's tip `2f9737c`: `npx vitest
  run` passed 6 files, 76 tests. `npx vite build` wrote the entry
  `index-CIgfw3Tc.js` at 232.15 KB raw / 72.84 KB gzip. `npx tsc
  --noEmit` exited 0 (JSX untyped). After merging `origin/main`
  (`fb4064a`): 8 files, 88 tests (the owner's commits add two test files
  and backfill tests; one test is S6's for the merge), entry 232.11 KB /
  72.80 KB gzip (the owner's archive page changes).
- S6, merge: `updateGameDetails` with the owner's `CASE` and S5's row
  rebuild built `game_players` from the incoming game. The new test
  (`updateGameDetails` sends a stored game again without its kill log,
  expects its suicide row to stay) fails when the rows come from the
  incoming game and passes with `RETURNING details`.
- S6, tests: `npx vitest run` passes 9 files, 92 tests. New in
  `server/ops.test.js`: a backup holds both files with the same games,
  `game_players` rows and `user_version` 1 as the live files; eleven runs
  over ten days leave exactly the 7 newest day folders, replace the same
  day, and delete a stale `.partial`; `checkHealth` passes while open and
  throws after `close()`; `close()` during a refresh stops the worker (the
  refresh logs "stats worker exited"). Without the `terminate()` in
  `close()` that test fails: the worker finishes and its writes hit the
  closed database ("The database connection is not open").
- S6, types: with `@types/react` and `@types/react-dom` 19.3.0, `npx tsc
  --noEmit` reported 8 errors, all `TS2339` in `LiveGameDetail.tsx` (6)
  and `PilotsList.tsx` (2); `--strict` reported 19. After the local type
  widening it exits 0. A probe file with `<div onClick={42} notAProp />`
  fails with `TS2322`, so JSX is type-checked now.
- S6, image (Docker Desktop 29.2.1 on macOS): `docker build` succeeds;
  567 MB against 1.03 GB for S5's single-stage image. In the container
  `id` is uid 1000 (`node`); `g++`, `gcc`, `make`, `git` and `pip` are
  absent; `python -m yt_dlp --version` prints 2026.08.19, `ffmpeg` is
  present, Node is 22.23.3. With a fresh volume and the two secrets set
  the container reports `healthy` within about 9 s and `/api/health`
  returns `{"status":"ok"}`. `docker stop` returns in under a second with
  exit code 0, the log ends with `[Shutdown] SIGTERM received, closing
  databases...` and `[Shutdown] Done.`, and no `-wal` or `-shm` file is
  left in the volume. `docker compose up` with `docker-compose.yml` (built
  image, bind-mounted `./data`) went healthy with `json-file` logging at
  `max-size 10m`, `max-file 3` and user `node`.
- S6, ownership: a volume written by the image running as root, then
  opened by the uid 1000 image, crashed (before the startup check existed)
  with
  `SqliteError: attempt to write a readonly database`; with the check it
  exits 1 with `Refusing to start: /app/data/tracker.db is not writable by
  uid 1000`. A root-owned `tracker.db-wal` beside chowned databases is
  caught too. After `chown -R 1000:1000` the container goes healthy.
- S6, backup and restore in the container: `backupDatabases()` run as uid
  1000 wrote `backups/2026-10-07/tracker.db` and `cold_storage.db`. After
  deleting 10 games, `docker kill` (leaving a `-wal`), the documented
  restore (delete the four `-wal`/`-shm` files, copy the pair in, chown)
  and a restart, the container went healthy and served pilot stats with
  no `game_players` rebuild in the log.
- S6, server (`PORT=3100 DATA_DIR=/tmp/ofc-data npm start`, dev mode, no
  secrets, fresh data dir; run before the review and again after
  /simplify, same answers): `/api/health` returns `{"status":"ok"}`,
  `/api/stats/global` `total_games: 25`, `/api/stats/pilots` 15 pilots
  (top WD-40, 20 games) and `?source=all` JSON, `/api/pilot/WD-40/stats`
  20 games and 325 kills, `/games` 20. The tracker's live games have
  moved since S5, hence other pilots and counts. The log shows `[PPI]
  Successfully refreshed 14 pilots` and `[StatsWorker] Full pass
  finished in 0.03s`. SIGTERM logs both shutdown lines and leaves no
  `-wal` or `-shm`. The only error is the yt-dlp pre-warm (not installed
  on this Mac).
- S6: `npx vite build` entry `index-BQwIagdR.js` 232.11 KB raw / 72.81 KB
  gzip.

- S5, first move on Node 22.17.0: `npx vitest run` passed 5 files, 57
  tests (the Verification table said 56; the S4 Validated entry and the
  repo say 57). `npx vite build` wrote the entry `index-CIgfw3Tc.js` at
  232.15 KB raw / 72.84 KB gzip, unchanged from S4. The client is
  untouched in S5 and the entry is the same file at the end.
- S5, tests: `npx vitest run` passes 6 files, 76 tests (73 from S5, 2
  from the owner's `44e4792`, 1 for the merge). The S2 expectations in
  `server/db.test.js` (MAESTRO 7 games with 1 ORANGE win and 1 tie, XB1's
  suicide, "JFTP"/"jftp" as one pilot with 10 games, SOUP a veteran
  through cold storage, `J_TP` matched literally, the 1v1 Monsterball
  result) now read `game_players` for the leaderboard, telemetry, the
  breakdown, match history and first-seen, and the cache tests read the
  worker's output. New in `server/gamePlayers.test.js`: the backfill of a
  pre-S5 hot and cold pair, a second run adding nothing, a rebuild after
  `user_version` is reset, the startup repair (orphaned rows removed, a
  game without rows rebuilt), the cold move (rows moved, a hot copy
  already in cold dropped, B2AF from 5 games to 4, a second run moving
  0), the worker counting a game in both files once, `updateGameDetails`
  and `saveColdGamesBatch` rows, a pre-S5 backup restored, and
  `EXPLAIN QUERY PLAN` checks. `gameParse.playerRows` has 3 tests.
- S5, mutation checks: building rows from the incoming summary instead
  of the stored details fails "keeps the suicide from the stored kill
  log". Deleting every old hot game instead of only those cold storage
  holds fails the cold-move test (4 rows where 2 were expected). Without
  the hot-id set in the worker, the archive count came out 29 instead of
  28.
- S5, `EXPLAIN QUERY PLAN` (from a script run by plain `node`, which also
  shows the worker and `import.meta.url` work outside vitest): telemetry,
  the breakdown, match history, its count and first-seen each show
  `SEARCH ... game_players USING COVERING INDEX idx_game_players_name_date
  (name=?)` (or `(name=? AND date>?)`) in hot and cold, then `SEARCH games
  USING INTEGER PRIMARY KEY`. The leaderboard with a start date shows
  `SEARCH game_players USING INDEX idx_game_players_date (date>?)` in
  both files. The all-time leaderboard is `SCAN game_players` in both
  files, which an aggregate over every row needs; it reads no JSON.
- S5, synthetic copy (50,000 cold games from 2019 on, 8 players, 120-entry
  kill logs, 300-entry damage logs, 1.6 GB; 5,000 hot games, 158 MB), S4's
  code against S5's, each on its own copy: the all-time leaderboard 18.28
  s to 0.34 s, match history 1.99 s to under 1 ms, its count 1.92 s to
  0.003 s, first-seen 3.19 s to under 1 ms, telemetry 0.40 s to 0.26 s,
  the breakdown 0.39 s to 0.23 s. The refresh took 18.07 s on S4's main
  thread and 8.09 s in the worker. During it S4 served no other query for
  19 s; S5 served 154 leaderboard reads, with event-loop delay at most 13
  ms. The one-time backfill took 8.9 s (cold) and 0.8 s (hot); later
  starts spend 0.07 to 0.11 s on the repair check, and 0.4 s when 2,000
  games had lost their rows. Every number matched S4: the busiest pilot's
  leaderboard row (19,300 games, 254,044 kills, 286,371 suicides),
  telemetry (1,507 games, 19,906 kills, 698 wins, 27,032 suicides,
  12,112 damage dealt) and match-history count (16,614), and the
  `pilot_stats_cache`, `map_stats_cache` and archive stats rows were
  byte-identical (storage sizes left out). The first comparison found the
  suicide total off (375,606 against 286,371) where a pilot was listed
  twice in one game; `playerRows` now gives the log counts to the first
  row.
- S5, WAL: with the main thread saving a game every 20 ms during a
  refresh on the synthetic copy, 32 passive checkpoints from a third
  connection all copied every frame back (none held back by the worker),
  and `tracker.db-wal` ended at 873 KB.
- S5, server (`PORT=3100 DATA_DIR=/tmp/ofc-data npm start`, dev mode, no
  secrets, fresh data dir; run three times, before the review fixes, after
  /simplify and after the merge, the later runs repeating the global,
  leaderboard and pilot stats checks with the same answers): the log shows
  both backfills (0 games), `[PPI] Successfully refreshed 23 pilots` and
  `[StatsWorker] Full pass finished in 0.03s`, with no errors.
  `/api/stats/global` returns `total_games: 25`, `?source=all` 25 games
  and 2,201 kills. `/api/stats/pilots` returns 23 pilots (top LORD JOHN
  WARFIN, 7 games), `?source=all` and `?startDate=2026-10-01` return
  JSON. `/api/pilot/WD-40/stats` gives 7 games, 128 kills, 4 wins, 2
  losses; `/games` 7 of 7, `/breakdown` 5 maps and 4 rivals; `/weapons`
  and `/ppi` answered in the first run. `LORD%20JOHN%20WARFIN` and `wd-40%20` find the same
  pilots. `/api/pilot/NOBODY/games` returns `{"count":0,"games":[]}`.
  `/api/stats/cold/deep` returns 25 games. `tracker.db` holds 80
  `game_players` rows for 25 games, `user_version` 1.
- S5: `npx tsc --noEmit` exits 0 (JSX still untyped).

- S4, first move on Node 22.17.0: `npx vitest run` passed 4 files, 50
  tests. `npx vite build` wrote one 1,291.78 KB chunk, 351.07 KB gzip.
- S4, bundle: `npx vite build` writes 46 JS chunks. The entry
  `index-*.js` is 232.15 KB raw / 72.84 KB gzip. In headless Chrome 154
  against the dev server, the dashboard fetched the entry plus
  `GameList`, `FightNightSection`, the recharts `BarChart` chunk and small
  icon chunks. `/pilots` fetched only `PilotsList` and icons. `/taunts`
  fetched `AudioTauntMaker` and its shared chunk and made no `/ffmpeg/`
  request. Clicking Create then fetched `ffmpeg-core.js` and
  `ffmpeg-core.wasm` (`Content-Encoding: br`) and the editor showed no
  load error.
- S4, poll (headless Chrome over CDP, hiding the tab by overriding
  `document.hidden` and dispatching `visibilitychange`): 2 to 3
  `/api/browser` requests per 25 to 31 s while visible, 0 in 21 s hidden,
  1 within a second of showing the tab again. Before S4 the code polled
  6 times a minute from `App` and once from `Layout`, hidden or not (read
  from source, not measured).
- S4, chunk failure: with `PilotsList-*.js` renamed away while the
  dashboard was open, clicking Leaderboards reloaded the page once, then
  showed the ErrorBoundary's "APPLICATION RECOVERY" screen, not a blank
  page. The dashboard opens on the Server Browser tab (22 servers).
- S4, server tests: `npx vitest run` passes 5 files, 57 tests. New:
  `server/routes.test.js` (page 1 answers while the mocked sync never
  resolves, a failed background sync still answers, an empty page waits
  for the sync, a PPI miss returns `{}` without calling
  `refreshPilotStats`), a pragma check that reads `journal_mode`,
  `synchronous` and `busy_timeout` back from both connections, and a
  backup and restore round trip on the live connection. With S3's
  `routes.js` and `db.js` swapped back in, the pragma, page-1 and PPI
  tests fail (the page-1 test times out at 5 s).
- S4, server (`PORT=3100 DATA_DIR=/tmp/ofc-data npm start`, dev mode, no
  secrets, fresh data dir): `/api/stats/global` returns `total_games: 25`
  after the startup sync. `/api/games?page=1` more than 30 s after the
  last sync returned in 0.0019 s, with `[Sync] Fetching page 1` logged
  after it. `/api/pilot/NOBODY/ppi` returns `{}` in 0.001 s. The wasm
  goes out as br (8,367,469 bytes) for `gzip, deflate, br, zstd`, gzip
  (10,257,774 bytes) for `gzip` or `br;q=0, gzip`, and raw (32,232,419)
  for `identity`, each with `public, max-age=3600`. Both copies decode to
  bytes identical to `public/ffmpeg/ffmpeg-core.wasm`. Icons and
  `ffmpeg-core.js` get `max-age=3600`, `/assets/*` one year immutable,
  `index.html` and SPA routes `no-store`. Logged in as `admin123`,
  `/api/admin/backup` returned a 507,904-byte file that `sqlite3` reads
  (50 games, `integrity_check` ok) and left nothing in `uploads/`;
  posting it to `/api/admin/restore` succeeded and the server kept
  serving `/api/stats/global` and `/api/games`.
- S4: `npx tsc --noEmit` exits 0 (JSX still untyped).
- S4: brotli on the 32 MB wasm in Node 22: quality 5 8.57 MB in 0.5 s,
  quality 9 8.37 MB in 2.1 s, quality 11 7.28 MB in 60.5 s; gzip level 9
  10.26 MB in 0.7 s.

- S3, before the fix: the new `server/backfill.test.js` run against S2's
  `db.js` and `backfill.js` failed 4 of 10 tests. A page-1 summary wiped a
  hydrated kill log in hot and in cold storage, and `getSummaryGames`
  returned no rows at all. The two hydration-loop tests passed only because
  the old filter found nothing to hydrate.
- S3, `insertGame`: from a script file on Node 22.17.0 (how `npm start`
  runs), `db.insertGame.run(...)` on the old code threw `ReferenceError:
  module is not defined`, so every backfill fetch was recorded as failed.
  After the fix it returns 1. The vitest test for it passed on the old code
  too, because vitest's module runner defines `module`; this script run is
  the before/after proof.
- S3, after: `npx vitest run` passes 4 files, 50 tests, on Node 22.17.0.
  They include a hydrated game surviving a summary upsert (hot and cold), a
  summary still being replaced by a hydrated game, the hydrate filter
  skipping hydrated and 30 s games, backfill marking a fixture game
  `fetched` with its kill log stored, a hydration job that finishes when
  the tracker returns no kills or every fetch fails, a resumed job starting
  after `current_id`, and day bounds at 23:59:59.999 and the next midnight.
- S3, loop guard: with the cursor update removed from `processHydrationJob`,
  three hydration tests time out at 5 s instead of passing.
- S3, `EXPLAIN QUERY PLAN` on the synced dev DB: `date LIKE '2026-10-05%'`
  is `SCAN games USING COVERING INDEX idx_games_date`; `date >= ? AND date
  < ?` is `SEARCH ... (date>? AND date<?)`. Both return the same 13 rows.
- S3: `PORT=3100 DATA_DIR=/tmp/ofc-data npm start` (dev mode, no secrets,
  fresh data dir) syncs 25 games and serves `/api/stats/global` with
  `total_games: 25`. A second page-1 poll went through the new upsert
  without errors. `/api/fight-nights/foo` returns 404. A request made
  before the startup sync finishes caches `total_games: 0` for that key, so
  wait for `Startup sync complete` in the log before checking.

- S2, before the fix: `server/db.test.js` (built from the two sample files)
  run against the unchanged `db.js` failed 10 of 14 tests. MAESTRO's
  flipped ORANGE win and 10-10 tie came out as 0 wins, 0 ties. ZERGLING's
  FFA game was timed at 900 s (`timeLimit`) instead of 911 s. "JFTP" and
  "jftp" got two cache rows. `getPilotStats` reported 0 suicides. The
  longest match was 72084 (by its 1200 s limit, though it ran 702 s).
  `isPilotFirstSeenOnDate` called SOUP new although a 2019 game sits in
  cold storage, and called `J_TP` new through the `_` wildcard. The
  fight-night recap counted 16 pilots instead of 15.
- S2, after: `npx vitest run` passes 3 files, 38 tests, on Node 22.17.0.
  They include an ORANGE win, a tie (team 10-10 and the 2019 Monsterball
  1-1), an FFA win, more than two teams, a duration from `date -
  settings.start` (910.849 s for 72108), suicides from a kill log, merged
  spellings, cold-storage first-seen, a literal `_`, and a 1v1 Monsterball
  whose winner had fewer kills.
- S2: `getMarathonMaps` on 25 fixture games put on one map returned
  565.762 s, the mean of `durationOf`. The old SQL gives 0 for live-era
  games, which carry no top-level `start`.
- S2: `PORT=3100 DATA_DIR=/tmp/ofc-data npm start` (dev mode, no secrets,
  fresh data dir) still serves `/api/stats/global` (`total_games: 25` after
  the startup sync). `/api/stats/pilots`, `?source=all`, `/api/stats/maps`,
  `/api/pilot/:name/stats` and `/breakdown` return JSON, and the log shows
  `[PPI] Successfully refreshed 23 pilots` with no new errors.
- S2, cost of the new suicide count in `getPilotStats` (synthetic in-memory
  DB, 20k games with 120-entry kill logs): old query 0.37 s, a per-player
  subquery 16.1 s (rejected), the grouped pass that shipped 2.9 s. The JS
  functions `net_kills` and `pilot_key` add about 2% on their own.

- Scripts: the password was in five tracked scripts, not the three listed
  here before; the grep pattern missed `inspect_ds1515b.py` and
  `update_reverse_proxy.py`, which target `192.168.0.105`. The owner's commit
  `5516729` on `main` fixed all of them plus `docker_build_synology.py`: each
  reads `NAS_SSH_PASSWORD` and exits if it is unset (no `getpass` prompt).
  S1 dropped its own script changes in favour of that commit. On `5516729`,
  `grep -rnE "password=['\"]" scripts/` prints nothing, and `git log -p -S`
  for the old password over `origin/main` finds nothing.
- S1, startup: on Node 22.17.0, `NODE_ENV=production npm start` with both
  secrets unset prints `Refusing to start: ADMIN_PASSWORD and SESSION_SECRET
  must be set when NODE_ENV=production. See .env.example.` and exits 1 before
  creating any file in `DATA_DIR`. With only `SESSION_SECRET` unset it names
  just that one. With both set it starts and `/api/stats/global` returns JSON
  (`total_games: 25` after the startup sync). Without `NODE_ENV` it logs a
  warning and `admin123` logs in.
- S1, routes (curl against the running server): without a session,
  `/api/overload/status`, `/api/overload/pilot/Soup`, `POST
  /api/overload/install`, `POST /api/overload/pilots/delete`, `POST
  /api/fight-nights/check` and `POST /api/analyze-match` return 401. After
  login, `/api/overload/status` and `POST /api/fight-nights/check` return 200.
  `/api/import/warmup` stays public (200).
- S1, pilot names: logged in, a clone to `../../evil` and settings for `../x`
  return `Invalid pilot name`. `npx vitest run` passes 3 tests; removing the
  guard in `getPilotData` makes the traversal test fail.
- S1, login: ten wrong passwords return 401, the eleventh and twelfth 429, and
  the right password from the same IP is also 429 until the window ends.
  Fifty wrong passwords, each with a different `X-Forwarded-For`, return 401
  and then 429 from the 51st (the cap across all clients). After a restart the
  right password returns 200, and a password one character shorter or longer
  returns 401. The session cookie carries `Secure` when the request has
  `X-Forwarded-Proto: https` and not on plain HTTP.
- S1, compose: `docker compose -f docker-compose.prod.yml config` with neither
  secret set fails with `required variable ADMIN_PASSWORD is missing a value`.
  With both set, both appear in the rendered environment. Checked with Docker
  Desktop's `docker compose` v2, not the NAS's `/usr/local/bin/docker-compose`.
- `server/routes.js:723` pins `gemini-2.0-flash`. Checked by grep.
- CSP at `server/index.js:70-74` has no `frame-src`; COEP is `require-corp`.
  Read from source.
- Before S4, production bundle: one JS chunk, 1,291.65 KB raw / 351.00 KB
  gzip, built with `npx vite build` on Node 24 after `npm ci
  --ignore-scripts`. No `React.lazy` or dynamic `import()` anywhere in the
  client.
- `public/ffmpeg-core.wasm` (32,232,419 bytes) was a byte-identical
  duplicate of `public/ffmpeg/ffmpeg-core.wasm` (`cmp`, as was
  `ffmpeg-core.js`) and nothing referenced the root copy. Deleted in S4.
- `@types/react` and `@types/react-dom` are not in `package.json`; `tsc
  --noEmit --strict` reports 6,135 errors.

## NOT validated, do not claim these work

- S21: the belts and achievements on the NAS's 75,000 or so matches. On
  76 local matches, all from October 2026, there are 5 reigns and no
  defense past 2; nobody has seen how many reigns the history since 2019
  gives each mode, who holds each belt there, how many pilots reach each
  tier, how long the pass adds to a refresh, or how much memory it keeps
  in the worker (each rated match is held as its counts until the scan
  ends).
- S21: the tier thresholds were set by reasoning about the NAS's history,
  not checked against it: locally only belts, Boss Slayer, Rampage, Hot
  Streak and Duelist reach a tier.
- S21: no CTF or Monsterball belt exists locally (one CTF match, 0-0), so
  the captures and goals rule ran on fixture copies only.
- S21: the NEW CHAMPION field went to the S18 stub webhook in tests, not to
  a real channel (the S18 [HUMAN] task is still open), and no real night
  passed the thresholds, so the detector never posted one locally.
- S21: the anniversary on a real anniversary: tested with a set `today`;
  the local data is five days old, so nobody has one.
- S21: no screen reader on the belt marks, the tier pips or the progress
  bars; the marks carry their modes in text and the tiles their tier's
  name. Headless Chrome 154 on macOS only, at 1,280 and 390 px; not
  Safari, Firefox or a real phone.
- S21: the belt marks' 10-minute refresh was read from the code, not
  watched across a stats refresh in an open tab.

- S20: no tape link was pasted into Discord or any other chat, so the
  tape's preview is checked by curl and by looking at the PNG only.
- S20: `pilot_bouts` at production size. 520 rows for 62 local matches;
  nobody ran the S13 bench's 75,000 synthetic matches through the new
  pass, so its row count, the worker's comparison time and the first
  write on the NAS are unknown.
- S20: no screen reader was tried on the tape; the split bars carry a
  screen-reader sentence each and the map splits a caption.
- S20: the tape was not checked in Safari or on a phone, only in
  headless Chrome at 390 px.

- No link was pasted into Discord, X, Slack or anything else: the site is
  not public from this machine. Whether Discord shows the card large,
  which needs `twitter:card` and a fetch of `/api/card/...`, is unknown,
  and so is how a real crawler's timeout compares with the first draw on
  the NAS.
- No recap posted to a real channel with its image (the S18 [HUMAN] task
  is still open); the stub webhook received the embed with the image URL.
- The cards were drawn on this Mac and in the arm64 image only. The NAS's
  amd64 image installs `resvg-js-linux-x64-musl`, which CI's Docker job
  builds but nobody has run; the draw time on the DS1515+'s Atom is
  unknown.
- Memory under load: the cache's 20 MB cap was tested with a lowered cap
  on stub cards; nobody has watched the process's memory with 200 real
  cards or a crawler walking the pilot pages.
- CJK and emoji names draw blank characters (flagged); right-to-left
  scripts were not tried.
- Headless Chrome 154 on macOS only, at 1,280 and 390 px; the cards were
  looked at as PNG files, not inside a chat client's preview.
- The amd64 image CI built for PR #20 was not run, so no card was drawn
  with `resvg-js-linux-x64-musl`.

- Nothing has posted to a real Discord channel: the [HUMAN] webhook task
  is open, so every post went to a local stub. Whether Discord renders
  the embed as planned (the escaped names, the ▲▼ field name, the inline
  pair at 390 px in the app), whether a real 429 carries `Retry-After` in
  the header or only the body, and how long a real post takes are
  unknown.
- The server never pinged on its own: the real server browser showed 0
  pilots all session. The ping ran from the tick code in tests and a
  `node` script with players added to a real answer.
- The ping's rising edge lives in memory and starts at 0 pilots, so a
  restart during an evening still on after 06:00 pings the new
  fight-night day a second time. Accepted as is: it takes a deploy or a
  crash inside that window. No test covers it.
- No local night passes the fight-night thresholds, so the recap posts
  were checked with them lowered; on the NAS nothing posts until a real
  night qualifies.
- The recap's stats refresh before the rankings ran on 48 matches; how
  long it holds the post back on the NAS's 75,000 is unknown.
- Headless Chrome 154 on macOS only, at 1,280 and 390 px. Not Safari,
  Firefox or a real phone; no screen reader on the switch.
- The Docker `build` job on PR #19 at the time of writing: Docker Hub's
  429 to the runner stopped it before the build; see the PR's checks.

- S17 ran on the 43 local matches (five with both logs, all Anarchy or
  Team Anarchy), the fixtures with hand-written logs and mocked answers.
  Nobody has run it on the NAS: how many matches there carry a damage log
  as well as a kill log, how many rows `pilot_rivals` reaches (both
  directions of every pair), how long the first refresh with the new pass
  takes, and how long the network's first read after a refresh blocks
  the main thread.
- No real match had a team kill, a death without an attacker, a blank
  defender, a pilot listed without a team, a damage log without a kill
  log or a malformed log entry; those rules are tested on fixtures only.
- The 12 × 12 grid with long names and five-figure damage, and 25 pairs,
  came from mocked answers; the local network has 12 pilots and 25 pairs
  but short names.
- Headless Chrome 154 on macOS only, at 1,280 and 390 px. Not Safari,
  Firefox or a real phone (the grid's and the pairs table's sideways
  scroll on touch); no screen reader on the bars' sentences, the tiles'
  `dl` or the heat tables. The cell hovers are `title` tooltips, checked
  in the DOM only.
- CI on the S17 PR before it opened; see the PR's checks.

- S16 ran on the 43 local matches (five with kill logs, 20 duels, one
  CTF match with no flag stats, no Monsterball), the fixtures and mocked
  answers. Nobody has run it on the NAS: how many of its 75,000 matches
  carry a kill log (the audit says mainly 2019-07 to 2022-04), how large
  `pilot_weapons`, `pilot_maps` and `pilot_duels` come out there, how
  long the first refresh with the three new passes takes, and whether
  the duel ladder's bar of 5 lists a sensible number of pilots.
- No Monsterball match exists locally, so that board was only seen on a
  mocked answer; the CTF board on a 1v1 with zero captures. The
  per-player objective fields were read from the detail sample and the
  local CTF match only.
- The weapon meta's map rows were seen on five maps; the 25-map table
  and the 20 × 12 grid came from mocked answers.
- Headless Chrome 154 on macOS only, at 1,280 and 390 px. Not Safari,
  Firefox or a real phone (the heat tables' horizontal scroll with
  pinned row labels on touch); no screen reader on the heat tables'
  cell text, the dumbbell's `role="img"` label or the divider row. The
  cell and row hovers are `title` tooltips, checked in the DOM only.
- The mid-write case the ladder's record fallbacks cover (a snapshot
  read before its record during a chunked first fill) was reasoned
  about, not reproduced.
- The NAS image: PR #17's `check` (tsc, build, vitest on Node 26)
  passed in 51 s and docker-publish's `build` in 1 min 26 s, but nobody
  has run the image.

- S15 ran on the 40 local matches, the fixtures, a few minutes of real
  ticks from today's feed and mocked answers. Nobody has run it on the
  NAS: the region share over 75,000 real matches (how many old archive
  matches carry no server and come out Unknown), the first refresh's
  extra pass time, and the size of a month of ticks there.
- No whole fight-night day of real ticks exists yet, so uptime, in use,
  pilots and the peak hours were only seen on mocked answers and unit
  tests. The 03:00 prune and an offline tick for a server that really
  dropped off the tracker's list were exercised by tests only.
- What the tracker's `online` flag means (how long a crashed server stays
  "online") was not checked.
- Headless Chrome 154 on macOS only, at 1,280 and 390 px. Not Safari,
  Firefox or a real phone (the region chart's horizontal scroll on
  touch); no screen reader on the new tables, captions or `role="img"`
  labels. The hour and month hovers are `title` tooltips, checked in the
  DOM only.
- The CI workflow on the S15 PR before it opened; see the PR's checks.

- S14 ran on the 40 local matches (four days), the fixtures, mocked
  answers and a synthetic history. Nobody has run the first start on
  the NAS: how many rating days move, how long the recap rebuild takes
  over a year of real nights, which recaps it removes and which it saves,
  and whether any real night still meets the thresholds on the new day.
- The detector's 06:15 run has not happened; it was only scheduled. The
  next one locally was 2026-10-09T11:15Z.
- The heatmap and the calendar with a real year of data: only mocked
  answers filled them. The 12-week window and the five ramp steps were
  judged on mocked shapes.
- Headless Chrome 154 on macOS only, at 1,280 and 390 px, plus a Tokyo
  time-zone override. Not Safari, Firefox or a real phone (the
  calendar's horizontal scroll on touch, the heatmap's 10 px cells); no
  screen reader on the heatmap table, the sparklines' labels or the
  rating change's sr-only words. The sparkline and calendar hovers are
  `title` tooltips, checked in the DOM only.
- The admin page's calendar (`/api/admin/stats/calendar`, now fight-night
  days) was not opened.
- The DST days: `dayBounds` and `localClock` are tested on 2026-03-07/08
  and 2026-10-31/11-01, but no stored match falls on one.
- The CI workflow on the S14 PR before it opened; see the PR's checks.

- Node 26: nobody has run the new image on the NAS or opened its real
  databases with better-sqlite3 13 (SQLite 3.53.4). The amd64 image is
  checked only by docker-publish's pull-request build; this Mac builds
  arm64.
- Node 26: `npm run dev` was not run, on 26 or on the default 24.6.0.
  The tests loading the same binary on 22, 24 and 26 suggest the
  "Connection failed" postmortem is gone; nobody looked at the page.
- Node 26: `node:26-alpine` is a Current release until 2026-10-28 and
  the tag moves to each new 26.x; a later 26.x was not tried.
- Node 26: `scripts/deploy-synology.ps1` and
  `scripts/rebuild_and_deploy_nas.py` were not run.
- S13 ran on the 40 local matches (39 rated, 5 with teams, one CTF),
  the sample fixtures and a synthetic history. Nobody has rated the
  NAS's 75,000 or so real matches: the ratings, who is ranked, the
  worker's memory with the rating pass added (the synthetic run's heap
  was 290 MB) and the first fill's chunked write there are unknown.
- Whether the parameters suit pickup Overload: τ 0.5, a match counting
  as one game, 10 matches and 28 days to be ranked. They were picked by
  reasoning and the synthetic run, not tuned on real results.
- No Monsterball, Race or more-than-two-team match was rated from real
  data; the rules for them are tested on fixtures only.
- Headless Chrome 154 on macOS only, at 1,280 and 390 px. Not Safari,
  Firefox or a real phone; no screen reader on the movement labels or
  the chart's label. The chart's tooltip was checked by a synthetic
  mouse move only.
- The movement column was checked with mocked data only: the local data
  is four days old, so every ranked pilot is NEW.
- The CI workflow on the S13 PR before it opened; see the PR's checks.

- S12 ran on four real kill logs (the local data) and hand-written logs
  on two fixture games. No team kill, no death without an attacker, and
  no CTF or Monsterball kill log was seen, so those rules are untested
  against the tracker.
- Checked in headless Chrome 154 on macOS only, at 1,280 and 390 px. Not
  Safari or Firefox (their range input styling and `accent-color`), not a
  real phone's touch drag on the slider, not a screen reader on the
  slider's `aria-valuetext`.
- Dragging the slider was not timed on a slow phone. Each step replays
  the log once (about 200 entries) and redraws the table and one cursor
  line; nothing was profiled.
- MatchReplay was opened, played, stepped and its first blood and colours
  read; its story mode, theater mode and speeds were not run after the
  change.
- The CI workflow on the S12 PR before it opened; see the PR's checks.

- S11 compared the four components in headless Chrome 154 on macOS with
  mocked `/api/overload/*`, `/api/import/*` and admin answers. Not run:
  an actual taunt export or install, a YouTube or archive import that
  loads audio into the editor, ffmpeg video extraction, a key actually
  rebound and saved, pilot files read from a real Overload folder, the
  admin backfill, map sync and archive ingest actions.
- The split server ran only on the 30-match local data and the test
  fixtures, not on the NAS or its 2.8 GB cold file. The module split
  changes the order statements are prepared in, not their SQL.
- 390 px was not re-checked; the DOM is identical at 1,280 px.
- The CI workflow on the S11 PR before it opened; see the PR's checks.

- S10 was checked in headless Chrome 154 on macOS only. Safari,
  Firefox and a real phone were not tried: not Safari's table layout
  for the cell links, not focus return in Safari (which does not focus
  a clicked button, so a dialog opened by mouse there returns focus
  nowhere), not a real touch screen. No screen reader was run;
  `role`, `aria-*` and the cell links' reading order were checked in
  the DOM only.
- 390 px only. 375 and 320 px were not measured.
- The pilot clone and key rebind dialogs ran against mocked
  `/api/overload/*` answers, not a connected Overload folder. Their
  actions (clone, rebind) were not run.
- The roster's pages were checked with 146 pilots (130 made up), not
  production's thousands; the "Search all N pilots" box and the sort
  were not timed on a large roster.
- Recap copy from `fightNightService.js` was not regenerated in the
  session; the new wording was read in the source. Recaps saved before
  S10 keep their old words.
- The CI workflow on the S10 PR before it opened; see the PR's checks.

- S9 was checked in headless Chrome 154 on macOS, at 1,280 and 390 px
  only. Safari, Firefox and a real phone were not tried. Pages other than
  the five screenshotted were not compared before and after; they lost
  only dead classes, which render nothing, and gained the shared states.
- The shared states were forced with mocked responses. A real slow
  tracker, a real outage, and the admin page with a real login were not
  tried; the admin states ran on a mocked session.
- Whether the taunt tools' busy icons and the editor's engine banner,
  left as they were, read well beside the new states.
- The 10px floor for small text was judged from screenshots, not
  against a contrast or size guideline (S10 owns accessibility).
- The CI workflow on the S9 PR before it opened; see the PR's checks.

- S8 was checked in headless Chrome 154 on macOS only. Ctrl-click
  opening a tab on Windows and Linux, Firefox and Safari (including
  their limits on rapid history writes), and a real phone were not
  tried.
- No link was pasted into Discord: the site is not public from this
  machine. The tags were read with curl. Whether Discord's crawler
  shows them as expected is unknown.
- Whether the DSM reverse proxy passes the original `Host` header.
  `og:url` uses it; if the proxy rewrites it to the container's address,
  the tag points there.
- The cost of the share-tag lookup on production data: one indexed
  `game_players` read per pilot page load and one details parse per
  match page load, on the main thread. Timed on 25 games only.
- Scroll position after back: a new path scrolls to the top, as before
  S8, so back returns to the top of a list rather than to the row.
- The live page with a real live game, and fight nights that met the
  thresholds; both recaps were forced.
- The CI workflow on the S8 PR before it opened; see the PR's checks.

- S7's UI was checked in headless Chrome 154 on macOS only. Safari,
  Firefox and a real phone were not tried; the 390 px menu was opened
  in device emulation.
- The live page with a real live game. No server had one during the
  session, so the game came from a mocked `/api/game/<ip>`. The copy
  button was not tried on the HTTPS site behind the DSM proxy.
- The teaser with a fight night that met the thresholds; the one shown
  was forced.
- The MapLibrary counts and the match result on production data. The
  dev database held 25 games, two of them team games.
- The CI workflow on PR #7 before it opened; see the PR's checks.

- S6, on the NAS: the chown, the 03:00 backup of the real 2.8 GB cold
  file (time, disk, whether the backup API's copy slows requests), the
  rotation over 8 real nights, and a restore from a real backup. The
  backup and restore were run in a local container on 25 games.
- Whether DSM's ACLs on `/volume1/docker` let uid 1000 write after a plain
  `chown`, and whether the NAS's `/usr/local/bin/docker-compose` honours
  `logging` and the `start_period` in a `version: '3.8'` file. Checked with
  Docker Desktop 29.2 and Compose v5.1 only.
- The first start of the S6 image over the NAS's real data: how long the
  S5 backfill and the repair take there, and whether 120 s of start period
  covers them. Health stays "starting" meanwhile and nothing restarts on
  it.
- The image on the DS1515+ (x86-64 Atom): built and run on Docker Desktop
  for Mac only. A yt-dlp search or extract was not run in it; `python -m
  yt_dlp --version` answered (2026.08.19) and the server logged the
  pre-warm.
- The CI workflow on GitHub before this PR opened; see the PR's checks.
- The UI after the type changes in `LiveGameDetail` and `PilotsList` was not
  opened in a browser. Both changes are type-only; the build output is the
  same size.

- S5 was proven on fixture games and a synthetic 1.6 GB copy, not on the
  NAS. Nobody has run the backfill on the real 2.8 GB cold DB (it took
  9.7 s for 55,000 synthetic games on a Mac; the NAS's game count and CPU
  are unknown, and the server does not listen until it ends), timed the
  worker or the pilot pages there,
  or watched the worker's memory on the NAS's 2 GB (RSS 378 to 397 MB at
  the end of a refresh on the synthetic copy, 304 MB on S4).
- Whether real games list a pilot twice, or carry names that differ only
  in non-ASCII case. The synthetic data had the first; the samples have
  neither.
- The cold move was tested with a crash simulated by a game already in
  both files, not with a real crash between its two transactions. No
  nightly run has happened on S5 code.
- A database restored from a real pre-S5 backup through the admin page.
  The test restored a file built with the old schema through
  `db.restoreHot`.
- The worker in the Docker image on the NAS. It ran under vitest, plain
  `node` and `npm start` on macOS.

- S2's fixes were proven on fixture games only. No production database
  exists locally, so nobody has compared old and new pilot numbers on real
  rows, or timed `refreshPilotStats` and the `getPilotStats` suicide pass
  against the 2.8 GB cold DB on the NAS.
- Whether any stored game has a team named other than BLUE or ORANGE, more
  than two teams, or a team game without `teamScore`. `winnerOf` handles
  all three; none appears in the samples.
- S3's fixes were proven on fixture games only. No hydration job has run
  against the real tracker. Nobody checked whether `/api/game/:id` returns
  a kill log for live-era games (the audit says logs exist mainly for
  2019-07 to 2022-04), how many hot games the job will now request, or how
  long `getSummaryGames` takes over a year of hot games (`duration_of`
  parses each kill-less row in JS).
- Whether a hydrated game and the gamelist summary of the same game differ
  in fields other than the kill log. The upsert keeps all of the stored
  details, not only `kills`.
- S4 was checked on a 50-game dev database. Nobody has run WAL, the
  `.iterate()` refresh or the backup API against the 2.8 GB cold DB or on
  the NAS's volume, timed `refreshPilotStats` there, or watched how large
  `tracker.db-wal` grows during a refresh.
- Whether the NAS volume supports WAL's shared-memory file. WAL does not
  work on network filesystems; a local Docker volume should be fine.
- Whether the DSM reverse proxy passes `Content-Encoding: br` through
  unchanged and leaves the precompressed wasm alone.
- The Create tab was opened once in headless Chrome. Nobody trimmed or
  exported a taunt after the editor change, or switched tabs mid-edit to
  check that the edit survives.
- The hidden-tab test overrode `document.hidden` and fired the event by
  hand. A real background tab, and Safari or Firefox, were not tried.
- The admin backup and restore were driven with curl, not from the admin
  page.
- The `vite:preloadError` reload was seen only with a chunk renamed away
  locally, not across a real deploy.

- The admin panel's hydrate job (start, pause, resume) was not used in a
  browser.
- The PilotsList K/D tooltip text was not looked at in a browser.
- The calendar iframe being blocked was inferred from headers plus a curl of
  the Google embed's resource policy, not observed in a browser.
- Mobile overflow at 375 px and nav crowding between 768 and 1,150 px were
  inferred from CSS.
- Whether the single-thread ffmpeg core still needs COOP/COEP.
- Whether the DSM reverse proxy on `192.168.0.105` sends `X-Forwarded-For`
  and `X-Forwarded-Proto`. S1 sets `trust proxy` to one hop and relies on both
  (per-IP login limit, `Secure` cookie). The existing HTTPS redirect already
  reads `X-Forwarded-Proto`, which suggests it is sent, but nobody checked
  on the NAS.
- None of the SSH scripts was run against the NAS after `5516729`.
- Whether GitHub still serves the pre-rewrite commits by SHA. Purged commits
  can stay reachable by direct SHA until GitHub garbage-collects them.
- The taunt and pilot-settings pages for a visitor who is not logged in were
  not opened in a browser. `/api/overload/status` now returns 401 for them;
  `OverloadFsContext` reads that as "no server access" and falls back to the
  browser folder picker, which is what the code says should happen.
- The Docker image was not built or run with the new compose files. S6
  built and ran the image with `docker run`, ran `docker-compose.yml` with
  `docker compose up` (Docker Desktop), and rendered the prod compose file
  with `docker compose config`. Not on the NAS.

## Ground rules

- One session, one queue item, one PR. No auto-chaining into the next item.
- Never merge a PR. Never push to `main`. A push to `main` builds and publishes
  `ghcr.io/jasonjkehoe-alt/overloadfight.club:latest`.
- No Co-Authored-By or other attribution trailers in commit messages.
- Surgical diffs: touch only what the item needs. Adjacent dead code gets a
  line in "Flagged, not fixed", not a deletion.
- Match existing style (Tailwind utility classes, functional React, ES modules
  on the server). Do not introduce a router library, state library or ORM
  without a decision entry here.
- Every stat change ships with a test on fixture games
  (`gamelist_sample.json`, `game_detail_sample.json`). The test runner is
  decided in S1 (see Decisions).
- Secrets come from the environment only. Nothing secret in tracked files.
- Prose the user reads (PR descriptions, this file) follows the `unslop` skill.
- A hook blocks reading any file over 350 lines in one go. Read sections with
  `sed -n 'START,ENDp' <file>` or `grep -n`.

## Canonical contract, do not change without asking

- The tracker's upstream data shape: `types.ts` (`GameData`, `PlayerData`,
  `KillEvent`, `DamageEvent`) and the two sample files at the repo root. The
  tracker at `tracker.otl.gg` owns this shape; the site adapts to it.
- The `games(id, date, ip, details)` table and the hot/cold split
  (`server/db.js:37-54`). New tables may be added beside it; it is not
  replaced until S5 lands a migration with a decision entry.
- The public API paths listed in `services/apiService.ts`. Add endpoints;
  rename or remove only with a decision entry.

## Environment

- Repo: `git@github.com:jasonjkehoe-alt/overloadfight.club.git`. The local
  clone at `~/Repositories/claude/overloadfight.club` may be stale; always
  `git fetch origin` and base work on `origin/main`.
- Node: use 26 (`nvm use` reads `.nvmrc`; 26.11.1 is installed). The nvm
  default is 24.6.0. better-sqlite3 13 is one N-API binary, so the same
  install also runs on 24.6.0 and 22.17.0, but check things on 26.
- Install: `npm ci`. Nothing compiles: better-sqlite3 13 ships prebuilds
  for darwin, linux and linuxmusl on x64 and arm64.
- Build: `npx vite build` (do not use `npm run build`; its `prebuild` rewrites
  the tracked `public/version.json`).
- Run locally: `PORT=3100 DATA_DIR=/tmp/ofc-data npm start`. The server creates
  empty databases. There is no production data locally; use the sample JSON
  files as fixtures.
- Env vars the server reads: `PORT`, `DATA_DIR`, `NODE_ENV`, `ADMIN_PASSWORD`,
  `SESSION_SECRET`, `REDIS_URL`, `GEMINI_API_KEY`, and since S18
  `DISCORD_WEBHOOK_URL` (a secret; posting also needs the admin switch)
  and `SITE_URL` (the origin a post links to, default
  `https://overloadfight.club`). None are set locally.
  `.env.example` lists them. Without `NODE_ENV=production` the server falls
  back to `admin123` and a dev session secret with a warning; with it, both
  secrets are required. The SSH scripts in `scripts/` read `NAS_SSH_PASSWORD`
  and exit if it is unset.
- No ports or databases are shared between worktrees. Pick a port above 3100.
- Deploy: push to `main` → GitHub Actions builds and pushes the image. The NAS
  pulls it manually (`docker-compose.prod.yml`, see `DEPLOYMENT.md`).

## Verification

| Command | Expected | Last result | Date |
|---|---|---|---|
| `grep -rnE "password=['\"]" scripts/` | no output after S1 | no output (S1) | 2026-10-06 |
| `nvm use 26 && npm ci` | installs, `better-sqlite3` loads its bundled prebuild, nothing compiles | 26.11.1: exit 0, `build/` holds stamps only, `darwin-arm64.node` loads (Node 26) | 2026-10-08 |
| `npx vitest run` | all pass | 24 files, 427 tests pass on 26.11.1 (S21; 387 at its start) | 2026-10-10 |
| `NODE_ENV=production PORT=3100 DATA_DIR=/tmp/ofc-data npm start` without `ADMIN_PASSWORD`/`SESSION_SECRET` | exits 1 with a message naming both | exits 1, message names both | 2026-10-06 |
| `npx vite build 2>&1 \| grep -E "assets/.*\.js"` | after S4: several chunks, main under 150 KB gzip | entry 234.57 KB raw / 75.21 KB gzip (S21; 234.10 / 75.04 at its start), new `Belts` 7.53 KB / 2.29 KB and `BeltMark` 0.58 KB / 0.39 KB, `PilotDetail` 55.64 KB / 14.33 KB, `PilotsList` 18.42 KB / 5.26 KB, `PowerRankings` 4.33 KB / 1.58 KB, `Ladders` 8.32 KB / 2.59 KB, `Tape` 11.02 KB / 3.67 KB, `Rivals` 7.36 KB / 2.50 KB, dashboard `GameList` 41.75 KB / 11.46 KB gzip and no Recharts on its first visit, on 26.11.1. Unchanged since S20: `GameDetail` 124.19 KB / 40.12 KB; since S19: `AdminPanel` 35.18 KB / 9.32 KB, `FightNightSection` 14.13 KB / 3.05 KB, `MapLibrary` 34.26 KB / 8.93 KB (one 351.07 KB chunk before S4) | 2026-10-10 |
| `npx tsc --noEmit` | 0 errors with the React types installed | 0 errors on 26.11.1 (S21) | 2026-10-10 |
| `PORT=3100 DATA_DIR=/tmp/ofc-data npm start` then `curl -s localhost:3100/api/stats/global` | JSON body | JSON on 26.11.1, S21 on `/tmp/ofc-data`: `total_games: 76`; `/api/stats/pilots`, `/api/pilot/WD-40/stats`, `/api/stats/rankings`, `/api/stats/heatmap`, `/api/pilot/WD-40/career`, `/api/stats/regions`, `/api/server/143.110.230.67/history`, `/api/stats/weapons`, `/api/stats/duels`, `/api/stats/rivalries`, `/api/pilot/WD-40/rivalry`, `/api/pilot/:a/tape/:b`, `/api/pilot/WD-40/opponents`, `/api/card/pilot/WD-40`, `/api/card/tape/:a/:b` and `/api/health` all 200; new `/api/stats/belts` and `/api/pilot/:name/achievements` 200 (zeros for an unknown pilot), `/api/card/belts` 200 `image/png` | 2026-10-10 |
| Same server, `curl -s localhost:3100/pilot/WD-40 \| grep -E 'og:\|twitter:'` (and a match, a fight night and a map) | the page's own `og:title`, `og:description`, `og:url`; since S19 `og:image` on the request's origin, its size and alt, `twitter:card` | "WD-40: 23 matches, 380 kills, last match 2026-10-07." with its `og:image` (S21, unchanged); `/belts`: "Champions: Anarchy BOOGEYMAN (since 2026-10-06, 0 defenses), Team Anarchy KAUMRAPSEL (since 2026-10-05, 0 defenses)." with `og:image` `/api/card/belts?v=...`; a champion's pilot description ends with their belt; the S19 and S20 cards' `og:image` all 200 `image/png` (S21) | 2026-10-10 |
| `docker build -t ofc . && docker run -e ADMIN_PASSWORD=.. -e SESSION_SECRET=.. ofc`, then `docker inspect -f '{{.State.Health.Status}}'` | `healthy`, uid 1000 | `node:26-alpine` (cached locally), arm64: healthy, uid 1000, resvg's `linux-arm64-musl` prebuild with no object file, a card drawn in the container, 619 MB (S19) | 2026-10-09 |
| Same container, `docker stop` | exits 0 in well under 10 s, `[Shutdown] Done.` logged | 0.21 s, exit 0, `[Shutdown] Done.` logged (Node 26). S6: under 1 s, no `-wal` left | 2026-10-08 |
| `npx vitest run server/gamePlayers.test.js` (the query-plan tests) | pilot queries on `idx_game_players_name_date`, dated leaderboard on `idx_game_players_date` | both, covering for the pilot lookups, in hot and cold (S5) | 2026-10-07 |
| Same server, `curl -w "%{time_total}" "localhost:3100/api/games?page=1"` more than 30 s after the last sync | answers from the DB, sync logged after | 200 in 0.0019 s, `[Sync] Fetching page 1` logged after it (S4) | 2026-10-06 |
| Same server, `curl -D - -H "Accept-Encoding: gzip, deflate, br" localhost:3100/ffmpeg/ffmpeg-core.wasm` | `Content-Encoding: br`, short cache | br, 8,367,469 bytes, `public, max-age=3600` (S4) | 2026-10-06 |
| Headless Chrome over CDP on the same server serving `dist/` (S7 scripts: dashboard order, nav, favorites across a reload, copy button, match result) | live section above the teaser; Fight Night in the nav; "Copied"; winner, score or podium, duration and result line | all seen, see the S7 Validated entry | 2026-10-07 |
| Headless Chrome over CDP, S8 scripts (real mouse clicks: plain, middle, Cmd, Ctrl, Shift; reload and back on each piece of URL state; a held `/api/game/<id>` for the stale match) | new tab on middle/Cmd click, same document on a plain click, a title per route, state back after reload and back, no stale match | all seen, see the S8 Validated entry | 2026-10-07 |
| Headless Chrome over CDP, S9 scripts (full-page shots of five pages at 1,280 and 390 px with `/api/browser` and the live game replayed; every view's states forced with the Fetch domain; a component made to throw in a view and in `Layout`) | shots the same apart from the token changes; Loading, EmptyState and ErrorState where each view loads, is empty or fails; the recovery screen, with the nav for a view and without it for `Layout` | all seen, 39 of 39 states, see the S9 Validated entry | 2026-10-07 |
| Dead-class script: each `className` token looked up in `dist/assets/index-*.css` | nothing but tab names compared in expressions | as expected (S9) | 2026-10-07 |
| Headless Chrome over CDP, S10 `checks.mjs` (Combat Ratio and Lethality on both pages; Tab through ten pages reading the ring; Tab then Enter on each kind of row; every dialog opened from the keyboard and closed with Escape; roster and map pages across Next, reload, back and the popup; 21 routes at 390 px; a synthesized tap on six kinds of target) | same numbers; every focusable reached with a ring; Enter opens the row; dialogs labelled, focus back on the opener; the page in the URL; nothing wider than 390; opacity or cover change while pressed | all seen, see the S10 Validated entry | 2026-10-07 |
| S10 scratch scripts: `uistrings.cjs` (user-visible strings by TypeScript AST) piped to `glossary.sh`; `tables.cjs`; `clickables.cjs` | 0 variant words for each of the six terms; 13 of 13 tables wrapped; no clickable non-control | as expected (S10) | 2026-10-07 |
| S11 `dbexports.mjs`, run by `node` with a fresh `DATA_DIR`: sorted export names of `server/db.js` and every `db` key with its kind | the same list before and after a change to `server/db*` | identical, 5 exports, 90 keys (S11) | 2026-10-08 |
| S11 `routelist.mjs`: stubs `listen`, imports `server/index.js`, walks `app._router` (routes and middleware); `firstmatch.cjs` on two lists | same set; no URL whose first match changes | 97 entries, same set; 1,931 sample URLs, 0 ambiguous, 0 changed (S11) | 2026-10-08 |
| S11 `capture.sh`: the server on a copy of a frozen data snapshot with `https_proxy` at a closed port, then five API answers plus `/api/health` and `/api/stats/pilots` | byte-identical between two builds | identical, baseline `96f2710` and the branch back to back (S11) | 2026-10-08 |
| S11 `ui.mjs`: headless Chrome over CDP, taunt tabs, editor, the four dialogs from the keyboard, pilot settings tabs, admin with a mocked session, `/api/overload/*`, `/api/import/*`, `/api/admin/*` mocked; `adminreal.mjs` for a real dev login | DOM snapshots, dialog checks and request log the same as the baseline build | 20 of 20 snapshots, every dialog check and the request multiset identical (S11) | 2026-10-08 |
| S12 `real.mjs`, run by `node`: `scoreboardAt`, `leadChanges`, `firstBloodOf`, `verdictOf` on the stored details of every local match with a kill log | each pilot's kills, deaths, assists and each team score as the tracker stored them | 4 of 4 matches exact (78735, 78760, 78761, 78764) (S12) | 2026-10-08 |
| S12 `checks.mjs`: headless Chrome over CDP, a team and an FFA match at 1,280 and 390 px (slider by keyboard and value, `?t=` across reload, chart click, Final score, fight card, cursor position), the other tabs, MatchReplay, a log-less match through the Fetch domain | the table equals `scoreboardAt` at each second, the URL holds `t`, no console errors | 76 of 76 (S12) | 2026-10-08 |
| dataviz `validate_palette.js --mode dark --surface "#111111"` on `chart.weapon` (7 families) and `chart.team` | every check passes | passes, worst adjacent CVD ΔE 8.4 (S12) | 2026-10-08 |
| S13 `real.mjs`, run by `node`: `ratingSides` and `ratingSnapshots` on every local match, compared with `rating_snapshots` | the same rows | 29 of 29 identical, 39 of 40 matches rated (S13) | 2026-10-08 |
| S13 `checks.mjs`: headless Chrome over CDP, `/rankings` (local and 25 mocked pilots, every movement kind, held, failed and empty), `/pilot/WD-40` (the rating card, chart, table, tooltip, request order; 300 days, one day, rank 40, no rating and a 500 mocked), the leaderboard's link, the match page, at 1,280 and 390 px | numbers equal the API, the shared states, no wider than the window, no console errors | 75 of 75 (S13) | 2026-10-08 |
| S13 `bench3.mjs`: 75,000 synthetic matches through `ratingSides` and `ratingSnapshots`, then the worker's comparison and the write | volatility bounded, a normal refresh writes little on the main thread | 288,766 rows; volatility at most 0.0601; replay 0.48 s, comparison 0.77 s, 2.3 ms main-thread write for 50 new matches (S13) | 2026-10-08 |
| dataviz `validate_palette.js --mode dark --surface "#111111"` on `chart.series` | every check passes | passes (S13) | 2026-10-08 |
| S14 `checks.mjs`: headless Chrome over CDP, the dashboard heatmap (local, a mocked year, held, failed, empty), `/history`, `/pilot/WD-40`'s career block (real and a mocked 30-month career; held, failed, empty, no ranked match), the same in Asia/Tokyo, then `/rankings`, `/pilots?min=1`, a match and a fight night, at 1,280 and 390 px | the heatmap equals the API by weekday and hour from 06:00, ramp colours, the career numbers equal the API, the shared states, no wider than the window, no console errors | 148 of 148 (S14) | 2026-10-08 |
| S14 `real.mjs`, run by `node`: `pilotPass` months and `ratingPass` on every local match against `pilot_months` and `rating_snapshots`, months against `pilot_stats_cache`, and the new reads' query plans | the same rows; every pilot's months add up; index searches only | 23 of 23 and 32 of 32 rows, 23 of 23 pilots; covering index or primary key for every read (S14) | 2026-10-08 |
| dataviz `validate_palette.js --ordinal --mode dark --surface "#111111"` on `chart.ramp` | every check passes | passes, darkest step 2.33:1 (S14) | 2026-10-08 |
| S15 `checks.mjs`: headless Chrome over CDP, `/server/:ip` (a real local server; a mocked year at 30 and 365 days; never seen, failed, held), the dashboard's region card (local, 88 mocked months, failed, empty, held), the history links from the server browser and the live page, then the dashboard, `/history`, leaderboard, rankings, a pilot, a match, fight night and the live page, at 1,280 and 390 px | cards equal the answer, ramp and `chart.region` colours only, URL state across reload, shared states, no Recharts on the dashboard, no wider than the window, no console errors | 100 of 100 (S15) | 2026-10-08 |
| dataviz `validate_palette.js --mode dark --surface "#111111"` on `chart.region` (7 hues) | every check passes | passes, worst adjacent CVD ΔE 8.4 in the stack order; a month missing a region puts two non-neighbours side by side, kept apart by the 2 px gap and the legend (S15) | 2026-10-08 |
| S16 `real.mjs`, run by `node` on a copy of the local data: the refresh, then `getWeaponMeta`, `getPilotWeaponMix`, `getSpecialists`, `getDuelLadder` and `getObjectiveBoards` | the tables the server's refresh wrote, the built marker set | the same rows as the server's log (31 map weapon, 67 pilot weapon, 116 pilot map rows, 12 duel snapshots, 10 duel records, 2 objective rows), marker true (S16) | 2026-10-09 |
| S16 `checks.mjs`: headless Chrome over CDP, the maps page's weapon meta and specialists grid (local and 25 maps / 20 × 12 mocked; failed, empty, held), the pilot page's weapon mix (local; no kills, failed, held), `/ladders` on all three boards (local and 40 duelists / 50 CTF / 20 Monsterball mocked; `?board=` by click, reload and a bad value; held, failed, empty), the leaderboard's link, then the dashboard, history, leaderboard, rankings, server page, a match, fight night, the live page and a map popup, at 1,280 and 390 px | shares and records equal the API, ramp and emphasis colours only, URL state across reload, shared states, no new Recharts chunk, no wider than the window, no console errors | 124 of 124 (S16) | 2026-10-09 |
| dataviz `validate_palette.js --mode dark --surface "#111111"` on the dumbbell pair `chart.series,chart.label` | the categorical checks pass but the chroma floor, which a de-emphasis grey fails by design | lightness band, CVD ΔE 15.9, normal-vision 17.0 and contrast pass; chroma floor "reads gray" (S16) | 2026-10-09 |
| S17 `pass.mjs`, run by `node` on the local data: `rivalPass`, `weaponKills`, `damageFlows` and `clutchOf` over every match | the pairs' kills equal their deaths and the weapon meta's kills; the rows the server's refresh wrote | 60 pairs, 19 clutch rows, 577 kills each way and 577 `weaponKills`, damage 68,738 (68,739 before per-pair rounding), as the server logged (S17) | 2026-10-09 |
| S17 `checks.mjs`: headless Chrome over CDP, `/rivals` in both views (local; 12 long names, 120k cells and 25 pairs mocked; `?by=` by click, reload and a bad value; empty, failed, held), the pilot page's kill-log card (local; no logged match, failed, held), the match page's damage tab (local; no damage log mocked), the leaderboard's link, then the dashboard, history, leaderboard, rankings, ladders, server page, maps, a map popup, a match, fight night and a second pilot, at 1,280 and 390 px | cells, bars and tiles equal the API, ramp and emphasis colours only, URL state across reload, shared states, no new Recharts chunk, no wider than the window, no console errors but the known S1 401 | 160 of 160 (S17) | 2026-10-09 |
| S17 `mutate.py`: 24 edits to the S17 rules, pass and reads, each restored from a copy, three test files run | every edit fails a test | 24 of 24 fail at least one test (S17) | 2026-10-09 |
| dataviz `validate_palette.js --mode dark --surface "#111111"` on the back-to-back bars' `chart.series,chart.label` | as S16: all but the chroma floor, which a de-emphasis grey fails by design | same as S16 (S17) | 2026-10-09 |
| S18 `server/services/discordService.test.js`: a temp database with the fixtures on two nights, a local `http` stub webhook, the admin router on a session stub | the embed's numbers equal the fixtures and the rankings; one ping per day; one retry; posts kept from repeating; no token in any console line | 18 of 18 (S18) | 2026-10-09 |
| S18 `real.mjs`, run by `node` on a copy of `/tmp/ofc-data` against the stub: a real server-browser answer with players added, then the detector with the thresholds lowered, twice | one ping, one recap per night, nothing on the second run | 1 ping and 2 recaps, 10 fields each, nothing more (S18) | 2026-10-09 |
| S18 `checks.mjs`: headless Chrome over CDP, the admin Discord card (real login against the stub; mocked: no URL, on with no URL, every post status, failed save, failed test, failed load and Retry, held), then the dashboard, history, both fight-night pages, leaderboard, rankings, ladders, rivals, a pilot, maps, a match and a server page, at 1,280 and 390 px | the card's states, no token in the page, no wider than the window, no console errors but the S1 401 | 62 of 66; the 4 failures are map-image 404s on `/history` and `/maps` from overloadmaps.com (S18) | 2026-10-09 |
| S18 `mutate.py`: 33 edits to the S18 rules, each restored from a copy, four test files run | every edit fails a test | 32 of 33; the wait for a refresh under way survives (S18) | 2026-10-09 |
| S19 `server/services/cardService.test.js`: a temp database of the fixtures, satori counted through a mock that delegates to it, the card router on a local server | the cards' numbers counted from the fixtures, one draw per card, caps, wait limit, fonts, failures, tags, route answers | 19 of 19 (S19) | 2026-10-09 |
| S19 `checks.mjs`: headless Chrome over CDP, every main page plus `/admin` with a real login at 1,280 and 390 px; on the card pages `og:image` read from the DOM and loaded as an image | titles, content, no overflow, `og:image` on the card pages only, the card 1200 × 630, no console errors but the S1 401 | 166 of 172; the 6 failures are map-image 404s on `/history` and `/maps` from overloadmaps.com (S19) | 2026-10-09 |
| S19 `mutate.py`: 26 edits to the S19 rules, each restored from a copy, six test files run | every edit fails a test | 26 of 26 (S19) | 2026-10-09 |
| S20 `server/db/analytics/tape.test.js`: a temp database of the fixtures with two logged matches, the pilots router and the card router on a local server | the tape's numbers counted from the fixtures by hand, the opponent list, the routes, the card in a mode, the share tags, a stale row removed, a key change rebuilt | 15 of 15 (S20) | 2026-10-10 |
| S20 `real.mjs`, run by `node` on `/tmp/ofc-data`: `boutsOf` over every stored match against `pilot_bouts`, its sums against `pilot_rivals`, the mirrors, the query plans | the same records and sums; every row mirrored; primary-key searches | 220 of 220 pairs, 98 of 98 rows, 0 bad rows, both reads on the primary key, 62 matches (S20) | 2026-10-10 |
| S20 `checks.mjs`: headless Chrome over CDP, the tape (a pair that met, a mode by click, URL, reload and lower case, a mode they never met in, two who never met, an unknown pilot, one pilot twice, the duels; held, failed and Retry, a full mocked tape), the pilot page's list (held, failed, empty), the links from `/rivals`, the ladder and the damage grid, then the dashboard, fight night, leaderboard, rankings, ladders, rivalries, a pilot, maps, history, a match and admin, at 1,280 and 390 px | numbers equal the API, the shared states, no Recharts on the tape or the dashboard, no wider than the window, no console errors but the S1 401 | 164 of 168; the 4 failures are map-image 404s on `/history` and `/maps` from overloadmaps.com (S20) | 2026-10-10 |
| S20 `mutate.py`: 28 edits to the S20 rules, reads, builders and routes, each restored from a copy, six test files run | every edit fails a test | 27 of 28; the one left changed nothing and its guard was removed (S20) | 2026-10-10 |
| dataviz `validate_palette.js --mode dark --surface "#111111"` on the tape's corners, `chart.team` | every check passes | passes, worst adjacent CVD ΔE 26.8 (S20) | 2026-10-10 |
| S21 `server/db/analytics/belts.test.js`: a temp database of the fixtures with two logged matches, the 2019 match in cold storage and a match passing the Anarchy belt, the pilots, stats and card routers on a local server | each mode's champion and lineage, the tier counts, a pilot's achievements against `pilot_stats_cache` and `pilot_clutch`, the reign chain, both routes, both cards, the share tags | 13 of 13 (S21) | 2026-10-10 |
| S21 `real.mjs`, run by `node` on a copy of `/tmp/ofc-data`: `achievementPass` over every stored match against `belt_reigns` and `pilot_achievements`, the milestones against `pilot_stats_cache`, the kill-log feats against `pilot_clutch`, the reign chain, the reads' query plans | the same rows; equal counts; no chain break | 5 of 5 reigns, 249 of 249 rows, 38 of 38 and 20 of 20 pilots, 0 breaks, 76 matches (S21) | 2026-10-10 |
| S21 `checks.mjs`: headless Chrome over CDP, `/belts` (local; held, failed and Retry, all vacant, a full mocked answer), the pilot page's card (a champion, a former champion; held, failed and Retry, nothing earned), the belt marks on the leaderboard, the tape, the rankings and both ladder boards (mocked champion; a failed answer), the leaderboard's link, then the dashboard, fight night, leaderboard, rankings, ladders, rivalries, a tape, a pilot, maps, history, a match and admin, at 1,280 and 390 px | numbers equal the API, the shared states, one belts request per page, no Recharts on `/belts` or the dashboard, no wider than the window, no console errors but the S1 401 | 134 of 140; the 6 failures are map-image 404s on `/`, `/history` and `/maps` from overloadmaps.com (S21) | 2026-10-10 |
| S21 `mutate.py`: 33 edits to the S21 rules, pass, reads, builders, layout and Discord, each restored from a copy, five test files run | every edit fails a test | 33 of 33 after /simplify (28 of 31 on the first run; the 3 got tests or their dead guard removed) (S21) | 2026-10-10 |
| Negative check: `git diff --stat origin/main -- . ':!docs'` on the tracker-only branch | empty | empty | 2026-10-06 |

## [HUMAN] tasks

- [ ] [HUMAN] Rotate the SSH password for user `jkehoe` on `192.168.0.52` and
      on `192.168.0.105` (the same password was used for both). It was public
      in git history until the purge and must be treated as leaked.
- [x] [HUMAN] Scrub history. Done by the owner on 2026-10-06: password
      replaced with `REDACTED` in every commit, `main` force-pushed.
- [ ] [HUMAN] Before pulling the S1 image on the NAS, put `ADMIN_PASSWORD` and
      `SESSION_SECRET` in a `.env` file next to `docker-compose.prod.yml`
      (see `.env.example`). Compose no longer hard-codes `admin123`, and the
      server refuses to start in production without both. The owner said on
      2026-10-06 he will create it before merging.
- [ ] [HUMAN] Delete old local clones and re-clone, as the owner asked. Old
      clones (including `~/Repositories/claude/overloadfight.club` and the
      Superset worktrees that share its `.git`) still hold the pre-rewrite
      history. Pulling into them or pushing a branch from the old history
      would bring the purged commits back.
- [ ] [HUMAN] Create a Discord webhook URL for the fight-night channel (needed
      by S18). Since S18: put it in the NAS's `.env` as
      `DISCORD_WEBHOOK_URL=...` (never in the database or a tracked file),
      restart the container, press "Send test post" on the admin page's
      Discord card, then turn "Post to Discord" on.
- [x] [HUMAN] Add GitHub user `kehoej` as a collaborator. Done 2026-10-06.
- [ ] [HUMAN] Before the first start of the S6 image on the NAS, stop the
      container and run `sudo chown -R 1000:1000
      /volume1/docker/overloadfight.club/data` (`rebuild_and_deploy_nas.py`
      now does this itself; a pull of the GHCR image does not). The image now runs as uid
      1000; without the chown it exits with `Refusing to start: ... is not
      writable by uid 1000` and `restart: unless-stopped` restarts it in a
      loop. Commands in `DEPLOYMENT.md`, "File ownership".
- [ ] [HUMAN] Check the NAS volume has about 20 GB free for 7 days of
      nightly backups, and add `data/backups/` to the NAS's own backup job if
      a copy off the box is wanted.
- [ ] [HUMAN] Merge each PR. Pull the new image on the NAS.

## Session queue

Effort tags: S under half a day, M a day, L two or more days of agent work.

### Phase 1: fast and true

- [x] **S1 Secrets and auth hardening** (S). PR #1. Script items done by
      the owner's `5516729`. Done when: `grep -rnE
      "password=['\"]" scripts/` is empty; the three scripts read credentials
      from env or prompt; `server/auth.js` refuses to start with
      `NODE_ENV=production` unless `ADMIN_PASSWORD` and `SESSION_SECRET` are
      set; `.env.example` exists; the pilot-file routes (`bridgeRoutes`, mounted at `server/index.js:91`
      mount), `POST /api/fight-nights/check`, `POST /api/analyze-match` and
      `POST /api/overload/install` require the admin session; pilot names used
      in file paths are validated against `^[A-Za-z0-9 _.-]{1,32}$`
      (`server/services/overloadBridge.js`); login has a rate limit; session
      cookie is `secure` behind HTTPS. A test runner (vitest) is added with one
      test for the path validator.
- [x] **S2 Stat correctness** (M). PR #2. Done when: a shared `server/lib/gameParse.js`
      exposes `teamOf`, `winnerOf` (BLUE/ORANGE aware, handles `teamCount`),
      `durationOf` (uses `date − settings.start` when `start`/`end` are
      absent), `netKills` (one clamping rule), `pilotKey` (case-insensitive,
      LIKE-escaped); every aggregation in `server/db.js` and
      `server/services/fightNightService.js` uses it; `isPilotFirstSeenOnDate`
      includes cold storage; `getPilotStats` stops hard-coding suicides to 0;
      the PilotsList K/D tooltip text is correct; tests on fixture games cover
      an ORANGE win, a tie, an FFA win, and a duration from `settings.start`.
- [x] **S3 Data retention** (S). PR #3. Done when: `getSummaryGames` selects games
      whose `details` lack a non-empty `kills` array; the page-1 upsert keeps
      the richer `details` when the incoming row has empty `kills`;
      `db.insertGame` calls `saveGames` directly; fight-night day queries use
      `date >= ? AND date < ?`; a test proves a hydrated fixture survives a
      summary upsert; backfill marks a fixture game `fetched`.
- [x] **S4 Bundle and polling** (M). PR #4. Done when: every view in `App.tsx` is
      `React.lazy`; `AudioEditor` mounts only on its tab; the root
      `public/ffmpeg-core.*` files are deleted; the wasm is served
      precompressed with a short cache for non-hashed files; one shared
      server-browser poll lives in a hook, pauses on `visibilitychange`, and
      `Layout` reads from it; the `/api/server/:ip/health` fetch is gone;
      `/api/games` returns cached rows without awaiting the upstream sync;
      `routes.js` no longer calls `refreshPilotStats` inline; `db.js` sets
      `journal_mode=WAL`, `synchronous=NORMAL`, `busy_timeout=5000`;
      `refreshPilotStats` iterates rows. `npx vite build` shows the main chunk
      under 150 KB gzip.
- [x] **S5 Indexed player table** (L). PR #5. Done when: a `game_players` table
      (`game_id, date, name COLLATE NOCASE, team, kills, deaths, assists,
      damage, mode, map`) with indexes on `(name, date)` and `(date)` is
      populated by `saveGames` and a one-time migration; `/api/pilot/:name/*`
      and the leaderboard read from it; `EXPLAIN QUERY PLAN` shows index use;
      the remaining full passes run in a `worker_threads` worker on a
      read-only connection; the cold-storage move is atomic.
- [x] **S6 Ops and types** (M). PR #6. Done when: a nightly `db.backup()` of both
      databases with 7-day rotation; compose has log rotation and a healthcheck
      that hits an endpoint that queries the DB; `SIGTERM` closes the DB; the
      Dockerfile is multi-stage, non-root, `npm ci`, no build tools in the final
      image; `@types/react` installed and `tsc --noEmit` meaningful; CI runs
      `tsc`, `vite build` and tests on pull requests; 25 orphaned scripts and
      the root sample/leftover files are removed or moved (`new_map_data.json`
      and `maps_export.csv` move to `server/seed/`); `.github` pins Node 22.

### Phase 2: one system, one voice

- [x] **S7 Live-first dashboard and match result** (M). PR #7. Done when: the
      dashboard shows live servers and online pilots above a one-line Fight
      Night teaser; Fight Night is in the nav; the live match page shows the
      IP with a copy button that confirms; the match page shows final score or
      podium, winner, real duration and a result line; server favorites
      persist in `localStorage`; every hard-coded number listed in
      `docs/audit/ux.md` is wired to the API or removed.
- [x] **S8 Links, titles, URL state** (M). PR #8. Done when: internal navigation uses
      `<a href>` with click interception; `document.title` is set per route;
      the server catch-all injects `og:title`, `og:description` and
      `og:url` per route; tabs, filters, the map popup and the fight-night
      date are in the URL; back buttons call `history.back()`; the stale match
      flash is gone.
- [x] **S9 Design tokens and shared states** (L). PR #9. Done when:
      `tailwind.config.js` defines the palette (one orange, one hover orange,
      three surface blacks, one border), radius and type scale; dead classes
      are removed; `Loading`, `EmptyState`, `ErrorState` components exist and
      every view uses them; a top-level `ErrorBoundary` wraps the app; at
      least the dashboard, pilots, match and live pages are migrated to
      tokens.
- [x] **S10 Glossary, accessibility, mobile** (M). PR #10. Done when: one term each for
      match, pilot, kill, map, server, archive across the UI; "Combat Ratio"
      and "Lethality" have one definition; clickable rows and divs are buttons
      or links; `focus-visible` styles exist; dialogs have `role="dialog"` and
      close on Escape; every table has a scroll wrapper; the roster and map
      grid are paginated; `active:` states on tap targets.
- [x] **S11 Split the giants** (L). PR #11. Done when: `server/db.js` is split into
      connection, migrations, repos and analytics modules with unchanged
      exports; `routes.js` is one file per resource; `PilotSettingsPanel`,
      `AudioEditor`, `WebImportModal` and `AdminPanel` are each under 500
      lines with hooks extracted; `AdminPanel` uses `apiService` instead of
      axios.

### Phase 3: show the data like a fight

- [x] **S12 Fight card, momentum, scrubber** (M). PR #12. Match page: momentum chart
      with lead changes and weapon-colored kills; a time scrubber that replays
      the scoreboard from `kills[].time`. Done when (written at the start of
      S12):
      1. `server/lib/gameParse.js` owns the kill-log rules, each tested on
         fixture games: what one kill is worth (`killPoints`), the
         scoreboard replayed to any second (`scoreboardAt`), lead changes
         (`leadChanges`), the momentum series (`momentumOf`), first blood
         (`firstBloodOf`), weapon families (`weaponFamily`) and the verdict
         (`verdictOf`: KO, decision, split decision, draw). Replaying a
         whole kill log gives each pilot's kills, deaths and assists and
         each team's score as the tracker reports them.
      2. The result panel reads as a fight card: the verdict, the number of
         lead changes and first blood (pilot, weapon, time) sit beside the
         S7 winner, score or podium and result line. Lead changes and first
         blood show only for a match with a kill log.
      3. A momentum chart replaces "Score Progression": the eventual
         winner's margin over the best other side after every kill, lead
         changes marked, every kill drawn in its weapon family's colour
         with a legend, a tooltip with time, margin and score. A match
         without a kill log, or in a mode whose score is not kills (CTF,
         Monsterball), gets an EmptyState instead.
      4. A scrubber on the overview tab: a slider from 0:00 to the match
         length (`durationOf`) that replays the scoreboard (kills, assists,
         deaths, Combat Ratio, order) and the team score or the leader at
         that second. It works from the keyboard, its position is in the
         URL as `?t=<seconds>` (left out at the end), the momentum chart
         marks it, and a click on the chart moves it.
      5. MatchReplay reads the points per kill, lead changes and match
         length from `gameParse.js` and its weapon colours from
         `designTokens.js`, so the page has one copy of each. Not split.
      6. Chart colours live in `designTokens.js`, checked with the dataviz
         palette validator against `surface-card`; the momentum chart,
         MatchReplay and the deep-dive tab's charts read them. `ScoreChart`
         and the first-blood copy in `utils/statCalculators.ts` are gone.
      7. Charts stay out of the entry chunk; entry and match-page chunk
         sizes recorded before and after.
      8. Checked in headless Chrome on a team match and an FFA match with
         kill logs, at 1,280 and 390 px; the existing tabs, result line,
         duration and MatchReplay still work.
- [x] **S13 Rating and power rankings** (M). PR #13. Glicko-2 from placement and
      corrected team results; nightly snapshot table; rating history line on
      the profile; `PowerRankings` view with weekly movement. Done when
      (written at the start of S13):
      1. `server/lib/gameParse.js` owns the rating rules, each tested on
         fixture games: which matches count (`rankedMatch`, the stats'
         ranked filter of 2+ pilots and 60 s+, now one function for every
         caller, plus a result from `winnerOf`, so a team game without
         `teamScore` does not count); who plays whom (every pilot plays
         every other side once: FFA pilots by in-game score, teams by
         `teamScore`, equal scores a draw worth half); one Glicko-2 update,
         checked against Glickman's worked example; the replay of every
         rated match in date order, with RD growing over the days a pilot
         sits out; and the power rankings with each pilot's movement
         against seven days earlier.
      2. The stats worker rates every stored match, hot and cold, on each
         refresh, and the refresh rewrites a snapshot table in `tracker.db`
         (one row per pilot per day with a rated match: rating, RD,
         volatility, rated matches so far), created in
         `server/db/migrations.js` with a migration decision entry. No
         request computes a rating.
      3. New endpoints `GET /api/pilot/:name/rating` (current rating, RD,
         rated matches, rank and the daily history) and `GET
         /api/stats/rankings` (the top 25 today, each with its movement or
         NEW), read through `services/apiService.ts`. The existing
         endpoints answer as before.
      4. The pilot page shows the rating, its RD, the rank and a rating
         history line with a ±2 RD band, in Recharts with colours from
         `chart` in `designTokens.js` checked by the dataviz validator; a
         pilot without a rated match gets an EmptyState, and loading and
         failure use the shared states.
      5. A `PowerRankings` view at `/rankings` (route and title in
         `siteRoutes.js`, share description in `pageMeta.js`, lazy in
         `App.tsx`, linked from the leaderboard): rank, ▲▼ movement or NEW,
         pilot link, rating, RD, rated matches and last match, with the
         shared states, 390 px wide at 390 px.
      6. Charts stay out of the entry chunk; entry and pilot-page chunk
         sizes recorded before and after.
      7. Checked in headless Chrome at 1,280 and 390 px: the rankings view
         and a pilot page with a rating history (local data, plus
         Fetch-domain mocks for a full table); the leaderboard, pilot pages
         and match page still work.
- [x] **S14 Time and career** (M). PR #15. 7×24 local-time heatmap on the dashboard;
      fight-night day boundary in the configured time zone; profile career
      arc sparklines, activity calendar and "last time out" block. The owner
      decided at the start of S14: days are counted in America/Chicago and
      roll over at 06:00 there. Done when (written at the start of S14):
      1. `server/lib/gameParse.js` owns the day rule, tested: a fight-night
         day runs from 06:00 to 06:00 in America/Chicago; `fightNightDay`
         names a date's day (YYYY-MM-DD), `dayBounds` gives a day's UTC
         start and end for `date >= ? AND date < ?` (23 or 25 hours on the
         DST days), and `localClock` gives a date's weekday and clock hour
         there. Tested at 05:59 and 06:00, in CST and CDT, and on both DST
         days.
      2. Everything that counts days uses it: the fight-night match lists,
         the qualifying-day scan and the detector (which runs after the
         06:00 rollover instead of on UTC days), the rating's snapshot day
         and the rankings' today (`RATING.timeZone` goes), the activity
         timeline and the admin calendar, the last-match day in the pilot
         share description and the pilot page's Last Active. Tested on
         fixture games: the fixtures' evening matches (21:24 to 02:49
         Chicago time) are one fight-night day.
      3. A 7×24 heatmap on the dashboard, under the Fight Night teaser:
         matches per weekday and clock hour in Central time over the last
         12 weeks, columns from 06:00 so a night reads as one row, a
         sequential ramp in `chart` (`designTokens.js`) that passes the
         dataviz validator against `surface-card`, the current hour marked,
         a "busiest" line, and each cell's count readable without a pointer.
         New endpoint `GET /api/stats/heatmap` through `apiService`, with
         the shared loading, empty and failed states. The hour chart on the
         History tab (`ActivityGraph`, UTC hours labelled local) goes.
      4. Career arc on the pilot page: monthly sparklines of matches, win
         rate, Combat Ratio and Lethality from the first month played to
         this month, by the career cards' rules (ranked matches only). The
         stats worker builds them into a new `pilot_months` table
         (migration decision); a pilot's months add up to their career
         totals in `pilot_stats_cache` (tested).
      5. An activity calendar on the pilot page: matches per fight-night
         day over the last 53 weeks, weeks from Monday, the same ramp, and
         a label that says what it shows.
      6. A "Last time out" block on the pilot page: the pilot's latest
         fight-night day, how long ago, matches, wins, losses and ties,
         kills, deaths, Combat Ratio, the rating change that day, the
         night's matches as links, and the recap link when that day has a
         recap.
      7. New endpoint `GET /api/pilot/:name/career` (months, calendar, last
         time out) through `apiService`; the existing endpoints answer as
         before; no request walks every stored match.
      8. Charts stay out of the entry chunk; the entry, the dashboard's
         `GameList` and the pilot page chunk sizes are recorded before and
         after.
      9. Checked in headless Chrome at 1,280 and 390 px: the heatmap and a
         pilot page with its career block, on local data plus Fetch-domain
         mocks for a full year; the dashboard, leaderboard, rankings, pilot
         pages and match page still work.
- [x] **S15 Server history** (S). PR #16. Persist server-browser snapshots; `/server/:ip`
      page with uptime, peak hours, average players; regional share over time.
      The owner decided at the start of S15: a snapshot every 60 s; raw
      rows kept 30 days and an hourly rollup kept for good; the regional
      share counts matches per region per month over every stored match;
      the fight-night thresholds stay as they are (flagged). Done when
      (written at the start of S15):
      1. A server-side timer stores the tracker's server browser every
         60 s whether or not anyone has the site open. It goes through the
         same fetch and 15 s cache as `/api/browser` (one function), so the
         site never asks the tracker twice. Each tick writes one row per
         listed server to a new `server_snapshots` table (time, IP, online,
         pilots, max pilots, idle, lobby or match) and adds the same tick
         to an hourly rollup, `server_hours`, in one transaction. A failed
         fetch writes nothing. A `servers` table keeps each server's latest
         name, notes and version and when it was first and last listed.
         The 03:00 job deletes raw rows older than 30 days; the rollup
         stays. The timer stops before the database closes on shutdown.
         Each table gets a migration decision entry.
      2. The counting rules live in one place each and are tested on
         fixture data: a server's region from its name and notes
         (`server/lib/serverRegions.js`, the keyword table ServerStats
         used for its map dots, which now reads it from there); and in
         `gameParse.js`, over the rollup's hours, uptime (online ticks over
         ticks), in use (ticks with a match running over online ticks),
         average pilots (over ticks with a match running), the peak (most
         pilots in one tick, and its hour) and peak hours (average pilots
         per weekday and clock hour of the fight-night day, by
         `localClock`). The window is whole fight-night days before today.
      3. Regional share: the stats worker counts every stored match, hot
         and cold, by region and the month of its fight-night day into a
         derived `region_months` table (`tableChanges`/`writeChanges`, a
         migration decision). The region comes from the server name and
         notes stored with the match, else from `servers` by IP, else
         Unknown. Tested: the months add up to the match count.
      4. New endpoints `GET /api/server/:ip/history?days=` and `GET
         /api/stats/regions`, read through `apiService` (null on failure).
         The existing endpoints answer as before, and no request walks
         every stored match.
      5. A `/server/:ip` page: route, title and nav section in
         `siteRoutes.js`, share title and description in `pageMeta.js`,
         lazy in `App.tsx`. It shows the server's name, region, version,
         the join IP (`JoinIp`) and a link to the live page; cards for
         uptime, in use, average pilots and the peak; a 7×24 peak-hours
         grid that shares its table with the dashboard heatmap (same
         ramp); and the last 24 hours of pilots from the raw rows in
         hand-drawn SVG with a table for the keyboard. The window is
         `?days=7|30|90|365` in the URL (30 left out). Loading, failure,
         an unknown server and a server with no ticks yet use the shared
         states. The page is 390 px wide at 390 px.
      6. The server browser's rows and cards and the live page (its
         header and its error view) link to the server's page. The live
         page's share title names the server from `servers` (S8 flag).
      7. A "Matches by region" card on the dashboard, under the heatmap:
         each month's share by region as 100% stacked columns over the
         stored history, hand-drawn SVG (the dashboard's first visit still
         loads no Recharts), colours from a `chart.region` that passes the
         dataviz validator against `surface-card`, a legend, a per-month
         table for the keyboard, and the shared states.
      8. Chunk sizes for the entry, `GameList`, `LiveGameDetail` and the
         new view are recorded before and after.
      9. Checked in headless Chrome at 1,280 and 390 px: the server page
         and the region card on local data plus Fetch-domain mocks for a
         year; the dashboard, the server browser, the live page,
         leaderboard, rankings, pilot pages and match page still work.
- [x] **S16 Weapon meta and ladders** (M). PR #17. Weapon × map heatmap; weapon mix
      radar vs community; pilot × map grid; 1v1 duel ladder; CTF and
      Monsterball objective leaderboards. The owner decided at the start of
      S16: a duel is a ranked, kill-scored match with exactly two pilots on
      different sides (a 1v1 Anarchy match or a one-a-side Team Anarchy
      match; CTF and Monsterball 1v1s are out); the ladder is Glicko-2
      replayed over duels alone, listed from 5 duels; the weapon mix is a
      dumbbell per weapon family, not a radar. Done when (written at the
      start of S16):
      1. `server/lib/gameParse.js` owns the counting rules, each tested on
         fixture games: which kills count for the weapon meta
         (`weaponKills`: a ranked match's kill-log entries worth a point by
         `killPoints`, so suicides, team kills and deaths without an
         attacker are out, each under its `weaponFamily`); what a duel is
         (`duelMatch`); how the ladder lists (`DUEL`: 5 duels to be listed,
         the rest provisional, by rating then duels then name, no activity
         window, `duelLadder`), on the S13 `ratingSides` and
         `ratingSnapshots` so no rating maths is copied; and the objective
         counts (`objectiveLine`: Monsterball goals, goal assists and
         blunders; CTF captures, returns, pickups and carrier kills, from
         the stored player fields of ranked matches in that mode).
      2. The stats worker builds, in the same scan as the other passes,
         derived tables in `tracker.db` beside `games`, each created empty
         in `migrations.js`, filled by the first refresh (the startup check
         refreshes while any derived table is empty), kept in line with
         `tableChanges` and `writeChanges`, and dropped to roll back:
         `map_weapons(map, family, kills)`, `pilot_weapons(pilot, family,
         kills)`, `pilot_maps(pilot, map, matches, wins, losses, ties,
         kills, deaths)`, `duel_snapshots` (the `rating_snapshots` shape
         over duels), `pilot_duels(pilot, opponent, wins, losses, ties,
         last)` and `pilot_objectives(pilot, mode, matches, wins, losses,
         ties, goals, goal_assists, blunders, captures, returns, pickups,
         carrier_kills)`. The derived tables are one list, used by the
         ensure, restore, startup-check and write steps (the S14 flag).
         Tested on fixture data: the map rows add up to the community
         totals, a pilot's family rows to their logged kills, a pilot's map
         rows to their ranked matches that name a map, and the duel table
         to `ratingSnapshots` over the duels.
      3. New endpoints, read through `apiService` (null on failure) and
         `useLoad`; the existing endpoints answer as before, and no request
         walks every stored match: `GET /api/stats/weapons` (the
         community's kills per family and each map's), `GET
         /api/stats/specialists` (the top pilots by ranked matches against
         the top maps by matches, each cell a record), `GET
         /api/pilot/:name/weapon-mix` (the pilot's kills per family beside
         the community's), `GET /api/stats/duels` (the ladder for today
         with each pilot's record) and `GET /api/stats/objectives` (the
         CTF and Monsterball boards).
      4. The maps page gets two grids as hand-drawn tables (no Recharts):
         "Weapon meta", maps by weapon family coloured by the family's
         share of the map's logged kills in `chart.ramp`, with an "All
         maps" row, each share readable without a pointer, a
         `DetailsTable` and the shared states; and "Specialists", pilots by
         maps coloured by win rate over ranked matches with a result, the
         record on hover and in the table, a cell under 3 matches left
         uncoloured.
      5. The pilot page's arsenal section gets "Weapon mix vs the
         community": a dumbbell per family drawn by hand (the pilot's
         share beside the community's, the kills behind both, the pilot's
         mark in the accent hue and the community's in the palette's
         de-emphasis grey, checked with the dataviz validator against
         `surface-card`; two shades of one hue were tried first and failed
         its lightness band), a table, and an EmptyState for a pilot with
         no logged kill.
      6. A `/ladders` view (route, title and the pilots nav section in
         `siteRoutes.js`, share description in `pageMeta.js`, lazy in
         `App.tsx`, linked from the leaderboard's tab bar beside Power
         rankings) with `?board=duels|ctf|monsterball` (duels left out of
         the URL): the duel ladder (rank, pilot, duel rating, RD, W-L-T,
         duels, last duel; provisional pilots below the listed ones) and
         the CTF and Monsterball boards (pilot, matches, W-L-T and the
         objective counts, by captures or goals), with the shared states,
         390 px wide at 390 px.
      7. Charts stay out of the entry chunk and the pilot page loads no new
         Recharts chunk; the entry, `PilotDetail`, `GameDetail`,
         `MapLibrary` and the new view's chunk are recorded before and
         after.
      8. Checked in headless Chrome at 1,280 and 390 px: the maps page's
         two grids, the pilot page's weapon mix and the ladders view on all
         three boards, on local data plus Fetch-domain mocks for full
         tables; the dashboard, server page, leaderboard, rankings, pilot
         pages, maps and match page still work.
- [x] **S17 Rivalry network and damage flow** (L). PR #18. Force graph from real kill
      edges; chord diagram of damage per match and career; clutch profile
      (first blood, late kills, kills while trailing). The owner decided at
      the start of S17: no force graph and no chord diagram (the dataviz
      form test fails both); the network is a killer × victim heat table
      plus a ranked list of pairs, and the damage flow a dealer × target
      heat table per match and in the network view, plus each pilot's top
      opponents; a late kill is one in the last 60 s; trailing means
      behind the leader at that moment (in team games, another team
      ahead); only ranked matches with a log count, and only kills and
      damage on opponents. Done when (written at the start of S17):
      1. `server/lib/gameParse.js` owns the counting rules, each tested on
         fixture games with hand-written logs: the kill edges are
         `weaponKills`' entries (a ranked match's kills on opponents by
         `killPoints`), which now carry the defender too; who met whom
         (`opponentsOf`: every pair of named pilots on different sides in
         a ranked match with a kill or damage log, each pilot once); the
         damage flows
         (`damageFlows`: a ranked match's damage-log entries on an
         opponent, so no self-damage and no damage to a teammate, teams
         from the players); and the clutch counts (`clutchOf`, on ranked,
         `killScored` matches with a kill log: first blood by
         `firstBloodOf`, and for each kill on an opponent whether it came
         in the last `CLUTCH.lateSeconds` (60) of `replayLengthOf` and
         whether the killer's side was behind the leading side just before
         it, a level score not counting). Nothing is copied: the replay is
         `replayLog`'s visitor, the kill rule `killPoints`.
      2. The stats worker builds two derived tables in the same scan,
         joined to `DERIVED_TABLES` (so the schema, the restore, the
         startup check's marker and the write step pick them up), each
         with a migration decision entry: `pilot_rivals(pilot, opponent,
         name, opponent_name, matches, kills, deaths, damage_dealt,
         damage_taken)`, both directions of every pair, and
         `pilot_clutch(pilot, kind, name, matches, first_bloods, kills,
         late_kills, trailing_kills)`, `kind` being `ffa` or `team`.
         Tested on fixture data: each pair's row mirrors the other
         direction, a pilot's kills over their rows equal their
         `weaponKills` entries, damage over the rows equals
         `damageFlows`, and the clutch kills equal the kill-scored
         matches' kills on opponents.
      3. New endpoints, read through `apiService` (null on failure) and
         `useLoad`, no route cache (the S16 rule): `GET
         /api/stats/rivalries` (the 12 pilots with the most logged kills on
         opponents, a kills grid and a damage grid among them, and the 25
         pairs with the most kills exchanged) and `GET
         /api/pilot/:name/rivalry` (the pilot's 10 opponents with the most
         kills exchanged, their clutch counts by kind and the community's).
         The existing endpoints answer as before and no request walks
         every stored match.
      4. A `/rivals` view (route, title and the pilots nav section in
         `siteRoutes.js`, share description in `pageMeta.js`, lazy in
         `App.tsx`, linked from the leaderboard's tab bar beside Power
         rankings and Ladders) with `?by=kills|damage` (kills left out of
         the URL): the grid on `HeatTable`, killer rows by victim columns,
         each cell coloured by its share of the row's total, the diagonal
         empty, with `RampLegend` and a `DetailsTable`; and the ranked
         list of pairs (both pilots linked, kills each way, matches, damage
         each way). The page says the numbers come only from ranked
         matches with a log. Shared states; 390 px wide at 390 px.
      5. The match page's damage tab: the damage matrix becomes a
         `HeatTable` of dealer by target over the whole damage log (self
         and teammates included, as the matrix showed them), coloured by
         each cell's share of the match's damage, self-damage on the
         diagonal uncoloured, with each pilot's total dealt; a match with
         no damage log gets an EmptyState that says so.
      6. The pilot page gets "Rivals from the kill log" (the 10 opponents:
         matches, kills on them against kills by them as a back-to-back
         bar in the S16 emphasis pair, `chart.series` for the pilot and
         `chart.label` for the opponent, and damage dealt and taken) and a
         "Clutch" card (first-blood rate, share of kills in the last 60 s,
         share of kills while trailing, each beside the community's, with
         the counts behind them and a `DetailsTable` by FFA and team),
         hand-drawn, loaded beside the rating, career and weapon mix; an
         EmptyState for a pilot with no logged ranked match; shared
         states; words that say only logged matches count.
      7. Charts stay out of the entry chunk and the pilot and match pages
         load no new Recharts chunk; the entry, `PilotDetail`,
         `GameDetail`, `MapLibrary`, `Ladders` and the new view's chunk
         are recorded before and after.
      8. Checked in headless Chrome at 1,280 and 390 px: `/rivals` in
         both views, the pilot page's two cards and the match page's
         damage tab, on local data plus Fetch-domain mocks for full
         tables; the dashboard, server page, leaderboard, rankings,
         ladders, pilot pages, maps and match page still work.

### Phase 4: into Discord, and a reason to come back

- [x] **S18 Discord webhook** (S). PR #19. Recap embed on save; "it's on" ping once per
      evening; webhook URL as an admin setting. The owner decided at the
      start of S18: the evening is on when the server browser shows 6 or
      more pilots across servers (the plan's rule, read at the S15 minute
      tick); the ping fires at most once per fight-night day; only a recap
      the detector saves for a finished night posts, once per date, and the
      S14 rebuild, the empty-table backfill, a public GET that generates a
      recap and a forced regenerate never post; the embed carries the
      night's totals, the saved recap's lines, the top pilots, a link to
      `/fight-night/:date` and the power rankings' movement; the URL comes
      from `DISCORD_WEBHOOK_URL` in the environment and the admin page only
      switches posting on and off and shows the URL masked; a failed or
      rate-limited post is retried once (after `Retry-After` on a 429, 5 s
      otherwise), then logged and dropped, and marked sent only on success;
      links use `SITE_URL` from the environment, defaulting to
      `https://overloadfight.club`; the admin page gets a test-post button.
      Done when (written at the start of S18):
      1. `server/lib/gameParse.js` owns the ping's rule (`FIGHT_NIGHT_PING`,
         6 pilots; `browserPilots`, the pilots on online servers in one
         server-browser answer, read through `snapshotRow`), tested on a
         browser list: offline servers, missing games and lobbies.
      2. A Discord service posts with Node's fetch (no SDK): the URL only
         from `DISCORD_WEBHOOK_URL`, posting only while `discord_enabled`
         is `true` in `admin_settings` and a URL is set; one retry on a 429
         (after `Retry-After`, capped) or a 5xx or network error (after
         5 s), no retry on another 4xx; `allowed_mentions` empty, so a
         pilot named `@everyone` pings nobody; pilot names escaped for
         Discord markdown. No log line, error or API answer holds the URL;
         a test runs the failure paths and checks every console line.
      3. A new `discord_posts(kind, key, status, tries, updated_at)` table
         in `tracker.db` keeps a post from repeating across restarts,
         recap rebuilds and restores, with a migration decision entry: the
         ping keyed by fight-night day, the recap by date; a post stays
         pending until Discord accepts it, and after 3 tries or a 4xx it
         is dropped. Tested against a local stub server: one ping per day
         however many ticks pass the rule, none below it or while switched
         off; a recap the detector saves posts once, and the rebuild, the
         backfill, a GET and a second detector run do not post it again.
      4. The recap embed: title the night's date linking to
         `/fight-night/:date` (from `urlFor` and `SITE_URL`); the night's
         matches, pilots and kills; most kills and most matches; the saved
         lines (headline match, upset, biggest win, closest finish,
         busiest map, new pilots, longest streak); the top 5 of the power
         rankings on the next day with their 7-day movement (▲, ▼, NEW),
         after a stats refresh so the night counts. Every number tested on
         fixture data against the recap and `getPowerRankings`, inside
         Discord's limits.
      5. The ping message: the pilot count, the servers with pilots
         (name, players of max, map and mode, or in the lobby) and a link
         to the live page; tested on a browser list.
      6. The ping rides the S15 server-browser tick and the recap the
         detector, so no new timer; a post never blocks a request, the
         ingest poll or the tick; a shutdown stops the service before
         `db.close()`, so a post that ends later writes nothing.
      7. Admin endpoints behind `requireAuth`: `GET /api/admin/discord`
         (on or off, whether a URL is set, the URL masked, the ping rule,
         the latest posts) and `POST /api/admin/discord/test` (one attempt,
         no retry, answers the status and never the URL); a non-admin gets
         401 from both. An admin card (`components/admin/`, its hook in
         `hooks/`, requests through `apiService`'s admin helpers) shows the
         switch, the masked URL or how to set one, the test button and the
         latest posts, at 1,280 and 390 px. `.env.example`, both compose
         files and the Environment section list `DISCORD_WEBHOOK_URL` and
         `SITE_URL`.
      8. The entry chunk and `AdminPanel` are recorded before and after;
         checked in headless Chrome at 1,280 and 390 px (the admin card
         with a mocked session and the real one), and against a local stub
         webhook with the local server; the dashboard, fight night,
         leaderboard, rankings, ladders, rivalries, pilot pages, maps and
         match page still work.
- [x] **S19 OG share cards** (M). PR #20. PNG cards for pilot, match, fight night, map
      and tape URLs via satori + resvg. The owner decided at the start of
      S19: cards for the pilot, match, fight-night and map pages now, the
      tape left to S20; one shared layout, each card showing its own page's
      numbers; Orbitron and Roboto Mono from the Fontsource packages;
      rendered on request, one at a time, and kept in an in-memory cache
      whose key changes when the card's numbers change; `og:image` on the
      request's origin, as `og:url`; the S18 recap embed gets the
      fight-night card as its image; `@resvg/resvg-js` for the PNG. Done
      when (written at the start of S19):
      1. The card's words and numbers are pure functions in
         `server/lib/shareCards.js`, each tested on fixture data, that read
         what the page and its `og:description` already read and reuse the
         rules in `gameParse.js` and the wording in `matchResult.js`: the
         pilot card (name, matches and kills from `getPilotSummary`, the
         rating and its rank or standing from `getPilotRating`, Combat Ratio
         from `pilot_stats_cache`, the last match's fight-night day), the
         match card (map, `resultLine(winnerOf)`, mode, `clock` of
         `measuredDurationOf`, `VERDICT_LABEL[verdictOf]`, the fight-night
         day), the fight-night card (the saved recap's date, matches,
         pilots, kills and most kills) and the map card (name, author,
         matches, kills, matches in the last 30 days and the top pilot from
         `getMapIntel`, and its cached image when one is on disk). The
         page's `og:description` is built from the same object, so the two
         cannot disagree. The map page gets an `og:description` it lacked.
      2. One layout in `server/lib/cardLayout.js`: 1200 × 630, colours,
         radius and the small text size from `designTokens.js`, the page's
         kind, a title, a sentence, up to four stat tiles and the site's
         name; long names cut with an ellipsis; tested without rendering.
      3. `GET /api/card/<page path>` (in `server/routes/cards.js`) answers
         the page's PNG (`image/png`, 1200 × 630), 404 for a page without a
         card or an unknown pilot, match, night or map, and never blocks
         the event loop for long: renders go one at a time, the PNG is
         drawn by resvg's `renderAsync` off the main thread, and the render
         time is logged and sent as `Server-Timing`. The cache holds about
         200 cards in memory, keyed by the path and a hash of the card's
         words and numbers, so a new match, a stats refresh or a recap save
         that changes them makes a new card and one that does not reuses it.
         The existing endpoints answer as before.
      4. `server/pageMeta.js` adds `og:image` (with the `?v=` hash, so a
         preview's own cache moves on when the numbers do), its width,
         height and alt text, and `twitter:card` `summary_large_image` to
         the four pages, on the request's origin like `og:url`. A page
         with no card, or whose card failed to render, gets no `og:image`
         and still loads.
      5. The S18 recap embed carries the fight-night card under `SITE_URL`
         as its image, built from the saved recap with no database read,
         tested.
      6. satori, `@resvg/resvg-js` and the two Fontsource packages are
         dependencies with a decision entry each, install from prebuilds
         with no compile on darwin-arm64 and `node:26-alpine`, and the
         Docker image builds, runs healthy and renders a card. No
         headless browser renders cards. Nothing in `App.tsx` changes and
         the entry chunk does not grow (233.36 KB raw / 74.80 KB gzip
         before).
      7. Checked with curl against the local server (each page's
         `og:image` tag and its PNG, looked at), and in headless Chrome at
         1,280 and 390 px; the dashboard, fight night, leaderboard,
         rankings, ladders, rivalries, pilot pages, maps, match page and
         the admin page still work.
- [x] **S20 Tale of the Tape permalinks** (M). PR #21. `/tape/:a/:b`. The owner
      decided at the start of S20: the tape sets the two pilots' head-to-head
      (ranked matches as opponents with W-L-T, kills and damage each way from
      the logs, the 1v1 duel record, map splits) beside their career numbers
      (rating and standing, ranked matches, win rate, Combat Ratio,
      Lethality); Threat Centrality and Dominance Index go. Ranked matches
      only, all time, with a `?mode=` switch that filters the head-to-head
      and leaves the career rows all-mode. The URL keeps the order given (A
      the red corner). An unknown pilot gets a not-found state and no card,
      the same pilot twice a prompt with a link to that pilot, two pilots who
      never met their career rows and a line saying so. "Frequent
      Adversaries" and the tape inside it go; a list of the pilot's
      opponents linking to their tapes takes their place. The tape gets a
      card in S19's layout. The tape is linked from `/rivals`' pairs, the
      kill-log rivals, the duel ladder and the match page's damage grid.
      Done when (written at the start of S20):
      1. `server/lib/gameParse.js` owns the head-to-head rule, tested on
         fixture games: `boutsOf` gives every pair of named pilots on
         different sides of a rated match (`ratingSides`: ranked, a result,
         a team-game pilot without a team sitting out, a pilot listed twice
         once), each with the first pilot's outcome by the two sides'
         scores (equal scores a tie), the match's mode (`matchModeOf`) and
         map (`mapKey`). `TAPE_MODES` lists the mode switch (Anarchy, Team
         Anarchy, CTF, Monsterball, the pilot page's four; named
         `MATCH_MODES` after /simplify, when the pilot page took it too).
      2. The stats worker builds `pilot_bouts(pilot, opponent, mode, map,
         matches, wins, losses, ties, logged, kills, deaths, damage_dealt,
         damage_taken)` in the same scan, both directions, keyed by its first
         four columns (the derived-table list learns a key size, used by the
         schema, the worker's comparison and the write step), joined to
         `DERIVED_TABLES` with a migration decision entry. The record comes
         from `boutsOf`; `logged`, kills and damage from `opponentsOf`,
         `weaponKills` and `damageFlows`, so no S17 rule is copied. Tested
         on fixture data: every row mirrors its other direction; wins,
         losses and ties add up to matches; a pair's matches equal the
         rated matches the two played apart; over modes and maps a pair's
         logged matches, kills, deaths and damage equal its `pilot_rivals`
         row.
      3. New endpoints in `routes/pilots.js`, reads in a new
         `server/db/analytics/tape.js` with `db` keys, read through
         `apiService` (null on failure) and `useLoad`, no route cache:
         `GET /api/pilot/:name/tape/:opponent?mode=` (both pilots' stored
         names and career numbers: rating, RD and standing from
         `getPilotRating`, ranked matches, win rate, Combat Ratio and
         Lethality from `pilot_stats_cache` as the pilot page's career
         cards; from A's side in the mode the record, the logged matches,
         kills and damage each way and the map splits; the modes the two
         met in with their counts; the duel record from `pilot_duels`),
         and, answered 200 like an unknown server's history so the page's
         states log no error, `{ missing }` naming an unknown pilot and
         `{ same }` for the same pilot twice (amended during S20: the first
         draft said 404 and 400, which Chrome logs as errors); and
         `GET /api/pilot/:name/opponents` (the opponents with the most
         ranked matches against the pilot, each with the record and logged
         kills each way). The existing endpoints answer as before and no
         request walks the stored matches.
      4. A `/tape/:a/:b` view: a two-part route in `siteRoutes.js`
         (`parseRoute`, `urlFor('tape', a, b)`, `pageTitle` "A vs B", the
         pilots nav section), a share description in `pageMeta.js`, lazy in
         `App.tsx`. A in the red corner, B in the blue (`chart.team`'s
         ORANGE and BLUE, the pair S12 validated), each linked to their
         page; the career rows side by side with the better side marked;
         the head-to-head in the mode (`?mode=`, all modes left out of the
         URL): record, kills and damage each way with words that say only
         logged matches count, the duel record, the map splits as a table.
         Loading, failure, an unknown pilot, the same pilot twice, two
         pilots who never met and a mode they never met in each get the
         shared states or a line. 390 px wide at 390 px. No Recharts.
      5. The pilot page: "Frequent Adversaries" and the tape inside it go
         (the picked rival with them, closing the S8 flag); "Tale of the
         Tape" lists the pilot's opponents from `/opponents` (matches,
         W-L-T, logged kills each way), each a link to
         `/tape/<pilot>/<opponent>`, with the shared states. "Rivals from
         the kill log" rows link to the tape too.
         `/api/pilot/:name/breakdown` answers as before.
      6. Links to the tape: each pair on `/rivals` (leader first), each
         duel-ladder row from the second down (against the pilot one row
         above), and each cell between two pilots in the match page's
         damage grid (dealer first).
      7. The share card: `tapeCard` in `shareCards.js`, tested on fixture
         data, builds the card and the page's `og:description` from one
         object (the record, kills each way and logged matches, or the
         ratings for two pilots who never met), drawn in S19's layout (kind
         "Tale of the Tape", title "A vs B", tiles "a–b" from A's side) at
         `/api/card/tape/A/B` (with `?mode=` when set); the tape is in
         `CARD_VIEWS`; an unknown pilot or the same pilot twice gets no
         card and the site description.
      8. Charts stay out of the entry chunk and the dashboard's first visit
         loads no Recharts chunk; the entry, `PilotDetail`, `Rivals`,
         `Ladders`, `GameDetail` and the new view's chunk are recorded
         before and after.
      9. Checked with curl against the local server (the tape's share tags
         and its card, looked at) and in headless Chrome at 1,280 and
         390 px: the tape on local data (a pair that met, a mode, two
         pilots who never met, an unknown pilot, the same pilot twice) and
         Fetch-domain mocks for loading, failure and full tables; the pilot
         page's list; the links from `/rivals`, the ladder and the damage
         grid; the dashboard, fight night, leaderboard, rankings, ladders,
         rivalries, pilot pages, maps, match page and admin page still
         work, and the S19 cards still draw.
- [x] **S21 Belts and achievements** (M). PR #22. The owner decided at the start
      of S21: a belt is lineal, one per mode (`MATCH_MODES`: Anarchy, Team
      Anarchy, CTF, Monsterball), decided match by match over every rated
      match since the first stored one; achievements are milestones,
      kill-log feats, belts and Boss Slayer, and streaks and the
      anniversary, from every stored match, each in three tiers (bronze,
      silver, gold); they show on the pilot page, a new `/belts` view, a
      belt mark beside the holder's name on the rankings, the ladders, the
      leaderboard and the tape's corners, and the share cards (the pilot
      card gains a tile, `/belts` gets a card); a belt that changes hands
      shows as NEW CHAMPION in the S18 recap embed; a pilot sees every
      achievement, the ones not yet earned greyed with their progress, and
      nothing about belts until they hold one. Done when (written at the
      start of S21):
      1. `server/lib/gameParse.js` owns the rules, each tested on fixture
         games. The belt (`beltMatch`, `beltStep`; amended during S21: the first
         draft named a `beltReigns` that /simplify removed): a rated match
         (`ratingSides`) in a `MATCH_MODES` mode; the first one in a mode
         with an outright winner crowns the winning side's top scorer (the
         pilot in FFA, the team's highest in-game score in a team game,
         ties by listing order; amended during S21 after /code-review: in
         CTF and Monsterball the most captures or goals come first); after that the holder keeps the belt
         through any match they do not play, a match their side wins or
         draws at the top is a defense, and a match another side wins
         outright passes the belt to that side's top scorer; a match the
         holder loses with the top shared changes nothing. Every reign has
         its holder, the match and day it started, its defenses and the
         match and day it ended. The achievements (`ACHIEVEMENTS`, each an
         id, a name, what it counts and three tier thresholds; `tierOf`):
         milestones (ranked matches, kills, wins, fight-night days played,
         by the career cards' rules: `rankedMatch`, `netKills`,
         `outcomeOf`, `fightNightDay`); kill-log feats (first bloods, kills
         in the last 60 s and kills while trailing, from `clutchOf`, and
         the best kill streak in one match from a new `killStreaksOf`:
         kills on opponents by `killPoints` without dying in between); the
         belt (belts won, title defenses, and Boss Slayer: rated matches
         whose side outscored the reigning champion of that mode); streaks
         (the most ranked wins in a row, a tie or loss ending one, and the
         most duel wins in a row over `duelMatch` duels) and the
         anniversary (whole years since the pilot's first stored match).
         An achievement's tier is earned on the match (and day) whose
         count first passes the threshold.
      2. The stats worker builds, in the same scan, two derived tables
         joined to `DERIVED_TABLES` (so the schema, the restore, the
         built marker and the write step pick them up), each with a
         migration decision entry: `belt_reigns(mode, reign, pilot, name,
         since, game, defenses, until, lost_game)` and
         `pilot_achievements(pilot, achievement, name, value, tier, earned,
         game)`, one row per pilot and achievement with a count above 0.
         Tested on fixture data: each pilot's milestones equal their
         `pilot_stats_cache` row (matches, kills, wins) and their months'
         days; the kill-log feats equal their `pilot_clutch` rows summed;
         the reigns chain (each one's end is the next one's start, the
         holder's defenses are the matches they kept it through); Boss
         Slayer counts the bouts won against the holder. (Amended in the
         S21 review: the fight-night days are recounted from the matches,
         since `pilot_months` keeps no days, and Boss Slayer is tested on a
         belt changing hands and a holder beaten with the top shared, not
         against `pilot_bouts`.)
      3. New endpoints, reads in a new `server/db/analytics/belts.js` with
         `db` keys, read through `apiService` (null on failure) and
         `useLoad`, no route cache: `GET /api/stats/belts` (each mode's
         holder with the day and match it was won, from whom, days held and
         defenses; the mode's last reigns; how many pilots hold each tier of
         each achievement) and `GET /api/pilot/:name/achievements` (the
         belts the pilot holds and has held, and every achievement with its
         count, tier, day and match earned and the next threshold; zeros
         for a pilot with none, a 200 for an unknown pilot). The existing
         endpoints answer as before and no request walks the stored
         matches.
      4. A `/belts` view (route, title "Belts" and the pilots nav section
         in `siteRoutes.js`, a share description in `pageMeta.js`, lazy in
         `App.tsx`, linked from the leaderboard's tab bar beside Power
         rankings, Ladders and Rivalries): a card per mode with the
         champion (linked), held since, days held, defenses and who they
         took it from in which match, or "Vacant" before a mode's first
         decisive match; each mode's line of holders as a table; and the
         achievements with their tiers and how many pilots hold each.
         Shared states; 390 px wide at 390 px; no Recharts.
      5. The pilot page gets a "Belts and achievements" card loaded beside
         the rating, career and rivalry: the belts the pilot holds (mode,
         since, defenses) and has held, then every achievement, earned ones
         with their tier, the day and a link to the match, the rest greyed
         with progress to the next tier ("63 of 100 ranked matches"); the
         shared states. A pilot who never held a belt sees no belt line.
      6. A belt mark (an icon with the mode in its title and in
         screen-reader text) beside a current holder's name on
         `/rankings`, both ladders boards, the leaderboard, the tape's
         corners and the pilot page's header, from one request per page
         load (`/api/stats/belts`) shared by every mark.
      7. Share cards: the pilot card gains a tile (the belt for a holder,
         else the tiers earned), drawn in S19's layout (five tiles where
         four fitted; `CARD_LAYOUT` raised, so every card gets a new key);
         `/belts` gets a card (`beltsCard` in `shareCards.js`, one tile per
         mode with a holder) at `/api/card/belts`, in `CARD_VIEWS`, built
         from the same object as the page's `og:description`; no holder
         anywhere gives no card and the site description.
      8. The S18 recap embed gains a "New champion" field naming each belt
         that changed hands on the night (mode, the new holder and who
         lost it, or the first champion), read in `discordService.js`
         after the stats refresh the recap already waits for, so
         `discordMessages.js` still reads no database; tested on fixture
         data against `belt_reigns`.
      9. Charts stay out of the entry chunk and the dashboard's first visit
         loads no Recharts chunk; the entry, `PilotDetail`, `PilotsList`,
         `PowerRankings`, `Ladders`, `Tape` and the new view's chunk are
         recorded before and after.
      10. Checked with curl against the local server (`/belts`' and a
         pilot's share tags and both cards, looked at) and in headless
         Chrome at 1,280 and 390 px: `/belts` and the pilot page's card on
         local data plus Fetch-domain mocks for loading, failure, empty and
         full answers; the belt marks; the dashboard, fight night,
         leaderboard, rankings, ladders, rivalries, a tape, pilot pages,
         maps, match page and admin page still work, and the S19 and S20
         cards still draw.
- [ ] **S22 Fight-night schedule and iCal** (S). Events table, `.ics` feed,
      dashboard countdown; remove the calendar iframe. The owner decided at
      the start of S22: a scheduled fight night is a weekly rule (weekday,
      start time in Central, length) or a one-off (date, time, length), kept
      in a new `fight_night_events` table and edited on the admin page; the
      Google Calendar is not a source. The feed expands the next 12 weeks
      into one event each, in America/Chicago with a VTIMEZONE, and adds
      every saved recap as a past event linking its page; it lives at
      `/fight-nights.ics`. The dashboard card shows "It's on" at the S18
      ping's 6 pilots, "on now" inside an event's window, else a countdown
      to the next night, with the next three dates and a subscribe link, and
      sits above the S7 teaser; the iframe, `CalendarWidget` and
      `/api/calendar-url` go. Discord gets a reminder post an hour before
      each night. Done when (written at the start of S22):
      1. `server/lib/gameParse.js` gains `localInstant(day, time)` (the UTC
         instant of a wall-clock time on a calendar date in
         `FIGHT_NIGHT_DAY.timeZone`; `dayStart` reads it) and a new
         `server/lib/fightNightSchedule.js` owns the schedule rules on it,
         each tested on fixture data with the DST days (2026-03-07/08 and
         2026-10-31/11-01): what an event is (`validateEvent`: a weekly rule
         with a weekday, a start time and a length in minutes, or a one-off
         on a date; a title; notes), the occurrences of a set of events over
         a window (`occurrences`: rules expanded day by day, each occurrence
         with its UTC start and end and its fight-night day by
         `fightNightDay`, sorted by start; a DST change moves the UTC time
         and not the wall clock), the one under way and the next
         (`nextOccurrence`), and the reminder's window. Constants in
         `SCHEDULE` (12 weeks, 180 minutes, 3 listed, the reminder's 60
         minutes).
      2. A `fight_night_events(id, kind, weekday, date, time, minutes,
         title, notes, updated_at)` table in `tracker.db`, primary data like
         the S15 server tables (created empty by `migrations.js`, carried by
         the backup, created for an older backup by `restoreHot`), read and
         written by `server/db/repos/fightNightEvents.js` with `db` keys;
         a migration decision entry.
      3. The `.ics` feed, written by hand (RFC 5545: CRLF, 75-octet folding,
         escaped text, a VTIMEZONE for America/Chicago, `DTSTART;TZID=` for
         scheduled nights and UTC for recap events), at `GET
         /fight-nights.ics` and `GET /api/fight-nights.ics`
         (`text/calendar`), carrying every occurrence of the next 12 weeks
         (one VEVENT each with the site's URL) and every saved recap as a
         past event on its fight-night day, from its first match to its
         last, whose URL is the recap page and whose description is the
         recap's totals; tested by parsing it back, and opened by a calendar
         parser against the local server.
      4. `GET /api/fight-nights/schedule` (public, in
         `routes/fightNights.js`, read through `apiService`, null on
         failure): the occurrences from now to 12 weeks on (one under way
         included), the time zone's words and the feed's path. No request
         walks the stored matches; the feed reads each recap day's first and
         last match time on `idx_games_date`.
      5. Admin endpoints behind `requireAuth` in a new
         `server/routes/adminEvents.js` mounted by `admin-routes.js`: `GET
         /api/admin/events`, `POST /api/admin/events` (create, or update
         with an id; 400 with a message for a bad event) and `DELETE
         /api/admin/events/:id`; a non-admin gets 401 from each. An admin
         card (`components/admin/AdminFightNights.tsx`, its hook in
         `hooks/`, requests through `apiService`'s admin helpers, which
         learn DELETE) lists the events and adds, edits and deletes them,
         with the shared states, at 1,280 and 390 px.
      6. The dashboard's "Fight nights" card
         (`components/gameList/FightNightSchedule.tsx`, in `GameList`'s
         chunk, on the servers tab above the S7 teaser and the S14
         heatmap): "It's on: N pilots in the server browser" when the shared
         poll shows `FIGHT_NIGHT_PING.pilots` (`browserPilots`, the S18
         rule), else "on now" inside an occurrence's window, else the
         countdown to the next occurrence ("in 2 days 4 hours", ticking in
         the browser, the wording in `matchResult.js`); the next three
         dates; Subscribe (webcal and https) with the feed URL to copy.
         Loading and failure use the shared states; with no event and
         nobody on it renders nothing. `CalendarWidget.tsx`, `GET
         /api/calendar-url` and the iframe go (a decision entry for the
         removed public path; the `CALENDAR_EMBED_URL` row stays, unread).
      7. A Discord reminder through S18's service: a `reminder` kind in
         `discord_posts` keyed by the occurrence's start, checked on the S15
         minute tick (no new timer, checked whether or not the tick's fetch
         succeeded), posted once per occurrence 60 minutes before its start
         while the switch is on, with the title, the time in Central and a
         link; a pending one past its start is dropped; the message in
         `discordMessages.js` reads no database; the admin card names the
         kind. Tested against the S18 stub.
      8. No new view, share card or Recharts chunk; the entry (234.57 KB
         raw / 75.21 KB gzip), `GameList` and `AdminPanel` are recorded
         before and after; every new module is under 500 lines.
      9. Checked with curl against the local server (the feed on both
         paths, parsed; the schedule answer; the admin endpoints) and in
         headless Chrome at 1,280 and 390 px: the dashboard card on local
         data (events made through the admin API) plus Fetch-domain mocks
         for held, failed, empty, on now, it's on and long titles; the
         admin card with a real login (add, edit, delete); the dashboard,
         fight night, leaderboard, rankings, ladders, rivalries, belts, a
         tape, pilot pages, maps, match page and admin page still work, and
         the S19 to S21 cards still draw.
- [ ] **S23 Maps and hosts** (S). Map of the week, `/author/:name`, nightly
      map sync, host pages.
- [ ] **S24 Loadout share codes** (M).
- [ ] **S25 AI ring announcer** (S). One grounded narration per fight night,
      admin-triggered, cached; remove the per-match Gemini route.
- [ ] **S26 Season Wrapped** (L).
- [ ] **S27 Discord login, pilot claim, aliases** (L).
- [ ] **S28 Taunt library, RSVP, nemesis push** (L). Depends on S27.

### Maintenance (outside the phases)

Not counted in the 28 sessions.

- [x] **Node 26 and better-sqlite3 13** (S). PR #14, branch `ofc/node26`.
      Done when: package.json and the lockfile have better-sqlite3 13.x
      and @types/node 26.x; `npm ci` on Node 26 installs with no native
      compile; vitest passes on Node 26, 24.6.0 and 22.17.0 with no hung
      workers; tsc is 0 errors; vite build passes; the local server
      answers the four curls; the node:26-alpine image builds, reports
      healthy as uid 1000 and stops cleanly; ci.yml uses Node 26; .nvmrc
      says 26; the git grep in step 5 returns no present-tense claim of
      Node 22 or 24; docs/ROADMAP.md has the status, the maintenance
      item, the decision, the postmortems, Validated / NOT validated,
      Verification rows and the session log updated; the S14 prompt names
      Node 26; and the PR is open with CI and the docker-publish build
      green.

## Decisions and deviations

- 2026-10-06: Work is split into one-item sessions in fresh contexts because the
  audits alone consumed four agents' worth of context; a single long session
  would lose the file:line evidence. Rejected: one big branch.
- 2026-10-06: The tracker lives in the repo (`docs/`) rather than only in the
  published page, so every PR carries its own status. The HTML page is the
  narrative; this file is the queue.
- 2026-10-06: Test runner for the server is vitest, added in S1, because the
  repo has no runner, vitest needs no transform config for ES modules, and the
  client is already on Vite. Rejected: node:test (no watch or coverage
  conventions shared with the client).
- 2026-10-06: Keep the JSON-blob `games` table as the source of truth and add
  `game_players` beside it (S5), rather than normalising everything. The cold
  DB is about 2.8 GB; a full rewrite on the NAS is not worth the risk.
- 2026-10-06 (S1): The script half of S1 is the owner's commit `5516729`, not
  S1's. S1 first fixed the five scripts itself (env or `getpass`), then
  rebased onto the rewritten `main` and dropped those changes. Env-only with
  an exit when unset meets "read from env or prompt". `.gitignore` keeps the
  owner's `.env.*` rule and adds `!.env.example`.
- 2026-10-06 (S1): Both compose files now pass `ADMIN_PASSWORD` and
  `SESSION_SECRET` through from the host environment. With `admin123` still
  hard-coded there, the startup check could never fire in production.
- 2026-10-06 (S1): "Pilot-file routes" means everything under
  `/api/overload/*`, including `install`, `status`, `taunts` and `audio`. The
  `/api/import/*` routes in the same router stay public because the public
  taunt maker uses them; see "Flagged, not fixed".
- 2026-10-06 (S1): Login rate limit uses `express-rate-limit` (10 failures per
  IP and 50 across all clients per 15 minutes, successes not counted) rather
  than a hand-rolled map.
  `app.set('trust proxy', 1)` makes `req.ip` the client behind the DSM proxy
  and lets `cookie.secure: 'auto'` mark the cookie `Secure` on HTTPS while
  LAN access over plain HTTP keeps working.
- 2026-10-06 (S1): `ADMIN_PASSWORD` is compared as a SHA-256 digest with
  `timingSafeEqual`, so the bcrypt hash of `admin123` and the `bcryptjs`
  dependency are gone.
- 2026-10-06 (S1): Compose uses `${ADMIN_PASSWORD:?...}`, so a NAS without
  `.env` fails at `docker-compose up` instead of starting a container that
  exits and restarts in a loop.
- 2026-10-06 (S1): The pilot-name check lives in each `overloadBridge.js`
  function that builds a path, and returns that function's existing failure
  shape (null, `{ error }` or `{ success: false }`), so routes did not change.
- 2026-10-06 (S2): `gameParse.js` exports two helpers beyond the five named
  in the Done-when list. `outcomeOf` gives one player's win, loss or tie and
  `pairOutcome` compares two players, so no caller re-derives a result from
  `winnerOf`. `pilotLikePattern` is separate from `pilotKey`: the key is
  lowercased for JS maps, while the LIKE pattern keeps the JSON-quoted name
  because SQLite's LIKE folds ASCII case itself and the quotes stop `.`
  from matching every row.
- 2026-10-06 (S2): A game counts as a team game when `teamScore` has keys
  or any player has a team. `settings.teamCount` is not used: the FFA
  samples say `teamCount: 2`. This moves Monsterball and CTF results from
  kill counts to the team score. A team game with no `teamScore` has no
  result: it counts in games but not in wins, losses or ties.
- 2026-10-06 (S2): FFA placement uses the raw in-game score (`kills`), so
  -1 still ranks below 0. `netKills` (floored at 0 per game) is for totals.
- 2026-10-06 (S2): `durationOf` returns 0 when nothing gives a length. The
  ranked filter drops those games, as it drops games under 60 s, rather
  than counting them at the old 900 s guess or at 0 s (which would inflate
  KPM and DPM). In SQL, `duration_of` returns NULL so `AVG` skips them.
- 2026-10-06 (S2): SQL reaches the same rules through `net_kills`,
  `pilot_key` and `duration_of`, registered with `hotDb.function`. The
  three copies of the per-pilot totals query are now one `pilotTotalsSql`.
- 2026-10-06 (S2): `refreshPilotStats` deletes and rewrites
  `pilot_stats_cache` in one transaction, so spellings merged under one
  key leave a single row. The row keeps the most recent spelling.
- 2026-10-06 (S2): `isPilotFirstSeenOnDate` trusts a cached first sighting
  only when it is before the date asked about. Anything else is rechecked
  against hot and cold storage, which repairs rows cached by the old
  hot-only query without a migration.
- 2026-10-06 (S3): `getSummaryGames` keeps a 60 s floor, now through
  `duration_of` instead of three fields the tracker never sends. It also
  walks games in id order after a cursor. With the filter working, every
  game the tracker returns without kills, or that fails, would otherwise
  come back in the next batch and the job would never end. `current_id`
  is the last game processed, in both the pause and progress writes, and
  a resumed job starts after it.
- 2026-10-06 (S3): The keep-the-kill-log rule is one SQL statement,
  `upsertGameSql`, used by `saveGames` for hot and cold storage, so a deep
  page sync cannot wipe archive kill logs either. The stored details are
  kept whole, not merged with the summary.
- 2026-10-06 (S3): The `db.js` default export is now a named `db` object,
  so `insertGame` calls `db.saveGames`. `insertGame` stays because
  `backfill.js` calls it.
- 2026-10-06 (S3): `utcDayBounds` returns null for anything but
  `YYYY-MM-DD`, and `getGamesForDate` returns no games for it.
  `/api/fight-nights/:date` with a bad date stays a 404 instead of a 500.
- 2026-10-06 (S3): The DB tests share their fixture setup through
  `server/testFixtures.js` (sample files, the move to a recent day).
- 2026-10-06 (S4): `Layout` does not read the shared poll. Its 60 s
  `/api/browser` fetch fed `playerCount`, which nothing rendered, so the
  fetch and the state were deleted instead of subscribed. App is the only
  reader of `useServerBrowser` for now. The hook is a module-level store
  read through `useSyncExternalStore`, so any component that calls it
  later shares the same poll.
- 2026-10-06 (S4): The dashboard views (`GameList`, `FightNightSection`)
  are lazy too, so every view in `App.tsx` loads on demand behind one
  `Suspense`, inside the existing `ErrorBoundary`. `Layout` and
  `OverloadFsProvider` stay in the entry chunk. A deploy renames the
  hashed chunks, so `index.tsx` reloads once on `vite:preloadError`; a
  timestamp in `sessionStorage` stops a reload loop, and a second failure
  within 10 s shows the ErrorBoundary's reload screen.
- 2026-10-06 (S4): The dashboard spinner stays up until the first
  `/api/browser` answer settles, as it did when `refreshData` awaited both
  lists. `GameList` picks its tab from `activeGames` when it mounts, and
  mounting it before the poll answered opened the dashboard on History.
  Fixing that inside `GameList` was left for S7, which reworks the
  dashboard.
- 2026-10-06 (S4): `AudioEditor` mounts the first time the Create tab
  opens and stays mounted after that, hidden, so switching to Vault and
  back keeps an edit in progress. Unmounting it on every tab switch would
  also meet "mounts only on its tab" but would drop the loaded file and
  regions.
- 2026-10-06 (S4): The build writes `ffmpeg-core.wasm.br` (quality 9,
  8.4 MB, about 2 s) and `.gz` (level 9, 10.3 MB). Brotli quality 11 is
  7.3 MB but takes 60 s per build. The server prefers br whenever the
  client accepts it; `req.acceptsEncodings('br', 'gzip')` follows the
  client's order, and Chrome lists gzip first. Chrome only offers br over
  HTTPS and localhost, so LAN access over plain HTTP gets the gzip copy.
  The route only rewrites the URL to the copy, found once at startup;
  `express.static` serves it with the usual cache rule.
- 2026-10-06 (S4): Static files without a content hash get `public,
  max-age=3600` and revalidate by ETag. Hashed `/assets/` keep one year
  immutable, HTML stays `no-store`.
- 2026-10-06 (S4): `/api/games` answers a full page (25 stored rows) from
  the DB and lets the sync finish in the background. A page the DB cannot
  fill still waits for the tracker, as before: answering a partial page
  early gave a short page and a stale count, and Load More offsets then
  skip or repeat rows.
- 2026-10-06 (S4): A `/api/pilot/:name/ppi` miss returns `{}` until the
  next `refreshPilotStats` run (startup when the cache is empty, then
  every 6 hours). A pilot first seen after the last run has no PPI block
  for up to 6 hours.
- 2026-10-06 (S4): The WAL pragmas apply to both connections. Cold
  storage writes go through `coldDb`, so the attached `cold` schema on
  `hotDb` needs no pragma of its own. Under WAL a raw copy of
  `tracker.db` can miss commits still in `tracker.db-wal`, and a restored
  file can meet a stale `-wal` at the next start. `/api/admin/backup` and
  `/api/admin/restore` now go through SQLite's backup API (`db.backupHot`,
  `db.restoreHot`): the backup writes a consistent copy to `uploads/` and
  sends it, and the restore writes the upload into the live database.
- 2026-10-07 (S5): `game_players` lives in each file beside its `games`
  table, hot and cold, not in one table in `tracker.db`. Each writer then
  writes a game and its rows in one transaction on one file, and the
  hot/cold split stays as it is. Pilot queries read both files with
  `UNION ALL`, each side through its own index.
- 2026-10-07 (S5): The columns are the Done-when list plus `suicides`,
  which is how the S2 suicide pass over every kill log goes away. There is
  a third index, on `game_id`, so a writer can replace one game's rows.
  `gameParse.playerRows` builds the rows: names trimmed, `team` from
  `teamOf`, `kills` the raw score (queries sum `net_kills(kills)`),
  suicides from the kill log and `damage` as damage dealt to other pilots
  from the damage log (the telemetry rule, no self-damage). A pilot listed
  twice in one game gets the log counts once, as the old SQL counted each
  log entry once.
- 2026-10-07 (S5): Migration. At startup `db.js` backfills each file from
  its own `games` rows, 1,000 games per transaction in id order, then sets
  that file's `PRAGMA user_version` to 1. A file at version 1 is skipped.
  A run cut short leaves the version at 0, and the next start empties the
  table and does it again from the first game. A missing table resets the
  version to 0 first, so dropping the table also triggers a rebuild. To
  re-run it on purpose, set `PRAGMA user_version = 0` on that file and
  restart. A file already at version 1 gets a repair at each start
  instead: rows whose game is gone are deleted, and games with no rows
  get them. That covers writers that skip `game_players` (the old scripts,
  an older image after a rollback); it costs 0.07 s on the synthetic copy
  below and 0.4 s with 2,000 games to repair. It cannot see a game whose
  details an outside writer changed in place. `restoreHot` runs the same
  step after a restore, because a backup from before S5 has no
  `game_players`. Cost on a synthetic copy (50,000 cold
  games with 120-entry kill logs and 300-entry damage logs, 1.6 GB, plus
  5,000 hot games): 9.0 s for cold and 0.9 s for hot, once, before the
  server listens. Rollback: revert the merge, pull the old image, then
  `DROP TABLE game_players;` in both files (or set `user_version` to 0).
  The S4 code does not maintain the table; the repair would catch games
  it added or deleted but not details it rewrote, so drop the table. No
  data is lost either way, since the JSON blobs stay the source of
  truth.
- 2026-10-07 (S5): `saveGames` builds a game's rows from the details the
  upsert kept, returned by `RETURNING details`. A summary that leaves a
  hydrated game's details in place therefore keeps its suicides and
  damage. `saveColdGamesBatch` does the same since the owner's `44e4792`
  put it on the shared upsert, and `updateGameDetails` rebuilds rows from
  the details it writes.
- 2026-10-07 (S5): Pilot pages pick game ids from `game_players` and read
  only those blobs by primary key. Telemetry and the breakdown still parse
  the blobs, because weapons, durations and results are not columns. They
  keep the old scope: telemetry with a start date reads hot only, and
  both read cold games only when hot has fewer than 5 (S2 flag, audit
  item 8). Match history picks its page of ids from the index before
  reading any details. `isPilotFirstSeenOnDate` and the all-time kill
  total (`/api/stats/global?source=all`) read `game_players` too, which
  removes two more passes over every blob. The kill total now skips
  players with blank names, as the leaderboard always has.
- 2026-10-07 (S5): The leaderboard groups by `pilot_key(name)`, the S2
  rule, and shows the spelling from the pilot's latest game. Name lookups
  use `name = ?` on the NOCASE column with the name trimmed, which is what
  the index can serve. NOCASE folds ASCII only, so two spellings that
  differ in non-ASCII case are one pilot on the leaderboard and two on
  the pilot page (flagged).
- 2026-10-07 (S5): The three remaining full passes (the PPI cache, the
  archive stats and the map stats) run in one `worker_threads` worker,
  `server/statsWorker.js`, in a single scan instead of three. It opens
  each file read-only and reads 500 games at a time by id, so no read
  snapshot lasts the whole pass. The pass code moved unchanged into
  `server/lib/statsPasses.js`. `db.js` writes the results on the main
  thread. A pass that throws stops alone and the others still write, as
  when each had its own scan. `refreshPilotStats` now returns a promise
  that callers share while a run is in progress, and it never rejects.
  `getColdStorageStats` waits for a refresh when the cache is empty
  instead of scanning inline, and the map sync calls `refreshPilotStats`
  instead of `buildMapStatsCache`, which is gone. The pages are separate
  reads, so the worker remembers the ids it read from hot and skips them
  in cold. A game moved mid-pass, or left in both files by a crash, is
  counted once; the old single `UNION ALL` scan counted a duplicate
  twice.
- 2026-10-07 (S5): The cold move is two transactions run back to back
  with no await between them. The first copies the old games and their
  `game_players` rows into cold storage. The second deletes from hot only
  the games cold storage now holds. A game cold storage already had keeps
  its cold copy and rows, and its hot copy goes. Rejected: one
  transaction across both files. SQLite makes a commit across attached
  files atomic per file only under WAL, so a crash could commit the hot
  delete and lose the cold insert. In this order a crash leaves a
  duplicate at worst, and the next nightly run removes it. The old code
  also deleted every hot game older than a year, including any saved
  after the copy.
- 2026-10-07 (S6): Backups. At 03:00 container time (`TZ=America/Chicago`)
  `server/backup.js` copies `tracker.db` and `cold_storage.db` through the
  backup API into `data/backups/YYYY-MM-DD/`, then the cold move runs. The
  backup goes first so it holds the files as they were before the night's
  biggest write. Both files land in `YYYY-MM-DD.partial/` and the folder is
  renamed once both are done, so a dated folder always holds a matching
  pair. A second run on the same day replaces that day. After a successful
  run every dated folder past the 7 newest is deleted, so a failed night
  never leaves fewer than 7 good days; leftover `.partial` folders are
  deleted at the start of a run. The folder name is the local day because
  the schedule is local. The backups sit in the data volume, which on the
  NAS is the same disk as the live files: they cover a bad write or a bad
  deploy, not a dead disk, and they cost about 7 times the two databases
  (the cold file alone is about 2.8 GB, so roughly 20 GB). Rejected: a
  separate `BACKUP_DIR` setting (nobody asked for one; the NAS's own backup
  job can copy `data/backups/` off the box). Restore: `tracker.db` alone
  goes through the admin page's upload (`db.restoreHot`, no restart). Both
  files, or cold alone: stop the container, delete the four `-wal`/`-shm`
  files, copy the pair in, `chown 1000:1000`, start. A stopped database is
  not live, so a file copy is fine there; the stale `-wal` must go because
  SQLite would replay it onto the restored file. `DEPLOYMENT.md` has the
  commands. The backup carries `game_players` and `user_version`, so a
  restored pair needs no rebuild.
- 2026-10-07 (S6): The healthcheck is `GET /api/health`. It runs `SELECT 1
  FROM games LIMIT 1` on the hot and the cold connection and answers
  `{"status":"ok"}`, or 503 if either throws (a closed or unreadable
  file). The error goes to the log, not to the public response. It reads no rows of note, so a 30 s interval costs
  nothing. The check lives in the Dockerfile (`HEALTHCHECK`, so a plain
  `docker run` reports health) and in both compose files, with a 120 s
  start period because the server does not listen until the one-time S5
  backfill ends (9 s on the synthetic copy, unknown on the NAS). Docker
  only reports unhealthy; nothing restarts the container on it.
- 2026-10-07 (S6): Types. With `@types/react` and `@types/react-dom`
  installed, `tsc --noEmit` with the existing `tsconfig.json` reports 8
  errors and `--strict` 19 (it was 6,135 before, nearly all untyped JSX).
  All 8 are UI code reading fields `types.ts` does not declare
  (`settings.respawnTimeSeconds`, live event `source`, `target`, `weapon`
  and `message`, the browser API's `game.players`). `types.ts` is
  canonical contract, so the two components widen the type where they read
  it instead, and `tsc --noEmit` now exits 0 and runs in CI. Strict stays
  off: its 11 extra errors are component code outside this session's list
  (flagged). Server JS stays unchecked (`allowJs` without `checkJs`).
- 2026-10-07 (S6): The image runs as the `node` user from `node:22-alpine`
  (uid 1000). The old image ran as root, so the NAS's `data/` belongs to
  root and the new image cannot write to it. `db.js` now checks that the
  data folder and everything directly in it (the databases, their `-wal`
  and `-shm`, `maps/`, `map_images/`, `backups/`) are writable before it
  creates or opens anything, and exits with a message naming the path and
  the `chown` instead of SQLite's "attempt to write a readonly
  database". The owner's `rebuild_and_deploy_nas.py` now stops the
  container and runs `chown -R 1000:1000 data` before recreating it, so
  that deploy path needs no manual step; a pull of the GHCR image through
  `docker-compose.prod.yml` does (a [HUMAN] task). Rejected: an entrypoint
  that starts as root, chowns and drops to `node` (the container would
  still start as root). (The `node:22-alpine` base is superseded
  2026-10-08 by the Node 26 decision; the rest stands.)
- 2026-10-07 (S6): Dockerfile. The build stage has python3, make and g++
  (no git: `.dockerignore` leaves `.git` out of the context, so
  `generate-version.js` keeps the hash already in `public/version.json`),
  runs `npm ci`, `npm run build` (inside the image the version
  rewrite is wanted) and `npm prune --omit=dev`. The runtime stage copies
  `package.json`, `node_modules`, `dist` and `server` only. It keeps
  python3 because yt-dlp is a Python program the server runs as `python -m
  yt_dlp`; pip installs yt-dlp and is removed in the same layer. `CMD` is
  `node server/index.js`, not `npm start`, so SIGTERM from `docker stop`
  reaches node. `terser`, `concurrently` and `@types/jszip` moved to
  `devDependencies`: they are build and dev tools, and the Done-when list
  says none go into the final image. The client libraries (React,
  recharts, lucide, ffmpeg) are still in `dependencies` (flagged).
- 2026-10-07 (S6): Shutdown. SIGTERM and SIGINT stop the HTTP server from
  taking connections and give requests in flight up to 5 s (`docker stop`
  kills at 10 s). Then `db.close()` terminates a running stats worker and
  waits for it before closing both connections, and the process exits 0.
  Closing both connections checkpoints the WAL and deletes the `-wal` and
  `-shm` files. A backup cut off mid-run leaves a `.partial` folder that
  the next run deletes.
- 2026-10-07 (S6): CI is a new `.github/workflows/ci.yml` on every pull
  request, whatever its base branch, and on pushes to `main`, so a merge
  result is checked too: Node 22 from `actions/setup-node`, `npm ci`, `npx tsc
  --noEmit`, `npx vite build` (not `npm run build`, which rewrites a
  tracked file), `npx vitest run`. `docker-publish.yml` already builds the
  image on pull requests without pushing, and the Dockerfile pins
  `node:22-alpine`, so both workflows run on Node 22. (Superseded
  2026-10-08 by the Node 26 decision.)
- 2026-10-07 (S6): Scripts. Of 28 scripts, `generate-version.js` stays
  (`prebuild` runs it), and so do the owner's two deploy scripts:
  `rebuild_and_deploy_nas.py` (added in `44e4792`, after the audit) and
  `deploy-synology.ps1` (edited in `1203619`). The other 25 are deleted:
  one-off checks and debug scripts against the DB, two with a hard-coded
  `d:\` path, `migrate_cold_storage.js` (writes `games` without
  `game_players`), the SSH inspection scripts, the two map-data rewriters
  for `services/mapService.ts`, `ingest-log-archive.js` (the owner retired
  archive ingest in `fb4064a`) and `docker_build_synology.py`, which does
  what `rebuild_and_deploy_nas.py` does. Git history keeps them.
  `browser_sample.json` and `metadata.json` (AI Studio) are deleted;
  `new_map_data.json` and `maps_export.csv` moved to `server/seed/` and
  `mapSyncService.js` reads the CSV from there (nothing reads the JSON).
  The two test fixtures stay at the root (binding decision).
- 2026-10-07 (S6): The owner's `fb4064a` on `main` gave
  `updateGameDetails` the keep-the-kill-log `CASE`. Merged into S6 with
  `RETURNING details`, so its `game_players` rows come from the details
  the update kept, as `saveGames` and `saveColdGamesBatch` already do. A
  test sends a stored game again without its kill log and checks its
  suicide row; building rows from the incoming game fails it.
- 2026-10-07 (S7): Dashboard order. The header comes first, then the
  live half of `GameList`: the four stat cards (Pilots Online is the sum
  of `currentPlayers` from the shared poll), the tabs, Games In
  Progress and the server browser. The Fight Night teaser follows, then
  Recent Bouts and the calendar. The seven-panel poster left the
  dashboard and lives only on `/fight-night`. The teaser
  (`FightNightTeaser`) is one button that reads `fetchFightNights(1)`
  and renders nothing when no recap exists. `GameList` places it
  through an `afterLive` prop, so it sits under the live list on the
  servers tab and nowhere on `/history`. The request is made once per
  page load and reused on later mounts (a failed one is retried). The
  teaser is a static import in `App.tsx`, not lazy. It is about 1 KB,
  and a lazy component suspending inside the lazy `GameList` would
  blank the page under the one `Suspense`. The entry went from 72.81 to
  73.21 KB gzip.
- 2026-10-07 (S7): `GameList` takes its first tab from an `initialTab`
  prop (`'servers'` by default; `/history` passes `'history'`) instead
  of guessing from `activeGames === null`. That closes the S4 item. The
  dashboard still waits for the first poll before mounting `GameList`,
  now so the server browser does not flash "Connection Failed".
- 2026-10-07 (S7): Favorites live in `localStorage` under
  `favorite_servers` (snake case, like the two existing keys) as a JSON
  array of server IP strings, for example `["143.110.230.67"]`.
  `GameList` reads the key once when it mounts; anything other than an
  array of strings counts as no favorites. Every star click writes it.
  If storage is blocked (private mode) the star lasts until the reload.
- 2026-10-07 (S7): The match result and duration come from
  `server/lib/gameParse.js` itself. `GameDetail.tsx` and
  `MatchAnalysis.tsx` import `winnerOf`, `durationOf` and the new
  `measuredDurationOf` from it, so the page and the server run one copy
  of the rule on the same details (`/api/game/:id` returns the stored
  `details` blob). Rejected: adding result fields to `/api/game/:id`.
  That changes a response the canonical `GameData` type describes, and
  the client would still need to read them. `winnerOf` gained a JSDoc
  `@returns` (a comment, no runtime change), so TypeScript types its
  result; `utils/matchResult.ts` derives `MatchResult` from it. The
  wording lives in `resultLine` there, with tests. Team games show each
  team's score, best first. FFA shows a podium of the top three by
  in-game score (`kills`, the S2 rule). When `winnerOf` finds no result
  (a team game without `teamScore`, a one-pilot game) the page says so
  and shows no score panel. The header shows `durationOf` as m:ss, the
  number the stats count. `durationOf` used to fall back to
  `settings.timeLimit` inline; it is now `measuredDurationOf(game) ||`
  the limit, with identical output for every server caller. When the
  measured length is 0 the header reads "Time limit, real length
  unknown", or "Unknown" when there is no limit either. DPM divides by
  the same duration, as the server's DPM does, and shows "–" when it is
  0; the old code assumed 20 minutes. The deep-dive kill histogram uses
  it too and keeps its 15-minute default when the length is 0.
- 2026-10-07 (S7): Hard-coded numbers from `docs/audit/ux.md`, re-found
  with `grep -n`:
  - MapLibrary "75,820 Matches Indexed" and "ALL 75k MATCHES" now read
    `total_games` from `/api/stats/cold/deep`. That is the worker's
    all-time count over hot and cold storage, the same number the
    Archive page shows, from the same pass as the top-maps list under
    the label. The line stays hidden until it loads.
  - MapLibrary "12 Stock" counts `!isCustom` in the map list that
    `mapService.getMapData()` already caches. That is the server's
    Stock filter (`is_custom = 0`); 12 of 574 maps here.
  - `GameList`'s `|| 21` fallback is gone. The banner now shows
    `idleCount`, the number the Show Idle Servers button already used,
    or "No Idle Servers".
  - ServerStats' "Global Mesh Operational" line and its five made-up
    region pills are removed. The card keeps the real "N pilot(s)
    active" line and the map.
  - ColdStorage's "7.2 yrs", "7+ eras", "2020 (20,711 Matches)",
    "70,500+", "2.76 GB" and "294" were already computed from
    `/api/stats/cold/deep` by the owner's `ebe30dd`. Nothing was left
    to change there.
- 2026-10-07 (S7): The live page shows "Join at <ip>" with a copy
  button (`JoinIp`) in its header, and on the error view of a server
  with no game. The button says "Copied" only when
  `navigator.clipboard.writeText` resolves, and "Copy failed, select the
  IP" otherwise. `navigator.clipboard` exists only on HTTPS and
  localhost, so LAN access over plain HTTP always gets the second
  message; the IP is `select-all`, so one click selects it.
- 2026-10-07 (S7): The desktop nav now starts at `xl` (1,280 px), with
  the hamburger menu below that, and its gap is `space-x-4` (was
  `space-x-5 xl:space-x-7`). With nine items the header needs about
  1,250 px. Before S7 the page already overflowed from 768 to 1,150 px
  (Archive off screen); adding Fight Night pushed 1,280 px over too.
  After the change nothing overflows from 768 to 1,600 px.
- 2026-10-07 (S8): Links. Internal navigation is `components/Link.tsx`,
  an `<a href>` whose click handler calls `navigate()` from
  `hooks/useLocation.ts` (a `pushState` plus a notice to subscribers).
  The handler steps aside, and the browser does its usual thing, when the
  click is not the primary button or carries Cmd, Ctrl, Shift or Alt, when
  an earlier handler called `preventDefault`, or when the link has a
  `target`. So middle and Cmd clicks open a new tab, Shift a new window,
  and on macOS Ctrl-click stays Chrome's context-menu gesture. Table rows
  and cards that hold their own buttons or links cannot be one `<a>`
  (nested interactive content), so they keep a click handler from
  `rowLink(url)` and put a real link on their main text (the pilot name,
  the server name, the map name). `rowLink` ignores clicks that land on an
  inner `a` or `button`, navigates on a plain click, and opens a new tab
  with `window.open` on a middle or modified click. Every navigation prop
  (`onNavigate`, `onSelectGame`, `onSelectPilot`, `onSelectLiveGame`,
  `onWatch`, `onSelectServer`) is gone: components build hrefs with
  `urlFor` instead. No router library. The nav is one list rendered
  twice (desktop bar, menu below `xl`), and the menu closes on any path
  change, including back and forward.
- 2026-10-07 (S8): Routing. `server/lib/siteRoutes.js` holds one route
  table (view, path, older aliases, title) and `parseRoute`, `urlFor`
  and `pageTitle` read it. `App.tsx` and the server both import it, as
  they import `gameParse.js`. `App` reads the path through `useSyncExternalStore`
  and derives the view and its parameter from it; the parallel
  `currentView`/`selectedGameId`/`selectedPilot` state, `applyView` and
  the popstate listener are gone. A new path scrolls to the top, except
  between `/maps` and `/maps/:name`, so opening or closing the popup keeps
  the list where it was.
- 2026-10-07 (S8): Titles are `<page> | overloadfight.club`, page first so
  tabs stay readable. The page part: the nav label for list pages
  ("Live", "Leaderboards", "Match history", "Maps", "Archive", ...), the
  pilot name from the URL, `Match <id>` plus `: <map>` once the match has
  loaded, `Fight Night <date>`, `<map> map`, and `Live: <server name>` (the
  IP until the server browser answers). `App` sets `document.title` in an
  effect; the server writes the same string into `<title>` and `og:title`,
  so a reload never flashes the old generic title. The live page's server
  name comes from the browser poll, which the server does not read, so its
  share title shows the IP.
- 2026-10-07 (S8): Share tags. The page route in `server/index.js` reads
  `dist/index.html` (2 KB) on each request and, for every page, replaces its
  `<title>` with the page title, `og:title`, `og:description` and `og:url`
  (`server/pageMeta.js`). `express.static` no longer serves `index.html`
  for `/`, so the dashboard goes through the same route. Names come from
  the URL, then the database: a pilot's description is
  `db.getPilotSummary`, the pilot's all-time leaderboard row (the
  leaderboard's `pilotTotalsSql` with `name = TRIM(@name)`, both files,
  through `idx_game_players_name_date`, the spelling from the latest
  game); a match reads its stored details (`db.getGameById`, hot
  then cold) and says `resultLine(winnerOf(game))`, the mode, the map and
  the measured length (no length when only the time limit is known); a
  fight night reads its saved card (`/fight-night` alone reads the
  latest). Live pages say "Join at <ip>". Every other page, and any lookup
  that finds nothing or throws, gets the site description. `og:url` is
  the request's protocol and `Host` with the path and query; with `trust
  proxy` set, the protocol follows `X-Forwarded-Proto`. Every value is
  HTML-escaped. `resultLine` moved from `utils/matchResult.ts` to
  `server/lib/matchResult.js` so the page and the preview share one
  sentence, and `utils/matchResult.ts` is gone. Rejected: a `PUBLIC_URL`
  setting; the request already carries the host the visitor used.
- 2026-10-07 (S8): URL state. Pages and the things a share should open
  are in the path: `/pilot/:name`, `/game/:id`, `/live/:ip`,
  `/fight-night/:date` (the date pills are links, so each date has its own
  entry and its own preview) and `/maps/:name` (the map popup; it shows
  the listed map whose name matches case-insensitively, or the map
  `/api/maps/:name/intel` returns; an all-digit name waits for the list
  and asks by id, since the server reads digits as an id; a name the
  intel route answers 404 for becomes `/maps?q=<name>` with the other
  filters kept, so old `/maps/<search>` links still work). Tabs and
  filters are in the query string, written with `replaceState` so back
  leaves the page instead of undoing each click; default values are left
  out, a value outside a parameter's allowed list reads as the default,
  and `setQueryParams` writes several keys at once (an archive filter
  and `page`). Search boxes that filter as you type (leaderboard, maps)
  update the box at once and the URL 300 ms after typing stops
  (`useQueryText`), because browsers throttle rapid history writes.
  Parameters: dashboard and `/history`
  `tab` (`servers`/`history`), `idle=1`, `q` (the submitted search);
  leaderboard `tab=online`, `q`, `min`, `active=1`; pilot page `mode`,
  `weapons=defense`; match page `tab`; maps `q`, `size`, `origin`,
  `sort` (kept on the popup's URL so a reload shows the same list behind
  it); archive `hall`, `year`, `page`, `q`; taunts `tab`. Not in the URL:
  sort orders, the rival picked on a pilot page, server favorites (still
  `favorite_servers` in `localStorage`).
- 2026-10-07 (S8): Back. `navigate()` stores a depth in `history.state`
  on each push. `goBack(fallback)` calls `history.back()` when the depth
  is above 0, that is when the previous entry is a page of this tab's
  session; on a page opened directly (a shared link, a new tab) it
  replaces the entry with the fallback instead of leaving the site: the
  match page falls back to `/history`, the live page to `/`, the pilot
  page to `/pilots`, the map popup to the map list with its filters. The
  buttons now say "Back".
- 2026-10-07 (S8): Stale match. `App` keeps the last fetched match with
  its id and shows it only on the page with that id; match B shows the
  loading screen until B arrives instead of match A. `PilotDetail` and
  `LiveGameDetail` are keyed by pilot and IP, so going from one pilot or
  server to another starts with empty state rather than the previous
  one's numbers.
- 2026-10-07 (S9): Tokens. `designTokens.js` at the repo root holds them
  and `tailwind.config.js` spreads them into `theme.extend`, so every
  class and every chart prop reads one file. Charts import `colors` from
  it because Recharts takes colour strings, not classes. Colours:
  `brand` `#ff6600` (`bg-brand`, `text-brand`, ...), `brand-hover`
  `#ff8533`, `surface-page` `#0a0a0a`, `surface-card` `#111111`,
  `surface-raised` `#1a1a1a`, and `line` `#1f2937` for borders (the value
  of Tailwind's `gray-800`, which 89 of the migrated pages' borders
  already used). Old hex values map like this. `#ff6600` is `brand`.
  Every other orange used for hover (`#ff8533`, `#ff8833`, `#ff771a`,
  `#ff7722`, `#ff7711`, `#e65c00`, `#e55b00`, `#cc5200`) is
  `brand-hover`. A near-black grey (channels within 6 of each other, none
  above `0x26`) goes to the nearest surface by its mean channel: up to
  `0x0d` is `page` (`#050505`, `#09090b`, `#0a0a0c`, `#0d0d0f`), up to
  `0x15` is `card` (`#0e0e0e`, `#101012`, `#111`, `#121212`, `#121215`,
  `#141210`, `#151515`, `#151518`), above that `raised` (`#161616`,
  `#18181b`, `#1a1a1a`, `#222`, `#262626`). Borders in `gray-800`,
  `gray-900`, `zinc-800`, `white/5` and `white/10` are `line`, opacity
  kept (`border-line/80`); `gray-700` and lighter stay, as control and
  hover borders. The tinted ones were mapped by hand: `#16120e` is
  `bg-brand/5`, `#2a1010` `bg-red-950/40`, `#150505` went with the old
  "Connection Failed" box. Accents outside the palette went to the
  nearest Tailwind colour: `#00ffff` is `cyan-400`, `#ffea00`
  `yellow-300`, `#ff4500` `orange-600`, `#333` (the server map's land)
  `neutral-700`. `index.html`'s inline `<style>` moved to `index.css`
  and reads the tokens through `theme()`. Two visible changes come with
  it: the body background behind the header and footer went from
  `#050505` to `surface-page`, and the scrollbar thumb's hover is
  `brand-hover`, lighter, where it was a darker `#cc5200`. Chart
  colours: brand and surface values on the migrated pages read
  `colors` from `designTokens.js`, and the three tooltips that shared one
  style use `chartTooltip` from there. Axis, grid and label greys and the
  series palettes stay hex (a chart theme is flagged); ActivityGraph's
  bars, grid and cursor keep `#262626` and `#222`, because mapping all
  three to `surface-raised` made the bars vanish into the grid.
- 2026-10-07 (S9): Type scale and radius. The type scale is Tailwind's
  plus `text-2xs` (10px, 14px line height). On the migrated pages every
  arbitrary size became a step: `text-[10px]`, `[11px]`, `[9px]` and
  `[8px]` are all `text-2xs`. 11px was first mapped up to `text-xs`;
  that made the dashboard's Active Nodes header wrap at 1,280 px, so the
  rule rounds down. One exception: the server map's hover label stays
  `text-[5px]`, because it sits in a 100x100 SVG viewBox and is drawn at
  the map's scale; 10px there doubled it. Radius has two
  steps: `rounded-control` (4px) for buttons, inputs, badges, tabs and
  small panels, `rounded-card` (8px) for cards, tables and dialogs, plus
  `rounded-full`. On the migrated pages a container (`div`, `section`,
  `table`) with `p-3` or more or a fixed height is a card, and so is a
  bordered panel that holds a table or a list; everything else is a
  control. `rounded-xl` and
  `rounded-2xl` cards drop from 12 and 16px to 8px.
- 2026-10-07 (S9): Shared states live in `components/States.tsx`.
  `Loading({ label?, compact? })` is a brand spinner with an optional
  label, `role="status"`. `EmptyState({ title, message?, icon?, action?,
  compact?, card? })` takes a lucide icon (default `Inbox`), an optional
  action such as Reset Filters, and `card` to draw the card frame when
  the state stands alone in a page (inside a table or panel it has
  none). `ErrorState({ title?, message?, onRetry?,
  retryLabel?, action?, compact? })` is a red-bordered card,
  `role="alert"`, with a Retry button when `onRetry` is given and any
  other button (Back, Logout) in `action`, styled with the exported
  `secondaryButtonClass`. `compact` is for a section
  inside a page; without it the state takes page-level padding. Copy
  stays as it was on each page (one voice is S10). Button busy icons
  (a spinning `RefreshCw` inside a button) are not view states and stay.
  Skeleton blocks that hold a number's or a section's place (Archive
  stat cards and tables, the map grid, the PPI card) stay too.
- 2026-10-07 (S9): Where they are used. Every view that fetches now
  tells loading, nothing and failure apart. Several said nothing on a
  failure before: the history list stayed blank, the leaderboard said
  "No pilots match current filters", the pilot page said "No data
  found", fight night said "No fight nights yet", the archive said "No
  archived matches found". To tell them apart, `fetchColdGames` now
  answers null on failure (its only caller is ColdStorage). GameList
  keeps a `historyError` flag: the History view fetches page 1 itself,
  and the dashboard, when App's page-1 fetch failed, shows the error
  with a Retry instead of asking again. A failed history search shows the
  error instead of an empty list, and a page-1 answer older than a newer
  search is dropped. ColdStorage's stats retry calls the fetch again
  instead of reloading the page, and a failed pilots request shows an
  error in the hall of fame. The pilot page fails when its stats or its
  match list fail.
- 2026-10-07 (S9): Views and their states. Dashboard (first poll, connection
  failed, no servers to show; each live card's roster), history (list,
  search), leaderboard (roster, online tab), pilot (stats, no stats, no
  matches in a mode), match (load, failure, empty timeline and damage
  tabs, no playstyles), live (load, failure, no players), fight night,
  archive (games, hall of fame, top maps, stats banner), maps (list
  failure, no match), admin (stats), taunts (vault not connected,
  scanning, nothing found), the history tab's activity timeline. OLMod,
  Resources and the pilot manager fetch nothing to wait on.
- 2026-10-07 (S9): Error boundaries. The top-level `ErrorBoundary`
  wraps `<App />` in `index.tsx`, outside `OverloadFsProvider`, `Layout`
  and the `Suspense`, so a throw in App itself, the provider or the nav
  shows the recovery screen instead of a blank page. The existing one
  inside `Layout`, around the `Suspense`, stays: a view that throws keeps
  the nav, and it takes `resetKey={pathname}`, so following a nav link
  clears the error (before S9 it stayed until a reload). It clears only
  an error from the page before, so a new page that throws on its first
  render keeps its error screen instead of rendering twice. The
  boundary keeps a `hasError` flag beside the error, so a thrown `null`
  still shows the fallback. Both render `ErrorState` with a Reload
  button. A `resetKey` was chosen over keying
  the boundary by path, which would remount MapLibrary when its popup
  opens.
- 2026-10-07 (S9): Migrated to tokens: the dashboard (`App.tsx`'s
  headers, `GameList`, `ServerStats`, `LiveMatchCard`, `ActivityGraph`,
  `GlobalActivityChart`, `ServerActivitySparkline`, `CalendarWidget`,
  `FightNightTeaser`), the leaderboard (`PilotsList`), the pilot page
  (`PilotDetail`, `PilotPerformanceCard`), the match page (`GameDetail`,
  `MatchAnalysis`, `ScoreChart`, `DamageMatrix`, `Analysis`), the live
  page (`LiveGameDetail`, `JoinIp`; its translucent `bg-gray-800/50`
  panels are `surface-card`), plus `Layout`, `ErrorBoundary` and
  `index.html`. Left: Fight Night (`FightNightSection`,
  `FightNightRecapCard`), Archive, Maps, Admin, Taunts and its editors,
  the pilot manager, OLMod and Resources. Those got the shared states and
  lost their dead classes but keep their hex values.
- 2026-10-07 (S10): Glossary. One word for each idea in user-visible
  text, the server's recap and share copy included:
  - match: a played match. Old words: game (for a match: "Games In
    Progress", "Total Games Archived", "Load older games", "No game
    data"), bout ("Recent Bouts", "Bout Archive"), mission ("Mission
    Info"), engagement, sorties, combat log ("Retrieving combat log").
    "Game" now means Overload itself only: in-game, game folder, Base
    Game, "the game subtracts 1 kill per suicide".
  - pilot: a person who plays. Old words: player, callsign. "Host"
    still means the pilot who created a match; "single-player" is the
    game mode. The nav's "Pilot" (the pilot-file settings page) is now
    "Settings"; "Pilot Settings" pushed the 1,280 px bar 44 px past the
    window. The page title stays "Pilot settings".
  - kill: old words frag, fragger, eliminations. Kills are the
    in-game count, which already loses one per suicide; the K/D and
    Suicides tooltips say so. "Top fragger" is "most kills" on the
    recap card, the teaser and the share description.
  - map: old words arena, combat zone, sector, theater, levels. Kept:
    "Level Editor" (the product's name) and "Lag Compensation Level"
    (a setting).
  - server: old words node ("Active Nodes", "Dedicated Node"), relay,
    uplink ("Establishing uplink").
  - The replay's full-screen "theater" mode is a video-player word,
    not a map, and stays.
  - archive: only the `/archive` page, every stored match of every
    year. `/history` is "Match History", the list of the last 365 days,
    and is never called an archive ("Historical Archive", "Fetching
    archival data" are gone). The taunt importer's audio archives
    (archive.org) and the admin's XML archive files are files, not the
    page, and keep the word.
  Recap sentences come from `fightNightService.js` templates and are
  saved with the recap, so recaps generated before S10 keep the old
  words. Checked with a scratch script that walks the TypeScript AST of
  `App.tsx` and `components/*.tsx` for JSX text and string literals
  (outside `className`, imports, console calls and comparisons) and
  greps them for each term's old words, with the kept words above
  filtered out.
- 2026-10-07 (S10): Combat Ratio is (kills + 0.5 × assists) ÷ deaths,
  or the kills when there are no deaths, to two decimals. Lethality is
  kills per minute of match time: the kills over the summed
  `durationOf()` of the pilot's ranked matches (2+ pilots, 60 s+),
  counting each match's whole length, to two decimals. Both are
  `combatRatio()` and `lethality()` in `server/lib/gameParse.js`, beside
  the tooltip text for each (`COMBAT_RATIO_HINT`, `LETHALITY_HINT`).
  The stats worker (`statsPasses.js`, the career numbers in
  `pilot_stats_cache.kda` and `.kpm`), the pilot telemetry
  (`getPilotTelemetry`, the 365-day and per-mode numbers) and the
  roster's 90-day totals (`db.getPilotStats`, the owner's `5afcdf5`)
  call them;
  the leaderboard's fallback, the profile's fallback and the match page
  call `combatRatio` too. The leaderboard and the profile show the
  career numbers from the cache: the roster's Combat Ratio column, a
  new Lethality column, the profile's Combat Ratio card (its headline
  was the career K/D with KDA below; now Combat Ratio, with K/D below)
  and the PPI card's Lethality. The profile's Combat Performance card
  shows Lethality for the page's own span and mode, and says so in its
  sub-line ("Kills / Min, last 365 days, all modes"). The tale of the
  tape compared the pilot's 365-day ratio with the rival's career one;
  both sides are career now. The match page's column is "Combat Ratio"
  at two decimals (it was "KDA Ratio" at three, and gave kills + 0.5 ×
  assists for a pilot with no deaths). The cost of the no-deaths rule:
  the ratio can rise at the first death (3 kills, 4 assists and no
  deaths is 3.00; one death makes it 5.00), which shows most on the
  match page. Kept, since the career numbers have always used it and
  changing it means a stats rebuild. The archive's hall-of-fame tab
  that sorts by K/D said "Combat Ratio (K/D)"; it says "K/D". With the
  roster's Active (90d) toggle on, its Combat Ratio is the 90-day one,
  so it differs from the profile's career number on purpose, and its
  Lethality is `—` (the 90-day totals carry no match time).
- 2026-10-07 (S10): Clickable rows and divs. The 22 found became:
  - Sortable headers: `components/SortHeader.tsx`, a `<button>` inside
    the `<th>` with `aria-sort` on the `<th>` (the roster and the server
    browser).
  - Cards that hold other controls (the 390 px server cards, the
    history cards): the title link covers the card through a
    `.stretched-link` `::after`; the card's other buttons and links sit
    above it with `relative z-10`. The rival picker works the same way
    with a `<button aria-pressed>` as the cover.
  - Table rows (server browser, roster, the pilot's match list, the
    archive's hall of fame): every cell is a link to the row's page
    (`LinkCell` in `components/Link.tsx`, the padding on the link so the
    whole cell is clickable). The row's main cell is the only Tab stop;
    the others are `tabIndex={-1}` and stay readable. A covering link
    is not used on rows because Safari does not position against a
    `<tr>` (WebKit bug 240961). The server name cell holds a copy
    button, so it is the name link, the button and a filler link.
  - `rowLink` is deleted. Middle, Cmd and Shift clicks on a row are the
    browser's own link behaviour now.
  - `DeepStatCard`'s `onClick`, which no caller passed, is removed.
- 2026-10-07 (S10): Focus. One rule in `index.css`:
  `:focus-visible:not([tabindex="-1"])` draws a 2px `brand` outline
  (read through `theme()`) 2px out, on every control and on the
  scrolling boxes Chrome lets Tab reach. A stretched link draws it on
  its cover, around the card. Elements focused only by script
  (`tabindex="-1"`: dialog panels, cell links) get no outline.
  `@tailwind variants` now sits before the custom CSS, so this rule
  wins over the 42 `focus:outline-none` classes (mostly inputs whose
  border changes colour on focus; those now show both). Rejected: a
  focus class on each of the 400+ controls, which the next control
  would miss.
- 2026-10-07 (S10): Dialogs. `hooks/useDialog.ts`:
  `useDialog(open, onClose)` returns `props` for the panel (`ref`,
  `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `tabIndex
  -1`) and `titleId` for its heading. While open: focus moves to the
  panel unless a field in it took focus with `autoFocus`; Tab and
  Shift+Tab cycle inside; Escape calls `onClose` and stops there (the
  audio editor's window Escape does not also fire); on close, focus
  returns to the element that had it when the dialog opened, read
  while rendering the opening frame. Used by the map popup (Escape goes
  back, like its Close), the web import and voice recorder, the pilot
  management dialog (Escape does nothing while an operation runs, like
  its close button) and the key rebind dialog (its own capture
  listener still takes every key, Escape included). No dialog closed on
  a backdrop click before, and none does now. The 390 px menu is a
  disclosure (`aria-expanded`, `aria-controls`), not a dialog.
- 2026-10-07 (S10): Pagination. The roster shows 50 pilots a page, the
  map grid 24 cards (one to four columns). The page is `?page=`,
  1-based, left out on page 1, written with `replaceState` like every
  filter. `usePage(items, size)` in `components/Pager.tsx` returns the
  page's items and reads a page past the end as the last page; `Pager`
  renders Previous, "Page N of M", Next and scrolls the list's top into
  view. A filter, sort or search change writes `page: null` in the same
  history entry, through a new second argument on `useQueryParam`'s
  setter (`setMinParam('25', { page: null })`). The map popup's URL
  keeps the list's whole query, so closing it returns to the same
  page; `/maps/<text>` turned into a search drops the page. The
  roster's sort moved into the URL (`?sort=kda`, `?dir=asc`), so a page
  number names the same pilots after a reload. The archive keeps its
  own server-side pager. Rejected: dropping `page` in
  `setQueryParams` on any other change, because switching the archive's
  hall-of-fame tab would reset its match browser.
- 2026-10-07 (S10): Tap state. One rule in `index.css`:
  `:where(a[href], button:not(:disabled), summary, select,
  label[for]):active` sets opacity 0.7, and a stretched link shows a
  `brand/10` cover over its card instead. A rule rather than `active:`
  classes because there were 475 `hover:` classes and no `active:` one,
  and hover never fires on a touch screen.
- 2026-10-07 (S10): Mobile widths. At 390 px the dashboard header uses
  `p-5` and `text-3xl` (it was 411 px wide); the live page's header
  stacks, its standings columns narrow, and its grid is `grid-cols-1`
  so a wide child cannot stretch the track (509 px); the taunt and
  pilot-settings headers wrap and their tab bar scrolls (854 and 441
  px). The nine tables without one got a wrapper: `overflow-x-auto`, or
  `overflow-auto` where the box already scrolled down.
- 2026-10-07 (S11): `server/db.js` stays the entry point and is now 180
  lines. It imports each function by name from `server/db/` and builds the
  same `db` object, with the same 90 keys and the same kind of value behind
  each one (function, prepared statement or `{ get }`/`{ all }` wrapper). It
  re-exports `backupsDir`, `mapsDir`, `mapImagesDir` and `pilotStatements`.
  No caller changed what it imports. The modules:
  - `db/connection.js`: the data folder, its writability check and
    subfolders, both connections, the WAL pragmas, the `net_kills`,
    `pilot_key` and `duration_of` SQL functions, the cold `ATTACH`, and
    `backupHot`/`backupCold`.
  - `db/migrations.js`: every `CREATE TABLE` and index, in the old order;
    the `game_players` schema, its writers (`writeHotPlayers`,
    `writeColdPlayers`), the backfill and repair (`migrateGamePlayers`);
    the `pilot_stats_cache` sanitize; and `ensurePilotStatsCache()`, the
    create-and-add-columns step `refreshCaches` used to run inline (it
    still runs at the same point of each refresh). Every repo and
    analytics module imports this file, so the tables exist before any
    statement is prepared.
  - `db/repos/games.js`: list, search and count in both files,
    `getGameById`, `saveGames`, `insertGame`, `saveColdGamesBatch`,
    `updateGameDetails`, the cold move, `getSummaryGames`,
    `getGamesForDate`, `getGameGaps`, `getLatestGameId`, `getMaxGameDate`,
    `upsertGameSql`, `getGamesInDay` and `utcDayBounds`/`utcMonthBounds`.
    `insertGame` calls `saveGames` directly instead of `db.saveGames`
    (the same function; the S3 reason for the object was an ES-module
    error, which a direct call avoids too).
  - `db/repos/jobs.js` (backfill jobs, `game_metadata`),
    `db/repos/settings.js` (`admin_settings`), `db/repos/maps.js` (the
    stock-map seed, the library list and intel, the admin writers),
    `db/repos/fightNights.js` (saved recaps).
  - `db/analytics/global.js`: site totals, the mode, map and activity
    charts, server activity, the all-time totals, the `map_stats_cache`
    readers and `getQualifyingFightNightDates`.
  - `db/analytics/pilots.js`: `pilotTotalsSql`, the leaderboard and its
    90-day outcomes, the share summary, match history, first sightings,
    the `pilot_stats_cache` reads and `updateDeepMetrics`, and
    `pilotStatements`.
  - `db/analytics/pilotTelemetry.js`: the weapon names, the pilot game
    reads, `getPilotTelemetry` and `getPilotBreakdown`.
  - `db/analytics/refresh.js`: `refreshPilotStats`, the stats worker
    (still `server/statsWorker.js`), `getColdStorageStats` and
    `stopStatsWorker()` for `close()`.
  `restoreHot`, `checkHealth` and `close` stay in `db.js`, because each
  spans two modules; the health statements are prepared there for the
  same reason they were prepared last before (the tables must exist).
  Where a statement and the wrapper the `db` object exposes shared a
  name, the statement gained a `Stmt` suffix (`getPilotStatsStmt`,
  `getDatabaseStatsStmt`, ...) or, for the hot game read, became
  `getHotGameById`. The modules were cut from line ranges of the old file
  by a script, not retyped, and a line check over all of them finds
  every old line apart from the imports, two section comments, the
  renames, and four pieces of dead code that had no home in any module:
  `insertGameHot`, `insertGameCold` and `getDistinctServerIps` (prepared,
  never used; the S5 and S6 flags) and the second cold `ATTACH`, which
  always threw "already in use" and was swallowed. The duplicate
  `getMostActiveMaps` keys and the `seedStockMaps` wrapper around
  `seedStockMaps` went too.
- 2026-10-07 (S11): Routes. `server/routes.js` is now the `/api`
  aggregator `index.js` already mounted: it `router.use()`s eight
  resource routers from `server/routes/`, `games.js` (`/games`, `/cold/*`,
  `/game/:id`, both kill-feed paths), `stats.js` (`/stats/*`),
  `browser.js`, `maps.js`, `config.js` (`/config`, `/calendar-url`),
  `analysis.js` (`/analyze-match`), `pilots.js` (`/pilot/:name/*`) and
  `fightNights.js`. Each router keeps its full paths, so no handler
  moved to a new URL and `index.js` did not change. `admin-routes.js` and
  `bridge-routes.js` were already one resource each and stay where they
  are. The mounted list (97 entries with middleware, from a script that
  walks `app._router` after importing `index.js` with `listen` stubbed)
  is the same set as before; only the order between resources changed.
  For 1,931 sample URLs built from every pattern, no URL matches two
  routes and the first match is the same in both orders, so order cannot
  change which handler answers. The owner's replay test read route
  layers from the top of `routes.stack`; it now looks one level down.
- 2026-10-07 (S11): Components. Each of the four is under 500 lines and
  keeps its path, exports and props. Child components live in a folder
  per giant (`components/pilotSettings/`, `components/audioEditor/`,
  `components/webImport/`, `components/admin/`), hooks in `hooks/`. The
  moved JSX and handler bodies were cut from line ranges by script.
  Handlers stay plain functions rebuilt on each render, as before, and
  every dependency list is unchanged.
  - `PilotSettingsPanel` (2,119 to 224 lines) owns only `activeTab`.
    `usePilotSettings` owns the pilot, the loaded files, the pending
    edits, the 6 s game-running poll and the file load;
    `usePilotSettingsSave` the XP, save-all and backup actions;
    `usePilotSettingsAutoselect` the autoselect list handlers;
    `usePilotSettingsRawEntries` the raw table's search, filter and rows;
    `useKeyRebind` the rebind state, its `useDialog` and the capture
    key and mouse listener. 12 children: the header, XP card, tab bar,
    the six tabs, the save bar, `KeyRebindDialog` (it still spreads
    `rebindDialog.props` and puts `titleId` on its heading) and
    `AutoselectList`, which draws both priority columns. The old panel
    wrote the two columns out twice; one component now takes the
    column's colours, labels and type rule from a map of whole class
    strings (so Tailwind still finds every class), and the DOM is the
    same byte for byte.
  - `AudioEditor` (1,353 to 209). `useAudioEditorLifecycle` (the mount
    effect that starts ffmpeg, loads the taunt history and tears down
    WaveSurfer, the preview audio and the AudioContext), `useAudioEditorSource` (the file, its buffer and
    peak, drag and drop), `useAudioEditorWaveform` (WaveSurfer, region,
    zoom, loop, nudge and audition), `useFfmpegExport`,
    `useAudioEditorHistory` (saved taunts), `useAudioEditorHotkeys` (the
    window keydown listener) and `useAudioEditorStatus` (error, success,
    debug log). The three refs several hooks share are created in
    `AudioEditor` and passed in, and the hooks are called in the order
    the effects used to run. Nine children (header, picker, file bar,
    waveform, transport, taunt window, export, history, diagnostics);
    the history list takes the history hook's object whole.
    ffmpeg still loads only in the `AudioTauntMaker` chunk.
  - `WebImportModal` (1,332 to 176) keeps `useDialog`, the panel, the
    header, the tab bar and the open effect. `useWebImportPreview` owns
    the shared preview player; `useWebImportYouTube`,
    `useWebImportArchive`, `useWebImportVideo` and `useWebImportDirect`
    own each tab's state and requests. One child per tab, plus the
    YouTube icon.
  - `AdminPanel` (986 to 90). `useAdminPanel` holds the two original
    effects (session check then version; on login, load everything and
    start the 2 s poll) and composes `useAdminAuth`, `useAdminStats`
    (stats, version, backfill, stats refresh), `useAdminSettings`,
    `useAdminMaps` and `useAdminArchiveSync`. Seven children (login
    form, metrics, coverage chart, backfill, dashboard settings, archive
    ingest, map management); the backfill panel takes the stats hook's
    object whole and works out its rate limit itself.
- 2026-10-07 (S11): AdminPanel off axios. Its 17 axios calls now go
  through 14 new functions in `services/apiService.ts`
  (`fetchAdminAuthStatus`, `submitAdminLogin`, `fetchVersionInfo`,
  `fetchAdminExtendedStats`, `fetchAdminSetting`, `saveAdminSetting`,
  `fetchAdminMapCount`, `syncAdminMaps`, `addAdminMap`,
  `startAdminBackfill`, `postAdminBackfillJobAction` (pause, resume and
  cancel), `fetchAdminArchiveSyncStatus`,
  `cancelAdminArchiveSync`, `triggerAdminStatsRefresh`), all on one
  `adminRequest` helper. It rejects the way axios did, so every catch
  block reads the error as before: a non-2xx answer throws an
  `AdminRequestError` with "Request failed with status code N" and
  `response: { status, data }`, a network failure throws "Network Error"
  with no `response`, a body that is not JSON stays text. It sends
  axios's `Accept` header and `Content-Type: application/json` only with
  a body. The older admin functions in `apiService.ts` were not reused:
  they send `credentials: 'include'` and turn failures into `null` or
  `false`, which would change the panel's messages. URLs are unchanged,
  including the pause URL that matches no route (flagged).
  `services/apiService.test.ts` (7 tests) pins the helper's behaviour.
  The helpers sit in `apiService.ts`, which the entry chunk carries, so
  the entry grew by 1.24 KB raw, 0.40 KB gzip; deleting the six older
  helpers that duplicated these endpoints (PR review) brought it to
  73.94 KB gzip, 0.18 KB over S11's start. Rejected: a separate
  module for the admin calls, which the Done-when list's "uses
  apiService" reads against. `axios` stays in `package.json` for the
  server and `services/geminiService.ts`.
- 2026-10-08 (S12): Kill-log rules live in `server/lib/gameParse.js`,
  beside `winnerOf`, and the match page imports them as S7 did. One kill
  is worth +1 to the attacker. A suicide (attacker and defender the same
  pilot by `pilotKey`) or, in a team game, a team kill (both sides on one
  team) is -1 to the attacker. The team score moves with the attacker's
  team. A death with no attacker scores nothing for anyone, which matches
  `playerRows`'s suicide count. Every death counts for the defender and
  every `assisted` for the assister. `killPoints` is that rule for one
  entry; `scoreboardAt(game, t)` replays the log in time order (log order
  for equal times) through second `t` inclusive. On the four local
  matches with logs (78735, 78761, 78764 Team Anarchy; 78760 Anarchy;
  148 to 169 entries each) the full replay gives every pilot's `kills`,
  `deaths` and `assists` and both teams' `teamScore` exactly, suicides
  included. None of the four has a team kill, so the team-kill rule is
  the old ScoreChart's, not checked against the tracker. The old
  MatchReplay took a team kill off the victim; it now takes it off the
  attacker.
- 2026-10-08 (S12): A lead change is the outright lead passing from one
  side to another, sides as in `winnerOf` (teams in a team game, pilots in
  FFA). A level score leaves the lead with whoever had it: A, level, A
  again is no change; A, level, B is one change, timed at B's go-ahead
  kill. Taking the first lead is not a change. A suicide can make one (it
  can drop the leader below someone). In FFA two trailing pilots can trade
  the lead while the eventual winner is behind; that counts. Momentum is
  the eventual winner's margin over the best other side after every kill,
  from 0:00 (`momentumOf`); the winner is `winnerOf`'s first-ranked side,
  so in a draw it is the side ranked first. Both apply only where the
  score is kills (`killScored`: Anarchy, Team Anarchy, or no mode set). For
  CTF and Monsterball the chart shows an EmptyState and the fight card
  leaves out lead changes (`leadChanges` returns null there, and for a
  match with no log, so "none apply" differs from "none happened"); the scoreboard replay still runs, because
  kills, deaths and assists are in the log whatever the mode. First blood
  is the first kill on an opponent: not a suicide, not a team kill
  (`firstBloodOf`); it replaces `calculateFirstBlood` in
  `utils/statCalculators.ts`, which counted team kills.
- 2026-10-08 (S12): Fight card. `verdictOf` reads the final `winnerOf`
  result, so it works for every match, kill log or not: draw for a shared
  top score; split decision when the winner's margin is at most a tenth
  of their score, or 1 point; KO when the runner-up scored less than two
  thirds of the winner; decision otherwise. The thresholds are a choice,
  picked so the fixtures spread across all four (72096 and 72108 KO,
  72102 and 72097 decision, 72098 and the Monsterball sample draw; the
  local 78735 at 43–41 and 78764 at 87–80 are split decisions). The
  verdict's tooltip states the rule (`VERDICT_HINT`). The result panel
  moved into `components/gameDetail/FightCard.tsx` unchanged and gained
  one row: verdict, lead changes (kill-scored matches with a log) and
  first blood (pilot link, weapon, time). The share description
  (`resultLine` in `og:description`) is unchanged.
- 2026-10-08 (S12): The scrubber sits beside MatchReplay, and both run on
  the same rules. MatchReplay is a dramatised radar with its own clock,
  play, speeds and story mode, collapsed until opened; the S12 scrubber
  replays the overview's scoreboard, which MatchReplay does not draw, and
  needs to work without opening the replay. Extending MatchReplay would
  have put the scoreboard behind its open button and grown a 1,970-line
  file. What was shared is the timeline logic: MatchReplay works out each
  kill's points and side with `killPoints` once, when it sorts the log,
  and its score at a moment adds those up; its team mode is
  `winnerOf().team`, its suicides are `killPoints`'s, its FIRST BLOOD
  callout is `firstBloodOf`'s kill, its lead-change story beats come from
  `leadChanges`, and its length is `replayLengthOf` (the match length, or
  the last kill's time if later; 300 s when neither exists), which the
  scrubber spans too. Its revenge and spree callouts, its leader
  tie-break and its radar are untouched, and it was not split (1,897
  lines). Its BLUE and ORANGE pilot colours are now `chart.team`. The two are
  not synced: scrubbing the page does not move the replay's clock, and
  playing the replay does not move the scrubber. Its unused
  `initialTime` and `onTimeUpdate` props would allow it later.
- 2026-10-08 (S12): The scrubber is a native range input (0 to
  `replayLengthOf`, 1 s steps), so arrow keys, Home, End and Page keys
  work and the focus ring rule applies. Its position is `?t=<whole
  seconds>` through `useQueryText` (the slider follows at once, the URL
  300 ms later) in `hooks/useMatchTime.ts`; the far right is the final
  scoreboard and leaves `t` out. At the end the table shows the
  tracker's own numbers; scrubbed back, kills, assists, deaths and Combat
  Ratio are replayed and the rows re-sort by kills. Damage and DPM show
  "–" while scrubbed because damage events carry no time. A click on the
  momentum chart moves the scrubber to the nearest kill; it is a pointer
  shortcut, and the slider is the keyboard path. `?t=` survives tab
  changes.
- 2026-10-08 (S12): Chart colours are a `chart` export in
  `designTokens.js`, outside Tailwind's theme. Series hues are the dataviz
  reference palette's dark steps in its fixed order; its validator, run
  against `surface-card` (`#111111`), passes the seven weapon families
  (worst adjacent CVD ΔE 8.4, normal-vision ΔE 19.3, all inside the
  lightness band and above 3:1) and the team pair (slots 1 and 2, ΔE
  26.8). Tailwind's blue-400 and orange-400, which the page uses for team
  names, fail the band as mark colours, so they stay text colours. Chrome
  (grid, axis, labels, tooltip text) is the palette's dark greys. Weapons
  are grouped into seven families by `weaponFamily` (`WEAPON_FAMILIES` in
  `gameParse.js`: Impulse, Cyclone, Reflex; Thunderbolt; Flak, Crusher;
  Driller, Lancer; Falcon, Missile Pod, Hunter; Creeper, Time Bomb; Nova,
  Devastator, Vortex), plus a grey "other", because 16 weapon hues cannot
  be told apart. The kills are drawn on one strip per family under the
  momentum chart (all seven always shown, in palette order, so neighbours
  are the validated pairs), not as coloured dots on the line, where any
  two hues could touch. MatchReplay's tracer and ticker colours and the
  deep dive's weapon scatter and pie now read the family colour too, so a
  weapon has one colour on the page; that changes the owner's neon
  tracer colours. The deep dive's axes and tooltips read the chart greys
  and its intensity bars are `brand`. The momentum chart colours the
  margin by the side ahead: BLUE and ORANGE in team games, the winner
  against the field in FFA.
- 2026-10-08 (S12): No new endpoint. The page already holds the stored
  details with their kill log from `/api/game/:id`, and the rules run on
  them in the browser. `/api/match/:id/kills` (the owner's) is unused by
  the client and keeps its own suicide rule (flagged).
- 2026-10-08 (S12): `clock()` (m:ss) moved from `server/pageMeta.js` to
  `server/lib/matchResult.js`; the share preview, the match header, the
  timeline tab and the new components use it. `ScoreChart.tsx` is gone:
  the momentum chart replaces it, and its client-side lead-change rule
  went with it.
- 2026-10-08 (S13): Rating system. Glicko-2 (Glickman's 2012 example
  paper), written in `server/lib/gameParse.js` (`glicko2`, about 50 lines
  with the Illinois volatility step) rather than a package: it is short,
  and a test checks it against the paper's worked example (1464.05 against
  the paper's 1464.06, which it reached by rounding along the way; RD
  151.52, volatility 0.05999). Parameters (`RATING`): start 1500, RD 350,
  volatility 0.06, τ 0.5. Every rated match is one rating period for the
  pilots in it, replayed in date order (id order for equal dates) over
  every stored match, hot and cold. A match counts when it passes the
  ranked filter (2+ players, 60 s or more by `durationOf`; now one
  function, `rankedMatch`, which the career stats, the telemetry and the
  90-day results call too) and `winnerOf` finds a result, so a team game
  without `teamScore` does not count, as in S2. Who plays whom
  (`ratingSides`): every pilot plays every other side once, a side being a
  team in a team game (scored by `teamScore`) and a pilot in FFA (scored
  by in-game score), the S2 rules. A higher score wins, an equal one is a
  draw worth half. A side's strength is its pilots' mean rating and its
  uncertainty the root mean square of their RDs, so a win beside a strong
  teammate pays less than one beside a weak teammate, and in FFA a pilot
  meets each opponent as they are. Each result weighs 1 / (sides - 1), so
  a match counts as one game whatever its size. Without the weight, an
  8-pilot FFA was 7 results that Glicko-2 treats as independent; on a
  synthetic 75,000-match history the busiest pilot's volatility climbed to
  5.45, their RD passed 350 and their rating ran to 5e46. With it, no
  volatility in that history passes 0.0601. A pilot listed twice plays
  once; a team-game pilot without a team sits out. Between matches a
  pilot's RD grows by their volatility for every day sat out (φ² + σ² ×
  days), up to 350, and the RD shown on the page and in the rankings has
  grown the same way up to today (`rdOn`). With τ 0.5 and the weight,
  the volatility hardly moves (at most 0.0601 in the synthetic history),
  so idle RD growth is close to 108.6 RD² a day: about 1,070 days from
  RD 80 back to 350. Rejected: every pilot against
  every opponent pilot in team games (a 4v4 would be 4 copies of one team
  result), and the pilot's own rating against the other team's mean (a
  strong pilot on a weak team would lose most for a loss their team was
  expected to take).
- 2026-10-08 (S13): Snapshot table and migration. `rating_snapshots(pilot,
  day, name, rating, rd, volatility, matches)`, primary key
  `(pilot, day)`, `WITHOUT ROWID`, in `tracker.db` only: it is derived
  from both files, like `pilot_stats_cache`, so the hot/cold split does
  not apply. One row per pilot per day with a rated match: the rating at
  the end of that day, `pilot` the `pilotKey()`, `name` the latest
  spelling, `day` the calendar day in America/Chicago (the container's
  TZ, as `backup.js` names its folders; `RATING.timeZone`), `matches` the
  rated matches so far. First build: `migrations.js` creates it empty at
  startup, and the startup check in `maintenance.js` runs a stats refresh
  while it is empty, as it does for an empty `pilot_stats_cache`
  (without it, the first boot on a warm database waited for the 6-hour
  refresh). Otherwise a restart needs no repair, because every refresh replays every rated match and brings the table in
  line. `restoreHot` creates it if the restored file predates S13.
  Rollback: revert, pull the old image, and `DROP TABLE rating_snapshots;`
  on `tracker.db` (or leave it; nothing older reads it). The entry said a
  nightly snapshot table; the table holds one row per day, but every
  refresh rewrites any day a new or re-read match moves, so it is never
  frozen. Rejected: a frozen nightly copy (no history and no movement for
  weeks after the deploy, and wrong as soon as a backfill adds older
  matches), and one row per pilot per match (about 6 times the rows for a
  line nobody reads per match).
- 2026-10-08 (S13): When ratings are recomputed. In the stats worker, on
  every refresh (startup when the data is newer than the cache, every 6
  hours, the admin button, after a backfill). The rating pass keeps each
  rated match's sides during the scan and replays them in date order at
  the end. The worker then compares the replay with the table on its
  read-only connection and posts only the days that differ, so the main
  thread writes a handful of rows on a normal refresh. The main thread
  writes in transactions of 2,000 rows and lets requests run between
  them, so the first fill, or a refresh after an older match arrives
  (archive ingest, a backfill), does not hold the event loop; a read
  between chunks can see some days new and some old for that long.
  Synthetic 75,000 matches, 288,766 daily rows, on this Mac: sides 0.2 s
  and replay 0.48 s in the worker, the comparison 0.77 s in the worker,
  2.3 ms on the main thread for a refresh that adds 50 matches, 0.60 s in
  all for the first fill. Formatting the Chicago day once per hour seen,
  not once per match, cut a fifth of the replay. No request computes a rating. The
  maintenance tick, the admin button and the post-backfill refresh each
  called the refresh three times in a row (`buildColdStorageStatsCache`
  and `buildMapStatsCache` are aliases of `refreshPilotStats`, S5); they
  call it once now. The `db` keys stay.
- 2026-10-08 (S13): Power rankings and the weekly window. A pilot is ranked
  on a day with 10+ rated matches and one in the 28 days up to it
  (`rankStatus`: otherwise 'provisional' or 'inactive', which the pilot
  page shows), by rating (then rated matches, then name), from each
  pilot's latest snapshot on or before the day (`powerRankings`). The page lists the top
  25 today, in America/Chicago. Movement compares each listed pilot's rank
  today with their rank 7 days earlier, by the same rule applied to that
  day: `change` is the places gained, or null (NEW) when not ranked then
  (`rankingMovement`). A rolling 7 days rather than a Monday-to-Sunday
  week, so the page always shows the last week's movement; a Monday post
  (S18) reads the same numbers. Rejected: ranking by RD alone (harder to
  explain than a match count), and rating minus 2 RD as the sort (it
  would order the table by a number the page does not show). The ranking
  for a day is computed once and kept in memory until the next refresh
  writes snapshots (`clearRankings`).
- 2026-10-08 (S13): Endpoints. `GET /api/pilot/:name/rating` (in
  `server/routes/pilots.js`) answers `{ name, rating, rd, matches,
  status, rank, history: [{ day, rating, rd, matches }] }`; a pilot
  with no rated match gets `matches: 0` and an empty `history`, not a
  404, so the page tells "no rating" from a failure. `GET
  /api/stats/rankings` (in `server/routes/stats.js`) answers `{ day,
  since, total, pilots }`, each pilot a snapshot row plus `rank` and
  `change`. Neither goes through `cacheService`: the in-memory ranking is
  cleared when a refresh writes, so the answer is never older than the
  table (the S11 stale-leaderboard flag came from a route cache outliving
  a refresh). The client reads them through `fetchPilotRating` and
  `fetchPowerRankings` in `services/apiService.ts`, null on failure.
- 2026-10-08 (S13): The view. `/rankings` is a route in `siteRoutes.js`
  ("Power rankings"), with a share description in `pageMeta.js` ("Power
  rankings for <day>: 1. NAME (rating), ..." for the top three). It is not
  a tenth nav item: the bar ends 6 px from the window at 1,280 px with
  nine. The leaderboard's tab bar links to it (the bar wraps at 390 px),
  the nav marks Leaderboards on it (a `section` on its row in
  `siteRoutes.js`, read through `navSection`), and a pilot's rank on the profile
  links to it when it is in the top 25. Columns: rank, movement (▲n in
  emerald, ▼n in red, – for none, a NEW badge; each read out
  by `sr-only` text), pilot, rating, RD and last match (both hidden below
  640 px), rated matches. Rows are `LinkCell` links as on the roster;
  `LinkCell` gained `cellClassName` for the hidden columns. Last match is
  the snapshot day, the day the rankings count, not the viewer's local
  date.
- 2026-10-08 (S13): The pilot page's rating card
  (`components/pilotDetail/RatingCard.tsx`) sits under the PPI card: the
  rating, ±2 RD, the RD, rated matches and the standing (the rank, or
  "Provisional: n of 10 rated matches", or "Not ranked: no rated match in
  the last 28 days"). The chart (`RatingChart.tsx`) is the rating at the
  end of each day played as a 2px line in palette slot 1 (`chart.series`,
  the value the validator already passed as BLUE) over a 10% band of ±2
  RD, a dashed line at 1500 (the domain always includes it), dots up to
  30 days, a tooltip with day, rating, ±2 RD and rated matches, and a
  `role="img"` label. Straight segments, not steps: with steps the last
  day had no width and its rating showed only as a drop at the edge. A
  "Rating by day" table under it is built only when opened. The line is
  an unfilled Recharts `Area`, because `Line` would have added 9.6 KB of
  its own code to the pilot page's chunk; and the chart is `React.lazy`
  behind its own `Suspense` inside the card, because the pilot page did
  not load Recharts before S13 and should not wait for its 91.7 KB gzip
  chunk. That `Suspense` is local to the card; the views' single one in
  `App.tsx` is unchanged; the chunk's download starts when the pilot page
  loads, not after the rating answers. `PilotDetail` loads the rating
  (`hooks/useLoad.ts`, also used by the rankings view) beside its own
  four requests and passes it to the card, so a mode change does not ask
  again. The thresholds in the card's words come from `gameParse.js`
  (`RANKED`, `RATED_MATCH_TEXT`, `RD_HINT`).
- 2026-10-08 (Node 26, maintenance outside the sessions): The project
  runs on Node 26 with better-sqlite3 13. From github.com/nodejs/Release
  `schedule.json`, read 2026-10-08: Node 22 is in maintenance and reaches
  end of life on 2027-04-30; Node 24 enters maintenance on 2026-10-20
  and reaches end of life on 2028-04-30; Node 26 is Current (26.11.1
  came out 2026-10-07), becomes LTS on 2026-10-28 and reaches end of
  life on 2029-04-30. better-sqlite3 13.0.3 (2026-08-05) is the first
  N-API release: one binary per platform loads on any Node from 22.14 up
  (it is built for N-API 10; on 22.13.1 opening a database segfaults),
  and the package ships prebuilds for darwin, linux and linuxmusl on
  x64 and arm64, so nothing compiles. The same darwin-arm64 binary ran
  the tests on 22.17.0, 24.6.0 and 26.11.1. The 12.0 and 13.0 release
  notes list no API removals (12.0 dropped Node 18; 13.0 added
  `db.explain()` and `statement.toString()`), and no server file
  changed. `.nvmrc` says `26`, so a bare `nvm use` picks it; the nvm
  default on the owner's Mac stays the owner's call. `@types/node` is
  26 (26.6.4, which supports the pinned TypeScript ~5.8.2) so the types
  match the runtime. Both Dockerfile stages use `node:26-alpine` and CI
  uses Node 26. Until 2026-10-28 that image is a Current release, not
  LTS, and the tag follows each 26.x. The build stage keeps python3,
  make and g++: npm's implicit `node-gyp rebuild` needs python3 and make
  even when it compiles nothing, and g++ is the fallback if no prebuild
  matches. Rejected: staying on Node 22 with `nvm use 22` (end of life
  in under seven months, and every shell on the default Node 24 fails to
  load an 11.x binary built for 22); Node 24 (maintenance from
  2026-10-20); `npm rebuild` on 11.x (11.10.0 has no Node 24 prebuild,
  and compiling fails on Node 24 and in this Mac's Command Line Tools
  linker). Rollback: revert the PR and pull the image; a Node 22 image
  reads the same database files.
- 2026-10-08 (S14): Time zone and day boundary, decided by the owner at
  the start of S14: days are counted in America/Chicago and roll over at
  06:00 there, so a night that runs past midnight stays on the evening it
  started. On the 40 local matches a session ran from 22:00 to 01:00
  Chicago time and another from 03:00 to 06:00; midnight would have split
  the first across two fight nights and two rating days. The rule is
  `FIGHT_NIGHT_DAY` in `server/lib/gameParse.js`: `fightNightDay(date)`
  names a date's day, `dayBounds(day)` gives its UTC start and end as ISO
  strings for `date >= ? AND date < ?` (the stored dates are all
  24-character UTC ISO strings, so the comparison is exact and uses
  `idx_games_date`; a day is 23 or 25 hours long on the DST days), and
  `localClock(date)` gives the fight-night day, its weekday (0 Monday)
  and the clock hour. The clock is read through `Intl.DateTimeFormat`
  once per UTC hour seen, as S13's replay did, because Chicago's offset
  changes only on the hour. What moved with it: the fight-night match
  list (`getGamesForDate`), the qualifying-day scan, the detector (below),
  the rating's snapshot day and the rankings' today (`ratingDay` and
  `RATING.timeZone` are gone; `ratingSnapshots` calls `fightNightDay`),
  the activity timeline and the admin calendar (`getGameCountsByDate`
  now counts fight-night days in JS from the dates on `idx_games_date`;
  SQL's `date()` counted UTC days), the pilot share description's last
  match, the pilot page's Last Active (it showed the viewer's local date)
  and the rankings' Last match tooltip. `utcDayBounds` is gone; the S3
  test for the day's edges now checks 06:00. What did not move: the
  backup folder names stay the calendar day of the 03:00 run (they name
  when the copy was made, not a day of matches); `utcMonthBounds` (the
  archive's month filter), the monthly counts and the server activity's
  last 24 hours stay UTC, and `/api/stats/global`'s `activity` stays UTC
  weekday and hour (nothing reads it now; flagged). On the first start
  over the S13 data the refresh moved 4 rating days and rewrote 11 rows.
  Rejected: midnight (splits a night), and the viewer's own time zone
  for the heatmap, which the plan page suggested (the owner chose one
  zone for every day count).
- 2026-10-08 (S14): The fight-night detector ran in the 03:00 job and
  checked the two UTC days before now. With a 06:00 rollover, 03:00 is
  still inside the night it should judge, so the detector now has its own
  timer: 15 minutes after each fight-night day ends (06:15 Chicago time,
  worked out from `dayBounds`, not the process TZ), checking the two days
  before today's. The 15 minutes let the tracker sync store the night's
  last matches. The 03:00 job keeps the backup and the cold move. The
  timer is set by day (the next run is the next day's 06:15), so a timer
  that fires a little early by the wall clock cannot run the same day
  twice.
- 2026-10-08 (S14): Saved recaps and the new day. A recap is keyed by its
  date, and before S14 that date was a UTC day, which takes in the evening
  before (from 18:00 or 19:00 Chicago time) and leaves out the evening
  itself. Kept as they were, the same night would come back under a second
  key and show twice. So the first start of S14 rebuilds them once
  (`rebuildRecapsForDayRule` in `fightNightService.js`, run from
  `initializeFightNights`, one run at a time): from the first fight-night
  day wholly in hot storage (after `hotCutoff()` in `repos/games.js`) to
  yesterday, it saves a recap for every fight-night day that meets the
  thresholds (every one, not only the latest 10 the empty-table scan
  makes), one day's read at a time with requests let in between. Today's
  night may still be running, so the detector takes it. Only then does it
  delete the other recaps from that first day on, so a failure part-way
  leaves the old ones for the next start, and writes
  `fight_night_day_rule = America/Chicago from 6:00` to `admin_settings`,
  so it never runs again for this rule. Older recaps stay under their UTC
  dates: their matches are in cold storage, which `getGamesForDate` does
  not read. The old recap keyed on the first day held the night before it,
  which is not rebuilt, so that one night is dropped. Shared links to the
  rebuilt recaps' old UTC dates now name the next fight-night day: they
  404, or show that night if it qualified (flagged). On the local data the UTC recap for 2026-10-07 (19 matches, 14
  pilots) went, and no fight-night day qualified in its place: the night
  of 2026-10-06 has 18 matches but 11 pilots and 1,102 kills, and
  2026-10-07 has 14 matches. The thresholds (16 matches and 14 pilots or
  1,600 kills) were set against UTC days (flagged). Rollback: revert;
  the old code keys new recaps by UTC day again, and `DELETE FROM
  fight_night_recaps WHERE date >= '<a year ago>'` plus a restart rebuilds
  them that way.
- 2026-10-08 (S14): The heatmap. Rows are the weekday of the fight-night
  day, Monday first; columns are clock hours from 06:00, so Saturday's
  row runs on to 05:00 Sunday and a night reads as one row ("Saturday
  night, 02:00" in the busiest line and the cell titles). The window is
  the 12 whole weeks of fight-night days before today (84 days, today
  left out), so each weekday counts 12 days. A cell is the number of
  matches whose `date` (when the tracker closed the match) falls in that
  hour; reading only dates keeps the query on `idx_games_date` with no
  details parsed, and a match is about 15 minutes, so the close hour is
  close to the playing hour. Counts, not a weekly average: the same
  order with one less division to explain. Colour: a sequential ramp in
  `chart.ramp`, the dataviz reference palette's blue steps 600 to 200
  (`#184f95`, `#256abf`, `#3987e5`, `#6da7ec`, `#9ec5f4`), fewest to
  most; on the dark surface the fewest is the darkest. Its validator in
  `--ordinal --mode dark --surface "#111111"` passes: monotone lightness,
  steps at least 0.06 apart, the darkest at 2.33:1, one hue. No matches
  is `surface.raised`. `rampColor(count, max)` in `designTokens.js` picks
  the step: each covers a fifth of the way to the largest count shown.
  The heatmap is an HTML table (a header per row and column, the count
  as screen-reader text, a title on hover) drawn with background colours,
  not Recharts, which has no heatmap form; it adds no chart chunk. The
  current hour is outlined in `chart.ink`. It sits on the dashboard under
  the Fight Night teaser. `ActivityGraph` (UTC hours labelled LOCAL, audit
  item 11) left the History tab and was deleted, and `GlobalActivityChart`
  became a lazy import inside `GameList`, so the dashboard's first visit
  loads no Recharts (S4 flag): `BarChart`, `CartesianChart` and `Area`,
  about 104 KB gzip, now load only on the History tab.
- 2026-10-08 (S14): Career series. Four monthly series on the pilot page:
  matches, win rate, Combat Ratio and Lethality. The plan page said K/D;
  Combat Ratio is the site's headline ratio since S10, with K/D under it.
  They count what the career cards count: ranked matches (`rankedMatch`),
  netKills totals, win rate as wins over matches played
  (`winRate`, now in `gameParse.js` and used by the career cards too),
  Lethality over the summed `durationOf`. A month's totals are a career
  line (`emptyLine`, `addToLine` in `gameParse.js`), which "last time out"
  uses for its night too. A match belongs to the month of
  its fight-night day (`careerMonth`). The months are built in the same
  loop of `pilotPass` that builds `pilot_stats_cache`, so a pilot's months
  add up to their career totals (tested on fixtures and on the 40 local
  matches). `careerSeries` fills every month from the first played to
  this month; a month without a match has 0 matches and null rates, and
  the lines break there. The sparklines are hand-drawn SVG (2px line in
  `chart.series`, bars for the match count, a dot on the last month
  played), with a title per month on hover and a "Career by month" table
  for the keyboard and screen readers. The number beside each line is the
  last month played.
- 2026-10-08 (S14): `pilot_months(pilot, month, matches, wins, losses,
  ties, kills, deaths, assists, seconds)`, primary key `(pilot, month)`,
  `WITHOUT ROWID`, in `tracker.db` only (derived from both files, like
  `rating_snapshots`). First build: `migrations.js` creates it empty; the
  startup check in `maintenance.js` refreshes when it (or
  `rating_snapshots`) is empty. Every refresh brings it in line the S13
  way: the worker compares its rows with the table and sends only the
  changes, and the main thread writes them in 2,000-row chunks. The S13
  code for that is now one `tableChanges` in the worker and one
  `writeChanges` in `analytics/refresh.js` for both tables. `restoreHot`
  creates it when the restored file predates S14. Rollback: revert, pull
  the old image, `DROP TABLE pilot_months;` on `tracker.db` (or leave it).
  Rejected: a JSON column in `pilot_stats_cache` (every `SELECT *` on it,
  `/ppi` included, would carry it), and computing months per request
  (win rate and Lethality need every career match's details).
- 2026-10-08 (S14): The activity calendar counts matches per fight-night
  day, every stored match with the pilot in it (the match list's rule,
  not only ranked ones; the calendar answers "when did they play"), over
  53 weeks from the Monday 52 weeks before this week up to today. It is
  read per request from the pilot's own `game_players` rows on the
  covering `idx_game_players_name_date`, both files. Same ramp, scaled to
  the pilot's busiest day. SVG with 11px days and 2px gaps; below the
  year's width it scrolls and opens on the latest week. A summary line
  says how many matches on how many days and the busiest day.
- 2026-10-08 (S14): "Last time out" is the pilot's latest fight-night day
  with a match (`lastOuting`): every match they played that day, ranked
  or not, with wins, losses and ties from `outcomeOf`, kills (netKills),
  deaths and the night's Combat Ratio. The rating change is the
  snapshot at the end of that day minus the one before it (1500 for a
  first rated day), and none when no match that day was rated
  (`nightRatingChange`). It links
  the night's recap when one is saved for that day and lists the five
  newest matches as links. "Today", "yesterday" and "N days ago" count
  fight-night days.
- 2026-10-08 (S14): Endpoints. `GET /api/stats/heatmap` (in
  `server/routes/stats.js`) answers `{ since, until, total, cells }`,
  `cells` 7 rows of 24 counts; the zone, the start hour and the weeks are
  `FIGHT_NIGHT_DAY` and `HEATMAP` in `gameParse.js`, which the page
  imports. `GET /api/pilot/:name/career` (in `server/routes/pilots.js`)
  answers `{ months, calendar: { since, until, days }, lastOut }`, `until`
  being today's fight-night day; an unknown pilot gets empty months and
  days and a null `lastOut`, not a 404. Both, and the activity timeline,
  go through the route cache for 300 s like the pilot page's other
  routes: the timeline and the day counts now bucket a year of dates in
  JS, and the career parses one night's blobs. A refresh can therefore
  take up to 5 minutes to show in the career arc, as on the career
  cards. The calendar's dates come from the match list's query
  (`pilotGameIdsSql`) and the night's games from the telemetry's
  (`pilotGamesSql`), so the career block adds no new index path. The client reads them through `fetchActivityHeatmap` and
  `fetchPilotCareer` (null on failure) and `useLoad`; the pilot page
  loads the career beside the rating, so a mode change does not ask
  again. `dayLabel` ("Wed, Oct 7, 2026"), `monthLabel` and `monthName`
  sit beside `clock()` in `server/lib/matchResult.js`, on formatters made
  once. The words for the day rule (`FIGHT_NIGHT_DAY_TEXT`), the column
  order (`DAY_HOURS`) and `WIN_RATE_HINT` come from `gameParse.js`. The
  rating card's "Rating by day" and the career's "Career by month" are one
  `DetailsTable`. The activity timeline's day labels now
  format in UTC, so a day shows as itself in any viewer's zone.
- 2026-10-08 (S15): The owner's answers at the start of S15. The server
  stores the tracker's server browser every 60 s. Raw rows are kept 30
  days, and an hourly rollup per server is kept for good. The regional
  share counts stored matches per region per month over the whole
  history, hot and cold, not pilots online from the snapshots. The
  fight-night thresholds stay at 16 matches, plus 14 pilots or 1,600
  kills (see the S14 flag, which now carries a deploy warning). Constants:
  `SNAPSHOT = { everyMs: 60000, keepDays: 30 }` in `gameParse.js`.
- 2026-10-08 (S15): Where the ticks come from. Before S15 the server only
  fetched `tracker.otl.gg/api/browser` when a page asked `/api/browser`,
  so nothing was fetched while nobody had the site open.
  `services/serverSnapshots.js` now owns that fetch and its 15 s cache
  (`fetchServerBrowser`); `/api/browser` and a 60 s timer both call it,
  so the site still asks the tracker at most once per 15 s. The timer
  starts at `listen` beside the ingest poll, takes its first tick at once,
  and stops before `db.close()` on shutdown. A fetch that fails, or an
  answer that is not a list, stores nothing, so a tracker outage or a
  down site counts against no server's uptime; those minutes are simply
  missing. A server the tracker listed in the last 30 days that an
  answer leaves out gets an offline tick (from the review: a server
  that drops off the list would otherwise keep 100% uptime). A listing
  without a name, notes or version keeps the stored ones.
  `snapshotRow` in `gameParse.js` reads one entry: online is
  the tracker's `server.online`, pilots `game.currentPlayers`, and the
  state idle (no `game`), lobby (`game.inLobby`) or match, which is what
  the server browser already calls Active, Lobby and Idle.
- 2026-10-08 (S15): The tables, in `tracker.db` beside `games`
  (`ensureServerTables` in `migrations.js`). `servers(ip, name, notes,
  version, first_seen, last_seen, last_online)` is each server's latest
  listing. `server_snapshots(at, ip, online, players, max_players,
  state)`, key `(ip, at)`, `WITHOUT ROWID`, is one row per server per
  tick, keyed by server so the page reads one server's day by key. `server_hours(ip, hour, samples, online, lobby, match, pilots,
  match_pilots, peak)`, key `(ip, hour)`, `WITHOUT ROWID`, is the ticks
  added up per server per UTC hour (`hour` = ms / 3,600,000). A tick
  writes all three in one transaction, and the raw row's key makes a
  repeated tick, or a server listed twice in one answer, count once.
  Unlike `rating_snapshots` and `pilot_months`, these are primary data:
  nothing can rebuild them, and the nightly backup carries them. First
  build: created empty at startup; the first tick fills them. A restart
  needs no repair: a tick is all or nothing, and the minutes the server
  was down are missing, as above. The 03:00 job deletes raw rows older
  than 30 days (`pruneServerSnapshots`, one key range per server in one
  transaction); the hours stay. Size at 21 servers: about 30,000 raw rows a
  day, about 0.9 million kept, and about 180,000 hourly rows a year.
  `restoreHot` creates them empty when the restored file predates S15.
  Rollback: revert, pull the old image, and `DROP TABLE servers; DROP
  TABLE server_snapshots; DROP TABLE server_hours;` on `tracker.db`, or
  leave them (nothing older reads them). Dropping them loses the record
  for good. Rejected: rolling the hours up from the raw rows in a nightly
  job (the hour would lag a day and a failed night would need a
  catch-up), and one table of raw rows kept for good (about 11 million
  rows a year, read on every page view).
- 2026-10-08 (S15): How the server page counts, in `gameParse.js`
  (`serverSummary`), over the hours of the window. Uptime is the ticks
  the tracker listed the server online over all its ticks (a server the
  list leaves out gets an offline tick for 30 days after it was last
  listed, the raw window, then none, so over 90 and 365 days an absence
  longer than that stops counting against it; the card's tooltip says
  so, review 2026-10-08). In use is the
  ticks with a match being played over the online ticks; a lobby is
  online but not in use. Pilots is the pilots per tick over the ticks
  with a match being played, so idle minutes do not drag it to zero. The
  peak is the most pilots in one tick and the latest hour it happened.
  Peak hours are the pilots per tick, all ticks counted (idle ones too,
  so the grid shows when a server is busy, not how full its matches
  are), for each weekday and clock hour, the weekday being the
  fight-night day's and the hour Chicago's, from `localClock` on each
  UTC hour. Chicago's offset changes only on the hour, so an hour of the
  rollup is one clock hour and one day; on the day DST ends both 01:00s
  land in one cell (tested). A rate with nothing to divide by is null
  and shows "–". The window is whole fight-night days before today
  (`serverWindow`, the heatmap's rule), 7, 30, 90 or 365 of them, so
  today's hours count from tomorrow; the last 24 hours come from the raw
  rows instead.
- 2026-10-08 (S15): Regions. Neither the server browser nor a stored
  match names a region, so it comes from words in the server's name and
  notes: `server/lib/serverRegions.js`, the keyword table ServerStats
  kept for its map dots, moved there with a region on each row. The map
  reads the same table. Regions, in stacking order: North America West,
  Central and East, Europe, Oceania, Asia, South America, Unknown.
  Added: `US-MN`, `MINNESOTA` and `MINNEAPOLIS` (US-MN-STEFFL is in
  today's browser). One visible change: a server the table does not
  place now gets the same small nudge as the others, so two unknown
  servers no longer sit on one dot. On the 21 servers listed on
  2026-10-08, two are Unknown ("My Overload Server", "The Silken Sad
  Uncertain Server"). A stored match takes the region from the server
  name and notes stored with it; failing that, from the latest stored
  match on the same IP that has one (so a renamed server's recent name
  wins); failing that, from the server's latest listing in `servers`;
  failing that, Unknown. On the 40 local matches
  that leaves one Unknown (114.75.24.117, "My Overload Server"); the two
  Ashburn matches without a stored server come from their IP's other
  matches. Rejected: a GeoIP lookup (a new dependency or an outside
  service for each IP, and a hosting provider's address is not where its
  players are).
- 2026-10-08 (S15): `region_months(region, month, matches)`, key
  `(region, month)`, `WITHOUT ROWID`, in `tracker.db`: derived, like
  `pilot_months`. The stats worker counts every stored match in the same
  scan (`regionPass` in `statsPasses.js`; the month is the fight-night
  day's, `careerMonth`), reads `servers` once for the listing fallback,
  and sends only the rows that changed (`tableChanges`); the main thread
  writes them with `writeChanges`. First build: created empty; the
  startup check in `maintenance.js` refreshes when it (or
  `rating_snapshots` or `pilot_months`) is empty. Every refresh brings it
  in line. `restoreHot` creates it. Rollback: revert, `DROP TABLE
  region_months;` or leave it.
- 2026-10-08 (S15): Endpoints. `GET /api/server/:ip/history?days=` (in
  `server/routes/browser.js`, beside `/api/browser`) answers the
  listing, the region, the window (`days`, `since`, `until`), the
  `serverSummary` numbers, `asOf` (when the answer was made) and
  `lastDay`, the raw ticks of the 24 hours before `asOf`, which the page
  draws against `asOf`, not the browser's clock, and `lastDayHours`, the
  same hours' rows from `server_hours` for the table under the chart. The
  window's hours all end before today's fight-night day starts, so a
  summary is kept in memory per server and window until the day turns
  (cleared by `restoreHot`); the share tags read the summary alone
  (`getServerSummary`). `days` other than 7, 30, 90 or 365 reads as 30. A server never
  stored answers the same shape with a null `firstSeen`, not a 404, so
  the page tells "never seen" from a failure (the S13 rule). It reads
  one server's hours by key (at most 8,760) and a day of ticks, so it has
  no route cache. `GET /api/stats/regions` (in `stats.js`) answers `{
  months }`, every month from the first stored match to this one, each
  with its count per region id; the client takes the order from
  `REGIONS`. No route cache, so it is never older than the table. The
  client reads them through `fetchServerHistory` and `fetchRegionShare`
  (null on failure) and `useLoad`.
- 2026-10-08 (S15): The page. `/server/:ip` is a route in `siteRoutes.js`
  (view `server`, title `Server: <name>`, the nav lights Live), with a
  share description in `pageMeta.js` ("Overloader: Dallas, TX (North
  America Central): online 100.0% of the minutes checked in the last 30 days, a match running
  50.0% of that time, 6.0 pilots in a match on average. Join at <ip>.",
  one `percent` in `matchResult.js` for the page and the tags).
  The view hands its stored name up to `App` (`onName`), which stays the
  one writer of `document.title`, so a server that has left the live list
  is not titled by its IP.
  `/live/:ip`'s share title now names the server from `servers` (the S8
  flag). The view (`components/ServerHistory.tsx`, lazy) shows the name,
  region, version, notes, `JoinIp` and a link to the live page ("Watch
  the match live" while one runs, from the shared poll); the window as
  four buttons, in the URL as `?days=` through `useQueryParam` (30 left
  out); cards for uptime, in use, pilots and the peak; the peak hours;
  and the last 24 hours. The peak hours are the dashboard heatmap's
  table, now `components/HourGrid.tsx`, which both use; a cell with no
  tick is left empty, not coloured as zero. The last 24 hours
  (`serverHistory/LastDayChart.tsx`) are hand-drawn SVG: pilots as a 2px
  `chart.series` line broken where ticks are missing, the minutes with a
  match as a band under it, a title per hour, and the hours as a table
  (`DetailsTable`, moved from `pilotDetail/` to `components/` now that
  three places use it). Loading, failure, a server never seen and a
  window with no ticks use the shared states. The server browser's rows
  and cards gain a history icon link beside the copy button; the live
  page links to the history from its header and its error view.
- 2026-10-08 (S15): The dashboard's "Matches by region" card
  (`gameList/RegionShare.tsx`) sits under the heatmap: 100% stacked
  columns per month, 10 px wide with 2 px gaps, hand-drawn SVG (the
  dashboard's first visit still loads no Recharts), a title per month
  with each region's share, a legend of the regions present, the
  latest month's shares in words above it, and a per-month table. Below
  the history's width it scrolls and opens on the latest month.
  Colours are `chart.region`, built from `chart.weapon`'s values in
  order against `REGIONS`, so neighbouring regions are the pairs the
  validator passed (`--mode dark --surface "#111111"`: worst adjacent CVD ΔE 8.4,
  normal-vision ΔE 19.3, contrast above 3:1; re-run 2026-10-08), and
  Unknown takes the weapons' grey. The "night, 02:00" wording is one
  `atClock` in `gameParse.js`, and `monthsTo` there fills the months for
  both the career arc and the region share.
- 2026-10-08 (S16): The owner's answers at the start of S16. A duel is a
  ranked, kill-scored match with exactly two pilots on different sides: a
  1v1 Anarchy match, or a Team Anarchy match with one pilot a side. A CTF
  or Monsterball 1v1 is not one, so the local 1v1 CTF (0-0, no result)
  stays out. The ladder is Glicko-2 replayed over the duels alone, listed
  from 5 duels. The weapon mix is a dumbbell per weapon family, not a
  radar: the job is one pilot against the community per item, which the
  dataviz form heuristic gives to a dumbbell, and a radar is not in its
  table (area and angle mislead, and eight axes do not read). Recorded as
  the owner's choices.
- 2026-10-08 (S16): How the weapon meta counts, in `gameParse.js`
  (`weaponKills`): a ranked match's kill-log entries worth a point by
  `killPoints`, so a kill on an opponent and nothing else (no suicide, no
  team kill, no death without an attacker; teams missing from an entry
  come from the players, as the scoreboard replay reads them), each under
  `weaponFamily` of its weapon. Matches without a log give nothing, so the
  meta covers the tracker's logged years, not every match. The map is the
  level in upper case (`mapKey` in `gameParse.js`; `map_stats_cache`
  keys by lower case and shows the first spelling, which the S16 tables do
  not need); a logged match that names no map counts in neither
  `map_weapons` nor `pilot_weapons` (review, 2026-10-09), so a pilot's
  shares and the community's come from the same matches. No day rule: the
  tables are all-time totals. The community totals are summed from
  `map_weapons` once and kept until a refresh writes it. Rejected: the
  damage log as the source (the pilot page's arsenal already splits damage
  by weapon; kills are what the plan page asked for and what the momentum
  chart draws).
- 2026-10-08 (S16): The duel rule, `duelMatch`: `killScored` (Anarchy,
  Team Anarchy or no mode), then `ratingSides` giving exactly two sides of
  one pilot each with no other named pilot in the match (a third pilot on
  no team in a team game sits out of the rating but makes the match a
  3-player one, not a duel). The ladder (`DUEL`, `duelLadder`): a pilot
  with `DUEL.listedAfter` (5) duels or more is listed, by rating then
  duels then name; below that they are provisional and sit under the
  listed ones in the same order; no activity window, since duels are rarer
  than matches (on the 40 local matches four pilots are listed and two
  provisional; with the rankings' 10 and 28 days, two). The rating is the
  S13 code on the duel subset: `duelPass` keeps each duel's sides and
  `ratingSnapshots` replays them, so a duel rating is a second history in
  its own table, never the main rating. The pair records (`pilot_duels`,
  both directions) come from the sides' scores: a higher score wins, equal
  is a tie; a duel without a date is left out of the records as
  `ratingSnapshots` leaves it out of the replay (review, 2026-10-09: it
  would have written a null `last` into a `NOT NULL` column), so the
  records add up to the duel counts. Rejected: wins and losses as the order (beating weak opponents
  would outrank splitting with strong ones), and the rankings' bar and
  window (the ladder would be empty for weeks).
- 2026-10-08 (S16): The objective boards' sources: the tracker's
  per-player fields, not the `goals[]` and `flagStats[]` logs. Monsterball
  counts `goals`, `goalAssists` and `blunders`; CTF `captures`, `returns`,
  `pickups` and `carrierKills` (`OBJECTIVE_FIELDS`, `OBJECTIVE_MODES`,
  `addToObjectives` in `gameParse.js`), over ranked matches in that mode
  (`objectiveMode`, any case or spacing), with the career line beside them
  (matches, wins, losses, ties by `outcomeOf`, so by the team score).
  Each board sorts by its headline count (goals, captures), then matches,
  then name, 50 rows. The logs were rejected as the source because the
  local CTF match stores `flagStats: []` while its players carry the
  counts, and the player fields are what the tracker's own pages show.
- 2026-10-08 (S16): The pilot × map grid (`pilot_maps`, the specialists
  section): a pilot's ranked matches per map with the record (`addToLine`
  in the same `pilotPass` loop as the months, so the matches add up to the
  career totals for matches that name a map). The grid shows the 20 pilots
  with the most ranked matches against the 12 maps played most, by
  `map_stats_cache.total_matches` (every stored match on the map;
  `pilot_maps` rows are pilot appearances, which the review caught being
  shown as matches), read in one query (`META` in `analytics/meta.js`),
  coloured by win rate (`winRate`) from 3 matches (`SPECIALIST_MIN`);
  under that the cell shows the record alone, uncoloured. Win rate rather than K/D: the plan page said a win-rate
  grid, and the pilot page's map table already shows K/D.
- 2026-10-08 (S16): The derived tables are one list, `DERIVED_TABLES` in
  `statsPasses.js` (the S14 flag): the table name and its columns with
  their types, keyed by the first two. `migrations.js` creates each from
  it (`ensureDerivedTables`, `WITHOUT ROWID`, in `tracker.db` only), the
  worker builds each one's rows and `tableChanges` for it, `writeChanges`
  in `refresh.js` applies them in 2,000-row chunks, each table on its own
  so one that fails to write does not stop the rest (review), and
  `restoreHot` creates the ones a backup lacks. A built marker in
  `admin_settings` (`derived_tables_built`, the list's names and columns)
  is cleared as a refresh starts writing and written back when it has
  written every table; the startup check (`derivedTablesBuilt`) refreshes
  while the marker differs, and `restoreHot` clears it (and recreates
  `admin_settings` for a backup from before it, after stopping and waiting
  out a refresh under way), so a new table or column (`ensureDerivedTables`
  recreates a table whose columns differ from the list), a restored backup
  or a refresh that failed to write a table or died part-way each cost one
  refresh, and a table that stays empty for good costs none. The review asked for this in place of an
  empty-table check, which six more tables would have turned into a
  refresh on every start wherever no duel, CTF or Monsterball match
  exists. The six new tables: `map_weapons(map,
  family, kills)` and `pilot_weapons(pilot, family, kills)` from
  `weaponPass`; `pilot_maps(pilot, map, name, matches, wins, losses, ties,
  kills, deaths)` and `pilot_objectives(pilot, mode, name, matches, wins,
  losses, ties, kills, deaths, assists, goals, goal_assists, blunders,
  captures, returns, pickups, carrier_kills)` from `pilotPass`;
  `duel_snapshots` (the `rating_snapshots` shape) and `pilot_duels(pilot,
  opponent, wins, losses, ties, last)` from `duelPass`. `name` is the
  pilot's latest spelling, as `pilot_stats_cache` keeps it, so the boards
  need no join. First build: created empty at startup; the first refresh
  fills them (the startup check runs one while the marker names an older
  list, so the first start of S16 on a warm database refreshes once). A
  restart needs no repair: every refresh brings each table in line.
  Rollback: revert, pull the old image, and `DROP TABLE` any of the six on
  `tracker.db`, or leave them (nothing older reads them); the marker row
  can stay. The S13 to S15 "refresh while the table is empty" checks are
  gone: `hasRatingSnapshots`, `hasPilotMonths` and `hasRegionMonths` stay
  as `db` keys (the career route reads one).
- 2026-10-08 (S16): Endpoints, none through the route cache (each reads a
  derived table a refresh keeps; `meta.js` keeps the answer until a
  refresh has finished writing, `clearDerivedCaches`): `GET /api/stats/weapons` (`{ community, kills, maps }`, the
  kills per family over every logged match and for the 25 maps with the
  most, most first); `GET /api/stats/specialists` (`{ pilots, maps,
  cells }`, `cells[i][j]` a record or null, one query for the cells);
  `GET /api/stats/duels` (`{
  day, listed, pilots }`, each pilot a duel snapshot with `rank`,
  `status`, the record and `last`, the fight-night day of their last duel;
  the ladder is kept per day until the next refresh has written every
  derived table, `clearDerivedCaches`, as the rankings are); `GET /api/stats/objectives`
  (`{ CTF, MONSTERBALL }`, each a board with `rank`); and `GET
  /api/pilot/:name/weapon-mix` (`{ pilot, kills, community,
  communityKills }`, zeros for a pilot with no logged kill, not a 404, the
  S13 rule). The client reads them through `fetchWeaponMeta`,
  `fetchSpecialists`, `fetchDuelLadder`, `fetchObjectiveBoards` and
  `fetchPilotWeaponMix` (null on failure) and `useLoad`.
- 2026-10-08 (S16): The views. `/ladders` is a route in `siteRoutes.js`
  ("Ladders", under Leaderboards in the nav, like `/rankings`), with a
  share description in `pageMeta.js` ("Duel ladder for <day>: 1. NAME
  (rating), ..." from the listed pilots, the site description while none
  is listed). The board is `?board=duels|ctf|monsterball` through
  `useQueryParam` (duels left out; anything else reads as duels). The
  view (`components/Ladders.tsx`, lazy) holds the board buttons; the duel
  ladder (`ladders/DuelLadder.tsx`: rank, pilot, duel rating, RD, W-L-T,
  duels, last duel, RD and last duel hidden below 640 px, a divider row
  before the provisional pilots) and the objective boards
  (`ladders/ObjectiveBoard.tsx`: rank, pilot, the mode's counts with the
  sort field in brand, matches, W-L-T) each load their own answer with
  the shared states. The leaderboard's tab bar links to it beside Power
  rankings. The maps page gets two sections under its KPI row
  (`mapLibrary/WeaponMeta.tsx`, `mapLibrary/SpecialistGrid.tsx`), both on
  a new `components/HeatTable.tsx`: a rows × columns table coloured by
  `chart.ramp` with each step a fifth of the way to the largest share
  shown (the hour grids' rule), a header per row and column, the row
  labels pinned while the table scrolls, each cell's words as its title
  and as screen-reader text, with a `DetailsTable` behind each. The pilot
  page gets the weapon mix (`pilotDetail/WeaponMix.tsx`) under the
  arsenal section, loaded beside the rating and the career so a mode
  change does not ask again; it is all-time and all modes, like the
  community it is set against.
- 2026-10-08 (S16): The dumbbell's colours. The form heuristic says one
  hue in two shades, but two blues cannot both sit in the validator's
  lightness band 15 ΔE apart (`#3987e5` with `#256abf`: normal-vision ΔE
  9.5; with `#6da7ec`: out of the band), so the chart uses the dataviz
  emphasis form instead: the pilot's dot in `chart.series` and the
  community's in `chart.label`, the palette's de-emphasis grey that
  already stands for Other and Unknown. Against `surface-card` the pair
  passes the lightness band, CVD separation (ΔE 15.9), the normal-vision
  floor (17.0) and 3:1 contrast; the grey fails the chroma floor by
  design ("reads gray" is the point of a de-emphasis grey). The legend
  and the row text name both sides, so colour is never the only cue. The
  axis runs to the next tenth above the largest share. Hand-drawn HTML
  (positioned dots on a track), so the pilot page loads no new chart
  chunk.
- 2026-10-09 (S17): The owner's answers at the start of S17, all six as
  recommended. The rivalry network is not a force graph: the dataviz form
  table has no node-link form, a hairball hides the values it is meant to
  show, and the repo has no layout library (and gets none), so it would be
  a layout written by hand for a worse read. It is a killer × victim heat
  table on `HeatTable` plus a ranked list of pairs. The damage flow is not a
  chord diagram, for the same reasons (arc angle misleads, ribbons stop
  reading past about seven pilots): it is a dealer × target heat table on
  the match page and in the network view (`?by=damage`), plus each pilot's
  top opponents with the damage each way. A late kill comes in the last
  60 s of the match. Trailing means another side held more points just
  before the kill, a level score not counting (in FFA a pilot is a side, in
  team games a team); "behind the eventual winner" was rejected because it
  reads hindsight into the moment and makes the winner's own kills never
  trailing. Every edge, flow and clutch number counts only ranked matches
  (`rankedMatch`) with a log, and only what happens between opponents.
  Recorded as the owner's choices.
- 2026-10-09 (S17): How each number counts, in `gameParse.js`. Kill edges
  are `weaponKills`' entries, which now carry the defender: a ranked
  match's kill-log entries worth a point by `killPoints`, so no suicide, no
  team kill and no death without an attacker, teams filled from the
  players (one rule for the weapon meta and the edges). A kill whose
  defender is blank counts for the weapon meta and the clutch counts (it
  is worth a point) but has no pair to go to, so a pilot's kills on the
  rivals card can be lower than on the clutch tile by those entries. Who
  met whom is `opponentsOf`: every pair of named pilots on different sides
  of a ranked match with a kill or a damage log (review: with a kill log
  alone, a match logging only damage gave a pair damage and no match),
  each pilot once, a team-game pilot without a team sitting out (the
  `ratingSides` rule). A pilot named only in a log meets nobody, so their
  kills and damage come without matches. Two pilots listed on the same
  team are teammates only when neither is in `teamChanges` (review: the
  tracker lists a pilot who changed team under one team, so a switcher's
  kills on a former opponent landed with no match and their damage was
  dropped; game 78780). Damage flows are `damageFlows`:
  a ranked match's damage-log entries with an attacker on another pilot,
  so no self-damage (the `playerRows` rule), and in a team game none
  between two such teammates (the log names no teams; a
  pilot no listing places counts as an opponent, as `killPoints` reads a
  kill on him). Clutch is `clutchOf`, on ranked matches that are
  `killScored` (Anarchy, Team Anarchy, no mode) and have a kill log, since
  trailing reads the score: first blood is `firstBloodOf`'s attacker, each
  kill on an opponent is late when its time is at least
  the match length capped at `settings.timeLimit` (or the last kill when
  that is later) less `CLUTCH.lateSeconds` (review: start to end runs 7 to
  15 s past the time limit on real matches, so the window held about 49 s
  of play), and trailing when the killer's side,
  before the kill, had fewer points than the best other side. It walks the
  log through `replayLog`'s visitor, so the score is the scrubber's.
  `replayLog` now skips a log entry that is not an object (review: the
  worker replays every stored log, and one `null` entry would have thrown
  and stopped both S17 tables on every refresh). On the
  local data a six-pilot FFA (78760) has 111 of its 148 kills made while
  trailing: in FFA everyone but the leader trails, which is why the counts
  keep FFA and team games apart and the page says so. No day rule: the
  tables are all-time totals.
- 2026-10-09 (S17): `pilot_rivals(pilot, opponent, name, opponent_name,
  matches, kills, deaths, damage_dealt, damage_taken)` and
  `pilot_clutch(pilot, kind, name, matches, first_bloods, kills,
  late_kills, trailing_kills)` join `DERIVED_TABLES`, built by one
  `rivalPass` in the worker's scan. `pilot_rivals` holds both directions of
  every pair, like `pilot_duels`, so a pilot's opponents are one key range
  and the mirrored row is the check (`kills` one way is `deaths` the
  other); `matches` counts ranked matches with a kill or damage log the
  two played as opponents, damage is rounded to whole points per pair. `pilot_clutch` is
  keyed by pilot and `kind` (`ffa` or `team`), which gives the list's
  two-column key a meaning; `matches` there is every named pilot of a
  clutch match. `name` and `opponent_name` are the latest spellings (the
  logged match with the latest date; `pilot_stats_cache` keeps the latest
  over every match, so a rename in log-less matches shows only there), a
  pilot named only in a log keeping the log's until a listing has one. First build: `ensureDerivedTables`
  creates both empty at startup and the new list changes the built marker,
  so the first start of S17 refreshes once (seen locally: "The derived
  tables have not all been built", then "[Rivals] 60 rival pairs: 60
  written" and "[Clutch] 19 clutch rows: 19 written"). A restart needs no
  repair; every refresh brings both in line through `tableChanges` and
  `writeChanges`. `restoreHot` creates them for a backup that lacks them.
  Rollback: revert, pull the old image, and `DROP TABLE pilot_rivals; DROP
  TABLE pilot_clutch;` on `tracker.db`, or leave them (nothing older reads
  them; the S16 code's marker check will refresh once, since the list it
  knows differs from the marker S17 wrote).
- 2026-10-09 (S17): Endpoints, no route cache (the S16 rule), reads in a
  new `server/db/analytics/rivals.js` with `db` keys `getRivalNetwork` and
  `getPilotRivalry`, kept answers through `meta.js`'s `until` (now
  exported) so `clearDerivedCaches` drops them after a refresh: `GET
  /api/stats/rivalries` (in `routes/stats.js`) answers `{ pilots, kills,
  damage, pairs, totals }`, the 12 pilots with the most logged kills on
  opponents (then damage, then key) with their totals over every
  opponent, `kills[i][j]` and `damage[i][j]` what pilot i did to pilot j
  (null on the diagonal), the 25 pairs with the most kills exchanged (each
  once, from the side with more kills, on a tie the side whose key sorts
  first), and the totals over every
  pair. `GET /api/pilot/:name/rivalry` (in `routes/pilots.js`) answers `{
  opponents, totals, clutch, community }`: the 10 opponents with the most
  kills exchanged (then damage exchanged, then key), the totals over every
  opponent, the pilot's clutch rows and everyone's per kind; a pilot with
  no logged ranked match gets empty lists and zeros, not a 404. The client
  reads them through `fetchRivalNetwork` and `fetchPilotRivalry` (null on
  failure) and `useLoad`.
- 2026-10-09 (S17): The views. `/rivals` is a route in `siteRoutes.js`
  ("Rivalries", under Leaderboards in the nav like `/rankings` and
  `/ladders`, linked from the leaderboard's tab bar), with a share
  description in `pageMeta.js` ("Rivalries from the kill log: A 41-21 B
  (3 matches), ..." for the top three pairs, the side with more kills
  first; the site description while there are none). The count is
  `?by=kills|damage` through `useQueryParam` (kills left out; anything else
  reads as kills); it switches the grid only. The view
  (`components/Rivals.tsx`, lazy, with `rivals/RivalGrid.tsx` and
  `rivals/RivalPairs.tsx`) shows the grid on
  `HeatTable`, each cell coloured by its share of the row's total over
  every opponent, so a row reads as where that pilot's kills went (a
  share of the whole table would have coloured only the top killers'
  rows), counts of 10,000 and up as "12k" with the exact number in the
  title and the `DetailsTable`, then the pairs (rank, the leader, kills
  each way, the other pilot, matches, damage each way; damage hidden below
  640 px). The match page's damage tab (`DamageMatrix.tsx`) is now the
  same `HeatTable`: dealer by target over the whole log, self-damage and
  teammates included as before, pilots grouped by team, each cell
  coloured by its share of the damage dealt to other pilots, the
  self-damage diagonal uncoloured with its number, a total column; a match
  with no damage log gets an EmptyState saying so (an empty log used to
  draw a table of dashes). The pilot page gets `pilotDetail/KillLogRivalry`
  under the rivals section: "Rivals from the kill log" (`RivalBars`, a
  back-to-back bar per opponent, their kills on the pilot left in
  `chart.label` and the pilot's on them right in `chart.series`, the S16
  emphasis pair the validator passed, on one scale, numbers beside each
  bar and a screen-reader sentence per row, so no `DetailsTable`) and
  "Clutch" (`ClutchProfile`, three tiles: first-blood rate over matches,
  the share of kills in the last 60 s and the share while trailing, each
  with its counts and everyone's share, and a `DetailsTable` by kind). It
  loads beside the rating, career and weapon mix, so a mode change does
  not ask again. `HeatTable` is now a shared chunk (the maps page, the
  match page and `/rivals`).
- 2026-10-09 (S18): The owner's answers at the start of S18, each the
  recommended option. The evening is on when the server browser shows 6
  or more pilots across servers (the plan's rule and its "six pilots on a
  Saturday"). The ping fires at most once per fight-night day. Only a
  recap the detector saves posts. The embed carries the night's totals
  and lines, the top pilots, a link to the night and the power-rankings
  movement. The URL lives in the environment, and the admin page only
  switches posting on and off. A failed post is retried once, then logged
  and dropped, and counts as sent only on success. Links use `SITE_URL`.
  The admin page gets a test-post button. Rejected: the first ranked match
  of the day (fires on any quiet weeknight 1v1), matches or pilots within
  an hour (lags a match length behind the browser), the S14 thresholds
  partway (usually hours in, close to the recap), a second ping after a
  long gap.
- 2026-10-09 (S18): Where the webhook URL lives and who reads it. Only
  `DISCORD_WEBHOOK_URL` in the server's environment holds it
  (`.env.example`, both compose files pass it through, empty by default).
  Nothing writes it to the database, so neither the nightly backup nor the
  admin backup download carries it. The admin status shows the URL's
  origin and its last four characters (`https://discord.com/…abcd`), or
  says it is not a valid http(s) URL. No log line, error or answer holds
  the URL: a failed request is logged as "Discord answered 404" or "no
  answer from Discord (ECONNREFUSED)", from the status or the error's code
  and never from `error.message`, because fetch quotes a URL it cannot
  parse there. The switch is `discord_enabled` in `admin_settings`
  (`'true'` posts), saved through the existing `POST /api/admin/settings`,
  and off until the admin turns it on, so setting the variable alone posts
  nothing. Rejected: the URL in `admin_settings` (it would travel in every
  backup), the `GEMINI_API_KEY` pattern of either one.
- 2026-10-09 (S18): `SITE_URL` (default `https://overloadfight.club`,
  trailing slashes trimmed) is the origin every link in a post starts
  with; the path comes from `urlFor`. S8 rejected a `PUBLIC_URL` setting
  for share tags because a page request carries the host. A post has no
  request, so it needs one; share tags still read the request.
- 2026-10-09 (S18): What triggers each post. The ping rides the S15
  server-browser tick: after the tick is stored, `checkPing` counts the
  pilots on the online servers in that answer (`browserPilots` in
  `gameParse.js`, through `browserRows`, lobbies included, a server
  listed twice counted by its first listing, the rule the stored tick now
  shares) and posts when the count reaches
  `FIGHT_NIGHT_PING.pilots` (6) having been below it at the tick before
  (held in memory), or when the day's ping is still pending. So an evening
  still on when the day rolls over at 06:00 does not ping again, which a
  plain once-per-day key would do (a /code-review finding); a restart
  counts the first busy tick as a new evening, and the day's row still
  stops a second ping. The recap posts from
  `checkAndGenerateRecentFightNight` only: a recap the detector has just
  saved is queued and posted, if posting is on at that moment; a queued
  recap still pending is posted again on the detector's next run (06:15,
  each start, the admin's manual check). A recap saved while posting is
  off is never queued, so switching on later does not post old nights a
  day late (kept against a /code-review finding).
  The S14 rebuild, the empty-table backfill of 10, `GET
  /api/fight-nights/:date` and a forced `generateRecapForDate` save
  recaps without posting. Neither post is awaited: the tick and the
  detector move on, and no request or ingest poll waits on Discord. No new
  timer. A shutdown calls `stopDiscord()` after the snapshot timer and
  before `db.close()`: nothing new starts, and a post that ends later
  writes nothing.
- 2026-10-09 (S18): `discord_posts(kind, key, status, tries, updated_at)`,
  primary key `(kind, key)`, in `tracker.db`, keeps a post from repeating.
  `kind` is `ping` (keyed by fight-night day) or `recap` (keyed by recap
  date); `status` is `pending` until Discord takes the post, then `sent`,
  or `dropped`. A recap rebuilt or regenerated later keeps its row, so it
  does not post again; a restart reads the rows. One post per row at a
  time in the process. A busy tick drops the pings still pending from
  before its day, and each detector run the recaps still pending from
  before its two days (`DETECTOR_DAYS`), which nothing would try again. First build: `ensureDiscordPosts` in
  `migrations.js` creates it empty at startup (`CREATE TABLE IF NOT
  EXISTS`), so the first start of S18 posts nothing old. A restart needs no
  repair. `restoreHot` reads the live rows first and writes them back over
  the backup's (recreating the table for a backup from before S18), so a
  post sent after the backup was taken does not go out again. Rollback: revert, pull the
  old image, and `DROP TABLE discord_posts;` on `tracker.db`, or leave it
  (nothing older reads it). `discord_enabled` can stay in `admin_settings`.
- 2026-10-09 (S18): Failure and rate limits. One post is one request (10 s
  timeout) and, after a 429, a 5xx or no answer, one more: a 429 waits its
  `Retry-After` header or the body's `retry_after` (capped at 60 s), the
  others 5 s. A post that still fails stays `pending` and the next tick
  (ping) or detector run (recap) tries again, up to 3 posts, so a dead
  channel costs at most 6 requests per post. Any other 4xx (a deleted
  webhook answers 404) is `dropped` at once. A message that cannot be
  built (its recap gone) counts as a failed try. An unparsable URL posts
  nothing and writes no row; the admin card says the URL is not valid. Each outcome is one
  `[Discord]` log line. Every message sets `allowed_mentions: { parse: []
  }`, so a pilot named `@everyone` pings nobody, and `plain()` escapes
  Discord's markdown in tracker text (names, maps, the recap's lines),
  masked-link brackets included. Rejected: a growing backoff (the owner's
  call), retrying a 4xx.
- 2026-10-09 (S18): The messages (`server/lib/discordMessages.js`, no
  database reads). The recap: one embed titled "Fight Night: <weekday,
  date>" linking to `/fight-night/:date`, the description "N matches, N
  pilots, N kills.", then Most kills and Most matches side by side, then
  the saved recap's seven lines as written (Headline match, Upset, Biggest
  win, Closest finish, Busiest map, New pilots, Longest streak), then the
  top 5 of the power rankings on the day after the night with their 7-day
  movement (▲3, ▼1, – or NEW). Before reading the rankings the post waits
  out a refresh under way (it may have started before the night's last
  matches were stored), then, when a stored match is newer than the
  caches (the startup check's rule), awaits `db.refreshPilotStats()`, the
  stats worker, so the night's matches count. A failed refresh posts the
  rankings as they stand. A match played before the last refresh but
  stored after it is missed by that rule, as at startup. The ping: "It's on: N pilots in the server browser." and
  an embed "Live servers" linking to the live page, with the servers that
  have pilots, most first, at most 10 ("4 of 8 pilots, TEAM ANARCHY on
  Vault" or "in the lobby"). Fields that would push an embed past
  Discord's 6,000 characters are dropped from the end; pilot names are cut
  at 64 characters. The test post is one line of text.
- 2026-10-09 (S18): Endpoints, both in `admin-routes.js` behind
  `requireAuth`. `GET /api/admin/discord` answers `{ enabled, configured,
  webhook (masked), siteUrl, pingPilots, posts }`, the 5 latest rows.
  `POST /api/admin/discord/test` sends the test post as one request (no
  retry, no row), whether or not the switch is on, so the owner can check
  the URL before turning posting on; it answers 200 `{ ok, status,
  message }`, 400 when no URL is set and 502 with "Discord answered N." or
  "no answer from Discord (CODE)." Client: `fetchAdminDiscord` and
  `sendAdminDiscordTest` on the S11 admin helper; `hooks/useAdminDiscord`
  and `components/admin/AdminDiscord` below Dashboard Config. The switch
  is a `role="switch"` button, disabled with no URL unless it is on (so it
  can always be turned off), and moves back with a line of text if the
  save fails. A Refresh button reloads the latest posts (the archive toggle still does not, S11
  flag). Loading, ErrorState with Retry and EmptyState come from
  `States.tsx`.
- 2026-10-09 (S19): The owner's answers at the start of S19, each the
  recommended option. Cards for the pilot, match, fight-night and map pages
  now; the tape's card waits for S20's page, and no route is reserved for
  it. One layout, each card showing its own page's numbers. Orbitron and
  Roboto Mono from the Fontsource packages, not font files in the repo.
  Rendered on request and kept in memory; stale when the card's numbers
  change. `og:image` on the request's origin, like `og:url`. The S18 recap
  embed carries the fight-night card. `@resvg/resvg-js`, not the WebAssembly
  build. Rejected: list-page cards (rankings, ladders, rivals, servers), a
  layout per page, a disk cache under `DATA_DIR`, rendering ahead in the
  nightly job, `SITE_URL` for `og:image`.
- 2026-10-09 (S19): What each card says (`server/lib/shareCards.js`, pure
  builders over rows the page route already reads). Pilot: matches and
  kills from `getPilotSummary` (the leaderboard's all-time row, as
  `og:description` since S8), the rating with `ratingStanding` (the rating
  card's words, moved from `RatingCard.tsx` to `matchResult.js` so the two
  share them; read through `getPilotRating`: /code-review asked for a read
  without the history, /simplify found that more code than the saving was
  worth, since the ranking it needs is already kept in memory), the career
  Combat Ratio from
  `pilot_stats_cache` (the profile's card, negative shown as 0), and the
  last match's fight-night day (left out for a date that does not parse). Match: the map, `resultLine(winnerOf)`, the mode, `clock` of
  `measuredDurationOf` (no length when only the limit is known, as in S8's
  description), `VERDICT_LABEL[verdictOf]` and the fight-night day. Fight
  night: the saved recap's date, matches, pilots, kills and most kills.
  Map: the name, its author (left out when "Unknown"), matches, kills,
  matches in the last 30 days and the top pilot as `getMapIntel` gives the
  map popup, and the image when the image route has cached it on disk (a
  card never fetches it from overloadmaps.com); a map with an all-digit
  name gets its card at `/maps/<id>`, because the server reads digits as a
  map id (S8). Each builder also writes
  the page's `og:description`, so the preview's text and image read one
  object; the pilot, match and fight-night sentences are S8's, now with
  `plural` ("1 match", which S8's "1 matches" got wrong), and the map page
  gets one for the first time ("BLIZZARD by Revival Productions: 40
  matches, 1,200 kills, top pilot WD-40."). The map card's image file is
  `mapImagePath` in `db/repos/maps.js` (a new `db` key), the rule the
  image route used inline.
- 2026-10-09 (S19): The layout (`server/lib/cardLayout.js`, a satori element
  tree, tested without rendering). 1200 × 630 on `surface.page` with a
  12 px brand bar down the left; the page's kind in brand and the site's
  name in `chart.label` across the top; the title in Orbitron 900 (88 px,
  smaller for longer titles, one line with an ellipsis); one sentence in
  Roboto Mono, up to two lines; up to four tiles on `surface.card` with a
  `line` border, each a label, a value in Orbitron 700 in brand and an
  optional note. The tokens are the site's at 2.5 times: `rounded-card`'s
  8 px is 20 px, `text-2xs`'s 10 px is 25 px for the kind and the labels.
  Values step down from 46 to 22 px with their length, because Orbitron's
  capitals are about 0.85 em wide ("BADASS" at 46 px ran out of its tile);
  past 11 characters a value wraps onto two lines, a note onto three. A map
  with a cached image shows it at 30% behind a gradient from the page
  colour.
- 2026-10-09 (S19): Rendering and the cache (`server/services/cardService.js`).
  A card is drawn the first time its URL is asked for: satori turns the tree
  into SVG with the text as paths, then resvg's `renderAsync` turns that into
  PNG on libuv's thread pool. satori and the fonts load on the first draw,
  not at startup (importing satori costs about 80 ms and 44 MB; /simplify).
  Draws go one at a time through a promise queue, and a second request for
  a card already being drawn waits for the same draw. resvg is told not to
  load system fonts: with them it spent 2.2 s on the first render on this
  Mac and 220 ms on each after; without them, 9 ms sync, 1.5 ms async. A
  draw took 19 to 25 ms for a card without an image, 75 to 90 ms with one
  (a 230 KB PNG) and 98 ms for the first card after a start, logged as
  `[Card] <path> drawn in N ms` and sent as `Server-Timing: render;dur=N`
  (0 from the cache). The PNGs are kept in memory, least recently used
  dropped first, at most 200 cards and 20 MB (`CARD_LIMITS`), keyed by
  `cardKey`: a SHA-1 of every word and number on the card, plus the map
  image's path and modified time, so a re-downloaded image makes a new
  card. That key is a change from the owner's answer, which named stamps
  (the latest match id, the recap's save time): the hash makes a card stale
  exactly when what it shows changes, where a new match id would have
  redrawn every pilot's card after every match and missed a stats refresh
  that moved a rating with no new match. A failed draw is remembered under
  the same key (200 at most), so the page leaves `og:image` out until the
  card's numbers change. Nothing is written to disk and no table is added,
  so there is no migration: a restart starts with an empty cache and the
  first request redraws. Rollback: revert.
- 2026-10-09 (S19): `GET /api/card/<page path>` (`server/routes/cards.js`,
  mounted with the other `/api` routers). The path is a page path that
  `parseRoute` reads (`/api/card/pilot/WD-40`, `/api/card/fight-night` for
  the latest night, `/api/card/maps/BLIZZARD`), so the card URL needs no
  route table of its own; only the four views with a card are looked up.
  A card cached under the request's `?v=` is sent before any database
  read (/simplify); otherwise the page's current card is drawn, whatever
  the `?v=` said. It answers `image/png` with `Cache-Control: public,
  max-age=600`, 404 for a page with no card (any other page, an unknown
  pilot, match, night or map), 503 with `Retry-After: 5` when 20 draws are
  already waiting (`CARD_LIMITS.waiting`; nothing is remembered as failed),
  so a crawler asking for thousands of cards cannot leave a preview's fetch
  behind them all (/code-review; /simplify moved the limit from the
  service to the route, so the recap's own draw always waits its turn), and
  500 when the lookup throws or the draw fails. `robots.txt` (the file and
  the fallback) gains `Allow: /api/card/` above `Disallow: /api/`, so
  crawlers that read robots fetch the image.
- 2026-10-09 (S19): The share tags. For a page with a card, `withPageMeta`
  adds `og:image` (the request's origin plus `cardUrl`), `og:image:width`
  1200, `og:image:height` 630, `og:image:alt` (the card's sentence) and
  `twitter:card` `summary_large_image`, which Discord reads to show the
  image large. No card, or a card that failed, gives none of the five and
  the page loads as before.
- 2026-10-09 (S19): The recap embed (S18) gets `image: { url }`, the
  fight-night card under `SITE_URL`, built from the saved recap alone, so
  `discordMessages.js` still reads no database; the embed's link and its
  sentence of totals are the card's `path` and `line` (/simplify). Before
  posting, `discordService.js` draws the card, so Discord's fetch finds it
  cached, and a card that fails to draw is left out of the embed rather
  than shown broken (/code-review).
- 2026-10-09 (S19): Dependencies. satori 0.33.5 (MPL-2.0, Vercel's HTML and
  CSS to SVG; pure JavaScript with WebAssembly for yoga and harfbuzz): the
  newest release more than two weeks old on 2026-10-09. 23 releases
  followed it (0.34.0 to 0.47.1), 17 of them on 2026-10-08 and 10-09. `@resvg/resvg-js` 2.6.2 (MPL-2.0,
  2024-03): a native N-API addon whose binary comes as an optional package
  per platform, so `npm ci` installs `resvg-js-darwin-arm64` here and
  `resvg-js-linux-arm64-musl` in the arm64 image with no install script and
  nothing compiled (the Command Line Tools postmortem does not bite).
  `@fontsource/orbitron` and `@fontsource/roboto-mono` 5.3.0 (OFL-1.1): the
  `.woff` files satori reads (it cannot read WOFF2); Orbitron 700 and 900
  latin, Roboto Mono 400 and 600 in latin, latin-ext, Cyrillic,
  Cyrillic-ext, Greek and Vietnamese, loaded once. satori falls back to
  another font for a glyph only across fonts with other names (found when
  /code-review showed a Cyrillic name drawn blank), so each extra Roboto
  Mono script is registered as "Roboto Mono <script>". A name in CJK or
  with emoji still draws nothing for those characters (flagged). All four are `dependencies`, kept by `npm prune
  --omit=dev`. The runtime image now copies `designTokens.js`, which
  `cardLayout.js` imports from the repo root. The image is 619 MB against
  599 MB. Rejected: `@resvg/resvg-wasm` (no native code, but on the main
  thread), a headless browser, font files committed to the repo.
- 2026-10-09 (S20): The owner's answers at the start of S20. What the tape
  compares: the head-to-head (ranked matches as opponents with W-L-T, kills
  and damage each way from the logs, the 1v1 duel record, map splits)
  beside the careers (rating and standing, ranked matches, win rate, Combat
  Ratio, Lethality), the recommended option. Over which matches: ranked
  matches, all time, with a `?mode=` switch (not the recommended
  all-modes-only; the owner picked the mode filter). The mode filters the
  head-to-head only; the career rows stay all-mode (recommended). The URL
  keeps the order given, A the red corner (recommended). An unknown pilot
  gets a not-found state, the same pilot twice a prompt with a link to the
  pilot, two pilots who never met their careers and a line saying so
  (recommended). "Frequent Adversaries" and the tape inside it go, and a
  list of the pilot's opponents linking to their tapes takes their place
  (recommended). A share card in S19's layout (recommended). Links to the
  tape from all four places offered: `/rivals`' pairs, the kill-log rivals,
  the duel ladder and the match page's damage grid. Rejected: today's six
  rows plus the head-to-head (Threat Centrality and Dominance Index rest on
  scoreboard estimates that count teammates, the S2/S13/S17 flags), a
  head-to-head without careers, a `?days=` window (per-day rows, a far
  larger table), one sorted URL per pair, a layout of the tape's own, no
  card.
- 2026-10-09 (S20): How each number counts. A bout is a game of the
  rating's: `boutsOf` takes `ratingSides`, so a bout is a ranked match with
  a result, the two pilots on different sides, a team-game pilot without a
  team sitting out and a pilot listed twice counted once; the outcome comes
  from the two sides' scores (team score in team games, in-game score in
  FFA), equal scores a tie. The logged numbers are the S17 rules with
  nothing copied: `logged` counts `opponentsOf` pairs (ranked, a kill or
  damage log), kills come from `weaponKills` (no suicide, team kill or
  death without an attacker) and damage from `damageFlows`. The two
  populations differ: a logged match without a result counts in `logged`
  and not in `matches`, and a pilot who changed team pairs by
  `opponentsOf`'s rule in the logs and by their listed team in the record.
  The page and the card say "kills in N logged matches" and not "of the
  M" (/code-review: the logged matches are not a subset of the record),
  and they equal the kill-log rivals card's numbers for the pair. The duel
  record is `pilot_duels` (S16) as it is, shown under all modes only:
  `pilot_duels` keeps no mode, so a mode's tape cannot split it
  (/code-review; the first draft showed it under Anarchy and Team Anarchy
  too). The careers are the pilot page's cards: ranked matches, record,
  win rate, Combat Ratio (negative shown as 0) and Lethality from
  `pilot_stats_cache`, the rating, RD and standing from `getPilotRating`.
  The map splits leave out matches that name no map.
- 2026-10-09 (S20): `pilot_bouts(pilot, opponent, mode, map, matches, wins,
  losses, ties, logged, kills, deaths, damage_dealt, damage_taken)` joins
  `DERIVED_TABLES`, built by `rivalPass` in the worker's one scan: the
  bouts come from every rated match, the logged columns from the same
  per-match calls that filled `pilot_rivals`, and since /simplify a pair's
  `pilot_rivals` row is its bout rows summed (a pair met in a logged match
  or traded a kill or damage), so the two tables cannot drift. Seen
  locally: the rebuilt `pilot_rivals` wrote 0 rows, the same 98. Both
  directions, like
  `pilot_rivals`, so a pilot's opponents are one key range. `mode` is
  `matchModeOf` ('' for none) and `map` `mapKey` ('' for none). Damage is
  stored unrounded (REAL) and rounded once after summing, so a pair's rows
  add up to the damage `pilot_rivals` rounds per pair (tested on the
  fixtures and on every local pair). The table is keyed by its first four
  columns: the derived-table list gained `key` (default two) and
  `derivedKey`, which the schema (`ensureDerivedTables`), the worker's
  comparison (`tableChanges`) and the delete in `writeChanges` now read.
  `ensureDerivedTables` drops a table whose key differs from the list as
  well as one whose columns do, and the built marker names every table's
  key (/code-review: a key change alone would have kept the old key).
  First build: `ensureDerivedTables` creates it empty at startup and the
  new list changes the built marker, so the first start refreshes once
  (seen locally: "[Bouts] 514 bout rows: 514 written, 0 removed"). A
  restart needs no repair; every refresh brings it in line, and
  `restoreHot` creates it for a backup that lacks it. Rollback: revert,
  pull the old image, and `DROP TABLE pilot_bouts;` on `tracker.db`, or
  leave it (nothing older reads it; the S19 code's marker check refreshes
  once). Size: 514 rows for 61 local matches; at the 75,000 matches the S13
  bench assumed, the row count is unmeasured (NOT validated).
- 2026-10-09 (S20): Endpoints in `routes/pilots.js`, reads in a new
  `server/db/analytics/tape.js` with `db` keys `getTape` and
  `getPilotOpponents`, no route cache (the S16 rule). `GET
  /api/pilot/:name/tape/:opponent?mode=` answers `{ pilots, mode, modes,
  record, logged, maps, duels }` from the first pilot's side; `mode` is
  read by `tapeMode` (a `MATCH_MODES` id in any case, anything else every
  mode). A pilot with no stored match gets `{ missing: [names] }` and one
  pilot twice `{ same: name }`, both with a 200: the first draft answered
  404 and 400, which Chrome logs as console errors on the page's own
  not-found and same-pilot states, so it follows S15's unknown server and
  S17's empty rivalry instead. A corner's name and career come from
  `pilot_stats_cache` first; only a pilot with no ranked match costs the
  totals over every match (`getPilotSummary`) (/code-review). `GET
  /api/pilot/:name/opponents` answers the nine opponents with the most
  bouts (then the summed kills exchanged, then key; /code-review found the
  first draft ordering by one row's kills), each with the record,
  `logged`, kills and deaths, and the opponents' names from
  `pilot_stats_cache` in one read prepared on first use, since the cache
  table exists only after the first refresh (/simplify). The client reads them
  through `fetchTape` and `fetchPilotOpponents` (null on failure) and
  `useLoad`.
- 2026-10-09 (S20): The URL. `/tape/:a/:b` is a `pair` row in
  `siteRoutes.js`: `parseRoute` gives `{ view: 'tape', param, other }`,
  `urlFor('tape', a, b)` writes both names encoded, a tape short of a name
  (`/tape`, `/tape/A`) opens `/rivals` (`/tape` alone through the rivals
  row's aliases, /simplify), and `pageTitle` is "A vs B". The
  order is the one given, so `/tape/B/A` is the same tape mirrored with B
  in the red corner. `?mode=` holds the switch (all modes left out), read
  by `tapeMode` on the page as on the server, so `?mode=ctf` shows what
  its preview shows (/code-review). The mode list is `MATCH_MODES` in
  `gameParse.js`, which the pilot page's filter now reads too, and the
  words "N ranked <mode> matches" and "No ranked <mode> match between them
  yet" are `rankedMatches` and `noBouts` in `matchResult.js`, shared by
  the page and the card (/simplify). The
  view is `components/Tape.tsx`, lazy, with `tape/TapeHeadToHead.tsx`,
  `tape/TapeCareer.tsx` and `tape/SplitBar.tsx`, in the pilots nav section,
  with a Back button to `/rivals`. Corners use `chart.team`'s ORANGE (red
  corner) and BLUE, the S12 pair, which the dataviz validator passes again
  on `#111111` (worst adjacent CVD ΔE 26.8). Who leads is `boutLead` in
  `matchResult.js`, shared with the card. No Recharts: the bars are divs.
- 2026-10-09 (S20): The pilot page. "Frequent Adversaries & Combat
  Rivalries" and the tape inside it are gone, with the picked rival (the S8
  flag closes: the pick is now a tape URL), the `RivalStat` type and the
  page's own `/api/pilot/:name/ppi` request, which only the old tape read
  (`PilotPerformanceCard` still makes its own). `pilotDetail/TapeOpponents`
  lists `/opponents` as links to `/tape/<pilot>/<opponent>`. The page still
  reads `/breakdown` for the map table; the endpoint still answers `rivals`
  as before, unread. `PilotDetail.tsx` went from 928 to 707 lines.
- 2026-10-09 (S20): The links. `/rivals`: each pair's kills cell opens the
  pair's tape, the side with more kills first. The kill-log rivals card: a
  "Tape" link per opponent. The duel ladder: a last column with a link, from
  the second row down, to the tape against the pilot one row above (the
  ladder has no pair of its own; one row above is the nearest challenge);
  at 390 px the column sits in the table's horizontal scroll. The match
  page's damage grid: each cell between two opponents opens their tape,
  dealer first, through `HeatTable`'s new optional `to`, a link that fills
  the cell and takes focus (/code-review: the first draft kept it out of
  the Tab order, so a keyboard could not reach the tape there); a
  teammate's cell has no link, since teammates are never a tape's
  opponents.
- 2026-10-09 (S20): The share card. `tapeCard` in `shareCards.js` builds
  the card and the page's `og:description` from one object: kind "Tale of
  the Tape" (", <mode>" with a mode), title "A vs B" under the stored
  names, the line "<who leads> in N ranked matches", tiles Record (A's
  W–L–T), Kills (A–B, only with a logged match), 1v1 duels (only with a
  duel) and Rating; for two pilots who never met (in the mode), Rating,
  Ranked matches, Combat Ratio and Win rate as A–B, a dash for what one
  lacks. The tape joined `CARD_VIEWS`. A card's `path` may now carry the
  tape's `?mode=`; `cardUrl` then adds `&v=`, and the card route passes
  its whole query to `pageCard(pathname, query)` as `withPageMeta` does
  (/simplify). An unknown pilot or
  one pilot twice gets no card and the site description. No layout change,
  so `CARD_LAYOUT` stays 2.
- 2026-10-10 (S21): The owner's answers at the start of S21, each the
  recommended option where one was offered. A belt is lineal, one per mode
  (`MATCH_MODES`: Anarchy, Team Anarchy, CTF, Monsterball), and changes
  hands only when the holder plays a rated match in that mode and loses.
  It is decided match by match, replayed over every stored match on each
  refresh. Achievements come in all four groups offered: milestones,
  kill-log feats, belts and Boss Slayer, and streaks and the anniversary.
  They count every stored match back to 2019, in three tiers. Belts and
  achievements show on the pilot page, a new `/belts` view, a belt mark
  beside the holder's name and the share cards. A belt that changes hands
  shows as NEW CHAMPION in the S18 recap embed, with no post of its own.
  A pilot sees every achievement, the unearned ones greyed with their
  progress, and nothing about belts until they hold one. Rejected: the
  power rankings' #1 or the duel ladder's #1 as the belt (it would move
  on days the holder did not play, and the ladder has few duels), a belt
  per mode and map, deciding once per fight-night day or weekly,
  achievements from the deploy on, no tiers, a Discord post per change,
  showing only what a pilot has earned.
- 2026-10-10 (S21): The belt rule, in `gameParse.js`. `beltMatch` takes a
  rated match (`ratingSides`: ranked, a result, a team-game pilot without
  a team sitting out) in a `MATCH_MODES` mode and names its champion: the
  side that won outright's top scorer (the pilot in FFA; in a team game
  the most of the mode's headline count, captures in CTF and goals in
  Monsterball from `OBJECTIVE_MODES`, then in-game score, then the first
  listed). A shared top score names none. (/code-review: the first draft
  took the most kills in every mode, which in CTF hands the belt to a
  pilot who never touched the flag.)
  `beltStep` plays one match against the holders: the first match in a
  mode with a champion crowns them; a match the holder does not play
  changes nothing; a match where no side outscored the holder's is a
  defense, so a draw at the top is one; a match another side wins
  outright ends the reign and crowns that side's champion; a match where
  others outscored the holder but shared the top changes nothing and is
  not a defense. Everyone on a side that outscored the holder's is a
  slayer (Boss Slayer). The pass plays the matches in `inDateOrder`, the
  rating's order, now one function for both, so an undated match plays no
  part in the belt. (/simplify: a `beltReigns` that only the tests called
  went; the tests run the belt through the pass that writes it.) A belt never falls vacant: a holder who stops playing keeps it.
  Rejected: vacating after the rankings' 28 days (not asked, and it would
  make the belt a second ranking), the match's MVP across both teams as a
  team game's champion.
- 2026-10-10 (S21): The achievements, `ACHIEVEMENTS` in `gameParse.js`,
  each three thresholds for Bronze, Silver and Gold, set for the NAS's
  history rather than the 76 local matches. Milestones: Century (ranked
  matches, 100/500/1,000), Body Count (kills in ranked matches,
  1,000/5,000/15,000), Winner (ranked wins, 25/100/500), Regular
  (fight-night days with a ranked match, 10/50/150). Kill log: First Blood
  (first bloods, 10/50/200), Closer (kills in the last 60 s, 25/100/500),
  Comeback (kills while trailing, 100/500/2,000), Rampage (the most kills
  on opponents in one match without dying, 5/10/15). Belts: Champion
  (belts won, 1/3/10), Defender (title defenses, 3/10/25), Boss Slayer
  (rated matches finished ahead of the reigning champion, 1/5/25).
  Streaks: Hot Streak (ranked wins in a row, 3/5/10), Duelist (1v1 duel
  wins in a row, 3/5/10), Anniversary (whole years since the first stored
  match, 1/3/5). The milestones count what the career cards count
  (`rankedMatch`, `netKills`, `outcomeOf`, every listing as `pilotPass`
  counts it, so they equal `pilot_stats_cache`); the kill-log feats are
  `clutchOf`'s, so they equal `pilot_clutch`; Rampage is a new
  `killStreaksOf` on `replayLog`, where any death (a suicide, a team kill,
  a death without an attacker) ends the victim's run; a streak ends on a
  tie or a loss and a match with no result leaves it as it was; a pilot
  listed twice runs a streak once; a duel's outcome is `sideOutcome`, the
  comparison `boutsOf` now shares. A tier is earned on the match whose
  count first passes the threshold, dated by its fight-night day; the
  anniversary's tiers on the day N years after the first match's
  fight-night day (29 February rolls to 1 March). Boss Slayer reads the
  belt holder, not the power rankings' #1: the replay already knows the
  holder at every match, and the rankings would need a ranking replayed
  per day inside the worker.
- 2026-10-10 (S21): `belt_reigns(mode, reign, pilot, name, since, game,
  defenses, until, lost_game)`, key `(mode, reign)`, and
  `pilot_achievements(pilot, achievement, name, value, tier, earned,
  game)`, key `(pilot, achievement)`, join `DERIVED_TABLES`, built by a
  new `achievementPass` (`server/lib/achievementPass.js`, its own module so
  `statsPasses.js`, 820 lines, does not grow) in the worker's one scan:
  each match is kept as its counts and replayed in date order once both
  files are read. `since` and `until` are match dates (`until` '' and
  `lost_game` 0 while a reign lasts), `earned` a fight-night day ('' below
  the first tier), `game` 0 where no match earned it (the anniversary); a
  pilot gets a row only for an achievement with a count above 0; `name`
  is the spelling of the pilot's latest ranked match, as
  `pilot_stats_cache` keeps it. The worker now takes today's fight-night
  day for the anniversary. First build: `ensureDerivedTables` creates both
  empty at startup and the new list changes the built marker, so the
  first start refreshes once (seen locally: "[Belts] 5 belt reigns: 5
  written" and "[Achievements] 249 pilot achievements: 249 written"; the
  restart after logged "Cache already warm on startup"). A restart needs
  no repair; every refresh brings both in line, and `restoreHot` creates
  them for a backup that lacks them. The anniversary moves with the day,
  so a refresh on a pilot's anniversary rewrites that row. Rollback:
  revert, pull the old image, and `DROP TABLE belt_reigns; DROP TABLE
  pilot_achievements;` on `tracker.db`, or leave them (nothing older reads
  them; the S20 code's marker check refreshes once).
- 2026-10-10 (S21): Endpoints, reads in a new `server/db/analytics/belts.js`
  with `db` keys `getBelts`, `getPilotAchievements` and `getBeltChanges`,
  no route cache (the S16 rule; `getBelts` is kept per day through
  `meta.js`'s `until` until a refresh writes). `GET /api/stats/belts` (in
  `routes/stats.js`) answers `{ day, modes, achievements }`: each mode's
  holder (the newest reign, which always lasts, its `reign` the mode's
  count) and its last 10 reigns, each with the fight-night days it started
  and ended, the days held to today, its defenses, the match that started
  and the one that ended it, and who it was taken from; and
  `achievements[id]`, the pilots who reached each tier, a higher tier
  counting toward the lower.
  `GET /api/pilot/:name/achievements` (in `routes/pilots.js`) answers `{
  belts, achievements }`: every reign the pilot held, newest first, and
  every achievement in order with its count, tier, day, match and the
  next threshold; zeros and no reigns for a pilot with none or never
  stored, a 200 (S15, S17, S20). The client reads them through
  `fetchBelts` and `fetchPilotAchievements` (null on failure) and
  `useLoad`.
- 2026-10-10 (S21): The views. `/belts` is a route in `siteRoutes.js`
  ("Belts", under Leaderboards in the nav), a share description in
  `pageMeta.js`, lazy in `App.tsx`, linked from the leaderboard's tab bar
  after Rivalries. `components/Belts.tsx` shows a card per mode (the
  champion linked, held since, days, defenses, who they took it from in
  which match, or "Vacant"), each decided mode's line of holders
  (`belts/BeltLineage.tsx`, the won day hidden below 640 px) and the
  achievements by group with each tier's threshold and pilots
  (`belts/AchievementList.tsx`). The pilot page's
  `pilotDetail/AchievementsCard.tsx` sits under the rating card, loaded
  beside the rating, career and rivalry: the reigns held (the one held now
  in brand, ended ones grey with the match that ended them), the tiers
  earned of 42, and a tile per achievement with its tier as pips and its
  name, the count against the next threshold with a bar, and the day and
  match the tier came on; unearned tiles are greyed. The belt mark
  (`components/BeltMark.tsx`, lucide's `Award`, the modes in its title and
  in screen-reader text) sits after a holder's name on `/rankings`, both
  ladder boards, the leaderboard, the tape's corners and the pilot page's
  header. `hooks/useBeltHolders.ts` is one `useSyncExternalStore` store
  for every mark: one `/api/stats/belts` request, asked again when a mark
  mounts and the answer is over 10 minutes old (/code-review: a stats
  refresh can move a belt while a tab stays open), seeded by `/belts`' own
  answer; a failed request shows no mark and the next mark asks again. No new colour: brand marks on the existing
  surfaces, so the dataviz validator had no new pair to check. No
  Recharts.
- 2026-10-10 (S21): The share cards. `beltsCard` in `shareCards.js` builds
  `/belts`' card and description from one object: kind "Belts", title
  "Champions", one tile per mode with a holder (name, days, defenses), and
  "Champions: Anarchy B2AF (since 2026-10-06, 0 defenses), ..."; no holder
  anywhere gives no card and the site description. `/belts` joined
  `CARD_VIEWS`, so `/api/card/belts` draws it. The pilot card gains a
  fifth tile: "Belt" (the mode and the day it was won) for a holder of
  one, "Belts" (how many, the modes in the note, so four fit; from the S21
  review, where the joined modes cut Monsterball) for more, else
  "Achievements" (tiers earned of 42) when any is earned, else none, and a
  holder's description ends with "Anarchy champion since Tue, Oct 6, 2026,
  0 defenses." (`championLine` in `matchResult.js`, shared with the
  page). The S19 sizes are for four tiles; with more, every tile's type
  and horizontal padding scale by four over the number of tiles, 0.8 for five
  (/simplify, in place of a second table of sizes; looked at: "COMBAT
  RATIO", "123,456" and "Team Anarchy" fit), and four tiles keep the S19
  sizes. `CARD_LAYOUT` went from 2 to 3, so every card gets a new `?v=`.
- 2026-10-10 (S21): The recap embed gains "New champion" (or "New
  champions") before the power rankings: one line per reign that started
  on the night ("Anarchy: B2AF took the belt from BEHEMOTH", or
  "Anarchy: B2AF, the first champion", `beltChange` in `matchResult.js`),
  markdown escaped, no field when nothing changed hands.
  `discordService.js` reads `getBeltChanges(date)` after the stats refresh
  the recap already waits for, so `discordMessages.js` still reads no
  database. No new post kind and no `discord_posts` change.
- 2026-10-10 (S22): The owner's answers at the start of S22, each the
  recommended option but the last. A scheduled fight night is a weekly rule
  (a weekday, a start time in Central, a length) or a one-off (a date, a
  time, a length), kept in a new table and edited on the admin page; the
  Google Calendar the iframe embedded is not a source. The `.ics` feed
  expands the next 12 weeks into one event each, in America/Chicago with a
  VTIMEZONE, and carries every saved recap as a past event linking its
  page; it lives at `/fight-nights.ics`. The dashboard card says "It's on"
  at the S18 ping's 6 pilots, "On now" inside a scheduled night, else counts
  down to the next one, lists the next three dates and links the feed, and
  sits under the live list above the S7 teaser; the iframe,
  `CalendarWidget` and `/api/calendar-url` go. Discord gets a reminder post
  an hour before each night (the owner's choice over no change, or a ping
  that names the night). Rejected: one rule in `admin_settings`, one-offs
  alone, the environment as the editor, an RRULE feed, the card at the
  bottom where the iframe sat, keeping `/api/calendar-url` answering.
- 2026-10-10 (S22): What an event is, in a new `server/lib/fightNightSchedule.js`
  (the day rules stay in `gameParse.js`, which gained `localInstant(day,
  time)`, the UTC instant of a wall-clock time on a calendar date in
  `FIGHT_NIGHT_DAY.timeZone`; `dayStart` reads it now, so the two cannot
  drift, and `matchStart(game)`, the start a match records, which
  `measuredDurationOf` and the feed's day span both read). `validateEvent`
  takes what the admin sends: `kind` weekly or once, a `weekday` 0 (Monday)
  to 6 for a rule or a calendar `date` for a one-off, `time` 'HH:MM' in
  Central, `minutes` 15 to 1,440 (180 when left out), a `title` up to 80
  characters and `notes` up to 500, trimmed; the first fault comes back as
  a sentence the admin page shows. `occurrences(events, from, to)` expands
  the rules day by day over the window's calendar dates and keeps every
  occurrence that overlaps `[from, to)`, so a night under way at `from` is
  in; each occurrence has its UTC `start` and `end`, its `date` and `time`
  on the wall clock, and its fight-night `day` (a night that starts after
  midnight belongs to the evening before, as a match would). A DST change
  moves the UTC time and never the wall clock (tested on 2026-03-07/08
  and 2026-10-31/11-01). `nextOccurrence` is the one under way or the next
  to start; `underWay` whether it has started and not ended. The limits
  are `SCHEDULE` (12 weeks, 180 minutes, 3 listed, 60 reminder minutes).
- 2026-10-10 (S22): `fight_night_events(id, kind, weekday, date, time,
  minutes, title, notes, updated_at)` in `tracker.db`, `id` an
  autoincrement, read and written by `server/db/repos/fightNightEvents.js`
  (`db` keys `listFightNightEvents`, `getFightNightEvent`,
  `saveFightNightEvent`, `deleteFightNightEvent`; the list puts weekly rules
  before one-offs). Primary data like the S15 server tables: nothing
  rebuilds it and the nightly backup carries it. First build:
  `ensureFightNightEvents` in `migrations.js` creates it empty at startup,
  and the admin fills it. A restart needs no repair. `restoreHot` creates it
  for a backup from before S22, empty, and a later backup brings its own
  rows (a restore replaces the schedule with the backup's, as it replaces
  the recaps). Rollback: revert, pull the old image, and `DROP TABLE
  fight_night_events;` on `tracker.db`, or leave it (nothing older reads
  it); the schedule is lost with the table. Rejected: a JSON string in
  `admin_settings` (no ids to edit or delete by, and every backup download
  would carry it as a setting).
- 2026-10-10 (S22): The feed, `icsFeed` in `fightNightSchedule.js`, written
  by hand (RFC 5545: CRLF line ends, lines folded at 75 octets without
  splitting a character, text escaped) rather than a dependency: it is
  one VCALENDAR (`METHOD:PUBLISH`, `X-WR-CALNAME`, `X-WR-TIMEZONE`,
  `REFRESH-INTERVAL` an hour), a VTIMEZONE for America/Chicago (the US rule
  since 2007: forward on the second Sunday of March, back on the first
  Sunday of November, at 02:00; a test checks its offsets against
  `localInstant` on the DST days, so a change of zone fails a test instead
  of drifting the feed), one VEVENT per coming occurrence (`DTSTART;TZID=`
  and `DTEND;TZID=` on the wall clock as the admin typed them, so a
  subscriber in another zone sees 8 pm Central converted; `UID`
  `fight-night-<id>-<date>@overloadfight.club`, `DTSTAMP` the event's
  `updated_at`, the notes plus a "Live servers" line as `DESCRIPTION`, the
  fight-night page as `URL`), and one per saved recap (`UID`
  `recap-<date>@`, `DTSTART` and `DTEND` in UTC from the day's first
  match's start to its last match's end, read on `idx_games_date` by a new
  `getDaySpan` in `repos/games.js`, hot then cold; `SUMMARY` "Fight Night
  recap: <day>", the totals and most kills as `DESCRIPTION`, the recap page
  as `URL`; a recap whose day has no stored match is left out). The
  occurrences are expanded, not written as RRULE, so every parser agrees
  on the dates and each night is its own event. `GET /fight-nights.ics`
  (mounted at the root by `index.js`, like `robots.txt`, so a
  `webcal://overloadfight.club/fight-nights.ics` link reads well and
  `robots.txt` does not disallow it) and `GET /api/fight-nights.ics`
  (`routes/fightNights.js`) share one handler: `text/calendar;
  charset=utf-8`, `Content-Disposition: inline; filename=`, `Cache-Control:
  public, max-age=600`, the origin from the request as `og:url` takes it.
  The feed carries the next `SCHEDULE.horizonWeeks` (12) of nights and up
  to 500 recaps. Checked with ical.js (a real parser) against the local
  server: 15 events, every scheduled one's UTC instant equal to the API's
  through the VTIMEZONE, the November change included.
- 2026-10-10 (S22): `GET /api/fight-nights/schedule` (in
  `routes/fightNights.js`, before `/fight-nights/:date`, which would read
  "schedule" as a date) answers `{ now, timeZone, feed, horizonWeeks,
  events }`: the occurrences from now to the horizon, one under way
  included, the zone's words ("Central time") and the feed's path. No
  cache: it reads one small table. The client reads it through
  `fetchFightNightSchedule` (null on failure) and `useLoad`.
- 2026-10-10 (S22): The admin endpoints, in a new
  `server/routes/adminEvents.js` that `admin-routes.js` mounts after
  `requireAuth` (so `admin-routes.js` stays under 500 lines): `GET
  /api/admin/events` (the rows), `POST /api/admin/events` (a new event, or
  the one with `id` changed; the row as stored, 400 with `validateEvent`'s
  sentence, 404 for an unknown id) and `DELETE /api/admin/events/:id` (404
  for an unknown id). The client's `adminRequest` learned DELETE;
  `fetchAdminEvents`, `saveAdminEvent` and `deleteAdminEvent` sit beside
  the other admin helpers. `components/admin/AdminFightNights.tsx` with
  `hooks/useAdminEvents.ts` sits between Dashboard Config and the Discord
  card: the stored events ("Every Saturday, 8:00 pm, 180 minutes", a
  one-off's date), Edit and Delete per row (Delete asks for a second press
  rather than a `confirm()` dialog), and one form for a new or changed
  event (repeats, weekday or date, start, length, title, notes) with the
  server's sentence shown on a refusal; the shared states for loading,
  failure and nothing scheduled.
- 2026-10-10 (S22): The dashboard's card,
  `components/gameList/FightNightSchedule.tsx`, imported by `GameList` (so
  it lands in `GameList`'s chunk; a lazy component suspending inside the
  lazy `GameList` would blank the page under the one `Suspense`, the S7
  reason the teaser is static) and rendered on the servers tab between
  the live list and `afterLive`, so the order under the live list is the
  next night, then the last one's recap (the S7 teaser), then the S14
  heatmap. One request for the schedule per mount and the shared
  server-browser poll; `now` ticks every 30 s in the browser, so the
  countdown moves without a request. The status line, in this order:
  "It's on: N pilots in the server browser." when `browserPilots` of the
  poll reaches `FIGHT_NIGHT_PING.pilots` (the S18 rule, read from
  `gameParse.js`; `itsOnLine` in `matchResult.js` is now the ping's own
  words too), with the night's title when one is under way and a "Watch
  live" link to the server with the most pilots; else "On now: <title>,
  until <end> Central time." inside an occurrence's window; else "Next
  fight night: <title>, <eventWhen>, <countdown>." The words are
  `eventWhen` ("Sat, Oct 17, 2026, 8:00 pm Central time"), `clockLabel`
  and `countdown` ("in 2 days 4 hours", "in 3 hours 12 minutes", "in 12
  minutes", "in under a minute") in `matchResult.js`, which the Discord
  reminder shares. Under it the next `SCHEDULE.listed` (3) nights (title,
  day, time), a "Subscribe in your calendar" link (`webcal://` on the
  page's host) with a Copy link button on the `https` URL (the `JoinIp`
  clipboard pattern), and the feed URL to select. Loading and failure use
  the shared compact states with Retry; with nothing scheduled and nobody
  on it renders nothing, like the teaser. No Recharts; the dashboard's
  first visit still loads no chart chunk.
- 2026-10-10 (S22): What replaced the iframe. `components/CalendarWidget.tsx`
  (the Google Calendar iframe, which the CSP's `default-src 'self'` and
  COEP `require-corp` blocked twice over, audit item) is deleted, and `GET
  /api/calendar-url` with it: a public API path removed, hence this entry.
  It answered the `CALENDAR_EMBED_URL` setting, which nothing read but the
  widget; the row stays in `admin_settings` where one exists, unread. The
  CSP is unchanged (no `frame-src`; nothing frames anything now).
- 2026-10-10 (S22): The Discord reminder, through S18's service with no new
  timer or table: a `reminder` kind in `discord_posts`, keyed
  `<start ISO> <event id>` (`reminderKey`), so the keys sort by time and
  `reminderKeysBefore(now)` (the ISO of now followed by `~`, which sorts
  after the space and every digit) names every reminder for a night that
  has started, which `dropStaleDiscordPosts` then drops, as the ping's and
  the recap's stale rows are. `checkReminders(now)` runs on every S15
  server-browser tick, in the tick's `finally`, so a tracker outage or an
  empty answer does not silence it; it posts, while the switch is on and a
  URL is set, the reminder for each occurrence starting within
  `SCHEDULE.reminderMinutes` (60, the hour inclusive) and not yet started,
  once per occurrence; a failed post stays pending and the next tick tries
  again, up to the S18 three. The message (`reminderMessage` in
  `discordMessages.js`, no database read): "Fight night in 60 minutes:
  <title>, <eventWhen>." with an embed titled by the night, linking the
  dashboard, the notes as its description, and "Starts" and "Calendar"
  (the feed under `SITE_URL`) fields; markdown escaped, no mentions. The
  admin card's caption names it and its posts list labels the kind
  "Reminder"; the test post's sentence names it. A server down for the
  whole hour before a night posts no reminder for it, and one that comes
  up inside the hour posts it then. No share card: the schedule has no
  page of its own.
- Closed, do not re-propose: one-click join via an `olmod://` protocol. The
  olmod README documents no URL handler; this is an upstream change.
- Closed, do not re-propose: league standings or brackets. otl.gg owns them.

## Flagged, not fixed

- `server/services/overloadBridge.js` duplicates the browser-side bridge with a
  hard-coded Windows path and never works on the NAS. Candidate for deletion
  after S1 locks it behind auth; decide in S11.
- `services/mockDataService.ts` (empty), `utils/audio-tool/*`,
  `utils/testPresets.ts`, four unused `apiService` exports,
  `server/debug_stats.js`, dead second attach at `db.js:962-969`. Removed in
  S6. Not done in S6: the Done-when list names `scripts/` and the root
  files only. S11 (split the giants) is the natural place.
- `cacheService.js` tries Redis on every boot and never sweeps expired keys.
  S4 left it; S6 left it too (not on its Done-when list).
- The README promises ELO; none exists. Satisfied by S13.
- (S1) `/api/import/*` (yt-dlp search, extract, stream, archive.org proxy)
  has no auth and no rate limit. The public taunt maker needs it, so locking
  it is a product decision. A per-IP limit fits S4 or S6.
- (S1) Anyone who reaches port 3000 directly, without the DSM proxy, can set
  `X-Forwarded-For` and get a fresh per-IP bucket. S1 adds a cap of 50
  failures across all clients per 15 minutes, which bounds brute force but
  lets an attacker lock the admin out for 15 minutes. Publishing port 3000
  only to the proxy host would let `trust proxy` name that host.
- (S1) `POST /api/analyze-match` is admin-only per the Done-when list, but the
  match page still shows the AI analysis button to everyone. Visitors get
  "Error: Unauthorized - Admin access required". S25 removes the route.
- (S1) The taunt tool's server-native mode (server running on the Windows PC
  with Overload) now needs an admin login first. Without one,
  `/api/overload/status` returns 401 and the page falls back to the browser
  folder picker with no hint to log in.
- (S1) `listPilots` lists every file stem, but every pilot operation rejects
  names outside `^[A-Za-z0-9 _.-]{1,32}$`. A pilot named, say, `[OFC]Kehoe`
  shows up and then cannot be opened, renamed or deleted through the site.
  Overload's own rules for pilot names were not checked.
- (S1) `login` does not call `req.session.regenerate()`, so the session ID
  survives login (session fixation). Sessions use the in-memory store, which
  leaks and resets on restart.
- (S1) `express.json({ limit: '50mb' })` applies to every route, not only the
  taunt install, and runs before the login rate limiter, so a client over the
  limit can still make the server parse a 50 MB body.
- (S1) `/api/overload/audio` guards paths with `path.normalize` and a regex
  strip rather than a resolved-prefix check. It is admin-only now.
- (S1) `/api/ppi` still runs `refreshPilotStats` inline for anyone. Fixed
  in S4.

- (S2) The `getPilotStats` suicide pass walks every kill log (2.9 s per 20k
  logged games against 0.37 s before, synthetic). No client page calls that
  path; `source=all` uses it only until `pilot_stats_cache` exists. S5's
  `game_players` table or worker is the place to fix it. Fixed in S5
  (`game_players.suicides`).
- (S2) `isPilotFirstSeenOnDate` scans hot and cold storage for every pilot
  who looks new, on every recap regeneration. Fixed in S5 (index lookup).
- (S2) The LIKE prefilter in `getPilotTelemetry`, `getPilotBreakdown` and
  `isPilotFirstSeenOnDate` misses names stored with surrounding spaces or
  differing only in non-ASCII case, which `pilotKey` would group.
  `getGamesByPilot` and `countGamesByPilot` still use an unescaped LIKE
  with a NOCASE check. Cache lookups use `name = ? COLLATE NOCASE`. S5
  replaced every LIKE with `game_players` lookups on the trimmed name; the
  non-ASCII case gap remains (see the S5 entry below).
- (S2) Fight-night Biggest Upset still treats the top fragger as the match
  winner, so in team games it can name a pilot whose team lost (audit item
  10). The kill-streak watch counts a suicide as a streak kill.
- (S2) Multi-player head-to-head in `refreshPilotStats` compares raw kills
  between every pair, teammates included (audit item 15). Only the 1v1
  case uses `pairOutcome`.
- (S2) The ranked filter (2+ players, 60 s+) applies to the cache and
  telemetry but not to `getPilotStats`, so game counts differ by endpoint.
- (S2) K/D with zero deaths still equals kills (audit item 5); the tooltip
  now says so.
- (S2) `GameDetail.tsx` and `MatchAnalysis.tsx` still compute match length
  from `start`/`end` or `timeLimit` on the client (`GameDetail` uses
  `(timeLimit || 20) / 60`). S7 shows real duration on the match page.
  Fixed in S7: both read `durationOf` from `gameParse.js`.
- (S2) Pilot pages still mix hot and cold games: telemetry and breakdown
  read cold storage only when hot has fewer than 5 matches (audit item 8).

- (S3) `saveColdGamesBatch` (archive ingest) and `updateGameDetails` (the
  `/api/game/:id` refresh) still overwrite `details` unconditionally.
  Pointing them at `upsertGameSql` changes their behaviour, so it was left.
  The owner's `44e4792` on `main` moved `saveColdGamesBatch` onto the
  upsert; `updateGameDetails` still overwrites.
- (S3) `saveGames` marks every hot game `fetched` in `game_metadata`,
  summaries included, so the table cannot say which games were hydrated.
  The cursor stops repeats within one job, but each new hydration job asks
  the tracker for every kill-less game again. If the tracker has no kill
  logs for live-era games, most of those requests are wasted.
- (S3) `/api/game/:id` saves whatever the tracker returns for a game not
  yet in the DB. If that is a game still in progress with a partial kill
  log, the finished game's summary will not replace it. The client only
  gets numeric ids from the gamelist (live games go through the IP
  branch), so this needs a hand-typed id.
- (S3) `fetchGame` returns `undefined` when the tracker answers with an
  empty body, and the hydration and id-range loops read `result.success`,
  which fails the whole job.
- (S3) A pause caught at the top of the hydration `while` loop breaks out
  without saving a `paused` state.
- (S3) `routes.js` treats a game as a summary when `events`, `kills` and
  `damageMatrix` are all empty; `db.js` looks at `kills` alone.
- (S3) `getQualifyingFightNightDates` still runs one query per candidate
  day. Each is now indexed and uses one prepared statement.
- (S3) vitest's module runner defines CommonJS `module`, so a test cannot
  catch code that uses it in an ES module. Check such code from a script
  file run by `node`.

- (S4) The dashboard's first visit still loads recharts: `GameList`
  pulls the `BarChart` chunk (336.50 KB raw / 98.25 KB gzip). The JS the
  dashboard needs is about 195 KB gzip, down from 351 KB. Lazy-loading the
  charts inside `GameList` would cut it further.
- (S4) Other polls are untouched: `Layout`'s 60 s `/api/stats/active-count`,
  each `LiveMatchCard`'s 30 s `/api/game/:ip`, and `AdminPanel`'s 2 s job
  poll all keep running while the tab is hidden.
- (S4) `refreshPilotStats` now holds one read snapshot open for the whole
  `.iterate()` pass, so WAL checkpoints cannot get past it and
  `tracker.db-wal` grows while ingest writes during a refresh. Paging by
  rowid with short `.all()` reads would bound both memory and the WAL;
  S5's worker is the natural place. Fixed in S5 (500-game pages).
- (S4) The restore only covers `tracker.db`, and the admin page still says
  to restart afterwards. Cold storage has no backup. S6 owns backups. S6
  backs up both files nightly and `DEPLOYMENT.md` documents restoring cold
  storage by hand; the admin page's restore and its restart text are
  unchanged.
- (S4) `App.tsx` now has three copies of the orange spinner markup. S9's
  `Loading` component replaces them. Fixed in S9: all three are `Loading`.
- (S4) `/api/games` pages past the stored count: the read-through sync
  stores the tracker's page N, but the response reads local page N by
  offset, so a page beyond what is stored comes back with `games: []`
  even after a sync. This was the same before S4.
- (S4) `cacheService.js` (Redis on boot, no sweep) is still open; S6.
  Still open after S6.
- (S4) `/api/import/*` still has no rate limit; S6. Still open after S6.

- (S5) Name lookups on `game_players` fold ASCII case only (NOCASE), while
  `pilotKey` lowercases all of Unicode. A pilot whose spellings differ in
  non-ASCII case is one row on the leaderboard and only one spelling on
  the pilot page. `pilot_stats_cache` lookups (`/ppi`, career numbers,
  rival stats) also do not trim, so `/api/pilot/wd-40%20/ppi` returns `{}`
  while `/stats` finds the pilot.
- (S5) `getMapStatsAllTime` still scans every blob in hot and cold storage
  when `cold_storage_stats_cache` is empty, which is until the first
  refresh after a fresh start. `game_players.map` could answer it.
- (S5) Hot-only JSON aggregates still parse every blob of the last year:
  the game search, `getActivePilotCount`, `getDeadliestMaps`,
  `getMarathonMaps`, and the global mode, map and activity charts. Each is
  cached for 5 to 10 minutes. The first three could read `game_players`.
- (S5) `/api/pilot/:name/games` with a mode filter still fetches the last
  200 games and filters in JS (audit item 16). `game_players.mode` would
  let SQL filter, but the route's mode normalisation has no SQL copy yet.
- (S5) `scripts/migrate_cold_storage.js` and any hand edit with `sqlite3`
  write `games` without `game_players`. The startup repair fixes added and
  deleted games at the next start; details changed in place stay stale
  until `user_version` is set to 0. S6 deletes the orphaned scripts.
  `migrate_cold_storage.js` is gone in S6; a hand edit is still a gap.
- (S5) `game_players.damage` excludes self-damage (the telemetry rule),
  while `pilot_stats_cache.total_damage` includes it (audit item 13).
  Nothing reads the column yet; whoever does should pick one rule.
- (S5) Until the first refresh creates `pilot_stats_cache`,
  `getPilotTelemetry` and `getPilotBreakdown` log "no such table:
  pilot_stats_cache" and return null or empty lists. Seen in the
  benchmark; it predates S5.
- (S5) Telemetry keeps its own damage-dealt loop next to
  `playerRows`, because it also splits damage by weapon. Both use the
  same rule today.
- (S5) The worker's heap adds to peak memory: RSS 378 MB at the end of a
  refresh on the 1.6 GB synthetic copy, against 304 MB for S4's
  main-thread pass. Not measured on the NAS's 2 GB.
- (S5) `insertGameHot` and `insertGameCold` in `db.js` are prepared and
  never used (dead before S5).

- (S6) The client libraries are still in `dependencies`, so the image
  carries them: `node_modules` is 206 MB in the 567 MB image, with
  `@ffmpeg` at 62 MB and `lucide-react` at 44 MB, none of which the server
  imports. Moving React, recharts, lucide, wavesurfer, idb,
  clsx, tailwind-merge and the ffmpeg packages to `devDependencies`
  would drop them from the image; the server needs only express and its
  middleware, better-sqlite3, axios, jszip, multer, ioredis and
  `@google/genai`.
- (S6) `tsc --noEmit --strict` reports 19 errors (`PilotsList` 7,
  `LiveGameDetail` 6, `GameDetail` 3, `App.tsx` 2, `apiService.ts` 1).
- (S6) `types.ts` lacks fields the UI reads: `settings.respawnTimeSeconds`
  (in the samples), live event `source`, `target`, `weapon` and `message`
  (the samples have no events), and the browser API's `game.players`.
  `LiveGameDetail` and `PilotsList` widen the types where they read them.
  Adding the fields to `types.ts` is a contract change and needs the
  owner's say-so.
- (S6) `SYNOLOGY_GUIDE.md` describes a different setup from
  `DEPLOYMENT.md` (an `overload-data` folder, a `/healthz` check on port
  5173) and `synology-update.sh` rebuilds the image on the NAS. Neither was
  touched; one deploy guide should go.
- (S6) `server/debug_stats.js` is an orphaned script outside `scripts/`.
- (S6) Nightly backups take about 20 GB on the data volume and cover a bad
  write, not a dead disk. A copy off the NAS depends on the owner's backup
  job. Cold storage changes only at the nightly move, so keeping fewer cold
  copies (or copying it weekly) would save most of the 20 GB and 2.8 GB of
  writes a night; the Done-when list asked for both files nightly.
- (S6) The image ships `server/*.test.js` (copied with `server/`). Harmless,
  a few KB.
- (S6) Node is PID 1 and does not reap orphans. When an `execFile` timeout
  kills yt-dlp, an ffmpeg it started can be left as a zombie. `init: true`
  in both compose files (or tini in the image) would reap them. npm was
  PID 1 before, with the same gap.
- (S6) The image's `version.json` hash is whatever `public/version.json`
  held when it was last committed: `.git` is not in the Docker build
  context. Passing the commit as a build argument and not tracking the
  file would fix it.
- (S6) `/simplify` suggested sharing `gamePlayers.test.js`'s `rowCount` and
  `userVersion` with `ops.test.js` through `testFixtures.js`; left as two
  small copies.


- (S7) The other two copy buttons were left alone: the server browser
  rows (`GameList.handleCopyIp`) and the dashboard's live cards
  (`LiveMatchCard.copyIp`). Neither checks `navigator.clipboard`, so
  over plain HTTP they throw a TypeError and show nothing.
  `GameList`'s button shows "Copied" even when the write is refused.
  `LiveMatchCard`'s never confirms. `JoinIp`'s logic could serve all
  three.
- (S7) The header's "ACTIVE PILOTS" pill is still the 90-day count next
  to "Live" (audit), and at 1,280 px and wider its label wraps onto two
  lines. The dashboard's Pilots Online card shows the real online count.
- (S7) MapLibrary downloads `/api/stats/cold/deep` (2 KB here, more in
  production with records and yearly counts) for one number. When
  `cold_storage_stats_cache` is empty that route waits for a full
  `refreshPilotStats()` run, as the Archive page's call already does. A
  cheap hot-plus-cold `COUNT` endpoint would do. `/api/stats/global
  ?source=all` is not that: it also runs a JSON scan over every game.
- (S7) The teaser's request waits for the first `/api/browser` poll and
  the `GameList` chunk, so the teaser appears a moment after the server
  browser and pushes Recent Bouts down when it does. The recap is
  cached for the page load, so a recap generated while the tab stays
  open shows up only after a reload.
- (S7) The BLUE/ORANGE colour ternary is now one `teamColor` helper in
  `GameDetail.tsx`. `GameList`, `MatchAnalysis` and `LiveMatchCard`
  still inline it, and two of them colour every non-BLUE team orange.
- (S7) The live page still has no team score, its `OFFLINE` branch is
  dead, and it falls back to `maxPlayers || 16` where the server
  browser uses `|| 8`. An idle server still says "Unable to Load Game",
  though it now shows the join IP there.
- (S7) A match hydrated from upstream (`/api/game/:id`) has no `server`
  field, so its page title reads "Unknown Server". Seen on 78734, 78735
  and 78758.
- (S7) ColdStorage's year pills fall back to a hard-coded list
  (`'2026'` down to `'2019'`) until `/api/stats/cold/deep` answers. Not
  in the audit's list.
- (S7) The match page's back button still says "RETURN TO DASHBOARD"
  and goes to `/history`. S8 owns back buttons. Fixed in S8: "Back",
  `history.back()` with `/history` as the fallback.

- (S8) Only the path scrolls to the top; back to a list lands at its
  top, not at the row the reader left. Moving the scroll into
  `navigate()` for pushes and leaving popstate to the browser's own
  restoration was suggested; the browser restores before the lazy view
  renders, so it needs a test of its own.
- (S8) The share tags do a database read on every page load, for people
  and crawlers alike, and the page then fetches the same data from the
  API. The pilot summary is not a covering read (`kills` is not in
  `idx_game_players_name_date`). A per-URL cache or a crawler check
  would cut it if the NAS shows a cost.
- (S8) Sort orders are not in the URL: the server browser's column sort
  and the leaderboard's. The rival picked on a pilot page is not either.
  S10 put the leaderboard's sort in the URL (`?sort=`, `?dir=`) with its
  page; the server browser's sort and the rival are still local.
- (S8) The history and archive search boxes copy `?q=` once when the
  page opens. Nothing on those pages changes `q` from elsewhere today,
  so they do not need `useQueryText`'s re-sync yet.
- (S8) `GameList` runs a search from its `[query]` effect and, for an
  empty or repeated search, from the submit handler. One effect keyed on
  a counter would read better, but the URL store updates synchronously,
  so setting the query and then the counter would likely render twice
  and search twice. Not tried; left as two entry points with a comment.
- (S8) The dashboard still fetches archive page 1 in `App` when the URL
  carries `?tab=history&q=`, and `GameList` ignores it.
- (S8) Unused props, older than S8: `Layout`'s `showColdStorage`,
  `LiveGameDetail`'s `archivedGames` (App still passes it), and
  `PilotsList`'s `archivedGames`. The audit's dead `'weapons'` view key
  went with `applyView`, and `/tools` is now only an alias of `/taunts`.
- (S8) Six copies of an m:ss formatter (`GameDetail`, `MatchTimer`,
  `ScoreChart`, `LiveGameDetail`, `LiveMatchCard`, `pageMeta.js`). One
  in `server/lib/` would serve them all.
- (S8) Table rows and cards that hold their own controls keep a click
  handler (`rowLink`) beside a real link on their main text. S10 makes
  clickable rows into buttons or links. Fixed in S10: `rowLink` is gone
  (cell links on rows, a covering link on cards).
- (S8) `npx vite dev` serves its own `index.html`, so titles show but
  the share tags exist only when the Node server serves `dist/`. A
  request for `/index.html` itself gets the static file and the generic
  title.
- (S8) The live page's share title shows the IP: the server name comes
  from the browser poll, which the page route does not read.

- (S9) Fight Night, Archive, Maps, Admin, Taunts and its editors, the
  pilot manager, OLMod and Resources still use hex classes, `rounded-lg`
  and `rounded-xl`, and arbitrary text sizes (179 `text-[Npx]` left, all
  outside the migrated pages). The mapping scripts used in S9 are
  described in the decision entry; the same rules apply.
- (S9) Chart chrome is still hex on the migrated pages: axis and grid
  greys (`#666`, `#444`, `#333`), tooltip text (`#fff`, `#ccc`), and two
  series palettes (the stock Recharts one in `MatchAnalysis` and
  `ServerStats`, Tailwind 500s in `ScoreChart`). The audit's "2 tooltip
  styles" were copies of one `contentStyle` object, now `chartTooltip`,
  plus `GlobalActivityChart`'s black one, left as it was. A chart theme in
  `designTokens.js` would cover both; S12 adds charts.
- (S9) The helmet avatar on the pilot page draws in zinc hex values
  (`#18181b`, `#27272a`, `#3f3f46`, `#52525b`, `#71717a`) and its visor
  accents in cyan, emerald, amber and purple. It is an illustration; left
  as is. The status dots (`#22c55e`, `#eab308`, `#4b5563`) and a green
  glow shadow in `GameList` are Tailwind colours written as hex.
- (S9) The live page's error view still covers an idle server ("Unable
  to load game" with the join IP), because `/api/game/<ip>` answers the
  same way for an idle server and a failure (S7 flag). It is now an
  `ErrorState`; telling the two apart needs the server to say which.
- (S9) The map popup on `/maps/:name` shows nothing while its intel
  loads, and nothing when that request fails with anything but a 404.
  `MapLibrary` still declares `loadingIntel` and never reads it (dead
  before S9).
- (S9) The admin page shows the login form while it checks the session,
  then switches to the panel; no loading state for the check.
- (S9) A live match card whose `/api/game/<ip>` keeps failing shows its
  "Scanning N active pilots" Loading for as long as the server reports
  players, as the old text did.
- (S9) `ActivityGraph` renders nothing while `/api/stats/global` loads and
  when it has no activity; it cannot tell the two apart from its props.
- (S9) The AI analysis tab shows the server's error text (for visitors,
  "Unauthorized") as if it were the analysis (S1 flag). S25 removes the
  route.
- (S9) Grey text and control colours (`text-gray-*`, `bg-gray-800` on
  buttons, `border-gray-700` on inputs) are Tailwind's cool greys next to
  neutral surfaces. The Done-when palette names only surfaces and one
  border; a text and control scale would be the next set of tokens.
- (S9) The Taunts editor's "Loading Local WebAssembly Mastering Engine"
  banner keeps its own small spinner: it sits beside controls that work
  while the engine loads.
- (S9) The dashboard at 390 px is 411 px wide and the live page 516 px
  (before and after S9; S10's mobile pass). Fixed in S10: every route
  is 390 px wide at 390 px.
- (S9) /simplify suggested, and S9 skipped as wider than the diff: one
  `useLoad` hook (loading, failure, retry, a stale-answer guard) for the
  seven views that each keep those by hand and guard stale answers three
  different ways; apiService functions, null on failure, for the
  endpoints views still `fetch` directly (pilot page, leaderboard, maps,
  archive stats, activity timeline); one `compact` value per slot, so a
  slot keeps its size from loading to empty to error; a `PageHeader` for
  App's three header blocks; one link-button style for Reset Filters
  (orange on the leaderboard, blue on the archive).
- (S9) `/history` still fetches archive page 1 twice: `App.refreshData`
  and then GameList (older than S9; App needs it only on the
  dashboard).
- (S9) The hex, dead-class and screenshot scripts lived in the session's
  scratch directory, not the repo. The Verification rows say what they
  do.

- (S10) Small text is still a 10px floor (`text-2xs`) on the migrated
  pages, and 179 `text-[Npx]` remain on the others; nobody checked size
  or contrast against a guideline. Not on S10's Done-when list (S9
  flag, re-flagged).
- (S10) Recaps saved before S10 keep the old words in their sentences
  (frags, bouts, arena) until they are regenerated.
- (S10) Hard-coded numbers S7 missed: MapLibrary's "BASE GAME (12)"
  origin button (the header counts stock maps from the list) and the
  roster search box's "Search all 4,510 pilots..." before the roster
  loads.
- (S10) The header bar at 1,280 px ends at 1,274 px, 6 px from the
  window edge. The "ACTIVE PILOTS" pill beside it is still the 90-day
  count (S7 flag).
- (S10) Before the first stats refresh fills `pilot_stats_cache`, the
  roster's Lethality column shows `—` (the fallback totals have no match
  time) and Combat Ratio comes from `combatRatio()` on the totals. The
  cache also lags new games until a refresh (WD-40: 21 games in the
  cache, 23 in telemetry, until the owner's startup check refreshed
  it); the leaderboard and the profile's career cards read the same
  cache, so they agree with each other.
- (S10) Seen once, cause not found: on the server start where the
  owner's startup check refreshed `pilot_stats_cache` (`887934e`),
  `/api/stats/pilots?source=all` answered WD-40's pre-refresh row (21
  matches, Combat Ratio 0.78) for more than nine minutes, past its
  5-minute route cache, while `/api/pilot/WD-40/ppi` and the database
  file (read with `sqlite3` and a separate better-sqlite3 connection)
  had the new row (23, 0.76). A restart with the cache already current
  answered the new row. Worth a look in S11, which splits `db.js`: a
  read held open on the hot connection would explain it.
- (S10) The roster's Active (90d) view has no Lethality: the owner's
  90-day totals (`5afcdf5`) are `game_players` sums without match time.
  Adding the summed `durationOf()` to that query would give it one.
  Until then a `?sort=kpm` in the URL sorts nothing in that view while
  the Lethality header still shows `aria-sort`.
- (S10) K/D still has several copies: `getPilotTelemetry`, the stats
  worker, the owner's 90-day rows in `db.getPilotStats`, the startup
  repair SQL in `db.js` (which also repeats Combat Ratio), and client
  fallbacks that divide by `Math.max(1, deaths)`
  without rounding. A `killDeath()` in `gameParse.js`, and
  better-sqlite3's `db.function()` for the SQL, would make one copy.
- (S10) The win-rate and suicides tooltips are written out twice
  (`PilotsList`, `PilotDetail`); `'Unknown Map'` is written 14 times
  across `fightNightService.js` and `ColdStorage.tsx`.
- (S10) The archive's own pager (server-paged, "PREVIOUS PAGE") is not
  the new `Pager`. Moving it needs `usePage` not to clamp before the
  total count loads, or a reload of `?page=3` lands on page 1.
- (S10) The `sortProps` adapter is written twice (`GameList`,
  `PilotsList`); `SortHeader` could take the key and the current sort.
- (S10) Icon-only buttons in the taunt tools, the pilot manager and the
  admin page still have no `aria-label`, and tab strips are buttons,
  not `role="tablist"`. Not on S10's Done-when list.
- (S10) The live page's dead OFFLINE branch says "This server is
  currently not hosting a match." twice in a row (older than S10).
- (S10) The owner's `MatchReplay.tsx` (pushed during S10) sits on the
  match page, which S9 migrated, but uses hex classes (`#ff6600`) and
  `text-[10px]`. Its window-level keyboard shortcuts call
  `preventDefault` on Space while the replay is open, so Space no
  longer presses a focused button or scrolls the page then. Its full-
  screen "theater" mode is a fixed overlay without `role="dialog"` or a
  focus trap; Escape collapses the replay. S10 changed only its words.

- (S11) `server/services/overloadBridge.js` (the "decide in S11" item):
  kept. It is the server-native mode the taunt tools and pilot settings
  use when the server runs on the Windows PC with Overload, and since S1
  it sits behind the admin session. Deleting it removes that mode, which
  is a product decision, not part of a split.
- (S11) Dead code from the S6 list that sat outside `db.js`: still there.
  `services/mockDataService.ts` (empty), `utils/audio-tool/*`,
  `utils/testPresets.ts`, `server/debug_stats.js` and the four unused
  `apiService` exports. The dead pieces inside `db.js` (the second
  `ATTACH`, `insertGameHot`, `insertGameCold`, `getDistinctServerIps`)
  went with the split.
- (S11) Probable cause of the S10 stale leaderboard: `warmupStatsCache()`
  in `server/index.js` stores `pilot_stats_all_all` for 600 s right after
  `listen`, before the owner's startup check (`887934e`) finishes its
  refresh, and nothing clears the key when the refresh writes. That
  matches "more than nine minutes" against the route's own 5-minute TTL.
  Read from the code; not reproduced, and not fixed (a behaviour change).
  Clearing the `pilot_stats_*` keys at the end of `refreshCaches`, or not
  warming before the first refresh, would fix it.
- (S11) `components/MatchReplay.tsx` (1,970 lines, the owner's replay) was
  not on the Done-when list and was not split. Other files still over
  500 lines: `utils/pilotSettingsBridge.ts` 1,285, `ColdStorage` 1,060,
  `PilotDetail` 905, `OverloadVault` 867, `MapLibrary` 854,
  `LoadoutManager` 746, `GameList` 711, `services/apiService.ts` 517,
  `server/index.js` 590, `overloadBridge.js`
  584, `bridge-routes.js` 574, `PilotsList` 583, `statsPasses.js` 526.
- (S11) Bugs the component splits turned up, left as they were (the
  splits kept behaviour):
  - Admin: Pause posts to `/api/admin/backfill/pause/<id>`, which matches
    no route (the server has `POST /backfill/pause`), so it 404s and only
    logs. Logout flips local state and never calls `/api/admin/logout`,
    so a reload logs back in. Any login failure, a 429 included, says
    "Invalid password". A failed save of the archive toggle leaves the
    toggle moved.
  - Pilot settings: in the key rebind dialog the capture listener turns
    a click on Cancel into a Mouse0 binding, and takes Tab as a key, so
    the dialog's focus trap never sees it. Save and Backup All do
    nothing in server-native mode (they need a browser folder) and say
    nothing. Set XP reloads the files and drops other unsaved edits. A
    server-native load that fails, or a pilot without an `.xprefsmod` or
    a `PS_XP2` entry, leaves the previous pilot's values in place, and
    Save then writes them to the new pilot. Overlapping loads are not
    cancelled, so a slow read of the pilot picked first can land last.
    The `activePilot` sync effect never fires (`selectedPilot` starts as
    `activePilot || 'Soup'`).
  - Audio editor: Ctrl+Enter uses a stale `handleExport` (it is not in
    the keydown effect's dependencies), so it can export under an old
    name or do nothing if ffmpeg finished loading after the file.
    Dragging the region measures the peak on a stale buffer (null for
    the first file, the previous file's afterwards), which skews the
    export's gain. WaveSurfer is destroyed twice on unmount, the second
    time outside a try.
  - Web import: reopening the dialog shows the last import's result
    card; a result with 0 views renders "0"; a slow import still loads
    into the editor after the dialog closed.
- (S11) `services/apiService.ts` still has the older admin helpers
  (`adminLogout`, `getAdminStats`, `getBackfillStatus`, `pauseBackfill`,
  `fetchGameManually`, `scanLocalArchive`, `getAdminSettings`,
  `downloadBackup`, `restoreBackup`, `detectGaps`, `getCalendarStats`,
  `getPublicStats`). Nothing calls them; they stay alive only through the
  `apiService` object, which `LiveGameDetail` and `LiveMatchCard` import
  for `getGame`. The six that hit the same endpoints as the new
  `AdminPanel` functions with other error handling (`adminLogin`,
  `checkAdminAuth`, `startBackfill`, `resumeBackfill`,
  `cancelBackfillJob`, `updateAdminSetting`) were deleted in the PR
  review, so each admin endpoint has one client function.
  `adminLogout` and `pauseBackfill` call the routes the flagged logout and
  Pause bugs need.

- (S12) The sample fixtures hold no kill log (the detail sample has one
  suicide), although the S12 prompt said 72102 had one. The kill-log tests
  use 72099 and 72098 with logs written by hand in `server/testFixtures.js`
  to reproduce their tracker totals; the check against real logs (78735,
  78760, 78761, 78764) ran from a scratch script on the local data. A real
  tracker match with its log as a third fixture file needs the owner's
  say-so (canonical contract).
- (S12) Team kills: none of the real logs has one, so "-1 to the attacker
  and the team" is unverified against the tracker.
- (S12) CTF and Monsterball get no momentum chart and no lead changes. The
  Monsterball sample's `goals` carry times (and `blunder`), and CTF has
  `flagStats`; replaying those would give those modes a score timeline.
- (S12) MatchReplay still draws a death with no attacker as a
  self-destruct, though it scores nothing; its revenge and spree callouts
  and its leader tie-break (earliest to reach the score) are its own; it
  formats time as mm:ss. The scrubber and the replay do not follow each
  other's clock (`initialTime`, `onTimeUpdate` unused).
  `/api/match/:id/kills` (unused by the client) still calls the weapon
  names "Suicide" and "Self-Destruct" and a missing attacker suicides, and
  the owner's `match-replay.test.js` tests copies of the rules written
  inline.
- (S12) Chart chrome elsewhere is still hex: `ServerStats`,
  `ActivityGraph`, `GlobalActivityChart`, `ServerActivitySparkline`, the
  pilot page's charts, Archive and Admin. They could read `chart` from
  `designTokens.js`. ServerStats' stock Recharts palette colours bars by
  rank.
- (S12) The momentum chart's click is pointer-only and its kill strips
  have `title` tooltips only; the keyboard path is the slider, and the
  timeline tab lists every kill. No screen reader was tried.
- (S12) The verdict thresholds are a choice (see the decision). They are
  not in the share description; S19's cards could use them.
- (S12) m:ss formatters left: `LiveMatchCard`, `LiveGameDetail`,
  `MatchTimer` and MatchReplay's padded one; `clock()` in
  `server/lib/matchResult.js` could serve them.
- (S12) `teamColor` is now `components/gameDetail/teamColor.ts`;
  `GameList`, `MatchAnalysis`'s teamwork list and `LiveMatchCard` still
  inline the ternary (S7 flag).
- (S12) The other client rules in `utils/statCalculators.ts` (streaks,
  nemesis, play styles) are copies MatchReplay partly repeats (its spree
  callout); moving them to `gameParse.js` would follow the S7 rule.
- (S12) The overview table's damage fallback (summing `game.damage` by
  exact name when a player has no `damage`) is the old GameDetail code,
  moved unchanged. It counts self-damage; `playerRows` does not. Not
  changed (a different number on the page).
- (S12) Covered from earlier flags: the S9 chart theme on the match page
  (`chart` in `designTokens.js`; other pages re-flagged above), the S8
  m:ss copies in `pageMeta.js`, `GameDetail` and `ScoreChart` (now
  `clock()`). Re-flagged unchanged: MatchReplay's hex classes and
  `text-[10px]`, its window-level Space handler and its theater overlay
  without `role="dialog"` (S10); MatchReplay not split, now 1,897 lines
  (S11); "Unknown Server" on hydrated matches (S7); the analysis tab's
  "Unauthorized" text (S1, S9; S25 removes the route).

- (S13) Earlier flags that name the rating, the leaderboard, head-to-head
  or the ranked filter, decided:
  - "The README promises ELO; none exists": covered. The site has a
    Glicko-2 rating; the README line now says so.
  - (S2) The ranked filter missing from `getPilotStats`: still open. S13
    made the filter one function (`rankedMatch`) for the career stats,
    the telemetry, the 90-day results and the rating, but the all-time
    and 90-day leaderboard totals still count every match, so game counts
    still differ by endpoint. Adding it changes the leaderboard's numbers.
  - (S2) Multi-player head-to-head (the dominance index) compares raw
    kills between every pair, teammates included: still open. The rating
    does not read it.
  - (S2) Fight-night Biggest Upset still treats the top fragger as the
    winner. The ratings now exist to call an upset by pre-match rating,
    as the roadmap page suggests; not on S13's list.
  - (S5) NOCASE folds ASCII only: still open for the leaderboard and the
    pilot page. The rating keys pilots by `pilotKey()` on both write and
    read, so it merges spellings that differ in non-ASCII case.
  - (S10) The roster's Active (90d) view has no Lethality; (S10) the
    leaderboard lags new games until a refresh; (S11) the startup
    warm-up caches the leaderboard past the first refresh: still open.
    The rankings and the rating card read no route cache, and their
    in-memory ranking is cleared when a refresh writes.
  - (S10) The win-rate and suicides tooltips are written out twice
    (`PilotsList`, `PilotDetail`): still open.
- (S13) The rating depends on how the tracker scores a mode. FFA uses the
  in-game score (`kills`) for every mode without teams, as `winnerOf`
  does, so a Race match (laps) would be rated by its kills. The local
  data has Anarchy, Team Anarchy and one CTF match; none is Race.
- (S13) The rating is never shown on the leaderboard. A Rating column on
  the roster would need the rating in `/api/stats/pilots`; S13 links the
  roster to the rankings instead.
- (S13) The snapshot day is the calendar day in America/Chicago
  (`RATING.timeZone`). A fight night that runs past midnight puts its
  last matches on the next day. S14 decides the fight-night day boundary
  in a configured time zone; the rating day should follow it.
- (S13) The pilot page now loads Recharts (91.7 KB gzip, shared with the
  match page and the dashboard) after it renders, for the rating chart.
  A hand-drawn SVG line would avoid it on a first visit to a pilot page.
- (S13) /code-review and /simplify skipped: deleting the
  `buildColdStorageStatsCache` and `buildMapStatsCache` keys of `db`,
  which nothing calls now (db.js keeps its keys; they invite the triple
  refresh back), and two worker-only memory trims in the rating pass
  (a second key map of about 35 MB and a copy of every match of about
  8 MB on the synthetic history).
- (S13) `hooks/useLoad.ts` serves the two new views only. The S9 flag
  lists seven older views that keep loading, failure and retry by hand.
- (S13) The rankings page has no way to see who dropped out of the top 25
  or below 10 matches during the week, and no ranks past 25.
- (S13) The rating card's chart is pointer-only for its tooltip; the
  "Rating by day" table is the keyboard and screen-reader path.
- (Node 26) g++ in the Dockerfile's build stage is unused: the build
  loads better-sqlite3's linuxmusl prebuild and writes no object file.
  Proposal: install python3 and make only. Both must stay, because npm's
  implicit `node-gyp rebuild` fails without python3 (configure) or make
  (build) even with nothing to compile. The cost is that a future
  better-sqlite3 without a prebuild for the platform would fail the
  build instead of compiling. better-sqlite3 13 sets `"gypfile": false`,
  which npm 11.19 and 11.20 ignore here; an npm that honours it would
  skip the step and leave python3 and make unused in the build stage too.
- (Node 26, /code-review) The S14 prompt's setup still says S13 is on
  `ofc/s13-rating` with PR #13 open, and branches on whether #13 merged.
  #13 is merged as `d7a81eb`. This PR changed only that prompt's Node
  lines, as asked. Also, while this PR is open, an S14 branch from
  `origin/main` gets better-sqlite3 11.10.0, which `nvm use 26 && npm ci`
  cannot install here; the prompt's new first setup line makes the
  session ask before starting.
- (Node 26, /code-review) The Node version is written in four places:
  `.nvmrc`, `ci.yml` and both `FROM` lines. `actions/setup-node` can read
  `node-version-file: .nvmrc`, and the Dockerfile could take one `ARG`.
- (Node 26, /code-review) `package.json` has no `engines` field.
  better-sqlite3 13 needs Node 22.14 or later (N-API 10). Its own
  `engines` says `>=22`, so on 22.0 to 22.13 npm does not even warn and
  opening a database segfaults (exit 139 on 22.13.1); below 22, npm only
  warns (EBADENGINE) and the failure comes later.
- (Node 26, /code-review) The Rollback section has no line for this PR;
  the rollback is in the Node 26 decision only.
- (Node 26) The runtime image carries better-sqlite3's prebuilds for the
  seven other platforms (about 14 MB) and the SQLite source in `deps/`
  (9.8 MB); `npm prune` keeps both. Deleting them in the build stage
  would win back most of the 32 MB the image grew.
- (Node 26) Two vitest fork workers from the `lush-sun-807e9623`
  worktree (PIDs 82600 and 84696, Node 24.6.0) were at 99% CPU after
  1 h 19 min on 2026-10-08. No run in this branch hung, on 26, 24 or 22.
  Cause not investigated. The owner may want to kill them.
- (Node 26) npm 11.19 and 11.20 warn that the install scripts of
  better-sqlite3, esbuild and fsevents are "not yet covered by
  allowScripts" and still run them. npm 12.2.0 is out; whether it runs
  them unasked was not checked.

- (S14) Earlier flags that name S14, the time zone, the day boundary,
  fight nights, the dashboard's charts or the pilot page, decided:
  - (S13) The rating's snapshot day should follow the fight-night day:
    covered. It is `fightNightDay`.
  - (S4) The dashboard's first visit loads Recharts through `GameList`:
    covered. `ActivityGraph` is gone and `GlobalActivityChart` is lazy, so
    the servers tab loads no chart chunk.
  - (S9) `ActivityGraph` renders nothing while it loads: covered (deleted;
    the heatmap has the shared states).
  - (S12) Chart chrome still hex: `ActivityGraph` is gone; the career
    block and the heatmap read `chart`. `GlobalActivityChart`,
    `ServerActivitySparkline`, the pilot page's older charts, Archive and
    Admin are still hex.
  - (S3) `getQualifyingFightNightDates` runs one query per candidate day:
    still open. The candidates now come from one index read of a year of
    dates, then one indexed day read each.
  - (S2) Fight-night Biggest Upset treats the top kills as the winner:
    still open (not a day rule).
  - (S7) The teaser waits for the first poll and the `GameList` chunk, and
    a recap made while the tab is open shows after a reload; (S7, S10) the
    header's ACTIVE PILOTS pill is the 90-day count: still open. The
    heatmap loads beside the teaser and does not wait for it.
  - (S10) Recaps saved before S10 keep the old words: covered for the
    last 365 days, which the S14 rebuild regenerates with today's words;
    older recaps keep them.
  - (S13) The pilot page loads Recharts for the rating chart: unchanged.
    The career block draws its own SVG and loads none.
- (S14) The fight-night thresholds (16 matches, and 14 pilots or 1,600
  kills) were tuned on UTC days, which ran from about 18:00 to 18:00
  Chicago time and so took one evening's end and the next one's start.
  On the local data no fight-night day qualifies any more (the best,
  2026-10-06, has 18 matches, 11 pilots, 1,102 kills), where the UTC day
  2026-10-07 did. Whether to lower them is the owner's call; the dashboard
  teaser shows nothing until a night qualifies. Asked again at the start
  of S15; the owner chose to leave them. Before the first start of the
  S14 (or later) image on the NAS, check real nights against them: that
  start rebuilds the last 365 days of recaps once under the 06:00 day and
  deletes the recap of any night that no longer passes, then writes
  `fight_night_day_rule` to `admin_settings` so the rebuild never runs
  again. Lowering the thresholds afterwards does not bring those recaps
  back until that row is deleted and the server restarted. (On the local
  data the dashboard does show a teaser for 2026-10-06: S14 forced that
  recap for its checks.)
- (S14) Recaps older than hot storage keep their UTC dates (see the recap
  decision): their matches are in cold storage.
- (S14) Links shared to a recap from before S14 inside the rebuilt year
  (`/fight-night/<UTC date>`) now ask for the next fight-night day: a 404,
  or that night's recap if it qualified. Accepted: a fallback to the day
  before cannot tell an old link from a new one for a night that did not
  qualify.
- (S14) `/api/stats/global`'s `activity` is still UTC weekday and hour,
  and its query still runs on each uncached request. Nothing in the
  client reads it since `ActivityGraph` went; the field stays because it
  is in a public API answer. Dropping it, with `getGlobalActivityStats`,
  is a small follow-up if the owner agrees.
- (S14, /simplify) Skipped: one daily scheduler for the 03:00 job and the
  detector (the 03:00 job is outside this change); building the admin
  page's monthly counts from fight-night days (`getMonthlyGameCounts` is
  still UTC, so a month's total can differ from the sum of its days); one
  list of derived tables (`rating_snapshots`, `pilot_months`) for the
  ensure, restore, startup-check and write steps, each of which names
  both today; a shared ▲▼ delta component for the rankings and the career
  block (they differ: NEW against –, whole numbers against one decimal);
  memoising the year of day counts inside `global.js` for the admin
  calendar and the qualifying scan (the route cache covers the page).
- (S14) The plan page said the heatmap would follow the viewer's clock.
  The owner chose one zone for every day count, so it is in Central time.
  A viewer elsewhere has to shift it in their head; a "your time" toggle
  could rotate the columns by the offset difference.
- (S14) Other day and month buckets still in UTC: the archive's month
  filter (`utcMonthBounds`), `getMonthlyGameCounts`, the server activity
  sparklines' hours (last 24 hours), the archive's year pills, and the
  leaderboard's Last Seen (`toLocaleDateString()` in the viewer's zone).
- (S14) The calendar counts every match with the pilot; the career arc
  and the career cards count ranked matches only (2+ pilots, 60 s+). A
  month can show more matches in the calendar than in the arc.
- (S14) `localClock` reads the zone's offset once per UTC hour. That is
  right for America/Chicago and any zone whose offset changes on the
  hour, not for one with half-hour changes (Lord Howe).
- (S14) The nightly job still runs at 03:00 by the process TZ
  (`setHours`), while the detector's 06:15 comes from `dayBounds`. In the
  container both are Chicago; on a Mac in another zone the 03:00 job
  moves.
- (S14) The local `rating_snapshots` in `/tmp/ofc-data` has an extra
  `last_played` column from an early S13 build, so `/api/stats/rankings`
  answers it there. A table made by `migrations.js` has no such column.

- (S15) Earlier flags that name servers, the server browser, the live
  page, regions or peak hours, decided:
  - (S8) The live page's share title shows the IP: covered. It names the
    server from the `servers` table once a tick has stored it.
  - (S7, S9) An idle server's live page says "Unable to load match": still
    open (the tracker answers an idle server and a failure the same way),
    but the error view now links to the server's history, which shows
    what the server has been doing.
  - (S7) The server browser's and the live cards' copy buttons skip
    `JoinIp`'s clipboard check; (S7, S10) the live page has no team score,
    a dead OFFLINE branch with its sentence twice, and `maxPlayers || 16`
    where the browser uses `|| 8`; (S8) the server browser's sort is not
    in the URL; (S4) `Layout`'s and the live cards' polls run while the
    tab is hidden: still open, none on S15's list.
  - (S12, S14) `ServerActivitySparkline` and ServerStats' mode bars are
    still hex: still open.
- (S15) The server browser's Activity sparkline (`getServerActivityStats`)
  is not "the last 24 hours". It compares the stored ISO dates
  (`2026-10-08T01:00:00.000Z`) with SQLite's `datetime('now', '-24
  hours')` (`2026-10-07 20:00:00`) as strings, and `T` sorts after a
  space, so every match on the cut-off's UTC date passes: the window
  runs from 00:00 UTC yesterday, up to 48 hours. The bars are UTC hours
  (`strftime('%H')`), so the same hour of two days adds up. Found by
  reading; S15 left it, since the server page now has the real last 24
  hours. The ticks could replace it.
- (S15) `getActiveServerIps` in `analytics/global.js` (a `db` key) has
  no caller.
- (S15) History starts at the deploy: the tracker keeps no past server
  browser, so uptime, use and peak hours fill from the first tick on.
  Until a window's whole days have passed, the page says how long the
  site has stored the server.
- (S15) The region keywords match whole words, the name before the notes
  (review fix, 2026-10-08: as substrings "Any mode welcome" read as New
  York and a notes line mentioning Germany moved a Seattle server to
  Europe; archive matches may change region on the first refresh after
  the deploy). `WASHINGTON` still sits on the Seattle row, so a
  Washington DC server would read as West. Servers whose name and notes
  name no place are Unknown. A per-IP override in `admin_settings` would
  let the owner fix one without a code change.
- (S15) What the tracker means by `online` was not checked. Today's feed
  lists two servers offline whose `lastSeen` is days old; whether a
  server that crashes stays "online" until some timeout is the tracker's
  rule.
- (S15) An empty server list from the tracker is read as an outage, like a
  failed fetch: no tick and no offline fill (review, 2026-10-08), since a
  tracker filling up again would otherwise mark every server offline for
  that minute. Whether the tracker ever answers with an empty list was
  not seen.
- (S15) The raw ticks are pruned only by the 03:00 job. If it fails
  (it runs after the backup and the cold move), the raw table grows by
  about 30,000 rows a night until a night succeeds.
- (S15) The live page's tab title still comes from the shared poll
  only, so a live page for a server that has left the browser shows its
  IP in the tab while its share title (from `servers`) names it. The
  server page hands its stored name to `App`; the live page could do the
  same.
- (S15) The server page names a server's region from its own listing
  only, while the region share also learns an IP's region from its other
  stored matches. A server named "My Overload Server" is Unknown on its
  page and can count toward a region on the dashboard. Storing the
  region the stats worker learns per IP and reading it on the page would
  make one answer.
- (S15, /simplify) Skipped: a separate request for the 24 hours so a
  window change does not fetch the 1,440 ticks again (about 60 KB a
  click; an endpoint change for little); one history-link component for
  the four links (they differ to match the copy buttons beside them);
  sharing `PilotDetail`'s `StatCard` (not exported; the server page has
  its own four-card `Card`).
- (S15) The last 24 hours chart and the region columns have `title`
  tooltips per hour and per month and a table behind a `<details>`, the
  S14 pattern; no crosshair tooltip and no screen reader was tried.

- (S16) Earlier flags that name S16, weapons, maps, duels, head-to-head,
  CTF, Monsterball or the pilot page, decided:
  - (S12) CTF and Monsterball get no momentum chart; the goals and
    `flagStats` logs carry times: still open for the timeline. S16's
    boards count the per-player fields, not the logs (the local CTF match
    stores an empty `flagStats`).
  - (S2) Multi-player head-to-head compares raw kills, teammates
    included: still open. The duel ladder reads none of it; its records
    come from two-pilot matches only.
  - (S5) `getMapStatsAllTime` scans every blob when the cache is empty;
    (S7) MapLibrary downloads `/api/stats/cold/deep` for one number;
    (S10) MapLibrary's "BASE GAME (12)" and the map popup's hex values:
    still open; S16 added two sections to the page and left its own
    fetches and classes as they were.
  - (S5) `/api/pilot/:name/games` filters a mode in JS; (S5)
    `game_players.damage` is unread; (S5) the telemetry's own damage
    loop beside `playerRows`: still open.
  - (S8) The rival picked on a pilot page is not in the URL; (S9) the
    helmet avatar's hex values; (S12) the pilot page's older charts in
    hex: still open. The weapon mix reads `chart`.
  - (S13) The rating is never shown on the leaderboard; (S13) the pilot
    page loads Recharts for the rating chart: unchanged. The weapon mix
    adds no chunk.
  - (S14) The calendar counts every match while the arc counts ranked
    ones: still open; the specialist grid and the boards count ranked
    matches, like the arc.
  - (S2) The ranked filter missing from the leaderboard totals: still
    open.
- (S16) The plan page's weapon meta also named a meta by year across the
  archive, and said "arsenal entropy" (hard-coded to 0 in
  `pilot_stats_cache`) would be replaced. Neither is in the S16 entry.
  `pilot_weapons` holds what an entropy needs (kills per family per
  pilot); a year column on `map_weapons` would give the meta by year.
  Both left for a later session.
- (S16) The plan page's "duel ladder and matrix": the matrix (each pair's
  record as a grid) is not on the page. `pilot_duels` holds every pair
  both ways, so a `/ladders?board=matrix` would be a read and a
  `HeatTable`.
- (S16) The weapon meta and the pilot's weapon mix count only matches
  with a kill log. The audit says the tracker kept logs mainly from
  2019-07 to 2022-04 and the local data has five of 43, so on the NAS the
  meta describes those years and a pilot who played after them gets "No
  logged kills" however much they played. The section's words say so;
  nothing dates the kills.
- (S16) The duel ladder's spelling is the latest one the pilot used, as
  the rankings' is (S13): on the fixtures JFTP lists as "jftp" because
  the lower-case copy has the later id. The leaderboard shows the latest
  game's spelling too, so the pages agree; it reads oddly beside the
  pilot page's URL.
- (S16) The built marker lives in `admin_settings` inside `tracker.db`.
  A backup taken after a refresh carries it; `restoreHot` clears it so the
  restored data gets one refresh. A hand edit that drops a derived table
  without touching the marker is not caught until the next 6-hour
  refresh, and the table only comes back at the next start
  (`migrations.js`).
- (S16) The map name in `map_weapons` and `pilot_maps` is the level in
  upper case; `map_stats_cache` keys by lower case and shows the first
  spelling seen. A map stored in mixed case shows in upper case on the
  grids and as stored on the map cards.
- (S16) The specialist grid lists the top 20 pilots by ranked matches and
  the top 12 maps by every stored match (`map_stats_cache`, unranked ones
  included); a pilot outside the 20 has no row and no way to ask for one.
  A pilot's own map table on their page shows their top six maps without
  a win rate.
- (S16) `HeatTable` scales its colours to the largest share in the table,
  so a win-rate grid whose best cell is 60% paints that cell as the
  ramp's last step; the cell text carries the number. A fixed 0 to 100%
  scale was rejected (on the weapon meta it left every cell in the two
  darkest steps).
- (S16) The objective boards show every pilot with a ranked match in the
  mode, 50 rows at most, with no minimum of matches; a pilot with one
  capture in one match sits above one with none in twenty.
- (S16) The headless checks ran against a server whose tracker sync
  added three matches during the session (40 to 43), so the counts in
  the Validated entry name the number at that step.

- (S17) Earlier flags that name S17, rivals, head-to-head, the dominance
  index, threat centrality, damage, first blood, clutch, the kill log, the
  pilot page or the match page, decided:
  - (S2, audit item 15) The pilot page's "Frequent Adversaries" card counts
    encounters with teammates, and its kills exchanged include team kills:
    still open. S17's "Rivals from the kill log" card sits under it and
    counts opponents only, so the page now shows two rival lists that can
    disagree (most encounters against most kills exchanged). Replacing the
    old card changes the Tale of the Tape, which S20 owns.
  - (S2, S13, S16) Multi-player head-to-head and the dominance index
    compare raw kills, teammates included: still open; the new tables read
    none of it.
  - (audit) Threat centrality's PageRank runs on edges estimated from the
    scoreboards: still open. `pilot_rivals` now holds real kill edges, but
    only for logged matches; moving the PageRank onto them changes the PPI
    of every pilot and gives a pilot without a logged match no edge at
    all. The owner's call.
  - (S5) `game_players.damage` excludes self-damage while
    `pilot_stats_cache.total_damage` includes it; (S12) the overview
    table's damage fallback counts self-damage: still open. The S17 flows
    follow `playerRows` (no self-damage) and the match grid shows it apart
    on the diagonal.
  - (S12) The fixtures hold no kill log: S17 also writes damage logs by
    hand (`teamWithDamage`, `ffaWithDamage` in `server/testFixtures.js`).
    A real tracker match with both logs as a third fixture file still
    needs the owner's say-so.
  - (S16) The weapon meta counts only logged matches: the same holds for
    every S17 number, and the pages say so.
  - (S8) The rival picked on a pilot page is not in the URL: still open.
  - (S1) `/api/overload/status` answers 401 without an admin session, and
    Chrome logs it on every page as a failed resource: still seen in the
    S17 checks, which filter it.
- (S17) Not built, from the plan page's clutch and rivalry items and
  outside the S17 entry: the time-to-first-death survival curve, a wingman
  chart from `assisted`, clutch on the fight-night recap, and a per-match
  kill grid on the match page (the damage tab has the flow; the kill log's
  edges per match are on the timeline only).
- (S17) In a team game, a pilot listed without a team counts toward the
  clutch `matches` (the first-blood rate's denominator) though
  `opponentsOf` leaves them out of the pairs. No local or fixture match
  has one.
- (S18) `GET /api/fight-nights/:date` generates and saves a recap for any
  date with no saved one, including a night still running or one between
  06:00 and the 06:15 detector. If that night qualifies, the detector then
  finds it saved: it neither regenerates the partial recap nor posts it.
  The page only reaches that URL when someone types it. A guard in the
  route (generate only for days before today's) would fix both; outside
  the S18 entry.
- (S18) The Monday power-rankings post is not built. S13's movement
  decision says "a Monday post (S18) reads the same numbers", but the S18
  entry names the recap and the ping only, and no later session owns it.
  The recap carries the top 5 with their movement instead.
- (S18) The recap's saved lines go into Discord as written, so their old
  faults now post too: "1 matches" and "a ANARCHY slugfest" (seen on the
  local nights), a 0 - 0 team draw as the closest finish, Biggest Upset
  naming the top fragger of a losing team and the streak counting a
  suicide (S2). The embed's own words are new; the lines are
  `fightNightService.js`'s.
- (S18) On the local data no fight-night day passes the thresholds (S14
  flag), so the deployed site posts no recap until a night does. The
  check above ran with the thresholds lowered in a script.
- (S18) Four maps first played since S17 (`ST-HIGHWALL-00-NOUVEAU`, `REC
  CENTRE`, `SUB ROSA`, `ICEWOLF DEATH MATCH V.1`) have no local image and
  overloadmaps.com answers 404 for their image URL, so `/history` and
  `/maps` log a 404 per card for them. Not an S18 change.
- (S18) The ping counts players in lobbies, so six pilots idling in one
  lobby count as an evening. The owner chose the browser count; a lobby
  that never starts a match still pings.
- (S18) The wait for a refresh already under way before the recap's
  rankings (`refreshInProgress`) is the one S18 mutant no test kills: the
  fixtures cannot hold a refresh that started before the night's matches.
- (S18) The ping's "was the count below the line at the tick before" is
  held in memory, so a restart during an evening that crossed 06:00 can
  ping that new day once. Reading the last stored tick instead needs a
  scan of `server_snapshots` without an index on `at` (/simplify,
  skipped).
- (S18) `refreshPilotStats()` joins a refresh already under way, which may
  have started before the caller's writes; the recap waits one out first,
  but the backfill, archive ingest, map sync and the admin's refresh
  button do not. A follow-up run queued inside `refresh.js` would fix
  every caller (/simplify, outside the diff).
- (S18) The admin page now has two hand-made switches that differ (the
  archive toggle's `sr-only` checkbox in blue, the Discord card's
  `role="switch"` button in the brand colour). One shared switch would
  cover both (/simplify, outside the diff). The card's "06:15" is
  written out, not read from `DETECTOR_DELAY_MS`.

- (S19) Earlier flags that name S19, share cards, og tags, pageMeta, fonts,
  images or the map images, decided:
  - (S12) "The verdict thresholds ... are not in the share description;
    S19's cards could use them": covered. The match card shows the verdict;
    the description is unchanged.
  - (S8) The share tags read the database on every page load: still open,
    and the four card pages read a little more now (the pilot's rating and
    cache row, the map's row and a file check). The card route repeats the
    page's reads, because the card's key is the hash of what it shows.
  - (S8) Whether the DSM proxy passes the original `Host`: still open, and
    `og:image` now depends on it too.
  - (S18) Four maps whose image overloadmaps.com answers 404 for: still
    open (the S19 Chrome checks report them on `/history` and `/maps`). A
    map card only draws an image the image route has already cached, so
    those four, and any map nobody has opened on `/maps`, get a card
    without one.
  - (S18) The recap's saved lines say "1 matches" and "a ANARCHY
    slugfest": still open in `fightNightService.js`. The share sentences
    S19 builds use `plural`, so the pilot, fight-night and map
    descriptions say "1 match".
  - (S5) `pilot_stats_cache` lookups do not trim the name: the pilot card
    reads the cache by the summary's spelling, which is trimmed, so the
    card is not affected; `/ppi` still is.
- (S19) A pilot or map name in CJK, or with emoji, draws nothing for those
  characters on the card: no font loaded covers them (satori asks for one
  through `loadAdditionalAsset`, which the service does not supply). The
  page and the description show the name in full. A Noto CJK fallback
  would cover it at several MB a weight.
- (S19) Cards live in memory: a restart or a deploy empties the cache, and
  the first preview of each page after it pays the draw (20 to 90 ms on
  this Mac, unknown on the NAS's Atom). The cache holds 200 cards; a
  crawler walking thousands of pilot pages would draw each once and push
  older cards out.
- (S19) `og:image` on a page opened over the LAN points at the LAN
  address, which Discord cannot fetch. That follows the owner's choice of
  the request's origin (S8's rule for `og:url`); a link shared from the
  public site works.
- (S19) Previews cache by URL. Discord and others keep the image they
  fetched for a `?v=`; a pilot whose numbers moved gets a new `?v=` only
  when the page is shared again, so an old message keeps its old card.
- (S19) Twitter (X) and Slack read `robots.txt`, so `Allow: /api/card/` is
  what lets them fetch the image; Discord does not read it. Nobody pasted
  a link into any of them (see NOT validated).
- (S19) A fifth map, JUNEBUG (map 62), has an image overloadmaps.com
  answers 404 for; it showed on `/maps` at 1,280 px in the S19 checks,
  beside the S18 four.
- (S19, /simplify) Skipped: `getMapIntel` trying a name before an id,
  which would fix all-digit map names for every caller but changes what
  `/api/maps/:id/intel` answers for a number (the card names such a map by
  its id instead); dropping the failure memory and loading the fonts at
  startup (the binding rule is no `og:image` for a card that failed);
  returning `local_image` from `getMapIntel` to save the map page's second
  read (it would add an internal file name to a public answer); one
  `careerKda` for the page and the card (the profile falls back to a ratio
  computed from the telemetry when the pilot has no `pilot_stats_cache`
  row, which only happens before the first refresh; the card leaves the
  tile out then); not drawing a failed card again (a passing failure
  should recover); drawing the recap's card beside its rankings read
  (about 90 ms once a night).
- (S19) The image grew from 599 to 619 MB: satori and its WebAssembly
  (about 12 MB with `yoga-layout`, `harfbuzzjs` and `@shuding/opentype.js`),
  resvg's musl binary and the two Fontsource packages (2.7 MB, every
  subset and weight, of which the cards load six files).

- (S20) Earlier flags that name S20, the tape, rivals, head-to-head, the
  dominance index, "Frequent Adversaries" or the rival picker, decided:
  - (S8) The rival picked on a pilot page is not in the URL: closed. The
    picker is gone; each opponent is a link to `/tape/<pilot>/<opponent>`.
  - (S2, audit item 15; S17) "Frequent Adversaries" counts teammates and
    team kills, beside S17's opponents-only card: closed for the page,
    which no longer shows it. `/api/pilot/:name/breakdown` still builds
    and answers `rivals` that way, walking every match of the pilot on the
    request, and nothing reads it now. Dropping the field changes a public
    answer; the owner's call.
  - (S2, S13, S16, S17) Multi-player head-to-head and the dominance index
    compare raw kills, teammates included: still open in
    `pilot_stats_cache` and the PPI card. The tape no longer shows the
    dominance index or Threat Centrality.
  - (S19) The tape's card waited for S20: built.
- (S20) `pilot_duels` keeps no mode, so the tape shows the duel record
  under all modes only. A mode column there would let the Anarchy and
  Team Anarchy tapes show their own duels.
- (S20) `pilot_bouts` holds a row per pair, mode and map, both ways: 514
  rows for 61 local matches. At the 75,000 matches the S13 bench assumed
  nobody measured it; the worker's comparison holds every row in memory
  once per refresh. A one-direction table (half the rows) was rejected to
  keep a pilot's opponents one key range, as `pilot_rivals` does.
- (S20) The pilot page's opponent names and the tape's corners come from
  `pilot_stats_cache` through `COLLATE NOCASE`, which folds ASCII only
  (the S5 flag): an opponent whose name has a non-ASCII capital shows as
  the lower-case key in the list, and a corner falls back to the totals
  read for its name.
- (S20) Not built, from the plan page's tape item: a link from fight-night
  upsets (Biggest Upset still names the top fragger, the S2 flag, so there
  is no pair to link) and links from the map splits to the maps page (the
  splits use `mapKey`'s upper-case name; whether the maps page opens it
  was not checked).
- (S20) At 390 px the duel ladder's tape column sits in the table's
  horizontal scroll, as its other right-hand columns do.
- (S20 /code-review, skipped) A general fallback for every detail path
  without its parameter would also send `/game` alone to the history, which
  changes what an existing URL opens. `/tape` alone goes through the
  rivals row's aliases instead.
- (S20 /simplify, skipped) A parameter count per route instead of the
  `pair` row (one two-part route so far); a lighter read for the card than
  `getTape`; fetching the tape once for every mode so the switch needs no
  request (the careers and modes come again on each click); passing
  `ratingSides` between the worker's passes (three calls per match:
  ratings, duels, bouts); `recordText` on the duel ladder and the
  objective boards, which still write "3-0-2" with hyphens where the tape
  writes "3–0–2"; one Back button for the tape, the pilot page and the
  match page.

- (S21) Earlier flags that name S21, belts, achievements, streaks, the power
  rankings, the duel ladder or the Discord recap, decided:
  - (S18) The Monday power-rankings post is not built: still open. S21
    adds the belts to the nightly recap, not a post of their own.
  - (S18) The recap's saved lines post their old faults ("1 matches", a
    0 - 0 closest finish, Biggest Upset naming a losing team's top
    fragger, a streak counting a suicide): still open; the New champion
    field is new text from `beltChange`.
  - (S2, S13, S14) Biggest Upset still treats the top fragger as the
    winner: still open. A belt changing hands is now a cleaner upset the
    recap could name; not on S21's list.
  - (S13) The rankings page shows nobody who dropped out during the week
    and no ranks past 25: still open; the belts sit beside it.
  - (S14) The calendar counts every match while the career arc counts
    ranked ones: the Regular achievement counts ranked matches' days, like
    the arc, so it can be lower than the calendar's days.
  - (S20) `pilot_duels` keeps no mode: the Duelist streak reads `duelMatch`
    itself and needs none.
- (S21) Each pass in the worker works out its own view of a match:
  `achievementPass` calls `clutchOf` (also called by `rivalPass`),
  `killStreaksOf` (a second replay of the same log), and `ratingSides`
  through `beltMatch` and `duelMatch` (also called by the rating, duel and
  bout passes). /code-review and /simplify both raised it; skipped, as S20
  skipped passing `ratingSides` between passes, since the passes stay
  independent so one failing does not stop another. The local refresh
  took 0.05 s; the NAS's is unmeasured.
- (S21) A belt never falls vacant: a champion who stops playing keeps it
  for good, and on the NAS a mode's belt may sit with a pilot gone for
  years. Vacating it after the rankings' 28 days was not asked; the
  owner's call.
- (S21) A pilot's reigns (`getPilotAchievements`) scan `belt_reigns`,
  which has no index on `pilot`; it holds one row per change of hands, so
  the scan is small, and the pilot page and its share tags each run it
  once per view. An index needs `ensureDerivedTables` to learn indexes.
  The list has no cap either, unlike a mode's lineage (`LINEAGE`, 10): a
  plain `LIMIT` could drop a belt the pilot still holds (S21 review,
  left as is).
- (S21) The anniversary is worked out when the stats refresh runs (every
  6 hours whether or not a match arrived), so a tier can show up to 6
  hours after its day. Working it out on read needs each pilot's first
  match stored and, for `/belts`' tier counts, read for every pilot.
  Skipped by /simplify.
- (S21) The milestones repeat `pilotPass`'s counting (ranked matches,
  `netKills`, every listing) so the tiers can be dated, tested equal to
  `pilot_stats_cache` but written twice; and the latest-spelling rule is
  now in three passes (`pilotPass`, `rivalPass`, `achievementPass`), each
  over slightly different matches. A shared totals helper and a shared
  spelling helper would change `pilotPass` and `rivalPass`, outside the
  diff (/simplify, skipped).
- (S21) The worker keeps every rated match's sides, with each pilot's
  name, until the scan ends; `beltStep` reads only the keys and scores.
  A slimmer form would change `beltMatch`'s shape (/simplify, skipped).
- (S21) The pilot page's header mark asks `/api/stats/belts` although the
  page's own `/achievements` answer names the belts the pilot holds
  (/simplify, skipped: the mark stays one component everywhere; `/belts`
  seeds the store).
- (S21) In a team game the belt goes to one pilot, the winning side's top
  scorer, while Boss Slayer counts every pilot on that side. Both are the
  stated rules; a team belt was not asked for.
- (S21) The plan page put NEW CHAMPION on the fight-night recap card too;
  the owner chose the Discord recap only, so `/fight-night` does not show
  belt changes.
- (S21) A belt that changes hands on a night that does not pass the
  fight-night thresholds is never announced: the New champion field rides
  the recap, and no recap is saved for that night.
- (S21) The tier thresholds were set for the NAS's history by reasoning
  (see NOT validated); a pass over the real history could show some
  tiers no one reaches or everyone does.
- (S21) A sixth map, SWAT (map 516), has an image overloadmaps.com answers
  404 for, and the dashboard now shows map images too (516 and 640): the
  S21 Chrome checks report 404s on `/`, `/history` and `/maps`. Not an
  S21 change.
- (S21) The belt marks ask again only when a mark mounts and the answer
  is over 10 minutes old, so a page left open shows the champions of up
  to 10 minutes before its last navigation.

- (S22) Earlier flags that name S22, the schedule, iCal, the calendar, the
  countdown, the teaser, fight nights or the Discord ping, decided:
  - (audit, S1) The calendar iframe blocked by the CSP and COEP: closed.
    The widget and `/api/calendar-url` are gone; the schedule is the
    site's own.
  - (S7) The teaser waits for the first poll and the `GameList` chunk, and
    a recap made while the tab stays open shows after a reload: still
    open, and the schedule card behaves the same way (one request per
    mount; an event the admin adds shows on the next visit). The countdown
    itself moves every 30 s without a request.
  - (S14, S15) The fight-night thresholds tuned on UTC days, which no local
    night passed until 2026-10-09 (33 matches, 21 pilots) did: still the
    owner's call. The schedule does not read them: a scheduled night that
    falls short of them gets no recap and so no past event in the feed.
  - (S18) The Monday power-rankings post: still not built; the reminder is
    a post per scheduled night, not a weekly one.
  - (S18) The ping counts players in lobbies, and the card's "It's on" line
    reads the same count, so six pilots idling in a lobby light it.
  - (S18) The ping's rising edge lives in memory: unchanged. The reminder
    keeps no memory; its row in `discord_posts` is the only state.
  - (S21) A belt that changes hands on a night below the thresholds is
    never announced: unchanged.
- (S22) The VTIMEZONE block hard-codes the US rule for America/Chicago. A
  change of `FIGHT_NIGHT_DAY.timeZone` fails the test that checks the
  block's offsets against `localInstant`, which is the reminder to rewrite
  the block, not a fix.
- (S22) A weekly rule at a wall-clock time that does not exist on the
  spring DST day (02:00 to 02:59 on the second Sunday of March) gets the
  instant `localInstant`'s second pass gives (an hour earlier by the
  clock); a time that happens twice on the autumn day takes the later
  offset. No test pins either; no night is scheduled at 2 am.
- (S22) The feed reads each saved recap's first and last match on every
  request (two indexed reads per recap, up to 500 recaps), and the card's
  schedule is expanded per request. Calendar apps poll about hourly; on
  the NAS with a year of recaps that is a few hundred small reads an hour.
  An ETag from the rows' `updated_at` and the recap count would answer 304
  instead.
- (S22) Recaps older than hot storage keep their UTC dates (the S14
  decision), so `getDaySpan` reads their day by the Central rule and may
  find fewer matches, or none, in cold storage; such a recap is left out of
  the feed or spans less than its night. The local data has none.
- (S22) The reminder rides the minute tick, so a server that is down for
  the whole hour before a night posts no reminder for it, and one that
  restarts inside the hour posts it then. A missed reminder is dropped
  once the night starts and never posted late.
- (S22) The admin card's posts list is the latest 5 rows of every kind, so
  a week of reminders can push the recap and the ping off it; the Refresh
  button and the database still have them.
- (S22) The fight-night page has no subscribe link; only the dashboard
  card carries the feed. A link on `/fight-night` would be one line.
- (S22) The admin form's own validation (`required`, `min`, `max`, the
  `time` and `date` inputs) stops most bad input before the server sees
  it, so `validateEvent`'s sentences reach the page only through the API
  or a browser without the checks; the Chrome check forced one with a
  mocked 400.
- (S22) The dashboard card and the admin card each format a night with
  `clockLabel` and `dayLabel`; the feed's `DESCRIPTION` of a coming night
  carries the notes and a link but not the time (the DTSTART is the time).
- (S22) With mobile emulation on, headless Chrome reports a layout
  viewport wider than 390 px on `/rivals` (849), `/ladders` (446), `/maps`
  and `/maps/BLIZZARD` (898), where the body stays 390 px and each wide
  table scrolls inside its wrapper. S17 to S21 measured the body; S22's
  harness does too, with emulation off. Whether a real phone zooms those
  pages out was not checked. Not an S22 change.
- (S22) The map-image 404s overloadmaps.com answers (maps 62, 151, 424, 516
  and 640) still log on `/`, `/history`, `/maps` and `/maps/BLIZZARD`;
  reported by the harness, not an S22 change.

## Rollback

Each session is one PR. Rollback is `git revert` of that merge commit followed
by a NAS image pull. After S6 the files in `data/` belong to uid 1000; an
older image runs as root and can still write them, so no chown back is
needed. `data/backups/` can stay or be deleted. S5 adds `game_players` to both database files; after
the revert and the pull, run `DROP TABLE game_players;` on `tracker.db` and
on `cold_storage.db` (see the S5 migration decision). The JSON blobs remain
the source of truth, so no data is lost. S13 adds `rating_snapshots` to
`tracker.db`; after its revert, `DROP TABLE rating_snapshots;` there, or
leave it (nothing older reads it). S14 adds `pilot_months` the same way
(`DROP TABLE pilot_months;`, or leave it). After an S14 revert the rating
days go back to Chicago calendar days at the next refresh, and fight
nights back to UTC days.
S15 adds `servers`, `server_snapshots`, `server_hours` and
`region_months` to `tracker.db`. After its revert they can stay (nothing
older reads them); `DROP TABLE` on the first three throws away the only
record of the server browser, so keep them if S15 may come back.
S16 adds `map_weapons`, `pilot_weapons`, `pilot_maps`, `duel_snapshots`,
`pilot_duels` and `pilot_objectives` to `tracker.db`, all derived: after
its revert `DROP TABLE` any of them, or leave them. The S15 code's startup
check does not know them, so it will not refresh for them.
S17 adds `pilot_rivals` and `pilot_clutch` to `tracker.db`, both derived:
after its revert `DROP TABLE` either, or leave them. The S16 code's built
marker names its own list, so the first start after the revert refreshes
once.
S18 adds `discord_posts` to `tracker.db` and the `discord_enabled` row to
`admin_settings`; after its revert `DROP TABLE discord_posts;` or leave
it, and the row can stay. Nothing posts once the S18 code is gone;
`DISCORD_WEBHOOK_URL` and `SITE_URL` in `.env` are then unread.
S19 adds no table, setting or file: its cards live in memory. After its
revert the pages lose `og:image` and previews fall back to text; links
already posted keep the image their chat client cached, and a fresh fetch
of `/api/card/...` answers the API's 404.
S20 adds `pilot_bouts` to `tracker.db`, derived: after its revert `DROP
TABLE pilot_bouts;` or leave it (nothing older reads it). The S19 code's
built marker names its own list, so the first start after the revert
refreshes once, and its `rivalPass` writes `pilot_rivals` the old way,
with the same rows. Tape links already posted open the dashboard (the
older router has no `/tape`).
S21 adds `belt_reigns` and `pilot_achievements` to `tracker.db`, both
derived: after its revert `DROP TABLE` either, or leave them (nothing
older reads them). The S20 code's built marker names its own list, so the
first start after the revert refreshes once. Every share card's `?v=`
changes back with `CARD_LAYOUT`, so previews fetch the old layout again;
`/belts` links open the dashboard.
S22 adds `fight_night_events` to `tracker.db`, primary data: after its
revert `DROP TABLE fight_night_events;` or leave it (nothing older reads
it; dropping it loses the schedule). The `reminder` rows in `discord_posts`
can stay. `/fight-nights.ics` answers the dashboard page after the revert,
so a calendar subscribed to it sees no events; the iframe widget and
`/api/calendar-url` come back with the revert, blocked by the CSP as before.

## Open questions

- None open. The time zone for fight-night days was settled by the owner at
  the start of S14: America/Chicago, with the day rolling over at 06:00 (see
  the S14 decisions).
- S15's three (snapshot cadence, retention, the regional share's source)
  and the fight-night thresholds were settled by the owner at its start;
  see the S15 decisions and the S14 thresholds flag.
- S16's three (what a duel is, how the ladder ranks, radar or not) were
  settled by the owner at its start; see the S16 decisions.
- S17's six (force graph or not, chord or not, the late window, trailing in
  FFA, ranked only, opponents only) were settled by the owner at its start;
  see the S17 decisions.
- S18's (the ping's trigger and how often, which saves post, the embed,
  where the URL lives, failures, the origin, a test button) were settled
  by the owner at its start; see the S18 decisions.
- S19's seven (which pages, what each card shows, the font, when cards
  are drawn and kept, the `og:image` origin, the recap's image, resvg's
  build) were settled by the owner at its start; see the S19 decisions.
  The cache key is a hash of the card rather than the stamps the answer
  named (see the rendering decision).
- S20's six (what the tape compares, over which matches, the URL's order,
  the edge cases, the pilot page's rival card, the share card), plus which
  pages link to the tape, were settled by the owner at its start; see the
  S20 decisions. The 404 and 400 the first draft answered became 200s with
  `{ missing }` and `{ same }` during the session (see the endpoints
  decision).
- S21's seven (what a belt is and when it is decided, which achievements,
  how far back they count and whether they have tiers, where they show,
  whether a belt change posts to Discord, what a pilot with nothing sees)
  were settled by the owner at its start; see the S21 decisions. During
  the session /code-review moved the CTF and Monsterball belts to the
  most captures or goals (see the belt rule decision).
- S22's seven (what an event is and where it lives, who edits it, what
  the feed carries, its URL, the countdown and the live states, where the
  card sits and what replaces the iframe, Discord) were settled by the
  owner at its start; see the S22 decisions. Every answer was the
  recommended one but Discord, where the owner chose the reminder post.

## Skills to load

- `unslop` for PR descriptions and tracker prose.
- `code-review` at the end of each session, before opening the PR.
- `simplify` after the review, on the session's diff.

## References

- `docs/overload-fight-club-roadmap.html`: the plan, written 2026-10-06 at
  `10223be`.
- `docs/audit/{data,ux,performance,features}.md`: audit notes, same date and
  commit.
- Upstream: https://tracker.otl.gg (data source), https://otl.gg (league),
  https://github.com/overload-development-community/olmod,
  https://www.overloadmaps.com.

## Postmortems

### better-sqlite3 11.8 on Node 24 (resolved 2026-10-08)

`npm ci` fails compiling `better-sqlite3@11.8.1` on Node 24.6. Use `nvm use 22`
(22.17.0 installed) or `npm ci --ignore-scripts` for a client-only build.
Measured 2026-10-06.

Resolved 2026-10-08 by the Node 26 maintenance PR: better-sqlite3 13 ships
N-API prebuilds, so `npm ci` compiles nothing on Node 22, 24 or 26.

### `nvm use 22` does not carry over between tool calls (resolved 2026-10-08)

Each Bash tool call starts a fresh shell on the default Node (24). Running
vitest there fails to load `better-sqlite3` (`NODE_MODULE_VERSION 127` vs
`137`). Prefix every command that needs Node with `source ~/.nvm/nvm.sh &&
nvm use 22 &&`. Seen 2026-10-06 in S3.

Resolved 2026-10-08 by the Node 26 maintenance PR: the N-API binary loads on
22, 24 and 26, so a shell left on the default Node no longer fails to load
it. nvm still does not carry over; to run on the project's version, prefix
with `source ~/.nvm/nvm.sh && nvm use 26 &&`.

### An ABI mismatch shows up as "Connection failed" under `npm run dev`

With `node_modules` installed under Node 22 (better-sqlite3 11.10.0),
`node server/index.js` on Node 24 dies at startup: `better_sqlite3.node`
"was compiled against ... NODE_MODULE_VERSION 127. This version of Node.js
requires NODE_MODULE_VERSION 137." Under `npm run dev`, concurrently keeps
Vite up, so the page loads and every `/api` call fails; GameList shows
"Connection failed". When the client says the server is down, read the
server's half of the dev output first. Measured 2026-10-08 on 24.6.0.
better-sqlite3 13 is N-API and does not depend on `NODE_MODULE_VERSION`.

### The Command Line Tools on this Mac cannot link native modules

Compiling better-sqlite3 11.10.0 for Node 24 fails in the linker: "tapi
error: malformed file ... MacOSX27.0.sdk/usr/lib/libSystem.B.tbd ...
unknown architecture". Nothing native builds here until the Command Line
Tools are fixed. better-sqlite3 13 avoids it while its darwin prebuild
matches; any new dependency that compiles will hit it. Measured 2026-10-08,
not fixed.

### `npm run build` rewrites a tracked file

`prebuild` runs `scripts/generate-version.js`, which rewrites
`public/version.json` and dirties the tree. Use `npx vite build` for
measurement builds. The deploy workflow relies on the rewrite; leave it alone.

## Session log

- 2026-10-06, planning session (Claude Fable 5.1): four audits, roadmap page
  published, this tracker written. No code changed.
- 2026-10-06, S1 (Claude Opus 5.5): secrets out of five scripts, production
  refuses to start without its two secrets, admin session on `/api/overload/*`,
  analyze-match and fight-nights/check, pilot-name validation, login rate
  limit, `Secure` cookie on HTTPS, `.env.example`, vitest. Status line checked
  first: `10223be` was still `origin/main`, and the docs branch existed. The
  tracker undercounted the leaked password (three scripts listed, five had
  it). First server start in this work, on Node 22; `better-sqlite3` compiles
  there. /code-review found 10 issues: fixed the spoofable rate limit (global
  cap), compose starting without secrets (`:?`), password-length timing
  (digest compare) and a misleading dev warning; the rest are flagged above.
  /simplify: made `verifyPassword` sync, hashed the admin password once, moved
  `renamePilot`'s name check ahead of `tasklist`. Skipped folding the eight
  pilot-name guards into one throwing path helper (it would turn 400/404 into
  500) and moving the production check out of `auth.js` (index.js body runs
  after `db.js` has opened the databases). Push denied (`kehoej` has read
  access only), so the branch is local and no PR exists yet.
- 2026-10-06, S1 resumed (Claude Opus 5.5): push access granted. `git fetch`
  showed `main` force-pushed: the owner purged the password from history
  (`10223be` became `2c4f174`, code otherwise identical) and added
  `5516729`, which fixes the scripts. Rebuilt `ofc/s01-secrets-auth` on
  `5516729` by cherry-picking the S1 commits, took the owner's scripts and
  `.gitignore`, and added `!.env.example`. Checked that no commit from the old
  history is an ancestor and that none of the 46 objects pushed contains the
  password. Re-ran vitest and the production start checks on the new base.
  PR #1, not merged.

- 2026-10-06, S2 (Claude Opus 5.5): `server/lib/gameParse.js` and every
  aggregation in `db.js` and `fightNightService.js` moved onto it. Status
  line checked first: PR #1 open, `origin/main` at `5516729` without
  `docs/`, so S2 stacks on `origin/ofc/s01-secrets-auth` (`ea4eace`);
  `10223be` is not an object in this clone. First move: `npx vitest run`
  through npx before `npm ci` failed to load rolldown; after `npm ci`,
  1 file, 3 tests pass. `grep teamScore` found `.RED` at `db.js` 712, 2047
  and 2422 and `RED ?? ORANGE` in `fightNightService.js:212`, as the
  audit said. The fixtures have no ORANGE win, so the tests flip 72102's
  score. Wrote the DB test first and ran it on the old code (10 of 14
  fail). The first suicide query was 44x slower than the old one on
  synthetic data and was replaced by a grouped pass. /code-review found 10
  issues: fixed unknown durations inflating KPM, `AVG` counting unknown
  durations as 0, 1v1 head-to-head ignoring the team score, merged-pilot
  spelling, and blank names counted as pilots; flagged the scan costs, the
  LIKE prefilter gaps and Biggest Upset; one (win rate) was wrong because
  no-result and tie both count as non-wins. /simplify added
  `pairOutcome`, one outcome counter map, keys computed once per game, and
  stopped memoizing the all-time fallback; skipped rewriting
  `duration_of` to read a field list (it would copy `durationOf`'s rules
  into SQL). PR #2 opened against `main`, not merged.

- 2026-10-06, S3 (Claude Opus 5.5): hydrate filter, summary upsert,
  `insertGame` and fight-night day bounds fixed. Status line checked
  first: PRs #1 and #2 open, S2's branch at `e75e1e8`, `10223be` not an
  object in this clone, so S3 stacks on `origin/ofc/s02-stat-correctness`.
  First move: `npx vitest run` failed to load `better-sqlite3` because
  `nvm use 22` had not carried over into the new shell; on Node 22, 3
  files and 38 tests pass. The grep found `getSummaryGames` at `db.js:566`,
  `excluded.details` at 1734, 1771 and 1802, `date LIKE` day queries at
  2716 and 2781, and the `insertGame` wrapper at 1705. Reading the code
  turned up two things the tracker did not list: `insertGame` called
  `module.exports.default.saveGames`, which throws in an ES module, and
  once the filter worked the hydration loop would never end. Wrote the
  tests first (4 of 10 fail on the old code). /code-review found 10
  issues: fixed bad dates turning a 404 into a 500 and a resumed job
  starting from the first game; kept the binding keep-the-kill-log rule
  over the in-progress snapshot case and flagged it, the other writers,
  `game_metadata`, `fetchGame`'s empty body and the N+1 day query; the
  malformed-JSON case would already break every `json_extract` query.
  /simplify: the upsert and day query are prepared once, `current_id`
  means the last game processed in both writes, the fixture setup moved
  to `server/testFixtures.js`, and the test reads games with
  `getGameById`. Skipped computing duration in SQL (a copy of
  `durationOf`) and dropping `insertGame`. PR #3 opened against `main`,
  not merged.

- 2026-10-06, S4 (Claude Opus 5.5): lazy views, one shared server-browser
  poll that pauses while the tab is hidden, the editor mounted on demand,
  precompressed wasm, `/api/games` answering from the DB, no inline PPI
  rebuild, WAL pragmas, row iteration in `refreshPilotStats`. Status line
  checked first: PRs #1 to #3 open, S3's branch at `3c79f97`, `10223be`
  not an object in this clone, so S4 stacks on
  `origin/ofc/s03-data-retention`. PRs #1 to #3 merged during the session,
  so the branch was rebased onto `main` (`2b05787`, same tree as S3's
  tip) before the PR. First move: 4 files, 50 tests pass;
  one chunk, 351.07 KB gzip. Reading the code turned up three things the
  tracker did not list: `Layout`'s poll fed a count nothing rendered, so it
  was deleted rather than moved onto the hook; nothing serves
  `/api/server/:ip/health`, so the status dot it fed went too; and WAL
  breaks the admin backup and restore, which copied the raw file.
  Server tests were written against the old code first (3 of the new ones
  fail there). Checked in headless Chrome over CDP: lazy chunks per page,
  no ffmpeg on `/taunts` until Create, the hidden-tab pause, and Chrome
  picking gzip over br because `acceptsEncodings` follows the client's
  order (fixed). /code-review found 10 issues: fixed restore and backup
  under WAL (backup API), the dashboard opening on History, a blank page
  when a chunk fails after a deploy, partial pages answered early, older
  poll answers overwriting newer ones, and a test teardown; kept the stale
  list on a failed poll (the old poll did the same), the PPI lag (the
  Done-when decision) and Range on the precompressed file (valid HTTP).
  /simplify: the wasm route rewrites the URL and lets `express.static`
  serve the copy, one response path in `/api/games`, the lazy views
  inside the existing `ErrorBoundary`, no refetch on a quick tab switch,
  no per-request mkdir; skipped extracting a spinner (S9), fixing
  `GameList`'s tab choice (S7), compressing in parallel at build time
  (0.7 s) and paging the refresh query (S5). PR #4 opened against `main`,
  not merged.

- 2026-10-07, S5 (Claude Opus 5.5): `game_players` in both database
  files, maintained by every games writer and backfilled once at startup;
  pilot routes, the leaderboard, first-seen and the all-time kill total
  read it; the PPI, archive and map passes run in one worker on read-only
  connections; the cold move can no longer lose a game. Status line
  checked first: PR #4 open, S4's tip `b3f3af4`, `main` at `2b05787`,
  `10223be` not an object here, so S5 stacks on
  `origin/ofc/s04-bundle-polling`. First move: 5 files, 57 tests (the
  Verification table's 56 was a typo); entry 72.84 KB gzip. Reading the
  code turned up things the tracker did not list: `saveColdGamesBatch`
  and `updateGameDetails` write games too, `restoreHot` can bring back a
  file without the table, `getColdStorageStats` and the map sync ran full
  passes inline, and the all-time kill total and first-seen were full
  passes as well. The tests were written first and run red. On a
  synthetic 1.6 GB copy every pilot number and all three caches match
  S4's; the first comparison caught suicides counted twice for a pilot
  listed twice in one game. /code-review found 10 issues: fixed a game
  moved mid-refresh being counted twice (the worker skips hot ids in
  cold), the refresh rejecting from `setInterval`, drift from writers
  that bypass the table (startup repair) and an un-awaited script; kept
  the NOCASE gap (flagged), the Done-when columns, rebuilding rows on
  every upsert (skipping would let the date drift), the batch's parse and
  the blank-name kill total (both documented). /simplify: one paged loop
  for backfill and repair, `TRIM(@name)` in SQL instead of wrappers, a
  covering `(name, date, game_id)` index, one column list and one
  `OUTCOME_FIELD`, shared fixtures, plan tests on `stmt.database`;
  skipped triggers (a JS function in a trigger breaks every other
  writer), a build-then-rename table instead of `user_version`, rewiring
  the passes onto `playerRows` (it changes PPI damage) and a `pilot_key`
  column. Before opening the PR, `main` had moved: the owner pushed
  `44e4792` (`saveColdGamesBatch` on the upsert) directly, which
  conflicted with S5, so `origin/main` was merged into the branch and the
  batch builds rows from the details the upsert kept. PR #5 opened
  against `main`, not merged.

- 2026-10-07, S6 (Claude Opus 5.5): nightly backups of both databases
  with 7-day rotation, `/api/health`, SIGTERM shutdown that stops the
  stats worker, a multi-stage Dockerfile running as uid 1000, compose log
  rotation and healthcheck, React types with `tsc --noEmit` at 0, a CI
  workflow, and 25 scripts and two root leftovers removed. Status line
  checked first: PRs #4 and #5 open, S5's tip `2f9737c`, `10223be` not an
  object here, so S6 stacks on `origin/ofc/s05-player-table`. `main` had
  moved to `fb4064a` with three owner commits; merging it conflicted in
  `db.js` (`utcMonthBounds` beside S5's imports, `getColdStorageStats`)
  and left `updateGameDetails` building rows from the incoming game while
  keeping the stored kill log, fixed with `RETURNING details` and a test.
  First move: 6 files, 76 tests; entry 72.84 KB gzip; tsc 0. With the
  React types the error count was 8, not thousands, so `tsc` is clean
  without touching `types.ts`. Reading the code turned up things the
  tracker did not list: the owner deploys by building on the NAS with
  `rebuild_and_deploy_nas.py`, the NAS's data belongs to root, so a
  non-root image crash-loops there (reproduced in Docker), and multer
  creates `uploads/` at import. /code-review found 10 issues: fixed
  un-awaited `close()` in three test teardowns, a writability check that
  missed `-wal`/`-shm` and ran after the mkdirs, a worker exit clearing a
  newer worker's reference, a shutdown that did not wait for requests,
  the health route returning error text, CI only on PRs to `main`, a
  re-parse in `updateGameDetails` and git in the build stage; kept
  `new_map_data.json` (Done-when list) and the healthcheck in both the
  Dockerfile and compose. /simplify: health statements prepared once, no
  redundant `closeIdleConnections`, a named type in `PilotsList`, a chown
  step in the owner's NAS deploy script, a tighter backup test; skipped
  the unconditional worker reset (the race is real), fewer cold backups
  (Done-when list), moving the client libraries out of `dependencies`,
  and `init: true` (flagged). PR #6 opened against `main`, not merged.


- 2026-10-07, S7 (Claude Opus 5.5): the dashboard leads with live
  servers and online pilots, with a one-line Fight Night teaser under
  them. Fight Night is in the nav. The live page shows the join IP with
  a copy button that confirms or says it failed. The match page shows
  the score or podium, winner, real duration and a result line, all
  from `gameParse.js`. Favorites persist in `localStorage`, and the
  audit's hard-coded numbers are wired or removed. Status line checked
  first: PRs #4 to #6 open, S6's tip `7c09011`, `main` at `fb4064a` with
  nothing S6 lacks, `10223be` not an object here. S7 stacks on
  `origin/ofc/s06-ops-types`. First move: 9 files, 92 tests; entry
  72.81 KB gzip; tsc 0. Reading the code turned up things the tracker
  did not list. The owner's `ebe30dd` had already wired every
  ColdStorage number. The client can import `gameParse.js` directly
  (no Node APIs, `allowJs`), which beat adding result fields to the
  API. `winnerOf`'s inferred type was `any`. The nav already overflowed
  from 768 to 1,150 px and the new item pushed 1,280 over, measured in
  headless Chrome. No live game or qualifying fight night existed
  locally, so the live page ran on a mocked `/api/game/<ip>` and the
  recap was forced. /code-review found 8 issues. Fixed: the time-limit
  fallback labelled as a real length, one-sided games saying "no score"
  beside a score panel, the standing-by count, tie wording and a
  repeated colour ternary. Kept the hand-written `MatchResult` (the
  inferred type was `any`; /simplify later typed it properly). Flagged
  the deep-stats fetch and the other copy buttons. /simplify (four
  agents): `measuredDurationOf` in `gameParse.js` instead of guessing
  from the limit, a JSDoc type on `winnerOf`, one idle count, the stock
  count from the cached map list, one request per page load for the
  teaser, the nav from `xl`, a podium table. Skipped: fetching the
  recap in `App`, a shared colour helper and copy hook across files
  outside S7, and `/stats/global?source=all` for the match count (a
  full JSON scan on a cache miss). PR #7 opened against `main`, not
  merged.

- 2026-10-07, S8 (Claude Opus 5.5): internal navigation is real `<a
  href>` links, every page sets its own title, the server writes a
  title and `og:` tags for every page, tabs, filters, the map popup and
  the fight-night date live in the URL, back buttons use the history,
  and match B no longer shows match A while it loads. Status line
  checked first: PRs #4 to #7 open, S7's tip `a9a1699`, `main` at
  `fb4064a` with nothing S7 lacks, `10223be` not an object here. S8
  stacks on `origin/ofc/s07-live-dashboard`. First move: 10 files, 99
  tests; entry 73.21 KB gzip; tsc 0. Reading the code turned up things
  the tracker did not list: `App` kept the route in six pieces of state
  beside the URL, so the stale match came from `selectedGameData`
  outliving its id; `PilotDetail` and `LiveGameDetail` carried state
  from one pilot or server to the next; `express.static` answered `/`
  itself, so the dashboard would have skipped the page route; the S7
  wording for results was TypeScript the server could not import. No
  fight night qualified, so two recaps were forced. A leftover headless
  Chrome on the debugging port once made the page hidden, which paused
  the shared poll and stalled the dashboard; the scripts now refuse a
  busy port. /code-review found 10 issues. Fixed: an unfiltered and a
  searched history fetch racing on `/history?q=`, a history write per
  keystroke (now 300 ms after typing stops), App re-rendering on every
  query change, map intel asked by name where the server reads digits
  as an id, the unknown-map fallback firing on a failed request and
  dropping filters, the archive reset keeping `page`, `index.html`
  cached at startup, repeated allowed-value checks. Kept the share-tag
  read on every page load (flagged). /simplify (four agents): one route
  table for `parseRoute`, `urlFor` and titles, the nav from one list,
  the menu closing on any page change, one history write for several
  query keys, archive record cards as links, the pilot summary on the
  leaderboard's SQL, the `matchResult.ts` shim removed, no refetch on
  back to a match, intel fetched beside the map list, fight-night
  statements prepared once. Skipped: scroll restoration in `navigate()`,
  a per-URL meta cache, flag and number param hooks, a shared m:ss
  formatter, a `StatList` and one search effect (flagged). PR #8 opened
  against `main`, not merged.

- 2026-10-07, S9 (Claude Opus 5.5): design tokens in `designTokens.js`
  read by `tailwind.config.js` and the charts (one orange, one hover
  orange, three surface blacks, one border, `text-2xs`, two radii), dead
  classes removed everywhere, `Loading`, `EmptyState` and `ErrorState` in
  every view that fetches, a top-level `ErrorBoundary` in `index.tsx`,
  and the dashboard, leaderboard, pilot, match and live pages on the
  tokens. Status line checked first: it said PRs #4 to #8 were open, but
  all five had merged (`main` at `6bc5857`, the PR #8 merge, nothing
  after it), so S9 branched from `origin/main`; `10223be` is not an
  object here. First move: 12 files, 107 tests; entry 73.47 KB gzip; tsc
  0. Re-counting turned up things the tracker did not list: 94 hex values
  and `#ff6600` 605 times (the audit said 95 and 612), a dozen dead
  classes beyond the audit's five (found by checking every class against
  the built CSS), and three views that showed an empty state when their
  request failed. A real match was running on 23.94.53.39, so its answers
  were captured and replayed for every screenshot, and a fight night
  qualified for real during the session. The first after-shots caught
  11px text mapped up to 12px wrapping a header; the rule now rounds
  down. /code-review found 10 issues. Fixed: the map tooltip inside an
  SVG doubled by the type scale, chart bars the same grey as their grid,
  the inner boundary clearing an error thrown by the page it had just
  opened, a thrown `null` escaping the boundary, a compact error card too
  tall for the timeline slot, stale history answers, a raw orange on a
  rewritten line, one stat card on the wrong radius. Kept: dead-class
  removal in files the token work did not touch (the Done-when list
  says dead classes are removed) and the body and scrollbar colours
  moving onto the tokens (recorded in the decisions). /simplify (four
  agents): `card` on `EmptyState` instead of five wrappers, one
  secondary button class, one chart tooltip style, failure as null data
  instead of extra flags, the archive retry without a page reload,
  failed requests no longer read as empty on the pilot page, the
  leaderboard and the archive's hall of fame, no second archive request
  on a failed dashboard, one `.brand-font` rule. Skipped: a shared load
  hook, apiService functions for the direct fetches, per-slot sizing and
  a page header component (flagged). PR #9 opened against `main`, not
  merged.

- 2026-10-07, S10 (Claude Opus 5.5): one word each for match, pilot,
  kill, map, server and archive across the client and the recap and
  share copy; Combat Ratio and Lethality defined once in `gameParse.js`
  and shown from the same cache on the leaderboard and the profile;
  sortable headers, cards and table rows as buttons and links; one
  focus ring and one tap state in `index.css`; `useDialog` on all five
  dialogs; every table in a scroll wrapper and every route 390 px wide
  at 390 px; the roster and the map grid paged in `?page=`. Status line
  checked first: it said PR #9 was open, but it had merged
  (`ae050c4`, nothing after it), so S10 branched from `origin/main`;
  `10223be` is not an object here. First move: 12 files, 107 tests;
  entry 73.64 KB gzip; tsc 0. Re-counting turned up more than the
  audit listed: 9 of 13 tables without a wrapper (not 7), 22 clickable
  non-controls, four pages wider than 390 px (the taunt tools at 854),
  and the profile's "Combat Ratio" card headlining the career K/D while
  the leaderboard's column was KDA. No server had a live game, so the
  live page was mocked from fixture 72102; the two taunt dialogs that
  need an Overload folder ran on mocked `/api/overload/*` answers.
  Two things the first checks caught: the focus rule lost to
  `focus:outline-none` because Tailwind emits variants at the end of the
  file (fixed by placing `@tailwind variants` first), and "Pilot
  Settings" in the nav overflowed 1,280 px (now "Settings"). CDP's
  `dispatchTouchEvent` never set `:active`; a synthesized tap gesture
  does. /code-review found 10 issues, all fixed: cell links hidden from
  screen readers, dead click zones in the server rows, the dialog
  opener lost to an `autoFocus` field (and wrong in Safari), a stale
  `?page=` surviving a search, the page in the URL under a sort that
  was not, Lethality's sort with no value, "by just 3 kill", leftover
  `stopPropagation`, duplicated page resets, a dead `onClick` turned
  into a button. /simplify (four agents): `LinkCell` instead of a `td`
  around every cell link, `usePage(items, size)` returning the page, a
  second argument on `useQueryParam`'s setter so a filter clears the
  page in one history write, one Lethality label with its span in the
  sub-line, one CSS rule instead of `outline-none` on each dialog
  panel, the pager on the shared button style. Skipped: dropping
  `page` inside `setQueryParams` (it would reset the archive's pager on
  a tab change), the archive's pager on `Pager`, one `SortHeader`
  adapter, hint constants for win rate and suicides, a `Dialog`
  wrapper, and K/D copies (flagged). Before pushing, `origin/main` had
  three new owner commits (the replay and stats refreshes); the branch
  rebased onto them cleanly, the replay's new strings got the S10
  words, and the checks ran again on the rebased build. A fourth owner
  commit (`5afcdf5`, the 90-day roster) arrived after that: one
  conflict in `PilotsList.tsx`, its inline Combat Ratio moved onto
  `combatRatio()`, its Retry argument fixed, and its `tsc` error fixed.
  PR #10 opened against `main`, not merged.

- 2026-10-08, S11 (Claude Opus 5.5): `server/db.js` split into
  `server/db/` (connection, migrations, five repos, four analytics
  modules) behind the same 90-key `db` object; `routes.js` an aggregator
  of eight resource routers; `PilotSettingsPanel`, `AudioEditor`,
  `WebImportModal` and `AdminPanel` cut to 224, 209, 176 and 90 lines with
  23 hooks and 33 child components; `AdminPanel` on apiService instead of
  axios. Status line checked first: it said PR #10 was open, but it had
  merged (`96f2710`, nothing after it), so S11 branched from
  `origin/main`; `10223be` is not an object here. First move: 13 files,
  129 tests (the prompt said 126); entry 73.76 KB gzip (the table said
  73.74); tsc 0; `db.js` was 2,620 lines and `routes.js` 1,042, not the
  2,520 and 964 the prompt quoted. Before touching code I recorded the
  export list, the mounted routes and the API answers. The answers came
  off a frozen copy of the data dir, with the tracker blocked through a
  dead proxy so no sync could add games between runs. The server modules
  and route files were cut from line ranges of the old files by script.
  The four components went to four implementer agents in their own
  worktrees, one each; I merged their branches and checked them against
  a build of `96f2710` with one CDP script (20 DOM snapshots, the dialog
  checks, the request log). The agents shared my scratch folder: one
  overwrote my assembler script, and a scratch copy of `AudioEditor.tsx`
  landed in my first `server/db` commit until I rebuilt the branch
  without it. Reading the code turned up things the tracker did not
  list: the owner's replay test reached into `routes.stack` (it now asks
  over HTTP); `hooks/` was not in Tailwind's `content`, so two unused
  utility rules dropped out of the CSS (the PR review added `./hooks/**`;
  the CSS also gains an unused `.visible`, from a comment in
  `useServerBrowser.ts`); and the S10 stale-leaderboard
  puzzle is probably the startup warm-up caching the leaderboard for
  600 s before the startup refresh lands (flagged, not fixed). /code-review
  found 10 issues: six were bugs the old code already had and the split
  carried over verbatim (stale `handleExport` on Ctrl+Enter, the region
  meter's stale buffer, overlapping pilot loads, leftover pilot values,
  the dead `activePilot` sync, a double WaveSurfer destroy), all flagged
  because behaviour was not to change; the others were the axios-like
  helper (kept: axios in `apiService.ts` would put its 14 KB gzip chunk in
  the entry), the old unused admin helpers (flagged, ground rule), the two
  autoselect lists (merged in /simplify) and db.js naming each function
  three times (kept: spreading modules would add keys). /simplify (four
  agents): one `AutoselectList`, hook objects passed whole to the history
  list and the backfill panel, one `SetMessage` type, derived setter
  types, `useAudioEditorLifecycle` for a hook that did more than ffmpeg,
  one backfill action call, the replay test over HTTP, and two duplicate
  statements my own line ranges had left in `analytics/global.js`.
  Skipped: a separate admin API module (the Done-when list names
  apiService), a `game_players` module and a schema-owned connection in
  `server/db`, a `markSaved()` in the pilot settings, the preview player
  rework in the web import. PR #11 opened against `main`, not merged.

- 2026-10-08, S12 (Claude Opus 5.5): the kill-log rules in
  `gameParse.js` (points per kill, the scoreboard at a second, lead
  changes, momentum, first blood, weapon families, the verdict); the
  match page's result panel as a fight card (verdict, lead changes,
  first blood); a slider that replays the overview's scoreboard, in
  `?t=`; a momentum chart with kills on one strip per weapon family in
  place of Score Progression; MatchReplay and the deep dive on the same
  rules and chart colours. Status line checked first: it said PR #11
  was open, but it had merged (`5a09e5c`, nothing after it), so S12
  branched from `origin/main`; `10223be` is not an object here. First
  move: 14 files, 136 tests; entry 73.94 KB gzip; tsc 0. The prompt said
  fixture 72102 has a kill log; neither sample file has one (the detail
  sample has a single suicide), so the tests write logs onto 72099 and
  72098 that reproduce their totals, and the rules were checked on the
  four local matches that have real logs, where the replay matched the
  tracker exactly. I picked the colours with the dataviz skill's
  validator: its dark palette passes on `surface-card`, Tailwind's
  team text colours do not as marks, and 16 weapons could not each get
  a hue, so they became seven families on stacked strips. MatchReplay's
  `/api/game/:id` path hydrated 78758 from the tracker during the
  checks, so the log-less case ran on a Fetch-domain mock. /code-review
  found 10 issues: a kill at 52.5 s missing from second 52 (fixed:
  whole seconds), `?t=` zeroing a log-less table (fixed at the source),
  the pie merging a family's weapons (now by family), missing-name
  fallbacks, a flat or zero-length chart (guards), chart data rebuilt
  on every slider step (memoised), MatchReplay's name keying and zero
  length (fixed); kept: a death with no attacker scoring nothing (the
  rule, flagged) and several replays per page load (under a
  millisecond). /simplify (four agents): one `scoreboardAt` per slider
  step shared by the table and the slider, the cursor as an overlay so
  the chart does not redraw, `React.memo` on the replay, MatchReplay's
  points computed once per kill and its team mode, suicides and first
  blood from `gameParse`, one weapon-family list with "other",
  `hasKillLog`, `leadChanges` null where it does not apply. Skipped:
  the table's damage fallback (moved code, a different number),
  MatchAnalysis's inline team colour, `soleLeader` for the slider's FFA
  wording. PR #12 opened against `main`, not merged.

- 2026-10-08, S13 (Claude Opus 5.5): a Glicko-2 rating in `gameParse.js`
  over every stored match, replayed by the stats worker on each refresh
  into a daily `rating_snapshots` table; `/api/pilot/:name/rating` and
  `/api/stats/rankings`; a rating card with a history line and ±2 RD
  band on the pilot page; `/rankings` with weekly movement. Status line
  checked first: PR #12 had merged (`6bdeb97`, nothing after it), so S13
  branched from `origin/main`; `10223be` is not an object here. First
  move: 14 files, 156 tests; entry 73.91 KB gzip; tsc 0. The rating
  first counted an N-pilot FFA as N - 1 separate results. It looked
  fine on 40 local matches, but a synthetic 75,000-match history sent
  the busiest pilot's volatility to 5.45 and rating to 5e46, so each
  result now weighs 1 / (sides - 1). The roadmap said "nightly snapshot
  table"; I kept a row per pilot per day but let every refresh rewrite
  any day a match moves, because a frozen copy would show no movement
  for weeks after a deploy and go wrong after a backfill. The pilot page
  had never loaded Recharts, so the chart is a lazy chunk behind its own
  Suspense, and its line is an unfilled Area (Recharts' `Line` added 9.6
  KB to the pilot chunk). One mutation check survived at first (the
  pilot's own rating in place of the team mean) until the test was
  rewritten. A mutation cleanup with `git checkout` also threw away an
  uncommitted fix once; a copy brought it back. /code-review found 9
  issues: the RD shown without idle growth, the 1500 line falling out
  of the chart, rank links past 25, uncached ranking scans per request,
  the refresh run three times by maintenance (and, I found, by the admin
  button and after a backfill), the full table rewrite on the main
  thread, the viewer's local date for "last match", `durationOf` twice,
  and two copies of the load effect. All were fixed. /simplify (four
  agents): `rankStatus` as the one ranking rule, the thresholds and hint
  text from `gameParse.js`, the nav section in `siteRoutes.js`,
  `last_played` dropped, the rating loaded by `PilotDetail` beside its
  requests with the chart chunk fetched early, snapshot writes in
  2,000-row chunks, the day formatted once per hour, `idlePhi` and
  `DAY_MS` shared. Skipped: deleting the two `db` alias keys (db.js
  keeps its keys) and two worker-only memory trims. PR #13 opened
  against `main`, not merged. A /pr-review pass (three reviewer agents)
  then found the first boot on a warm database leaving the ratings empty
  until the 6-hour refresh, a failed chunk leaving old ranks in memory,
  a failed chart chunk taking the whole pilot page, and tests that could
  not fail for their stated reason; all fixed (the review-fixes entry
  under Validated).
- 2026-10-08, Node 26 maintenance (Claude Opus 5.5), outside the
  numbered sessions: better-sqlite3 13.0.3 and `@types/node` 26.6.4,
  `node:26-alpine` in both Dockerfile stages, Node 26 in CI, `.nvmrc`,
  README and this file's Environment, Verification and S14 prompt. No
  server or client source changed. `origin/main` was `d7a81eb` as
  expected. One install ran the tests on 26, 24 and 22. The user's
  brief expected the Docker toolchain might turn out unused; a build
  without it failed, because npm's implicit `node-gyp rebuild` needs
  python3 and make even with nothing to compile, so only g++ is flagged
  for removal. The image grew from 567 to 599 MB (base image and
  prebuilds). The two hung vitest workers seen earlier belong to another
  worktree; none hung here. `docs/overload-fight-club-roadmap.html` still
  says the image uses Node 22 and stays as written (a dated plan).
  /code-review raised 9 items. One was fixed: the Validated entry now
  says better-sqlite3 13 sets `"gypfile": false`, which npm ignored. The
  floating `node:26-alpine` tag is the decision as written. The image
  size and g++ were already flagged. The stale S13 lines in the S14
  prompt, the version written in four places, the missing `engines` and
  the Rollback line are flagged, not fixed. PR #14 opened against
  `main`, not merged.

- 2026-10-08, S14 (Claude Opus 5.5): fight-night days run from 06:00 to
  06:00 Chicago time, by the owner's answer at the start, as one rule in
  `gameParse.js` that fight nights, the rating's snapshot day, the
  activity timeline, the share description and Last Active all use; a
  7×24 heatmap on the dashboard in place of the History tab's UTC hour
  chart; a career block on the pilot page (last time out, monthly
  sparklines, a year's activity calendar) from a new `pilot_months` table
  the stats worker builds; `/api/stats/heatmap` and
  `/api/pilot/:name/career`. Status line checked first: it said the Node
  26 PR #14 was open, but it had merged (`e35672a`), as had PR #13, with
  no owner commits after them, so S14 branched from `origin/main`;
  `10223be` is not an object here. First move: 14 files, 193 tests;
  entry 74.16 KB gzip; tsc 0. Reading the code turned up three things the
  tracker did not list. The 03:00 job ran the fight-night detector, which
  under a 06:00 rollover would judge a night that had not ended, so the
  detector now runs at 06:15. Saved recaps are keyed by UTC day and would
  have come back under a second date. And `GameList` imported both chart
  components statically, so the dashboard loaded Recharts for a tab it
  was not showing. The new day also changed what the local data says: no
  night meets the fight-night thresholds any more, because the UTC day
  that did was two evenings joined (flagged for the owner). The career
  months come out of the same loop as the career cards, and a plain
  `node` run on the local data matched the server's tables row for row.
  /code-review found 9 issues: fixed the UTC-keyed recaps (rebuilt once
  for the last 365 days), a 500 for an impossible date, a year window
  starting at UTC midnight, the career block hidden when the last night
  failed to parse, uncached year scans and a detector that could reschedule
  itself; kept the startup check (an all-unranked database already
  refreshes on every start), months for undated matches (every writer
  stores a date) and the unread `activity` field (public API, flagged).
  Two mutation checks survived at first and got tests. /simplify (four
  agents): one career line for the months and the night, the night's
  rating change in `gameParse.js`, `dayStart` and the day wording from
  `FIGHT_NIGHT_DAY`, the match-list and telemetry queries reused, one read
  per day in the recap rebuild, memoised components, shared label
  formatters and one `DetailsTable`, a route cache on the career, smaller
  answers. Skipped: one scheduler for both daily jobs, UTC monthly
  counts on the admin page, a list of derived tables, a shared delta
  component (flagged). PR #15 opened against `main`, not merged.

- 2026-10-08, S15 (Claude Opus 5.5): the server stores the tracker's
  server browser every minute (raw ticks for 30 days, an hourly rollup
  for good, the owner's answers at the start), a `/server/:ip` page with
  uptime, use, pilots in a match, the peak, peak hours on the heatmap's
  grid and the last 24 hours, and a "Matches by region" card on the
  dashboard from a `region_months` table the stats worker builds over
  every stored match. Status line checked first: PR #15 had merged
  (`aa05428`, nothing after it), so S15 branched from `origin/main`;
  `10223be` is not an object here. First move: 14 files, 220 tests;
  entry 74.26 KB gzip; tsc 0. The owner kept the fight-night thresholds
  after I laid out what the S14 rebuild does with them on the NAS's first
  start; the flag now says so. Reading the code turned up that the site
  only fetched the server browser while someone had it open, so the
  ticks needed their own timer, sharing the route's fetch and cache; and
  that no field anywhere names a region, so it comes from the keyword
  table ServerStats used for its map, now one file. A local refresh
  found two Ashburn matches stored without a server, so the region pass
  learns an IP's region from its other matches. One mutation survived
  (a server listed twice), which showed a redundant guard; it went.
  /code-review found 10 issues, all fixed (the biggest: a server dropping
  off the list kept 100% uptime, and the 24-hour chart followed the
  browser clock). /simplify (four agents) shared the month range, the
  night label and one percent formatter, derived `chart.region`, made
  `App` the one title writer, kept summaries per day and skipped three
  (flagged). Chrome checks: 100 of 100. PR #16 opened against `main`,
  not merged.

- 2026-10-09, S16 (Claude Fable 5.1): the weapon meta (kills on opponents
  per weapon family, by map and by pilot, from the matches with a kill
  log), a pilot × map win-rate grid, a 1v1 duel ladder on Glicko-2 over
  the duels alone, and CTF and Monsterball boards from the tracker's
  per-player counts; a `/ladders` view, two grids on the maps page and a
  dumbbell on the pilot page. Status line checked first: PR #16 had
  merged (`2463b20`, nothing after it), so S16 branched from
  `origin/main`; `10223be` is not an object here. First move: 17 files,
  244 tests; entry 74.46 KB gzip; tsc 0. The owner took all three
  recommendations (a duel is two pilots on different sides in a
  kill-scored match, the ladder is Glicko-2 over duels from five of them,
  the mix is a dumbbell, not a radar). Six derived tables joined the S13
  to S15 three behind one list, which the review then had the worker,
  the schema and the writer all read from, with a built marker in
  `admin_settings` instead of an empty-table check. Two shades of one
  hue failed the validator's lightness band, so the dumbbell uses the
  emphasis form (accent plus the palette's grey). /code-review found 10
  issues, all fixed (the worst: an undated duel breaking every later
  table write). /simplify (four agents) folded the worker's and writer's
  maps into the list, cut the weapon pass's replay and cached the reads;
  four findings skipped and flagged. One mutant survived at first (a
  third pilot on no team) and got its test. Chrome checks: 124 of 124.
  PR #17 opened against `main`, not merged.
- 2026-10-09, S16 review (Claude Fable 5.1, `/pr-review` on PR #17, five
  lanes, every finding validated at the ref): the built marker is cleared
  as a refresh starts writing (a failed write or a kill part-way had left
  it set, so the start skipped the refresh the comments promised);
  `restoreHot` stops and waits out a refresh under way (its diffs of the
  old tables landed in the restored ones and set the marker back);
  `DERIVED_TABLES_VERSION` carries the columns and `ensureDerivedTables`
  recreates a table whose columns differ from the list (a column change
  never reached a live database); the specialist grid's maps keyed by
  `mapKey` in JS (NOCASE and `UPPER()` fold ASCII only); dark ink on the
  two lightest `HeatTable` steps (white on `#9ec5f4` is 1.8:1); the weapon
  mix's empty state when the community total is 0 (NaN shares after a
  partial write) and an "all time, all modes" label; the specialist
  grid's map count called "matches", not "ranked matches", and the
  caption without "with a result"; `Top 50 pilots` at the board cap
  (`BOARD_ROWS`); no share description for an objective board; the
  `?board=` ids typed; one `LABEL`; `duelMatch` without its dead tail
  check; `weaponKills` keeping a pilot's first listing as the replay does;
  `teamGame` and `hasDate` moved from between a doc block and its
  function. Tests that could not fail for their names got fixtures that
  disagree with the alternative (a team score against the kills, goal
  assists and pickups, the board sort, a kept answer, a blocked table
  write, four listed pilots, the duel count), plus a recreate test and a
  "Café" map: 17 files, 265 tests; every new test fails its mutant except
  the restore's write-phase wait, which only the worker-stage ordering
  reproduces on the fixtures. Flagged for the owner, unchanged: the S17
  prompt's three binding-rule edits ("no d3", tables in
  `statsPasses.js`, no force-layout library), the marker in place of the
  empty-table check and the DDL in `statsPasses.js`, the specialist grid's
  relative colour scale.
- 2026-10-09, S17 (Claude Opus 5.5): the rivalry network and damage flow
  from the kill and damage logs, and a clutch profile. Status line checked
  first: PR #17 had merged (`5e2d02d`, nothing after it), so S17 branched
  from `origin/main`; `10223be` is not an object here. First move: 17
  files, 265 tests; entry 74.64 KB gzip; tsc 0. The owner took all six
  recommendations: no force graph and no chord diagram (a killer × victim
  heat table with a ranked list of pairs, and a dealer × target heat table
  per match and in the network), the last 60 s as late, behind the leader
  at that moment as trailing, ranked logged matches only, opponents only.
  Two derived tables joined the list (`pilot_rivals` both ways,
  `pilot_clutch` by kind), read by a new `/rivals` view, a kill-log card
  on the pilot page, and the match page's damage tab moved onto
  `HeatTable`. The local six-pilot FFA showed most kills made while
  trailing, so the clutch counts keep FFA and team games apart. A mutation
  backup written into the repo went into the first commit; /code-review
  caught it with nine other findings, all fixed or recorded. /simplify
  (four agents) cut the clutch to one replay, moved the leader-first swap
  into the query and the damage grid into `gameParse.js`; five findings
  skipped. 24 of 24 mutants fail a test (one survived at first). Chrome
  checks: 160 of 160. PR #18 opened against `main`, not merged.
- 2026-10-09, S18 (Claude Opus 5.5): the Discord webhook. Status line
  checked first: PR #18 had merged (`726e536`, nothing after it), so S18
  branched from `origin/main`; `10223be` is not an object here. First
  move: 17 files, 293 tests (the prompt said 286, S17's count before its
  review fixes); entry 74.78 KB gzip (the table said 74.77); tsc 0. The
  owner took every recommendation: the ping at 6 pilots in the server
  browser once per fight-night day, only the detector's new recaps post,
  the full embed with the rankings, the URL in the environment with an
  admin switch, one retry then drop, `SITE_URL`, a test button. A
  `discord_posts` table keeps posts from repeating; the ping rides the
  S15 tick and the recap the detector, so no new timer. /code-review
  found nine issues, among them a second ping when an evening runs past
  06:00 and pending rows that could never leave `pending`; eight fixed,
  one kept by decision. /simplify (four agents) found the new ping
  counting a server listed twice by the opposite rule to the stored
  tick; both now share `browserRows`. 32 of 33 mutants fail a test.
  Chrome checks: 62 of 66, the four failures map-image 404s from
  overloadmaps.com. Nothing posted to a real channel (the [HUMAN] task is
  open). PR #19 opened against `main`, not merged.
- 2026-10-09, S19 (Claude Opus 5.5): share cards. Status line checked
  first: PR #19 had merged (`6e7ed6d`, nothing after it), so S19 branched
  from `origin/main`; `10223be` is not an object here. First move: 18
  files, 313 tests; entry 74.80 KB gzip; tsc 0. The owner took every
  recommendation: cards for pilots, matches, fight nights and maps, one
  layout with each page's own numbers, the Fontsource fonts, drawn on
  request and kept in memory, `og:image` on the request's origin, the
  card on the Discord recap, resvg's native build. I keyed the cache by a
  hash of what the card shows rather than the stamps the answer named,
  because a new match would otherwise have redrawn every pilot's card. A
  prototype showed resvg spending 2.2 s loading system fonts the cards do
  not need; switched off, a card takes 19 to 25 ms (75 to 90 with a map
  image). Building the cards turned up "1 matches" in S8's pilot
  description (now "1 match") and gave the map page its first description.
  satori shipped 17 releases in the two days before the session, so it is
  pinned at 0.33.5, the last one over two weeks old. Looking at the PNGs
  caught a name running out of its tile; /code-review caught Cyrillic
  names drawn blank, which came down to satori falling back only across
  differently named fonts. /code-review found nine issues, eight fixed;
  /simplify (four agents) moved the wait limit to the route, served cached
  cards before any read and loaded satori lazily; six findings skipped.
  26 of 26 mutants fail a test. Chrome checks: 166 of 172, the failures
  map-image 404s from overloadmaps.com (now five maps). The image builds
  on `node:26-alpine` from resvg's musl prebuild with nothing compiled.
  PR #20 opened against `main`, not merged.
- 2026-10-10, S20 (Claude Opus 5.5): Tale of the Tape permalinks. PR #20
  had merged, so the branch came off `00fa782`. The owner took every
  recommendation but two: the head-to-head gets a `?mode=` switch, and
  the tape is linked from all four places offered. A bout is a game of
  the rating's (`boutsOf` on `ratingSides`), counted per pair, mode and
  map into `pilot_bouts`, which needed the derived-table list to learn a
  key longer than two columns. Recounting every local match by hand
  matched all 220 pairs. The first browser run showed the not-found and
  same-pilot states logging the API's own 404 and 400, so those answer
  200 like S15's unknown server; I amended the Done-when item. A 4,000-
  match mock with 32-character names pushed seven-digit damage out of its
  column at 390 px. /code-review found ten issues, seven fixed (an ORDER
  BY that read one row instead of the sum, damage-grid links a keyboard
  could not reach, a lower-case `?mode=` reading differently on the page
  than in its preview); /simplify made `pilot_rivals` a sum of the bout
  rows. 27 of 28 mutants fail a test. Chrome: 164 of 168, the failures
  the known map-image 404s. PR #21 opened against `main`, CI green on
  both jobs, not merged.

- 2026-10-10, S21 (Claude Opus 5.5): belts and achievements. PR #21 had
  merged, so the branch came off `f4d55fd`. The owner took every
  recommendation: a lineal belt per mode decided match by match, all four
  groups of achievements from every stored match in three tiers, the
  pilot page, a `/belts` view, a mark beside champions' names and the
  share cards, NEW CHAMPION in the recap embed, locked achievements with
  their progress. Neither fixture belt changes hands, so the tests add a
  match where B2AF beats BEHEMOTH. One replay in the worker writes
  `belt_reigns` and `pilot_achievements`; recounted over all 76 local
  matches it matched the tables, `pilot_stats_cache` and `pilot_clutch`
  exactly. The pilot card's fifth tile cut two labels on the first look.
  /code-review found 8 issues, 7 fixed (the worst: a CTF belt going to
  the top killer rather than the pilot with the captures); /simplify
  folded the test-only `beltReigns` into the pass and gave the card one
  sizing rule by tile count. 33 of 33 mutants fail a test. Chrome: 134 of
  140, the failures map-image 404s from overloadmaps.com, now including
  SWAT. PR #22 opened against `main`, CI green on both jobs, not merged.

## Next session prompt

Copy everything inside the fence into a new conversation.

```
Continue the overloadfight.club roadmap. This session is S23: Maps and hosts.

Repo: git@github.com:jasonjkehoe-alt/overloadfight.club.git. Work in this worktree only.
The queue is docs/ROADMAP.md. Read it in full first (a hook blocks reads over 350 lines, so read it in sections), then verify its status line against the repo before building on anything in it.

The owner rewrote history on 2026-10-06 to purge a leaked password. Work only from a clone made after that date. Before any push, check that `git merge-base --is-ancestor 10223be HEAD` fails (10223be is the pre-rewrite base); if it succeeds, stop and tell me.

Set up:
  git fetch origin
  S22 is on branch ofc/s22-fight-night-schedule, PR #23. PRs #1 to #22 are merged.
  If PR #23 is merged:
    git checkout -B ofc/s23-maps-and-hosts origin/main
  If PR #23 is still open:
    git checkout -B ofc/s23-maps-and-hosts origin/ofc/s22-fight-night-schedule
    and open the S23 PR against main anyway; say in its description that it sits on PR #23.
  Check again before opening the PR: if PR #23 merged during the session, rebase onto origin/main first.
  `git checkout -B ... origin/...` sets the remote branch as upstream; run `git branch --unset-upstream` so a bare push cannot go to main.
  The owner sometimes pushes straight to main (44e4792 during S5; ebe30dd, 35cddfd and fb4064a before S6; 95196e7, 887934e, 45cb57b and 5afcdf5 during S10). If origin/main has commits PR #23 lacks, diff them before building, and settle any conflict with your branch before opening the PR.
  source ~/.nvm/nvm.sh && nvm use 26
  npm ci
`nvm use` does not carry over between tool calls: prefix every command that needs Node with `source ~/.nvm/nvm.sh && nvm use 26 &&`.
If neither origin/main nor origin/ofc/s22-fight-night-schedule has docs/ROADMAP.md, stop and tell me.

Before building, ask me the questions the S23 entry leaves open: what Map of the Week is (the map with the most matches over the last fight-night week, the most over a rolling 7 days, one the admin picks, one drawn at random from the catalog) and where it shows (the dashboard beside the S22 schedule card, the maps page, the Discord recap or its own weekly post); what `/author/:name` shows (the author's maps with plays, kills, a trend and the top pilots on them, as the plan page says; whether a "being played right now" badge reads the shared server-browser poll; whether an author with one map gets a page) and where it is linked from (the map popup, the maps page, the match page); what the nightly map sync does (the admin's "Sync Catalog" on the 03:00 job or its own timer, what it does when overloadmaps.com is down or answers fewer maps than stored, whether it downloads images or leaves that to the image route) and whether the admin page shows when it last ran; what a host page is now that `/server/:ip` (S15) shows uptime, peak hours, the last 24 hours and the olmod version from `servers.version` (nothing more, a hosts list, a link from the maps an author's maps are played on) and whether a "host" is a server or the person who runs it; and whether any of it gets a share card (an author page in S19's layout) or a Discord post. Do not pick silently.

Read first:
- docs/ROADMAP.md, the S23 entry. That entry is the scope; it has no Done-when list yet, so write one into the tracker before building, from the entry and what the map library, the map sync, the S15 server page, the S19 cards and the admin page already have, and quote it in the PR description. Also "Canonical contract", "Open questions", the S7 decisions (the dashboard order), S8 (URLs, share tags), S9 (tokens, shared states), S14 (the fight-night day), S15 (the server page, `servers`, the minute tick), S16 (the maps page's grids, `map_weapons`, `mapKey`), S19 (share cards, CARD_VIEWS, the map card and its image), S22 (the schedule card's place on the dashboard, the feed, the reminder), and every "Flagged, not fixed" item that names S23, maps, the map sync, authors, hosts, servers, the map popup or overloadmaps.com (the map-image 404s among them).
- components/MapLibrary.tsx, components/mapLibrary/, services/mapService.ts, server/services/mapSyncService.js, server/routes/maps.js, server/db/repos/maps.js (`getMapIntel`, `mapImagePath`), server/seed/, components/ServerHistory.tsx, server/db/repos/servers.js, server/db/analytics/servers.js, components/admin/AdminMapManagement.tsx, hooks/useAdminMaps.ts, server/maintenance.js (the 03:00 job), server/lib/shareCards.js (`mapCard`), server/lib/siteRoutes.js and server/pageMeta.js. Re-count with wc -l before quoting any.

Binding decisions, do not re-derive:
- Test runner is vitest (`npx vitest run`). Tests live beside the code as *.test.js (services/apiService.test.ts for the client service); DB tests set DATA_DIR to a temp dir before importing server/db.js and share fixtures through server/testFixtures.js (`onDay`, `movedTo`). vitest's module runner defines CommonJS `module`, so check ES-module-only behaviour from a script run by `node`.
- gamelist_sample.json and game_detail_sample.json at the repo root are the test fixtures and part of the canonical contract. Moving them needs my say-so. Every map and author rule ships with a test on fixture data.
- types.ts is canonical contract: widen a type locally where a component reads a field it lacks and flag the gap; do not edit types.ts without my say-so.
- Secrets come from the environment or admin-only storage, never from tracked files, logs, error messages, API answers to non-admins or share tags.
- server/db.js is the entry and keeps its `db` keys; new reads go in the matching module under server/db/ and get a key in db.js. A new table or cache on disk gets a migration decision entry (how it is built the first time, how a restart repairs it, how to roll it back). New routes go in the matching file under server/routes/ (admin ones behind requireAuth). Do not change the public API paths (add endpoints if needed) or the `games(id, date, ip, details)` table and hot/cold split.
- server/lib/gameParse.js owns the game and day rules (FIGHT_NIGHT_DAY: America/Chicago, 06:00 rollover; `mapKey`); server/lib/matchResult.js the shared wording; server/lib/siteRoutes.js the page URLs (`urlFor`, `parseRoute`, `pageTitle`); server/lib/shareCards.js what a share card says; server/lib/fightNightSchedule.js the schedule. A page reads the same numbers the pages beside it show; never copy a rule. A pass over every stored match belongs in the stats worker or the nightly job, not on a request. A page's not-found state comes from a 200 answer, so the browser logs no error (S15, S17, S20, S21).
- A new view is React.lazy in App.tsx behind the one Suspense, with its route, title and nav section in siteRoutes.js and its share description in pageMeta.js; the dashboard's first visit loads no Recharts chunk. Record the entry size (S22 left S22_ENTRY), `GameList`'s, `MapLibrary`'s and any new chunk before and after.
- Colours, radius and small text come from designTokens.js; chart colours from `chart` there, checked with the dataviz validator for any new pair. Shared states (Loading, EmptyState, ErrorState) for loading, nothing and failure; 390 px wide at 390 px (measure `document.body.scrollWidth` with mobile emulation off, as S22 did; see its flag on `/rivals`, `/ladders` and `/maps`).
- `npx tsc --noEmit` exits 0 and CI (.github/workflows/ci.yml) runs it with the vite build and vitest on every PR. Keep all three green.
- Keep new components and modules under 500 lines (S11). `MapLibrary.tsx` is 860 lines already: put new map-page pieces in components/mapLibrary/.
- Build with `npx vite build`, never `npm run build` (its prebuild rewrites the tracked public/version.json). Node 26 everywhere (.nvmrc, the Dockerfile, CI). A new dependency gets a decision entry.
- No production database exists locally. Run `PORT=3100 DATA_DIR=/tmp/ofc-data npm start` with a built dist and wait for `Startup sync complete` in the log before checking (76 local matches at the end of S22; the server stores the tracker's server browser every minute and now checks the schedule's reminders on each tick, so a running local server makes network calls to tracker.otl.gg; a map sync calls overloadmaps.com). Check the pages' tags with curl, and the pages in headless Chrome over CDP, as S4 and S7 to S22 did (S22's harness was a CDP client over Node's WebSocket on port 9341 with its own profile and a Fetch-domain mock list that fulfils, fails or holds; write your own; read text with textContent, since innerText applies the uppercase CSS, and wrap a DOM node in `!!` before reading it by value, since CDP returns a node as undefined); never use the claude-in-chrome tools. Before launching headless Chrome, make sure no earlier instance holds the debugging port, and use your own profile. Every page logs a 401 for `/api/overload/status` without an admin session (S1); filter that one and no other. `/`, `/history`, `/maps` and `/maps/BLIZZARD` also log 404s for map images overloadmaps.com lacks (maps 62, 151, 424, 516 and 640; S18 to S22 flags); report them, do not filter them. The local schedule holds a weekly Saturday rule and a one-off from S22's checks; the admin page can delete them.
- Subagents share the session's scratch folder: give each its own subfolder and never copy from a shared path into the repo. When a mutation check edits a source file, restore it from a copy kept in the scratch folder, named by absolute path, not with `git checkout`, which also discards uncommitted work. Run `git status` after every mutation run.

Rules for this session:
- One PR, scope is the S23 entry as you wrote its Done-when list. Flag anything else in the tracker's "Flagged, not fixed".
- Add decision entries for the owner's answers, what Map of the Week is and where it shows, the author page and its URL, the nightly sync and its failure rule, what a host page adds, any share card, any Discord change, any new table, setting or cache and its migration, and any new endpoint.
- Do not merge the PR. Do not push to main.
- No Co-Authored-By or attribution trailers in commits.
- Apply the unslop skill to the PR description, the tracker prose and the page's words.
- Run /code-review on the diff before opening the PR, then /simplify, and fix what they find.
- Before ending: tick S23 in docs/ROADMAP.md, fill Validated and NOT validated with what you actually ran and its output, update the Verification table rows you exercised, correct the counts in the Status section, append to the session log, and rewrite the "Next session prompt" section for S24 using this prompt as the template. Commit that in the same PR.
- End the turn after the PR is open. Do not start S24.

Load these skills: unslop, code-review, simplify.

First move: run `npx vitest run` (S22 left S22_TESTS passing), `npx vite build 2>&1 | grep -E "assets/(index|GameList|MapLibrary|AdminPanel)-.*\.js"` (the Verification table records the entry at S22_GZIP gzip) and `npx tsc --noEmit` (0 errors), and record the results. Then ask the questions above, then write the S23 Done-when list into the tracker.
Done when: every item of the S23 Done-when list is true and checked on fixture data and in headless Chrome at 1,280 and 390 px (any new view and the maps page on local data plus Fetch-domain mocks for their states), with curl against the local server for any share tags; the dashboard, fight night, leaderboard, rankings, ladders, rivalries, belts, a tape, pilot pages, maps, the server page, match page and the admin page still work, the S19 to S21 cards still draw and the S22 feed still parses; `npx tsc --noEmit`, `npx vite build` and `npx vitest run` pass and CI is green on the S23 PR; `PORT=3100 DATA_DIR=/tmp/ofc-data npm start` still serves `/api/stats/global`, `/api/stats/pilots`, `/api/pilot/:name/stats`, `/api/stats/rankings`, `/api/stats/heatmap`, `/api/pilot/:name/career`, `/api/stats/regions`, `/api/server/:ip/history`, `/api/stats/weapons`, `/api/stats/duels`, `/api/stats/rivalries`, `/api/stats/belts`, `/api/pilot/:name/rivalry`, `/api/pilot/:name/tape/:opponent`, `/api/pilot/:name/opponents`, `/api/pilot/:name/achievements`, `/api/fight-nights/schedule`, `/fight-nights.ics`, `/api/card/pilot/:name`, `/api/card/belts` and `/api/health`; and the PR is open with the tracker updated.
```
