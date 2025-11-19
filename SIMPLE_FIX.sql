-- SIMPLEST FIX - Just run this one command in Supabase SQL Editor
-- This disables RLS entirely for the enquiries table

ALTER TABLE enquiries DISABLE ROW LEVEL SECURITY;

-- That's it! Now inserts will work.
-- You can verify with:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'enquiries';
-- rowsecurity should be false

