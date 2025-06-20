import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { UploadIcon, FileIcon, XIcon, TagIcon, PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface UploadedFile extends File {
  preview?: string
  id: string
  tags?: string[]
}

interface FileUploadProps {
  onFilesUploaded: (files: UploadedFile[]) => void
  acceptedTypes?: string[]
  maxFiles?: number
  maxSize?: number
  className?: string
  suggestedTags?: string[]
}

export function FileUpload({
  onFilesUploaded,
  acceptedTypes = ['image/*', 'application/pdf'],
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // 10MB
  className,
  suggestedTags = ['invoice', 'receipt', 'contract', 'report', 'form', 'financial', 'legal', 'urgent']
}: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [globalTags, setGlobalTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')

  const addGlobalTag = () => {
    if (newTag.trim() && !globalTags.includes(newTag.trim())) {
      const updatedTags = [...globalTags, newTag.trim()]
      setGlobalTags(updatedTags)
      
      // Apply to all files
      setUploadedFiles(prev => prev.map(file => ({
        ...file,
        tags: [...(file.tags || []), newTag.trim()]
      })))
      
      setNewTag('')
    }
  }

  const addSuggestedTag = (tag: string) => {
    if (!globalTags.includes(tag)) {
      const updatedTags = [...globalTags, tag]
      setGlobalTags(updatedTags)
      
      // Apply to all files
      setUploadedFiles(prev => prev.map(file => ({
        ...file,
        tags: [...(file.tags || []), tag]
      })))
    }
  }

  const removeGlobalTag = (tagToRemove: string) => {
    setGlobalTags(prev => prev.filter(tag => tag !== tagToRemove))
    
    // Remove from all files
    setUploadedFiles(prev => prev.map(file => ({
      ...file,
      tags: (file.tags || []).filter(tag => tag !== tagToRemove)
    })))
  }

  const addFileTag = (fileId: string, tag: string) => {
    if (tag.trim()) {
      setUploadedFiles(prev => prev.map(file => 
        file.id === fileId 
          ? { ...file, tags: [...(file.tags || []), tag.trim()] }
          : file
      ))
    }
  }

  const removeFileTag = (fileId: string, tagToRemove: string) => {
    setUploadedFiles(prev => prev.map(file => 
      file.id === fileId 
        ? { ...file, tags: (file.tags || []).filter(tag => tag !== tagToRemove) }
        : file
    ))
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const filesWithId = acceptedFiles.map(file => ({
      ...file,
      id: Math.random().toString(36).substr(2, 9),
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      tags: [...globalTags] // Apply current global tags to new files
    }))
    
    setUploadedFiles(prev => [...prev, ...filesWithId])
    onFilesUploaded(filesWithId)
  }, [onFilesUploaded, globalTags])

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => {
      const updated = prev.filter(file => file.id !== fileId)
      const removedFile = prev.find(file => file.id === fileId)
      if (removedFile?.preview) {
        URL.revokeObjectURL(removedFile.preview)
      }
      return updated
    })
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxFiles: maxFiles - uploadedFiles.length,
    maxSize,
    disabled: uploadedFiles.length >= maxFiles
  })

  return (
    <div className={cn('space-y-4', className)}>
      {/* Global Tags Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TagIcon className="h-4 w-4" />
            Document Tags
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-3">
              Add tags that will be applied to all uploaded documents for better organization and analytics.
            </p>
            
            {/* Add New Tag */}
            <div className="flex gap-2 mb-3">
              <Input
                placeholder="Add a tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addGlobalTag()}
                className="flex-1"
              />
              <Button onClick={addGlobalTag} disabled={!newTag.trim()}>
                <PlusIcon className="h-4 w-4" />
              </Button>
            </div>

            {/* Suggested Tags */}
            {suggestedTags.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Suggested tags:</p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {suggestedTags.filter(tag => !globalTags.includes(tag)).map((tag) => (
                    <Button
                      key={tag}
                      variant="outline"
                      size="sm"
                      onClick={() => addSuggestedTag(tag)}
                      className="h-6 text-xs"
                    >
                      {tag}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Current Global Tags */}
            {globalTags.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Active tags:</p>
                <div className="flex flex-wrap gap-1">
                  {globalTags.map((tag) => (
                    <Badge key={tag} variant="default" className="flex items-center gap-1">
                      {tag}
                      <XIcon 
                        className="h-3 w-3 cursor-pointer hover:text-destructive" 
                        onClick={() => removeGlobalTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* File Upload Area */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
              isDragActive ? 'border-primary bg-primary/10' : 'border-muted-foreground/25',
              uploadedFiles.length >= maxFiles && 'opacity-50 cursor-not-allowed'
            )}
          >
            <input {...getInputProps()} />
            <UploadIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            {isDragActive ? (
              <p className="text-lg">Drop the files here...</p>
            ) : (
              <div>
                <p className="text-lg mb-2">
                  Drag & drop files here, or click to select
                </p>
                <p className="text-sm text-muted-foreground">
                  Supports images and PDFs up to {Math.round(maxSize / 1024 / 1024)}MB
                </p>
                <p className="text-sm text-muted-foreground">
                  {uploadedFiles.length}/{maxFiles} files uploaded
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {uploadedFiles.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Uploaded Files</h3>
            <div className="space-y-4">
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className="p-4 border rounded-lg space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {file.preview ? (
                        <div className="w-10 h-10 bg-muted rounded overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={file.preview}
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <FileIcon className="w-10 h-10 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                    >
                      <XIcon className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* File Tags */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <TagIcon className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Tags for this file:</span>
                    </div>
                    
                    {/* Display file tags */}
                    {file.tags && file.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {file.tags.map((tag, index) => (
                          <Badge 
                            key={`${file.id}-${tag}-${index}`} 
                            variant="secondary" 
                            className="flex items-center gap-1 text-xs"
                          >
                            {tag}
                            <XIcon 
                              className="h-2 w-2 cursor-pointer hover:text-destructive" 
                              onClick={() => removeFileTag(file.id, tag)}
                            />
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No tags applied</p>
                    )}

                    {/* Add individual file tag */}
                    <div className="flex gap-2 mt-2">
                      <Input
                        placeholder="Add tag to this file..."
                        className="flex-1 h-8 text-xs"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            const target = e.target as HTMLInputElement
                            addFileTag(file.id, target.value)
                            target.value = ''
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
