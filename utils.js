'use strict';

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
