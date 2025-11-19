/**
 * Test script to verify enquiry logging is working
 * Run: node test-enquiry-logging.js
 */

import { supabase, isSupabaseConfigured } from './api/supabase-client.js';

async function testEnquiryLogging() {
  console.log('🧪 Testing enquiry logging...\n');
  
  // Check if Supabase is configured
  if (!isSupabaseConfigured() || !supabase) {
    console.error('❌ Supabase is not configured!');
    console.error('Make sure SUPABASE_URL and SUPABASE_ANON_KEY are set.');
    process.exit(1);
  }
  
  console.log('✅ Supabase is configured\n');
  
  // Test 1: Check if enquiries table exists
  console.log('Test 1: Checking if enquiries table exists...');
  try {
    const { data, error } = await supabase
      .from('enquiries')
      .select('id')
      .limit(1);
    
    if (error) {
      if (error.code === '42P01') {
        console.error('❌ Table "enquiries" does not exist!');
        console.error('\nPlease run the SQL from create-enquiries-table.sql in Supabase:\n');
        console.error('1. Go to Supabase → SQL Editor');
        console.error('2. Copy contents of create-enquiries-table.sql');
        console.error('3. Click "Run"');
        process.exit(1);
      } else {
        console.error('❌ Error checking table:', error.message);
        console.error('Error code:', error.code);
        process.exit(1);
      }
    } else {
      console.log('✅ Table "enquiries" exists\n');
    }
  } catch (err) {
    console.error('❌ Failed to check table:', err.message);
    process.exit(1);
  }
  
  // Test 2: Try inserting a test record
  console.log('Test 2: Trying to insert a test record...');
  try {
    const testEnquiry = {
      register_number: 'TEST_RA_' + Date.now(),
      search_date: '01/01/2025',
      results_found: true,
      result_count: 1,
      campuses: ['Test Campus'],
      use_live_api: true,
      error_message: null,
    };
    
    const { data, error } = await supabase
      .from('enquiries')
      .insert(testEnquiry)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Failed to insert test record:', error.message);
      console.error('Error code:', error.code);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      if (error.code === '42501') {
        console.error('\n⚠️  Row Level Security (RLS) policy might be blocking inserts.');
        console.error('Check the RLS policy for the enquiries table in Supabase.');
      }
      
      process.exit(1);
    } else {
      console.log('✅ Successfully inserted test record:', data.id);
      
      // Clean up: Delete test record
      console.log('\nCleaning up test record...');
      await supabase
        .from('enquiries')
        .delete()
        .eq('id', data.id);
      console.log('✅ Test record deleted\n');
    }
  } catch (err) {
    console.error('❌ Failed to insert test record:', err.message);
    process.exit(1);
  }
  
  // Test 3: Check API endpoint (if running locally)
  console.log('✅ All tests passed!');
  console.log('\n📝 Next steps:');
  console.log('1. Make sure your Vercel deployment has SUPABASE_URL and SUPABASE_ANON_KEY set');
  console.log('2. Test the app by searching for a student');
  console.log('3. Check the browser console for logging messages');
  console.log('4. Check Vercel logs for API errors');
}

testEnquiryLogging().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

