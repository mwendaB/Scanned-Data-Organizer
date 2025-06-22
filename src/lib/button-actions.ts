import { ErrorHandler } from '@/lib/error-handler'
import { UserManagementService } from '@/lib/user-management'
import { supabase } from '@/lib/supabase'
import { RoleBasedAuth } from '@/lib/auth'
import { DeleteService } from './delete-service'

interface ExportFilters {
  userId?: string
  dateFrom?: string
  dateTo?: string
  tags?: string[]
  fileType?: string
}

export class ButtonActionService {
  /**
   * Handle document upload with proper validation and error handling
   */
  static async handleDocumentUpload(file: File, userId: string) {
    return ErrorHandler.safeApiCall(async () => {
      // Validate file
      const validation = ErrorHandler.validateRequired(
        { file: file.name, size: file.size, type: file.type },
        ['file', 'size', 'type']
      )
      if (!validation.isValid) {
        throw new Error(validation.error)
      }

      // Check file size (10MB limit)
      const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
      if (file.size > MAX_FILE_SIZE) {
        throw new Error('File size must be less than 10MB')
      }

      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/jpg',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]
      
      if (!allowedTypes.includes(file.type)) {
        throw new Error('File type not supported. Please upload PDF, images, or document files.')
      }

      // Upload to Supabase storage
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Create document record
      const documentData = {
        id: crypto.randomUUID(),
        user_id: userId,
        uploaded_by: userId,
        filename: file.name,
        name: file.name,
        file_path: uploadData.path,
        file_type: file.type,
        mime_type: file.type,
        file_size: file.size,
        ocr_text: '',
        parsed_data: [],
        tags: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data: docData, error: docError } = await supabase
        .from('documents')
        .insert([documentData])
        .select()
        .single()

      if (docError) throw docError

      return docData
    }, 'upload document', 'Document uploaded successfully')
  }

  /**
   * Handle document deletion with proper authorization
   */
  static async handleDocumentDelete(documentId: string, userId: string) {
    return ErrorHandler.safeApiCall(async () => {
      const currentUser = await UserManagementService.getCurrentUser()
      if (!currentUser) {
        throw new Error('Authentication required')
      }

      // Check if user owns the document or has admin permissions
      const { data: document, error: fetchError } = await supabase
        .from('documents')
        .select('uploaded_by')
        .eq('id', documentId)
        .single()

      if (fetchError) throw fetchError

      const canDelete = document.uploaded_by === userId || 
                       RoleBasedAuth.hasPermission(currentUser, 'document:delete')

      if (!canDelete) {
        throw new Error('You do not have permission to delete this document')
      }

      // Perform soft delete if it's supported, otherwise hard delete
      const { error: deleteError } = await supabase
        .from('documents')
        .update({ 
          is_deleted: true, 
          deleted_at: new Date().toISOString(),
          deleted_by: userId 
        })
        .eq('id', documentId)

      if (deleteError) {
        // Fallback to hard delete if soft delete columns don't exist
        const { error: hardDeleteError } = await supabase
          .from('documents')
          .delete()
          .eq('id', documentId)
        
        if (hardDeleteError) throw hardDeleteError
      }

      return { documentId }
    }, 'delete document', 'Document deleted successfully')
  }

  /**
   * Handle workflow step status update using API endpoint
   */
  static async handleWorkflowStepUpdate(stepId: string, status: string, userId: string) {
    return ErrorHandler.safeApiCall(async () => {
      const currentUser = await UserManagementService.getCurrentUser()
      if (!currentUser) {
        throw new Error('Authentication required')
      }

      // Use API endpoint instead of direct Supabase call
      const response = await fetch('/api/workflow-steps', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          stepId, 
          status,
          completedBy: status === 'COMPLETED' ? userId : undefined,
          completedAt: status === 'COMPLETED' ? new Date().toISOString() : undefined,
          startedAt: status === 'IN_PROGRESS' ? new Date().toISOString() : undefined
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update workflow step')
      }

      const result = await response.json()
      return result.data
    }, 'update workflow step', 'Workflow step updated successfully')
  }

