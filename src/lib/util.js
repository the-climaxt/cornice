// Shared helpers. No dependencies — Node 20+ built-ins only.

import { createHash } from 'node:crypto';

export const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

export const HEADERS = {
  'user-agent': UA,
  accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'accept-language': 'en-US,en;q=0.9',
};

/** Fetch with retries and a timeout. Throws on final failure. */
export async function get(url, { headers = HEADERS, tries = 3, timeoutMs = 20000 } = {}) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), timeoutMs);
      const res = await fetch(url, { headers, signal: ctrl.signal, redirect: 'follow' });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (err) {
      lastErr = err;
      if (i < tries - 1) await sleep(500 * 2 ** i);
    }
  }
  throw new Error(`GET ${url} failed after ${tries} tries: ${lastErr?.message}`);
}

export const getText = async (url, opts) => (await get(url, opts)).text();
export const getJson = async (url, opts) =>
  (await get(url, { headers: { ...HEADERS, accept: 'application/json,*/*' }, ...opts })).json();

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Run tasks with a concurrency cap. Failures resolve to null rather than rejecting the batch. */
export async function pool(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const i = cursor++;
      try {
        results[i] = await worker(items[i], i);
      } catch {
        results[i] = null;
      }
    }
  });
  await Promise.all(runners);
  return results;
}

const ENTITIES = {
  '&quot;': '"', '&#34;': '"', '&apos;': "'", '&#39;': "'",
  '&lt;': '<', '&gt;': '>', '&nbsp;': ' ', '&mdash;': '—', '&ndash;': '–',
  '&rsquo;': '’', '&lsquo;': '‘', '&ldquo;': '“', '&rdquo;': '”', '&hellip;': '…',
};

/** Decode HTML entities. &amp; is done last so &amp;quot; resolves correctly. */
export function decodeEntities(s) {
  if (!s) return '';
  let out = String(s);
  for (const [k, v] of Object.entries(ENTITIES)) out = out.split(k).join(v);
  out = out.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
  return out.split('&amp;').join('&');
}

/** Strip tags and collapse whitespace. */
export function stripHtml(s) {
  if (!s) return '';
  return decodeEntities(String(s).replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

/** Deterministic id so the same event never duplicates between runs. */
export function stableId(resortId, title, startYmd) {
  return createHash('sha1')
    .update(`${resortId}|${(title || '').trim().toLowerCase()}|${(startYmd || '').slice(0, 10)}`)
    .digest('hex')
    .slice(0, 16);
}

/** YYYY-MM-DD in a given IANA timezone. */
export function dayInTz(date, timeZone = 'America/Denver') {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(date);
}

export const todayInTz = (tz) => dayInTz(new Date(), tz);

/** Add days to a YYYY-MM-DD string without timezone drift. */
export function addDays(ymd, n) {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}

export function daysBetween(a, b) {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000);
}

/** Day of week for YYYY-MM-DD. 0 = Sunday. */
export function dowOf(ymd) {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

const MONTHS = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7,
  august: 8, september: 9, october: 10, november: 11, december: 12,
  jan: 1, feb: 2, mar: 3, apr: 4, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
};

/** Parse "September 19, 2026" / "Sep. 19, 2026" -> "2026-09-19". Returns null if unparseable. */
export function parseLongDate(str) {
  if (!str) return null;
  const m = String(str).match(/([A-Za-z]+)\.?\s+(\d{1,2}),?\s+(\d{4})/);
  if (!m) return null;
  const mo = MONTHS[m[1].toLowerCase()];
  if (!mo) return null;
  return `${m[3]}-${String(mo).padStart(2, '0')}-${String(Number(m[2])).padStart(2, '0')}`;
}

/** Parse "MM/DD/YYYY" -> "YYYY-MM-DD". */
export function parseSlashDate(str) {
  const m = String(str || '').match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!m) return null;
  return `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`;
}

/** Accepts YYYY-MM-DD, MM/DD/YYYY, ISO datetimes, or long-form text. */
export function toYmd(v) {
  if (!v) return null;
  const s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  return parseSlashDate(s) || parseLongDate(s);
}
