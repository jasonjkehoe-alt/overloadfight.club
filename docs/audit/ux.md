<!-- Audit notes from the 2026-10-06 four-lens review at commit 10223be. Condensed subagent output; file:line refs are as of that commit. -->
# UX LENS — key findings
## Biggest
- Match page shows no winner/final score/real duration (GameDetail.tsx:118-151).
- Dashboard: full 7-panel Fight Night poster ABOVE live servers (App.tsx:308). Live buried.
- Fight Night page not in nav, nothing links to it (only typed URL).
- Live match page: no IP, no copy, no team score (LiveGameDetail.tsx:143-186); uses nonexistent primary-* classes; OFFLINE branch dead; idle server → "Unable to Load Game".
- Labels conflict: "Pilot" 3 meanings; /history and /archive both "Historical Archive"; "Combat Ratio" K/D on profile vs KDA on leaderboard; "Lethality" two formulas.
- No design tokens: 95 hex colors, #ff6600 ×612, 6 hover oranges, 34 near-blacks, two border systems; theme.extend empty.
- Accessibility zero: aria 0, role 0, focus-visible 0; 0 internal <a href>; ~13 clickable divs/rows.
- document.title never set; no OG tags → every Discord share same generic title.
## Site map issues
- Hand-rolled router; tab/filter state not in URL anywhere; map detail popup has no URL; fight-night date pills don't update URL.
- Back buttons go to fixed pages (pilot→match→back loses pilot); stale match flash A→pilot→B.
- Dead: 'weapons' view key; LiveGameDetail OFFLINE branch; Layout playerCount computed never shown; showColdStorage prop unused.
- Header "ACTIVE PILOTS" is a 90-day count next to "Live"; real online count hidden.
- Favorites reset on reload (GameList.tsx:28 useState).
- Calendar iframe white-framed at bottom; likely blocked by CSP/COEP (server/index.js:70-73) VERIFY.
- PilotsList renders ~4,510 rows no pagination; MapLibrary up to 1000 cards.
- Hardcoded numbers: MapLibrary.tsx:142 "75,820", :165 "12 Stock"; ColdStorage 186 "7.2 yrs", 436, 656 "70,500+"; GameList.tsx:326 fallback 21; ServerStats.tsx:148-158 fake "Global Mesh" regions.
- PilotDetail: always-on pulsing dot (226); "Live Analytics" badge on historical; Outcome = POSITIVE/NEGATIVE by K>=D not W/L (770); map names unlinked.
- GameDetail back says "RETURN TO DASHBOARD" goes to /history; "N MIN Match Limit" not actual duration; KDA 3 decimals.
- ColdStorage nests own min-h-screen page, font-sans, blue accents.
- Two voices: fight club vs military telemetry ("ESTABLISHING UPLINK", "Relays Standing By").
## IA duplication
- 3 match browsers; 2 leaderboards; 3 top-maps lists; 5 different total-match numbers; K/D ×3 on profile.
- Terms: match/game/bout/round/mission; pilot/player; archive/history; frags/kills; map/arena/combat zone/sector/theater; server/node/relay.
- Suggested nav: Live · Fight Night · Pilots · Maps · Records · Tools▾(Pilot Config, Taunts) · Play▾(OLMod, Resources, Discord)
## Visual
- Dead classes: primary-*, animate-fade-in ×21, animate-in, custom-scrollbar, prose.
- Tiny text: text-[10px] ×147, [11px] ×89, [9px] ×12, [8px], [5px].
- Radius mix rounded/rounded-xl/rounded-lg ~ equal; 4 card styles, 4 page headers, 3 tab styles; 6+ spinners.
- Charts: stock Recharts palette; 2 tooltip styles; team orange ≈ brand orange.
- Mobile: active: 0 vs hover: 499; 7 of 13 tables lack scroll wrapper; no manifest/theme-color.
## Delight
- One voice (fight club). Match as fight card (ORANGE 12–9 BLUE, KO/split decision/draw). /vs/:a/:b Tale of the Tape. Belts per mode w/ held-since + defenses. Weigh-in lobby cards w/ records. Ring-announcer copy from fightNightService templates. Personal fight-night recap. OG share cards. Live "ON FIRE"/"Lead change!" callouts. Empty states with attitude. Record Book w/ "challenge this record". Reuse helmet avatar.
## Top 20 ranked (S/M/L): 1 match result S; 2 live-first dashboard S; 3 nav restructure M; 4 real <a href> M; 5 title+OG M; 6 join info on live S; 7 tokens L; 8 unify metrics S; 9 global search M; 10 fix pills S; 11 URL state M; 12 back/stale fix S; 13 a11y basics M; 14 shared Loading/Empty/Error + top ErrorBoundary M; 15 Tale of Tape component + /vs M; 16 profile "last fight night" + trend M; 17 map author pages + map URL M; 18 remove hardcoded S; 19 mobile pass M; 20 one voice/style L.
