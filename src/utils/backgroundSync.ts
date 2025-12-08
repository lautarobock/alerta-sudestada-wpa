"use client";

/**
 * Register for periodic background sync to check river height
 * This allows the app to fetch data even when in background
 */
export async function registerPeriodicSync(): Promise<boolean> {
  if (!("serviceWorker" in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Check if Periodic Background Sync is supported
    if ("periodicSync" in registration) {
      try {
        // @ts-ignore - periodicSync may not be in types yet
        await registration.periodicSync.register("river-height-sync", {
          minInterval: 60000, // Minimum 1 minute (browsers may increase this)
        });
        console.log("Periodic Background Sync registered");
        return true;
      } catch (error) {
        console.warn("Periodic Background Sync registration failed:", error);
        return false;
      }
    }
    
    return false;
  } catch (error) {
    console.warn("Service Worker not available:", error);
    return false;
  }
}

/**
 * Request notification permission for critical alerts
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) {
    console.warn("This browser does not support notifications");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
}

/**
 * Show a notification for critical river height alerts
 */
export async function showAlertNotification(
  title: string,
  body: string,
  data?: { height: number; status: string }
) {
  if (Notification.permission !== "granted") {
    return;
  }

  // Try to use service worker registration first (required for PWAs)
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration.showNotification) {
        await registration.showNotification(title, {
          body,
          icon: "/icon-192.png",
          badge: "/icon-192.png",
          tag: "river-alert", // Replace previous notifications with same tag
          requireInteraction: true, // Keep notification until user interacts
          data,
        });
        return;
      }
    } catch (error) {
      console.warn("Failed to show notification via service worker:", error);
      // Fall through to use Notification constructor
    }
  }

  // Fallback to Notification constructor (for non-PWA contexts)
  try {
    const notification = new Notification(title, {
      body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: "river-alert", // Replace previous notifications with same tag
      requireInteraction: true, // Keep notification until user interacts
      data,
    });

    // Close notification after 10 seconds
    setTimeout(() => {
      notification.close();
    }, 10000);

    // Handle click to focus the app
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch (error) {
    console.error("Failed to show notification:", error);
  }
}

