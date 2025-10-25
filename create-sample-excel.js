const XLSX = require('xlsx');

// Create sample birthday data
const data = [
  ['Name', 'Email', 'Birthday'],
  ['John Doe', 'john.doe@gmail.com', '10/25/1990'],
  ['Jane Smith', 'jane.smith@gmail.com', '12/15/1985'],
  ['Bob Johnson', 'bob.johnson@gmail.com', '01/08/1992'],
  ['Alice Williams', 'alice.williams@gmail.com', '2025-10-25'],
  ['Charlie Brown', 'charlie.brown@gmail.com', '03/22/1988'],
  ['Diana Prince', 'diana.prince@gmail.com', '07/04/1995']
];

// Create a new workbook and worksheet
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet(data);

// Set column widths
ws['!cols'] = [
  { wch: 20 },  // Name column
  { wch: 30 },  // Email column
  { wch: 15 }   // Birthday column
];

// Add worksheet to workbook
XLSX.utils.book_append_sheet(wb, ws, 'Birthdays');

// Write to file
XLSX.writeFile(wb, 'birthdays.xlsx');

console.log('Sample birthdays.xlsx file created successfully!');
