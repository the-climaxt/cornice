// Alterra platform (Winter Park, Steamboat).
//
// The whole event list ships inside the HTML as an entity-encoded JSON array in a
// <var aria-hidden="true" class="results hidden"> tag. No API call, no pagination —
// the tag holds every event and the page just does client-side paging over it.
//
// NOTE: steamboat.com sits behind Imperva/Incapsula and returns a ~1.1KB challenge page
// to a plain fetch. Parsing is identical once the real HTML is in hand; only retrieval
// differs. See QUESTIONS.md Q1.

import { getText, decodeEntities, toYmd } from '../lib/util.js';
import { makeEvent, classifyLocation } from '../lib/event.js';

const VAR_RE = /<var[^>]*class="results hidden"[^>]*>([\s\S]*?)<\/var>/g;

/** Pull the events array out of the page's <var> blocks. */
export function parseAlterraHtml(html) {
  const blocks = [];
  let m;
  VAR_RE.lastIndex = 0;
  while ((m = VAR_RE.exec(html)) !== null) blocks.push(m[1].trim());

  for (const block of blocks) {
    let parsed;
    try {
      parsed = JSON.parse(decodeEntities(block));
    } catch {
      continue;
    }
    if (Array.isArray(parsed) && parsed.length && parsed[0] && 'startDateDateTime' in parsed[0]) {
      return parsed;
    }
  }
  return null;
}

const tagNames = (arr) =>
  (Array.isArray(arr) ? arr : []).map((t) => (typeof t === 'string' ? t : t?.displayName || t?.name)).filter(Boolean);

export async function fetchEvents(resort) {
  const src = resort.sources.events;
  const html = await getText(src.url);

  if (html.length < 5000 || /_Incapsula_Resource|distil_referrer/.test(html)) {
    throw new Error(
      `bot-protection challenge returned instead of page content (${html.length} bytes) — needs a real browser`,
    );
  }

  const raw = parseAlterraHtml(html);
  if (!raw) throw new Error('no "results hidden" events array found — page markup may have changed');

  const origin = new URL(src.url).origin;

  return raw
    .map((e) => {
      const locations = tagNames(e.locations);
      const start = toYmd(e.startDateDateTime) || toYmd(e.startDate);
      const end = toYmd(e.endDateDateTime) || toYmd(e.endDate);

      return makeEvent({
        resortId: resort.id,
        title: e.name || e.title,
        description: e.subtitle || e.description,
        start,
        end,
        allDay: e.allDay !== false,
        locationType: classifyLocation(locations[0]),
        venue: locations.join(', '),
        source: 'resort',
        categories: tagNames(e.types),
        url: e.targetUrl ? new URL(e.targetUrl, origin).href : src.url,
        imageUrl: e.imageUrl ? new URL(e.imageUrl, origin).href : '',
        recurrence: e.recurrence,
        weekday: e.formattedShortDayOfWeek,
      });
    })
    .filter(Boolean);
}
