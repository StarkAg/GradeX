-- Fix RLS policy to allow inserts
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/phlggcheaajkupppozho/sql/new

-- Allow INSERT operations (for data upload)
DROP POLICY IF EXISTS "Allow public insert access" ON students;
CREATE POLICY "Allow public insert access" ON students
  FOR INSERT
  WITH CHECK (true);

-- Allow UPDATE operations (for upserts)
DROP POLICY IF EXISTS "Allow public update access" ON students;
CREATE POLICY "Allow public update access" ON students
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Keep the SELECT policy (already exists)
-- DROP POLICY IF EXISTS "Allow public read access" ON students;
-- CREATE POLICY "Allow public read access" ON students
--   FOR SELECT
--   USING (true);

