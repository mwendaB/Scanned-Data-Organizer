const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function inspectDataStructure() {
  console.log('🔍 Inspecting actual data structure...\n');

  try {
    // Check actual document structure
    const { data: docs } = await supabase
      .from('documents')
      .select('*')
      .limit(2);
    
    console.log('📄 Sample Document Structure:');
    console.log(JSON.stringify(docs?.[0], null, 2));

    // Check workspaces
    const { data: workspaces } = await supabase
      .from('workspaces')
      .select('*')
      .limit(1);
    
    console.log('\n🏢 Sample Workspace Structure:');
    console.log(JSON.stringify(workspaces?.[0], null, 2));

    // Check workflow instances
    const { data: workflows } = await supabase
      .from('workflow_instances')
      .select('*')
      .limit(1);
    
    console.log('\n🔄 Sample Workflow Instance Structure:');
    console.log(JSON.stringify(workflows?.[0], null, 2));

    // Check compliance checks
    const { data: compliance } = await supabase
      .from('compliance_checks')
      .select('*')
      .limit(1);
    
    console.log('\n📋 Sample Compliance Check Structure:');
    console.log(JSON.stringify(compliance?.[0], null, 2));

    // Check financial extractions
    const { data: financials } = await supabase
      .from('financial_extractions')
      .select('*')
      .limit(1);
    
    console.log('\n💰 Sample Financial Extraction Structure:');
    console.log(JSON.stringify(financials?.[0], null, 2));

    // Test joins that might be failing
    console.log('\n🔗 Testing Joins:');
    
    const { data: docsWithWorkspaces } = await supabase
      .from('documents')
      .select('id, filename, workspace_id, workspaces(name)')
      .limit(3);
    
    console.log('Documents with Workspaces:');
    docsWithWorkspaces?.forEach(doc => {
      console.log(`   - ${doc.filename} in workspace: ${doc.workspaces?.name || 'NOT FOUND'}`);
    });

    const { data: workflowsWithDocs } = await supabase
      .from('workflow_instances')
      .select('id, status, document_id, documents(filename)')
      .limit(3);
    
    console.log('\nWorkflow Instances with Documents:');
    workflowsWithDocs?.forEach(wf => {
      console.log(`   - ${wf.id} (${wf.status}) for doc: ${wf.documents?.filename || 'NOT FOUND'}`);
    });

  } catch (error) {
    console.error('❌ Error inspecting data:', error);
  }
}

inspectDataStructure();
