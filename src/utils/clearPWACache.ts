"use client";

/**
 * Clear PWA cache and service workers
 * Useful when switching between different PWA projects in development
 */
export async function clearPWACache(): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  try {
    // Unregister all service workers
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
        console.log("Service worker unregistered:", registration.scope);
      }
    }

    // Clear all caches
    if ("caches" in window) {
      const cacheNames = await caches.keys();
      for (const cacheName of cacheNames) {
        await caches.delete(cacheName);
        console.log("Cache deleted:", cacheName);
      }
    }

    // Clear localStorage and sessionStorage (optional, be careful with this)
    // localStorage.clear();
    // sessionStorage.clear();

    console.log("PWA cache cleared successfully");
  } catch (error) {
    console.error("Error clearing PWA cache:", error);
  }
}

/**
 * Clear PWA cache on page load in development mode
 * This helps avoid conflicts when switching between projects
 */
export function clearPWACacheOnDev(): void {
  if (typeof window === "undefined") {
    return;
  }

  // Only run in development
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  // Check if we should clear cache (based on URL parameter or localStorage flag)
  const urlParams = new URLSearchParams(window.location.search);
  const shouldClear = urlParams.get("clear-cache") === "true";
  const lastProject = localStorage.getItem("last-pwa-project");
  const currentProject = window.location.origin;

  if (shouldClear || (lastProject && lastProject !== currentProject)) {
    clearPWACache().then(() => {
      localStorage.setItem("last-pwa-project", currentProject);
      // Reload page after clearing cache
      window.location.reload();
    });
  } else {
    localStorage.setItem("last-pwa-project", currentProject);
  }
}
