import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('Initializing compliance system with real data...')

    // Check if frameworks already exist
    const { data: existingFrameworks, error: checkError } = await supabase
      .from('compliance_frameworks')
      .select('id')
      .limit(1)

    if (checkError) {
      console.error('Error checking frameworks:', checkError)
      return NextResponse.json({ error: 'Failed to check existing frameworks' }, { status: 500 })
    }

    if (existingFrameworks && existingFrameworks.length > 0) {
      return NextResponse.json({ 
        message: 'Compliance frameworks already exist',
        note: 'Use the compliance management interface to add more frameworks'
      })
    }

    // Insert sample frameworks
    const frameworks = [
      {
        name: 'SOX',
        description: 'Sarbanes-Oxley Act Compliance',
        requirements: {
          data_retention: '7_years',
          audit_trail: 'required',
          digital_signatures: 'recommended',
          segregation_of_duties: 'required'
        },
        is_active: true
      },
      {
        name: 'GDPR',
        description: 'General Data Protection Regulation',
        requirements: {
          consent_tracking: 'required',
          data_portability: 'required',
          right_to_erasure: 'required',
          privacy_by_design: 'required'
        },
        is_active: true
      },
      {
        name: 'PCAOB Standards',
        description: 'Public Company Accounting Oversight Board',
        requirements: {
          workpaper_documentation: 'required',
          independence_verification: 'required',
          quality_control: 'required',
          risk_assessment: 'required'
        },
        is_active: true
      },
      {
        name: 'ISO 27001',
        description: 'Information Security Management',
        requirements: {
          access_control: 'required',
          encryption: 'required',
          audit_logging: 'required',
          incident_response: 'required'
        },
        is_active: true
      }
    ]

    const { data: insertedFrameworks, error: insertError } = await supabase
      .from('compliance_frameworks')
      .insert(frameworks)
      .select()

    if (insertError) {
      console.error('Error inserting frameworks:', insertError)
      return NextResponse.json({ error: 'Failed to insert frameworks' }, { status: 500 })
    }

    console.log('Frameworks inserted successfully:', insertedFrameworks)

    return NextResponse.json({
      message: 'Compliance system initialized successfully',
      frameworks: insertedFrameworks,
      note: 'Real compliance frameworks have been created in the database'
    })

  } catch (error) {
    console.error('Initialization error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
