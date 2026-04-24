import type { CommittedRow } from "@/utils/scrape-transcript";

const DB_NAME = "hey-gracie-v2";
const DB_VERSION = 1;
const TRANSCRIPTS_STORE = "transcripts";

export type StoredSessionTranscript = {
  v: 1;
  sessionStartMs: number;
  rows: CommittedRow[];
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(TRANSCRIPTS_STORE)) {
        db.createObjectStore(TRANSCRIPTS_STORE);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Failed to open transcript database"));
  });
}

function runTx<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(TRANSCRIPTS_STORE, mode);
        const store = tx.objectStore(TRANSCRIPTS_STORE);
        const request = fn(store);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () =>
          reject(request.error ?? new Error("IndexedDB request failed"));
        tx.oncomplete = () => db.close();
        tx.onabort = () => {
          db.close();
          reject(tx.error ?? new Error("IndexedDB transaction aborted"));
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error ?? new Error("IndexedDB transaction failed"));
        };
      }),
  );
}

export async function putTranscript(
  historyId: string,
  payload: StoredSessionTranscript,
): Promise<void> {
  const rowsCopy = payload.rows.map((row) => ({ ...row }));
  const safePayload: StoredSessionTranscript = {
    v: 1,
    sessionStartMs: payload.sessionStartMs,
    rows: rowsCopy,
  };
  await runTx("readwrite", (store) => store.put(safePayload, historyId));
}

export async function getTranscript(
  historyId: string,
): Promise<StoredSessionTranscript | null> {
  const result = await runTx<StoredSessionTranscript | undefined>(
    "readonly",
    (store) => store.get(historyId),
  );
  return result ?? null;
}

export async function deleteTranscripts(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(TRANSCRIPTS_STORE, "readwrite");
    const store = tx.objectStore(TRANSCRIPTS_STORE);
    for (const id of ids) {
      store.delete(id);
    }

    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onabort = () => {
      db.close();
      reject(tx.error ?? new Error("Failed to delete transcripts"));
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error ?? new Error("Failed to delete transcripts"));
    };
  });
}
