const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testAnalyticsQueries() {
  console.log('🔍 Testing analytics queries with actual field names...\n');

  try {
    // Test 1: Documents query with uploaded_by
    console.log('1. Testing documents with uploaded_by field:');
    const { data: docs, error: docsError } = await supabase
      .from('documents')
      .select('id, uploaded_by, tags, created_at, file_size')
      .limit(3);
    
    if (docsError) {
      console.error('Documents error:', docsError);
    } else {
      console.log('✅ Documents sample:', docs);
    }

    // Test 2: Check parsed_data structure
    console.log('\n2. Testing parsed_data structure:');
    const { data: parsedData, error: parsedError } = await supabase
      .from('parsed_data')
      .select('*')
      .limit(1);
    
    if (parsedError) {
      console.error('Parsed data error:', parsedError);
    } else {
      console.log('✅ Parsed data structure:', parsedData[0] ? Object.keys(parsedData[0]) : 'No data');
    }

    // Test 3: Check workspace_members structure  
    console.log('\n3. Testing workspace_members structure:');
    const { data: members, error: membersError } = await supabase
      .from('workspace_members')
      .select('*')
      .limit(1);
    
    if (membersError) {
      console.error('Workspace members error:', membersError);
    } else {
      console.log('✅ Workspace members structure:', members[0] ? Object.keys(members[0]) : 'No data');
    }

    // Test 4: Check activity_log structure
    console.log('\n4. Testing activity_log structure:');
    const { data: activity, error: activityError } = await supabase
      .from('activity_log')
      .select('*')
      .limit(1);
    
    if (activityError) {
      console.error('Activity log error:', activityError);
    } else {
      console.log('✅ Activity log structure:', activity[0] ? Object.keys(activity[0]) : 'No data');
    }

    // Test 5: Get a sample user to test with
    console.log('\n5. Getting sample user for testing:');
    const { data: sampleDoc } = await supabase
      .from('documents')
      .select('uploaded_by')
      .limit(1);
    
    if (sampleDoc && sampleDoc[0]) {
      const sampleUserId = sampleDoc[0].uploaded_by;
      console.log('✅ Sample user ID:', sampleUserId);

      // Test documents by user
      const { data: userDocs, error: userDocsError } = await supabase
        .from('documents')
        .select('id, tags')
        .eq('uploaded_by', sampleUserId);
      
      if (userDocsError) {
        console.error('User documents error:', userDocsError);
      } else {
        console.log('✅ User documents count:', userDocs.length);
        console.log('✅ Sample tags:', userDocs[0]?.tags);
      }
    }

  } catch (error) {
    console.error('❌ Error testing analytics queries:', error);
  }
}

testAnalyticsQueries().then(() => {
  console.log('\n🎯 Analytics query test completed');
  process.exit(0);
});
