# Decision Log

Append-only. Every entry records what was decided, why, and what was rejected. Newest at the bottom.

Format: `D-NNN` · date · decision · rationale · rejected.

---

### D-001 · 2026-08-09 · This is a near-term decision tool, not a trip planner

The product answers "I want to ride in the next few days — where should I go, and is anything fun happening?" Horizon is today through about a week.

**Why:** Tanner's actual pain is deciding where to go this weekend, not planning a trip six months out. He already has a separate tool for long-range trip planning (Powder Run, for the Feb 2027 Canada trip).

**Rejected:** A general-purpose year-round calendar. It would surface an Oktoberfest in September as equal-weight noise against tonight's rail jam.

---

### D-002 · 2026-08-09 · v1 covers five resorts — Winter Park, Copper, A-Basin, Eldora, Steamboat

**Why:** These are the resorts on Tanner's Ikon pass — the ones he'd actually drive to. Starting with Front Range day-trippable resorts proves the pipeline before widening.

**Rejected:** All ~28 Colorado ski areas at launch. Roughly 28 resort sites plus 20 town calendars to keep alive before knowing whether the tool gets used.

---

### D-003 · 2026-08-09 · Private tool for Tanner and his crew — no accounts, no public launch

**Why:** ~5 users. Authentication, user state, and a privacy posture would all be machinery serving nobody.

**Rejected:** Public product. Still possible later — the architecture doesn't preclude it — but nothing in v1 is built for it.

---

### D-004 · 2026-08-09 · Static JSON + PWA, no database and no API server

Scheduled scrapers write per-resort JSON files committed to the repo. A static PWA reads them.

**Why:** Five users don't justify a database. The JSON file doubles as an API if the project ever grows, so migrating to a real backend later means pouring the same data model into a database — the front end barely changes.

**Rejected:** (a) Hosted DB + API + front end — monthly cost, auth, backups, and a second system to debug, for no benefit at this scale. (b) Manual/AI-assisted curation — it is precisely the chore being eliminated. (c) Weekly digest only — that's an output format, not an architecture, and it falls out of the pipeline for free anyway.

---

### D-005 · 2026-08-09 · Town and village events are in v1, not deferred

**Why:** Tanner was explicit. "Is anything fun happening" includes the brewery in Nederland and the festival in Frisco, not just what's on the hill. Cutting town events would gut the product's actual purpose.

**Note:** Winter Park and Steamboat already tag town events inside their own feeds, so only Copper, A-Basin, and Eldora need separate town sources.

---

### D-006 · 2026-08-09 · Operational dates in v1 are limited to opening and closing day

**Why:** Night skiing windows and terrain openings live on scattered pages, are published inconsistently, and would be the first thing to break. Opening and closing day are published reliably every fall and are high-value for planning.

**Implementation note:** These are five dates. Hand-seed them in the registry each fall rather than maintaining a fragile scraper for them.

---

### D-007 · 2026-08-09 · Netlify rejected on its credit cap

Netlify's free plan is 300 credits/month, and a production deploy costs 15 credits — **20 deploys per month, hard cap.**

**Why this matters:** A nightly rebuild is 30 deploys/month, so the budget runs dry around the 20th of every month. This is exactly what exhausted Tanner's "update tokens" on earlier projects. A future hourly snow refresh would be ~720 deploys/month, roughly 10,800 credits.

**Rejected:** Netlify, despite Tanner having liked it and already running Powder Run there.

---

### D-008 · 2026-08-09 · Public GitHub repo + GitHub Pages

**Why:** Actions minutes are unlimited and free on public repos, and GitHub Pages is free *only* for public repos on the Free plan. No credit system, no deploy cap. One service instead of two, one quota instead of three.

**Why public is acceptable:** Nothing in the repo is sensitive — public event listings and a list of ski resorts.

**Rejected:** Private repo. Would cap Actions at 2,000 min/month (survivable) but forces Pages onto a paid plan or the front end back onto Netlify (not survivable — see D-007).

---

### D-009 · 2026-08-09 · Data is decoupled from deploy — non-negotiable

The front end fetches `feed.json` at **runtime** from a static URL. It is never bundled at build time.

**Why:** A data update must never trigger a site rebuild. This is the structural fix for the failure in D-007, and it holds regardless of host. Deploys happen only when code changes — a few times a month, well inside any free tier. It is also what makes an eventual hourly snow refresh free instead of catastrophic.

**Rejected:** Bundling data into the build, which is the default behavior of most static site generators and the trap that caused the original problem.

---

### D-010 · 2026-08-09 · Adapters are keyed by platform, not by resort

