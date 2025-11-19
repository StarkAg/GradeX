-- BEST FIX: This should definitely work
-- Copy and run this ENTIRE script in Supabase SQL Editor

-- First, check if table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables 
               WHERE table_schema = 'public' 
               AND table_name = 'enquiries') THEN
        
        -- Disable RLS temporarily
        ALTER TABLE enquiries DISABLE ROW LEVEL SECURITY;
        
        -- Drop all existing policies
        DROP POLICY IF EXISTS "Allow public insert access" ON enquiries;
        DROP POLICY IF EXISTS "Allow admin read access" ON enquiries;
        DROP POLICY IF EXISTS "enquiries_insert_policy" ON enquiries;
        DROP POLICY IF EXISTS "enquiries_select_policy" ON enquiries;
        
        -- Re-enable RLS
        ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;
        
        -- Create INSERT policy - try both approaches
        -- Approach 1: Using 'public' role (most permissive)
        BEGIN
            CREATE POLICY "Allow public insert access" ON enquiries
                FOR INSERT
                TO public
                WITH CHECK (true);
        EXCEPTION WHEN duplicate_object THEN
            -- Policy already exists, drop and recreate
            DROP POLICY IF EXISTS "Allow public insert access" ON enquiries;
            CREATE POLICY "Allow public insert access" ON enquiries
                FOR INSERT
                TO public
                WITH CHECK (true);
        END;
        
        -- Also create one for 'anon' role specifically (more explicit)
        BEGIN
            CREATE POLICY "Allow anon insert access" ON enquiries
                FOR INSERT
                TO anon
                WITH CHECK (true);
        EXCEPTION WHEN duplicate_object THEN
            DROP POLICY IF EXISTS "Allow anon insert access" ON enquiries;
            CREATE POLICY "Allow anon insert access" ON enquiries
                FOR INSERT
                TO anon
                WITH CHECK (true);
        END;
        
        RAISE NOTICE 'Policies created successfully';
    ELSE
        RAISE NOTICE 'Table "enquiries" does not exist. Please create it first using create-enquiries-table.sql';
    END IF;
END $$;

-- Verify policies were created
SELECT 
    policyname,
    roles,
    cmd,
    with_check
FROM pg_policies 
WHERE tablename = 'enquiries';

