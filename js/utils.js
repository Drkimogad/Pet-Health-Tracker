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

window.hideModal = function() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) {
    overlay.classList.remove('active');
    document.body.classList.remove('modal-active');
    setTimeout(() => overlay.remove(), 300);
  }
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

//===================================
// UI HELPERS
//==========================
// 1️⃣ Show or hide loader with optional message
//===============================================
function showLoader(show, message = "Loading...") {
  const loader = document.getElementById('processing-loader');
  const msg = document.getElementById('loader-message');
  if (!loader || !msg) return;

  msg.textContent = message;
  loader.style.display = show ? "block" : "none";
}

// Quick success/error message (optional fallback to Lottie)
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

//=================================================================
//2️⃣ Create helper functions in dashboard.js to show/hide this popup:
//==================================================================
function showProfileSavedAnimation(show = true, duration = 1500) {
  const loader = document.getElementById('profile-success-loader');
  if (!loader) return;

  if (show) {
    loader.style.display = 'block';
    // Auto-hide after duration
    setTimeout(() => {
      loader.style.display = 'none';
    }, duration);
  } else {
    loader.style.display = 'none';
  }
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