**Why:** Winter Park and Steamboat run the identical Alterra platform with an identical JSON schema. One adapter covers both. When Vail Resorts is added, one adapter covers Vail, Beaver Creek, Breckenridge, and Keystone at once. Five resorts need three scrapers, not five.

**Contract:** each adapter exports `fetchEvents(resort) → Event[]`. That's all.

---

### D-011 · 2026-08-09 · Expansion is data entry, not code — the registry drives everything

Tanner's direction: "Build the architecture now to eventually have events, snow, lift, drive," and "eventually all Colorado ski areas, might eventually expand to SLC resorts — just don't prohibit it."

**Why:** Every foreseeable expansion must be adding a row to `resorts.json`, not restructuring the project. Adding Vail is a `passes: ["epic"]` row. Adding Alta is a `state: "UT"` row. Adding snow fills a `null` field in the per-resort output.

**Consequence:** per-resort files carry `snow: null`, `lifts: null`, `drive: null` from day one as hooks, even though v1 never populates them.

---

### D-012 · 2026-08-09 · Live drive time is a client-side call, not scraped data

Registry keeps a static `driveTime.fromDenverMin`. When live drive time ships, it becomes a routing API call at page load.

**Why:** Drive time is per-user and per-moment, so it cannot be baked into a nightly JSON file. The scraper never touches it. The static registry value stays as the fallback when the API is down or over quota.

---

### D-013 · 2026-08-09 · v1 distance filter is straight-line, drive time comes later

**Why:** Zero dependencies, no API, no request cap. Ships now.

**Known limitation, accepted:** straight-line distance ranks Eldora and Copper as near-equals when they are nothing alike on a Saturday morning. The static drive-time field in the registry is a cheap fix whenever that becomes annoying.

---

### D-014 · 2026-08-09 · Stale data must never look like an empty calendar

If an adapter returns zero events, keep the last good file, set `status: "stale"`, and surface "data N days old" in the UI.

**Why:** An empty calendar and a broken scraper are visually identical, and the failure mode is silent. This single rule is the difference between a tool that gets trusted and one that quietly gets abandoned. Resort sites are redesigned roughly annually — breakage is assumed, not hypothetical.

---

### D-015 · 2026-08-09 · Standalone repo and site, not a tab inside Powder Run

**Why:** Powder Run is a Feb 2027 trip tool with a fixed lifespan. This is a year-round Colorado utility. Mixing them couples two unrelated release cycles.

**Rejected:** Adding a tab to Powder Run, which would have saved the crew from re-adding an app to their home screens.

---

### D-016 · 2026-08-09 · The repo folder mirrors GitHub exactly

