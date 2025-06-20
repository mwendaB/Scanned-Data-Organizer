export interface User {
  id: string
  email: string
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  user_id: string
  name: string
  file_path: string
  file_type: string
  file_size: number
  ocr_text: string
  parsed_data: ParsedData[]
  tags: string[]
  created_at: string
  updated_at: string
}

export interface ParsedData {
  id: string
  document_id: string
  row_index: number
  data: Record<string, any>
  tags: string[]
  category: string
  created_at: string
  updated_at: string
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
