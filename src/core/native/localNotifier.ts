import { NativeModules, PermissionsAndroid, Platform } from 'react-native';

type LocalNotificationModule = {
  show(id: number, title: string, body: string): void;
};

export type LocalNotifier = {
  requestPermission(): Promise<boolean>;
  show(id: number, title: string, body: string): void;
};

const native: LocalNotificationModule | undefined =
  Platform.OS === 'android' ? NativeModules.LocalNotification : undefined;

export const localNotifier: LocalNotifier = {
  async requestPermission() {
    if (!native) {
      return false;
    }
    if (Number(Platform.Version) < 33) {
      return true;
    }
    const status = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    return status === PermissionsAndroid.RESULTS.GRANTED;
  },
  show(id, title, body) {
    native?.show(id, title, body);
  },
};
