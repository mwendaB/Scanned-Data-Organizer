import React from 'react'
import DatabaseStatusChecker from '@/components/DatabaseStatusChecker'

export default function DatabaseStatusPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Database Status & Troubleshooting</h1>
      <DatabaseStatusChecker />
    </div>
  )
}
