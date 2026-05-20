// ============================================
// 찰떡메모 Service Worker - 잠금화면 푸시 알림
// ============================================

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// 📱 푸시 이벤트: 서버에서 알림이 도착했을 때
self.addEventListener('push', (event) => {
  let data = { title: '찰떡메모', body: '약속 시간이 다가왔습니다!', icon: '/icon-192.png' };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icon-192.png',
    badge: '/icon-72.png',
    tag: data.tag || 'chaltteok-reminder',
    renotify: true,
    requireInteraction: false,  // 자동으로 사라지게
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/',
      memoId: data.memoId || null,
    },
    actions: [
      { action: 'open', title: '📋 메모 보기' },
      { action: 'dismiss', title: '확인했어요' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || '⏰ 찰떡메모 알림', options)
  );
});

// 👆 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 이미 열린 탭이 있으면 포커스
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // 없으면 새 탭 열기
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
