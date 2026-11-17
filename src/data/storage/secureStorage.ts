import * as Keychain from 'react-native-keychain';

export type SecureStorage = {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
};

const SERVICE_PREFIX = 'com.rango.delivery.';

export function createKeychainStorage(): SecureStorage {
  return {
    async get(key) {
      const entry = await Keychain.getGenericPassword({
        service: SERVICE_PREFIX + key,
      });
      return entry ? entry.password : null;
    },
    async put(key, value) {
      await Keychain.setGenericPassword(key, value, {
        service: SERVICE_PREFIX + key,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    },
    async remove(key) {
      await Keychain.resetGenericPassword({ service: SERVICE_PREFIX + key });
    },
  };
}
