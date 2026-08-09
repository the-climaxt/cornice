// POWDR platform (Copper, Eldora) — Gatsby front end over a Drupal backend.
//
// The events listing page renders client-side, so fetching it gives you nothing.
// But every event is its own Gatsby page, and Gatsby publishes each page's data at
//   /page-data/<path>/page-data.json
// The sitemap lists them all, so: sitemap -> filter event URLs -> fetch each page's JSON.
// No browser required.
//
// Cost is one request per event. Both sites are in the low hundreds and many are
// historical, so we prune anything already finished before doing the detail fetches
// is not possible (dates live in the detail), but we do cap concurrency to stay polite.

import { getText, getJson, pool, stripHtml, toYmd } from '../lib/util.js';
import { makeEvent, classifyLocation } from '../lib/event.js';

const CONCURRENCY = 6;

function sitemapUrls(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}

/** Gatsby page-data path for a site-relative URL. */
function pageDataUrl(origin, href) {
  const path = new URL(href).pathname.replace(/^\/|\/$/g, '');
  return `${origin}/page-data/${path}/page-data.json`;
}

function nodeFrom(json) {
  const d = json?.result?.data;
  return d?.eventContent?.nodes?.[0] || d?.pageContent?.nodes?.[0] || null;
}

export async function fetchEvents(resort) {
  const src = resort.sources.events;
  const origin = new URL(src.url).origin;

  const xml = await getText(src.sitemap);
  const all = sitemapUrls(xml);

  // Event detail pages only — drop the listing/index pages themselves.
  const eventUrls = all.filter((u) => {
    if (!u.includes(src.pathPattern)) return false;
    const tail = u.split(src.pathPattern)[1] || '';
    return tail.replace(/\/$/, '').length > 0;
  });

  if (!eventUrls.length) throw new Error(`sitemap had no URLs under "${src.pathPattern}"`);

  const results = await pool(eventUrls, CONCURRENCY, async (href) => {
    const json = await getJson(pageDataUrl(origin, href));
    const n = nodeFrom(json);
    if (!n) return null;

    const start = toYmd(n.field_date || n.field_datestamp);
    if (!start) return null;

    const venue = n.field_venue || n.field_location || '';

    return makeEvent({
      resortId: resort.id,
      title: n.field_display_title || n.title,
      description: n.field_short_description || stripHtml(n.body?.value || ''),
      start,
      end: toYmd(n.field_end_date) || start,
      allDay: !n.field_hours?.value,
      timeText: stripHtml(n.field_hours?.value || ''),
      locationType: classifyLocation(venue),
      venue,
      source: 'resort',
      categories: [],
      url: href,
      imageUrl: '',
    });
  });

  const events = results.filter(Boolean);
  if (!events.length) throw new Error(`fetched ${eventUrls.length} event pages but parsed 0 events`);
  return events;
}
