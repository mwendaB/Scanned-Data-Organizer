import React, { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { LogOut, RefreshCw } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { UserManagementService } from '@/lib/user-management'
import { DatabaseSetupService } from '@/lib/database-setup'
import { ErrorHandler } from '@/lib/error-handler'
import { supabase } from '@/lib/supabase'

// Import organized components
import { AdminPanel } from '@/components/admin/AdminPanel'
import { DocumentManager } from '@/components/documents/DocumentManager'
import { WorkflowManager } from '@/components/WorkflowManager'
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard'
import { RiskDashboard } from '@/components/RiskDashboard'
import { ReviewComments } from '@/components/ReviewComments'
import { ExportOptions } from '@/components/ExportOptions'
import { FileUpload } from '@/components/FileUpload'
import { DataTable } from '@/components/DataTable'

export function ImprovedDashboard() {
  const { user, setUser } = useAppStore()
  const [activeTab, setActiveTab] = useState('upload')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [selectedDocument, setSelectedDocument] = useState<any>(null)
  const [initializationStatus, setInitializationStatus] = useState<string>('checking')

  useEffect(() => {
    initializeDashboard()
  }, [])

  const initializeDashboard = async () => {
    setInitializationStatus('initializing')
    
    try {
      // Initialize database if needed
      const dbResult = await DatabaseSetupService.initializeDatabase()
      
      if (!dbResult.success) {
        console.warn('Database initialization had issues:', dbResult.results)
      }

      // Get current user with full profile
      const userProfile = await UserManagementService.getCurrentUser()
      
      if (userProfile) {
        setCurrentUser(userProfile)
        setUser(userProfile)
        setInitializationStatus('ready')
      } else {
        setInitializationStatus('unauthenticated')
      }
    } catch (error) {
      console.error('Dashboard initialization failed:', error)
      setInitializationStatus('error')
    }
  }

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      setUser(null)
      setCurrentUser(null)
      window.location.reload()
    } catch (error) {
      ErrorHandler.handleApiError(error, 'sign out')
    }
  }

  const handleRefresh = async () => {
    await initializeDashboard()
    ErrorHandler.handleSuccess('Dashboard refreshed successfully')
  }

  const handleDocumentSelect = (document: any) => {
    setSelectedDocument(document)
    setActiveTab('reviews') // Switch to reviews tab when document is selected
  }

  if (initializationStatus === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (initializationStatus === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-muted-foreground mb-4">Please sign in to access the dashboard</p>
          <Button onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </div>
      </div>
    )
  }

  if (initializationStatus === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Initialization Error</h2>
          <p className="text-muted-foreground mb-4">There was an error setting up the dashboard</p>
          <Button onClick={initializeDashboard}>
            Retry Initialization
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">Scanned Data Organizer</h1>
            {currentUser && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Welcome, {currentUser.email}
                </span>
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                  {currentUser.role}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-9">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="workflow">Workflow</TabsTrigger>
            <TabsTrigger value="risk">Risk</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
            <TabsTrigger value="admin">Admin</TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Upload Documents</h2>
              <FileUpload />
            </div>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            <DocumentManager 
              currentUser={currentUser}
              onDocumentSelect={handleDocumentSelect}
            />
          </TabsContent>

          {/* Data Tab */}
          <TabsContent value="data" className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Parsed Data</h2>
              <DataTable />
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <AnalyticsDashboard />
          </TabsContent>

          {/* Workflow Tab */}
          <TabsContent value="workflow" className="space-y-6">
            <WorkflowManager />
          </TabsContent>

          {/* Risk Tab */}
          <TabsContent value="risk" className="space-y-6">
            <RiskDashboard />
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="space-y-6">
            {selectedDocument ? (
              <ReviewComments 
                documentId={selectedDocument.id}
                documentName={selectedDocument.filename}
              />
            ) : (
              <div className="text-center py-8">
                <h3 className="text-lg font-medium mb-2">No Document Selected</h3>
                <p className="text-muted-foreground">
                  Select a document from the Documents tab to view and add reviews
                </p>
                <Button 
                  className="mt-4"
                  onClick={() => setActiveTab('documents')}
                >
                  Go to Documents
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Export Tab */}
          <TabsContent value="export" className="space-y-6">
            <ExportOptions />
          </TabsContent>

          {/* Admin Tab */}
          <TabsContent value="admin" className="space-y-6">
            <AdminPanel currentUser={currentUser} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
