// Dummy storage for users and pet profiles
const users = [];
let petProfiles = JSON.parse(localStorage.getItem('petProfiles')) || [];

// Handle Sign-Up
document.getElementById('signUpForm').addEventListener('submit', function (event) {
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
document.getElementById('loginForm').addEventListener('submit', function (event) {
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
        gender: document.getElementById('gender').value,
        age: document.getElementById('age').value,
        weight: document.getElementById('weight').value,
        allergies: document.getElementById('allergies').value,
        medicalHistory: document.getElementById('medicalHistory').value,
        dietPlan: document.getElementById('dietPlan').value,
        petImage: document.getElementById('petImage').files[0] ? document.getElementById('petImage').files[0].name : ""
    };

    petProfiles.push(petProfile);
    localStorage.setItem('petProfiles', JSON.stringify(petProfiles));
    alert('Pet profile saved!');
    loadSavedPetProfiles();
});

// Load Saved Pet Profiles
function loadSavedPetProfiles() {
    const petProfilesList = document.getElementById('petProfilesList');
    petProfilesList.innerHTML = '';
    petProfiles.forEach((profile, index) => {
        const profileItem = document.createElement('li');
        profileItem.innerHTML = `
            <div>
                <strong>${profile.petName}</strong>
                <p>Breed: ${profile.breed}</p>
                <p>Gender: ${profile.gender}</p>
                <p>Age: ${profile.age}</p>
                <p>Weight: ${profile.weight}</p>
            </div>
            <button onclick="deleteProfile(${index})">Delete</button>
        `;
        petProfilesList.appendChild(profileItem);
    });
}

// Delete Pet Profile
function deleteProfile(index) {
    petProfiles.splice(index, 1);
    localStorage.setItem('petProfiles', JSON.stringify(petProfiles));
    loadSavedPetProfiles();
}
