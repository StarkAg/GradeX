-- Query enquiries table with IST timezone
-- Run this in Supabase SQL Editor to see timestamps in IST

-- Set timezone to IST for this session
SET timezone = 'Asia/Kolkata';

-- Query enquiries with IST timestamps
SELECT 
  id,
  register_number,
  student_name,
  search_date,
  searched_at, -- Will show in IST
  created_at,  -- Will show in IST
  results_found,
  result_count,
  campuses
FROM enquiries
ORDER BY searched_at DESC
LIMIT 100;

-- To see both UTC and IST:
SELECT 
  id,
  register_number,
  searched_at as searched_at_utc,
  searched_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata' as searched_at_ist,
  to_char(searched_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata', 'DD/MM/YYYY HH24:MI:SS') as ist_formatted
FROM enquiries
ORDER BY searched_at DESC;

