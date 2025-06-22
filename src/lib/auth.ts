import { supabase } from '@/lib/supabase'
import { User, UserRole, Permission } from '@/types'

export interface AuthContextType {
  user: User | null
  role: UserRole | null
  permissions: Permission[]
  hasPermission: (permission: string) => boolean
  hasRole: (role: string) => boolean
  canAccessWorkflow: (step: any) => boolean
}

export class RoleBasedAuth {
  
  static readonly ROLES = {
    ADMIN: 'admin',
    SENIOR_PARTNER: 'senior_partner', 
    RISK_ANALYST: 'risk_analyst',
    REVIEWER: 'reviewer',
    USER: 'user'
  } as const

  static readonly PERMISSIONS = {
    // Document permissions
    DOCUMENT_CREATE: 'document:create',
    DOCUMENT_READ: 'document:read',
    DOCUMENT_UPDATE: 'document:update',
    DOCUMENT_DELETE: 'document:delete',
    
    // Workflow permissions
    WORKFLOW_START: 'workflow:start',
    WORKFLOW_APPROVE: 'workflow:approve',
    WORKFLOW_REJECT: 'workflow:reject',
    WORKFLOW_ASSIGN: 'workflow:assign',
    
    // Review permissions
    REVIEW_CREATE: 'review:create',
    REVIEW_APPROVE: 'review:approve',
    REVIEW_FINAL_APPROVAL: 'review:final_approval',
    
    // Risk assessment permissions
    RISK_ASSESS: 'risk:assess',
    RISK_OVERRIDE: 'risk:override',
    
    // Admin permissions
    USER_MANAGE: 'user:manage',
    ROLE_MANAGE: 'role:manage',
    WORKSPACE_MANAGE: 'workspace:manage'
  } as const

  // Default role permissions
  static readonly ROLE_PERMISSIONS = {
    [this.ROLES.ADMIN]: [
      this.PERMISSIONS.DOCUMENT_CREATE,
      this.PERMISSIONS.DOCUMENT_READ,
      this.PERMISSIONS.DOCUMENT_UPDATE,
      this.PERMISSIONS.DOCUMENT_DELETE,
      this.PERMISSIONS.WORKFLOW_START,
      this.PERMISSIONS.WORKFLOW_APPROVE,
      this.PERMISSIONS.WORKFLOW_REJECT,
      this.PERMISSIONS.WORKFLOW_ASSIGN,
      this.PERMISSIONS.REVIEW_CREATE,
      this.PERMISSIONS.REVIEW_APPROVE,
      this.PERMISSIONS.REVIEW_FINAL_APPROVAL,
      this.PERMISSIONS.RISK_ASSESS,
      this.PERMISSIONS.RISK_OVERRIDE,
      this.PERMISSIONS.USER_MANAGE,
      this.PERMISSIONS.ROLE_MANAGE,
      this.PERMISSIONS.WORKSPACE_MANAGE
    ],
    [this.ROLES.SENIOR_PARTNER]: [
      this.PERMISSIONS.DOCUMENT_READ,
      this.PERMISSIONS.DOCUMENT_UPDATE,
      this.PERMISSIONS.WORKFLOW_APPROVE,
      this.PERMISSIONS.WORKFLOW_REJECT,
      this.PERMISSIONS.REVIEW_CREATE,
      this.PERMISSIONS.REVIEW_APPROVE,
      this.PERMISSIONS.REVIEW_FINAL_APPROVAL,
      this.PERMISSIONS.RISK_OVERRIDE
    ],
    [this.ROLES.RISK_ANALYST]: [
      this.PERMISSIONS.DOCUMENT_READ,
      this.PERMISSIONS.WORKFLOW_APPROVE,
      this.PERMISSIONS.WORKFLOW_REJECT,
      this.PERMISSIONS.REVIEW_CREATE,
      this.PERMISSIONS.RISK_ASSESS
    ],
    [this.ROLES.REVIEWER]: [
      this.PERMISSIONS.DOCUMENT_READ,
      this.PERMISSIONS.REVIEW_CREATE,
      this.PERMISSIONS.REVIEW_APPROVE
    ],
    [this.ROLES.USER]: [
      this.PERMISSIONS.DOCUMENT_CREATE,
      this.PERMISSIONS.DOCUMENT_READ
    ]
  }

