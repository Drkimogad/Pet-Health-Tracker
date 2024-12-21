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
        sex: document.getElementById('sex').value,
        age: document.getElementById('age').value,
        weight: document.getElementById('weight').value,
        allergies: document.getElementById('allergies').value,
        medicalHistory: document.getElementById('medicalHistory').value,
        dietPlan: document.getElementById('dietPlan').value,
        petPhoto: document.getElementById('petPhoto').files[0]
    };

    // Save pet profile in localStorage
    let savedProfiles = JSON.parse(localStorage.getItem('petProfiles')) || [];
    savedProfiles.push(petProfile);
    localStorage.setItem('petProfiles', JSON.stringify(savedProfiles));

    // Alert and reload saved data
    alert('Pet profile saved!');
    loadSavedPetProfile();
});

// Load Saved Pet Profiles
function loadSavedPetProfile() {
    const savedProfiles = JSON.parse(localStorage.getItem('petProfiles')) || [];
    const savedProfilesList = document.getElementById('savedProfilesList');
    savedProfilesList.innerHTML = ''; // Clear existing list

    savedProfiles.forEach((profile, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <h3>${profile.petName}</h3>
            <p>Breed: ${profile.breed}, Sex: ${profile.sex}, Age: ${profile.age}, Weight: ${profile.weight}</p>
            <p>Allergies: ${profile.allergies}</p>
            <p>Medical History: ${profile.medicalHistory}</p>
            <p>Diet Plan: ${profile.dietPlan}</p>
            <img src="${URL.createObjectURL(profile.petPhoto)}" alt="Pet Photo" width="100"><br><br>
            <button onclick="deleteProfile(${index})">Delete</button>
        `;
        savedProfilesList.appendChild(li);
    });
}

// Delete Pet Profile
function deleteProfile(index) {
    let savedProfiles = JSON.parse(localStorage.getItem('petProfiles')) || [];
    savedProfiles.splice(index, 1);
    localStorage.setItem('petProfiles', JSON.stringify(savedProfiles));
    loadSavedPetProfile();
}

// Initial load
loadSavedPetProfile();
