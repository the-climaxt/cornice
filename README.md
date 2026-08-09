# Mountain Events

A single screen that answers: **"I want to ride in the next few days — where should I go, and is anything fun happening?"**

Consolidates event calendars from Colorado ski resorts and their nearby towns so you don't have to check every resort website individually. Opens to today, looks forward about a week.

Personal project. Not affiliated with any resort.

---

## Status

**Phase 0 — planning complete, no code yet.**

See [`CLAUDE.md`](CLAUDE.md) for current state and the next action.

---

## How it works

```
GitHub Actions (nightly cron)
        │
        ├── adapters/alterra.js      ──> Winter Park, Steamboat
        ├── adapters/powdr.js        ──> Copper, Eldora
        ├── adapters/abasin.js       ──> Arapahoe Basin
        └── adapters/generic-llm.js  ──> town calendars
        │
        ▼
  data/{resortId}.json  +  data/feed.json   (committed to this repo)
        │
        ▼
  GitHub Pages ── static PWA fetches feed.json AT RUNTIME
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
| `resorts.json` | The registry. Adding a resort is adding a row. |
| `adapters/` | One module per source platform. |
| `data/` | Scraper output, committed nightly. Do not hand-edit. |
| `web/` | The static PWA served by GitHub Pages. |
| `.github/workflows/` | The nightly scrape. |

---

## Local development

_To be written in Phase 0._
