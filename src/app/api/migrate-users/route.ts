import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/admin-auth'

export async function POST(request: NextRequest) {
  try {
    const { adminPassword, createTable = false } = await request.json()
    
    if (adminPassword !== process.env.ADMIN_SETUP_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const results = []

    // Step 1: Optionally create table using raw SQL
    if (createTable) {
      try {
        const { error } = await supabaseAdmin.rpc('sql', {
          query: `
            CREATE TABLE IF NOT EXISTS public.user_profiles (
              id UUID PRIMARY KEY,
              email TEXT NOT NULL UNIQUE,
              role TEXT NOT NULL DEFAULT 'user',
              permissions JSONB DEFAULT '[]'::jsonb,
              department TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            
            ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
            
            CREATE POLICY IF NOT EXISTS "Allow all operations" ON public.user_profiles 
            FOR ALL USING (true) WITH CHECK (true);
          `
        })

        if (error) {
          results.push(`⚠️ Table creation failed: ${error.message}`)
        } else {
          results.push(`✅ Created user_profiles table`)
        }
      } catch (err) {
        results.push(`⚠️ Table creation method not available`)
      }
    }

    // Step 2: Get users from Authentication
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (authError) {
      throw new Error(`Auth error: ${authError.message}`)
    }

    const authUsers = authData.users
    results.push(`📊 Found ${authUsers.length} users in Authentication`)

    // Step 3: Migrate each user
    let successCount = 0
    let adminCount = 0

    for (const user of authUsers) {
      try {
        // Check if user already exists and preserve their current role if they're already admin
        const { data: existingUser } = await supabaseAdmin
          .from('user_profiles')
          .select('role, permissions')
          .eq('email', user.email)
          .single()

        const isAdmin = user.email === 'mwenda0107@gmail.com'
        const shouldKeepExistingAdmin = existingUser?.role === 'admin'
        
        const roleData = {
          id: user.id,
          email: user.email || `user-${user.id}@example.com`,
          role: shouldKeepExistingAdmin ? 'admin' : (isAdmin ? 'admin' : 'user'),
          permissions: shouldKeepExistingAdmin ? existingUser.permissions : (isAdmin ? [
            'document:create', 'document:read', 'document:update', 'document:delete',
            'workflow:start', 'workflow:approve', 'workflow:reject', 'workflow:assign',
            'review:create', 'review:approve', 'review:final_approval',
            'risk:assess', 'risk:override', 'user:manage', 'role:manage', 'workspace:manage'
          ] : ['document:create', 'document:read']),
          department: (shouldKeepExistingAdmin || isAdmin) ? 'Administration' : null,
          created_at: user.created_at,
          updated_at: new Date().toISOString()
        }

        const { error: insertError } = await supabaseAdmin
          .from('user_profiles')
          .upsert(roleData, { onConflict: 'email' })

        if (insertError) {
          results.push(`❌ Failed ${user.email}: ${insertError.message}`)
        } else {
          successCount++
          if (isAdmin) {
            adminCount++
            results.push(`👑 ${user.email} → Admin`)
          } else {
            results.push(`✅ ${user.email} → User`)
          }

          // Update auth metadata
          try {
            await supabaseAdmin.auth.admin.updateUserById(user.id, {
              user_metadata: {
                role: roleData.role,
                permissions: roleData.permissions,
                migrated: true
              }
            })
          } catch (metaError) {
            console.warn(`Metadata update failed for ${user.email}`)
          }
        }

      } catch (userError) {
        results.push(`❌ Error with ${user.email}: ${userError instanceof Error ? userError.message : 'Unknown'}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Migration complete: ${successCount}/${authUsers.length} users migrated, ${adminCount} admin(s) created`,
      results,
      stats: {
        totalUsers: authUsers.length,
        migrated: successCount,
        admins: adminCount,
        failed: authUsers.length - successCount
      }
    })

  } catch (error: unknown) {
    console.error('Migration error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Migration failed'
    }, { status: 500 })
  }
}
