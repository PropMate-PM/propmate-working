-- Lock down anonymous read access on cashback_submissions
-- Keep anon INSERT (from existing policy), remove anon SELECT

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'cashback_submissions' 
      AND policyname = 'Anonymous users can read submissions'
  ) THEN
    DROP POLICY "Anonymous users can read submissions" ON cashback_submissions;
  END IF;
END $$;


