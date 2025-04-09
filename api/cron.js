import { checkAndSendReminders } from '../lib/reminders'; // Your custom logic

export async function GET(request) {
  const authHeader = request.headers.get('authorization');
  
  // Verify cron secret (security)
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    await checkAndSendReminders(); // Your reminder logic
    return new Response('Reminders processed', { status: 200 });
  } catch (error) {
    console.error('Cron job failed:', error);
    return new Response('Server error', { status: 500 });
  }
}
