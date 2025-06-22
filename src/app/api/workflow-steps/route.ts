import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// GET /api/workflow-steps - Get workflow steps for a workflow instance
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workflowInstanceId = searchParams.get('workflowInstanceId')
    
    if (!workflowInstanceId) {
      return NextResponse.json({ error: 'Workflow instance ID is required' }, { status: 400 })
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { data: steps, error } = await supabase
      .from('workflow_steps')
      .select('*')
      .eq('workflow_instance_id', workflowInstanceId)
      .order('step_number', { ascending: true })

    if (error) {
      console.error('Error fetching workflow steps:', error)
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json({ data: steps })
  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/workflow-steps - Create a new workflow step
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { data: step, error } = await supabase
      .from('workflow_steps')
      .insert([{
        ...body,
        created_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating workflow step:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data: step })
  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH /api/workflow-steps - Update workflow step status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { stepId, status, assignedTo, completedBy, startedAt, completedAt, reviewerNotes } = body
    
    if (!stepId) {
      return NextResponse.json({ error: 'Step ID is required' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const updateData: any = {
      updated_at: new Date().toISOString()
    }
    
    if (status) updateData.status = status
    if (assignedTo) updateData.assigned_to = assignedTo
    if (completedBy) updateData.completed_by = completedBy
    if (startedAt) updateData.started_at = startedAt
    if (completedAt) updateData.completed_at = completedAt
    if (reviewerNotes) updateData.reviewer_notes = reviewerNotes

    const { data: step, error } = await supabase
      .from('workflow_steps')
      .update(updateData)
      .eq('id', stepId)
      .select()
      .single()

    if (error) {
      console.error('Error updating workflow step:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ 
      data: step,
      message: 'Workflow step updated successfully'
    })
  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
