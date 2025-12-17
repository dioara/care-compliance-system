import { useEffect, useRef } from 'react';
import { trpc } from '@/lib/trpc';

/**
 * Hook to keep session alive during user inactivity
 * Pings the server periodically to prevent session timeout
 */
export function useSessionKeepalive(intervalMs: number = 5 * 60 * 1000) {
  const { data: user } = trpc.auth.me.useQuery();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only run keepalive if user is authenticated
    if (!user) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    console.log('[Session Keepalive] Starting keepalive ping every', intervalMs / 1000, 'seconds');

    // Ping server periodically to keep session alive
    intervalRef.current = setInterval(() => {
      // Use a lightweight query to keep session active
      fetch('/api/trpc/auth.me', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
        .then((response) => {
          if (response.ok) {
            console.log('[Session Keepalive] Ping successful');
          } else {
            console.warn('[Session Keepalive] Ping failed with status:', response.status);
          }
        })
        .catch((error) => {
          console.error('[Session Keepalive] Ping error:', error);
        });
    }, intervalMs);

    return () => {
      if (intervalRef.current) {
        console.log('[Session Keepalive] Stopping keepalive');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [user, intervalMs]);
}
