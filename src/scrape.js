// Orchestrator. Reads resorts.json, runs each resort's adapter, writes data/*.json
// and data/feed.json.
//
// THE RULE THAT MATTERS (PLAN.md §6, DECISIONS.md D-014):
// If an adapter fails or returns zero events, we do NOT overwrite the last good file.
// We keep the previous events, flip status to "stale", and record the error. An empty
// calendar must never be indistinguishable from a quiet weekend.
//
// Status values:
//   ok      - fresh data this run
//   stale   - adapter failed or returned nothing; showing last known good data
//   pending - no working adapter yet (Phase 1+). Expected. Never alarms.

import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { todayInTz, addDays } from './lib/util.js';
import { pruneStale, sortEvents } from './lib/event.js';

import * as alterra from './adapters/alterra.js';
import * as powdr from './adapters/powdr.js';
import * as abasin from './adapters/abasin.js';

const ADAPTERS = { alterra, powdr, abasin };

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Data lives under docs/ because GitHub Pages serves that folder. Keeping it there
// means the PWA fetches feed.json same-origin at runtime (D-009) with no second copy
// and no cross-origin dependency on raw.githubusercontent.com.
const DATA_DIR = path.join(ROOT, 'docs', 'data');

/** Keep events that ended within the last week so the UI can show "just happened". */
const RETAIN_DAYS_BACK = 7;

async function readJson(file, fallback = null) {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch {
    return fallback;
  }
}

const writeJson = (file, obj) => writeFile(file, JSON.stringify(obj, null, 2) + '\n', 'utf8');

async function runResort(resort, cutoff) {
  const file = path.join(DATA_DIR, `${resort.id}.json`);
  const prev = await readJson(file);
  const now = new Date().toISOString();

  const base = {
    resort: resort.id,
    name: resort.name,
    updatedAt: now,
    status: 'ok',
    lastGoodAt: prev?.lastGoodAt || null,
    lastError: null,
    ops: resort.ops || { openingDay: null, closingDay: null },
    events: [],
    snow: null,
    lifts: null,
    drive: null,
  };

  if (resort.status === 'pending') {
    return {
      outcome: 'pending',
      file,
      payload: {
        ...base,
        status: 'pending',
        lastError: resort.notes || 'no working adapter yet',
        events: prev?.events || [],
        lastGoodAt: prev?.lastGoodAt || null,
      },
    };
  }

  const mod = ADAPTERS[resort.sources?.events?.adapter];
  if (!mod) {
    return {
      outcome: 'fail',
      file,
      error: `unknown adapter "${resort.sources?.events?.adapter}"`,
      payload: { ...base, status: 'stale', lastError: `unknown adapter`, events: prev?.events || [] },
    };
  }

  try {
    const raw = await mod.fetchEvents(resort);
    const events = sortEvents(pruneStale(raw, cutoff));

    if (!events.length) throw new Error('adapter returned 0 usable events');

    return {
      outcome: 'ok',
      file,
      count: events.length,
      payload: { ...base, status: 'ok', lastGoodAt: now, events },
    };
  } catch (err) {
    // Preserve the last good data rather than publishing an empty calendar.
    return {
      outcome: 'fail',
      file,
      error: err.message,
      payload: {
        ...base,
        status: 'stale',
        lastError: err.message,
        events: prev?.events || [],
        lastGoodAt: prev?.lastGoodAt || null,
      },
    };
  }
}

async function main() {
  const onlyIdx = process.argv.indexOf('--only');
  const only = onlyIdx > -1 ? process.argv[onlyIdx + 1] : null;

  const resorts = await readJson(path.join(ROOT, 'resorts.json'), []);
  const targets = only ? resorts.filter((r) => r.id === only) : resorts;
  if (!targets.length) {
    console.error(`no resorts matched${only ? ` --only ${only}` : ''}`);
    process.exit(1);
  }

  if (!existsSync(DATA_DIR)) await mkdir(DATA_DIR, { recursive: true });

  const today = todayInTz('America/Denver');
  const cutoff = addDays(today, -RETAIN_DAYS_BACK);

  console.log(`Mountain Events scrape — ${today} (retaining events on/after ${cutoff})\n`);

  const results = [];
  for (const resort of targets) {
    process.stdout.write(`  ${resort.name.padEnd(18)} `);
    const r = await runResort(resort, cutoff);
    await writeJson(r.file, r.payload);
    results.push({ resort, ...r });

    if (r.outcome === 'ok') console.log(`ok       ${r.count} events`);
    else if (r.outcome === 'pending') console.log('pending  (no adapter yet, not an error)');
    else console.log(`STALE    ${r.error}`);
  }

  // Merged feed — this is the single file the front end fetches at runtime.
  const feedResorts = [];
  const allEvents = [];
  for (const { resort } of results) {
    const payload = await readJson(path.join(DATA_DIR, `${resort.id}.json`));
    if (!payload) continue;
    feedResorts.push({
      id: resort.id,
      name: resort.name,
      lat: resort.lat,
      lon: resort.lon,
      passes: resort.passes,
      parent: resort.parent,
      driveTime: resort.driveTime,
      ops: payload.ops,
      status: payload.status,
      updatedAt: payload.updatedAt,
      lastGoodAt: payload.lastGoodAt,
      eventCount: payload.events.length,
    });
    allEvents.push(...payload.events);
  }

  await writeJson(path.join(DATA_DIR, 'feed.json'), {
    generatedAt: new Date().toISOString(),
    today,
    resorts: feedResorts,
    events: sortEvents(allEvents),
  });

  const failed = results.filter((r) => r.outcome === 'fail');
  const ok = results.filter((r) => r.outcome === 'ok');
  const pending = results.filter((r) => r.outcome === 'pending');

  console.log(
    `\n${ok.length} ok · ${failed.length} stale · ${pending.length} pending · ` +
      `${allEvents.length} events total`,
  );

  if (failed.length) {
    console.error('\nFAILURES (last good data preserved):');
    for (const f of failed) console.error(`  ${f.resort.name}: ${f.error}`);
    process.exit(1); // fail loudly — a red X in Actions is the alarm
  }
}

main().catch((err) => {
  console.error('fatal:', err);
  process.exit(1);
});
