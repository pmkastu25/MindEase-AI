const cron = require('node-cron');
const User = require('../models/User');
const emailService = require('../services/emailService');

function startDailyEngagementCron() {
  // Schedule a task to run every minute to support per-user custom reminder times
  cron.schedule('* * * * *', async () => {
    const now = new Date();
    // Get current UTC time formatted as HH:MM
    const currentHour = String(now.getUTCHours()).padStart(2, '0');
    const currentMinute = String(now.getUTCMinutes()).padStart(2, '0');
    const currentTimeStr = `${currentHour}:${currentMinute}`;

    try {
      // Fetch subscribed users whose reminder time matches the current minute
      const users = await User.find({
        emailNotifications: { $ne: false },
        reminderTime: currentTimeStr
      });

      if (users.length > 0) {
        console.log(`[${currentTimeStr}] Found ${users.length} users to send daily engagement emails.`);
        for (let user of users) {
          // Send asynchronously
          emailService.sendDailyEngagementEmail(user.email, user.name);
        }
      }
    } catch (error) {
      console.error('Error running daily engagement cron job:', error);
    }
  });

  console.log('Dynamic per-user daily engagement cron job initialized.');
}

module.exports = {
  startDailyEngagementCron
};
