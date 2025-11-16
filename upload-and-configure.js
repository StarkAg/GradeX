/**
 * Upload data and configure Vercel - assumes table already exists
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

async function checkTable() {
  console.log('🔍 Verifying table access...\n');
  
  let retries = 5;
  while (retries > 0) {
    const { data, error, count } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true });
    
    if (!error) {
      console.log(`✅ Table accessible! Current records: ${count || 0}\n`);
      return true;
    }
    
    if (error.message.includes('schema cache')) {
      console.log(`⏳ Schema cache refreshing... (${6 - retries}/5)`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      retries--;
      continue;
    }
    
    console.error('❌ Error:', error.message);
    return false;
  }
  
  console.error('❌ Table not accessible after retries');
  return false;
}

async function uploadData() {
  console.log('📤 Uploading student data...\n');
  
  const jsonPath = path.join(__dirname, 'public', 'seat-data.json');
  
  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ File not found: ${jsonPath}\n`);
    return false;
  }
  
  console.log('Reading JSON file...');
  const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  console.log(`✅ Loaded ${jsonData.length} entries\n`);
  
  const students = jsonData
    .filter(entry => entry.registerNumber && entry.name)
    .map(entry => ({
      register_number: entry.registerNumber.toUpperCase().trim(),
      name: entry.name.trim(),
    }));
  
  console.log(`📊 Prepared ${students.length} valid student records\n`);
  
  // Check current count
  const { count: currentCount } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true });
  
  if (currentCount && currentCount > 0) {
    console.log(`ℹ️  Database has ${currentCount} records. Using upsert to update...\n`);
  }
  
  const batchSize = 1000;
  let uploaded = 0;
  let errors = 0;
  
  for (let i = 0; i < students.length; i += batchSize) {
    const batch = students.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(students.length / batchSize);
    
    process.stdout.write(`  Batch ${batchNum}/${totalBatches} (${batch.length} records)... `);
    
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
        errors++;
        if (errors > 3) {
          console.error('\n❌ Too many errors. Stopping.\n');
          return false;
        }
        break;
      }
      
      success = true;
      uploaded += batch.length;
      console.log(`✅ (${uploaded}/${students.length})`);
    }
  }
  
  // Verify final count
  const { count, error: countError } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true });
  
  if (!countError) {
    console.log(`\n✅ Upload complete! Total records in database: ${count}\n`);
  }
  
  return true;
}

function setVercelEnvVars() {
  console.log('⚙️  Configuring Vercel environment variables...\n');
  
  try {
    // Check if Vercel CLI is installed
    try {
      execSync('vercel --version', { stdio: 'ignore' });
    } catch {
      console.log('⚠️  Vercel CLI not found.');
      console.log('   Please install: npm install -g vercel\n');
      console.log('   Or set these manually in Vercel dashboard:\n');
      console.log(`   SUPABASE_URL = ${supabaseUrl}`);
      console.log(`   SUPABASE_ANON_KEY = ${supabaseAnonKey}\n`);
      return false;
    }
    
    // Check if logged in
    try {
      execSync('vercel whoami', { stdio: 'ignore' });
    } catch {
      console.log('⚠️  Not logged in to Vercel.');
      console.log('   Please run: vercel login\n');
      console.log('   Then set these manually in Vercel dashboard:\n');
      console.log(`   SUPABASE_URL = ${supabaseUrl}`);
      console.log(`   SUPABASE_ANON_KEY = ${supabaseAnonKey}\n`);
      return false;
    }
    
    // Try to set env vars
    console.log('Setting SUPABASE_URL...');
    try {
      execSync(`echo "${supabaseUrl}" | vercel env add SUPABASE_URL production`, { stdio: 'pipe' });
      console.log('  ✅ Set');
    } catch (e) {
      console.log('  ⚠️  Could not set automatically');
    }
    
    console.log('Setting SUPABASE_ANON_KEY...');
    try {
      execSync(`echo "${supabaseAnonKey}" | vercel env add SUPABASE_ANON_KEY production`, { stdio: 'pipe' });
      console.log('  ✅ Set');
    } catch (e) {
      console.log('  ⚠️  Could not set automatically');
    }
    
    console.log('\n✅ Vercel environment variables configured!\n');
    console.log('   Note: You may need to redeploy for changes to take effect.\n');
    return true;
  } catch (error) {
    console.log('⚠️  Could not set Vercel env vars automatically.');
    console.log('   Please set them manually in Vercel dashboard:\n');
    console.log(`   SUPABASE_URL = ${supabaseUrl}`);
    console.log(`   SUPABASE_ANON_KEY = ${supabaseAnonKey}\n`);
    return false;
  }
}

async function main() {
  console.log('🚀 GradeX Supabase Setup\n');
  console.log('='.repeat(60) + '\n');
  
  // Step 1: Check table
  const tableOk = await checkTable();
  if (!tableOk) {
    console.log('❌ Cannot proceed. Please check table creation.\n');
    process.exit(1);
  }
  
  // Step 2: Upload data
  console.log('─'.repeat(60) + '\n');
  const uploadSuccess = await uploadData();
  if (!uploadSuccess) {
    console.log('❌ Data upload failed.\n');
    process.exit(1);
  }
  
  // Step 3: Set Vercel env vars
  console.log('─'.repeat(60) + '\n');
  setVercelEnvVars();
  
  console.log('─'.repeat(60) + '\n');
  console.log('✅ All Setup Complete!\n');
  console.log('Next steps:');
  console.log('  1. Verify data in Supabase dashboard');
  console.log('  2. Redeploy on Vercel to apply environment variables');
  console.log('  3. Test the application\n');
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});

