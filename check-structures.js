const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkTableStructures() {
  console.log('🔍 Checking table structures...\n');

  try {
    // Check parsed_data structure
    console.log('📊 Checking parsed_data table...');
    const { data: parsed, error: parsedError } = await supabase
      .from('parsed_data')
      .select('*')
      .limit(1);
    
    if (parsedError) {
      console.error('Parsed data error:', parsedError);
    } else {
      console.log('Sample parsed_data record:');
      console.log(JSON.stringify(parsed?.[0], null, 2));
    }

    // Check documents structure
    console.log('\n📄 Checking documents table...');
    const { data: docs, error: docsError } = await supabase
      .from('documents')
      .select('*')
      .limit(1);
    
    if (docsError) {
      console.error('Documents error:', docsError);
    } else {
      console.log('Sample document record:');
      console.log(JSON.stringify(docs?.[0], null, 2));
    }

    // Test analytics-style queries
    console.log('\n📈 Testing analytics-style queries...');
    
    // Query 1: Documents per day
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: recentDocs, error: recentError } = await supabase
      .from('documents')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo.toISOString());
    
    if (recentError) {
      console.error('Recent docs error:', recentError);
    } else {
      console.log(`✅ Found ${recentDocs?.length || 0} documents in last 30 days`);
    }

    // Query 2: Documents by tags (simulating category)
    const { data: docsWithTags, error: tagsError } = await supabase
      .from('documents')
      .select('tags');
    
    if (tagsError) {
      console.error('Tags error:', tagsError);
    } else {
      console.log(`✅ Found ${docsWithTags?.length || 0} documents with tags`);
      const allTags = docsWithTags?.flatMap(doc => doc.tags || []);
      const tagCounts = allTags?.reduce((acc, tag) => {
        acc[tag] = (acc[tag] || 0) + 1;
        return acc;
      }, {});
      console.log('Tag counts:', tagCounts);
    }

    // Query 3: Workflow instances
    const { data: workflows, error: workflowError } = await supabase
      .from('workflow_instances')
      .select('status, created_at');
    
    if (workflowError) {
      console.error('Workflow error:', workflowError);
    } else {
      console.log(`✅ Found ${workflows?.length || 0} workflow instances`);
      const statusCounts = workflows?.reduce((acc, wf) => {
        acc[wf.status] = (acc[wf.status] || 0) + 1;
        return acc;
      }, {});
      console.log('Status counts:', statusCounts);
    }

  } catch (error) {
    console.error('❌ Structure check error:', error);
  }
}

checkTableStructures();
