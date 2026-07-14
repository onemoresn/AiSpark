export function isBrowserOnline(): boolean {
  if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
    return navigator.onLine;
  }
  return true;
}

export function isNetworkError(err: unknown): boolean {
  if (err instanceof TypeError && /fetch|network|failed/i.test(err.message)) {
    return true;
  }
  if (err instanceof Error) {
    return /network|offline|failed to fetch|load failed|connection|timed out|abort/i.test(
      err.message
    );
  }
  return false;
}

export function subscribeNetworkStatus(onChange: (online: boolean) => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleOnline = () => onChange(true);
  const handleOffline = () => onChange(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}
