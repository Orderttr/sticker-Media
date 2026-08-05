// Service Worker สำหรับ "คลัง Media & STK (User)"
// แคชเฉพาะไฟล์หลักของแอป (เปลือกแอป) เพื่อให้เปิดใช้งานได้แม้ไม่มีอินเทอร์เน็ต
// ข้อมูลสติ๊กเกอร์ (stickers-data.json) และรูปภาพ (โฟลเดอร์ images/) ถูกติดตั้ง
// มาพร้อมโปรแกรมโดยตัวติดตั้งแล้ว หน้าเว็บดึงไฟล์เหล่านี้ผ่าน fetch() ปกติ
// (ไม่ใช้ File System Access API อีกต่อไป) — index.html แนบ query string
// กันแคชไว้ตอนโหลด stickers-data.json อยู่แล้ว จึงไม่ต้องกันแคชไฟล์นี้ที่นี่เป็นพิเศษ
const CACHE_NAME = 'sticker-vault-user-cache-v9';
const APP_SHELL = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
     .then(() => self.clients.matchAll({ type: 'window' }))
     .then((clients) => clients.forEach((client) => client.navigate(client.url)))
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response && response.status === 200 && event.request.url.startsWith(self.location.origin)) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);
    })
  );
});
