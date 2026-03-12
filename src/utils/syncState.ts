/**
 * IndexedDB sync state for service worker background sync.
 * The service worker cannot access localStorage, so we store thresholds and lastStatus
 * in IndexedDB for the periodicsync handler to read.
 */

const DB_NAME = "alerta-sudestada-sync";
const DB_VERSION = 1;
const STORE_NAME = "state";
const KEY = "sync-state";

export interface SyncState {
  thresholds: { warning: number; alert: number; critical: number };
  lastStatus: "normal" | "warning" | "alert" | "critical";
}

const DEFAULT_STATE: SyncState = {
  thresholds: { warning: 2.5, alert: 3.0, critical: 3.5 },
  lastStatus: "normal",
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
        if (result && typeof result.thresholds === "object" && typeof result.lastStatus === "string") {
          resolve(result as SyncState);
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
    lastStatus: state.lastStatus ?? current.lastStatus,
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
