import { NetworkError } from '../../core/network/apiError';
import type { SecureStorage } from '../storage/secureStorage';

export type Cached<T> = { value: T; savedAt: Date };

export type LocalCache = {
  put<T>(key: string, value: T): Promise<void>;
  get<T>(key: string): Promise<Cached<T> | null>;
  fetchOrCached<T>(key: string, fetch: () => Promise<T>): Promise<T>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
};

const INDEX = 'cache_index';
const SEPARATOR = '\n';

const valueKey = (key: string) => `cache_${key}`;
const timeKey = (key: string) => `cache_${key}_at`;

export function createLocalCache(
  storage: SecureStorage,
  now: () => Date = () => new Date(),
): LocalCache {
  let queue: Promise<unknown> = Promise.resolve();

  const serial = <T>(task: () => Promise<T>): Promise<T> => {
    const next = queue.then(task, task);
    queue = next.catch(() => undefined);
    return next;
  };

  async function keys(): Promise<string[]> {
    const raw = await storage.get(INDEX);
    return raw ? raw.split(SEPARATOR).filter(Boolean) : [];
  }

  const remove = (key: string) =>
    serial(async () => {
      await storage.remove(valueKey(key));
      await storage.remove(timeKey(key));
      const current = await keys();
      if (current.includes(key)) {
        await storage.put(
          INDEX,
          current.filter(item => item !== key).join(SEPARATOR),
        );
      }
    });

  const put = <T>(key: string, value: T) =>
    serial(async () => {
      await storage.put(valueKey(key), JSON.stringify(value));
      await storage.put(timeKey(key), String(now().getTime()));
      const current = await keys();
      if (!current.includes(key)) {
        await storage.put(INDEX, [...current, key].join(SEPARATOR));
      }
    });

  async function get<T>(key: string): Promise<Cached<T> | null> {
    const raw = await storage.get(valueKey(key));
    const savedAt = Number(await storage.get(timeKey(key)));
    if (raw === null || !savedAt) {
      return null;
    }
    try {
      return { value: JSON.parse(raw) as T, savedAt: new Date(savedAt) };
    } catch {
      await remove(key);
      return null;
    }
  }

  return {
    put,
    get,
    remove,

    async fetchOrCached(key, fetch) {
      try {
        const value = await fetch();
        put(key, value).catch(() => undefined);
        return value;
      } catch (error) {
        const cached =
          error instanceof NetworkError ? await get<never>(key) : null;
        if (!cached) {
          throw error;
        }
        return cached.value;
      }
    },

    clear: () =>
      serial(async () => {
        for (const key of await keys()) {
          await storage.remove(valueKey(key));
          await storage.remove(timeKey(key));
        }
        await storage.remove(INDEX);
      }),
  };
}
