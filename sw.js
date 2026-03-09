const CACHE_NAME = 'honeymoon-cache-v7.18';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon.png' 
];

// 🌟 1. 安裝階段：下載新檔案，並「強制立刻接管」
self.addEventListener('install', event => {
  self.skipWaiting(); // 關鍵！不要等舊版關閉，新版立刻插隊接管
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

// 🌟 2. 啟動階段：「殺掉」所有不是 v7.6 的舊快取
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🧹 清除舊的快取垃圾:', cacheName);
            return caches.delete(cacheName); // 把舊的 index.html 徹底刪除
          }
        })
      );
    }).then(() => self.clients.claim()) // 關鍵！立刻對目前開啟的網頁發揮作用
  );
});

// 🌟 3. 攔截請求：網路優先 (Network First)
// 為了避免妳一直卡快取，我們改成「有網路時抓最新版，斷網時才用快取」
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
