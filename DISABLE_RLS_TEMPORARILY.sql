-- NUCLEAR OPTION: Disable RLS entirely for the enquiries table
-- Only use this if the policy fix doesn't work
-- WARNING: This allows anyone to insert/update/delete if they have the anon key

-- Disable RLS completely
ALTER TABLE enquiries DISABLE ROW LEVEL SECURITY;

-- This will allow all operations without any policy checks
-- Your API will work, but be aware this is less secure
-- You can always re-enable RLS later with:
-- ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;

