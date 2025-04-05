// Firebase service worker

// Make sure you have included the Firebase compat versions before this script:

// To avoid using a bundler and resolve specifier relative path replace all Firebase imports with these //

<script type="module" src="https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js"></script>

<script type="module" src="https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js"></script>

<script type="module" src="https://www.gstatic.com/firebasejs/9.6.1/firebase-auth-compat.js"></script>

<script type="module" src="https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore-compat.js"></script>

/////////////////////////////////////////////////////////////////////////////////////////////////

// Firebase initialization (if not already initialized globally)

if (!firebase.apps.length) {

  firebase.initializeApp({

    apiKey: "AIzaSyB42agDYdC2-LF81f0YurmwiDmXptTpMVw",

    authDomain: "swiftreach2025.firebaseapp.com",

    projectId: "swiftreach2025",

    storageBucket: "swiftreach2025.firebasestorage.app",

    messagingSenderId: "540185558422",

    appId: "1:540185558422:web:d560ac90eb1dff3e5071b7",

    measurementId: "G-SNBPRVBPNM"

  });

} else {

  firebase.app(); // Use the default app

}


// Firebase messaging setup

const messaging = firebase.messaging();



// Push notification event - Handles background messages

self.addEventListener('push', (event) => {

    let notificationData = { title: 'PetStudio Reminder', body: 'You have a new reminder!' };



    if (event.data) {

        try {

            const payload = event.data.json();

            if (payload.notification) {

                notificationData = {

                    title: payload.notification.title || 'PetStudio Reminder',

                    body: payload.notification.body || 'You have a new reminder!',

                };

            }

        } catch (error) {

            console.error('Error parsing push event data:', error);

        }

    }



    const options = {

        body: notificationData.body,

        icon: './icons/icon-192x192.png',

        badge: './icons/icon-192x192.png',

    };



    event.waitUntil(

        self.registration.showNotification(notificationData.title, options)

            .catch((error) => {

                console.error('Error showing notification:', error);

            })

    );

});



// Push notification click event - Handles user interaction

self.addEventListener('notificationclick', (event) => {

    event.notification.close(); // Close notification on click



    event.waitUntil(

        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {

            if (clientList.length > 0) {

                return clientList[0].focus();

            }

            return clients.openWindow('/signin'); // Redirect to signin if no window is open

        })

    );

});



// ----------------------

// UPDATED AUTH SECTION (ONLY THIS PART CHANGED)

// ----------------------



// Initialize auth

const auth = firebase.auth();



// Token sync endpoint handler

self.addEventListener('fetch', (event) => {

    if (event.request.url.includes('/token-sync')) {

        event.respondWith((async () => {

            try {

                const user = auth.currentUser;

                if (!user) {

                    return new Response(null, { status: 401 });

                }

                

                const token = await user.getIdToken();

                return new Response(JSON.stringify({ token }), {

                    headers: { 'Content-Type': 'application/json' },

                });

            } catch (error) {

                console.error('Token sync error:', error);

                return new Response(null, { status: 500 });

            }

        })());

    }

});



// Auth state listener

auth.onAuthStateChanged((user) => {

    console.log(user ? 'User authenticated' : 'User signed out');

});



// ----------------------

// SECTION 3: DATABASE (REMAINS EXACTLY THE SAME)

// ----------------------



// Sync pet data to Firestore

async function syncPetData() {

    const db = firebase.firestore();

    const petData = await getPetDataFromIndexedDB(); // Fetch data from IndexedDB



    petData.forEach((pet) => {

        db.collection('pets').doc(pet.id).set({

            name: pet.name,

            exerciseTime: pet.exerciseTime,

            caloriesBurned: pet.caloriesBurned,

        }).catch((error) => {

            console.error('Error syncing pet data to Firestore:', error);

        });

    });

}



// Placeholder function to simulate fetching pet data from IndexedDB

async function getPetDataFromIndexedDB() {

    return new Promise((resolve) => {

        setTimeout(() => {

            resolve([

                { id: 'pet1', name: 'Buddy', exerciseTime: 60, caloriesBurned: 200 },

                { id: 'pet2', name: 'Luna', exerciseTime: 45, caloriesBurned: 150 },

            ]);

        }, 1000); // Simulated data fetch delay

    });

}
