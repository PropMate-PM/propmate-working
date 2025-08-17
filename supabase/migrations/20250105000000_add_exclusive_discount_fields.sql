/*
  # Add exclusive discount fields to prop firms

  1. Changes
    - Add `exclusive_discount_percent` column (integer, nullable)
    - Add `exclusive_coupon_code` column (text, nullable)
    - These fields are optional and only used for firms with exclusive discounts

  2. Security
    - Maintains existing RLS policies
    - No breaking changes to existing functionality
*/

-- Add exclusive_discount_percent column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prop_firms' AND column_name = 'exclusive_discount_percent'
  ) THEN
    ALTER TABLE prop_firms ADD COLUMN exclusive_discount_percent integer;
  END IF;
END $$;

-- Add exclusive_coupon_code column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prop_firms' AND column_name = 'exclusive_coupon_code'
  ) THEN
    ALTER TABLE prop_firms ADD COLUMN exclusive_coupon_code text;
  END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN prop_firms.exclusive_discount_percent IS 'Exclusive discount percentage (e.g., 15 for 15% off) - nullable, only for firms with exclusive discounts';
COMMENT ON COLUMN prop_firms.exclusive_coupon_code IS 'Exclusive coupon code (e.g., "PROFARM15") - nullable, only for firms with exclusive discounts';


