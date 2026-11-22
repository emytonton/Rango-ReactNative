import { NativeModules, PermissionsAndroid, Platform } from 'react-native';

type LocalNotificationModule = {
  show(id: number, title: string, body: string): void;
  areEnabled(): Promise<boolean>;
  openSettings(): void;
};

export type LocalNotifier = {
  requestPermission(): Promise<boolean>;
  isPermitted(): Promise<boolean>;
  askPermission(): Promise<boolean>;
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
  async isPermitted() {
    return native ? native.areEnabled() : false;
  },
  async askPermission() {
    if (!native) {
      return false;
    }
    if (await native.areEnabled()) {
      return true;
    }
    const runtimeGranted =
      Number(Platform.Version) < 33 ||
      (await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      ));
    if (runtimeGranted) {
      native.openSettings();
      return false;
    }
    const status = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    if (status === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
      native.openSettings();
    }
    return native.areEnabled();
  },
  show(id, title, body) {
    native?.show(id, title, body);
  },
};
