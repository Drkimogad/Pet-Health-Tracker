const users = [];
const savedProfiles = [];

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
        
        loadSavedPetProfiles();
    } else {
        alert('Invalid credentials!');
    }
});

// Handle Logout
document.getElementById('logoutButton').addEventListener('click', function () {
    document.getElementById('authSection').style.display = 'block';
    document.getElementById('mainContent').style.display = 'none';
    document.getElementById('logoutButton').style.display = 'none';
    alert('Logged out successfully!');
});

// Handle Saving Pet Profile
document.getElementById('dietForm').addEventListener('submit', function (event) {
    event.preventDefault();

    const petName = document.getElementById('petName').value;
    const breed = document.getElementById('breed').value;
    const allergies = document.getElementById('allergies').value;
    const medicalHistory = document.getElementById('medicalHistory').value;
    const dietPlan = document.getElementById('dietPlan').value;
    const vaccinationReminder = document.getElementById('vaccinationReminder').value;
    const medicalHistoryReminder = document.getElementById('medicalHistoryReminder').value;
    const dietReminder = document.getElementById('dietReminder').value;
    const groomingReminder = document.getElementById('groomingReminder').value;
    
    const petPhoto = document.getElementById('petPhoto').files[0];

    const reader = new FileReader();
    reader.onload = function (e) {
        savedProfiles.push({
            petName,
            breed,
            allergies,
            medicalHistory,
            dietPlan,
            vaccinationReminder,
            medicalHistoryReminder,
            dietReminder,
            groomingReminder,
            petPhoto: e.target.result
        });

        loadSavedPetProfiles();
    };

    if (petPhoto) {
        reader.readAsDataURL(petPhoto);
    }
});

// Load Saved Pet Profiles
function loadSavedPetProfiles() {
    const savedProfilesList = document.getElementById('savedProfilesList');
    savedProfilesList.innerHTML = '';

    savedProfiles.forEach((profile, index) => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <img src="${profile.petPhoto}" alt="${profile.petName}">
            <span>${profile.petName} - ${profile.breed}</span>
            <button onclick="deleteProfile(${index})">Delete</button>
        `;
        savedProfilesList.appendChild(listItem);
    });
}

// Delete Pet Profile
function deleteProfile(index) {
    savedProfiles.splice(index, 1);
    loadSavedPetProfiles();
}
