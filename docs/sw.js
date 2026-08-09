// Service worker: makes the app installable and usable with no signal in the mountains.
//
// Shell (html/css/icon) is cache-first — it rarely changes.
// Data is network-first with a cache fallback — you always get the freshest events when
// online, and the last known set when you're on a lift with no bars.

const SHELL = 'cornice-shell-v2';
const DATA = 'cornice-data-v1';
const SHELL_FILES = ['./', './index.html', './manifest.json', './icon.svg', './favicon.svg'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(SHELL_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== SHELL && k !== DATA).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (url.pathname.includes('/data/')) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(DATA).then((c) => c.put(e.request, copy));
          return res;
        })
        .catch(() => caches.match(e.request, { ignoreSearch: true })),
    );
    return;
  }

  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request)));
});
