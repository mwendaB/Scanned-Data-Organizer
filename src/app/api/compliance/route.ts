import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// API endpoint for managing compliance rules in the database (simplified version)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const frameworkId = searchParams.get('frameworkId')

    switch (action) {
      case 'frameworks':
        return await getComplianceFrameworks()
      
      case 'rules':
        return await getSimulatedRules(frameworkId)
      
      case 'thresholds':
        return await getSimulatedThresholds(frameworkId)
      
      case 'setup-tables':
        return await checkTableSetup()
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Compliance API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'create-rule':
        return await createSimulatedRule(body)
      
      case 'create-framework':
        return await createComplianceFramework(body)
      
      case 'run-compliance-check':
        return await runSimulatedComplianceCheck(body)
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Compliance API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get all compliance frameworks
async function getComplianceFrameworks() {
  const { data, error } = await supabase
    .from('compliance_frameworks')
    .select('*')
    .order('name')

  if (error) throw error
  return NextResponse.json({ frameworks: data || [] })
}

// Get simulated rules (since the rules table doesn't exist yet)
async function getSimulatedRules(frameworkId: string | null) {
  const { data: frameworks, error } = await supabase
    .from('compliance_frameworks')
    .select('*')
    .order('name')

  if (error) throw error

  // Generate simulated rules based on frameworks
  const simulatedRules = []
  const ruleTypes = ['FIELD_REQUIRED', 'DATA_VALIDATION', 'VALUE_RANGE', 'PATTERN_MATCH', 'CUSTOM_LOGIC']
  const severities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

  for (const framework of frameworks || []) {
    if (frameworkId && framework.id !== frameworkId) continue

    // Generate 3-5 rules per framework
    const ruleCount = Math.floor(Math.random() * 3) + 3
    for (let i = 0; i < ruleCount; i++) {
      simulatedRules.push({
        id: `rule-${framework.id}-${i}`,
        framework_id: framework.id,
        framework_name: framework.name,
        rule_name: `${framework.name} Rule ${i + 1}`,
        rule_description: `Simulated compliance rule for ${framework.name}`,
        rule_type: ruleTypes[Math.floor(Math.random() * ruleTypes.length)],
        rule_config: { simulated: true, framework: framework.name },
        max_score: (i + 1) * 25,
        weight: 1.0,
        severity: severities[Math.floor(Math.random() * severities.length)],
        is_active: true,
        created_at: new Date().toISOString()
      })
    }
  }

  return NextResponse.json({ rules: simulatedRules })
}

// Get simulated thresholds
async function getSimulatedThresholds(frameworkId: string | null) {
  const { data: frameworks, error } = await supabase
    .from('compliance_frameworks')
    .select('*')
    .order('name')

  if (error) throw error

  const simulatedThresholds = (frameworks || [])
    .filter(fw => !frameworkId || fw.id === frameworkId)
    .map(framework => ({
      id: `threshold-${framework.id}`,
      framework_id: framework.id,
      pass_threshold: 80.0,
      manual_review_threshold: 60.0,
      fail_threshold: 0.0,
      allow_exceptions: true,
      require_documentation: false,
      compliance_frameworks: {
        name: framework.name,
        description: framework.description
      },
      created_at: new Date().toISOString()
    }))

  return NextResponse.json({ thresholds: simulatedThresholds })
}

// Check table setup
async function checkTableSetup() {
  try {
    // Check if compliance_frameworks exists
    const { data, error } = await supabase
      .from('compliance_frameworks')
      .select('id')
      .limit(1)

    if (error) {
      return NextResponse.json({
        message: 'Compliance frameworks table not found',
        tablesExist: false,
        error: error.message
      })
    }

    return NextResponse.json({
      message: 'Basic compliance system is working with frameworks table',
      tablesExist: true,
      note: 'Using simplified compliance system with existing tables'
    })
  } catch (error) {
    return NextResponse.json({
      message: 'Error checking table setup',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// Create simulated rule (store in framework metadata for now)
async function createSimulatedRule(body: {
  frameworkId: string
  ruleName: string
  ruleDescription: string
  ruleType: string
  ruleConfig: unknown
  maxScore: number
  weight: number
  severity: string
}) {
  // For now, just return success since we can't store rules in a separate table
  const simulatedRule = {
    id: `rule-${Date.now()}`,
    framework_id: body.frameworkId,
    rule_name: body.ruleName,
    rule_description: body.ruleDescription,
    rule_type: body.ruleType,
    rule_config: body.ruleConfig,
    max_score: body.maxScore,
    weight: body.weight,
    severity: body.severity,
    is_active: true,
    created_at: new Date().toISOString()
  }

  return NextResponse.json({
    message: 'Simulated compliance rule created successfully',
    rule: simulatedRule,
    note: 'This is a simulated rule. Full rule storage requires database migration.'
  })
}

// Create a new compliance framework
async function createComplianceFramework(body: {
  name: string
  description: string
  requirements: unknown
}) {
  try {
    console.log('Creating compliance framework:', body)
    
    const { data, error } = await supabase
      .from('compliance_frameworks')
      .insert([{
        name: body.name,
        description: body.description,
        requirements: body.requirements || {}
      }])
      .select()
      .single()

    if (error) {
      console.error('Database error creating framework:', error)
      throw error
    }

    console.log('Framework created successfully:', data)
    return NextResponse.json({
      message: 'Compliance framework created successfully',
      framework: data
    })
  } catch (error) {
    console.error('Error in createComplianceFramework:', error)
    throw error
  }
}

// Run simulated compliance check
async function runSimulatedComplianceCheck(body: {
  documentId: string
  frameworkId: string
}) {
  try {
    // Get the framework
    const { data: framework, error: frameworkError } = await supabase
      .from('compliance_frameworks')
      .select('*')
      .eq('id', body.frameworkId)
      .single()

    if (frameworkError) throw frameworkError

    // Simulate rule execution
    const totalRules = Math.floor(Math.random() * 3) + 3 // 3-5 rules
    const rulesPassed = Math.floor(Math.random() * totalRules) + Math.floor(totalRules * 0.6) // At least 60% pass
    const finalScore = Math.floor((rulesPassed / totalRules) * 100)

    let status = 'FAILED'
    if (finalScore >= 80) {
      status = 'PASSED'
    } else if (finalScore >= 60) {
      status = 'MANUAL_REVIEW'
    }

    // Create a simulated compliance check record
    const simulatedCheck = {
      id: `check-${Date.now()}`,
      document_id: body.documentId,
      framework_id: body.frameworkId,
      check_name: `${framework.name} Compliance Check`,
      status: status,
      score: finalScore,
      details: {
        rules_executed: totalRules,
        rules_passed: rulesPassed,
        simulated: true,
        framework_name: framework.name
      },
      created_at: new Date().toISOString()
    }

    return NextResponse.json({
      message: 'Simulated compliance check completed successfully',
      check: simulatedCheck,
      summary: {
        totalRules: totalRules,
        rulesPassed: rulesPassed,
        finalScore: finalScore,
        status: status
      },
      note: 'This is a simulated compliance check. Full functionality requires database migration.'
    })

  } catch (error) {
    console.error('Simulated compliance check failed:', error)
    throw error
  }
}
