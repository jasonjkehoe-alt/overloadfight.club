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

S14 is on branch `ofc/s14-time-career`, based on `e35672a`, PR #15 open
against `main` and not merged, 2026-10-08 UTC.

On 2026-10-06 the repo owner purged the leaked password from history and
force-pushed `main`. Every commit SHA changed. The audits' base `10223be` is
now `2c4f174`, with identical code apart from the redacted password, so the
audits' file:line references still hold. `5516729` came after the audits and
touches only `scripts/` and `.gitignore`. Old clones still hold the
pre-rewrite history: work from a fresh clone and never push a branch that
descends from `10223be`. The local docs branch
`overload-site-redesign-13ed9872` is on the old history; do not use it.

Counts: 14 of 28 sessions done (S1 to S13 merged, S14 in PR #15).
Phase 1: 6/6. Phase 2: 5/5. Phase 3: 3/6. Phase 4: 0/11. The Node 26
maintenance item does not count toward the 28.

## Validated (as of 2026-10-08 UTC, audits at 10223be = 2c4f174 after the rewrite, S1 to S13 and Node 26 merged into `main`, `main` at e35672a, S14 on `ofc/s14-time-career`)

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
- S14, tests: `npx vitest run` passes 14 files, 216 tests (23 new).
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
  types); `GameList-*.js` 40.22 KB / 11.37 KB gzip (54.96 / 15.48
  before: `ActivityGraph` gone, the timeline chart lazy in its own
  `GlobalActivityChart-*.js`, 15.41 / 5.06); `PilotDetail-*.js` 48.74 KB
  / 12.74 KB gzip (40.33 / 9.99 before: the career block). The
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
  `SESSION_SECRET`, `REDIS_URL`, `GEMINI_API_KEY`. None are set locally.
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
| `npx vitest run` | all pass | 14 files, 216 tests pass on 26.11.1 (S14; 193 at its start) | 2026-10-08 |
| `NODE_ENV=production PORT=3100 DATA_DIR=/tmp/ofc-data npm start` without `ADMIN_PASSWORD`/`SESSION_SECRET` | exits 1 with a message naming both | exits 1, message names both | 2026-10-06 |
| `npx vite build 2>&1 \| grep -E "assets/.*\.js"` | after S4: several chunks, main under 150 KB gzip | entry 231.71 KB raw / 74.26 KB gzip, dashboard `GameList` 40.22 KB / 11.37 KB gzip and no Recharts on its first visit, pilot page `PilotDetail` 48.74 KB / 12.74 KB gzip on 26.11.1 (S14; 74.16, 15.48 and 9.99 at its start; match page `GameDetail` 40.57 KB gzip in S12; one 351.07 KB chunk before S4) | 2026-10-08 |
| `npx tsc --noEmit` | 0 errors with the React types installed | 0 errors on 26.11.1 (S14) | 2026-10-08 |
| `PORT=3100 DATA_DIR=/tmp/ofc-data npm start` then `curl -s localhost:3100/api/stats/global` | JSON body | JSON on 26.11.1, S14 on `/tmp/ofc-data`: `total_games: 40`, `/api/stats/pilots` 24 pilots, `/api/pilot/WD-40/stats` 23 games and 380 kills, `/api/stats/rankings` WD-40 first, `/api/health` ok, `/api/stats/heatmap` 38 matches, `/api/pilot/WD-40/career` 1 month and 3 days | 2026-10-08 |
| Same server, `curl -s localhost:3100/pilot/WD-40 \| grep og:` (and a match and a fight-night URL) | the page's own `og:title`, `og:description`, `og:url` | "WD-40: 20 matches, 325 kills, last match 2026-10-07."; match and fight night likewise (S8) | 2026-10-07 |
| `docker build -t ofc . && docker run -e ADMIN_PASSWORD=.. -e SESSION_SECRET=.. ofc`, then `docker inspect -f '{{.State.Health.Status}}'` | `healthy`, uid 1000 | `node:26-alpine`, arm64: healthy in 5 s, uid 1000, 599 MB (Node 26; S6 on `node:22-alpine`: about 9 s, 567 MB) | 2026-10-08 |
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
      by S18).
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
- [ ] **S15 Server history** (S). Persist server-browser snapshots; `/server/:ip`
      page with uptime, peak hours, average players; regional share over time.
