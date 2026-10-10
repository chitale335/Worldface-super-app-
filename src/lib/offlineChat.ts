/**
 * Offline storage + outbound queue for direct messages.
 *
 * - Caches the last known messages per conversation so they stay readable offline.
 * - Queues messages written while offline (or when the network drops mid-send)
 *   and flushes them automatically once connectivity returns.
 *
 * Backed by IndexedDB, with an in-memory fallback for environments where
 * IndexedDB is unavailable (private mode, SSR).
 */

export type OfflineMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  media_url?: string | null;
  media_type?: string | null;
  duration_seconds?: number | null;
  created_at: string;
  pending?: boolean;
};

const DB_NAME = 'worldface-offline';
const DB_VERSION = 1;
const MESSAGES = 'messages';
const QUEUE = 'queue';
const CACHE = 'cache';

let dbPromise: Promise<IDBDatabase | null> | null = null;

const memory = {
  messages: new Map<string, OfflineMessage>(),
  queue: new Map<string, OfflineMessage>(),
  cache: new Map<string, unknown>(),
};

const byCreatedAt = (a: { created_at: string }, b: { created_at: string }) =>
  new Date(a.created_at).getTime() - new Date(b.created_at).getTime();

function openDb(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') return resolve(null);
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(MESSAGES)) {
          const store = db.createObjectStore(MESSAGES, { keyPath: 'id' });
          store.createIndex('by_conversation', 'conversation_id', { unique: false });
        }
        if (!db.objectStoreNames.contains(QUEUE)) {
          db.createObjectStore(QUEUE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(CACHE)) {
          db.createObjectStore(CACHE, { keyPath: 'key' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
      request.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

async function getAllFromStore<T>(storeName: string): Promise<T[]> {
  const db = await openDb();
  if (!db) return [];
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readonly');
      const request = tx.objectStore(storeName).getAll();
      request.onsuccess = () => resolve((request.result ?? []) as T[]);
      request.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });
}

async function putInStore(storeName: string, value: unknown): Promise<void> {
  const db = await openDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).put(value);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    } catch {
      resolve();
    }
  });
}

async function deleteFromStore(storeName: string, id: string): Promise<void> {
  const db = await openDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    } catch {
      resolve();
    }
  });
}

export const isOnline = () => (typeof navigator === 'undefined' ? true : navigator.onLine);

export const localMessageId = () =>
  `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/* ------------------------------------------------------------------ messages */

/** Replace the cached transcript for one conversation. */
export async function cacheMessages(conversationId: string, messages: OfflineMessage[]): Promise<void> {
  const db = await openDb();
  if (!db) {
    for (const [id, msg] of memory.messages) {
      if (msg.conversation_id === conversationId) memory.messages.delete(id);
    }
    for (const msg of messages) memory.messages.set(msg.id, msg);
    return;
  }
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(MESSAGES, 'readwrite');
      const store = tx.objectStore(MESSAGES);
      const cursorRequest = store.index('by_conversation').openCursor(IDBKeyRange.only(conversationId));
      cursorRequest.onsuccess = () => {
        const cursor = cursorRequest.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          for (const msg of messages) store.put(msg);
        }
      };
      cursorRequest.onerror = () => resolve();
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    } catch {
      resolve();
    }
  });
}

/** Append or update a single message in the local transcript. */
export async function cacheMessage(message: OfflineMessage): Promise<void> {
  memory.messages.set(message.id, message);
  await putInStore(MESSAGES, message);
}

export async function getCachedMessages(conversationId: string): Promise<OfflineMessage[]> {
  const db = await openDb();
  if (!db) {
    return [...memory.messages.values()]
      .filter((m) => m.conversation_id === conversationId)
      .sort(byCreatedAt);
  }
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(MESSAGES, 'readonly');
      const request = tx.objectStore(MESSAGES).index('by_conversation').getAll(IDBKeyRange.only(conversationId));
      request.onsuccess = () => {
        const rows = (request.result ?? []) as OfflineMessage[];
        resolve(rows.sort(byCreatedAt));
      };
      request.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });
}

export async function removeCachedMessage(id: string): Promise<void> {
  memory.messages.delete(id);
  await deleteFromStore(MESSAGES, id);
}

/* --------------------------------------------------------------------- queue */

export async function enqueueMessage(message: OfflineMessage): Promise<void> {
  const queued = { ...message, pending: true };
  memory.queue.set(queued.id, queued);
  await cacheMessage(queued);
  await putInStore(QUEUE, queued);
}

export async function getQueuedMessages(conversationId?: string): Promise<OfflineMessage[]> {
  const rows = await getAllFromStore<OfflineMessage>(QUEUE);
  const list = rows.length ? rows : [...memory.queue.values()];
  return list
    .filter((m) => !conversationId || m.conversation_id === conversationId)
    .sort(byCreatedAt);
}

export async function dequeueMessage(id: string): Promise<void> {
  memory.queue.delete(id);
  await removeCachedMessage(id);
  await deleteFromStore(QUEUE, id);
}

/**
 * Try to deliver every queued message. Stops at the first failure so the queue
 * keeps its order and nothing is lost. Returns how many were delivered.
 */
export async function flushQueue(send: (message: OfflineMessage) => Promise<void>): Promise<number> {
  if (!isOnline()) return 0;
  const queued = await getQueuedMessages();
  let delivered = 0;
  for (const message of queued) {
    try {
      await send(message);
      await dequeueMessage(message.id);
      delivered += 1;
    } catch {
      break;
    }
  }
  return delivered;
}

/* ------------------------------------------------------------ inbox snapshot */

export async function cacheConversations(rows: unknown): Promise<void> {
  memory.cache.set('conversations', rows);
  await putInStore(CACHE, { key: 'conversations', value: rows });
}

export async function getCachedConversations<T = unknown>(): Promise<T[]> {
  const rows = await getAllFromStore<{ key: string; value: unknown }>(CACHE);
  const hit = rows.find((r) => r.key === 'conversations');
  const value = hit ? hit.value : memory.cache.get('conversations');
  return (value as T[]) ?? [];
}
