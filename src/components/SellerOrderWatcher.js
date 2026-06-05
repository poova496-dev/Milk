// Polls for new customer orders while the seller is logged in and fires a
// local notification for each newly arrived order. Renders nothing.
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { getOrders } from '../services/orderService';
import { ensureNotificationPermission, notifyNewOrder } from '../utils/notifications';

const POLL_MS = 20000;

const SellerOrderWatcher = () => {
  const seenIds = useRef(new Set());
  const primed = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let timer = null;

    const check = async () => {
      try {
        const pending = await getOrders({ status: 'pending' });
        if (cancelled) return;

        if (!primed.current) {
          // First run after login: remember existing orders without alerting,
          // so the seller is only notified about orders that arrive from now on.
          pending.forEach((o) => seenIds.current.add(o.order_id));
          primed.current = true;
          return;
        }

        for (const order of pending) {
          if (!seenIds.current.has(order.order_id)) {
            seenIds.current.add(order.order_id);
            await notifyNewOrder(order);
          }
        }
      } catch (e) {
        // Ignore transient errors (offline, paused DB); retry next tick.
      }
    };

    ensureNotificationPermission();
    check();
    timer = setInterval(check, POLL_MS);

    // Re-check promptly when the seller brings the app back to the foreground.
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      sub.remove();
    };
  }, []);

  return null;
};

export default SellerOrderWatcher;
