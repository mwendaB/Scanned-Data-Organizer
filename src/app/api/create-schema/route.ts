import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/admin-auth'

export async function POST(request: NextRequest) {
  try {
    const { adminPassword } = await request.json()
    
    // Verify admin setup password
    if (adminPassword !== process.env.ADMIN_SETUP_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Creating database schema and migrating users...')
    const results = []

    // Step 1: Create user_profiles table using direct query
    try {
      console.log('Creating user_profiles table...')
      const { error: tableError } = await supabaseAdmin
        .rpc('exec_sql', {
          query: `CREATE TABLE IF NOT EXISTS public.user_profiles (
            id UUID PRIMARY KEY,
            email TEXT NOT NULL UNIQUE,
            role TEXT NOT NULL DEFAULT 'user',
            permissions JSONB DEFAULT '[]'::jsonb,
            department TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
          )`
        })

      if (tableError) {
        console.warn('exec_sql not available, trying alternative approach...')
        // Alternative: Use Supabase client to create via schema
        results.push(`⚠️ Table creation needs manual setup - exec_sql not available`)
      } else {
        results.push(`✅ Created user_profiles table`)
      }
    } catch (error) {
      console.log('Direct SQL approach failed, proceeding with data operations...')
      results.push(`⚠️ Table creation skipped - may need manual setup`)
    }

    // Step 2: Get all users from Supabase Auth
    console.log('Fetching users from Auth...')
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (authError) {
      throw new Error(`Failed to fetch auth users: ${authError.message}`)
    }

    results.push(`📊 Found ${authUsers.users.length} users in Authentication`)

    // Step 3: Migrate users to user_profiles table
    let migratedCount = 0
    let adminCount = 0

    for (const authUser of authUsers.users) {
      try {
        const isAdmin = authUser.email === 'mwenda0107@gmail.com'
        const role = isAdmin ? 'admin' : 'user'
        const permissions = isAdmin ? [
          'document:create', 'document:read', 'document:update', 'document:delete',
          'workflow:start', 'workflow:approve', 'workflow:reject', 'workflow:assign',
          'review:create', 'review:approve', 'review:final_approval',
          'risk:assess', 'risk:override',
          'user:manage', 'role:manage', 'workspace:manage'
        ] : ['document:create', 'document:read']

        // Insert or update user profile
        const { error: insertError } = await supabaseAdmin
          .from('user_profiles')
          .upsert({
            id: authUser.id,
            email: authUser.email || 'unknown@example.com',
            role,
            permissions,
            department: isAdmin ? 'Administration' : null,
            created_at: authUser.created_at,
            updated_at: new Date().toISOString()
          })

        if (insertError) {
          console.error(`Failed to migrate user ${authUser.email}:`, insertError)
          results.push(`❌ Failed to migrate ${authUser.email}: ${insertError.message}`)
        } else {
          migratedCount++
          if (isAdmin) {
            adminCount++
            results.push(`👑 Made ${authUser.email} an admin`)
          }
        }

        // Also update auth metadata
        try {
          const { error: metadataError } = await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
            user_metadata: {
              role,
              permissions,
              updated_at: new Date().toISOString()
            }
          })

          if (metadataError) {
            console.warn(`Failed to update metadata for ${authUser.email}:`, metadataError)
          }
        } catch (metaErr) {
          console.warn(`Metadata update failed for ${authUser.email}:`, metaErr)
        }

      } catch (userError) {
        console.error(`Error processing user ${authUser.email}:`, userError)
        results.push(`❌ Error processing ${authUser.email}`)
      }
    }

    // Step 4: Create user_roles table and insert default roles
    try {
      const defaultRoles = [
        {
          name: 'admin',
          description: 'System Administrator',
          permissions: [
            'document:create', 'document:read', 'document:update', 'document:delete',
            'workflow:start', 'workflow:approve', 'workflow:reject', 'workflow:assign',
            'review:create', 'review:approve', 'review:final_approval',
            'risk:assess', 'risk:override', 'user:manage', 'role:manage', 'workspace:manage'
          ],
          level: 100
        },
        {
          name: 'senior_partner',
          description: 'Senior Partner',
          permissions: [
            'document:read', 'document:update', 'workflow:approve', 'workflow:reject',
            'review:create', 'review:approve', 'review:final_approval', 'risk:override'
          ],
          level: 80
        },
        {
          name: 'risk_analyst',
          description: 'Risk Analyst',
          permissions: ['document:read', 'workflow:approve', 'workflow:reject', 'review:create', 'risk:assess'],
          level: 60
        },
        {
          name: 'reviewer',
          description: 'Document Reviewer',
          permissions: ['document:read', 'review:create', 'review:approve'],
          level: 40
        },
        {
          name: 'user',
          description: 'Regular User',
          permissions: ['document:create', 'document:read'],
          level: 20
        }
      ]

      // Try to insert roles (table might not exist yet)
      try {
        const { error: rolesError } = await supabaseAdmin
          .from('user_roles')
          .upsert(defaultRoles)

        if (rolesError) {
          results.push(`⚠️ Could not create user_roles: ${rolesError.message}`)
        } else {
          results.push(`✅ Created ${defaultRoles.length} default roles`)
        }
      } catch (roleErr) {
        results.push(`⚠️ user_roles table may need manual creation`)
      }

    } catch (error) {
      results.push(`⚠️ Roles setup may need manual configuration`)
    }

    return NextResponse.json({ 
      success: true, 
      message: `Migration completed! Migrated ${migratedCount} users, created ${adminCount} admin(s)`,
      results,
      summary: {
        totalAuthUsers: authUsers.users.length,
        migratedUsers: migratedCount,
        adminUsers: adminCount
      }
    })

  } catch (error: unknown) {
    console.error('Error in schema creation/migration:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to create schema/migrate users'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
