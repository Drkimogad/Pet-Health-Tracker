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
        // *** Added ***
        vaccinationReminderDate: new Date(document.getElementById('vaccinationReminder').value),
        medicalHistoryReminder: document.getElementById('medicalHistoryReminder').value,
        // *** Added ***
        medicalHistoryReminderDate: new Date(document.getElementById('medicalHistoryReminder').value),
        dietReminder: document.getElementById('dietReminder').value,
        // *** Added ***
        dietReminderDate: new Date(document.getElementById('dietReminder').value),
        petPhoto: document.getElementById('petPhoto').files[0] ? URL.createObjectURL(document.getElementById('petPhoto').files[0]) : ''
    };

    // Save pet profile in localStorage
    let savedProfiles = JSON.parse(localStorage.getItem('petProfiles')) || [];
    savedProfiles.push(petProfile);
    localStorage.setItem('petProfiles', JSON.stringify(savedProfiles));

    // Alert and reload saved data
    alert('Pet profile saved!');
    loadSavedPetProfile();
});

// Load Saved Pet Profile
function loadSavedPetProfile() {
    const savedProfiles = JSON.parse(localStorage.getItem('petProfiles'));
    const savedProfilesList = document.getElementById('savedProfilesList');
    savedProfilesList.innerHTML = ''; // Clear the list before adding new profiles

    if (savedProfiles) {
        savedProfiles.forEach((profile, index) => {
            const petCard = document.createElement('li');
            petCard.classList.add('pet-card');

            // *** Added ***
            // Check if reminders are overdue
            const now = new Date();
            const vaccinationOverdue = new Date(profile.vaccinationReminderDate) < now;
            const medicalHistoryOverdue = new Date(profile.medicalHistoryReminderDate) < now;
            const dietOverdue = new Date(profile.dietReminderDate) < now;

            petCard.innerHTML = `
                <div class="pet-card-content">
                    <h4>${profile.petName}</h4>
                    <p>Breed: ${profile.breed}</p>
                    <p>Age: ${profile.age}</p>
                    <p>Weight: ${profile.weight}</p>
                    <p>Allergies: ${profile.allergies}</p>
                    <p>Medical History: ${profile.medicalHistory}</p>
                    <p>Diet Plan: ${profile.dietPlan}</p>
                    <p>
                        Vaccination Reminder: ${profile.vaccinationReminder} 
                        ${vaccinationOverdue ? '<span style="color: red; font-weight: bold;">❗</span>' : ''}
                    </p>
                    <p>
                        Medical History Reminder: ${profile.medicalHistoryReminder} 
                        ${medicalHistoryOverdue ? '<span style="color: red; font-weight: bold;">❗</span>' : ''}
                    </p>
                    <p>
                        Diet Reminder: ${profile.dietReminder} 
                        ${dietOverdue ? '<span style="color: red; font-weight: bold;">❗</span>' : ''}
                    </p>
                    <img src="${profile.petPhoto}" alt="Pet Photo" class="pet-photo"/>
                </div>
                <div class="pet-card-actions">
                    <button class="delete-btn" onclick="deletePetProfile(${index})">Delete</button>
                    <button class="print-btn" onclick="printPetProfile(${index})">Print</button>
                </div>
            `;
            savedProfilesList.appendChild(petCard);
        });
    }
}

// Delete Pet Profile
function deletePetProfile(index) {
    let savedProfiles = JSON.parse(localStorage.getItem('petProfiles'));
    savedProfiles.splice(index, 1); // Remove the profile at the given index
    localStorage.setItem('petProfiles', JSON.stringify(savedProfiles));
    loadSavedPetProfile(); // Reload the profiles after deletion
}

// Print Pet Profile
function printPetProfile(index) {
    const savedProfiles = JSON.parse(localStorage.getItem('petProfiles'));
    const profile = savedProfiles[index];

    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Print Pet Profile</title></head><body>');
    printWindow.document.write(`<h1>${profile.petName}</h1>`);
    printWindow.document.write(`<img src="${profile.petPhoto}" alt="Pet Photo" style="width: 300px; height: auto;" />`);
    printWindow.document.write(`<p>Breed: ${profile.breed}</p>`);
    printWindow.document.write(`<p>Age: ${profile.age}</p>`);
    printWindow.document.write(`<p>Weight: ${profile.weight}</p>`);
    printWindow.document.write(`<p>Allergies: ${profile.allergies}</p>`);
    printWindow.document.write(`<p>Medical History: ${profile.medicalHistory}</p>`);
    printWindow.document.write(`<p>Diet Plan: ${profile.dietPlan}</p>`);
    printWindow.document.write(`<p>Vaccination Reminder: ${profile.vaccinationReminder}</p>`);
    printWindow.document.write(`<p>Medical History Reminder: ${profile.medicalHistoryReminder}</p>`);
    printWindow.document.write(`<p>Diet Reminder: ${profile.dietReminder}</p>`);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
}
