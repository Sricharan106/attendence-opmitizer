/// <reference lib="webworker" />
import { precacheAndRoute } from "workbox-precaching";

declare let self: ServiceWorkerGlobalScope;

// Precache all assets compiled by Vite
precacheAndRoute(self.__WB_MANIFEST);

// Set up an alarm loop or event hook to trigger notifications
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "START_NOTIFICATION_INTERVAL") {
    // Check missing logs immediately on startup, and flag intervals
    checkAndNotify();
  }
});

async function checkAndNotify() {
  try {
    // Fetch today's logging status from IndexedDB or directly cache historical arrays.
    // As a backup strategy, we read permissions
    if (Notification.permission === "granted") {
      self.registration.showNotification("Attendance Reminder", {
        body: "You haven't logged your attendance status today! Tap to update.",
        icon: "/icon-192x192.png",
        badge: "/icon-192x192.png",
        tag: "attendance-reminder", // Overwrites identical tags to prevent notification spam
        requireInteraction: true,
      });
    }
  } catch (error) {
    console.error("Service worker notification dispatch failed:", error);
  }
}

// Open the app calendar window when user interacts with notification banner
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        if (clientList.length > 0) {
          return clientList[0].focus();
        }
        return self.clients.openWindow("/");
      }),
  );
});
