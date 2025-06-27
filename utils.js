'use strict';
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
  const folderPath = `PetStudio/users/${userId}/${petProfileId}/gallery`;

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

// ====== Error Display ======
function showAuthError(message) {
  const errorElement = document.getElementById('authError');
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.classList.remove('hidden');
    setTimeout(() => errorElement.classList.add('hidden'), 5000);
  }
}

function showSystemMessage(message) {
  const messageElement = document.createElement('div');
  messageElement.className = 'system-message';
  messageElement.textContent = message;
  document.body.prepend(messageElement);
  setTimeout(() => messageElement.remove(), 5000);
}

// ====== DOM & UI Helpers ======
function addSafeListener(id, handler) {
  const element = document.getElementById(id);
  if (element) {
    element.removeEventListener('click', handler);
    element.addEventListener('click', handler);
  }
}

function resetForm() {
  const form = document.getElementById('dietForm');
  if (form) form.reset();
  const preview = document.getElementById('petPhotoPreview');
  if (preview) {
    preview.src = '';
    preview.style.display = 'none';
  }
}

// ====== Reminder Utilities ======
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

// ====== Modal Utilities ======
function showModal(content) {
  let modal = document.getElementById('pet-modal');
  let overlay = document.getElementById('modal-overlay');

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
  const overlay = document.getElementById('modal-overlay');
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

// ====== Notifications & IDs ======
function showSuccessNotification(action, petName) {
  const message = `${petName}'s profile was ${action} successfully!`;

  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Success', { body: message });
  }
  alert(message);
}

function generateUniqueId() {
  return 'pet-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}
