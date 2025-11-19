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

-- Create policy to allow inserts from anyone (for logging)
-- But only allow reads with service role key (admin only)
DROP POLICY IF EXISTS "Allow public insert access" ON enquiries;
CREATE POLICY "Allow public insert access" ON enquiries
  FOR INSERT
  WITH CHECK (true);

-- Only allow select with service role (admin queries)
DROP POLICY IF EXISTS "Allow admin read access" ON enquiries;
CREATE POLICY "Allow admin read access" ON enquiries
  FOR SELECT
  USING (false); -- This prevents anonymous reads, only service role can read

