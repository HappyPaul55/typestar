/**
 * Persist the chosen local-folder handle in IndexedDB.
 *
 * Directory handles are structured-cloneable, so IndexedDB can remember which
 * folder the player picked between visits. The browser still asks for read
 * permission again before the files are touched (see `ensureReadPermission`).
 *
 * Every call is best-effort: private mode or a blocked database must never
 * break the local library, it just means the folder is not remembered.
 */

import type { LocalDirectoryHandle } from "./library";

const DB_NAME = "typestar";
const DB_VERSION = 1;
const STORE = "handles";
const DIRECTORY_KEY = "local-directory";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest,
): Promise<T | null> {
  if (typeof indexedDB === "undefined") return null;
  let db: IDBDatabase | null = null;
  try {
    db = await openDatabase();
    return await new Promise<T | null>((resolve, reject) => {
      const transaction = db!.transaction(STORE, mode);
      const request = run(transaction.objectStore(STORE));
      request.onsuccess = () => resolve((request.result as T | undefined) ?? null);
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => db!.close();
    });
  } catch {
    db?.close();
    return null;
  }
}

export async function saveDirectoryHandle(handle: LocalDirectoryHandle): Promise<void> {
  await withStore("readwrite", (store) => store.put(handle, DIRECTORY_KEY));
}

export async function loadDirectoryHandle(): Promise<LocalDirectoryHandle | null> {
  const value = await withStore<LocalDirectoryHandle>("readonly", (store) =>
    store.get(DIRECTORY_KEY),
  );
  return value && value.kind === "directory" ? value : null;
}

export async function clearDirectoryHandle(): Promise<void> {
  await withStore("readwrite", (store) => store.delete(DIRECTORY_KEY));
}
