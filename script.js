// Dummy storage for users (you can replace this with localStorage)
const users = [];

// Handle Sign-Up
document.getElementById('signUp').addEventListener('submit', function (event) {
    event.preventDefault();
    
    const email = document.getElementById('signUpEmail').value;
    const password = document.getElementById('signUpPassword').value;

    // Store the new user
    users.push({ email, password });
    alert('Sign-up successful! You can now log in.');
    
    // Switch to Login Form
    document.getElementById('signUpForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
});

// Handle Login
document.getElementById('login').addEventListener('submit', function (event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    // Check if the user exists
    const user = users.find(user => user.email === email && user.password === password);
    
    if (user) {
        alert('Login successful!');
        
        // Show Main Content and Hide Authentication Forms
        document.getElementById('authSection').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';
        document.getElementById('logoutButton').style.display = 'block';
        
        // Load saved pet data if available
        loadSavedPetProfiles();
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
        vaccinationHistory: document.getElementById('vaccinationHistory').value,
        dewormingHistory: document.getElementById('dewormingHistory').value,
        photo: document.getElementById('petImagePreview').src
    };

    // Save pet profile in localStorage
    let savedProfiles = JSON.parse(localStorage.getItem('savedProfiles')) || [];
    savedProfiles.push(petProfile);
    localStorage.setItem('savedProfiles', JSON.stringify(savedProfiles));

    alert('Pet profile saved!');
    loadSavedPetProfiles();
});

// Load Saved Pet Profiles
function loadSavedPetProfiles() {
    const savedProfiles = JSON.parse(localStorage.getItem('savedProfiles')) || [];
    const profilesList = document.getElementById('savedProfilesList');
    profilesList.innerHTML = '';

    savedProfiles.forEach((profile, index) => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <strong>${profile.petName}</strong>
            <button onclick="deleteProfile(${index})">Delete</button>
            <p>Breed: ${profile.breed}</p>
            <p>Age: ${profile.age}</p>
            <p>Weight: ${profile.weight}</p>
            <p>Diet Plan: ${profile.dietPlan}</p>
            <img src="${profile.photo}" alt="Pet Photo" style="max-width: 100px;">
        `;
        profilesList.appendChild(listItem);
    });
}

// Delete Saved Pet Profile
function deleteProfile(index) {
    let savedProfiles = JSON.parse(localStorage.getItem('savedProfiles')) || [];
    savedProfiles.splice(index, 1);
    localStorage.setItem('savedProfiles', JSON.stringify(savedProfiles));
    loadSavedPetProfiles();
}

// Print Profile
document.getElementById('printButton').addEventListener('click', function () {
    window.print();
});

// Initial load
loadSavedPetProfiles();
