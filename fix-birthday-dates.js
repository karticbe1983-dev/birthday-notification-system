const XLSX = require('xlsx');
const path = require('path');

// Read the existing Excel file
const filePath = path.join(__dirname, 'birthdays.xlsx');
console.log('Reading birthdays.xlsx...\n');

const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet);

console.log('Current data:');
data.forEach((record, index) => {
  console.log(`${index + 1}. ${record.Name} - Birthday: ${record.Birthday}`);
});

console.log('\n--- Fixing date formats ---\n');

// Fix the dates - convert Excel serial numbers to MM/DD/YYYY format
const fixedData = data.map((record, index) => {
  let birthday = record.Birthday;
  
  // If birthday is a number (Excel serial date), convert it
  if (typeof birthday === 'number') {
    // Excel serial date starts from 1900-01-01
    const excelEpoch = new Date(1900, 0, 1);
    const date = new Date(excelEpoch.getTime() + (birthday - 2) * 24 * 60 * 60 * 1000);
    
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    
    birthday = `${month}/${day}/${year}`;
    console.log(`${index + 1}. ${record.Name}: ${record.Birthday} → ${birthday}`);
  } else {
    console.log(`${index + 1}. ${record.Name}: ${birthday} (already formatted)`);
  }
  
  return {
    Name: record.Name,
    Email: record.Email,
    Phone: record.Phone,
    Birthday: birthday,
    NotificationChannel: record.NotificationChannel || 'email'
  };
});

console.log('\n--- Creating backup ---');
const backupPath = path.join(__dirname, 'birthdays-backup.xlsx');
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

console.log('\n✓ Successfully fixed birthdays.xlsx');
console.log('\nFixed data:');
fixedData.forEach((record, index) => {
  console.log(`${index + 1}. ${record.Name}`);
  console.log(`   Email: ${record.Email}`);
  console.log(`   Phone: ${record.Phone}`);
  console.log(`   Birthday: ${record.Birthday}`);
  console.log(`   Channel: ${record.NotificationChannel}`);
  console.log('');
});
