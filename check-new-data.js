const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkNewData() {
  console.log('🔍 Checking for new comprehensive data...\n');

  try {
    // Check documents
    const { data: documents } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });
    
    console.log(`📄 Documents (${documents?.length || 0}):`);
    documents?.forEach(doc => {
      console.log(`   - ${doc.filename} (${doc.id})`);
    });

    // Check workspaces
    const { data: workspaces } = await supabase
      .from('workspaces')
      .select('*')
      .order('created_at', { ascending: false });
    
    console.log(`\n🏢 Workspaces (${workspaces?.length || 0}):`);
    workspaces?.forEach(ws => {
      console.log(`   - ${ws.name} (${ws.id})`);
    });

    // Check compliance frameworks
    const { data: frameworks } = await supabase
      .from('compliance_frameworks')
      .select('*')
      .order('created_at', { ascending: false });
    
    console.log(`\n📋 Compliance Frameworks (${frameworks?.length || 0}):`);
    frameworks?.forEach(fw => {
      console.log(`   - ${fw.name} (${fw.id})`);
    });

    // Check workflows
    const { data: workflows } = await supabase
      .from('workflows')
      .select('*')
      .order('created_at', { ascending: false });
    
    console.log(`\n🔄 Workflows (${workflows?.length || 0}):`);
    workflows?.forEach(wf => {
      console.log(`   - ${wf.name} (${wf.id})`);
    });

    // Check workflow instances
    const { data: instances } = await supabase
      .from('workflow_instances')
      .select('*, workflows(name), documents(filename)')
      .order('created_at', { ascending: false });
    
    console.log(`\n📋 Workflow Instances (${instances?.length || 0}):`);
    instances?.forEach(inst => {
      console.log(`   - ${inst.workflows?.name} for ${inst.documents?.filename} (Status: ${inst.status})`);
    });

    // Check risk assessments
    const { data: risks } = await supabase
      .from('risk_assessments')
      .select('*, documents(filename)')
      .order('created_at', { ascending: false });
    
    console.log(`\n⚠️  Risk Assessments (${risks?.length || 0}):`);
    risks?.forEach(risk => {
      console.log(`   - ${risk.risk_category} (${risk.risk_level}) for ${risk.documents?.filename}`);
    });

    // Check financial extractions
    const { data: financials } = await supabase
      .from('financial_extractions')
      .select('*, documents(filename)')
      .order('created_at', { ascending: false });
    
    console.log(`\n💰 Financial Extractions (${financials?.length || 0}):`);
    financials?.forEach(fin => {
      console.log(`   - ${fin.extraction_type}: ${fin.currency} ${fin.amount} for ${fin.documents?.filename}`);
    });

    // Check collaborations
    const { data: collabs } = await supabase
      .from('workspace_collaborations')
      .select('*, workspaces(name)')
      .order('created_at', { ascending: false });
    
    console.log(`\n🤝 Workspace Collaborations (${collabs?.length || 0}):`);
    collabs?.forEach(collab => {
      console.log(`   - ${collab.user_id} (${collab.role}) in ${collab.workspaces?.name}`);
    });

    console.log('\n✅ Data check complete!');

  } catch (error) {
    console.error('❌ Error checking data:', error);
  }
}

checkNewData();
