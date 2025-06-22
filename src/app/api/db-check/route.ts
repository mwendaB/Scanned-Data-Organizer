import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Test 1: Check if user_profiles table exists and get its structure
    const { data: tableInfo, error: tableError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1)

    console.log('Table check:', { tableInfo, tableError })

    // Test 2: Try to list all users from user_profiles
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('*')

    console.log('Users query:', { users, usersError })

    // Test 3: Check Supabase connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')

    console.log('Connection test:', { connectionTest, connectionError })

    return NextResponse.json({
      success: true,
      tests: {
        tableExists: !tableError,
        tableError: tableError?.message,
        usersCount: users?.length || 0,
        usersError: usersError?.message,
        connectionWorking: !connectionError,
        connectionError: connectionError?.message,
        tables: connectionTest?.map(t => t.table_name) || []
      },
      users: users || []
    })

  } catch (error) {
    console.error('Database check error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()

    if (action === 'make-admin') {
      // First, check if mwenda0107@gmail.com exists in user_profiles
      const { data: existingUser, error: findError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('email', 'mwenda0107@gmail.com')
        .single()

      console.log('Existing user check:', { existingUser, findError })

      if (findError && findError.code !== 'PGRST116') { // PGRST116 = no rows found
        throw findError
      }

      if (existingUser) {
        // Update existing user to admin
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({
            role: 'admin',
            permissions: [
              'document:create', 'document:read', 'document:update', 'document:delete',
              'workflow:start', 'workflow:approve', 'workflow:reject', 'workflow:assign',
              'review:create', 'review:approve', 'review:final_approval',
              'risk:assess', 'risk:override',
              'user:manage', 'role:manage', 'workspace:manage'
            ],
            updated_at: new Date().toISOString()
          })
          .eq('email', 'mwenda0107@gmail.com')

        if (updateError) throw updateError

        return NextResponse.json({
          success: true,
          message: 'Updated existing user to admin',
          userId: existingUser.id
        })
      } else {
        // Create new user profile
        const { data: newUser, error: createError } = await supabase
          .from('user_profiles')
          .insert([{
            id: crypto.randomUUID(),
            email: 'mwenda0107@gmail.com',
            role: 'admin',
            permissions: [
              'document:create', 'document:read', 'document:update', 'document:delete',
              'workflow:start', 'workflow:approve', 'workflow:reject', 'workflow:assign',
              'review:create', 'review:approve', 'review:final_approval',
              'risk:assess', 'risk:override',
              'user:manage', 'role:manage', 'workspace:manage'
            ],
            department: 'Administration',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()

        if (createError) throw createError

        return NextResponse.json({
          success: true,
          message: 'Created new admin user',
          user: newUser?.[0]
        })
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Database operation error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
