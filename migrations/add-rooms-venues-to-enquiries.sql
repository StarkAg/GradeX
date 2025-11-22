-- Migration: Add rooms and venues columns to enquiries table
-- Run this in Supabase SQL Editor to add room and venue tracking

-- Add rooms column (array of text)
ALTER TABLE enquiries 
ADD COLUMN IF NOT EXISTS rooms TEXT[] DEFAULT '{}';

-- Add venues column (array of text)
ALTER TABLE enquiries 
ADD COLUMN IF NOT EXISTS venues TEXT[] DEFAULT '{}';

-- Add comments for documentation
COMMENT ON COLUMN enquiries.rooms IS 'Array of room numbers where student has exams (e.g., ["TP-401", "TP-1206"])';
COMMENT ON COLUMN enquiries.venues IS 'Array of venue/building names (e.g., ["Tech Park", "Main Campus"])';

-- Verify the columns were added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'enquiries'
  AND column_name IN ('rooms', 'venues');

