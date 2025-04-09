// api/cron.js
import { checkAndSendReminders } from '../lib/reminders';

const AUTH_TOKEN = process.env.CRON_SECRET;

export default async function handler(req, res) {
  // Verify cron secret
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Your reminder logic here
  try {
    const results = await checkAndSendReminders();
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
// In your cron handler
console.log('Current server time:', new Date().toString());
// Should show Nairobi time if TZ is set
