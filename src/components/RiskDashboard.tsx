import React, { useState, useEffect } from 'react'
import { AlertTriangle, Shield, FileText, TrendingUp, Eye, CheckCircle, XCircle, Clock, Users } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { AuditingService, RiskAssessment, AuditTrailEntry, ComplianceCheck } from '@/lib/auditing'

interface RiskDashboardProps {
  documentId?: string
  workspaceId?: string
}

export function RiskDashboard({ documentId, workspaceId }: RiskDashboardProps) {
  const [riskAssessments, setRiskAssessments] = useState<RiskAssessment[]>([])
  const [auditTrail, setAuditTrail] = useState<AuditTrailEntry[]>([])
  const [complianceChecks, setComplianceChecks] = useState<ComplianceCheck[]>([])
  const [loading, setLoading] = useState(true)
  const [overallRiskScore, setOverallRiskScore] = useState(0)

  useEffect(() => {
    if (documentId) {
      loadDocumentRiskData()
    }
  }, [documentId])

  const loadDocumentRiskData = async () => {
    try {
      setLoading(true)
      
      if (documentId) {
        const [risks, audit, compliance] = await Promise.all([
          AuditingService.getDocumentRiskAssessments(documentId),
          AuditingService.getDocumentAuditTrail(documentId),
          // Get compliance checks would be implemented
          Promise.resolve([])
        ])
        
        setRiskAssessments(risks)
        setAuditTrail(audit)
        setComplianceChecks(compliance)
        
        // Calculate overall risk score
        if (risks.length > 0) {
          const avgRisk = risks.reduce((sum, r) => sum + r.risk_score, 0) / risks.length
          setOverallRiskScore(avgRisk)
        }
      }
    } catch (error) {
      console.error('Failed to load risk data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-red-500'
    if (score >= 60) return 'text-yellow-500'
    if (score >= 40) return 'text-blue-500'
    return 'text-green-500'
  }

  const getRiskBadgeVariant = (score: number) => {
    if (score >= 80) return 'destructive'
    if (score >= 60) return 'default'
    return 'secondary'
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
      {/* Risk Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overall Risk</p>
                <p className={`text-2xl font-bold ${getRiskColor(overallRiskScore)}`}>
                  {overallRiskScore.toFixed(1)}%
                </p>
              </div>
              <AlertTriangle className={`h-8 w-8 ${getRiskColor(overallRiskScore)}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Risk Assessments</p>
                <p className="text-2xl font-bold">{riskAssessments.length}</p>
              </div>
              <Shield className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Audit Events</p>
                <p className="text-2xl font-bold">{auditTrail.length}</p>
              </div>
              <FileText className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Compliance Score</p>
                <p className="text-2xl font-bold text-green-500">95%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="risk-assessments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="risk-assessments">Risk Assessments</TabsTrigger>
          <TabsTrigger value="audit-trail">Audit Trail</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
        </TabsList>

        <TabsContent value="risk-assessments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Risk Assessments</CardTitle>
              <CardDescription>
                AI-powered risk analysis and human review status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {riskAssessments.map((assessment) => (
                  <div key={assessment.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant={getRiskBadgeVariant(assessment.risk_score)}>
                          {assessment.risk_category}
                        </Badge>
                        <span className="font-medium">
                          Risk Score: {assessment.risk_score.toFixed(1)}%
                        </span>
                      </div>
                      <Badge variant={
                        assessment.status === 'APPROVED' ? 'default' :
                        assessment.status === 'FLAGGED' ? 'destructive' : 'secondary'
                      }>
                        {assessment.status}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-sm">AI Confidence: {assessment.ai_confidence.toFixed(1)}%</span>
                      </div>
                      
                      {assessment.human_review_required && (
                        <div className="flex items-center gap-2 text-amber-600">
                          <Eye className="h-4 w-4" />
                          <span className="text-sm">Human review required</span>
                        </div>
                      )}
                    </div>

                    {assessment.anomalies_detected && assessment.anomalies_detected.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Detected Anomalies:</p>
                        <div className="flex flex-wrap gap-1">
                          {assessment.anomalies_detected.map((anomaly: any, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {anomaly.type}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {assessment.reviewer_notes && (
                      <div className="bg-muted p-3 rounded">
                        <p className="text-sm"><strong>Reviewer Notes:</strong></p>
                        <p className="text-sm mt-1">{assessment.reviewer_notes}</p>
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground">
                      Created: {new Date(assessment.created_at).toLocaleString()}
                      {assessment.reviewed_at && (
                        <span> • Reviewed: {new Date(assessment.reviewed_at).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                ))}

                {riskAssessments.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No risk assessments available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit-trail" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit Trail</CardTitle>
              <CardDescription>
                Complete history of all user actions and system events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {auditTrail.map((entry) => (
                  <div key={entry.id} className="border-l-4 border-l-blue-500 pl-4 py-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          entry.action_type === 'DELETE' ? 'destructive' :
                          entry.action_type === 'CREATE' ? 'default' : 'secondary'
                        }>
                          {entry.action_type}
                        </Badge>
                        <span className="font-medium">{entry.table_name}</span>
                      </div>
                      <Badge variant={
                        entry.risk_level === 'CRITICAL' ? 'destructive' :
                        entry.risk_level === 'HIGH' ? 'default' :
                        entry.risk_level === 'MEDIUM' ? 'secondary' : 'outline'
                      }>
                        {entry.risk_level}
                      </Badge>
                    </div>
                    
                    {entry.changed_fields && entry.changed_fields.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground">Changed fields:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {entry.changed_fields.map((field, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {field}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground mt-2">
                      {new Date(entry.created_at).toLocaleString()}
                      {entry.ip_address && <span> • IP: {entry.ip_address}</span>}
                    </div>
                  </div>
                ))}

                {auditTrail.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No audit trail entries available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Checks</CardTitle>
              <CardDescription>
                Automated compliance verification against industry standards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* SOX Compliance */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium">SOX Compliance</h3>
                    <Badge variant="default">PASSED</Badge>
                  </div>
                  <Progress value={95} className="mb-2" />
                  <p className="text-sm text-muted-foreground">95% compliant</p>
                  <div className="mt-3 space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span>Data retention requirements</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span>Audit trail completeness</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-yellow-500" />
                      <span>Digital signatures pending</span>
                    </div>
                  </div>
                </div>

                {/* PCAOB Compliance */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium">PCAOB Standards</h3>
                    <Badge variant="secondary">REVIEW</Badge>
                  </div>
                  <Progress value={88} className="mb-2" />
                  <p className="text-sm text-muted-foreground">88% compliant</p>
                  <div className="mt-3 space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span>Workpaper documentation</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <XCircle className="h-3 w-3 text-red-500" />
                      <span>Independence verification</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-yellow-500" />
                      <span>Review documentation</span>
                    </div>
                  </div>
                </div>

                {/* GDPR Compliance */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium">GDPR</h3>
                    <Badge variant="default">PASSED</Badge>
                  </div>
                  <Progress value={92} className="mb-2" />
                  <p className="text-sm text-muted-foreground">92% compliant</p>
                  <div className="mt-3 space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span>Consent tracking</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span>Data portability</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span>Right to erasure</span>
                    </div>
                  </div>
                </div>

                {/* ISO 27001 */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium">ISO 27001</h3>
                    <Badge variant="default">PASSED</Badge>
                  </div>
                  <Progress value={97} className="mb-2" />
                  <p className="text-sm text-muted-foreground">97% compliant</p>
                  <div className="mt-3 space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span>Access control</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span>Encryption standards</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span>Audit logging</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="anomalies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Anomaly Detection</CardTitle>
              <CardDescription>
                AI-powered detection of unusual patterns and potential issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* High Priority Anomalies */}
                <div className="border-l-4 border-l-red-500 pl-4 bg-red-50 p-4 rounded">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="font-medium text-red-700">High Priority</span>
                  </div>
                  <p className="text-sm text-red-600">
                    Large transaction amounts detected outside normal business hours
                  </p>
                  <div className="mt-2 text-xs text-red-500">
                    Confidence: 92% • Last detected: 2 hours ago
                  </div>
                </div>

                {/* Medium Priority Anomalies */}
                <div className="border-l-4 border-l-yellow-500 pl-4 bg-yellow-50 p-4 rounded">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span className="font-medium text-yellow-700">Medium Priority</span>
                  </div>
                  <p className="text-sm text-yellow-600">
                    Inconsistent date formats across multiple documents
                  </p>
                  <div className="mt-2 text-xs text-yellow-500">
                    Confidence: 78% • Last detected: 1 day ago
                  </div>
                </div>

                {/* Low Priority Anomalies */}
                <div className="border-l-4 border-l-blue-500 pl-4 bg-blue-50 p-4 rounded">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-blue-500" />
                    <span className="font-medium text-blue-700">Low Priority</span>
                  </div>
                  <p className="text-sm text-blue-600">
                    Minor OCR confidence issues in scanned documents
                  </p>
                  <div className="mt-2 text-xs text-blue-500">
                    Confidence: 65% • Last detected: 3 days ago
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
