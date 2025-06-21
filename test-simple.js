const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testAndFixSimple() {
  console.log('🔧 Simple test and fix...\n');

  try {
    // First, let's just count what we have
    const { data: docs, error: docError } = await supabase
      .from('documents')
      .select('id, filename');
    
    if (docError) {
      console.error('Document error:', docError);
      return;
    }
    
    console.log(`📄 Found ${docs?.length || 0} documents`);
    docs?.forEach(doc => console.log(`   - ${doc.filename} (${doc.id})`));

    const { data: workspaces, error: wsError } = await supabase
      .from('workspaces')
      .select('id, name');
    
    if (wsError) {
      console.error('Workspace error:', wsError);
      return;
    }
    
    console.log(`\n🏢 Found ${workspaces?.length || 0} workspaces`);
    workspaces?.forEach(ws => console.log(`   - ${ws.name} (${ws.id})`));

    // Test a simple join to see what's happening
    const { data: testJoin, error: joinError } = await supabase
      .from('documents')
      .select(`
        id,
        filename,
        workspace_id,
        workspaces (
          id,
          name
        )
      `)
      .limit(3);
    
    if (joinError) {
      console.error('Join error:', joinError);
    } else {
      console.log('\n🔗 Test join results:');
      testJoin?.forEach(item => {
        console.log(`   - ${item.filename} -> workspace: ${JSON.stringify(item.workspaces)}`);
      });
    }

    // Check workflow instances
    const { data: workflows, error: wfError } = await supabase
      .from('workflow_instances')
      .select('id, status, document_id');
    
    if (wfError) {
      console.error('Workflow error:', wfError);
    } else {
      console.log(`\n🔄 Found ${workflows?.length || 0} workflow instances`);
      workflows?.forEach(wf => console.log(`   - ${wf.id} (${wf.status}) for doc: ${wf.document_id}`));
    }

  } catch (error) {
    console.error('❌ Error in test:', error);
  }
}

testAndFixSimple();
