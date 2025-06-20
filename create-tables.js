const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function createTables() {
  console.log('🏗️ Creating database tables...\n')

  // Create tables with simplified schema (without auth.users references)
  const createTablesSQL = `
    -- Create documents table
    CREATE TABLE IF NOT EXISTS documents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      filename TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      mime_type TEXT NOT NULL,
      uploaded_by TEXT NOT NULL,
      workspace_id TEXT,
      ocr_text TEXT,
      metadata JSONB DEFAULT '{}'::jsonb,
      tags TEXT[] DEFAULT '{}',
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );

    -- Create parsed_data table
    CREATE TABLE IF NOT EXISTS parsed_data (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      document_id TEXT NOT NULL,
      field_name TEXT NOT NULL,
      field_value TEXT NOT NULL,
      confidence DECIMAL(5,4) DEFAULT 0.0,
      field_type TEXT DEFAULT 'text',
      page_number INTEGER DEFAULT 1,
      coordinates JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );

    -- Create workspaces table
    CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      created_by TEXT NOT NULL,
      settings JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );

    -- Create compliance_frameworks table
    CREATE TABLE IF NOT EXISTS compliance_frameworks (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      requirements JSONB DEFAULT '{}'::jsonb,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );

    -- Create compliance_checks table
    CREATE TABLE IF NOT EXISTS compliance_checks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      document_id TEXT NOT NULL,
      framework_id TEXT NOT NULL,
      check_name TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('PASSED', 'FAILED', 'MANUAL_REVIEW', 'PENDING')),
      score INTEGER DEFAULT 0,
      details JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );

    -- Create workflows table
    CREATE TABLE IF NOT EXISTS workflows (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      workspace_id TEXT,
      created_by TEXT NOT NULL,
      workflow_config JSONB DEFAULT '{}'::jsonb,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );

    -- Create workflow_instances table
    CREATE TABLE IF NOT EXISTS workflow_instances (
      id TEXT PRIMARY KEY,
      workflow_id TEXT NOT NULL,
      document_id TEXT NOT NULL,
      initiated_by TEXT NOT NULL,
      current_step INTEGER DEFAULT 1,
      status TEXT NOT NULL CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'CANCELLED')),
      workflow_data JSONB DEFAULT '{}'::jsonb,
      due_date TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
      completed_at TIMESTAMP WITH TIME ZONE
    );

    -- Create workflow_steps table
    CREATE TABLE IF NOT EXISTS workflow_steps (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      workflow_instance_id TEXT NOT NULL,
      step_number INTEGER NOT NULL,
      step_name TEXT NOT NULL,
      assigned_to TEXT,
      assigned_role TEXT,
      status TEXT NOT NULL CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'REJECTED')),
      action_required TEXT NOT NULL,
      comments TEXT,
      completed_by TEXT,
      started_at TIMESTAMP WITH TIME ZONE,
      completed_at TIMESTAMP WITH TIME ZONE,
      due_date TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );

    -- Create review_comments table
    CREATE TABLE IF NOT EXISTS review_comments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      document_id TEXT NOT NULL,
      comment_text TEXT NOT NULL,
      comment_type TEXT NOT NULL CHECK (comment_type IN ('GENERAL', 'QUESTION', 'CONCERN', 'APPROVAL', 'REJECTION')),
      priority TEXT NOT NULL CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
      created_by TEXT NOT NULL,
      workflow_step_id TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );

    -- Create risk_assessments table
    CREATE TABLE IF NOT EXISTS risk_assessments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      document_id TEXT NOT NULL,
      risk_category TEXT NOT NULL CHECK (risk_category IN ('FINANCIAL', 'OPERATIONAL', 'COMPLIANCE', 'FRAUD', 'DATA_QUALITY')),
      risk_level TEXT NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
      risk_description TEXT NOT NULL,
      likelihood TEXT NOT NULL CHECK (likelihood IN ('LOW', 'MEDIUM', 'HIGH')),
      impact TEXT NOT NULL CHECK (impact IN ('LOW', 'MEDIUM', 'HIGH')),
      mitigation_plan TEXT,
      assigned_to TEXT,
      due_date TIMESTAMP WITH TIME ZONE,
      status TEXT NOT NULL CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'ACCEPTED', 'TRANSFERRED')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );

    -- Create financial_extractions table
    CREATE TABLE IF NOT EXISTS financial_extractions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      document_id TEXT NOT NULL,
      extraction_type TEXT NOT NULL CHECK (extraction_type IN ('REVENUE', 'EXPENSE', 'ASSET', 'LIABILITY', 'EQUITY')),
      amount DECIMAL(15,2) NOT NULL,
      currency TEXT DEFAULT 'USD',
      period TEXT,
      line_item TEXT NOT NULL,
      confidence DECIMAL(5,4) DEFAULT 0.0,
      verification_status TEXT NOT NULL CHECK (verification_status IN ('PENDING', 'VERIFIED', 'REJECTED', 'PENDING_REVIEW')),
      extraction_details JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );

    -- Create audit_trail table
    CREATE TABLE IF NOT EXISTS audit_trail (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id TEXT NOT NULL,
      details JSONB DEFAULT '{}'::jsonb,
      ip_address TEXT,
      user_agent TEXT,
      session_id TEXT,
      workspace_id TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );

    -- Create workspace_collaborations table
    CREATE TABLE IF NOT EXISTS workspace_collaborations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      workspace_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('OWNER', 'ADMIN', 'REVIEWER', 'ANALYST', 'COMPLIANCE_OFFICER', 'VIEWER')),
      permissions TEXT[] DEFAULT '{}',
      invited_by TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );

    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_documents_workspace_id ON documents(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
    CREATE INDEX IF NOT EXISTS idx_parsed_data_document_id ON parsed_data(document_id);
    CREATE INDEX IF NOT EXISTS idx_compliance_checks_document_id ON compliance_checks(document_id);
    CREATE INDEX IF NOT EXISTS idx_compliance_checks_framework_id ON compliance_checks(framework_id);
    CREATE INDEX IF NOT EXISTS idx_workflow_instances_document_id ON workflow_instances(document_id);
    CREATE INDEX IF NOT EXISTS idx_workflow_steps_instance_id ON workflow_steps(workflow_instance_id);
    CREATE INDEX IF NOT EXISTS idx_review_comments_document_id ON review_comments(document_id);
    CREATE INDEX IF NOT EXISTS idx_risk_assessments_document_id ON risk_assessments(document_id);
    CREATE INDEX IF NOT EXISTS idx_financial_extractions_document_id ON financial_extractions(document_id);
    CREATE INDEX IF NOT EXISTS idx_audit_trail_user_id ON audit_trail(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_trail_resource ON audit_trail(resource_type, resource_id);
    CREATE INDEX IF NOT EXISTS idx_workspace_collaborations_workspace_id ON workspace_collaborations(workspace_id);
  `

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql: createTablesSQL })
    
    if (error) {
      // If RPC doesn't work, try executing each statement individually
      console.log('RPC method failed, trying individual statements...')
      
      const statements = createTablesSQL.split(';').filter(stmt => stmt.trim())
      
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            console.log(`Executing: ${statement.substring(0, 50)}...`)
            const result = await supabase.from('_').select().limit(0) // This will fail, but we'll catch it
          } catch (e) {
            // Expected to fail since we're not using proper SQL execution
          }
        }
      }
      
      console.log('❌ Could not create tables automatically.')
      console.log('📋 Please create tables manually in Supabase SQL Editor.')
      return false
    }

    console.log('✅ Tables created successfully!')
    return true
    
  } catch (error) {
    console.error('❌ Error creating tables:', error.message)
    console.log('\n📋 Manual Setup Required:')
    console.log('1. Go to your Supabase dashboard')
    console.log('2. Navigate to SQL Editor')
    console.log('3. Copy and paste the SQL from the migration files')
    console.log('4. Execute the SQL to create tables')
    return false
  }
}

createTables()
  .then(success => {
    if (success) {
      console.log('\n🎉 Database setup complete!')
      console.log('You can now run: node seed-all-data.js')
    }
    process.exit(success ? 0 : 1)
  })
  .catch(err => {
    console.error('❌ Setup failed:', err)
    process.exit(1)
  })
