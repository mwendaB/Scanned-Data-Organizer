import { NextRequest, NextResponse } from 'next/server'
import { AdminAuth } from '@/lib/admin-auth'
import { RoleBasedAuth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Role assignment API called')
    const { userId, role, department } = await request.json()
    console.log(`📊 Request: userId=${userId}, role=${role}, department=${department || 'unchanged'}`)

    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    console.log(`🔑 Token present: ${!!token}`)

    if (!token) {
      console.log('❌ No authorization token provided')
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 })
    }

    // Create a client with the user's session token
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    })

    // Verify the requester is authenticated and has admin permissions
    console.log('👤 Verifying user authentication...')
    const { data: { user }, error: userError } = await userSupabase.auth.getUser()
    if (userError || !user) {
      console.log(`❌ User verification failed: ${userError?.message || 'No user'}`)
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 })
    }
    
    console.log(`✅ User authenticated: ${user.email}`)

    // Check if the current user has admin permissions
    console.log('🔍 Checking admin permissions...')
    const { data: currentUserProfile, error: profileError } = await userSupabase
      .from('user_profiles')
      .select('role, permissions')
      .eq('id', user.id)
      .single()

    if (profileError || !currentUserProfile) {
      console.log(`❌ Profile fetch failed: ${profileError?.message || 'No profile'}`)
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }
    
    console.log(`👤 Current user role: ${currentUserProfile.role}`)

    if (currentUserProfile.role !== 'admin') {
      console.log('❌ User is not admin')
      return NextResponse.json({ error: 'Admin permissions required' }, { status: 403 })
    }
    
    console.log('✅ Admin permissions verified')

    // Validate role
    console.log('🔍 Validating role...')
    if (!Object.values(RoleBasedAuth.ROLES).includes(role)) {
      console.log(`❌ Invalid role: ${role}`)
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Get permissions for the role
    const permissions = RoleBasedAuth.ROLE_PERMISSIONS[role as keyof typeof RoleBasedAuth.ROLE_PERMISSIONS] || []
    console.log(`🔑 Role permissions: ${permissions.length} permissions`)

    // Assign role using AdminAuth (this syncs with both user_profiles and auth metadata)
    console.log('⚡ Assigning role via AdminAuth...')
    await AdminAuth.assignRole(userId, role, permissions, department)
    console.log('✅ Role and department assigned successfully')

    return NextResponse.json({ 
      success: true, 
      message: `Successfully assigned ${role.replace('_', ' ')} role${department ? ` in ${department}` : ''} and synced with authentication system`
    })

  } catch (error: unknown) {
    console.error('💥 Error assigning role:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to assign role'
    return NextResponse.json(
      { error: errorMessage }, 
      { status: 500 }
    )
  }
}