`Mountain Events\mountain-events\` contains exactly what is committed to GitHub and nothing else, so Tanner can diff it against the remote to verify updates. Nothing else is stored in the parent folder.

**Why the planning docs live inside the repo:** `CLAUDE.md`, `PLAN.md`, and `DECISIONS.md` are committed. This keeps the mirror honest (no untracked strays), puts project context under version control, and means a fresh Claude session that clones the repo immediately has everything it needs.

**Alternative if preferred:** move the three docs to a sibling `docs/` folder outside the repo and add them to `.gitignore`. Say the word.

---

### D-017 · 2026-08-09 · Repo folder is named `mountain-events`, not `repo`

**What happened:** GitHub Desktop's "Create a repository" dialog treats *Local path* as the parent directory and creates a new subfolder named after the repository. Pointing it at `Mountain Events` therefore produced `Mountain Events\mountain-events\` rather than converting the existing `Mountain Events\repo\` folder. The first publish contained only GitHub Desktop's auto-generated `.gitattributes`.

**Resolution:** the docs were rewritten into `mountain-events\`, and the stray `repo\` folder was deleted. Folder name now matches the repository name on GitHub, which is clearer anyway.

**Lesson for future sessions:** after any GitHub Desktop operation, verify with `git -C "<path>" rev-parse --show-toplevel` before assuming the intended folder is the repository. Do not trust the dialog's Local path field to mean what it looks like it means.

---

### D-018 · 2026-08-09 · Three status values, not two: `ok`, `stale`, `pending`

A resort with no working adapter yet reports `pending`, not `stale`.

**Why:** `PLAN.md` §6 says the workflow must fail loudly when an adapter returns zero. But resorts awaiting a Phase 1+ adapter would return zero every night from day one, firing false alarms until you learned to ignore the alarm entirely — the exact failure mode §6 exists to prevent. `pending` is expected and silent; `stale` means something that used to work has broken.

**Rejected:** a single "not ok" state, which would have made the alarm useless within a week.

---

### D-019 · 2026-08-09 · Pages placeholder deferred — the real front end shipped instead

The plan sequenced a throwaway `/docs` placeholder to verify hosting early, ahead of the Phase 4 front end.

**What changed:** the adapters came together fast enough that building the real UI was cheaper than building a placeholder and then replacing it. `docs/index.html` is the actual app.

**Consequence:** the hosting chain and the app get verified in the same step rather than separately. Slightly higher risk if something's wrong, but the app is a single static file with no build step, so there's little to go wrong.

---

### D-020 · 2026-08-09 · Steamboat moves from Phase 0 to pending — Imperva bot protection

`PLAN.md` assumed Winter Park and Steamboat were one easy adapter because they share the Alterra platform. They do share markup — but `steamboat.com` sits behind **Imperva/Incapsula** and returns a 1.1 KB challenge page to a plain request. Winter Park has no protection at all.

**Resolution:** Steamboat is marked `"status": "pending"` in `resorts.json`. Its adapter is written and would work unchanged given real HTML; only retrieval fails. Adding Playwright to the nightly job is the likely fix. See `QUESTIONS.md` Q1.

**Lesson:** shared platform does not imply shared infrastructure. Verify retrieval per-domain, not per-vendor.

---

### D-021 · 2026-08-09 · Copper and Eldora need no browser — sitemap plus Gatsby page-data

Both were expected to need Playwright since their event listings render client-side. They don't.

Both are **Gatsby over Drupal**. Every event is its own page, listed in `/sitemap-0.xml`, and Gatsby publishes each page's data as JSON at `/page-data/<path>/page-data.json` — carrying `title`, `field_date`, `field_end_date`, `field_venue`, `field_hours`, and `field_short_description`. So: fetch sitemap → filter event URLs → fetch each page's JSON.

**Why this matters:** it removed the only reason Phase 1 needed browser automation, which was the most expensive and most fragile part of the plan. Copper has ~147 event URLs and Eldora ~510; requests are capped at 6 concurrent.

**Rejected:** Playwright for POWDR sites, and Drupal JSON:API (returns 404 on both — not exposed).

---

### D-022 · 2026-08-09 · Events expand into concrete days

Every event carries a `days: [YYYY-MM-DD]` array of the dates it actually happens, not just a start and end.

**Why:** the whole product is "what's on today." Winter Park publishes recurring events as a single record spanning months — "High Note Thursdays, Jun 19 – Sep 26, recurrence: Weekly." Rendered naively that event appears to be happening every day for three months, which is wrong and makes the app useless. Expansion turns it into the eleven Thursdays it really is.

Expansion is capped at 400 days so a bad end date can't explode the feed.

---

### D-023 · 2026-08-09 · Data lives in `docs/data/`, not `/data`

**Why:** GitHub Pages serves the `/docs` folder. Putting the JSON there means the app fetches `data/feed.json` same-origin at runtime with no second copy and no cross-origin dependency on `raw.githubusercontent.com`.

**Note on D-009:** with Pages deploying from a branch, a nightly data commit does trigger a Pages rebuild. That's free and uncapped on GitHub, unlike Netlify. The runtime-fetch rule still holds and still matters — it's what keeps an eventual hourly refresh free, and what makes the host swappable.

---

### D-024 · 2026-08-09 · The product is named **Cornice**, with a defined brand

Tanner supplied a finished logo sheet. Spec captured in `BRAND.md`; that file is authoritative and future sessions must not improvise on the mark.

**The mark:** a cornice lip curling over, with confetti chips falling off it. The chips do real work — they're the "events" half of the idea, which is exactly what four rounds of my own icon attempts failed to express. Every draft I made said *mountain* and none said *something is happening*.

**Rules that constrain the UI, not just the logo:** no gradients anywhere, stroke weight fixed at 15/110, the curl never rotates, chips always stay below the lip and are never cropped.

**Palette:** Plum `#3F2140` base · Coral `#D9563C` primary · Amber `#E0A040` · Teal `#4E9E93` · Blush `#C98BA8` · Cream `#F3E7D6`.
**Type:** Staatliches (display) · DM Mono (labels) · Jost (body).

**Consequence:** `docs/index.html` was rethemed from the placeholder navy/cyan to the Cornice palette, and the previous gradient header was removed to comply. The three chip colours map naturally onto the location badges — teal for on-hill, amber for village, blush for town.

**Repo name unchanged** (`mountain-events`) — renaming is Tanner's call, tracked as QUESTIONS.md Q8.
