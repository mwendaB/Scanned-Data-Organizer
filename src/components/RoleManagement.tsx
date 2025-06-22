import React, { useState, useEffect } from 'react'
import { Shield, Users, Settings, Check, X, AlertTriangle, Crown, Eye, Lock } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { RoleBasedAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { User } from '@/types'

interface RoleManagementProps {
  currentUser?: User
}

export function RoleManagement({ currentUser }: RoleManagementProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [selectedDepartment, setSelectedDepartment] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Attempting to load users from database...')
      
      const { data, error: dbError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })

      console.log('Database response:', { data, error: dbError })

      if (dbError) {
        console.error('Database error details:', dbError)
        setError(`Database error: ${dbError.message}. Using demo data.`)
        // Demo data for testing
        const now = new Date().toISOString()
        setUsers([
          {
            id: '1',
            email: 'admin@company.com',
            role: 'admin',
            permissions: Object.values(RoleBasedAuth.PERMISSIONS),
            created_at: now,
            updated_at: now,
            department: 'IT'
          },
          {
            id: '2',
            email: 'mwenda0107@gmail.com',
            role: 'admin',
            permissions: Object.values(RoleBasedAuth.PERMISSIONS),
            created_at: now,
            updated_at: now,
            department: 'Administration'
          },
          {
            id: '3',
            email: 'partner@company.com',
            role: 'senior_partner',
            permissions: RoleBasedAuth.ROLE_PERMISSIONS.senior_partner,
            created_at: now,
            updated_at: now,
            department: 'Leadership'
          },
          {
            id: '4',
            email: 'analyst@company.com',
            role: 'risk_analyst',
            permissions: RoleBasedAuth.ROLE_PERMISSIONS.risk_analyst,
            created_at: now,
            updated_at: now,
            department: 'Risk Management'
          },
          {
            id: '5',
            email: 'reviewer@company.com',
            role: 'reviewer',
            permissions: RoleBasedAuth.ROLE_PERMISSIONS.reviewer,
            created_at: now,
            updated_at: now,
            department: 'Review'
          },
          {
            id: '6',
            email: 'user@company.com',
            role: 'user',
            permissions: RoleBasedAuth.ROLE_PERMISSIONS.user,
            created_at: now,
            updated_at: now,
            department: 'General'
          }
        ])
      } else {
        console.log('Successfully loaded users:', data)
        setUsers(data || [])
        if ((data || []).length === 0) {
          setError('No users found in database. Make sure users have signed up.')
        }
      }
    } catch (error) {
      console.error('Failed to load users:', error)
      setError(`Connection error: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your connection.`)
      setUsers([]) // Clear users on error
    } finally {
      setLoading(false)
    }
  }

  const assignRole = async () => {
    if (!selectedUser || !selectedRole) return

    try {
      setError(null)
      setSuccess(null)
      
      // Get the current session token for authentication
      const { data: { session } } = await supabase.auth.getSession()
      
      // Use API endpoint to assign role (this will sync with auth metadata)
      const response = await fetch('/api/assign-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`
        },
        body: JSON.stringify({
          userId: selectedUser,
          role: selectedRole,
          department: selectedDepartment === 'none' ? null : selectedDepartment || undefined
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to assign role')
      }

      await loadUsers()
      setSelectedUser('')
      setSelectedRole('')
      setSelectedDepartment('')
      setSuccess(`Successfully assigned ${selectedRole.replace('_', ' ')} role${selectedDepartment && selectedDepartment !== 'none' ? ` in ${selectedDepartment}` : ''} and synced with authentication system!`)
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error('Failed to assign role:', error)
      setError(error instanceof Error ? error.message : 'Failed to assign role. Please try again.')
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-4 w-4 text-yellow-500" />
      case 'senior_partner':
        return <Shield className="h-4 w-4 text-purple-500" />
      case 'risk_analyst':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case 'reviewer':
        return <Eye className="h-4 w-4 text-blue-500" />
      case 'user':
        return <Users className="h-4 w-4 text-gray-500" />
      default:
        return <Lock className="h-4 w-4 text-gray-400" />
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive'
      case 'senior_partner':
        return 'default'
      case 'risk_analyst':
        return 'secondary'
      case 'reviewer':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const canManageUsers = currentUser && (
    currentUser.role === 'admin' || 
    currentUser.permissions?.includes(RoleBasedAuth.PERMISSIONS.USER_MANAGE)
  )

  return (
    <div className="space-y-6">
      {/* Error and Success Messages */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700">
              <X className="h-4 w-4" />
              <p className="text-sm">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {success && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-green-700">
              <Check className="h-4 w-4" />
              <p className="text-sm">{success}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Role-Based Authentication Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Role-Based Access Control (RBAC)
          </CardTitle>
          <CardDescription>
            System for managing user permissions and access levels across the application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {Object.entries(RoleBasedAuth.ROLES).map(([, role]) => {
              const permissions = RoleBasedAuth.ROLE_PERMISSIONS[role as keyof typeof RoleBasedAuth.ROLE_PERMISSIONS] || []
              
              return (
                <Card key={role} className="text-center">
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center space-y-2">
                      {getRoleIcon(role)}
                      <h3 className="font-medium capitalize">{role.replace('_', ' ')}</h3>
                      <Badge variant={getRoleBadgeVariant(role)}>
                        {permissions.length} permissions
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Current User Information */}
      {currentUser && (
        <Card>
          <CardHeader>
            <CardTitle>Your Current Access Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {getRoleIcon(currentUser.role)}
              <div>
                <p className="font-medium">{currentUser.email}</p>
                <p className="text-sm text-muted-foreground">
                  Role: {currentUser.role?.replace('_', ' ') || 'user'} • 
                  {currentUser.permissions?.length || 0} permissions
                </p>
              </div>
              <Badge variant={getRoleBadgeVariant(currentUser.role)}>
                {currentUser.role?.replace('_', ' ') || 'user'}
              </Badge>
            </div>
            
            {/* Permission List */}
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Your Permissions:</h4>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                {(currentUser.permissions || []).map((permission: string) => (
                  <div key={permission} className="flex items-center gap-2 text-xs">
                    <Check className="h-3 w-3 text-green-500" />
                    <span>{permission.replace(':', ' ')}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Management */}
      {canManageUsers ? (
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              Assign roles and manage user permissions (Admin only)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Role Assignment */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Select user..." />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(RoleBasedAuth.ROLES).map((role) => (
                    <SelectItem key={role} value={role}>
                      {role.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Department (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- No Department --</SelectItem>
                  <SelectItem value="Administration">Administration</SelectItem>
                  <SelectItem value="IT">IT</SelectItem>
                  <SelectItem value="Leadership">Leadership</SelectItem>
                  <SelectItem value="Risk Management">Risk Management</SelectItem>
                  <SelectItem value="Review">Review</SelectItem>
                  <SelectItem value="Legal">Legal</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                  <SelectItem value="Operations">Operations</SelectItem>
                  <SelectItem value="Human Resources">Human Resources</SelectItem>
                  <SelectItem value="General">General</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                onClick={assignRole}
                disabled={!selectedUser || !selectedRole}
                className="w-full"
              >
                Assign Role & Department
              </Button>
            </div>

            {/* Users Table */}
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center gap-2 text-muted-foreground">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  Loading users...
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No users found. Users will appear here after they sign up.
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getRoleIcon(user.role)}
                            <span className="font-medium">{user.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(user.role)}>
                            {user.role?.replace('_', ' ') || 'user'}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.department || 'N/A'}</TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {user.permissions?.length || 0} permissions
                          </span>
                        </TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <Lock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Access Restricted</h3>
              <p>You need admin permissions to manage user roles.</p>
              <p className="text-sm mt-2">
                Current role: <Badge variant="outline">{currentUser?.role || 'user'}</Badge>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Permission Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Permission Reference</CardTitle>
          <CardDescription>
            Complete list of permissions and their descriptions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(RoleBasedAuth.PERMISSIONS).map(([, permission]) => {
              const [resource, action] = permission.split(':')
              return (
                <div key={permission} className="flex items-center gap-3 p-3 border rounded">
                  <div className="p-2 bg-blue-50 rounded">
                    <Settings className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{permission}</p>
                    <p className="text-xs text-muted-foreground">
                      {action} access to {resource} resources
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
