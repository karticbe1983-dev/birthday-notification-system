const XLSX = require('xlsx');
const path = require('path');

// Read the existing Excel file
const filePath = path.join(__dirname, 'birthdays.xlsx');
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet);

// Get today's date
const today = new Date();
const month = String(today.getMonth() + 1).padStart(2, '0');
const day = String(today.getDate()).padStart(2, '0');
const year = today.getFullYear();
const todayFormatted = `${month}/${day}/${year}`;

console.log(`Adding test birthday for today: ${todayFormatted}`);

// Add a test record with today's birthday
const testRecord = {
  Name: 'Test User Today',
  Email: 'karticbe1983@gmail.com', // Using your email so you receive the notification
  Phone: '+919342943148', // Your phone in E.164 format
  Birthday: todayFormatted,
  NotificationChannel: 'both' // Will send both email and WhatsApp
};

data.push(testRecord);

console.log('\nAdded test record:');
console.log(JSON.stringify(testRecord, null, 2));

// Create new worksheet with updated data
const newWorksheet = XLSX.utils.json_to_sheet(data);
const newWorkbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, 'Birthdays');

// Write back to file
XLSX.writeFile(newWorkbook, filePath);

console.log('\nSuccessfully updated birthdays.xlsx');
console.log(`Total records now: ${data.length}`);
