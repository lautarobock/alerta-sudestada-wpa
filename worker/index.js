'use strict';

/**
 * Custom service worker code for next-pwa.
 * Handles periodicsync events to check forecast (not current reading) and show notifications.
 * Alerts only once per forecast update - when forecast service updates (2-3x/day).
 */

const DB_NAME = 'alerta-sudestada-sync';
const DB_VERSION = 2;
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
  return openDB()
    .then((db) => {
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
          if (result && result.thresholds) {
            resolve({
              thresholds: result.thresholds,
              lastAlertedForecastMoment:
                typeof result.lastAlertedForecastMoment === 'string'
                  ? result.lastAlertedForecastMoment
                  : null,
            });
          } else {
            resolve({
              thresholds: DEFAULT_THRESHOLDS,
              lastAlertedForecastMoment: null,
            });
          }
        };
      });
    })
    .catch(() => ({
      thresholds: DEFAULT_THRESHOLDS,
      lastAlertedForecastMoment: null,
    }));
}

function setSyncState(state) {
  return getSyncState().then((current) => {
    const merged = {
      thresholds: state.thresholds || current.thresholds,
      lastAlertedForecastMoment:
        state.lastAlertedForecastMoment !== undefined
          ? state.lastAlertedForecastMoment
          : current.lastAlertedForecastMoment,
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

function getWorstStatusFromForecast(values, thresholds) {
  if (!values || values.length === 0) return null;
  const statusOrder = { normal: 0, warning: 1, alert: 2, critical: 3 };
  let worstStatus = 'normal';
  let maxValue = 0;
  for (const v of values) {
    const s = getStatusFromHeight(v.value, thresholds);
    if (statusOrder[s] > statusOrder[worstStatus]) {
      worstStatus = s;
      maxValue = v.value;
    } else if (s === worstStatus && v.value > maxValue) {
      maxValue = v.value;
    }
  }
  return { status: worstStatus, maxValue };
}

async function syncForecast() {
  const state = await getSyncState();
  const baseUrl = self.location.origin;
  const res = await fetch(`${baseUrl}/api/forecast`);
  if (!res.ok) return;
  const data = await res.json();
  if (!data || !data.values || data.values.length === 0) return;

  const worst = getWorstStatusFromForecast(data.values, state.thresholds);
  if (!worst || (worst.status !== 'alert' && worst.status !== 'critical')) return;

  const forecastMoment = data.moment || null;
  if (!forecastMoment) return;

  if (state.lastAlertedForecastMoment === forecastMoment) return;

  const statusLabels = {
    alert: 'Alerta',
    critical: 'Crítico',
    warning: 'Advertencia',
    normal: 'Normal',
  };
  await self.registration.showNotification(
    `🚨 ${statusLabels[worst.status]} - Río Luján (pronóstico)`,
    {
      body: `El pronóstico indica que uno o más valores superarán ${worst.maxValue.toFixed(2)}m. Estado: ${statusLabels[worst.status]}`,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'river-alert',
      requireInteraction: true,
      data: { height: worst.maxValue, status: worst.status },
    }
  );

  await setSyncState({ lastAlertedForecastMoment: forecastMoment });
}

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'river-height-sync') {
    event.waitUntil(syncForecast());
  }
});
