import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Edit, Trash2, Play, Settings, AlertTriangle, Check, X } from 'lucide-react'

interface ComplianceFramework {
  id: string
  name: string
  description: string
  requirements: Record<string, unknown>
  is_active: boolean
  created_at: string
}

interface ComplianceRule {
  id: string
  framework_id: string
  rule_name: string
  rule_description: string
  rule_type: string
  rule_config: Record<string, unknown>
  max_score: number
  weight: number
  severity: string
  is_active: boolean
  framework_name?: string
}

interface ScoringThresholds {
  id: string
  framework_id: string
  pass_threshold: number
  manual_review_threshold: number
  fail_threshold: number
  allow_exceptions: boolean
  require_documentation: boolean
}

export default function ComplianceManager() {
  const [frameworks, setFrameworks] = useState<ComplianceFramework[]>([])
  const [rules, setRules] = useState<ComplianceRule[]>([])
  const [thresholds, setThresholds] = useState<ScoringThresholds[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form states
  const [showRuleForm, setShowRuleForm] = useState(false)
  const [showFrameworkForm, setShowFrameworkForm] = useState(false)
  const [editingRule, setEditingRule] = useState<ComplianceRule | null>(null)
  const [selectedFramework, setSelectedFramework] = useState<string>('all')

  // Rule form data
  const [ruleForm, setRuleForm] = useState({
    framework_id: '',
    rule_name: '',
    rule_description: '',
    rule_type: 'FIELD_REQUIRED',
    rule_config: '{}',
    max_score: 100,
    weight: 1.0,
    severity: 'MEDIUM'
  })

  // Framework form data
  const [frameworkForm, setFrameworkForm] = useState({
    name: '',
    description: '',
    requirements: '{}'
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load frameworks
      const frameworksRes = await fetch('/api/compliance-demo?action=frameworks')
      const frameworksData = await frameworksRes.json()
      
      if (!frameworksRes.ok) {
        throw new Error(frameworksData.error)
      }
      
      setFrameworks(frameworksData.frameworks || [])

      // Load rules
      const rulesRes = await fetch('/api/compliance-demo?action=rules')
      const rulesData = await rulesRes.json()
      
      if (!rulesRes.ok) {
        throw new Error(rulesData.error)
      }
      
      setRules(rulesData.rules || [])

      // Load thresholds
      const thresholdsRes = await fetch('/api/compliance-demo?action=thresholds')
      const thresholdsData = await thresholdsRes.json()
      
      if (!thresholdsRes.ok) {
        throw new Error(thresholdsData.error)
      }
      
      setThresholds(thresholdsData.thresholds || [])

    } catch (err) {
      console.error('Failed to load compliance data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const setupTables = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/compliance-demo?action=setup-tables')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error)
      }
      
      setSuccess(data.message)
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to setup tables')
    } finally {
      setLoading(false)
    }
  }

  const createRule = async () => {
    try {
      setError(null)
      
      const response = await fetch('/api/compliance-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-rule',
          frameworkId: ruleForm.framework_id,
          ruleName: ruleForm.rule_name,
          ruleDescription: ruleForm.rule_description,
          ruleType: ruleForm.rule_type,
          ruleConfig: JSON.parse(ruleForm.rule_config),
          maxScore: ruleForm.max_score,
          weight: ruleForm.weight,
          severity: ruleForm.severity
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error)
      }
      
      setSuccess('Compliance rule created successfully')
      setShowRuleForm(false)
      setRuleForm({
        framework_id: '',
        rule_name: '',
        rule_description: '',
        rule_type: 'FIELD_REQUIRED',
        rule_config: '{}',
        max_score: 100,
        weight: 1.0,
        severity: 'MEDIUM'
      })
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create rule')
    }
  }

  const createFramework = async () => {
    try {
      setError(null)
      
      const response = await fetch('/api/compliance-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-framework',
          name: frameworkForm.name,
          description: frameworkForm.description,
          requirements: JSON.parse(frameworkForm.requirements)
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error)
      }
      
      setSuccess('Compliance framework created successfully')
      setShowFrameworkForm(false)
      setFrameworkForm({
        name: '',
        description: '',
        requirements: '{}'
      })
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create framework')
    }
  }

  const runComplianceCheck = async (documentId: string, frameworkId: string) => {
    try {
      setError(null)
      
      const response = await fetch('/api/compliance-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'run-compliance-check',
          documentId,
          frameworkId
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error)
      }
      
      setSuccess(`Compliance check completed: ${data.summary.rulesPassed}/${data.summary.totalRules} rules passed (Score: ${data.summary.finalScore.toFixed(1)})`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run compliance check')
    }
  }

  const filteredRules = selectedFramework && selectedFramework !== 'all'
    ? rules.filter(rule => rule.framework_id === selectedFramework)
    : rules

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading compliance management...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Compliance Rules Management
          </CardTitle>
          <CardDescription>
            Manage compliance frameworks, rules, and scoring thresholds stored in your database
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <Button onClick={setupTables} variant="outline">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Setup Compliance Tables
            </Button>
            <Button onClick={() => setShowFrameworkForm(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              New Framework
            </Button>
            <Button onClick={() => setShowRuleForm(true)} className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              New Rule
            </Button>
            <Button onClick={loadData} variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <X className="h-4 w-4" />
                <span className="font-medium">Error:</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-700">
                <Check className="h-4 w-4" />
                <span className="font-medium">Success:</span>
                <span>{success}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Frameworks Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Frameworks ({frameworks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {frameworks.map((framework) => (
              <Card key={framework.id} className="border-2">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{framework.name}</CardTitle>
                    <Badge variant={framework.is_active ? "default" : "secondary"}>
                      {framework.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">{framework.description}</p>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setSelectedFramework(framework.id)}
                    >
                      View Rules
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => runComplianceCheck('demo-doc-id', framework.id)}
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Test
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Rules Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Compliance Rules ({filteredRules.length})
              {selectedFramework && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  - {frameworks.find(f => f.id === selectedFramework)?.name}
                </span>
              )}
            </CardTitle>
            <div className="flex gap-2">
              <Select value={selectedFramework} onValueChange={setSelectedFramework}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by framework" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Frameworks</SelectItem>
                  {frameworks.map((framework) => (
                    <SelectItem key={framework.id} value={framework.id}>
                      {framework.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredRules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No compliance rules found</p>
              <p className="text-sm">Create your first rule to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rule Name</TableHead>
                  <TableHead>Framework</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">{rule.rule_name}</TableCell>
                    <TableCell>{rule.framework_name || 'Unknown'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {rule.rule_type.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>{rule.max_score}</TableCell>
                    <TableCell>{rule.weight}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          rule.severity === 'CRITICAL' ? 'destructive' :
                          rule.severity === 'HIGH' ? 'default' :
                          rule.severity === 'MEDIUM' ? 'secondary' : 'outline'
                        }
                      >
                        {rule.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={rule.is_active ? "default" : "secondary"}>
                        {rule.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Rule Form */}
      {showRuleForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Compliance Rule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Framework</label>
                <Select value={ruleForm.framework_id} onValueChange={(value) => setRuleForm({...ruleForm, framework_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select framework" />
                  </SelectTrigger>
                  <SelectContent>
                    {frameworks.map((framework) => (
                      <SelectItem key={framework.id} value={framework.id}>
                        {framework.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Rule Type</label>
                <Select value={ruleForm.rule_type} onValueChange={(value) => setRuleForm({...ruleForm, rule_type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIELD_REQUIRED">Field Required</SelectItem>
                    <SelectItem value="DATA_VALIDATION">Data Validation</SelectItem>
                    <SelectItem value="VALUE_RANGE">Value Range</SelectItem>
                    <SelectItem value="PATTERN_MATCH">Pattern Match</SelectItem>
                    <SelectItem value="CALCULATION">Calculation</SelectItem>
                    <SelectItem value="CROSS_REFERENCE">Cross Reference</SelectItem>
                    <SelectItem value="CUSTOM_LOGIC">Custom Logic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Rule Name</label>
              <Input 
                value={ruleForm.rule_name}
                onChange={(e) => setRuleForm({...ruleForm, rule_name: e.target.value})}
                placeholder="Enter rule name"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea 
                value={ruleForm.rule_description}
                onChange={(e) => setRuleForm({...ruleForm, rule_description: e.target.value})}
                placeholder="Describe what this rule checks"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Rule Configuration (JSON)</label>
              <Textarea 
                value={ruleForm.rule_config}
                onChange={(e) => setRuleForm({...ruleForm, rule_config: e.target.value})}
                placeholder='{"field": "value", "validation": "criteria"}'
                className="font-mono text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Max Score</label>
                <Input 
                  type="number"
                  value={ruleForm.max_score}
                  onChange={(e) => setRuleForm({...ruleForm, max_score: Number(e.target.value)})}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Weight</label>
                <Input 
                  type="number"
                  step="0.1"
                  value={ruleForm.weight}
                  onChange={(e) => setRuleForm({...ruleForm, weight: Number(e.target.value)})}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Severity</label>
                <Select value={ruleForm.severity} onValueChange={(value) => setRuleForm({...ruleForm, severity: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-4">
              <Button onClick={createRule} className="bg-green-600 hover:bg-green-700">
                Create Rule
              </Button>
              <Button onClick={() => setShowRuleForm(false)} variant="outline">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Framework Form */}
      {showFrameworkForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Compliance Framework</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Framework Name</label>
              <Input 
                value={frameworkForm.name}
                onChange={(e) => setFrameworkForm({...frameworkForm, name: e.target.value})}
                placeholder="e.g., SOX, GDPR, ISO 27001"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea 
                value={frameworkForm.description}
                onChange={(e) => setFrameworkForm({...frameworkForm, description: e.target.value})}
                placeholder="Describe the compliance framework"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Requirements (JSON)</label>
              <Textarea 
                value={frameworkForm.requirements}
                onChange={(e) => setFrameworkForm({...frameworkForm, requirements: e.target.value})}
                placeholder='{"data_retention": "7_years", "audit_trail": "required"}'
                className="font-mono text-sm"
              />
            </div>

            <div className="flex gap-4">
              <Button onClick={createFramework} className="bg-blue-600 hover:bg-blue-700">
                Create Framework
              </Button>
              <Button onClick={() => setShowFrameworkForm(false)} variant="outline">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
