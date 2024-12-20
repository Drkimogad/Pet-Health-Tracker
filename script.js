// Check login status and show profile section
function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    
    if (isLoggedIn === 'true') {
        document.getElementById('authSection').style.display = 'none'; // Hide login/logout buttons
        document.getElementById('profileSection').style.display = 'block'; // Show profile section
        loadSavedPetProfiles(); // Load saved pet profiles
    } else {
        document.getElementById('authSection').style.display = 'block'; // Show login button
        document.getElementById('profileSection').style.display = 'none'; // Hide profile section
    }
}

// Login function
function login() {
    localStorage.setItem('isLoggedIn', 'true');
    checkLoginStatus();
}

// Logout function
function logout() {
    localStorage.setItem('isLoggedIn', 'false');
    checkLoginStatus();
}

// Handle Pet Profile Saving
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
        petImage: document.getElementById('petImageUpload').files[0] ? URL.createObjectURL(document.getElementById('petImageUpload').files[0]) : null
    };

    // Save pet profile in localStorage
    let savedProfiles = JSON.parse(localStorage.getItem('petProfiles')) || [];
    savedProfiles.push(petProfile);
    localStorage.setItem('petProfiles', JSON.stringify(savedProfiles));

    alert('Pet profile saved!');
    loadSavedPetProfiles();
});

// Load Saved Pet Profiles
function loadSavedPetProfiles() {
    const petProfiles = JSON.parse(localStorage.getItem('petProfiles'));
    const dietList = document.getElementById('dietList');
    dietList.innerHTML = '';  // Clear current list

    if (petProfiles) {
        petProfiles.forEach(profile => {
            const listItem = document.createElement('li');
            listItem.classList.add('pet-profile');
            
            const petImage = profile.petImage ? `<img src="${profile.petImage}" alt="Pet Image" class="pet-image">` : '';
            const petDetails = `
                <p><strong>Name:</strong> ${profile.petName}</p>
                <p><strong>Breed:</strong> ${profile.breed}</p>
                <p><strong>Age:</strong> ${profile.age}</p>
                <p><strong>Weight:</strong> ${profile.weight}</p>
                <p><strong>Allergies:</strong> ${profile.allergies}</p>
                <p><strong>Medical History:</strong> ${profile.medicalHistory}</p>
                <p><strong>Diet Plan:</strong> ${profile.dietPlan}</p>
            `;

            listItem.innerHTML = petImage + petDetails;
            dietList.appendChild(listItem);
        });
    }
}

// Initial load
checkLoginStatus();
