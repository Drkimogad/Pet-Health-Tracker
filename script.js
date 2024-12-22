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
        age: document.getElementById('age').value,
        weight: document.getElementById('weight').value,
        allergies: document.getElementById('allergies').value,
        medicalHistory: document.getElementById('medicalHistory').value,
        dietPlan: document.getElementById('dietPlan').value,
        vaccinationReminder: document.getElementById('vaccinationReminder').value,
        medicalHistoryReminder: document.getElementById('medicalHistoryReminder').value,
        dietReminder: document.getElementById('dietReminder').value,
        groomingReminder: document.getElementById('groomingReminder').value,
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
    savedProfilesList.innerHTML = '';

    savedProfiles.forEach((profile, index) => {
        const profileCard = document.createElement('li');
        profileCard.classList.add('profile-card');
        profileCard.innerHTML = `
            <div class="profile-card-header">
                <h4>${profile.petName}</h4>
                <button class="delete-btn" data-index="${index}">Delete</button>
            </div>
            <div class="profile-card-body">
                <p><strong>Breed:</strong> ${profile.breed}</p>
                <p><strong>Age:</strong> ${profile.age}</p>
                <p><strong>Weight:</strong> ${profile.weight}</p>
                <p><strong>Allergies:</strong> ${profile.allergies}</p>
                <p><strong>Medical History:</strong> ${profile.medicalHistory}</p>
                <p><strong>Diet Plan:</strong> ${profile.dietPlan}</p>
                <p><strong>Vaccination Reminder:</strong> ${profile.vaccinationReminder}</p>
                <p><strong>Medical History Reminder:</strong> ${profile.medicalHistoryReminder}</p>
                <p><strong>Food Renewal Reminder:</strong> ${profile.dietReminder}</p>
                <p><strong>Grooming Reminder:</strong> ${profile.groomingReminder}</p>
                ${profile.petPhoto ? `<img src="${URL.createObjectURL(profile.petPhoto)}" alt="Pet Photo" class="pet-photo">` : ''}
                <button class="print-btn" onclick="printProfile(${index})">Print</button>
            </div>
        `;
        savedProfilesList.appendChild(profileCard);
    });

    // Delete pet profile
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', function () {
            const index = button.getAttribute('data-index');
            deletePetProfile(index);
        });
    });
}

// Delete Pet Profile
function deletePetProfile(index) {
    let savedProfiles = JSON.parse(localStorage.getItem('petProfiles')) || [];
    savedProfiles.splice(index, 1);
    localStorage.setItem('petProfiles', JSON.stringify(savedProfiles));
    loadSavedPetProfile();
}

// Print Pet Profile
function printProfile(index) {
    const savedProfiles = JSON.parse(localStorage.getItem('petProfiles')) || [];
    const profile = savedProfiles[index];
    const printWindow = window.open('', '', 'width=600,height=800');
    printWindow.document.write(`
        <h1>Pet Profile</h1>
        <p><strong>Name:</strong> ${profile.petName}</p>
        <p><strong>Breed:</strong> ${profile.breed}</p>
        <p><strong>Age:</strong> ${profile.age}</p>
        <p><strong>Weight:</strong> ${profile.weight}</p>
        <p><strong>Allergies:</strong> ${profile.allergies}</p>
        <p><strong>Medical History:</strong> ${profile.medicalHistory}</p>
        <p><strong>Diet Plan:</strong> ${profile.dietPlan}</p>
        <p><strong>Vaccination Reminder:</strong> ${profile.vaccinationReminder}</p>
        <p><strong>Medical History Reminder:</strong> ${profile.medicalHistoryReminder}</p>
        <p><strong>Food Renewal Reminder:</strong> ${profile.dietReminder}</p>
        <p><strong>Grooming Reminder:</strong> ${profile.groomingReminder}</p>
        ${profile.petPhoto ? `<img src="${URL.createObjectURL(profile.petPhoto)}" alt="Pet Photo">` : ''}
    `);
    printWindow.document.close();
    printWindow.print();
}
