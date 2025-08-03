/*
  # Create payout records table for tracking payments

  1. New Tables
    - `payout_records`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `user_email` (text, for easy reference)
      - `cashback_submission_ids` (text[], array of submission IDs)
      - `payout_amount` (numeric, payment amount)
      - `crypto_wallet_address` (text, recipient wallet)
      - `transaction_hash` (text, blockchain transaction hash)
      - `payout_date` (timestamptz, when payment was made)
      - `status` (text, payment status)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `payout_records` table
    - Add policies for authenticated users and admins
*/

CREATE TABLE IF NOT EXISTS payout_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  user_email text NOT NULL,
  cashback_submission_ids text[] NOT NULL DEFAULT '{}',
  payout_amount numeric(10,2) NOT NULL DEFAULT 0,
  crypto_wallet_address text NOT NULL,
  transaction_hash text,
  payout_date timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT payout_records_status_check CHECK (status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text]))
);

ALTER TABLE payout_records ENABLE ROW LEVEL SECURITY;

-- Users can read their own payout records
CREATE POLICY "Users can read own payout records"
  ON payout_records
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Only authenticated users can read payout records (for admin functionality)
CREATE POLICY "Authenticated users can read all payout records"
  ON payout_records
  FOR SELECT
  TO authenticated
  USING (true);

-- Only authenticated users can insert payout records (for admin functionality)
CREATE POLICY "Authenticated users can insert payout records"
  ON payout_records
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only authenticated users can update payout records (for admin functionality)
CREATE POLICY "Authenticated users can update payout records"
  ON payout_records
  FOR UPDATE
  TO authenticated
  USING (true);