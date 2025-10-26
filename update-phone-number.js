const XLSX = require('xlsx');
const path = require('path');

// Read the existing Excel file
const filePath = path.join(__dirname, 'birthdays.xlsx');
console.log('Updating phone numbers to +919342931487...\n');

const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet);

// Update all phone numbers to the new number
const newPhone = '+919342931487';

const updatedData = data.map((record, index) => {
  console.log(`${index + 1}. ${record.Name}: ${record.Phone} → ${newPhone}`);
  
  return {
    Name: record.Name,
    Email: record.Email,
    Phone: newPhone,
    Birthday: record.Birthday,
    NotificationChannel: record.NotificationChannel || 'email'
  };
});

console.log('\n--- Creating backup ---');
const backupPath = path.join(__dirname, 'birthdays-backup-final.xlsx');
const fs = require('fs');
fs.copyFileSync(filePath, backupPath);
console.log(`Backup created: ${backupPath}`);

console.log('\n--- Writing updated data ---');

// Create new worksheet with updated data
const newWorksheet = XLSX.utils.json_to_sheet(updatedData);
const newWorkbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, 'Birthdays');

// Write back to file
XLSX.writeFile(newWorkbook, filePath);

console.log('\n✓ Successfully updated phone numbers in birthdays.xlsx');
console.log(`\nAll records now use: ${newPhone}`);
console.log('\nUpdated records:');
updatedData.forEach((record, index) => {
  console.log(`${index + 1}. ${record.Name} - ${record.Phone} [${record.NotificationChannel}]`);
});
