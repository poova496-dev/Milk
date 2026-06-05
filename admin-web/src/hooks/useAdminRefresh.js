import { useEffect } from 'react';

/** Listen for Alt+Shift+R (admin-refresh) and reload page data. */
export function useAdminRefresh(refreshFn) {
  useEffect(() => {
    if (!refreshFn) return undefined;
    const handler = () => refreshFn();
    window.addEventListener('admin-refresh', handler);
    return () => window.removeEventListener('admin-refresh', handler);
  }, [refreshFn]);
}
