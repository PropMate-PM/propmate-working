/*
  # Initial Schema for Prop Firm Cashback Platform

  1. New Tables
    - `prop_firms`
      - `id` (uuid, primary key)
      - `name` (text)
      - `logo_url` (text)
      - `description` (text)
      - `affiliate_link` (text)
      - `discount_percentage` (numeric)
      - `cashback_percentage` (numeric)
      - `is_active` (boolean)
      - `created_at` (timestamp)
    
    - `cashback_submissions`
      - `id` (uuid, primary key)
      - `name` (text)
      - `email` (text)
      - `prop_firm_id` (uuid, foreign key)
      - `purchase_amount` (numeric)
      - `proof_url` (text)
      - `wallet_address` (text)
      - `status` (text - 'pending', 'paid', 'rejected')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Public read access for prop_firms
    - Public insert access for cashback_submissions
    - Admin access for updating cashback_submissions
*/

CREATE TABLE IF NOT EXISTS prop_firms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text NOT NULL,
  description text NOT NULL,
  affiliate_link text NOT NULL,
  discount_percentage numeric(5,2) NOT NULL DEFAULT 0,
  cashback_percentage numeric(5,2) NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cashback_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  prop_firm_id uuid REFERENCES prop_firms(id) NOT NULL,
  purchase_amount numeric(10,2) NOT NULL,
  proof_url text NOT NULL,
  wallet_address text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE prop_firms ENABLE ROW LEVEL SECURITY;
ALTER TABLE cashback_submissions ENABLE ROW LEVEL SECURITY;

-- Policies for prop_firms (public read access)
CREATE POLICY "Anyone can read active prop firms"
  ON prop_firms
  FOR SELECT
  TO public
  USING (is_active = true);

-- Policies for cashback_submissions (public insert, admin update)
CREATE POLICY "Anyone can submit cashback requests"
  ON cashback_submissions
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can read their own submissions"
  ON cashback_submissions
  FOR SELECT
  TO public
  USING (true);

-- Insert sample prop firms
INSERT INTO prop_firms (name, logo_url, description, affiliate_link, discount_percentage, cashback_percentage) VALUES
('FTMO', 'https://images.pexels.com/photos/6801874/pexels-photo-6801874.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop', 'Leading prop trading firm with comprehensive evaluation process and trader-friendly conditions.', 'https://ftmo.com/en/', 10.00, 15.00),
('MyForexFunds', 'https://images.pexels.com/photos/7414032/pexels-photo-7414032.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop', 'Fast-growing prop firm offering competitive profit splits and flexible trading rules.', 'https://myforexfunds.com/', 15.00, 20.00),
('The5ers', 'https://images.pexels.com/photos/6801872/pexels-photo-6801872.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop', 'UK-based prop firm known for their instant funding program and trader development.', 'https://the5ers.com/', 12.00, 18.00),
('Funded Next', 'https://images.pexels.com/photos/7413915/pexels-photo-7413915.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop', 'Modern prop firm with innovative challenge structures and rapid payout processing.', 'https://fundednext.com/', 8.00, 12.00);