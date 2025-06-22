'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Check, X, AlertTriangle, RefreshCw } from 'lucide-react'
import ComplianceManager from './ComplianceManager'

interface DatabaseStatus {
  tableExists: boolean
  tableError?: string
  usersCount: number
  usersError?: string
  connectionWorking: boolean
  connectionError?: string
  tables: string[]
}

export default function DatabaseStatusChecker() {
  const [status, setStatus] = useState<DatabaseStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [makeAdminResult, setMakeAdminResult] = useState<string | null>(null)
  const [createSchemaResult, setCreateSchemaResult] = useState<string | null>(null)
  const [migrateResult, setMigrateResult] = useState<string | null>(null)

  const checkDatabase = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/db-check')
      const data = await response.json()
      
      console.log('Database check response:', data)
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to check database')
      }
      
      setStatus(data.tests)
    } catch (err) {
      console.error('Database check error:', err)
      setError(err instanceof Error ? err.message : 'Failed to check database')
    } finally {
      setLoading(false)
    }
  }

  const makeAdmin = async () => {
    try {
      setLoading(true)
      setMakeAdminResult(null)
      
      const response = await fetch('/api/db-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'make-admin' })
      })
      
      const data = await response.json()
      console.log('Make admin response:', data)
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to make admin')
      }
      
      setMakeAdminResult(data.message)
      // Refresh database status
      await checkDatabase()
    } catch (err) {
      console.error('Make admin error:', err)
      setMakeAdminResult(`Error: ${err instanceof Error ? err.message : 'Failed to make admin'}`)
    } finally {
      setLoading(false)
    }
  }

  const migrateUsers = async () => {
    try {
      setLoading(true)
      setMigrateResult(null)
      
      const response = await fetch('/api/migrate-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adminPassword: 'admin123secure' })
      })
      
      const data = await response.json()
      console.log('Migrate users response:', data)
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to migrate users')
      }
      
      setMigrateResult(`${data.message} - Details: ${data.results?.slice(0, 3).join(', ')}...`)
      // Refresh database status
      await checkDatabase()
    } catch (err) {
      console.error('Migrate users error:', err)
      setMigrateResult(`Error: ${err instanceof Error ? err.message : 'Failed to migrate users'}`)
    } finally {
      setLoading(false)
    }
  }

  const createSchema = async () => {
    try {
      setLoading(true)
      setCreateSchemaResult(null)
      
      const response = await fetch('/api/create-schema', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adminPassword: 'admin123secure' })
      })
      
      const data = await response.json()
      console.log('Create schema response:', data)
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create schema')
      }
      
      setCreateSchemaResult(data.message)
      // Refresh database status
      await checkDatabase()
    } catch (err) {
      console.error('Create schema error:', err)
      setCreateSchemaResult(`Error: ${err instanceof Error ? err.message : 'Failed to create schema'}`)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    checkDatabase()
  }, [])

  return (
    <div className="space-y-6">
      <Tabs defaultValue="database" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="database">Database Status</TabsTrigger>
          <TabsTrigger value="compliance">Compliance Management</TabsTrigger>
        </TabsList>
        
        <TabsContent value="database">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Database Connection Status
              </CardTitle>
              <CardDescription>
                Check the status of your Supabase database connection and user_profiles table
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button 
                  onClick={checkDatabase}
                  disabled={loading}
                  variant="outline"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Check Database
                </Button>
                
                {!status?.tableExists && (
                  <Button 
                    onClick={createSchema}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Create Database Schema
                  </Button>
                )}
                
                {status?.tableExists && (
                  <Button 
                    onClick={migrateUsers}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Migrate Auth Users
                  </Button>
                )}
                
                <Button 
                  onClick={makeAdmin}
                  disabled={loading}
                >
                  Make mwenda0107@gmail.com Admin
                </Button>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-700">
                    <X className="h-4 w-4" />
                    <span className="font-medium">Error:</span>
                    <span>{error}</span>
                  </div>
                </div>
              )}

              {migrateResult && (
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center gap-2 text-purple-700">
                    <Check className="h-4 w-4" />
                    <span className="font-medium">Migration Result:</span>
                    <span>{migrateResult}</span>
                  </div>
                </div>
              )}

              {createSchemaResult && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700">
                    <Check className="h-4 w-4" />
                    <span className="font-medium">Schema Result:</span>
                    <span>{createSchemaResult}</span>
                  </div>
                </div>
              )}

              {makeAdminResult && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-700">
                    <Check className="h-4 w-4" />
                    <span className="font-medium">Admin Result:</span>
                    <span>{makeAdminResult}</span>
                  </div>
                </div>
              )}

              {status && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      {status.connectionWorking ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <X className="h-4 w-4 text-red-500" />
                      )}
                      <span className="font-medium">Database Connection</span>
                      <Badge variant={status.connectionWorking ? "default" : "destructive"}>
                        {status.connectionWorking ? "Working" : "Failed"}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                      {status.tableExists ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <X className="h-4 w-4 text-red-500" />
                      )}
                      <span className="font-medium">user_profiles Table</span>
                      <Badge variant={status.tableExists ? "default" : "destructive"}>
                        {status.tableExists ? "Exists" : "Missing"}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-medium">Users Count:</span>
                      <Badge variant="outline">{status.usersCount}</Badge>
                    </div>
                  </div>

                  {status.connectionError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded">
                      <p className="text-sm text-red-700">
                        <strong>Connection Error:</strong> {status.connectionError}
                      </p>
                    </div>
                  )}

                  {status.tableError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded">
                      <p className="text-sm text-red-700">
                        <strong>Table Error:</strong> {status.tableError}
                      </p>
                    </div>
                  )}

                  {status.usersError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded">
                      <p className="text-sm text-red-700">
                        <strong>Users Query Error:</strong> {status.usersError}
                      </p>
                    </div>
                  )}

                  {status.tables.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Available Tables:</h4>
                      <div className="flex flex-wrap gap-2">
                        {status.tables.map((table) => (
                          <Badge key={table} variant="outline">
                            {table}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="compliance">
          <ComplianceManager />
        </TabsContent>
      </Tabs>
    </div>
  )
}
