/**
 * Create Supabase table using REST API
 */

const supabaseUrl = 'https://phlggcheaajkupppozho.supabase.co';
const serviceRoleKey = 'sbp_23274a2e6a6b44f4baa975d08154c7a0e706e5cc';

async function createTable() {
  console.log('Creating table using Supabase REST API...\n');
  
  // SQL to create table
  const sql = `
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
    // Try using PostgREST to execute SQL (may not work with anon key)
    // Alternative: Use Supabase Management API
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ sql }),
    });
    
    if (response.ok) {
      console.log('✓ Table created successfully!\n');
      return true;
    } else {
      const error = await response.text();
      console.log('⚠️  Direct API call failed:', error);
      console.log('\nTrying alternative method...\n');
      
      // Try using Supabase client with service role
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, serviceRoleKey);
      
      // Check if we can query (table exists)
      const { error: checkError } = await supabase
        .from('students')
        .select('*')
        .limit(0);
      
      if (!checkError) {
        console.log('✓ Table already exists!\n');
        return true;
      }
      
      console.log('⚠️  Cannot create table programmatically.');
      console.log('   Please create it manually in Supabase SQL Editor:\n');
      console.log('   https://supabase.com/dashboard/project/phlggcheaajkupppozho/sql/new\n');
      console.log(sql);
      return false;
    }
  } catch (err) {
    console.error('Error:', err.message);
    return false;
  }
}

createTable().then(success => {
  if (success) {
    console.log('✅ Table setup complete!\n');
    process.exit(0);
  } else {
    console.log('\n⚠️  Please create the table manually, then run: node complete-supabase-setup.js\n');
    process.exit(1);
  }
});

