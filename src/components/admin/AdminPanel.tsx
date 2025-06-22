import React, { useState, useEffect, useCallback } from 'react'
import { Users, UserPlus, Settings, Shield, Check, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { UserManagementService } from '@/lib/user-management'
import { ButtonActionService } from '@/lib/button-actions'
import { ErrorHandler } from '@/lib/error-handler'
import { RoleBasedAuth } from '@/lib/auth'

interface User {
  id: string
  email: string
  role: string
  permissions: string[]
  created_at: string
  department?: string
}

interface AdminPanelProps {
  currentUser?: any
}

export function AdminPanel({ currentUser }: AdminPanelProps) {
  const [users, setUsers] = useState<User[]>([])
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [selectedDocument, setSelectedDocument] = useState<string>('')
  const [selectedAssignee, setSelectedAssignee] = useState<string>('')
  const [isAssigning, setIsAssigning] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      // Load users
      const usersResult = await UserManagementService.getAllUsers(currentUser?.id)
      if (usersResult.success) {
        setUsers(usersResult.data || [])
      }

      // Load documents for assignment
      const docsResult = await ButtonActionService.handleDataExport('documents', 'json')
      if (docsResult.success && Array.isArray(docsResult.data)) {
        setDocuments(docsResult.data)
      }
    } catch (error) {
      ErrorHandler.handleApiError(error, 'load admin data')
    } finally {
      setLoading(false)
    }
  }, [currentUser?.id])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleRoleAssignment = async () => {
    if (!selectedUser || !selectedRole) {
      ErrorHandler.handleApiError({ message: 'Please select both user and role' }, 'assign role')
      return
    }

    const result = await ButtonActionService.handleRoleAssignment(
      selectedUser, 
      selectedRole, 
      currentUser?.id
    )

    if (result.success) {
      setSelectedUser('')
      setSelectedRole('')
      loadData() // Refresh the data
    }
  }

  const handleDocumentAssignment = async () => {
    if (!selectedDocument || !selectedAssignee) {
      ErrorHandler.handleApiError({ message: 'Please select both document and assignee' }, 'assign document')
      return
    }

    setIsAssigning(true)
    try {
      const result = await ButtonActionService.handleDocumentAssignment(
        selectedDocument,
        selectedAssignee,
        'medium'
      )

      if (result.success) {
        setSelectedDocument('')
        setSelectedAssignee('')
        ErrorHandler.handleSuccess('Document assigned for review successfully')
      }
    } catch (error) {
      ErrorHandler.handleApiError(error, 'assign document')
    } finally {
      setIsAssigning(false)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4 text-red-500" />
      case 'senior_partner':
        return <Shield className="h-4 w-4 text-purple-500" />
      case 'risk_analyst':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case 'reviewer':
        return <Check className="h-4 w-4 text-blue-500" />
      default:
        return <Users className="h-4 w-4 text-gray-500" />
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
      default:
        return 'outline'
    }
  }

  const canManageUsers = currentUser && RoleBasedAuth.hasPermission(currentUser, 'user:manage')
  const canAssignWork = currentUser && RoleBasedAuth.hasPermission(currentUser, 'workflow:assign')

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded animate-pulse" />
        <div className="h-64 bg-muted rounded animate-pulse" />
      </div>
    )
  }

  if (!canManageUsers && !canAssignWork) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Access Restricted</h3>
            <p>You need admin or management permissions to access this panel.</p>
            <p className="text-sm mt-2">
              Current role: <Badge variant="outline">{currentUser?.role || 'user'}</Badge>
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Admin Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Admin Users</p>
                <p className="text-2xl font-bold">
                  {users.filter(u => u.role === 'admin').length}
                </p>
              </div>
              <Shield className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Documents</p>
                <p className="text-2xl font-bold">{documents.length}</p>
              </div>
              <Settings className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Reviews</p>
                <p className="text-2xl font-bold">
                  {documents.filter(d => d.status === 'pending_review').length}
                </p>
              </div>
              <Check className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Document Assignment */}
      {canAssignWork && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Document Assignment
            </CardTitle>
            <CardDescription>
              Assign documents to users for review and analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium">Document</label>
                <Select value={selectedDocument} onValueChange={setSelectedDocument}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select document" />
                  </SelectTrigger>
                  <SelectContent>
                    {documents.map((doc) => (
                      <SelectItem key={doc.id} value={doc.id}>
                        {doc.filename} ({new Date(doc.created_at).toLocaleDateString()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1">
                <label className="text-sm font-medium">Assign to</label>
                <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.filter(u => u.role !== 'user').map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center gap-2">
                          {getRoleIcon(user.role)}
                          {user.email} ({user.role})
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                onClick={handleDocumentAssignment}
                disabled={!selectedDocument || !selectedAssignee || isAssigning}
              >
                {isAssigning ? 'Assigning...' : 'Assign Review'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Role Management */}
      {canManageUsers && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Role Management
            </CardTitle>
            <CardDescription>
              Assign roles and manage user permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end mb-6">
              <div className="flex-1">
                <label className="text-sm font-medium">User</label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.email} (Current: {user.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1">
                <label className="text-sm font-medium">New Role</label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="senior_partner">Senior Partner</SelectItem>
                    <SelectItem value="risk_analyst">Risk Analyst</SelectItem>
                    <SelectItem value="reviewer">Reviewer</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                onClick={handleRoleAssignment}
                disabled={!selectedUser || !selectedRole}
              >
                Assign Role
              </Button>
            </div>

            {/* Users Table */}
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
                {users.map((user) => (
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
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
