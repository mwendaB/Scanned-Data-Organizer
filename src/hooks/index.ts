import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Document, ParsedData } from '@/types'

export function useDocuments(userId: string | undefined) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDocuments = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setDocuments(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  const addDocument = useCallback((document: Document) => {
    setDocuments(prev => [document, ...prev])
  }, [])

  const updateDocument = useCallback((id: string, updates: Partial<Document>) => {
    setDocuments(prev => 
      prev.map(doc => doc.id === id ? { ...doc, ...updates } : doc)
    )
  }, [])

  const removeDocument = useCallback((id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id))
  }, [])

  return {
    documents,
    loading,
    error,
    refetch: fetchDocuments,
    addDocument,
    updateDocument,
    removeDocument
  }
}

export function useParsedData(userId: string | undefined) {
  const [parsedData, setParsedData] = useState<ParsedData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchParsedData = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('parsed_data')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setParsedData(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchParsedData()
  }, [fetchParsedData])

  const addParsedData = useCallback((data: ParsedData) => {
    setParsedData(prev => [data, ...prev])
  }, [])

  const updateParsedData = useCallback((id: string, updates: Partial<ParsedData>) => {
    setParsedData(prev => 
      prev.map(item => item.id === id ? { ...item, ...updates } : item)
    )
  }, [])

  const removeParsedData = useCallback((id: string) => {
    setParsedData(prev => prev.filter(item => item.id !== id))
  }, [])

  return {
    parsedData,
    loading,
    error,
    refetch: fetchParsedData,
    addParsedData,
    updateParsedData,
    removeParsedData
  }
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      if (typeof window === 'undefined') return initialValue
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }

  return [storedValue, setValue] as const
}
