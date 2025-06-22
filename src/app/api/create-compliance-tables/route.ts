import { NextRequest, NextResponse } from 'next/server'

// Create the admin client for database operations
const { createClient } = require('@supabase/supabase-js')
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function POST(_request: NextRequest) {
  try {
    console.log('🔧 Creating compliance tables...')

    // Check if tables already exist by trying to query them
    console.log('Checking if compliance tables exist...')
    
    // Try to query compliance_rules table
    const { data: existingRules, error: rulesCheckError } = await supabaseAdmin
      .from('compliance_rules')
      .select('id')
      .limit(1)

    if (!rulesCheckError) {
      console.log('✅ Compliance tables already exist!')
      return NextResponse.json({
        success: true,
        message: 'Compliance tables already exist and are working!',
        tablesExist: true
      })
    }

    console.log('📋 Tables do not exist, will use existing compliance_frameworks table structure')

    // Since we can't create tables via API easily, let's check what we can do
    // First, verify that compliance_frameworks table exists
    const { data: frameworks, error: frameworkError } = await supabaseAdmin
      .from('compliance_frameworks')
      .select('*')
      .limit(5)

    if (frameworkError) {
      throw new Error(`Compliance frameworks table not found: ${frameworkError.message}`)
    }

    console.log(`✅ Found ${frameworks?.length || 0} compliance frameworks`)

    // For now, return a message that tables need to be created manually
    return NextResponse.json({
      success: false,
      message: 'Compliance tables need to be created via database migration',
      instructions: [
        '1. The basic compliance_frameworks table exists',
        '2. Additional tables (compliance_rules, compliance_rule_results, compliance_scoring_thresholds) need to be created',
        '3. For now, we can work with the existing compliance_frameworks table',
        '4. You can create new frameworks and we\'ll simulate the rule system'
      ],
      existingFrameworks: frameworks?.length || 0,
      recommendation: 'Use the simplified compliance system for now'
    })

  } catch (error) {
    console.error('💥 Error setting up compliance tables:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to setup compliance tables',
        suggestion: 'We can work with the existing compliance_frameworks table for now'
      },
      { status: 500 }
    )
  }
}
