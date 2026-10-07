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
order on 2026-10-07 UTC; `main` is at `2b05787`, the PR #3 merge). Their
branches stacked on each other, so `main`'s tree equals S3's tip
`3c79f97`.

S4 is on branch `ofc/s04-bundle-polling`, based on `origin/main` at
`2b05787`, PR #4 open and not merged, 2026-10-07 UTC. It started on S3's
branch while PR #3 was open and was rebased onto `main` once the three PRs
merged during the session.

On 2026-10-06 the repo owner purged the leaked password from history and
force-pushed `main`. Every commit SHA changed. The audits' base `10223be` is
now `2c4f174`, with identical code apart from the redacted password, so the
audits' file:line references still hold. `5516729` came after the audits and
touches only `scripts/` and `.gitignore`. Old clones still hold the
pre-rewrite history: work from a fresh clone and never push a branch that
descends from `10223be`. The local docs branch
`overload-site-redesign-13ed9872` is on the old history; do not use it.

Counts: 4 of 28 sessions done (S1 to S3 merged, S4's PR open). Phase 1: 4/6. Phase 2:
0/5. Phase 3: 0/6. Phase 4: 0/11.

## Validated (as of 2026-10-07 UTC, audits at 10223be = 2c4f174 after the rewrite, S1 to S3 merged into `main` at 2b05787, S4 on `ofc/s04-bundle-polling`)

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
- The Docker image was not built or run with the new compose files.

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
| `npx vitest run` | all pass | 5 files, 56 tests pass (S4) | 2026-10-06 |
| `NODE_ENV=production PORT=3100 DATA_DIR=/tmp/ofc-data npm start` without `ADMIN_PASSWORD`/`SESSION_SECRET` | exits 1 with a message naming both | exits 1, message names both | 2026-10-06 |
| `npx vite build 2>&1 \| grep -E "assets/.*\.js"` | after S4: several chunks, main under 150 KB gzip | 46 chunks, entry `index-*.js` 232.15 KB raw / 72.84 KB gzip (S4; was one chunk, 351.07 KB gzip) | 2026-10-06 |
| `npx tsc --noEmit` | 0 errors (meaningful only after S6 installs React types) | 0 errors, JSX untyped (S4) | 2026-10-06 |
| `PORT=3100 DATA_DIR=/tmp/ofc-data npm start` then `curl -s localhost:3100/api/stats/global` | JSON body | JSON, `total_games: 25`, dev mode without secrets (S4) | 2026-10-06 |
| Same server, `curl -w "%{time_total}" "localhost:3100/api/games?page=1"` more than 30 s after the last sync | answers from the DB, sync logged after | 200 in 0.0019 s, `[Sync] Fetching page 1` logged after it (S4) | 2026-10-06 |
| Same server, `curl -D - -H "Accept-Encoding: gzip, deflate, br" localhost:3100/ffmpeg/ffmpeg-core.wasm` | `Content-Encoding: br`, short cache | br, 8,367,469 bytes, `public, max-age=3600` (S4) | 2026-10-06 |
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
- [ ] **S5 Indexed player table** (L). Done when: a `game_players` table
      (`game_id, date, name COLLATE NOCASE, team, kills, deaths, assists,
      damage, mode, map`) with indexes on `(name, date)` and `(date)` is
      populated by `saveGames` and a one-time migration; `/api/pilot/:name/*`
      and the leaderboard read from it; `EXPLAIN QUERY PLAN` shows index use;
      the remaining full passes run in a `worker_threads` worker on a
      read-only connection; the cold-storage move is atomic.
- [ ] **S6 Ops and types** (M). Done when: a nightly `db.backup()` of both
      databases with 7-day rotation; compose has log rotation and a healthcheck
      that hits an endpoint that queries the DB; `SIGTERM` closes the DB; the
      Dockerfile is multi-stage, non-root, `npm ci`, no build tools in the final
      image; `@types/react` installed and `tsc --noEmit` meaningful; CI runs
      `tsc`, `vite build` and tests on pull requests; 25 orphaned scripts and
      the root sample/leftover files are removed or moved (`new_map_data.json`
      and `maps_export.csv` move to `server/seed/`); `.github` pins Node 22.

### Phase 2: one system, one voice

- [ ] **S7 Live-first dashboard and match result** (M). Done when: the
      dashboard shows live servers and online pilots above a one-line Fight
      Night teaser; Fight Night is in the nav; the live match page shows the
      IP with a copy button that confirms; the match page shows final score or
      podium, winner, real duration and a result line; server favorites
      persist in `localStorage`; every hard-coded number listed in
      `docs/audit/ux.md` is wired to the API or removed.
- [ ] **S8 Links, titles, URL state** (M). Done when: internal navigation uses
      `<a href>` with click interception; `document.title` is set per route;
      the server catch-all injects `og:title`, `og:description` and
      `og:url` per route; tabs, filters, the map popup and the fight-night
      date are in the URL; back buttons call `history.back()`; the stale match
      flash is gone.
- [ ] **S9 Design tokens and shared states** (L). Done when:
      `tailwind.config.js` defines the palette (one orange, one hover orange,
      three surface blacks, one border), radius and type scale; dead classes
      are removed; `Loading`, `EmptyState`, `ErrorState` components exist and
      every view uses them; a top-level `ErrorBoundary` wraps the app; at
      least the dashboard, pilots, match and live pages are migrated to
      tokens.
- [ ] **S10 Glossary, accessibility, mobile** (M). Done when: one term each for
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
  S6.
- `cacheService.js` tries Redis on every boot and never sweeps expired keys.
  S4 left it; S6.
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
  `game_players` table or worker is the place to fix it.
- (S2) `isPilotFirstSeenOnDate` scans hot and cold storage for every pilot
  who looks new, on every recap regeneration.
- (S2) The LIKE prefilter in `getPilotTelemetry`, `getPilotBreakdown` and
  `isPilotFirstSeenOnDate` misses names stored with surrounding spaces or
  differing only in non-ASCII case, which `pilotKey` would group.
  `getGamesByPilot` and `countGamesByPilot` still use an unescaped LIKE
  with a NOCASE check. Cache lookups use `name = ? COLLATE NOCASE`.
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
- (S2) Pilot pages still mix hot and cold games: telemetry and breakdown
  read cold storage only when hot has fewer than 5 matches (audit item 8).

- (S3) `saveColdGamesBatch` (archive ingest) and `updateGameDetails` (the
  `/api/game/:id` refresh) still overwrite `details` unconditionally.
  Pointing them at `upsertGameSql` changes their behaviour, so it was left.
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
  S5's worker is the natural place.
- (S4) The restore only covers `tracker.db`, and the admin page still says
  to restart afterwards. Cold storage has no backup. S6 owns backups.
- (S4) `App.tsx` now has three copies of the orange spinner markup. S9's
  `Loading` component replaces them.
- (S4) `/api/games` pages past the stored count: the read-through sync
  stores the tracker's page N, but the response reads local page N by
  offset, so a page beyond what is stored comes back with `games: []`
  even after a sync. This was the same before S4.
- (S4) `cacheService.js` (Redis on boot, no sweep) is still open; S6.
- (S4) `/api/import/*` still has no rate limit; S6.

## Rollback

Each session is one PR. Rollback is `git revert` of that merge commit followed
by a NAS image pull. S5 adds a table and a migration; its rollback drops the
table (the JSON blobs remain the source of truth, so no data is lost).

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

## Next session prompt

Copy everything inside the fence into a new conversation.

```
Continue the overloadfight.club roadmap. This session is S5: indexed player table.

Repo: git@github.com:jasonjkehoe-alt/overloadfight.club.git. Work in this worktree only.
The queue is docs/ROADMAP.md. Read it in full first, then verify its status line against the repo before building on anything in it.

The owner rewrote history on 2026-10-06 to purge a leaked password. Work only from a clone made after that date. Before any push, check that `git merge-base --is-ancestor 10223be HEAD` fails (10223be is the pre-rewrite base); if it succeeds, stop and tell me.

Set up:
  git fetch origin
  If the S4 PR (branch ofc/s04-bundle-polling) is merged:
    git checkout -B ofc/s05-player-table origin/main
  If it is still open:
    git checkout -B ofc/s05-player-table origin/ofc/s04-bundle-polling
    and open the S5 PR against main anyway; say in its description that it sits on S4 (PR #4).
  Check again before opening the PR: if PR #4 merged during the session, rebase onto origin/main first.
  source ~/.nvm/nvm.sh && nvm use 22
  npm ci
`nvm use` does not carry over between tool calls: prefix every command that needs Node with `source ~/.nvm/nvm.sh && nvm use 22 &&`.
If neither origin/main nor origin/ofc/s04-bundle-polling has docs/ROADMAP.md, stop and tell me.

Read first:
- docs/ROADMAP.md, the S5 entry and its Done-when list. That list is the scope. Also "Canonical contract", the S2 to S4 entries under "Decisions and deviations" and "Flagged, not fixed" (the S2 suicide pass, the LIKE prefilter gaps, the S4 refresh snapshot holding the WAL), and the Postmortems.
- docs/audit/performance.md and docs/audit/data.md for the file:line evidence (refs are as of 10223be, which is 2c4f174 after the rewrite; S1 to S4 moved lines in server/, so re-find them with grep -n).
- server/db.js: the connection setup and pragmas, saveGames and upsertGameSql, moveGamesToColdStorage, refreshPilotStats, getPilotTelemetry, getPilotBreakdown, getPilotStats, getGamesByPilot, countGamesByPilot and the leaderboard queries (read in sections; a hook blocks whole-file reads over 350 lines, use sed -n 'START,ENDp').
- server/routes.js: the /api/pilot/:name/* routes and the leaderboard (/api/stats/pilots).
- server/maintenance.js (the refresh schedule) and server/lib/gameParse.js.

Binding decisions, do not re-derive:
- Test runner is vitest (`npx vitest run`). Tests live beside the code as *.test.js; DB tests set DATA_DIR to a temp dir before importing server/db.js and share fixtures through server/testFixtures.js. vitest's module runner defines CommonJS `module`, so check ES-module-only behaviour from a script run by `node`.
- server/lib/gameParse.js owns the game rules (teamOf, winnerOf, durationOf, netKills, pilotKey, outcomeOf, pairOutcome). game_players rows must be built from it; do not add a second copy of a rule.
- The games(id, date, ip, details) table and the hot/cold split stay. game_players is added beside games, not instead of it; the JSON blobs remain the source of truth. Do not change the public API paths (see "Canonical contract").
- Both connections run journal_mode=WAL, synchronous=NORMAL, busy_timeout=5000 (S4). Backup and restore go through db.backupHot / db.restoreHot.
- Build with `npx vite build`, never `npm run build` (its prebuild rewrites the tracked public/version.json).
- Do not add a router library, state library or ORM.
- No production database exists locally. Server changes are proven with tests on fixture games or by running `PORT=3100 DATA_DIR=/tmp/ofc-data npm start` and curling. Wait for `Startup sync complete` in the log before checking.

Rules for this session:
- One PR, scope is the S5 Done-when list only. Flag anything else in the tracker's "Flagged, not fixed".
- Add a decision entry for the migration (how it backfills hot and cold games, how it is re-run safely, and its rollback).
- Do not merge the PR. Do not push to main.
- No Co-Authored-By or attribution trailers in commits.
- Apply the unslop skill to the PR description and tracker prose.
- Run /code-review on the diff before opening the PR, then /simplify, and fix what they find.
- Before ending: tick S5 in docs/ROADMAP.md, fill Validated and NOT validated with what you actually ran and its output, update the Verification table rows you exercised, correct the counts in the Status section, append to the session log, and rewrite the "Next session prompt" section for S6 using this prompt as the template. Commit that in the same PR.
- End the turn after the PR is open. Do not start S6.

Load these skills: unslop, code-review, simplify.

First move: run `npx vitest run` (S4 left 5 files, 57 tests passing) and `npx vite build 2>&1 | grep -E "assets/index-.*\.js"` (the Verification table records the entry at 72.84 KB gzip), and record both results.
Done when: every item in the S5 Done-when list is true, `EXPLAIN QUERY PLAN` for the pilot and leaderboard queries shows the game_players indexes, `npx vitest run` passes with tests that compare game_players-backed pilot numbers against the S2 fixture expectations, `PORT=3100 DATA_DIR=/tmp/ofc-data npm start` (dev mode, no secrets needed) still serves `/api/stats/global`, `/api/stats/pilots` and `/api/pilot/:name/stats`, and the PR is open with the tracker updated.
```