  // Get user with role information
  static async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      // First, check if this is an admin user in the documents table
      if (user.email) {
        const { data: adminRecord, error: adminError } = await supabase
          .from('documents')
          .select('*')
          .eq('filename', 'ADMIN_USER_PROFILE')
          .single()

        if (!adminError && adminRecord) {
          try {
            const adminData = JSON.parse(adminRecord.ocr_text)
            if (adminData.user_email === user.email && adminData.is_admin_profile) {
              return {
                id: adminData.user_id,
                email: adminData.user_email,
                role: adminData.role,
                permissions: adminData.permissions,
                department: adminData.department,
                created_at: adminData.created_at,
                updated_at: adminData.updated_at
              }
            }
          } catch (parseError) {
            console.error('Error parsing admin record:', parseError)
          }
        }
      }

      // Get user profile with role from user_profiles table
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')  // Removed the problematic join with user_roles
        .eq('id', user.id)
        .single()

      if (error || !profile) {
        // Check if this is a known admin user before creating default profile
        const isKnownAdmin = user.email === 'mwenda0107@gmail.com'
        
        // Create default user profile if doesn't exist
        const defaultProfile = {
          id: user.id,
          email: user.email || 'unknown@example.com',
          role: isKnownAdmin ? this.ROLES.ADMIN : this.ROLES.USER,
          permissions: isKnownAdmin ? this.ROLE_PERMISSIONS[this.ROLES.ADMIN] : this.ROLE_PERMISSIONS[this.ROLES.USER],
          department: isKnownAdmin ? 'Administration' : undefined,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        // Only insert if user doesn't exist at all, don't overwrite existing users
        const { error: upsertError } = await supabase
          .from('user_profiles')
          .insert([defaultProfile])  // Changed from upsert to insert
          .select()
          .single()

        if (upsertError && upsertError.code !== '23505') { // 23505 is unique constraint violation
          console.error('Failed to create user profile:', upsertError)
          return null
        }

        return defaultProfile
      }

      return profile
    } catch (error) {
      console.error('Failed to get current user:', error)
      return null
    }
  }

  // Check if user has specific permission
  static hasPermission(user: User | null, permission: string): boolean {
    if (!user) return false
    if (user.role === this.ROLES.ADMIN) return true
    return user.permissions?.includes(permission) || false
  }

  // Check if user has specific role
  static hasRole(user: User | null, role: string): boolean {
    if (!user) return false
    return user.role === role
  }

  // Check if user can access workflow step
  static canAccessWorkflowStep(user: User | null, step: any): boolean {
    if (!user) return false
    if (user.role === this.ROLES.ADMIN) return true

    // Check if step is assigned to user's role
    if (step.assigned_role && step.assigned_role === user.role) {
      return true
    }

    // Check if step is assigned to specific user
    if (step.assigned_to && step.assigned_to === user.id) {
      return true
    }

    return false
  }

  // Assign user role
  static async assignRole(userId: string, role: string): Promise<void> {
    const permissions = this.ROLE_PERMISSIONS[role as keyof typeof this.ROLE_PERMISSIONS] || []

    // Update user_profiles table
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({
        role,
        permissions,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (profileError) throw profileError

    // Update Supabase Auth user metadata
    const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: {
        role,
        permissions,
        updated_at: new Date().toISOString()
      }
    })

    if (authError) {
      console.warn('Failed to update auth metadata:', authError)
      // Don't throw here since the main profile update succeeded
      // The auth metadata update requires service role key
    }
  }

  // Create workspace-specific permissions
  static async grantWorkspaceAccess(userId: string, workspaceId: string, role: string): Promise<void> {
    const { error } = await supabase
      .from('workspace_members')
      .upsert([{
        user_id: userId,
        workspace_id: workspaceId,
        role,
        permissions: this.ROLE_PERMISSIONS[role as keyof typeof this.ROLE_PERMISSIONS] || [],
        created_at: new Date().toISOString()
      }])

    if (error) throw error
  }
}
