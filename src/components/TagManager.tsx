'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { TagIcon, PlusIcon, XIcon, SaveIcon } from 'lucide-react'

interface TagManagerProps {
  documentId: string
  currentTags: string[]
  onTagsUpdated: (newTags: string[]) => void
  suggestedTags?: string[]
}

export function TagManager({ 
  documentId, 
  currentTags, 
  onTagsUpdated, 
  suggestedTags = ['invoice', 'receipt', 'contract', 'report', 'financial', 'legal', 'urgent'] 
}: TagManagerProps) {
  const [tags, setTags] = useState<string[]>(currentTags || [])
  const [newTag, setNewTag] = useState('')
  const [loading, setLoading] = useState(false)

  const addTag = (tag: string) => {
    if (tag.trim() && !tags.includes(tag.trim())) {
      setTags(prev => [...prev, tag.trim()])
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove))
  }

  const handleAddNewTag = () => {
    if (newTag.trim()) {
      addTag(newTag)
      setNewTag('')
    }
  }

  const saveTags = async () => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('documents')
        .update({ tags })
        .eq('id', documentId)

      if (error) throw error

      // Also update parsed_data tags
      await supabase
        .from('parsed_data')
        .update({ tags })
        .eq('document_id', documentId)

      onTagsUpdated(tags)
    } catch (error) {
      console.error('Error updating tags:', error)
    } finally {
      setLoading(false)
    }
  }

  const hasChanges = JSON.stringify(tags.sort()) !== JSON.stringify(currentTags.sort())

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <TagIcon className="h-4 w-4" />
          Manage Tags
        </CardTitle>
        <CardDescription>
          Add or remove tags to categorize this document for better organization and analytics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add New Tag */}
        <div className="flex gap-2">
          <Input
            placeholder="Add a new tag..."
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddNewTag()}
            className="flex-1"
          />
          <Button onClick={handleAddNewTag} disabled={!newTag.trim()}>
            <PlusIcon className="h-4 w-4" />
          </Button>
        </div>

        {/* Suggested Tags */}
        {suggestedTags.filter(tag => !tags.includes(tag)).length > 0 && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">Suggested tags:</p>
            <div className="flex flex-wrap gap-1">
              {suggestedTags.filter(tag => !tags.includes(tag)).map((tag) => (
                <Button
                  key={tag}
                  variant="outline"
                  size="sm"
                  onClick={() => addTag(tag)}
                  className="h-7 text-xs"
                >
                  {tag}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Current Tags */}
        <div>
          <p className="text-sm text-muted-foreground mb-2">Current tags:</p>
          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-1 mb-3">
              {tags.map((tag, index) => (
                <Badge key={`${tag}-${index}`} variant="default" className="flex items-center gap-1">
                  {tag}
                  <XIcon 
                    className="h-3 w-3 cursor-pointer hover:text-destructive" 
                    onClick={() => removeTag(tag)}
                  />
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mb-3">No tags added yet</p>
          )}
        </div>

        {/* Save Button */}
        {hasChanges && (
          <div className="flex justify-end">
            <Button onClick={saveTags} disabled={loading} className="flex items-center gap-2">
              <SaveIcon className="h-4 w-4" />
              {loading ? 'Saving...' : 'Save Tags'}
            </Button>
          </div>
        )}

        {/* Tag Benefits Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800 font-medium mb-1">Why tags matter:</p>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Improve search and filtering capabilities</li>
            <li>• Enable better analytics and insights</li>
            <li>• Automatic categorization in reports</li>
            <li>• Enhanced collaboration and organization</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
