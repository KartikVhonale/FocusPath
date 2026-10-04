import localforage from 'localforage';

/**
 * Local Scheduling utility for PWA Service Worker Notifications
 * Utilizes the experimental Notification Triggers API for zero-backend push,
 * with a localforage + setInterval fallback for iOS Safari & Firefox.
 */

export const supportsTriggers = typeof window !== 'undefined' && 'Notification' in window && 'showTrigger' in Notification.prototype;

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

/**
 * Schedules a Spaced Repetition Alert at 9:00 AM on the target date.
 */
export async function scheduleSpacedRepetitionAlert(topicTitle, nextReviewDate) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const targetDate = new Date(nextReviewDate);
  targetDate.setHours(9, 0, 0, 0);
  const targetTime = targetDate.getTime();

  if (targetTime < Date.now()) return;

  const title = 'Spaced Repetition Due';
  const body = `Review Due: ${topicTitle}. Tap to start your focus session.`;
  const tag = `srs-${topicTitle}`;

  if (supportsTriggers && 'serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        tag,
        body,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        showTrigger: new TimestampTrigger(targetTime),
      });
      console.log(`[PWA] Scheduled local notification using Triggers API for ${topicTitle}`);
    } catch (error) {
      console.error('[PWA] Failed to schedule trigger notification:', error);
    }
  } else {
    // Fallback Scheduler for iOS/Firefox
    try {
      const scheduledAlerts = (await localforage.getItem('scheduled_alerts')) || [];
      // Remove existing for same topic
      const filtered = scheduledAlerts.filter(a => a.tag !== tag);
      filtered.push({ title, body, tag, time: targetTime });
      await localforage.setItem('scheduled_alerts', filtered);
      console.log(`[PWA Fallback] Saved notification to localforage for ${topicTitle}`);
    } catch (err) {
      console.error('[PWA Fallback] Failed to save scheduled alert:', err);
    }
  }
}

/**
 * Smart Silence Logic: Cancels notifications if time was logged before 9 AM.
 */
export async function applySmartSilence(todayLogs) {
  const now = new Date();
  const isBeforeNineAM = now.getHours() < 9;
  
  if (isBeforeNineAM && todayLogs && (todayLogs.topicsCompleted > 0 || todayLogs.timeStudiedMinutes > 0)) {
    if (supportsTriggers && 'serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const notifications = await registration.getNotifications();
        notifications.forEach(notification => {
          if (notification.tag && notification.tag.startsWith('srs-')) {
            notification.close();
          }
        });
      } catch (err) {}
    } else {
      // Clear from fallback localForage
      try {
        const scheduledAlerts = (await localforage.getItem('scheduled_alerts')) || [];
        const todayStart = new Date(now);
        todayStart.setHours(0,0,0,0);
        const todayEnd = new Date(now);
        todayEnd.setHours(23,59,59,999);

        const filtered = scheduledAlerts.filter(alert => {
          // Keep alerts that are NOT for today
          const isToday = alert.time >= todayStart.getTime() && alert.time <= todayEnd.getTime();
          return !isToday;
        });
        await localforage.setItem('scheduled_alerts', filtered);
      } catch (err) {}
    }
  }
}

/**
 * Checks pending localForage alerts (run in App.jsx globally)
 */
export async function checkFallbackNotifications() {
  if (supportsTriggers || !('Notification' in window) || Notification.permission !== 'granted') return;
  
  try {
    const scheduledAlerts = (await localforage.getItem('scheduled_alerts')) || [];
    if (scheduledAlerts.length === 0) return;

    const now = Date.now();
    let fired = false;
    const remaining = scheduledAlerts.filter(alert => {
      if (now >= alert.time) {
        // Time to fire!
        new Notification(alert.title, { body: alert.body, tag: alert.tag, icon: '/pwa-192x192.png' });
        fired = true;
        return false; // Remove from queue
      }
      return true; // Keep in queue
    });

    if (fired) {
      await localforage.setItem('scheduled_alerts', remaining);
    }
  } catch (err) {}
}
