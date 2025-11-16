/**
 * Supabase Admin Management Tool
 * Full access for easy management
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load credentials from environment or config
const supabaseUrl = process.env.SUPABASE_URL || 'https://phlggcheaajkupppozho.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY 
  || process.env.SUPABASE_ACCESS_TOKEN
  || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobGdnY2hlYWFqa3VwcHBvemhvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzI4NDQ1OCwiZXhwIjoyMDc4ODYwNDU4fQ.sqWGVGXWameUo1v7nDcRprwa5A4bP52RqAwhyjDqRH4';

if (!serviceRoleKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ACCESS_TOKEN required for admin operations');
  console.log('\nGet it from: https://supabase.com/dashboard/project/phlggcheaajkupppozho/settings/api');
  console.log('Then set: export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"');
  process.exit(1);
}

// Create admin client with service role (full access)
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

// Commands
const command = process.argv[2];
const args = process.argv.slice(3);

async function showStats() {
  console.log('📊 Supabase Database Stats\n');
  
  const { count, error } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true });
  
  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }
  
  console.log(`Total Students: ${count}`);
  console.log(`Database: ${supabaseUrl}`);
  console.log(`Access Level: Service Role (Full Access)\n`);
}

async function findStudent(ra) {
  console.log(`🔍 Searching for: ${ra}\n`);
  
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('register_number', ra.toUpperCase())
    .single();
  
  if (error) {
    console.log('❌ Not found or error:', error.message);
    return;
  }
  
  console.log('✅ Found:');
  console.log(`   ID: ${data.id}`);
  console.log(`   RA: ${data.register_number}`);
  console.log(`   Name: ${data.name}`);
  console.log(`   Created: ${data.created_at}`);
  console.log(`   Updated: ${data.updated_at}\n`);
}

async function addStudent(ra, name) {
  console.log(`➕ Adding student: ${ra} - ${name}\n`);
  
  const { data, error } = await supabase
    .from('students')
    .insert({
      register_number: ra.toUpperCase().trim(),
      name: name.trim(),
    })
    .select()
    .single();
  
  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }
  
  console.log('✅ Added successfully:');
  console.log(`   ${data.register_number} → ${data.name}\n`);
}

async function updateStudent(ra, newName) {
  console.log(`✏️  Updating: ${ra}\n`);
  
  const { data, error } = await supabase
    .from('students')
    .update({ name: newName.trim() })
    .eq('register_number', ra.toUpperCase())
    .select()
    .single();
  
  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }
  
  if (!data) {
    console.log('❌ Student not found');
    return;
  }
  
  console.log('✅ Updated:');
  console.log(`   ${data.register_number} → ${data.name}\n`);
}

async function deleteStudent(ra) {
  console.log(`🗑️  Deleting: ${ra}\n`);
  
  const { data, error } = await supabase
    .from('students')
    .delete()
    .eq('register_number', ra.toUpperCase())
    .select()
    .single();
  
  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }
  
  if (!data) {
    console.log('❌ Student not found');
    return;
  }
  
  console.log('✅ Deleted:');
  console.log(`   ${data.register_number} → ${data.name}\n`);
}

async function listStudents(limit = 10) {
  console.log(`📋 Listing students (limit: ${limit})\n`);
  
  const { data, error } = await supabase
    .from('students')
    .select('register_number, name')
    .order('register_number')
    .limit(parseInt(limit));
  
  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }
  
  data.forEach((student, i) => {
    console.log(`${i + 1}. ${student.register_number} → ${student.name}`);
  });
  console.log(`\nTotal shown: ${data.length}\n`);
}

async function uploadFromJSON(jsonPath) {
  console.log(`📤 Uploading from JSON: ${jsonPath}\n`);
  
  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ File not found: ${jsonPath}`);
    return;
  }
  
  const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  const students = jsonData
    .filter(entry => entry.registerNumber && entry.name)
    .map(entry => ({
      register_number: entry.registerNumber.toUpperCase().trim(),
      name: entry.name.trim(),
    }));
  
  console.log(`Prepared ${students.length} records\n`);
  
  const batchSize = 1000;
  let uploaded = 0;
  
  for (let i = 0; i < students.length; i += batchSize) {
    const batch = students.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    
    process.stdout.write(`Batch ${batchNum}... `);
    
    const { error } = await supabase
      .from('students')
      .upsert(batch, { onConflict: 'register_number' });
    
    if (error) {
      console.error(`❌ ${error.message}`);
      return;
    }
    
    uploaded += batch.length;
    console.log(`✅ (${uploaded}/${students.length})`);
  }
  
  console.log(`\n✅ Upload complete! ${uploaded} records\n`);
}

async function exportToJSON(outputPath) {
  console.log(`📥 Exporting to JSON: ${outputPath}\n`);
  
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .order('register_number');
  
  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }
  
  const jsonData = data.map(row => ({
    registerNumber: row.register_number,
    name: row.name,
  }));
  
  fs.writeFileSync(outputPath, JSON.stringify(jsonData, null, 2));
  console.log(`✅ Exported ${jsonData.length} records to ${outputPath}\n`);
}

function showHelp() {
  console.log('🔧 Supabase Admin Tool - Full Access\n');
  console.log('Usage: node supabase-admin.js <command> [args]\n');
  console.log('Commands:');
  console.log('  stats                          Show database statistics');
  console.log('  find <RA>                      Find student by RA number');
  console.log('  add <RA> <Name>                Add new student');
  console.log('  update <RA> <NewName>          Update student name');
  console.log('  delete <RA>                    Delete student');
  console.log('  list [limit]                  List students (default: 10)');
  console.log('  upload <json-file>             Upload from JSON file');
  console.log('  export <output-file>           Export to JSON file');
  console.log('  help                           Show this help\n');
  console.log('Examples:');
  console.log('  node supabase-admin.js stats');
  console.log('  node supabase-admin.js find RA2311003012124');
  console.log('  node supabase-admin.js add RA2411003010001 "John Doe"');
  console.log('  node supabase-admin.js upload public/seat-data.json');
  console.log('  node supabase-admin.js export backup.json\n');
}

// Main
async function main() {
  if (!command || command === 'help') {
    showHelp();
    return;
  }
  
  try {
    switch (command) {
      case 'stats':
        await showStats();
        break;
      case 'find':
        if (!args[0]) {
          console.error('❌ RA number required');
          return;
        }
        await findStudent(args[0]);
        break;
      case 'add':
        if (!args[0] || !args[1]) {
          console.error('❌ RA and Name required');
          return;
        }
        await addStudent(args[0], args[1]);
        break;
      case 'update':
        if (!args[0] || !args[1]) {
          console.error('❌ RA and New Name required');
          return;
        }
        await updateStudent(args[0], args[1]);
        break;
      case 'delete':
        if (!args[0]) {
          console.error('❌ RA number required');
          return;
        }
        await deleteStudent(args[0]);
        break;
      case 'list':
        await listStudents(args[0] || 10);
        break;
      case 'upload':
        if (!args[0]) {
          console.error('❌ JSON file path required');
          return;
        }
        await uploadFromJSON(args[0]);
        break;
      case 'export':
        if (!args[0]) {
          console.error('❌ Output file path required');
          return;
        }
        await exportToJSON(args[0]);
        break;
      default:
        console.error(`❌ Unknown command: ${command}`);
        showHelp();
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

