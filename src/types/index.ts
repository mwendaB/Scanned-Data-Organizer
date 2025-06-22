export interface User {
  id: string
  email: string
  role: 'admin' | 'senior_partner' | 'risk_analyst' | 'reviewer' | 'user'
  permissions: string[]
  department?: string
  created_at: string
  updated_at: string
}

export interface UserRole {
  id: string
  name: string
  description: string
  permissions: string[]
  level: number
  created_at: string
}

export interface Permission {
  id: string
  name: string
  description: string
  resource: string
  action: string
}

export interface Document {
  id: string
  user_id: string
  uploaded_by: string
  filename: string
  name: string
  file_path: string
  file_type: string
  mime_type: string
  file_size: number
  ocr_text: string
  parsed_data: ParsedData[]
  tags: string[]
  workspace_id?: string
  created_at: string
  updated_at: string
  // Soft delete fields
  is_deleted?: boolean
  deleted_at?: string | null
  deleted_by?: string | null
}

export interface ParsedData {
  id: string
  document_id: string
  field_name: string
  field_value: string
  field_type: string
  confidence: number
  page_number?: number
  coordinates?: any
  created_at: string
  updated_at?: string
  // Soft delete fields
  is_deleted?: boolean
  deleted_at?: string | null
  deleted_by?: string | null
  // Legacy fields for backward compatibility
  row_index?: number
  data?: Record<string, any>
  tags?: string[]
  category?: string
}

export interface OCRResult {
  text: string
  confidence: number
  boundingBox?: {
    x: number
    y: number
    width: number
    height: number
  }
}

export interface TableColumn {
  id: string
  header: string
  accessorKey: string
  type: 'text' | 'number' | 'date' | 'boolean'
  filterable?: boolean
  sortable?: boolean
  editable?: boolean
}

export interface FilterState {
  searchTerm: string
  tags: string[]
  dateRange: {
    from: Date | null
    to: Date | null
  }
  category: string
}

export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf'
  columns: string[]
  includeFilters: boolean
}
