import { NextRequest, NextResponse } from 'next/server'
import { AdminAuth } from '@/lib/admin-auth'
import { RoleBasedAuth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, adminPassword } = await request.json()
    
    // Add a security check - you might want to use an environment variable for this
    if (adminPassword !== process.env.ADMIN_SETUP_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find the user by email using admin auth
    const authUsers = await AdminAuth.listUsersWithAuthData()
    const user = authUsers.find(u => u.email === email)
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get admin permissions
    const adminPermissions = RoleBasedAuth.ROLE_PERMISSIONS[RoleBasedAuth.ROLES.ADMIN]

    // Assign admin role using AdminAuth (this syncs with both user_profiles and auth metadata)
    await AdminAuth.assignRole(user.id, RoleBasedAuth.ROLES.ADMIN, adminPermissions)

    return NextResponse.json({ 
      success: true, 
      message: `User ${email} has been granted admin privileges and synced with authentication system`,
      authMetadata: user.user_metadata
    })

  } catch (error: unknown) {
    console.error('Error granting admin privileges:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to grant admin privileges'
    return NextResponse.json(
      { error: errorMessage }, 
      { status: 500 }
    )
  }
}
