-- Test connection migration
-- This is a simple test to verify CLI connection is working

-- Create a simple test table to verify CLI can make changes
CREATE TABLE IF NOT EXISTS public.cli_test (
    id SERIAL PRIMARY KEY,
    test_message TEXT DEFAULT 'CLI connection successful',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add a comment to verify the test
COMMENT ON TABLE public.cli_test IS 'Test table created by Supabase CLI - connection verified';
