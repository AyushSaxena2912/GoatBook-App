const prisma = require('../config/prisma');
const { v4: uuidv4 } = require('uuid');

/**
 * Schedules multiple vaccination reminders for a given record.
 * Intervals: 10, 7, 5, 3, 2, 0 days before due date.
 * Plus a 4-minute test reminder for validation.
 */
const scheduleVaccinationReminders = async (vaccinationRecords) => {
  try {
    if (!Array.isArray(vaccinationRecords)) {
      vaccinationRecords = [vaccinationRecords];
    }

    const reminderEntries = [];
    const now = new Date();

    for (const record of vaccinationRecords) {
      if (!record.next_due_date) continue;

      const dueDate = new Date(record.next_due_date);
      const animalTag = record.animal_tag || 'Animal';
      const vaccineName = record.vaccine_name || 'Vaccine';

      // 1. Standard Reminders (10, 7, 5, 3, 2, 0 days before)
      const daysBefore = [10, 7, 5, 3, 2, 0];
      
      daysBefore.forEach(days => {
        const remindAt = new Date(dueDate);
        remindAt.setDate(remindAt.getDate() - days);
        remindAt.setHours(9, 0, 0, 0); // Morning reminder at 9 AM

        // Only schedule if the reminder date is in the future
        if (remindAt > now) {
          reminderEntries.push({
            id: uuidv4(),
            user_id: record.created_by_user_id,
            animal_id: record.animal_id,
            vaccine_record_id: record.id,
            title: `Vaccination Alert: ${vaccineName}`,
            message: days === 0 
              ? `Today is the due date for ${vaccineName} for Tag ID: ${animalTag}.`
              : `${days} days remaining for ${vaccineName} for Tag ID: ${animalTag}. Due on ${dueDate.toLocaleDateString()}.`,
            remind_at: remindAt,
            status: 'PENDING'
          });
        }
      });

      // 2. TEST REMINDER (4 Minutes from now)
      const testRemindAt = new Date(now.getTime() + 4 * 60000);
      reminderEntries.push({
        id: uuidv4(),
        user_id: record.created_by_user_id,
        animal_id: record.animal_id,
        vaccine_record_id: record.id,
        title: `Test Alert: ${vaccineName}`,
        message: `This is your 4-minute test reminder for ${vaccineName} (Tag: ${animalTag}). System is working!`,
        remind_at: testRemindAt,
        status: 'PENDING'
      });
    }

    if (reminderEntries.length > 0) {
      await prisma.reminders.createMany({
        data: reminderEntries
      });
      console.log(`[Reminders] Scheduled ${reminderEntries.length} notifications.`);
    }
  } catch (error) {
    console.error('Error scheduling reminders:', error);
  }
};

module.exports = {
  scheduleVaccinationReminders
};
