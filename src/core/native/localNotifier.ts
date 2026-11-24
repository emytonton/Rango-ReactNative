import { NativeModules, PermissionsAndroid, Platform } from 'react-native';

type LocalNotificationModule = {
  show(id: number, title: string, body: string): void;
  areEnabled(): Promise<boolean>;
  openSettings(): void;
  isUndetermined?(): Promise<boolean>;
  requestAuthorization?(): Promise<boolean>;
};

export type LocalNotifier = {
  requestPermission(): Promise<boolean>;
  isPermitted(): Promise<boolean>;
  askPermission(): Promise<boolean>;
  show(id: number, title: string, body: string): void;
};

const native: LocalNotificationModule | undefined =
  Platform.OS === 'android' || Platform.OS === 'ios'
    ? NativeModules.LocalNotification
    : undefined;

async function requestIos(module: LocalNotificationModule) {
  return module.requestAuthorization ? module.requestAuthorization() : false;
}

async function askIos(module: LocalNotificationModule) {
  if (await module.areEnabled()) {
    return true;
  }
  if (module.isUndetermined && (await module.isUndetermined())) {
    return requestIos(module);
  }
  module.openSettings();
  return false;
}

export const localNotifier: LocalNotifier = {
  async requestPermission() {
    if (!native) {
      return false;
    }
    if (Platform.OS === 'ios') {
      return requestIos(native);
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
    if (Platform.OS === 'ios') {
      return askIos(native);
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
