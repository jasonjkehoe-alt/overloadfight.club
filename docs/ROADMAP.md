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

S10 is on branch `ofc/s10-glossary-a11y-mobile`, rebased onto
`5afcdf5`, PR #10 open against `main` and not merged, 2026-10-07 UTC.

On 2026-10-06 the repo owner purged the leaked password from history and
force-pushed `main`. Every commit SHA changed. The audits' base `10223be` is
now `2c4f174`, with identical code apart from the redacted password, so the
audits' file:line references still hold. `5516729` came after the audits and
touches only `scripts/` and `.gitignore`. Old clones still hold the
pre-rewrite history: work from a fresh clone and never push a branch that
descends from `10223be`. The local docs branch
`overload-site-redesign-13ed9872` is on the old history; do not use it.

Counts: 10 of 28 sessions done (S1 to S9 merged, PR for S10 open).
Phase 1: 6/6. Phase 2: 4/5. Phase 3: 0/6. Phase 4: 0/11.

## Validated (as of 2026-10-07 UTC, audits at 10223be = 2c4f174 after the rewrite, S1 to S9 merged into `main`, `main` at 5afcdf5, S10 on `ofc/s10-glossary-a11y-mobile`)

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
- Node: use 22 (`nvm use 22`; 22.17.0 is installed). Node 24 cannot compile
  `better-sqlite3`.
