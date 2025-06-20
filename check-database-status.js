const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function checkDatabaseStatus() {
  console.log('🔍 Checking Database Status...\n')

  try {
    // Check basic tables
    const basicTables = ['documents', 'parsed_data']
    console.log('📋 Basic Tables:')
    for (const table of basicTables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
        
        if (error) {
          console.log(`   ❌ ${table}: ${error.message}`)
        } else {
          console.log(`   ✅ ${table}: ${count} rows`)
        }
      } catch (err) {
        console.log(`   ❌ ${table}: ${err.message}`)
      }
    }

    // Check advanced auditing tables
    const auditingTables = [
      'audit_trail', 
      'risk_assessments', 
      'workflows', 
      'workflow_instances',
      'workflow_steps',
      'review_comments',
      'financial_extractions',
      'compliance_checks',
      'compliance_frameworks'
    ]
    
    console.log('\n🔍 Advanced Auditing Tables:')
    let hasAuditingTables = 0
    
    for (const table of auditingTables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
        
        if (error) {
          console.log(`   ❌ ${table}: ${error.message}`)
        } else {
          console.log(`   ✅ ${table}: ${count} rows`)
          hasAuditingTables++
        }
      } catch (err) {
        console.log(`   ❌ ${table}: Table does not exist`)
      }
    }

    console.log(`\n📊 Summary:`)
    console.log(`   - Advanced auditing tables: ${hasAuditingTables}/${auditingTables.length}`)
    
    if (hasAuditingTables === 0) {
      console.log(`\n⚠️  No advanced auditing tables found!`)
      console.log(`   📝 Run this migration in Supabase SQL Editor:`)
      console.log(`   📁 /supabase/migrations/003_auditing_features.sql`)
      console.log(`\n🔄 Current dashboard status:`)
      console.log(`   📊 Risk Management: Using MOCK data (no tables)`)
      console.log(`   🔄 Workflow Management: Using MOCK data (no tables)`)
      console.log(`   📋 Compliance Dashboard: Using STATIC data (hardcoded values)`)
    } else if (hasAuditingTables < auditingTables.length) {
      console.log(`\n⚠️  Partial migration detected!`)
      console.log(`   📝 Complete the migration by running:`)
      console.log(`   📁 /supabase/migrations/003_auditing_features.sql`)
    } else {
      console.log(`\n✅ All advanced auditing tables available!`)
      console.log(`   📊 Risk Management: Can use LIVE data`)
      console.log(`   🔄 Workflow Management: Can use LIVE data`)
      console.log(`   📋 Compliance Dashboard: Can use LIVE data`)
    }

  } catch (error) {
    console.error('❌ Database check failed:', error.message)
  }
}

checkDatabaseStatus()
