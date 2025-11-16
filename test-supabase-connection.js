/**
 * Test Supabase connection
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://phlggcheaajkupppozho.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY 
  || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobGdnY2hlYWFqa3VwcHBvemhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyODQ0NTgsImV4cCI6MjA3ODg2MDQ1OH0.TGEDpm2uqKceOxAMB5aG6fd8uHESmwfdKF-cqm2QU84';

console.log('Testing Supabase connection...');
console.log(`URL: ${supabaseUrl}`);
console.log(`Key: ${supabaseKey.substring(0, 20)}...\n`);

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    // Test 1: Check if we can query the students table
    console.log('1. Testing table access...');
    const { data, error, count } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        console.log('   ⚠ Table "students" does not exist yet. You need to create it.');
        console.log('   Run the SQL from SUPABASE_SETUP.md in your Supabase SQL Editor.');
      } else {
        console.error('   ✗ Error:', error.message);
        console.error('   Code:', error.code);
      }
    } else {
      console.log(`   ✓ Table exists! Current record count: ${count || 0}`);
    }
    
    // Test 2: Try a simple query
    console.log('\n2. Testing query capability...');
    const { data: testData, error: testError } = await supabase
      .from('students')
      .select('register_number, name')
      .limit(1);
    
    if (testError) {
      console.log('   ⚠ Query error:', testError.message);
    } else {
      console.log(`   ✓ Query successful! Sample data:`, testData);
    }
    
    console.log('\n✓ Connection test complete!');
    
  } catch (err) {
    console.error('✗ Connection failed:', err.message);
    process.exit(1);
  }
}

testConnection();

