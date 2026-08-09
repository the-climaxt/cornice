// Arapahoe Basin — plain server-rendered HTML, no framework, no API.
//
// Each event renders as:
//   <div class="event-desc">
//     <span>September 19, 2026 - September 20, 2026</span>
//     <a href="/event/oktoberfest/"><h6>Oktoberfest</h6></a>
//   </div>
//
// A-Basin has been Alterra-owned since 2024 but has NOT been migrated to the Alterra
// platform. When it is, delete this file and point resorts.json at the 'alterra' adapter.

import { getText, stripHtml, parseLongDate } from '../lib/util.js';
import { makeEvent } from '../lib/event.js';

const BLOCK_RE = /<div[^>]*class="[^"]*event-desc[^"]*"[^>]*>([\s\S]*?)<\/div>/g;

/** "September 19, 2026 - September 20, 2026" -> { start, end } */
export function parseDateRange(text) {
  const cleaned = stripHtml(text).replace(/–|—/g, '-');
  const parts = cleaned.split(/\s+-\s+/).map((p) => p.trim()).filter(Boolean);
  const start = parseLongDate(parts[0]);
  if (!start) return null;
  const end = parts[1] ? parseLongDate(parts[1]) : start;
  return { start, end: end || start };
}

export function parseAbasinHtml(html, resort) {
  const out = [];
  BLOCK_RE.lastIndex = 0;
  let m;
  while ((m = BLOCK_RE.exec(html)) !== null) {
    const block = m[1];

    const dateText = (block.match(/<span[^>]*>([\s\S]*?)<\/span>/) || [])[1];
    const title = (block.match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/) || [])[1];
    const href = (block.match(/<a[^>]*href="([^"]+)"/) || [])[1];
    if (!dateText || !title) continue;

    const range = parseDateRange(dateText);
    if (!range) continue;

    const ev = makeEvent({
      resortId: resort.id,
      title,
      start: range.start,
      end: range.end,
      allDay: true,
      locationType: 'on-mountain',
      source: 'resort',
      url: href ? new URL(href, 'https://www.arapahoebasin.com').href : resort.sources.events.url,
    });
    if (ev) out.push(ev);
  }
  return out;
}

export async function fetchEvents(resort) {
  const html = await getText(resort.sources.events.url);
  const events = parseAbasinHtml(html, resort);
  if (!events.length) throw new Error('no .event-desc blocks parsed — page markup may have changed');

  // De-dupe: the page can render the same event in both a list and a calendar view.
  const seen = new Set();
  return events.filter((e) => (seen.has(e.id) ? false : seen.add(e.id)));
}
