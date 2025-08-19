-- Verify that the exclusive discount fields were successfully added
-- Run this in your Supabase SQL Editor to confirm the migration worked

-- Check if the new columns exist
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'prop_firms' 
AND column_name IN ('exclusive_discount_percent', 'exclusive_coupon_code')
ORDER BY column_name;

-- Show current prop firms data structure
SELECT 
    name,
    cashback_percentage,
    exclusive_discount_percent,
    exclusive_coupon_code
FROM prop_firms 
LIMIT 5;




