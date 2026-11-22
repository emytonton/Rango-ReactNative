import { useEffect, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import { PushBanner } from '../components';
import { localNotifier } from '../core/native/localNotifier';
import { useAppContainer } from '../di/AppContainer';

const BANNER_DURATION_MS = 6500;

type PushHostProps = {
  onOpen: () => void;
};

export function PushHost({ onOpen }: PushHostProps) {
  const { pushWatcher } = useAppContainer();
  const { banner } = useSyncExternalStore(
    pushWatcher.subscribe,
    pushWatcher.state,
  );

  useEffect(() => {
    localNotifier.requestPermission();
    pushWatcher.start();
    const subscription = AppState.addEventListener('change', status =>
      pushWatcher.setForeground(status === 'active'),
    );
    return () => {
      subscription.remove();
      pushWatcher.stop();
    };
  }, [pushWatcher]);

  useEffect(() => {
    if (!banner) {
      return;
    }
    const timer = setTimeout(pushWatcher.dismissBanner, BANNER_DURATION_MS);
    return () => clearTimeout(timer);
  }, [banner, pushWatcher]);

  if (!banner) {
    return null;
  }
  return (
    <PushBanner
      title={banner.title}
      text={banner.body}
      onPress={() => {
        pushWatcher.dismissBanner();
        onOpen();
      }}
    />
  );
}
