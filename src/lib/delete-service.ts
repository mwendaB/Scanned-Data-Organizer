// Delete utility functions for documents and parsed data (SOFT DELETE ONLY - ADMIN RESTRICTED)
import { supabase } from '@/lib/supabase'
import { AuditingService } from '@/lib/auditing'

export class DeleteService {
  // Check if user is admin with delete permissions
  private static async verifyAdminPermissions(userId: string): Promise<{ isAdmin: boolean; error?: string }> {
    try {
      // Check if user is admin in the documents table (where admin profile is stored)
      const { data: adminUser } = await supabase
        .from('documents')
        .select('user_id, role, permissions')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .contains('permissions', ['document:delete'])
        .limit(1)

      if (!adminUser || adminUser.length === 0) {
        return { isAdmin: false, error: 'Only administrators can delete records' }
      }

      return { isAdmin: true }
    } catch (error: any) {
      return { isAdmin: false, error: `Permission verification failed: ${error.message}` }
    }
  }

  // Soft delete a document (ADMIN ONLY)
  static async softDeleteDocument(documentId: string, adminUserId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Verify admin permissions
      const { isAdmin, error: permError } = await this.verifyAdminPermissions(adminUserId)
      if (!isAdmin) {
        return { success: false, error: permError }
      }

      // Check if document exists and is not already deleted
      const { data: existingDoc, error: fetchError } = await supabase
        .from('documents')
        .select('id, is_deleted, filename')
        .eq('id', documentId)
        .single()

      if (fetchError) {
        return { success: false, error: 'Document not found' }
      }

      if (existingDoc.is_deleted) {
        return { success: false, error: 'Document is already deleted' }
      }

      // Soft delete the document
      const { error: updateError } = await supabase
        .from('documents')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: adminUserId,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId)

      if (updateError) throw updateError

      // Also soft delete related parsed data
      const { error: dataUpdateError } = await supabase
        .from('parsed_data')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: adminUserId,
          updated_at: new Date().toISOString()
        })
        .eq('document_id', documentId)
        .neq('is_deleted', true) // Only update non-deleted records

      if (dataUpdateError) {
        console.warn('Failed to soft delete related parsed data:', dataUpdateError)
      }

      // Log the soft deletion
      await AuditingService.logAuditEvent({
        table_name: 'documents',
        record_id: documentId,
        action_type: 'DELETE',
        old_values: { document_id: documentId, filename: existingDoc.filename },
        new_values: { is_deleted: true, deleted_by: adminUserId },
        risk_level: 'MEDIUM'
      })

      return { success: true }
    } catch (error: any) {
      console.error('Soft delete document error:', error)
      return { success: false, error: error.message }
    }
  }

  // Soft delete parsed data (ADMIN ONLY)
  static async softDeleteParsedData(parsedDataId: string, adminUserId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Verify admin permissions
      const { isAdmin, error: permError } = await this.verifyAdminPermissions(adminUserId)
      if (!isAdmin) {
        return { success: false, error: permError }
      }

      // Check if parsed data exists and is not already deleted
      const { data: existingData, error: fetchError } = await supabase
        .from('parsed_data')
        .select('id, is_deleted, field_name, document_id')
        .eq('id', parsedDataId)
        .single()

      if (fetchError) {
        return { success: false, error: 'Parsed data not found' }
      }

      if (existingData.is_deleted) {
        return { success: false, error: 'Parsed data is already deleted' }
      }

      // Soft delete the parsed data
      const { error: updateError } = await supabase
        .from('parsed_data')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: adminUserId,
          updated_at: new Date().toISOString()
        })
        .eq('id', parsedDataId)

      if (updateError) throw updateError

      // Log the soft deletion
      await AuditingService.logAuditEvent({
        table_name: 'parsed_data',
        record_id: parsedDataId,
        action_type: 'DELETE',
        old_values: { parsed_data_id: parsedDataId, field_name: existingData.field_name },
        new_values: { is_deleted: true, deleted_by: adminUserId },
        risk_level: 'LOW'
      })

      return { success: true }
    } catch (error: any) {
      console.error('Soft delete parsed data error:', error)
      return { success: false, error: error.message }
    }
  }

  // Restore a soft-deleted document (ADMIN ONLY)
  static async restoreDocument(documentId: string, adminUserId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Verify admin permissions
      const { isAdmin, error: permError } = await this.verifyAdminPermissions(adminUserId)
      if (!isAdmin) {
        return { success: false, error: permError }
      }

      // Restore the document
      const { error: updateError } = await supabase
        .from('documents')
        .update({
          is_deleted: false,
          deleted_at: null,
          deleted_by: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId)
        .eq('is_deleted', true)

      if (updateError) throw updateError

      // Log the restoration
      await AuditingService.logAuditEvent({
        table_name: 'documents',
        record_id: documentId,
        action_type: 'UPDATE',
        old_values: { is_deleted: true },
        new_values: { is_deleted: false, restored_by: adminUserId },
        risk_level: 'LOW'
      })

      return { success: true }
    } catch (error: any) {
      console.error('Restore document error:', error)
      return { success: false, error: error.message }
    }
  }

  // Restore soft-deleted parsed data (ADMIN ONLY)
  static async restoreParsedData(parsedDataId: string, adminUserId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Verify admin permissions
      const { isAdmin, error: permError } = await this.verifyAdminPermissions(adminUserId)
      if (!isAdmin) {
        return { success: false, error: permError }
      }

      // Restore the parsed data
      const { error: updateError } = await supabase
        .from('parsed_data')
        .update({
          is_deleted: false,
          deleted_at: null,
          deleted_by: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', parsedDataId)
        .eq('is_deleted', true)

      if (updateError) throw updateError

      // Log the restoration
      await AuditingService.logAuditEvent({
        table_name: 'parsed_data',
        record_id: parsedDataId,
        action_type: 'UPDATE',
        old_values: { is_deleted: true },
        new_values: { is_deleted: false, restored_by: adminUserId },
        risk_level: 'LOW'
      })

      return { success: true }
    } catch (error: any) {
      console.error('Restore parsed data error:', error)
      return { success: false, error: error.message }
    }
  }

  // Get deleted documents for admin review (ADMIN ONLY)
  static async getDeletedDocuments(adminUserId: string): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      // Verify admin permissions
      const { isAdmin, error: permError } = await this.verifyAdminPermissions(adminUserId)
      if (!isAdmin) {
        return { success: false, error: permError }
      }

      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('is_deleted', true)
        .order('deleted_at', { ascending: false })

      if (error) throw error

      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Get deleted parsed data for admin review (ADMIN ONLY)
  static async getDeletedParsedData(adminUserId: string): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      // Verify admin permissions
      const { isAdmin, error: permError } = await this.verifyAdminPermissions(adminUserId)
      if (!isAdmin) {
        return { success: false, error: permError }
      }

      const { data, error } = await supabase
        .from('parsed_data')
        .select('*')
        .eq('is_deleted', true)
        .order('deleted_at', { ascending: false })

      if (error) throw error

      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Legacy function names for backward compatibility - now redirect to soft delete
  static async deleteDocument(documentId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    return this.softDeleteDocument(documentId, userId)
  }

  static async deleteParsedData(parsedDataId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    return this.softDeleteParsedData(parsedDataId, userId)
  }

  static async adminDeleteDocument(documentId: string, adminUserId: string): Promise<{ success: boolean; error?: string }> {
    return this.softDeleteDocument(documentId, adminUserId)
  }
}
