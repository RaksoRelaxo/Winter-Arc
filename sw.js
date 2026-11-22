'use strict';

const cachePrefix = 'winter-arc:' + self.registration.scope + ':';
const cacheName = cachePrefix + '6';
const index = new URL('./index.html', self.registration.scope).href;
const shell = [
  './', './index.html', './style.css', './plan.js', './stats.js', './app.js',
  './manifest.webmanifest', './assets/icon-192.png', './assets/icon-512.png',
  './assets/winter-gym.webp'
].map(path => new URL(path, self.registration.scope).href);

self.addEventListener('install', event => {
  event.waitUntil(caches.open(cacheName)
    .then(cache => cache.addAll(shell.map(url => new Request(url, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(key => key.startsWith(cachePrefix) && key !== cacheName)
      .map(key => caches.delete(key))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  url.search = '';
  url.hash = '';
  if (!shell.includes(url.href)) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(async () => {
      const cache = await caches.open(cacheName);
      return cache.match(index);
    }));
    return;
  }
  event.respondWith(caches.open(cacheName).then(async cache => {
    const cached = await cache.match(url.href);
    return cached ?? fetch(event.request);
  }));
});
