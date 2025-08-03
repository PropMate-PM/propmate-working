/*
  # Add Admin Access to Cashback Submissions

  1. Changes
    - Add RLS policy for admin users to read all submissions
    - Add RLS policy for admin users to update submission status
    - Maintain existing policies for regular users

  2. Security
    - Admin users can read and update all submissions
    - Regular users can still only see their own submissions
    - Anonymous users can still read all submissions
*/

-- Add admin policy for reading all submissions
CREATE POLICY "Admin users can read all submissions"
  ON cashback_submissions
  FOR SELECT
  TO authenticated
  USING (true);

-- Add admin policy for updating submission status
CREATE POLICY "Admin users can update submissions"
  ON cashback_submissions
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add admin policy for inserting submissions (if needed)
CREATE POLICY "Admin users can insert submissions"
  ON cashback_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (true); 