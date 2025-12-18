/**
 * Client-side storage for encrypted key share using IndexedDB
 * Browser-only: this module uses IndexedDB and `window`/`localStorage`.
 * Do not import from server-side code.
 */

const DB_NAME = 'onkey';
const STORE_NAME = 'keyShares';
const KEY_NAME = 'userShare';

/**
 * Store encrypted user key share in IndexedDB
 */
export async function storeUserShare(encryptedShare: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = () => reject(new Error('Failed to open IndexedDB'));
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const putRequest = store.put(encryptedShare, KEY_NAME);

      putRequest.onerror = () => reject(new Error('Failed to store key share'));
      putRequest.onsuccess = () => resolve();
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

/**
 * Retrieve encrypted user key share from IndexedDB
 */
export async function getUserShare(): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = () => reject(new Error('Failed to open IndexedDB'));
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(KEY_NAME);

      getRequest.onerror = () => reject(new Error('Failed to retrieve key share'));
      getRequest.onsuccess = () => {
        resolve(getRequest.result || null);
      };
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

/**
 * Clear user key share from IndexedDB
 */
export async function clearUserShare(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = () => reject(new Error('Failed to open IndexedDB'));
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const deleteRequest = store.delete(KEY_NAME);

      deleteRequest.onerror = () => reject(new Error('Failed to clear key share'));
      deleteRequest.onsuccess = () => resolve();
    };
  });
}

