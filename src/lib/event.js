// Normalizes whatever an adapter scrapes into the one event shape the app uses.

import { stableId, addDays, daysBetween, dowOf, stripHtml } from './util.js';

/** Longest span we will expand into concrete days. Guards against a bad end date exploding the feed. */
const MAX_SPAN_DAYS = 400;

const DOW = { sun: 0, mon: 1, tue: 2, tues: 2, wed: 3, thu: 4, thur: 4, thurs: 4, fri: 5, sat: 6 };

/**
 * Turn a start/end range into the concrete days the event actually happens.
 * - recurrence "weekly" + a weekday  -> just that weekday within the range
 * - everything else                  -> every day in the range
 * This is what makes "what's on today?" answerable. A festival that runs
 * Jun-Sep every Friday must not show up as happening on a Tuesday.
 */
export function expandDays(startYmd, endYmd, { recurrence, weekday } = {}) {
  if (!startYmd) return [];
  const end = endYmd && endYmd >= startYmd ? endYmd : startYmd;
  const span = daysBetween(startYmd, end);
  if (span < 0) return [startYmd];
  if (span > MAX_SPAN_DAYS) return [startYmd];

  const weeklyDow = /week/i.test(recurrence || '') ? DOW[String(weekday || '').toLowerCase().slice(0, 4).replace(/[^a-z]/g, '')] : undefined;

  const days = [];
  for (let i = 0; i <= span; i++) {
    const d = addDays(startYmd, i);
    if (weeklyDow === undefined || dowOf(d) === weeklyDow) days.push(d);
  }
  return days.length ? days : [startYmd];
}

/**
 * Build a normalized event. Returns null when there is no usable title or date,
 * so callers can filter with .filter(Boolean).
 */
export function makeEvent({
  resortId,
  title,
  description = '',
  start,
  end = null,
  allDay = true,
  timeText = '',
  locationType = 'on-mountain',
  venue = '',
  source = 'resort',
  categories = [],
  url = '',
  imageUrl = '',
  recurrence = '',
  weekday = '',
}) {
  const cleanTitle = stripHtml(title);
  if (!cleanTitle || !start) return null;

  const days = expandDays(start, end, { recurrence, weekday });

  return {
    id: stableId(resortId, cleanTitle, start),
    resortId,
    title: cleanTitle,
    description: stripHtml(description).slice(0, 400),
    start,
    end: end || start,
    days,
    allDay: Boolean(allDay),
    timeText: stripHtml(timeText),
    locationType,
    venue: stripHtml(venue),
    source,
    categories: [...new Set(categories.filter(Boolean).map((c) => stripHtml(c)))],
    url,
    imageUrl,
    recurrence: recurrence || null,
  };
}

/**
 * Map a source's own location wording onto our three buckets.
 * Anything unrecognised stays 'on-mountain', which is the safe default for a resort feed.
 */
export function classifyLocation(raw) {
  const s = String(raw || '').toLowerCase();
  if (!s) return 'on-mountain';
  if (/town|nederland|frisco|dillon|silverthorne|downtown/.test(s)) return 'town';
  if (/village|base area|plaza|resort village|center village/.test(s)) return 'village';
  if (/mountain|on.?hill|summit|peak|lodge/.test(s)) return 'on-mountain';
  return 'on-mountain';
}

/** Drop events that finished before `fromYmd`, and trim day lists to the retained window. */
export function pruneStale(events, fromYmd) {
  const out = [];
  for (const e of events) {
    const days = e.days.filter((d) => d >= fromYmd);
    if (!days.length) continue;
    out.push({ ...e, days });
  }
  return out;
}

/** Stable sort: soonest first, then resort, then title. */
export function sortEvents(events) {
  return events.sort(
    (a, b) =>
      (a.days[0] || '').localeCompare(b.days[0] || '') ||
      a.resortId.localeCompare(b.resortId) ||
      a.title.localeCompare(b.title),
  );
}
