//* FIREBASE IMPORT AND INITIALIZATION *//
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const firestore = firebase.firestore();
const messaging = firebase.messaging();

// Initialize push notifications
initializePushNotifications(); // <-- Add this line


// * Global declaration *//
let editingProfileIndex = null;

// ======== ENHANCED SERVICE WORKER REGISTRATION ========
if ('serviceWorker' in navigator) {
  const SW_VERSION = 'v2.1'; // Update this when making SW changes
  const SW_PATH = `${window.location.pathname.replace(/\/[^/]+$/, '')}/Pet-Health-Tracker/service-worker.js`;
  const SW_SCOPE = `${window.location.pathname.replace(/\/[^/]+$/, '')}/`;

  window.addEventListener('load', async () => {
    try {
      // Validate environment before registration
      if (!('indexedDB' in window)) {
        throw new Error('Browser does not support required features');
      }

      // Register service worker with versioning
      const registration = await navigator.serviceWorker.register(`${SW_PATH}?version=${SW_VERSION}`, {
        scope: SW_SCOPE,
        updateViaCache: 'none'
      });

      console.log('📦 Service Worker registered at scope:', registration.scope);
      console.log('🔧 Current Service Worker version:', SW_VERSION);

      // Immediate activation handler
      if (registration.active) {
        console.log('⚡ Service Worker already active');
      }

      // Installation monitoring
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('🔄 New Service Worker found:', newWorker.state);

        newWorker.addEventListener('statechange', () => {
          console.log(`🔄 Service Worker state: ${newWorker.state}`);
          if (newWorker.state === 'activated') {
            console.log('✅ New Service Worker activated');
            if (!navigator.serviceWorker.controller) {
              console.log('🔄 Reloading to apply updates...');
              window.location.reload();
            }
          }
        });
      });

      // Runtime error handling
      registration.addEventListener('error', (error) => {
        console.error('🚨 Service Worker error:', error);
      });

      // Network recovery system
      registration.addEventListener('update', () => {
        console.log('🌐 Checking for updates...');
      });

      // Periodic update checks (every 6 hours)
      const updateInterval = setInterval(() => {
        registration.update().catch(error => {
          console.warn('⚠️ Update check failed:', error);
        });
      }, 6 * 60 * 60 * 1000);

      // Cleanup on window close
      window.addEventListener('beforeunload', () => {
        clearInterval(updateInterval);
      });

    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
      // Fallback UI notification
      showErrorToast('Service Worker registration failed - some features may be unavailable');
    }
  });

  // Global error handler
  navigator.serviceWorker.addEventListener('error', (error) => {
    console.error('🌐 Service Worker container error:', error);
  });

  // Controller change handler
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('🔄 Controller changed, reloading...');
    window.location.reload();
  });
} else {
  console.warn('❌ Service Workers not supported');
  showErrorToast('Your browser does not support required features');
}

// Helper function for user feedback
function showErrorToast(message) {
  const toast = document.createElement('div');
  toast.style = 'position:fixed; bottom:20px; right:20px; padding:15px; background:#ff4444; color:white; border-radius:5px;';
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    document.body.removeChild(toast);
  }, 5000);
}

export { auth, firestore, messaging, showErrorToast };
