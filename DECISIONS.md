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
