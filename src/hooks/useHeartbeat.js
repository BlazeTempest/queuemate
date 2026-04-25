"use client";

import { useEffect } from 'react';

const HEARTBEAT_INTERVAL = 5 * 60 * 1000; // 5 minutes

/**
 * Sends a heartbeat ping to the server every 5 minutes
 * to keep the user's online status alive.
 * Also fires immediately on mount and when the tab regains focus.
 */
export function useHeartbeat() {
  useEffect(() => {
    const ping = () => {
      fetch('/api/heartbeat', { method: 'POST' }).catch(() => {});
    };

    // Fire immediately on mount (page load / login)
    ping();

    // Fire on a regular interval
    const intervalId = setInterval(ping, HEARTBEAT_INTERVAL);

    // Fire when the user comes back to the tab
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        ping();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);
}
