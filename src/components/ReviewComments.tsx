import React, { useState, useEffect } from 'react'
import { MessageSquare, Send, User, Calendar, Edit, Trash2, Reply, Eye, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DocumentViewer } from '@/components/DocumentViewer'
import { supabase } from '@/lib/supabase'

interface Comment {
  id: string
  document_id: string
  user_id: string
  user_email: string
  content: string
  comment_type: 'review' | 'feedback' | 'question' | 'approval'
  status: 'open' | 'resolved' | 'pending'
  created_at: string
  updated_at: string
  parent_id?: string
  replies?: Comment[]
}

interface ReviewCommentsProps {
  documentId: string
  documentName?: string
  onCommentAdded?: () => void
}

export function ReviewComments({ documentId, documentName, onCommentAdded }: ReviewCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [document, setDocument] = useState<any>(null)
  const [showViewer, setShowViewer] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [commentType, setCommentType] = useState<'review' | 'feedback' | 'question' | 'approval'>('review')
  const [isLoading, setIsLoading] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')

  useEffect(() => {
    loadComments()
    loadDocument()
  }, [documentId])

  const loadDocument = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single()

      if (error) throw error
      setDocument(data)
    } catch (error) {
      console.error('Error loading document:', error)
    }
  }

  const loadComments = async () => {
    try {
      const { data, error } = await supabase
        .from('document_comments')
        .select(`
          *,
          replies:document_comments!parent_id(*)
        `)
        .eq('document_id', documentId)
        .is('parent_id', null)
        .order('created_at', { ascending: false })

      if (error) throw error
      setComments(data || [])
    } catch (error) {
      console.error('Error loading comments:', error)
    }
  }

  const addComment = async () => {
    if (!newComment.trim()) return

    setIsLoading(true)
    try {
      const user = await supabase.auth.getUser()
      if (!user.data.user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('document_comments')
        .insert({
          document_id: documentId,
          user_id: user.data.user.id,
          user_email: user.data.user.email,
          content: newComment,
          comment_type: commentType,
          status: 'open'
        })

      if (error) throw error

      setNewComment('')
      await loadComments()
      onCommentAdded?.()
    } catch (error) {
      console.error('Error adding comment:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const addReply = async (parentId: string) => {
    if (!replyContent.trim()) return

    try {
      const user = await supabase.auth.getUser()
      if (!user.data.user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('document_comments')
        .insert({
          document_id: documentId,
          user_id: user.data.user.id,
          user_email: user.data.user.email,
          content: replyContent,
          comment_type: 'feedback',
          status: 'open',
          parent_id: parentId
        })

      if (error) throw error

      setReplyContent('')
      setReplyingTo(null)
      await loadComments()
    } catch (error) {
      console.error('Error adding reply:', error)
    }
  }

  const updateCommentStatus = async (commentId: string, status: 'open' | 'resolved' | 'pending') => {
    try {
      const { error } = await supabase
        .from('document_comments')
        .update({ status })
        .eq('id', commentId)

      if (error) throw error
      await loadComments()
    } catch (error) {
      console.error('Error updating comment status:', error)
    }
  }

  const getCommentTypeColor = (type: string) => {
    switch (type) {
      case 'review': return 'bg-blue-100 text-blue-800'
      case 'feedback': return 'bg-green-100 text-green-800'
      case 'question': return 'bg-yellow-100 text-yellow-800'
      case 'approval': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <div>
              <span>Review Comments</span>
              {(documentName || document?.name) && (
                <p className="text-sm text-muted-foreground font-normal">
                  Document: {documentName || document?.name}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowViewer(!showViewer)}
              disabled={!document}
            >
              <Eye className="h-4 w-4 mr-2" />
              {showViewer ? 'Hide Document' : 'View Document'}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Document Name Banner */}
        {document && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">{document.name}</p>
                <p className="text-sm text-blue-700">
                  Uploaded {new Date(document.created_at).toLocaleDateString()} • 
                  {(document.file_size / 1024 / 1024).toFixed(2)} MB • 
                  {document.mime_type}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Document Viewer */}
        {showViewer && document && (
          <DocumentViewer 
            document={document} 
            onClose={() => setShowViewer(false)}
          />
        )}

        {/* Add New Comment */}
        <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
          <div className="flex gap-2">
            <select
              value={commentType}
              onChange={(e) => setCommentType(e.target.value as any)}
              className="px-3 py-1 border rounded text-sm"
            >
              <option value="review">Review</option>
              <option value="feedback">Feedback</option>
              <option value="question">Question</option>
              <option value="approval">Approval</option>
            </select>
          </div>
          <Textarea
            placeholder="Add your comment or review..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px]"
          />
          <Button 
            onClick={addComment} 
            disabled={!newComment.trim() || isLoading}
            className="w-full"
          >
            <Send className="h-4 w-4 mr-2" />
            {isLoading ? 'Adding...' : 'Add Comment'}
          </Button>
        </div>

        {/* Comments List */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No comments yet. Be the first to review this document!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <Card key={comment.id} className="bg-background">
                <CardContent className="p-4">
                  {/* Comment Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {comment.user_email.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{comment.user_email}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(comment.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getCommentTypeColor(comment.comment_type)}>
                        {comment.comment_type}
                      </Badge>
                      <Badge className={getStatusColor(comment.status)}>
                        {comment.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Comment Content */}
                  <p className="text-sm mb-3 whitespace-pre-wrap">{comment.content}</p>

                  {/* Comment Actions */}
                  <div className="flex gap-2 text-xs">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                    >
                      <Reply className="h-3 w-3 mr-1" />
                      Reply
                    </Button>
                    {comment.status === 'open' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateCommentStatus(comment.id, 'resolved')}
                      >
                        Mark Resolved
                      </Button>
                    )}
                    {comment.status === 'resolved' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateCommentStatus(comment.id, 'open')}
                      >
                        Reopen
                      </Button>
                    )}
                  </div>

                  {/* Reply Form */}
                  {replyingTo === comment.id && (
                    <div className="mt-3 p-3 border rounded bg-muted/20">
                      <Textarea
                        placeholder="Write a reply..."
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        className="mb-2"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => addReply(comment.id)}
                          disabled={!replyContent.trim()}
                        >
                          Reply
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setReplyingTo(null)
                            setReplyContent('')
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-3 ml-6 space-y-2 border-l-2 border-muted pl-4">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="p-2 bg-muted/20 rounded">
                          <div className="flex items-center gap-2 mb-1">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {reply.user_email.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-medium">{reply.user_email}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(reply.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs whitespace-pre-wrap">{reply.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
