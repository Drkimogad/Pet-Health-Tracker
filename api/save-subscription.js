export async function saveSubscription(subscription) {
  try {
    await fetch('/api/save-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: getCurrentUserId(), // Implement your user ID logic
        subscription
      })
    });
  } catch (error) {
    console.error('Failed to save subscription:', error);
  }
}
