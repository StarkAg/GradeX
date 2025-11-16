/**
 * Script to upload student data from JSON to Supabase
 * Run: node upload-to-supabase.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
// Prefer service role key/access token over anon key (for write operations)
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY 
  || process.env.SUPABASE_ACCESS_TOKEN
  || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY/SUPABASE_ACCESS_TOKEN) environment variables are required');
  console.log('\nPlease set them:');
  console.log('export SUPABASE_URL="your-supabase-url"');
  console.log('export SUPABASE_ACCESS_TOKEN="your-access-token"');
  console.log('  OR');
  console.log('export SUPABASE_ANON_KEY="your-supabase-anon-key"');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Read the JSON file
const jsonPath = path.join(__dirname, 'public', 'seat-data.json');
console.log(`Reading JSON file: ${jsonPath}`);

if (!fs.existsSync(jsonPath)) {
  console.error(`Error: File not found: ${jsonPath}`);
  process.exit(1);
}

const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
console.log(`Loaded ${jsonData.length} entries from JSON`);

// Prepare data for Supabase (only registerNumber and name)
const students = jsonData
  .filter(entry => entry.registerNumber && entry.name)
  .map(entry => ({
    register_number: entry.registerNumber.toUpperCase().trim(),
    name: entry.name.trim(),
  }));

console.log(`Prepared ${students.length} valid student records`);

// Upload to Supabase
async function uploadToSupabase() {
  try {
    console.log('\nUploading to Supabase...');
    
    // Delete all existing records first (optional - comment out if you want to keep existing)
    console.log('Clearing existing records...');
    const { error: deleteError } = await supabase
      .from('students')
      .delete()
      .neq('register_number', ''); // Delete all records
    
    if (deleteError) {
      console.warn('Warning: Could not clear existing records:', deleteError.message);
    } else {
      console.log('✓ Cleared existing records');
    }
    
    // Upload in batches of 1000 (Supabase limit)
    const batchSize = 1000;
    let uploaded = 0;
    
    for (let i = 0; i < students.length; i += batchSize) {
      const batch = students.slice(i, i + batchSize);
      console.log(`Uploading batch ${Math.floor(i / batchSize) + 1} (${batch.length} records)...`);
      
      const { data, error } = await supabase
        .from('students')
        .insert(batch)
        .select();
      
      if (error) {
        console.error(`Error uploading batch:`, error);
        throw error;
      }
      
      uploaded += batch.length;
      console.log(`✓ Uploaded ${uploaded}/${students.length} records`);
    }
    
    console.log(`\n✓ Successfully uploaded ${uploaded} student records to Supabase`);
    
    // Verify upload
    const { count, error: countError } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true });
    
    if (!countError) {
      console.log(`✓ Verified: ${count} records in Supabase`);
    }
    
  } catch (error) {
    console.error('Error uploading to Supabase:', error);
    process.exit(1);
  }
}

uploadToSupabase();

