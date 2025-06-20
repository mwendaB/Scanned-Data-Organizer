const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function checkDataDetails() {
  console.log('🔍 Detailed Database Data Check...\n')

  // Check each table for actual data
  const tables = [
    'documents',
    'parsed_data', 
    'compliance_frameworks',
    'compliance_checks',
    'workflows',
    'workflow_instances',
    'workflow_steps',
    'review_comments',
    'risk_assessments',
    'financial_extractions',
    'audit_trail',
    'workspaces',
    'workspace_collaborations'
  ]

  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
        .limit(3)

      if (error) {
        console.log(`❌ ${table}: Error - ${error.message}`)
      } else {
        console.log(`✅ ${table}: ${count || 0} rows`)
        if (data && data.length > 0) {
          console.log(`   📝 Sample: ${JSON.stringify(data[0], null, 2).substring(0, 200)}...`)
        }
        console.log('')
      }
    } catch (err) {
      console.log(`❌ ${table}: Exception - ${err.message}`)
    }
  }

  // Test specific queries for the dashboard
  console.log('\n🧪 Testing Dashboard Queries...\n')

  // Test compliance data
  try {
    const frameworks = await supabase
      .from('compliance_frameworks')
      .select('*')
      .eq('is_active', true)

    console.log(`📋 Active Compliance Frameworks: ${frameworks.data?.length || 0}`)
    
    if (frameworks.data && frameworks.data.length > 0) {
      console.log('   Frameworks:', frameworks.data.map(f => f.name).join(', '))
    }
  } catch (err) {
    console.log('❌ Compliance frameworks test failed:', err.message)
  }

  // Test workflow data
  try {
    const workflows = await supabase
      .from('workflow_instances')
      .select('*')
      
    console.log(`🔄 Workflow Instances: ${workflows.data?.length || 0}`)
  } catch (err) {
    console.log('❌ Workflow instances test failed:', err.message)
  }

  // Test document data
  try {
    const docs = await supabase
      .from('documents')
      .select('*')
      
    console.log(`📄 Documents: ${docs.data?.length || 0}`)
    if (docs.data && docs.data.length > 0) {
      console.log('   Files:', docs.data.map(d => d.filename).join(', '))
    }
  } catch (err) {
    console.log('❌ Documents test failed:', err.message)
  }

  console.log('\n✅ Database check complete!')
}

checkDataDetails()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Check failed:', err)
    process.exit(1)
  })
