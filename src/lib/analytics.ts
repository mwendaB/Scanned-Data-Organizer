import { supabase } from '@/lib/supabase'

export interface RealAnalyticsData {
  documentsPerDay: Array<{ date: string; count: number }>
  documentsByCategory: Array<{ category: string; count: number; color: string }>
  processingTime: Array<{ date: string; avgTime: number }>
  userActivity: Array<{ user: string; actions: number; documents: number }>
  tagUsage: Array<{ tag: string; count: number }>
  weeklyStats: {
    totalDocuments: number
    totalProcessed: number
    avgProcessingTime: number
    activeUsers: number
  }
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316']

export class AnalyticsService {
  
  static async getRealAnalytics(userId: string, workspaceId?: string): Promise<RealAnalyticsData> {
    try {
      // Base query filters - fix for our data structure
      const baseFilters = workspaceId 
        ? { workspace_id: workspaceId }
        : { uploaded_by: userId }

      // Get documents per day (last 30 days)
      const documentsPerDay = await this.getDocumentsPerDay(baseFilters)
      
      // Get documents by category
      const documentsByCategory = await this.getDocumentsByCategory(baseFilters)
      
      // Get processing time trends
      const processingTime = await this.getProcessingTimes(baseFilters)
      
      // Get user activity (if workspace, otherwise just current user)
      const userActivity = workspaceId 
        ? await this.getWorkspaceUserActivity(workspaceId)
        : await this.getCurrentUserActivity(userId)
      
      // Get tag usage
      const tagUsage = await this.getTagUsage(baseFilters)
      
      // Get weekly stats
      const weeklyStats = await this.getWeeklyStats(baseFilters)

      return {
        documentsPerDay,
        documentsByCategory,
        processingTime,
        userActivity,
        tagUsage,
        weeklyStats
      }
    } catch (error) {
      console.error('Error fetching real analytics:', error)
      // Return empty structure on error
      return this.getEmptyAnalytics()
    }
  }

  private static async getDocumentsPerDay(filters: any): Promise<Array<{ date: string; count: number }>> {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data, error } = await supabase
      .from('documents')
      .select('created_at')
      .match(filters)
      .gte('created_at', thirtyDaysAgo.toISOString())

    if (error) throw error

    // Group by date
    const dateGroups: { [key: string]: number } = {}
    
    // Initialize all days with 0
    for (let i = 0; i < 30; i++) {
      const date = new Date()
      date.setDate(date.getDate() - (29 - i))
      const dateStr = date.toISOString().split('T')[0]
      dateGroups[dateStr] = 0
    }

    // Count documents per day
    data?.forEach(doc => {
      const dateStr = doc.created_at.split('T')[0]
      if (dateGroups.hasOwnProperty(dateStr)) {
        dateGroups[dateStr]++
      }
    })

    return Object.entries(dateGroups).map(([date, count]) => ({ date, count }))
  }

  private static async getDocumentsByCategory(filters: any): Promise<Array<{ category: string; count: number; color: string }>> {
    // Since parsed_data doesn't have category, we'll use document types or tags as categories
    const { data, error } = await supabase
      .from('documents')
      .select('mime_type, tags')
      .match(filters)

    if (error) throw error

    // Create categories based on tags or file types
    const categoryGroups: { [key: string]: number } = {}
    
    data?.forEach(doc => {
      // Use first tag as category, or mime type as fallback
      let category = 'uncategorized'
      
      if (doc.tags && Array.isArray(doc.tags) && doc.tags.length > 0) {
        category = doc.tags[0]
      } else if (doc.mime_type) {
        category = doc.mime_type.split('/')[0] // e.g., 'application/pdf' -> 'application'
      }
      
      categoryGroups[category] = (categoryGroups[category] || 0) + 1
    })

    return Object.entries(categoryGroups).map(([category, count], index) => ({
      category: category.charAt(0).toUpperCase() + category.slice(1),
      count,
      color: COLORS[index % COLORS.length]
    }))
  }

  private static async getProcessingTimes(filters: any): Promise<Array<{ date: string; avgTime: number }>> {
    // Since we don't store processing times yet, we'll simulate this
    // In a real implementation, you'd store processing_duration in documents table
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data, error } = await supabase
      .from('documents')
      .select('created_at, file_size')
      .match(filters)
      .gte('created_at', thirtyDaysAgo.toISOString())

    if (error) throw error

    // Group by date and estimate processing time based on file size
    const dateGroups: { [key: string]: { total: number; count: number } } = {}
    
