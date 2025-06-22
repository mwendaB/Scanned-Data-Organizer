import React from 'react'
import AuthSyncManager from '@/components/AuthSyncManager'

export default function AuthSyncPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Authentication & Role Sync Management</h1>
      <AuthSyncManager />
    </div>
  )
}
