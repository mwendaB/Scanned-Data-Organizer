import { supabase } from '@/lib/supabase'
import { RoleBasedAuth } from '@/lib/auth'
import { ErrorHandler } from '@/lib/error-handler'

export class UserManagementService {
  /**
   * Get current authenticated user with complete profile
   */
  static async getCurrentUser() {
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser()
      
      if (authError || !authData?.user) {
        return null
      }

      // Try to get user profile from database with error handling
      try {
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single()

        if (profileError) {
          // Check if it's a table not found error
          if (profileError.code === 'PGRST116' || profileError.message?.includes('relation "user_profiles" does not exist')) {
            console.warn('user_profiles table not found - using fallback user data')
            return {
              ...authData.user,
              role: 'user',
              permissions: ['document:create', 'document:read'],
              department: null,
              isAdmin: false
            }
          }
          
          // If no profile exists, create one with basic permissions
          return await this.createUserProfile(authData.user)
        }

        return {
          ...authData.user,
          role: profile.role,
          permissions: profile.permissions,
          department: profile.department
        }
      } catch (tableError: any) {
        // If user_profiles table doesn't exist, return fallback data
        console.warn('user_profiles table access failed:', tableError?.message || tableError)
        return {
          ...authData.user,
          role: 'user',
          permissions: ['document:create', 'document:read'],
          department: null,
          isAdmin: false
        }
      }
    } catch (error: any) {
      console.error('Error getting current user:', error)
      ErrorHandler.handleApiError(error, 'Failed to get current user')
      return null
    }
  }

  /**
   * Create user profile for new users
   */
  static async createUserProfile(authUser: any) {
    try {
      const defaultPermissions = [
        'document:create',
        'document:read',
        'document:update',
        'review:create'
      ]

      const profile = {
        id: authUser.id,
        email: authUser.email,
        role: 'user',
        permissions: defaultPermissions,
        department: 'General',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .insert([profile])
        .select()
        .single()

      if (error) {
        console.error('Error creating user profile:', error)
        // Return basic user if profile creation fails
        return {
          ...authUser,
          role: 'user',
          permissions: defaultPermissions,
          department: 'General'
        }
      }

      return {
        ...authUser,
        role: data.role,
        permissions: data.permissions,
        department: data.department
      }
    } catch (error) {
      console.error('Error creating user profile:', error)
      return null
    }
  }

  /**
   * Get all users (admin only)
   */
  static async getAllUsers(adminUserId: string) {
    return ErrorHandler.safeApiCall(async () => {
      // Verify admin permissions
      const currentUser = await this.getCurrentUser()
      if (!currentUser || !RoleBasedAuth.hasPermission(currentUser, 'user:manage')) {
        throw new Error('Admin permissions required')
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    }, 'fetch users')
  }

  /**
   * Assign role to user (admin only)
   */
  static async assignRole(userId: string, role: string, adminUserId: string) {
    return ErrorHandler.safeApiCall(async () => {
      // Verify admin permissions
      const currentUser = await this.getCurrentUser()
      if (!currentUser || !RoleBasedAuth.hasPermission(currentUser, 'role:manage')) {
        throw new Error('Admin permissions required')
      }

      const rolePermissions = RoleBasedAuth.ROLE_PERMISSIONS[role as keyof typeof RoleBasedAuth.ROLE_PERMISSIONS]
      if (!rolePermissions) {
        throw new Error('Invalid role specified')
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          role,
          permissions: rolePermissions,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error
      return data
    }, 'assign role', 'Role assigned successfully')
  }

  /**
   * Update user permissions (admin only)
   */
  static async updateUserPermissions(userId: string, permissions: string[], adminUserId: string) {
    return ErrorHandler.safeApiCall(async () => {
      // Verify admin permissions
      const currentUser = await this.getCurrentUser()
      if (!currentUser || !RoleBasedAuth.hasPermission(currentUser, 'user:manage')) {
        throw new Error('Admin permissions required')
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          permissions,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error
      return data
    }, 'update permissions', 'Permissions updated successfully')
  }

  /**
   * Assign document review to user (admin only)
   */
  static async assignDocumentReview(documentId: string, assigneeId: string, priority: 'low' | 'medium' | 'high' = 'medium') {
    return ErrorHandler.safeApiCall(async () => {
      const currentUser = await this.getCurrentUser()
      if (!currentUser || !RoleBasedAuth.hasPermission(currentUser, 'workflow:assign')) {
        throw new Error('Permission required to assign reviews')
      }

      // Create workflow instance for the assignment
      const workflowData = {
        document_id: documentId,
        assigned_to: assigneeId,
        assigned_by: currentUser.id,
        workflow_type: 'DOCUMENT_REVIEW',
        priority,
        status: 'PENDING',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        created_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('workflow_instances')
        .insert([workflowData])
        .select()
        .single()

      if (error) throw error

      // Also create a workflow step
      const stepData = {
        workflow_instance_id: data.id,
        step_number: 1,
        step_name: 'Document Review',
        assigned_to: assigneeId,
        status: 'PENDING',
        action_required: 'Review and analyze document content',
        due_date: workflowData.due_date,
        created_at: new Date().toISOString()
      }

      await supabase
        .from('workflow_steps')
        .insert([stepData])

      return data
    }, 'assign review', 'Document review assigned successfully')
  }

  /**
   * Get user's assigned reviews
   */
  static async getUserAssignedReviews(userId: string) {
    return ErrorHandler.safeApiCall(async () => {
      const { data, error } = await supabase
        .from('workflow_instances')
        .select(`
          *,
          documents (
            id,
            filename,
            file_type,
            uploaded_by,
            created_at
          )
        `)
        .eq('assigned_to', userId)
        .eq('workflow_type', 'DOCUMENT_REVIEW')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    }, 'fetch assigned reviews')
  }

  /**
   * Create admin user for testing/setup
   */
  static async createAdminUser(email: string) {
    try {
      const adminPermissions = Object.values(RoleBasedAuth.PERMISSIONS)
      
      // Check if user already exists in user_profiles
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('email', email)
        .single()

      if (existingProfile) {
        // Update existing profile to admin
        const { data, error } = await supabase
          .from('user_profiles')
          .update({
            role: 'admin',
            permissions: adminPermissions,
            department: 'Administration',
            updated_at: new Date().toISOString()
          })
          .eq('email', email)
          .select()
          .single()

        if (error) throw error
        return data
      } else {
        // Create new admin profile
        const adminProfile = {
          id: 'admin-' + Math.random().toString(36).substr(2, 9), // Generate ID
          email,
          role: 'admin',
          permissions: adminPermissions,
          department: 'Administration',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        const { data, error } = await supabase
          .from('user_profiles')
          .insert([adminProfile])
          .select()
          .single()

        if (error) throw error
        return data
      }
    } catch (error) {
      console.error('Error creating admin user:', error)
      throw error
    }
  }
}