- Install: `npm ci`. For a client-only build on Node 24, `npm ci
  --ignore-scripts` works.
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
| `nvm use 22 && npm ci` | installs, `better-sqlite3` compiles | compiles on 22.17.0 (S4) | 2026-10-06 |
| `npx vitest run` | all pass | 13 files, 126 tests pass (S10, after the rebase onto the owner's `5afcdf5`) | 2026-10-07 |
| `NODE_ENV=production PORT=3100 DATA_DIR=/tmp/ofc-data npm start` without `ADMIN_PASSWORD`/`SESSION_SECRET` | exits 1 with a message naming both | exits 1, message names both | 2026-10-06 |
| `npx vite build 2>&1 \| grep -E "assets/.*\.js"` | after S4: several chunks, main under 150 KB gzip | entry 230.93 KB raw / 73.74 KB gzip (S10; 73.64 KB at S10's start, one 351.07 KB chunk before S4) | 2026-10-07 |
| `npx tsc --noEmit` | 0 errors with the React types installed | 0 errors, JSX typed (S10) | 2026-10-07 |
| `PORT=3100 DATA_DIR=/tmp/ofc-data npm start` then `curl -s localhost:3100/api/stats/global` | JSON body | JSON, `total_games: 30`, dev mode without secrets; `/api/stats/pilots` 21 pilots, `/api/pilot/WD-40/stats` 23 games, `/api/health` ok (S10) | 2026-10-07 |
| Same server, `curl -s localhost:3100/pilot/WD-40 \| grep og:` (and a match and a fight-night URL) | the page's own `og:title`, `og:description`, `og:url` | "WD-40: 20 matches, 325 kills, last match 2026-10-07."; match and fight night likewise (S8) | 2026-10-07 |
| `docker build -t ofc . && docker run -e ADMIN_PASSWORD=.. -e SESSION_SECRET=.. ofc`, then `docker inspect -f '{{.State.Health.Status}}'` | `healthy`, uid 1000 | healthy in about 9 s, uid 1000, 567 MB (S6) | 2026-10-07 |
| Same container, `docker stop` | exits 0 in well under 10 s, `[Shutdown] Done.` logged | under 1 s, exit 0, no `-wal` left (S6) | 2026-10-07 |
| `npx vitest run server/gamePlayers.test.js` (the query-plan tests) | pilot queries on `idx_game_players_name_date`, dated leaderboard on `idx_game_players_date` | both, covering for the pilot lookups, in hot and cold (S5) | 2026-10-07 |
| Same server, `curl -w "%{time_total}" "localhost:3100/api/games?page=1"` more than 30 s after the last sync | answers from the DB, sync logged after | 200 in 0.0019 s, `[Sync] Fetching page 1` logged after it (S4) | 2026-10-06 |
| Same server, `curl -D - -H "Accept-Encoding: gzip, deflate, br" localhost:3100/ffmpeg/ffmpeg-core.wasm` | `Content-Encoding: br`, short cache | br, 8,367,469 bytes, `public, max-age=3600` (S4) | 2026-10-06 |
| Headless Chrome over CDP on the same server serving `dist/` (S7 scripts: dashboard order, nav, favorites across a reload, copy button, match result) | live section above the teaser; Fight Night in the nav; "Copied"; winner, score or podium, duration and result line | all seen, see the S7 Validated entry | 2026-10-07 |
| Headless Chrome over CDP, S8 scripts (real mouse clicks: plain, middle, Cmd, Ctrl, Shift; reload and back on each piece of URL state; a held `/api/game/<id>` for the stale match) | new tab on middle/Cmd click, same document on a plain click, a title per route, state back after reload and back, no stale match | all seen, see the S8 Validated entry | 2026-10-07 |
| Headless Chrome over CDP, S9 scripts (full-page shots of five pages at 1,280 and 390 px with `/api/browser` and the live game replayed; every view's states forced with the Fetch domain; a component made to throw in a view and in `Layout`) | shots the same apart from the token changes; Loading, EmptyState and ErrorState where each view loads, is empty or fails; the recovery screen, with the nav for a view and without it for `Layout` | all seen, 39 of 39 states, see the S9 Validated entry | 2026-10-07 |
| Dead-class script: each `className` token looked up in `dist/assets/index-*.css` | nothing but tab names compared in expressions | as expected (S9) | 2026-10-07 |
| Headless Chrome over CDP, S10 `checks.mjs` (Combat Ratio and Lethality on both pages; Tab through ten pages reading the ring; Tab then Enter on each kind of row; every dialog opened from the keyboard and closed with Escape; roster and map pages across Next, reload, back and the popup; 21 routes at 390 px; a synthesized tap on six kinds of target) | same numbers; every focusable reached with a ring; Enter opens the row; dialogs labelled, focus back on the opener; the page in the URL; nothing wider than 390; opacity or cover change while pressed | all seen, see the S10 Validated entry | 2026-10-07 |
| S10 scratch scripts: `uistrings.cjs` (user-visible strings by TypeScript AST) piped to `glossary.sh`; `tables.cjs`; `clickables.cjs` | 0 variant words for each of the six terms; 13 of 13 tables wrapped; no clickable non-control | as expected (S10) | 2026-10-07 |
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
- [ ] **S11 Split the giants** (L). Done when: `server/db.js` is split into
      connection, migrations, repos and analytics modules with unchanged
      exports; `routes.js` is one file per resource; `PilotSettingsPanel`,
      `AudioEditor`, `WebImportModal` and `AdminPanel` are each under 500
      lines with hooks extracted; `AdminPanel` uses `apiService` instead of
      axios.

### Phase 3: show the data like a fight

- [ ] **S12 Fight card, momentum, scrubber** (M). Match page: momentum chart
      with lead changes and weapon-colored kills; a time scrubber that replays
      the scoreboard from `kills[].time`.
- [ ] **S13 Rating and power rankings** (M). Glicko-2 from placement and
      corrected team results; nightly snapshot table; rating history line on
      the profile; `PowerRankings` view with weekly movement.
- [ ] **S14 Time and career** (M). 7×24 local-time heatmap on the dashboard;
      fight-night day boundary in the configured time zone; profile career
      arc sparklines, activity calendar and "last time out" block.
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
  still start as root).
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
  `node:22-alpine`, so both workflows run on Node 22.
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
  assists for a pilot with no deaths). The archive's hall-of-fame tab
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

## Rollback

Each session is one PR. Rollback is `git revert` of that merge commit followed
by a NAS image pull. After S6 the files in `data/` belong to uid 1000; an
older image runs as root and can still write them, so no chown back is
needed. `data/backups/` can stay or be deleted. S5 adds `game_players` to both database files; after
the revert and the pull, run `DROP TABLE game_players;` on `tracker.db` and
on `cold_storage.db` (see the S5 migration decision). The JSON blobs remain
the source of truth, so no data is lost.

## Open questions

- The time zone for fight-night day boundaries (US Central is the likely
  answer given the server names). Decided in S14; ask the user at the start of
  that session.

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

### better-sqlite3 11.8 on Node 24

`npm ci` fails compiling `better-sqlite3@11.8.1` on Node 24.6. Use `nvm use 22`
(22.17.0 installed) or `npm ci --ignore-scripts` for a client-only build.
Measured 2026-10-06.

### `nvm use 22` does not carry over between tool calls

Each Bash tool call starts a fresh shell on the default Node (24). Running
vitest there fails to load `better-sqlite3` (`NODE_MODULE_VERSION 127` vs
`137`). Prefix every command that needs Node with `source ~/.nvm/nvm.sh &&
nvm use 22 &&`. Seen 2026-10-06 in S3.

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

## Next session prompt

Copy everything inside the fence into a new conversation.

```
Continue the overloadfight.club roadmap. This session is S11: split the giants.

Repo: git@github.com:jasonjkehoe-alt/overloadfight.club.git. Work in this worktree only.
The queue is docs/ROADMAP.md. Read it in full first, then verify its status line against the repo before building on anything in it.

The owner rewrote history on 2026-10-06 to purge a leaked password. Work only from a clone made after that date. Before any push, check that `git merge-base --is-ancestor 10223be HEAD` fails (10223be is the pre-rewrite base); if it succeeds, stop and tell me.

Set up:
  git fetch origin
  S10 is on branch ofc/s10-glossary-a11y-mobile, PR #10. PRs #1 to #9 are merged.
  If PR #10 is merged:
    git checkout -B ofc/s11-split-giants origin/main
  If PR #10 is still open:
    git checkout -B ofc/s11-split-giants origin/ofc/s10-glossary-a11y-mobile
    and open the S11 PR against main anyway; say in its description that it sits on PR #10.
  Check again before opening the PR: if PR #10 merged during the session, rebase onto origin/main first.
  The owner sometimes pushes straight to main (44e4792 during S5; ebe30dd, 35cddfd and fb4064a before S6; 95196e7, 887934e, 45cb57b and 5afcdf5 during S10, the last one while the S10 PR was being prepared). If origin/main has commits PR #10 lacks, diff them before building, and settle any conflict with your branch before opening the PR.
  source ~/.nvm/nvm.sh && nvm use 22
  npm ci
`nvm use` does not carry over between tool calls: prefix every command that needs Node with `source ~/.nvm/nvm.sh && nvm use 22 &&`.
If neither origin/main nor origin/ofc/s10-glossary-a11y-mobile has docs/ROADMAP.md, stop and tell me.

Read first:
- docs/ROADMAP.md, the S11 entry and its Done-when list. That list is the scope. Also "Canonical contract", the decisions on db.js (S3's named `db` object, S4's WAL and refresh, S5's game_players, migration, worker and cold move, S6's backups and shutdown), the S8 link pattern, the S10 entries (useDialog in WebImportModal and PilotSettingsPanel, LinkCell, the focus and tap rules, usePage and the setter's second argument, combatRatio and lethality), every "Flagged, not fixed" item that names S11, db.js, routes.js, dead code, overloadBridge.js, apiService or the four components (decide for each whether the Done-when list covers it; flag the rest again), and the Postmortems.
- server/db.js (2,520 lines at S10), server/routes.js (964), server/index.js, server/lib/statsPasses.js, server/statsWorker.js, services/apiService.ts, and the four components: PilotSettingsPanel.tsx (2,119), AudioEditor.tsx (1,353), WebImportModal.tsx (1,332), AdminPanel.tsx (919 at S10's start, more after the owner's 887934e; imports axios). Re-count with wc -l before quoting any. components/MatchReplay.tsx (1,970 lines, pushed by the owner during S10) is not on the Done-when list; flag it, do not split it, unless I say otherwise.

Binding decisions, do not re-derive:
- Test runner is vitest (`npx vitest run`). Tests live beside the code as *.test.js; DB tests set DATA_DIR to a temp dir before importing server/db.js and share fixtures through server/testFixtures.js. vitest's module runner defines CommonJS `module`, so check ES-module-only behaviour (an export list, a circular import) from a script run by `node`.
- gamelist_sample.json and game_detail_sample.json at the repo root are the test fixtures and part of the canonical contract. Moving them needs my say-so.
- types.ts is canonical contract: widen a type locally where a component reads a field it lacks and flag the gap; do not edit types.ts without my say-so.
- "Unchanged exports" means every module that imports server/db.js (routes, index, services, workers, scripts, tests) keeps working without edits to what it imports: db.js stays the entry and re-exports. Do not change the public API paths (add endpoints if needed) or the `games(id, date, ip, details)` table and hot/cold split.
- server/lib/gameParse.js owns the game rules, including combatRatio and lethality; server/lib/siteRoutes.js owns page URLs and titles; server/lib/matchResult.js the result sentence. Never copy a rule while moving code.
- Internal navigation is components/Link.tsx (Link, CellLink, LinkCell) and URL state goes through useQueryParam/useQueryText/setQueryParams; no navigation callbacks or local state that duplicates the URL (S8, S10).
- Dialogs use hooks/useDialog.ts (role, label, Escape, focus return); keep it on WebImportModal and PilotSettingsPanel's rebind dialog when you split them (S10).
- Colours, radius and small text come from designTokens.js through Tailwind; the focus ring and tap state are the rules in index.css, and `@tailwind variants` stays before them (S9, S10).
- Loading, empty and failed states use Loading, EmptyState and ErrorState from components/States.tsx; keep both error boundaries (S9).
- `npx tsc --noEmit` exits 0 and CI (.github/workflows/ci.yml) runs it with the vite build and vitest on every PR. Keep all three green.
- Every view in App.tsx is React.lazy behind one Suspense; one shared server-browser poll lives in hooks/useServerBrowser.ts; AudioEditor mounts only on its tab (S4). Keep them.
- Build with `npx vite build`, never `npm run build` (its prebuild rewrites the tracked public/version.json). Node 22 everywhere: better-sqlite3 11.8 does not compile on Node 24.
- Do not add a router library, state library, ORM or component library. Tailwind utility classes, functional React, ES modules on the server.
- No production database exists locally. Run `PORT=3100 DATA_DIR=/tmp/ofc-data npm start` with a built dist and wait for `Startup sync complete` in the log before checking. Check the UI in headless Chrome over CDP, as S4 and S7 to S10 did; never use the claude-in-chrome tools. Before launching headless Chrome, make sure no earlier instance holds the debugging port. S10 mocked `/api/browser`, `/api/game/<ip>` and `/api/overload/*` with CDP's Fetch domain (one Fetch.enable for all patterns) to open the taunt dialogs and the pilot settings without an Overload folder; do the same, and mock an admin session for AdminPanel.

Rules for this session:
- One PR, scope is the S11 Done-when list only. Flag anything else in the tracker's "Flagged, not fixed".
- Behaviour does not change. Add decision entries for the module boundaries in server/ (which functions and prepared statements went where, and how db.js re-exports them), the route files and how they mount, the hooks extracted from each component and what each owns, and the switch from axios to apiService in AdminPanel (which new apiService functions, error handling).
- Do not merge the PR. Do not push to main.
- No Co-Authored-By or attribution trailers in commits.
- Apply the unslop skill to the PR description and tracker prose.
- Run /code-review on the diff before opening the PR, then /simplify, and fix what they find.
- Before ending: tick S11 in docs/ROADMAP.md, fill Validated and NOT validated with what you actually ran and its output, update the Verification table rows you exercised, correct the counts in the Status section, append to the session log, and rewrite the "Next session prompt" section for S12 using this prompt as the template. Commit that in the same PR.
- End the turn after the PR is open. Do not start S12.

Load these skills: unslop, code-review, simplify.

First move: run `npx vitest run` (S10 left 13 files, 126 tests passing), `npx vite build 2>&1 | grep -E "assets/index-.*\.js"` (the Verification table records the entry at 73.74 KB gzip) and `npx tsc --noEmit` (0 errors), and record the results. Then record what must not change: from a script run by `node`, the sorted export names of server/db.js (and the keys of its `db` object); the route list (method and path) that server/index.js mounts; `wc -l` of the six files; and the JSON of `/api/stats/global`, `/api/stats/pilots?source=all`, `/api/pilot/WD-40/stats`, `/api/pilot/WD-40/ppi` and `/api/games?page=1` from the running server.
Done when: every item in the S11 Done-when list is true (db.js split into connection, migrations, repos and analytics modules with the same export names and `db` keys as before, shown by the node script; routes.js one file per resource with the same route list; PilotSettingsPanel, AudioEditor, WebImportModal and AdminPanel each under 500 lines by wc -l with hooks extracted; no axios import in AdminPanel), the five API answers are byte-identical before and after on the same data dir (or every difference explained), the taunt tools, pilot settings and admin page (mocked session) work in headless Chrome (S10's dialog checks still pass, the editor's Create tab loads, admin stats load), `npx tsc --noEmit`, `npx vite build` and `npx vitest run` pass and CI is green on the S11 PR, `PORT=3100 DATA_DIR=/tmp/ofc-data npm start` still serves `/api/stats/global`, `/api/stats/pilots`, `/api/pilot/:name/stats` and `/api/health`, and the PR is open with the tracker updated.
```
