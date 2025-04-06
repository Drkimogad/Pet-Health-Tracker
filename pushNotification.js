    const vapidKey = 'BCGyRZVIxHmasEQWfF5iCzxe1gLyIppQynZlyPm_BXPHWnv4xzxZwEjo9PuJbbk5Gi8ywLVXSxAYxcgt2QsmHVE'; 

    function subscribeUserToPushNotifications(registration) {
        registration.pushManager.getSubscription()
            .then(subscription => {
                if (subscription) {
                    console.log('Already subscribed:', subscription);
                    sendSubscriptionToServer(subscription);
                } else {
                    registration.pushManager.subscribe({
                        userVisibleOnly: true, 
                        applicationServerKey: urlBase64ToUint8Array(vapidKey),
                    })
                    .then(newSubscription => {
                        console.log('Subscribed to push notifications:', newSubscription);
                        sendSubscriptionToServer(newSubscription);
                    })
                    .catch(error => {
                        console.error('Push subscription failed:', error);
                    });
                }
            })
            .catch(error => console.error('Subscription check failed:', error));
    }

    function sendSubscriptionToServer(subscription) {
        fetch('pet-health-tracker-sand.vercel.app/api/save-subscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subscription }),
        })
        .then(response => response.json())
        .then(data => console.log('Subscription sent:', data))
        .catch(error => console.error('Error sending subscription:', error));
    }

    function urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/\-/g, '+').replace(/\_/g, '/');
        const rawData = atob(base64);
        return new Uint8Array([...rawData].map(char => char.charCodeAt(0)));
    }

