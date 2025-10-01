//🔄 Updated uploadToCloudinary()
//==============================================
async function uploadToCloudinary(file, userId, petProfileId) {
  // 1. VALIDATE FILE TYPE
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Only JPG/PNG/WEBP images allowed!');
  }

  // 2. VALIDATE FILE SIZE (10MB)
  const maxSizeMB = 10;
  if (file.size > maxSizeMB * 1024 * 1024) {
    throw new Error(`File too large! Max ${maxSizeMB}MB allowed`);
  }

  // 3. BUILD FOLDER PATH
  const folderPath = `PetHealthTracker/users/${encodeURIComponent(userId)}/${encodeURIComponent(petProfileId)}/gallery/`;

  // 4. PREPARE UPLOAD
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'PetHealthTracker_auto_folder'); // As string!
  formData.append('folder', folderPath);
  formData.append('quality', 'auto');
  formData.append('fetch_format', 'auto');
  formData.append('secure', 'true');

  // Verify your upload preset exists
  console.log("Using preset:", 'PetHealthTracker_auto_folder');
  console.log("📁 Upload folder:", folderPath);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/dh7d6otgu/upload`, // Cloud name as string
      { 
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(15000)
      }
    );

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    return {
      url: data.secure_url, // Already HTTPS
      public_id: data.public_id,  // ✅ Keep this for deletion later renamed from path.
      path: data.public_id,        // optional, for backward compatibility
      width: data.width,
      height: data.height
    };

  } catch (error) {
    console.error('Cloudinary upload failed:', error);
    throw error;
  }
}
// function reset form
function resetForm() {
  const form = DOM.petList;
  if (form) form.reset();
  const preview = DOM.petPhotoPreview;
  if (preview) {
    preview.src = '';
    preview.style.display = 'none';
  }
}
//==============================
// Reminder Utilities
function formatReminder(dateTimeString) {
  if (!dateTimeString) return 'N/A';
  const date = new Date(dateTimeString);
  return date.toLocaleString();
}

function validateReminder(reminderData) {
  if (!Object.keys(reminderFields).includes(reminderData.type)) {
    throw new Error(`Invalid reminder type: ${reminderData.type}`);
  }

  const dateValue = new Date(reminderData.dueDate);
  if (Number.isNaN(dateValue.getTime())) {
    throw new Error('Invalid date format for reminder');
  }

  return {
    type: reminderData.type,
    dueDate: dateValue
  };
}

//=====================
//  Modal Utilities with PDF Support. MODAL IS NOT STATIC HTML!
//==========================
// 0. Add this if missing (ensure it's defined before showModal)
function trapFocus(modal) {
  const focusable = modal.querySelectorAll(
    'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  if (focusable.length === 0) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  modal.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    if (e.shiftKey && document.activeElement === first) {
      last.focus();
      e.preventDefault();
    } else if (!e.shiftKey && document.activeElement === last) {
      first.focus();
      e.preventDefault();
    }
  });
}

// ✅ YOUR ORIGINAL hideModal (KEEP THIS)
window.hideModal = function() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) {
    overlay.classList.remove('active');
    document.body.classList.remove('modal-active');
    setTimeout(() => overlay.remove(), 300);
  }
};

// ✅ YOUR QUEUE-ENABLED hideModal (KEEP THIS TOO)
const originalHideModal = window.hideModal;
window.hideModal = function() {
  if (typeof originalHideModal === 'function') {
    originalHideModal();  // ← This calls YOUR ORIGINAL function above!
  }
  dequeueModal();         // ← Then processes the next modal
};


function showModal(content) {
  // 1. Remove existing modal
  const oldModal = document.getElementById('modal-overlay');
  if (oldModal) oldModal.remove();

  // 2. Create modal
  const overlay = document.createElement('div');
  overlay.id = 'modal-overlay';
  overlay.className = 'modal-overlay';
  
  // 3. Create modal content with close button
  overlay.innerHTML = `
    <div class="modal-content" id="pet-modal">
      <button class="close-modal" aria-label="Close modal">&times;</button>
      ${content}
    </div>
  `;

  // 4. Add to DOM
  document.body.appendChild(overlay);
  document.body.classList.add('modal-active');

  // 5. Event binding
  overlay.querySelector('.close-modal').onclick = hideModal;
  overlay.onclick = (e) => e.target === overlay && hideModal();

  // 6. Activate modal
  overlay.classList.add('active');
  trapFocus(overlay.querySelector('.modal-content'));

  // 7. Initialize PDF support if html2canvas is available
  if (typeof html2canvas !== 'undefined') {
    setTimeout(() => {
      const modalContent = overlay.querySelector('.modal-content');
      if (modalContent) {
        // Attach PDF handler to any existing PDF button
        const pdfBtn = modalContent.querySelector('.pdf-btn');
        if (pdfBtn) {
          pdfBtn.onclick = () => generateModalPDF(modalContent);
        }
      }
    }, 100);
  }
}

// PDF Generation Utility (self-contained)
async function generateModalPDF(modalElement) {
  if (!modalElement) return;
  
  const loader = document.createElement('div');
  loader.className = 'pdf-loader';
  document.body.appendChild(loader);

  try {
    // 1. Create PDF container
    const pdfContainer = document.createElement('div');
    pdfContainer.className = 'pdf-export-container';
    pdfContainer.style.cssText = `
      position: absolute;
      left: -9999px;
      width: 210mm;
      background: white;
      padding: 15mm;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
    `;

    // 2. Clone and sanitize modal content
    const modalClone = modalElement.cloneNode(true);
    modalClone.querySelectorAll('button, [onclick]').forEach(el => el.remove());
    pdfContainer.appendChild(modalClone);
    document.body.appendChild(pdfContainer);

    // 3. Wait for rendering
    await new Promise(resolve => setTimeout(resolve, 500));

    // 4. Generate PDF
    const canvas = await html2canvas(pdfContainer, {
      scale: 2,
      useCORS: true,
      logging: true,
      backgroundColor: '#FFFFFF'
    });

    if (!window.jspdf) {
      await loadScriptWithRetry('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ 
      orientation: 'portrait', 
      unit: 'mm', 
      format: 'a4',
      hotfixes: ['px_scaling'] 
    });
    
    doc.addImage(canvas, 'PNG', 0, 0, 210, 297);
    doc.save(`PetProfile_${new Date().toISOString().slice(0,10)}.pdf`);

  } catch (error) {
    console.error("PDF generation failed:", error);
    alert("Could not generate PDF. Please ensure all content has loaded.");
  } finally {
    loader.remove();
    document.querySelector('.pdf-export-container')?.remove();
  }
}

// Helper function (keep existing implementation)
function loadScriptWithRetry(url, maxRetries = 2, delayMs = 1000) {
  return new Promise((resolve, reject) => {
    let retries = 0;
    
    const attempt = () => {
      const script = document.createElement('script');
      script.src = url;
      script.onload = resolve;
      script.onerror = () => {
        if (retries++ < maxRetries) {
          console.warn(`Retry ${retries}/${maxRetries} for ${url}`);
          setTimeout(attempt, delayMs);
        } else {
          reject(new Error(`Failed to load script after ${maxRetries} attempts: ${url}`));
        }
      };
      document.head.appendChild(script);
    };
    
    attempt();
  });
}



// 🆕 ADD THIS CLEANUP FUNCTION
function cleanupExportResources() {
  // 1. Remove all temporary containers
  const containers = document.querySelectorAll('div[style*="left: -9999px"]');
  containers.forEach(container => container.remove());
  
  // 2. Clean up canvases
  document.querySelectorAll('canvas').forEach(canvas => {
    if (canvas.parentNode) {
      canvas.width = 0;
      canvas.height = 0;
      canvas.remove();
    }
  });
  
  // 3. Revoke object URLs
  const links = document.querySelectorAll('a[href^="blob:"]');
  links.forEach(link => {
    URL.revokeObjectURL(link.href);
    link.remove();
  });
  
  // 4. Remove any leftover loaders
  const loaders = document.querySelectorAll('.pdf-loader, .loader');
  loaders.forEach(loader => loader.remove());
  
  console.log("🧹 Export resources cleaned up");
}

//===================================
// ✅ Dashboard-specific loader helper
// - show: true/false (overlay visible?)
// - messageKey: which message to show ("loading", "success-saving", "success-updating", "success-deleting", etc.)
//===================================
// Enhanced dashboard loader with fallback detection
function showDashboardLoader(show, messageKey = "loading") {
  const loader = document.getElementById("dashboard-loader");
  if (!loader) {
    // fallback if loader missing
    if (messageKey.includes("success") || messageKey.includes("error")) {
      const msg = getMessageText(messageKey);
      showTempMessage(msg, !messageKey.includes("error"), messageKey.includes("success") ? 2500 : 3000);
    }
    return;
  }

  const animation = document.getElementById("dashboard-loader-animation");
  const cssSpinner = document.getElementById("css-spinner-fallback");

  // Hide all text first
  loader.querySelectorAll(".loader-text").forEach(el => el.style.display = "none");

  // Pick the right message element (ID must match HTML)
  const targetMsg = document.getElementById(`dashboard-loader-${messageKey}`);
  if (targetMsg) {
    targetMsg.style.display = "block";
    targetMsg.style.color = messageKey.includes("error") ? "red" : "green";
  }

  if (show) {
    loader.style.display = "block";
    if (animation) animation.style.display = "block";

    // Show CSS spinner fallback only if Lottie fails
    setTimeout(() => {
      if (animation && animation.style.display === "none" && cssSpinner) {
        cssSpinner.style.display = "block";
      }
    }, 150);
  } else {
    // For success/error messages, keep visible briefly
    if (messageKey.includes("success") || messageKey.includes("error")) {
      loader.style.display = "block"; // stay visible for a moment
      if (animation) animation.style.display = "none";
      if (cssSpinner) cssSpinner.style.display = "none";

      // Delay hiding overlay to let user see success message
      const displayTime = messageKey.includes("success") ? 2500 : 3000; // it was 3000: 4000
      setTimeout(() => {
        loader.style.display = "none";
      }, displayTime);

      // 🔹 Fallback only triggers if the target message never appeared
      setTimeout(() => {
        if (targetMsg && targetMsg.style.display === "none") {
          const tempMsg = getMessageText(messageKey);
          showTempMessage(tempMsg, !messageKey.includes("error"), displayTime);
        }
      }, 250); // small delay to check if message appeared TED IF NEED
    } else {
      loader.style.display = "none"; // immediate hide for other messages
    }
  }
}



// Helper function to get message text
function getMessageText(messageKey) {
  const messages = {
    "success-saving": "Profile saved successfully!",
    "success-updating": "Profile updated successfully!",
    "success-deleting": "Profile deleted successfully!",
    "success-exporting": "All pet cards exported successfully!",
    "success-sharing": "Shared successfully!",
    "sharing-copied": "Link copied to clipboard!",
    "error-saving": "Failed to save profile. Please try again.",
    "error-updating": "Failed to update profile. Please try again.",
    "error-deleting": "Failed to delete profile. Please try again.",
    "error-exporting": "Export failed. Please try again.",
    "error-sharing": "Couldn't share. Please try again."
  };
  
  return messages[messageKey] || "Operation completed";
}
    

// Quick success/error message (optional fallback to Lottie)
//safety fallback for quick success/error messages in case the Lottie-based loader fails
function showTempMessage(message, isSuccess = true, duration = 2000) {
  const tempDiv = document.createElement('div');
  tempDiv.textContent = message;
  tempDiv.className = isSuccess ? 'success-message' : 'auth-error';
  tempDiv.style.position = 'fixed';
  tempDiv.style.top = '20px';
  tempDiv.style.left = '50%';
  tempDiv.style.transform = 'translateX(-50%)';
  tempDiv.style.padding = '10px 20px';
  tempDiv.style.zIndex = '3000';
  document.body.appendChild(tempDiv);

  setTimeout(() => tempDiv.remove(), duration);
}

//=================================
// SW snippet 
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
  const swUrl = './service-worker.js'; // Relative path
    fetch(swUrl)
      .then(response => {
        if (!response.ok) throw new Error('SW file not found');        
        return navigator.serviceWorker.register(swUrl);
      })
      .then(registration => {
        console.log('SW registered:', registration.scope);
        registration.update(); // Check for updates
      })
      .catch(err => {
        console.warn('Service worker not available:', err);
      });
  });
}

// Check for updates and show notification
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', event => {
    if (event.data === 'updateAvailable') {
      showUpdateNotification();
    }
  });
}

function showUpdateNotification() {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: var(--accent-color);
    color: white;
    padding: 15px;
    border-radius: 8px;
    z-index: 10005;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  `;
  notification.innerHTML = `
    <p>🔄 Update Available!</p>
    <button onclick="window.location.reload()" 
            style="background: white; color: var(--accent-color); border: none; padding: 5px 10px; border-radius: 4px; margin-top: 8px;">
      Reload Now
    </button>
  `;
  document.body.appendChild(notification);
}

