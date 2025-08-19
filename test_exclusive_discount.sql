-- Test script to verify exclusive discount fields are working
-- This will add test data to verify the new fields

-- First, let's check if the fields exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'prop_firms' 
AND column_name IN ('exclusive_discount_percent', 'exclusive_coupon_code')
ORDER BY column_name;

-- Add test exclusive discount to FTMO (if it exists)
UPDATE prop_firms 
SET exclusive_discount_percent = 15, exclusive_coupon_code = 'PROFARM15'
WHERE name = 'FTMO';

-- Add test exclusive discount to MyForexFunds (if it exists)
UPDATE prop_firms 
SET exclusive_discount_percent = 20, exclusive_coupon_code = 'MYFOREX20'
WHERE name = 'MyForexFunds';

-- Show the updated data
SELECT name, exclusive_discount_percent, exclusive_coupon_code 
FROM prop_firms 
WHERE exclusive_discount_percent IS NOT NULL 
OR exclusive_coupon_code IS NOT NULL;




