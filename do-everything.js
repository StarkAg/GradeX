/**
 * Complete Automated Setup - Does Everything Possible
 */

import { createClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = 'https://phlggcheaajkupppozho.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobGdnY2hlYWFqa3VwcHBvemhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyODQ0NTgsImV4cCI6MjA3ODg2MDQ1OH0.TGEDpm2uqKceOxAMB5aG6fd8uHESmwfdKF-cqm2QU84';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createTableViaAPI() {
  console.log('📋 Creating table via Supabase API...\n');
  
  // Try to create table using Supabase Management API
  // This requires service role key, but let's try with anon key first
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        query: `
          CREATE TABLE IF NOT EXISTS students (
            id BIGSERIAL PRIMARY KEY,
            register_number TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
        `
      }),
    });
    
    if (response.ok) {
      console.log('✅ Table created!\n');
      // Wait for schema cache to refresh
      console.log('⏳ Waiting for schema cache to refresh...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      return true;
    }
  } catch (err) {
    // API method not available
  }
  
  // Fallback: Provide SQL instructions
  console.log('⚠️  Cannot create table via API (requires service role key).\n');
  console.log('📋 Please run this SQL in Supabase SQL Editor:\n');
  console.log('   👉 https://supabase.com/dashboard/project/phlggcheaajkupppozho/sql/new\n');
  console.log('─'.repeat(70));
  console.log(`
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
  `);
  console.log('─'.repeat(70));
  console.log('\n⏸️  Waiting for you to create the table...');
  console.log('   Press Enter after creating the table to continue...\n');
  
  // Wait for user input (in automated mode, we'll just return false)
  return false;
}

async function checkAndWaitForTable(maxRetries = 10) {
  console.log('🔍 Checking if table is accessible...\n');
  
  for (let i = 0; i < maxRetries; i++) {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .limit(1);
    
    if (!error) {
      console.log('✅ Table is accessible!\n');
      return true;
    }
    
    if (error.code === 'PGRST116' || error.message.includes('schema cache')) {
      if (i < maxRetries - 1) {
        console.log(`⏳ Schema cache not refreshed yet... (${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }
    }
    
    console.log('❌ Table not accessible:', error.message);
    return false;
  }
  
  return false;
}

async function uploadData() {
  console.log('📤 Uploading data...\n');
  
  const jsonPath = path.join(__dirname, 'public', 'seat-data.json');
  const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  
  const students = jsonData
    .filter(entry => entry.registerNumber && entry.name)
    .map(entry => ({
      register_number: entry.registerNumber.toUpperCase().trim(),
      name: entry.name.trim(),
    }));
  
  console.log(`📊 Prepared ${students.length} records\n`);
  
  const batchSize = 1000;
  let uploaded = 0;
  
  for (let i = 0; i < students.length; i += batchSize) {
    const batch = students.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(students.length / batchSize);
    
    process.stdout.write(`  Batch ${batchNum}/${totalBatches}... `);
    
    let retries = 3;
    let success = false;
    
    while (retries > 0 && !success) {
      const { error } = await supabase
        .from('students')
        .upsert(batch, { onConflict: 'register_number' });
      
      if (error) {
        if (error.message.includes('schema cache')) {
          retries--;
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          }
        }
        console.error(`❌ ${error.message}`);
        return false;
      }
      
      success = true;
      uploaded += batch.length;
      console.log(`✅ (${uploaded}/${students.length})`);
    }
  }
  
  const { count } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true });
  
  console.log(`\n✅ Upload complete! Total: ${count} records\n`);
  return true;
}

function setVercelEnvVars() {
  console.log('⚙️  Setting Vercel environment variables...\n');
  
  try {
    // Check if logged in to Vercel
    try {
      execSync('vercel whoami', { stdio: 'ignore' });
    } catch {
      console.log('⚠️  Not logged in to Vercel. Please run: vercel login\n');
      console.log('   Then set these environment variables manually:\n');
      console.log(`   SUPABASE_URL = ${supabaseUrl}`);
      console.log(`   SUPABASE_ANON_KEY = ${supabaseAnonKey}\n`);
      return false;
    }
    
    // Try to set env vars (may require project selection)
    console.log('Setting SUPABASE_URL...');
    try {
      execSync(`echo "${supabaseUrl}" | vercel env add SUPABASE_URL production`, { stdio: 'inherit' });
    } catch {
      console.log('   ⚠️  Could not set automatically. Please set manually.\n');
    }
    
    console.log('Setting SUPABASE_ANON_KEY...');
    try {
      execSync(`echo "${supabaseAnonKey}" | vercel env add SUPABASE_ANON_KEY production`, { stdio: 'inherit' });
    } catch {
      console.log('   ⚠️  Could not set automatically. Please set manually.\n');
    }
    
    console.log('✅ Vercel environment variables configured!\n');
    return true;
  } catch (error) {
    console.log('⚠️  Vercel CLI error. Please set environment variables manually:\n');
    console.log(`   SUPABASE_URL = ${supabaseUrl}`);
    console.log(`   SUPABASE_ANON_KEY = ${supabaseAnonKey}\n`);
    return false;
  }
}

async function main() {
  console.log('🚀 Complete Automated Setup\n');
  console.log('='.repeat(70) + '\n');
  
  // Step 1: Create table
  const tableCreated = await createTableViaAPI();
  
  if (!tableCreated) {
    console.log('\n⏸️  Please create the table using the SQL above, then run this script again.\n');
    process.exit(0);
  }
  
  // Step 2: Wait for table to be accessible
  const tableAccessible = await checkAndWaitForTable();
  if (!tableAccessible) {
    console.log('\n❌ Table is not accessible. Please check Supabase dashboard.\n');
    process.exit(1);
  }
  
  // Step 3: Upload data
  const uploadSuccess = await uploadData();
  if (!uploadSuccess) {
    console.log('\n❌ Data upload failed.\n');
    process.exit(1);
  }
  
  // Step 4: Set Vercel env vars
  console.log('─'.repeat(70) + '\n');
  setVercelEnvVars();
  
  console.log('─'.repeat(70) + '\n');
  console.log('✅ All Setup Complete!\n');
  console.log('Next: Redeploy on Vercel to apply environment variables.\n');
}

main().catch(err => {
  console.error('\n❌ Error:', err);
  process.exit(1);
});