    data?.forEach(doc => {
      const dateStr = doc.created_at.split('T')[0]
      // Estimate processing time: 1-5 seconds based on file size
      const estimatedTime = Math.min(Math.max(doc.file_size / 1024 / 1024 * 0.5 + 1, 1), 5)
      
      if (!dateGroups[dateStr]) {
        dateGroups[dateStr] = { total: 0, count: 0 }
      }
      dateGroups[dateStr].total += estimatedTime
      dateGroups[dateStr].count++
    })

    return Object.entries(dateGroups).map(([date, stats]) => ({
      date,
      avgTime: stats.count > 0 ? stats.total / stats.count : 0
    }))
  }

  private static async getCurrentUserActivity(userId: string): Promise<Array<{ user: string; actions: number; documents: number }>> {
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    // Count user's documents from the last week
    const { data: docsData } = await supabase
      .from('documents')
      .select('id')
      .eq('uploaded_by', userId)
      .gte('created_at', oneWeekAgo.toISOString())

    // Since activity_log doesn't exist, estimate actions based on documents
    const actions = (docsData?.length || 0) * 3 // Assume 3 actions per document on average

    return [{
      user: 'You',
      documents: docsData?.length || 0,
      actions: actions
    }]
  }

  private static async getWorkspaceUserActivity(workspaceId: string): Promise<Array<{ user: string; actions: number; documents: number }>> {
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    // Since workspace_members table doesn't exist, get all unique users from workspace documents
    const { data: workspaceDocs } = await supabase
      .from('documents')
      .select('uploaded_by')
      .eq('workspace_id', workspaceId)
      .gte('created_at', oneWeekAgo.toISOString())

    if (!workspaceDocs) return []

    // Group by user and count documents
    const userStats: { [key: string]: number } = {}
    workspaceDocs.forEach(doc => {
      userStats[doc.uploaded_by] = (userStats[doc.uploaded_by] || 0) + 1
    })

    return Object.entries(userStats).map(([userId, docCount]) => ({
      user: userId.replace('test-user-', 'User '), // Clean up test user names
      documents: docCount,
      actions: docCount * 3 // Estimate actions
    })).sort((a, b) => (b.documents + b.actions) - (a.documents + a.actions))
  }

  private static async getTagUsage(filters: any): Promise<Array<{ tag: string; count: number }>> {
    const { data, error } = await supabase
      .from('documents')
      .select('tags')
      .match(filters)

    if (error) throw error

    // Count tag usage
    const tagCounts: { [key: string]: number } = {}
    data?.forEach(doc => {
      if (doc.tags && Array.isArray(doc.tags)) {
        doc.tags.forEach((tag: string) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1
        })
      }
    })

    return Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10) // Top 10 tags
  }

  private static async getWeeklyStats(filters: any): Promise<{
    totalDocuments: number
    totalProcessed: number
    avgProcessingTime: number
    activeUsers: number
  }> {
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    // Total documents
    const { data: allDocs } = await supabase
      .from('documents')
      .select('id, ocr_text, file_size')
      .match(filters)

    // Documents from this week
    const { data: weekDocs } = await supabase
      .from('documents')
      .select('id')
      .match(filters)
      .gte('created_at', oneWeekAgo.toISOString())

    // Processed documents (those with OCR text)
    const totalProcessed = allDocs?.filter(doc => doc.ocr_text && doc.ocr_text.trim().length > 0).length || 0

    // Estimate average processing time
    const avgFileSize = allDocs && allDocs.length > 0 
      ? allDocs.reduce((sum, doc) => sum + (doc.file_size || 0), 0) / allDocs.length 
      : 0
    const avgProcessingTime = Math.min(Math.max(avgFileSize / 1024 / 1024 * 0.5 + 1, 1), 5)

    // Active users (those who uploaded documents this week)
    const { data: activeUserData } = await supabase
      .from('documents')
      .select('uploaded_by')
      .match(filters)
      .gte('created_at', oneWeekAgo.toISOString())

    const uniqueUsers = new Set(activeUserData?.map(doc => doc.uploaded_by) || [])

    return {
      totalDocuments: allDocs?.length || 0,
      totalProcessed,
      avgProcessingTime,
      activeUsers: uniqueUsers.size
    }
  }

  private static getEmptyAnalytics(): RealAnalyticsData {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (29 - i))
      return {
        date: date.toISOString().split('T')[0],
        count: 0
      }
    })

    return {
      documentsPerDay: last30Days,
      documentsByCategory: [],
      processingTime: last30Days.map(day => ({ date: day.date, avgTime: 0 })),
      userActivity: [],
      tagUsage: [],
      weeklyStats: {
        totalDocuments: 0,
        totalProcessed: 0,
        avgProcessingTime: 0,
        activeUsers: 0
      }
    }
  }
}
