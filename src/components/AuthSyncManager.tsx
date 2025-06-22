'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Shield, Users, Check, X, RefreshCw } from 'lucide-react'

interface AuthUser {
  id: string
  email: string
  authMetadata: Record<string, unknown>
  createdAt: string
}

export default function AuthSyncManager(): JSX.Element {
  const [users, setUsers] = useState<AuthUser[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Test role assignment
  const [testEmail, setTestEmail] = useState('')
  const [testRole, setTestRole] = useState('')
  const [adminPassword, setAdminPassword] = useState('')

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/test-auth-sync')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load users')
      }
      
      setUsers(data.users || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const testRoleAssignment = async () => {
    if (!testEmail || !testRole || !adminPassword) {
      setError('Please fill in all fields')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setSuccess(null)
      
      const response = await fetch('/api/test-auth-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testEmail,
          role: testRole,
          adminPassword
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to assign role')
      }
      
      setSuccess(data.message)
      setTestEmail('')
      setTestRole('')
      setAdminPassword('')
      
      // Reload users to see changes
      await loadUsers()
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign role')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

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

      {/* Test Role Assignment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Test Role Assignment & Auth Sync
          </CardTitle>
          <CardDescription>
            Test assigning roles to users and verify they sync with Supabase Auth metadata
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="User email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
            />
            <Select value={testRole} onValueChange={setTestRole}>
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
            <Input
              type="password"
              placeholder="Admin password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
            />
          </div>
          <Button 
            onClick={testRoleAssignment}
            disabled={loading || !testEmail || !testRole || !adminPassword}
            className="w-full"
          >
            {loading ? 'Assigning Role...' : 'Test Role Assignment'}
          </Button>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Users with Auth Metadata
          </CardTitle>
          <CardDescription>
            All users from Supabase Auth with their metadata (includes assigned roles)
          </CardDescription>
          <Button
            variant="outline"
            size="sm"
            onClick={loadUsers}
            disabled={loading}
            className="self-start"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {loading && users.length === 0 ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center gap-2 text-muted-foreground">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                Loading users...
              </div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No users found. Users will appear here after they sign up.
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <Card key={user.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{user.email}</p>
                      <p className="text-sm text-muted-foreground">ID: {user.id}</p>
                      <p className="text-xs text-muted-foreground">
                        Created: {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      {user.authMetadata?.role && typeof user.authMetadata.role === 'string' ? (
                        <Badge variant="default">
                          {user.authMetadata.role.replace('_', ' ')}
                        </Badge>
                      ) : (
                        <Badge variant="outline">No role in auth metadata</Badge>
                      )}
                      {user.authMetadata?.permissions && Array.isArray(user.authMetadata.permissions) ? (
                        <p className="text-xs text-muted-foreground mt-1">
                          {(user.authMetadata.permissions as string[]).length} permissions
                        </p>
                      ) : null}
                    </div>
                  </div>
                  {user.authMetadata && Object.keys(user.authMetadata).length > 0 && (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-sm text-muted-foreground">
                        View Auth Metadata
                      </summary>
                      <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                        {JSON.stringify(user.authMetadata, null, 2)}
                      </pre>
                    </details>
                  )}
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
