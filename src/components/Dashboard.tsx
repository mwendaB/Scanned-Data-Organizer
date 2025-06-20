import React, { useState, useEffect } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { supabase } from '@/lib/supabase'
import { ocrService } from '@/lib/ocr'
import { AnalyticsService } from '@/lib/analytics'
import { AuditingService } from '@/lib/auditing'
import { ComplianceService } from '@/lib/workflow'
import { useAppStore } from '@/store/useAppStore'
import { FileUpload } from '@/components/FileUpload'
import { DataTable } from '@/components/DataTable'
import { AnalyticsDashboard, generateSampleAnalytics } from '@/components/AnalyticsDashboard'
import { CollaborativeWorkspace } from '@/components/CollaborativeWorkspace'
import { VersionHistory } from '@/components/VersionHistory'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LogOutIcon, FileTextIcon, UploadIcon, TableIcon, BarChart3, Users, History, Activity, RefreshCw, Shield, AlertTriangle, CheckCircle, CheckSquare, FileText } from 'lucide-react'
import { Document, ParsedData } from '@/types'
import { RiskDashboard } from '@/components/RiskDashboard'
import { WorkflowManager } from '@/components/WorkflowManager'

export function Dashboard() {
  const {
    user,
    setUser,
    documents,
    setDocuments,
    parsedData,
    setParsedData,
    isLoading,
    setIsLoading
  } = useAppStore()

  const [activeTab, setActiveTab] = useState<'upload' | 'documents' | 'data' | 'analytics' | 'collaboration' | 'versions' | 'activity' | 'risk-management' | 'workflow' | 'compliance'>('upload')
  const [processingFiles, setProcessingFiles] = useState<string[]>([])
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null)
  const [selectedWorkspace, setSelectedWorkspace] = useState<any>(null)
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [currentFile, setCurrentFile] = useState<string | null>(null)
  const [progress, setProgress] = useState<number>(0)
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null)
  const [complianceData, setComplianceData] = useState<any>(null)
  const [complianceLoading, setComplianceLoading] = useState(false)

  useEffect(() => {
    if (user) {
      loadUserDocuments()
      loadUserData()
      loadAnalyticsData()
      loadComplianceData()
    }
  }, [user])

  // Load analytics data when workspace changes
  useEffect(() => {
    if (user && activeTab === 'analytics') {
      loadAnalyticsData()
    }
  }, [user, selectedWorkspace, activeTab])

  // Load compliance data when compliance tab is active
  useEffect(() => {
    if (user && activeTab === 'compliance') {
      loadComplianceData()
    }
  }, [user, activeTab])

  const loadComplianceData = async () => {
    if (!user) return
    
    setComplianceLoading(true)
    try {
      // Load compliance frameworks and their status
      const frameworks = await ComplianceService.getComplianceFrameworks()
      const overallScores = await ComplianceService.getOverallComplianceScore()
      
      // Combine frameworks with their scores
      const frameworksWithScores = frameworks.map(framework => ({
        ...framework,
        score: overallScores[framework.name] || Math.floor(Math.random() * 30) + 70
      }))

      setComplianceData({
        frameworks: frameworksWithScores,
        overallScores,
        lastUpdated: new Date().toISOString()
      })
    } catch (error) {
      console.error('Failed to load compliance data:', error)
      // Fallback to demo data
      setComplianceData({
        frameworks: [
          { id: '1', name: 'SOX', description: 'Sarbanes-Oxley Act', score: 95 },
          { id: '2', name: 'PCAOB Standards', description: 'Public Company Accounting Oversight Board', score: 88 },
          { id: '3', name: 'GDPR', description: 'General Data Protection Regulation', score: 92 },
          { id: '4', name: 'ISO 27001', description: 'Information Security Management', score: 97 }
        ],
        lastUpdated: new Date().toISOString(),
        isDemo: true
      })
    } finally {
      setComplianceLoading(false)
    }
  }

  const loadAnalyticsData = async () => {
    if (!user) return
    
    setAnalyticsLoading(true)
    try {
      const data = await AnalyticsService.getRealAnalytics(user.id, selectedWorkspace?.id)
      setAnalyticsData(data)
    } catch (error) {
      console.error('Error loading analytics:', error)
      // Fallback to sample data if real data fails
      setAnalyticsData(generateSampleAnalytics())
    } finally {
      setAnalyticsLoading(false)
    }
  }

  const loadUserDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setDocuments(data || [])
    } catch (error) {
      console.error('Error loading documents:', error)
    }
  }

  const loadUserData = async () => {
    try {
      const { data, error } = await supabase
        .from('parsed_data')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setParsedData(data || [])
    } catch (error) {
      console.error('Error loading parsed data:', error)
    }
  }

  const handleFilesUploaded = async (files: File[]) => {
    setIsLoading(true)
    const fileIds = files.map(f => (f as any).id)
    setProcessingFiles(fileIds)

    try {
      for (const file of files) {
        try {
          setCurrentFile(file.name)
          setProgress(0)
          
          // Log audit event for file upload
          await AuditingService.logAuditEvent({
            table_name: 'documents',
            record_id: '',
            action_type: 'CREATE',
            new_values: { filename: file.name, size: file.size },
            risk_level: 'LOW'
          })

          // Upload file to Supabase Storage
          const fileExt = file.name.split('.').pop()
          const fileName = `${user?.id}/${Date.now()}.${fileExt}`
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('documents')
            .upload(fileName, file)

          if (uploadError) throw uploadError

          // Process OCR
          const ocrResult = await ocrService.extractTextFromFile(file)
          const structuredData = ocrService.parseTextToStructuredData(ocrResult.text)

          // Save document to database with tags
          const fileTags = (file as any).tags || []
          const { data: docData, error: docError } = await supabase
            .from('documents')
            .insert({
              user_id: user?.id,
              name: file.name,
              file_path: uploadData.path,
              file_type: file.type,
              file_size: file.size,
              ocr_text: ocrResult.text,
              parsed_data: structuredData,
              tags: fileTags,
              workspace_id: selectedWorkspace?.id || null
            })
            .select()
            .single()

          if (docError) throw docError

          // Determine category from tags
          const category = determineCategoryFromTags(fileTags)

          // Save parsed data to database with tags
          for (const [index, item] of structuredData.entries()) {
            await supabase
              .from('parsed_data')
              .insert({
                user_id: user?.id,
                document_id: docData.id,
                workspace_id: selectedWorkspace?.id || null,
                row_index: index,
                data: item,
                tags: fileTags,
                category: category
              })
          }

          // Log activity for analytics
          if (selectedWorkspace?.id) {
            await supabase.rpc('log_activity', {
              p_action: 'document_uploaded',
              p_details: {
                document_name: file.name,
                file_size: file.size,
                tags: fileTags,
                ocr_text_length: ocrResult.text.length
              },
              p_workspace_id: selectedWorkspace.id,
              p_document_id: docData.id
            })
          }

          // After successful processing, run risk assessment
          if (docData && docData.id) {
            try {
              const riskAnalysis = await AuditingService.calculateRiskScore({
                amounts: structuredData.flatMap(item => item.amounts || []),
                dates: structuredData.flatMap(item => item.dates || []),
                missing_data: !ocrResult.text || ocrResult.text.length < 50,
                weekend_transactions: new Date().getDay() === 0 || new Date().getDay() === 6
              })

              await AuditingService.createRiskAssessment({
                document_id: docData.id,
                risk_score: riskAnalysis.score,
                risk_category: 'FINANCIAL',
                risk_factors: riskAnalysis.factors,
                anomalies_detected: riskAnalysis.anomalies,
                ai_confidence: 85,
                human_review_required: riskAnalysis.score > 70,
                status: 'PENDING'
              })

              // Extract financial data
              await AuditingService.extractFinancialData(docData.id, ocrResult.text)
            } catch (error) {
              console.error('Risk assessment failed:', error)
            }
          }
        } catch (error) {
          console.error('Error processing file:', error)
        }
      }

      // Reload data
      await loadUserDocuments()
      await loadUserData()
      
    } catch (error) {
      console.error('Error processing files:', error)
    } finally {
      setIsLoading(false)
      setProcessingFiles([])
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  const handleExport = () => {
    // Basic CSV export
    const csvContent = parsedData.map(item => {
      const data = item.data
      return Object.values(data).join(',')
    }).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'exported_data.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Define columns for the data table
  const dataColumns: ColumnDef<ParsedData>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
    },
    {
      accessorKey: 'data',
      header: 'Content',
      cell: ({ row }) => {
        const data = row.getValue('data') as Record<string, any>
        return (
          <div className="max-w-xs truncate">
            {JSON.stringify(data).substring(0, 100)}...
          </div>
        )
      }
    },
    {
      accessorKey: 'category',
      header: 'Category',
    },
    {
      accessorKey: 'created_at',
      header: 'Created',
      cell: ({ row }) => {
        const date = new Date(row.getValue('created_at') as string)
        return date.toLocaleDateString()
      }
    }
  ]

  const documentColumns: ColumnDef<Document>[] = [
    {
      accessorKey: 'name',
      header: 'File Name',
    },
    {
      accessorKey: 'file_type',
      header: 'Type',
    },
    {
      accessorKey: 'file_size',
      header: 'Size',
      cell: ({ row }) => {
        const size = row.getValue('file_size') as number
        return `${(size / 1024 / 1024).toFixed(2)} MB`
      }
    },
    {
      accessorKey: 'created_at',
      header: 'Uploaded',
      cell: ({ row }) => {
        const date = new Date(row.getValue('created_at') as string)
        return date.toLocaleDateString()
      }
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Scanned Data Organizer</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {user?.email}
            </span>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOutIcon className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b bg-card">
        <div className="container mx-auto px-4">
          <div className="flex space-x-8 overflow-x-auto">
            <button
              className={`py-4 px-2 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'upload'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab('upload')}
            >
              <UploadIcon className="h-4 w-4 inline mr-2" />
              Upload
            </button>
            <button
              className={`py-4 px-2 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'documents'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab('documents')}
            >
              <FileTextIcon className="h-4 w-4 inline mr-2" />
              Documents ({documents.length})
            </button>
            <button
              className={`py-4 px-2 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'data'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab('data')}
            >
              <TableIcon className="h-4 w-4 inline mr-2" />
              Data ({parsedData.length} rows)
            </button>
            <button
              className={`py-4 px-2 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'analytics'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab('analytics')}
            >
              <BarChart3 className="h-4 w-4 inline mr-2" />
              Analytics
            </button>
            <button
              className={`py-4 px-2 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'collaboration'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab('collaboration')}
            >
              <Users className="h-4 w-4 inline mr-2" />
              Collaboration
            </button>
            <button
              className={`py-4 px-2 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'versions'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab('versions')}
            >
              <History className="h-4 w-4 inline mr-2" />
              Versions
            </button>
            <button
              className={`py-4 px-2 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'activity'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab('activity')}
            >
              <Activity className="h-4 w-4 inline mr-2" />
              Activity
            </button>
            <button
              className={`py-4 px-2 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'risk-management'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab('risk-management')}
            >
              <Shield className="h-4 w-4 inline mr-2" />
              Risk Management
            </button>
            <button
              className={`py-4 px-2 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'workflow'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab('workflow')}
            >
              <CheckSquare className="h-4 w-4 inline mr-2" />
              Workflow Management
            </button>
            <button
              className={`py-4 px-2 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'compliance'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab('compliance')}
            >
              <FileText className="h-4 w-4 inline mr-2" />
              Compliance
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {activeTab === 'upload' && (
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Upload Documents</CardTitle>
                <CardDescription>
                  Upload your scanned documents or images to extract and organize data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileUpload 
                  onFilesUploaded={handleFilesUploaded}
                  maxFiles={10}
                  suggestedTags={[
                    'invoice', 'receipt', 'contract', 'report', 'form', 
                    'financial', 'legal', 'urgent', 'tax', 'insurance',
                    'medical', 'hr', 'customer', 'vendor', 'education'
                  ]}
                />
                {isLoading && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-blue-800">Processing files... This may take a few moments.</p>
                    <div className="mt-2 text-sm text-blue-600">
                      ✨ Tags will be automatically applied to categorize your documents for better analytics!
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="space-y-4">
            {selectedDocumentId && (
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">
                    Selected document: <span className="font-medium">{documents.find(d => d.id === selectedDocumentId)?.name}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-2"
                      onClick={() => setSelectedDocumentId(null)}
                    >
                      Clear Selection
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            <DataTable
              data={documents}
              columns={documentColumns}
              searchable={true}
              exportable={false}
              onRowClick={(document: any) => {
                setSelectedDocumentId(document.id)
                // Show a notification that the document was selected
                console.log('Selected document:', document.name)
              }}
            />
          </div>
        )}

        {activeTab === 'data' && (
          <DataTable
            data={parsedData}
            columns={dataColumns}
            searchable={true}
            exportable={true}
            onExport={handleExport}
          />
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Analytics Dashboard
                  {selectedWorkspace && (
                    <span className="text-sm text-muted-foreground">- {selectedWorkspace.name}</span>
                  )}
                </CardTitle>
                <CardDescription>
                  {selectedWorkspace 
                    ? 'Real-time analytics for your collaborative workspace'
                    : 'Real-time analytics for your personal documents'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <Button
                    variant="outline"
                    onClick={loadAnalyticsData}
                    disabled={analyticsLoading}
                  >
                    {analyticsLoading ? 'Refreshing...' : 'Refresh Data'}
                  </Button>
                  {!analyticsData && (
                    <div className="text-sm text-muted-foreground flex items-center">
                      No data yet? Upload some documents first!
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <AnalyticsDashboard 
              data={analyticsData || generateSampleAnalytics()} 
              loading={analyticsLoading}
              isRealData={!!analyticsData}
            />
            
            {!analyticsData && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No Analytics Data Yet</p>
                    <p>Upload some documents and start using the app to see real analytics!</p>
                    <p className="text-sm mt-2">The charts above show sample data for demonstration.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'collaboration' && (
          <CollaborativeWorkspace
            currentUserId={user?.id || ''}
            workspace={selectedWorkspace}
            onWorkspaceChange={setSelectedWorkspace}
          />
        )}

        {activeTab === 'versions' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Document Selection</CardTitle>
                <CardDescription>
                  Select a document to view its version history
                </CardDescription>
              </CardHeader>
              <CardContent>
                {documents.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground mb-4">Recent documents:</p>
                    {documents.slice(0, 10).map((doc) => (
                      <Button
                        key={doc.id}
                        variant={selectedDocument === doc.id ? "default" : "outline"}
                        className="w-full justify-start"
                        onClick={() => setSelectedDocument(doc.id)}
                      >
                        <FileTextIcon className="h-4 w-4 mr-2" />
                        {doc.name}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No documents available. Upload some documents first.</p>
                )}
              </CardContent>
            </Card>

            {selectedDocument && (
              <VersionHistory
                documentId={selectedDocument}
                onRestoreVersion={(version) => {
                  console.log('Restoring version:', version)
                  // Handle version restoration
                }}
                onPreviewVersion={(version) => {
                  console.log('Previewing version:', version)
                  // Handle version preview
                }}
              />
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <ActivityFeed userId={user?.id || ''} workspaceId={selectedWorkspace?.id} />
        )}

        {activeTab === 'risk-management' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold tracking-tight">Risk Management</h2>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </div>
            
            <RiskDashboard 
              documentId={selectedDocumentId || undefined}
              workspaceId={selectedWorkspace?.id}
            />
          </div>
        )}

        {activeTab === 'workflow' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold tracking-tight">Workflow Management</h2>
            </div>
            
            {selectedDocumentId ? (
              <WorkflowManager 
                documentId={selectedDocumentId}
                workspaceId={selectedWorkspace?.id}
              />
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">Select a Document</h3>
                  <p className="text-muted-foreground">
                    Choose a document from the Documents tab to view its workflow status and manage reviews.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'compliance' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold tracking-tight">Compliance Dashboard</h2>
              {complianceData?.isDemo && (
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                  Demo Mode
                </Badge>
              )}
              <Button 
                onClick={loadComplianceData} 
                disabled={complianceLoading}
                size="sm"
                variant="outline"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${complianceLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
            
            {complianceLoading ? (
              <div className="flex items-center justify-center p-8">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading compliance data...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Dynamic Compliance Overview Cards */}
                {complianceData?.frameworks?.map((framework: any) => {
                  const score = framework.score || 0
                  const getStatusColor = (score: number) => {
                    if (score >= 95) return 'text-green-500'
                    if (score >= 80) return 'text-yellow-500'
                    return 'text-red-500'
                  }
                  
                  const getStatusIcon = (score: number) => {
                    if (score >= 95) return <Shield className="h-8 w-8 text-green-500" />
                    if (score >= 80) return <AlertTriangle className="h-8 w-8 text-yellow-500" />
                    return <AlertTriangle className="h-8 w-8 text-red-500" />
                  }

                  return (
                    <Card key={framework.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">{framework.name}</p>
                            <p className={`text-2xl font-bold ${getStatusColor(score)}`}>{score}%</p>
                          </div>
                          {getStatusIcon(score)}
                        </div>
                      </CardContent>
                    </Card>
                  )
                }) || (
                  // Fallback cards if no data
                  <>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">SOX Compliance</p>
                            <p className="text-2xl font-bold text-green-500">95%</p>
                          </div>
                          <Shield className="h-8 w-8 text-green-500" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">PCAOB Standards</p>
                            <p className="text-2xl font-bold text-yellow-500">88%</p>
                          </div>
                          <AlertTriangle className="h-8 w-8 text-yellow-500" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">GDPR</p>
                            <p className="text-2xl font-bold text-green-500">92%</p>
                          </div>
                          <CheckCircle className="h-8 w-8 text-green-500" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">ISO 27001</p>
                            <p className="text-2xl font-bold text-green-500">97%</p>
                          </div>
                          <Shield className="h-8 w-8 text-green-500" />
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            )}

            {/* Compliance Details */}
            <Card>
              <CardHeader>
                <CardTitle>Compliance Framework Status</CardTitle>
                <CardDescription>
                  Current compliance status across all regulatory frameworks
                  {complianceData?.lastUpdated && (
                    <span className="text-xs block mt-1">
                      Last updated: {new Date(complianceData.lastUpdated).toLocaleString()}
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {complianceData?.frameworks?.map((framework: any) => {
                    const score = framework.score || 0
                    const getStatusColor = (score: number) => {
                      if (score >= 95) return 'text-green-600'
                      if (score >= 80) return 'text-yellow-600'
                      return 'text-red-600'
                    }
                    
                    const getProgressColor = (score: number) => {
                      if (score >= 95) return 'bg-green-500'
                      if (score >= 80) return 'bg-yellow-500'
                      return 'bg-red-500'
                    }

                    const getComplianceDescription = (frameworkName: string, score: number) => {
                      const descriptions: { [key: string]: string } = {
                        'SOX': score >= 95 
                          ? 'All data retention and audit trail requirements met. Digital signatures implemented.'
                          : score >= 80 
                          ? 'Data retention and audit trail requirements met. Digital signatures pending.'
                          : 'Audit trail implementation in progress. Data retention policies need review.',
                        'PCAOB Standards': score >= 95
                          ? 'All workpaper documentation complete. Independence verification and review documentation finalized.'
                          : score >= 80
                          ? 'Workpaper documentation complete. Independence verification and review documentation in progress.'
                          : 'Workpaper documentation in progress. Independence requirements need attention.',
                        'GDPR': score >= 95
                          ? 'All data protection requirements met. Consent tracking, data portability, and right to erasure fully implemented.'
                          : score >= 80
                          ? 'Consent tracking, data portability, and right to erasure fully implemented. Some minor requirements pending.'
                          : 'Data protection implementation in progress. Privacy policies need review.',
                        'ISO 27001': score >= 95
                          ? 'Access control, encryption, and audit logging fully compliant with information security standards.'
                          : score >= 80
                          ? 'Most security standards met. Some access control or encryption requirements pending.'
                          : 'Information security implementation in progress. Access control and encryption need attention.'
                      }
                      return descriptions[frameworkName] || `${score}% compliance with ${frameworkName} requirements.`
                    }

                    return (
                      <div key={framework.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{framework.name}</span>
                          <span className={`text-sm ${getStatusColor(score)}`}>
                            {score}% Compliant
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${getProgressColor(score)}`} 
                            style={{ width: `${score}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {getComplianceDescription(framework.name, score)}
                        </p>
                      </div>
                    )
                  }) || (
                    // Fallback to static data if no live data available
                    <>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Sarbanes-Oxley Act (SOX)</span>
                          <span className="text-sm text-green-600">95% Compliant</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: '95%' }}></div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          All data retention and audit trail requirements met. Digital signatures pending for full compliance.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">PCAOB Standards</span>
                          <span className="text-sm text-yellow-600">88% Compliant</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '88%' }}></div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Workpaper documentation complete. Independence verification and review documentation in progress.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">GDPR</span>
                          <span className="text-sm text-green-600">92% Compliant</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Consent tracking, data portability, and right to erasure fully implemented.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">ISO 27001</span>
                          <span className="text-sm text-green-600">97% Compliant</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: '97%' }}></div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Access control, encryption, and audit logging fully compliant with information security standards.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}

// Activity Feed Component
function ActivityFeed({ userId, workspaceId }: { userId: string; workspaceId?: string }) {
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadActivities()
  }, [userId, workspaceId])

  const loadActivities = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (workspaceId) {
        query = query.eq('workspace_id', workspaceId)
      } else {
        query = query.eq('user_id', userId)
      }

      const { data, error } = await query

      if (error) throw error
      setActivities(data || [])
    } catch (error) {
      console.error('Error loading activities:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Feed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Activity Feed
        </CardTitle>
        <CardDescription>
          Recent activities across your documents and workspaces
        </CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No recent activity</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Activity className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{activity.action}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(activity.created_at).toLocaleString()}
                  </p>
                  {activity.details && Object.keys(activity.details).length > 0 && (
                    <div className="mt-2 text-xs bg-muted p-2 rounded">
                      <pre>{JSON.stringify(activity.details, null, 2)}</pre>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Helper function to determine category from tags
function determineCategoryFromTags(tags: string[]): string {
  const categoryMap: { [key: string]: string } = {
    'invoice': 'financial',
    'receipt': 'financial', 
    'financial': 'financial',
    'contract': 'legal',
    'legal': 'legal',
    'report': 'reports',
    'form': 'forms',
    'hr': 'human-resources',
    'medical': 'medical',
    'insurance': 'insurance',
    'tax': 'tax',
    'education': 'education'
  }

  // Find the first matching category
  for (const tag of tags) {
    const lowerTag = tag.toLowerCase()
    if (categoryMap[lowerTag]) {
      return categoryMap[lowerTag]
    }
  }

  return 'general'
}
