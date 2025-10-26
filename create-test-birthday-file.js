const XLSX = require('xlsx');
const path = require('path');

// Get today's date
const today = new Date();
const month = String(today.getMonth() + 1).padStart(2, '0');
const day = String(today.getDate()).padStart(2, '0');
const year = today.getFullYear();
const todayFormatted = `${month}/${day}/${year}`;

console.log(`Creating test birthday file for today: ${todayFormatted}`);

// Create test records with today's birthday
const testData = [
  {
    Name: 'Test User (Email Only)',
    Email: 'karticbe1983@gmail.com',
    Phone: '',
    Birthday: todayFormatted,
    NotificationChannel: 'email'
  },
  {
    Name: 'Test User (WhatsApp Only)',
    Email: 'karticbe1983@gmail.com',
    Phone: '+919342943148',
    Birthday: todayFormatted,
    NotificationChannel: 'whatsapp'
  },
  {
    Name: 'Test User (Both Channels)',
    Email: 'karticbe1983@gmail.com',
    Phone: '+919342943148',
    Birthday: todayFormatted,
    NotificationChannel: 'both'
  }
];

console.log('\nTest records:');
testData.forEach((record, index) => {
  console.log(`${index + 1}. ${record.Name} - Channel: ${record.NotificationChannel}`);
});

// Create worksheet
const worksheet = XLSX.utils.json_to_sheet(testData);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, 'Birthdays');

// Write to file
const filePath = path.join(__dirname, 'test-birthdays-today.xlsx');
XLSX.writeFile(workbook, filePath);

console.log(`\nSuccessfully created: ${filePath}`);
console.log(`Total test records: ${testData.length}`);
