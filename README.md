# Mountain Events

A single screen that answers: **"I want to ride in the next few days — where should I go, and is anything fun happening?"**

Consolidates event calendars from Colorado ski resorts and their nearby towns so you don't have to check every resort website individually. Opens to today, looks forward about a week.

Personal project. Not affiliated with any resort.

---

## Status

**Working.** Four of five resorts scraping cleanly — Winter Park, Copper, Arapahoe Basin, and Eldora. Steamboat is `pending` behind bot protection.

See [`CLAUDE.md`](CLAUDE.md) for current state and the next action, and [`QUESTIONS.md`](QUESTIONS.md) for what needs deciding.

---

## How it works

```
GitHub Actions (nightly cron)
        │
        ├── src/adapters/alterra.js  ──> Winter Park, Steamboat
        ├── src/adapters/powdr.js    ──> Copper, Eldora
        └── src/adapters/abasin.js   ──> Arapahoe Basin
        │
        ▼
  docs/data/{resortId}.json  +  docs/data/feed.json   (committed to this repo)
        │
        ▼
  GitHub Pages serves docs/ ── static PWA fetches feed.json AT RUNTIME
```

No database. No API server. No recurring cost.

Two rules the whole design rests on:

1. **Data is decoupled from deploy.** The front end fetches `feed.json` at runtime; it is never bundled at build time. A data update never triggers a rebuild.
2. **Stale data never looks like an empty calendar.** If a scraper returns zero events, the last good file is kept and flagged stale in the UI.

---

## Adding a resort

Add a row to `resorts.json`. If its platform already has an adapter, that's the entire change.

```json
{
  "id": "vail",
  "name": "Vail",
  "state": "CO",
  "lat": 39.6403,
  "lon": -106.3742,
  "passes": ["epic"],
  "parent": "vail-resorts",
  "timezone": "America/Denver",
  "sources": {
    "events": { "adapter": "vail-resorts", "url": "..." },
    "town": null, "snow": null, "lifts": null
  },
  "ops": { "openingDay": null, "closingDay": null },
  "driveTime": { "fromDenverMin": 120 }
}
```

---

## Repository layout

| Path | Purpose |
|---|---|
| `CLAUDE.md` | Start here. Current status, constraints, how to resume. |
| `SETUP.md` | One-time GitHub setup walkthrough, written for a non-developer. |
| `PLAN.md` | Full spec: architecture, data model, source recon, phasing. |
| `DECISIONS.md` | Append-only log of every decision and its rationale. |
| `QUESTIONS.md` | Open questions awaiting a decision. |
| `resorts.json` | The registry. Adding a resort is adding a row. |
| `src/scrape.js` | Orchestrator. Runs adapters, applies the stale rules, writes the feed. |
| `src/adapters/` | One module per source **platform**, not per resort. |
| `src/lib/` | Shared helpers: fetch/retry, date parsing, event normalisation. |
| `docs/` | The static PWA, served by GitHub Pages. |
| `docs/data/` | Scraper output, committed nightly. Do not hand-edit. |
| `.github/workflows/` | The nightly scrape. |

---

## Local development

Node 20+. No dependencies, no install step.

```bash
node src/scrape.js                 # scrape every resort
node src/scrape.js --only copper   # just one, for debugging
```

Output lands in `docs/data/`. The command exits non-zero if any active adapter fails — that's the alarm, and it's what turns the Actions run red.

To view the front end, serve `docs/` over HTTP (opening `index.html` from the filesystem will fail — service workers and `fetch` need a real origin):

```bash
npx serve docs      # or: python -m http.server 8000 --directory docs
```

### Adding a resort

Add a row to `resorts.json`. If its platform already has an adapter, that's the whole change. If not, write one that exports `fetchEvents(resort) → Event[]` and register it in `src/scrape.js`.

Set `"status": "pending"` on any resort without a working adapter — that keeps it out of the feed without tripping the failure alarm.
