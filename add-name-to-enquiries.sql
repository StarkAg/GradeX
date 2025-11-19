-- Add student_name column to enquiries table
-- Run this in Supabase SQL Editor

ALTER TABLE enquiries 
ADD COLUMN IF NOT EXISTS student_name TEXT;

-- Create index for faster queries by name
CREATE INDEX IF NOT EXISTS idx_enquiries_student_name ON enquiries(student_name);

