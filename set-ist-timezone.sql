-- Set database timezone to IST (Indian Standard Time)
-- This will make all TIMESTAMPTZ columns default to IST
-- Run this in Supabase SQL Editor

-- Set timezone to Asia/Kolkata (IST)
SET timezone = 'Asia/Kolkata';

-- Verify timezone setting
SHOW timezone;

-- Note: For existing records, timestamps are already stored in UTC
-- New records will be stored in IST automatically after this setting
-- To update existing records to IST, you can run:
-- UPDATE enquiries 
-- SET searched_at = searched_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata',
--     created_at = created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata';

