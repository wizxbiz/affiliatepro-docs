// Legacy Firebase Messaging service worker kept as a compatibility shim.
// New notifications use /js/push-notifications.js and /api/v1/push/subscribe.

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (_) {
    payload = { title: 'TukTukFeed', body: event.data ? event.data.text() : '' };
  }

  const notification = payload.notification || payload;
  const title = notification.title || 'TukTukFeed';
  const options = {
    body: notification.body || '',
    icon: notification.icon || '/assets/images/icon-192.png',
    badge: notification.badge || '/assets/images/icon-192.png',
    data: notification.data || payload.data || {},
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
      return undefined;
    })
  );
});
