const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Simplified analytics test functions based on the fixed logic
async function testRealAnalytics() {
  console.log('🧪 Testing real analytics queries...\n');

  try {
    const userId = 'test-user-123';
    const workspaceId = 'workspace-1';

    // Test 1: Documents per day
    console.log('1. Testing documents per day:');
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: docs } = await supabase
      .from('documents')
      .select('created_at')
      .eq('uploaded_by', userId)
      .gte('created_at', thirtyDaysAgo.toISOString());
    
    console.log('✅ Found', docs?.length || 0, 'documents in last 30 days');

    // Test 2: Documents by category (using tags)
    console.log('\n2. Testing documents by category:');
    const { data: docsWithTags } = await supabase
      .from('documents')
      .select('mime_type, tags')
      .eq('uploaded_by', userId);
    
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
    
    console.log('✅ Categories found:', Object.keys(categoryGroups).length);
    console.log('Categories:', categoryGroups);

    // Test 3: Tag usage
    console.log('\n3. Testing tag usage:');
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
    
    console.log('✅ Top tags:', topTags);

    // Test 4: User activity
    console.log('\n4. Testing user activity:');
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const { data: weekDocs } = await supabase
      .from('documents')
      .select('id')
      .eq('uploaded_by', userId)
      .gte('created_at', oneWeekAgo.toISOString());
    
    console.log('✅ Documents in last week:', weekDocs?.length || 0);

    // Test 5: Workspace activity
    console.log('\n5. Testing workspace activity:');
    const { data: workspaceDocs } = await supabase
      .from('documents')
      .select('uploaded_by')
      .eq('workspace_id', workspaceId)
      .gte('created_at', oneWeekAgo.toISOString());

    const userStats = {};
    workspaceDocs?.forEach(doc => {
      userStats[doc.uploaded_by] = (userStats[doc.uploaded_by] || 0) + 1;
    });
    
    console.log('✅ Workspace user activity:', userStats);

    // Test 6: Weekly stats
    console.log('\n6. Testing weekly stats:');
    const { data: allDocs } = await supabase
      .from('documents')
      .select('id, ocr_text, file_size')
      .eq('uploaded_by', userId);

    const totalProcessed = allDocs?.filter(doc => doc.ocr_text && doc.ocr_text.trim().length > 0).length || 0;
    const avgFileSize = allDocs && allDocs.length > 0 
      ? allDocs.reduce((sum, doc) => sum + (doc.file_size || 0), 0) / allDocs.length 
      : 0;

    console.log('✅ Weekly stats:');
    console.log('- Total documents:', allDocs?.length || 0);
    console.log('- Processed documents:', totalProcessed);
    console.log('- Average file size:', Math.round(avgFileSize / 1024), 'KB');

  } catch (error) {
    console.error('❌ Error testing analytics:', error);
  }
}

testRealAnalytics().then(() => {
  console.log('\n🎯 Real analytics test completed');
  process.exit(0);
});
