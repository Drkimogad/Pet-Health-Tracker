// Get elements
const signupForm = document.getElementById('signupForm');
const loginForm = document.getElementById('loginFormElement');
const dietForm = document.getElementById('dietForm');
const authSection = document.getElementById('authSection');
const mainContent = document.getElementById('mainContent');
const logoutButton = document.getElementById('logoutButton');

// Fake storage for demo purposes (you can replace with real authentication)
let users = [];

function displayMainContent() {
    authSection.style.display = 'none';
    mainContent.style.display = 'block';
    logoutButton.style.display = 'inline';
}

function hideMainContent() {
    authSection.style.display = 'block';
    mainContent.style.display = 'none';
    logoutButton.style.display = 'none';
}

// Sign-up logic
signupForm.addEventListener('submit', function (event) {
    event.preventDefault();
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;

    // Store the new user (in a real app, you'd send this to a server)
    users.push({ email, password });

    alert('Sign-up successful!');
    displayMainContent();
});

// Login logic
loginForm.addEventListener('submit', function (event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    // Check if user exists
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
        alert('Login successful!');
        displayMainContent();
    } else {
        alert('Invalid credentials!');
    }
});

// Logout logic
logoutButton.addEventListener('click', function () {
    hideMainContent();
});
