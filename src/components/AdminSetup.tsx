'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function AdminSetup() {
  const [email, setEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleMakeAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/make-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, adminPassword }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(`✅ Success: ${data.message}`)
        setEmail('')
        setAdminPassword('')
      } else {
        setMessage(`❌ Error: ${data.error}`)
      }
    } catch (error) {
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Grant Admin Access</CardTitle>
        <CardDescription>
          Promote a user to admin role
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleMakeAdmin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              User Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
            />
          </div>
          
          <div>
            <label htmlFor="adminPassword" className="block text-sm font-medium mb-1">
              Admin Setup Password
            </label>
            <Input
              id="adminPassword"
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Enter admin setup password"
              required
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Processing...' : 'Grant Admin Access'}
          </Button>

          {message && (
            <div className="mt-4 p-3 rounded-md bg-gray-50 text-sm">
              {message}
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
