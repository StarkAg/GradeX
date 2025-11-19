-- COMPLETE FIX for RLS policy issue
-- Run this entire script in Supabase SQL Editor

-- Step 1: Disable RLS temporarily to clean up
ALTER TABLE IF EXISTS enquiries DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies (in case there are multiple)
DROP POLICY IF EXISTS "Allow public insert access" ON enquiries;
DROP POLICY IF EXISTS "Allow admin read access" ON enquiries;
DROP POLICY IF EXISTS "Enable insert for all users" ON enquiries;
DROP POLICY IF EXISTS "Enable insert for anonymous users" ON enquiries;
DROP POLICY IF EXISTS "enquiries_insert_policy" ON enquiries;
DROP POLICY IF EXISTS "enquiries_select_policy" ON enquiries;

-- Step 3: Re-enable RLS
ALTER TABLE IF EXISTS enquiries ENABLE ROW LEVEL SECURITY;

-- Step 4: Create INSERT policy that allows anonymous users
-- This MUST specify roles explicitly
CREATE POLICY "Allow public insert access" ON enquiries
  FOR INSERT
  TO anon, authenticated, public
  WITH CHECK (true);

-- Step 5: Create SELECT policy (optional - for viewing via dashboard/service role)
-- You can view the table in Supabase dashboard regardless of this policy
CREATE POLICY "Allow admin read access" ON enquiries
  FOR SELECT
  TO service_role, authenticated
  USING (true);

-- Verify the policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'enquiries';

