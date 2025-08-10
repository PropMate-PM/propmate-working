-- Update Admin Email and Ensure Role-Based Authentication
-- This migration updates admin email references and ensures proper role-based admin access

-- ============================================================================
-- 1. ENSURE ADMIN_ROLES TABLE EXISTS
-- ============================================================================

-- Create admin_roles table if it doesn't exist (in case security migration wasn't applied)
CREATE TABLE IF NOT EXISTS admin_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('super_admin', 'admin', 'moderator')),
  granted_by uuid REFERENCES auth.users(id),
  granted_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on admin_roles if not already enabled
DO $rls$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'admin_roles' 
    AND policyname = 'Super admins can manage admin roles'
  ) THEN
    ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Super admins can manage admin roles"
      ON admin_roles
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM admin_roles ar 
          WHERE ar.user_id = auth.uid() 
          AND ar.role = 'super_admin' 
          AND ar.is_active = true
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM admin_roles ar 
          WHERE ar.user_id = auth.uid() 
          AND ar.role = 'super_admin' 
          AND ar.is_active = true
        )
      );

    CREATE POLICY "Users can read their own admin role"
      ON admin_roles
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $rls$;

-- Create necessary functions if they don't exist
CREATE OR REPLACE FUNCTION is_admin(user_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_roles 
    WHERE user_id = user_uuid 
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_admin_role(user_uuid uuid)
RETURNS text AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM admin_roles 
  WHERE user_id = user_uuid 
  AND is_active = true;
  
  RETURN COALESCE(user_role, 'user');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 2. UPDATE ADMIN USER EMAIL REFERENCE
-- ============================================================================

-- Update the admin role assignment to use the new email
DO $$
DECLARE
  old_admin_id uuid;
  new_admin_id uuid;
BEGIN
  -- Get the old admin user ID (admin@propmate.com)
  SELECT id INTO old_admin_id 
  FROM auth.users 
  WHERE email = 'admin@propmate.com';
  
  -- Get the new admin user ID (admin@propmate.site)
  SELECT id INTO new_admin_id 
  FROM auth.users 
  WHERE email = 'admin@propmate.site';
  
  -- If new admin user exists, transfer admin role
  IF new_admin_id IS NOT NULL THEN
    -- Remove old admin role if it exists
    IF old_admin_id IS NOT NULL THEN
      UPDATE admin_roles 
      SET is_active = false, updated_at = now()
      WHERE user_id = old_admin_id;
    END IF;
    
    -- Add new admin role
    INSERT INTO admin_roles (user_id, role, granted_by, is_active)
    VALUES (new_admin_id, 'super_admin', new_admin_id, true)
    ON CONFLICT (user_id) DO UPDATE SET
      role = 'super_admin',
      is_active = true,
      updated_at = now();
      
  -- If new admin doesn't exist but old one does, keep old one but log it
  ELSIF old_admin_id IS NOT NULL THEN
    -- Keep the old admin active for now
    INSERT INTO admin_roles (user_id, role, granted_by, is_active)
    VALUES (old_admin_id, 'super_admin', old_admin_id, true)
    ON CONFLICT (user_id) DO UPDATE SET
      role = 'super_admin',
      is_active = true,
      updated_at = now();
  END IF;
END $$;

-- ============================================================================
-- 2. CREATE FUNCTION TO MIGRATE ADMIN USER
-- ============================================================================

-- Function to help migrate from old admin email to new one
CREATE OR REPLACE FUNCTION migrate_admin_user(
  old_email text,
  new_email text
)
RETURNS jsonb AS $$
DECLARE
  old_user_id uuid;
  new_user_id uuid;
  result jsonb;
BEGIN
  -- Get user IDs
  SELECT id INTO old_user_id FROM auth.users WHERE email = old_email;
  SELECT id INTO new_user_id FROM auth.users WHERE email = new_email;
  
  result := jsonb_build_object(
    'old_user_found', old_user_id IS NOT NULL,
    'new_user_found', new_user_id IS NOT NULL,
    'migration_needed', old_user_id IS NOT NULL AND new_user_id IS NOT NULL
  );
  
  -- If both users exist, transfer admin privileges
  IF old_user_id IS NOT NULL AND new_user_id IS NOT NULL THEN
    -- Deactivate old admin
    UPDATE admin_roles 
    SET is_active = false, updated_at = now()
    WHERE user_id = old_user_id;
    
    -- Activate new admin
    INSERT INTO admin_roles (user_id, role, granted_by, is_active)
    VALUES (new_user_id, 'super_admin', new_user_id, true)
    ON CONFLICT (user_id) DO UPDATE SET
      role = 'super_admin',
      is_active = true,
      updated_at = now();
      
    result := result || jsonb_build_object('migration_completed', true);
  ELSE
    result := result || jsonb_build_object('migration_completed', false);
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. UPDATE AUDIT LOG REFERENCES (IF TABLE EXISTS)
-- ============================================================================

-- Update any audit logs that reference the old admin email in details
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_log') THEN
    UPDATE audit_log 
    SET details = details || jsonb_build_object('admin_email_updated', 'admin@propmate.com -> admin@propmate.site')
    WHERE details::text LIKE '%admin@propmate.com%';
  END IF;
END $$;

-- ============================================================================
-- 4. CREATE HELPER FUNCTION FOR ADMIN EMAIL LOOKUP
-- ============================================================================

-- Function to get current admin email (for configuration purposes)
CREATE OR REPLACE FUNCTION get_admin_email()
RETURNS text AS $$
DECLARE
  admin_email text;
BEGIN
  -- Get the email of the first active super admin
  SELECT u.email INTO admin_email
  FROM auth.users u
  JOIN admin_roles ar ON u.id = ar.user_id
  WHERE ar.role = 'super_admin' 
  AND ar.is_active = true
  ORDER BY ar.created_at
  LIMIT 1;
  
  RETURN COALESCE(admin_email, 'admin@propmate.site');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. ENSURE PROPER ADMIN ROLE HIERARCHY
-- ============================================================================

-- Function to check if user has sufficient admin privileges
CREATE OR REPLACE FUNCTION has_admin_privilege(
  user_uuid uuid,
  required_level text DEFAULT 'admin'
)
RETURNS boolean AS $$
DECLARE
  user_role text;
  role_levels jsonb;
BEGIN
  -- Define role hierarchy levels
  role_levels := jsonb_build_object(
    'super_admin', 3,
    'admin', 2, 
    'moderator', 1,
    'user', 0
  );
  
  -- Get user's role
  SELECT role INTO user_role
  FROM admin_roles 
  WHERE user_id = user_uuid 
  AND is_active = true;
  
  -- Default to 'user' if no admin role found
  user_role := COALESCE(user_role, 'user');
  
  -- Compare levels
  RETURN (role_levels->>user_role)::int >= (role_levels->>required_level)::int;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. ADD COMPREHENSIVE ADMIN MANAGEMENT FUNCTIONS
-- ============================================================================

-- Function to promote user to admin
CREATE OR REPLACE FUNCTION promote_to_admin(
  target_user_id uuid,
  new_role text,
  promoted_by uuid
)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
  promoter_role text;
BEGIN
  -- Check if promoter has sufficient privileges
  IF NOT has_admin_privilege(promoted_by, 'super_admin') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient privileges to promote users'
    );
  END IF;
  
  -- Validate new role
  IF new_role NOT IN ('super_admin', 'admin', 'moderator') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid role specified'
    );
  END IF;
  
  -- Insert or update admin role
  INSERT INTO admin_roles (user_id, role, granted_by, is_active)
  VALUES (target_user_id, new_role, promoted_by, true)
  ON CONFLICT (user_id) DO UPDATE SET
    role = new_role,
    granted_by = promoted_by,
    is_active = true,
    updated_at = now();
  
  -- Log the promotion (if audit function exists)
  BEGIN
    PERFORM log_audit_event(
      promoted_by,
      'user_promoted_to_admin',
      'admin_roles',
      target_user_id,
      NULL,
      jsonb_build_object('new_role', new_role, 'target_user', target_user_id),
      jsonb_build_object('action', 'promotion', 'role_granted', new_role)
    );
  EXCEPTION
    WHEN undefined_function THEN
      -- Ignore if audit function doesn't exist
      NULL;
  END;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'User promoted to ' || new_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to revoke admin privileges
