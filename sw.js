const CACHE_NAME = 'honeymoon-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon.png' // 確保妳的圖示檔名正確
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)));
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
