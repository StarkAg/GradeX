-- Run this to verify your RLS policies are set up correctly
-- Go to Supabase → SQL Editor and run this

-- Check if table exists
SELECT 
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'enquiries';

-- Check existing policies
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

-- Expected output should show:
-- 1. A policy with cmd = 'INSERT' and roles containing 'anon' or 'public'
-- 2. The with_check should be 'true' or '(true)'

