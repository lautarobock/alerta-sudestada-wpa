'use strict';

/**
 * Custom service worker code for next-pwa.
 * Handles periodicsync events to check river height in background and show notifications.
 */

const DB_NAME = 'alerta-sudestada-sync';
const DB_VERSION = 1;
const STORE_NAME = 'state';
const KEY = 'sync-state';
const DEFAULT_THRESHOLDS = { warning: 2.5, alert: 3.0, critical: 3.5 };

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

function getSyncState() {
  return openDB().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(KEY);
      request.onerror = () => {
        db.close();
        reject(request.error);
      };
      request.onsuccess = () => {
        db.close();
        const result = request.result;
        if (result && result.thresholds && typeof result.lastStatus === 'string') {
          resolve(result);
        } else {
          resolve({ thresholds: DEFAULT_THRESHOLDS, lastStatus: 'normal' });
        }
      };
    });
  }).catch(() => ({ thresholds: DEFAULT_THRESHOLDS, lastStatus: 'normal' }));
}

function setSyncState(state) {
  return getSyncState().then((current) => {
    const merged = {
      thresholds: state.thresholds || current.thresholds,
      lastStatus: state.lastStatus || current.lastStatus,
    };
    return openDB().then((db) => {
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(merged, KEY);
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
      });
    });
  });
}

function getStatusFromHeight(height, thresholds) {
  if (height >= thresholds.critical) return 'critical';
  if (height >= thresholds.alert) return 'alert';
  if (height >= thresholds.warning) return 'warning';
  return 'normal';
}

async function syncRiverHeight() {
  const state = await getSyncState();
  const baseUrl = self.location.origin;
  const res = await fetch(`${baseUrl}/api/river-height`);
  if (!res.ok) return;
  const data = await res.json();
  if (!data || !data[0]) return;
  const latest = data[0];
  const height = latest.height ?? 0;
  const configuredStatus = getStatusFromHeight(height, state.thresholds);

  if (
    state.lastStatus &&
    state.lastStatus !== configuredStatus &&
    (configuredStatus === 'alert' || configuredStatus === 'critical')
  ) {
    const statusLabels = {
      alert: 'Alerta',
      critical: 'Crítico',
      warning: 'Advertencia',
      normal: 'Normal',
    };
    await self.registration.showNotification(
      `🚨 ${statusLabels[configuredStatus]} - Río Luján`,
      {
        body: `El nivel del río ha alcanzado ${height}m. Estado: ${statusLabels[configuredStatus]}`,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'river-alert',
        requireInteraction: true,
        data: { height, status: configuredStatus },
      }
    );
  }

  await setSyncState({ lastStatus: configuredStatus });
}

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'river-height-sync') {
    event.waitUntil(syncRiverHeight());
  }
});
