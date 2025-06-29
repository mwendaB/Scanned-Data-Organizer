import React, { useState, useEffect, useCallback } from 'react'
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
import { LogOutIcon, FileTextIcon, UploadIcon, TableIcon, BarChart3, Users, History, Activity, RefreshCw, Shield, AlertTriangle, CheckCircle, CheckSquare, FileText, MessageSquare, Download, Trash2, Settings } from 'lucide-react'
import { Document, ParsedData } from '@/types'
import { RiskDashboard } from '@/components/RiskDashboard'
import { WorkflowManager } from '@/components/WorkflowManager'
import { ReviewComments } from '@/components/ReviewComments'
import { ExportOptions } from '@/components/ExportOptions'
import { DataTableExportOptions } from '@/components/DataTableExportOptions'
import { RoleManagement } from '@/components/RoleManagement'
import { RoleBasedAuth } from '@/lib/auth'
import { DeleteService } from '@/lib/delete-service'
import ComplianceManager from '@/components/ComplianceManager'

export function Dashboard() {
  const {
    user,
    setUser,
    documents,
    setDocuments,
    parsedData,
    setParsedData,
    removeDocument,
    removeParsedData,
    isLoading,
    setIsLoading
  } = useAppStore()

  const [activeTab, setActiveTab] = useState<'upload' | 'documents' | 'data' | 'analytics' | 'collaboration' | 'versions' | 'activity' | 'risk-management' | 'workflow' | 'compliance' | 'reviews' | 'export' | 'roles'>('upload')
  const [processingFiles, setProcessingFiles] = useState<string[]>([])
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null)
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null)
  const [showExportOptions, setShowExportOptions] = useState(false)
  const [selectedDataRows, setSelectedDataRows] = useState<string[]>([])
  const [showDataExportOptions, setShowDataExportOptions] = useState(false)
  const [selectedWorkspace, setSelectedWorkspace] = useState<any>(null)
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [currentFile, setCurrentFile] = useState<string | null>(null)
  const [progress, setProgress] = useState<number>(0)
  const [complianceData, setComplianceData] = useState<any>(null)
  const [complianceLoading, setComplianceLoading] = useState(false)

  useEffect(() => {
    const loadUserProfile = async () => {
      if (user) {
        try {
          // Load the user's profile with role information
          const userProfile = await RoleBasedAuth.getCurrentUser()
          if (userProfile) {
            setUser(userProfile)
          }
          
          loadUserDocuments()
          loadUserData()
          loadAnalyticsData()
          loadComplianceData()
        } catch (error) {
          console.error('Error loading user profile:', error)
        }
      }
    }
    
    loadUserProfile()
  }, [user?.id]) // Only depend on user ID to avoid infinite loops

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
      // Get the current authenticated user
      const { data: authData } = await supabase.auth.getUser()
      const currentUserEmail = authData?.user?.email
      
      if (currentUserEmail) {
        console.log('Loading analytics for user:', currentUserEmail)
        const data = await AnalyticsService.getRealAnalytics(currentUserEmail, selectedWorkspace?.id)
        setAnalyticsData(data)
      } else {
        // Fallback to sample data if no user
        setAnalyticsData(generateSampleAnalytics())
      }
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
      // Get the current authenticated user
      const { data: authData } = await supabase.auth.getUser()
      const currentUserEmail = authData?.user?.email
      
      if (!currentUserEmail) {
        console.log('No authenticated user found')
        setDocuments([])
        return
      }
      
      console.log('Loading documents for user:', currentUserEmail)
      
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('uploaded_by', currentUserEmail)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      console.log(`Found ${data?.length || 0} documents for ${currentUserEmail}`)
      setDocuments(data || [])
    } catch (error) {
      console.error('Error loading documents:', error)
    }
  }

  const loadUserData = async () => {
    try {
      // Get the current authenticated user
      const { data: authData } = await supabase.auth.getUser()
      const currentUserEmail = authData?.user?.email
      
      if (!currentUserEmail) {
        console.log('No authenticated user found for parsed data')
        setParsedData([])
        return
      }
      
      const { data: userDocs } = await supabase
        .from('documents')
        .select('id')
        .eq('uploaded_by', currentUserEmail)

      if (userDocs && userDocs.length > 0) {
        const docIds = userDocs.map(doc => doc.id)
        const { data, error } = await supabase
          .from('parsed_data')
          .select('*')
          .in('document_id', docIds)
          .order('created_at', { ascending: false })

        if (error) throw error
        console.log(`Found ${data?.length || 0} parsed data entries for ${currentUserEmail}`)
        setParsedData(data || [])
      } else {
        setParsedData([])
      }
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
          try {
            await AuditingService.logAuditEvent({
              table_name: 'documents',
              record_id: '',
              action_type: 'CREATE',
              new_values: { filename: file.name, size: file.size },
              risk_level: 'LOW'
            })
          } catch (auditError) {
            console.warn('Audit logging failed for file upload:', auditError)
          }

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
              uploaded_by: user?.id,
              name: file.name,
              file_path: uploadData.path,
              mime_type: file.type,
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

          // Save parsed data to database using the correct structure
          for (const [index, item] of structuredData.entries()) {
            // For each field in the structured data item
            for (const [fieldName, fieldValue] of Object.entries(item)) {
              await supabase
                .from('parsed_data')
                .insert({
                  document_id: docData.id,
                  field_name: fieldName,
                  field_value: String(fieldValue),
                  confidence: 0.95, // Default confidence
                  field_type: 'text',
                  page_number: 1,
                  coordinates: null
                })
            }
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
    const csvHeader = 'Field Name,Field Value,Field Type,Confidence\n'
    const csvContent = csvHeader + parsedData.map(item => {
      return `"${item.field_name || ''}","${item.field_value || ''}","${item.field_type || ''}","${item.confidence || ''}"`
    }).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'exported_data.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleDataTableExport = (selectedData: ParsedData[], format: 'csv' | 'json') => {
    if (format === 'csv') {
      const csvHeader = 'Field Name,Field Value,Field Type,Confidence,Document ID,Created Date\n'
      const csvContent = csvHeader + selectedData.map(item => {
        return `"${item.field_name || ''}","${item.field_value || ''}","${item.field_type || ''}","${item.confidence || ''}","${item.document_id}","${new Date(item.created_at).toLocaleDateString()}"`
      }).join('\n')
      
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `data_export_${selectedData.length}_records_${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } else {
      const jsonContent = JSON.stringify({
        exported_at: new Date().toISOString(),
        total_records: selectedData.length,
        data: selectedData
      }, null, 2)
      
      const blob = new Blob([jsonContent], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `data_export_${selectedData.length}_records_${new Date().toISOString().split('T')[0]}.json`
      a.click()
      window.URL.revokeObjectURL(url)
    }
  }

  // Delete handlers (ADMIN ONLY - SOFT DELETE)
  const handleDeleteDocument = async (documentId: string) => {
    if (!user?.id) return

    // Check if user is admin
    const isAdmin = user.role === 'admin' || (user.permissions && user.permissions.includes('document:delete'))
    
    if (!isAdmin) {
      alert('Only administrators can delete documents.')
      return
    }

    const confirmed = window.confirm('Are you sure you want to delete this document? This will mark it as deleted but can be restored by an admin.')
    if (!confirmed) return

    try {
      setIsLoading(true)
      
      const result = await DeleteService.softDeleteDocument(documentId, user.id)

      if (result.success) {
        // Remove from local state (soft deleted records are hidden from view)
        removeDocument(documentId)
        // Also remove related parsed data from view
        const relatedParsedData = parsedData.filter(data => data.document_id === documentId)
        relatedParsedData.forEach(data => removeParsedData(data.id))
        alert('Document deleted successfully! (Can be restored by admin)')
      } else {
        alert(`Failed to delete document: ${result.error}`)
      }
    } catch (error: any) {
      console.error('Delete document error:', error)
      alert(`Error deleting document: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteParsedData = async (parsedDataId: string) => {
    if (!user?.id) return

    // Check if user is admin
    const isAdmin = user.role === 'admin' || (user.permissions && user.permissions.includes('document:delete'))
    
    if (!isAdmin) {
      alert('Only administrators can delete parsed data.')
      return
    }

    const confirmed = window.confirm('Are you sure you want to delete this parsed data record? This will mark it as deleted but can be restored by an admin.')
    if (!confirmed) return

    try {
      setIsLoading(true)
      
      const result = await DeleteService.softDeleteParsedData(parsedDataId, user.id)

      if (result.success) {
        // Remove from local state (soft deleted records are hidden from view)
        removeParsedData(parsedDataId)
        alert('Parsed data deleted successfully! (Can be restored by admin)')
      } else {
        alert(`Failed to delete parsed data: ${result.error}`)
      }
    } catch (error: any) {
      console.error('Delete parsed data error:', error)
      alert(`Error deleting parsed data: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Define columns for the data table
  const dataColumns: ColumnDef<ParsedData>[] = [
    {
      accessorKey: 'field_name',
      header: 'Field Name',
    },
    {
      accessorKey: 'field_value',
      header: 'Field Value',
      cell: ({ row }) => {
        const value = row.getValue('field_value') as string
        return (
          <div className="max-w-xs truncate">
            {value || 'No value'}
          </div>
        )
      }
    },
    {
      accessorKey: 'field_type',
      header: 'Type',
    },
    {
      accessorKey: 'confidence',
      header: 'Confidence',
      cell: ({ row }) => {
        const confidence = row.getValue('confidence') as number
        return (
          <div>
            {confidence ? `${Math.round(confidence * 100)}%` : 'N/A'}
          </div>
        )
      }
    },
    {
      accessorKey: 'created_at',
      header: 'Created',
      cell: ({ row }) => {
        const date = new Date(row.getValue('created_at') as string)
        return date.toLocaleDateString()
      }
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const parsedData = row.original
        const isAdmin = user?.role === 'admin' || (user?.permissions && user.permissions.includes('document:delete'))
        
        return (
          <Button
            variant="destructive"
            size="sm"
            disabled={!isAdmin}
            onClick={(e) => {
              e.stopPropagation()
              handleDeleteParsedData(parsedData.id)
            }}
            title={isAdmin ? 'Delete parsed data (soft delete)' : 'Only administrators can delete parsed data'}
          >
            <Trash2 className="h-4 w-4" />
            {!isAdmin && <span className="ml-1 text-xs">(Admin Only)</span>}
          </Button>
        )
      }
    }
  ]

  const documentColumns: ColumnDef<Document>[] = [
    {
      accessorKey: 'filename',
      header: 'File Name',
    },
    {
      accessorKey: 'mime_type',
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
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const document = row.original
        const isAdmin = user?.role === 'admin' || (user?.permissions && user.permissions.includes('document:delete'))
        
        return (
          <Button
            variant="destructive"
            size="sm"
            disabled={!isAdmin}
            onClick={(e) => {
              e.stopPropagation()
              handleDeleteDocument(document.id)
            }}
            title={isAdmin ? 'Delete document (soft delete)' : 'Only administrators can delete documents'}
          >
            <Trash2 className="h-4 w-4" />
            {!isAdmin && <span className="ml-1 text-xs">(Admin Only)</span>}
          </Button>
        )
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
            <button
              className={`py-4 px-2 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'reviews'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab('reviews')}
            >
              <MessageSquare className="h-4 w-4 inline mr-2" />
              Reviews
            </button>
            <button
              className={`py-4 px-2 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'export'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab('export')}
            >
              <Download className="h-4 w-4 inline mr-2" />
              Export
            </button>
            <button
              className={`py-4 px-2 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'roles'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab('roles')}
            >
              <Shield className="h-4 w-4 inline mr-2" />
              User Roles
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
                    Selected document: <span className="font-medium">{documents.find(d => d.id === selectedDocumentId)?.filename || documents.find(d => d.id === selectedDocumentId)?.name}</span>
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
                console.log('Selected document:', document.filename || document.name)
              }}
            />
          </div>
        )}

        {activeTab === 'data' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TableIcon className="h-5 w-5" />
                  Parsed Data ({parsedData.length} records)
                </CardTitle>
                <CardDescription>
                  Extracted fields and values from your documents with confidence scores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExport}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Quick Export (CSV)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDataExportOptions(!showDataExportOptions)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {showDataExportOptions ? 'Hide' : 'Show'} Export Options
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab('export')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Advanced Export
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Data Table Export Options */}
            {showDataExportOptions && (
              <DataTableExportOptions
                data={parsedData}
                selectedRows={selectedDataRows}
                onSelectionChange={setSelectedDataRows}
                onExport={handleDataTableExport}
              />
            )}
            
            <DataTable
              data={parsedData}
              columns={dataColumns}
              searchable={true}
              exportable={false}
            />
          </div>
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
                        {doc.filename || doc.name}
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
            
            <WorkflowManager 
              documentId={selectedDocumentId || undefined}
              workspaceId={selectedWorkspace?.id}
            />
          </div>
        )}

        {activeTab === 'compliance' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold tracking-tight">Compliance Dashboard</h2>
              <div className="flex items-center gap-2">
                <Button 
                  onClick={() => window.open('/compliance', '_blank')}
                  size="sm"
                  variant="default"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Compliance
                </Button>
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

            {/* Full Compliance Management Interface */}
            <ComplianceManager />
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Document Reviews</CardTitle>
                <CardDescription>
                  Manage and respond to reviews for your documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                {documents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No Documents Found</p>
                    <p>Upload documents to see them here and start the review process.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {documents.slice(0, 5).map((doc) => (
                      <Card key={doc.id} className="border-l-4 border-l-blue-500">
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-blue-600" />
                              <div>
                                <span className="text-lg">{doc.filename || doc.name}</span>
                                <p className="text-sm text-muted-foreground font-normal">
                                  Uploaded {new Date(doc.created_at).toLocaleDateString()} • 
                                  {(doc.file_size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <Badge variant="outline">
                              {doc.mime_type}
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ReviewComments 
                            documentId={doc.id} 
                            documentName={doc.filename || doc.name}
                            onCommentAdded={() => {
                              // Optionally refresh data or show notification
                              console.log(`Comment added to ${doc.filename || doc.name}`)
                            }}
                          />
                        </CardContent>
                      </Card>
                    ))}
                    
                    {documents.length > 5 && (
                      <Card>
                        <CardContent className="pt-6 text-center">
                          <p className="text-muted-foreground">
                            And {documents.length - 5} more documents...
                          </p>
                          <Button 
                            variant="outline" 
                            className="mt-2"
                            onClick={() => setActiveTab('documents')}
                          >
                            View All Documents
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'export' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Export Data</CardTitle>
                <CardDescription>
                  Export your data to various formats for reporting and analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  <Button
                    variant="outline"
                    onClick={handleExport}
                    className="w-full"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export Parsed Data (CSV)
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Handle export of documents or other data
                    }}
                    className="w-full"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export Documents
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'roles' && (
          <div className="space-y-6">
            <RoleManagement currentUser={user || undefined} />
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

  const loadActivities = useCallback(async () => {
    setLoading(true)
    try {
      // Get recent document uploads as activity
      let query = supabase
        .from('documents')
        .select('id, filename, created_at, uploaded_by')
        .order('created_at', { ascending: false })
        .limit(10)

      if (workspaceId) {
        query = query.eq('workspace_id', workspaceId)
      } else {
        query = query.eq('uploaded_by', userId)
      }

      const { data, error } = await query

      if (error) throw error
      
      // Transform documents into activity format
      const activityData = data?.map(doc => ({
        id: doc.id,
        action: 'document_uploaded',
        description: `Uploaded document: ${doc.filename}`,
        created_at: doc.created_at,
        user_id: doc.uploaded_by
      })) || []
      
      setActivities(activityData)
    } catch (error) {
      console.error('Error loading activities:', error)
      setActivities([])
    } finally {
      setLoading(false)
    }
  }, [userId, workspaceId])

  useEffect(() => {
    loadActivities()
  }, [loadActivities])

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
