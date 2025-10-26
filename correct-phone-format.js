const XLSX = require('xlsx');
const path = require('path');

// Read the existing Excel file
const filePath = path.join(__dirname, 'birthdays.xlsx');
console.log('Correcting phone numbers to proper E.164 format...\n');

const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet);

// Correct the phone numbers - should be +919342943148 (your actual number)
const correctedData = data.map((record, index) => {
  // Use your actual phone number in proper E.164 format
  const correctPhone = '+919342943148';
  
  console.log(`${index + 1}. ${record.Name}: ${record.Phone} → ${correctPhone}`);
  
  return {
    Name: record.Name,
    Email: record.Email,
    Phone: correctPhone,
    Birthday: record.Birthday,
    NotificationChannel: record.NotificationChannel || 'email'
  };
});

console.log('\n--- Writing corrected data ---');

// Create new worksheet with corrected data
const newWorksheet = XLSX.utils.json_to_sheet(correctedData);
const newWorkbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, 'Birthdays');

// Write back to file
XLSX.writeFile(newWorkbook, filePath);

console.log('\n✓ Successfully corrected phone numbers in birthdays.xlsx');
console.log('\nAll records now use: +919342943148 (E.164 format)');
console.log('\nReady to test WhatsApp notifications!');
