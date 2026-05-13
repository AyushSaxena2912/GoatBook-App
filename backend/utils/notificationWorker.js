const cron = require('node-cron');
const { Expo } = require('expo-server-sdk');
const prisma = require('../config/prisma');

const expo = new Expo();

/**
 * Notification Worker:
 * Runs every 1 minute across the existing backend process.
 * Picks up pending reminders and sends them via Expo Push.
 */
const setupNotificationWorker = () => {
  // Run every 1 minute: '*/1 * * * *'
  cron.schedule('*/1 * * * *', async () => {
    const startTime = new Date();
    console.log(`[Worker] Notification check started at ${startTime.toISOString()}`);
    
    try {
      const now = new Date();
      
      // 1. Fetch pending reminders due now or earlier
      const pendingReminders = await prisma.reminders.findMany({
        where: {
          status: 'PENDING',
          remind_at: { lte: now }
        },
        take: 50 // Process in batches
      });

      if (pendingReminders.length === 0) return;

      console.log(`[Worker] Found ${pendingReminders.length} reminders to process.`);

      for (const reminder of pendingReminders) {
        try {
          // 2. Fetch the user's push token
          const user = await prisma.users.findUnique({
            where: { id: reminder.user_id },
            select: { push_token: true }
          });

          if (!user || !user.push_token) {
            console.log(`[Worker] No push token for user ${reminder.user_id}, skipping.`);
            await prisma.reminders.update({
              where: { id: reminder.id },
              data: { status: 'NO_TOKEN' }
            });
            continue;
          }

          // 3. Validate Push Token
          if (!Expo.isExpoPushToken(user.push_token)) {
            console.log(`[Worker] Invalid token for user ${reminder.user_id}`);
            await prisma.reminders.update({
              where: { id: reminder.id },
              data: { status: 'INVALID_TOKEN' }
            });
            continue;
          }

          // 4. Construct Message
          const messages = [{
            to: user.push_token,
            sound: 'default',
            title: reminder.title,
            body: reminder.message,
            data: { 
              vaccineRecordId: reminder.vaccine_record_id,
              animalId: reminder.animal_id 
            },
          }];

          // 5. Send Notification
          const chunks = expo.chunkPushNotifications(messages);
          for (let chunk of chunks) {
            try {
              await expo.sendPushNotificationsAsync(chunk);
              console.log(`[Worker] Sent notification to user ${reminder.user_id}`);
              
              // Update status to SENT
              await prisma.reminders.update({
                where: { id: reminder.id },
                data: { status: 'SENT' }
              });
            } catch (error) {
              console.error('[Worker] Error sending chunk:', error);
              await prisma.reminders.update({
                where: { id: reminder.id },
                data: { status: 'FAILED' }
              });
            }
          }

        } catch (err) {
          console.error(`[Worker] Failed to process reminder ${reminder.id}:`, err);
        }
      }
    } catch (globalError) {
      console.error('[Worker] CRITICAL Global Error:', globalError);
    } finally {
      const endTime = new Date();
      const duration = (endTime - startTime) / 1000;
      console.log(`[Worker] Finished check in ${duration}s.`);
    }
  });

  console.log('[Worker] Background notification service started (1-min interval).');
};

module.exports = {
  setupNotificationWorker
};
