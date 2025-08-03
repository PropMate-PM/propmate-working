/*
  # Add user_id to cashback_submissions

  1. Changes
    - Add optional user_id column to cashback_submissions table
    - Add foreign key constraint to auth.users
    - Update RLS policies to allow users to see their own submissions

  2. Security
    - Users can only see their own submissions when logged in
    - Maintains backward compatibility for anonymous submissions
*/

-- Add user_id column to cashback_submissions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cashback_submissions' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE cashback_submissions ADD COLUMN user_id uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Update RLS policies
DROP POLICY IF EXISTS "Anyone can read their own submissions" ON cashback_submissions;

CREATE POLICY "Users can read their own submissions"
  ON cashback_submissions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anonymous users can read all submissions"
  ON cashback_submissions
  FOR SELECT
  TO anon
  USING (true);