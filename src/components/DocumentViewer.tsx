import React, { useState, useEffect } from 'react'
import { Eye, Download, ZoomIn, ZoomOut, RotateCw, FileText, Image } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { Document } from '@/types'

interface DocumentViewerProps {
  document: Document
  onClose?: () => void
}

export function DocumentViewer({ document, onClose }: DocumentViewerProps) {
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadFile()
  }, [document])

  const loadFile = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get signed URL for the file
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(document.file_path, 3600) // 1 hour expiry

      if (error) throw error

      setFileUrl(data.signedUrl)
    } catch (err) {
      console.error('Failed to load file:', err)
      setError('Failed to load document. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const downloadFile = async () => {
    if (!fileUrl) return

    try {
      const response = await fetch(fileUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = window.document.createElement('a')
      link.href = url
      link.download = document.filename || document.name
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download failed:', err)
    }
  }

  const isImage = document.mime_type?.startsWith('image/') || document.file_type?.startsWith('image/')
  const isPDF = document.mime_type === 'application/pdf' || document.file_type === 'application/pdf'

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading document...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={loadFile} variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Document Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isImage ? <Image className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
              <span>{document.filename || document.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {document.mime_type || document.file_type}
              </Badge>
              <Badge variant="outline">
                {Math.round(document.file_size / 1024)} KB
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            {document.tags?.map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
          
          {/* Document Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button onClick={downloadFile} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            
            {isImage && (
              <>
                <Button 
                  onClick={() => setZoom(Math.min(zoom + 25, 200))} 
                  variant="outline" 
                  size="sm"
                  disabled={zoom >= 200}
                >
                  <ZoomIn className="h-4 w-4 mr-2" />
                  Zoom In
                </Button>
                <Button 
                  onClick={() => setZoom(Math.max(zoom - 25, 50))} 
                  variant="outline" 
                  size="sm"
                  disabled={zoom <= 50}
                >
                  <ZoomOut className="h-4 w-4 mr-2" />
                  Zoom Out
                </Button>
                <Button 
                  onClick={() => setRotation((rotation + 90) % 360)} 
                  variant="outline" 
                  size="sm"
                >
                  <RotateCw className="h-4 w-4 mr-2" />
                  Rotate
                </Button>
                <span className="text-sm text-muted-foreground">
                  {zoom}%
                </span>
              </>
            )}
            
            {onClose && (
              <Button onClick={onClose} variant="outline" size="sm">
                Close Viewer
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Document Content */}
      <Card>
        <CardContent className="p-0">
          {isImage && fileUrl ? (
            <div className="flex justify-center bg-gray-50 p-4">
              <img
                src={fileUrl}
                alt={document.filename || document.name}
                style={{
                  transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                  transformOrigin: 'center',
                  maxWidth: '100%',
                  height: 'auto',
                  transition: 'transform 0.2s ease'
                }}
                className="border rounded shadow-sm"
              />
            </div>
          ) : isPDF && fileUrl ? (
            <div className="w-full h-96">
              <iframe
                src={fileUrl}
                className="w-full h-full border-0"
                title={document.filename || document.name}
              />
            </div>
          ) : (
            <div className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                Preview not available for this file type
              </p>
              <Button onClick={downloadFile} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download to View
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* OCR Text Preview */}
      {document.ocr_text && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Extracted Text (OCR)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded max-h-64 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm font-mono">
                {document.ocr_text}
              </pre>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Text extracted automatically using OCR. May contain inaccuracies.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
