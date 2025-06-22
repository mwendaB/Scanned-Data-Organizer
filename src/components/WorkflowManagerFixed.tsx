import React, { useState, useEffect, useCallback } from 'react'
import { CheckCircle, Clock, AlertCircle, User as UserIcon, MessageSquare, FileText, Play, Pause, Check, X, Shield } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { WorkflowInstance, ReviewComment } from '@/lib/auditing'
import { RoleBasedAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { DocumentViewer } from '@/components/DocumentViewer'
import { ParsedData, User } from '@/types'

interface WorkflowManagerProps {
  documentId?: string
}

interface WorkflowStep {
  id: string
  workflow_instance_id: string
  step_number: number
  step_name: string
  assigned_to?: string
  assigned_role?: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'REJECTED'
  action_required: string
  comments?: string
  completed_by?: string
  started_at?: string
  completed_at?: string
  due_date?: string
  created_at: string
}

interface Document {
  id: string
  name: string
  filename?: string
  file_path: string
  file_type?: string
  mime_type: string
  file_size: number
  ocr_text?: string
  parsed_data?: ParsedData[]
  created_at: string
  uploaded_by: string
  user_id?: string
}

export function WorkflowManager({ documentId }: WorkflowManagerProps) {
  const [workflows, setWorkflows] = useState<WorkflowInstance[]>([])
  const [currentWorkflow, setCurrentWorkflow] = useState<WorkflowInstance | null>(null)
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([])
  const [comments, setComments] = useState<ReviewComment[]>([])
  const [document, setDocument] = useState<Document | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [showDocumentViewer, setShowDocumentViewer] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [commentType, setCommentType] = useState<'GENERAL' | 'QUESTION' | 'CONCERN' | 'APPROVAL' | 'REJECTION'>('GENERAL')
  const [loading, setLoading] = useState(true)

  const loadWorkflowData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Load current user with role information
      const user = await RoleBasedAuth.getCurrentUser()
      setCurrentUser(user)

      if (documentId) {
        // Load specific document workflow data from Supabase
        const { data: docData, error: docError } = await supabase
          .from('documents')
          .select('*')
          .eq('id', documentId)
          .single()

        if (!docError && docData) {
          setDocument(docData)
        }
        
        // Load workflow instances for this document from Supabase
        const { data: workflowData, error: workflowError } = await supabase
          .from('workflow_instances')
          .select('*')
          .eq('document_id', documentId)
          .order('created_at', { ascending: false })
        
        if (!workflowError && workflowData) {
          setWorkflows(workflowData)
          if (workflowData.length > 0) {
            setCurrentWorkflow(workflowData[0])
            
            // Load workflow steps for the current workflow
            const { data: stepsData, error: stepsError } = await supabase
              .from('workflow_steps')
              .select('*')
              .eq('workflow_instance_id', workflowData[0].id)
              .order('step_number', { ascending: true })
            
            if (!stepsError && stepsData) {
              setWorkflowSteps(stepsData)
            }
          }
        }

        // Load comments for this document
        const { data: commentsData, error: commentsError } = await supabase
          .from('review_comments')
          .select('*')
          .eq('document_id', documentId)
          .order('created_at', { ascending: false })
        
        if (!commentsError && commentsData) {
          setComments(commentsData)
        }

      } else {
        // Load aggregate workflow data from Supabase when no specific document is selected
        console.log('Loading aggregate workflow data for all documents')
        
        // Get all workflow instances
        const { data: allWorkflows, error: workflowsError } = await supabase
          .from('workflow_instances')
          .select(`
            *,
            documents(id, name, filename)
          `)
          .order('created_at', { ascending: false })
          .limit(10)
        
        if (!workflowsError && allWorkflows) {
          setWorkflows(allWorkflows)
          
          if (allWorkflows.length > 0) {
            // Set the first in-progress workflow as current, or first one if none in progress
            const inProgressWorkflow = allWorkflows.find(w => w.status === 'IN_PROGRESS')
            setCurrentWorkflow(inProgressWorkflow || allWorkflows[0])
            
            // Load all workflow steps for overview
            const workflowIds = allWorkflows.map(w => w.id)
            const { data: allSteps, error: stepsError } = await supabase
              .from('workflow_steps')
              .select('*')
              .in('workflow_instance_id', workflowIds)
              .order('created_at', { ascending: false })
            
            if (!stepsError && allSteps) {
              setWorkflowSteps(allSteps)
            }
          }
        }
        
        // Set a generic overview document
        setDocument({
          id: 'overview-doc',
          name: 'Workflow Overview',
          filename: 'workflow_overview.pdf',
          file_path: '/overview/workflow',
          mime_type: 'application/pdf',
          file_size: 0,
          created_at: new Date().toISOString(),
          uploaded_by: user?.email || 'system'
        })

        // Load recent comments across all documents for overview
        const { data: allComments, error: commentsError } = await supabase
          .from('review_comments')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20)
        
        if (!commentsError && allComments) {
          setComments(allComments)
        }
      }

    } catch (error) {
      console.error('Failed to load workflow data:', error)
      // Set minimal fallback state
      setWorkflows([])
      setWorkflowSteps([])
      setComments([])
      setCurrentWorkflow(null)
      setDocument(null)
    } finally {
      setLoading(false)
    }
  }, [documentId])

  useEffect(() => {
    loadWorkflowData()
  }, [loadWorkflowData])

  const addComment = async () => {
    if (!newComment.trim() || !currentUser) return

    try {
      const { data: comment, error } = await supabase
        .from('review_comments')
        .insert({
          document_id: documentId || 'overview-doc',
          user_id: currentUser.id || currentUser.email,
          comment_text: newComment,
          comment_type: commentType,
          is_resolved: false,
          priority: commentType === 'CONCERN' ? 'HIGH' : 'MEDIUM'
        })
        .select()
        .single()

      if (error) throw error

      setComments(prev => [comment, ...prev])
      setNewComment('')
    } catch (error) {
      console.error('Failed to add comment:', error)
    }
  }

  const updateStepStatus = async (stepId: string, status: WorkflowStep['status']) => {
    const step = workflowSteps.find(s => s.id === stepId)
    if (!step || !canAccessStep(step) || !currentUser) {
      console.warn('User does not have permission to update this step')
      return
    }

    try {
      const updateData: Partial<WorkflowStep> = {
        status,
        ...(status === 'COMPLETED' && {
          completed_at: new Date().toISOString(),
          completed_by: currentUser.id || currentUser.email
        }),
        ...(status === 'IN_PROGRESS' && !step.started_at && {
          started_at: new Date().toISOString()
        })
      }

      const { error } = await supabase
        .from('workflow_steps')
        .update(updateData)
        .eq('id', stepId)

      if (error) throw error

      // Update local state
      setWorkflowSteps(prev => prev.map(s => 
        s.id === stepId ? { ...s, ...updateData } : s
      ))

      // Log audit event
      await supabase
        .from('audit_logs')
        .insert({
          table_name: 'workflow_steps',
          record_id: stepId,
          action_type: 'UPDATE',
          user_id: currentUser.id || currentUser.email,
          document_id: documentId || 'overview-doc',
          new_values: { status },
          risk_level: 'LOW'
        })

    } catch (error) {
      console.error('Failed to update step status:', error)
    }
  }

  const canAccessStep = (step: WorkflowStep): boolean => {
    if (!currentUser) return false
    return RoleBasedAuth.canAccessWorkflowStep(currentUser, step)
  }

  const getStatusIcon = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'IN_PROGRESS': return <Clock className="w-4 h-4 text-blue-600" />
      case 'PENDING': return <AlertCircle className="w-4 h-4 text-yellow-600" />
      case 'REJECTED': return <X className="w-4 h-4 text-red-600" />
      case 'SKIPPED': return <Pause className="w-4 h-4 text-gray-600" />
      default: return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'default'
      case 'IN_PROGRESS': return 'secondary'
      case 'PENDING': return 'outline'
      case 'REJECTED': return 'destructive'
      default: return 'outline'
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded animate-pulse" />
        <div className="h-64 bg-muted rounded animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Workflow Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Workflows</p>
                <p className="text-2xl font-bold">{workflows.length}</p>
              </div>
              <Play className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed Steps</p>
                <p className="text-2xl font-bold">
                  {workflowSteps.filter(s => s.status === 'COMPLETED').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">
                  {workflowSteps.filter(s => s.status === 'IN_PROGRESS').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold">
                  {workflowSteps.filter(s => s.status === 'PENDING').length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Workflow */}
      {currentWorkflow && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  {currentWorkflow.workflow_id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </CardTitle>
                <CardDescription>
                  Document: {document?.name || document?.filename || 'Unknown Document'}
                </CardDescription>
              </div>
              <Badge variant={getStatusBadgeVariant(currentWorkflow.status)}>
                {currentWorkflow.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span>Progress: Step {currentWorkflow.current_step} of {workflowSteps.length}</span>
                <span>Due: {new Date(currentWorkflow.due_date || '').toLocaleDateString()}</span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${(workflowSteps.filter(s => s.status === 'COMPLETED').length / workflowSteps.length) * 100}%` 
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workflow Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Workflow Steps</CardTitle>
          <CardDescription>Track progress through each step of the workflow</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {workflowSteps.map((step) => (
              <div key={step.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                <div className="flex-shrink-0 mt-1">
                  {getStatusIcon(step.status)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">
                      Step {step.step_number}: {step.step_name}
                    </h4>
                    <Badge variant={getStatusBadgeVariant(step.status)}>
                      {step.status}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mt-1">
                    {step.action_required}
                  </p>
                  
                  <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                    <div className="flex items-center space-x-4">
                      {step.assigned_to && (
                        <span className="flex items-center gap-1">
                          <UserIcon className="w-3 h-3" />
                          {step.assigned_to}
                        </span>
                      )}
                      {step.assigned_role && !step.assigned_to && (
                        <span className="flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          {step.assigned_role}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      {step.due_date && (
                        <span>Due: {new Date(step.due_date).toLocaleDateString()}</span>
                      )}
                      {step.completed_at && (
                        <span>Completed: {new Date(step.completed_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  
                  {step.comments && (
                    <p className="text-xs text-muted-foreground mt-2 italic">
                      {step.comments}
                    </p>
                  )}
                  
                  {canAccessStep(step) && step.status !== 'COMPLETED' && (
                    <div className="flex gap-2 mt-3">
                      {step.status === 'PENDING' && (
                        <Button
                          size="sm"
                          onClick={() => updateStepStatus(step.id, 'IN_PROGRESS')}
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Start
                        </Button>
                      )}
                      {step.status === 'IN_PROGRESS' && (
                        <Button
                          size="sm"
                          onClick={() => updateStepStatus(step.id, 'COMPLETED')}
                        >
                          <Check className="w-3 h-3 mr-1" />
                          Complete
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Comments Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Workflow Comments
          </CardTitle>
          <CardDescription>Add comments and track workflow discussions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Add Comment */}
            <div className="space-y-3">
              <div className="flex gap-3">
                <Select value={commentType} onValueChange={(value: typeof commentType) => setCommentType(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GENERAL">General</SelectItem>
                    <SelectItem value="QUESTION">Question</SelectItem>
                    <SelectItem value="CONCERN">Concern</SelectItem>
                    <SelectItem value="APPROVAL">Approval</SelectItem>
                    <SelectItem value="REJECTION">Rejection</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={addComment} disabled={!newComment.trim()}>
                  Add Comment
                </Button>
              </div>
              <Textarea
                placeholder="Add your comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
              />
            </div>

            {/* Comments List */}
            <div className="space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-4 h-4" />
                      <span className="font-medium text-sm">{comment.user_id}</span>
                      <Badge variant="outline" className="text-xs">
                        {comment.comment_type}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm">{comment.comment_text}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Viewer */}
      {showDocumentViewer && document && (
        <DocumentViewer
          document={{
            ...document,
            user_id: document.user_id || document.uploaded_by,
            filename: document.filename || document.name,
            file_type: document.file_type || 'unknown',
            tags: [],
            updated_at: document.created_at,
            parsed_data: document.parsed_data || [],
            ocr_text: document.ocr_text ?? ''
          }}
          onClose={() => setShowDocumentViewer(false)}
        />
      )}
    </div>
  )
}
