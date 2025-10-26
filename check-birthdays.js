const XLSX = require('xlsx');
const path = require('path');

// Read the Excel file
const filePath = path.join(__dirname, 'birthdays.xlsx');
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet);

console.log('\n=== Birthday Records ===\n');
console.log(`Total records: ${data.length}\n`);

// Get today's date
const today = new Date();
const todayMonth = today.getMonth() + 1; // 0-indexed
const todayDay = today.getDate();

console.log(`Today's date: ${todayMonth}/${todayDay}/${today.getFullYear()}\n`);
console.log('Records:\n');

let birthdaysToday = [];

data.forEach((record, index) => {
  const birthday = record.Birthday;
  const name = record.Name;
  const email = record.Email;
  const phone = record.Phone || 'N/A';
  const channel = record.NotificationChannel || 'email';
  
  console.log(`${index + 1}. ${name}`);
  console.log(`   Email: ${email}`);
  console.log(`   Phone: ${phone}`);
  console.log(`   Birthday: ${birthday}`);
  console.log(`   Channel: ${channel}`);
  
  // Parse birthday
  if (birthday) {
    const parts = birthday.toString().split('/');
    if (parts.length >= 2) {
      const month = parseInt(parts[0]);
      const day = parseInt(parts[1]);
      
      if (month === todayMonth && day === todayDay) {
        console.log(`   *** BIRTHDAY TODAY! ***`);
        birthdaysToday.push({ name, email, phone, channel });
      }
    }
  }
  console.log('');
});

console.log('\n=== Summary ===\n');
console.log(`Birthdays today: ${birthdaysToday.length}\n`);

if (birthdaysToday.length > 0) {
  console.log('People with birthdays today:');
  birthdaysToday.forEach(person => {
    console.log(`  - ${person.name} (${person.email}, ${person.phone}) [${person.channel}]`);
  });
} else {
  console.log('No birthdays today.');
}
