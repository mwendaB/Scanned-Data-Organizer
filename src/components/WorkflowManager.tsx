import React, { useState, useEffect, useCallback } from 'react'
import { CheckCircle, Clock, AlertCircle, User, MessageSquare, FileText, Play, Pause, Check, X, Eye, Shield, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AuditingService, WorkflowInstance, ReviewComment } from '@/lib/auditing'
import { WorkflowService } from '@/lib/workflow'
import { RoleBasedAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { DocumentViewer } from '@/components/DocumentViewer'
import { Document } from '@/types'

interface WorkflowManagerProps {
  documentId?: string
  workspaceId?: string
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

export function WorkflowManager({ documentId, workspaceId }: WorkflowManagerProps) {
  const [workflows, setWorkflows] = useState<WorkflowInstance[]>([])
  const [currentWorkflow, setCurrentWorkflow] = useState<WorkflowInstance | null>(null)
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([])
  const [comments, setComments] = useState<ReviewComment[]>([])
  const [document, setDocument] = useState<Document | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [showDocumentViewer, setShowDocumentViewer] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [commentType, setCommentType] = useState<'GENERAL' | 'QUESTION' | 'CONCERN' | 'APPROVAL' | 'REJECTION'>('GENERAL')
  const [loading, setLoading] = useState(true)
  const [overallRiskScore, setOverallRiskScore] = useState(0)

  const loadWorkflowData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Load current user with role information
      const user = await RoleBasedAuth.getCurrentUser()
      setCurrentUser(user)

      if (documentId) {
        // Load specific document workflow data
        const { data: docData, error: docError } = await supabase
          .from('documents')
          .select('*')
          .eq('id', documentId)
          .single()

        if (!docError && docData) {
          setDocument(docData)
        }
        
        // Load workflow instances for this document
        let workflowInstances = await WorkflowService.getDocumentWorkflowInstances(documentId)
        
        // Only use database data - no fallback
        setWorkflows(workflowInstances)
        setCurrentWorkflow(workflowInstances[0] || null)

        // Load workflow steps only if we have a workflow instance
        if (workflowInstances[0]) {
          const steps = await WorkflowService.getWorkflowSteps(workflowInstances[0].id)
          setWorkflowSteps(steps || [])
        } else {
          setWorkflowSteps([])
        }

      } else {
        // Load aggregate workflow data for all user documents
        console.log('Loading aggregate workflow data for all user documents')
        
        try {
          // Get current user's email
          const { data: authData } = await supabase.auth.getUser()
          const userEmail = authData?.user?.email || 'mwenda0107@gmail.com'
          
          // Get all workflow instances for user
          const { data: allWorkflows, error: workflowsError } = await supabase
            .from('workflow_instances')
            .select('*')
            .eq('initiated_by', userEmail)
            .order('created_at', { ascending: false })
          
          if (workflowsError) {
            console.error('Error loading user workflows:', workflowsError)
            setWorkflows([])
          } else {
            setWorkflows(allWorkflows || [])
            setCurrentWorkflow(allWorkflows?.[0] || null)
          }
          
          // Set empty workflow steps for overview mode
          setWorkflowSteps([])
          
          // Set a generic overview document
          setDocument({
            id: 'overview-doc',
            user_id: user?.id || '',
            name: 'Workflow Overview',
            filename: 'workflow_overview.pdf',
            file_path: '/overview/workflow',
            file_type: 'application/pdf',
            mime_type: 'application/pdf',
            file_size: 0,
            ocr_text: '',
            parsed_data: [],
            created_at: new Date().toISOString(),
            uploaded_by: userEmail,
            tags: [],
            updated_at: new Date().toISOString()
          })
          
        } catch (error) {
          console.error('Error loading aggregate workflow data:', error)
          setWorkflows([])
          setCurrentWorkflow(null)
          setWorkflowSteps([])
        }
      }

      // Load review comments from database - no fallback
      const commentsDocId = documentId || 'overview-doc'
      const { data: reviewComments, error: commentsError } = await supabase
        .from('review_comments')
        .select('*')
        .eq('document_id', commentsDocId)
        .order('created_at', { ascending: false })
      
      if (commentsError) {
        console.error('Error loading comments:', commentsError)
        setComments([])
      } else {
        setComments(reviewComments || [])
      }

    } catch (error) {
      console.error('Failed to load workflow data:', error)
      // Reset to empty state on error - no fallback data
      setWorkflows([])
      setCurrentWorkflow(null)
      setWorkflowSteps([])
      setComments([])
      setOverallRiskScore(0)
    } finally {
      setLoading(false)
    }
  }, [documentId])

  useEffect(() => {
    loadWorkflowData()
  }, [loadWorkflowData])

  const addComment = async () => {
    if (!newComment.trim()) return

    try {
      const comment = await AuditingService.addReviewComment({
        document_id: documentId || 'overview-doc',
        comment_text: newComment,
        comment_type: commentType,
        priority: commentType === 'CONCERN' ? 'HIGH' : 'MEDIUM'
      })

      setComments(prev => [...prev, comment])
      setNewComment('')
    } catch (error) {
      console.error('Failed to add comment:', error)
    }
  }

  const updateStepStatus = async (stepId: string, status: WorkflowStep['status']) => {
    const step = workflowSteps.find(s => s.id === stepId)
    if (!step || !canAccessStep(step)) {
      console.warn('User does not have permission to update this step')
      return
    }

    try {
      setWorkflowSteps(prev => prev.map(step => 
        step.id === stepId 
          ? { 
              ...step, 
              status,
              completed_at: status === 'COMPLETED' ? new Date().toISOString() : step.completed_at,
              completed_by: status === 'COMPLETED' ? currentUser?.id : step.completed_by,
              started_at: status === 'IN_PROGRESS' && !step.started_at ? new Date().toISOString() : step.started_at
            }
          : step
      ))

      // Log audit event
      try {
        await AuditingService.logAuditEvent({
          table_name: 'workflow_steps',
          record_id: stepId,
          action_type: 'UPDATE',
          document_id: documentId || 'overview-doc',
          new_values: { status },
          risk_level: 'LOW'
        })
      } catch (auditError) {
        // Don't fail the operation if audit logging fails
        console.warn('Audit logging failed:', auditError)
      }
    } catch (error) {
      console.error('Failed to update step status:', error)
    }
  }

  const canAccessStep = (step: WorkflowStep): boolean => {
    if (!currentUser) return false
    return RoleBasedAuth.canAccessWorkflowStep(currentUser, step)
  }

  const getStatusColor = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-600'
      case 'IN_PROGRESS': return 'text-blue-600'
      case 'PENDING': return 'text-yellow-600'
      case 'REJECTED': return 'text-red-600'
      case 'SKIPPED': return 'text-gray-600'
      default: return 'text-gray-600'
    }
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
            {workflowSteps.map((step, index) => (
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
                          <User className="w-3 h-3" />
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
                <Select value={commentType} onValueChange={(value: any) => setCommentType(value)}>
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
                      <User className="w-4 h-4" />
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
          document={document}
          onClose={() => setShowDocumentViewer(false)}
        />
      )}
    </div>
  )
}
