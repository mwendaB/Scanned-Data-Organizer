import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client with service role key (for admin operations)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export class AdminAuth {
  /**
   * Assign role to user and sync with Supabase Auth metadata
   */
  static async assignRole(userId: string, role: string, permissions: string[], department?: string): Promise<void> {
    // Prepare update data
    const updateData: any = {
      role,
      permissions,
      updated_at: new Date().toISOString()
    }
    
    // Only update department if provided
    if (department !== undefined) {
      updateData.department = department
    }

    // Update user_profiles table
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .update(updateData)
      .eq('id', userId)

    if (profileError) throw profileError

    // Prepare auth metadata
    const authMetadata: any = {
      role,
      permissions,
      updated_at: new Date().toISOString()
    }
    
    // Only include department in metadata if provided
    if (department !== undefined) {
      authMetadata.department = department
    }

    // Update Supabase Auth user metadata
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: authMetadata
    })

    if (authError) {
      console.error('Failed to update auth metadata:', authError)
      throw new Error('Failed to sync role with authentication system')
    }
  }

  /**
   * Get user with auth metadata
   */
  static async getUserWithAuthData(userId: string) {
    const { data: user, error } = await supabaseAdmin.auth.admin.getUserById(userId)
    if (error) throw error
    return user
  }

  /**
   * List all users with their auth metadata
   */
  static async listUsersWithAuthData() {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers()
    if (error) throw error
    return data.users
  }
}
