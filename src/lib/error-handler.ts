import { toast } from 'sonner'

export class ErrorHandler {
  static handleApiError(error: any, action: string = 'operation') {
    console.error(`${action} failed:`, error)
    
    let message = 'An unexpected error occurred'
    
    if (error?.response?.status) {
      switch (error.response.status) {
        case 400:
          message = 'Bad request. Please check your input and try again.'
          break
        case 401:
          message = 'Authentication required. Please sign in and try again.'
          break
        case 403:
          message = 'You do not have permission to perform this action.'
          break
        case 404:
          message = 'The requested resource was not found.'
          break
        case 500:
          message = 'Server error. Please try again later.'
          break
        default:
          message = error.response.data?.message || `${action} failed`
      }
    } else if (error?.message) {
      // Handle Supabase errors
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        message = 'Database table not found. Please ensure the database is properly set up.'
      } else if (error.message.includes('JWT')) {
        message = 'Authentication expired. Please sign in again.'
      } else if (error.message.includes('permission')) {
        message = 'You do not have permission to perform this action.'
      } else {
        message = error.message
      }
    }
    
    toast.error(message)
    return { success: false, error: message }
  }
  
  static handleSuccess(message: string, data?: any) {
    toast.success(message)
    return { success: true, data, message }
  }
  
  static validateRequired(data: Record<string, any>, requiredFields: string[]) {
    const missing = requiredFields.filter(field => !data[field])
    if (missing.length > 0) {
      const message = `Missing required fields: ${missing.join(', ')}`
      toast.error(message)
      return { isValid: false, error: message }
    }
    return { isValid: true }
  }
  
  static async safeApiCall<T>(
    apiCall: () => Promise<T>,
    action: string = 'operation',
    successMessage?: string
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    try {
      const result = await apiCall()
      if (successMessage) {
        toast.success(successMessage)
      }
      return { success: true, data: result }
    } catch (error) {
      return this.handleApiError(error, action)
    }
  }
}
