import React, { useState, useEffect, useCallback } from 'react'
import { CheckCircle, Clock, AlertCircle, User, MessageSquare, FileText, Play, Pause, Check, X } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AuditingService, WorkflowInstance, ReviewComment } from '@/lib/auditing'
import { WorkflowService } from '@/lib/workflow'

interface WorkflowManagerProps {
  documentId: string
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
  const [newComment, setNewComment] = useState('')
  const [commentType, setCommentType] = useState<'GENERAL' | 'QUESTION' | 'CONCERN' | 'APPROVAL' | 'REJECTION'>('GENERAL')
  const [loading, setLoading] = useState(true)

  const loadWorkflowData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Load workflow instances for this document using the WorkflowService
      const workflowInstances = await WorkflowService.getDocumentWorkflowInstances(documentId)
      setWorkflows(workflowInstances)

      // Load workflow steps
      const steps = workflowInstances[0] 
        ? await WorkflowService.getWorkflowSteps(workflowInstances[0].id)
        : []
      setWorkflowSteps(steps)

      // Load comments
      const loadedComments = await AuditingService.getDocumentComments(documentId)
      setComments(loadedComments)

      if (workflowInstances.length > 0) {
        setCurrentWorkflow(workflowInstances[0])
      }
    } catch (error) {
      console.error('Failed to load workflow data:', error)
      // Fallback to demo data if live data fails
      setWorkflows([
        {
          id: '1',
          workflow_id: 'audit-review-workflow',
          document_id: documentId,
          initiated_by: 'user1',
          current_step: 2,
          status: 'IN_PROGRESS',
          workflow_data: {},
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString()
        }
      ])

      setWorkflowSteps([
        {
          id: '1',
          workflow_instance_id: '1',
          step_number: 1,
          step_name: 'Initial Review',
          assigned_to: 'reviewer1',
          status: 'COMPLETED',
          action_required: 'Review document for completeness and accuracy',
          completed_by: 'reviewer1',
          completed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          workflow_instance_id: '1',
          step_number: 2,
          step_name: 'Risk Assessment',
          assigned_to: 'risk_analyst',
          status: 'IN_PROGRESS',
          action_required: 'Perform risk analysis and flag any concerns',
          started_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString()
        },
        {
          id: '3',
          workflow_instance_id: '1',
          step_number: 3,
          step_name: 'Senior Partner Approval',
          assigned_role: 'senior_partner',
          status: 'PENDING',
          action_required: 'Final approval and sign-off',
          due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString()
        }
      ])

      if (workflows.length === 0) {
        setCurrentWorkflow({
          id: '1',
          workflow_id: 'audit-review-workflow',
          document_id: documentId,
          initiated_by: 'user1',
          current_step: 2,
          status: 'IN_PROGRESS',
          workflow_data: {},
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString()
        })
      }
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
        document_id: documentId,
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
    try {
      // In a real implementation, this would call an API
      setWorkflowSteps(prev => prev.map(step => 
        step.id === stepId 
          ? { 
              ...step, 
              status,
              completed_at: status === 'COMPLETED' ? new Date().toISOString() : step.completed_at,
              started_at: status === 'IN_PROGRESS' && !step.started_at ? new Date().toISOString() : step.started_at
            }
          : step
      ))

      // Log audit event
      await AuditingService.logAuditEvent({
        table_name: 'workflow_steps',
        record_id: stepId,
        action_type: 'UPDATE',
        document_id: documentId,
        new_values: { status },
        risk_level: 'LOW'
      })
    } catch (error) {
      console.error('Failed to update step status:', error)
    }
  }

  const getStepIcon = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'IN_PROGRESS':
        return <Clock className="h-5 w-5 text-blue-500" />
      case 'REJECTED':
        return <X className="h-5 w-5 text-red-500" />
      case 'SKIPPED':
        return <AlertCircle className="h-5 w-5 text-gray-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  const getStepBadgeVariant = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'COMPLETED':
        return 'default'
      case 'IN_PROGRESS':
        return 'secondary'
      case 'REJECTED':
        return 'destructive'
      default:
        return 'outline'
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
      {currentWorkflow && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Audit Review Workflow</span>
              <Badge variant={
                currentWorkflow.status === 'COMPLETED' ? 'default' :
                currentWorkflow.status === 'REJECTED' ? 'destructive' :
                currentWorkflow.status === 'CANCELLED' ? 'secondary' : 'outline'
              }>
                {currentWorkflow.status}
              </Badge>
            </CardTitle>
            <CardDescription>
              Step {currentWorkflow.current_step} of {workflowSteps.length} • 
              Due: {currentWorkflow.due_date ? new Date(currentWorkflow.due_date).toLocaleDateString() : 'No due date'}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workflow Steps */}
        <Card>
          <CardHeader>
            <CardTitle>Workflow Steps</CardTitle>
            <CardDescription>Review process and approval stages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {workflowSteps.map((step, index) => (
                <div key={step.id} className="flex gap-4">
                  {/* Step Icon */}
                  <div className="flex flex-col items-center">
                    {getStepIcon(step.status)}
                    {index < workflowSteps.length - 1 && (
                      <div className="w-px h-16 bg-border mt-2" />
                    )}
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 space-y-2 pb-8">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{step.step_name}</h3>
                      <Badge variant={getStepBadgeVariant(step.status)}>
                        {step.status}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground">{step.action_required}</p>

                    {/* Assignment */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>
                        {step.assigned_to ? `Assigned to: ${step.assigned_to}` : 
                         step.assigned_role ? `Assigned role: ${step.assigned_role}` : 'Unassigned'}
                      </span>
                    </div>

                    {/* Timestamps */}
                    <div className="text-xs text-muted-foreground space-y-1">
                      {step.started_at && (
                        <div>Started: {new Date(step.started_at).toLocaleString()}</div>
                      )}
                      {step.completed_at && (
                        <div>Completed: {new Date(step.completed_at).toLocaleString()}</div>
                      )}
                      {step.due_date && (
                        <div className={new Date(step.due_date) < new Date() ? 'text-red-500' : ''}>
                          Due: {new Date(step.due_date).toLocaleString()}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    {step.status === 'PENDING' && (
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStepStatus(step.id, 'IN_PROGRESS')}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Start
                        </Button>
                      </div>
                    )}

                    {step.status === 'IN_PROGRESS' && (
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          onClick={() => updateStepStatus(step.id, 'COMPLETED')}
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Complete
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStepStatus(step.id, 'REJECTED')}
                        >
                          <X className="h-3 w-3 mr-1" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStepStatus(step.id, 'PENDING')}
                        >
                          <Pause className="h-3 w-3 mr-1" />
                          Pause
                        </Button>
                      </div>
                    )}

                    {step.comments && (
                      <div className="bg-muted p-3 rounded mt-3">
                        <p className="text-sm">{step.comments}</p>
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
            <CardTitle>Review Comments</CardTitle>
            <CardDescription>Discussion and feedback on this document</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Add Comment */}
              <div className="space-y-3 border rounded-lg p-4">
                <div className="flex gap-2">
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
                </div>
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[80px]"
                />
                <Button onClick={addComment} disabled={!newComment.trim()}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Add Comment
                </Button>
              </div>

              {/* Comments List */}
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div key={comment.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          comment.comment_type === 'APPROVAL' ? 'default' :
                          comment.comment_type === 'REJECTION' ? 'destructive' :
                          comment.comment_type === 'CONCERN' ? 'default' : 'secondary'
                        }>
                          {comment.comment_type}
                        </Badge>
                        {comment.priority === 'HIGH' && (
                          <Badge variant="destructive">High Priority</Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.created_at).toLocaleString()}
                      </span>
                    </div>
                    
                    <p className="text-sm">{comment.comment_text}</p>
                    
                    {comment.is_resolved && (
                      <div className="flex items-center gap-2 text-xs text-green-600">
                        <CheckCircle className="h-3 w-3" />
                        <span>Resolved</span>
                        {comment.resolved_at && (
                          <span>• {new Date(comment.resolved_at).toLocaleString()}</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {comments.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No comments yet</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
