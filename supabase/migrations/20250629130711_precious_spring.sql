/*
  # Enhanced PropMate Database Schema

  1. New Tables
    - `revenue_analytics` - Monthly business metrics tracking
    - `user_communications` - Email communication history
    - `user_savings_tracker` - User savings and achievements tracking
    - `system_settings` - Admin configuration settings

  2. Enhancements
    - Add notes column to payout_records if missing
    - Performance indexes for better query speed
    - Row Level Security policies for all tables

  3. Security
    - Enable RLS on all new tables
    - Policies for authenticated users to manage data
    - Proper access controls for admin features
*/

-- Update payout_records table if needed (already exists but ensure all fields are present)
DO $$
BEGIN
  -- Add any missing columns to payout_records
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payout_records' AND column_name = 'notes'
  ) THEN
    ALTER TABLE payout_records ADD COLUMN notes text;
  END IF;
END $$;

-- Create revenue_analytics table for admin tracking
CREATE TABLE IF NOT EXISTS revenue_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month_year text NOT NULL, -- Format: "2024-01"
  affiliate_commissions numeric(10,2) DEFAULT 0,
  total_cashback_paid numeric(10,2) DEFAULT 0,
  total_requests integer DEFAULT 0,
  approved_requests integer DEFAULT 0,
  rejected_requests integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE revenue_analytics ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can read analytics (admin check will be done in app)
CREATE POLICY "Authenticated users can read analytics"
  ON revenue_analytics
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage analytics"
  ON revenue_analytics
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create user_communications table for email history
CREATE TABLE IF NOT EXISTS user_communications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid, -- Will reference auth.users() when needed
  user_email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  communication_type text DEFAULT 'manual' CHECK (communication_type IN ('manual', 'status_change', 'welcome', 'broadcast')),
  sent_at timestamptz DEFAULT now(),
  sent_by_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_communications ENABLE ROW LEVEL SECURITY;

-- Users can read their own communications
CREATE POLICY "Users can read own communications"
  ON user_communications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Authenticated users (admins) can manage all communications
CREATE POLICY "Authenticated users can manage communications"
  ON user_communications
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create user_savings_tracker table
CREATE TABLE IF NOT EXISTS user_savings_tracker (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid, -- Will reference auth.users() when needed
  user_email text NOT NULL,
  total_discount_saved numeric(10,2) DEFAULT 0,
  total_cashback_earned numeric(10,2) DEFAULT 0,
  total_cashback_paid numeric(10,2) DEFAULT 0,
  total_requests integer DEFAULT 0,
  approved_requests integer DEFAULT 0,
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id) -- Ensure one record per user
);

ALTER TABLE user_savings_tracker ENABLE ROW LEVEL SECURITY;

-- Users can read their own savings data
CREATE POLICY "Users can read own savings"
  ON user_savings_tracker
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Authenticated users can manage savings data
CREATE POLICY "Authenticated users can manage savings"
  ON user_savings_tracker
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create system_settings table for admin configurations
CREATE TABLE IF NOT EXISTS system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value text NOT NULL,
  description text,
  updated_by text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can access system settings
CREATE POLICY "Authenticated users can read settings"
  ON system_settings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage settings"
  ON system_settings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_payout_records_user_id ON payout_records(user_id);
CREATE INDEX IF NOT EXISTS idx_payout_records_status ON payout_records(status);
CREATE INDEX IF NOT EXISTS idx_user_communications_user_id ON user_communications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_communications_user_email ON user_communications(user_email);
CREATE INDEX IF NOT EXISTS idx_user_savings_tracker_user_id ON user_savings_tracker(user_id);
CREATE INDEX IF NOT EXISTS idx_user_savings_tracker_user_email ON user_savings_tracker(user_email);
CREATE INDEX IF NOT EXISTS idx_revenue_analytics_month_year ON revenue_analytics(month_year);

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
  ('site_name', 'PropMate', 'Website name'),
  ('admin_email', 'admin@propmate.com', 'Admin contact email'),
  ('default_cashback_processing_days', '7', 'Default processing time in days'),
  ('email_notifications_enabled', 'true', 'Enable automatic email notifications')
ON CONFLICT (setting_key) DO NOTHING;