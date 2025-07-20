//===========================================
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
      url: data.url.replace(/^http:\/\//, 'https://'), // 🔒 Force HTTPS
      path: data.public_id, // Full Cloudinary path
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
//  Modal Utilities, MODAL IS NOT STATIC HTML fixed version
//==========================
function showModal(content) {
  // 1. FIRST Cleanup any existing instance
  const existingOverlay = document.getElementById('modal-overlay');
  if (existingOverlay) {
    hideModal(); // Use your existing hide function
  }

  // 2. Create fresh elements (your existing code)
  const overlay = document.createElement('div');
  overlay.id = 'modal-overlay';
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.id = 'pet-modal';
  modal.className = 'modal-content';

  // 3. Add close button (modified to prevent duplicate handlers)
  const closeBtn = document.createElement('button');
  closeBtn.className = 'close-modal';
  closeBtn.innerHTML = '&times;';
  closeBtn.onclick = hideModal; // ← Changed from addEventListener

  // 4. Build structure (your existing code)
  modal.appendChild(closeBtn);
  modal.innerHTML += content; // ← Preserves your content insertion
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // 5. Add overlay click handler (modified)
  overlay.onclick = (e) => { // ← Changed from addEventListener
    if (e.target === overlay) hideModal();
  };

  // 6. Activate (your existing code)
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';

  // 7. Focus trap (your existing code)
  trapFocus(modal);
}

// UPDATED HIDE MODAL (Enhanced)
function hideModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) {
    // 1. Remove event listeners first
    overlay.onclick = null; // ← Cleanup click handler
    const closeBtn = overlay.querySelector('.close-modal');
    if (closeBtn) closeBtn.onclick = null;

    // 2. Fade out before removal
    overlay.classList.remove('active');
    setTimeout(() => {
      overlay.remove();
      document.body.style.overflow = '';
    }, 300); // Match your CSS transition duration
  }
}
// trapFocus function
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
