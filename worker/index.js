'use strict';

/**
 * Custom service worker: Web Push from server only.
 */

self.addEventListener('push', (event) => {
  let data = { title: 'Alerta Sudestada', body: 'Nueva alerta del río' };
  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch {
      data.body = event.data.text();
    }
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: data.tag || 'river-alert',
      requireInteraction: true,
      data: data.data,
    })
  );
});

function notificationScrollSection(data) {
  if (!data) return null;
  if (data.type === 'wind') return 'clima';
  if (data.type === 'river') return 'mareas';
  if (data.height !== undefined || data.status) return 'mareas';
  return null;
}

function notificationOpenUrl(data) {
  const section = notificationScrollSection(data);
  if (section) {
    return new URL(`/#${section}`, self.location.origin).href;
  }
  return new URL('/', self.location.origin).href;
}

function focusExistingClient(clientList, url, data) {
  const scrollSection = notificationScrollSection(data);

  for (const client of clientList) {
    if (!client.url.startsWith(self.location.origin)) continue;

    if (scrollSection) {
      client.postMessage({ type: 'alerta-scroll', section: scrollSection });
    }

    if ('navigate' in client) {
      return client.navigate(url).then((navigated) => {
        if (navigated && 'focus' in navigated) return navigated.focus();
        if ('focus' in client) return client.focus();
      });
    }

    if ('focus' in client) {
      return client.focus();
    }
  }

  if (self.clients.openWindow) {
    return self.clients.openWindow(url);
  }
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const url = notificationOpenUrl(data);

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => focusExistingClient(clientList, url, data))
  );
});
