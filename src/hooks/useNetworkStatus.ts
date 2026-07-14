import { useEffect, useState } from 'react';
import { isBrowserOnline, subscribeNetworkStatus } from '../lib/offline/networkStatus';

export function useNetworkStatus(): { isOnline: boolean } {
  const [isOnline, setIsOnline] = useState(isBrowserOnline);

  useEffect(() => {
    setIsOnline(isBrowserOnline());
    return subscribeNetworkStatus(setIsOnline);
  }, []);

  return { isOnline };
}
