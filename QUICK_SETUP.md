# Quick Supabase Setup

## Step 1: Create the Table

1. Go to: https://supabase.com/dashboard/project/phlggcheaajkupppozho/sql/new

2. Paste this SQL and click "Run":

```sql
CREATE TABLE IF NOT EXISTS students (
  id BIGSERIAL PRIMARY KEY,
  register_number TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_students_register_number ON students(register_number);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Allow public read access" ON students
  FOR SELECT
  USING (true);
```

3. You should see "Success. No rows returned"

## Step 2: Upload Data

Run this command:

```bash
node setup-supabase-table.js
```

Or use the upload script:

```bash
export SUPABASE_URL="https://phlggcheaajkupppozho.supabase.co"
export SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobGdnY2hlYWFqa3VwcHBvemhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyODQ0NTgsImV4cCI6MjA3ODg2MDQ1OH0.TGEDpm2uqKceOxAMB5aG6fd8uHESmwfdKF-cqm2QU84"
node upload-to-supabase.js
```

## Step 3: Set Vercel Environment Variables

In Vercel dashboard → Settings → Environment Variables, add:

- `SUPABASE_URL` = `https://phlggcheaajkupppozho.supabase.co`
- `SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobGdnY2hlYWFqa3VwcHBvemhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyODQ0NTgsImV4cCI6MjA3ODg2MDQ1OH0.TGEDpm2uqKceOxAMB5aG6fd8uHESmwfdKF-cqm2QU84`

## Done! 

The app will now use Supabase instead of JSON files.

