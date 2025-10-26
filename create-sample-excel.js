const XLSX = require('xlsx');

// Create sample birthday data
// Phone column: E.164 format (e.g., +14155552671 for US, +919876543210 for India)
// NotificationChannel: 'email', 'whatsapp', or 'both' (defaults to 'email' if empty)
const data = [
  ['Name', 'Email', 'Phone', 'Birthday', 'NotificationChannel'],
  // Test case: Both email and WhatsApp
  ['John Doe', 'john.doe@gmail.com', '+14155552671', '10/25/1990', 'both'],
  // Test case: Email only (no phone provided)
  ['Jane Smith', 'jane.smith@gmail.com', '', '12/15/1985', 'email'],
  // Test case: WhatsApp only
  ['Bob Johnson', 'bob.johnson@gmail.com', '+919876543210', '01/08/1992', 'whatsapp'],
  // Test case: Both channels with ISO date format
  ['Alice Williams', 'alice.williams@gmail.com', '+14155552672', '2025-10-25', 'both'],
  // Test case: Default to email (empty NotificationChannel)
  ['Charlie Brown', 'charlie.brown@gmail.com', '+447911123456', '03/22/1988', ''],
  // Test case: Email only with phone provided (but channel is email)
  ['Diana Prince', 'diana.prince@gmail.com', '+14155552673', '07/04/1995', 'email'],
  // Test case: WhatsApp with UK number
  ['Emma Watson', 'emma.watson@gmail.com', '+447911123457', '04/15/1990', 'whatsapp'],
  // Test case: Both channels with India number
  ['Frank Miller', 'frank.miller@gmail.com', '+919876543211', '06/10/1987', 'both']
];

// Create a new workbook and worksheet
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet(data);

// Set column widths
ws['!cols'] = [
  { wch: 20 },  // Name column
  { wch: 30 },  // Email column
  { wch: 18 },  // Phone column
  { wch: 15 },  // Birthday column
  { wch: 20 }   // NotificationChannel column
];

// Add worksheet to workbook
XLSX.utils.book_append_sheet(wb, ws, 'Birthdays');

// Write to file
XLSX.writeFile(wb, 'birthdays.xlsx');

console.log('Sample birthdays.xlsx file created successfully!');
