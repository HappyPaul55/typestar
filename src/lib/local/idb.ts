/**
 * Persist the chosen local-folder handles in IndexedDB.
 *
 * Directory handles are structured-cloneable, so IndexedDB can remember which
 * folders the player picked between visits. The browser still asks for read
 * permission again before the files are touched (see `ensureReadPermission`).
 *
 * Every call is best-effort: private mode or a blocked database must never
 * break the local library, it just means the folders are not remembered.
 */

import type { LocalDirectoryHandle } from "./library";

const DB_NAME = "typestar";
const DB_VERSION = 1;
const STORE = "handles";
const DIRECTORIES_KEY = "local-directories";
/** The key an earlier single-folder version stored its one handle under. */
const LEGACY_DIRECTORY_KEY = "local-directory";

function isDirectoryHandle(value: unknown): value is LocalDirectoryHandle {
  return (
    !!value &&
    typeof value === "object" &&
    (value as LocalDirectoryHandle).kind === "directory"
  );
}

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

export async function saveDirectoryHandles(
  handles: readonly LocalDirectoryHandle[],
): Promise<void> {
  await withStore("readwrite", (store) => store.put([...handles], DIRECTORIES_KEY));
}

export async function loadDirectoryHandles(): Promise<LocalDirectoryHandle[]> {
  const value = await withStore<unknown>("readonly", (store) =>
    store.get(DIRECTORIES_KEY),
  );
  if (Array.isArray(value)) return value.filter(isDirectoryHandle);
  if (isDirectoryHandle(value)) return [value];
  // An earlier single-folder version stored its one handle under its own key.
  const legacy = await withStore<unknown>("readonly", (store) =>
    store.get(LEGACY_DIRECTORY_KEY),
  );
  return isDirectoryHandle(legacy) ? [legacy] : [];
}

export async function clearDirectoryHandles(): Promise<void> {
  await withStore("readwrite", (store) => {
    store.delete(DIRECTORIES_KEY);
    return store.delete(LEGACY_DIRECTORY_KEY);
  });
}
