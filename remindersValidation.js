// ======== VALIDATION CONFIGURATION ========
const REMINDER_THRESHOLD_DAYS = 5; // Or any other number of days you prefer

const ALLOWED_REMINDER_TYPES = ['vaccination', 'checkup', 'grooming'];
const REMINDER_TYPE_MAP = {
  vaccinationDue: 'vaccination',
  checkupDue: 'checkup',
  groomingDue: 'grooming'
};

//Reminders validation function// 
function validateReminder(reminderData) {
  const standardizedType = REMINDER_TYPE_MAP[reminderData.type];
  if (!ALLOWED_REMINDER_TYPES.includes(standardizedType)) {
    throw new Error(`Invalid reminder type: ${reminderData.type}`);
  }
  
  const dateValue = new Date(reminderData.dueDate);
  if (isNaN(dateValue.getTime())) {
    throw new Error('Invalid date format for reminder');
  }
  
  return { type: standardizedType, dueDate: dateValue };
}
// ReminderFormating function//
function formatReminder(dateTimeString) {
  if (!dateTimeString) return 'N/A';
  const date = new Date(dateTimeString);
  return date.toLocaleString();
}

  try {
    const reminders = {
      vaccinationsAndDewormingReminder: validateReminder({
        type: 'vaccinationsAndDewormingReminder',
        dueDate: document.getElementById('vaccinationsAndDewormingReminder').value
      }),
      medicalCheckupsReminder: validateReminder({
        type: 'medicalCheckupsReminder',
        dueDate: document.getElementById('medicalCheckupsReminder').value
      }),
      groomingReminder: validateReminder({
        type: 'groomingReminder',
        dueDate: document.getElementById('groomingReminder').value
      })
    };
  } catch (error) {
    alert(`Validation Error: ${error.message}`);
    return;
  }
