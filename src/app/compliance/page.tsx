'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import ComplianceManager from '@/components/ComplianceManager'

export default function CompliancePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Compliance Management</h1>
              <p className="text-muted-foreground mt-2">
                Manage compliance frameworks, rules, and execute compliance checks
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Compliance Framework Administration</CardTitle>
              <CardDescription>
                Create and manage compliance frameworks, rules, and thresholds. Run compliance checks against your data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ComplianceManager />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
