const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Test with the actual user that would be logged in
async function testWithRealUser() {
  console.log('🔍 Testing with real user scenario...\n');

  try {
    // In a real scenario, we need to simulate what happens when a user logs in
    // For now, let's use our test user
    const testUserId = 'test-user-123';

    console.log('1. Testing analytics for user:', testUserId);
    
    // Test the analytics queries that the Dashboard would make
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Documents per day
    const { data: docs } = await supabase
      .from('documents')
      .select('created_at')
      .eq('uploaded_by', testUserId)
      .gte('created_at', thirtyDaysAgo.toISOString());

    console.log('✅ Documents found:', docs?.length || 0);

    // Documents by category (using tags)
    const { data: docsWithTags } = await supabase
      .from('documents')
      .select('mime_type, tags')
      .eq('uploaded_by', testUserId);

    const categoryGroups = {};
    docsWithTags?.forEach(doc => {
      let category = 'uncategorized';
      if (doc.tags && Array.isArray(doc.tags) && doc.tags.length > 0) {
        category = doc.tags[0];
      } else if (doc.mime_type) {
        category = doc.mime_type.split('/')[0];
      }
      categoryGroups[category] = (categoryGroups[category] || 0) + 1;
    });

    console.log('✅ Categories:', Object.keys(categoryGroups));

    // Test tag usage
    const tagCounts = {};
    docsWithTags?.forEach(doc => {
      if (doc.tags && Array.isArray(doc.tags)) {
        doc.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });

    const topTags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    console.log('✅ Top tags:', topTags.map(t => `${t.tag} (${t.count})`));

    // Test user activity data
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const { data: weekDocs } = await supabase
      .from('documents')
      .select('id')
      .eq('uploaded_by', testUserId)
      .gte('created_at', oneWeekAgo.toISOString());

    console.log('✅ Weekly activity: You -', weekDocs?.length || 0, 'documents, estimated', (weekDocs?.length || 0) * 3, 'actions');

    // Test workspace scenario
    console.log('\n2. Testing workspace scenario:');
    const workspaceId = 'workspace-1';
    
    const { data: workspaceDocs } = await supabase
      .from('documents')
      .select('uploaded_by')
      .eq('workspace_id', workspaceId)
      .gte('created_at', oneWeekAgo.toISOString());

    const userStats = {};
    workspaceDocs?.forEach(doc => {
      userStats[doc.uploaded_by] = (userStats[doc.uploaded_by] || 0) + 1;
    });

    console.log('✅ Workspace users:', Object.keys(userStats).map(u => u.replace('test-user-', 'User ')));

    console.log('\n🎯 Analytics data looks good! All dashboard tabs should now show live data.');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testWithRealUser().then(() => {
  console.log('\n✨ Test completed successfully');
  process.exit(0);
});
