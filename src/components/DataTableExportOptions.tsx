import React, { useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Download, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ParsedData } from '@/types'

interface DataTableExportOptionsProps {
  data: ParsedData[]
  selectedRows: string[]
  onSelectionChange: (selectedIds: string[]) => void
  onExport: (selectedData: ParsedData[], format: 'csv' | 'json') => void
}

export function DataTableExportOptions({ 
  data, 
  selectedRows, 
  onSelectionChange, 
  onExport 
}: DataTableExportOptionsProps) {
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv')

  const handleSelectAll = () => {
    if (selectedRows.length === data.length) {
      onSelectionChange([])
    } else {
      onSelectionChange(data.map(item => item.id))
    }
  }

  const handleRowToggle = (id: string) => {
    if (selectedRows.includes(id)) {
      onSelectionChange(selectedRows.filter(rowId => rowId !== id))
    } else {
      onSelectionChange([...selectedRows, id])
    }
  }

  const handleExport = () => {
    const selectedData = data.filter(item => selectedRows.includes(item.id))
    onExport(selectedData, exportFormat)
  }

  const exportCurrentView = () => {
    onExport(data, exportFormat)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export Data Table
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Export Format Selection */}
        <div className="flex gap-2">
          <Button
            variant={exportFormat === 'csv' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setExportFormat('csv')}
          >
            CSV Format
          </Button>
          <Button
            variant={exportFormat === 'json' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setExportFormat('json')}
          >
            JSON Format
          </Button>
        </div>

        {/* Quick Export Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportCurrentView}
            className="flex-1"
          >
            <FileText className="h-4 w-4 mr-2" />
            Export Current View ({data.length} records)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={selectedRows.length === 0}
            className="flex-1"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Selected ({selectedRows.length} records)
          </Button>
        </div>

        {/* Selection Controls */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Select Records to Export:</label>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSelectAll}
            >
              {selectedRows.length === data.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>

          {/* Selection Summary */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary">
              {selectedRows.length} of {data.length} selected
            </Badge>
            {selectedRows.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSelectionChange([])}
              >
                Clear Selection
              </Button>
            )}
          </div>

          {/* Sample Selection Interface */}
          <div className="max-h-32 overflow-y-auto border rounded p-2 space-y-1">
            {data.slice(0, 10).map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 p-1 hover:bg-muted/50 rounded"
              >
                <Checkbox
                  checked={selectedRows.includes(item.id)}
                  onCheckedChange={() => handleRowToggle(item.id)}
                />
                <div className="flex-1 text-xs">
                  <span className="font-medium">{item.field_name}:</span>{' '}
                  {(item.field_value || '').substring(0, 40)}...
                </div>
                <Badge variant="outline" className="text-xs">
                  {Math.round((item.confidence || 0) * 100)}%
                </Badge>
              </div>
            ))}
            {data.length > 10 && (
              <div className="text-xs text-muted-foreground text-center py-1">
                Showing first 10 records. Use "Select All" to include all {data.length} records.
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}