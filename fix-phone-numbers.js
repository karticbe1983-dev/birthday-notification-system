const XLSX = require('xlsx');
const path = require('path');

// Read the existing Excel file
const filePath = path.join(__dirname, 'birthdays.xlsx');
console.log('Reading birthdays.xlsx...\n');

const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet);

console.log('Current phone numbers:');
data.forEach((record, index) => {
  console.log(`${index + 1}. ${record.Name}: ${record.Phone}`);
});

console.log('\n--- Fixing phone numbers to E.164 format ---\n');

// Fix the phone numbers - convert to E.164 format
// Using Indian country code +91 and your actual number
const fixedData = data.map((record, index) => {
  let phone = record.Phone;
  
  // If phone is just digits without country code, add +91
  if (phone && typeof phone === 'number') {
    phone = phone.toString();
  }
  
  if (phone && !phone.startsWith('+')) {
    // Remove any leading zeros
    phone = phone.replace(/^0+/, '');
    // Add Indian country code
    phone = '+91' + phone;
  }
  
  console.log(`${index + 1}. ${record.Name}: ${record.Phone} → ${phone}`);
  
  return {
    Name: record.Name,
    Email: record.Email,
    Phone: phone,
    Birthday: record.Birthday,
    NotificationChannel: record.NotificationChannel || 'email'
  };
});

console.log('\n--- Creating backup ---');
const backupPath = path.join(__dirname, 'birthdays-backup-phones.xlsx');
const fs = require('fs');
fs.copyFileSync(filePath, backupPath);
console.log(`Backup created: ${backupPath}`);

console.log('\n--- Writing fixed data ---');

// Create new worksheet with fixed data
const newWorksheet = XLSX.utils.json_to_sheet(fixedData);
const newWorkbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, 'Birthdays');

// Write back to file
XLSX.writeFile(newWorkbook, filePath);

console.log('\n✓ Successfully fixed phone numbers in birthdays.xlsx');
console.log('\nFixed data:');
fixedData.forEach((record, index) => {
  console.log(`${index + 1}. ${record.Name}`);
  console.log(`   Email: ${record.Email}`);
  console.log(`   Phone: ${record.Phone}`);
  console.log(`   Birthday: ${record.Birthday}`);
  console.log(`   Channel: ${record.NotificationChannel}`);
  console.log('');
});

console.log('Note: All phone numbers now in E.164 format (+919342943148)');
console.log('You can update individual numbers in Excel if needed.');
