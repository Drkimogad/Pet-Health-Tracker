// DOM ELEMENTS FOR UTILS.JS
const DOM = {
  // UI Elements (used across files)
  processingLoader: document.getElementById('processing-loader'),
  
  // Form Elements (used in resetForm())
  dietForm: document.getElementById('dietForm'),
  petPhotoPreview: document.getElementById('petPhotoPreview'),
  
  // Modal Elements (used in showModal())
  petModal: document.getElementById('pet-modal') || null, // Optional fallback
  modalOverlay: document.getElementById('modal-overlay') || null
};

//🔄 Updated uploadToCloudinary()
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
  const folderPath = `Pet-Health-Tracker/users/${userId}/${petProfileId}/gallery`;

  // 4. PREPARE UPLOAD
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
  formData.append('folder', folderPath);
  console.log("📁 Upload folder:", folderPath);
  //formData.append('public_id', `img_${Date.now()}`); // Unique filename
  // No public_id specified = auto-generate
  // manual moderation is not supported for unsigned upload! 
  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/upload`,
      { 
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(15000)
      }
    );

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    return {
      url: data.url,
      path: data.public_id, // Full Cloudinary path
      width: data.width,
      height: data.height
    };

  } catch (error) {
    console.error('Cloudinary upload failed:', error);
    throw error;
  }
}

// Show error function
showErrorToUser: function(message, isSuccess = false) {
    try {
      const errorDiv = document.getElementById('error-message');
      if (!errorDiv) {
        const newErrorDiv = document.createElement('div');
        newErrorDiv.id = 'error-message';
        newErrorDiv.className = isSuccess ? 'success-message' : 'auth-error';
        newErrorDiv.textContent = message;
        document.querySelector('#authContainer').prepend(newErrorDiv);
      } else {
        errorDiv.textContent = message;
        errorDiv.className = isSuccess ? 'success-message' : 'auth-error';
      }
    } catch (fallbackError) {
      alert(message);
    }
  }
// disable UI 
  disableUI: function() {
    document.body.innerHTML = `
      <h1 style="color: red; padding: 2rem; text-align: center">
        Critical Error: Failed to load application interface
      </h1>
    `;
  }
}
// Show auth form
function showAuthForm() {
  const container = document.getElementById('authContainer') || document.getElementById('auth-container');
  if (container) container.classList.remove('hidden');
}
function showUserInfo(user) {
  const emailEl = document.getElementById('userEmail');
  if (emailEl && user?.email) {
    emailEl.textContent = user.email;
  }
}

// DOM & UI Helpers
function addSafeListener(id, handler) {
  const element = DOM.id;
  if (element) {
    element.removeEventListener('click', handler);
    element.addEventListener('click', handler);
  }
}
// function reset form
function resetForm() {
  const form = DOM.dietForm;
  if (form) form.reset();
  const preview = DOM.petPhotoPreview;
  if (preview) {
    preview.src = '';
    preview.style.display = 'none';
  }
}

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

//  Modal Utilities
function showModal(content) {
  let modal = DOM.pet-modal;
  let overlay = DOM.modal-overlay;

  if (!modal) {
    overlay = document.createElement('div');
    overlay.id = 'modal-overlay';
    overlay.className = 'modal-overlay';

    modal = document.createElement('div');
    modal.id = 'pet-modal';
    modal.className = 'modal-content';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-modal';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', hideModal);

    modal.appendChild(closeBtn);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) hideModal();
    });
  }

  modal.innerHTML = `<button class="close-modal">&times;</button>${content}`;
  modal.querySelector('.close-modal').addEventListener('click', hideModal);
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function hideModal() {
  const overlay = DOM.modal-overlay;
  if (overlay) {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function trapFocus(modal) {
  const focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  modal.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    if (e.shiftKey) {
      if (document.activeElement === first) {
        last.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === last) {
        first.focus();
        e.preventDefault();
      }
    }
  });
}
// generate unique id
function generateUniqueId() {
  return 'pet-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}
//  FIREBASE SAFE ACCESSORS
function getAuth() {
  return firebase.auth(); // Use directly from initialized Firebase
}

function getFirestore() {
  if (!firestore) console.warn("Firestore not initialized - using localStorage fallback");
  return firestore;
}

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
