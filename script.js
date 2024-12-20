// Add event listener to form submission
document.getElementById('dietForm').addEventListener('submit', function(event) {
    event.preventDefault();
    
    // Get form values
    const petName = document.getElementById('petName').value;
    const breed = document.getElementById('breed').value;
    const age = document.getElementById('age').value;
    const weight = document.getElementById('weight').value;
    const allergies = document.getElementById('allergies').value;
    const medicalHistory = document.getElementById('medicalHistory').value;
    const dietPlan = document.getElementById('dietPlan').value;

    // Store pet data in an object
    const petData = {
        name: petName,
        breed: breed,
        age: age,
        weight: weight,
        allergies: allergies,
        medicalHistory: medicalHistory,
        dietPlan: dietPlan
    };

    // Get existing pets data from LocalStorage, if any
    let pets = localStorage.getItem('pets');
    pets = pets ? JSON.parse(pets) : [];

    // Add the new pet data to the array
    pets.push(petData);

    // Save the updated pets array back to LocalStorage
    localStorage.setItem('pets', JSON.stringify(pets));

    // Display the updated pet list
    displayPets();
});

// Display saved pet profiles and diet plans
function displayPets() {
    const petList = document.getElementById('dietList');
    petList.innerHTML = '';  // Clear existing list

    // Retrieve pets data from LocalStorage
    let pets = localStorage.getItem('pets');
    pets = pets ? JSON.parse(pets) : [];

    // Create list items for each saved pet
    pets.forEach(pet => {
        const li = document.createElement('li');
        li.innerHTML = `
            <strong>${pet.name}</strong> (${pet.breed}) - Age: ${pet.age} years, Weight: ${pet.weight}kg<br>
            <em>Allergies:</em> ${pet.allergies || 'None'}<br>
            <em>Medical History:</em> ${pet.medicalHistory || 'None'}<br>
            <strong>Diet Plan:</strong> ${pet.dietPlan}
        `;
        petList.appendChild(li);
    });
}

// Display pets when the page loads
document.addEventListener('DOMContentLoaded', displayPets);
