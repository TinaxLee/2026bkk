// ★ 改版本只需改這一行，與 index.html 的 APP_VERSION 保持一致 ★
const CACHE_NAME = 'honeymoon-cache-v16.8';

const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon.png'
];

// ============================================================
// 1. 安裝階段：快取靜態資源
//    ⚠️ 不在這裡呼叫 skipWaiting()
//    改由 index.html 透過 postMessage 控制時機，避免強插造成問題
// ============================================================
self.addEventListener('install', event => {
  console.log(`📦 SW installing: ${CACHE_NAME}`);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => console.log(`✅ SW cached: ${CACHE_NAME}`))
  );
});

// ============================================================
// 2. 啟動階段：清除所有舊版快取，然後立刻接管所有頁面
// ============================================================
self.addEventListener('activate', event => {
  console.log(`🚀 SW activating: ${CACHE_NAME}`);
  event.waitUntil(
    caches.keys()
      .then(cacheNames => Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => {
            console.log(`🧹 刪除舊快取: ${name}`);
            return caches.delete(name);
          })
      ))
      .then(() => {
        console.log('✅ 舊快取清除完畢，開始接管所有頁面');
        return self.clients.claim(); // 立刻接管，不需等頁面重新整理
      })
  );
});

// ============================================================
// 3. 訊息監聽：接收 index.html 發來的 SKIP_WAITING 指令
//    時機：index.html 偵測到 updatefound → newWorker.state === 'installed'
//    → postMessage({ type: 'SKIP_WAITING' }) → 觸發這裡
// ============================================================
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('📨 收到 SKIP_WAITING，立刻接管...');
    self.skipWaiting();
  }
});

// ============================================================
// 4. 攔截請求：Network First（網路優先）
//    有網路 → 抓最新版並更新快取
//    無網路 → 從快取回傳（離線可用）
// ============================================================
self.addEventListener('fetch', event => {
  // 只處理 GET 請求，跳過 Firebase / API 等跨域請求
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        // 網路成功：同步更新快取
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
        }
        return networkResponse;
      })
      .catch(() => {
        // 網路失敗：從快取回傳
        return caches.match(event.request);
      })
  );
});
