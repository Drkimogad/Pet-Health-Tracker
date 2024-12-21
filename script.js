// Dummy storage for users
const users = [];

// Handle Sign-Up
document.getElementById('signUp').addEventListener('submit', function (event) {
    event.preventDefault();
    const email = document.getElementById('signUpEmail').value;
    const password = document.getElementById('signUpPassword').value;

    users.push({ email, password });
    alert('Sign-up successful! You can now log in.');
    document.getElementById('signUpForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
});

// Handle Login
document.getElementById('login').addEventListener('submit', function (event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    const user = users.find(user => user.email === email && user.password === password);

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

// Handle Logout
document.getElementById('logoutButton').addEventListener('click', function () {
    document.getElementById('authSection').style.display = 'block';
    document.getElementById('mainContent').style.display = 'none';
    document.getElementById('logoutButton').style.display = 'none';
    alert('Logged out successfully!');
});

// Save Pet Profile
document.getElementById('dietForm').addEventListener('submit', function (event) {
    event.preventDefault();

    const petProfile = {
        petName: document.getElementById('petName').value,
        breed: document.getElementById('breed').value,
        age: document.getElementById('age').value,
        weight: document.getElementById('weight').value,
        allergies: document.getElementById('allergies').value,
        medicalHistory: document.getElementById('medicalHistory').value,
        dietPlan: document.getElementById('dietPlan').value,
        vaccinationReminder: document.getElementById('vaccinationReminder').value,
        medicalHistoryReminder: document.getElementById('medicalHistoryReminder').value,
        dietReminder: document.getElementById('dietReminder').value,
        petPhoto: document.getElementById('petPhoto').files[0]
    };

    const savedProfiles = JSON.parse(localStorage.getItem('savedProfiles')) || [];
    savedProfiles.push(petProfile);
    localStorage.setItem('savedProfiles', JSON.stringify(savedProfiles));
    alert('Pet profile saved!');
    loadSavedPetProfile();
});

// Load Saved Pet Profiles
function loadSavedPetProfile() {
    const savedProfiles = JSON.parse(localStorage.getItem('savedProfiles')) || [];
    const savedProfilesList = document.getElementById('savedProfilesList');
    savedProfilesList.innerHTML = ''; // Clear existing list

    savedProfiles.forEach((profile, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <h4>${profile.petName}</h4>
            <p>Breed: ${profile.breed}</p>
            <p>Age: ${profile.age}, Weight: ${profile.weight}</p>
            <p>Allergies: ${profile.allergies}</p>
            <p>Medical History: ${profile.medicalHistory}</p>
            <p>Diet Plan: ${profile.dietPlan}</p>
            <p>Vaccination Reminder: ${profile.vaccinationReminder}</p>
            <p>Medical History Reminder: ${profile.medicalHistoryReminder}</p>
            <p>Diet Reminder: ${profile.dietReminder}</p>
            <img src="${URL.createObjectURL(profile.petPhoto)}" alt="${profile.petName} Photo" width="100"><br><br>
            <button onclick="deleteProfile(${index})">Delete Profile</button>
        `;
        savedProfilesList.appendChild(li);
    });
}

// Delete Pet Profile
function deleteProfile(index) {
    const savedProfiles = JSON.parse(localStorage.getItem('savedProfiles')) || [];
    savedProfiles.splice(index, 1);
    localStorage.setItem('savedProfiles', JSON.stringify(savedProfiles));
    loadSavedPetProfile();
}

// Toggle Reminder Section Visibility
function toggleReminderSection() {
    const reminderSection = document.getElementById('reminderSection');
    reminderSection.style.display = reminderSection.style.display === 'none' ? 'block' : 'none';
}
