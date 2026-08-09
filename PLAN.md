# Mountain Events — Plan

_Last updated: 2026-08-09_

---

## 1. Product

One screen answering: **"I want to ride in the next few days — where should I go, and is anything fun happening?"**

Opens to today. Looks forward roughly a week. Shows events at the resort and in the nearby town, filtered by pass, distance, and location type. Near-term decision support, not trip planning.

### v1 scope

**In:**

- Five resorts — Winter Park, Copper, Arapahoe Basin, Eldora, Steamboat (Tanner's Ikon pass)
- On-mountain events
- Base village and town events, including standalone town calendars
- Opening day and closing day per resort
- Filters: pass (Ikon / Epic / All), straight-line distance from user, on-hill vs in-town

**Out (but architecturally accommodated from day one):**

- Snow reports and overnight totals
- Lift and terrain status
- Drive conditions, CDOT alerts, live drive time
- Other operational dates (night skiing windows, terrain openings)
- Resorts beyond the five
- Utah / SLC

---

## 2. Architecture

Three layers. The whole design exists to make expansion data entry rather than a rewrite.

```
GitHub Actions (nightly cron)
        │
        ├── adapters/alterra.js   ──> Winter Park, Steamboat
        ├── adapters/powdr.js     ──> Copper, Eldora
        ├── adapters/abasin.js    ──> Arapahoe Basin
        └── adapters/generic-llm.js ──> town calendars, oddballs
        │
        ▼
  data/{resortId}.json  +  data/feed.json   (committed to repo)
        │
        ▼
  GitHub Pages ── static PWA fetches feed.json AT RUNTIME
```

### Layer 1 — `resorts.json`, the registry

Every resort is one row. This file is the expansion mechanism.

```json
{
  "id": "winter-park",
  "name": "Winter Park",
  "state": "CO",
  "lat": 39.8869,
  "lon": -105.7625,
  "passes": ["ikon"],
  "parent": "alterra",
  "timezone": "America/Denver",
  "sources": {
    "events": { "adapter": "alterra", "url": "https://www.winterparkresort.com/things-to-do/events" },
    "town":   { "adapter": "generic-llm", "url": "..." },
    "snow":   null,
    "lifts":  null
  },
  "ops": { "openingDay": null, "closingDay": null },
  "driveTime": { "fromDenverMin": 95 }
}
```

Adding Vail = one row with `"passes": ["epic"]`. Adding Alta = one row with `"state": "UT"`. Adding all 28 Colorado areas = 28 rows. **No code changes.**

### Layer 2 — adapters keyed by platform, not resort

This is why five resorts need three scrapers. Each adapter exports a single function:

```js
async function fetchEvents(resort) → Event[]
```

That is the entire contract. When Vail Resorts gets added, one new adapter covers Vail, Beaver Creek, Breckenridge, and Keystone at once.

### Layer 3 — output shaped for signals, not just events

Per-resort file, plus a merged `feed.json` the front end actually loads:

```json
{
  "resort": "winter-park",
  "updatedAt": "2026-08-09T10:02:00Z",
  "status": "ok",
  "ops": { "openingDay": "2026-11-14", "closingDay": null },
  "events": [ ... ],
  "snow": null,
  "lifts": null,
  "drive": null
}
```

The nulls are hooks. Adding snow later fills a field — it does not reshape the file or the front end.

**`drive` is a special case.** Live drive time is per-user and per-moment, so it can never be baked into the nightly JSON. When it ships, it becomes a client-side call at page load, with `driveTime.fromDenverMin` from the registry as the fallback when the routing API is down or over quota. The scraper never touches it.

### Event schema

Normalized across every source:

```json
{
  "id": "stable-hash",
  "resortId": "winter-park",
  "title": "High Note Thursdays",
  "description": "...",
  "start": "2026-08-13T17:00:00-06:00",
  "end": "2026-08-13T20:00:00-06:00",
  "allDay": false,
  "locationType": "on-mountain",
  "source": "resort",
  "categories": ["Concerts and Live Music"],
  "url": "...",
  "imageUrl": "..."
}
```

`locationType` is `on-mountain` | `village` | `town`. Alterra hands this over already (it tags events "On Mountain" vs "Village and Town"); set it manually for town scrapes. This field is what lets one feed distinguish a rail jam from a brewery night in Nederland.

`id` must be a stable hash of `resortId + title + start` so the same event doesn't duplicate across runs.

---

## 3. Hosting

**Public GitHub repo + GitHub Pages.** Verified 2026-08-09:

| | Public repo | Private repo |
|---|---|---|
| Actions minutes | Unlimited, free | 2,000/month free |
| GitHub Pages | Free | Requires Pro+ |
| Deploy/credit cap | None | None |

Nightly scrape burns ~3-5 minutes per run (~120 min/month), which fits either way — but Pages requires public, so public it is. Nothing in the repo is sensitive: public event listings and a resort list.

**Netlify was rejected.** Its free plan is credit-based: 300 credits/month, production deploy = 15 credits. That is **20 deploys per month, hard cap**. A nightly rebuild is 30/month, so it runs dry around the 20th every month — this is exactly what killed Tanner's earlier projects. A future hourly snow refresh would be ~720 deploys/month, roughly 10,800 credits.

**The deploy-decoupling rule survives regardless of host.** The front end fetches `feed.json` at runtime from a static URL. It is never bundled at build time. Data updates trigger zero deploys; deploys happen only when code changes. This is what makes an eventual hourly snow refresh free.

**Cron keepalive:** GitHub auto-disables scheduled workflows after 60 days of repository inactivity. Self-solving here — the nightly data commit counts as activity.

---

## 4. Source recon

Conducted 2026-08-09. Five resorts, three adapters.

| Resort | Parent | How events are published | Adapter | Difficulty |
|---|---|---|---|---|
| Winter Park | Alterra | Full event list embedded as JSON in the page | `alterra` | Easy |
| Steamboat | Alterra | Identical platform and schema to Winter Park | `alterra` | Easy |
| Arapahoe Basin | Alterra | Plain server-rendered list, category + location filters | `abasin` | Easy |
| Copper | POWDR | Client-side rendered; plain fetch returns nav only | `powdr` | Needs Playwright |
| Eldora | POWDR | Client-side rendered; plain fetch returns nav only | `powdr` | Needs Playwright |

**Alterra JSON fields** (Winter Park and Steamboat, confirmed identical): `pageId`, `name`, `subtitle`, `startDate`, `endDate`, `formattedDate`, `startDateDateTime` / `endDateDateTime` (ISO with timezone), `locations[]` ("On Mountain", "Village and Town"), `types[]`, `goodForTags[]`, `description`, `allDay`, `imageUrl` / `mobileImageUrl` / `tabletImageUrl`. Steamboat was serving 47 events at time of recon.

**A-Basin** has not been migrated to Alterra's platform despite the 2024 acquisition. When it is, it should fold into the `alterra` adapter and `abasin.js` can be deleted.

**Copper and Eldora** share a parent, so they likely share a platform — check whether one adapter covers both before writing two. Either use Playwright, or inspect the network tab for the JSON endpoint the page calls and hit that directly (faster and far more stable).

**Town calendars** (Phase 2): Frisco / Summit County for Copper, Dillon / Summit for A-Basin, Nederland for Eldora. Winter Park and Steamboat already include town events in their own feeds — no separate source needed.

**No existing aggregator fills this gap.** Colorado Ski Country USA's "What's Happening" page is marketing copy rather than a calendar, and its 20 member resorts exclude all four Vail Resorts mountains.

---

## 5. Front end

Static PWA on GitHub Pages. All filtering client-side over one JSON file — instant, works offline, no API.

- **Opens to today.** Date strip runs today → +7.
- **Filters:** pass (Ikon / Epic / All), distance slider, on-hill vs in-town toggle.
- **Distance:** straight-line from browser geolocation, defaulting to Denver when permission is denied. Live drive time comes later.
- **Cards:** resort, event title, time, location type. Nothing else.

Known limitation: straight-line distance will rank Eldora and Copper as near-equals when they are nothing alike on a Saturday morning. The static `fromDenverMin` field in the registry is a cheap fix whenever that becomes annoying.

---

## 6. Failure handling

Resort websites get redesigned roughly once a year. Scrapers will break. The design assumption is that they break, not that they might.

**The critical rule: if an adapter returns zero events, do not overwrite the last good file.** Keep the previous data, set `status: "stale"`, and surface "Copper: data 3 days old" in the UI.

An empty calendar must never be indistinguishable from a quiet weekend. That single rule is the difference between a tool that gets trusted and one that quietly gets abandoned.

Supporting measures:

- Each resort is isolated in its own adapter, so one break never takes down the app.
- Every resort file carries `updatedAt` and `status`.
- The Actions workflow should fail loudly — not silently — when any adapter returns zero.
- For fragile client-rendered sites and town calendars, prefer LLM-based extraction (fetch page → model pulls structured events) over CSS selectors. It survives redesigns far better and has no selectors to maintain.

---

## 7. Phasing

| Phase | Deliverable | Rationale |
|---|---|---|
| **0** | Registry + `alterra` adapter + Actions workflow → Winter Park and Steamboat committing nightly | Easiest source proves the entire chain end to end |
| **1** | `abasin` + `powdr` adapters (Playwright) | All five resorts live |
| **2** | Town calendars — Frisco/Summit, Dillon, Nederland | Likely the LLM adapter; no selectors to rot |
| **3** | Opening and closing day | Hand-seeded in the registry each fall. It's five dates — not worth a fragile scraper |
| **4** | Front-end filters, PWA install, offline cache | The actual product |
| **5** | Expand registry: Epic I-70 resorts, then all of Colorado | Where "adding a row" pays off |

**Later:** snow, lift status, CDOT drive conditions, live drive time, Utah.

**Phase 5 warning:** Vail Resorts sites are meaningfully more bot-hostile than Alterra's. Budget extra effort there, and expect the LLM adapter to earn its keep.

---

## 8. Cost

$0/month, permanently.

- Public repo → unlimited Actions minutes
- GitHub Pages → free, no deploy or credit cap
- No database, no API server, no third-party service in v1
- Nightly commits keep the scheduled workflow from being auto-disabled

The only future line item worth watching is a routing API for live drive time. Free tiers exist with request caps; the registry's static drive-time field is the fallback.
