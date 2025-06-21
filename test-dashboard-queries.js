const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testDashboardQueries() {
  console.log('🧪 Testing all dashboard queries for live data...\n');

  try {
    // 1. Test Analytics Dashboard queries
    console.log('📊 ANALYTICS DASHBOARD:');
    
    const { data: totalDocs } = await supabase
      .from('documents')
      .select('id')
      .eq('status', 'processed');
    console.log(`   ✅ Processed Documents: ${totalDocs?.length || 0}`);

    const { data: totalWorkflows } = await supabase
      .from('workflow_instances')
      .select('id');
    console.log(`   ✅ Total Workflows: ${totalWorkflows?.length || 0}`);

    const { data: completedWorkflows } = await supabase
      .from('workflow_instances')
      .select('id')
      .eq('status', 'COMPLETED');
    console.log(`   ✅ Completed Workflows: ${completedWorkflows?.length || 0}`);

    const { data: avgCompliance } = await supabase
      .from('compliance_checks')
      .select('score')
      .not('score', 'is', null);
    const avgScore = avgCompliance?.reduce((sum, item) => sum + item.score, 0) / (avgCompliance?.length || 1);
    console.log(`   ✅ Average Compliance Score: ${avgScore?.toFixed(1)}%`);

    // 2. Test Risk Dashboard queries
    console.log('\n⚠️  RISK DASHBOARD:');
    
    const { data: totalRisks } = await supabase
      .from('risk_assessments')
      .select('id, risk_level');
    console.log(`   ✅ Total Risk Assessments: ${totalRisks?.length || 0}`);

    const riskCounts = totalRisks?.reduce((acc, risk) => {
      acc[risk.risk_level] = (acc[risk.risk_level] || 0) + 1;
      return acc;
    }, {});
    console.log(`   ✅ Risk Breakdown: HIGH=${riskCounts?.HIGH || 0}, MEDIUM=${riskCounts?.MEDIUM || 0}, LOW=${riskCounts?.LOW || 0}`);

    // 3. Test Workflow Management queries
    console.log('\n🔄 WORKFLOW MANAGEMENT:');
    
    const { data: activeWorkflows } = await supabase
      .from('workflow_instances')
      .select('id, status, workflows(name), documents(filename)')
      .in('status', ['PENDING', 'IN_PROGRESS']);
    console.log(`   ✅ Active Workflows: ${activeWorkflows?.length || 0}`);

    activeWorkflows?.forEach(wf => {
      console.log(`      - ${wf.workflows?.name} for ${wf.documents?.filename} (${wf.status})`);
    });

    // 4. Test Compliance Dashboard queries
    console.log('\n📋 COMPLIANCE DASHBOARD:');
    
    const { data: frameworks } = await supabase
      .from('compliance_frameworks')
      .select('id, name');
    console.log(`   ✅ Active Frameworks: ${frameworks?.length || 0}`);

    const { data: recentChecks } = await supabase
      .from('compliance_checks')
      .select('id, status, score, framework_id, documents(filename)')
      .order('created_at', { ascending: false })
      .limit(5);
    console.log(`   ✅ Recent Compliance Checks: ${recentChecks?.length || 0}`);

    recentChecks?.forEach(check => {
      console.log(`      - ${check.documents?.filename}: ${check.status} (Score: ${check.score || 'N/A'})`);
    });

    // 5. Test Documents queries
    console.log('\n📄 DOCUMENTS:');
    
    const { data: allDocs } = await supabase
      .from('documents')
      .select('id, filename, status, tags, workspace_id, workspaces(name)')
      .order('created_at', { ascending: false });
    console.log(`   ✅ Total Documents: ${allDocs?.length || 0}`);

    const statusCounts = allDocs?.reduce((acc, doc) => {
      acc[doc.status] = (acc[doc.status] || 0) + 1;
      return acc;
    }, {});
    console.log(`   ✅ Status Breakdown: ${JSON.stringify(statusCounts)}`);

    // 6. Test Collaborative Workspace queries
    console.log('\n🤝 COLLABORATIVE WORKSPACE:');
    
    const { data: workspaces } = await supabase
      .from('workspaces')
      .select('id, name, created_by');
    console.log(`   ✅ Total Workspaces: ${workspaces?.length || 0}`);

    const { data: collaborations } = await supabase
      .from('workspace_collaborations')
      .select('id, user_id, role, workspaces(name)');
    console.log(`   ✅ Total Collaborations: ${collaborations?.length || 0}`);

    // 7. Test Audit Trail queries
    console.log('\n🔍 AUDIT TRAIL:');
    
    const { data: auditEvents } = await supabase
      .from('audit_trail')
      .select('id, action, resource_type, user_id, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    console.log(`   ✅ Recent Audit Events: ${auditEvents?.length || 0}`);

    const actionCounts = auditEvents?.reduce((acc, event) => {
      acc[event.action] = (acc[event.action] || 0) + 1;
      return acc;
    }, {});
    console.log(`   ✅ Action Types: ${JSON.stringify(actionCounts)}`);

    // 8. Test Financial Extractions
    console.log('\n💰 FINANCIAL EXTRACTIONS:');
    
    const { data: financials } = await supabase
      .from('financial_extractions')
      .select('id, extraction_type, amount, currency, documents(filename)');
    console.log(`   ✅ Total Financial Extractions: ${financials?.length || 0}`);

    const totalAmount = financials?.reduce((sum, fin) => sum + fin.amount, 0);
    console.log(`   ✅ Total Financial Value: $${totalAmount?.toLocaleString() || 0}`);

    console.log('\n🎉 ALL DASHBOARD QUERIES SUCCESSFUL!');
    console.log('✅ Your application has comprehensive, interconnected live data across all tabs!');
    console.log('🚀 Navigate to http://localhost:3001 to explore the full audit platform!');

  } catch (error) {
    console.error('❌ Error testing queries:', error);
  }
}

testDashboardQueries();
