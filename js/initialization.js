// initialization.js - Fixed Version
// ======== FIREBASE INITIALIZATION ========
import { firebaseConfig } from './firebase.config.js';
firebase.initializeApp(firebaseConfig);

// Remove duplicate declarations
const auth = firebase.auth();
const firestore = firebase.firestore();
const messaging = firebase.messaging();

// ======== SERVICE WORKER REGISTRATION ========
if ('serviceWorker' in navigator) {
  const SW_VERSION = 'v2.1';
  const SW_PATH = `${window.location.pathname.replace(/\/[^/]+$/, '')}/service-worker.js`; // Fixed path
  const SW_SCOPE = `${window.location.pathname.replace(/\/[^/]+$/, '')}/`;

  // Debounced registration handler
  const registerSW = async () => {
    try {
      if (!('indexedDB' in window)) {
        showErrorToast('Browser lacks required features');
        return;
      }

      const registration = await navigator.serviceWorker.register(
        `${SW_PATH}?version=${SW_VERSION}`, 
        { scope: SW_SCOPE, updateViaCache: 'none' }
      );

      // Optimized event handlers
      const handleControllerChange = () => {
        console.log('🔄 Controller changed');
        if (document.visibilityState === 'visible') {
          window.location.reload();
        }
      };

      const handleUpdateFound = () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'activated' && !navigator.serviceWorker.controller) {
            window.requestIdleCallback(() => window.location.reload());
          }
        });
      };

      registration.addEventListener('updatefound', handleUpdateFound);
      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

      // Cleanup function
      return () => {
        registration.removeEventListener('updatefound', handleUpdateFound);
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      };

    } catch (error) {
      console.error('SW registration failed:', error);
      showErrorToast('Offline features limited');
    }
  };

  // Debounced load handler
  window.addEventListener('load', () => {
    setTimeout(registerSW, 1000); // Delay registration
  });
}

// ======== PERFORMANCE OPTIMIZATIONS ========
// Throttled error display
const showErrorToast = (message) => {
  if (window.toastTimeout) return;
  
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 15px;
    background: #ff4444;
    color: white;
    border-radius: 5px;
    z-index: 10000;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);

  window.toastTimeout = setTimeout(() => {
    document.body.removeChild(toast);
    delete window.toastTimeout;
  }, 5000);
};

// ======== EXPORTS ========
export { 
  auth, 
  firestore, 
  messaging, 
  showErrorToast 
};