- [ ] **S16 Weapon meta and ladders** (M). Weapon × map heatmap; weapon mix
      radar vs community; pilot × map grid; 1v1 duel ladder; CTF and
      Monsterball objective leaderboards.
- [ ] **S17 Rivalry network and damage flow** (L). Force graph from real kill
      edges; chord diagram of damage per match and career; clutch profile
      (first blood, late kills, kills while trailing).

### Phase 4: into Discord, and a reason to come back

- [ ] **S18 Discord webhook** (S). Recap embed on save; "it's on" ping once per
      evening; webhook URL as an admin setting.
- [ ] **S19 OG share cards** (M). PNG cards for pilot, match, fight night, map
      and tape URLs via satori + resvg.
- [ ] **S20 Tale of the Tape permalinks** (M). `/tape/:a/:b`.
- [ ] **S21 Belts and achievements** (M).
- [ ] **S22 Fight-night schedule and iCal** (S). Events table, `.ics` feed,
      dashboard countdown; remove the calendar iframe.
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
  `initializeFightNights`): it deletes the recaps of the last 365 days,
  whose matches are still in hot storage, and saves a recap for every
  fight-night day in that year that meets the thresholds (every one, not
  only the latest 10 the empty-table scan makes), one day's read at a time
  with requests let in between. Then it writes `fight_night_day_rule =
  America/Chicago from 6:00` to `admin_settings`, so it never runs again
  for this rule. Recaps older than 365 days stay under their UTC dates:
  their matches are in cold storage, which `getGamesForDate` does not
  read. On the local data the UTC recap for 2026-10-07 (19 matches, 14
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
  teaser shows nothing until a night qualifies.
- (S14) Recaps older than 365 days keep their UTC dates (see the recap
  decision): their matches are in cold storage.
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

## Open questions

- None open. The time zone for fight-night days was settled by the owner at
  the start of S14: America/Chicago, with the day rolling over at 06:00 (see
  the S14 decisions).

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

## Next session prompt

Copy everything inside the fence into a new conversation.

```
Continue the overloadfight.club roadmap. This session is S15: server history.

Repo: git@github.com:jasonjkehoe-alt/overloadfight.club.git. Work in this worktree only.
The queue is docs/ROADMAP.md. Read it in full first, then verify its status line against the repo before building on anything in it.

The owner rewrote history on 2026-10-06 to purge a leaked password. Work only from a clone made after that date. Before any push, check that `git merge-base --is-ancestor 10223be HEAD` fails (10223be is the pre-rewrite base); if it succeeds, stop and tell me.

Set up:
  git fetch origin
  S14 is on branch ofc/s14-time-career, PR #15. PRs #1 to #14 are merged.
  If PR #15 is merged:
    git checkout -B ofc/s15-server-history origin/main
  If PR #15 is still open:
    git checkout -B ofc/s15-server-history origin/ofc/s14-time-career
    and open the S15 PR against main anyway; say in its description that it sits on PR #15.
  Check again before opening the PR: if PR #15 merged during the session, rebase onto origin/main first.
  `git checkout -B ... origin/...` sets the remote branch as upstream; run `git branch --unset-upstream` so a bare push cannot go to main.
  The owner sometimes pushes straight to main (44e4792 during S5; ebe30dd, 35cddfd and fb4064a before S6; 95196e7, 887934e, 45cb57b and 5afcdf5 during S10). If origin/main has commits PR #15 lacks, diff them before building, and settle any conflict with your branch before opening the PR.
  source ~/.nvm/nvm.sh && nvm use 26
  npm ci
`nvm use` does not carry over between tool calls: prefix every command that needs Node with `source ~/.nvm/nvm.sh && nvm use 26 &&`.
If neither origin/main nor origin/ofc/s14-time-career has docs/ROADMAP.md, stop and tell me.

Before building, ask me two questions the S15 entry leaves open: how often to snapshot the server browser (the shared poll runs every 10 s in the browser; the server's own fetch is what gets stored) and how long to keep the snapshots (raw rows against an hourly rollup). Also tell me, as S14 flagged, that no local fight-night day meets the thresholds under the 06:00 Chicago day, and ask whether to lower them in this session or leave them. Do not pick silently.

Read first:
- docs/ROADMAP.md, the S15 entry. That entry is the scope; it has no Done-when list yet, so write one into the tracker before building, from the entry and what the dashboard, the live page and the server browser already have, and quote it in the PR description. Also "Canonical contract", "Open questions", the S4 decisions (the shared poll in hooks/useServerBrowser.ts, /api/browser), S5 (the stats worker, the hot/cold split), S6 (the 03:00 nightly job, backups, TZ=America/Chicago), S7 (the dashboard order, the live page and JoinIp, favorites), S8 (URL state, siteRoutes, share tags), S9 (tokens, States), S10 (focus and tap rules, tables in scroll wrappers), S11 (server/db/ and server/routes/ layout, hooks and child folders, apiService), S12 (`chart` in designTokens.js and the dataviz validator), S13 (useLoad, navSection, lazy chart chunks behind their own Suspense), S14 (fight-night days in gameParse.js: FIGHT_NIGHT_DAY, fightNightDay, dayBounds, dayStart, localClock, DAY_HOURS, heatmapCells; chart.ramp and rampColor; the dashboard heatmap; tableChanges/writeChanges for derived tables; the recap rebuild), every "Flagged, not fixed" item that names S15, servers, the server browser, the live page, regions or peak hours (decide for each whether S15 covers it; flag the rest again), and the Postmortems.
- server/routes/browser.js, the server-browser fetch it proxies, hooks/useServerBrowser.ts, components/GameList.tsx (the server browser), components/ServerStats.tsx, components/ServerActivitySparkline.tsx, components/LiveGameDetail.tsx, server/db/analytics/global.js (getServerActivityStats, getActiveServerIps, the heatmap), server/lib/gameParse.js (the S14 day rules), server/lib/siteRoutes.js, server/pageMeta.js, server/db/migrations.js, server/maintenance.js, designTokens.js and the two sample files. Re-count with wc -l before quoting any.

Binding decisions, do not re-derive:
- Test runner is vitest (`npx vitest run`). Tests live beside the code as *.test.js (services/apiService.test.ts for the client service); DB tests set DATA_DIR to a temp dir before importing server/db.js and share fixtures through server/testFixtures.js. vitest's module runner defines CommonJS `module`, so check ES-module-only behaviour from a script run by `node`.
- gamelist_sample.json and game_detail_sample.json at the repo root are the test fixtures and part of the canonical contract. Moving them needs my say-so. Every stat or chart number ships with a test on fixture data.
- types.ts is canonical contract: widen a type locally where a component reads a field it lacks and flag the gap; do not edit types.ts without my say-so.
- server/db.js is the entry and keeps its `db` keys; new reads go in the matching module under server/db/ and get a key in db.js. New tables go in server/db/migrations.js beside `games`, with a migration decision entry (how it is built the first time, how a restart repairs it, how to roll it back). New routes go in the matching file under server/routes/. Do not change the public API paths (add endpoints if needed) or the `games(id, date, ip, details)` table and hot/cold split.
- server/lib/gameParse.js owns the game rules, the day rule included: a server's day, peak hour or uptime counts days and hours with fightNightDay, dayBounds and localClock (America/Chicago, 06:00 rollover, the owner's S14 answer). Never copy a rule. A pass over every stored match belongs in the stats worker or the nightly job, not on a request.
- server/lib/siteRoutes.js owns page URLs, titles and the nav section; a new view (/server/:ip) gets its route, title and share description there and in server/pageMeta.js. Internal navigation is components/Link.tsx and URL state goes through useQueryParam/useQueryText/setQueryParams (S8, S10).
- Dialogs use hooks/useDialog.ts. Colours, radius and small text come from designTokens.js through Tailwind; chart colours read `chart` from designTokens.js (chart.ramp for counts) and any new series colour or ramp passes the dataviz validator against surface-card; the focus ring and tap state are the rules in index.css (S9, S10, S12, S14).
- Loading, empty and failed states use Loading, EmptyState and ErrorState from components/States.tsx (hooks/useLoad.ts for a fetch with retry); keep both error boundaries (S9).
- `npx tsc --noEmit` exits 0 and CI (.github/workflows/ci.yml) runs it with the vite build and vitest on every PR. Keep all three green.
- Every view in App.tsx is React.lazy behind one Suspense; one shared server-browser poll lives in hooks/useServerBrowser.ts; AudioEditor mounts only on its tab (S4). Charts stay out of the entry chunk, and the dashboard's first visit loads no Recharts chunk (S14); record the entry size (S14 left 231.71 KB raw / 74.26 KB gzip), the dashboard's GameList chunk (40.22 KB / 11.37 KB gzip) and any new view's chunk, before and after.
- Keep new components and hooks under 500 lines (S11); put a component's hooks in hooks/ and its children in a folder beside it.
- Build with `npx vite build`, never `npm run build` (its prebuild rewrites the tracked public/version.json). Node 26 everywhere (.nvmrc, the Dockerfile, CI).
- Do not add a router library, state library, ORM or component library. Recharts is already a dependency; prefer it, or hand-drawn SVG and tables as S14 did, to a new chart library.
- No production database exists locally. Run `PORT=3100 DATA_DIR=/tmp/ofc-data npm start` with a built dist and wait for `Startup sync complete` in the log before checking (40 local matches and one forced recap for 2026-10-06 at the end of S14). Check the UI in headless Chrome over CDP, as S4 and S7 to S14 did; never use the claude-in-chrome tools. Before launching headless Chrome, make sure no earlier instance holds the debugging port. Mock answers through CDP's Fetch domain where you need more servers, snapshots or days than the local data has. Subagents share the session's scratch folder: give each its own subfolder and never copy from a shared path into the repo. When a mutation check edits a source file, restore it from a copy, not with `git checkout`, which also discards uncommitted work.

Rules for this session:
- One PR, scope is the S15 entry as you wrote its Done-when list. Flag anything else in the tracker's "Flagged, not fixed".
- Add decision entries for the snapshot cadence and retention (the owner's answers), the new table and its migration, how uptime, peak hours and average players are counted (and in which day and hour), the regions and where each server's region comes from, the /server/:ip page and its URL state, and any new endpoint.
- Do not merge the PR. Do not push to main.
- No Co-Authored-By or attribution trailers in commits.
- Apply the unslop skill to the PR description and tracker prose.
- Run /code-review on the diff before opening the PR, then /simplify, and fix what they find.
- Before ending: tick S15 in docs/ROADMAP.md, fill Validated and NOT validated with what you actually ran and its output, update the Verification table rows you exercised, correct the counts in the Status section, append to the session log, and rewrite the "Next session prompt" section for S16 using this prompt as the template. Commit that in the same PR.
- End the turn after the PR is open. Do not start S16.

Load these skills: unslop, code-review, simplify, dataviz.

First move: run `npx vitest run` (S14 left 14 files, 216 tests passing), `npx vite build 2>&1 | grep -E "assets/(index|GameList|LiveGameDetail)-.*\.js"` (the Verification table records the entry at 74.26 KB gzip) and `npx tsc --noEmit` (0 errors), and record the results. Then ask the questions above, then write the S15 Done-when list into the tracker.
Done when: every item of the S15 Done-when list is true and checked on fixture data and in headless Chrome (a /server/:ip page and whatever the dashboard gains, at 1,280 and 390 px), the dashboard, the server browser, the live page, leaderboard, rankings, pilot pages and match page still work, `npx tsc --noEmit`, `npx vite build` and `npx vitest run` pass and CI is green on the S15 PR, `PORT=3100 DATA_DIR=/tmp/ofc-data npm start` still serves `/api/stats/global`, `/api/stats/pilots`, `/api/pilot/:name/stats`, `/api/stats/rankings`, `/api/stats/heatmap`, `/api/pilot/:name/career` and `/api/health`, and the PR is open with the tracker updated.
```
