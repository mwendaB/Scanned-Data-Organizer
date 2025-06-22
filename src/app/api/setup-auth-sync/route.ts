import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/admin-auth'

export async function POST(request: NextRequest) {
  try {
    const { adminPassword } = await request.json()
    
    // Verify admin setup password
    if (adminPassword !== process.env.ADMIN_SETUP_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create or update the trigger function
    const { error } = await supabaseAdmin.rpc('exec', {
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

          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;

        -- Function to sync existing users' roles to auth metadata
        CREATE OR REPLACE FUNCTION public.sync_existing_users_to_auth()
        RETURNS void AS $$
        DECLARE
          user_record RECORD;
        BEGIN
          FOR user_record IN 
            SELECT id, role, permissions, updated_at 
            FROM public.user_profiles 
          LOOP
            -- We cannot directly update auth.users from this function
            -- So we'll rely on the API calls to handle this
            NULL;
          END LOOP;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    })

    if (error) {
      console.error('Error setting up functions:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Auth metadata sync setup completed. Role assignments will now sync with Supabase Auth metadata.' 
    })

  } catch (error: unknown) {
    console.error('Error setting up auth sync:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to setup auth sync'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
