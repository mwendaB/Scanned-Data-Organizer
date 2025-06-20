import { create } from 'zustand'
import { User, Document, ParsedData, FilterState } from '@/types'

interface AppState {
  // User state
  user: User | null
  setUser: (user: User | null) => void
  
  // Documents state
  documents: Document[]
  currentDocument: Document | null
  setDocuments: (documents: Document[]) => void
  setCurrentDocument: (document: Document | null) => void
  addDocument: (document: Document) => void
  updateDocument: (id: string, updates: Partial<Document>) => void
  removeDocument: (id: string) => void
  
  // Parsed data state
  parsedData: ParsedData[]
  setParsedData: (data: ParsedData[]) => void
  addParsedData: (data: ParsedData) => void
  updateParsedData: (id: string, updates: Partial<ParsedData>) => void
  removeParsedData: (id: string) => void
  
  // Filter state
  filters: FilterState
  setFilters: (filters: Partial<FilterState>) => void
  resetFilters: () => void
  
  // UI state
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  selectedRows: string[]
  setSelectedRows: (rows: string[]) => void
  toggleRowSelection: (id: string) => void
}

const initialFilterState: FilterState = {
  searchTerm: '',
  tags: [],
  dateRange: { from: null, to: null },
  category: '',
}

export const useAppStore = create<AppState>((set, get) => ({
  // User state
  user: null,
  setUser: (user) => set({ user }),
  
  // Documents state
  documents: [],
  currentDocument: null,
  setDocuments: (documents) => set({ documents }),
  setCurrentDocument: (document) => set({ currentDocument: document }),
  addDocument: (document) => set((state) => ({
    documents: [...state.documents, document]
  })),
  updateDocument: (id, updates) => set((state) => ({
    documents: state.documents.map(doc => 
      doc.id === id ? { ...doc, ...updates } : doc
    ),
    currentDocument: state.currentDocument?.id === id 
      ? { ...state.currentDocument, ...updates }
      : state.currentDocument
  })),
  removeDocument: (id) => set((state) => ({
    documents: state.documents.filter(doc => doc.id !== id),
    currentDocument: state.currentDocument?.id === id ? null : state.currentDocument
  })),
  
  // Parsed data state
  parsedData: [],
  setParsedData: (data) => set({ parsedData: data }),
  addParsedData: (data) => set((state) => ({
    parsedData: [...state.parsedData, data]
  })),
  updateParsedData: (id, updates) => set((state) => ({
    parsedData: state.parsedData.map(item => 
      item.id === id ? { ...item, ...updates } : item
    )
  })),
  removeParsedData: (id) => set((state) => ({
    parsedData: state.parsedData.filter(item => item.id !== id)
  })),
  
  // Filter state
  filters: initialFilterState,
  setFilters: (filters) => set((state) => ({
    filters: { ...state.filters, ...filters }
  })),
  resetFilters: () => set({ filters: initialFilterState }),
  
  // UI state
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  selectedRows: [],
  setSelectedRows: (rows) => set({ selectedRows: rows }),
  toggleRowSelection: (id) => set((state) => ({
    selectedRows: state.selectedRows.includes(id)
      ? state.selectedRows.filter(rowId => rowId !== id)
      : [...state.selectedRows, id]
  })),
}))
