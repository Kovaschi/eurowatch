/* EuroWatch Service Worker — v3 */
'use strict';

const CACHE = 'eurowatch-v3';
const SHELL = ['.', 'index.html', 'manifest.json', 'icon.svg'];

// Domini da NON cachare (dati live e tile mappa: sempre rete)
const NO_CACHE = [
  'basemaps.cartocdn.com',
  'api.allorigins.win',
  'corsproxy.io',
  'api.rss2json.com',
  'api.frankfurter.dev',
  'api.coingecko.com',
  'stooq.com'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (NO_CACHE.some(h => url.hostname.includes(h))) return; // dati live: solo rete

  // Shell e CDN statici: network-first con fallback cache (aggiornamenti rapidi, offline ok)
  e.respondWith(
    fetch(e.request)
      .then(resp => {
        if (resp && resp.status === 200) {
          const copy = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return resp;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
