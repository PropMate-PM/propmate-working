-- Add total_pending_cashback column to user_savings_tracker table
ALTER TABLE user_savings_tracker 
ADD COLUMN IF NOT EXISTS total_pending_cashback numeric(10,2) DEFAULT 0;

-- Update existing records to have 0 for total_pending_cashback if NULL
UPDATE user_savings_tracker 
SET total_pending_cashback = 0 
WHERE total_pending_cashback IS NULL;
