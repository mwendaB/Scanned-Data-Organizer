import { NextRequest, NextResponse } from 'next/server'
import { AdminAuth } from '@/lib/admin-auth'
import { RoleBasedAuth } from '@/lib/auth'

export async function GET() {
  try {
    // Test: List all users with their auth metadata
    const authUsers = await AdminAuth.listUsersWithAuthData()
    
    const userSummary = authUsers.map(user => ({
      id: user.id,
      email: user.email,
      authMetadata: user.user_metadata,
      createdAt: user.created_at
    }))

    return NextResponse.json({ 
      success: true,
      totalUsers: authUsers.length,
      users: userSummary,
      message: 'Successfully retrieved all users with auth metadata'
    })

  } catch (error: unknown) {
    console.error('Error testing auth sync:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to test auth sync'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, role, adminPassword } = await request.json()
    
    // Verify admin setup password
    if (adminPassword !== process.env.ADMIN_SETUP_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find user by email
    const authUsers = await AdminAuth.listUsersWithAuthData()
    const user = authUsers.find(u => u.email === email)
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get permissions for the role
    const permissions = RoleBasedAuth.ROLE_PERMISSIONS[role as keyof typeof RoleBasedAuth.ROLE_PERMISSIONS] || []

    // Test: Assign role and sync with auth metadata
    await AdminAuth.assignRole(user.id, role, permissions)

    // Verify the assignment worked by getting fresh user data
    const updatedUser = await AdminAuth.getUserWithAuthData(user.id)

    return NextResponse.json({ 
      success: true,
      message: `Successfully assigned ${role} to ${email} and synced with auth metadata`,
      before: {
        authMetadata: user.user_metadata
      },
      after: {
        authMetadata: updatedUser.user.user_metadata
      }
    })

  } catch (error: unknown) {
    console.error('Error testing role assignment:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to test role assignment'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
