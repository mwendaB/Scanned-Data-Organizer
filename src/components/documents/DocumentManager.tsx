import React, { useState, useEffect, useCallback } from 'react'
import { FileText, Upload, Download, Trash2, Eye, Edit, Search, Filter } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { ButtonActionService } from '@/lib/button-actions'
import { UserManagementService } from '@/lib/user-management'
import { ErrorHandler } from '@/lib/error-handler'
import { RoleBasedAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

interface Document {
  id: string
  filename: string
  file_type: string
  file_size: number
  uploaded_by: string
  tags: string[]
  created_at: string
  status?: string
  is_deleted?: boolean
}

interface DocumentManagerProps {
  currentUser?: any
  onDocumentSelect?: (document: Document) => void
}

export function DocumentManager({ currentUser, onDocumentSelect }: DocumentManagerProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [uploading, setUploading] = useState(false)

  const loadDocuments = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Filter documents based on user permissions
      let userDocuments = data || []
      if (!RoleBasedAuth.hasPermission(currentUser, 'document:read')) {
        // Regular users can only see their own documents
        userDocuments = userDocuments.filter(doc => doc.uploaded_by === currentUser?.email)
      }

      setDocuments(userDocuments)
      setFilteredDocuments(userDocuments)
    } catch (error) {
      ErrorHandler.handleApiError(error, 'load documents')
      setDocuments([])
      setFilteredDocuments([])
    } finally {
      setLoading(false)
    }
  }, [currentUser])

  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  // Apply filters whenever search term or filters change
  useEffect(() => {
    let filtered = documents

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(doc => 
        doc.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(doc => doc.file_type.includes(filterType))
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(doc => doc.status === filterStatus)
    }

    setFilteredDocuments(filtered)
  }, [documents, searchTerm, filterType, filterStatus])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const result = await ButtonActionService.handleDocumentUpload(file, currentUser?.id)
      if (result.success) {
        loadDocuments() // Refresh the list
        event.target.value = '' // Clear the input
      }
    } catch (error) {
      ErrorHandler.handleApiError(error, 'upload document')
    } finally {
      setUploading(false)
    }
  }

  const handleDocumentDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return

    const result = await ButtonActionService.handleDocumentDelete(documentId, currentUser?.id)
    if (result.success) {
      loadDocuments() // Refresh the list
    }
  }

  const handleBatchDelete = async () => {
    if (selectedDocuments.length === 0) return
    if (!confirm(`Are you sure you want to delete ${selectedDocuments.length} document(s)?`)) return

    const result = await ButtonActionService.handleBatchOperation('delete', selectedDocuments, currentUser?.id)
    if (result.success) {
      setSelectedDocuments([])
      loadDocuments() // Refresh the list
    }
  }

  const handleDocumentSelect = (documentId: string, checked: boolean) => {
    if (checked) {
      setSelectedDocuments(prev => [...prev, documentId])
    } else {
      setSelectedDocuments(prev => prev.filter(id => id !== documentId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDocuments(filteredDocuments.map(doc => doc.id))
    } else {
      setSelectedDocuments([])
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileTypeIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄'
    if (fileType.includes('image')) return '🖼️'
    if (fileType.includes('word') || fileType.includes('document')) return '📝'
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊'
    return '📁'
  }

  const canUpload = RoleBasedAuth.hasPermission(currentUser, 'document:create')
  const canDelete = RoleBasedAuth.hasPermission(currentUser, 'document:delete')
  const canViewAll = RoleBasedAuth.hasPermission(currentUser, 'document:read')

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded animate-pulse" />
        <div className="h-64 bg-muted rounded animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header and Upload */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Document Management</h2>
          <p className="text-muted-foreground">
            {canViewAll ? 'Manage all documents' : 'Manage your documents'}
          </p>
        </div>
        
        {canUpload && (
          <div className="flex items-center gap-2">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={handleFileUpload}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
            />
            <Button
              onClick={() => document.getElementById('file-upload')?.click()}
              disabled={uploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Uploading...' : 'Upload Document'}
            </Button>
          </div>
        )}
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="File type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="image">Images</SelectItem>
                <SelectItem value="word">Documents</SelectItem>
                <SelectItem value="excel">Spreadsheets</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Batch Actions */}
      {selectedDocuments.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {selectedDocuments.length} document(s) selected
              </span>
              <div className="flex gap-2">
                {canDelete && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBatchDelete}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Selected
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDocuments([])}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Documents ({filteredDocuments.length})</CardTitle>
          <CardDescription>
            {searchTerm || filterType !== 'all' || filterStatus !== 'all' 
              ? `Filtered from ${documents.length} total documents`
              : 'All your documents'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedDocuments.length === filteredDocuments.length && filteredDocuments.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Document</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.map((document) => (
                <TableRow key={document.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedDocuments.includes(document.id)}
                      onCheckedChange={(checked) => handleDocumentSelect(document.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getFileTypeIcon(document.file_type)}</span>
                      <div>
                        <p className="font-medium">{document.filename}</p>
                        <p className="text-sm text-muted-foreground">
                          ID: {document.id.substring(0, 8)}...
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {document.file_type.split('/')[1]?.toUpperCase() || 'Unknown'}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatFileSize(document.file_size)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {document.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {document.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{document.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{new Date(document.created_at).toLocaleDateString()}</p>
                      <p className="text-xs text-muted-foreground">
                        {document.uploaded_by?.split('@')[0] || 'Unknown'}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={document.status === 'approved' ? 'default' : 'secondary'}>
                      {document.status || 'pending'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDocumentSelect?.(document)}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      {(document.uploaded_by === currentUser?.email || canDelete) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDocumentDelete(document.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredDocuments.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No documents found</h3>
              <p>
                {searchTerm || filterType !== 'all' || filterStatus !== 'all'
                  ? 'Try adjusting your filters or search term'
                  : canUpload 
                    ? 'Upload your first document to get started'
                    : 'No documents available'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
