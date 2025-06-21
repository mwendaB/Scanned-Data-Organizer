const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkUserIds() {
  console.log('🔍 Checking what user IDs exist in our data...\n');
  
  try {
    // Check documents
    const { data: docs, error: docsError } = await supabase
      .from('documents')
      .select('uploaded_by')
      .limit(5);
    
    if (docsError) {
      console.error('Documents error:', docsError);
    } else {
      const uniqueUploaders = [...new Set(docs?.map(d => d.uploaded_by) || [])];
      console.log('📄 Document uploaded_by:', uniqueUploaders);
    }

    // Check workspaces  
    const { data: workspaces, error: workspacesError } = await supabase
      .from('workspaces')
      .select('created_by')
      .limit(3);
    
    if (workspacesError) {
      console.error('Workspaces error:', workspacesError);
    } else {
      const uniqueCreators = [...new Set(workspaces?.map(w => w.created_by) || [])];
      console.log('🏢 Workspace created_by:', uniqueCreators);
    }

    // Check collaborations
    const { data: collabs, error: collabsError } = await supabase
      .from('workspace_collaborations')
      .select('user_id')
      .limit(5);
    
    if (collabsError) {
      console.error('Collaborations error:', collabsError);
    } else {
      const uniqueCollaborators = [...new Set(collabs?.map(c => c.user_id) || [])];
      console.log('👥 Collaboration user_id:', uniqueCollaborators);
    }

    // Check if there are any real auth users
    console.log('\n💡 The Dashboard shows (0) because it filters by the logged-in user ID.');
    console.log('💡 Our test data uses "test-user-123" but real users get UUIDs like "a1b2c3d4-..."');
    console.log('\n🎯 Solution: We need to either:');
    console.log('   1. Sign up and update test data to your real user ID, OR');
    console.log('   2. Create documents by uploading through the app');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkUserIds().then(() => {
  console.log('\n✅ User ID check complete');
  process.exit(0);
});
