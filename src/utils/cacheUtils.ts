/**
 * Utility functions for managing PWA cache
 */

/**
 * Clears the PWA cache and updates the service worker
 * @returns Promise that resolves when cache is cleared
 */
export async function clearPWACache(): Promise<boolean> {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return false;
    }

    // Check if service worker is registered
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported');
      return false;
    }

    // Get all caches
    const cacheKeys = await caches.keys();
    
    // Delete all caches
    await Promise.all(
      cacheKeys.map(cacheKey => caches.delete(cacheKey))
    );

    // Unregister and re-register service workers
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      registrations.map(registration => registration.update())
    );

    console.log('PWA cache cleared successfully');
    return true;
  } catch (error) {
    console.error('Failed to clear PWA cache:', error);
    return false;
  }
}
