-- Fix RLS policies for enquiries table
-- Run this if you're getting "new row violates row-level security policy" error

-- First, disable RLS temporarily to fix policies
ALTER TABLE enquiries DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow public insert access" ON enquiries;
DROP POLICY IF EXISTS "Allow admin read access" ON enquiries;
DROP POLICY IF EXISTS "Enable insert for all users" ON enquiries;
DROP POLICY IF EXISTS "Enable insert for anonymous users" ON enquiries;

-- Re-enable RLS
ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;

-- Create policy to allow inserts from anyone (including anonymous/anonymous users)
-- This works with the anon key from environment variables
CREATE POLICY "Allow public insert access" ON enquiries
  FOR INSERT
  TO anon, authenticated, public
  WITH CHECK (true);

-- For SELECT: Allow reads with service role only (admin queries)
-- You can also allow authenticated users if needed, or use service role
CREATE POLICY "Allow admin read access" ON enquiries
  FOR SELECT
  TO service_role, authenticated
  USING (true);

-- Alternative: If you want to test with anon key for SELECT too, use:
-- DROP POLICY IF EXISTS "Allow admin read access" ON enquiries;
-- CREATE POLICY "Allow admin read access" ON enquiries
--   FOR SELECT
--   TO anon, authenticated, service_role
--   USING (true);

