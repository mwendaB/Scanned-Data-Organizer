import Tesseract from 'tesseract.js'
import { OCRResult } from '@/types'

export class OCRService {
  private static instance: OCRService
  private worker: Tesseract.Worker | null = null

  private constructor() {}

  static getInstance(): OCRService {
    if (!OCRService.instance) {
      OCRService.instance = new OCRService()
    }
    return OCRService.instance
  }

  async initializeWorker(): Promise<void> {
    if (!this.worker) {
      this.worker = await Tesseract.createWorker()
      await this.worker.reinitialize('eng')
    }
  }

  async extractTextFromFile(file: File): Promise<OCRResult> {
    try {
      await this.initializeWorker()
      
      if (!this.worker) {
        throw new Error('OCR worker not initialized')
      }

      const { data } = await this.worker.recognize(file)
      
      return {
        text: data.text,
        confidence: data.confidence,
        // Note: Tesseract.js v5 doesn't provide bbox in the expected format
        // This is simplified for the demo
        boundingBox: undefined
      }
    } catch (error) {
      console.error('OCR extraction failed:', error)
      throw new Error('Failed to extract text from image')
    }
  }

  async extractTextFromMultipleFiles(files: File[]): Promise<OCRResult[]> {
    const results: OCRResult[] = []
    
    for (const file of files) {
      try {
        const result = await this.extractTextFromFile(file)
        results.push(result)
      } catch (error) {
        console.error(`Failed to process file ${file.name}:`, error)
        results.push({
          text: '',
          confidence: 0
        })
      }
    }
    
    return results
  }

  parseTextToStructuredData(text: string): Record<string, any>[] {
    // Basic text parsing logic - can be enhanced based on specific document types
    const lines = text.split('\n').filter(line => line.trim().length > 0)
    const structuredData: Record<string, any>[] = []
    
    // Try to detect table-like structure
    const tablePattern = /\t|\s{2,}|\|/
    const isTableFormat = lines.some(line => tablePattern.test(line))
    
    if (isTableFormat) {
      // Parse as table
      const headers = this.extractTableHeaders(lines[0])
      
      for (let i = 1; i < lines.length; i++) {
        const row = this.parseTableRow(lines[i], headers)
        if (Object.keys(row).length > 0) {
          structuredData.push(row)
        }
      }
    } else {
      // Parse as key-value pairs
      lines.forEach((line, index) => {
        const keyValueMatch = line.match(/^([^:]+):\s*(.+)$/)
        if (keyValueMatch) {
          structuredData.push({
            id: `item_${index}`,
            key: keyValueMatch[1].trim(),
            value: keyValueMatch[2].trim(),
            line_number: index + 1
          })
        } else {
          // Treat as general text content
          structuredData.push({
            id: `text_${index}`,
            content: line.trim(),
            line_number: index + 1,
            type: 'text'
          })
        }
      })
    }
    
    return structuredData
  }

  private extractTableHeaders(headerLine: string): string[] {
    // Split by common delimiters
    const delimiters = ['\t', '|', '  ']
    let headers: string[] = []
    
    for (const delimiter of delimiters) {
      if (headerLine.includes(delimiter)) {
        headers = headerLine.split(delimiter)
          .map(h => h.trim())
          .filter(h => h.length > 0)
        break
      }
    }
    
    if (headers.length === 0) {
      // Fallback to single column
      headers = [headerLine.trim()]
    }
    
    return headers
  }

  private parseTableRow(rowLine: string, headers: string[]): Record<string, any> {
    const delimiters = ['\t', '|', '  ']
    let values: string[] = []
    
    for (const delimiter of delimiters) {
      if (rowLine.includes(delimiter)) {
        values = rowLine.split(delimiter)
          .map(v => v.trim())
          .filter(v => v.length > 0)
        break
      }
    }
    
    if (values.length === 0) {
      values = [rowLine.trim()]
    }
    
    const row: Record<string, any> = {}
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })
    
    return row
  }

  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate()
      this.worker = null
    }
  }
}

export const ocrService = OCRService.getInstance()
