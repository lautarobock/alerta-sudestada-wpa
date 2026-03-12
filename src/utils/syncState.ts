/**
 * IndexedDB sync state for service worker background sync.
 * The service worker cannot access localStorage, so we store thresholds and
 * lastAlertedForecastMoment in IndexedDB for the periodicsync handler to read.
 * Alerts are based on forecast (not current reading) and only once per forecast update.
 */

const DB_NAME = "alerta-sudestada-sync";
const DB_VERSION = 2; // Bump for schema change: lastStatus -> lastAlertedForecastMoment
const STORE_NAME = "state";
const KEY = "sync-state";

export interface SyncState {
  thresholds: { warning: number; alert: number; critical: number };
  /** ISO string of forecast.moment we last alerted for - only alert once per forecast update */
  lastAlertedForecastMoment: string | null;
}

const DEFAULT_STATE: SyncState = {
  thresholds: { warning: 2.5, alert: 3.0, critical: 3.5 },
  lastAlertedForecastMoment: null,
};

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

/**
 * Get sync state from IndexedDB (works in both main thread and service worker)
 */
export async function getSyncState(): Promise<SyncState> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(KEY);
      request.onerror = () => {
        db.close();
        reject(request.error);
      };
      request.onsuccess = () => {
        db.close();
        const result = request.result;
        if (result && typeof result.thresholds === "object") {
          resolve({
            thresholds: result.thresholds,
            lastAlertedForecastMoment:
              typeof result.lastAlertedForecastMoment === "string"
                ? result.lastAlertedForecastMoment
                : null,
          } as SyncState);
        } else {
          resolve(DEFAULT_STATE);
        }
      };
    });
  } catch {
    return DEFAULT_STATE;
  }
}

/**
 * Save sync state to IndexedDB (call from main app when data or thresholds change)
 */
export async function setSyncState(state: Partial<SyncState>): Promise<void> {
  const current = await getSyncState();
  const merged: SyncState = {
    thresholds: state.thresholds ?? current.thresholds,
    lastAlertedForecastMoment:
      state.lastAlertedForecastMoment !== undefined
        ? state.lastAlertedForecastMoment
        : current.lastAlertedForecastMoment,
  };
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(merged, KEY);
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
    request.onsuccess = () => {
      db.close();
      resolve();
    };
  });
}
