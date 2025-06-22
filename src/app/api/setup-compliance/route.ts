import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('Starting compliance tables setup...')

    // Check if compliance_frameworks table exists
    const { data: frameworksCheck, error: frameworksError } = await supabase
      .from('compliance_frameworks')
      .select('count')
      .limit(1)

    if (frameworksError) {
      console.log('Compliance frameworks table does not exist, creating...')
      
      // Create compliance_frameworks table if it doesn't exist
      const { error: createFrameworksError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS compliance_frameworks (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL UNIQUE,
            description TEXT,
            requirements JSONB DEFAULT '{}'::jsonb,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
          );
        `
      })

      if (createFrameworksError) {
        console.error('Error creating frameworks table:', createFrameworksError)
        return NextResponse.json({ error: 'Failed to create frameworks table' }, { status: 500 })
      }
    }

    // Check if compliance_checks table exists
    const { data: checksCheck, error: checksError } = await supabase
      .from('compliance_checks')
      .select('count')
      .limit(1)

    if (checksError) {
      console.log('Compliance checks table does not exist, creating...')
      
      const { error: createChecksError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS compliance_checks (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            framework_id UUID NOT NULL REFERENCES compliance_frameworks(id) ON DELETE CASCADE,
            check_name TEXT NOT NULL,
            status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'PASSED', 'FAILED', 'ERROR')),
            score DECIMAL(5,2) DEFAULT 0.00,
            details JSONB DEFAULT '{}'::jsonb,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
            created_by UUID REFERENCES auth.users(id)
          );
        `
      })

      if (createChecksError) {
        console.error('Error creating checks table:', createChecksError)
        return NextResponse.json({ error: 'Failed to create checks table' }, { status: 500 })
      }
    }

    // Create compliance_rules table
    const { error: rulesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS compliance_rules (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          framework_id UUID NOT NULL REFERENCES compliance_frameworks(id) ON DELETE CASCADE,
          rule_name TEXT NOT NULL,
          rule_description TEXT,
          rule_type TEXT NOT NULL CHECK (rule_type IN ('DATA_VALIDATION', 'FIELD_REQUIRED', 'VALUE_RANGE', 'PATTERN_MATCH', 'CALCULATION', 'CROSS_REFERENCE', 'CUSTOM_LOGIC')),
          rule_config JSONB NOT NULL DEFAULT '{}'::jsonb,
          max_score DECIMAL(5,2) DEFAULT 100.00,
          weight DECIMAL(3,2) DEFAULT 1.00,
          is_active BOOLEAN DEFAULT true,
          severity TEXT DEFAULT 'MEDIUM' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
          created_by UUID REFERENCES auth.users(id)
        );
      `
    })

    if (rulesError) {
      console.error('Error creating rules table:', rulesError)
      return NextResponse.json({ error: 'Failed to create rules table' }, { status: 500 })
    }

    // Create compliance_scoring_thresholds table
    const { error: thresholdsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS compliance_scoring_thresholds (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          framework_id UUID NOT NULL REFERENCES compliance_frameworks(id) ON DELETE CASCADE,
          pass_threshold DECIMAL(5,2) DEFAULT 80.00,
          manual_review_threshold DECIMAL(5,2) DEFAULT 70.00,
          fail_threshold DECIMAL(5,2) DEFAULT 60.00,
          allow_exceptions BOOLEAN DEFAULT false,
          require_documentation BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
      `
    })

    if (thresholdsError) {
      console.error('Error creating thresholds table:', thresholdsError)
      return NextResponse.json({ error: 'Failed to create thresholds table' }, { status: 500 })
    }

    // Insert sample frameworks if none exist
    const { data: existingFrameworks } = await supabase
      .from('compliance_frameworks')
      .select('id')
      .limit(1)

    if (!existingFrameworks || existingFrameworks.length === 0) {
      console.log('Inserting sample frameworks...')
      
      const { error: insertError } = await supabase
        .from('compliance_frameworks')
        .insert([
          {
            name: 'SOX',
            description: 'Sarbanes-Oxley Act Compliance',
            requirements: {
              data_retention: '7_years',
              audit_trail: 'required',
              digital_signatures: 'recommended',
              segregation_of_duties: 'required'
            }
          },
          {
            name: 'GDPR',
            description: 'General Data Protection Regulation',
            requirements: {
              consent_tracking: 'required',
              data_portability: 'required',
              right_to_erasure: 'required',
              privacy_by_design: 'required'
            }
          },
          {
            name: 'PCAOB Standards',
            description: 'Public Company Accounting Oversight Board',
            requirements: {
              workpaper_documentation: 'required',
              independence_verification: 'required',
              quality_control: 'required',
              risk_assessment: 'required'
            }
          },
          {
            name: 'ISO 27001',
            description: 'Information Security Management',
            requirements: {
              access_control: 'required',
              encryption: 'required',
              audit_logging: 'required',
              incident_response: 'required'
            }
          }
        ])

      if (insertError) {
        console.error('Error inserting sample frameworks:', insertError)
        return NextResponse.json({ error: 'Failed to insert sample frameworks' }, { status: 500 })
      }
    }

    return NextResponse.json({ 
      message: 'Compliance tables created successfully',
      tables: ['compliance_frameworks', 'compliance_checks', 'compliance_rules', 'compliance_scoring_thresholds']
    })

  } catch (error) {
    console.error('Compliance setup error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
