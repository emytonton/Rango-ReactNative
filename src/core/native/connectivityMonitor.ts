import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

type ConnectivityModule = {
  isOnline(): Promise<boolean>;
  addListener(eventName: string): void;
  removeListeners(count: number): void;
};

export type ConnectivityMonitor = {
  online(): boolean;
  subscribe(listener: () => void): () => void;
};

const EVENT = 'connectivityChanged';

const native: ConnectivityModule | undefined =
  Platform.OS === 'android' ? NativeModules.Connectivity : undefined;

export function createConnectivityMonitor(
  module: ConnectivityModule | undefined = native,
): ConnectivityMonitor {
  let online = true;
  const listeners = new Set<() => void>();

  const publish = (value: boolean) => {
    if (value !== online) {
      online = value;
      listeners.forEach(listener => listener());
    }
  };

  if (module) {
    new NativeEventEmitter(module).addListener(EVENT, value =>
      publish(Boolean(value)),
    );
    module.isOnline().then(publish, () => undefined);
  }

  return {
    online: () => online,
    subscribe: listener => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
