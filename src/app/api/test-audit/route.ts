import { NextRequest, NextResponse } from 'next/server'
import { AuditingService } from '@/lib/auditing'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Test the auditing service
    await AuditingService.logAuditEvent({
      table_name: 'test',
      record_id: 'test-123',
      action_type: 'CREATE',
      new_values: body,
      risk_level: 'LOW'
    })

    return NextResponse.json({ 
      success: true,
      message: 'Audit event logged successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Test audit failed:', error)
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Auditing API Test Endpoint',
    endpoints: {
      'POST /api/test-audit': 'Test audit logging',
      'GET /api/get-ip': 'Get client IP address'
    },
    status: 'Active'
  })
}
