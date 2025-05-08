if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js').then(function (registration) {
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
      
      // Check for updates to the service worker
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('Service Worker update found!');
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('New Service Worker installed, reloading for update');
            // Reload the page to ensure the new service worker takes control
            window.location.reload();
          }
        });
      });
    }, function (err) {
      console.log('ServiceWorker registration failed: ', err);
    });
    
    // Listen for controller change events
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('Service Worker controller changed');
    });
    
    // Add event listener for auth state changes from other tabs
    window.addEventListener('storage', (event) => {
      if (event.key === 'auth-state-change') {
        console.log('Auth state changed in another tab, refreshing session state');
        // Refresh the page to ensure consistent auth state
        window.location.reload();
      }
    });
  });
}
