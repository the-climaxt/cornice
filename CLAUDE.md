# Mountain Events — Start Here

Orientation file. If you are a new Claude session on this project, read this first, then `PLAN.md`, then `DECISIONS.md`, then `QUESTIONS.md`. Everything you need to resume is in those files.

**Folder convention:** `C:\Users\tanne\My Drive\01_Projects\Mountain Events\mountain-events\` is the git repository and an exact mirror of GitHub — what's in it is what's committed, nothing more. Tanner uses it to verify his updates against the remote. Never put scratch work, drafts, or notes in it.

**Repo:** https://github.com/the-climaxt/mountain-events (public)

---

## What this is

A tool that answers one question: **"I want to ride in the next few days — where should I go, and is anything fun happening?"**

It consolidates event calendars from Colorado ski resorts *and* their nearby towns into a single screen that opens to today and looks forward about a week.

It is **not** a long-range trip planning tool. Near-term decision support only.

**Owner:** Tanner Axt, Denver. Private tool for him and his ski crew (~5 people). No accounts.

---

## Current status

**Phases 0–4 built and working locally. Nothing committed yet.**

Last local scrape: **4 resorts ok, 1 pending, 50 events, 0 failures.**

| Resort | Adapter | State | Events |
|---|---|---|---|
| Winter Park | `alterra` | ok | 25 |
| Copper | `powdr` | ok | 14 |
| Arapahoe Basin | `abasin` | ok | 7 |
| Eldora | `powdr` | ok | 4 |
| Steamboat | `alterra` | **pending** — Imperva bot protection | 0 |

| Piece | State |
|---|---|
| `resorts.json` registry | Done, 5 resorts |
| Adapters (`alterra`, `powdr`, `abasin`) | Done, verified against live sites |
| `src/scrape.js` orchestrator | Done, stale/pending rules implemented |
| `docs/index.html` front end | Done — **not yet opened in a browser** |
| PWA (`manifest.json`, `sw.js`, `icon.svg`) | Done |
| `.github/workflows/scrape.yml` | Written, **never executed** — first run happens on push |
| GitHub Pages | **Not enabled** — see `SETUP.md` Stage 4 |
| Git commit | **Not done** — deliberately left for Tanner to review |

### Next actions, in order

1. **Tanner reviews the diff in GitHub Desktop and commits + pushes.** This triggers the first Actions run.
2. **Enable GitHub Pages** — `SETUP.md` Stage 4, source `main` / `/docs`.
3. **Open the live site** and confirm it renders. It has never been viewed in a browser.
4. **Answer `QUESTIONS.md` Q1** (Steamboat / Playwright) — the only blocking question.
5. Delete `Mountain Events\_to_delete_old_data\` — leftover from relocating data into `docs/data/`. Claude cannot delete files on his machine.

---

## Hard constraints

Not preferences. Violating any of them breaks the project.

1. **It must stay free.** Public repo → unlimited Actions minutes and free Pages.
2. **Data must be decoupled from deploy.** The front end fetches `data/feed.json` at runtime. Never bundle it at build time. See `DECISIONS.md` D-007 and D-009.
3. **Never create files without asking Tanner first.** (The exception was an explicit "run all phases" instruction.)
4. **Build for expansion, ship narrow.** Adding a resort, pass, state, or signal must be data entry in `resorts.json`, not a rewrite.
5. **Stale data must never look like an empty calendar.** If an adapter returns zero, keep the last good file, mark it `stale`, and surface it in the UI. Implemented in `src/scrape.js`.

---

## Architecture in one screen

```
resorts.json  ──>  src/scrape.js  ──>  src/adapters/{alterra,powdr,abasin}.js
                         │
                         ▼
              docs/data/{resortId}.json  +  docs/data/feed.json
                         │
                         ▼
        GitHub Pages serves docs/ ── index.html fetches feed.json at RUNTIME
```

Adapters are keyed by **platform, not resort** — one `powdr` adapter serves both Copper and Eldora.

Status values in the data files: `ok` (fresh), `stale` (failed, showing last good), `pending` (no adapter yet, never alarms).

---

## Working with Tanner

- **He is not a developer and has said so explicitly.** City planner at DOTI. Assume no working knowledge of git, GitHub, Node, the command line, or deployment.
- **Walk him through everything, step by step, literally.** Don't say "commit and push" and move on. Give the exact clicks, say what each does, what he should see when it works, and what failure looks like.
- This is **not** about dumbing down the architecture. He makes sharp product and cost calls — he caught the Netlify credit problem from his own experience. Smart client, not junior engineer: full reasoning on the "what" and "why," full hand-holding on the "how."
- **Verify, don't assume.** He follows instructions literally, so a wrong instruction produces a silent wrong result. After any GitHub Desktop step, check `git -C "<path>" rev-parse --show-toplevel` and `git status`.
- Direct, precise, anti-corporate. He dislikes AI-sounding language and over-engineered recommendations.
- On long tasks he wants brief progress updates as you go, not silence until the end.
- **Do not use this project or Claude for his work at DOTI.** Personal projects only.

### Environment notes

- His machine is reachable via the Desktop Commander MCP. Quote paths with **single quotes** in PowerShell and use `git -C` — `cd` with spaces and `$` variables both get mangled in transit.
- Installed: git 2.55, Node v24.15, npm 11.12, GitHub Desktop, VS Code.
- The cloud sandbox **cannot** reach the internet with a headless browser (tunnel blocked). Run probes on his machine with `node` via Desktop Commander instead.

---

## Running it

```
node src/scrape.js                 # all resorts
node src/scrape.js --only copper   # one resort, for debugging
```

Writes `docs/data/*.json`. Exits non-zero if any active adapter failed — that's the alarm.

---

## Update protocol

At the end of any working session:

1. Update the **Current status** tables and **Next actions** above.
2. Append new decisions to `DECISIONS.md` with date, rationale, and what was rejected.
3. Move answered items out of `QUESTIONS.md`.
4. Keep `PLAN.md` from drifting from reality.

Keeping these current is what lets Tanner start a fresh session every time he logs in without re-explaining the project.

_Last updated: 2026-08-09_
