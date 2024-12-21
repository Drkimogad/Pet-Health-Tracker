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
        loadSavedPetProfiles();
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
    let savedProfiles = JSON.parse(localStorage.getItem('savedProfiles')) || [];
    savedProfiles.push(petProfile);
    localStorage.setItem('savedProfiles', JSON.stringify(savedProfiles));

    // Alert and reload saved data
    alert('Pet profile saved!');
    loadSavedPetProfiles();
});

// Load Saved Pet Profiles
function loadSavedPetProfiles() {
    const savedProfiles = JSON.parse(localStorage.getItem('savedProfiles')) || [];
    const savedProfilesList = document.getElementById('savedProfilesList');
    
    savedProfilesList.innerHTML = ''; // Clear current list

    savedProfiles.forEach(profile => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${profile.petName}</strong> - ${profile.breed} (${profile.age} years old)`;
        savedProfilesList.appendChild(li);
    });
}

// Initial load
loadSavedPetProfiles();
