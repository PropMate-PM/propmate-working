-- Create Admin User Properly
-- This migration ensures the admin user exists and has proper credentials

-- ============================================================================
-- 1. CHECK AND DISPLAY CURRENT ADMIN USERS
-- ============================================================================

-- Function to check current admin users
CREATE OR REPLACE FUNCTION check_admin_users()
RETURNS TABLE (
  user_id uuid,
  email text,
  email_confirmed boolean,
  has_admin_role boolean,
  admin_role text,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email::text,
    u.email_confirmed_at IS NOT NULL as email_confirmed,
    ar.user_id IS NOT NULL as has_admin_role,
    COALESCE(ar.role, 'none')::text as admin_role,
    u.created_at
  FROM auth.users u
  LEFT JOIN admin_roles ar ON u.id = ar.user_id AND ar.is_active = true
  WHERE u.email IN ('admin@propmate.site', 'admin@propmate.com')
  ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 2. CREATE FUNCTION TO SETUP ADMIN USER
-- ============================================================================

-- Function to create admin user with service role (to be called from application)
CREATE OR REPLACE FUNCTION setup_admin_user(
  admin_email text,
  admin_password text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  existing_user_id uuid;
  result jsonb;
BEGIN
  -- Check if user already exists
  SELECT id INTO existing_user_id
  FROM auth.users 
  WHERE email = admin_email;
  
  IF existing_user_id IS NOT NULL THEN
    -- User exists, just assign admin role
    INSERT INTO admin_roles (user_id, role, granted_by, is_active)
    VALUES (existing_user_id, 'super_admin', existing_user_id, true)
    ON CONFLICT (user_id) DO UPDATE SET
      role = 'super_admin',
      is_active = true,
      updated_at = now();
    
    result := jsonb_build_object(
      'success', true,
      'action', 'role_assigned',
      'user_id', existing_user_id,
      'email', admin_email,
      'message', 'Admin role assigned to existing user'
    );
  ELSE
    -- User doesn't exist, return info for manual creation
    result := jsonb_build_object(
      'success', false,
      'action', 'user_not_found',
      'email', admin_email,
      'message', 'User does not exist. Create user first through Supabase Auth, then assign role.'
    );
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. CREATE FUNCTION TO RESET ADMIN PASSWORD (for existing users)
-- ============================================================================

-- Function to help with admin password reset
CREATE OR REPLACE FUNCTION get_admin_reset_info(admin_email text)
RETURNS jsonb AS $$
DECLARE
  user_info jsonb;
  user_id uuid;
BEGIN
  SELECT id INTO user_id
  FROM auth.users 
  WHERE email = admin_email;
  
  IF user_id IS NOT NULL THEN
    user_info := jsonb_build_object(
      'user_exists', true,
      'user_id', user_id,
      'email', admin_email,
      'reset_instructions', 'Use Supabase Dashboard to reset password or update user',
      'dashboard_url', 'https://supabase.com/dashboard/project/gwpbbzjqharvfuuxxuek/auth/users'
    );
  ELSE
    user_info := jsonb_build_object(
      'user_exists', false,
      'email', admin_email,
      'instructions', 'User needs to be created first'
    );
  END IF;
  
  RETURN user_info;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. SETUP INITIAL ADMIN USER IF EXISTS
-- ============================================================================

-- Try to setup admin role for any existing admin users
DO $$
DECLARE
  admin_user_id uuid;
  old_admin_id uuid;
BEGIN
  -- Check for new admin email
  SELECT id INTO admin_user_id
  FROM auth.users 
  WHERE email = 'admin@propmate.site';
  
  -- Check for old admin email
  SELECT id INTO old_admin_id
  FROM auth.users 
  WHERE email = 'admin@propmate.com';
  
  -- If new admin exists, make them super admin
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO admin_roles (user_id, role, granted_by, is_active)
    VALUES (admin_user_id, 'super_admin', admin_user_id, true)
    ON CONFLICT (user_id) DO UPDATE SET
      role = 'super_admin',
      is_active = true,
      updated_at = now();
    
    RAISE NOTICE 'Admin role assigned to admin@propmate.site';
  END IF;
  
  -- If old admin exists and new one doesn't, keep old one active
  IF old_admin_id IS NOT NULL AND admin_user_id IS NULL THEN
    INSERT INTO admin_roles (user_id, role, granted_by, is_active)
    VALUES (old_admin_id, 'super_admin', old_admin_id, true)
    ON CONFLICT (user_id) DO UPDATE SET
      role = 'super_admin',
      is_active = true,
      updated_at = now();
    
    RAISE NOTICE 'Admin role maintained for admin@propmate.com';
  END IF;
  
  -- If both exist, deactivate old admin
  IF old_admin_id IS NOT NULL AND admin_user_id IS NOT NULL THEN
    UPDATE admin_roles 
    SET is_active = false, updated_at = now()
    WHERE user_id = old_admin_id;
    
    RAISE NOTICE 'Transferred admin role from old to new email';
  END IF;
END $$;

-- ============================================================================
-- 5. COMMENTS AND DOCUMENTATION
-- ============================================================================

COMMENT ON FUNCTION check_admin_users IS 'Shows current admin users and their roles';
COMMENT ON FUNCTION setup_admin_user IS 'Sets up admin role for existing user';
COMMENT ON FUNCTION get_admin_reset_info IS 'Provides information for admin password reset';
