import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { ParsedData } from '@/types'

export class ExportService {
  static exportToCSV(data: ParsedData[], filename: string = 'export.csv') {
    if (data.length === 0) return

    // Get all unique keys from the data
    const allKeys = new Set<string>()
    data.forEach(item => {
      Object.keys(item.data).forEach(key => allKeys.add(key))
    })

    const headers = ['ID', 'Category', 'Created At', ...Array.from(allKeys)]
    
    const csvContent = [
      headers.join(','),
      ...data.map(item => [
        item.id,
        item.category,
        new Date(item.created_at).toLocaleDateString(),
        ...Array.from(allKeys).map(key => {
          const value = item.data[key] || ''
          // Escape commas and quotes in CSV
          return typeof value === 'string' && (value.includes(',') || value.includes('"'))
            ? `"${value.replace(/"/g, '""')}"`
            : value
        })
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    saveAs(blob, filename)
  }

  static exportToExcel(data: ParsedData[], filename: string = 'export.xlsx') {
    if (data.length === 0) return

    // Transform data for Excel export
    const excelData = data.map(item => ({
      ID: item.id,
      Category: item.category,
      'Created At': new Date(item.created_at).toLocaleDateString(),
      ...item.data
    }))

    const ws = XLSX.utils.json_to_sheet(excelData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Exported Data')

    // Auto-size columns
    const colWidths = Object.keys(excelData[0] || {}).map(key => {
      const headerLength = key.length
      const maxDataLength = excelData.reduce((max, row) => {
        const cellValue = (row as any)[key] || ''
        return Math.max(max, String(cellValue).length)
      }, 0)
      return { wch: Math.max(headerLength, maxDataLength) }
    })
    ws['!cols'] = colWidths

    XLSX.writeFile(wb, filename)
  }

  static exportToPDF(data: ParsedData[], filename: string = 'export.pdf') {
    // For PDF export, we'll create a simple HTML table and use the browser's print functionality
    const htmlContent = `
      <html>
        <head>
          <title>Exported Data</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
          </style>
        </head>
        <body>
          <h1>Exported Data</h1>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Category</th>
                <th>Created At</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              ${data.map(item => `
                <tr>
                  <td>${item.id}</td>
                  <td>${item.category}</td>
                  <td>${new Date(item.created_at).toLocaleDateString()}</td>
                  <td>${JSON.stringify(item.data, null, 2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      printWindow.print()
    }
  }
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const generateUniqueId = (): string => {
  return Math.random().toString(36).substr(2, 9)
}

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}
