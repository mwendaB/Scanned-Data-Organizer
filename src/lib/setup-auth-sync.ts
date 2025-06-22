import { supabaseAdmin } from '@/lib/admin-auth'

export async function setupAuthMetadataSync() {
  try {
    // Execute the SQL to create the functions and triggers
    const { error } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        -- Update the handle_new_user function to also set auth metadata
        CREATE OR REPLACE FUNCTION public.handle_new_user()
        RETURNS trigger AS $$
        DECLARE
          default_permissions JSONB := '["document:create", "document:read"]'::jsonb;
        BEGIN
          -- Insert into user_profiles
          INSERT INTO public.user_profiles (id, email, role, permissions)
          VALUES (
            NEW.id,
            NEW.email,
            'user',
            default_permissions
          );

          -- Update auth.users metadata to include role info
          UPDATE auth.users 
          SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
            'role', 'user',
            'permissions', default_permissions,
            'updated_at', NOW()::text
          )
          WHERE id = NEW.id;

          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;

        -- Function to sync role changes to auth metadata
        CREATE OR REPLACE FUNCTION public.sync_role_to_auth_metadata()
        RETURNS trigger AS $$
        BEGIN
          -- Update auth.users metadata when user_profiles role changes
          UPDATE auth.users 
          SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
            'role', NEW.role,
            'permissions', NEW.permissions,
            'updated_at', NEW.updated_at
          )
          WHERE id = NEW.id;

          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;

        -- Trigger to sync role changes to auth metadata
        DROP TRIGGER IF EXISTS sync_user_profile_to_auth ON public.user_profiles;
        CREATE TRIGGER sync_user_profile_to_auth
          AFTER UPDATE ON public.user_profiles
          FOR EACH ROW 
          WHEN (OLD.role IS DISTINCT FROM NEW.role OR OLD.permissions IS DISTINCT FROM NEW.permissions)
          EXECUTE FUNCTION public.sync_role_to_auth_metadata();
      `
    })

    if (error) {
      console.error('Error setting up auth metadata sync:', error)
      return { success: false, error: error.message }
    }

    return { success: true, message: 'Auth metadata sync setup completed' }
  } catch (error) {
    console.error('Error:', error)
    return { success: false, error: 'Failed to setup auth metadata sync' }
  }
}
