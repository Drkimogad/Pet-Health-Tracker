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
    };

    // UPDATED SECTION START
    let petProfiles = JSON.parse(localStorage.getItem('petProfiles')) || [];
    petProfiles.push(petProfile);
    localStorage.setItem('petProfiles', JSON.stringify(petProfiles));
    updateSavedProfilesList();
    // UPDATED SECTION END

    alert('Pet profile saved!');
});

// Load Saved Pet Profiles
function loadSavedPetProfiles() {
    // UPDATED SECTION START
    const petProfiles = JSON.parse(localStorage.getItem('petProfiles')) || [];
    const savedProfilesList = document.getElementById('savedProfilesList');
    savedProfilesList.innerHTML = '';

    petProfiles.forEach((profile, index) => {
        const profileItem = document.createElement('li');
        profileItem.textContent = `Pet Name: ${profile.petName}, Breed: ${profile.breed}`;
        profileItem.addEventListener('click', () => {
            loadPetProfile(profile);
        });
        savedProfilesList.appendChild(profileItem);
    });
    // UPDATED SECTION END
}

// Populate Form with Selected Profile
function loadPetProfile(profile) {
    document.getElementById('petName').value = profile.petName;
    document.getElementById('breed').value = profile.breed;
    document.getElementById('age').value = profile.age;
    document.getElementById('weight').value = profile.weight;
    document.getElementById('allergies').value = profile.allergies;
    document.getElementById('medicalHistory').value = profile.medicalHistory;
    document.getElementById('dietPlan').value = profile.dietPlan;
}

// UPDATED SECTION START
function updateSavedProfilesList() {
    loadSavedPetProfiles();
}
// UPDATED SECTION END

// Initial load
loadSavedPetProfiles();
