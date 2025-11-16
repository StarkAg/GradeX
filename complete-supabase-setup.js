/**
 * Complete Supabase Setup - Creates table and uploads data
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = 'https://phlggcheaajkupppozho.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobGdnY2hlYWFqa3VwcHBvemhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyODQ0NTgsImV4cCI6MjA3ODg2MDQ1OH0.TGEDpm2uqKceOxAMB5aG6fd8uHESmwfdKF-cqm2QU84';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTable() {
  console.log('📋 Step 1: Creating table in Supabase...\n');
  
  // Try to check if table exists first
  const { data, error: checkError } = await supabase
    .from('students')
    .select('*')
    .limit(0);
  
  if (!checkError) {
    console.log('✓ Table already exists!\n');
    return true;
  }
  
  if (checkError && (checkError.code === 'PGRST116' || checkError.message.includes('does not exist'))) {
    console.log('⚠️  Table does not exist. Creating via SQL API...\n');
    
    // Try to create table using REST API (requires service role key)
    // For now, we'll use the SQL Editor API endpoint
    const sqlEndpoint = `${supabaseUrl}/rest/v1/rpc/exec_sql`;
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS students (
        id BIGSERIAL PRIMARY KEY,
        register_number TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_students_register_number ON students(register_number);

      ALTER TABLE students ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS "Allow public read access" ON students;
      CREATE POLICY "Allow public read access" ON students
        FOR SELECT
        USING (true);
    `;
    
    try {
      // Note: This requires service role key or direct SQL execution
      // Since we only have anon key, we'll provide instructions
      console.log('⚠️  Cannot create table programmatically with anon key.');
      console.log('   Please run this SQL in Supabase SQL Editor:\n');
      console.log('   https://supabase.com/dashboard/project/phlggcheaajkupppozho/sql/new\n');
      console.log(createTableSQL);
      console.log('\n   After running the SQL, press Enter to continue...');
      
      // Wait for user confirmation (in automated mode, we'll skip this)
      return false;
    } catch (err) {
      console.error('✗ Error:', err.message);
      return false;
    }
  }
  
  console.log('⚠️  Unexpected error:', checkError.message);
  return false;
}

async function uploadData() {
  console.log('📤 Step 2: Uploading data to Supabase...\n');
  
  const jsonPath = path.join(__dirname, 'public', 'seat-data.json');
  
  if (!fs.existsSync(jsonPath)) {
    console.error(`✗ File not found: ${jsonPath}`);
    return false;
  }
  
  console.log('Reading JSON file...');
  const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  console.log(`✓ Loaded ${jsonData.length} entries\n`);
  
  // Prepare data
  const students = jsonData
    .filter(entry => entry.registerNumber && entry.name)
    .map(entry => ({
      register_number: entry.registerNumber.toUpperCase().trim(),
      name: entry.name.trim(),
    }));
  
  console.log(`Prepared ${students.length} valid student records\n`);
  
  // Check current count
  const { count: currentCount } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true });
  
  if (currentCount && currentCount > 0) {
    console.log(`⚠️  Database already has ${currentCount} records.`);
    console.log('   Using upsert to update/insert records...\n');
  }
  
  // Upload in batches
  const batchSize = 1000;
  let uploaded = 0;
  let errors = 0;
  
  for (let i = 0; i < students.length; i += batchSize) {
    const batch = students.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(students.length / batchSize);
    
    process.stdout.write(`Uploading batch ${batchNum}/${totalBatches} (${batch.length} records)... `);
    
    const { data, error } = await supabase
      .from('students')
      .upsert(batch, { onConflict: 'register_number' })
      .select();
    
    if (error) {
      console.error(`✗ Error: ${error.message}`);
      if (error.code === 'PGRST116') {
        console.error('\n✗ Table does not exist! Please create it first using the SQL above.');
        return false;
      }
      errors++;
      if (errors > 3) {
        console.error('\n✗ Too many errors. Stopping upload.');
        return false;
      }
      continue;
    }
    
    uploaded += batch.length;
    console.log(`✓ (${uploaded}/${students.length})`);
  }
  
  // Verify
  const { count, error: countError } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true });
  
  if (!countError) {
    console.log(`\n✓ Verification: ${count} records in database\n`);
  }
  
  return true;
}

async function main() {
  console.log('🚀 Starting Complete Supabase Setup\n');
  console.log('='.repeat(50) + '\n');
  
  // Step 1: Create table
  const tableExists = await createTable();
  
  if (!tableExists) {
    console.log('\n⚠️  Please create the table first, then run this script again.');
    console.log('   Or if you have service role key, we can create it automatically.\n');
    process.exit(1);
  }
  
  // Step 2: Upload data
  const uploadSuccess = await uploadData();
  
  if (uploadSuccess) {
    console.log('✅ Setup complete!\n');
    console.log('Next: Set Vercel environment variables (see below)\n');
  } else {
    console.log('\n❌ Setup incomplete. Please check errors above.\n');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('\n✗ Fatal error:', err);
  process.exit(1);
});

