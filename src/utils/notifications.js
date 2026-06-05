// Local notification helpers for the seller (new order alerts).
// Uses expo-notifications local notifications (fired while the app is running),
// so the seller is alerted when a new customer order arrives.
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Show notifications even when the app is in the foreground.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let permissionReady = false;

/**
 * Ask for notification permission and set up the Android channel. Safe to call
 * multiple times. Returns true when notifications can be shown.
 */
export const ensureNotificationPermission = async () => {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('orders', {
        name: 'New Orders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        sound: 'default',
      });
    }

    const { status } = await Notifications.getPermissionsAsync();
    let finalStatus = status;
    if (status !== 'granted') {
      const req = await Notifications.requestPermissionsAsync();
      finalStatus = req.status;
    }
    permissionReady = finalStatus === 'granted';
    return permissionReady;
  } catch (e) {
    return false;
  }
};

/**
 * Fire a local notification for a newly received order.
 */
export const notifyNewOrder = async (order) => {
  try {
    if (!permissionReady) {
      const ok = await ensureNotificationPermission();
      if (!ok) return;
    }
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🥛 New Milk Order',
        body: `${order?.customer_name || 'A customer'} ordered ${order?.quantity_liters ?? ''} L. Tap to view.`,
        sound: 'default',
        data: { type: 'new_order', order_id: order?.order_id },
      },
      // A short time-interval trigger (vs. null) lets us target the custom
      // Android channel and reliably present the notification.
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 1,
        channelId: 'orders',
      },
    });
  } catch (e) {
    // Non-fatal.
  }
};
