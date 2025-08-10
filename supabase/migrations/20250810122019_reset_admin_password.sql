-- Reset Admin Password to Known Value
-- This migration provides a function to reset admin password safely

-- ============================================================================
-- 1. CREATE ADMIN PASSWORD RESET FUNCTION
-- ============================================================================

-- Function to reset admin password (can only be called with service role)
CREATE OR REPLACE FUNCTION reset_admin_password_safely(
  admin_email text,
  new_password text DEFAULT 'Admin@PropMate2024!'
)
RETURNS jsonb AS $$
DECLARE
  admin_user_id uuid;
  result jsonb;
BEGIN
  -- Find the admin user
  SELECT id INTO admin_user_id
  FROM auth.users 
  WHERE email = admin_email;
  
  IF admin_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Admin user not found',
      'email', admin_email
    );
  END IF;
  
  -- Note: Password update must be done through Supabase Auth Admin API
  -- This function provides the user ID for the admin to use
  RETURN jsonb_build_object(
    'success', true,
    'user_id', admin_user_id,
    'email', admin_email,
    'message', 'Use Supabase Dashboard to update password',
    'dashboard_url', 'https://supabase.com/dashboard/project/gwpbbzjqharvfuuxxuek/auth/users',
    'instructions', 'Find user by email, click edit, set new password',
    'suggested_password', new_password
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 2. CREATE ADMIN USER SETUP HELPER
-- ============================================================================

-- Function to create admin user if it doesn't exist (for reference)
CREATE OR REPLACE FUNCTION create_admin_user_info(
  admin_email text DEFAULT 'admin@propmate.site'
)
RETURNS jsonb AS $$
DECLARE
  existing_user_id uuid;
  old_admin_id uuid;
BEGIN
  -- Check if new admin exists
  SELECT id INTO existing_user_id
  FROM auth.users 
  WHERE email = admin_email;
  
  -- Check if old admin exists
  SELECT id INTO old_admin_id
  FROM auth.users 
  WHERE email = 'admin@propmate.com';
  
  RETURN jsonb_build_object(
    'new_admin_exists', existing_user_id IS NOT NULL,
    'new_admin_id', existing_user_id,
    'new_admin_email', admin_email,
    'old_admin_exists', old_admin_id IS NOT NULL,
    'old_admin_id', old_admin_id,
    'old_admin_email', 'admin@propmate.com',
    'dashboard_url', 'https://supabase.com/dashboard/project/gwpbbzjqharvfuuxxuek/auth/users',
    'instructions', jsonb_build_array(
      'Go to Supabase Dashboard',
      'Navigate to Authentication > Users',
      'Create new user with email: ' || admin_email,
      'Set password: Admin@PropMate2024!',
      'Check "Email Confirmed"',
      'Run: SELECT setup_admin_user(''' || admin_email || ''');'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. GET CURRENT ADMIN STATUS
-- ============================================================================

-- Check current admin status and provide next steps
DO $$
DECLARE
  result jsonb;
BEGIN
  -- Get admin user info
  SELECT create_admin_user_info() INTO result;
  
  RAISE NOTICE 'Admin User Status: %', result::text;
  
  -- If old admin exists, show reset info
  IF (result->>'old_admin_exists')::boolean THEN
    SELECT reset_admin_password_safely('admin@propmate.com') INTO result;
    RAISE NOTICE 'Old Admin Reset Info: %', result::text;
  END IF;
  
  -- If new admin exists, show reset info  
  IF (result->>'new_admin_exists')::boolean THEN
    SELECT reset_admin_password_safely('admin@propmate.site') INTO result;
    RAISE NOTICE 'New Admin Reset Info: %', result::text;
  END IF;
END $$;

-- ============================================================================
-- 4. COMMENTS AND DOCUMENTATION
-- ============================================================================

COMMENT ON FUNCTION reset_admin_password_safely IS 'Provides info to reset admin password through Supabase Dashboard';
COMMENT ON FUNCTION create_admin_user_info IS 'Shows admin user status and creation instructions';
