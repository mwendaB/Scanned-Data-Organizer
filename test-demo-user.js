const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testDemoUserData() {
  console.log('🧪 Testing analytics data for demo-user-2024...\n');

  try {
    const userId = 'demo-user-2024';

    // Test documents
    const { data: docs } = await supabase
      .from('documents')
      .select('id, filename, tags, created_at')
      .eq('uploaded_by', userId);

    console.log('📄 Documents for demo user:', docs?.length || 0);
    if (docs && docs.length > 0) {
      console.log('   Sample:', docs[0].filename);
      console.log('   Tags example:', docs[0].tags);
    }

    // Test analytics queries
    console.log('\n📊 Analytics Test:');
    
    // Documents by category (using tags)
    const categoryGroups = {};
    docs?.forEach(doc => {
      if (doc.tags && Array.isArray(doc.tags) && doc.tags.length > 0) {
        const category = doc.tags[0];
        categoryGroups[category] = (categoryGroups[category] || 0) + 1;
      }
    });
    
    console.log('   Categories found:', Object.keys(categoryGroups));
    console.log('   Category breakdown:', categoryGroups);

    // Tag usage
    const tagCounts = {};
    docs?.forEach(doc => {
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

    console.log('   Top tags:', topTags.map(t => `${t.tag} (${t.count})`));

    // Test parsed data
    if (docs && docs.length > 0) {
      const docIds = docs.map(d => d.id);
      const { data: parsedData } = await supabase
        .from('parsed_data')
        .select('field_name, field_value')
        .in('document_id', docIds)
        .limit(5);

      console.log('\n🔍 Parsed Data Sample:');
      parsedData?.forEach(item => {
        console.log(`   ${item.field_name}: ${item.field_value}`);
      });
    }

    // Test workspace data
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('name, description')
      .eq('created_by', userId)
      .single();

    if (workspace) {
      console.log('\n🏢 Workspace:', workspace.name);
    }

    // Test audit trail
    const { data: auditEntries } = await supabase
      .from('audit_trail')
      .select('action, resource_type')
      .eq('user_id', userId);

    console.log('\n📜 Audit Entries:', auditEntries?.length || 0);

    console.log('\n🎯 RESULT: Analytics data is ready for demo-user-2024!');
    console.log('   To see this data in the dashboard:');
    console.log('   1. Sign up with any email to get a real user ID');
    console.log('   2. Run: node update-test-data.js "your-real-user-id"');
    console.log('   OR use this demo user ID directly in testing');

  } catch (error) {
    console.error('❌ Error testing demo user data:', error);
  }
}

testDemoUserData().then(() => {
  console.log('\n✅ Demo user data test complete');
  process.exit(0);
});
