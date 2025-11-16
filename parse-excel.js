import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the Excel file
const excelPath = path.join(__dirname, 'public', 'Sheets', 'Combined_Students.xlsx');
console.log(`Reading Excel file: ${excelPath}`);

if (!fs.existsSync(excelPath)) {
  console.error(`Error: File not found: ${excelPath}`);
  process.exit(1);
}

const workbook = xlsx.readFile(excelPath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

console.log(`Processing sheet: ${sheetName}`);

// Convert to JSON
const data = xlsx.utils.sheet_to_json(worksheet);

console.log(`Total rows: ${data.length}`);
console.log(`Sample row:`, data[0]);

// Determine column names (check all rows to find all possible columns)
const allColumns = new Set();
data.forEach(row => {
  Object.keys(row).forEach(key => allColumns.add(key));
});
const columns = Array.from(allColumns);
console.log(`Columns found: ${columns.join(', ')}`);

// Find the column names (case-insensitive)
let raColumn = null;
let nameColumn = null;
let deptColumn = null;

for (const col of columns) {
  const lower = col.toLowerCase();
  if (!raColumn && (lower.includes('register') || lower.includes('ra') || lower.includes('reg'))) {
    raColumn = col;
  }
  if (!nameColumn && (lower.includes('name') || lower.includes('student'))) {
    nameColumn = col;
  }
  if (!deptColumn && (lower.includes('dept') || lower.includes('department') || lower.includes('branch'))) {
    deptColumn = col;
  }
}

console.log(`\nDetected columns:`);
console.log(`  RA: ${raColumn || 'NOT FOUND'}`);
console.log(`  Name: ${nameColumn || 'NOT FOUND'}`);
console.log(`  Department: ${deptColumn || 'NOT FOUND'}`);

if (!raColumn) {
  console.error('Error: Could not find RA/Register Number column');
  console.log('Available columns:', columns);
  process.exit(1);
}

// Generate seat-data.json structure
const seatData = data
  .map(row => {
    const ra = String(row[raColumn] || '').trim().toUpperCase();
    if (!ra || !ra.startsWith('RA')) {
      return null; // Skip invalid rows
    }
    
    const name = nameColumn ? String(row[nameColumn] || '').trim() : null;
    const department = deptColumn ? String(row[deptColumn] || '').trim() : null;
    
    return {
      registerNumber: ra,
      name: name || null,
      department: department || null,
      // These fields will be empty initially, filled by seating arrangement data
      room: null,
      floor: null,
      building: null,
      subcode: null,
      date: null,
      session: null,
    };
  })
  .filter(entry => entry !== null);

console.log(`\nGenerated ${seatData.length} valid entries`);

// Write to seat-data.json
const outputPath = path.join(__dirname, 'public', 'seat-data.json');
fs.writeFileSync(outputPath, JSON.stringify(seatData, null, 2), 'utf8');

console.log(`\n✓ Successfully generated: ${outputPath}`);
console.log(`  Total entries: ${seatData.length}`);

// Show sample entries
console.log(`\nSample entries:`);
seatData.slice(0, 3).forEach((entry, i) => {
  console.log(`  ${i + 1}. ${entry.registerNumber} - ${entry.name || 'N/A'} - ${entry.department || 'N/A'}`);
});

