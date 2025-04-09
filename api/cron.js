// api/cron.js
import { checkAndSendReminders } from '../lib/reminders';

const AUTH_TOKEN = process.env.CRON_SECRET;

export default async function handler(req, res) {
  try {
    // Verify secret token
    const authHeader = req.headers.authorization || '';
    if (authHeader !== `Bearer ${AUTH_TOKEN}`) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Process reminders
    const result = await checkAndSendReminders();
    res.status(200).json({
      success: true,
      message: 'Reminders processed successfully',
      stats: result
    });
    
  } catch (error) {
    console.error('Cron job failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
