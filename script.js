const users = JSON.parse(localStorage.getItem('users')) || [];

// Authentication Handlers
document.getElementById('signUp').addEventListener('submit', function (event) {
  event.preventDefault();
  const email = document.getElementById('signUpEmail').value;
  const password = document.getElementById('signUpPassword').value;

  const existingUser = users.find(user => user.email === email);
  if (existingUser) {
    alert('User already exists! Please log in.');
    return;
  }

  users.push({ email, password });
  localStorage.setItem('users', JSON.stringify(users));
  alert('Sign-up successful! You can now log in.');

  document.getElementById('signUpForm').style.display = 'none';
  document.getElementById('loginForm').style.display = 'block';
});

document.getElementById('login').addEventListener('submit', function (event) {
  event.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  const user = users.find((user) => user.email === email && user.password === password);
  if (user) {
    alert('Login successful!');
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
    document.getElementById('logoutButton').style.display = 'block';
    loadSavedPetProfile();
  } else {
    alert('Invalid credentials! Please try again.');
  }
});

document.getElementById('logoutButton').addEventListener('click', function () {
  document.getElementById('authSection').style.display = 'block';
  document.getElementById('mainContent').style.display = 'none';
  document.getElementById('logoutButton').style.display = 'none';
  alert('Logged out successfully!');
});

// Enhanced Profile Handling
function handleImageUpload(file, callback) {
  if (!file) return callback('');
  const reader = new FileReader();
  reader.onload = (e) => callback(e.target.result);
  reader.readAsDataURL(file);
}

document.getElementById('dietForm').addEventListener('submit', function (event) {
  event.preventDefault();
  const fileInput = document.getElementById('petPhoto');

  const petProfile = {
    petName: document.getElementById('petName').value,
    breed: document.getElementById('breed').value,
    age: document.getElementById('age').value,
    weight: document.getElementById('weight').value,
    allergies: document.getElementById('allergies').value,
    medicalHistory: document.getElementById('medicalHistory').value,
    dietPlan: document.getElementById('dietPlan').value,
    vaccinationsAndDewormingReminder: document.getElementById('vaccinationsAndDewormingReminder').value,
    medicalCheckupsReminder: document.getElementById('medicalCheckupsReminder').value,
    groomingReminder: document.getElementById('groomingReminder').value,
    petPhoto: ''
  };

  handleImageUpload(fileInput.files[0], (base64Image) => {
    petProfile.petPhoto = base64Image;
    let savedProfiles = JSON.parse(localStorage.getItem('petProfiles')) || [];
    savedProfiles.push(petProfile);
    localStorage.setItem('petProfiles', JSON.stringify(savedProfiles));
    loadSavedPetProfile();
    alert('Pet profile saved!');
  });
});

function loadSavedPetProfile() {
  const savedProfiles = JSON.parse(localStorage.getItem('petProfiles')) || [];
  const savedProfilesList = document.getElementById('savedProfilesList');
  savedProfilesList.innerHTML = '';

  savedProfiles.forEach((profile, index) => {
    const petCard = document.createElement('li');
    petCard.classList.add('pet-card');
    petCard.innerHTML = `
      <div class="pet-card-content">
        <h4>${profile.petName}</h4>
        <p>Breed: ${profile.breed}</p>
        <p>Age: ${profile.age}</p>
        <p>Weight: ${profile.weight}</p>
        ${profile.petPhoto ? `<img src="${profile.petPhoto}" alt="Pet Photo" class="pet-photo"/>` : ''}
        <button class="deleteProfileButton" data-index="${index}">Delete Profile</button>
      </div>
    `;
    savedProfilesList.appendChild(petCard);
  });

  document.querySelectorAll('.deleteProfileButton').forEach((button) => {
    button.addEventListener('click', (event) => {
      const index = event.target.dataset.index;
      deletePetProfile(index);
    });
  });
}

function deletePetProfile(index) {
  let savedProfiles = JSON.parse(localStorage.getItem('petProfiles')) || [];
  const profile = savedProfiles[index];
  
  if (profile.petPhoto && profile.petPhoto.startsWith('blob:')) {
    URL.revokeObjectURL(profile.petPhoto);
  }
  
  savedProfiles.splice(index, 1);
  localStorage.setItem('petProfiles', JSON.stringify(savedProfiles));
  loadSavedPetProfile();
}

// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(
      'https://drkimogad.github.io/Pet-Health-Tracker/service-worker.js', 
      {
        scope: '/Pet-Health-Tracker/'
      }
    ).then((registration) => {
      console.log('SW registered:', registration);
      setInterval(() => registration.update(), 60 * 60 * 1000);
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }).catch(console.error);
  });
}

// Logs Handling (Unchanged)
function savePetLog(logData) {
  let logs = JSON.parse(localStorage.getItem('petLogs')) || [];
  logs.push(logData);
  localStorage.setItem('petLogs', JSON.stringify(logs));
}
