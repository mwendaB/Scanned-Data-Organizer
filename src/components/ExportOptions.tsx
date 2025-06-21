import React, { useState } from 'react'
import { Download, CheckSquare, Square, FileText, Database, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ParsedData, Document } from '@/types'

interface ExportOptionsProps {
  documents: Document[]
  parsedData: ParsedData[]
  onClose?: () => void
}

export function ExportOptions({ documents, parsedData, onClose }: ExportOptionsProps) {
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])
  const [selectedDataRecords, setSelectedDataRecords] = useState<string[]>([])
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'excel'>('csv')
  const [includeMetadata, setIncludeMetadata] = useState(true)

  const handleDocumentToggle = (documentId: string) => {
    setSelectedDocuments(prev => 
      prev.includes(documentId) 
        ? prev.filter(id => id !== documentId)
        : [...prev, documentId]
    )
  }

  const handleDataRecordToggle = (recordId: string) => {
    setSelectedDataRecords(prev => 
      prev.includes(recordId) 
        ? prev.filter(id => id !== recordId)
        : [...prev, recordId]
    )
  }

  const selectAllDocuments = () => {
    setSelectedDocuments(documents.map(doc => doc.id))
  }

  const selectAllDataRecords = () => {
    setSelectedDataRecords(parsedData.map(record => record.id))
  }

  const clearAllSelections = () => {
    setSelectedDocuments([])
    setSelectedDataRecords([])
  }

  const exportSelectedDocuments = () => {
    const selectedDocs = documents.filter(doc => selectedDocuments.includes(doc.id))
    const csvHeader = 'Document Name,File Type,File Size,Upload Date,Tags,OCR Text\n'
    const csvContent = csvHeader + selectedDocs.map(doc => {
      const tags = Array.isArray(doc.tags) ? doc.tags.join('; ') : ''
      const ocrText = (doc.ocr_text || '').replace(/"/g, '""').substring(0, 500)
      return `"${doc.filename || doc.name}","${doc.mime_type || doc.file_type}","${doc.file_size}","${new Date(doc.created_at).toLocaleDateString()}","${tags}","${ocrText}"`
    }).join('\n')

    downloadFile(csvContent, `documents_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv')
  }

  const exportSelectedData = () => {
    const selectedData = parsedData.filter(record => selectedDataRecords.includes(record.id))
    
    if (exportFormat === 'csv') {
      const csvHeader = 'Field Name,Field Value,Field Type,Confidence,Document ID,Created Date\n'
      const csvContent = csvHeader + selectedData.map(record => {
        return `"${record.field_name || ''}","${record.field_value || ''}","${record.field_type || ''}","${record.confidence || ''}","${record.document_id}","${new Date(record.created_at).toLocaleDateString()}"`
      }).join('\n')
      
      downloadFile(csvContent, `parsed_data_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv')
    } else if (exportFormat === 'json') {
      const jsonContent = JSON.stringify(selectedData, null, 2)
      downloadFile(jsonContent, `parsed_data_${new Date().toISOString().split('T')[0]}.json`, 'application/json')
    }
  }

  const exportAll = () => {
    // Export comprehensive package
    const allData = {
      documents: documents.map(doc => ({
        ...doc,
        tags: Array.isArray(doc.tags) ? doc.tags : []
      })),
      parsed_data: parsedData,
      metadata: {
        export_date: new Date().toISOString(),
        total_documents: documents.length,
        total_parsed_records: parsedData.length,
        export_format: exportFormat
      }
    }

    if (exportFormat === 'json') {
      const jsonContent = JSON.stringify(allData, null, 2)
      downloadFile(jsonContent, `complete_export_${new Date().toISOString().split('T')[0]}.json`, 'application/json')
    } else {
      // Create a comprehensive CSV with all data
      let csvContent = ''
      
      // Documents section
      csvContent += 'DOCUMENTS\n'
      csvContent += 'Document Name,File Type,File Size,Upload Date,Tags,OCR Text Length\n'
      csvContent += documents.map(doc => {
        const tags = Array.isArray(doc.tags) ? doc.tags.join('; ') : ''
        return `"${doc.filename || doc.name}","${doc.mime_type || doc.file_type}","${doc.file_size}","${new Date(doc.created_at).toLocaleDateString()}","${tags}","${(doc.ocr_text || '').length}"`
      }).join('\n')
      
      csvContent += '\n\nPARSED DATA\n'
      csvContent += 'Field Name,Field Value,Field Type,Confidence,Document ID,Created Date\n'
      csvContent += parsedData.map(record => {
        return `"${record.field_name || ''}","${record.field_value || ''}","${record.field_type || ''}","${record.confidence || ''}","${record.document_id}","${new Date(record.created_at).toLocaleDateString()}"`
      }).join('\n')
      
      downloadFile(csvContent, `complete_export_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv')
    }
  }

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Export Format Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Export Format</label>
            <div className="flex gap-2">
              <Button
                variant={exportFormat === 'csv' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setExportFormat('csv')}
              >
                CSV
              </Button>
              <Button
                variant={exportFormat === 'json' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setExportFormat('json')}
              >
                JSON
              </Button>
            </div>
          </div>

          <Separator />

          {/* Quick Export Actions */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <Package className="h-4 w-4" />
              Quick Export
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-2"
                onClick={exportAll}
              >
                <Database className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-medium">Export All</div>
                  <div className="text-xs text-muted-foreground">
                    {documents.length} docs, {parsedData.length} records
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-2"
                onClick={exportSelectedDocuments}
                disabled={selectedDocuments.length === 0}
              >
                <FileText className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-medium">Export Documents</div>
                  <div className="text-xs text-muted-foreground">
                    {selectedDocuments.length} selected
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-2"
                onClick={exportSelectedData}
                disabled={selectedDataRecords.length === 0}
              >
                <CheckSquare className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-medium">Export Data</div>
                  <div className="text-xs text-muted-foreground">
                    {selectedDataRecords.length} records
                  </div>
                </div>
              </Button>
            </div>
          </div>

          <Separator />

          {/* Document Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Select Documents</h3>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={selectAllDocuments}>
                  Select All
                </Button>
                <Button size="sm" variant="ghost" onClick={clearAllSelections}>
                  Clear All
                </Button>
              </div>
            </div>
            
            <div className="max-h-48 overflow-y-auto space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 p-2 border rounded hover:bg-muted/50"
                >
                  <Checkbox
                    checked={selectedDocuments.includes(doc.id)}
                    onCheckedChange={() => handleDocumentToggle(doc.id)}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{doc.filename || doc.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {doc.mime_type || doc.file_type} • {Math.round(doc.file_size / 1024)}KB
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(Array.isArray(doc.tags) ? doc.tags : []).slice(0, 2).map((tag, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Data Records Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Select Parsed Data Records</h3>
              <Button size="sm" variant="ghost" onClick={selectAllDataRecords}>
                Select All Records
              </Button>
            </div>
            
            <div className="max-h-48 overflow-y-auto space-y-2">
              {parsedData.slice(0, 50).map((record) => (
                <div
                  key={record.id}
                  className="flex items-center gap-3 p-2 border rounded hover:bg-muted/50"
                >
                  <Checkbox
                    checked={selectedDataRecords.includes(record.id)}
                    onCheckedChange={() => handleDataRecordToggle(record.id)}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {record.field_name}: {(record.field_value || '').substring(0, 30)}...
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {record.field_type} • {Math.round((record.confidence || 0) * 100)}% confidence
                    </div>
                  </div>
                </div>
              ))}
              {parsedData.length > 50 && (
                <div className="text-center text-sm text-muted-foreground py-2">
                  Showing first 50 records. Use "Select All Records" to include all {parsedData.length} records.
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
