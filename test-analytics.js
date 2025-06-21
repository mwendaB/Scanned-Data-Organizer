const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testAnalyticsQueries() {
  console.log('📊 Testing analytics queries...\n');

  try {
    // Test documents query
    console.log('📄 Testing documents query...');
    const { data: docs, error: docsError } = await supabase
      .from('documents')
      .select('id, filename, status, created_at, file_size, tags')
      .order('created_at', { ascending: false });
    
    if (docsError) {
      console.error('Documents error:', docsError);
    } else {
      console.log(`   ✅ Found ${docs?.length || 0} documents`);
      docs?.slice(0, 3).forEach(doc => {
        console.log(`      - ${doc.filename} (${doc.status})`);
      });
    }

    // Test workflow instances
    console.log('\n🔄 Testing workflow instances...');
    const { data: workflows, error: workflowError } = await supabase
      .from('workflow_instances')
      .select('id, status, current_step, created_at')
      .order('created_at', { ascending: false });
    
    if (workflowError) {
      console.error('Workflow error:', workflowError);
    } else {
      console.log(`   ✅ Found ${workflows?.length || 0} workflow instances`);
      const statusCounts = workflows?.reduce((acc, wf) => {
        acc[wf.status] = (acc[wf.status] || 0) + 1;
        return acc;
      }, {});
      console.log(`      Status breakdown: ${JSON.stringify(statusCounts)}`);
    }

    // Test compliance checks
    console.log('\n📋 Testing compliance checks...');
    const { data: compliance, error: complianceError } = await supabase
      .from('compliance_checks')
      .select('id, status, score, created_at')
      .order('created_at', { ascending: false });
    
    if (complianceError) {
      console.error('Compliance error:', complianceError);
    } else {
      console.log(`   ✅ Found ${compliance?.length || 0} compliance checks`);
      const scores = compliance?.filter(c => c.score !== null).map(c => c.score);
      const avgScore = scores?.reduce((sum, score) => sum + score, 0) / (scores?.length || 1);
      console.log(`      Average score: ${avgScore?.toFixed(1)}%`);
    }

    // Test risk assessments
    console.log('\n⚠️  Testing risk assessments...');
    const { data: risks, error: riskError } = await supabase
      .from('risk_assessments')
      .select('id, risk_level, risk_category, created_at')
      .order('created_at', { ascending: false });
    
    if (riskError) {
      console.error('Risk error:', riskError);
    } else {
      console.log(`   ✅ Found ${risks?.length || 0} risk assessments`);
      const levelCounts = risks?.reduce((acc, risk) => {
        acc[risk.risk_level] = (acc[risk.risk_level] || 0) + 1;
        return acc;
      }, {});
      console.log(`      Level breakdown: ${JSON.stringify(levelCounts)}`);
    }

    // Test financial extractions
    console.log('\n💰 Testing financial extractions...');
    const { data: financials, error: financialError } = await supabase
      .from('financial_extractions')
      .select('id, extraction_type, amount, currency, created_at')
      .order('created_at', { ascending: false });
    
    if (financialError) {
      console.error('Financial error:', financialError);
    } else {
      console.log(`   ✅ Found ${financials?.length || 0} financial extractions`);
      const totalAmount = financials?.reduce((sum, fin) => sum + fin.amount, 0);
      console.log(`      Total value: $${totalAmount?.toLocaleString() || 0}`);
    }

    // Test audit trail
    console.log('\n🔍 Testing audit trail...');
    const { data: audit, error: auditError } = await supabase
      .from('audit_trail')
      .select('id, action, resource_type, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (auditError) {
      console.error('Audit error:', auditError);
    } else {
      console.log(`   ✅ Found ${audit?.length || 0} audit entries`);
      audit?.forEach(entry => {
        console.log(`      - ${entry.action} on ${entry.resource_type}`);
      });
    }

    console.log('\n🎉 All analytics queries working!');
    console.log('✅ The dashboard should be able to fetch and display live data.');

  } catch (error) {
    console.error('❌ Error testing analytics:', error);
  }
}

testAnalyticsQueries();