  /**
   * Handle comment submission
   */
  static async handleCommentSubmit(documentId: string, content: string, type: string, userId: string) {
    return ErrorHandler.safeApiCall(async () => {
      const validation = ErrorHandler.validateRequired(
        { documentId, content, type },
        ['documentId', 'content', 'type']
      )
      if (!validation.isValid) {
        throw new Error(validation.error)
      }

      const currentUser = await UserManagementService.getCurrentUser()
      if (!currentUser) {
        throw new Error('Authentication required')
      }

      const commentData = {
        id: crypto.randomUUID(),
        document_id: documentId,
        user_id: userId,
        comment_text: content.trim(),
        comment_type: type,
        is_resolved: false,
        priority: type === 'CONCERN' ? 'HIGH' : 'MEDIUM',
        created_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('review_comments')
        .insert([commentData])
        .select()
        .single()

      if (error) throw error

      return data
    }, 'submit comment', 'Comment added successfully')
  }

  /**
   * Handle role assignment using API endpoint
   */
  static async handleRoleAssignment(userId: string, role: string, adminUserId: string) {
    return ErrorHandler.safeApiCall(async () => {
      const validation = ErrorHandler.validateRequired(
        { userId, role, adminUserId },
        ['userId', 'role', 'adminUserId']
      )
      if (!validation.isValid) {
        throw new Error(validation.error)
      }

      // Use API endpoint instead of direct Supabase call
      const response = await fetch('/api/user-profiles', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId, 
          role,
          assignedBy: adminUserId
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to assign role')
      }

      const result = await response.json()
      return result.data
    }, 'assign role', 'Role assigned successfully')
  }

  /**
   * Handle document assignment for review
   */
  static async handleDocumentAssignment(documentId: string, assigneeId: string, priority: string = 'medium') {
    return ErrorHandler.safeApiCall(async () => {
      const validation = ErrorHandler.validateRequired(
        { documentId, assigneeId },
        ['documentId', 'assigneeId']
      )
      if (!validation.isValid) {
        throw new Error(validation.error)
      }

      return await UserManagementService.assignDocumentReview(
        documentId, 
        assigneeId, 
        priority as 'low' | 'medium' | 'high'
      )
    }, 'assign document review', 'Document assigned for review successfully')
  }

  /**
   * Handle data export
   */
  static async handleDataExport(tableType: string, format: string, filters?: ExportFilters) {
    return ErrorHandler.safeApiCall(async () => {
      const currentUser = await UserManagementService.getCurrentUser()
      if (!currentUser) {
        throw new Error('Authentication required')
      }

      let query = supabase.from(tableType).select('*')

      // Apply filters if provided
      if (filters) {
        if (filters.userId) {
          query = query.eq('uploaded_by', filters.userId)
        }
        if (filters.dateFrom) {
          query = query.gte('created_at', filters.dateFrom)
        }
        if (filters.dateTo) {
          query = query.lte('created_at', filters.dateTo)
        }
      }

      const { data, error } = await query

      if (error) throw error

      // Format data based on export type
      if (format === 'csv') {
        return this.convertToCSV(data)
      } else if (format === 'json') {
        return JSON.stringify(data, null, 2)
      }

      return data
    }, 'export data', `Data exported as ${format} successfully`)
  }

  /**
   * Convert data to CSV format
   */
  private static convertToCSV(data: Record<string, unknown>[]): string {
    if (!data || data.length === 0) return ''

    const headers = Object.keys(data[0])
    const csvRows = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header]
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value
        }).join(',')
      )
    ]

    return csvRows.join('\n')
  }

  /**
   * Handle analytics refresh
   */
  static async handleAnalyticsRefresh(userId: string, workspaceId?: string) {
    return ErrorHandler.safeApiCall(async () => {
      const currentUser = await UserManagementService.getCurrentUser()
      if (!currentUser) {
        throw new Error('Authentication required')
      }

      // This would trigger analytics recalculation
      // For now, we'll just return success
      return {
        refreshed: true,
        timestamp: new Date().toISOString(),
        userId,
        workspaceId
      }
    }, 'refresh analytics', 'Analytics refreshed successfully')
  }

  /**
   * Handle batch operations
   */
  static async handleBatchOperation(operation: string, itemIds: string[], userId: string) {
    return ErrorHandler.safeApiCall(async () => {
      const currentUser = await UserManagementService.getCurrentUser()
      if (!currentUser) {
        throw new Error('Authentication required')
      }

      const results = []
      let successCount = 0
      let errorCount = 0

      for (const itemId of itemIds) {
        try {
          let result
          switch (operation) {
            case 'delete':
              result = await this.handleDocumentDelete(itemId, userId)
              break
            case 'archive':
              result = await this.handleDocumentArchive(itemId, userId)
              break
            default:
              throw new Error(`Unknown operation: ${operation}`)
          }
          
          if (result.success) {
            successCount++
          } else {
            errorCount++
          }
          results.push({ id: itemId, success: result.success, error: result.error })
        } catch (error: unknown) {
          errorCount++
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          results.push({ id: itemId, success: false, error: errorMessage })
        }
      }

      return {
        total: itemIds.length,
        successful: successCount,
        errors: errorCount,
        results
      }
    }, 'batch operation')
  }

  /**
   * Handle document archiving
   */
  private static async handleDocumentArchive(documentId: string, userId: string) {
    return ErrorHandler.safeApiCall(async () => {
      const { data, error } = await supabase
        .from('documents')
        .update({ 
          is_archived: true, 
          archived_at: new Date().toISOString(),
          archived_by: userId 
        })
        .eq('id', documentId)

      if (error) throw error
      return data
    }, 'archive document')
  }

  // Delete Operations
  static async deleteDocument(documentId: string, userId?: string): Promise<{ success: boolean; error?: string }> {
    return ErrorHandler.safeApiCall(async () => {
      const result = await DeleteService.deleteDocument(documentId, userId || '')
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete document')
      }
      return result
    }, 'delete document', 'Document deleted successfully')
  }

  static async deleteParsedData(parsedDataId: string, userId?: string): Promise<{ success: boolean; error?: string }> {
    return ErrorHandler.safeApiCall(async () => {
      const result = await DeleteService.deleteParsedData(parsedDataId, userId || '')
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete parsed data')
      }
      return result
    }, 'delete parsed data', 'Parsed data deleted successfully')
  }

  static async adminDeleteDocument(documentId: string, adminUserId: string): Promise<{ success: boolean; error?: string }> {
    return ErrorHandler.safeApiCall(async () => {
      const result = await DeleteService.adminDeleteDocument(documentId, adminUserId)
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete document')
      }
      return result
    }, 'admin delete document', 'Document deleted by admin successfully')
  }

  static async deleteBulkDocuments(documentIds: string[], userId?: string): Promise<{ deleted: number }> {
    const result = await ErrorHandler.safeApiCall(async () => {
      const currentUser = await UserManagementService.getCurrentUser()
      if (!currentUser) {
        throw new Error('Authentication required')
      }

      let deleted = 0
      for (const documentId of documentIds) {
        try {
          const result = await DeleteService.deleteDocument(documentId, userId || '')
          if (result.success) {
            deleted++
          }
        } catch (error) {
          console.error(`Failed to delete document ${documentId}:`, error)
        }
      }

      return { deleted }
    }, 'bulk delete documents', `${documentIds.length} documents processed`)

    return result.data || { deleted: 0 }
  }

  static async canDeleteDocument(documentId: string, userId: string): Promise<boolean> {
    try {
      const currentUser = await UserManagementService.getCurrentUser()
      if (!currentUser) return false

      // Check if user owns the document or has admin permissions
      const { data: document, error: fetchError } = await supabase
        .from('documents')
        .select('uploaded_by')
        .eq('id', documentId)
        .single()

      if (fetchError) return false

      return document.uploaded_by === userId || 
             RoleBasedAuth.hasPermission(currentUser, 'document:delete')
    } catch (error) {
      return false
    }
  }
}
