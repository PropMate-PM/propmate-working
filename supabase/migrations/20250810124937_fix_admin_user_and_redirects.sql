-- Fix admin user and check what users exist
-- This migration will help identify why admin@propmate.site doesn't receive emails

DO $$ 
DECLARE
    old_admin_id uuid;
    new_admin_id uuid;
    user_record record;
BEGIN
    -- Check what admin users currently exist
    RAISE NOTICE '=== CHECKING EXISTING ADMIN USERS ===';
    
    FOR user_record IN 
        SELECT u.id, u.email, u.created_at, u.email_confirmed_at,
               CASE WHEN ar.role IS NOT NULL THEN ar.role ELSE 'no_role' END as admin_role
        FROM auth.users u
        LEFT JOIN admin_roles ar ON u.id = ar.user_id AND ar.is_active = true
        WHERE u.email LIKE '%propmate%' OR u.email LIKE '%admin%'
        ORDER BY u.created_at DESC
    LOOP
        RAISE NOTICE 'User: % | ID: % | Role: % | Email Confirmed: % | Created: %', 
            user_record.email, 
            user_record.id, 
            user_record.admin_role,
            CASE WHEN user_record.email_confirmed_at IS NOT NULL THEN 'YES' ELSE 'NO' END,
            user_record.created_at;
    END LOOP;
    
    -- Check for old admin email
    SELECT id INTO old_admin_id
    FROM auth.users 
    WHERE email = 'admin@propmate.com';
    
    -- Check for new admin email
    SELECT id INTO new_admin_id
    FROM auth.users 
    WHERE email = 'admin@propmate.site';
    
    RAISE NOTICE '=== ADMIN USER STATUS ===';
    RAISE NOTICE 'admin@propmate.com exists: %', CASE WHEN old_admin_id IS NOT NULL THEN 'YES' ELSE 'NO' END;
    RAISE NOTICE 'admin@propmate.site exists: %', CASE WHEN new_admin_id IS NOT NULL THEN 'YES' ELSE 'NO' END;
    
    -- If admin@propmate.site doesn't exist, we need to create it
    IF new_admin_id IS NULL THEN
        RAISE NOTICE '=== CREATING admin@propmate.site USER ===';
        RAISE NOTICE 'The user admin@propmate.site does not exist in auth.users table.';
        RAISE NOTICE 'This is why password reset emails are not sent for this email.';
        RAISE NOTICE '';
        RAISE NOTICE 'TO FIX THIS, you have two options:';
        RAISE NOTICE '';
        RAISE NOTICE 'OPTION 1: Create the user via Supabase Dashboard';
        RAISE NOTICE '1. Go to: https://supabase.com/dashboard/project/gwpbbzjqharvfuuxxuek/auth/users';
        RAISE NOTICE '2. Click "Add User"';
        RAISE NOTICE '3. Email: admin@propmate.site';
        RAISE NOTICE '4. Password: Admin@PropMate2024!';
        RAISE NOTICE '5. Check "Email Confirmed"';
        RAISE NOTICE '6. Save';
        RAISE NOTICE '';
        RAISE NOTICE 'OPTION 2: Sign up normally on your website';
        RAISE NOTICE '1. Go to your website';
        RAISE NOTICE '2. Click "Sign Up"';
        RAISE NOTICE '3. Use email: admin@propmate.site';
        RAISE NOTICE '4. Complete signup process';
        RAISE NOTICE '';
    ELSE
        RAISE NOTICE 'admin@propmate.site user exists with ID: %', new_admin_id;
        
        -- Check if they have admin role
        IF EXISTS(SELECT 1 FROM admin_roles WHERE user_id = new_admin_id AND is_active = true) THEN
            RAISE NOTICE 'admin@propmate.site already has admin role assigned';
        ELSE
            -- Assign admin role
            INSERT INTO admin_roles (user_id, role, assigned_by, created_at, updated_at, is_active)
            VALUES (new_admin_id, 'super_admin', old_admin_id, now(), now(), true)
            ON CONFLICT (user_id) DO UPDATE SET
                role = 'super_admin',
                is_active = true,
                updated_at = now();
            
            RAISE NOTICE 'Assigned super_admin role to admin@propmate.site';
        END IF;
    END IF;
    
    -- Check if old admin exists and has role
    IF old_admin_id IS NOT NULL THEN
        IF NOT EXISTS(SELECT 1 FROM admin_roles WHERE user_id = old_admin_id AND is_active = true) THEN
            -- Assign admin role to old admin
            INSERT INTO admin_roles (user_id, role, assigned_by, created_at, updated_at, is_active)
            VALUES (old_admin_id, 'super_admin', old_admin_id, now(), now(), true)
            ON CONFLICT (user_id) DO UPDATE SET
                role = 'super_admin',
                is_active = true,
                updated_at = now();
            
            RAISE NOTICE 'Assigned super_admin role to admin@propmate.com';
        ELSE
            RAISE NOTICE 'admin@propmate.com already has admin role assigned';
        END IF;
    END IF;
    
    RAISE NOTICE '=== REDIRECT URL FIX ===';
    RAISE NOTICE 'The "page not found" error for password reset emails is due to:';
    RAISE NOTICE '1. Supabase redirect URLs not configured properly';
    RAISE NOTICE '2. Site URL mismatch (HTTP vs HTTPS)';
    RAISE NOTICE '';
    RAISE NOTICE 'TO FIX REDIRECT URLS:';
    RAISE NOTICE '1. Go to: https://supabase.com/dashboard/project/gwpbbzjqharvfuuxxuek/auth/url-configuration';
    RAISE NOTICE '2. Set Site URL to: https://propmate.site';
    RAISE NOTICE '3. Add Redirect URLs:';
    RAISE NOTICE '   - https://propmate.site/reset-password.html';
    RAISE NOTICE '   - https://propmate.site/auth/reset-password.html';
    RAISE NOTICE '   - https://propmate.site';
    RAISE NOTICE '4. Save changes';
    RAISE NOTICE '';
    RAISE NOTICE '=== SUMMARY ===';
    RAISE NOTICE 'Problem 1: admin@propmate.site user does not exist (no emails sent)';
    RAISE NOTICE 'Problem 2: Redirect URLs misconfigured (page not found)';
    RAISE NOTICE 'Both problems need to be fixed in Supabase Dashboard.';
    
END $$;
