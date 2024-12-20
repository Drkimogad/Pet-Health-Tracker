document.getElementById('dietForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const petName = document.getElementById('petName').value.trim();
    const dietPlan = document.getElementById('dietPlan').value.trim();

    if (!petName || !dietPlan) {
        alert('Please fill out all fields.');
        return;
    }

    const dietData = { name: petName, diet: dietPlan };

    let diets = localStorage.getItem('diets');
    diets = diets ? JSON.parse(diets) : [];

    if (diets.some(diet => diet.name === petName)) {
        alert('A diet plan for this pet already exists.');
        return;
    }

    diets.push(dietData);
    localStorage.setItem('diets', JSON.stringify(diets));

    document.getElementById('dietForm').reset();
    displayDiets();
});

function displayDiets() {
    const dietList = document.getElementById('dietList');
    dietList.innerHTML = '';
    let diets = localStorage.getItem('diets');
    diets = diets ? JSON.parse(diets) : [];
    diets.forEach((diet, index) => {
        const li = document.createElement('li');
        li.textContent = `${diet.name}'s Diet: ${diet.diet}`;
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => {
            diets.splice(index, 1);
            localStorage.setItem('diets', JSON.stringify(diets));
            displayDiets();
        });
        li.appendChild(deleteBtn);
        dietList.appendChild(li);
    });
}

document.addEventListener('DOMContentLoaded', displayDiets);
