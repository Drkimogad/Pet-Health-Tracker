//===========================================
//Global scope or utils.js
// Put this at the VERY TOP of your utils.js
window.hideModal = function() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) {
    overlay.classList.remove('active');
    document.body.classList.remove('modal-active');
    setTimeout(() => overlay.remove(), 300);
  }
};

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
  const folderPath = `PetStudio/Pet-Health-Tracker/users/${userId}/${petProfileId}/gallery`;

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
function showModal(content) {
  // 1. Remove existing modal (keep this)
  const oldModal = document.getElementById('modal-overlay');
  if (oldModal) oldModal.remove();

  // 2. Create modal (keep this)
  const overlay = document.createElement('div');
  overlay.id = 'modal-overlay';
  overlay.className = 'modal-overlay';
  
  // 3. Simplify innerHTML (remove action button references)
  overlay.innerHTML = `
    <div class="modal-content" id="pet-modal">
      <button class="close-modal">&times;</button>
      ${content}
    </div>
  `;

  // 4. Add to DOM (keep this)
  document.body.appendChild(overlay);
  document.body.classList.add('modal-active');

  // 5. Simplified event binding (remove redundant onclick)
  overlay.querySelector('.close-modal').onclick = hideModal;
  overlay.onclick = (e) => e.target === overlay && hideModal();

  // 6. Activate (keep this)
  overlay.classList.add('active');
  trapFocus(overlay.querySelector('.modal-content'));
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
