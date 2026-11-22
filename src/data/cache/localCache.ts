import type { SecureStorage } from '../storage/secureStorage';

export type Cached<T> = { value: T; savedAt: Date };

export type LocalCache = {
  put<T>(key: string, value: T): Promise<void>;
  get<T>(key: string): Promise<Cached<T> | null>;
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
  async function keys(): Promise<string[]> {
    const raw = await storage.get(INDEX);
    return raw ? raw.split(SEPARATOR).filter(Boolean) : [];
  }

  async function remove(key: string) {
    await storage.remove(valueKey(key));
    await storage.remove(timeKey(key));
    const current = await keys();
    if (current.includes(key)) {
      await storage.put(
        INDEX,
        current.filter(item => item !== key).join(SEPARATOR),
      );
    }
  }

  return {
    async put(key, value) {
      await storage.put(valueKey(key), JSON.stringify(value));
      await storage.put(timeKey(key), String(now().getTime()));
      const current = await keys();
      if (!current.includes(key)) {
        await storage.put(INDEX, [...current, key].join(SEPARATOR));
      }
    },

    async get<T>(key: string) {
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
    },

    remove,

    async clear() {
      for (const key of await keys()) {
        await storage.remove(valueKey(key));
        await storage.remove(timeKey(key));
      }
      await storage.remove(INDEX);
    },
  };
}
