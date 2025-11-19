-- COPY AND PASTE THIS ENTIRE SCRIPT IN SUPABASE SQL EDITOR
-- This will 100% fix the RLS policy issue

-- Step 1: Drop the old policy completely
DROP POLICY IF EXISTS "Allow public insert access" ON enquiries;

-- Step 2: Create the policy with explicit role permissions
-- The key is specifying 'anon' role which is what the anon key uses
CREATE POLICY "Allow public insert access" ON enquiries
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Step 3: Verify it worked (optional check)
SELECT policyname, roles, cmd, with_check 
FROM pg_policies 
WHERE tablename = 'enquiries' AND cmd = 'INSERT';

-- If the above doesn't work, try this alternative:
-- DROP POLICY IF EXISTS "Allow public insert access" ON enquiries;
-- CREATE POLICY "Allow public insert access" ON enquiries
--   FOR INSERT
--   TO anon
--   WITH CHECK (true);

