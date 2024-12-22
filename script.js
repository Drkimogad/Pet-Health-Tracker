// Function to handle user login
function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;
    // Implement logic for user login (mocked for this example)
    if (email && password) {
        document.getElementById("authSection").style.display = "none";
        document.getElementById("mainContent").style.display = "block";
    }
}

// Function to handle user sign up
function handleSignUp(event) {
    event.preventDefault();
    const email = document.getElementById("signUpEmail").value;
    const password = document.getElementById("signUpPassword").value;
    // Implement sign-up logic (mocked for this example)
    if (email && password) {
        alert("Sign up successful! Please log in.");
        document.getElementById("signUpForm").style.display = "none";
        document.getElementById("loginForm").style.display = "block";
    }
}

// Function to save and display pet profiles
function loadSavedPetProfiles() {
    const savedProfiles = JSON.parse(localStorage.getItem('petProfiles')) || [];
    const savedProfilesList = document.getElementById('savedProfilesList');
    savedProfilesList.innerHTML = '';

    savedProfiles.forEach((profile, index) => {
        const petCard = document.createElement('div');
        petCard.classList.add('pet-card');
        
        petCard.innerHTML = `
            <div class="delete-btn" onclick="deletePetProfile(${index})">X</div>
            <h4>Pet Name: ${profile.petName}</h4>
            <p>Breed: ${profile.breed}</p>
            <p>Age: ${profile.age}</p>
            <p>Weight: ${profile.weight}</p>
            <p>Allergies: ${profile.allergies}</p>
            <p>Medical History: ${profile.medicalHistory}</p>
            <p>Diet Plan: ${profile.dietPlan}</p>
            <button class="print-btn" onclick="printProfile(${index})">Print</button>
            <img src="${profile.petPhoto}" alt="Pet Photo" style="width: 100px; height: 100px; margin-top: 10px;">
        `;
        
        savedProfilesList.appendChild(petCard);
    });
}

// Function to delete a pet profile
function deletePetProfile(index) {
    const savedProfiles = JSON.parse(localStorage.getItem('petProfiles')) || [];
    savedProfiles.splice(index, 1);
    localStorage.setItem('petProfiles', JSON.stringify(savedProfiles));
    loadSavedPetProfiles();  // Reload profiles after deletion
}

// Function to print pet profile
function printProfile(index) {
    const savedProfiles = JSON.parse(localStorage.getItem('petProfiles')) || [];
    const profile = savedProfiles[index];

    const printWindow = window.open('', '', 'width=600,height=400');
    printWindow.document.write(`
        <h2>Pet Profile - ${profile.petName}</h2>
        <p>Breed: ${profile.breed}</p>
        <p>Age: ${profile.age}</p>
        <p>Weight: ${profile.weight}</p>
        <p>Allergies: ${profile.allergies}</p>
        <p>Medical History: ${profile.medicalHistory}</p>
        <p>Diet Plan: ${profile.dietPlan}</p>
        <img src="${profile.petPhoto}" alt="Pet Photo" style="width: 100px; height: 100px;">
    `);
    printWindow.document.write('<button onclick="window.print()">Print this page</button>');
    printWindow.document.close();
}

// On page load, load saved pet profiles
window.onload = function() {
    loadSavedPetProfiles();

    document.getElementById("login").addEventListener("submit", handleLogin);
    document.getElementById("signUp").addEventListener("submit", handleSignUp);
};
