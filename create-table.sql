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
