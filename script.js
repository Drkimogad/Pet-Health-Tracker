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
        document.getElementById('authSection').style.display = 'none';  // Hide login/signup page
        document.getElementById('mainContent').style.display = 'block';  // Show main content
        document.getElementById('logoutButton').style.display = 'block';  // Show logout button
        
        // Load saved pet data if available
        loadSavedPetProfile();
    } else {
        alert('Invalid credentials! Please try again.');
    }
});

// Handle Logout
document.getElementById('logoutButton').addEventListener('click', function () {
    document.getElementById('authSection').style.display = 'block';  // Show login/signup page
    document.getElementById('mainContent').style.display = 'none';  // Hide main content
    document.getElementById('logoutButton').style.display = 'none';  // Hide logout button
    
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
        dietPlan: document.getElementById('dietPlan').value
    };

    // Save pet profile in localStorage
    localStorage.setItem('petProfile', JSON.stringify(petProfile));

    // Alert and reload saved data
    alert('Pet profile saved!');
    loadSavedPetProfile();
});

// Load Saved Pet Profile
function loadSavedPetProfile() {
    const petProfile = JSON.parse(localStorage.getItem('petProfile'));
    if (petProfile) {
        document.getElementById('petName').value = petProfile.petName;
        document.getElementById('breed').value = petProfile.breed;
        document.getElementById('age').value = petProfile.age;
        document.getElementById('weight').value = petProfile.weight;
        document.getElementById('allergies').value = petProfile.allergies;
        document.getElementById('medicalHistory').value = petProfile.medicalHistory;
        document.getElementById('dietPlan').value = petProfile.dietPlan;
    }
}

// Initial load
loadSavedPetProfile();
