/**
 * Setup Supabase table and upload data
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL || 'https://phlggcheaajkupppozho.supabase.co';
// Use service role key for admin operations (creating table, inserting data)
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY 
  || process.env.SUPABASE_ACCESS_TOKEN
  || process.env.SUPABASE_ANON_KEY
  || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobGdnY2hlYWFqa3VwcHBvemhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyODQ0NTgsImV4cCI6MjA3ODg2MDQ1OH0.TGEDpm2uqKceOxAMB5aG6fd8uHESmwfdKF-cqm2QU84';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupTable() {
  console.log('Setting up Supabase table...\n');
  
  // SQL to create table (run this in Supabase SQL Editor if RPC doesn't work)
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
  
  console.log('⚠️  Note: Table creation via API may require service role key.');
  console.log('   If this fails, run the SQL below in Supabase SQL Editor:\n');
  console.log(createTableSQL);
  console.log('\n---\n');
  
  // Try to check if table exists
  const { data: tableCheck, error: checkError } = await supabase
    .from('students')
    .select('*')
    .limit(0);
  
  if (checkError) {
    if (checkError.code === 'PGRST116' || checkError.message.includes('does not exist')) {
      console.log('✗ Table does not exist. Please run the SQL above in Supabase SQL Editor.');
      console.log('   Go to: https://supabase.com/dashboard/project/phlggcheaajkupppozho/sql/new\n');
      return false;
    } else {
      console.log('⚠️  Error checking table:', checkError.message);
    }
  } else {
    console.log('✓ Table exists!\n');
    return true;
  }
}

async function uploadData() {
  console.log('Reading JSON file...');
  const jsonPath = path.join(__dirname, 'public', 'seat-data.json');
  
  if (!fs.existsSync(jsonPath)) {
    console.error(`✗ File not found: ${jsonPath}`);
    return;
  }
  
  const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  console.log(`✓ Loaded ${jsonData.length} entries from JSON\n`);
  
  // Prepare data
  const students = jsonData
    .filter(entry => entry.registerNumber && entry.name)
    .map(entry => ({
      register_number: entry.registerNumber.toUpperCase().trim(),
      name: entry.name.trim(),
    }));
  
  console.log(`Prepared ${students.length} valid student records\n`);
  
  // Upload in batches
  const batchSize = 1000;
  let uploaded = 0;
  
  console.log('Uploading to Supabase...\n');
  
  for (let i = 0; i < students.length; i += batchSize) {
    const batch = students.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(students.length / batchSize);
    
    console.log(`Uploading batch ${batchNum}/${totalBatches} (${batch.length} records)...`);
    
    const { data, error } = await supabase
      .from('students')
      .upsert(batch, { onConflict: 'register_number' })
      .select();
    
    if (error) {
      console.error(`✗ Error uploading batch ${batchNum}:`, error.message);
      if (error.code === 'PGRST116') {
        console.error('   Table does not exist. Please create it first using the SQL above.');
        return;
      }
      throw error;
    }
    
    uploaded += batch.length;
    console.log(`✓ Uploaded ${uploaded}/${students.length} records\n`);
  }
  
  // Verify
  const { count, error: countError } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true });
  
  if (!countError) {
    console.log(`✓ Verification: ${count} records in Supabase database\n`);
  }
  
  console.log('✓ Upload complete!');
}

async function main() {
  const tableExists = await setupTable();
  
  if (tableExists) {
    await uploadData();
  } else {
    console.log('\nPlease create the table first, then run this script again.');
  }
}

main().catch(console.error);

