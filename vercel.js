{
  "crons": [
    {
      "path": "/api/send-reminders",
      "schedule": "0 6,14 * * *", // 9AM & 5PM local time (UTC+3)
      "headers": {
        "Authorization": "Bearer ${process.env.CRON_SECRET}"
      }
    }
  ]
}
