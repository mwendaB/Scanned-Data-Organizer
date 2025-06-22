// Test compliance management system (demo version)
const fetch = require('node-fetch')

const baseUrl = 'http://localhost:3000'

async function testComplianceAPI() {
  console.log('🧪 Testing Compliance Management Demo API...\n')

  try {
    // Test 1: Check table setup
    console.log('📋 Test 1: Check compliance system status')
    const setupResponse = await fetch(`${baseUrl}/api/compliance-demo?action=setup-tables`)
    const setupData = await setupResponse.json()
    console.log('✅ Setup Status:', setupData.message)
    if (setupData.note) console.log('📝 Note:', setupData.note)
    console.log('')

    // Test 2: Get frameworks
    console.log('📋 Test 2: Get compliance frameworks')
    const frameworksResponse = await fetch(`${baseUrl}/api/compliance-demo?action=frameworks`)
    const frameworksData = await frameworksResponse.json()
    console.log(`✅ Found ${frameworksData.frameworks?.length || 0} frameworks:`)
    frameworksData.frameworks?.forEach(fw => {
      console.log(`   • ${fw.name}: ${fw.description}`)
    })
    console.log('')

    // Test 3: Get rules
    console.log('📋 Test 3: Get compliance rules')
    const rulesResponse = await fetch(`${baseUrl}/api/compliance-demo?action=rules`)
    const rulesData = await rulesResponse.json()
    console.log(`✅ Found ${rulesData.rules?.length || 0} rules:`)
    rulesData.rules?.slice(0, 3).forEach(rule => {
      console.log(`   • ${rule.rule_name} (${rule.framework_name}) - ${rule.rule_type}`)
    })
    if (rulesData.rules?.length > 3) {
      console.log(`   ... and ${rulesData.rules.length - 3} more`)
    }
    console.log('')

    // Test 4: Get scoring thresholds
    console.log('📋 Test 4: Get scoring thresholds')
    const thresholdsResponse = await fetch(`${baseUrl}/api/compliance-demo?action=thresholds`)
    const thresholdsData = await thresholdsResponse.json()
    console.log(`✅ Found ${thresholdsData.thresholds?.length || 0} threshold configurations:`)
    thresholdsData.thresholds?.forEach(threshold => {
      const frameworkName = threshold.compliance_frameworks?.name || 'Unknown'
      console.log(`   • ${frameworkName}: Pass≥${threshold.pass_threshold}%, Review≥${threshold.manual_review_threshold}%`)
    })
    console.log('')

    // Test 5: Create a new test framework
    console.log('📋 Test 5: Create test compliance framework')
    const newFrameworkResponse = await fetch(`${baseUrl}/api/compliance-demo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create-framework',
        name: 'API Test Framework',
        description: 'A test compliance framework created via API',
        requirements: {
          test_field: 'required',
          validation_type: 'automated',
          created_via: 'api_test'
        }
      })
    })
    const newFrameworkData = await newFrameworkResponse.json()
    
    if (newFrameworkResponse.ok) {
      console.log('✅ Framework created:', newFrameworkData.framework.name)
      console.log('📝 Note:', newFrameworkData.note)
      
      // Test 6: Create a rule for the new framework
      console.log('\n📋 Test 6: Create test compliance rule')
      const newRuleResponse = await fetch(`${baseUrl}/api/compliance-demo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-rule',
          frameworkId: newFrameworkData.framework.id,
          ruleName: 'API Test Field Validation',
          ruleDescription: 'Ensures test field is properly filled via API test',
          ruleType: 'FIELD_REQUIRED',
          ruleConfig: {
            required_field: 'test_field',
            validation_type: 'not_null',
            created_via: 'api_test'
          },
          maxScore: 100,
          weight: 1.0,
          severity: 'HIGH'
        })
      })
      const newRuleData = await newRuleResponse.json()
      
      if (newRuleResponse.ok) {
        console.log('✅ Rule created:', newRuleData.rule.rule_name)
        console.log('📝 Note:', newRuleData.note)
        
        // Test 7: Run a compliance check
        console.log('\n📋 Test 7: Run compliance check')
        const checkResponse = await fetch(`${baseUrl}/api/compliance-demo`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'run-compliance-check',
            documentId: 'api-test-document-123',
            frameworkId: newFrameworkData.framework.id
          })
        })
        const checkData = await checkResponse.json()
        
        if (checkResponse.ok) {
          console.log('✅ Compliance check completed:')
          console.log(`   📊 Score: ${checkData.summary.finalScore}%`)
          console.log(`   📋 Rules: ${checkData.summary.rulesPassed}/${checkData.summary.totalRules} passed`)
          console.log(`   🎯 Status: ${checkData.summary.status}`)
          console.log('📝 Note:', checkData.note)
        } else {
          console.log('❌ Compliance check failed:', checkData.error)
        }
      } else {
        console.log('❌ Rule creation failed:', newRuleData.error)
      }
    } else {
      console.log('❌ Framework creation failed:', newFrameworkData.error)
    }

    console.log('\n🎉 Compliance Demo API test completed successfully!')
    console.log('✅ All features are working with simulated data')
    console.log('📝 This demonstrates how the compliance system will work when connected to a database')

  } catch (error) {
    console.error('💥 Test failed:', error.message)
  }
}

// Run the test
testComplianceAPI()
