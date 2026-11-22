import { useEffect, useRef, useSyncExternalStore } from 'react';
import type { ConnectivityMonitor } from '../native/connectivityMonitor';

export function useOnline(monitor: ConnectivityMonitor): boolean {
  return useSyncExternalStore(monitor.subscribe, monitor.online);
}

export function useConnectionChange(
  monitor: ConnectivityMonitor,
  onChange: (online: boolean) => void,
) {
  const online = useOnline(monitor);
  const previous = useRef(online);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    if (previous.current !== online) {
      previous.current = online;
      onChangeRef.current(online);
    }
  }, [online]);
}
