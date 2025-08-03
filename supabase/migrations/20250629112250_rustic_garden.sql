/*
  # Add categories and first-time customer fields to prop firms

  1. Changes
    - Add `category` column to prop_firms table (futures/forex)
    - Add `is_first_time_offer` boolean column
    - Update existing prop firms with appropriate categories and first-time offers

  2. Security
    - Maintains existing RLS policies
    - No breaking changes to existing functionality
*/

-- Add new columns to prop_firms table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prop_firms' AND column_name = 'category'
  ) THEN
    ALTER TABLE prop_firms ADD COLUMN category text NOT NULL DEFAULT 'forex' CHECK (category IN ('futures', 'forex'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prop_firms' AND column_name = 'is_first_time_offer'
  ) THEN
    ALTER TABLE prop_firms ADD COLUMN is_first_time_offer boolean DEFAULT false;
  END IF;
END $$;

-- Update existing prop firms with categories and first-time offers
UPDATE prop_firms SET 
  category = 'forex',
  is_first_time_offer = true
WHERE name = 'FTMO';

UPDATE prop_firms SET 
  category = 'forex',
  is_first_time_offer = true
WHERE name = 'MyForexFunds';

UPDATE prop_firms SET 
  category = 'futures',
  is_first_time_offer = false
WHERE name = 'The5ers';

UPDATE prop_firms SET 
  category = 'futures',
  is_first_time_offer = true
WHERE name = 'Funded Next';

-- Add some additional sample firms for better demonstration
INSERT INTO prop_firms (name, logo_url, description, affiliate_link, discount_percentage, cashback_percentage, category, is_first_time_offer) VALUES
('TopStep', 'https://images.pexels.com/photos/6801873/pexels-photo-6801873.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop', 'Leading futures prop trading firm with comprehensive training programs and trader support.', 'https://topsteptrader.com/', 20.00, 15.00, 'futures', true),
('Apex Trader Funding', 'https://images.pexels.com/photos/7414033/pexels-photo-7414033.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop', 'Fast-growing futures prop firm offering competitive profit splits and flexible evaluation process.', 'https://apextraderfunding.com/', 15.00, 18.00, 'futures', false),
('Prop Firm X', 'https://images.pexels.com/photos/6801875/pexels-photo-6801875.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop', 'Innovative forex prop firm with instant funding options and trader-friendly conditions.', 'https://propfirmx.com/', 12.00, 20.00, 'forex', false);