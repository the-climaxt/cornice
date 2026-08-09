# Open Questions

Things that need your call. Answer whichever matter; I'll act on them next session.
Resolved items move to `DECISIONS.md` and get deleted from here.

---

## Q1 — Steamboat is behind bot protection. How hard do we push? ⬅ **the only blocking one**

Steamboat is the one resort that didn't work. `steamboat.com` sits behind **Imperva/Incapsula**, and a plain request gets a 1.1 KB challenge page instead of the site. Winter Park — same parent company, same page markup — has no protection at all.

Its adapter is already written and would work unchanged; the only problem is retrieval.

**Options:**

| | Approach | Cost | Risk |
|---|---|---|---|
| **A** | Add Playwright to the nightly job and load Steamboat in a real browser | ~40s per run, free on Actions | Usually defeats Incapsula, but not guaranteed. Adds a ~300MB dependency to CI |
| **B** | Leave Steamboat `pending` | Free | You lose one resort — and it's the 3-hour drive you'd plan hardest for |
| **C** | Drop Steamboat from v1 | Free | Same as B, but honest about it |

**My take: A, but not urgently.** Steamboat is a 3-hour drive — it's the least likely of the five to be a spontaneous "where should I ride today" answer, which is what this tool is for. The other four are working. I'd ship, use it for a few weeks, and add Playwright when Steamboat's absence actually annoys you.

Right now it's marked `"status": "pending"` in `resorts.json`, which means it never triggers a false alarm.

---

## Q2 — Should town calendars get their own sources?

Currently town coverage is whatever the resorts publish themselves, and it's uneven:

- **Winter Park** — excellent. Tags events "Town of Winter Park" natively. Nothing more needed.
- **Eldora** — decent by accident. Nederland events (Ned Jazz & Wine at Chipeta Park) appear in Eldora's own feed.
- **Copper** — nothing. Frisco, Dillon, and Silverthorne calendars are separate sites.
- **A-Basin** — nothing. Dillon/Keystone town events are separate.

Adding Frisco/Summit and Dillon would take two more adapters. Worth it, or is resort-published town coverage enough? Right now you'd miss a Friday night thing in Frisco entirely.

---

## Q3 — A-Basin only returns 7 events. Is that everything?

A-Basin's page renders a plain list and we're parsing all of it, but 7 feels thin next to Winter Park's 25. It may genuinely be a quiet summer, or there may be a "load more" we're not triggering. Worth a look at [their events page](https://www.arapahoebasin.com/events/) — if you see events there that aren't in the app, tell me and I'll dig.

---

## Q4 — How far ahead should the app look?

Right now the date strip shows **today plus 7 days**, matching "the next few days." The data goes out to October, so we could show more. Is a week the right window, or would you rather have two?

---

## Q5 — Categories are missing for Copper and Eldora

Winter Park gives rich event types (Concerts and Live Music, Competitions and Races, Demos, Festivals, Health & Wellness). Copper and Eldora expose no category field in their data, so their events have no tags. That's fine now, but if you ever want a "music only" filter, those two resorts would be invisible to it. Worth inferring categories from event titles later?

---

## Q6 — Venue text vs. location bucket

"Ned Jazz & Wine" happens at **Chipeta Park in Nederland** — a town event — but it's tagged `on-mountain` because our classifier only sees the venue string "Chipeta Park" and doesn't recognise it. The classifier keys off words like *town*, *village*, *Nederland*, *Frisco*. Adding a small venue→bucket lookup per resort would fix it. Low priority, but it's the kind of thing that quietly makes the "in town" filter untrustworthy.

---

## Q7 — Self-host the brand fonts?

Staatliches, DM Mono, and Jost currently load from Google Fonts. Two consequences:

- **Offline the app falls back** to Impact / system mono / system-ui. It still works, just doesn't look like Cornice — which matters given the whole point is using this with bad signal on I-70.
- It's a third-party request on every cold load.

All three are OFL-licensed, so self-hosting is allowed. Dropping four woff2 files into `docs/fonts/` (~60 KB total) fixes both. Worth doing?

---

## Q8 — Rename the repository to `cornice`?

The product is Cornice; the repo is still `mountain-events`. Renaming on GitHub is one click and GitHub auto-redirects the old URL, but it would change your Pages address from
`the-climaxt.github.io/mountain-events/` to `the-climaxt.github.io/cornice/` — and you'd re-point GitHub Desktop at the renamed folder.

Cleaner branding, small one-time disruption. Your call. Doing it *before* you add it to your home screen is much easier than after.
