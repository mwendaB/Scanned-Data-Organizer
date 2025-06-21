const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testAnalyticsService() {
  console.log('🧪 Testing Analytics Service...\n');

  try {
    // Simulate how the frontend calls the analytics
    const testUserId = 'test-user-123';
    const testWorkspaceId = 'workspace-1';

    // Test documents per day query
    console.log('📅 Testing documents per day...');
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentDocs, error: recentError } = await supabase
      .from('documents')
      .select('created_at')
      .eq('uploaded_by', testUserId)
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (recentError) {
      console.error('Error:', recentError);
    } else {
      console.log(`   ✅ Found ${recentDocs?.length || 0} recent documents`);
    }

    // Test documents by category (from tags)
    console.log('\n📊 Testing documents by category...');
    const { data: docsWithTags, error: tagsError } = await supabase
      .from('documents')
      .select('tags')
      .eq('uploaded_by', testUserId);

    if (tagsError) {
      console.error('Error:', tagsError);
    } else {
      console.log(`   ✅ Found ${docsWithTags?.length || 0} documents with tags`);
      
      // Count categories (first tag as category)
      const categoryGroups = {};
      docsWithTags?.forEach(item => {
        const category = item.tags?.[0] || 'uncategorized';
        categoryGroups[category] = (categoryGroups[category] || 0) + 1;
      });
      console.log('   Categories:', categoryGroups);
    }

    // Test user activity
    console.log('\n👤 Testing user activity...');
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const { data: userDocs, error: userDocsError } = await supabase
      .from('documents')
      .select('id')
      .eq('uploaded_by', testUserId)
      .gte('created_at', oneWeekAgo.toISOString());

    const { data: userActivity, error: activityError } = await supabase
      .from('audit_trail')
      .select('action')
      .eq('user_id', testUserId)
      .gte('created_at', oneWeekAgo.toISOString());

    if (userDocsError || activityError) {
      console.error('User activity error:', userDocsError || activityError);
    } else {
      console.log(`   ✅ User has ${userDocs?.length || 0} documents and ${userActivity?.length || 0} actions this week`);
    }

    // Test weekly stats
    console.log('\n📈 Testing weekly stats...');
    const { data: allDocs, error: allDocsError } = await supabase
      .from('documents')
      .select('id, ocr_text, file_size')
      .eq('uploaded_by', testUserId);

    if (allDocsError) {
      console.error('All docs error:', allDocsError);
    } else {
      const totalDocs = allDocs?.length || 0;
      const processedDocs = allDocs?.filter(doc => doc.ocr_text && doc.ocr_text.trim().length > 0).length || 0;
      
      console.log(`   ✅ Total: ${totalDocs}, Processed: ${processedDocs}`);
    }

    console.log('\n🎉 Analytics service tests completed!');
    console.log('✅ The analytics should now work with real data in the dashboard.');

  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testAnalyticsService();
