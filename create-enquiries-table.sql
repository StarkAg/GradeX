-- Create enquiries/searches table to track user searches
CREATE TABLE IF NOT EXISTS enquiries (
  id BIGSERIAL PRIMARY KEY,
  register_number TEXT NOT NULL,
  search_date TEXT, -- Date user searched for (e.g., "18/11/2025" or "today")
  searched_at TIMESTAMPTZ DEFAULT NOW(),
  results_found BOOLEAN DEFAULT false,
  result_count INTEGER DEFAULT 0,
  campuses TEXT[], -- Array of campus names where results were found
  use_live_api BOOLEAN DEFAULT true, -- Whether they used live API or static data
  error_message TEXT, -- If there was an error
  ip_address TEXT, -- Optional: for analytics
  user_agent TEXT, -- Optional: for analytics
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_enquiries_register_number ON enquiries(register_number);
CREATE INDEX IF NOT EXISTS idx_enquiries_searched_at ON enquiries(searched_at DESC);
CREATE INDEX IF NOT EXISTS idx_enquiries_results_found ON enquiries(results_found);

-- Enable Row Level Security
ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public insert access" ON enquiries;
DROP POLICY IF EXISTS "Allow admin read access" ON enquiries;
DROP POLICY IF EXISTS "Enable insert for all users" ON enquiries;
DROP POLICY IF EXISTS "Enable insert for anonymous users" ON enquiries;

-- Create policy to allow inserts from anyone (including anonymous users)
-- This is needed for the API endpoint to log enquiries
CREATE POLICY "Allow public insert access" ON enquiries
  FOR INSERT
  TO anon, authenticated, public
  WITH CHECK (true);

-- Allow reads only with service role key (admin queries via service role)
-- Anonymous users cannot read (for privacy)
CREATE POLICY "Allow admin read access" ON enquiries
  FOR SELECT
  TO service_role
  USING (true);

