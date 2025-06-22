// Test direct database access
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: './.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://blwlzzcrxoxngxoccbij.supabase.co'
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsd2x6emNyeG94bmd4b2NjYmlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDQwMTU3NCwiZXhwIjoyMDY1OTc3NTc0fQ.OWxznhLlJE0L1W8BHLLe3NYtdOuk5WcepOv5S_G9nEE'

const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testDatabase() {
  console.log('🔍 Testing direct database access...')
  
  try {
    // Test 1: Check compliance_frameworks table
    console.log('\n📋 Test 1: Query compliance_frameworks table')
    const { data: frameworks, error: frameworksError } = await supabaseAdmin
      .from('compliance_frameworks')
      .select('*')
      .limit(5)
    
    if (frameworksError) {
      console.log(`❌ Error querying compliance_frameworks: ${frameworksError.message}`)
      console.log('Details:', frameworksError)
    } else {
      console.log(`✅ Found ${frameworks?.length || 0} compliance frameworks:`)
      frameworks?.forEach(fw => {
        console.log(`   • ${fw.name}: ${fw.description}`)
      })
    }

    // Test 2: Try to create a new framework
    console.log('\n📋 Test 2: Create new compliance framework')
    const { data: newFramework, error: createError } = await supabaseAdmin
      .from('compliance_frameworks')
      .insert([{
        name: 'Direct Test Framework',
        description: 'A framework created via direct database access',
        requirements: { test: true },
        is_active: true
      }])
      .select()
      .single()
    
    if (createError) {
      console.log(`❌ Error creating framework: ${createError.message}`)
      console.log('Details:', createError)
    } else {
      console.log(`✅ Created framework: ${newFramework.name} (ID: ${newFramework.id})`)
    }

    // Test 3: List all tables to see what exists
    console.log('\n📋 Test 3: List available tables')
    const { data: tables, error: tablesError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name')
    
    if (tablesError) {
      console.log(`❌ Error listing tables: ${tablesError.message}`)
    } else {
      console.log(`✅ Found ${tables?.length || 0} tables:`)
      tables?.forEach(table => {
        console.log(`   • ${table.table_name}`)
      })
    }

  } catch (error) {
    console.error('💥 Test failed:', error)
  }
}

// Run the test
testDatabase().then(() => {
  console.log('\n✅ Database test complete!')
  process.exit(0)
}).catch(error => {
  console.error('💥 Failed to test database:', error)
  process.exit(1)
})
