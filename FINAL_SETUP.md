# Final Setup Instructions

## Step 1: Create Table (Required - Do This First)

1. Go to: **https://supabase.com/dashboard/project/phlggcheaajkupppozho/sql/new**

2. Copy and paste this SQL (copy ONLY the SQL, not the markdown code blocks):

CREATE TABLE IF NOT EXISTS students (
  id BIGSERIAL PRIMARY KEY,
  register_number TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_students_register_number ON students(register_number);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON students;
CREATE POLICY "Allow public read access" ON students
  FOR SELECT
  USING (true);

3. Click **"Run"**

4. Wait for "Success" message

## Step 2: Run Automated Script

After creating the table, run:

```bash
node do-everything.js
```

This will:
- ✅ Check if table is accessible
- ✅ Upload all student data (6,176 records)
- ✅ Set Vercel environment variables
- ✅ Verify everything is working

## Step 3: Verify

Check your Supabase dashboard to see the uploaded records.

## Done!

Your app will now use Supabase instead of JSON files.

