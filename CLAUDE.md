# Mountain Events — Start Here

Orientation file. If you are a new Claude session on this project, read this first, then `PLAN.md`, then `DECISIONS.md`. Everything you need to resume is in those three files.

**Folder convention:** `C:\Users\tanne\My Drive\01_Projects\Mountain Events\mountain-events\` is the git repository and an exact mirror of GitHub — what's in it is what's committed, nothing more. Tanner uses it to verify his updates against the remote. Never put scratch work, drafts, or notes in it. Anything not destined for GitHub goes in a sibling folder or `scratch/` (gitignored).

**Repo:** https://github.com/the-climaxt/mountain-events (public)

---

## What this is

A tool that answers one question: **"I want to ride in the next few days — where should I go, and is anything fun happening?"**

It consolidates event calendars from Colorado ski resorts *and* their nearby towns into a single screen that opens to today and looks forward about a week. Tanner is tired of checking every resort's website individually.

It is **not** a long-range trip planning tool. Near-term decision support only.

**Owner:** Tanner Axt, Denver. Private tool for him and his ski crew (~5 people). No public launch, no user accounts.

---

## Current status

**Phase: 0 — not started. No code exists yet.**

Nothing has been built. The plan is complete and the architecture is decided. The next concrete action is scaffolding the repo (see "Next action" below).

| Item | State |
|---|---|
| Plan and architecture | Done — see `PLAN.md` |
| Decisions and rationale | Logged — see `DECISIONS.md` |
| Scraping recon (5 resorts) | Done — see `PLAN.md` § Source recon |
| Repo docs (`README`, `CLAUDE`, `PLAN`, `DECISIONS`, `.gitignore`) | Written |
| `SETUP.md` walkthrough | Written |
| GitHub repo | **Created and public** — https://github.com/the-climaxt/mountain-events |
| Docs committed to GitHub | Pending — Tanner's first real commit |
| Registry (`resorts.json`) | Not written |
| Alterra adapter | Not written |
| Actions workflow | Not written |
| Front end | Not started |

### Next action

Scaffold Phase 0: create the public GitHub repo, write `resorts.json` with the five v1 resorts, build the Alterra adapter (covers Winter Park + Steamboat), and add the nightly Actions workflow. Success = `data/winter-park.json` and `data/steamboat.json` committing themselves on a schedule.

---

## Hard constraints

These are not preferences. Violating any of them breaks the project.

1. **It must stay free.** Zero recurring cost, permanently. Every hosting decision traces back to this.
2. **Data must be decoupled from deploy.** The front end fetches `feed.json` at runtime. It is never bundled at build time. A data update must never trigger a site rebuild. This is why the Netlify credit cap killed earlier projects — see `DECISIONS.md` D-007.
3. **Never create files without asking Tanner first.** Draft in chat and wait for explicit permission. (This applies to *new* work; the files already in this folder are approved.)
4. **Build for expansion, ship narrow.** v1 is five resorts and events only, but the architecture must already accommodate all ~28 Colorado ski areas, Epic resorts, eventually Utah, and eventually snow / lift status / live drive time. Adding any of those should be data entry, not a rewrite.
5. **Stale data must never look like an empty calendar.** If a scraper returns zero events, keep the last good file and mark it stale. See `PLAN.md` § Failure handling.

---

## Working with Tanner

- Direct, precise, anti-corporate. He dislikes AI-sounding language and over-engineered recommendations.
- He asks clarifying questions and expects them back. Ask before assuming scope.
- Verify claims by searching — especially pricing, free tiers, and anything that changes. Never state a limit from memory.
- On long tasks he wants brief progress updates as you go, not silence until the end.
- **He is not a developer and has said so explicitly.** He is a city planner (DOTI). He has shipped a PWA before ("Powder Run"), but assume no working knowledge of git, GitHub, Node, the command line, or deployment.
- **Walk him through everything, step by step, exactly.** Do not say "commit and push" or "run npm install" and move on. Give the literal clicks and the literal commands, say what each one does and what he should see when it works, and tell him what a failure looks like. Explain jargon the first time it appears.
- This does not mean dumbing down the architecture. He makes sharp product and cost decisions — he caught the Netlify credit problem from experience. Treat him as a smart client, not a junior engineer: full reasoning on the "what" and "why," full hand-holding on the "how."
- **Do not use this project or Claude for his work at DOTI.** Personal projects only.

---

## How to resume a session

1. Read this file, `PLAN.md`, and `DECISIONS.md`.
2. Check the status table above and the phase table in `PLAN.md` for the first unfinished item.
3. If a repo URL is listed below, clone or inspect it before assuming anything about what's built.
4. Ask Tanner what he wants to work on before writing code.

**Repo URL:** https://github.com/the-climaxt/mountain-events
**Local path:** `C:\Users\tanne\My Drive\01_Projects\Mountain Events\mountain-events`
**Live site URL:** _not yet deployed_

---

## Update protocol

At the end of any working session, before you sign off:

1. Update the **Current status** table and **Next action** above.
2. Append any new decision to `DECISIONS.md` with a date, the rationale, and what was rejected.
3. If the architecture changed, update `PLAN.md` — do not let it drift from reality.
4. If a source site changed or a scraper broke, note it in `PLAN.md` § Source recon with the date.

Keeping these current is what lets Tanner start a fresh session every time he logs in without re-explaining the project.

_Last updated: 2026-08-09_
