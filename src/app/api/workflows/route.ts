import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// GET /api/workflows - Get workflows for a user or document
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('documentId')
    const userId = searchParams.get('userId')
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    let query = supabase.from('workflow_instances').select('*')
    
    if (documentId) {
      query = query.eq('document_id', documentId)
    } else if (userId) {
      query = query.eq('initiated_by', userId)
    }
    
    const { data: workflows, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching workflows:', error)
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json({ data: workflows })
  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/workflows - Create a new workflow instance
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { data: workflow, error } = await supabase
      .from('workflow_instances')
      .insert([{
        ...body,
        created_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating workflow:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data: workflow })
  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH /api/workflows - Update workflow instance
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { workflowId, status, currentStep, workflowData } = body
    
    if (!workflowId) {
      return NextResponse.json({ error: 'Workflow ID is required' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const updateData: any = {
      updated_at: new Date().toISOString()
    }
    
    if (status) updateData.status = status
    if (currentStep) updateData.current_step = currentStep
    if (workflowData) updateData.workflow_data = workflowData

    const { data: workflow, error } = await supabase
      .from('workflow_instances')
      .update(updateData)
      .eq('id', workflowId)
      .select()
      .single()

    if (error) {
      console.error('Error updating workflow:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ 
      data: workflow,
      message: 'Workflow updated successfully'
    })
  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
