const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function debugDataFetching() {
  console.log('🔍 Debugging data fetching issues...\n');

  try {
    // 1. Check what user_id and workspace_id values exist in our data
    console.log('👤 Checking user_id values in documents...');
    const { data: docs } = await supabase
      .from('documents')
      .select('id, filename, uploaded_by, workspace_id')
      .limit(5);
    
    docs?.forEach(doc => {
      console.log(`   - ${doc.filename}: uploaded_by=${doc.uploaded_by}, workspace_id=${doc.workspace_id}`);
    });

    console.log('\n📊 Checking user_id values in parsed_data...');
    const { data: parsed } = await supabase
      .from('parsed_data')
      .select('id, document_id, user_id')
      .limit(5);
    
    parsed?.forEach(p => {
      console.log(`   - ${p.id}: user_id=${p.user_id}, document_id=${p.document_id}`);
    });

    // 2. Test analytics queries with different filters
    console.log('\n📈 Testing analytics queries...');
    
    // Test without filters (should return all data)
    console.log('   Testing documents query without filters...');
    const { data: allDocs, error: allDocsError } = await supabase
      .from('documents')
      .select('created_at, file_size')
      .order('created_at', { ascending: false });
    
    if (allDocsError) {
      console.error('     Error:', allDocsError);
    } else {
      console.log(`     ✅ Found ${allDocs?.length || 0} documents total`);
    }

    // Test with specific user_id that might exist
    console.log('   Testing with user_id filter...');
    const { data: userDocs, error: userDocsError } = await supabase
      .from('documents')
      .select('created_at, file_size')
      .eq('uploaded_by', 'test-user-123')
      .order('created_at', { ascending: false });
    
    if (userDocsError) {
      console.error('     Error:', userDocsError);
    } else {
      console.log(`     ✅ Found ${userDocs?.length || 0} documents for test-user-123`);
    }

    // Test with workspace filter
    console.log('   Testing with workspace_id filter...');
    const { data: workspaceDocs, error: workspaceDocsError } = await supabase
      .from('documents')
      .select('created_at, file_size')
      .eq('workspace_id', 'workspace-1')
      .order('created_at', { ascending: false });
    
    if (workspaceDocsError) {
      console.error('     Error:', workspaceDocsError);
    } else {
      console.log(`     ✅ Found ${workspaceDocs?.length || 0} documents for workspace-1`);
    }

    // 3. Test other table queries
    console.log('\n🔄 Testing workflow queries...');
    const { data: workflows, error: workflowError } = await supabase
      .from('workflow_instances')
      .select('*')
      .limit(3);
    
    if (workflowError) {
      console.error('     Error:', workflowError);
    } else {
      console.log(`     ✅ Found ${workflows?.length || 0} workflow instances`);
    }

    console.log('\n💰 Testing financial extractions...');
    const { data: financials, error: financialError } = await supabase
      .from('financial_extractions')
      .select('*')
      .limit(3);
    
    if (financialError) {
      console.error('     Error:', financialError);
    } else {
      console.log(`     ✅ Found ${financials?.length || 0} financial extractions`);
    }

    console.log('\n⚠️  Testing risk assessments...');
    const { data: risks, error: riskError } = await supabase
      .from('risk_assessments')
      .select('*')
      .limit(3);
    
    if (riskError) {
      console.error('     Error:', riskError);
    } else {
      console.log(`     ✅ Found ${risks?.length || 0} risk assessments`);
    }

  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

debugDataFetching();