// ====================
// IndexedDB Helpers for Background sync
// This copy of helpers inside utils.js → for background sync, another copy in SW
// ====================
// 1. Open IndexedDB (creates 'offlineProfiles' store if not exists)
async function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('PetHealthDB', 1);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('offlineProfiles')) {
        const store = db.createObjectStore('offlineProfiles', { keyPath: 'id', autoIncrement: true });
        store.createIndex('profileId', 'profile.id', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Add a queued operation
// 2. Enhance your IndexedDB helpers with better error handling
async function addOfflineProfile(db, data) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('offlineProfiles', 'readwrite');
    const store = tx.objectStore('offlineProfiles');
    const request = store.add(data);
    
    request.onsuccess = () => resolve(request.result); // Return the ID
    request.onerror = () => {
      console.error('IndexedDB add error:', request.error);
      reject(request.error);
    };
  });
}

// 3. Get all queued operations
async function getOfflineProfiles(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('offlineProfiles', 'readonly');
    const store = tx.objectStore('offlineProfiles');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

// 4. Remove a synced operation
async function removeOfflineProfile(db, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('offlineProfiles', 'readwrite');
    const store = tx.objectStore('offlineProfiles');
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ======================
// ENHANCED SUPPORT MANAGER - Add to utils.js
// ======================

class SupportManager {
    constructor() {
        this.messages = [
            "Love this app? Share with other pet lovers! 🐾",
            "Your support helps us improve faster!",
            "Premium features coming soon - stay tuned! ⭐",
            "Rate our app to help other pet owners find us!",
            "Follow us for updates on new features!"
        ];
        this.isInitialized = false;
        this.isUserAuthenticated = false;
        this.authCheckInterval = null;
        
        // Setup auth monitoring
        this.setupAuthListener();
    }

    setupAuthListener() {
        console.log('🔐 Setting up auth monitoring for support messages...');
        
        // Method 1: Check Firebase auth state
        if (typeof firebase !== 'undefined' && firebase.auth) {
            firebase.auth().onAuthStateChanged((user) => {
                const wasAuthenticated = this.isUserAuthenticated;
                this.isUserAuthenticated = !!user;
                
                if (this.isUserAuthenticated && !wasAuthenticated) {
                    console.log('✅ User authenticated - support messages enabled');
                    this.tryInitialize();
                } else if (!this.isUserAuthenticated && wasAuthenticated) {
                    console.log('🚫 User signed out - support messages disabled');
                    this.stopMessageTimers();
                }
            });
        }
        
        // Method 2: Fallback - check dashboard visibility
        this.authCheckInterval = setInterval(() => {
            if (!this.isUserAuthenticated) {
                const dashboard = document.getElementById('dashboard');
                const authContainer = document.getElementById('authContainer');
                
                if (dashboard && !dashboard.classList.contains('hidden') && 
                    authContainer && authContainer.classList.contains('hidden')) {
                    console.log('✅ Dashboard active - enabling support messages');
                    this.isUserAuthenticated = true;
                    this.tryInitialize();
                }
            }
        }, 3000);
    }

    tryInitialize() {
        if (this.isInitialized || !this.isUserAuthenticated) return;
        
        console.log('🎯 Initializing support messages for authenticated user');
        this.init();
    }

    init() {
        if (this.isInitialized) return;
        
        // Inject CSS once
        this.injectStyles();
        
        // Start message timers
        this.startMessageTimers();
        
        this.isInitialized = true;
        console.log('✅ SupportManager initialized for authenticated user');
    }

    startMessageTimers() {
        // Show first message after 45 seconds
        setTimeout(() => {
            if (this.isUserAuthenticated) {
                this.showSupportMessage();
            }
        }, 45000);
        
        // Show occasionally after that (every 2 minutes, 20% chance)
        this.messageInterval = setInterval(() => {
            if (this.isUserAuthenticated && Math.random() < 0.2) {
                this.showSupportMessage();
            }
        }, 120000);
    }

    stopMessageTimers() {
        if (this.messageInterval) {
            clearInterval(this.messageInterval);
            this.messageInterval = null;
        }
        this.isInitialized = false;
    }

    injectStyles() {
        if (document.getElementById('support-manager-styles')) return;
        
        const styles = `
        .support-message-overlay {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            animation: fadeIn 0.3s ease-in;
        }
        .support-message {
            background: white;
            padding: 20px;
            border-radius: 15px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            max-width: 300px;
            text-align: center;
            animation: slideUp 0.3s ease-out;
        }
        .support-content .support-emoji {
            font-size: 2em;
            display: block;
            margin-bottom: 10px;
        }
        .support-content p {
            margin: 10px 0;
            color: #333;
            font-size: 14px;
            line-height: 1.4;
        }
        .support-close-btn {
            background: #4CAF50;
            color: white;
            border: none;
            padding: 8px 20px;
            border-radius: 20px;
            cursor: pointer;
            font-size: 14px;
            margin-top: 10px;
            transition: background 0.3s;
        }
        .support-close-btn:hover { background: #45a049; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { 
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        `;
        
        const styleEl = document.createElement('style');
        styleEl.id = 'support-manager-styles';
        styleEl.textContent = styles;
        document.head.appendChild(styleEl);
    }

    showSupportMessage() {
        // Double-check user is still authenticated and in dashboard
        if (!this.isUserAuthenticated || !this.isInDashboard()) {
            console.log('🚫 Suppressing message - user not in dashboard');
            return;
        }
        
        // Don't show if user is in the middle of something important
        if (this.shouldSuppressMessage()) {
            console.log('🚫 Suppressing message - critical operation in progress');
            return;
        }
        
        // Don't show if user just dismissed one recently
        const lastShow = localStorage.getItem('lastSupportShow');
        const now = Date.now();
        if (lastShow && (now - parseInt(lastShow)) < 3600000) { // 1 hour cooldown
            return;
        }

        const randomMessage = this.messages[Math.floor(Math.random() * this.messages.length)];
        
        const supportDiv = document.createElement('div');
        supportDiv.className = 'support-message-overlay';
        supportDiv.innerHTML = `
            <div class="support-message">
                <div class="support-content">
                    <span class="support-emoji">🐾</span>
                    <p>${randomMessage}</p>
                    <button class="support-close-btn">Got it!</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(supportDiv);
        
        // Add event listener
        supportDiv.querySelector('.support-close-btn').addEventListener('click', () => {
            supportDiv.remove();
            localStorage.setItem('lastSupportShow', Date.now().toString());
        });
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (supportDiv.parentElement) {
                supportDiv.remove();
                localStorage.setItem('lastSupportShow', Date.now().toString());
            }
        }, 10000);
    }

    isInDashboard() {
        const dashboard = document.getElementById('dashboard');
        const authContainer = document.getElementById('authContainer');
        
        return dashboard && !dashboard.classList.contains('hidden') && 
               authContainer && authContainer.classList.contains('hidden');
    }

    shouldSuppressMessage() {
        // Don't show during form editing, modals, or critical operations
        const isEditing = window.isEditing || window.editingProfileId !== null;
        const hasModal = document.querySelector('.modal, [class*="modal"], [class*="overlay"]');
        const isProcessing = document.getElementById('processing-loader')?.style.display !== 'none';
        
        return isEditing || hasModal || isProcessing;
    }
    
    // Cleanup method (optional)
    destroy() {
        if (this.authCheckInterval) {
            clearInterval(this.authCheckInterval);
        }
        if (this.messageInterval) {
            clearInterval(this.messageInterval);
        }
    }
}

// Create global instance
window.supportManager = new SupportManager();