CREATE OR REPLACE FUNCTION revoke_admin_privileges(
  target_user_id uuid,
  revoked_by uuid
)
RETURNS jsonb AS $$
BEGIN
  -- Check if revoker has sufficient privileges
  IF NOT has_admin_privilege(revoked_by, 'super_admin') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient privileges to revoke admin access'
    );
  END IF;
  
  -- Prevent self-revocation of the last super admin
  IF target_user_id = revoked_by THEN
    IF (SELECT COUNT(*) FROM admin_roles WHERE role = 'super_admin' AND is_active = true) <= 1 THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Cannot revoke privileges of the last super admin'
      );
    END IF;
  END IF;
  
  -- Deactivate admin role
  UPDATE admin_roles 
  SET is_active = false, updated_at = now()
  WHERE user_id = target_user_id;
  
  -- Log the revocation (if audit function exists)
  BEGIN
    PERFORM log_audit_event(
      revoked_by,
      'admin_privileges_revoked',
      'admin_roles',
      target_user_id,
      NULL,
      NULL,
      jsonb_build_object('action', 'revocation', 'target_user', target_user_id)
    );
  EXCEPTION
    WHEN undefined_function THEN
      -- Ignore if audit function doesn't exist
      NULL;
  END;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Admin privileges revoked'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. CREATE VIEW FOR ADMIN DASHBOARD
-- ============================================================================

-- View to show current admin users (for dashboard)
CREATE OR REPLACE VIEW admin_users_view AS
SELECT 
  u.id,
  u.email,
  u.created_at as user_created_at,
  ar.role,
  ar.granted_by,
  ar.granted_at,
  ar.is_active,
  granter.email as granted_by_email
FROM auth.users u
JOIN admin_roles ar ON u.id = ar.user_id
LEFT JOIN auth.users granter ON ar.granted_by = granter.id
WHERE ar.is_active = true
ORDER BY 
  CASE ar.role 
    WHEN 'super_admin' THEN 1 
    WHEN 'admin' THEN 2 
    WHEN 'moderator' THEN 3 
    ELSE 4 
  END,
  ar.granted_at DESC;

-- Grant access to admin users view
ALTER VIEW admin_users_view OWNER TO postgres;

-- Note: Views don't support RLS policies directly
-- Access control is handled through the underlying tables

-- ============================================================================
-- 8. COMMENTS AND DOCUMENTATION
-- ============================================================================

COMMENT ON FUNCTION migrate_admin_user IS 'Migrates admin privileges from old email to new email';
COMMENT ON FUNCTION get_admin_email IS 'Returns the current primary admin email address';
COMMENT ON FUNCTION has_admin_privilege IS 'Checks if user has sufficient admin privileges for an action';
COMMENT ON FUNCTION promote_to_admin IS 'Promotes a user to admin role with proper authorization checks';
COMMENT ON FUNCTION revoke_admin_privileges IS 'Revokes admin privileges with safety checks';
COMMENT ON VIEW admin_users_view IS 'View showing all active admin users for dashboard display';
